-- Script pour créer la table Admin
-- Exécuter ce script dans votre base de données PostgreSQL

-- Créer la table admins
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- Ajouter le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_admins_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at 
BEFORE UPDATE ON admins 
FOR EACH ROW EXECUTE FUNCTION update_admins_updated_at_column();

-- Insérer l'admin par défaut
-- Le mot de passe sera hashé avec bcrypt
INSERT INTO admins (username, password, is_active) 
VALUES ('DevMick', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J7Kz9Kz2C', true)
ON CONFLICT (username) DO NOTHING;

-- Vérifier que la table a été créée
SELECT 'Table admins créée avec succès!' as message;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;
