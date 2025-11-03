-- Migration: Add name column to evaluation_formulas table
-- Date: 2025-01-28

-- Add name column to evaluation_formulas table
ALTER TABLE evaluation_formulas 
ADD COLUMN name VARCHAR(200) NOT NULL DEFAULT 'Formule sans nom';

-- Update existing records to have a meaningful name
UPDATE evaluation_formulas 
SET name = 'Formule #' || id 
WHERE name = 'Formule sans nom';

-- Make the name column NOT NULL after updating existing records
ALTER TABLE evaluation_formulas 
ALTER COLUMN name SET NOT NULL;

-- Add comment to the column
COMMENT ON COLUMN evaluation_formulas.name IS 'Nom de la formule (ex: "Moyenne générale", "Moyenne trimestrielle")';
