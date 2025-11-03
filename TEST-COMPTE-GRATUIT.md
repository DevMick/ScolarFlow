# 🧪 Guide de Test - Fonctionnalité Compte Gratuit

## ✅ État actuel
- **API** : ✅ Démarrée sur http://localhost:3001
- **Frontend** : ✅ Démarré sur http://localhost:5173
- **Comptes de test** : ✅ Créés

## 🎯 Comptes de test disponibles

### 1. Compte actif (3 jours restants)
- **Email** : `test-trial@example.com`
- **Mot de passe** : `password123` (ou le mot de passe que vous avez défini)
- **Statut** : Expire dans 3 jours
- **Comportement attendu** :
  - Header affiche "Formule Démarrage - 3 jours restants" en jaune
  - Banner d'avertissement en haut de page
  - Accès complet à l'application

### 2. Compte expiré
- **Email** : `test-expired@example.com`
- **Mot de passe** : `password123` (ou le mot de passe que vous avez défini)
- **Statut** : Expiré
- **Comportement attendu** :
  - Header affiche "Formule Démarrage expirée" en rouge
  - Interface grisée avec overlay
  - Message d'upgrade vers Formule Pro

## 🚀 Comment tester

### 1. Accéder à l'application
```
http://localhost:5173
```

### 2. Se connecter avec le compte actif
1. Cliquer sur "Connexion"
2. Entrer : `test-trial@example.com`
3. Entrer le mot de passe
4. Cliquer sur "Se connecter"

### 3. Vérifier les fonctionnalités
- ✅ Header affiche le nombre de jours restants
- ✅ Banner d'avertissement visible (si ≤ 3 jours)
- ✅ Accès complet à l'application

### 4. Se connecter avec le compte expiré
1. Se déconnecter
2. Se reconnecter avec : `test-expired@example.com`
3. Vérifier l'interface grisée

## 🔍 Points de vérification

### Interface utilisateur
- [ ] Header affiche les jours restants au lieu du champ de recherche
- [ ] Couleurs dynamiques selon le statut (vert/jaune/rouge)
- [ ] Icône d'horloge dans le header
- [ ] Banner d'avertissement quand ≤ 3 jours
- [ ] Interface grisée quand expiré
- [ ] Message d'upgrade visible

### Fonctionnalités backend
- [ ] API répond sur http://localhost:3001
- [ ] Endpoint `/api/compte-gratuit/info` fonctionne
- [ ] Endpoint `/api/compte-gratuit/status` fonctionne
- [ ] Authentification requise pour les endpoints

### Comportements
- [ ] Compte actif : accès complet
- [ ] Compte expiré : restriction d'accès
- [ ] Messages d'avertissement appropriés
- [ ] Boutons d'upgrade fonctionnels

## 🐛 Dépannage

### Problème : "Erreur de connexion"
**Solution** : Vérifier que l'API est démarrée
```powershell
# Vérifier le port 3001
netstat -an | findstr :3001

# Redémarrer l'API si nécessaire
cd apps\api
npm run dev
```

### Problème : Frontend ne se charge pas
**Solution** : Vérifier que le frontend est démarré
```powershell
# Redémarrer le frontend
cd apps\web
npm run dev
```

### Problème : Comptes de test non créés
**Solution** : Recréer les comptes de test
```powershell
cd apps\api
node test-compte-gratuit.js
```

## 📊 Logs utiles

### API (Terminal où npm run dev est lancé)
- Messages de connexion à la base de données
- Erreurs d'authentification
- Requêtes vers les endpoints

### Frontend (Console du navigateur)
- Erreurs de connexion API
- État des hooks (useCompteGratuit)
- Messages d'authentification

## 🎉 Fonctionnalités implémentées

### Backend
- ✅ Service CompteGratuitService
- ✅ Contrôleur CompteGratuitController
- ✅ Routes API sécurisées
- ✅ Script de test des comptes

### Frontend
- ✅ Service frontend
- ✅ Hook useCompteGratuit
- ✅ Header modifié
- ✅ Banner d'avertissement
- ✅ Modal d'expiration
- ✅ Wrapper de restriction

### Interface utilisateur
- ✅ Affichage des jours restants
- ✅ Couleurs dynamiques
- ✅ Messages d'avertissement
- ✅ Interface de restriction
- ✅ Boutons d'upgrade

## 🔄 Prochaines étapes

1. **Tester tous les scénarios** avec les comptes créés
2. **Vérifier la responsivité** sur mobile
3. **Tester les cas limites** (0 jours, 1 jour, etc.)
4. **Implémenter la page d'upgrade** réelle
5. **Ajouter des tests automatisés**

---

**🎯 La fonctionnalité est prête pour les tests !**
