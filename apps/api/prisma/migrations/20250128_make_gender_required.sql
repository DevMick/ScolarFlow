-- Migration pour rendre le champ gender obligatoire
-- Date: 2025-01-28
-- Description: Rendre le champ gender obligatoire dans la table students

-- 1. Mettre à jour les enregistrements existants qui n'ont pas de genre
-- Par défaut, on met 'M' pour les enregistrements existants sans genre
UPDATE students 
SET gender = 'M' 
WHERE gender IS NULL;

-- 2. Modifier la colonne pour la rendre NOT NULL
ALTER TABLE students 
ALTER COLUMN gender SET NOT NULL;

-- 3. Ajouter une contrainte de validation pour s'assurer que seules les valeurs 'M' et 'F' sont acceptées
ALTER TABLE students 
ADD CONSTRAINT students_gender_check CHECK (gender IN ('M', 'F'));
