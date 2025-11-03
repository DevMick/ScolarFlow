# Création Simple de l'Administrateur

## 🎯 Objectif
Créer l'administrateur par défaut dans la base de données pour accéder à la page d'administration.

## ✅ Étape 1 : Vérifier que la table existe

La table `admins` a été créée avec `npx prisma db push`. Vous pouvez la voir dans votre base de données.

## 🔧 Étape 2 : Insérer l'administrateur

### Option A : Via pgAdmin (Recommandé)
1. Ouvrir **pgAdmin**
2. Se connecter à votre base de données `edustats_db`
3. Aller dans **Query Tool**
4. Copier et coller ce SQL :

```sql
-- Insérer l'administrateur par défaut
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
```

5. Cliquer sur **Execute** (F5)

### Option B : Via psql (Terminal)
```bash
# Se connecter à PostgreSQL
psql -U postgres -d edustats_db

# Exécuter le script
\i insert-admin-simple.sql
```

### Option C : Via PowerShell
```powershell
# Modifier le mot de passe dans le script si nécessaire
.\run-insert-admin.ps1
```

## 🔑 Données de connexion

| Champ | Valeur |
|-------|--------|
| **Nom d'utilisateur** | `DevMick` |
| **Mot de passe** | `DevMick@2003` |
| **URL de connexion** | `http://localhost:3000/admin/login` |

## ✅ Étape 3 : Tester l'accès

1. **Démarrer l'API** (si pas déjà fait) :
   ```bash
   cd apps/api
   npm run dev
   ```

2. **Démarrer le frontend** (si pas déjà fait) :
   ```bash
   cd apps/web
   npm run dev
   ```

3. **Aller sur** : `http://localhost:3000/admin/login`

4. **Se connecter** avec :
   - Nom d'utilisateur : `DevMick`
   - Mot de passe : `DevMick@2003`

5. **Être redirigé** vers `/admin/payments`

## 🚨 Dépannage

### Problème : "Table admins does not exist"
**Solution :** La table n'a pas été créée
```bash
cd apps/api
npx prisma db push
```

### Problème : "Erreur de connexion"
**Solution :** Vérifier que l'API est démarrée
```bash
cd apps/api
npm run dev
```

### Problème : "Token invalide"
**Solution :** Se reconnecter sur `/admin/login`

## 🎉 Résultat attendu

Après avoir exécuté le SQL, vous devriez voir :
- ✅ Message "Administrateur créé avec succès!"
- ✅ L'admin DevMick dans la table
- ✅ Accès à la page d'administration des paiements

## 📋 Vérification finale

1. ✅ Table `admins` existe dans la base de données
2. ✅ Administrateur `DevMick` créé
3. ✅ API démarrée sur le port 3001
4. ✅ Frontend démarré sur le port 3000
5. ✅ Accès à `http://localhost:3000/admin/login`
6. ✅ Connexion avec `DevMick` / `DevMick@2003`
7. ✅ Redirection vers `/admin/payments`

Le système d'authentification admin sera alors **complètement opérationnel** ! 🚀
