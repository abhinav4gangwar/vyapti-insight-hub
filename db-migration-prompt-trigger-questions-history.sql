-- ============================================
-- Migration Script: Add History Tracking to Prompt Trigger Questions
-- ============================================
-- This script adds versioning and history tracking to the prompt_trigger_questions table
-- Similar to the prompts/prompts_history pattern
--
-- Changes:
-- 1. Adds new columns to prompt_trigger_questions table
-- 2. Creates new prompt_trigger_questions_history table
-- 3. Migrates existing data to set default values
-- ============================================

-- Step 1: Add new columns to prompt_trigger_questions table
-- ============================================

-- Add version tracking
ALTER TABLE prompt_trigger_questions
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add active/inactive status
ALTER TABLE prompt_trigger_questions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add audit fields
ALTER TABLE prompt_trigger_questions
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

ALTER TABLE prompt_trigger_questions
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Rename modified_at to updated_at for consistency (if it exists as modified_at)
-- Check if your table uses 'modified_at' and rename it
-- ALTER TABLE prompt_trigger_questions
-- RENAME COLUMN modified_at TO updated_at;

-- If updated_at doesn't exist, add it
ALTER TABLE prompt_trigger_questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index on is_active for faster filtering
CREATE INDEX IF NOT EXISTS idx_prompt_trigger_questions_is_active
ON prompt_trigger_questions(is_active);

-- Create index on group_name if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_prompt_trigger_questions_group_name
ON prompt_trigger_questions(group_name);


-- Step 2: Create the history table
-- ============================================

CREATE TABLE IF NOT EXISTS prompt_trigger_questions_history (
    id SERIAL PRIMARY KEY,
    question_id INTEGER NOT NULL,

    -- Snapshot of question data at this version
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
    reason TEXT,

    -- Foreign key to main table
    CONSTRAINT fk_question_history_question
        FOREIGN KEY (question_id)
        REFERENCES prompt_trigger_questions(id)
        ON DELETE CASCADE
);

-- Create indexes for history table
CREATE INDEX IF NOT EXISTS idx_prompt_trigger_questions_history_question_id
ON prompt_trigger_questions_history(question_id);

CREATE INDEX IF NOT EXISTS idx_prompt_trigger_questions_history_version
ON prompt_trigger_questions_history(version);

CREATE INDEX IF NOT EXISTS idx_prompt_trigger_questions_history_replaced_at
ON prompt_trigger_questions_history(replaced_at);


-- Step 3: Update existing data
-- ============================================

-- Set default version to 1 for all existing questions (if not already done)
UPDATE prompt_trigger_questions
SET version = 1
WHERE version IS NULL OR version = 0;

-- Set all existing questions as active (if not already done)
UPDATE prompt_trigger_questions
SET is_active = TRUE
WHERE is_active IS NULL;

-- Update updated_at to match created_at for existing records that don't have it
UPDATE prompt_trigger_questions
SET updated_at = created_at
WHERE updated_at IS NULL;


-- Step 4: Add comments for documentation
-- ============================================

COMMENT ON TABLE prompt_trigger_questions IS
'Main table for prompt trigger questions with versioning and history tracking';

COMMENT ON COLUMN prompt_trigger_questions.version IS
'Version number of the question, incremented on each update';

COMMENT ON COLUMN prompt_trigger_questions.is_active IS
'Whether the question is currently active and should be used';

COMMENT ON COLUMN prompt_trigger_questions.created_by IS
'Email or ID of user who created this question';

COMMENT ON COLUMN prompt_trigger_questions.updated_by IS
'Email or ID of user who last updated this question';

COMMENT ON TABLE prompt_trigger_questions_history IS
'Historical versions of prompt trigger questions for audit trail and restoration';

COMMENT ON COLUMN prompt_trigger_questions_history.question_id IS
'Reference to the current question in prompt_trigger_questions table';

COMMENT ON COLUMN prompt_trigger_questions_history.version IS
'Version number of this historical snapshot';

COMMENT ON COLUMN prompt_trigger_questions_history.replaced_at IS
'When this version was replaced by a new version';

COMMENT ON COLUMN prompt_trigger_questions_history.reason IS
'User-provided reason for the change that replaced this version';


-- ============================================
-- Verification Queries
-- ============================================

-- Check the updated structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'prompt_trigger_questions'
-- ORDER BY ordinal_position;

-- Check all questions and their versions
-- SELECT id, question_text, group_name, version, is_active, created_at, updated_at
-- FROM prompt_trigger_questions
-- ORDER BY group_name, id;

-- Check history table structure
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'prompt_trigger_questions_history'
-- ORDER BY ordinal_position;


-- ============================================
-- Rollback Script (use with caution!)
-- ============================================

-- To rollback these changes (only if needed):
/*
-- Drop history table
DROP TABLE IF EXISTS prompt_trigger_questions_history CASCADE;

-- Remove new columns (only if you want to completely revert)
ALTER TABLE prompt_trigger_questions DROP COLUMN IF EXISTS version;
ALTER TABLE prompt_trigger_questions DROP COLUMN IF EXISTS is_active;
ALTER TABLE prompt_trigger_questions DROP COLUMN IF EXISTS created_by;
ALTER TABLE prompt_trigger_questions DROP COLUMN IF EXISTS updated_by;
-- ALTER TABLE prompt_trigger_questions DROP COLUMN IF EXISTS updated_at; -- Only if you added it

-- Drop indexes
DROP INDEX IF EXISTS idx_prompt_trigger_questions_is_active;
*/
