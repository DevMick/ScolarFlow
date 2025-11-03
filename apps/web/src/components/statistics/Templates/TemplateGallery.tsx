// ========================================
// TEMPLATE GALLERY - GALERIE DE TEMPLATES STATISTIQUES
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  SparklesIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useStatisticsApi, type StatisticsTemplate } from '../../../hooks/useStatisticsApi';
import { PerformanceTemplate } from './PerformanceTemplate';
import { ProgressionTemplate } from './ProgressionTemplate';
import { ComparisonTemplate } from './ComparisonTemplate';
import type { 
  StatisticConfiguration, 
  StatisticCategory,
  CreateStatisticConfigurationData 
} from '@edustats/shared/types';
import { cn } from '../../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Interface pour les filtres de templates
 */
interface TemplateFilters {
  category?: StatisticCategory | 'all';
  search?: string;
  tags?: string[];
}

/**
 * Props du composant TemplateGallery
 */
interface TemplateGalleryProps {
  /** Callback lors de la sélection d'un template */
  onTemplateSelect?: (template: StatisticConfiguration) => void;
  /** Callback lors de la création depuis un template */
  onCreateFromTemplate?: (config: StatisticConfiguration) => void;
  /** Permet la création directe depuis les templates */
  allowDirectCreation?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Catégories avec métadonnées
 */
const TEMPLATE_CATEGORIES = [
  {
    id: 'all' as const,
    title: 'Tous les templates',
    description: 'Voir tous les templates disponibles',
    icon: SparklesIcon,
    color: 'gray'
  },
  {
    id: 'performance' as StatisticCategory,
    title: 'Performance',
    description: 'Analyses des résultats et réussites',
    icon: ChartBarIcon,
    color: 'blue'
  },
  {
    id: 'progression' as StatisticCategory,
    title: 'Progression',
    description: 'Évolution temporelle des performances',
    icon: ClockIcon,
    color: 'green'
  },
  {
    id: 'comparison' as StatisticCategory,
    title: 'Comparaison',
    description: 'Comparaisons entre groupes ou périodes',
    icon: AcademicCapIcon,
    color: 'purple'
  }
];

/**
 * Composant de galerie de templates statistiques
 */
export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onTemplateSelect,
  onCreateFromTemplate,
  allowDirectCreation = true,
  className
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [templates, setTemplates] = useState<StatisticsTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<StatisticsTemplate[]>([]);
  const [filters, setFilters] = useState<TemplateFilters>({
    category: 'all',
    search: '',
    tags: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<StatisticConfiguration | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // ========================================
  // HOOKS API
  // ========================================

  const { 
    getTemplates, 
    useTemplate, 
    loading: apiLoading 
  } = useStatisticsApi();

  // ========================================
  // CHARGEMENT DES TEMPLATES
  // ========================================

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await getTemplates();
        setTemplates(templateList);
        setFilteredTemplates(templateList);
      } catch (error) {
        console.error('Erreur chargement templates:', error);
        toast.error('Erreur lors du chargement des templates');
      }
    };

    loadTemplates();
  }, [getTemplates]);

  // ========================================
  // FILTRAGE DES TEMPLATES
  // ========================================

  useEffect(() => {
    let filtered = [...templates];

    // Filtre par catégorie
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(template => template.category === filters.category);
    }

    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description?.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtre par tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(template =>
        filters.tags!.every(tag => template.tags.includes(tag))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, filters]);

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleTemplateClick = (template: StatisticsTemplate) => {
    setSelectedTemplate(template.configuration as StatisticConfiguration);
    setShowPreview(true);
    onTemplateSelect?.(template.configuration as StatisticConfiguration);
  };

  const handleCreateFromTemplate = async (template: StatisticConfiguration, customizations?: Partial<CreateStatisticConfigurationData>) => {
    if (!allowDirectCreation) {
      onTemplateSelect?.(template);
      return;
    }

    try {
      const newConfig = await useTemplate(template.id, customizations);
      if (newConfig) {
        onCreateFromTemplate?.(newConfig);
        toast.success('Configuration créée depuis le template !');
      }
    } catch (error) {
      console.error('Erreur création depuis template:', error);
      toast.error('Erreur lors de la création depuis le template');
    }
  };

  const handleFilterChange = (newFilters: Partial<TemplateFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // ========================================
  // EXTRACTION DES TAGS DISPONIBLES
  // ========================================

  const availableTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [templates]);

  // ========================================
  // RENDU DES COMPOSANTS
  // ========================================

  const renderFilters = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center mb-4">
        <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recherche */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recherche
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange({ search: e.target.value })}
              placeholder="Rechercher un template..."
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie
          </label>
          <select
            value={filters.category || 'all'}
            onChange={(e) => handleFilterChange({ category: e.target.value as any })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {TEMPLATE_CATEGORIES.map(category => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags populaires
          </label>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {availableTags.slice(0, 10).map(tag => (
              <button
                key={tag}
                onClick={() => {
                  const newTags = filters.tags?.includes(tag)
                    ? filters.tags.filter(t => t !== tag)
                    : [...(filters.tags || []), tag];
                  handleFilterChange({ tags: newTags });
                }}
                className={cn(
                  'px-2 py-1 text-xs rounded-full border transition-colors',
                  filters.tags?.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Résumé des filtres */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          {filteredTemplates.length} template(s) trouvé(s)
          {filters.search && ` pour "${filters.search}"`}
        </div>
        {(filters.search || filters.category !== 'all' || (filters.tags && filters.tags.length > 0)) && (
          <button
            onClick={() => setFilters({ category: 'all', search: '', tags: [] })}
            className="text-blue-600 hover:text-blue-800"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    </div>
  );

  const renderTemplateCard = (template: StatisticsTemplate) => {
    const category = TEMPLATE_CATEGORIES.find(c => c.id === template.category);
    const IconComponent = category?.icon || SparklesIcon;

    return (
      <div
        key={template.id}
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => handleTemplateClick(template)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className={cn(
              'p-2 rounded-lg mr-3',
              category?.color === 'blue' && 'bg-blue-100 text-blue-600',
              category?.color === 'green' && 'bg-green-100 text-green-600',
              category?.color === 'purple' && 'bg-purple-100 text-purple-600',
              category?.color === 'gray' && 'bg-gray-100 text-gray-600'
            )}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <p className="text-sm text-gray-600">{category?.title}</p>
            </div>
          </div>
          
          {template.isPublic && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Public
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
          {template.description || 'Aucune description disponible'}
        </p>

        {/* Configuration résumée */}
        <div className="space-y-2 mb-4 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Type d'analyse:</span>
            <span className="font-medium">{template.configuration.calculations?.type || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Graphique:</span>
            <span className="font-medium">{template.configuration.visualization?.chartType || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Métriques:</span>
            <span className="font-medium">{template.configuration.calculations?.metrics?.length || 0}</span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{template.tags.length - 3} autres
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTemplateClick(template);
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir détails
          </button>
          
          {allowDirectCreation && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFromTemplate(template.configuration as StatisticConfiguration);
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Utiliser ce template
            </button>
          )}
        </div>
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  if (apiLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Chargement des templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Galerie de Templates Statistiques
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Découvrez nos templates prêts à l'emploi pour analyser rapidement vos données d'évaluations. 
          Chaque template est optimisé pour des cas d'usage pédagogiques spécifiques.
        </p>
      </div>

      {/* Filtres */}
      {renderFilters()}

      {/* Grille de templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(renderTemplateCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun template trouvé
          </h3>
          <p className="text-gray-600 mb-4">
            Aucun template ne correspond à vos critères de recherche.
          </p>
          <button
            onClick={() => setFilters({ category: 'all', search: '', tags: [] })}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Modal de prévisualisation */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setShowPreview(false)} />
            
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
              {/* Rendu du template spécialisé */}
              {selectedTemplate.category === 'performance' && (
                <PerformanceTemplate
                  template={selectedTemplate}
                  onClose={() => setShowPreview(false)}
                  onUse={(customizations) => handleCreateFromTemplate(selectedTemplate, customizations)}
                />
              )}
              {selectedTemplate.category === 'progression' && (
                <ProgressionTemplate
                  template={selectedTemplate}
                  onClose={() => setShowPreview(false)}
                  onUse={(customizations) => handleCreateFromTemplate(selectedTemplate, customizations)}
                />
              )}
              {selectedTemplate.category === 'comparison' && (
                <ComparisonTemplate
                  template={selectedTemplate}
                  onClose={() => setShowPreview(false)}
                  onUse={(customizations) => handleCreateFromTemplate(selectedTemplate, customizations)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;