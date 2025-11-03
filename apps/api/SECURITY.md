# 🔒 Guide de Sécurité - EduStats API

## 📋 Table des matières

1. [Architecture de sécurité](#architecture-de-sécurité)
2. [Protections implémentées](#protections-implémentées)
3. [Configuration](#configuration)
4. [Best Practices](#best-practices)
5. [Checklist de déploiement](#checklist-de-déploiement)
6. [Réponse aux incidents](#réponse-aux-incidents)

---

## 🏗️ Architecture de sécurité

### Stack technique
- **Backend** : Node.js/Express avec TypeScript
- **Base de données** : PostgreSQL avec Prisma ORM
- **Frontend** : React avec TypeScript
- **Authentification** : JWT avec refresh tokens
- **Hashing** : bcrypt (salt rounds: 12)

### Couches de sécurité

```
┌─────────────────────────────────────┐
│  1. Helmet - En-têtes HTTP          │
│  2. CORS - Origine contrôlée       │
│  3. Rate Limiting - Limitation      │
│  4. Validation - Zod schemas        │
│  5. Sanitisation - Nettoyage entrées│
│  6. Détection injection             │
│  7. CSRF Protection                 │
│  8. Authentification JWT            │
│  9. Gestion d'erreurs sécurisée    │
│ 10. Logging de sécurité             │
└─────────────────────────────────────┘
```

---

## 🛡️ Protections implémentées

### 1. ✅ Protection contre les injections SQL

**Status** : ✅ **IMPLÉMENTÉ**

- **Prisma ORM** : Utilise des requêtes préparées automatiquement
- **Aucune requête SQL brute** : Toutes les requêtes passent par Prisma
- **Validation stricte** : Tous les paramètres sont validés avec Zod

```typescript
// ✅ BON - Utilise Prisma (sécurisé)
const user = await prisma.users.findUnique({
  where: { email: validatedEmail } // Validé avec Zod
});

// ❌ MAUVAIS - Requête brute (NE JAMAIS FAIRE)
// await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;
```

### 2. ✅ Protection XSS (Cross-Site Scripting)

**Status** : ✅ **IMPLÉMENTÉ**

- **Sanitisation automatique** : Toutes les entrées utilisateur sont sanitizées
- **CSP stricte** : Content Security Policy configurée
- **Échappement** : Les données sont échappées avant envoi au frontend

**Configuration CSP** :
- Scripts inline : ❌ Interdits
- Sources externes : ❌ Bloquées
- Évaluation de code : ❌ Interdite

### 3. ✅ Protection CSRF (Cross-Site Request Forgery)

**Status** : ✅ **IMPLÉMENTÉ**

- **Double Submit Cookie Pattern** : Implémenté pour toutes les requêtes modifiant l'état
- **Vérification Origin/Referer** : Vérifie l'origine des requêtes
- **Tokens CSRF** : Générés pour chaque session

**Routes protégées** :
- POST, PUT, PATCH, DELETE sont protégées par CSRF
- Les routes GET génèrent un token CSRF

### 4. ✅ Authentification sécurisée

**Status** : ✅ **IMPLÉMENTÉ**

- **Bcrypt** : Salt rounds = 12 (recommandé : 10-12)
- **JWT** : Access tokens (15min) + Refresh tokens (7 jours)
- **Rate limiting** : 5 tentatives/min pour l'authentification
- **Validation des mots de passe** :
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
  - Au moins 1 caractère spécial

**Améliorations futures** :
- [ ] Authentification à deux facteurs (2FA)
- [ ] Invalidation des sessions après changement de mot de passe
- [ ] Limitation du nombre de sessions actives

### 5. ✅ Protection contre l'injection de commandes

**Status** : ✅ **IMPLÉMENTÉ**

- **Aucune commande système** : Aucune exécution de commandes avec des données utilisateur
- **Validation stricte** : Toutes les entrées sont validées avant utilisation
- **Whitelist** : Seules les opérations autorisées sont permises

### 6. ✅ Chiffrement et protection des données

**Status** : ✅ **IMPLÉMENTÉ**

- **HTTPS** : Forcé en production (HSTS)
- **Variables d'environnement** : Tous les secrets dans `.env`
- **Helmet.js** : En-têtes de sécurité HTTP
- **Cookies httpOnly** : Tokens dans des cookies httpOnly

**En-têtes de sécurité** :
- `Strict-Transport-Security` : Force HTTPS
- `X-Frame-Options: DENY` : Empêche le clickjacking
- `X-Content-Type-Options: nosniff` : Empêche le MIME sniffing
- `Referrer-Policy: no-referrer` : Protège la vie privée
- `Content-Security-Policy` : CSP stricte

### 7. ✅ Contrôle d'accès et autorisation

**Status** : ✅ **IMPLÉMENTÉ**

- **Middleware d'authentification** : Vérifie le JWT sur chaque requête
- **Vérification de propriété** : L'utilisateur ne peut accéder qu'à ses propres ressources
- **Prisma** : Utilise des queries avec `where` pour filtrer par utilisateur

### 8. ✅ Protection contre les attaques par force brute

**Status** : ✅ **IMPLÉMENTÉ**

- **Rate limiting** : 
  - Général : 500 req/15min (dev) | 500 req/15min (prod)
  - Authentification : 1000 req/15min (dev) | 5 req/15min (prod)
  - Par utilisateur : Compteur basé sur l'ID utilisateur
- **Logging** : Toutes les tentatives suspectes sont loggées

### 9. ✅ Validation et sanitisation des entrées

**Status** : ✅ **IMPLÉMENTÉ**

- **Zod** : Validation de schémas TypeScript-first
- **Sanitisation** : Nettoyage automatique des entrées
- **Validation côté serveur** : Toujours validé côté serveur, jamais seulement côté client

**Exemple** :
```typescript
import { validateBody } from '../middleware/validation';
import { registerSchema } from '../validations/auth.validations';

router.post('/register', validateBody(registerSchema), ...);
```

### 10. ✅ Protection des uploads de fichiers

**Status** : ✅ **IMPLÉMENTÉ**

- **Validation MIME** : Vérifie le type MIME réel (magic numbers)
- **Renommage** : Fichiers renommés avec timestamp + hash aléatoire
- **Limite de taille** : 5MB max
- **Types autorisés** : Whitelist stricte
- **Stockage sécurisé** : En dehors du webroot

### 11. ✅ Gestion des erreurs sécurisée

**Status** : ✅ **IMPLÉMENTÉ**

- **Pas de détails techniques** : En production, messages d'erreur génériques
- **Logging côté serveur** : Toutes les erreurs sont loggées avec détails
- **Sanitisation des erreurs** : Masquage des informations sensibles (mots de passe, tokens, etc.)

### 12. ✅ Protection contre SSRF

**Status** : ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

- **Validation des URLs** : À implémenter si des requêtes externes sont nécessaires
- **Whitelist IPs** : À configurer selon les besoins

### 13. ✅ Sécurité des dépendances

**Status** : ✅ **IMPLÉMENTÉ**

- **npm audit** : Exécuter régulièrement
- **Dependabot** : À configurer dans GitHub
- **Versions pinées** : Les versions sont spécifiées dans `package.json`

**Commandes** :
```bash
npm audit
npm audit fix
npm outdated
```

### 14. ✅ En-têtes de sécurité HTTP

**Status** : ✅ **IMPLÉMENTÉ**

Tous les en-têtes suivants sont configurés via Helmet :
- ✅ Content-Security-Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ Referrer-Policy: no-referrer
- ✅ Permissions-Policy

### 15. ✅ Logging et monitoring

**Status** : ✅ **IMPLÉMENTÉ**

- **Logger structuré** : Winston avec format JSON
- **Événements de sécurité** : Loggés avec sévérité
- **Request ID** : Chaque requête a un ID unique pour le traçage

**Événements surveillés** :
- Tentatives d'authentification (succès/échec)
- Rate limit atteint
- Violations CSRF
- Tentatives d'injection détectées
- Accès non autorisés
- Uploads de fichiers

---

## ⚙️ Configuration

### Variables d'environnement requises

```bash
# Base de données
DATABASE_URL="postgresql://..."

# Sécurité
JWT_SECRET="votre-secret-jwt-super-long-et-aleatoire-minimum-256-caracteres"
JWT_REFRESH_SECRET="votre-secret-refresh-super-long-et-aleatoire-minimum-256-caracteres"
CSRF_SECRET="votre-secret-csrf" # Peut utiliser JWT_SECRET

# CORS
CORS_ORIGIN="https://votre-domaine.com"

# Environnement
NODE_ENV="production" # ou "development"
```

### Configuration Helmet

Voir `apps/api/src/config/helmet.config.ts`

### Configuration Rate Limiting

Voir `apps/api/src/config/security.ts`

---

## 📚 Best Practices

### Pour les développeurs

1. **Toujours valider avec Zod** :
   ```typescript
   import { validateBody } from '../middleware/validation';
   import { mySchema } from '../validations/my.validations';
   
   router.post('/endpoint', validateBody(mySchema), handler);
   ```

2. **Utiliser Prisma pour toutes les requêtes** :
   ```typescript
   // ✅ BON
   await prisma.users.findUnique({ where: { id } });
   
   // ❌ MAUVAIS
   await prisma.$queryRaw`SELECT * FROM users WHERE id = ${id}`;
   ```

3. **Ne jamais exposer d'erreurs techniques** :
   ```typescript
   // ✅ BON
   catch (error) {
     Logger.error('Erreur', error); // Log complet
     res.status(500).json({ message: 'Erreur interne' }); // Message générique
   }
   ```

4. **Sanitiser les entrées** :
   ```typescript
   // Automatique via middleware sanitizeInputs
   // Mais toujours valider avec Zod aussi
   ```

5. **Vérifier les permissions** :
   ```typescript
   // Toujours vérifier que l'utilisateur a le droit
   const resource = await prisma.resource.findFirst({
     where: { id, userId: req.user.id } // Filtrer par userId
   });
   ```

### Pour les déploiements

1. **Variables d'environnement** : Jamais dans le code source
2. **HTTPS** : Toujours activé en production
3. **Secrets** : Utiliser un gestionnaire de secrets (AWS Secrets Manager, etc.)
4. **Logs** : Ne pas logger de données sensibles
5. **Backups** : Automatiser les backups de la base de données

---

## ✅ Checklist de déploiement sécurisé

### Avant le déploiement

- [ ] Toutes les variables d'environnement sont configurées
- [ ] JWT_SECRET et JWT_REFRESH_SECRET sont des secrets forts (256+ caractères)
- [ ] CORS_ORIGIN pointe vers le bon domaine
- [ ] NODE_ENV est défini à "production"
- [ ] Toutes les dépendances sont à jour (`npm audit`)
- [ ] Les secrets ne sont pas dans le code source
- [ ] HTTPS est configuré et testé
- [ ] Les certificats SSL sont valides

### Pendant le déploiement

- [ ] Les migrations de base de données sont exécutées
- [ ] Les fichiers statiques sont servis correctement
- [ ] Les logs sont configurés
- [ ] Le monitoring est actif

### Après le déploiement

- [ ] Tester l'authentification
- [ ] Vérifier les en-têtes de sécurité (helmet.test)
- [ ] Tester le rate limiting
- [ ] Vérifier les logs
- [ ] Tester les uploads de fichiers
- [ ] Vérifier que les erreurs ne révèlent pas de détails techniques

---

## 🚨 Réponse aux incidents

### Procédure de réponse

1. **Identifier l'incident**
   - Consulter les logs de sécurité
   - Vérifier les événements suspects

2. **Isoler l'incident**
   - Bloquer l'IP si nécessaire
   - Révoquer les tokens compromis
   - Désactiver les comptes suspects

3. **Analyser**
   - Examiner les logs
   - Identifier la cause
   - Documenter l'incident

4. **Corriger**
   - Appliquer les correctifs
   - Mettre à jour la documentation
   - Améliorer les protections

5. **Prévenir**
   - Renforcer les contrôles
   - Former l'équipe
   - Réviser les procédures

### Contacts d'urgence

- **Équipe de sécurité** : [à définir]
- **Administrateur système** : [à définir]
- **Responsable technique** : [à définir]

---

## 📊 Monitoring de sécurité

### Métriques à surveiller

- Nombre de tentatives d'authentification échouées
- Violations de rate limit
- Tentatives d'injection détectées
- Uploads de fichiers bloqués
- Erreurs 401/403/500

### Alertes à configurer

- Plus de 10 tentatives d'authentification échouées en 5 minutes
- Rate limit atteint plus de 50 fois en 1 heure
- Plus de 5 tentatives d'injection en 1 heure
- Uploads de fichiers bloqués > 20 en 1 heure

---

## 🔄 Maintenance de sécurité

### Mensuel

- [ ] Auditer les dépendances (`npm audit`)
- [ ] Mettre à jour les dépendances critiques
- [ ] Réviser les logs de sécurité
- [ ] Vérifier les certificats SSL

### Trimestriel

- [ ] Réviser les secrets (JWT_SECRET, etc.)
- [ ] Auditer les permissions utilisateurs
- [ ] Réviser la configuration de sécurité
- [ ] Former l'équipe sur les nouvelles menaces

### Annuel

- [ ] Audit de sécurité complet
- [ ] Test de pénétration
- [ ] Révision de l'architecture de sécurité
- [ ] Mise à jour des procédures de réponse

---

## 📖 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Security](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Dernière mise à jour** : 2025-11-03

