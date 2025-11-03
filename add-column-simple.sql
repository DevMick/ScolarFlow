-- Script SQL simple pour ajouter la colonne screenshot_type
-- Copiez et collez cette commande dans pgAdmin ou votre client PostgreSQL

ALTER TABLE paiements ADD COLUMN IF NOT EXISTS screenshot_type VARCHAR(50);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'paiements' 
ORDER BY ordinal_position;
