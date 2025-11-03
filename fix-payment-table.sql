-- Script pour corriger la table paiements
-- Exécuter ce script dans votre client PostgreSQL (pgAdmin, psql, etc.)

-- 1. Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'paiements' 
        AND column_name = 'screenshot_type'
    ) THEN
        -- Ajouter la colonne screenshot_type
        ALTER TABLE paiements ADD COLUMN screenshot_type VARCHAR(50);
        
        -- Ajouter un commentaire pour documenter la colonne
        COMMENT ON COLUMN paiements.screenshot_type IS 'Type MIME de l''image (image/jpeg, image/png, etc.)';
        
        RAISE NOTICE 'Colonne screenshot_type ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne screenshot_type existe déjà';
    END IF;
END $$;

-- 2. Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'paiements' 
ORDER BY ordinal_position;

-- 3. Afficher un message de confirmation
SELECT 'Migration terminée avec succès! La table paiements est maintenant prête pour le stockage des images binaires.' as message;
