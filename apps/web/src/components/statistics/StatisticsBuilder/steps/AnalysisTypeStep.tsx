// ========================================
// ANALYSIS TYPE STEP - CONFIGURATION DU TYPE D'ANALYSE
// ========================================

import React, { useState } from 'react';
import { ChartBarIcon, CalculatorIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { WizardStepProps } from '../ConfigurationWizard';
import type {
  CalculationType,
  MetricType,
  GroupByOption,
  AggregationMethod
} from '@edustats/shared/statistics';
import { cn } from '../../../../utils/classNames';

/**
 * Configuration des types d'analyse disponibles
 */
const ANALYSIS_TYPES: Array<{
  type: CalculationType;
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  recommended: MetricType[];
  color: string;
}> = [
  {
    type: CalculationType.Basic,
    title: 'Analyse de base',
    description: 'Statistiques descriptives simples (moyenne, médiane, écart-type)',
    icon: CalculatorIcon,
    recommended: ['average', 'median', 'standardDeviation', 'min', 'max'],
    color: 'blue'
  },
  {
    type: CalculationType.Comparative,
    title: 'Analyse comparative',
    description: 'Comparaisons entre groupes, classes ou périodes',
    icon: ChartBarIcon,
    recommended: ['average', 'median', 'percentiles', 'quartiles'],
    color: 'green'
  },
  {
    type: CalculationType.Temporal,
    title: 'Analyse temporelle',
    description: 'Évolution des performances dans le temps',
    icon: AdjustmentsHorizontalIcon,
    recommended: ['average', 'trend', 'correlation', 'regression'],
    color: 'purple'
  },
  {
    type: CalculationType.Predictive,
    title: 'Analyse prédictive',
    description: 'Prédictions et détection de tendances avancées',
    icon: ChartBarIcon,
    recommended: ['correlation', 'regression', 'trend', 'variance'],
    color: 'orange'
  }
];

/**
 * Métriques disponibles avec descriptions
 */
const AVAILABLE_METRICS: Array<{
  metric: MetricType;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'statistical';
}> = [
  { metric: 'average', title: 'Moyenne', description: 'Moyenne arithmétique', category: 'basic' },
  { metric: 'median', title: 'Médiane', description: 'Valeur centrale', category: 'basic' },
  { metric: 'mode', title: 'Mode', description: 'Valeur la plus fréquente', category: 'basic' },
  { metric: 'min', title: 'Minimum', description: 'Valeur minimale', category: 'basic' },
  { metric: 'max', title: 'Maximum', description: 'Valeur maximale', category: 'basic' },
  { metric: 'standardDeviation', title: 'Écart-type', description: 'Mesure de dispersion', category: 'statistical' },
  { metric: 'variance', title: 'Variance', description: 'Carré de l\'écart-type', category: 'statistical' },
  { metric: 'percentiles', title: 'Percentiles', description: 'Répartition en centiles', category: 'statistical' },
  { metric: 'quartiles', title: 'Quartiles', description: 'Répartition en quartiles', category: 'statistical' },
  { metric: 'iqr', title: 'IQR', description: 'Écart interquartile', category: 'statistical' },
  { metric: 'skewness', title: 'Asymétrie', description: 'Mesure d\'asymétrie', category: 'advanced' },
  { metric: 'kurtosis', title: 'Aplatissement', description: 'Mesure d\'aplatissement', category: 'advanced' },
  { metric: 'correlation', title: 'Corrélation', description: 'Relations entre variables', category: 'advanced' },
  { metric: 'regression', title: 'Régression', description: 'Analyse de régression', category: 'advanced' },
  { metric: 'trend', title: 'Tendance', description: 'Analyse de tendance', category: 'advanced' }
];

/**
 * Options de regroupement
 */
const GROUP_BY_OPTIONS: Array<{
  option: GroupByOption;
  title: string;
  description: string;
}> = [
  { option: 'student', title: 'Par élève', description: 'Analyser chaque élève individuellement' },
  { option: 'evaluation', title: 'Par évaluation', description: 'Analyser chaque évaluation séparément' },
  { option: 'subject', title: 'Par matière', description: 'Regrouper par matière' },
  { option: 'class', title: 'Par classe', description: 'Regrouper par classe' },
  { option: 'month', title: 'Par mois', description: 'Regrouper par mois' },
  { option: 'week', title: 'Par semaine', description: 'Regrouper par semaine' }
];

/**
 * Méthodes d'agrégation
 */
const AGGREGATION_METHODS: Array<{
  method: AggregationMethod;
  title: string;
  description: string;
}> = [
  { method: 'average', title: 'Moyenne', description: 'Moyenne des valeurs' },
  { method: 'sum', title: 'Somme', description: 'Somme des valeurs' },
  { method: 'min', title: 'Minimum', description: 'Valeur minimale' },
  { method: 'max', title: 'Maximum', description: 'Valeur maximale' },
  { method: 'count', title: 'Nombre', description: 'Nombre d\'éléments' }
];

/**
 * Étape de configuration du type d'analyse
 */
export const AnalysisTypeStep: React.FC<WizardStepProps> = ({
  data,
  validationErrors,
  onDataChange
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedType, setSelectedType] = useState<CalculationType>(
    data.calculations?.type || CalculationType.Basic
  );
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(
    data.calculations?.metrics || []
  );
  const [groupBy, setGroupBy] = useState<GroupByOption>(
    data.calculations?.groupBy || 'evaluation'
  );
  const [aggregation, setAggregation] = useState<AggregationMethod>(
    data.calculations?.aggregation || 'average'
  );
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);

  // ========================================
  // GESTION DES CHANGEMENTS
  // ========================================

  const handleTypeChange = (type: CalculationType) => {
    setSelectedType(type);
    
    // Auto-sélectionner les métriques recommandées
    const analysisConfig = ANALYSIS_TYPES.find(a => a.type === type);
    if (analysisConfig) {
      setSelectedMetrics(analysisConfig.recommended);
      updateCalculations({
        type,
        metrics: analysisConfig.recommended
      });
    }
  };

  const handleMetricToggle = (metric: MetricType, isSelected: boolean) => {
    const newMetrics = isSelected
      ? [...selectedMetrics, metric]
      : selectedMetrics.filter(m => m !== metric);
    
    setSelectedMetrics(newMetrics);
    updateCalculations({ metrics: newMetrics });
  };

  const handleGroupByChange = (newGroupBy: GroupByOption) => {
    setGroupBy(newGroupBy);
    updateCalculations({ groupBy: newGroupBy });
  };

  const handleAggregationChange = (newAggregation: AggregationMethod) => {
    setAggregation(newAggregation);
    updateCalculations({ aggregation: newAggregation });
  };

  // Fonction utilitaire pour mettre à jour les calculs
  const updateCalculations = (updates: Partial<typeof data.calculations>) => {
    onDataChange({
      calculations: {
        ...data.calculations,
        ...updates
      }
    });
  };

  // ========================================
  // FILTRAGE DES MÉTRIQUES
  // ========================================

  const basicMetrics = AVAILABLE_METRICS.filter(m => m.category === 'basic');
  const statisticalMetrics = AVAILABLE_METRICS.filter(m => m.category === 'statistical');
  const advancedMetrics = AVAILABLE_METRICS.filter(m => m.category === 'advanced');

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="space-y-8">
      {/* Sélection du type d'analyse */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Type d'analyse
          <span className="text-red-500 ml-1">*</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ANALYSIS_TYPES.map((analysisType) => {
            const Icon = analysisType.icon;
            const isSelected = selectedType === analysisType.type;
            
            return (
              <button
                key={analysisType.type}
                type="button"
                onClick={() => handleTypeChange(analysisType.type)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  isSelected
                    ? `border-${analysisType.color}-500 bg-${analysisType.color}-50 ring-2 ring-${analysisType.color}-500`
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="flex items-start">
                  <Icon className={cn(
                    'h-6 w-6 mt-1 mr-3',
                    isSelected ? `text-${analysisType.color}-600` : 'text-gray-400'
                  )} />
                  <div className="flex-1">
                    <h4 className={cn(
                      'font-medium',
                      isSelected ? `text-${analysisType.color}-900` : 'text-gray-900'
                    )}>
                      {analysisType.title}
                    </h4>
                    <p className={cn(
                      'text-sm mt-1',
                      isSelected ? `text-${analysisType.color}-700` : 'text-gray-500'
                    )}>
                      {analysisType.description}
                    </p>
                  </div>
                </div>
                
                {isSelected && (
                  <div className={`absolute top-2 right-2 text-${analysisType.color}-600`}>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {validationErrors['calculations.type'] && (
          <div className="text-red-600 text-sm mt-2">
            {validationErrors['calculations.type'].join(', ')}
          </div>
        )}
      </div>

      {/* Sélection des métriques */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Métriques à calculer
          <span className="text-red-500 ml-1">*</span>
        </h3>

        {/* Métriques de base */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Métriques de base</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {basicMetrics.map((metric) => (
              <label
                key={metric.metric}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedMetrics.includes(metric.metric)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={selectedMetrics.includes(metric.metric)}
                  onChange={(e) => handleMetricToggle(metric.metric, e.target.checked)}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {metric.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {metric.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Métriques statistiques */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Métriques statistiques</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {statisticalMetrics.map((metric) => (
              <label
                key={metric.metric}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedMetrics.includes(metric.metric)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  checked={selectedMetrics.includes(metric.metric)}
                  onChange={(e) => handleMetricToggle(metric.metric, e.target.checked)}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {metric.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {metric.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Métriques avancées */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-3"
          >
            <span>{showAdvancedMetrics ? 'Masquer' : 'Afficher'} les métriques avancées</span>
            <svg
              className={cn(
                'ml-2 h-4 w-4 transition-transform',
                showAdvancedMetrics ? 'rotate-180' : ''
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvancedMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {advancedMetrics.map((metric) => (
                <label
                  key={metric.metric}
                  className={cn(
                    'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                    selectedMetrics.includes(metric.metric)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300'
                  )}
                >
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={selectedMetrics.includes(metric.metric)}
                    onChange={(e) => handleMetricToggle(metric.metric, e.target.checked)}
                  />
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {metric.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {metric.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {validationErrors['calculations.metrics'] && (
          <div className="text-red-600 text-sm mt-2">
            {validationErrors['calculations.metrics'].join(', ')}
          </div>
        )}
      </div>

      {/* Configuration du regroupement */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Regroupement des données
          <span className="text-red-500 ml-1">*</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GROUP_BY_OPTIONS.map((option) => (
            <button
              key={option.option}
              type="button"
              onClick={() => handleGroupByChange(option.option)}
              className={cn(
                'p-3 border rounded-lg text-left transition-colors',
                groupBy === option.option
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            >
              <div className="font-medium text-sm">{option.title}</div>
              <div className="text-xs text-gray-500 mt-1">{option.description}</div>
            </button>
          ))}
        </div>

        {validationErrors['calculations.groupBy'] && (
          <div className="text-red-600 text-sm mt-2">
            {validationErrors['calculations.groupBy'].join(', ')}
          </div>
        )}
      </div>

      {/* Méthode d'agrégation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Méthode d'agrégation</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {AGGREGATION_METHODS.map((method) => (
            <button
              key={method.method}
              type="button"
              onClick={() => handleAggregationChange(method.method)}
              className={cn(
                'p-3 border rounded-lg text-left transition-colors',
                aggregation === method.method
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            >
              <div className="font-medium text-sm">{method.title}</div>
              <div className="text-xs text-gray-500 mt-1">{method.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Résumé de la configuration */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-900 mb-2">Configuration sélectionnée</h4>
        <div className="text-sm text-green-800 space-y-1">
          <div>Type d'analyse: {ANALYSIS_TYPES.find(a => a.type === selectedType)?.title}</div>
          <div>Métriques: {selectedMetrics.length} sélectionnée(s)</div>
          <div>Regroupement: {GROUP_BY_OPTIONS.find(g => g.option === groupBy)?.title}</div>
          <div>Agrégation: {AGGREGATION_METHODS.find(a => a.method === aggregation)?.title}</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTypeStep;
