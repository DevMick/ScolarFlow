// ========================================
// EXTENSIONS TYPESCRIPT POUR EXPRESS
// ========================================

import { Request } from 'express';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
        role?: string;
      };
      admin?: {
        id: number;
        username: string;
        email?: string;
      };
      validatedData?: any;
      requestId?: string;
      startTime?: number;
    }
  }
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  admin?: {
    id: number;
    username: string;
    email?: string;
  };
}

export type AuthRequest = Request & {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  };
  admin?: {
    id: number;
    username: string;
    email?: string;
  };
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  requestId?: string;
  timestamp?: string;
  duration?: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Types pour les statistiques d'API
export interface ApiMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  mostUsedEndpoints: Array<{
    endpoint: string;
    count: number;
    averageTime: number;
  }>;
}

// Type pour les logs structurés
export interface StructuredLog {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userId?: number;
  error?: string;
  timestamp: string;
}

// Type pour la validation dynamique
export interface ValidationContext {
  userId: number;
  classId?: number;
  evaluationId?: number;
  maxScore?: number;
  validStudentIds?: number[];
}

// Type pour les réponses d'erreur détaillées
export interface DetailedErrorResponse extends ApiResponse {
  errorCode: string;
  errorType: 'validation' | 'authentication' | 'authorization' | 'business' | 'system';
  field?: string;
  details?: Record<string, any>;
  suggestions?: string[];
}

// Type pour les options de requête communes
export interface CommonQueryOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Type pour les headers de réponse personnalisés
export interface CustomHeaders {
  'X-Request-ID': string;
  'X-Response-Time': string;
  'X-API-Version': string;
  'X-Rate-Limit-Remaining'?: string;
  'X-Rate-Limit-Reset'?: string;
}
