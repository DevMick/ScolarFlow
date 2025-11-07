import { PrismaClient } from '@prisma/client';

// Instance globale de Prisma pour éviter les erreurs "PrismaClient is already connected"
// sur Vercel Serverless Functions
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Toujours stocker dans global pour Vercel Serverless Functions
// Cela permet de réutiliser l'instance entre les invocations
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

