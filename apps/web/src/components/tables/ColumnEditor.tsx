// ========================================
// COLUMN EDITOR - ÉDITEUR DE COLONNES
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  InformationCircleIcon,
  PaintBrushIcon,
  CalculatorIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  TableColumn, 
  ColumnType, 
  TextAlignment, 
  FormulaResultType,
  ConditionOperator,
  STUDENT_INFO_FIELDS,
  NUMBER_FORMATS
} from '@edustats/shared/types';
import { useEvaluations } from '../../hooks/useEvaluations';
import { cn } from '../../utils/classNames';

/**
 * Props du composant ColumnEditor
 */
interface ColumnEditorProps {
  /** Colonne à éditer */
  column: TableColumn;
  /** Callback de mise à jour */
  onUpdate: (updates: Partial<TableColumn>) => void;
  /** Callback de fermeture */
  onClose: () => void;
  /** Mode lecture seule */
  disabled?: boolean;
}

/**
 * Éditeur de colonnes avec configuration complète
 */
export const ColumnEditor: React.FC<ColumnEditorProps> = ({
  column,
  onUpdate,
  onClose,
  disabled = false
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [activeTab, setActiveTab] = useState<'general' | 'formatting' | 'advanced'>('general');
  const [formulaExpression, setFormulaExpression] = useState(column.formula?.expression || '');
  const [formulaError, setFormulaError] = useState<string | null>(null);

  const { evaluations } = useEvaluations();

  // ========================================
  // MISE À JOUR DES PROPRIÉTÉS
  // ========================================

  const updateProperty = (path: string, value: any) => {
    if (disabled) return;

    const pathParts = path.split('.');
    const updates: any = {};
    
    let current = updates;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = current[pathParts[i]] || {};
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    // Merge avec la colonne existante
    const mergedUpdates = mergeDeep({ ...column }, updates);
    onUpdate(mergedUpdates);
  };

  const mergeDeep = (target: any, source: any): any => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  };

  // ========================================
  // VALIDATION FORMULE
  // ========================================

  const validateFormula = (expression: string) => {
    if (!expression.trim()) {
      setFormulaError(null);
      return;
    }

    // Validation basique de syntaxe
    const invalidChars = /[^a-zA-Z0-9\s+\-*/().,<>=!&|"'_]/;
    if (invalidChars.test(expression)) {
      setFormulaError('Caractères non autorisés dans la formule');
      return;
    }

    // Vérification des parenthèses équilibrées
    const openParens = (expression.match(/\(/g) || []).length;
    const closeParens = (expression.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      setFormulaError('Parenthèses non équilibrées');
      return;
    }

    setFormulaError(null);
  };

  useEffect(() => {
    validateFormula(formulaExpression);
  }, [formulaExpression]);

  // ========================================
  // ONGLETS DE CONFIGURATION
  // ========================================

  const tabs = [
    { id: 'general', label: 'Général', icon: InformationCircleIcon },
    { id: 'formatting', label: 'Format', icon: PaintBrushIcon },
    { id: 'advanced', label: 'Avancé', icon: CalculatorIcon }
  ];

  // ========================================
  // RENDU ONGLET GÉNÉRAL
  // ========================================

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de la colonne
        </label>
        <input
          type="text"
          value={column.label}
          onChange={(e) => updateProperty('label', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* Type de colonne */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de colonne
        </label>
        <select
          value={column.type}
          onChange={(e) => updateProperty('type', e.target.value as ColumnType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          <option value={ColumnType.StudentInfo}>Information Élève</option>
          <option value={ColumnType.EvaluationScore}>Note Évaluation</option>
          <option value={ColumnType.Calculated}>Colonne Calculée</option>
          <option value={ColumnType.Formula}>Formule Personnalisée</option>
          <option value={ColumnType.Static}>Valeur Fixe</option>
        </select>
      </div>

      {/* Configuration selon le type */}
      {column.type === ColumnType.StudentInfo && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Champ élève
          </label>
          <select
            value={column.source?.field || ''}
            onChange={(e) => updateProperty('source.field', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value="">Sélectionner un champ</option>
            {Object.entries(STUDENT_INFO_FIELDS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {column.type === ColumnType.EvaluationScore && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Évaluation
          </label>
          <select
            value={column.source?.evaluationId || ''}
            onChange={(e) => updateProperty('source.evaluationId', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value="">Sélectionner une évaluation</option>
            {evaluations.map(eval => (
              <option key={eval.id} value={eval.id}>
                {eval.title} ({eval.subject})
              </option>
            ))}
          </select>
        </div>
      )}

      {column.type === ColumnType.Static && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valeur fixe
          </label>
          <input
            type="text"
            value={column.source?.staticValue || ''}
            onChange={(e) => updateProperty('source.staticValue', e.target.value)}
            placeholder="Entrez la valeur..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
      )}

      {(column.type === ColumnType.Formula || column.type === ColumnType.Calculated) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expression de formule
          </label>
          <textarea
            value={formulaExpression}
            onChange={(e) => {
              setFormulaExpression(e.target.value);
              updateProperty('formula.expression', e.target.value);
            }}
            placeholder="Ex: MOYENNE(EVAL_1, EVAL_2)"
            rows={3}
            className={cn(
              'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2',
              formulaError 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            )}
            disabled={disabled}
          />
          {formulaError && (
            <p className="text-sm text-red-600 mt-1">{formulaError}</p>
          )}
          
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de résultat
            </label>
            <select
              value={column.formula?.resultType || FormulaResultType.Number}
              onChange={(e) => updateProperty('formula.resultType', e.target.value as FormulaResultType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            >
              <option value={FormulaResultType.Number}>Nombre</option>
              <option value={FormulaResultType.Text}>Texte</option>
              <option value={FormulaResultType.Boolean}>Booléen</option>
              <option value={FormulaResultType.Date}>Date</option>
            </select>
          </div>
        </div>
      )}

      {/* Options de comportement */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Options</h4>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={column.sortable}
            onChange={(e) => updateProperty('sortable', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={disabled}
          />
          <span className="ml-2 text-sm text-gray-700">Colonne triable</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={column.filterable}
            onChange={(e) => updateProperty('filterable', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={disabled}
          />
          <span className="ml-2 text-sm text-gray-700">Colonne filtrable</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={column.exportable}
            onChange={(e) => updateProperty('exportable', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={disabled}
          />
          <span className="ml-2 text-sm text-gray-700">Inclure dans l'export</span>
        </label>
      </div>
    </div>
  );

  // ========================================
  // RENDU ONGLET FORMATAGE
  // ========================================

  const renderFormattingTab = () => (
    <div className="space-y-4">
      {/* Largeur */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Largeur (px)
        </label>
        <input
          type="number"
          value={column.formatting.width || 100}
          onChange={(e) => updateProperty('formatting.width', parseInt(e.target.value))}
          min="50"
          max="500"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      </div>

      {/* Alignement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alignement
        </label>
        <select
          value={column.formatting.alignment}
          onChange={(e) => updateProperty('formatting.alignment', e.target.value as TextAlignment)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        >
          <option value={TextAlignment.Left}>Gauche</option>
          <option value={TextAlignment.Center}>Centre</option>
          <option value={TextAlignment.Right}>Droite</option>
        </select>
      </div>

      {/* Format des nombres */}
      {(column.type === ColumnType.EvaluationScore || 
        column.type === ColumnType.Calculated || 
        column.type === ColumnType.Formula) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format des nombres
          </label>
          <select
            value={column.formatting.numberFormat || ''}
            onChange={(e) => updateProperty('formatting.numberFormat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value="">Format par défaut</option>
            {Object.entries(NUMBER_FORMATS).map(([key, format]) => (
              <option key={key} value={format}>{format}</option>
            ))}
          </select>
        </div>
      )}

      {/* Formatage conditionnel */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Formatage conditionnel
        </h4>
        
        {column.formatting.conditionalFormatting?.length ? (
          <div className="space-y-2">
            {column.formatting.conditionalFormatting.map((condition, index) => (
              <div key={condition.id} className="p-3 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Condition {index + 1}</span>
                  <button
                    onClick={() => {
                      const newConditions = column.formatting.conditionalFormatting!.filter((_, i) => i !== index);
                      updateProperty('formatting.conditionalFormatting', newConditions);
                    }}
                    className="text-red-600 hover:text-red-800"
                    disabled={disabled}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <select
                      value={condition.condition.operator}
                      onChange={(e) => {
                        const newConditions = [...column.formatting.conditionalFormatting!];
                        newConditions[index].condition.operator = e.target.value as ConditionOperator;
                        updateProperty('formatting.conditionalFormatting', newConditions);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      disabled={disabled}
                    >
                      <option value={ConditionOperator.GreaterThan}>{'>'}</option>
                      <option value={ConditionOperator.LessThan}>{'<'}</option>
                      <option value={ConditionOperator.Equal}>{'='}</option>
                      <option value={ConditionOperator.GreaterThanOrEqual}>{'>='}</option>
                      <option value={ConditionOperator.LessThanOrEqual}>{'<='}</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={condition.condition.value}
                      onChange={(e) => {
                        const newConditions = [...column.formatting.conditionalFormatting!];
                        newConditions[index].condition.value = e.target.value;
                        updateProperty('formatting.conditionalFormatting', newConditions);
                      }}
                      placeholder="Valeur"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      disabled={disabled}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <input
                      type="color"
                      value={condition.style.backgroundColor || '#ffffff'}
                      onChange={(e) => {
                        const newConditions = [...column.formatting.conditionalFormatting!];
                        newConditions[index].style.backgroundColor = e.target.value;
                        updateProperty('formatting.conditionalFormatting', newConditions);
                      }}
                      className="w-full h-8 border border-gray-300 rounded"
                      disabled={disabled}
                    />
                    <label className="text-xs text-gray-500">Arrière-plan</label>
                  </div>
                  <div>
                    <input
                      type="color"
                      value={condition.style.textColor || '#000000'}
                      onChange={(e) => {
                        const newConditions = [...column.formatting.conditionalFormatting!];
                        newConditions[index].style.textColor = e.target.value;
                        updateProperty('formatting.conditionalFormatting', newConditions);
                      }}
                      className="w-full h-8 border border-gray-300 rounded"
                      disabled={disabled}
                    />
                    <label className="text-xs text-gray-500">Texte</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune condition définie</p>
        )}

        {!disabled && (
          <button
            onClick={() => {
              const newCondition = {
                id: `cond_${Date.now()}`,
                condition: {
                  operator: ConditionOperator.GreaterThan,
                  value: 10
                },
                style: {
                  backgroundColor: '#dcfce7',
                  textColor: '#166534'
                }
              };
              
              const currentConditions = column.formatting.conditionalFormatting || [];
              updateProperty('formatting.conditionalFormatting', [...currentConditions, newCondition]);
            }}
            className="mt-2 w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            Ajouter une condition
          </button>
        )}
      </div>
    </div>
  );

  // ========================================
  // RENDU ONGLET AVANCÉ
  // ========================================

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <h4 className="font-medium mb-2">Aide sur les formules</h4>
        
        <div className="space-y-2">
          <div>
            <strong>Fonctions disponibles :</strong>
            <ul className="mt-1 space-y-1 text-xs">
              <li><code>MOYENNE(val1, val2, ...)</code> - Calcule la moyenne</li>
              <li><code>SOMME(val1, val2, ...)</code> - Calcule la somme</li>
              <li><code>RANG(valeur, données)</code> - Calcule le rang</li>
              <li><code>SI(condition, si_vrai, si_faux)</code> - Condition</li>
              <li><code>CONCATENER(texte1, texte2, ...)</code> - Joint les textes</li>
            </ul>
          </div>
          
          <div>
            <strong>Variables disponibles :</strong>
            <ul className="mt-1 space-y-1 text-xs">
              <li><code>PRENOM</code> - Prénom de l'élève</li>
              <li><code>NOM</code> - Nom de l'élève</li>
              <li><code>EVAL_1, EVAL_2, ...</code> - Notes des évaluations</li>
              <li><code>MOYENNE_GENERALE</code> - Moyenne générale</li>
            </ul>
          </div>
          
          <div>
            <strong>Exemples :</strong>
            <ul className="mt-1 space-y-1 text-xs">
              <li><code>MOYENNE(EVAL_1, EVAL_2)</code></li>
              <li><code>SI(MOYENNE_GENERALE >= 10, "Admis", "Redouble")</code></li>
              <li><code>RANG(MOYENNE_GENERALE, TOUTES_MOYENNES)</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Configuration de colonne
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {column.label} ({column.type})
        </div>
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
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'formatting' && renderFormattingTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>
    </div>
  );
};
