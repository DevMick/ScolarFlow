# 🆓 Fonctionnalité Compte Gratuit - Formule Démarrage

## 📋 Vue d'ensemble

Cette fonctionnalité implémente la gestion des comptes gratuits (Formule Démarrage) avec une période d'essai de 14 jours, incluant :

- ✅ Affichage du nombre de jours restants dans le header
- ✅ Restriction d'accès après expiration
- ✅ Messages d'avertissement et d'upgrade
- ✅ Interface utilisateur intuitive

## 🏗️ Architecture

### Backend (API)

#### 1. Service CompteGratuitService
- **Fichier**: `apps/api/src/services/compteGratuitService.ts`
- **Fonctionnalités**:
  - Vérification du statut actif du compte
  - Calcul des jours restants
  - Gestion de l'expiration automatique
  - Statistiques des comptes gratuits

#### 2. Contrôleur CompteGratuitController
- **Fichier**: `apps/api/src/controllers/compteGratuitController.ts`
- **Endpoints**:
  - `GET /api/compte-gratuit/info` - Informations du compte gratuit
  - `GET /api/compte-gratuit/status` - Statut actif/inactif
  - `GET /api/compte-gratuit/active` - Liste des comptes actifs (admin)
  - `GET /api/compte-gratuit/stats` - Statistiques (admin)

#### 3. Routes
- **Fichier**: `apps/api/src/routes/compteGratuit.ts`
- **Protection**: Toutes les routes nécessitent une authentification

### Frontend (Web)

#### 1. Service Frontend
- **Fichier**: `apps/web/src/services/compteGratuitService.ts`
- **Fonctionnalités**:
  - Appels API vers le backend
  - Gestion des erreurs
  - Types TypeScript

#### 2. Hook personnalisé
- **Fichier**: `apps/web/src/hooks/useCompteGratuit.ts`
- **Fonctionnalités**:
  - État réactif des informations du compte
  - Chargement automatique
  - Gestion des erreurs

#### 3. Composants UI

##### Header modifié
- **Fichier**: `apps/web/src/components/layout/Header.tsx`
- **Changements**:
  - Remplacement du champ de recherche par l'affichage des jours restants
  - Couleurs dynamiques selon le statut (vert/jaune/rouge)
  - Icône d'horloge

##### Banner d'avertissement
- **Fichier**: `apps/web/src/components/common/TrialWarningBanner.tsx`
- **Fonctionnalités**:
  - Affichage quand il reste ≤ 3 jours
  - Messages personnalisés selon les jours restants
  - Bouton d'upgrade
  - Possibilité de fermer

##### Modal d'expiration
- **Fichier**: `apps/web/src/components/common/TrialExpiredModal.tsx`
- **Fonctionnalités**:
  - Affichage quand le compte est expiré
  - Message d'upgrade vers Formule Pro
  - Boutons d'action

##### Wrapper de restriction
- **Fichier**: `apps/web/src/components/common/TrialRestrictionWrapper.tsx`
- **Fonctionnalités**:
  - Interface grisée quand expiré
  - Overlay avec message d'expiration
  - Boutons d'upgrade

## 🎨 Interface Utilisateur

### États visuels

#### 1. Compte actif (> 3 jours)
- **Header**: Badge vert avec nombre de jours
- **Banner**: Aucun
- **Accès**: Complet

#### 2. Compte actif (≤ 3 jours)
- **Header**: Badge jaune/rouge selon les jours
- **Banner**: Avertissement avec bouton d'upgrade
- **Accès**: Complet

#### 3. Compte expiré
- **Header**: Badge rouge "Formule Démarrage expirée"
- **Banner**: Aucun
- **Accès**: Restreint avec interface grisée
- **Overlay**: Message d'expiration et bouton d'upgrade

## 🧪 Tests

### Script de test
- **Fichier**: `apps/api/test-compte-gratuit.js`
- **Fonctionnalités**:
  - Création d'un compte qui expire dans 3 jours
  - Création d'un compte expiré
  - Affichage des informations

### Exécution des tests
```powershell
# Exécuter le script de test
.\test-compte-gratuit.ps1
```

## 🚀 Utilisation

### 1. Démarrer les serveurs
```bash
# Backend
cd apps/api
npm run dev

# Frontend
cd apps/web
npm run dev
```

### 2. Tester avec les comptes créés
- **Compte actif**: `test-trial@example.com` (expire dans 3 jours)
- **Compte expiré**: `test-expired@example.com` (expiré)

### 3. Comportements attendus

#### Compte actif (3 jours restants)
- Header affiche "Formule Démarrage - 3 jours restants" en jaune
- Banner d'avertissement en haut de page
- Accès complet à l'application

#### Compte expiré
- Header affiche "Formule Démarrage expirée" en rouge
- Interface grisée avec overlay
- Message d'upgrade vers Formule Pro

## 🔧 Configuration

### Base de données
La table `compte_gratuit` contient :
- `id`: Identifiant unique
- `user_id`: Référence vers l'utilisateur
- `date_debut`: Date de début de l'essai
- `date_fin`: Date de fin de l'essai (14 jours après)
- `is_active`: Statut actif/inactif

### Variables d'environnement
Aucune configuration supplémentaire requise.

## 📈 Évolutions futures

### Fonctionnalités à ajouter
1. **Page d'upgrade dédiée**
   - Comparaison des formules
   - Processus de paiement
   - Migration des données

2. **Gestion des abonnements**
   - Formule Pro (1 classe)
   - Formule Premium (multi-classes)
   - Facturation récurrente

3. **Analytics**
   - Taux de conversion
   - Temps d'utilisation
   - Points de friction

### Améliorations techniques
1. **Cache des informations**
   - Mise en cache des données du compte
   - Invalidation intelligente

2. **Notifications**
   - Emails d'avertissement
   - Notifications push
   - Rappels automatiques

3. **Tests automatisés**
   - Tests unitaires
   - Tests d'intégration
   - Tests E2E

## 🐛 Dépannage

### Problèmes courants

#### 1. Informations non affichées
- Vérifier que l'utilisateur a un compte gratuit
- Vérifier la connexion à la base de données
- Vérifier les logs de l'API

#### 2. Interface non grisée
- Vérifier que `isExpired` est `true`
- Vérifier que `TrialRestrictionWrapper` est bien intégré
- Vérifier les logs du frontend

#### 3. Erreurs API
- Vérifier que les routes sont bien enregistrées
- Vérifier l'authentification
- Vérifier les permissions

### Logs utiles
```bash
# Backend
tail -f apps/api/logs/app.log

# Frontend (console du navigateur)
# Vérifier les erreurs dans la console
```

## 📚 Documentation technique

### Types TypeScript
```typescript
interface CompteGratuitInfo {
  id: number;
  dateDebut: string;
  dateFin: string;
  isActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
  createdAt: string;
}
```

### API Endpoints
```
GET /api/compte-gratuit/info
Authorization: Bearer <token>
Response: CompteGratuitInfo

GET /api/compte-gratuit/status
Authorization: Bearer <token>
Response: { isActive: boolean }
```

## ✅ Checklist de déploiement

- [ ] Tables de base de données créées
- [ ] Routes API enregistrées
- [ ] Composants frontend intégrés
- [ ] Tests fonctionnels validés
- [ ] Documentation mise à jour
- [ ] Formation équipe effectuée

---

**🎉 Fonctionnalité prête pour la production !**
