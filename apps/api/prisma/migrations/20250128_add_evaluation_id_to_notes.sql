-- Migration: Add evaluation_id column to notes table
-- Date: 2025-01-28

-- Add evaluation_id column to notes table
ALTER TABLE notes 
ADD COLUMN evaluation_id INTEGER;

-- Add foreign key constraint
ALTER TABLE notes 
ADD CONSTRAINT fk_notes_evaluation 
FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_notes_evaluation_id ON notes(evaluation_id);

-- Add comment to the column
COMMENT ON COLUMN notes.evaluation_id IS 'Référence vers l\'évaluation associée à cette note';

-- Note: Les notes existantes auront evaluation_id = NULL
-- Il faudra les associer manuellement ou via une migration de données
