export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256' as const,
  issuer: 'edustats',
  audience: 'edustats-users',
};

export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;
