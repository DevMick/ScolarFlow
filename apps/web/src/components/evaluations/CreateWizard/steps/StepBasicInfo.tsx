// ========================================
// STEP BASIC INFO - ÉTAPE INFORMATIONS DE BASE
// ========================================

import React, { useState, useEffect, useMemo } from 'react';
import type { WizardStepProps } from '../EvaluationWizard';
import type { EvaluationType } from '../../../../types';

/**
 * Deuxième étape : informations de base
 */
export const StepBasicInfo: React.FC<WizardStepProps> = ({
  data,
  validationErrors,
  onDataChange,
  onValidationChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [localData, setLocalData] = useState({
    title: data.title || '',
    subject: data.subject || '',
    type: (data.type as EvaluationType) || 'Controle',
    description: data.description || ''
  });

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ========================================
  // OPTIONS DE CONFIGURATION
  // ========================================

  const subjects = [
    'Mathématiques',
    'Français',
    'Sciences',
    'Histoire',
    'Géographie',
    'Histoire-Géographie',
    'Anglais',
    'Éducation Physique et Sportive',
    'Arts Visuels',
    'Musique',
    'Découverte du Monde',
    'Éducation Civique et Morale',
    'Informatique'
  ];

  const evaluationTypes: { value: EvaluationType; label: string; description: string }[] = [
    {
      value: 'Controle',
      label: 'Contrôle',
      description: 'Évaluation classique sur chapitre ou notion'
    },
    {
      value: 'Devoir',
      label: 'Devoir surveillé',
      description: 'Évaluation longue et approfondie'
    },
    {
      value: 'Quiz',
      label: 'Quiz',
      description: 'Évaluation courte et rapide'
    },
    {
      value: 'Oral',
      label: 'Évaluation orale',
      description: 'Présentation ou interrogation orale'
    },
    {
      value: 'TP',
      label: 'Travaux pratiques',
      description: 'Évaluation avec manipulation/expérimentation'
    },
    {
      value: 'Projet',
      label: 'Projet',
      description: 'Travail de longue durée, souvent en groupe'
    },
    {
      value: 'Participation',
      label: 'Participation',
      description: 'Évaluation continue de l\'engagement'
    },
    {
      value: 'Exercice',
      label: 'Exercice',
      description: 'Exercice d\'application en classe'
    },
    {
      value: 'Examen',
      label: 'Examen',
      description: 'Évaluation officielle ou certificative'
    }
  ];

  // ========================================
  // SUGGESTIONS INTELLIGENTES
  // ========================================

  const titleSuggestions = useMemo(() => {
    if (!localData.subject || !localData.type) return [];

    const baseSuggestions: Record<string, Record<string, string[]>> = {
      'Mathématiques': {
        'Controle': [
          'Contrôle sur les nombres décimaux',
          'Contrôle de géométrie - Les polygones',
          'Contrôle sur les fractions',
          'Contrôle de calcul mental',
          'Contrôle sur la résolution de problèmes',
          'Contrôle sur les mesures de longueur'
        ],
        'Quiz': [
          'Quiz tables de multiplication',
          'Quiz calcul mental rapide',
          'Quiz sur les unités de mesure'
        ],
        'Devoir': [
          'Devoir sur les problèmes complexes',
          'Devoir de géométrie avancée'
        ]
      },
      'Français': {
        'Controle': [
          'Contrôle de grammaire et conjugaison',
          'Contrôle de compréhension de lecture',
          'Contrôle d\'orthographe',
          'Contrôle de vocabulaire'
        ],
        'Oral': [
          'Présentation d\'un livre lu',
          'Récitation de poésie',
          'Expression orale libre'
        ],
        'Devoir': [
          'Devoir d\'expression écrite',
          'Rédaction créative'
        ]
      },
      'Sciences': {
        'Controle': [
          'Contrôle sur le corps humain',
          'Contrôle sur les états de la matière',
          'Contrôle sur les animaux'
        ],
        'TP': [
          'TP d\'expérimentation sur l\'eau',
          'TP observation des végétaux',
          'TP sur les mélanges'
        ]
      },
      'Histoire': {
        'Controle': [
          'Contrôle sur la Préhistoire',
          'Contrôle sur l\'Antiquité',
          'Contrôle sur le Moyen Âge'
        ]
      },
      'Géographie': {
        'Controle': [
          'Contrôle sur la France',
          'Contrôle sur les paysages',
          'Contrôle de lecture de cartes'
        ]
      }
    };

    return baseSuggestions[localData.subject]?.[localData.type] || [];
  }, [localData.subject, localData.type]);

  // ========================================
  // VALIDATION
  // ========================================

  const validation = useMemo(() => {
    const errors: Record<string, string[]> = {};

    if (!localData.title.trim()) {
      errors.title = ['Le titre est requis'];
    } else if (localData.title.trim().length < 3) {
      errors.title = ['Le titre doit contenir au moins 3 caractères'];
    } else if (localData.title.trim().length > 100) {
      errors.title = ['Le titre ne peut pas dépasser 100 caractères'];
    }

    if (!localData.subject.trim()) {
      errors.subject = ['La matière est requise'];
    }

    if (!localData.type) {
      errors.type = ['Le type d\'évaluation est requis'];
    }

    if (localData.description && localData.description.length > 500) {
      errors.description = ['La description ne peut pas dépasser 500 caractères'];
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

  // Mise à jour des suggestions
  useEffect(() => {
    setSuggestions(titleSuggestions);
  }, [titleSuggestions]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const updateField = (field: keyof typeof localData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSuggestionSelect = (suggestion: string) => {
    updateField('title', suggestion);
    setShowSuggestions(false);
  };

  const handleTitleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleTitleBlur = () => {
    // Délai pour permettre le clic sur suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Informations de base
        </h2>
        <p className="text-gray-600">
          Définissez le titre, la matière et le type de votre évaluation.
        </p>
      </div>

      {/* Formulaire */}
      <div className="space-y-6">
        {/* Titre */}
        <div className="relative">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titre de l'évaluation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={localData.title}
            onChange={(e) => updateField('title', e.target.value)}
            onFocus={handleTitleFocus}
            onBlur={handleTitleBlur}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.title 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Ex: Contrôle de mathématiques - Les fractions"
          />
          
          {/* Erreurs de validation */}
          {validation.errors.title && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.title[0]}
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 text-xs text-gray-500 font-medium border-b border-gray-100">
                Suggestions basées sur la matière et le type
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Matière */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Matière <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            value={localData.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.subject 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            <option value="">Sélectionner une matière</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          
          {validation.errors.subject && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.subject[0]}
            </div>
          )}
        </div>

        {/* Type d'évaluation */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
            Type d'évaluation <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            value={localData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validation.errors.type 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            {evaluationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          
          {/* Description du type sélectionné */}
          {localData.type && (
            <div className="mt-1 text-sm text-gray-500">
              {evaluationTypes.find(t => t.value === localData.type)?.description}
            </div>
          )}
          
          {validation.errors.type && (
            <div className="mt-1 text-sm text-red-600">
              {validation.errors.type[0]}
            </div>
          )}
        </div>

        {/* Description optionnelle */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optionnel)</span>
          </label>
          <textarea
            id="description"
            value={localData.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
              validation.errors.description 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Ajoutez des instructions spéciales, la durée prévue, le matériel autorisé..."
          />
          
          <div className="mt-1 flex justify-between text-sm text-gray-500">
            <span>
              {validation.errors.description ? validation.errors.description[0] : 'Instructions pour les élèves et collègues'}
            </span>
            <span className={localData.description.length > 450 ? 'text-red-500' : ''}>
              {localData.description.length}/500
            </span>
          </div>
        </div>
      </div>

      {/* Aperçu rapide */}
      {validation.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2">
            ✓ Aperçu de votre évaluation
          </h4>
          <div className="text-sm text-green-800">
            <strong>{localData.title}</strong> • {localData.subject} • {evaluationTypes.find(t => t.value === localData.type)?.label}
            {localData.description && (
              <div className="mt-1 text-green-700">
                {localData.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepBasicInfo;
