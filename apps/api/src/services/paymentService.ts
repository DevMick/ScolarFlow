// Service de gestion des paiements
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PaymentData {
  userId: number;
  screenshot?: Buffer;
  screenshotType?: string;
  isPaid?: boolean;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: {
    id: number;
    userId: number;
    datePaiement: Date;
    isPaid: boolean;
    hasScreenshot: boolean;
    createdAt: Date;
  };
}

export class PaymentService {
  
  /**
   * Créer un nouveau paiement
   * Vérifie qu'aucun abonnement actif n'existe avant de créer
   */
  static async createPayment(data: PaymentData): Promise<PaymentResponse> {
    try {
      // Vérifier qu'aucun abonnement actif n'existe
      const activeSubscription = await this.checkActiveSubscription(data.userId);
      if (activeSubscription.hasActiveSubscription) {
        return {
          success: false,
          message: `Vous avez déjà un abonnement actif jusqu'au ${activeSubscription.subscriptionEndDate?.toLocaleDateString('fr-FR')}. Vous pourrez renouveler après cette date.`
        };
      }

      // Vérifier qu'aucun paiement en attente n'existe déjà
      const pendingPayment = await (prisma as any).paiements.findFirst({
        where: {
          user_id: data.userId,
          is_paid: false
        }
      });

      if (pendingPayment) {
        return {
          success: false,
          message: 'Vous avez déjà un paiement en attente de validation. Veuillez attendre la validation de l\'administrateur.'
        };
      }

      const payment = await (prisma as any).paiements.create({
        data: {
          user_id: data.userId,
          screenshot: data.screenshot || null,
          screenshot_type: data.screenshotType || null,
          is_paid: data.isPaid || false,
          montant: data.isPaid ? 3000 : null, // Montant en FCFA
          type_abonnement: data.isPaid ? 'annuel' : null
        },
        select: {
          id: true,
          user_id: true,
          date_paiement: true,
          is_paid: true,
          screenshot: true,
          screenshot_type: true,
          created_at: true
        }
      });

      // Transformer en camelCase pour le frontend
      return {
        success: true,
        message: 'Paiement créé avec succès',
        payment: {
          id: payment.id,
          userId: payment.user_id,
          datePaiement: payment.date_paiement,
          isPaid: payment.is_paid,
          hasScreenshot: payment.screenshot !== null,
          createdAt: payment.created_at
        }
      };

    } catch (error) {
      console.error('Erreur lors de la création du paiement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Détails de l\'erreur:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        data: data
      });
      return {
        success: false,
        message: `Erreur lors de la création du paiement: ${errorMessage}`
      };
    }
  }

  /**
   * Récupérer un paiement par ID
   */
  static async getPaymentById(paymentId: number, userId: number): Promise<PaymentResponse> {
    try {
      const payment = await (prisma as any).paiements.findFirst({
        where: {
          id: paymentId,
          user_id: userId
        },
        select: {
          id: true,
          user_id: true,
          date_paiement: true,
          is_paid: true,
          screenshot: true,
          screenshot_type: true,
          created_at: true
        }
      });

      if (!payment) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      // Transformer en camelCase pour le frontend
      return {
        success: true,
        message: 'Paiement récupéré avec succès',
        payment: {
          id: payment.id,
          userId: payment.user_id,
          datePaiement: payment.date_paiement,
          isPaid: payment.is_paid,
          hasScreenshot: payment.screenshot !== null,
          createdAt: payment.created_at
        }
      };

    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du paiement'
      };
    }
  }

  /**
   * Récupérer les paiements d'un utilisateur
   */
  static async getUserPayments(userId: number): Promise<PaymentResponse> {
    try {
      const payments = await (prisma as any).paiements.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          user_id: true,
          date_paiement: true,
          is_paid: true,
          screenshot: true,
          screenshot_type: true,
          date_debut_abonnement: true,
          date_fin_abonnement: true,
          montant: true,
          type_abonnement: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      // Transformer en camelCase pour le frontend
      return {
        success: true,
        message: 'Paiements récupérés avec succès',
        payment: payments.map((payment: any) => ({
          id: payment.id,
          userId: payment.user_id,
          datePaiement: payment.date_paiement,
          isPaid: payment.is_paid,
          hasScreenshot: payment.screenshot !== null,
          dateDebutAbonnement: payment.date_debut_abonnement,
          dateFinAbonnement: payment.date_fin_abonnement,
          montant: payment.montant,
          typeAbonnement: payment.type_abonnement,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        })) as any
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des paiements'
      };
    }
  }

  /**
   * Vérifier si un abonnement actif existe pour un utilisateur
   * Retourne true si un abonnement valide (isPaid = true ET dateFinAbonnement > maintenant) existe
   */
  static async checkActiveSubscription(userId: number): Promise<{
    hasActiveSubscription: boolean;
    subscriptionEndDate?: Date;
  }> {
    try {
      const now = new Date();
      const activePayment = await (prisma as any).paiements.findFirst({
        where: {
          user_id: userId,
          is_paid: true,
          date_fin_abonnement: {
            gt: now // date_fin_abonnement > maintenant
          }
        },
        select: {
          date_fin_abonnement: true
        },
        orderBy: {
          date_fin_abonnement: 'desc' // Prendre le plus récent
        }
      });

      return {
        hasActiveSubscription: activePayment !== null,
        subscriptionEndDate: activePayment?.date_fin_abonnement || undefined
      };

    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement actif:', error);
      return {
        hasActiveSubscription: false
      };
    }
  }

  /**
   * Vérifier le statut de paiement d'un utilisateur
   * Retourne true si l'utilisateur a un abonnement actif (isPaid = true ET dateFinAbonnement > maintenant)
   */
  static async checkUserPaymentStatus(userId: number): Promise<{ 
    isPaid: boolean;
    subscriptionEndDate?: Date;
  }> {
    try {
      const subscriptionStatus = await this.checkActiveSubscription(userId);
      
      return {
        isPaid: subscriptionStatus.hasActiveSubscription,
        subscriptionEndDate: subscriptionStatus.subscriptionEndDate
      };

    } catch (error) {
      console.error('Erreur lors de la vérification du statut de paiement:', error);
      return {
        isPaid: false
      };
    }
  }

  /**
   * Mettre à jour le statut d'un paiement
   */
  static async updatePaymentStatus(paymentId: number, userId: number, isPaid: boolean): Promise<PaymentResponse> {
    try {
      const payment = await (prisma as any).paiements.updateMany({
        where: {
          id: paymentId,
          user_id: userId
        },
        data: {
          is_paid: isPaid
        }
      });

      if (payment.count === 0) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      return {
        success: true,
        message: 'Statut du paiement mis à jour avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du paiement'
      };
    }
  }

  /**
   * Ajouter une capture d'écran à un paiement
   */
  static async addScreenshotToPayment(paymentId: number, userId: number, screenshot: Buffer, screenshotType: string): Promise<PaymentResponse> {
    try {
      const payment = await (prisma as any).paiements.updateMany({
        where: {
          id: paymentId,
          user_id: userId
        },
        data: {
          screenshot: screenshot,
          screenshot_type: screenshotType
        }
      });

      if (payment.count === 0) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      return {
        success: true,
        message: 'Capture d\'écran ajoutée avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de l\'ajout de la capture d\'écran:', error);
      return {
        success: false,
        message: 'Erreur lors de l\'ajout de la capture d\'écran'
      };
    }
  }

  /**
   * Récupérer la capture d'écran d'un paiement
   */
  static async getPaymentScreenshot(paymentId: number, userId: number): Promise<{ success: boolean; screenshot?: Buffer; screenshotType?: string; message: string }> {
    try {
      const payment = await (prisma as any).paiements.findFirst({
        where: {
          id: paymentId,
          user_id: userId,
          screenshot: { not: null }
        },
        select: {
          screenshot: true,
          screenshot_type: true
        }
      });

      if (!payment || !payment.screenshot) {
        return {
          success: false,
          message: 'Capture d\'écran non trouvée'
        };
      }

      return {
        success: true,
        screenshot: payment.screenshot,
        screenshotType: payment.screenshot_type,
        message: 'Capture d\'écran récupérée avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la récupération de la capture d\'écran:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération de la capture d\'écran'
      };
    }
  }

  /**
   * Supprimer un paiement
   */
  static async deletePayment(paymentId: number, userId: number): Promise<PaymentResponse> {
    try {
      const payment = await (prisma as any).paiements.deleteMany({
        where: {
          id: paymentId,
          user_id: userId
        }
      });

      if (payment.count === 0) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      return {
        success: true,
        message: 'Paiement supprimé avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la suppression du paiement:', error);
      return {
        success: false,
        message: 'Erreur lors de la suppression du paiement'
      };
    }
  }

  /**
   * Obtenir les statistiques des paiements d'un utilisateur
   */
  static async getUserPaymentStats(userId: number): Promise<{
    success: boolean;
    stats?: {
      totalPayments: number;
      paidPayments: number;
      pendingPayments: number;
      paymentsWithScreenshots: number;
    };
    message: string;
  }> {
    try {
      const totalPayments = await (prisma as any).paiements.count({
        where: { user_id: userId }
      });

      const paidPayments = await (prisma as any).paiements.count({
        where: { user_id: userId, is_paid: true }
      });

      const pendingPayments = await (prisma as any).paiements.count({
        where: { user_id: userId, is_paid: false }
      });

      const paymentsWithScreenshots = await (prisma as any).paiements.count({
        where: { 
          user_id: userId, 
          screenshot: { not: null } 
        }
      });

      return {
        success: true,
        stats: {
          totalPayments,
          paidPayments,
          pendingPayments,
          paymentsWithScreenshots
        },
        message: 'Statistiques récupérées avec succès'
      };

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        success: false,
        message: 'Erreur lors du calcul des statistiques'
      };
    }
  }

  /**
   * Récupérer tous les paiements pour l'administration
   * @param validatedOnly - true pour seulement les validés, false pour seulement les non validés, undefined pour tous
   */
  static async getAllPayments(validatedOnly?: boolean): Promise<{
    success: boolean;
    payments: any[];
    message: string;
  }> {
    try {
      // Si validatedOnly est undefined, on ne filtre pas (tous les paiements)
      const whereClause = validatedOnly !== undefined 
        ? { is_paid: validatedOnly } 
        : {};
      
      const payments = await (prisma as any).paiements.findMany({
        where: whereClause,
        select: {
          id: true,
          user_id: true,
          date_paiement: true,
          is_paid: true,
          screenshot: true,
          screenshot_type: true,
          created_at: true,
          updated_at: true,
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      });

      // Transformer en camelCase pour le frontend
      return {
        success: true,
        payments: payments.map((payment: any) => ({
          id: payment.id,
          userId: payment.user_id,
          datePaiement: payment.date_paiement instanceof Date 
            ? payment.date_paiement.toISOString() 
            : (payment.date_paiement ? new Date(payment.date_paiement).toISOString() : null),
          isPaid: payment.is_paid,
          hasScreenshot: payment.screenshot !== null,
          screenshotType: payment.screenshot_type || null,
          screenshotUrl: payment.screenshot !== null 
            ? `/api/admin/payments/${payment.id}/screenshot` 
            : null,
          createdAt: payment.created_at instanceof Date 
            ? payment.created_at.toISOString() 
            : new Date(payment.created_at).toISOString(),
          updatedAt: payment.updated_at instanceof Date 
            ? payment.updated_at.toISOString() 
            : new Date(payment.updated_at).toISOString(),
          user: payment.users ? {
            id: payment.users.id,
            email: payment.users.email,
            firstName: payment.users.first_name,
            lastName: payment.users.last_name
          } : null
        })),
        message: 'Paiements récupérés avec succès'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Erreur lors de la récupération des paiements admin:', {
        message: errorMessage,
        stack: errorStack,
        error
      });
      return {
        success: false,
        payments: [],
        message: `Erreur lors de la récupération des paiements: ${errorMessage}`
      };
    }
  }

  /**
   * Mettre à jour le statut d'un paiement (admin)
   * Si isPaid = true, crée ou met à jour l'abonnement avec les dates (1 an à partir de maintenant)
   */
  static async updatePaymentStatusAdmin(paymentId: number, isPaid: boolean): Promise<PaymentResponse> {
    try {
      // Récupérer le paiement existant pour obtenir le userId
      const existingPayment = await (prisma as any).paiements.findUnique({
        where: { id: paymentId },
        select: { user_id: true }
      });

      if (!existingPayment) {
        return {
          success: false,
          message: 'Paiement non trouvé'
        };
      }

      // Si on valide le paiement (isPaid = true), créer/mettre à jour l'abonnement
      if (isPaid) {
        const now = new Date();
        const dateDebutAbonnement = new Date(now);
        const dateFinAbonnement = new Date(now);
        dateFinAbonnement.setFullYear(dateFinAbonnement.getFullYear() + 1); // +1 an (365 jours)

        // Vérifier s'il existe déjà un abonnement actif
        const activeSubscription = await this.checkActiveSubscription(existingPayment.user_id);
        
        // Si un abonnement actif existe, ne pas permettre la validation
        if (activeSubscription.hasActiveSubscription) {
          return {
            success: false,
            message: `Impossible de valider ce paiement. L'utilisateur a déjà un abonnement actif jusqu'au ${activeSubscription.subscriptionEndDate?.toLocaleDateString('fr-FR')}.`
          };
        }

        // Mettre à jour le paiement avec l'abonnement
        const payment = await (prisma as any).paiements.update({
          where: { id: paymentId },
          data: {
            is_paid: true,
            date_debut_abonnement: dateDebutAbonnement,
            date_fin_abonnement: dateFinAbonnement,
            montant: 3000, // Montant en FCFA
            type_abonnement: 'annuel'
          }
        });

        return {
          success: true,
          message: `Paiement validé avec succès. Abonnement créé jusqu'au ${dateFinAbonnement.toLocaleDateString('fr-FR')}.`
        };
      } else {
        // Si on invalide (isPaid = false), supprimer les dates d'abonnement
        const payment = await (prisma as any).paiements.update({
          where: { id: paymentId },
          data: {
            is_paid: false,
            date_debut_abonnement: null,
            date_fin_abonnement: null,
            montant: null,
            type_abonnement: null
          }
        });

        return {
          success: true,
          message: 'Paiement invalidé avec succès'
        };
      }

    } catch (error) {
      console.error('Erreur lors de la mise à jour du paiement admin:', error);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du paiement'
      };
    }
  }

  /**
   * Obtenir les statistiques globales des paiements
   */
  static async getGlobalPaymentStats(): Promise<{
    success: boolean;
    stats?: {
      totalPayments: number;
      paidPayments: number;
      pendingPayments: number;
      paymentsWithScreenshots: number;
      totalUsers: number;
    };
    message: string;
  }> {
    try {
      const totalPayments = await (prisma as any).paiements.count();
      const paidPayments = await (prisma as any).paiements.count({ where: { is_paid: true } });
      const pendingPayments = await (prisma as any).paiements.count({ where: { is_paid: false } });
      const paymentsWithScreenshots = await (prisma as any).paiements.count({ 
        where: { screenshot: { not: null } } 
      });
      const totalUsers = await (prisma as any).users.count();

      return {
        success: true,
        stats: {
          totalPayments,
          paidPayments,
          pendingPayments,
          paymentsWithScreenshots,
          totalUsers
        },
        message: 'Statistiques globales récupérées avec succès'
      };

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques globales:', error);
      return {
        success: false,
        message: 'Erreur lors du calcul des statistiques globales'
      };
    }
  }
}

export default PaymentService;
