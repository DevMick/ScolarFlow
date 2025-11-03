-- Script de vérification de la colonne gender dans la table users

-- 1. Vérifier toutes les colonnes de la table users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. Vérifier spécifiquement la colonne gender
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'gender';

-- 3. Afficher un échantillon des données users (sans les mots de passe)
SELECT id, email, first_name, last_name, gender, establishment, direction_regionale, secteur_pedagogique
FROM users
LIMIT 5;

