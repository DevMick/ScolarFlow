// ========================================
// API SERVICE - SERVICE API PRINCIPAL
// ========================================

import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Interface pour les réponses d'erreur API
 */
interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

/**
 * Système de circuit breaker pour les erreurs 429
 */
class RateLimitCircuitBreaker {
  private blockedUntil: number = 0;
  private consecutive429Errors: number = 0;
  private readonly maxConsecutiveErrors: number = 3;
  private readonly baseBackoffMs: number = 60000; // 1 minute de base

  isBlocked(): boolean {
    return Date.now() < this.blockedUntil;
  }

  getRemainingBlockTime(): number {
    return Math.max(0, Math.ceil((this.blockedUntil - Date.now()) / 1000));
  }

  record429Error(): void {
    this.consecutive429Errors++;
    // Backoff exponentiel : 1min, 2min, 4min, etc.
    const backoffTime = this.baseBackoffMs * Math.pow(2, this.consecutive429Errors - 1);
    this.blockedUntil = Date.now() + backoffTime;
    
    // Limiter le backoff maximum à 15 minutes
    if (backoffTime > 15 * 60 * 1000) {
      this.blockedUntil = Date.now() + 15 * 60 * 1000;
    }
  }

  recordSuccess(): void {
    // Réinitialiser le compteur en cas de succès
    this.consecutive429Errors = 0;
    this.blockedUntil = 0;
  }

  shouldBlockRequest(): boolean {
    return this.consecutive429Errors >= this.maxConsecutiveErrors && this.isBlocked();
  }
}

const rateLimitCircuitBreaker = new RateLimitCircuitBreaker();

// Dédupliquer les toasts pour les erreurs 429
let last429ToastTime = 0;
const TOAST_COOLDOWN_MS = 5000; // Ne pas afficher le même toast plus d'une fois toutes les 5 secondes

function show429Toast(message: string): void {
  const now = Date.now();
  if (now - last429ToastTime > TOAST_COOLDOWN_MS) {
    last429ToastTime = now;
    toast.error(message);
  }
}

/**
 * Classe pour les erreurs API personnalisées
 */
export class ApiError extends Error {
  public status: number;
  public code?: string;
  public errors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

/**
 * Configuration de l'instance Axios
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
    timeout: 30000,
    withCredentials: true, // Permettre l'envoi des cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Intercepteur de requête pour ajouter le token d'authentification
  instance.interceptors.request.use(
    (config) => {
      // Vérifier si le circuit breaker bloque les requêtes
      if (rateLimitCircuitBreaker.shouldBlockRequest()) {
        const remainingTime = rateLimitCircuitBreaker.getRemainingBlockTime();
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        const message = `Trop de requêtes. Veuillez patienter ${minutes > 0 ? `${minutes} min et ` : ''}${seconds} sec.`;
        
        show429Toast(message);
        
        // Rejeter la requête immédiatement
        return Promise.reject(new ApiError(message, 429));
      }
      
      // Utiliser uniquement sessionStorage (pas de persistance entre sessions)
      const token = sessionStorage.getItem('auth_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Ne pas définir Content-Type pour FormData (le navigateur le fera automatiquement)
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Intercepteur de réponse pour gérer les erreurs globalement
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Enregistrer les succès pour réinitialiser le circuit breaker
      rateLimitCircuitBreaker.recordSuccess();
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const { response, config } = error;

      if (response) {
        const { status, data } = response;
        const message = data?.message || 'Une erreur est survenue';
        
        // Gestion spécifique selon le code de statut
        switch (status) {
          case 401:
            // Token expiré ou invalide - essayer de rafraîchir le token
            const originalRequest = config as any;
            
            // Éviter les boucles infinies et les tentatives sur les endpoints de refresh/login
            if (!originalRequest._retry && 
                !originalRequest.url?.includes('/auth/refresh') &&
                !originalRequest.url?.includes('/auth/login')) {
              originalRequest._retry = true;
              
              try {
                // Essayer de rafraîchir le token
                const refreshResponse = await instance.post('/auth/refresh');
                
                if (refreshResponse.data.success && refreshResponse.data.token) {
                  // Sauvegarder le nouveau token
                  sessionStorage.setItem('auth_token', refreshResponse.data.token);
                  // Mettre à jour l'expiration
                  sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
                  
                  // Retry la requête originale avec le nouveau token
                  originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.token}`;
                  return instance(originalRequest);
                }
              } catch (refreshError) {
                // Refresh token échoué, nettoyer le sessionStorage
                sessionStorage.removeItem('auth_token');
                sessionStorage.removeItem('user_data');
                sessionStorage.removeItem('auth_expires');
                console.warn('Token refresh failed, user needs to login again');
                // Ne pas rediriger ici, laisser le AuthContext gérer
              }
            } else {
              // C'est un retry ou un endpoint auth, nettoyer sans rediriger
              sessionStorage.removeItem('auth_token');
              sessionStorage.removeItem('user_data');
              sessionStorage.removeItem('auth_expires');
              console.warn('Authentication failed');
            }
            break;
            
          case 403:
            toast.error('Accès non autorisé');
            break;
            
          case 404:
            toast.error('Ressource non trouvée');
            break;
            
          case 422:
            // Erreurs de validation
            if (data?.errors) {
              const firstError = Object.values(data.errors)[0]?.[0];
              if (firstError) {
                toast.error(firstError);
              }
            } else {
              toast.error(message);
            }
            break;
            
          case 429:
            // Enregistrer l'erreur dans le circuit breaker
            rateLimitCircuitBreaker.record429Error();
            
            // Extraire le temps d'attente depuis les headers si disponible
            const retryAfter = response.headers['retry-after'] || response.headers['x-ratelimit-reset'];
            let rateLimitMessage = 'Trop de requêtes. Veuillez patienter.';
            
            if (retryAfter) {
              const retrySeconds = parseInt(retryAfter, 10);
              if (!isNaN(retrySeconds)) {
                const minutes = Math.floor(retrySeconds / 60);
                const seconds = retrySeconds % 60;
                rateLimitMessage = `Trop de requêtes. Veuillez réessayer dans ${minutes > 0 ? `${minutes} min et ` : ''}${seconds} sec.`;
              }
            } else {
              // Utiliser le temps de blocage du circuit breaker
              const remainingTime = rateLimitCircuitBreaker.getRemainingBlockTime();
              if (remainingTime > 0) {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                rateLimitMessage = `Trop de requêtes. Veuillez patienter ${minutes > 0 ? `${minutes} min et ` : ''}${seconds} sec.`;
              }
            }
            
            show429Toast(rateLimitMessage);
            break;
            
          case 500:
            toast.error('Erreur serveur. Veuillez réessayer plus tard.');
            break;
            
          default:
            toast.error(message);
        }

        throw new ApiError(message, status, data?.code, data?.errors);
      } else if (error.request) {
        // Erreur réseau
        toast.error('Erreur de connexion. Vérifiez votre connexion internet.');
        throw new ApiError('Erreur de connexion', 0);
      } else {
        // Autre erreur
        toast.error('Une erreur inattendue est survenue');
        throw new ApiError(error.message, 0);
      }
    }
  );

  return instance;
};

/**
 * Instance API principale
 */
const apiInstance = createApiInstance();

/**
 * Service API avec méthodes typées
 */
export const apiService = {
  /**
   * Requête GET
   */
  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const response = await apiInstance.get<T>(url, { params });
    return response.data;
  },

  /**
   * Requête POST
   */
  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiInstance.post<T>(url, data);
    return response.data;
  },

  /**
   * Requête PUT
   */
  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiInstance.put<T>(url, data);
    return response.data;
  },

  /**
   * Requête PATCH
   */
  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await apiInstance.patch<T>(url, data);
    return response.data;
  },

  /**
   * Requête DELETE
   */
  async delete<T = any>(url: string): Promise<T> {
    const response = await apiInstance.delete<T>(url);
    return response.data;
  },

  /**
   * Upload de fichier
   */
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiInstance.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  /**
   * Téléchargement de fichier
   */
  async download(url: string, filename?: string): Promise<void> {
    const response = await apiInstance.get(url, {
      responseType: 'blob',
    });

    // Créer un lien de téléchargement
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Requête avec retry automatique
   */
  async withRetry<T = any>(
    request: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await request();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Attendre avant de réessayer (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }

    throw lastError!;
  },

  /**
   * Requêtes en lot
   */
  async batch<T = any>(requests: Array<() => Promise<T>>): Promise<T[]> {
    return Promise.all(requests.map(request => request()));
  },

  /**
   * Vérification de la santé de l'API
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
};

export default apiService;