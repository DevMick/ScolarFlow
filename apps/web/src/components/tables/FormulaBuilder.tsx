// ========================================
// FORMULA BUILDER - ÉDITEUR DE FORMULES AVANCÉ
// ========================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  XMarkIcon,
  CheckIcon,
  InformationCircleIcon,
  LightBulbIcon,
  PlayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

/**
 * Interface pour les fonctions disponibles
 */
interface FormulaFunction {
  name: string;
  description: string;
  syntax: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example: string;
}

/**
 * Interface pour les variables disponibles
 */
interface FormulaVariable {
  name: string;
  description: string;
  type: string;
  example: any;
}

/**
 * Props du composant FormulaBuilder
 */
interface FormulaBuilderProps {
  /** Expression actuelle */
  value: string;
  /** Callback de changement */
  onChange: (value: string) => void;
  /** Callback de validation */
  onValidate?: (expression: string) => Promise<{ valid: boolean; error?: string; result?: any }>;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Mode lecture seule */
  disabled?: boolean;
  /** Placeholder */
  placeholder?: string;
}

/**
 * Éditeur de formules avec autocomplétion et validation
 */
export const FormulaBuilder: React.FC<FormulaBuilderProps> = ({
  value,
  onChange,
  onValidate,
  onClose,
  disabled = false,
  placeholder = "Entrez votre formule..."
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<FormulaFunction | FormulaVariable>>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; result?: any } | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'functions' | 'variables' | 'examples'>('editor');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ========================================
  // DONNÉES DES FONCTIONS ET VARIABLES
  // ========================================

  const functions: FormulaFunction[] = [
    {
      name: 'MOYENNE',
      description: 'Calcule la moyenne d\'une série de valeurs',
      syntax: 'MOYENNE(valeur1, valeur2, ...)',
      category: 'Statistiques',
      parameters: [
        { name: 'valeurs', type: 'number[]', required: true, description: 'Liste des valeurs à moyenner' }
      ],
      example: 'MOYENNE(15, 18, 12) = 15'
    },
    {
      name: 'SOMME',
      description: 'Calcule la somme d\'une série de valeurs',
      syntax: 'SOMME(valeur1, valeur2, ...)',
      category: 'Mathématiques',
      parameters: [
        { name: 'valeurs', type: 'number[]', required: true, description: 'Valeurs à additionner' }
      ],
      example: 'SOMME(10, 20, 30) = 60'
    },
    {
      name: 'RANG',
      description: 'Calcule le rang d\'une valeur dans un ensemble',
      syntax: 'RANG(valeur, données)',
      category: 'Statistiques',
      parameters: [
        { name: 'valeur', type: 'number', required: true, description: 'Valeur à classer' },
        { name: 'données', type: 'number[]', required: true, description: 'Ensemble des valeurs' }
      ],
      example: 'RANG(15, [10, 15, 20]) = 2'
    },
    {
      name: 'SI',
      description: 'Condition logique',
      syntax: 'SI(condition, si_vrai, si_faux)',
      category: 'Logique',
      parameters: [
        { name: 'condition', type: 'boolean', required: true, description: 'Test logique' },
        { name: 'si_vrai', type: 'any', required: true, description: 'Valeur si condition vraie' },
        { name: 'si_faux', type: 'any', required: true, description: 'Valeur si condition fausse' }
      ],
      example: 'SI(note >= 10, "Admis", "Redouble")'
    },
    {
      name: 'CONCATENER',
      description: 'Joint plusieurs textes',
      syntax: 'CONCATENER(texte1, texte2, ...)',
      category: 'Texte',
      parameters: [
        { name: 'textes', type: 'string[]', required: true, description: 'Textes à joindre' }
      ],
      example: 'CONCATENER("Bonjour ", "monde")'
    },
    {
      name: 'MIN',
      description: 'Trouve la valeur minimale',
      syntax: 'MIN(valeur1, valeur2, ...)',
      category: 'Mathématiques',
      parameters: [
        { name: 'valeurs', type: 'number[]', required: true, description: 'Valeurs à comparer' }
      ],
      example: 'MIN(10, 5, 20) = 5'
    },
    {
      name: 'MAX',
      description: 'Trouve la valeur maximale',
      syntax: 'MAX(valeur1, valeur2, ...)',
      category: 'Mathématiques',
      parameters: [
        { name: 'valeurs', type: 'number[]', required: true, description: 'Valeurs à comparer' }
      ],
      example: 'MAX(10, 5, 20) = 20'
    },
    {
      name: 'ARRONDIR',
      description: 'Arrondit un nombre',
      syntax: 'ARRONDIR(nombre, décimales)',
      category: 'Mathématiques',
      parameters: [
        { name: 'nombre', type: 'number', required: true, description: 'Nombre à arrondir' },
        { name: 'décimales', type: 'number', required: false, description: 'Nombre de décimales (défaut: 0)' }
      ],
      example: 'ARRONDIR(15.678, 2) = 15.68'
    }
  ];

  const variables: FormulaVariable[] = [
    { name: 'PRENOM', description: 'Prénom de l\'élève', type: 'string', example: 'Marie' },
    { name: 'NOM', description: 'Nom de l\'élève', type: 'string', example: 'Dupont' },
    { name: 'NOM_COMPLET', description: 'Nom complet de l\'élève', type: 'string', example: 'Marie Dupont' },
    { name: 'EVAL_1', description: 'Note de l\'évaluation 1', type: 'number', example: 15.5 },
    { name: 'EVAL_2', description: 'Note de l\'évaluation 2', type: 'number', example: 18 },
    { name: 'MOYENNE_GENERALE', description: 'Moyenne générale calculée', type: 'number', example: 14.2 },
    { name: 'MOYENNE_MATH', description: 'Moyenne en mathématiques', type: 'number', example: 16.5 },
    { name: 'MOYENNE_FRANCAIS', description: 'Moyenne en français', type: 'number', example: 13.8 },
    { name: 'TOUTES_MOYENNES', description: 'Toutes les moyennes de la classe', type: 'number[]', example: '[12.5, 14.2, 16.8, ...]' },
    { name: 'DATE_AUJOURD_HUI', description: 'Date actuelle', type: 'Date', example: new Date().toLocaleDateString('fr-FR') },
    { name: 'NOMBRE_ELEVES', description: 'Nombre d\'élèves dans la classe', type: 'number', example: 25 }
  ];

  // ========================================
  // AUTOCOMPLÉTION
  // ========================================

  const updateSuggestions = useCallback((inputValue: string, position: number) => {
    const beforeCursor = inputValue.substring(0, position);
    const words = beforeCursor.split(/[\s+\-*/(),<>=!&|]+/);
    const currentWord = words[words.length - 1].toUpperCase();

    if (currentWord.length < 1) {
      setShowSuggestions(false);
      return;
    }

    const matchingFunctions = functions.filter(func => 
      func.name.startsWith(currentWord)
    );
    
    const matchingVariables = variables.filter(variable => 
      variable.name.startsWith(currentWord)
    );

    const allSuggestions = [...matchingFunctions, ...matchingVariables];
    
    if (allSuggestions.length > 0) {
      setSuggestions(allSuggestions);
      setSelectedSuggestion(0);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [functions, variables]);

  // ========================================
  // GESTION DES ÉVÉNEMENTS
  // ========================================

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(position);
    updateSuggestions(newValue, position);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          insertSuggestion(suggestions[selectedSuggestion]);
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
      }
    }

    // Raccourcis clavier
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          validateFormula();
          break;
      }
    }
  };

  const insertSuggestion = (suggestion: FormulaFunction | FormulaVariable) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    
    // Trouver le début du mot actuel
    const words = beforeCursor.split(/[\s+\-*/(),<>=!&|]+/);
    const currentWord = words[words.length - 1];
    const wordStart = beforeCursor.lastIndexOf(currentWord);
    
    let insertText = suggestion.name;
    
    // Si c'est une fonction, ajouter les parenthèses
    if ('parameters' in suggestion) {
      insertText += '(';
      if (suggestion.parameters.length > 0) {
        const requiredParams = suggestion.parameters.filter(p => p.required);
        insertText += requiredParams.map(p => p.name).join(', ');
      }
      insertText += ')';
    }
    
    const newValue = 
      value.substring(0, wordStart) + 
      insertText + 
      afterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Positionner le curseur
    setTimeout(() => {
      const newPosition = wordStart + insertText.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // ========================================
  // VALIDATION
  // ========================================

  const validateFormula = async () => {
    if (!onValidate || !value.trim()) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      const result = await onValidate(value);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Erreur de validation'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Validation automatique avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        validateFormula();
      } else {
        setValidationResult(null);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [value]);

  // ========================================
  // EXEMPLES DE FORMULES
  // ========================================

  const examples = [
    {
      title: 'Moyenne simple',
      formula: 'MOYENNE(EVAL_1, EVAL_2, EVAL_3)',
      description: 'Calcule la moyenne de trois évaluations'
    },
    {
      title: 'Mention selon moyenne',
      formula: 'SI(MOYENNE_GENERALE >= 16, "Très Bien", SI(MOYENNE_GENERALE >= 14, "Bien", SI(MOYENNE_GENERALE >= 12, "Assez Bien", SI(MOYENNE_GENERALE >= 10, "Passable", "Insuffisant"))))',
      description: 'Détermine la mention selon la moyenne générale'
    },
    {
      title: 'Rang dans la classe',
      formula: 'RANG(MOYENNE_GENERALE, TOUTES_MOYENNES)',
      description: 'Calcule le rang de l\'élève dans sa classe'
    },
    {
      title: 'Nom complet',
      formula: 'CONCATENER(PRENOM, " ", NOM)',
      description: 'Concatène le prénom et le nom'
    },
    {
      title: 'Note arrondie',
      formula: 'ARRONDIR(MOYENNE(EVAL_1, EVAL_2), 1)',
      description: 'Moyenne arrondie à 1 décimale'
    }
  ];

  // ========================================
  // RENDU DES ONGLETS
  // ========================================

  const renderEditorTab = () => (
    <div className="space-y-4">
      {/* Zone d'édition */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
          placeholder={placeholder}
          rows={6}
          className={cn(
            'w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 resize-none',
            validationResult?.valid === false 
              ? 'border-red-300 focus:ring-red-500' 
              : validationResult?.valid === true
              ? 'border-green-300 focus:ring-green-500'
              : 'border-gray-300 focus:ring-blue-500'
          )}
          disabled={disabled}
        />

        {/* Suggestions d'autocomplétion */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                onClick={() => insertSuggestion(suggestion)}
                className={cn(
                  'px-3 py-2 cursor-pointer border-b border-gray-100 last:border-b-0',
                  index === selectedSuggestion 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'hover:bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600">{suggestion.description}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {'parameters' in suggestion ? '📋' : '📊'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Résultat de validation */}
      {validationResult && (
        <div className={cn(
          'p-3 rounded-md border',
          validationResult.valid 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        )}>
          <div className="flex items-center">
            {validationResult.valid ? (
              <CheckIcon className="h-4 w-4 mr-2" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm font-medium">
              {validationResult.valid ? 'Formule valide' : 'Erreur dans la formule'}
            </span>
          </div>
          {validationResult.error && (
            <p className="text-sm mt-1">{validationResult.error}</p>
          )}
          {validationResult.valid && validationResult.result !== undefined && (
            <p className="text-sm mt-1">
              Résultat d'exemple : <strong>{String(validationResult.result)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={validateFormula}
          disabled={isValidating || !value.trim()}
          className={cn(
            'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
            value.trim() && !isValidating
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          {isValidating ? 'Validation...' : 'Tester la formule'}
        </button>

        <div className="text-xs text-gray-500">
          Ctrl+Entrée pour tester • Tab pour autocomplétion
        </div>
      </div>
    </div>
  );

  const renderFunctionsTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Cliquez sur une fonction pour l'insérer dans votre formule.
      </div>
      
      {Object.entries(
        functions.reduce((acc, func) => {
          if (!acc[func.category]) acc[func.category] = [];
          acc[func.category].push(func);
          return acc;
        }, {} as Record<string, FormulaFunction[]>)
      ).map(([category, categoryFunctions]) => (
        <div key={category}>
          <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
          <div className="space-y-2">
            {categoryFunctions.map(func => (
              <div
                key={func.name}
                onClick={() => insertSuggestion(func)}
                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-blue-600">{func.syntax}</div>
                    <div className="text-sm text-gray-600 mt-1">{func.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Exemple : <code className="bg-gray-100 px-1 rounded">{func.example}</code>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderVariablesTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Variables disponibles dans vos formules.
      </div>
      
      <div className="space-y-2">
        {variables.map(variable => (
          <div
            key={variable.name}
            onClick={() => insertSuggestion(variable)}
            className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-green-600">{variable.name}</div>
                <div className="text-sm text-gray-600">{variable.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Type : {variable.type} • Exemple : <strong>{String(variable.example)}</strong>
                </div>
              </div>
              <div className="text-gray-400">
                📊
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExamplesTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Exemples de formules courantes. Cliquez pour utiliser.
      </div>
      
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div
            key={index}
            onClick={() => onChange(example.formula)}
            className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
          >
            <div className="font-medium text-sm text-gray-900 mb-1">{example.title}</div>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded mb-2 overflow-x-auto">
              {example.formula}
            </div>
            <div className="text-sm text-gray-600">{example.description}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  const tabs = [
    { id: 'editor', label: 'Éditeur', icon: '✏️' },
    { id: 'functions', label: 'Fonctions', icon: '📋' },
    { id: 'variables', label: 'Variables', icon: '📊' },
    { id: 'examples', label: 'Exemples', icon: '💡' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Éditeur de formules
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {activeTab === 'editor' && renderEditorTab()}
        {activeTab === 'functions' && renderFunctionsTab()}
        {activeTab === 'variables' && renderVariablesTab()}
        {activeTab === 'examples' && renderExamplesTab()}
      </div>

      {/* Aide */}
      <div className="p-3 bg-blue-50 border-t border-blue-200 text-sm text-blue-800">
        <div className="flex items-start">
          <LightBulbIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Astuce :</strong> Tapez les premières lettres d'une fonction ou variable 
            pour voir les suggestions d'autocomplétion.
          </div>
        </div>
      </div>
    </div>
  );
};
