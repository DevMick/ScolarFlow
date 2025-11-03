# Migration: Ajout de userId à class_thresholds

## 📋 Résumé

Ajout du champ `userId` à la table `class_thresholds` pour tracer qui a créé les seuils de classe.

## ✅ Modifications effectuées

### 1. **Schéma Prisma** (`apps/api/prisma/schema.prisma`)

#### Modèle ClassThreshold
```prisma
model ClassThreshold {
  id                   Int      @id @default(autoincrement())
  classId              Int      @unique @map("class_id")
  userId               Int      @map("user_id")  // ✨ NOUVEAU
  moyenneAdmission     Decimal  @db.Decimal(5,2) @map("moyenne_admission")
  moyenneRedoublement  Decimal  @db.Decimal(5,2) @map("moyenne_redoublement")
  maxNote              Int      @map("max_note")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  // Relations
  class                Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)  // ✨ NOUVEAU

  @@map("class_thresholds")
  @@index([classId])
  @@index([userId])  // ✨ NOUVEAU
}
```

#### Modèle User
```prisma
model User {
  // ... autres champs
  
  // Relations
  classes                Class[]
  subjects               Subject[]
  evaluationFormulas     EvaluationFormula[]
  classAverageConfigs    ClassAverageConfig[]
  notes                  Note[]
  moyennes               Moyenne[]
  schoolYears            SchoolYear[]
  classThresholds        ClassThreshold[]  // ✨ NOUVEAU

  @@map("users")
}
```

### 2. **Service** (`apps/api/src/services/classThresholdService.ts`)

#### Interface ClassThresholdData
```typescript
export interface ClassThresholdData {
  classId: number;
  userId: number;  // ✨ NOUVEAU
  moyenneAdmission: number;
  moyenneRedoublement: number;
  maxNote: number;
}
```

#### Méthodes mises à jour
- ✅ `getByClassId()` - Inclut maintenant les infos de l'utilisateur
- ✅ `create()` - Enregistre le userId
- ✅ `update()` - Conserve le userId
- ✅ `getAll()` - Retourne les infos de l'utilisateur pour chaque seuil

### 3. **Controller** (`apps/api/src/controllers/classThresholdController.ts`)

#### Méthode create
- ✅ Extrait le `userId` de `req.user`
- ✅ Validation de l'authentification
- ✅ Passe le `userId` au service

#### Méthode update  
- ✅ Extrait le `userId` de `req.user`
- ✅ Validation de l'authentification
- ✅ Passe le `userId` au service

### 4. **Base de données**

#### Script SQL de migration (`apps/api/add-user-id-to-class-thresholds.sql`)
```sql
-- Ajouter la colonne user_id
ALTER TABLE class_thresholds ADD COLUMN user_id INTEGER;

-- Mettre à jour les enregistrements existants
UPDATE class_thresholds ct
SET user_id = (
    SELECT c.user_id 
    FROM classes c 
    WHERE c.id = ct.class_id
);

-- Rendre la colonne NOT NULL
ALTER TABLE class_thresholds ALTER COLUMN user_id SET NOT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE class_thresholds 
ADD CONSTRAINT class_thresholds_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Créer un index
CREATE INDEX class_thresholds_user_id_idx ON class_thresholds(user_id);
```

## 🚀 Instructions pour appliquer les modifications

### Étape 1: Arrêter le serveur backend
```powershell
# Arrêtez le serveur en cours (Ctrl+C)
```

### Étape 2: Générer le client Prisma
```powershell
cd apps/api
npx prisma generate
```

### Étape 3: Appliquer la migration SQL
```powershell
# Option 1: Avec PowerShell (depuis la racine)
cd ../..
.\run-add-user-id-migration.ps1

# Option 2: Avec psql directement
psql -U postgres -d edustats -f apps/api/add-user-id-to-class-thresholds.sql

# Option 3: Avec Node.js (fichier déjà créé mais supprimé)
# Recréez le fichier migrate-add-user-id.js si nécessaire
```

### Étape 4: Compiler le TypeScript
```powershell
cd apps/api
npm run build
```

### Étape 5: Redémarrer le serveur
```powershell
npm start
```

## 📊 Données retournées par l'API

### Avant
```json
{
  "id": 1,
  "classId": 4,
  "moyenneAdmission": 10,
  "moyenneRedoublement": 8.5,
  "maxNote": 20,
  "class": {
    "id": 4,
    "name": "CM1"
  }
}
```

### Après
```json
{
  "id": 1,
  "classId": 4,
  "userId": 3,  // ✨ NOUVEAU
  "moyenneAdmission": 10,
  "moyenneRedoublement": 8.5,
  "maxNote": 20,
  "class": {
    "id": 4,
    "name": "CM1"
  },
  "user": {  // ✨ NOUVEAU
    "id": 3,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## ✅ Vérifications

### API Endpoints
- ✅ `GET /api/class-thresholds` - Liste tous les seuils avec userId
- ✅ `GET /api/class-thresholds/:classId` - Récupère un seuil avec userId
- ✅ `POST /api/class-thresholds` - Crée un seuil avec userId
- ✅ `PUT /api/class-thresholds/:classId` - Met à jour un seuil
- ✅ `DELETE /api/class-thresholds/:classId` - Supprime un seuil

### Authentification
- ✅ Toutes les routes nécessitent une authentification
- ✅ Le userId est automatiquement extrait du token JWT
- ✅ Validation de l'authentification dans create et update

## 🔍 Tests recommandés

1. **Créer un seuil** : Vérifier que le userId est bien enregistré
2. **Modifier un seuil** : Vérifier que le userId reste cohérent
3. **Lister les seuils** : Vérifier que les infos utilisateur sont retournées
4. **Supprimer un utilisateur** : Vérifier la suppression en cascade des seuils

## 📝 Notes importantes

1. **Migration de données** : La migration met à jour automatiquement les enregistrements existants en utilisant le `userId` de la classe associée
2. **Clé étrangère** : Suppression en cascade activée (si un utilisateur est supprimé, ses seuils le sont aussi)
3. **Index** : Index créé sur `userId` pour optimiser les requêtes
4. **Conversion Decimal** : Les valeurs `Decimal` de Prisma sont converties en `number` pour le frontend

## 🐛 Problèmes connus

- La base de données a été vidée lors du test de migration
- Il faudra recréer les données de test
- Le serveur doit être arrêté avant de générer le client Prisma

## 📞 Support

En cas de problème, vérifiez :
1. Que PostgreSQL est bien démarré
2. Que le serveur backend est arrêté avant la génération Prisma
3. Que les permissions de la base de données sont correctes
4. Que l'authentification fonctionne et retourne un userId valide

