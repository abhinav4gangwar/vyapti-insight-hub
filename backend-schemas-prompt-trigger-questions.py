"""
Pydantic Schemas for Prompt Trigger Questions API

Request and Response models for the prompt trigger questions endpoints
with history tracking support.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
from datetime import datetime


# ============================================
# Request Schemas
# ============================================

class CreateQuestionRequest(BaseModel):
    """Request to create a new question."""
    question_text: str = Field(..., min_length=1, description="The question text")
    group_name: str = Field(..., min_length=1, max_length=255, description="Group/bucket name")
    source_shorthand: Literal['A', 'K', 'E'] = Field(..., description="Source shorthand (A/K/E)")

    @field_validator('question_text')
    @classmethod
    def validate_question_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Question text cannot be empty')
        return v.strip()

    @field_validator('group_name')
    @classmethod
    def validate_group_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Group name cannot be empty')
        return v.strip()


class UpdateQuestionRequest(BaseModel):
    """Request to update an existing question."""
    question_text: Optional[str] = Field(None, min_length=1, description="Updated question text")
    group_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Updated group name")
    source_shorthand: Optional[Literal['A', 'K', 'E']] = Field(None, description="Updated source shorthand")
    reason: Optional[str] = Field(None, description="Reason for this change")

    @field_validator('question_text')
    @classmethod
    def validate_question_text(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Question text cannot be empty')
        return v.strip() if v else None

    @field_validator('group_name')
    @classmethod
    def validate_group_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Group name cannot be empty')
        return v.strip() if v else None


class RestoreQuestionRequest(BaseModel):
    """Request to restore a question to a previous version."""
    history_id: int = Field(..., gt=0, description="ID of the history entry to restore")
    reason: Optional[str] = Field(None, description="Reason for restoration")


class ToggleActiveRequest(BaseModel):
    """Request to toggle a question's active status."""
    is_active: bool = Field(..., description="New active status")
    reason: Optional[str] = Field(None, description="Reason for status change")


class MoveQuestionRequest(BaseModel):
    """Request to move a question to a different group."""
    new_group_name: str = Field(..., min_length=1, max_length=255, description="Target group name")
    reason: Optional[str] = Field(None, description="Reason for moving")

    @field_validator('new_group_name')
    @classmethod
    def validate_group_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Group name cannot be empty')
        return v.strip()


class RenameGroupRequest(BaseModel):
    """Request to rename a group."""
    old_name: str = Field(..., min_length=1, description="Current group name")
    new_name: str = Field(..., min_length=1, description="New group name")


# ============================================
# Response Schemas
# ============================================

class QuestionResponse(BaseModel):
    """Response model for a single question."""
    id: int
    question_text: str
    group_name: str
    source_shorthand: str
    version: int
    is_active: bool
    created_at: str  # ISO format datetime string
    created_by: Optional[str] = None
    updated_at: str  # ISO format datetime string
    updated_by: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionHistoryResponse(BaseModel):
    """Response model for question history entries."""
    id: int
    question_id: int
    question_text: str
    group_name: str
    source_shorthand: str
    version: int
    created_at: str  # ISO format datetime string
    created_by: Optional[str] = None
    replaced_at: str  # ISO format datetime string
    replaced_by: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True


class GroupInfoResponse(BaseModel):
    """Response model for group summary."""
    name: str
    question_count: int


class GroupWithQuestionsResponse(BaseModel):
    """Response model for group with nested questions."""
    name: str
    question_count: int
    questions: list[QuestionResponse]


class RenameGroupResponse(BaseModel):
    """Response for group rename operation."""
    success: bool
    message: str
    questions_updated: int


class DeleteGroupResponse(BaseModel):
    """Response for group delete operation."""
    success: bool
    message: str
    deleted_count: int


class QuestionStatsResponse(BaseModel):
    """Response model for question statistics."""
    total_questions: int
    active_questions: int
    inactive_questions: int
    total_groups: int
    questions_by_source: dict[str, int]  # {'A': 10, 'K': 5, 'E': 3}
    questions_by_group: dict[str, int]  # {'Group1': 5, 'Group2': 8}


# ============================================
# Helper Functions
# ============================================

def format_datetime(dt: Optional[datetime]) -> str:
    """Format datetime to ISO string."""
    if dt is None:
        return ""
    return dt.isoformat()


def question_to_response(question) -> QuestionResponse:
    """Convert database model to response schema."""
    return QuestionResponse(
        id=question.id,
        question_text=question.question_text,
        group_name=question.group_name,
        source_shorthand=question.source_shorthand,
        version=question.version,
        is_active=question.is_active,
        created_at=format_datetime(question.created_at),
        created_by=question.created_by,
        updated_at=format_datetime(question.updated_at),
        updated_by=question.updated_by,
    )


def history_to_response(history) -> QuestionHistoryResponse:
    """Convert history database model to response schema."""
    return QuestionHistoryResponse(
        id=history.id,
        question_id=history.question_id,
        question_text=history.question_text,
        group_name=history.group_name,
        source_shorthand=history.source_shorthand,
        version=history.version,
        created_at=format_datetime(history.created_at),
        created_by=history.created_by,
        replaced_at=format_datetime(history.replaced_at),
        replaced_by=history.replaced_by,
        reason=history.reason,
    )
