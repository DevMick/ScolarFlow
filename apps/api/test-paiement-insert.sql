-- Script de test pour insérer un paiement
-- Remplacez 1 par l'ID d'un utilisateur existant dans votre base de données

-- Insérer un paiement de test
INSERT INTO paiements (user_id, date_paiement, is_paid, created_at, updated_at)
VALUES (1, NOW(), false, NOW(), NOW());

-- Vérifier l'insertion
SELECT * FROM paiements WHERE user_id = 1;

-- Mettre à jour le statut du paiement
UPDATE paiements 
SET is_paid = true, updated_at = NOW() 
WHERE user_id = 1 AND is_paid = false;

-- Vérifier la mise à jour
SELECT * FROM paiements WHERE user_id = 1;
