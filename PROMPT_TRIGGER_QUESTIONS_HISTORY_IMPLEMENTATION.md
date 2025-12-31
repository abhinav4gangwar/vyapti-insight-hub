# Prompt Trigger Questions History Implementation

Complete implementation guide for adding version tracking and history to prompt trigger questions, similar to the prompts/prompts_history pattern.

## 📋 Overview

This implementation adds:
- **Version tracking** for all question changes
- **Active/Inactive status** for questions
- **Full history audit trail** with reasons for changes
- **Version restoration** capabilities
- **Frontend UI** for managing history

## 🗄️ Database Changes

### New Columns Added to `prompt_trigger_questions`

```sql
-- Versioning
version INTEGER NOT NULL DEFAULT 1

-- Active status
is_active BOOLEAN NOT NULL DEFAULT TRUE

-- Audit fields
created_by VARCHAR(255)  -- User who created
updated_by VARCHAR(255)  -- User who last updated
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

### New Table: `prompt_trigger_questions_history`

```sql
CREATE TABLE prompt_trigger_questions_history (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL REFERENCES prompt_trigger_questions(id) ON DELETE CASCADE,

    -- Snapshot of question data
    question_text TEXT NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    source_shorthand VARCHAR(1) NOT NULL,
    version INTEGER NOT NULL,

    -- Original creation info
    created_at TIMESTAMP NOT NULL,
    created_by VARCHAR(255),

    -- When this version was replaced
    replaced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    replaced_by VARCHAR(255),
    reason TEXT
);

-- Indexes
CREATE INDEX idx_prompt_trigger_questions_history_question_id
    ON prompt_trigger_questions_history(question_id);
CREATE INDEX idx_prompt_trigger_questions_history_version
    ON prompt_trigger_questions_history(version);
CREATE INDEX idx_prompt_trigger_questions_history_replaced_at
    ON prompt_trigger_questions_history(replaced_at);
```

## 🐍 Backend Models (SQLAlchemy)

### Updated `PromptTriggerQuestion` Model

```python
class PromptTriggerQuestion(Base):
    __tablename__ = "prompt_trigger_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    group_name = Column(String(255), nullable=False, index=True)
    source_shorthand = Column(String(1), nullable=False)  # 'A', 'K', or 'E'

    # NEW: Versioning fields
    version = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    # NEW: Audit fields
    created_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    created_by = Column(String(255), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)
    updated_by = Column(String(255), nullable=True)

    # Relationship to history
    history = relationship("PromptTriggerQuestionHistory", back_populates="question", cascade="all, delete-orphan")
```

### New `PromptTriggerQuestionHistory` Model

```python
class PromptTriggerQuestionHistory(Base):
    __tablename__ = "prompt_trigger_questions_history"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("prompt_trigger_questions.id", ondelete="CASCADE"), nullable=False, index=True)

    # Snapshot of question at this version
    question_text = Column(Text, nullable=False)
    group_name = Column(String(255), nullable=False)
    source_shorthand = Column(String(1), nullable=False)
    version = Column(Integer, nullable=False)

    # Original creation info
    created_at = Column(DateTime, nullable=False)
    created_by = Column(String(255), nullable=True)

    # When this version was replaced
    replaced_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    replaced_by = Column(String(255), nullable=True)
    reason = Column(Text, nullable=True)

    # Relationship
    question = relationship("PromptTriggerQuestion", back_populates="history")
```

## 📝 Backend Pydantic Schemas

### Updated Response Schemas

```python
class QuestionResponse(BaseModel):
    id: int
    question_text: str
    group_name: str
    source_shorthand: str
    version: int  # NEW
    is_active: bool  # NEW
    created_at: str
    created_by: Optional[str] = None  # NEW
    updated_at: str  # CHANGED from modified_at
    updated_by: Optional[str] = None  # NEW

    class Config:
        from_attributes = True
```

### New Request Schemas

```python
class UpdateQuestionRequest(BaseModel):
    question_text: Optional[str] = None
    group_name: Optional[str] = None
    source_shorthand: Optional[Literal['A', 'K', 'E']] = None
    reason: Optional[str] = None  # NEW: Track why change was made

class RestoreQuestionRequest(BaseModel):
    history_id: int
    reason: Optional[str] = None

class ToggleActiveRequest(BaseModel):
    is_active: bool
    reason: Optional[str] = None
```

### New History Response Schema

```python
class QuestionHistoryResponse(BaseModel):
    id: int
    question_id: int
    question_text: str
    group_name: str
    source_shorthand: str
    version: int
    created_at: str
    created_by: Optional[str] = None
    replaced_at: str
    replaced_by: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True
```

## 🔌 New Backend API Endpoints

Add these to your `prompt_trigger_questions.py` router:

### 1. Get Question History
```python
@router.get("/questions/{question_id}/history", response_model=List[QuestionHistoryResponse])
async def get_question_history(
    question_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all historical versions of a question."""
    repo = PromptTriggerQuestionRepository()
    history = await repo.get_question_history(session, question_id)

    if not history and not await repo.get_question_by_id(session, question_id):
        raise HTTPException(status_code=404, detail="Question not found")

    return [history_to_response(h) for h in history]
```

### 2. Restore Question Version
```python
@router.post("/questions/{question_id}/restore", response_model=QuestionResponse)
async def restore_question_version(
    question_id: int,
    request: RestoreQuestionRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Restore a question to a previous version."""
    repo = PromptTriggerQuestionRepository()
    user_id = current_user.email if hasattr(current_user, 'email') else str(current_user.id)

    question = await repo.restore_question_version(
        session=session,
        question_id=question_id,
        history_id=request.history_id,
        restored_by=user_id,
        reason=request.reason
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question or history not found")

    return question_to_response(question)
```

### 3. Toggle Active Status
```python
@router.post("/questions/{question_id}/toggle-active", response_model=QuestionResponse)
async def toggle_question_active(
    question_id: int,
    request: ToggleActiveRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Toggle question active/inactive status."""
    repo = PromptTriggerQuestionRepository()
    user_id = current_user.email if hasattr(current_user, 'email') else str(current_user.id)

    question = await repo.toggle_active_status(
        session=session,
        question_id=question_id,
        is_active=request.is_active,
        updated_by=user_id,
        reason=request.reason
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return question_to_response(question)
```

### 4. Update Existing PUT Endpoint

```python
@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    request: UpdateQuestionRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update question (creates history entry automatically)."""
    repo = PromptTriggerQuestionRepository()
    user_id = current_user.email if hasattr(current_user, 'email') else str(current_user.id)

    # Use new history-tracking method
    question = await repo.update_question_with_history(
        session=session,
        question_id=question_id,
        updated_by=user_id,
        question_text=request.question_text,
        group_name=request.group_name,
        source_shorthand=request.source_shorthand,
        reason=request.reason  # NEW
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return question_to_response(question)
```

## 💾 Key Repository Methods

### Update with History Tracking

```python
async def update_question_with_history(
    self,
    session: AsyncSession,
    question_id: int,
    updated_by: str,
    question_text: Optional[str] = None,
    group_name: Optional[str] = None,
    source_shorthand: Optional[str] = None,
    reason: Optional[str] = None
) -> Optional[PromptTriggerQuestion]:
    """Update question and automatically create history entry."""
    question = await self.get_question_by_id(session, question_id)
    if not question:
        return None

    # Create history entry with current version
    history_entry = PromptTriggerQuestionHistory(
        question_id=question.id,
        question_text=question.question_text,
        group_name=question.group_name,
        source_shorthand=question.source_shorthand,
        version=question.version,
        created_at=question.created_at,
        created_by=question.created_by,
        replaced_at=dt.datetime.utcnow(),
        replaced_by=updated_by,
        reason=reason
    )
    session.add(history_entry)

    # Update question
    if question_text is not None:
        question.question_text = question_text
    if group_name is not None:
        question.group_name = group_name
    if source_shorthand is not None:
        question.source_shorthand = source_shorthand

    question.version += 1
    question.updated_at = dt.datetime.utcnow()
    question.updated_by = updated_by

    session.add(question)
    await session.commit()
    await session.refresh(question)

    return question
```

## 🎨 Frontend TypeScript Types

### Updated Question Type

```typescript
export interface PromptTriggerQuestion {
  id: number;
  question_text: string;
  group_name: string;
  source_shorthand: SourceShorthand;
  version: number;  // NEW
  is_active: boolean;  // NEW
  created_at: string;
  created_by: string | null;  // NEW
  updated_at: string;  // CHANGED from modified_at
  updated_by: string | null;  // NEW
}
```

### New History Type

```typescript
export interface PromptTriggerQuestionHistory {
  id: number;
  question_id: number;
  question_text: string;
  group_name: string;
  source_shorthand: SourceShorthand;
  version: number;
  created_at: string;
  created_by: string | null;
  replaced_at: string;
  replaced_by: string | null;
  reason: string | null;
}
```

### New Request Types

```typescript
export interface UpdateQuestionParams {
  question_text?: string;
  group_name?: string;
  source_shorthand?: SourceShorthand;
  reason?: string;  // NEW
}

export interface RestoreQuestionParams {
  history_id: number;
  reason?: string;
}

export interface ToggleActiveParams {
  is_active: boolean;
  reason?: string;
}
```

## 🌐 Frontend API Functions

```typescript
// Get question history
export async function getQuestionHistory(
  questionId: number
): Promise<PromptTriggerQuestionHistory[]> {
  const client = authService.createAuthenticatedClient();
  const response = await client.get(
    `/prompt-trigger-questions/questions/${questionId}/history`
  );
  return response.data;
}

// Restore question version
export async function restoreQuestionVersion(
  questionId: number,
  params: RestoreQuestionParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(
    `/prompt-trigger-questions/questions/${questionId}/restore`,
    params
  );
  return response.data;
}

// Toggle active status
export async function toggleQuestionActiveStatus(
  questionId: number,
  params: ToggleActiveParams
): Promise<PromptTriggerQuestion> {
  const client = authService.createAuthenticatedClient();
  const response = await client.post(
    `/prompt-trigger-questions/questions/${questionId}/toggle-active`,
    params
  );
  return response.data;
}
```

## 🎭 UI Components

### Question Display (Updated)

The question list now shows:
- **Version number** badge (e.g., "v3")
- **Active/Inactive** status badge
- **History button** (clock icon) to view all versions
- **Toggle active** button (eye/eye-off icon)

### QuestionHistoryDialog Component

New component showing:
- All historical versions in reverse chronological order
- For each version:
  - Version number
  - Question text
  - Group name
  - Source shorthand
  - Created/Replaced timestamps
  - Who created/replaced it
  - Reason for change
  - **Restore button** to revert to that version

## 📚 Usage Examples

### Creating a Question
```python
# Automatically sets version=1, is_active=True
question = await repo.create_question(
    session=session,
    question_text="What is the revenue growth?",
    group_name="Financial Metrics",
    source_shorthand="A",
    created_by="user@example.com"
)
```

### Updating a Question
```python
# Automatically creates history entry and increments version
question = await repo.update_question_with_history(
    session=session,
    question_id=1,
    updated_by="user@example.com",
    question_text="What is the YoY revenue growth?",
    reason="Added year-over-year specification"
)
```

### Deactivating a Question
```python
# Creates history entry explaining deactivation
question = await repo.toggle_active_status(
    session=session,
    question_id=1,
    is_active=False,
    updated_by="admin@example.com",
    reason="Temporarily disabled for review"
)
```

### Viewing History
```python
# Get all historical versions
history = await repo.get_question_history(session, question_id=1)
# Returns list ordered by version desc (newest first)
```

### Restoring a Version
```python
# Restore to a previous version
question = await repo.restore_question_version(
    session=session,
    question_id=1,
    history_id=5,
    restored_by="user@example.com",
    reason="Reverting to original wording"
)
# Creates a new history entry and increments version
```

## 🚀 Migration Steps

1. **Run SQL Migration**
   ```bash
   psql -U your_user -d your_database -f db-migration-prompt-trigger-questions-history.sql
   ```

2. **Update Backend Models**
   - Add new columns to `PromptTriggerQuestion` model
   - Create `PromptTriggerQuestionHistory` model
   - Update Pydantic schemas

3. **Update Backend Repository**
   - Replace simple update methods with `update_question_with_history`
   - Add history management methods

4. **Update Backend API**
   - Add 3 new endpoints (history, restore, toggle-active)
   - Update existing PUT endpoint to use history tracking

5. **Update Frontend Types**
   - Update `PromptTriggerQuestion` interface
   - Add history-related interfaces

6. **Update Frontend API**
   - Add new API functions for history management

7. **Update Frontend UI**
   - Add version and active status badges
   - Add history and toggle buttons
   - Include `QuestionHistoryDialog` component

## ✅ Testing Checklist

- [ ] SQL migration runs successfully
- [ ] Questions created with version=1, is_active=True
- [ ] Updating question creates history entry
- [ ] Version increments on each update
- [ ] History displays all previous versions
- [ ] Restoring version works correctly
- [ ] Toggle active/inactive works
- [ ] History shows reason for changes
- [ ] UI shows version and status badges
- [ ] History dialog displays correctly
- [ ] Restore from history works in UI

## 📁 Files Modified

### Backend Files
- `models.py` - Added history table, updated question model
- `schemas.py` - Added history schemas, updated question schemas
- `repository.py` - Added history methods
- `prompt_trigger_questions.py` - Added 3 new endpoints, updated PUT endpoint

### Frontend Files
- `src/types/prompt-triggers.ts` - Updated types
- `src/lib/prompt-triggers-api.ts` - Added API functions
- `src/components/QuestionHistoryDialog.tsx` - New component
- `src/pages/PromptTriggerQuestions.tsx` - Updated UI

### SQL Files
- `db-migration-prompt-trigger-questions-history.sql` - Migration script

## 🔗 Related Patterns

This implementation follows the same pattern as:
- `prompts` / `prompts_history` tables
- Any other versioned entity in your system

You can reuse this pattern for other entities that need version tracking and history.
