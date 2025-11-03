// ========================================
// COMPARISON TEMPLATE - TEMPLATE D'ANALYSE DE COMPARAISON
// ========================================

import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ScaleIcon, 
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useClasses } from '../../../hooks/useClasses';
import type { 
  StatisticConfiguration, 
  CreateStatisticConfigurationData 
} from '@edustats/shared/types';
import { CalculationType, ChartType } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant ComparisonTemplate
 */
interface ComparisonTemplateProps {
  /** Template de base */
  template: StatisticConfiguration;
  /** Callback de fermeture */
  onClose: () => void;
  /** Callback d'utilisation avec personnalisations */
  onUse: (customizations?: Partial<CreateStatisticConfigurationData>) => void;
}

/**
 * Types de comparaisons disponibles
 */
const COMPARISON_TYPES = [
  {
    id: 'class_vs_class',
    title: 'Classes entre elles',
    description: 'Comparer les performances entre différentes classes',
    groupBy: 'class' as const,
    chartType: ChartType.Radar,
    minSelections: 2,
    icon: '🏫'
  },
  {
    id: 'subject_vs_subject',
    title: 'Matières entre elles',
    description: 'Analyser les écarts de performance par matière',
    groupBy: 'subject' as const,
    chartType: ChartType.Bar,
    minSelections: 1,
    icon: '📚'
  },
  {
    id: 'period_vs_period',
    title: 'Périodes entre elles',
    description: 'Comparer les résultats entre différentes périodes',
    groupBy: 'month' as const,
    chartType: ChartType.Line,
    minSelections: 1,
    icon: '📅'
  },
  {
    id: 'student_groups',
    title: 'Groupes d\'élèves',
    description: 'Comparer des sous-groupes d\'élèves (niveau, genre, etc.)',
    groupBy: 'student' as const,
    chartType: ChartType.Scatter,
    minSelections: 1,
    icon: '👥'
  }
];

/**
 * Métriques de comparaison
 */
const COMPARISON_METRICS = [
  {
    id: 'central_tendency',
    title: 'Tendances centrales',
    description: 'Moyennes, médianes et modes',
    metrics: ['average', 'median', 'mode'],
    icon: '📊'
  },
  {
    id: 'dispersion',
    title: 'Mesures de dispersion',
    description: 'Écart-types, variances et étendues',
    metrics: ['standardDeviation', 'variance', 'min', 'max'],
    icon: '📏'
  },
  {
    id: 'distribution',
    title: 'Distribution',
    description: 'Quartiles, percentiles et forme de distribution',
    metrics: ['percentiles', 'quartiles', 'iqr', 'skewness'],
    icon: '📈'
  },
  {
    id: 'correlation',
    title: 'Corrélations',
    description: 'Relations et dépendances entre variables',
    metrics: ['correlation', 'regression'],
    icon: '🔗'
  }
];

// Périodes de comparaison prédéfinies (non utilisées pour le moment)

/**
 * Niveaux scolaires pour regroupement
 */
const SCHOOL_LEVELS = [
  { id: 'CP1', name: 'CP1', color: 'blue' },
  { id: 'CP2', name: 'CP2', color: 'green' },
  { id: 'CE1', name: 'CE1', color: 'purple' },
  { id: 'CE2', name: 'CE2', color: 'orange' },
  { id: 'CM1', name: 'CM1', color: 'red' },
  { id: 'CM2', name: 'CM2', color: 'pink' }
];

/**
 * Composant template pour l'analyse de comparaison
 */
export const ComparisonTemplate: React.FC<ComparisonTemplateProps> = ({
  template,
  onClose,
  onUse
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedComparisonType, setSelectedComparisonType] = useState(COMPARISON_TYPES[0]);
  const [selectedMetricGroups, setSelectedMetricGroups] = useState<string[]>(['central_tendency']);
  // const [selectedPeriod, setSelectedPeriod] = useState(COMPARISON_PERIODS[0]);
  const [customName, setCustomName] = useState(`Comparaison - ${new Date().toLocaleDateString('fr-FR')}`);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [includeStatisticalTests, setIncludeStatisticalTests] = useState(false);
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState(true);

  // ========================================
  // HOOKS
  // ========================================

  const { classes } = useClasses();

  // ========================================
  // CALCULS DÉRIVÉS
  // ========================================

  const getSelectedMetrics = (): string[] => {
    const allMetrics: string[] = [];
    selectedMetricGroups.forEach(groupId => {
      const group = COMPARISON_METRICS.find(g => g.id === groupId);
      if (group) {
        allMetrics.push(...group.metrics);
      }
    });
    return [...new Set(allMetrics)];
  };

  const getFilteredClasses = () => {
    if (selectedLevels.length === 0) return classes;
    return classes.filter(classe => selectedLevels.includes(classe.level));
  };

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const handleMetricGroupToggle = (groupId: string) => {
    setSelectedMetricGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleLevelToggle = (level: string) => {
    setSelectedLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
  };

  const handleComparisonTypeChange = (comparisonType: typeof COMPARISON_TYPES[0]) => {
    setSelectedComparisonType(comparisonType);
    // Réinitialiser les sélections si nécessaire
    if (comparisonType.minSelections > selectedClasses.length) {
      setSelectedClasses([]);
    }
  };

  const handleUseTemplate = () => {
    const metrics = getSelectedMetrics();
    
    // Ajouter des métriques spéciales selon les options
    if (includeStatisticalTests) {
      metrics.push('correlation');
    }
    if (showConfidenceIntervals) {
      metrics.push('standardDeviation', 'percentiles');
    }

    const customizations: Partial<CreateStatisticConfigurationData> = {
      name: customName,
      description: `Analyse comparative ${selectedComparisonType.title.toLowerCase()} avec ${metrics.length} métriques`,
      dataSources: {
        ...template.dataSources,
        classIds: selectedClasses,
        dateRange: [new Date(dateRange[0]), new Date(dateRange[1])],
        excludeAbsent: true,
        excludeIncomplete: false
      },
      calculations: {
        ...template.calculations,
        type: CalculationType.Comparative,
        metrics: [...new Set(metrics)] as any,
        groupBy: selectedComparisonType.groupBy,
        aggregation: 'average'
      },
      visualization: {
        ...template.visualization,
        chartType: selectedComparisonType.chartType,
        multiSeries: selectedClasses.length > 1,
        annotations: includeStatisticalTests,
        showGrid: true,
        showLegend: true
      },
      tags: [
        'comparaison',
        selectedComparisonType.groupBy,
        ...selectedMetricGroups,
        ...(includeStatisticalTests ? ['tests-statistiques'] : []),
        ...(showConfidenceIntervals ? ['intervalles-confiance'] : [])
      ]
    };

    onUse(customizations);
  };

  const isConfigurationValid = 
    selectedClasses.length >= selectedComparisonType.minSelections && 
    selectedMetricGroups.length > 0;

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg mr-4">
            <ScaleIcon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Template Comparaison
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Comparez les performances entre groupes, périodes ou matières
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Aperçu du template */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">⚖️ Analyse comparative avancée</h4>
          <p className="text-sm text-purple-800 mb-3">
            Ce template permet de comparer statistiquement différents groupes avec des tests de significativité et des visualisations adaptées.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-purple-900">Analyse</div>
              <div className="text-purple-700">Comparative</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-900">Tests</div>
              <div className="text-purple-700">Statistiques</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-900">Graphiques</div>
              <div className="text-purple-700">Adaptatifs</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-900">Significativité</div>
              <div className="text-purple-700">Automatique</div>
            </div>
          </div>
        </div>

        {/* Configuration de base */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Configuration de base
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'analyse
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="Nom de votre analyse comparative..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateRange[0]}
                  onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={dateRange[1]}
                  onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Type de comparaison */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-gray-400" />
            Type de comparaison
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPARISON_TYPES.map((comparisonType) => (
              <button
                key={comparisonType.id}
                onClick={() => handleComparisonTypeChange(comparisonType)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  selectedComparisonType.id === comparisonType.id
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{comparisonType.icon}</div>
                  <div className="flex-1">
                    <h5 className={cn(
                      'font-medium',
                      selectedComparisonType.id === comparisonType.id ? 'text-purple-900' : 'text-gray-900'
                    )}>
                      {comparisonType.title}
                    </h5>
                    <p className={cn(
                      'text-sm mt-1',
                      selectedComparisonType.id === comparisonType.id ? 'text-purple-700' : 'text-gray-500'
                    )}>
                      {comparisonType.description}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Graphique: {comparisonType.chartType} • Min: {comparisonType.minSelections} sélection(s)
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filtrage par niveaux (optionnel) */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Filtrer par niveaux scolaires (optionnel)
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez des niveaux spécifiques pour limiter la comparaison.
          </p>

          <div className="flex flex-wrap gap-2">
            {SCHOOL_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => handleLevelToggle(level.id)}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                  selectedLevels.includes(level.id)
                    ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                )}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sélection des classes */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
            Classes à comparer
            <span className="text-red-500 ml-1">*</span>
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Minimum {selectedComparisonType.minSelections} classe(s) requise(s) pour ce type de comparaison.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getFilteredClasses().map((classe) => (
              <label
                key={classe.id}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedClasses.includes(classe.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                  checked={selectedClasses.includes(classe.id)}
                  onChange={() => handleClassToggle(classe.id)}
                />
                <div className="ml-3 min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {classe.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {classe.level} - {classe.studentCount || 0} élèves
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedClasses.length < selectedComparisonType.minSelections && (
            <div className="text-red-600 text-sm mt-2">
              Veuillez sélectionner au moins {selectedComparisonType.minSelections} classe(s)
            </div>
          )}
        </div>

        {/* Métriques de comparaison */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
            Métriques de comparaison
            <span className="text-red-500 ml-1">*</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMPARISON_METRICS.map((metricGroup) => (
              <label
                key={metricGroup.id}
                className={cn(
                  'relative flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedMetricGroups.includes(metricGroup.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500 mt-1"
                  checked={selectedMetricGroups.includes(metricGroup.id)}
                  onChange={() => handleMetricGroupToggle(metricGroup.id)}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <div className="text-lg mr-2">{metricGroup.icon}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {metricGroup.title}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metricGroup.description}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {metricGroup.metrics.map(metric => (
                      <span
                        key={metric}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Options avancées */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Options statistiques avancées
          </h4>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                checked={includeStatisticalTests}
                onChange={(e) => setIncludeStatisticalTests(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Inclure les tests de significativité statistique
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Ajoute des tests t, ANOVA et autres pour évaluer la significativité des différences
            </p>

            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                checked={showConfidenceIntervals}
                onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
              />
              <span className="ml-3 text-sm text-gray-700">
                Afficher les intervalles de confiance
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-7">
              Ajoute des barres d'erreur et intervalles de confiance à 95% sur les graphiques
            </p>
          </div>
        </div>

        {/* Aperçu de la configuration */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-2">📋 Configuration de comparaison</h4>
          <div className="text-sm text-orange-800 space-y-1">
            <div>Nom: {customName}</div>
            <div>Type: {selectedComparisonType.title}</div>
            <div>Classes: {selectedClasses.length} sélectionnée(s)</div>
            <div>Métriques: {getSelectedMetrics().length} calculée(s)</div>
            <div>Graphique: {selectedComparisonType.chartType}</div>
            {selectedLevels.length > 0 && (
              <div>Niveaux filtrés: {selectedLevels.join(', ')}</div>
            )}
            {includeStatisticalTests && <div>✓ Tests statistiques inclus</div>}
            {showConfidenceIntervals && <div>✓ Intervalles de confiance</div>}
          </div>
        </div>
      </div>

      {/* Footer avec actions */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          Template: {template.name}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Annuler
          </button>
          
          <button
            onClick={handleUseTemplate}
            disabled={!isConfigurationValid}
            className={cn(
              'px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500',
              isConfigurationValid
                ? 'text-white bg-purple-600 hover:bg-purple-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            )}
          >
            Créer l'analyse comparative
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTemplate;