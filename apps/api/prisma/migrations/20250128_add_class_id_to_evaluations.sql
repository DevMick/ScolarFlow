-- Migration: Add class_id column to evaluations table
-- Date: 2025-01-28

-- Add class_id column to evaluations table
ALTER TABLE evaluations 
ADD COLUMN class_id INTEGER;

-- Add foreign key constraint
ALTER TABLE evaluations 
ADD CONSTRAINT fk_evaluations_class 
FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_evaluations_class_id ON evaluations(class_id);

-- Add comment to the column
COMMENT ON COLUMN evaluations.class_id IS 'Référence vers la classe associée à cette évaluation';

-- Note: Les évaluations existantes auront class_id = NULL
-- Il faudra les associer manuellement ou via une migration de données
