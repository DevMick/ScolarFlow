# 🧪 Script de Test et Push Automatique

Ce script permet de tester tous les builds avant de push sur GitHub, garantissant que tout fonctionne avant de déployer.

## 📋 Utilisation

### Windows (PowerShell)
```powershell
.\test-and-push.ps1 [message de commit]
```

### Exemples
```powershell
# Avec message de commit par défaut
.\test-and-push.ps1

# Avec message personnalisé
.\test-and-push.ps1 "fix: corriger les dépendances antd"
```

## ✅ Ce que fait le script

1. **Vérifie la version pnpm**
   - Vérifie que pnpm est installé
   - Vérifie que la version est >= 8.0.0
   - Installe pnpm 8.12.0 si nécessaire

2. **Vérifie les changements Git**
   - Détecte les fichiers modifiés
   - Affiche les changements

3. **Teste le build @edustats/shared**
   - Construit le package shared
   - Vérifie qu'il n'y a pas d'erreurs

4. **Teste le build API**
   - Installe les dépendances
   - Construit l'API
   - Vérifie qu'il n'y a pas d'erreurs

5. **Teste le build Web**
   - Installe les dépendances
   - Construit le Web
   - Vérifie qu'il n'y a pas d'erreurs

6. **Commit et Push (si confirmation)**
   - Ajoute tous les fichiers
   - Crée un commit avec le message
   - Push sur GitHub

## 🚨 Points importants

- Le script **arrête** si une erreur est détectée
- Vous devez **confirmer** avant de push sur GitHub
- Tous les builds doivent **passer** avant de pouvoir push

## 📝 Workflow recommandé

1. **Faire vos modifications**
   ```powershell
   # Modifier les fichiers
   # ...
   ```

2. **Tester avant de push**
   ```powershell
   .\test-and-push.ps1 "fix: description des changements"
   ```

3. **Si tout passe, le script propose de push**
   - Tapez `O` pour confirmer
   - Tapez `N` pour annuler

## 🔧 Résolution de problèmes

### Erreur : "pnpm n'est pas installé"
```powershell
npm install -g pnpm@8.12.0
```

### Erreur : "Échec du build"
- Vérifiez les erreurs affichées
- Corrigez les erreurs
- Relancez le script

### Erreur : "Échec du push"
- Vérifiez votre connexion internet
- Vérifiez vos permissions GitHub
- Vérifiez que vous êtes sur la bonne branche

## 📌 Note

Le script est maintenant disponible et fonctionne correctement. Il détecte bien les erreurs avant de push, ce qui évite de push du code cassé sur GitHub.

