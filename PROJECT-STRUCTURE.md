# 📁 Structure du Projet EduStats

## 🏗️ Architecture Générale

```
EduStats/                           # Monorepo racine
├── 📱 apps/                        # Applications
│   ├── 🌐 web/                     # Frontend React
│   └── 🔗 api/                     # Backend Express
├── 📦 packages/                    # Packages partagés
│   └── 🔗 shared/                  # Types TypeScript communs
├── 🗄️ database-setup.sql           # Script création BDD
├── 🔧 Scripts PowerShell/          # Scripts d'administration
└── 📚 Documentation/               # README et guides
```

## 🌐 Frontend (apps/web/)

### Structure React + Vite
```
apps/web/
├── 📄 package.json                 # Dépendances frontend
├── ⚡ vite.config.ts               # Configuration Vite
├── 🎨 tailwind.config.js           # Configuration TailwindCSS
├── 📝 env.example                  # Variables d'environnement
└── 📁 src/
    ├── 🎯 App.tsx                  # Composant principal + Router
    ├── 🎨 index.css                # Styles TailwindCSS
    ├── 📁 components/              # Composants réutilisables
    │   └── Navbar.tsx              # Navigation principale
    ├── 📁 pages/                   # Pages de l'application
    │   ├── HomePage.tsx            # Page d'accueil
    │   ├── DashboardPage.tsx       # Tableau de bord
    │   ├── ClassesPage.tsx         # Gestion des classes
    │   ├── StudentsPage.tsx        # Gestion des élèves
    │   └── EvaluationsPage.tsx     # Gestion des évaluations
    ├── 📁 hooks/                   # Hooks personnalisés
    ├── 📁 services/                # Services API
    ├── 📁 types/                   # Types TypeScript
    └── 📁 utils/                   # Utilitaires
```

### Technologies Frontend
- **React 18** - Framework UI moderne
- **Vite** - Bundler ultra-rapide avec HMR
- **TailwindCSS** - Framework CSS utility-first
- **React Router** - Navigation SPA
- **Headless UI** - Composants accessibles
- **Heroicons** - Icônes SVG

## 🔗 Backend (apps/api/)

### Structure Express + TypeScript
```
apps/api/
├── 📄 package.json                 # Dépendances backend
├── 🔧 tsconfig.json                # Configuration TypeScript
├── 📝 config.example               # Variables d'environnement
├── 📁 prisma/                      # Configuration ORM
│   ├── schema.prisma               # Schéma de base de données
│   └── seed.ts                     # Données de test
└── 📁 src/
    ├── 🚀 server.ts                # Point d'entrée serveur
    ├── 📁 controllers/             # Logique métier
    ├── 📁 routes/                  # Définition des routes
    │   ├── health.ts               # Health check
    │   ├── auth.ts                 # Authentification
    │   └── classes.ts              # Gestion des classes
    ├── 📁 services/                # Services business
    ├── 📁 middleware/              # Middleware Express
    └── 📁 types/                   # Types TypeScript
```

### Technologies Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web minimaliste
- **TypeScript** - JavaScript typé
- **Prisma** - ORM moderne type-safe
- **PostgreSQL** - Base de données relationnelle
- **bcryptjs** - Hachage des mots de passe
- **jsonwebtoken** - Authentification JWT
- **Zod** - Validation des schémas
- **Helmet** - Sécurité HTTP
- **CORS** - Cross-Origin Resource Sharing

## 📦 Package Partagé (packages/shared/)

### Types TypeScript Communs
```
packages/shared/
├── 📄 package.json                 # Configuration package
├── 🔧 tsconfig.json                # Configuration TypeScript
└── 📁 src/
    ├── index.ts                    # Exports principaux
    └── 📁 types/
        └── index.ts                # Définitions TypeScript
```

### Types Définis
- **User** - Enseignants/Utilisateurs
- **Class** - Classes scolaires
- **Student** - Élèves
- **Evaluation** - Évaluations/Contrôles
- **EvaluationResult** - Résultats
- **ApiResponse** - Réponses API standardisées

## 🗄️ Base de Données PostgreSQL

### Schéma Complet (8 Tables)
```sql
📊 users                    # Enseignants/Utilisateurs
├── id, email, password_hash
├── first_name, last_name
├── phone, establishment
└── is_active, timestamps

📚 classes                  # Classes scolaires
├── id, user_id, name, level
├── academic_year, student_count
├── description, is_active
└── timestamps

👥 students                 # Élèves
├── id, class_id, first_name, last_name
├── date_of_birth, gender, student_number
├── parent_contact, address, notes
└── is_active, timestamps

📝 evaluations              # Évaluations/Contrôles
├── id, class_id, title, subject, type
├── max_score, coefficient
├── evaluation_date, description
└── is_finalized, timestamps

📊 evaluation_results       # Résultats d'évaluations
├── id, evaluation_id, student_id
├── score, is_absent, notes
└── timestamps

⚙️ statistics_config       # Configuration statistiques
├── id, user_id, name
├── config_data (JSONB)
└── is_default, timestamps

📋 custom_tables           # Tables personnalisées
├── id, user_id, class_id, name
├── table_config, table_data (JSONB)
└── is_template, timestamps

📈 annual_reports          # Rapports annuels
├── id, class_id, academic_year
├── report_data (JSONB)
└── timestamps
```

## 🔧 Scripts d'Administration

### Scripts PowerShell
```
📁 Scripts/
├── 🔍 check-setup.ps1             # Validation installation
├── 🗄️ setup-database.ps1          # Configuration PostgreSQL
├── 🚀 start-edustats.ps1          # Démarrage complet
└── 🧹 clean-project.ps1           # Nettoyage projet
```

### Scripts pnpm
```json
{
  "dev": "turbo run dev",           // Développement complet
  "api": "cd apps/api && pnpm dev", // Backend seulement
  "web": "cd apps/web && pnpm dev", // Frontend seulement
  "build": "turbo run build",       // Build production
  "db:setup": "prisma generate + push", // Setup BDD
  "db:seed": "prisma db seed"       // Données de test
}
```

## 🌍 Ports et URLs

### Développement
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **DB Status**: http://localhost:3001/api/db-status

### Base de Données
- **Host**: localhost:5432
- **Database**: edustats_db
- **User**: postgres

## 📚 Documentation

### Fichiers de Documentation
```
📁 Docs/
├── 📖 README.md                    # Guide principal
├── 🎉 INSTALL-SUCCESS.md           # Guide post-installation
├── 📁 PROJECT-STRUCTURE.md         # Ce fichier
└── 🗄️ database-setup.sql           # Script SQL complet
```

## 🔄 Workflow de Développement

### 1. Installation
```bash
pnpm install                        # Installer dépendances
.\check-setup.ps1                   # Valider installation
```

### 2. Configuration
```bash
.\setup-database.ps1                # Configurer PostgreSQL
copy config.example .env            # Variables d'environnement
```

### 3. Développement
```bash
.\start-edustats.ps1                # Démarrer tout
# ou
pnpm dev                           # Turborepo mode
```

### 4. Validation
```bash
curl http://localhost:3001/api/health   # Test backend
# Ouvrir http://localhost:3000          # Test frontend
```

## 🎯 Points d'Extension (Phase 2)

### Backend
- **Authentification JWT** complète
- **CRUD** pour tous les modèles
- **Validation** avancée des données
- **API REST** complète
- **Gestion des fichiers** (upload/download)

### Frontend
- **Formulaires** de création/édition
- **Tableaux de données** avec pagination
- **Graphiques** et statistiques
- **Interface responsive** mobile
- **Thèmes** et personnalisation

### Base de Données
- **Migrations** Prisma
- **Optimisations** de performance
- **Backup/Restore** automatique
- **Monitoring** et logs

---

🎊 **Architecture EduStats Phase 1 Complète !**

Cette structure modulaire et scalable est prête pour le développement des fonctionnalités métier avancées.
