-- Script SQL pour insérer l'administrateur par défaut
-- Exécuter ce script dans votre base de données PostgreSQL

-- Insérer l'administrateur par défaut
-- Le mot de passe 'DevMick@2003' est hashé avec bcrypt (salt rounds: 12)
INSERT INTO admins (username, password, is_active, created_at, updated_at) 
VALUES (
  'DevMick', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J7Kz9Kz2C', 
  true, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Vérifier que l'admin a été créé
SELECT 'Administrateur créé avec succès!' as message;
SELECT id, username, is_active, created_at FROM admins WHERE username = 'DevMick';
