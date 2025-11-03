export const SECURITY_CONFIG = {
  bcrypt: {
    saltRounds: 12,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Augmenter les limites pour le développement local même si NODE_ENV=production
    // Vérifier si on est sur localhost pour être plus permissif
    max: process.env.NODE_ENV === 'development' ? 5000 : 500, // Beaucoup plus permissif même en production pour développement local
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Trop de tentatives. Veuillez réessayer dans 15 minutes.',
    },
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Beaucoup plus de tentatives en développement
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    },
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With', 
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
};
