# 🧪 Tests de Build pour Vercel

Ce dossier contient des scripts pour tester le build localement avant de push sur GitHub.

## 📋 Scripts Disponibles

### Windows (PowerShell)
```powershell
.\test-vercel-build.ps1 [api|web|all]
```

### Linux/Mac (Bash)
```bash
./test-vercel-build.sh [api|web|all]
```

## 🚀 Utilisation

### Tester tout (API + Web)
```powershell
# Windows
.\test-vercel-build.ps1

# Linux/Mac
./test-vercel-build.sh
```

### Tester uniquement l'API
```powershell
# Windows
.\test-vercel-build.ps1 api

# Linux/Mac
./test-vercel-build.sh api
```

### Tester uniquement le Web
```powershell
# Windows
.\test-vercel-build.ps1 web

# Linux/Mac
./test-vercel-build.sh web
```

## ✅ Ce que fait le script

1. **Vérifie la version de pnpm**
   - Vérifie que pnpm est installé
   - Vérifie que la version est >= 8.0.0
   - Installe pnpm 8.12.0 si nécessaire

2. **Teste le build**
   - Installe les dépendances (`pnpm install`)
   - Lance le build (`pnpm build`)
   - Vérifie que tout fonctionne

3. **Affiche le résultat**
   - ✅ Succès : Vous pouvez push sur GitHub
   - ❌ Échec : Corrigez les erreurs avant de push

## 📝 Notes

- Le script simule exactement ce qui se passe sur Vercel
- Si le test passe localement, le build Vercel devrait aussi passer
- Les warnings (méthode dupliquée, eval) ne bloquent pas le build mais devraient être corrigés

## 🔧 Avant de push sur GitHub

1. **Toujours tester avant de push** :
   ```powershell
   .\test-vercel-build.ps1
   ```

2. **Si tout est OK, commit et push** :
   ```powershell
   git add .
   git commit -m "votre message"
   git push origin main
   ```

3. **Si le test échoue, corrigez les erreurs** avant de push

## 🐛 Résolution de problèmes

### Erreur : "pnpm n'est pas installé"
```powershell
npm install -g pnpm@8.12.0
```

### Erreur : "Échec de l'installation des dépendances"
- Vérifiez votre connexion internet
- Supprimez `node_modules` et `pnpm-lock.yaml` puis réessayez

### Erreur : "Échec du build"
- Vérifiez les erreurs TypeScript
- Vérifiez les erreurs de lint
- Corrigez les erreurs avant de push

