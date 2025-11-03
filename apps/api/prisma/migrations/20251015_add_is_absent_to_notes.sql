-- Migration: Ajouter le champ is_absent à la table notes
-- Date: 2025-10-15

-- Ajouter la colonne is_absent (par défaut FALSE)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_absent BOOLEAN NOT NULL DEFAULT FALSE;

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_notes_is_absent ON notes(is_absent);

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN notes.is_absent IS 'Indique si l''élève était absent à cette évaluation (true = absent, false = présent)';

-- Afficher un message de confirmation
SELECT 'Colonne is_absent ajoutée avec succès à la table notes!' as message;

