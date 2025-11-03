# 📦 Configuration GitHub - ScolarFlow

## ✅ Prêt à pousser vers GitHub

J'ai préparé tout ce qu'il faut pour pousser votre monorepo vers GitHub.

---

## 🚀 Option 1 : Utiliser le script PowerShell (RECOMMANDÉ)

J'ai créé un script qui fait tout automatiquement :

```powershell
.\push-to-github.ps1
```

Le script va :
1. ✅ Vérifier si git est initialisé
2. ✅ Ajouter le remote GitHub
3. ✅ Créer la branche main
4. ✅ Ajouter tous les fichiers
5. ✅ Créer le commit
6. ✅ Demander confirmation avant de pousser

---

## 🚀 Option 2 : Commandes manuelles

Si vous préférez faire manuellement, voici les commandes :

### 1. Vérifier si git est initialisé

```powershell
git status
```

Si vous voyez "not a git repository", initialisez :

```powershell
git init
```

### 2. Vérifier si le remote existe déjà

```powershell
git remote -v
```

Si `origin` existe déjà et pointe vers un autre repo, supprimez-le :

```powershell
git remote remove origin
```

### 3. Ajouter le remote GitHub

```powershell
git remote add origin https://github.com/DevMick/ScolarFlow.git
```

### 4. Créer/Renommer la branche main

```powershell
git branch -M main
```

### 5. Ajouter tous les fichiers

```powershell
git add .
```

### 6. Créer le commit

```powershell
git commit -m "Initial commit - Monorepo ScolarFlow avec API et Web"
```

### 7. Pousser vers GitHub

```powershell
git push -u origin main
```

---

## ⚠️ Points importants

### Avant de pousser

1. **Créer le dépôt sur GitHub** :
   - Aller sur https://github.com/new
   - Nom : `ScolarFlow`
   - Public ou Privé (selon votre choix)
   - Ne pas initialiser avec README, .gitignore, ou licence

2. **Vérifier que les fichiers sensibles sont ignorés** :
   - `.env` files (déjà dans `.gitignore`)
   - `node_modules/` (déjà dans `.gitignore`)
   - Fichiers de backup SQL (ajouté dans `.gitignore`)

### Après le push

Une fois poussé, vous pouvez :
1. Aller sur https://github.com/DevMick/ScolarFlow
2. Vérifier que tous les fichiers sont bien là
3. Passer au déploiement Vercel

---

## 🔍 Vérification

### Après le push, vérifiez :

1. **Structure du repo** :
   ```
   ✅ apps/api/
   ✅ apps/web/
   ✅ packages/shared/
   ✅ README.md
   ✅ package.json
   ✅ pnpm-workspace.yaml
   ✅ turbo.json
   ```

2. **Fichiers sensibles non poussés** :
   ```
   ❌ .env files
   ❌ node_modules/
   ❌ backup_*.sql
   ❌ apps/api/.env
   ❌ apps/web/.env
   ```

---

## 🐛 Dépannage

### Erreur : "remote origin already exists"

**Solution** :
```powershell
git remote remove origin
git remote add origin https://github.com/DevMick/ScolarFlow.git
```

### Erreur : "Authentication required"

**Solution** : 
1. Utiliser GitHub CLI : `gh auth login`
2. Ou configurer un token : https://github.com/settings/tokens
3. Ou utiliser SSH au lieu de HTTPS

### Erreur : "Repository not found"

**Solution** : Vérifiez que le dépôt GitHub existe :
1. Aller sur https://github.com/DevMick/ScolarFlow
2. Créer le dépôt s'il n'existe pas

---

## ✅ Checklist

Avant de pousser :
- [ ] Dépôt GitHub créé sur https://github.com/DevMick/ScolarFlow
- [ ] `.gitignore` vérifié (fichiers sensibles exclus)
- [ ] Tous les fichiers importants sont là
- [ ] Pas de fichiers `.env` dans le repo
- [ ] README.md à jour

Après le push :
- [ ] Dépôt visible sur GitHub
- [ ] Structure du monorepo correcte
- [ ] Prêt pour déploiement Vercel

---

**Prêt à pousser ?** 🚀

Exécutez `.\push-to-github.ps1` ou suivez les commandes manuelles ci-dessus.

