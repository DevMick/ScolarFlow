-- Migration pour ajouter la table de configuration des moyennes par classe
-- Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- Description: Ajout de la table class_average_configs pour gérer les configurations de calcul des moyennes par classe

-- Créer la table class_average_configs
CREATE TABLE IF NOT EXISTS class_average_configs (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    divisor DECIMAL(5,2) NOT NULL CHECK (divisor > 0),
    formula TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité : une seule configuration par classe et par utilisateur
    UNIQUE(class_id, user_id)
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_class_average_configs_class_id ON class_average_configs(class_id);
CREATE INDEX IF NOT EXISTS idx_class_average_configs_user_id ON class_average_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_class_average_configs_is_active ON class_average_configs(is_active);

-- Ajouter un commentaire sur la table
COMMENT ON TABLE class_average_configs IS 'Configuration des moyennes par classe pour chaque utilisateur';
COMMENT ON COLUMN class_average_configs.divisor IS 'Diviseur pour le calcul de la moyenne (ex: 3 pour diviser par 3)';
COMMENT ON COLUMN class_average_configs.formula IS 'Formule générée pour le calcul de la moyenne (ex: =(Math + Français + Histoire) ÷ 3)';
COMMENT ON COLUMN class_average_configs.is_active IS 'Indique si la configuration est active';

-- Vérifier que la table a été créée correctement
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'class_average_configs' 
ORDER BY ordinal_position;

-- Afficher les contraintes
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'class_average_configs';

PRINT 'Migration class_average_configs terminée avec succès';
