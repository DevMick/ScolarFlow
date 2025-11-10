# 🔐 Variables d'Environnement - ScolarFlow API

## 📋 Vue d'ensemble

Ce document liste toutes les variables d'environnement utilisées dans le projet ScolarFlow API, organisées par catégorie et priorité.

---

## ✅ Variables Requises (Production)

Ces variables sont **obligatoires** pour le fonctionnement de l'API en production.

### 1. `DATABASE_URL`
- **Type** : String
- **Description** : URL de connexion à la base de données PostgreSQL
- **Format** : `postgresql://user:password@host:port/database?sslmode=require`
- **Exemple** : 
  ```
  postgresql://avnadmin:password@pg-xxxxx-allianceconsultants893-23db.h.aivencloud.com:17875/defaultdb?sslmode=require
  ```
- **Utilisation** : Connexion Prisma à la base de données
- **Fichiers** : `apps/api/src/lib/prisma.ts`, `apps/api/src/index.ts`

### 2. `JWT_SECRET`
- **Type** : String
- **Description** : Secret pour signer et vérifier les tokens JWT
- **Recommandation** : Minimum 128 caractères, aléatoire et sécurisé
- **Exemple** : `your-super-secret-jwt-key-change-in-production-128-chars-minimum`
- **Utilisation** : Authentification JWT, tokens d'accès
- **Fichiers** : 
  - `apps/api/src/config/jwt.ts`
  - `apps/api/src/middleware/auth.ts`
  - `apps/api/src/services/adminService.ts`
  - `apps/api/src/middleware/csrf.ts`

---

## 🔒 Variables Recommandées (Production)

Ces variables sont **fortement recommandées** pour la sécurité et le bon fonctionnement en production.

### 3. `JWT_REFRESH_SECRET`
- **Type** : String
- **Description** : Secret pour signer et vérifier les tokens JWT de rafraîchissement
- **Recommandation** : Différent de `JWT_SECRET`, minimum 128 caractères
- **Exemple** : `your-super-secret-refresh-jwt-key-change-in-production-128-chars-minimum`
- **Valeur par défaut** : `your-refresh-secret-key-change-in-production` (⚠️ À changer en production)
- **Utilisation** : Tokens de rafraîchissement JWT
- **Fichiers** : `apps/api/src/config/jwt.ts`

### 4. `CORS_ORIGIN`
- **Type** : String
- **Description** : Origine autorisée pour les requêtes CORS (frontend)
- **Exemple Production** : `https://www.scolarflow.com`
- **Exemple Développement** : `http://localhost:3000`
- **Valeur par défaut** : `http://localhost:3000`
- **Utilisation** : Configuration CORS, Helmet CSP
- **Fichiers** : 
  - `apps/api/src/config/security.ts`
  - `apps/api/src/config/helmet.config.ts`
  - `apps/api/src/server.ts`
  - `apps/api/src/middleware/csrf.ts`
  - `apps/api/src/middleware/errorHandler.security.ts`

### 5. `CSRF_SECRET`
- **Type** : String
- **Description** : Secret pour la protection CSRF
- **Valeur par défaut** : Utilise `JWT_SECRET` si non défini
- **Utilisation** : Protection CSRF
- **Fichiers** : `apps/api/src/middleware/csrf.ts`

---

## ⚙️ Variables Optionnelles (Configuration)

Ces variables permettent de personnaliser le comportement de l'API.

### 6. `NODE_ENV`
- **Type** : String
- **Description** : Environnement d'exécution
- **Valeurs possibles** : `development`, `production`, `test`
- **Valeur par défaut** : `development`
- **Défini automatiquement par Vercel** : `production`
- **Utilisation** : 
  - Configuration de sécurité (Helmet, CORS)
  - Logs détaillés en développement
  - Rate limiting plus permissif en développement
- **Fichiers** : Utilisé dans de nombreux fichiers

### 7. `PORT`
- **Type** : Number
- **Description** : Port d'écoute du serveur (uniquement pour développement local)
- **Valeur par défaut** : `3001`
- **Note** : Non utilisé sur Vercel (géré automatiquement)
- **Fichiers** : `apps/api/src/server.ts`

### 8. `EXPORT_DIR`
- **Type** : String
- **Description** : Répertoire pour les fichiers exportés (PDF, DOCX, etc.)
- **Valeur par défaut** : `{process.cwd()}/exports`
- **Utilisation** : Export de rapports
- **Fichiers** : `apps/api/src/services/reports/ExportService.ts`

### 9. `TEMP_DIR`
- **Type** : String
- **Description** : Répertoire temporaire pour les fichiers
- **Valeur par défaut** : `{process.cwd()}/temp`
- **Utilisation** : Fichiers temporaires lors des exports
- **Fichiers** : `apps/api/src/services/reports/ExportService.ts`

### 10. `ARCHIVE_DIR`
- **Type** : String
- **Description** : Répertoire pour les archives
- **Valeur par défaut** : `{process.cwd()}/archives`
- **Utilisation** : Archivage des rapports
- **Fichiers** : `apps/api/src/services/reports/ArchiveService.ts`

### 11. `ARCHIVE_RETENTION_YEARS`
- **Type** : Number
- **Description** : Nombre d'années de rétention des archives
- **Valeur par défaut** : `7`
- **Utilisation** : Politique de rétention des archives
- **Fichiers** : `apps/api/src/services/reports/ArchiveService.ts`

### 12. `ARCHIVE_COMPRESSION`
- **Type** : Boolean (String)
- **Description** : Activer la compression des archives
- **Valeur par défaut** : `false`
- **Valeurs** : `"true"` ou `"false"` (string)
- **Utilisation** : Compression des archives
- **Fichiers** : `apps/api/src/services/reports/ArchiveService.ts`

### 13. `TEST_DATABASE_URL`
- **Type** : String
- **Description** : URL de connexion à la base de données pour les tests
- **Valeur par défaut** : Utilise `DATABASE_URL` si non défini
- **Utilisation** : Tests d'intégration
- **Fichiers** : `apps/api/src/tests/reports/AnnualReports.integration.test.ts`

---

## 🌐 Variables Vercel (Automatiques)

Ces variables sont **automatiquement définies par Vercel** et ne doivent pas être configurées manuellement.

### 14. `VERCEL`
- **Type** : String
- **Description** : Indique que l'application tourne sur Vercel
- **Valeur** : `"1"` sur Vercel
- **Utilisation** : Détection de l'environnement Vercel
- **Fichiers** : 
  - `apps/api/src/server.ts`
  - `apps/api/src/config/export.ts`

### 15. `VERCEL_ENV`
- **Type** : String
- **Description** : Environnement Vercel
- **Valeurs possibles** : `production`, `preview`, `development`
- **Utilisation** : Affichage de détails d'erreur en preview/development
- **Fichiers** : `apps/api/src/index.ts`

### 16. `LAMBDA_TASK_ROOT`
- **Type** : String
- **Description** : Indique que l'application tourne dans un environnement serverless (AWS Lambda)
- **Utilisation** : Détection de l'environnement serverless
- **Fichiers** : `apps/api/src/server.ts`

---

## 📝 Configuration pour Vercel

### Variables à configurer dans le Dashboard Vercel

Allez dans **Settings** → **Environment Variables** et ajoutez :

#### Production (Requis)

```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
JWT_SECRET=votre-secret-jwt-super-securise-minimum-128-caracteres
```

#### Production (Recommandé)

```bash
JWT_REFRESH_SECRET=votre-secret-refresh-jwt-different-minimum-128-caracteres
CORS_ORIGIN=https://www.scolarflow.com
CSRF_SECRET=votre-secret-csrf-optionnel
```

#### Optionnel (Production)

```bash
EXPORT_DIR=/tmp/exports
TEMP_DIR=/tmp/temp
ARCHIVE_DIR=/tmp/archives
ARCHIVE_RETENTION_YEARS=7
ARCHIVE_COMPRESSION=true
```

---

## 🔧 Configuration pour Développement Local

Créez un fichier `.env` dans `apps/api/` avec :

```bash
# Base de données
DATABASE_URL=postgresql://postgres:password@localhost:5432/edustats_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-128-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production-128-chars-minimum

# CORS
CORS_ORIGIN=http://localhost:3000

# Port (uniquement pour développement local)
PORT=3001

# Environnement
NODE_ENV=development

# Répertoires (optionnel)
EXPORT_DIR=./exports
TEMP_DIR=./temp
ARCHIVE_DIR=./archives
ARCHIVE_RETENTION_YEARS=7
ARCHIVE_COMPRESSION=false
```

---

## 🎯 Priorités par Environnement

### Production (Vercel)

**Obligatoires :**
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`

**Fortement Recommandées :**
- ✅ `JWT_REFRESH_SECRET`
- ✅ `CORS_ORIGIN`

**Optionnelles :**
- `CSRF_SECRET`
- `EXPORT_DIR`
- `TEMP_DIR`
- `ARCHIVE_DIR`
- `ARCHIVE_RETENTION_YEARS`
- `ARCHIVE_COMPRESSION`

### Développement Local

**Obligatoires :**
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`

**Recommandées :**
- `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `PORT`
- `NODE_ENV`

**Optionnelles :**
- Toutes les autres variables

---

## ⚠️ Notes de Sécurité

1. **Ne jamais commiter** les fichiers `.env` dans Git
2. **Utiliser des secrets forts** pour `JWT_SECRET` et `JWT_REFRESH_SECRET` (minimum 128 caractères)
3. **Utiliser des secrets différents** pour chaque environnement (dev, preview, production)
4. **Vérifier les permissions** de la base de données PostgreSQL
5. **Configurer CORS** correctement pour limiter les origines autorisées
6. **Utiliser HTTPS** en production (Vercel le gère automatiquement)

---

## 🔍 Vérification des Variables

### Dans le code

Le fichier `apps/api/src/index.ts` vérifie automatiquement les variables requises :

```typescript
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['JWT_SECRET', 'CORS_ORIGIN', 'NODE_ENV'];
```

### Logs Vercel

Les logs Vercel affichent :
- ✅ Variables d'environnement requises présentes
- ❌ Variables d'environnement manquantes (avec liste)
- 📋 Nombre de variables détectées

---

## 📚 Références

- **Fichier de configuration exemple** : `apps/api/config.example`
- **Configuration JWT** : `apps/api/src/config/jwt.ts`
- **Configuration sécurité** : `apps/api/src/config/security.ts`
- **Vérification variables** : `apps/api/src/index.ts`

---

## 🆘 Résolution de Problèmes

### Erreur : `DATABASE_URL is not set`

**Solution** : Ajouter `DATABASE_URL` dans les variables d'environnement Vercel

### Erreur : `JWT_SECRET is not set`

**Solution** : Ajouter `JWT_SECRET` dans les variables d'environnement Vercel

### Erreur CORS : `Access-Control-Allow-Origin`

**Solution** : Configurer `CORS_ORIGIN` avec l'URL exacte du frontend (ex: `https://www.scolarflow.com`)

### Erreur : `Cannot connect to database`

**Solution** : 
1. Vérifier que `DATABASE_URL` est correcte
2. Vérifier que le firewall de la base de données autorise les connexions depuis Vercel
3. Vérifier que `sslmode=require` est présent dans l'URL

