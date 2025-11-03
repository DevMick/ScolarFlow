-- Migration: Ajouter user_id à la table class_thresholds
-- Description: Ajoute le champ user_id pour tracer qui a créé les seuils

-- Étape 1: Ajouter la colonne user_id (nullable temporairement)
ALTER TABLE class_thresholds ADD COLUMN user_id INTEGER;

-- Étape 2: Mettre à jour les enregistrements existants avec un userId valide
-- On utilise le userId de la classe associée
UPDATE class_thresholds ct
SET user_id = (
    SELECT c.user_id 
    FROM classes c 
    WHERE c.id = ct.class_id
);

-- Étape 3: Rendre la colonne NOT NULL
ALTER TABLE class_thresholds ALTER COLUMN user_id SET NOT NULL;

-- Étape 4: Ajouter la contrainte de clé étrangère
ALTER TABLE class_thresholds 
ADD CONSTRAINT class_thresholds_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Étape 5: Créer un index sur user_id pour les performances
CREATE INDEX class_thresholds_user_id_idx ON class_thresholds(user_id);

-- Vérification
SELECT 
    ct.id,
    ct.class_id,
    ct.user_id,
    ct.moyenne_admission,
    ct.moyenne_redoublement,
    ct.max_note,
    c.name as class_name,
    u.email as user_email
FROM class_thresholds ct
JOIN classes c ON c.id = ct.class_id
JOIN users u ON u.id = ct.user_id;

