# Guide d'utilisation du champ screenshot dans la table paiement

## Vue d'ensemble

La table `paiements` a été mise à jour pour inclure un champ `screenshot` qui permet de stocker les captures d'écran des paiements effectués par les utilisateurs.

## Structure de la table

```sql
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_paiement TIMESTAMP DEFAULT NOW(),
    is_paid BOOLEAN DEFAULT false,
    screenshot VARCHAR(255), -- NOUVEAU CHAMP
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Utilisation du champ screenshot

### 1. Types de données supportés
- **Type** : VARCHAR(255) - Chaîne de caractères
- **Nullable** : OUI (peut être NULL)
- **Format recommandé** : Chemin vers le fichier image

### 2. Formats d'image supportés
- JPG/JPEG
- PNG
- GIF
- WEBP

### 3. Convention de nommage recommandée
```
uploads/payments/{user_id}_{timestamp}.{extension}
```

Exemples :
- `uploads/payments/1_20250124_143022.jpg`
- `uploads/payments/2_20250124_150030.png`
- `uploads/payments/3_20250124_160045.gif`

## Exemples d'utilisation

### Insertion d'un paiement avec capture
```sql
INSERT INTO paiements (user_id, is_paid, screenshot)
VALUES (1, false, 'uploads/payments/1_20250124_143022.jpg');
```

### Mise à jour avec capture d'écran
```sql
UPDATE paiements 
SET screenshot = 'uploads/payments/1_20250124_143500.png',
    updated_at = NOW()
WHERE id = 1;
```

### Recherche des paiements avec captures
```sql
SELECT * FROM paiements 
WHERE screenshot IS NOT NULL;
```

### Recherche des paiements sans captures
```sql
SELECT * FROM paiements 
WHERE screenshot IS NULL;
```

## Requêtes utiles

### Statistiques des paiements
```sql
SELECT 
    COUNT(*) as total_paiements,
    COUNT(screenshot) as paiements_avec_capture,
    COUNT(*) - COUNT(screenshot) as paiements_sans_capture,
    SUM(CASE WHEN is_paid = true THEN 1 ELSE 0 END) as paiements_payes
FROM paiements;
```

### Paiements par utilisateur avec captures
```sql
SELECT 
    p.user_id,
    u.first_name,
    u.last_name,
    COUNT(*) as total_paiements,
    COUNT(p.screenshot) as paiements_avec_capture
FROM paiements p
JOIN users u ON p.user_id = u.id
GROUP BY p.user_id, u.first_name, u.last_name;
```

## Avantages du champ screenshot

✅ **Preuve de paiement** : Stockage des captures d'écran comme preuve  
✅ **Traçabilité** : Historique complet des transactions  
✅ **Validation** : Facilite la validation manuelle des paiements  
✅ **Flexibilité** : Support de différents formats d'image  
✅ **Sécurité** : Stockage sécurisé des preuves de paiement  

## Bonnes pratiques

1. **Validation des fichiers** : Vérifier le type et la taille des fichiers
2. **Sécurité** : Stocker les fichiers dans un répertoire sécurisé
3. **Nettoyage** : Supprimer les fichiers orphelins
4. **Sauvegarde** : Inclure les captures dans les sauvegardes
5. **Compression** : Optimiser la taille des images pour l'espace disque

## Intégration avec l'application

Le champ `screenshot` peut être utilisé dans :
- **Interface de paiement** : Upload de captures d'écran
- **Validation des paiements** : Visualisation des preuves
- **Historique des transactions** : Affichage des captures
- **Rapports** : Statistiques sur les paiements avec/sans captures
