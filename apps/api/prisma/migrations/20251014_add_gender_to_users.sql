-- Migration: Ajouter le champ gender à la table users
-- Date: 2025-10-14

-- Ajouter la colonne gender (optionnelle)
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(1);

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN users.gender IS 'Genre de l''utilisateur: M (Masculin) ou F (Féminin)';

