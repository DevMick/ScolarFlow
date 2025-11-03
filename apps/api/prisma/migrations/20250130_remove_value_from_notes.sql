-- Migration: Remove value column from notes table
-- Date: 2025-01-30
-- Description: Remove the value column from the notes table as requested

-- Drop the value column from the notes table
ALTER TABLE notes DROP COLUMN IF EXISTS value;
