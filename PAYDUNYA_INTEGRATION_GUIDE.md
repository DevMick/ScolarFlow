# 💳 Guide Complet d'Intégration PayDunya dans ScolarFlow

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration PayDunya](#configuration-paydunya)
3. [Base de Données](#base-de-données)
4. [Backend - API](#backend-api)
5. [Frontend - Interface Utilisateur](#frontend-interface-utilisateur)
6. [Tests](#tests)
7. [Déploiement](#déploiement)
8. [Maintenance](#maintenance)

---

## 🎯 Prérequis

### 1. Compte PayDunya

- [ ] Créer un compte sur https://paydunya.com
- [ ] Vérifier votre email
- [ ] Soumettre votre carte d'identité
- [ ] Attendre la validation (24-48h)
- [ ] Récupérer vos clés API :
  - Master Key
  - Private Key
  - Public Key
  - Token

### 2. Environnement de Développement

- [ ] Node.js v18+ installé
- [ ] PostgreSQL installé et configuré
- [ ] Git configuré
- [ ] Éditeur de code (VS Code recommandé)

---

## 🔧 Configuration PayDunya

### Étape 1 : Installation du Package

```bash
# Dans le dossier api
cd apps/api
npm install paydunya
```

### Étape 2 : Variables d'Environnement

Créer/Modifier `apps/api/.env` :

```env
# PayDunya Configuration
PAYDUNYA_MASTER_KEY=your_master_key_here
PAYDUNYA_PRIVATE_KEY=your_private_key_here
PAYDUNYA_PUBLIC_KEY=your_public_key_here
PAYDUNYA_TOKEN=your_token_here
PAYDUNYA_MODE=test  # 'test' ou 'live'

# URLs de Callback
PAYDUNYA_CALLBACK_URL=http://localhost:3001/api/payments/callback
PAYDUNYA_RETURN_URL=http://localhost:3000/payment/success
PAYDUNYA_CANCEL_URL=http://localhost:3000/payment/cancel

# Configuration Application
APP_NAME=ScolarFlow
APP_URL=http://localhost:3000
```

---

## 🗄️ Base de Données

### Étape 3 : Créer les Tables

#### Fichier : `apps/api/prisma/schema.prisma`

Ajouter ces modèles à votre schéma Prisma :

```prisma
// Plans d'abonnement
model Plan {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  slug        String   @unique
  description String?
  price       Decimal  @db.Decimal(10, 2)
  currency    String   @default("XOF")
  duration    Int      @default(30) // En jours
  features    Json     // Tableau des fonctionnalités
  maxClasses  Int?     // Nombre max de classes (null = illimité)
  maxStudents Int?     // Nombre max d'élèves (null = illimité)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  subscriptions Subscription[]

  @@map("plans")
}

// Abonnements utilisateurs
model Subscription {
  id             Int      @id @default(autoincrement())
  userId         Int
  planId         Int
  status         String   @default("active") // active, expired, cancelled, pending
  startDate      DateTime
  endDate        DateTime
  autoRenew      Boolean  @default(false)
  paymentMethod  String?  // wave, mtn, moov, orange
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan         Plan          @relation(fields: [planId], references: [id])
  transactions Transaction[]

  @@index([userId])
  @@index([status])
  @@map("subscriptions")
}

// Transactions de paiement
model Transaction {
  id               Int      @id @default(autoincrement())
  userId           Int
  subscriptionId   Int?
  planId           Int
  amount           Decimal  @db.Decimal(10, 2)
  currency         String   @default("XOF")
  status           String   @default("pending") // pending, completed, failed, cancelled
  paymentMethod    String?  // wave, mtn, moov, orange
  paydunya_token   String?  @unique
  paydunya_invoice String?
  metadata         Json?    // Informations supplémentaires
  completedAt      DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])
  plan         Plan          @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([paydunya_token])
  @@map("transactions")
}
```

Ajouter ces relations au modèle `User` existant :

```prisma
model User {
  // ... champs existants ...
  
  subscriptions Subscription[]
  transactions  Transaction[]
}
```

### Étape 4 : Générer et Appliquer la Migration

```bash
cd apps/api
npx prisma migrate dev --name add_payment_system
npx prisma generate
```

### Étape 5 : Seed Initial (Plans de Base)

Créer `apps/api/prisma/seed-plans.ts` :

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  const plans = [
    {
      name: 'Gratuit',
      slug: 'free',
      description: 'Pour découvrir ScolarFlow',
      price: 0,
      duration: 365, // 1 an
      maxClasses: 1,
      maxStudents: 30,
      features: [
        '1 classe maximum',
        '30 élèves maximum',
        'Fonctionnalités de base',
        'Support communautaire',
      ],
      isActive: true,
    },
    {
      name: 'Pack Enseignant',
      slug: 'teacher',
      description: 'Pour les enseignants individuels',
      price: 5000,
      duration: 30, // 1 mois
      maxClasses: null, // Illimité
      maxStudents: null, // Illimité
      features: [
        'Classes illimitées',
        'Élèves illimités',
        'Toutes les fonctionnalités',
        'Export de rapports',
        'Support par email',
        'Mises à jour automatiques',
      ],
      isActive: true,
    },
    {
      name: 'Pack Établissement',
      slug: 'school',
      description: 'Pour les écoles et établissements',
      price: 50000,
      duration: 365, // 1 an
      maxClasses: null, // Illimité
      maxStudents: null, // Illimité
      features: [
        'Multi-enseignants (20 comptes)',
        'Classes et élèves illimités',
        'Dashboard administrateur',
        'Statistiques globales',
        'Support téléphonique prioritaire',
        'Formation en ligne',
        'Personnalisation (logo, en-tête)',
      ],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
  }

  console.log('✅ Plans créés avec succès');
}

seedPlans()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Exécuter le seed :

```bash
npx ts-node prisma/seed-plans.ts
```

---

## 🔧 Backend - API

### Étape 6 : Service PayDunya

Créer `apps/api/src/services/paydunya.service.ts` :

```typescript
import { PrismaClient } from '@prisma/client';
const paydunya = require('paydunya');

const prisma = new PrismaClient();

// Configuration PayDunya
const setup = new paydunya.Setup({
  masterKey: process.env.PAYDUNYA_MASTER_KEY,
  privateKey: process.env.PAYDUNYA_PRIVATE_KEY,
  publicKey: process.env.PAYDUNYA_PUBLIC_KEY,
  token: process.env.PAYDUNYA_TOKEN,
  mode: process.env.PAYDUNYA_MODE || 'test',
});

// Configuration du store
const store = new paydunya.Store({
  name: process.env.APP_NAME || 'ScolarFlow',
  tagline: 'La gestion scolaire en toute fluidité',
  phoneNumber: '+221XXXXXXXXX', // Votre numéro
  postalAddress: 'Votre adresse',
  logoUrl: `${process.env.APP_URL}/logo.png`,
  websiteUrl: process.env.APP_URL,
});

export class PaydunyaService {
  /**
   * Créer une facture de paiement
   */
  static async createInvoice(params: {
    userId: number;
    planId: number;
    amount: number;
    description: string;
    customerEmail: string;
    customerName: string;
  }) {
    try {
      // Créer la transaction en base
      const transaction = await prisma.transaction.create({
        data: {
          userId: params.userId,
          planId: params.planId,
          amount: params.amount,
          status: 'pending',
        },
      });

      // Créer la facture PayDunya
      const invoice = new paydunya.CheckoutInvoice(setup, store);

      // Configurer la facture
      invoice.addItem(params.description, 1, params.amount, params.amount);
      invoice.totalAmount = params.amount;
      invoice.description = params.description;

      // Informations client
      invoice.addCustomData('transaction_id', transaction.id);
      invoice.addCustomData('user_id', params.userId);
      invoice.addCustomData('plan_id', params.planId);

      // URLs de callback
      invoice.callbackUrl = process.env.PAYDUNYA_CALLBACK_URL;
      invoice.returnUrl = `${process.env.PAYDUNYA_RETURN_URL}?transaction_id=${transaction.id}`;
      invoice.cancelUrl = process.env.PAYDUNYA_CANCEL_URL;

      // Créer la facture
      const result = await invoice.create();

      if (result) {
        // Mettre à jour la transaction avec le token PayDunya
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            paydunya_token: invoice.token,
            paydunya_invoice: invoice.invoice_token,
          },
        });

        return {
          success: true,
          transactionId: transaction.id,
          invoiceToken: invoice.token,
          paymentUrl: invoice.url,
          responseText: invoice.response_text,
        };
      } else {
        throw new Error('Échec de création de la facture');
      }
    } catch (error: any) {
      console.error('Erreur création facture PayDunya:', error);
      throw new Error(`Erreur PayDunya: ${error.message}`);
    }
  }

  /**
   * Vérifier le statut d'une transaction
   */
  static async checkTransactionStatus(token: string) {
    try {
      const invoice = new paydunya.CheckoutInvoice(setup, store);
      const result = await invoice.confirm(token);

      return {
        status: invoice.status,
        responseCode: invoice.response_code,
        responseText: invoice.response_text,
        customer: invoice.customer,
        customData: invoice.custom_data,
      };
    } catch (error: any) {
      console.error('Erreur vérification statut:', error);
      throw new Error(`Erreur vérification: ${error.message}`);
    }
  }

  /**
   * Activer l'abonnement après paiement réussi
   */
  static async activateSubscription(transactionId: number) {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { plan: true },
      });

      if (!transaction) {
        throw new Error('Transaction non trouvée');
      }

      // Calculer les dates de début et fin
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + transaction.plan.duration);

      // Créer ou mettre à jour l'abonnement
      const subscription = await prisma.subscription.create({
        data: {
          userId: transaction.userId,
          planId: transaction.planId,
          status: 'active',
          startDate,
          endDate,
        },
      });

      // Mettre à jour la transaction
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'completed',
          subscriptionId: subscription.id,
          completedAt: new Date(),
        },
      });

      return {
        success: true,
        subscription,
      };
    } catch (error: any) {
      console.error('Erreur activation abonnement:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur a un abonnement actif
   */
  static async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: {
          gte: new Date(),
        },
      },
    });

    return !!subscription;
  }

  /**
   * Obtenir l'abonnement actif d'un utilisateur
   */
  static async getActiveSubscription(userId: number) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        endDate: {
          gte: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });
  }
}
```

### Étape 7 : Routes de Paiement

Créer `apps/api/src/routes/payment.routes.ts` :

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaydunyaService } from '../services/paydunya.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/payments/plans
 * Récupérer tous les plans disponibles
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error('Erreur récupération plans:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des plans',
    });
  }
});

/**
 * POST /api/payments/create-invoice
 * Créer une facture de paiement
 */
router.post('/create-invoice', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // Récupérer le plan
    const plan = await prisma.plan.findUnique({
      where: { id: parseInt(planId) },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan non trouvé',
      });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Créer la facture PayDunya
    const result = await PaydunyaService.createInvoice({
      userId: user.id,
      planId: plan.id,
      amount: parseFloat(plan.price.toString()),
      description: `Abonnement ${plan.name} - ScolarFlow`,
      customerEmail: user.email,
      customerName: `${user.firstName} ${user.lastName}`,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erreur création facture:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la facture',
    });
  }
});

/**
 * GET /api/payments/verify/:token
 * Vérifier le statut d'une transaction
 */
router.get('/verify/:token', authenticateToken, async (req, res) => {
  try {
    const { token } = req.params;

    const result = await PaydunyaService.checkTransactionStatus(token);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erreur vérification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
});

/**
 * POST /api/payments/callback
 * Webhook PayDunya pour notifications de paiement
 */
router.post('/callback', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !data.invoice || !data.invoice.token) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
      });
    }

    const token = data.invoice.token;

    // Vérifier le statut de la transaction
    const status = await PaydunyaService.checkTransactionStatus(token);

    if (status.status === 'completed' && status.responseCode === '00') {
      // Récupérer la transaction
      const transaction = await prisma.transaction.findUnique({
        where: { paydunya_token: token },
      });

      if (transaction && transaction.status === 'pending') {
        // Activer l'abonnement
        await PaydunyaService.activateSubscription(transaction.id);

        console.log(`✅ Abonnement activé pour transaction ${transaction.id}`);
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erreur callback PayDunya:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur traitement callback',
    });
  }
});

/**
 * GET /api/payments/subscription
 * Obtenir l'abonnement actif de l'utilisateur
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await PaydunyaService.getActiveSubscription(userId);

    res.json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Erreur récupération abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'abonnement',
    });
  }
});

/**
 * GET /api/payments/transactions
 * Obtenir l'historique des transactions
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        plan: true,
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Erreur récupération transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des transactions',
    });
  }
});

export default router;
```

### Étape 8 : Middleware de Vérification d'Abonnement

Créer `apps/api/src/middleware/subscription.middleware.ts` :

```typescript
import { Request, Response, NextFunction } from 'express';
import { PaydunyaService } from '../services/paydunya.service';

/**
 * Middleware pour vérifier si l'utilisateur a un abonnement actif
 */
export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const hasActiveSubscription = await PaydunyaService.hasActiveSubscription(userId);

    if (!hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        message: 'Abonnement requis pour accéder à cette fonctionnalité',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'abonnement',
    });
  }
}

/**
 * Middleware pour vérifier les limites du plan gratuit
 */
export async function checkPlanLimits(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié',
      });
    }

    const subscription = await PaydunyaService.getActiveSubscription(userId);

    if (!subscription) {
      // Pas d'abonnement = plan gratuit par défaut
      // Ajouter la logique de vérification des limites ici
      req.planLimits = {
        maxClasses: 1,
        maxStudents: 30,
      };
    } else {
      req.planLimits = {
        maxClasses: subscription.plan.maxClasses,
        maxStudents: subscription.plan.maxStudents,
      };
    }

    next();
  } catch (error) {
    console.error('Erreur vérification limites:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des limites',
    });
  }
}
```

### Étape 9 : Enregistrer les Routes

Modifier `apps/api/src/index.ts` ou `apps/api/src/app.ts` :

```typescript
import paymentRoutes from './routes/payment.routes';

// ... autres imports ...

// Enregistrer les routes
app.use('/api/payments', paymentRoutes);
```

---

## 🎨 Frontend - Interface Utilisateur

### Étape 10 : Service de Paiement

Créer `apps/web/src/services/paymentService.ts` :

```typescript
import { apiService } from './api';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  maxClasses?: number;
  maxStudents?: number;
  isActive: boolean;
}

export interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  startDate: string;
  endDate: string;
  plan: Plan;
}

export interface Transaction {
  id: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  plan: Plan;
}

export const paymentService = {
  /**
   * Récupérer tous les plans
   */
  async getPlans(): Promise<Plan[]> {
    const response = await apiService.get('/payments/plans');
    return response.data;
  },

  /**
   * Créer une facture de paiement
   */
  async createInvoice(planId: number): Promise<{
    transactionId: number;
    invoiceToken: string;
    paymentUrl: string;
  }> {
    const response = await apiService.post('/payments/create-invoice', {
      planId,
    });
    return response.data;
  },

  /**
   * Vérifier le statut d'une transaction
   */
  async verifyTransaction(token: string) {
    const response = await apiService.get(`/payments/verify/${token}`);
    return response.data;
  },

  /**
   * Obtenir l'abonnement actif
   */
  async getActiveSubscription(): Promise<Subscription | null> {
    try {
      const response = await apiService.get('/payments/subscription');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  /**
   * Obtenir l'historique des transactions
   */
  async getTransactions(): Promise<Transaction[]> {
    const response = await apiService.get('/payments/transactions');
    return response.data;
  },
};
```

### Étape 11 : Page des Plans (Pricing)

Créer `apps/web/src/pages/PricingPage.tsx` :

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Tag,
  Space,
  Spin,
  Alert,
  List,
  Divider,
} from 'antd';
import {
  CheckOutlined,
  CrownOutlined,
  RocketOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { paymentService, Plan } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export function PricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getPlans();
      setPlans(data);
    } catch (err: any) {
      setError('Erreur lors du chargement des plans');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: number, price: number) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    if (price === 0) {
      // Plan gratuit - activation automatique
      // TODO: Implémenter l'activation du plan gratuit
      return;
    }

    try {
      setProcessingPlanId(planId);
      setError(null);

      // Créer la facture
      const result = await paymentService.createInvoice(planId);

      // Rediriger vers la page de paiement PayDunya
      window.location.href = result.paymentUrl;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du paiement');
      setProcessingPlanId(null);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case 'free':
        return <CheckOutlined />;
      case 'teacher':
        return <CrownOutlined />;
      case 'school':
        return <RocketOutlined />;
      default:
        return <CheckOutlined />;
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'free':
        return '#52c41a';
      case 'teacher':
        return '#1890ff';
      case 'school':
        return '#722ed1';
      default:
        return '#1890ff';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '50px 24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <Title level={1}>
            Choisissez Votre Plan
          </Title>
          <Paragraph style={{ fontSize: 18, color: '#666' }}>
            Sélectionnez le plan qui correspond à vos besoins.
            <br />
            Changez ou annulez à tout moment.
          </Paragraph>
        </div>

        {/* Message d'erreur */}
        {error && (
          <Alert
            message="Erreur"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* Plans */}
        <Row gutter={[24, 24]}>
          {plans.map((plan) => (
            <Col xs={24} md={8} key={plan.id}>
              <Card
                hoverable
                style={{
                  height: '100%',
                  borderColor: plan.slug === 'teacher' ? getPlanColor(plan.slug) : undefined,
                  borderWidth: plan.slug === 'teacher' ? 2 : 1,
                }}
              >
                {/* Badge "Populaire" */}
                {plan.slug === 'teacher' && (
                  <div style={{
                    position: 'absolute',
                    top: -10,
                    right: 20,
                    backgroundColor: getPlanColor(plan.slug),
                    color: 'white',
                    padding: '4px 16px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}>
                    ⭐ POPULAIRE
                  </div>
                )}

                {/* Icône */}
                <div style={{
                  fontSize: 48,
                  color: getPlanColor(plan.slug),
                  marginBottom: 16,
                  textAlign: 'center',
                }}>
                  {getPlanIcon(plan.slug)}
                </div>

                {/* Nom du plan */}
                <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
                  {plan.name}
                </Title>

                {/* Prix */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 36, fontWeight: 'bold', color: getPlanColor(plan.slug) }}>
                    {plan.price.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 18, color: '#666' }}> FCFA</Text>
                  <br />
                  <Text type="secondary">
                    {plan.duration === 30 ? '/mois' : plan.duration === 365 ? '/an' : ''}
                  </Text>
                </div>

                {/* Description */}
                {plan.description && (
                  <Paragraph style={{ textAlign: 'center', color: '#666', minHeight: 40 }}>
                    {plan.description}
                  </Paragraph>
                )}

                <Divider />

                {/* Fonctionnalités */}
                <List
                  dataSource={plan.features as string[]}
                  renderItem={(feature) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <Space>
                        <CheckOutlined style={{ color: '#52c41a' }} />
                        <Text>{feature}</Text>
                      </Space>
                    </List.Item>
                  )}
                  style={{ marginBottom: 24 }}
                />

                {/* Bouton */}
                <Button
                  type={plan.slug === 'teacher' ? 'primary' : 'default'}
                  size="large"
                  block
                  onClick={() => handleSubscribe(plan.id, parseFloat(plan.price.toString()))}
                  loading={processingPlanId === plan.id}
                  style={{
                    backgroundColor: plan.slug === 'teacher' ? getPlanColor(plan.slug) : undefined,
                    borderColor: plan.slug === 'teacher' ? getPlanColor(plan.slug) : undefined,
                  }}
                >
                  {plan.price === 0 ? 'Commencer Gratuitement' : 'S\'abonner'}
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Informations supplémentaires */}
        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Title level={4}>Modes de Paiement Acceptés</Title>
              <Space size="large">
                <Tag color="gold">🟡 Wave</Tag>
                <Tag color="gold">🟡 MTN Money</Tag>
                <Tag color="blue">🔵 Moov Money</Tag>
              </Space>
              <Text type="secondary">
                Paiements sécurisés par PayDunya
              </Text>
            </Space>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### Étape 12 : Page de Confirmation de Paiement

Créer `apps/web/src/pages/PaymentSuccessPage.tsx` :

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Button, Spin, Card } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { paymentService } from '../services/paymentService';

export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  const transactionId = searchParams.get('transaction_id');

  useEffect(() => {
    // Attendre quelques secondes pour que PayDunya traite le paiement
    setTimeout(() => {
      verifyPayment();
    }, 3000);
  }, []);

  const verifyPayment = async () => {
    try {
      if (transactionId) {
        // Vérifier le paiement
        // Note: Vous devrez adapter cela selon votre API
        setVerified(true);
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f2f5',
      }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            />
            <div style={{ marginTop: 24 }}>
              <h3>Vérification du paiement en cours...</h3>
              <p>Veuillez patienter quelques instants</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
    }}>
      <Card style={{ maxWidth: 600 }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="Paiement Réussi !"
          subTitle="Votre abonnement a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de ScolarFlow."
          extra={[
            <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
              Aller au Tableau de Bord
            </Button>,
            <Button key="pricing" onClick={() => navigate('/pricing')}>
              Voir les Plans
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
```

### Étape 13 : Page d'Annulation

Créer `apps/web/src/pages/PaymentCancelPage.tsx` :

```typescript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Card } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';

export function PaymentCancelPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
    }}>
      <Card style={{ maxWidth: 600 }}>
        <Result
          status="warning"
          icon={<CloseCircleOutlined style={{ color: '#faad14' }} />}
          title="Paiement Annulé"
          subTitle="Vous avez annulé le paiement. Aucun montant n'a été débité."
          extra={[
            <Button type="primary" key="retry" onClick={() => navigate('/pricing')}>
              Réessayer
            </Button>,
            <Button key="dashboard" onClick={() => navigate('/dashboard')}>
              Retour au Tableau de Bord
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
}
```

### Étape 14 : Ajouter les Routes

Modifier `apps/web/src/App.tsx` :

```typescript
import { PricingPage } from './pages/PricingPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';

// Dans la section Routes :

<Route path="/pricing" element={
  <PublicRoute>
    <Layout>
      <PricingPage />
    </Layout>
  </PublicRoute>
} />

<Route path="/payment/success" element={
  <ProtectedRoute>
    <PaymentSuccessPage />
  </ProtectedRoute>
} />

<Route path="/payment/cancel" element={
  <ProtectedRoute>
    <PaymentCancelPage />
  </ProtectedRoute>
} />
```

### Étape 15 : Ajouter le Lien dans la Navigation

Modifier `apps/web/src/components/layout/Sidebar.tsx` :

```typescript
import { CreditCardIcon } from '@heroicons/react/24/outline';

// Dans le tableau navigation :
const navigation = [
  // ... autres liens ...
  { name: 'Abonnement', href: '/pricing', icon: CreditCardIcon },
];
```

---

## 🧪 Tests

### Étape 16 : Tests en Mode Sandbox

#### A. Tester la Création de Facture

1. Connectez-vous à l'application
2. Allez sur `/pricing`
3. Cliquez sur "S'abonner" pour un plan payant
4. Vérifiez que vous êtes redirigé vers PayDunya

#### B. Tester le Paiement

PayDunya fournit des numéros de test en mode sandbox :

**Numéros de test Wave :**
- Succès : +221XXXXXXXXX
- Échec : +221XXXXXXXXX

**Numéros de test MTN :**
- Succès : +226XXXXXXXXX
- Échec : +226XXXXXXXXX

(Consultez la documentation PayDunya pour les numéros exacts)

#### C. Tester le Webhook

```bash
# Utiliser ngrok pour exposer votre localhost
ngrok http 3001

# Mettre à jour l'URL de callback dans PayDunya
# avec l'URL ngrok : https://xxx.ngrok.io/api/payments/callback
```

---

## 🚀 Déploiement

### Étape 17 : Configuration Production

#### A. Variables d'Environnement Production

```env
# Mode Production
PAYDUNYA_MODE=live

# Clés Live (à obtenir après validation PayDunya)
PAYDUNYA_MASTER_KEY=prod_master_key_xxx
PAYDUNYA_PRIVATE_KEY=prod_private_key_xxx
PAYDUNYA_PUBLIC_KEY=prod_public_key_xxx
PAYDUNYA_TOKEN=prod_token_xxx

# URLs Production
PAYDUNYA_CALLBACK_URL=https://votre-domaine.com/api/payments/callback
PAYDUNYA_RETURN_URL=https://votre-domaine.com/payment/success
PAYDUNYA_CANCEL_URL=https://votre-domaine.com/payment/cancel
APP_URL=https://votre-domaine.com
```

#### B. Checklist avant Go Live

- [ ] Compte PayDunya vérifié
- [ ] Clés API Live obtenues
- [ ] Webhook configuré avec URL HTTPS
- [ ] Tests de paiement effectués
- [ ] Politiques de remboursement définies
- [ ] Conditions d'utilisation mises à jour
- [ ] Système de logging en place
- [ ] Monitoring des transactions configuré

---

## 🔧 Maintenance

### Étape 18 : Tâches Récurrentes

#### A. Vérification des Abonnements Expirés

Créer un cron job pour désactiver les abonnements expirés :

```typescript
// apps/api/src/cron/check-expired-subscriptions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkExpiredSubscriptions() {
  const now = new Date();

  const expiredSubscriptions = await prisma.subscription.updateMany({
    where: {
      status: 'active',
      endDate: {
        lt: now,
      },
    },
    data: {
      status: 'expired',
    },
  });

  console.log(`✅ ${expiredSubscriptions.count} abonnements expirés désactivés`);
}

// Exécuter toutes les heures
setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);
```

#### B. Monitoring des Transactions

- Vérifier régulièrement le dashboard PayDunya
- Logger toutes les transactions
- Alertes en cas d'échecs répétés
- Réconciliation quotidienne

---

## 📚 Ressources

### Documentation PayDunya
- Site web : https://paydunya.com
- Documentation API : https://paydunya.com/developers/
- Support : support@paydunya.com

### Ressources Additionnelles
- Tutoriels vidéo PayDunya sur YouTube
- Forum de la communauté
- Guide de sécurité des paiements

---

## ✅ Checklist Finale

### Avant de Commencer
- [ ] Compte PayDunya créé
- [ ] Clés API récupérées
- [ ] Variables d'environnement configurées
- [ ] PostgreSQL configuré

### Backend
- [ ] Package paydunya installé
- [ ] Tables créées (migration)
- [ ] Plans seedés
- [ ] Service PayDunya créé
- [ ] Routes de paiement créées
- [ ] Middleware d'abonnement créé
- [ ] Webhook configuré

### Frontend
- [ ] Service de paiement créé
- [ ] Page Pricing créée
- [ ] Pages de confirmation créées
- [ ] Routes ajoutées
- [ ] Lien dans la navigation ajouté

### Tests
- [ ] Tests en mode sandbox effectués
- [ ] Paiements test réussis
- [ ] Webhooks testés
- [ ] Limites des plans testées

### Production
- [ ] Clés live obtenues
- [ ] Variables d'environnement production configurées
- [ ] Webhook HTTPS configuré
- [ ] Tests de paiement réels effectués

---

## 🎯 Prochaines Étapes

1. **S'inscrire sur PayDunya** et récupérer les clés
2. **Configurer l'environnement** avec les variables
3. **Créer la base de données** avec les migrations
4. **Implémenter le backend** (services + routes)
5. **Créer l'interface frontend** (pages + composants)
6. **Tester en mode sandbox**
7. **Passer en production**

---

**Bon courage pour l'implémentation ! 🚀**

Si vous avez des questions pendant l'implémentation, n'hésitez pas à consulter la documentation PayDunya ou à me contacter.


