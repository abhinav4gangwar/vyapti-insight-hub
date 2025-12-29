"""
Repository Methods for Prompt Trigger Questions with History Tracking

This module contains all database operations for managing questions
and their history. Add these methods to your existing repository class
or create a new PromptTriggerQuestionRepository class.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, delete
from sqlalchemy.orm import selectinload
from typing import Optional, List
import datetime as dt


class PromptTriggerQuestionRepository:
    """Repository for managing prompt trigger questions and their history."""

    # ============================================
    # Basic CRUD Operations
    # ============================================

    async def get_all_questions(
        self,
        session: AsyncSession,
        source_shorthand: Optional[str] = None,
        group_name: Optional[str] = None,
        include_inactive: bool = False
    ) -> List:
        """
        Get all questions with optional filtering.

        Args:
            session: Database session
            source_shorthand: Filter by source ('A', 'K', 'E')
            group_name: Filter by group name
            include_inactive: Whether to include inactive questions

        Returns:
            List of PromptTriggerQuestion objects
        """
        query = select(PromptTriggerQuestion)

        # Build filters
        filters = []
        if not include_inactive:
            filters.append(PromptTriggerQuestion.is_active == True)
        if source_shorthand:
            filters.append(PromptTriggerQuestion.source_shorthand == source_shorthand)
        if group_name:
            filters.append(PromptTriggerQuestion.group_name == group_name)

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(
            PromptTriggerQuestion.group_name,
            PromptTriggerQuestion.id
        )

        result = await session.execute(query)
        return result.scalars().all()

    async def get_question_by_id(
        self,
        session: AsyncSession,
        question_id: int
    ) -> Optional:
        """Get a single question by ID."""
        result = await session.execute(
            select(PromptTriggerQuestion).where(
                PromptTriggerQuestion.id == question_id
            )
        )
        return result.scalars().first()

    async def create_question(
        self,
        session: AsyncSession,
        question_text: str,
        group_name: str,
        source_shorthand: str,
        created_by: Optional[str] = None
    ):
        """
        Create a new question.

        Args:
            session: Database session
            question_text: The question text
            group_name: Group/bucket name
            source_shorthand: Source shorthand ('A', 'K', 'E')
            created_by: User who created this question

        Returns:
            The created PromptTriggerQuestion object
        """
        question = PromptTriggerQuestion(
            question_text=question_text,
            group_name=group_name,
            source_shorthand=source_shorthand,
            version=1,
            is_active=True,
            created_at=dt.datetime.utcnow(),
            created_by=created_by,
            updated_at=dt.datetime.utcnow(),
            updated_by=created_by
        )

        session.add(question)
        await session.commit()
        await session.refresh(question)
        return question

    async def delete_question(
        self,
        session: AsyncSession,
        question_id: int
    ) -> bool:
        """
        Delete a question (and its history via CASCADE).

        Args:
            session: Database session
            question_id: ID of question to delete

        Returns:
            True if deleted, False if not found
        """
        question = await self.get_question_by_id(session, question_id)
        if not question:
            return False

        await session.delete(question)
        await session.commit()
        return True

    # ============================================
    # Update with History Tracking
    # ============================================

    async def update_question_with_history(
        self,
        session: AsyncSession,
        question_id: int,
        updated_by: str,
        question_text: Optional[str] = None,
        group_name: Optional[str] = None,
        source_shorthand: Optional[str] = None,
        reason: Optional[str] = None
    ) -> Optional:
        """
        Update a question and create a history entry.

        This is the main update method that:
        1. Creates a history entry with the old version
        2. Updates the question with new values
        3. Increments the version number

        Args:
            session: Database session
            question_id: ID of question to update
            updated_by: User making the update
            question_text: New question text (optional)
            group_name: New group name (optional)
            source_shorthand: New source shorthand (optional)
            reason: Reason for the change (optional)

        Returns:
            Updated PromptTriggerQuestion object or None if not found
        """
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

        # Update question with new values
        if question_text is not None:
            question.question_text = question_text
        if group_name is not None:
            question.group_name = group_name
        if source_shorthand is not None:
            question.source_shorthand = source_shorthand

        # Increment version and update metadata
        question.version += 1
        question.updated_at = dt.datetime.utcnow()
        question.updated_by = updated_by

        session.add(question)
        await session.commit()
        await session.refresh(question)

        return question

    async def toggle_active_status(
        self,
        session: AsyncSession,
        question_id: int,
        is_active: bool,
        updated_by: str,
        reason: Optional[str] = None
    ) -> Optional:
        """
        Toggle a question's active status with history tracking.

        Args:
            session: Database session
            question_id: ID of question to toggle
            is_active: New active status
            updated_by: User making the change
            reason: Reason for status change

        Returns:
            Updated PromptTriggerQuestion or None if not found
        """
        question = await self.get_question_by_id(session, question_id)
        if not question:
            return None

        # Only create history if status is actually changing
        if question.is_active == is_active:
            return question

        # Create history entry
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
            reason=reason or f"{'Activated' if is_active else 'Deactivated'} question"
        )
        session.add(history_entry)

        # Update status
        question.is_active = is_active
        question.version += 1
        question.updated_at = dt.datetime.utcnow()
        question.updated_by = updated_by

        session.add(question)
        await session.commit()
        await session.refresh(question)

        return question

    # ============================================
    # History Operations
    # ============================================

    async def get_question_history(
        self,
        session: AsyncSession,
        question_id: int
    ) -> List:
        """
        Get all historical versions of a question.

        Args:
            session: Database session
            question_id: ID of the question

        Returns:
            List of PromptTriggerQuestionHistory objects, newest first
        """
        result = await session.execute(
            select(PromptTriggerQuestionHistory)
            .where(PromptTriggerQuestionHistory.question_id == question_id)
            .order_by(PromptTriggerQuestionHistory.version.desc())
        )
        return result.scalars().all()

    async def get_history_entry(
        self,
        session: AsyncSession,
        history_id: int
    ) -> Optional:
        """Get a specific history entry by ID."""
        result = await session.execute(
            select(PromptTriggerQuestionHistory).where(
                PromptTriggerQuestionHistory.id == history_id
            )
        )
        return result.scalars().first()

    async def restore_question_version(
        self,
        session: AsyncSession,
        question_id: int,
        history_id: int,
        restored_by: str,
        reason: Optional[str] = None
    ) -> Optional:
        """
        Restore a question to a previous version from history.

        Args:
            session: Database session
            question_id: ID of the question to restore
            history_id: ID of the history entry to restore from
            restored_by: User performing the restoration
            reason: Reason for restoration

        Returns:
            Updated PromptTriggerQuestion or None if not found
        """
        # Get the history entry
        history_entry = await self.get_history_entry(session, history_id)
        if not history_entry or history_entry.question_id != question_id:
            return None

        # Restore using update_with_history
        restore_reason = reason or f"Restored to version {history_entry.version}"
        return await self.update_question_with_history(
            session=session,
            question_id=question_id,
            updated_by=restored_by,
            question_text=history_entry.question_text,
            group_name=history_entry.group_name,
            source_shorthand=history_entry.source_shorthand,
            reason=restore_reason
        )

    # ============================================
    # Group Operations
    # ============================================

    async def get_all_groups(
        self,
        session: AsyncSession,
        source_shorthand: Optional[str] = None,
        include_inactive: bool = False
    ) -> List[dict]:
        """
        Get all groups with question counts.

        Args:
            session: Database session
            source_shorthand: Filter by source
            include_inactive: Whether to count inactive questions

        Returns:
            List of dicts with 'name' and 'question_count'
        """
        filters = []
        if not include_inactive:
            filters.append(PromptTriggerQuestion.is_active == True)
        if source_shorthand:
            filters.append(PromptTriggerQuestion.source_shorthand == source_shorthand)

        query = select(
            PromptTriggerQuestion.group_name,
            func.count(PromptTriggerQuestion.id).label('count')
        )

        if filters:
            query = query.where(and_(*filters))

        query = query.group_by(PromptTriggerQuestion.group_name).order_by(
            PromptTriggerQuestion.group_name
        )

        result = await session.execute(query)
        return [
            {'name': row.group_name, 'question_count': row.count}
            for row in result
        ]

    async def rename_group(
        self,
        session: AsyncSession,
        old_name: str,
        new_name: str,
        updated_by: str
    ) -> int:
        """
        Rename a group (updates all questions in that group).

        Note: This does NOT create history entries for each question.
        Consider if you want to add that functionality.

        Args:
            session: Database session
            old_name: Current group name
            new_name: New group name
            updated_by: User performing the rename

        Returns:
            Number of questions updated
        """
        questions = await self.get_all_questions(
            session, group_name=old_name, include_inactive=True
        )

        for question in questions:
            question.group_name = new_name
            question.updated_at = dt.datetime.utcnow()
            question.updated_by = updated_by
            session.add(question)

        await session.commit()
        return len(questions)

    async def delete_group(
        self,
        session: AsyncSession,
        group_name: str,
        delete_questions: bool = False
    ) -> int:
        """
        Delete a group and optionally its questions.

        Args:
            session: Database session
            group_name: Name of group to delete
            delete_questions: If True, delete all questions; if False, just ungroup them

        Returns:
            Number of questions affected
        """
        questions = await self.get_all_questions(
            session, group_name=group_name, include_inactive=True
        )

        if delete_questions:
            for question in questions:
                await session.delete(question)
        else:
            # Option: move to "Ungrouped" or set to empty string
            for question in questions:
                question.group_name = "Ungrouped"
                session.add(question)

        await session.commit()
        return len(questions)

    # ============================================
    # Statistics
    # ============================================

    async def get_question_stats(
        self,
        session: AsyncSession
    ) -> dict:
        """
        Get statistics about questions.

        Returns:
            Dict with various statistics
        """
        # Total questions
        total_result = await session.execute(
            select(func.count(PromptTriggerQuestion.id))
        )
        total_questions = total_result.scalar()

        # Active questions
        active_result = await session.execute(
            select(func.count(PromptTriggerQuestion.id)).where(
                PromptTriggerQuestion.is_active == True
            )
        )
        active_questions = active_result.scalar()

        # By source
        source_result = await session.execute(
            select(
                PromptTriggerQuestion.source_shorthand,
                func.count(PromptTriggerQuestion.id)
            ).where(
                PromptTriggerQuestion.is_active == True
            ).group_by(PromptTriggerQuestion.source_shorthand)
        )
        by_source = {row[0]: row[1] for row in source_result}

        # By group
        group_result = await session.execute(
            select(
                PromptTriggerQuestion.group_name,
                func.count(PromptTriggerQuestion.id)
            ).where(
                PromptTriggerQuestion.is_active == True
            ).group_by(PromptTriggerQuestion.group_name)
        )
        by_group = {row[0]: row[1] for row in group_result}

        # Total groups
        total_groups = len(by_group)

        return {
            'total_questions': total_questions,
            'active_questions': active_questions,
            'inactive_questions': total_questions - active_questions,
            'total_groups': total_groups,
            'questions_by_source': by_source,
            'questions_by_group': by_group
        }


# Example usage in your FastAPI route:
"""
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

@router.get("/questions")
async def get_questions(
    source: Optional[str] = None,
    group: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user)
):
    repo = PromptTriggerQuestionRepository()
    questions = await repo.get_all_questions(session, source, group)
    return [question_to_response(q) for q in questions]
"""
