// ========================================
// STATISTICS DASHBOARD - TABLEAU DE BORD PRINCIPAL
// ========================================

import React, { useState, useEffect } from 'react';
import { PlusIcon, Cog6ToothIcon, ChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ConfigurationWizard } from './StatisticsBuilder/ConfigurationWizard';
import { TemplateGallery } from './Templates/TemplateGallery';
import { AdvancedChart } from './Visualizations/AdvancedChart';
import { useStatisticsApi } from '../../hooks/useStatisticsApi';
import type {
  StatisticConfiguration,
  StatisticResult,
  StatisticCategory
} from '@edustats/shared/statistics';
import { cn } from '../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Interface pour les onglets du dashboard
 */
interface DashboardTab {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  component: React.ComponentType<any>;
}

/**
 * Props du composant StatisticsDashboard
 */
interface StatisticsDashboardProps {
  className?: string;
}

/**
 * Tableau de bord principal des statistiques personnalisées
 */
export const StatisticsDashboard: React.FC<StatisticsDashboardProps> = ({
  className = ''
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [activeTab, setActiveTab] = useState<string>('configurations');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [selectedConfiguration, setSelectedConfiguration] = useState<StatisticConfiguration | null>(null);
  const [generatedResult, setGeneratedResult] = useState<StatisticResult | null>(null);

  // ========================================
  // HOOKS API
  // ========================================

  const {
    configurations,
    results,
    loading: apiLoading,
    getConfigurations,
    generateStatistics,
    deleteConfiguration
  } = useStatisticsApi();

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    getConfigurations();
  }, [getConfigurations]);

  // ========================================
  // DÉFINITION DES ONGLETS
  // ========================================

  const tabs: DashboardTab[] = [
    {
      id: 'configurations',
      title: 'Mes Analyses',
      icon: ChartBarIcon,
      component: ConfigurationsTab
    },
    {
      id: 'templates',
      title: 'Templates',
      icon: DocumentTextIcon,
      component: TemplatesTab
    },
    {
      id: 'results',
      title: 'Résultats',
      icon: Cog6ToothIcon,
      component: ResultsTab
    }
  ];

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleCreateNew = () => {
    setSelectedTemplateId(undefined);
    setShowWizard(true);
  };

  const handleCreateFromTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowWizard(true);
  };

  const handleConfigurationCreated = (config: StatisticConfiguration) => {
    toast.success('Configuration créée avec succès !');
    getConfigurations(); // Rafraîchir la liste
    setActiveTab('configurations'); // Basculer vers l'onglet configurations
  };

  const handleGenerateStatistics = async (configId: string) => {
    try {
      const result = await generateStatistics(configId);
      setGeneratedResult(result);
      toast.success('Statistiques générées avec succès !');
    } catch (error) {
      console.error('Erreur génération statistiques:', error);
      toast.error('Erreur lors de la génération des statistiques');
    }
  };

  const handleDeleteConfiguration = async (configId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      try {
        await deleteConfiguration(configId);
        toast.success('Configuration supprimée');
        getConfigurations();
      } catch (error) {
        console.error('Erreur suppression:', error);
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // ========================================
  // RENDU
  // ========================================

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || ConfigurationsTab;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques Personnalisées</h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez vos analyses de données personnalisées
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('templates')}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Parcourir les templates
          </button>
          
          <button
            onClick={handleCreateNew}
            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle analyse
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.title}
                {tab.id === 'configurations' && configurations && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {configurations.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="min-h-[500px]">
        <ActiveTabComponent
          configurations={configurations}
          results={results}
          loading={apiLoading}
          onGenerate={handleGenerateStatistics}
          onDelete={handleDeleteConfiguration}
          onCreateFromTemplate={handleCreateFromTemplate}
          selectedResult={generatedResult}
        />
      </div>

      {/* Wizard de création */}
      <ConfigurationWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onConfigurationCreated={handleConfigurationCreated}
        templateId={selectedTemplateId}
      />
    </div>
  );
};

// ========================================
// ONGLET CONFIGURATIONS
// ========================================

interface ConfigurationsTabProps {
  configurations: StatisticConfiguration[];
  loading: boolean;
  onGenerate: (configId: string) => void;
  onDelete: (configId: string) => void;
}

const ConfigurationsTab: React.FC<ConfigurationsTabProps> = ({
  configurations,
  loading,
  onGenerate,
  onDelete
}) => {
  const [filter, setFilter] = useState<StatisticCategory | 'all'>('all');

  const filteredConfigurations = configurations?.filter(config =>
    filter === 'all' || config.category === filter
  ) || [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucune configuration créée
        </h3>
        <p className="text-gray-600 mb-6">
          Commencez par créer votre première analyse personnalisée
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Créer ma première analyse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { value: 'all', label: 'Toutes' },
          { value: StatisticCategory.Performance, label: 'Performance' },
          { value: StatisticCategory.Progression, label: 'Progression' },
          { value: StatisticCategory.Comparison, label: 'Comparaison' },
          { value: StatisticCategory.Custom, label: 'Personnalisé' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value as any)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              filter === option.value
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Grille des configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConfigurations.map((config) => (
          <ConfigurationCard
            key={config.id}
            configuration={config}
            onGenerate={() => onGenerate(config.id)}
            onDelete={() => onDelete(config.id)}
          />
        ))}
      </div>
    </div>
  );
};

// ========================================
// ONGLET TEMPLATES
// ========================================

interface TemplatesTabProps {
  onCreateFromTemplate: (templateId: string) => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({ onCreateFromTemplate }) => {
  return (
    <TemplateGallery onCreateFromTemplate={onCreateFromTemplate} />
  );
};

// ========================================
// ONGLET RÉSULTATS
// ========================================

interface ResultsTabProps {
  results: StatisticResult[];
  selectedResult: StatisticResult | null;
  loading: boolean;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  results,
  selectedResult,
  loading
}) => {
  if (loading) {
    return <div className="text-center py-8">Chargement des résultats...</div>;
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📈</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun résultat généré
        </h3>
        <p className="text-gray-600">
          Générez des statistiques depuis vos configurations pour voir les résultats ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedResult && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Dernier résultat généré
          </h3>
          
          {selectedResult.datasets && selectedResult.datasets.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedChart
                data={selectedResult.datasets}
                type="bar"
                height={300}
              />
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Résumé</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Points de données: {selectedResult.summary.totalDataPoints}</div>
                    <div>Temps de traitement: {selectedResult.summary.processingTime}ms</div>
                    <div>Généré le: {new Date(selectedResult.createdAt).toLocaleString('fr-FR')}</div>
                  </div>
                </div>
                
                {selectedResult.insights && selectedResult.insights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Insights</h4>
                    <div className="space-y-2">
                      {selectedResult.insights.slice(0, 3).map((insight, index) => (
                        <div key={index} className="text-sm p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="font-medium text-blue-900">{insight.title}</p>
                          <p className="text-blue-700 text-xs mt-1">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Liste des résultats précédents */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historique des résultats
        </h3>
        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">
                    Résultat #{result.id.slice(-8)}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.summary.totalDataPoints} points de données
                  </p>
                  <p className="text-xs text-gray-500">
                    Généré le {new Date(result.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========================================
// CARTE DE CONFIGURATION
// ========================================

interface ConfigurationCardProps {
  configuration: StatisticConfiguration;
  onGenerate: () => void;
  onDelete: () => void;
}

const ConfigurationCard: React.FC<ConfigurationCardProps> = ({
  configuration,
  onGenerate,
  onDelete
}) => {
  const getCategoryInfo = (category: StatisticCategory) => {
    switch (category) {
      case StatisticCategory.Performance:
        return { label: 'Performance', color: 'blue', icon: '🎯' };
      case StatisticCategory.Progression:
        return { label: 'Progression', color: 'green', icon: '📈' };
      case StatisticCategory.Comparison:
        return { label: 'Comparaison', color: 'purple', icon: '⚖️' };
      default:
        return { label: 'Personnalisé', color: 'gray', icon: '🛠️' };
    }
  };

  const categoryInfo = getCategoryInfo(configuration.category);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{categoryInfo.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {configuration.name}
              </h3>
              <span className={cn(
                'inline-block px-2 py-1 text-xs rounded-full mt-1',
                `bg-${categoryInfo.color}-100 text-${categoryInfo.color}-800`
              )}>
                {categoryInfo.label}
              </span>
            </div>
          </div>
        </div>

        {configuration.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {configuration.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Créé le {new Date(configuration.createdAt).toLocaleDateString('fr-FR')}</span>
          {configuration.isTemplate && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Template</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onGenerate}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Générer
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
