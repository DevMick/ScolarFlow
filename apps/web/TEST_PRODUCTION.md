# 🧪 Guide de Test Production Local

## Tests en Production Locale

Avant de pousser sur GitHub/Vercel, vous pouvez tester votre build de production localement.

### Option 1 : Utiliser Vite Preview (Recommandé)

```bash
# Depuis apps/web
cd apps/web

# Build puis preview
npm run build
npm run preview
```

Le serveur démarrera sur `http://localhost:4173` (par défaut).

### Option 2 : Utiliser le script de test

```bash
# Depuis apps/web
cd apps/web

# Build et preview en une commande
npm run test:prod
```

### Option 3 : Utiliser un serveur HTTP local

```bash
# Depuis apps/web
cd apps/web

# Build puis servir avec serve
npm run serve:prod

# Ou avec http-server
npm run build
npx http-server dist -p 3000
```

### Option 4 : Tester avec un serveur Python (si installé)

```bash
# Depuis apps/web
cd apps/web
npm run build

# Depuis le dossier dist
cd dist
python -m http.server 3000
```

## 🔍 Vérifications à Faire

1. **Ouvrir la console du navigateur (F12)**
   - Vérifier qu'il n'y a pas d'erreur `_interopRequireDefault`
   - Vérifier qu'il n'y a pas d'autres erreurs JavaScript

2. **Tester les fonctionnalités principales**
   - Navigation entre les pages
   - Authentification
   - Appels API
   - Fonctionnalités spécifiques de l'application

3. **Vérifier les performances**
   - Temps de chargement
   - Taille des bundles
   - Utilisation de la mémoire

## 📝 Scripts Disponibles

- `npm run build` - Build de production standard
- `npm run build:prod` - Build avec NODE_ENV=production explicite
- `npm run preview` - Prévisualiser le build (après `npm run build`)
- `npm run test:prod` - Build + preview en une commande
- `npm run serve:prod` - Build + serve avec serve (après installation)

## ⚠️ Notes

- Le preview de Vite utilise le même serveur que le dev, mais sert les fichiers buildés
- Les variables d'environnement `VITE_*` doivent être définies
- Les API calls utiliseront l'URL définie dans `VITE_API_URL` ou la valeur par défaut

