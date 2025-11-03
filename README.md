# 📊 EduStats - Phase 1

Application web moderne pour la gestion et l'analyse des évaluations scolaires.

## 🏗️ Architecture

### Monorepo Structure
```
edustats/
├── apps/
│   ├── web/                 # Frontend React + Vite + TailwindCSS
│   └── api/                 # Backend Express + TypeScript + Prisma
├── packages/
│   └── shared/              # Types TypeScript partagés
├── database-setup.sql       # Script de création BDD
├── setup-database.ps1       # Script PowerShell pour configurer PostgreSQL
├── start-edustats.ps1       # Script de démarrage complet
└── README.md
```

### Stack Technologique

**Backend (`apps/api`)**
- ⚡ Node.js + Express.js + TypeScript
- 🗄️ PostgreSQL 16 + Prisma ORM
- 🔐 JWT Authentication (préparé pour Phase 2)
- 🛡️ Sécurité: Helmet, CORS, Bcryptjs
- ✅ Validation: Zod

**Frontend (`apps/web`)**
- ⚛️ React 18 + TypeScript
- ⚡ Vite (Hot Reload ultra-rapide)
- 🎨 TailwindCSS + Headless UI
- 🧭 React Router v6
- 📡 Axios pour API calls

**DevOps & Tooling**
- 📦 pnpm Workspaces + Turborepo
- 🔧 ESLint + Prettier
- 🔄 Hot Reload frontend et backend

## 🚀 Installation & Démarrage

### Prérequis
- **Node.js 18+** 
- **pnpm 8+** (`npm install -g pnpm`)
- **PostgreSQL 16** avec connexion configurée

### Installation Rapide

1. **Cloner et installer les dépendances**
```bash
cd EduStats
pnpm install
```

2. **Configurer PostgreSQL**
```powershell
# Option 1: Script automatique (recommandé)
.\setup-database.ps1

# Option 2: Manuel
psql -h localhost -U postgres -f database-setup.sql
```

3. **Configuration de l'environnement**
```bash
# Copier les fichiers d'environnement
copy apps\api\config.example apps\api\.env
copy apps\web\env.example apps\web\.env
```

4. **Démarrer l'application**
```powershell
# Démarrage complet
.\start-edustats.ps1

# Ou avec pnpm
pnpm dev
```

### 🌐 Accès aux Services

- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **API Status**: http://localhost:3001/api/db-status

## 🔧 Configuration Base de Données

### 🚀 Base de Données Aiven (Production)
L'application utilise actuellement **Aiven** pour la base de données PostgreSQL en ligne.

**Paramètres de connexion Aiven :**
```bash
Host: pg-bb31155-allianceconsultants893-23db.h.aivencloud.com
Port: 17875
Database: defaultdb
Username: avnadmin
SSL Mode: require
```

La configuration est définie dans `apps/api/.env` :
```bash
DATABASE_URL="postgresql://avnadmin:VOTRE_MOT_DE_PASSE_AIVEN@pg-XXXXXX-allianceconsultants893-23db.h.aivencloud.com:17875/defaultdb?sslmode=require"
```

### 💻 Base de Données Locale (Développement)
Pour utiliser une base de données locale, modifiez `apps/api/.env` :
```bash
Host: localhost
Port: 5432
Database: edustats_db
Username: postgres
Password: DevMick@2003
```

### Tables Créées
- `users` - Enseignants/Utilisateurs
- `classes` - Classes scolaires
- `students` - Élèves
- `evaluations` - Évaluations/Contrôles
- `evaluation_results` - Résultats d'évaluations
- `statistics_config` - Configuration statistiques
- `custom_tables` - Tables personnalisées
- `annual_reports` - Rapports annuels

## 📋 Fonctionnalités Implémentées (Phase 1)

### ✅ Backend API
- [x] Serveur Express avec TypeScript
- [x] Connexion PostgreSQL + Prisma
- [x] Routes de base (health, auth, classes)
- [x] Middleware de sécurité
- [x] Validation Zod
- [x] Structure MVC organisée
- [x] Seed data pour développement

### ✅ Frontend React
- [x] Application React 18 + TypeScript
- [x] Interface moderne avec TailwindCSS
- [x] Navigation avec React Router
- [x] Pages principales (Accueil, Dashboard, Classes)
- [x] Composants réutilisables
- [x] Design responsive

### ✅ Infrastructure
- [x] Monorepo pnpm + Turborepo
- [x] Hot reload frontend et backend
- [x] Types TypeScript partagés
- [x] Scripts de développement
- [x] Configuration environnement

## 🛠️ Scripts de Développement

```bash
# Démarrage complet (frontend + backend)
pnpm dev

# Backend seulement
pnpm api

# Frontend seulement  
pnpm web

# Build de production
pnpm build

# Linting et formatage
pnpm lint
pnpm format

# Base de données
pnpm db:setup      # Générer client + push schema
pnpm db:seed       # Peupler avec données de test
```

## 🧪 Tests et Validation

### Vérification Backend
```bash
# Test de connexion
curl http://localhost:3001/api/health

# Test base de données
curl http://localhost:3001/api/db-status

# Test CORS
curl -H "Origin: http://localhost:3000" http://localhost:3001/api/health
```

### Vérification Frontend
1. Ouvrir http://localhost:3000
2. Naviguer entre les pages
3. Vérifier le responsive design
4. Tester le hot reload (modifier un fichier)

## 🗂️ Structure Détaillée

### Backend (`apps/api/`)
```
src/
├── controllers/     # Logique métier
├── routes/         # Définition des routes API
├── services/       # Services business
├── middleware/     # Middleware Express
├── types/          # Types TypeScript
└── server.ts       # Point d'entrée

prisma/
├── schema.prisma   # Schéma de base de données
└── seed.ts         # Données de test
```

### Frontend (`apps/web/`)
```
src/
├── components/     # Composants réutilisables
├── pages/          # Pages de l'application
├── hooks/          # Hooks personnalisés
├── types/          # Types TypeScript
├── utils/          # Utilitaires
├── services/       # Services API
└── App.tsx         # Composant principal
```

## 🔜 Prochaines Étapes (Phase 2)

- 🔐 **Authentification complète** (JWT, login, register)
- 👥 **Gestion des élèves** (CRUD, import/export)
- 📝 **Système d'évaluations** (création, saisie notes)
- 📊 **Tableaux de bord avancés** (graphiques, statistiques)
- 🎨 **Thèmes et personnalisation**
- 📱 **Optimisation mobile**

## 🆘 Dépannage

### Problèmes Courants

**PostgreSQL non trouvé**
```powershell
# Vérifier l'installation
Get-Service postgresql*

# Ajouter au PATH
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"
```

**Port déjà utilisé**
```bash
# Trouver le processus
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Arrêter le processus
taskkill /PID <PID> /F
```

**Erreurs Prisma**
```bash
cd apps/api
pnpm prisma generate
pnpm prisma db push
```

**Problèmes de dépendances**
```bash
# Nettoyer et réinstaller
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 📞 Support

Pour toute question ou problème:
1. Vérifier les logs dans la console
2. Consulter la section Dépannage
3. Vérifier que PostgreSQL est démarré
4. S'assurer que les ports 3000 et 3001 sont libres

---

**🎉 EduStats Phase 1 configuré avec succès !**

L'architecture est maintenant prête pour le développement des fonctionnalités avancées en Phase 2.
