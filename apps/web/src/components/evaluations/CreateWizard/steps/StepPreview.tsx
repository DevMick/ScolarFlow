// ========================================
// STEP PREVIEW - ÉTAPE APERÇU FINAL
// ========================================

import React, { useEffect } from 'react';
import type { WizardStepProps } from '../EvaluationWizard';

/**
 * Cinquième étape : aperçu final
 */
export const StepPreview: React.FC<WizardStepProps> = ({
  data,
  onValidationChange
}) => {

  // ========================================
  // VALIDATION FINALE
  // ========================================

  const isComplete = !!(
    data.title && 
    data.subject && 
    data.type &&
    data.maxScore && 
    data.coefficient && 
    data.evaluationDate
  );

  useEffect(() => {
    onValidationChange(isComplete);
  }, [isComplete, onValidationChange]);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Aperçu de votre évaluation
        </h2>
        <p className="text-gray-600">
          Vérifiez les informations avant de créer l'évaluation.
        </p>
      </div>

      {/* Carte d'aperçu */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {data.title || 'Titre non défini'}
            </h3>
            <p className="text-gray-600">
              {data.subject} • {data.type}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              /{data.maxScore}
            </div>
            <div className="text-sm text-gray-500">
              Coeff. {data.coefficient}
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{data.description}</p>
          </div>
        )}

        {/* Détails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Date prévue:</span>
            <br />
            {data.evaluationDate ? 
              new Date(data.evaluationDate).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : 
              'Non définie'
            }
          </div>
          <div>
            <span className="font-medium text-gray-700">Paramètres:</span>
            <br />
            Arrondi: {data.roundingMethod || 'Non défini'}
            <br />
            Classement: {data.showRanking ? 'Affiché' : 'Masqué'}
          </div>
        </div>
      </div>

      {/* Status */}
      {isComplete ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Évaluation prête à être créée
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Toutes les informations nécessaires ont été saisies. Cliquez sur "Créer l'évaluation" pour finaliser.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                ❌ Informations incomplètes
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Veuillez retourner aux étapes précédentes pour compléter les informations manquantes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepPreview;
