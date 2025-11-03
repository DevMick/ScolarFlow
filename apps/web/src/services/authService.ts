// ========================================
// AUTH SERVICE - SERVICE D'AUTHENTIFICATION
// ========================================

import { apiService } from './api';

/**
 * Interface pour les données d'inscription
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  establishment: string;
  directionRegionale: string;
  secteurPedagogique: string;
}

/**
 * Interface pour les données de connexion
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    establishment: string;
    phone?: string;
  };
  token?: string;
}

/**
 * Interface pour le statut de l'utilisateur
 */
export interface UserStatus {
  isAuthenticated: boolean;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    establishment: string;
    phone?: string;
  };
}

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<any>('/auth/register', data);
      
      // Si l'inscription réussit, sauvegarder le token
      if (response.success && response.token) {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
        // Ajouter un timestamp d'expiration (24h)
        sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
      }
      
      return {
        success: response.success,
        message: response.message,
        user: response.user,
        token: response.token
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  },

  /**
   * Connexion d'un utilisateur
   */
  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await apiService.post<any>('/auth/login', data);
      
      // Si la connexion réussit, sauvegarder le token
      if (response.success && response.token) {
        sessionStorage.setItem('auth_token', response.token);
        sessionStorage.setItem('user_data', JSON.stringify(response.user));
        // Ajouter un timestamp d'expiration (24h)
        sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
      }
      
      return {
        success: response.success,
        message: response.message,
        user: response.user,
        token: response.token
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  },

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_expires');
  },

  /**
   * Vérifier le statut de l'utilisateur
   */
  async getStatus(): Promise<UserStatus> {
    try {
      const response = await apiService.get<{ success: boolean; data: UserStatus['user']; message: string }>('/auth/profile');
      if (response.success && response.data) {
        return { isAuthenticated: true, user: response.data };
      }
      return { isAuthenticated: false };
    } catch (error) {
      // Si l'API retourne une erreur, l'utilisateur n'est pas authentifié
      return { isAuthenticated: false };
    }
  },

  /**
   * Obtenir les données de l'utilisateur depuis le sessionStorage
   */
  getCurrentUser(): UserStatus['user'] | null {
    try {
      // Vérifier l'expiration de la session
      const expires = sessionStorage.getItem('auth_expires');
      if (expires && Date.now() > parseInt(expires)) {
        // Session expirée, nettoyer
        this.logout();
        return null;
      }
      
      const userData = sessionStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur lors de la lecture des données utilisateur:', error);
      return null;
    }
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    const token = sessionStorage.getItem('auth_token');
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  /**
   * Obtenir le token d'authentification
   */
  getToken(): string | null {
    return sessionStorage.getItem('auth_token');
  },

  /**
   * Obtenir le token stocké
   */
  getStoredToken(): string | null {
    return this.getToken();
  },

  /**
   * Obtenir l'utilisateur stocké
   */
  getStoredUser(): UserStatus['user'] | null {
    return this.getCurrentUser();
  },

  /**
   * Obtenir le profil de l'utilisateur (vérifier le token)
   */
  async getProfile(): Promise<UserStatus['user']> {
    try {
      const response = await apiService.get<{ success: boolean; data: UserStatus['user']; message: string }>('/auth/profile');
      if (response.success && response.data) {
        sessionStorage.setItem('user_data', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('Utilisateur non authentifié');
    } catch (error: any) {
      // Si c'est une erreur 401, nettoyer le sessionStorage
      if (error.status === 401 || error.response?.status === 401) {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('user_data');
        sessionStorage.removeItem('auth_expires');
      }
      console.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  },

  /**
   * Rafraîchir le token
   */
  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await apiService.post<{ token: string }>('/auth/refresh');
      if (response.token) {
        sessionStorage.setItem('auth_token', response.token);
        // Mettre à jour l'expiration
        sessionStorage.setItem('auth_expires', (Date.now() + 24 * 60 * 60 * 1000).toString());
      }
      return response;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data: Partial<UserStatus['user']>): Promise<UserStatus['user']> {
    try {
      const response = await apiService.put<{ success: boolean; data: UserStatus['user']; message: string }>('/auth/profile', data);
      if (response.success && response.data) {
        sessionStorage.setItem('user_data', JSON.stringify(response.data));
        return response.data;
      }
      throw new Error('Erreur lors de la mise à jour du profil');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }
};

export default authService;