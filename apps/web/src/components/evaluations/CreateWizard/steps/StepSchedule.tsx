// ========================================
// STEP SCHEDULE - ÉTAPE PLANNING
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
import type { WizardStepProps } from '../EvaluationWizard';

/**
 * Quatrième étape : planning et date
 */
export const StepSchedule: React.FC<WizardStepProps> = ({
  data,
  validationErrors,
  onDataChange,
  onValidationChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [localData, setLocalData] = useState({
    evaluationDate: data.evaluationDate ? new Date(data.evaluationDate).toISOString().split('T')[0] : '',
    duration: '', // Optionnel
    instructions: data.description || ''
  });

  // ========================================
  // VALIDATION
  // ========================================

  const validation = useMemo(() => {
    const errors: Record<string, string[]> = {};

    if (!localData.evaluationDate) {
      errors.evaluationDate = ['La date d\'évaluation est requise'];
    } else {
      const selectedDate = new Date(localData.evaluationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.evaluationDate = ['La date ne peut pas être dans le passé'];
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [localData]);

  // ========================================
  // EFFETS
  // ========================================

  // Synchronisation avec le state global
  useEffect(() => {
    const dataToSend = {
      evaluationDate: localData.evaluationDate ? new Date(localData.evaluationDate) : undefined,
      description: localData.instructions || data.description
    };
    onDataChange(dataToSend);
  }, [localData, onDataChange, data.description]);

  // Mise à jour de la validation
  useEffect(() => {
    onValidationChange(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const updateField = (field: keyof typeof localData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Planning de l'évaluation
        </h2>
        <p className="text-gray-600">
          Définissez la date et les instructions pour cette évaluation.
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-6">
        {/* Date d'évaluation */}
        <div>
          <label htmlFor="evaluationDate" className="block text-sm font-medium text-gray-700 mb-2">
            Date d'évaluation <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="evaluationDate"
            value={localData.evaluationDate}
            onChange={(e) => updateField('evaluationDate', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.evaluationDate 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          
          {validation.errors.evaluationDate && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.evaluationDate[0]}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Instructions spéciales <span className="text-gray-400">(optionnel)</span>
          </label>
          <textarea
            id="instructions"
            value={localData.instructions}
            onChange={(e) => updateField('instructions', e.target.value)}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Matériel autorisé, consignes particulières, durée estimée..."
          />
          <div className="mt-1 text-sm text-gray-500">
            Ces informations seront visibles par les élèves et collègues
          </div>
        </div>
      </div>

      {/* Aperçu */}
      {validation.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">
            ✓ Planning confirmé
          </h4>
          <div className="text-sm text-green-800">
            Évaluation prévue le <strong>{new Date(localData.evaluationDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepSchedule;
