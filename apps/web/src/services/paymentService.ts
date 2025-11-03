// Service de gestion des paiements côté frontend
import { apiService } from './api';

export interface PaymentData {
  id?: number;
  userId: number;
  datePaiement?: string;
  isPaid: boolean;
  hasScreenshot?: boolean;
  screenshotType?: string | null;
  screenshotUrl?: string | null;
  dateDebutAbonnement?: string | null;
  dateFinAbonnement?: string | null;
  montant?: number | null;
  typeAbonnement?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: PaymentData;
}

export interface PaymentStats {
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  paymentsWithScreenshots: number;
}

export class PaymentService {
  
  /**
   * Créer un nouveau paiement
   */
  static async createPayment(): Promise<PaymentResponse> {
    try {
      const response = await apiService.post<PaymentResponse>('/payments');
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la création du paiement:', error);
      throw error;
    }
  }

  /**
   * Ajouter une capture d'écran à un paiement
   */
  static async addScreenshotToPayment(paymentId: number, screenshot: File): Promise<PaymentResponse> {
    try {
      const formData = new FormData();
      formData.append('screenshot', screenshot);

      // Ne pas définir Content-Type manuellement pour permettre au navigateur de définir le boundary
      const response = await apiService.post<PaymentResponse>(
        `/payments/${paymentId}/screenshot`,
        formData
      );
      
      return response;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de la capture d\'écran:', error);
      throw error;
    }
  }

  /**
   * Récupérer les paiements de l'utilisateur
   */
  static async getUserPayments(): Promise<{ success: boolean; payment: PaymentData[]; message: string }> {
    try {
      const response = await apiService.get<{ success: boolean; payment: PaymentData[]; message: string }>('/payments');
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des paiements:', error);
      return {
        success: false,
        payment: [],
        message: 'Erreur lors de la récupération des paiements'
      };
    }
  }

  /**
   * Récupérer un paiement spécifique
   */
  static async getPaymentById(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await apiService.get<PaymentResponse>(`/payments/${paymentId}`);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du paiement:', error);
      throw error;
    }
  }

  /**
   * Récupérer la capture d'écran d'un paiement (pour utilisateur normal)
   */
  static async getPaymentScreenshot(paymentId: number): Promise<string> {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const token = sessionStorage.getItem('auth_token');
      
      const response = await fetch(`${baseUrl}/api/payments/${paymentId}/screenshot`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la capture d\'écran');
      }
      
      // Convertir le blob en URL pour l'affichage
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la capture d\'écran:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un paiement
   */
  static async updatePaymentStatus(paymentId: number, isPaid: boolean): Promise<PaymentResponse> {
    try {
      const response = await apiService.put<PaymentResponse>(`/payments/${paymentId}/status`, {
        isPaid
      });
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      throw error;
    }
  }

  /**
   * Vérifier le statut de paiement de l'utilisateur connecté
   */
  static async checkPaymentStatus(): Promise<{ 
    success: boolean; 
    isPaid: boolean; 
    subscriptionEndDate?: string;
    message: string;
  }> {
    try {
      const response = await apiService.get<{ 
        success: boolean; 
        isPaid: boolean; 
        subscriptionEndDate?: string;
        message: string;
      }>('/payments/status');
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la vérification du statut de paiement:', error);
      // En cas d'erreur, considérer que le paiement n'est pas validé
      return {
        success: false,
        isPaid: false,
        message: 'Erreur lors de la vérification du statut de paiement'
      };
    }
  }

  /**
   * Obtenir les statistiques des paiements
   */
  static async getPaymentStats(): Promise<PaymentStats> {
    try {
      const response = await apiService.get<{ success: boolean; stats: PaymentStats }>('/payments/stats');
      return response.stats;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Supprimer un paiement
   */
  static async deletePayment(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await apiService.delete<PaymentResponse>(`/payments/${paymentId}`);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la suppression du paiement:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les paiements (pour l'administration)
   * @param validatedOnly - true pour seulement les validés, false pour seulement les non validés, undefined pour tous
   */
  static async getAllPayments(validatedOnly?: boolean): Promise<{
    success: boolean;
    payments: PaymentData[];
    message: string;
  }> {
    try {
      // Construire l'URL avec le paramètre validated
      let url = '/admin/payments';
      if (validatedOnly !== undefined) {
        url += `?validated=${validatedOnly}`;
      }
      
      const response = await apiService.get<{
        success: boolean;
        payments: PaymentData[];
        message: string;
      }>(url);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des paiements:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'un paiement (pour l'administration)
   */
  static async updatePaymentStatus(paymentId: number, status: 'validated' | 'rejected'): Promise<PaymentResponse> {
    try {
      const isPaid = status === 'validated';
      const response = await apiService.put<PaymentResponse>(`/admin/payments/${paymentId}/status`, {
        isPaid
      });
      return response;
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut du paiement:', error);
      throw error;
    }
  }

  /**
   * Processus complet de soumission d'un paiement avec capture d'écran
   */
  static async submitPaymentWithScreenshot(screenshot: File): Promise<PaymentResponse> {
    try {
      console.log('🚀 Début du processus de soumission:', {
        fileName: screenshot.name,
        fileSize: screenshot.size,
        fileType: screenshot.type
      });

      // 1. Créer le paiement
      console.log('📝 Étape 1: Création du paiement...');
      const createResponse = await this.createPayment();
      
      if (!createResponse.success || !createResponse.payment) {
        throw new Error(createResponse.message || 'Erreur lors de la création du paiement');
      }

      console.log('✅ Paiement créé avec ID:', createResponse.payment.id);

      // 2. Ajouter la capture d'écran
      console.log('📸 Étape 2: Upload de la capture d\'écran...');
      const screenshotResponse = await this.addScreenshotToPayment(
        createResponse.payment.id!,
        screenshot
      );

      if (!screenshotResponse.success) {
        console.error('❌ Erreur lors de l\'upload:', screenshotResponse.message);
        throw new Error(screenshotResponse.message || 'Erreur lors de l\'ajout de la capture d\'écran');
      }

      console.log('✅ Capture d\'écran uploadée avec succès');

      return {
        success: true,
        message: 'Paiement soumis avec succès ! Nous vérifierons votre paiement sous 24h.',
        payment: createResponse.payment
      };

    } catch (error: any) {
      console.error('❌ Erreur lors de la soumission du paiement:', error);
      throw error;
    }
  }

  /**
   * Valider le type de fichier
   */
  static validateScreenshot(file: File): { isValid: boolean; error?: string } {
    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'
      };
    }

    // Vérifier la taille (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Fichier trop volumineux. Taille maximale : 5MB.'
      };
    }

    return { isValid: true };
  }

  /**
   * Optimiser une image avant l'upload
   */
  static async optimizeImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Erreur lors de l\'optimisation de l\'image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export default PaymentService;
