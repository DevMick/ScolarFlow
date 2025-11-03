// ========================================
// PERFORMANCE TEMPLATE - TEMPLATE D'ANALYSE DE PERFORMANCE
// ========================================

import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ChartBarIcon, 
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { useClasses } from '../../../hooks/useClasses';
import type { 
  StatisticConfiguration, 
  CreateStatisticConfigurationData 
} from '@edustats/shared/types';
import { ChartType } from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant PerformanceTemplate
 */
interface PerformanceTemplateProps {
  /** Template de base */
  template: StatisticConfiguration;
  /** Callback de fermeture */
  onClose: () => void;
  /** Callback d'utilisation avec personnalisations */
  onUse: (customizations?: Partial<CreateStatisticConfigurationData>) => void;
}

/**
 * Matières prédéfinies pour l'analyse de performance
 */
const PERFORMANCE_SUBJECTS = [
  { id: 'mathematiques', name: 'Mathématiques', icon: '🔢', color: 'blue' },
  { id: 'francais', name: 'Français', icon: '📚', color: 'green' },
  { id: 'sciences', name: 'Sciences', icon: '🔬', color: 'purple' },
  { id: 'histoire', name: 'Histoire-Géographie', icon: '🌍', color: 'orange' },
  { id: 'anglais', name: 'Anglais', icon: '🇬🇧', color: 'red' },
  { id: 'arts', name: 'Arts plastiques', icon: '🎨', color: 'pink' }
];

/**
 * Types d'analyse de performance
 */
const PERFORMANCE_ANALYSIS_TYPES = [
  {
    id: 'class_overview',
    title: 'Vue d\'ensemble de classe',
    description: 'Analyse globale des performances de la classe avec moyennes et répartitions',
    metrics: ['average', 'median', 'standardDeviation', 'percentiles'],
    chartType: ChartType.Bar,
    icon: '📊'
  },
  {
    id: 'subject_comparison',
    title: 'Comparaison par matières',
    description: 'Comparaison des performances entre différentes matières',
    metrics: ['average', 'standardDeviation', 'min', 'max'],
    chartType: ChartType.Radar,
    icon: '⚖️'
  },
  {
    id: 'student_ranking',
    title: 'Classement des élèves',
    description: 'Analyse du classement et de la distribution des performances',
    metrics: ['average', 'percentiles', 'quartiles'],
    chartType: ChartType.Bar,
    icon: '🏆'
  },
  {
    id: 'difficulty_analysis',
    title: 'Analyse des difficultés',
    description: 'Identification des points de difficulté et des réussites',
    metrics: ['average', 'standardDeviation', 'min', 'percentiles'],
    chartType: ChartType.Heatmap,
    icon: '🎯'
  }
];

/**
 * Composant template pour l'analyse de performance
 */
export const PerformanceTemplate: React.FC<PerformanceTemplateProps> = ({
  template,
  onClose,
  onUse
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(PERFORMANCE_ANALYSIS_TYPES[0]);
  const [customName, setCustomName] = useState(`${template.name} - ${new Date().toLocaleDateString('fr-FR')}`);
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours avant
    new Date().toISOString().split('T')[0] // aujourd'hui
  ]);

  // ========================================
  // HOOKS
  // ========================================

  const { classes } = useClasses();

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

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleUseTemplate = () => {
    const customizations: Partial<CreateStatisticConfigurationData> = {
      name: customName,
      dataSources: {
        ...template.dataSources,
        classIds: selectedClasses,
        subjectFilters: selectedSubjects,
        dateRange: [new Date(dateRange[0]), new Date(dateRange[1])]
      },
      calculations: {
        ...template.calculations,
        metrics: selectedAnalysisType.metrics as any
      },
      visualization: {
        ...template.visualization,
        chartType: selectedAnalysisType.chartType
      }
    };

    onUse(customizations);
  };

  const isConfigurationValid = selectedClasses.length > 0;

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <ChartBarIcon className="h-6 w-6" />
      </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Template Performance
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Configurez votre analyse de performance personnalisée
            </p>
        </div>
        </div>
        
        <button
          onClick={onClose}
          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Aperçu du template */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📋 À propos de ce template</h4>
          <p className="text-sm text-blue-800 mb-3">{template.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-900">Type</div>
              <div className="text-blue-700">{template.calculations.type}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">Métriques</div>
              <div className="text-blue-700">{template.calculations.metrics.length}</div>
        </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">Graphique</div>
              <div className="text-blue-700">{template.visualization.chartType}</div>
        </div>
            <div className="text-center">
              <div className="font-semibold text-blue-900">Regroupement</div>
              <div className="text-blue-700">{template.calculations.groupBy}</div>
      </div>
          </div>
      </div>

        {/* Configuration de base */}
            <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-400" />
            Configuration de base
          </h4>

          <div className="space-y-4">
            {/* Nom personnalisé */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'analyse
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nom de votre analyse..."
              />
            </div>

            {/* Période d'analyse */}
            <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={dateRange[0]}
                  onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sélection des classes */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
            Classes à analyser
            <span className="text-red-500 ml-1">*</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classes.map((classe) => (
              <label
                key={classe.id}
                className={cn(
                  'relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedClasses.includes(classe.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                )}
              >
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
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

          {selectedClasses.length === 0 && (
            <div className="text-red-600 text-sm mt-2">
              Veuillez sélectionner au moins une classe
            </div>
          )}
        </div>

        {/* Type d'analyse */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-gray-400" />
            Type d'analyse de performance
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERFORMANCE_ANALYSIS_TYPES.map((analysisType) => (
              <button
                key={analysisType.id}
                onClick={() => setSelectedAnalysisType(analysisType)}
                className={cn(
                  'relative p-4 border rounded-lg text-left transition-all hover:shadow-md',
                  selectedAnalysisType.id === analysisType.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                    : 'border-gray-300 hover:border-gray-400'
                )}
              >
                <div className="flex items-start">
                  <div className="text-2xl mr-3">{analysisType.icon}</div>
                  <div className="flex-1">
                    <h5 className={cn(
                      'font-medium',
                      selectedAnalysisType.id === analysisType.id ? 'text-blue-900' : 'text-gray-900'
                    )}>
                      {analysisType.title}
                    </h5>
                    <p className={cn(
                      'text-sm mt-1',
                      selectedAnalysisType.id === analysisType.id ? 'text-blue-700' : 'text-gray-500'
                    )}>
                      {analysisType.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {analysisType.metrics.slice(0, 3).map(metric => (
                        <span
                          key={metric}
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            selectedAnalysisType.id === analysisType.id
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {metric}
                        </span>
                      ))}
                      {analysisType.metrics.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{analysisType.metrics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filtres par matières (optionnel) */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Matières à analyser (optionnel)
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Laissez vide pour analyser toutes les matières, ou sélectionnez des matières spécifiques.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PERFORMANCE_SUBJECTS.map((subject) => (
              <button
                key={subject.id}
                onClick={() => handleSubjectToggle(subject.id)}
                className={cn(
                  'flex flex-col items-center p-3 border rounded-lg transition-colors',
                  selectedSubjects.includes(subject.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                )}
              >
                <div className="text-2xl mb-1">{subject.icon}</div>
                <div className="text-xs font-medium text-center">{subject.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Aperçu de la configuration */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ Configuration finale</h4>
          <div className="text-sm text-green-800 space-y-1">
            <div>Nom: {customName}</div>
            <div>Classes: {selectedClasses.length} sélectionnée(s)</div>
            <div>Type d'analyse: {selectedAnalysisType.title}</div>
            <div>Période: du {new Date(dateRange[0]).toLocaleDateString('fr-FR')} au {new Date(dateRange[1]).toLocaleDateString('fr-FR')}</div>
            {selectedSubjects.length > 0 && (
              <div>Matières filtrées: {selectedSubjects.length}</div>
            )}
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          
          <button
            onClick={handleUseTemplate}
            disabled={!isConfigurationValid}
            className={cn(
              'px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              isConfigurationValid
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            )}
          >
            Créer l'analyse
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTemplate;