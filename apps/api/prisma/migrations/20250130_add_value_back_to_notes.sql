-- Migration: Add value column back to notes table
-- Date: 2025-01-30
-- Description: Add back the value column to the notes table as it's needed for storing note values

-- Add the value column back to the notes table
ALTER TABLE notes ADD COLUMN value DECIMAL(5,2);
