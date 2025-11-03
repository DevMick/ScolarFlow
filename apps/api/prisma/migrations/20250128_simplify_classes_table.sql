-- Migration pour simplifier la table classes
-- Supprimer les colonnes non nécessaires et garder seulement :
-- - Nom de la classe (name)
-- - Nombre d'élèves (studentCount) 
-- - Année scolaire (academicYear)

-- Supprimer les colonnes non nécessaires
ALTER TABLE classes DROP COLUMN IF EXISTS level;
ALTER TABLE classes DROP COLUMN IF EXISTS description;

-- La colonne studentCount existe déjà et a la bonne valeur par défaut (0)
-- La colonne academicYear existe déjà
-- La colonne name existe déjà

-- Mettre à jour les commentaires des colonnes si nécessaire
COMMENT ON COLUMN classes.name IS 'Nom de la classe';
COMMENT ON COLUMN classes.student_count IS 'Nombre d''élèves dans la classe';
COMMENT ON COLUMN classes.academic_year IS 'Année scolaire (format: 2024-2025)';
