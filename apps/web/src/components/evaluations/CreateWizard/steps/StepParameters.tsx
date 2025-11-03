// ========================================
// STEP PARAMETERS - ÉTAPE PARAMÈTRES
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
import type { WizardStepProps } from '../EvaluationWizard';
import type { AbsentHandling, RoundingMethod } from '../../../../types';

/**
 * Troisième étape : paramètres de l'évaluation
 */
export const StepParameters: React.FC<WizardStepProps> = ({
  data,
  validationErrors,
  onDataChange,
  onValidationChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [localData, setLocalData] = useState({
    maxScore: data.maxScore || 20,
    coefficient: data.coefficient || 1,
    absentHandling: (data.absentHandling as AbsentHandling) || 'exclude_from_ranking',
    roundingMethod: (data.roundingMethod as RoundingMethod) || 'two_decimals',
    showRanking: data.showRanking !== undefined ? data.showRanking : true
  });

  // ========================================
  // OPTIONS DE CONFIGURATION
  // ========================================

  const maxScoreOptions = [
    { value: 5, label: '5 points', description: 'Évaluation très courte' },
    { value: 10, label: '10 points', description: 'Quiz ou évaluation rapide' },
    { value: 15, label: '15 points', description: 'Contrôle court' },
    { value: 20, label: '20 points', description: 'Contrôle standard' },
    { value: 25, label: '25 points', description: 'Contrôle long' },
    { value: 50, label: '50 points', description: 'Devoir important' },
    { value: 100, label: '100 points', description: 'Examen complet' }
  ];

  const coefficientOptions = [
    { value: 0.5, label: '0.5', description: 'Coefficient faible (quiz, participation)' },
    { value: 1, label: '1', description: 'Coefficient standard' },
    { value: 1.5, label: '1.5', description: 'Coefficient renforcé' },
    { value: 2, label: '2', description: 'Coefficient important (devoir)' },
    { value: 3, label: '3', description: 'Coefficient très important (examen)' }
  ];

  const absentHandlingOptions: { value: AbsentHandling; label: string; description: string }[] = [
    {
      value: 'exclude_from_ranking',
      label: 'Exclure du classement',
      description: 'L\'élève absent n\'apparaît pas dans le classement'
    },
    {
      value: 'zero_score',
      label: 'Note 0 automatique',
      description: 'L\'absence compte comme une note de 0'
    },
    {
      value: 'class_average',
      label: 'Moyenne de classe',
      description: 'L\'élève reçoit la moyenne de ses camarades présents'
    },
    {
      value: 'manual_decision',
      label: 'Décision manuelle',
      description: 'Vous déciderez au cas par cas'
    },
    {
      value: 'proportional_bonus',
      label: 'Bonus proportionnel',
      description: 'Rattrapage avec coefficient adapté'
    }
  ];

  const roundingMethodOptions: { value: RoundingMethod; label: string; description: string }[] = [
    {
      value: 'none',
      label: 'Aucun arrondi',
      description: 'Conserver la note exacte (ex: 12.67)'
    },
    {
      value: 'two_decimals',
      label: 'Deux décimales',
      description: 'Arrondir au centième (ex: 12.67)'
    },
    {
      value: 'one_decimal',
      label: 'Une décimale',
      description: 'Arrondir au dixième (ex: 12.7)'
    },
    {
      value: 'nearest_half',
      label: 'Demi-point près',
      description: 'Arrondir au 0.5 près (ex: 12.5)'
    },
    {
      value: 'nearest_quarter',
      label: 'Quart de point',
      description: 'Arrondir au 0.25 près (ex: 12.75)'
    },
    {
      value: 'nearest_integer',
      label: 'Nombre entier',
      description: 'Arrondir à l\'entier (ex: 13)'
    }
  ];

  // ========================================
  // SUGGESTIONS INTELLIGENTES
  // ========================================

  const suggestions = useMemo(() => {
    const evaluationType = data.type;
    const subject = data.subject;

    const baseSuggestions: Record<string, Partial<typeof localData>> = {
      'Quiz': {
        maxScore: 10,
        coefficient: 0.5,
        absentHandling: 'zero_score',
        roundingMethod: 'nearest_integer',
        showRanking: true
      },
      'Participation': {
        maxScore: 5,
        coefficient: 0.5,
        absentHandling: 'zero_score',
        roundingMethod: 'nearest_integer',
        showRanking: false
      },
      'Oral': {
        maxScore: 20,
        coefficient: 1,
        absentHandling: 'exclude_from_ranking',
        roundingMethod: 'two_decimals',
        showRanking: false
      },
      'Projet': {
        maxScore: 20,
        coefficient: 2,
        absentHandling: 'manual_decision',
        roundingMethod: 'two_decimals',
        showRanking: false
      },
      'Examen': {
        maxScore: 100,
        coefficient: 3,
        absentHandling: 'manual_decision',
        roundingMethod: 'nearest_integer',
        showRanking: true
      }
    };

    return baseSuggestions[evaluationType || ''] || {};
  }, [data.type, data.subject]);

  // ========================================
  // VALIDATION
  // ========================================

  const validation = useMemo(() => {
    const errors: Record<string, string[]> = {};

    if (!localData.maxScore || localData.maxScore <= 0) {
      errors.maxScore = ['La note maximale doit être supérieure à 0'];
    } else if (localData.maxScore > 1000) {
      errors.maxScore = ['La note maximale ne peut pas dépasser 1000'];
    }

    if (!localData.coefficient || localData.coefficient <= 0) {
      errors.coefficient = ['Le coefficient doit être supérieur à 0'];
    } else if (localData.coefficient > 10) {
      errors.coefficient = ['Le coefficient ne peut pas dépasser 10'];
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
    onDataChange(localData);
  }, [localData, onDataChange]);

  // Mise à jour de la validation
  useEffect(() => {
    onValidationChange(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const updateField = (field: keyof typeof localData, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const applySuggestions = () => {
    setLocalData(prev => ({ ...prev, ...suggestions }));
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Paramètres de l'évaluation
        </h2>
        <p className="text-gray-600">
          Configurez la note maximale, le coefficient et les options de notation.
        </p>
      </div>

      {/* Suggestions intelligentes */}
      {Object.keys(suggestions).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-medium text-blue-900">
                💡 Suggestions pour une {data.type}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                Nous recommandons des paramètres adaptés à ce type d'évaluation.
              </p>
              <button
                onClick={applySuggestions}
                className="mt-2 inline-flex items-center px-3 py-1 border border-blue-300 rounded text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
              >
                Appliquer les suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Note maximale */}
        <div>
          <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">
            Note maximale <span className="text-red-500">*</span>
          </label>
          <select
            id="maxScore"
            value={localData.maxScore}
            onChange={(e) => updateField('maxScore', Number(e.target.value))}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.maxScore 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            {maxScoreOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="mt-1 text-sm text-gray-500">
            {maxScoreOptions.find(o => o.value === localData.maxScore)?.description}
          </div>
          
          {validation.errors.maxScore && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.maxScore[0]}
            </div>
          )}
        </div>

        {/* Coefficient */}
        <div>
          <label htmlFor="coefficient" className="block text-sm font-medium text-gray-700 mb-2">
            Coefficient <span className="text-red-500">*</span>
          </label>
          <select
            id="coefficient"
            value={localData.coefficient}
            onChange={(e) => updateField('coefficient', Number(e.target.value))}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.coefficient 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            {coefficientOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="mt-1 text-sm text-gray-500">
            {coefficientOptions.find(o => o.value === localData.coefficient)?.description}
          </div>
          
          {validation.errors.coefficient && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.coefficient[0]}
            </div>
          )}
        </div>
      </div>

      {/* Gestion des absents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Gestion des élèves absents
        </label>
        <div className="space-y-3">
          {absentHandlingOptions.map(option => (
            <label key={option.value} className="flex items-start">
              <input
                type="radio"
                name="absentHandling"
                value={option.value}
                checked={localData.absentHandling === option.value}
                onChange={(e) => updateField('absentHandling', e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Arrondi des notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Méthode d'arrondi
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roundingMethodOptions.map(option => (
            <label key={option.value} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="roundingMethod"
                value={option.value}
                checked={localData.roundingMethod === option.value}
                onChange={(e) => updateField('roundingMethod', e.target.value)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-xs text-gray-500">
                  {option.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Options d'affichage */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Options d'affichage</h3>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localData.showRanking}
            onChange={(e) => updateField('showRanking', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              Afficher le classement
            </div>
            <div className="text-sm text-gray-500">
              Les élèves verront leur rang dans la classe
            </div>
          </div>
        </label>
      </div>

      {/* Aperçu des paramètres */}
      {validation.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">
            ✓ Résumé des paramètres
          </h4>
          <div className="text-sm text-green-800 space-y-1">
            <div>Note sur <strong>{localData.maxScore}</strong> points (coefficient <strong>{localData.coefficient}</strong>)</div>
            <div>
              Absents: <strong>{absentHandlingOptions.find(o => o.value === localData.absentHandling)?.label}</strong>
            </div>
            <div>
              Arrondi: <strong>{roundingMethodOptions.find(o => o.value === localData.roundingMethod)?.label}</strong>
            </div>
            <div>
              Classement: <strong>{localData.showRanking ? 'Affiché' : 'Masqué'}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepParameters;
