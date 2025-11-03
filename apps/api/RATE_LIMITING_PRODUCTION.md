# Configuration du Rate Limiting pour la Production

## ✅ Situation Actuelle

### Comportement par Utilisateur
- **Chaque utilisateur a son propre compteur** : `user:${userId}`
- **Limite actuelle** : 500 requêtes / 15 minutes par utilisateur
- **Suffisant pour** : ~33 requêtes/minute par utilisateur

### Limites par Type de Route
- **Général** : 500 req/15min (production)
- **Authentification** : 1000 req/15min (dev) | 5 req/15min (prod)
- **Modifications** : 30 req/5min
- **Calculs** : 10 req/min
- **Uploads** : 20 req/heure

## ⚠️ Points d'Attention pour la Production

### 1. Store en Mémoire (Problème Actuel)
Le rate limiting utilise un store **en mémoire** par défaut, ce qui signifie :
- ❌ Si vous avez **plusieurs instances** de serveur (load balancing), chaque instance a son propre compteur
- ❌ Les compteurs sont **perdus** lors d'un redémarrage
- ✅ **Solution recommandée** : Utiliser **Redis** comme store partagé

### 2. Limites Recommandées selon l'Usage

#### Pour une Application Éducative Standard :
- **Utilisateurs normaux** : 200-300 req/15min (suffisant)
- **Utilisateurs actifs** (génération de rapports) : 500 req/15min (actuel)
- **API publique** : 50-100 req/15min par IP

#### Routes Critiques à Protéger :
- **Login** : 5-10 tentatives/min (actuel : 5/15min)
- **Création de données** : 30 req/5min (actuel : OK)
- **Exports/Calculs** : 10 req/min (actuel : OK)

## 🚀 Recommandations pour la Production

### Option 1 : Ajuster les Limites Actuelles
Modifier `apps/api/src/config/security.ts` :

```typescript
rateLimit: {
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000, // 300 req/15min en prod
  // ...
}
```

### Option 2 : Implémenter Redis (Recommandé pour Scale)
Installer `express-rate-limit` avec Redis :

```bash
npm install express-rate-limit redis
```

Modifier `apps/api/src/middleware/rateLimiter.ts` :

```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const generalRateLimit = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 300 : 5000,
  // ... reste de la config
});
```

### Option 3 : Limites Adaptatives par Utilisateur
Implémenter des limites différentes selon le rôle :

```typescript
max: async (req: Request): Promise<number> => {
  if (!req.user) return 50; // Utilisateur anonyme
  
  // Utilisateur normal
  if (!req.user.role || req.user.role === 'user') {
    return 300;
  }
  
  // Admin ou utilisateur premium
  if (req.user.role === 'admin' || req.user.isPremium) {
    return 1000;
  }
  
  return 300;
}
```

## 📊 Surveillance et Monitoring

### Ajouter des Métriques
Surveiller les violations de rate limit dans vos logs/monitoring :

```typescript
handler: (req: Request, res: Response) => {
  Logger.warn('Rate limit atteint', {
    userId: req.user?.id,
    ip: req.ip,
    endpoint: req.path,
    // Envoyer à votre service de monitoring (Sentry, DataDog, etc.)
  });
  // ...
}
```

## ✅ Checklist pour Production

- [ ] Ajuster les limites selon votre usage réel (300 req/15min recommandé)
- [ ] Implémenter Redis si vous avez plusieurs instances de serveur
- [ ] Surveiller les violations de rate limit dans vos logs
- [ ] Tester avec charge (ex: avec Apache Bench ou Artillery)
- [ ] Ajuster les limites selon les métriques réelles
- [ ] Documenter les limites pour votre équipe

## 🔍 Comment Tester

### Test Simple avec curl :
```bash
# Tester la limite (faire 100 requêtes rapides)
for i in {1..100}; do
  curl -X GET http://localhost:3001/api/classes \
    -H "Authorization: Bearer YOUR_TOKEN"
done
```

### Test avec Artillery (Recommandé) :
```bash
npm install -g artillery

# Créer un fichier test.yml
artillery quick --count 50 --num 10 http://localhost:3001/api/classes
```

## 📝 Conclusion

**Votre configuration actuelle (500 req/15min par utilisateur) est appropriée pour :**
- ✅ Applications avec < 100 utilisateurs simultanés
- ✅ Usage normal (navigation, affichage de données)
- ✅ Une seule instance de serveur

**Vous devrez ajuster si :**
- ⚠️ Vous avez plusieurs instances (nécessite Redis)
- ⚠️ Vous avez des utilisateurs très actifs (génération de rapports)
- ⚠️ Vous avez > 1000 utilisateurs simultanés

**Recommandation immédiate** : Laisser les limites à 500 req/15min, mais **surveiller** les violations dans vos logs pour ajuster si nécessaire.

