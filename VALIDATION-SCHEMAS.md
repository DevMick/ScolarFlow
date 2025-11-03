# 🛡️ Schémas de Validation EduStats

## 📋 Vue d'ensemble

Le package `@edustats/shared` inclut maintenant un système complet de validation basé sur **Zod** pour garantir l'intégrité des données à travers toute l'application.

## 📂 Structure des Validations

```
packages/shared/src/validation/
├── auth.ts           # Validation authentification
├── class.ts          # Validation classes
├── student.ts        # Validation élèves
├── evaluation.ts     # Validation évaluations
└── index.ts          # Utilitaires communs
```

## 🔐 Validation Authentification (`auth.ts`)

### Schémas disponibles
- `registerSchema` - Inscription utilisateur
- `loginSchema` - Connexion utilisateur
- `updateProfileSchema` - Mise à jour profil
- `changePasswordSchema` - Changement mot de passe
- `resetPasswordSchema` - Réinitialisation mot de passe

### Exemple d'utilisation
```typescript
import { registerSchema, type RegisterValidationInput } from '@edustats/shared';

// Validation côté API
const result = registerSchema.safeParse(userData);
if (!result.success) {
  return res.status(400).json({ errors: result.error.errors });
}

// Type-safe data
const validData: RegisterValidationInput = result.data;
```

## 📚 Validation Classes (`class.ts`)

### Schémas disponibles
- `createClassSchema` - Création classe
- `updateClassSchema` - Mise à jour classe
- `classQuerySchema` - Filtres et pagination
- `bulkCreateClassesSchema` - Création en masse

### Niveaux autorisés
```typescript
const classLevels = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
```

### Règles de validation
- **Nom** : 1-100 caractères, obligatoire
- **Niveau** : Énumération stricte des niveaux scolaires
- **Année académique** : Format `YYYY-YYYY` (ex: 2024-2025)
- **Description** : Optionnelle, max 500 caractères

## 👥 Validation Élèves (`student.ts`)

### Schémas disponibles
- `createStudentSchema` - Création élève
- `updateStudentSchema` - Mise à jour élève
- `studentIdSchema` - Validation ID

### Règles spécifiques
- **Prénom/Nom** : Obligatoires, 1-100 caractères
- **Date de naissance** : Optionnelle, ne peut pas être dans le futur
- **Genre** : Énumération `'M' | 'F'`
- **Contact parent** : Optionnel, max 200 caractères

## 📝 Validation Évaluations (`evaluation.ts`)

### Schémas disponibles
- `createEvaluationSchema` - Création évaluation
- `updateEvaluationSchema` - Mise à jour évaluation
- `createEvaluationResultSchema` - Résultat d'évaluation
- `finalizeEvaluationSchema` - Finalisation évaluation

### Types d'évaluation
```typescript
const evaluationTypes = ['Controle', 'Devoir', 'Examen', 'Oral', 'TP'];
```

### Règles spécifiques
- **Note maximale** : Positive, max 100
- **Coefficient** : Positif, max 10
- **Score élève** : >= 0, obligatoire si non absent
- **Date** : Ne peut pas dépasser 1 an dans le futur

## 🔧 Utilitaires Communs (`index.ts`)

### Schémas génériques
- `paginationSchema` - Page et limite
- `sortSchema` - Tri des résultats
- `dateRangeSchema` - Plage de dates
- `searchSchema` - Recherche textuelle
- `fileUploadSchema` - Upload de fichiers

### Validation des réponses API
- `apiResponseSchema` - Réponse standard
- `errorResponseSchema` - Réponse d'erreur

## 🚀 Utilisation dans l'API

### Middleware de validation
```typescript
import { createClassSchema } from '@edustats/shared';
import { Request, Response, NextFunction } from 'express';

export const validateCreateClass = (req: Request, res: Response, next: NextFunction) => {
  const result = createClassSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: result.error.errors
    });
  }
  
  req.body = result.data; // Données validées et transformées
  next();
};
```

### Route avec validation
```typescript
import { validateCreateClass } from '../middleware/validation';

router.post('/classes', validateCreateClass, async (req, res) => {
  // req.body est maintenant type-safe et validé
  const classData = req.body; // Type: CreateClassValidationInput
  
  const newClass = await prisma.class.create({
    data: classData
  });
  
  res.json(newClass);
});
```

## 🌐 Utilisation dans le Frontend

### Validation côté client
```typescript
import { createClassSchema } from '@edustats/shared';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const CreateClassForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(createClassSchema)
  });

  const onSubmit = (data) => {
    // data est automatiquement validé
    console.log(data); // Type: CreateClassValidationInput
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      {/* ... autres champs */}
    </form>
  );
};
```

## 📊 Types TypeScript Générés

Tous les schémas génèrent automatiquement des types TypeScript :

```typescript
// Types de validation (suffixe Validation)
type RegisterValidationInput = z.infer<typeof registerSchema>;
type CreateClassValidationInput = z.infer<typeof createClassSchema>;
type CreateStudentValidationInput = z.infer<typeof createStudentSchema>;

// Types d'entités (sans suffixe - déjà existants)
interface User { /* ... */ }
interface Class { /* ... */ }
interface Student { /* ... */ }
```

## 🔍 Messages d'Erreur Personnalisés

Tous les schémas incluent des messages d'erreur en français :

```typescript
const registerSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
});
```

## 🧪 Tests de Validation

```typescript
import { registerSchema } from '@edustats/shared';

describe('Register Schema', () => {
  it('should validate correct data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Dupont'
    };
    
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
      firstName: 'Jean',
      lastName: 'Dupont'
    };
    
    const result = registerSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toBe('Format email invalide');
  });
});
```

## 🔄 Intégration Continue

Les validations sont partagées entre :
- **Backend API** - Validation des requêtes
- **Frontend React** - Validation des formulaires
- **Tests** - Validation des données de test
- **Documentation** - Types auto-générés

## 📈 Avantages

1. **Type Safety** - Types TypeScript auto-générés
2. **Cohérence** - Même validation partout
3. **Messages d'erreur** - Textes en français
4. **Performance** - Validation rapide avec Zod
5. **Maintenabilité** - Source unique de vérité
6. **DX** - Autocomplétion et erreurs claires

---

🛡️ **Les validations EduStats garantissent l'intégrité des données à tous les niveaux de l'application !**
