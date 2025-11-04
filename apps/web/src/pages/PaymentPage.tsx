import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon, CameraIcon } from '@heroicons/react/24/outline';
import PaymentService from '../services/paymentService';

export const PaymentPage: React.FC = () => {
  const { user, isAuthenticated, isPaid, subscriptionEndDate } = useAuth() as any;
  const navigate = useNavigate();
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Vérifier si un abonnement actif existe
  const hasActiveSubscription = isPaid && subscriptionEndDate && new Date(subscriptionEndDate) > new Date();

  // Rediriger vers la connexion si pas authentifié
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const handleScreenshotChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      
      // Valider le fichier
      const validation = PaymentService.validateScreenshot(file);
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      try {
        // Optimiser l'image si elle est trop grande
        const optimizedFile = await PaymentService.optimizeImage(file);
        setScreenshot(optimizedFile);
      } catch (error) {
        console.error('Erreur lors de l\'optimisation:', error);
        setScreenshot(file); // Utiliser le fichier original si l'optimisation échoue
      }
    }
  };

  const handleSubmitPayment = async () => {
    if (!screenshot) {
      setError('Veuillez sélectionner une capture d\'écran de votre paiement');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simuler le progrès d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Soumettre le paiement avec la capture d'écran
      const result = await PaymentService.submitPaymentWithScreenshot(screenshot);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.success) {
        alert(result.message);
        navigate('/dashboard');
      } else {
        throw new Error(result.message);
      }

    } catch (error: any) {
      console.error('Erreur lors de la soumission du paiement:', error);
      setError(error.message || 'Erreur lors de la soumission du paiement');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-end items-center mb-4">
            <button
              onClick={() => navigate('/payment-history')}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              Historique des paiements
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Paiement - Formule Pro
          </h1>
          <p className="text-gray-600 mt-2">
            Finalisez votre abonnement à la Formule Pro
          </p>
        </div>

        {/* Message si abonnement actif */}
        {hasActiveSubscription && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  Vous avez déjà un abonnement actif jusqu'au {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR') : ''}. Vous pourrez renouveler après cette date.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations de paiement */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <CreditCardIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Paiement Wave
              </h2>
            </div>

            <div className="space-y-6">
              {/* Numéro Wave */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Numéro Wave à utiliser :
                </h3>
                <div className="flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    05 95 03 18 43
                  </span>
                </div>
              </div>

              {/* Montant */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">
                  Montant à payer :
                </h3>
                <div className="text-3xl font-bold text-green-600">
                  5 000 FCFA
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Paiement unique pour 1 an
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">
                  Instructions :
                </h3>
                <ol className="text-sm text-yellow-800 space-y-1">
                  <li>1. Ouvrez votre application Wave</li>
                  <li>2. Effectuez un transfert vers le numéro : <strong>05 95 03 18 43</strong></li>
                  <li>3. Montant : <strong>5 000 FCFA</strong></li>
                  <li>4. Prenez une capture d'écran de la transaction</li>
                  <li>5. Uploadez la capture ci-dessous</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Upload de capture */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <CameraIcon className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Preuve de paiement
              </h2>
            </div>

            <div className="space-y-6">
              {/* Zone d'upload */}
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                hasActiveSubscription 
                  ? 'border-red-300 bg-red-50 opacity-50 cursor-not-allowed' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="file"
                  id="screenshot"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  disabled={isUploading || hasActiveSubscription}
                />
                <label
                  htmlFor="screenshot"
                  className={`block ${isUploading || hasActiveSubscription ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  {screenshot ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(screenshot)}
                        alt="Capture de paiement"
                        className="mx-auto h-32 w-auto rounded-lg border border-gray-200"
                      />
                      <p className="text-sm text-green-600 font-medium">
                        Capture sélectionnée ✓
                      </p>
                      <p className="text-xs text-gray-500">
                        Taille: {(screenshot.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <CameraIcon className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600">
                        Cliquez pour sélectionner votre capture d'écran
                      </p>
                      <p className="text-sm text-gray-500">
                        Formats acceptés : JPG, PNG, GIF, WebP (max 5MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Affichage des erreurs */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Barre de progression */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Informations utilisateur */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">
                  Vos informations :
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Nom :</strong> {user?.firstName} {user?.lastName}</p>
                  <p><strong>Email :</strong> {user?.email}</p>
                  <p><strong>Date :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Bouton de soumission */}
              <button
                onClick={handleSubmitPayment}
                disabled={!screenshot || isUploading || hasActiveSubscription}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Envoi en cours...
                  </div>
                ) : (
                  'Finaliser le paiement'
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Votre paiement sera vérifié sous 24h. Vous recevrez un email de confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
