-- Script SQL pour tester le nouveau champ screenshot
-- Test d'insertion avec capture d'écran

-- 1. Insérer un paiement sans capture d'écran
INSERT INTO paiements (user_id, is_paid, screenshot, created_at, updated_at)
VALUES (1, false, NULL, NOW(), NOW());

-- 2. Insérer un paiement avec capture d'écran
INSERT INTO paiements (user_id, is_paid, screenshot, created_at, updated_at)
VALUES (1, false, 'uploads/payments/1_20250124_143022.jpg', NOW(), NOW());

-- 3. Mettre à jour un paiement avec capture d'écran
UPDATE paiements 
SET screenshot = 'uploads/payments/1_20250124_143500.png', updated_at = NOW() 
WHERE id = 1 AND screenshot IS NULL;

-- 4. Marquer un paiement comme payé (avec capture)
UPDATE paiements 
SET is_paid = true, updated_at = NOW() 
WHERE id = 2 AND screenshot IS NOT NULL;

-- 5. Requêtes de test
-- Lister tous les paiements
SELECT 
    id,
    user_id,
    date_paiement,
    is_paid,
    screenshot,
    CASE 
        WHEN screenshot IS NOT NULL THEN 'Avec capture'
        ELSE 'Sans capture'
    END as statut_capture,
    created_at
FROM paiements 
ORDER BY created_at DESC;

-- Lister les paiements avec captures d'écran
SELECT 
    id,
    user_id,
    date_paiement,
    is_paid,
    screenshot,
    created_at
FROM paiements 
WHERE screenshot IS NOT NULL
ORDER BY created_at DESC;

-- Statistiques des paiements
SELECT 
    COUNT(*) as total_paiements,
    COUNT(screenshot) as paiements_avec_capture,
    COUNT(*) - COUNT(screenshot) as paiements_sans_capture,
    SUM(CASE WHEN is_paid = true THEN 1 ELSE 0 END) as paiements_payes,
    SUM(CASE WHEN is_paid = false THEN 1 ELSE 0 END) as paiements_en_attente
FROM paiements;
