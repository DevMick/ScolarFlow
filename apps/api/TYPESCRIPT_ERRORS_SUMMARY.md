# Résumé des erreurs TypeScript

## Erreurs corrigées
1. ✅ Erreur de syntaxe dans `securityLogging.ts` (regex)
2. ✅ Erreurs de type dans les routes (router: Router)
3. ✅ Erreurs de type dans `server.ts` (app: Express)
4. ✅ Erreurs de type dans `secureFileUpload.ts` (createSecureUploader: Multer)
5. ✅ Désactivation de `declaration` et `declarationMap` dans tsconfig.json

## Erreurs restantes (~417 erreurs)

### Problème principal : Modèles Prisma manquants

Les modèles suivants sont utilisés dans le code mais n'existent pas dans le schéma Prisma :

1. **`evaluationResult`** - Utilisé dans :
   - `apps/api/src/services/resultService.ts`
   - `apps/api/src/services/calculationService.ts`
   - `apps/api/src/services/statistics/StatisticsEngine.ts`
   - `apps/api/src/services/validationService.ts`
   
   **Solution possible** : Utiliser `notes` ou `moyennes` à la place

2. **`customTable`** - Utilisé dans :
   - `apps/api/src/services/tables/CustomTableService.ts`
   
   **Solution possible** : Ajouter le modèle au schéma Prisma ou supprimer cette fonctionnalité

3. **`statisticsConfig`** - Utilisé dans :
   - `apps/api/src/services/statistics/ConfigurationService.ts`
   
   **Solution possible** : Ajouter le modèle au schéma Prisma ou supprimer cette fonctionnalité

4. **`customTableTemplate`** - Utilisé dans :
   - `apps/api/src/services/tables/TemplateService.ts`
   
   **Solution possible** : Ajouter le modèle au schéma Prisma ou supprimer cette fonctionnalité

### Autres erreurs courantes

1. **Imports manquants** :
   - `@edustats/shared/types` - Les types doivent être importés depuis `@edustats/shared/types/statistics`
   - Modules React dans le code serveur (peut être ignoré avec `skipLibCheck`)

2. **Types manquants** :
   - `Student` n'existe pas (utiliser `students` depuis Prisma)
   - `Evaluation` n'existe pas (utiliser `evaluations` depuis Prisma)
   - `EvaluationResult` n'existe pas (créer une interface ou utiliser `notes`/`moyennes`)

3. **Champs camelCase vs snake_case** :
   - Le schéma Prisma utilise `snake_case` (ex: `user_id`, `class_id`, `is_active`)
   - Le code utilise parfois `camelCase` (ex: `userId`, `classId`, `isActive`)
   - Ces erreurs doivent être corrigées dans les requêtes Prisma

## Recommandations

### Option 1 : Ajouter les modèles manquants au schéma Prisma
Ajouter les modèles `evaluationResult`, `customTable`, `statisticsConfig`, et `customTableTemplate` au schéma Prisma.

### Option 2 : Refactoriser pour utiliser les modèles existants
Remplacer les références à `evaluationResult` par `notes` ou `moyennes` selon le contexte.

### Option 3 : Supprimer les fonctionnalités non utilisées
Si certaines fonctionnalités (tables personnalisées, statistiques avancées) ne sont pas utilisées, supprimer le code associé.

## Fichiers nécessitant des corrections

### Priorité haute (bloquent le build)
- `apps/api/src/services/resultService.ts`
- `apps/api/src/services/calculationService.ts`
- `apps/api/src/services/validationService.ts`
- `apps/api/src/services/tables/CustomTableService.ts`
- `apps/api/src/services/tables/TemplateService.ts`
- `apps/api/src/services/statistics/ConfigurationService.ts`

### Priorité moyenne
- `apps/api/src/controllers/*.ts`
- `apps/api/src/routes/*.ts`
- `apps/api/src/services/exportService.ts`
- `apps/api/src/services/statistics/StatisticsEngine.ts`

## Commandes utiles

```bash
# Compter les erreurs restantes
cd apps/api && pnpm build 2>&1 | grep "error TS" | wc -l

# Voir les erreurs par fichier
cd apps/api && pnpm build 2>&1 | grep "error TS" | cut -d: -f1 | sort | uniq -c | sort -rn
```

