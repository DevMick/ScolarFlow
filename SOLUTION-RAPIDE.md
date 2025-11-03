# Solution rapide pour le problème d'enregistrement des images

## 🚨 Problème identifié
L'erreur `The column 'colonne' does not exist in the current database` indique que la colonne `screenshot_type` n'a pas encore été ajoutée à la base de données.

## ✅ Solution immédiate

### Option 1: Exécuter le script PowerShell
```powershell
.\execute-migration.ps1
```

### Option 2: Exécuter manuellement dans PostgreSQL
1. Ouvrir pgAdmin ou votre client PostgreSQL
2. Se connecter à la base `edustats_db`
3. Exécuter cette commande SQL :
```sql
ALTER TABLE paiements ADD COLUMN screenshot_type VARCHAR(50);
```

### Option 3: Utiliser le fichier SQL
1. Ouvrir `fix-payment-table.sql` dans votre client PostgreSQL
2. Exécuter le script complet

## 🔍 Vérification
Après avoir exécuté la migration, vérifiez que la colonne existe :
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'paiements' AND column_name = 'screenshot_type';
```

## 🚀 Test
Une fois la migration terminée :
1. Redémarrer l'API si nécessaire
2. Aller sur `http://localhost:3000/payment`
3. Tester l'upload d'une image
4. Vérifier que l'image s'enregistre correctement

## 📋 Fichiers créés
- `execute-migration.ps1` - Script PowerShell automatique
- `fix-payment-table.sql` - Script SQL manuel
- `migration-screenshot-type.sql` - Script de migration complet

## ⚡ Résolution en 2 minutes
1. **Exécuter** : `ALTER TABLE paiements ADD COLUMN screenshot_type VARCHAR(50);`
2. **Tester** : Upload d'image sur la page de paiement
3. **Vérifier** : L'image s'enregistre maintenant correctement

Le problème sera résolu immédiatement après l'ajout de la colonne !
