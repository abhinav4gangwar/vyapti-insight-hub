# Backend API Endpoints to Add for Question History

Add these new endpoints to your existing `prompt_trigger_questions.py` router in the backend.

## New Endpoints Needed

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
    """Restore a question to a previous version from history."""
    repo = PromptTriggerQuestionRepository()

    # Get user identifier
    user_id = current_user.email if hasattr(current_user, 'email') else str(current_user.id)

    question = await repo.restore_question_version(
        session=session,
        question_id=question_id,
        history_id=request.history_id,
        restored_by=user_id,
        reason=request.reason
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question or history entry not found")

    return question_to_response(question)
```

### 3. Toggle Question Active Status
```python
@router.post("/questions/{question_id}/toggle-active", response_model=QuestionResponse)
async def toggle_question_active(
    question_id: int,
    request: ToggleActiveRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Toggle a question's active/inactive status."""
    repo = PromptTriggerQuestionRepository()

    # Get user identifier
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

### 4. Update Existing PUT /questions/{question_id} Endpoint

Modify your existing update endpoint to use the new history-tracking method:

```python
@router.put("/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    question_id: int,
    request: UpdateQuestionRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing question (creates history entry)."""
    repo = PromptTriggerQuestionRepository()

    # Get user identifier
    user_id = current_user.email if hasattr(current_user, 'email') else str(current_user.id)

    # Use the new update_with_history method
    question = await repo.update_question_with_history(
        session=session,
        question_id=question_id,
        updated_by=user_id,
        question_text=request.question_text,
        group_name=request.group_name,
        source_shorthand=request.source_shorthand,
        reason=request.reason
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return question_to_response(question)
```

### 5. Update GET /questions Endpoint

Add support for filtering by active status:

```python
@router.get("/questions", response_model=List[QuestionResponse])
async def get_questions(
    source_shorthand: Optional[str] = None,
    group_name: Optional[str] = None,
    include_inactive: bool = False,  # NEW PARAMETER
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all questions with optional filters."""
    repo = PromptTriggerQuestionRepository()
    questions = await repo.get_all_questions(
        session,
        source_shorthand,
        group_name,
        include_inactive=include_inactive  # NEW
    )
    return [question_to_response(q) for q in questions]
```

## Summary of Changes

1. **3 New Endpoints**: `/history`, `/restore`, `/toggle-active`
2. **2 Modified Endpoints**: Update PUT and GET endpoints to support history and active status
3. **Database Migration**: Run the SQL migration script to add new columns and history table
4. **Models**: Add the new model classes from `backend-models-prompt-trigger-questions.py`
5. **Schemas**: Add the new Pydantic schemas from `backend-schemas-prompt-trigger-questions.py`
6. **Repository**: Add the repository methods from `backend-repository-prompt-trigger-questions.py`

## Testing the New Endpoints

After implementing, test with:

```bash
# Get question history
GET /prompt-trigger-questions/questions/1/history

# Restore a version
POST /prompt-trigger-questions/questions/1/restore
{"history_id": 5, "reason": "Reverting to previous version"}

# Deactivate a question
POST /prompt-trigger-questions/questions/1/toggle-active
{"is_active": false, "reason": "Temporarily disabled"}

# Update with reason tracking
PUT /prompt-trigger-questions/questions/1
{"question_text": "Updated question?", "reason": "Fixed typo"}
```
