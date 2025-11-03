# Guide du stockage binaire des captures d'écran

## Vue d'ensemble

La table `paiements` utilise maintenant le stockage binaire (BYTEA) pour les captures d'écran au lieu du stockage de fichiers. Cette approche offre plusieurs avantages en termes de sécurité, intégrité et simplicité de gestion.

## Structure de la table

```sql
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_paiement TIMESTAMP DEFAULT NOW(),
    is_paid BOOLEAN DEFAULT false,
    screenshot BYTEA,                    -- Données binaires de l'image
    screenshot_type VARCHAR(50),         -- Type MIME (image/jpeg, image/png, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Types de données

### Avant (stockage de fichiers)
```typescript
// ❌ Ancienne approche
screenshot: String?  // Chemin vers le fichier
// Exemple: "uploads/payments/1_20250124_143022.jpg"
```

### Maintenant (stockage binaire)
```typescript
// ✅ Nouvelle approche
screenshot: Bytes?        // Données binaires de l'image
screenshotType: String?  // Type MIME de l'image
// Exemple: Buffer + "image/jpeg"
```

## Avantages du stockage binaire

### ✅ Sécurité
- **Pas de fichiers externes** : Les images sont stockées dans la base de données
- **Pas de risque de fichiers orphelins** : Suppression automatique avec les paiements
- **Contrôle d'accès** : Géré par la base de données

### ✅ Intégrité
- **Transaction atomique** : Sauvegarde avec les autres données du paiement
- **Pas de corruption** : Intégrité garantie par PostgreSQL
- **Sauvegarde automatique** : Incluse dans les sauvegardes de la DB

### ✅ Simplicité
- **Pas de gestion de fichiers** : Plus besoin de gérer les répertoires
- **Pas de nettoyage manuel** : Suppression automatique
- **Déploiement simplifié** : Pas de gestion des permissions de fichiers

## Exemples d'utilisation

### 1. Sauvegarder une capture d'écran

```typescript
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lire le fichier image
const imageBuffer = fs.readFileSync('./screenshot.jpg');

// Sauvegarder dans la base
const paiement = await prisma.paiement.create({
  data: {
    userId: 1,
    screenshot: imageBuffer,
    screenshotType: 'image/jpeg',
    isPaid: false
  }
});
```

### 2. Récupérer une capture d'écran

```typescript
// Récupérer le paiement avec l'image
const paiement = await prisma.paiement.findUnique({
  where: { id: 1 },
  select: {
    id: true,
    screenshot: true,
    screenshotType: true,
    isPaid: true
  }
});

if (paiement?.screenshot) {
  // Convertir en base64 pour l'affichage
  const base64 = paiement.screenshot.toString('base64');
  const dataUrl = `data:${paiement.screenshotType};base64,${base64}`;
  
  // Utiliser dataUrl dans une balise <img>
  console.log('Image prête pour l\'affichage:', dataUrl);
}
```

### 3. Upload direct depuis un formulaire

```typescript
// Dans un endpoint Express
app.post('/api/paiements/upload', async (req, res) => {
  try {
    const { userId, imageBuffer, mimeType } = req.body;
    
    const paiement = await prisma.paiement.create({
      data: {
        userId: parseInt(userId),
        screenshot: Buffer.from(imageBuffer, 'base64'),
        screenshotType: mimeType,
        isPaid: false
      }
    });
    
    res.json({ success: true, paiementId: paiement.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Types MIME supportés

| Extension | Type MIME | Description |
|-----------|-----------|-------------|
| .jpg, .jpeg | `image/jpeg` | Images JPEG |
| .png | `image/png` | Images PNG |
| .gif | `image/gif` | Images GIF |
| .webp | `image/webp` | Images WebP |

## Gestion des performances

### Optimisation de la taille
```typescript
// Compression avant sauvegarde
import sharp from 'sharp';

const optimizedBuffer = await sharp(imageBuffer)
  .resize(800, 600, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();

await prisma.paiement.create({
  data: {
    userId: 1,
    screenshot: optimizedBuffer,
    screenshotType: 'image/jpeg'
  }
});
```

### Requêtes optimisées
```typescript
// Ne pas récupérer l'image si pas nécessaire
const paiements = await prisma.paiement.findMany({
  select: {
    id: true,
    userId: true,
    isPaid: true,
    screenshotType: true,
    // Ne pas inclure 'screenshot' pour économiser la bande passante
  }
});

// Récupérer l'image seulement quand nécessaire
const paiement = await prisma.paiement.findUnique({
  where: { id: 1 },
  select: { screenshot: true, screenshotType: true }
});
```

## Migration depuis le stockage de fichiers

Si vous migrez depuis un système de stockage de fichiers :

```typescript
// Script de migration
async function migrateFromFileStorage() {
  const paiements = await prisma.paiement.findMany({
    where: { screenshot: { not: null } }
  });
  
  for (const paiement of paiements) {
    if (typeof paiement.screenshot === 'string') {
      // Ancien chemin de fichier
      const filePath = paiement.screenshot;
      
      if (fs.existsSync(filePath)) {
        // Lire le fichier
        const imageBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        
        // Mettre à jour avec les données binaires
        await prisma.paiement.update({
          where: { id: paiement.id },
          data: {
            screenshot: imageBuffer,
            screenshotType: mimeType
          }
        });
        
        // Supprimer le fichier
        fs.unlinkSync(filePath);
      }
    }
  }
}
```

## Bonnes pratiques

1. **Validation des types MIME** : Vérifier le type avant sauvegarde
2. **Limitation de la taille** : Imposer une taille maximale (ex: 5MB)
3. **Compression** : Optimiser les images avant sauvegarde
4. **Requêtes sélectives** : Ne pas récupérer l'image si pas nécessaire
5. **Cache** : Mettre en cache les images fréquemment consultées

## Conclusion

Le stockage binaire des captures d'écran offre une solution robuste et sécurisée pour gérer les preuves de paiement. Cette approche élimine les problèmes de gestion de fichiers tout en garantissant l'intégrité des données.
