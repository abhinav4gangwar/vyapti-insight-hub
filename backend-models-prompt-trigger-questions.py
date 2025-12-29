"""
Database models for Prompt Trigger Questions with History Tracking

This file contains SQLAlchemy models for:
1. PromptTriggerQuestion - Main questions table (with versioning)
2. PromptTriggerQuestionHistory - Historical versions of questions

Similar to the prompts/prompts_history pattern
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime as dt


class PromptTriggerQuestion:
    """
    Main table for prompt trigger questions with versioning support.

    When a question is updated, the old version is moved to history
    and the version number is incremented.
    """
    __tablename__ = "prompt_trigger_questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    group_name = Column(String(255), nullable=False, index=True)
    source_shorthand = Column(String(1), nullable=False)  # 'A', 'K', or 'E'

    # Versioning fields
    version = Column(Integer, nullable=False, default=1)
    is_active = Column(Boolean, nullable=False, default=True, index=True)

    # Audit fields
    created_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow)
    created_by = Column(String(255), nullable=True)  # User email/ID
    updated_at = Column(DateTime, nullable=False, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)
    updated_by = Column(String(255), nullable=True)  # User email/ID who last updated

    # Relationship to history
    history = relationship("PromptTriggerQuestionHistory", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<PromptTriggerQuestion(id={self.id}, text='{self.question_text[:50]}...', version={self.version}, active={self.is_active})>"


class PromptTriggerQuestionHistory:
    """
    Historical versions of prompt trigger questions.

    Every time a question is updated or deactivated, the previous
    version is stored here for audit trail and restoration.
    """
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
    replaced_by = Column(String(255), nullable=True)  # User who made the change
    reason = Column(Text, nullable=True)  # Why this change was made

    # Relationship back to main question
    question = relationship("PromptTriggerQuestion", back_populates="history")

    def __repr__(self):
        return f"<PromptTriggerQuestionHistory(id={self.id}, question_id={self.question_id}, version={self.version})>"


# If you're using SQLAlchemy declarative base:
# from sqlalchemy.ext.declarative import declarative_base
# Base = declarative_base()
#
# class PromptTriggerQuestion(Base):
#     ... (add Base as parent class)
#
# class PromptTriggerQuestionHistory(Base):
#     ... (add Base as parent class)
