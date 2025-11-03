import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PaymentService from '../services/paymentService';
import { PaymentData } from '../services/paymentService';

interface Payment extends PaymentData {
  id: number;
  userId: number;
  datePaiement: string;
  isPaid: boolean;
  hasScreenshot: boolean;
  dateDebutAbonnement?: string | null;
  dateFinAbonnement?: string | null;
  montant?: number | null;
  typeAbonnement?: string | null;
  createdAt: string;
}

export const PaymentHistory: React.FC = () => {
  const { user, isPaid, subscriptionEndDate } = useAuth() as any;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  
  // Vérifier si l'abonnement est expiré
  const isSubscriptionExpired = subscriptionEndDate 
    ? new Date(subscriptionEndDate) <= new Date() 
    : false;
  const hasActiveSubscription = isPaid && subscriptionEndDate && new Date(subscriptionEndDate) > new Date();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await PaymentService.getUserPayments();
      if (result.success && result.payment) {
        const paymentsArray = Array.isArray(result.payment) ? result.payment : [result.payment];
        setPayments(paymentsArray as Payment[]);
      } else {
        setError(result.message || 'Erreur lors du chargement des paiements');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des paiements:', error);
      setError(error.message || 'Erreur lors du chargement des paiements');
    } finally {
      setLoading(false);
    }
  };

  const loadScreenshot = async (paymentId: number) => {
    try {
      const url = await PaymentService.getPaymentScreenshot(paymentId);
      setScreenshotUrl(url);
      setSelectedPayment(paymentId);
    } catch (error) {
      console.error('Erreur lors du chargement de la capture:', error);
      setError('Erreur lors du chargement de la capture d\'écran');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message d'alerte si abonnement expiré */}
      {isSubscriptionExpired && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Abonnement expiré
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Votre abonnement a expiré le {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR') : ''}. 
                Veuillez renouveler votre abonnement pour continuer à utiliser toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message d'information si abonnement actif */}
      {hasActiveSubscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Abonnement actif
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Votre abonnement est actif jusqu'au {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR') : ''}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historique des paiements</h2>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => {
            const isExpired = payment.dateFinAbonnement 
              ? new Date(payment.dateFinAbonnement) <= new Date() 
              : false;
            const isActive = payment.isPaid && payment.dateFinAbonnement && new Date(payment.dateFinAbonnement) > new Date();
            
            return (
              <div
                key={payment.id}
                className={`bg-white border rounded-lg p-6 shadow-sm ${
                  isExpired && payment.isPaid 
                    ? 'border-red-300 bg-red-50' 
                    : isActive
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Paiement #{payment.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.isPaid
                            ? isExpired
                              ? 'bg-red-100 text-red-800'
                              : isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.isPaid 
                          ? isExpired 
                            ? 'Expiré' 
                            : isActive
                            ? 'Actif'
                            : 'Validé'
                          : 'En attente'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Date de paiement</p>
                        <p className="font-medium text-gray-900">{formatDate(payment.datePaiement)}</p>
                      </div>
                      {payment.montant && (
                        <div>
                          <p className="text-gray-500">Montant</p>
                          <p className="font-medium text-gray-900">{payment.montant} FCFA</p>
                        </div>
                      )}
                      {payment.dateDebutAbonnement && (
                        <div>
                          <p className="text-gray-500">Début d'abonnement</p>
                          <p className="font-medium text-gray-900">
                            {new Date(payment.dateDebutAbonnement).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {payment.dateFinAbonnement && (
                        <div>
                          <p className="text-gray-500">Fin d'abonnement</p>
                          <p className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {new Date(payment.dateFinAbonnement).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                            {isExpired && ' (Expiré)'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {payment.hasScreenshot && (
                      <button
                        onClick={() => loadScreenshot(payment.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Voir capture
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal pour afficher la capture d'écran */}
      {selectedPayment && screenshotUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Capture d'écran - Paiement #{selectedPayment}</h3>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setScreenshotUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <img
                src={screenshotUrl}
                alt={`Capture du paiement ${selectedPayment}`}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
