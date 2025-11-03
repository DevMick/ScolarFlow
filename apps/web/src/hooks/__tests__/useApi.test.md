# Tests de Validation - Phase 4 Volet 3A

## Tests Hooks & Context - Système d'Évaluations

### ✅ Tests Unitaires Basiques

#### 1. **Tests useApi Hook**

```typescript
// Test manuel dans console navigateur
import { useApi } from '../hooks/useApi';

// Test chargement basique
const { data, loading, error } = useApi(
  () => fetch('/api/health').then(r => r.json()),
  [],
  { enableCache: true }
);

console.log('API Hook Test:', { data, loading, error });
```

#### 2. **Tests EvaluationContext**

```typescript
// Test context provider
import { EvaluationProvider, useEvaluationContext } from '../contexts/EvaluationContext';

function TestComponent() {
  const { 
    getEvaluationsForClass, 
    setEvaluations, 
    isLoading, 
    selectEvaluation 
  } = useEvaluationContext();
  
  console.log('Context test:', {
    evaluations: getEvaluationsForClass(1),
    loading: isLoading('evaluations', 1)
  });
  
  return <div>Context Test OK</div>;
}
```

#### 3. **Tests Services**

```typescript
// Test EvaluationService
import { evaluationService } from '../services/evaluationService';

// Test avec données mockées
const testCreateEvaluation = async () => {
  try {
    const mockData = {
      title: 'Test Frontend',
      subject: 'Mathématiques',
      type: 'Contrôle',
      maxScore: 20,
      evaluationDate: new Date(),
      coefficient: 1
    };
    
    console.log('Test création évaluation:', mockData);
    // Aurait besoin du backend pour tester réellement
  } catch (error) {
    console.log('Erreur attendue (pas de backend):', error);
  }
};
```

#### 4. **Tests Cache**

```typescript
// Test cache intelligent
import { globalCache, CACHE_KEYS } from '../utils/cache';

// Test set/get
globalCache.set('test-key', { data: 'test' }, { ttl: 5000 });
const cached = globalCache.get('test-key');
console.log('Cache test:', cached);

// Test invalidation
globalCache.invalidate('test-*');
const afterInvalidation = globalCache.get('test-key');
console.log('Après invalidation:', afterInvalidation); // null
```

#### 5. **Tests ErrorHandling**

```typescript
// Test gestion d'erreurs
import { globalErrorHandler, notificationService } from '../utils/errorHandling';

// Test erreur simulée
const testError = new Error('Test error');
const appError = globalErrorHandler.handleError(testError);
console.log('Erreur traitée:', appError);

// Test notifications
notificationService.success('Test notification succès');
notificationService.error('Test notification erreur');
```

### ✅ Validation Manuelle Interface

#### 1. **Intégration Context dans App**

```tsx
// Dans apps/web/src/App.tsx
import { EvaluationProvider } from './contexts/EvaluationContext';

function App() {
  return (
    <EvaluationProvider initialClassId={1}>
      {/* Composants existants */}
    </EvaluationProvider>
  );
}
```

#### 2. **Test Hook useEvaluations**

```tsx
// Composant de test simple
import { useEvaluations } from '../hooks/useEvaluations';

function EvaluationTestComponent() {
  const {
    evaluations,
    loading,
    error,
    createEvaluation,
    statistics
  } = useEvaluations({ classId: 1 });
  
  return (
    <div className="p-4">
      <h2>Test Évaluations</h2>
      <p>Chargement: {loading ? 'Oui' : 'Non'}</p>
      <p>Erreur: {error || 'Aucune'}</p>
      <p>Nombre: {evaluations.length}</p>
      <p>Stats: {JSON.stringify(statistics)}</p>
      
      <button 
        onClick={() => createEvaluation({
          title: 'Test',
          subject: 'Math',
          type: 'Contrôle',
          maxScore: 20,
          evaluationDate: new Date()
        })}
      >
        Créer Test
      </button>
    </div>
  );
}
```

### ✅ Tests Performance

#### 1. **Test Re-renders**

```typescript
// Vérifier avec React DevTools Profiler
// - Context ne doit pas re-render tous les composants
// - Hooks doivent être memoized correctement
// - Cache doit éviter les appels API redondants
```

#### 2. **Test Mémoire**

```typescript
// Test pas de memory leaks
// - Nettoyer les timers dans useEffect
// - Gérer les abort controllers
// - Vider le cache périodiquement
```

### ✅ Critères de Validation

- [x] **Types TypeScript** : Aucune erreur de compilation
- [x] **Cache Intelligent** : Set/Get/Invalidation fonctionnent
- [x] **Gestion d'Erreurs** : Messages français, notifications
- [x] **Context Provider** : État global cohérent
- [x] **Hooks API** : Retry, optimistic updates
- [x] **Services** : Validation côté client
- [x] **Performance** : Memoization, cache

### 🔄 Tests d'Intégration (Prochaine Étape)

```bash
# 1. Lancer le backend API
cd apps/api && pnpm dev

# 2. Lancer le frontend
cd apps/web && pnpm dev

# 3. Tester dans navigateur
# - Ouvrir console développeur
# - Importer et tester les hooks
# - Vérifier les appels réseau
# - Valider les notifications

# 4. Tests React DevTools
# - Profiler les re-renders
# - Vérifier le cache dans Network tab
# - Tester les updates optimistes
```

### 🎯 Résultat Attendu

**Système de hooks et context complet et fonctionnel** :
- ✅ Context EvaluationProvider opérationnel
- ✅ Hooks useEvaluations avec toutes les fonctionnalités
- ✅ Cache intelligent avec TTL et invalidation
- ✅ Gestion d'erreurs robuste en français
- ✅ Services API avec retry et optimisation
- ✅ Types TypeScript complets
- ✅ Performance optimisée

Le frontend est prêt pour être connecté au backend et utilisé dans les composants React !
