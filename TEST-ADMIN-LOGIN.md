# Test de la Page de Connexion Admin

## 🎯 Objectif
Tester l'accès à la page de connexion admin et vérifier que tout fonctionne correctement.

## ✅ Étape 1 : Vérifier que l'API est démarrée

```bash
# Dans le terminal, aller dans le dossier API
cd apps/api
npm run dev
```

L'API doit être accessible sur `http://localhost:3001`

## ✅ Étape 2 : Vérifier que le frontend est démarré

```bash
# Dans un autre terminal, aller dans le dossier web
cd apps/web
npm run dev
```

Le frontend doit être accessible sur `http://localhost:3000`

## 🔑 Étape 3 : Tester la page de connexion admin

### URL d'accès
**Page de connexion admin :** `http://localhost:3000/admin/login`

### Données de connexion
- **Nom d'utilisateur :** `DevMick`
- **Mot de passe :** `DevMick@2003`

## 🎨 Interface de la page de connexion

### Fonctionnalités disponibles
- ✅ **Champs de connexion** : Nom d'utilisateur et mot de passe
- ✅ **Affichage du mot de passe** : Bouton pour voir/masquer
- ✅ **Informations de connexion** : Affichées directement sur la page
- ✅ **Gestion des erreurs** : Messages d'erreur clairs
- ✅ **Loading states** : Indicateurs de chargement
- ✅ **Design moderne** : Interface avec Tailwind CSS

### Design de la page
- **Header** : Logo et titre "Connexion Administrateur"
- **Formulaire** : Champs avec icônes
- **Bouton de connexion** : Avec état de chargement
- **Informations** : Credentials affichés en bas
- **Responsive** : Adapté mobile et desktop

## 🔄 Workflow de test

### 1. Accès à la page
1. Aller sur `http://localhost:3000/admin/login`
2. Vérifier que la page se charge correctement
3. Voir les informations de connexion affichées

### 2. Test de connexion
1. Saisir `DevMick` dans le champ nom d'utilisateur
2. Saisir `DevMick@2003` dans le champ mot de passe
3. Cliquer sur "Se connecter"
4. Vérifier l'indicateur de chargement
5. Être redirigé vers `/admin/payments`

### 3. Test d'erreur
1. Saisir des identifiants incorrects
2. Vérifier que le message d'erreur s'affiche
3. Tester avec les bons identifiants

## 🚨 Dépannage

### Problème : "Page non trouvée"
**Solution :** Vérifier que le frontend est démarré
```bash
cd apps/web
npm run dev
```

### Problème : "Erreur de connexion au serveur"
**Solution :** Vérifier que l'API est démarrée
```bash
cd apps/api
npm run dev
```

### Problème : "Nom d'utilisateur ou mot de passe incorrect"
**Solution :** Vérifier les identifiants
- Nom d'utilisateur : `DevMick`
- Mot de passe : `DevMick@2003`

### Problème : "Token invalide"
**Solution :** Se reconnecter sur `/admin/login`

## ✅ Résultat attendu

### Page de connexion
- ✅ **Interface moderne** et responsive
- ✅ **Champs fonctionnels** avec validation
- ✅ **Informations de connexion** visibles
- ✅ **Gestion des erreurs** appropriée

### Après connexion
- ✅ **Redirection automatique** vers `/admin/payments`
- ✅ **Token stocké** dans localStorage
- ✅ **Accès protégé** à l'administration
- ✅ **Interface d'administration** fonctionnelle

## 🎉 Test réussi

Si tout fonctionne correctement, vous devriez :
1. ✅ Accéder à la page de connexion
2. ✅ Vous connecter avec les identifiants
3. ✅ Être redirigé vers l'administration des paiements
4. ✅ Pouvoir gérer les paiements en toute sécurité

**L'administrateur DevMick est maintenant prêt à être utilisé !** 🚀
