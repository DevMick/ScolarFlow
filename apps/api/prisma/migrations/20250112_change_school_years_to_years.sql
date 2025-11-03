-- Migration: Changer startDate et endDate en startYear et endYear (entiers)
-- Date: 2025-01-12

BEGIN;

-- Étape 1: Ajouter les nouvelles colonnes
ALTER TABLE school_years 
ADD COLUMN start_year INTEGER,
ADD COLUMN end_year INTEGER;

-- Étape 2: Migrer les données existantes (extraire l'année des dates)
UPDATE school_years 
SET start_year = EXTRACT(YEAR FROM start_date)::INTEGER,
    end_year = EXTRACT(YEAR FROM end_date)::INTEGER;

-- Étape 3: Rendre les nouvelles colonnes NOT NULL
ALTER TABLE school_years 
ALTER COLUMN start_year SET NOT NULL,
ALTER COLUMN end_year SET NOT NULL;

-- Étape 4: Supprimer l'ancienne contrainte unique
ALTER TABLE school_years DROP CONSTRAINT IF EXISTS school_years_user_id_start_date_end_date_key;

-- Étape 5: Supprimer les anciennes colonnes
ALTER TABLE school_years 
DROP COLUMN start_date,
DROP COLUMN end_date;

-- Étape 6: Ajouter la nouvelle contrainte unique
ALTER TABLE school_years 
ADD CONSTRAINT school_years_user_id_start_year_end_year_key 
UNIQUE (user_id, start_year, end_year);

COMMIT;

