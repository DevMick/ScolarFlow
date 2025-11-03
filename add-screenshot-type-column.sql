-- Script pour ajouter la colonne screenshot_type à la table paiements
-- Exécuter ce script pour mettre à jour la structure de la base de données

-- Ajouter la colonne screenshot_type
ALTER TABLE paiements 
ADD COLUMN screenshot_type VARCHAR(50);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN paiements.screenshot_type IS 'Type MIME de l''image (image/jpeg, image/png, etc.)';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'paiements' 
AND column_name = 'screenshot_type';
