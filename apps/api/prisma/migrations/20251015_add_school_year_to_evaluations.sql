-- Migration: Ajouter le champ school_year_id à la table evaluations
-- Date: 2025-10-15

-- Étape 1: Ajouter la colonne school_year_id (nullable temporairement)
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS school_year_id INTEGER;

-- Étape 2: Remplir avec l'année scolaire active de chaque utilisateur
-- On récupère l'année active pour chaque classe via l'utilisateur
UPDATE evaluations e
SET school_year_id = (
  SELECT sy.id
  FROM school_years sy
  INNER JOIN classes c ON c.user_id = sy.user_id
  WHERE c.id = e.class_id
    AND sy.is_active = true
  LIMIT 1
)
WHERE school_year_id IS NULL;

-- Si certaines évaluations n'ont pas d'année active, utiliser la première année disponible
UPDATE evaluations e
SET school_year_id = (
  SELECT sy.id
  FROM school_years sy
  INNER JOIN classes c ON c.user_id = sy.user_id
  WHERE c.id = e.class_id
  ORDER BY sy.created_at DESC
  LIMIT 1
)
WHERE school_year_id IS NULL;

-- Étape 3: Rendre la colonne NOT NULL
ALTER TABLE evaluations ALTER COLUMN school_year_id SET NOT NULL;

-- Étape 4: Ajouter la clé étrangère
ALTER TABLE evaluations 
ADD CONSTRAINT fk_evaluations_school_year 
FOREIGN KEY (school_year_id) 
REFERENCES school_years(id) 
ON DELETE CASCADE;

-- Étape 5: Créer l'index
CREATE INDEX IF NOT EXISTS idx_evaluations_school_year_id ON evaluations(school_year_id);

-- Ajouter un commentaire
COMMENT ON COLUMN evaluations.school_year_id IS 'Référence vers l''année scolaire de l''évaluation';

-- Message de confirmation
SELECT 'Colonne school_year_id ajoutée avec succès à la table evaluations!' as message;

