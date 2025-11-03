// ========================================
// GESTION D'ERREURS - UX UTILISATEUR OPTIMISÉE
// ========================================

import React from 'react';
import toast from 'react-hot-toast';
import type { ToastConfig, NotificationService } from '../types';

/**
 * Types d'erreurs dans l'application
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  BUSINESS_RULE = 'business_rule',
  UNKNOWN = 'unknown'
}

/**
 * Severité des erreurs
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Interface pour les erreurs enrichies
 */
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  statusCode?: number;
  details?: any;
  userMessage?: string;
  timestamp: number;
  requestId?: string;
  retryable: boolean;
  context?: Record<string, any>;
}

/**
 * Interface pour les erreurs d'API
 */
export interface ApiError {
  message: string;
  status: number;
  statusText?: string;
  data?: any;
  requestId?: string;
  timestamp?: string;
}

/**
 * Configuration pour la gestion d'erreurs
 */
interface ErrorHandlerConfig {
  showToasts: boolean;
  logToConsole: boolean;
  reportToService: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Classe principale de gestion d'erreurs
 */
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private errorListeners = new Set<(error: AppError) => void>();
  private retryQueue = new Map<string, { count: number; lastAttempt: number }>();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      showToasts: true,
      logToConsole: true,
      reportToService: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };
  }

  /**
   * Traite une erreur et retourne une AppError enrichie
   */
  handleError(error: any, context?: Record<string, any>): AppError {
    const appError = this.enrichError(error, context);
    
    // Logger l'erreur
    if (this.config.logToConsole) {
      this.logError(appError);
    }

    // Afficher un toast si configuré
    if (this.config.showToasts) {
      this.showErrorToast(appError);
    }

    // Notifier les listeners
    this.notifyListeners(appError);

    // Reporter l'erreur si configuré
    if (this.config.reportToService) {
      this.reportError(appError);
    }

    return appError;
  }

  /**
   * Enrichit une erreur avec des métadonnées
   */
  private enrichError(error: any, context?: Record<string, any>): AppError {
    // Si c'est déjà une AppError, on la retourne telle quelle
    if (error.type && error.severity) {
      return error as AppError;
    }

    const timestamp = Date.now();
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;
    let userMessage = 'Une erreur inattendue s\'est produite';
    let statusCode: number | undefined;
    let retryable = false;

    // Analyser le type d'erreur
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.HIGH;
      userMessage = 'Problème de connexion réseau. Vérifiez votre connexion internet.';
      retryable = true;
    } else if (error.response) {
      // Erreur HTTP
      statusCode = error.response.status;
      
      switch (statusCode) {
        case 400:
          type = ErrorType.VALIDATION;
          severity = ErrorSeverity.LOW;
          userMessage = 'Données invalides. Vérifiez les informations saisies.';
          break;
        case 401:
          type = ErrorType.AUTHENTICATION;
          severity = ErrorSeverity.HIGH;
          userMessage = 'Session expirée. Veuillez vous reconnecter.';
          break;
        case 403:
          type = ErrorType.AUTHORIZATION;
          severity = ErrorSeverity.MEDIUM;
          userMessage = 'Vous n\'avez pas l\'autorisation pour cette action.';
          break;
        case 404:
          type = ErrorType.NOT_FOUND;
          severity = ErrorSeverity.LOW;
          userMessage = 'Élément non trouvé ou supprimé.';
          break;
        case 429:
          type = ErrorType.RATE_LIMIT;
          severity = ErrorSeverity.MEDIUM;
          userMessage = 'Trop de requêtes. Veuillez patienter avant de réessayer.';
          retryable = true;
          break;
        case 422:
          type = ErrorType.BUSINESS_RULE;
          severity = ErrorSeverity.MEDIUM;
          userMessage = error.response.data?.message || 'Règle métier violée.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          type = ErrorType.SERVER;
          severity = ErrorSeverity.HIGH;
          userMessage = 'Erreur serveur temporaire. Veuillez réessayer.';
          retryable = true;
          break;
      }
    } else if (error.name === 'ValidationError') {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
      userMessage = 'Erreur de validation des données.';
    }

    // Extraire les détails de l'erreur
    let details: any = null;
    if (error.response?.data) {
      details = error.response.data;
      // Utiliser le message du serveur s'il est disponible et en français
      if (details.message && typeof details.message === 'string') {
        userMessage = details.message;
      }
    }

    const appError: AppError = {
      name: error.name || 'AppError',
      message: error.message || userMessage,
      type,
      severity,
      statusCode,
      details,
      userMessage,
      timestamp,
      requestId: details?.requestId || context?.requestId,
      retryable,
      context,
      stack: error.stack
    };

    return appError;
  }

  /**
   * Affiche un toast d'erreur approprié
   */
  private showErrorToast(error: AppError): void {
    const config: Partial<ToastConfig> = {
      type: 'error',
      title: this.getErrorTitle(error),
      message: error.userMessage,
      duration: this.getToastDuration(error.severity)
    };

    // Ajouter un bouton de retry si applicable
    if (error.retryable && error.context?.retryFunction) {
      config.action = {
        label: 'Réessayer',
        onClick: error.context.retryFunction
      };
    }

    toast.error(error.userMessage || error.message, {
      duration: config.duration,
      position: 'bottom-right',
      style: {
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fca5a5'
      },
      icon: '⚠️'
    });
  }

  /**
   * Log l'erreur dans la console
   */
  private logError(error: AppError): void {
    const logMethod = this.getLogMethod(error.severity);
    
    logMethod(
      `[${error.type.toUpperCase()}] ${error.message}`,
      {
        severity: error.severity,
        statusCode: error.statusCode,
        timestamp: new Date(error.timestamp).toISOString(),
        requestId: error.requestId,
        context: error.context,
        details: error.details,
        stack: error.stack
      }
    );
  }

  /**
   * Ajoute un listener d'erreurs
   */
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Notifie tous les listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Erreur dans un listener d\'erreur:', listenerError);
      }
    });
  }

  /**
   * Vérifie si une erreur est retryable
   */
  isRetryable(error: AppError, operationId?: string): boolean {
    if (!error.retryable) return false;
    
    if (operationId) {
      const retryInfo = this.retryQueue.get(operationId);
      if (retryInfo && retryInfo.count >= this.config.maxRetries) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Enregistre une tentative de retry
   */
  recordRetryAttempt(operationId: string): void {
    const existing = this.retryQueue.get(operationId);
    this.retryQueue.set(operationId, {
      count: (existing?.count || 0) + 1,
      lastAttempt: Date.now()
    });
  }

  /**
   * Nettoie les informations de retry
   */
  clearRetryInfo(operationId: string): void {
    this.retryQueue.delete(operationId);
  }

  /**
   * Récupère le délai de retry approprié
   */
  getRetryDelay(attempt: number): number {
    // Backoff exponentiel avec jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000; // Jusqu'à 1 seconde de jitter
    
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 secondes
  }

  // Méthodes utilitaires privées
  private getErrorTitle(error: AppError): string {
    switch (error.type) {
      case ErrorType.NETWORK:
        return 'Problème de connexion';
      case ErrorType.VALIDATION:
        return 'Données invalides';
      case ErrorType.AUTHENTICATION:
        return 'Authentification requise';
      case ErrorType.AUTHORIZATION:
        return 'Accès refusé';
      case ErrorType.NOT_FOUND:
        return 'Élément introuvable';
      case ErrorType.RATE_LIMIT:
        return 'Limite atteinte';
      case ErrorType.SERVER:
        return 'Erreur serveur';
      case ErrorType.BUSINESS_RULE:
        return 'Règle métier';
      default:
        return 'Erreur';
    }
  }

  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000;
      case ErrorSeverity.MEDIUM:
        return 5000;
      case ErrorSeverity.HIGH:
        return 8000;
      case ErrorSeverity.CRITICAL:
        return 10000;
      default:
        return 5000;
    }
  }

  private getLogMethod(severity: ErrorSeverity): Function {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.log;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private async reportError(error: AppError): Promise<void> {
    // Cette méthode pourrait envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
    try {
      // Exemple d'implémentation
      console.log('Reporting error to monitoring service:', error);
    } catch (reportError) {
      console.error('Impossible de reporter l\'erreur:', reportError);
    }
  }
}

// ========================================
// INSTANCE GLOBALE ET UTILITAIRES
// ========================================

/**
 * Instance globale du gestionnaire d'erreurs
 */
export const globalErrorHandler = new ErrorHandler({
  showToasts: true,
  logToConsole: true,
  reportToService: false // À activer en production
});

/**
 * Service de notifications intégré
 */
export const notificationService: NotificationService = {
  success: (message: string, options = {}) => {
    toast.success(message, {
      duration: options.duration || 4000,
      position: 'bottom-right',
      style: {
        background: '#f0fdf4',
        color: '#166534',
        border: '1px solid #bbf7d0'
      },
      icon: '✅'
    });
  },

  error: (message: string, options = {}) => {
    toast.error(message, {
      duration: options.duration || 5000,
      position: 'bottom-right',
      style: {
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fca5a5'
      },
      icon: '⚠️'
    });
  },

  warning: (message: string, options = {}) => {
    toast(message, {
      duration: options.duration || 4000,
      position: 'bottom-right',
      style: {
        background: '#fffbeb',
        color: '#92400e',
        border: '1px solid #fed7aa'
      },
      icon: '⚠️'
    });
  },

  info: (message: string, options = {}) => {
    toast(message, {
      duration: options.duration || 4000,
      position: 'bottom-right',
      style: {
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #93c5fd'
      },
      icon: 'ℹ️'
    });
  },

  dismiss: (id?: string) => {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  },

  dismissAll: () => {
    toast.dismiss();
  }
};

/**
 * Utilitaires pour la gestion d'erreurs
 */
export const errorUtils = {
  /**
   * Crée une erreur d'application
   */
  createAppError: (
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): AppError => {
    return {
      name: 'AppError',
      message,
      type,
      severity,
      userMessage: message,
      timestamp: Date.now(),
      retryable: false,
      context
    };
  },

  /**
   * Détermine si une erreur est due à un problème réseau
   */
  isNetworkError: (error: any): boolean => {
    return (
      error.code === 'NETWORK_ERROR' ||
      error.name === 'NetworkError' ||
      !error.response
    );
  },

  /**
   * Extrait le message d'erreur utilisateur le plus approprié
   */
  extractUserMessage: (error: any): string => {
    if (error.userMessage) return error.userMessage;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    return 'Une erreur inattendue s\'est produite';
  },

  /**
   * Vérifie si une erreur nécessite une déconnexion
   */
  requiresLogout: (error: AppError): boolean => {
    return error.type === ErrorType.AUTHENTICATION && error.statusCode === 401;
  },

  /**
   * Formate les erreurs de validation pour l'affichage
   */
  formatValidationErrors: (errors: Record<string, string[]>): string => {
    const messages = Object.entries(errors)
      .map(([field, fieldErrors]) => `${field}: ${fieldErrors.join(', ')}`)
      .join('; ');
    
    return messages || 'Erreurs de validation';
  },

  /**
   * Créer un wrapper pour les fonctions async avec gestion d'erreur
   */
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        globalErrorHandler.handleError(error, context);
        return undefined;
      }
    };
  },

  /**
   * Retry automatique avec backoff
   */
  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationId?: string
  ): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Nettoyer les infos de retry en cas de succès
        if (operationId) {
          globalErrorHandler.clearRetryInfo(operationId);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (operationId) {
          globalErrorHandler.recordRetryAttempt(operationId);
        }
        
        // Ne pas retry si c'est la dernière tentative
        if (attempt === maxRetries) {
          break;
        }
        
        // Vérifier si l'erreur est retryable
        const appError = globalErrorHandler.handleError(error);
        if (!appError.retryable) {
          break;
        }
        
        // Attendre avant le prochain essai
        const delay = globalErrorHandler.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw globalErrorHandler.handleError(lastError);
  }
};

/**
 * Hook React pour la gestion d'erreurs dans les composants
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: any, context?: Record<string, any>) => {
    return globalErrorHandler.handleError(error, context);
  }, []);

  const clearError = React.useCallback(() => {
    // Cette fonction pourrait être étendue pour gérer un état d'erreur local
  }, []);

  return {
    handleError,
    clearError,
    notificationService
  };
};

/**
 * Hook pour créer des fonctions avec gestion d'erreur automatique
 */
export const useAsyncWithError = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  context?: Record<string, any>
) => {
  return React.useCallback(
    errorUtils.withErrorHandling(asyncFn, context),
    [asyncFn, context]
  );
};

// Export par défaut
export default globalErrorHandler;
