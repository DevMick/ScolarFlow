# Configuration de l'Authentification Admin

## 🎯 Vue d'ensemble

Système d'authentification sécurisé pour l'accès à la page d'administration des paiements.

## 🔧 Configuration requise

### 1. Table Admin dans la base de données

La table `admins` a été ajoutée au schéma Prisma avec les champs :
- `id` - Identifiant unique
- `username` - Nom d'utilisateur (unique)
- `password` - Mot de passe hashé avec bcrypt
- `isActive` - Statut actif/inactif
- `createdAt` - Date de création
- `updatedAt` - Date de mise à jour

### 2. Migration de la base de données

**Option A : Script SQL direct**
```sql
-- Exécuter dans pgAdmin ou psql
\i create-admin-table.sql
```

**Option B : Script Node.js**
```bash
node setup-admin.js
```

### 3. Génération du client Prisma
```bash
cd apps/api
npx prisma generate
```

## 🔐 Données d'authentification par défaut

| Champ | Valeur |
|-------|--------|
| **Nom d'utilisateur** | `DevMick` |
| **Mot de passe** | `DevMick@2003` |
| **Statut** | Actif |

## 🚀 Déploiement

### 1. Exécuter la migration
```bash
# Depuis la racine du projet
node setup-admin.js
```

### 2. Redémarrer l'API
```bash
# L'API doit être redémarrée pour prendre en compte les nouvelles routes
npm run dev
```

### 3. Tester l'accès
1. Aller sur `http://localhost:3000/admin/login`
2. Se connecter avec les identifiants admin
3. Accéder à `http://localhost:3000/admin/payments`

## 🛡️ Sécurité

### Authentification
- ✅ **JWT Tokens** : Authentification sécurisée avec tokens
- ✅ **Bcrypt** : Mots de passe hashés avec salt
- ✅ **Expiration** : Tokens valides 24h
- ✅ **Vérification serveur** : Validation des tokens à chaque requête

### Protection des routes
- ✅ **Middleware admin** : Vérification obligatoire pour toutes les routes admin
- ✅ **Redirection automatique** : Vers la page de connexion si non authentifié
- ✅ **Déconnexion automatique** : Si le token expire ou est invalide

## 📍 URLs d'accès

### Pages publiques
- **Connexion admin** : `http://localhost:3000/admin/login`

### Pages protégées (nécessitent authentification admin)
- **Administration paiements** : `http://localhost:3000/admin/payments`

## 🔌 API Endpoints

### Authentification
- `POST /api/admin/auth/login` - Connexion admin
- `POST /api/admin/auth/verify` - Vérifier le token
- `POST /api/admin/auth/logout` - Déconnexion
- `GET /api/admin/auth/profile` - Profil admin

### Administration (protégées)
- `GET /api/admin/payments` - Liste des paiements
- `PUT /api/admin/payments/:id/status` - Modifier le statut
- `GET /api/admin/payments/stats` - Statistiques

## 🎨 Interface utilisateur

### Page de connexion admin
- **Design moderne** avec Tailwind CSS
- **Champs sécurisés** : Nom d'utilisateur et mot de passe
- **Affichage du mot de passe** : Bouton pour voir/masquer
- **Informations de connexion** : Affichées directement sur la page
- **Gestion des erreurs** : Messages d'erreur clairs
- **Loading states** : Indicateurs de chargement

### Page d'administration
- **Protection automatique** : Redirection si non authentifié
- **Header personnalisé** : Affichage du nom d'admin connecté
- **Fonctionnalités complètes** : Gestion des paiements avec authentification

## 🔄 Workflow d'authentification

### 1. Connexion
1. L'utilisateur accède à `/admin/login`
2. Saisit les identifiants admin
3. Le serveur vérifie les credentials
4. Génère un token JWT si valide
5. Stocke le token côté client
6. Redirige vers `/admin/payments`

### 2. Utilisation
1. Chaque requête admin inclut le token
2. Le serveur vérifie le token
3. Autorise ou refuse l'accès
4. Met à jour les données si autorisé

### 3. Déconnexion
1. Suppression du token côté client
2. Redirection vers la page de connexion
3. Invalidation côté serveur (optionnel)

## 🛠️ Maintenance

### Ajouter un nouvel administrateur
```javascript
// Via le service AdminService
await AdminService.createAdmin('nouveau_admin', 'mot_de_passe');
```

### Désactiver un administrateur
```sql
UPDATE admins SET is_active = false WHERE username = 'admin_a_desactiver';
```

### Changer un mot de passe
```javascript
// Via bcrypt
const newPassword = await bcrypt.hash('nouveau_mot_de_passe', 12);
await prisma.admin.update({
  where: { username: 'DevMick' },
  data: { password: newPassword }
});
```

## 🚨 Dépannage

### Problèmes courants

#### 1. "Table admins does not exist"
**Solution :** Exécuter la migration
```bash
node setup-admin.js
```

#### 2. "Token invalide"
**Solution :** Se reconnecter
- Aller sur `/admin/login`
- Saisir les identifiants
- Le token sera renouvelé

#### 3. "Erreur de connexion au serveur"
**Solution :** Vérifier que l'API est démarrée
```bash
cd apps/api
npm run dev
```

#### 4. "Prisma client not found"
**Solution :** Régénérer le client
```bash
cd apps/api
npx prisma generate
```

## ✅ Vérification du bon fonctionnement

### Tests à effectuer
1. ✅ Accès à `/admin/login` sans authentification
2. ✅ Connexion avec les identifiants par défaut
3. ✅ Redirection vers `/admin/payments` après connexion
4. ✅ Accès refusé à `/admin/payments` sans token
5. ✅ Fonctionnalités d'administration opérationnelles
6. ✅ Déconnexion et redirection vers login

### Résultat attendu
- ✅ **Sécurité renforcée** : Seuls les admins peuvent accéder
- ✅ **Interface dédiée** : Page de connexion admin séparée
- ✅ **Fonctionnalités complètes** : Administration des paiements protégée
- ✅ **Expérience utilisateur** : Workflow fluide et sécurisé

---

## 🎉 Résumé

Le système d'authentification admin est maintenant **complètement opérationnel** avec :

- ✅ **Table Admin** créée avec les données par défaut
- ✅ **Authentification sécurisée** avec JWT et bcrypt
- ✅ **Page de connexion** dédiée et moderne
- ✅ **Protection des routes** admin
- ✅ **Interface d'administration** sécurisée
- ✅ **Workflow complet** de connexion/déconnexion

**Accès :** `http://localhost:3000/admin/login` avec les identifiants `DevMick` / `DevMick@2003`
