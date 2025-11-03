// ========================================
// TEMPLATE GALLERY - GALERIE DE TEMPLATES
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { 
  CustomTableTemplate, 
  TableCategory,
  CustomTableConfig 
} from '@edustats/shared/types';
import { useTableTemplates } from '../../hooks/useCustomTables';
import { cn } from '../../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Props du composant TemplateGallery
 */
interface TemplateGalleryProps {
  /** Callback lors de la sélection d'un template */
  onSelectTemplate: (config: Partial<CustomTableConfig>) => void;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Catégorie filtrée par défaut */
  defaultCategory?: TableCategory;
}

/**
 * Galerie de templates de tableaux avec recherche et filtres
 */
export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onClose,
  defaultCategory
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [templates, setTemplates] = useState<CustomTableTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<CustomTableTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TableCategory | 'all'>(defaultCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyOfficial, setShowOnlyOfficial] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTableTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { 
    getTemplates, 
    getPopularTemplates, 
    useTemplate,
    loading 
  } = useTableTemplates();

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const result = await getTemplates({ limit: 100 });
      setTemplates(result.templates);
      setFilteredTemplates(result.templates);
    } catch (error) {
      toast.error('Erreur lors du chargement des templates');
      console.error('Erreur chargement templates:', error);
    }
  };

  // ========================================
  // FILTRAGE ET RECHERCHE
  // ========================================

  useEffect(() => {
    let filtered = templates;

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filtre officiel
    if (showOnlyOfficial) {
      filtered = filtered.filter(template => template.isOfficial);
    }

    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, showOnlyOfficial, searchQuery]);

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleUseTemplate = async (template: CustomTableTemplate) => {
    try {
      const config = await useTemplate(template.id);
      onSelectTemplate(config);
      toast.success(`Template "${template.name}" appliqué`);
      onClose?.();
    } catch (error) {
      toast.error('Erreur lors de l\'application du template');
      console.error('Erreur utilisation template:', error);
    }
  };

  const handlePreviewTemplate = (template: CustomTableTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // ========================================
  // CONFIGURATION DES CATÉGORIES
  // ========================================

  const categories = [
    { 
      id: 'all' as const, 
      label: 'Tous les templates', 
      icon: DocumentTextIcon, 
      color: 'text-gray-600' 
    },
    { 
      id: TableCategory.Bulletin, 
      label: 'Bulletins de notes', 
      icon: AcademicCapIcon, 
      color: 'text-blue-600' 
    },
    { 
      id: TableCategory.ConseilClasse, 
      label: 'Conseils de classe', 
      icon: UserGroupIcon, 
      color: 'text-green-600' 
    },
    { 
      id: TableCategory.Bilan, 
      label: 'Bilans et rapports', 
      icon: ChartBarIcon, 
      color: 'text-purple-600' 
    },
    { 
      id: TableCategory.Communication, 
      label: 'Communication', 
      icon: DocumentTextIcon, 
      color: 'text-orange-600' 
    },
    { 
      id: TableCategory.Custom, 
      label: 'Personnalisés', 
      icon: StarIcon, 
      color: 'text-pink-600' 
    }
  ];

  // ========================================
  // RENDU DES COMPOSANTS
  // ========================================

  const renderTemplateCard = (template: CustomTableTemplate) => (
    <div
      key={template.id}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header de la carte */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            {template.isOfficial && (
              <StarIconSolid className="h-4 w-4 text-yellow-500" title="Template officiel" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {template.description || 'Aucune description'}
          </p>
        </div>
      </div>

      {/* Informations du template */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Colonnes</span>
          <span className="font-medium">{template.config.columns?.length || 0}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Utilisations</span>
          <span className="font-medium">{template.usageCount}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Créé le</span>
          <span className="font-medium">
            {new Date(template.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Tags */}
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {template.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{template.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePreviewTemplate(template);
          }}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <EyeIcon className="h-4 w-4 mr-2" />
          Aperçu
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUseTemplate(template);
          }}
          className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
          Utiliser
        </button>
      </div>
    </div>
  );

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTemplate.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="p-6 overflow-y-auto max-h-96">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Configuration des colonnes ({selectedTemplate.config.columns?.length || 0})
                </h3>
                <div className="space-y-2">
                  {selectedTemplate.config.columns?.map((column: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{column.label}</span>
                      <span className="text-sm text-gray-600">{column.type}</span>
                    </div>
                  )) || <p className="text-gray-500">Aucune colonne configurée</p>}
                </div>
              </div>

              {selectedTemplate.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                handleUseTemplate(selectedTemplate);
                setShowPreview(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Utiliser ce template
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Galerie de templates
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un template..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtres */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtres :</span>
          </div>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOnlyOfficial}
              onChange={(e) => setShowOnlyOfficial(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Templates officiels uniquement</span>
          </label>
        </div>
      </div>

      <div className="flex h-96">
        {/* Sidebar des catégories */}
        <div className="w-64 border-r border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Catégories</h3>
          <nav className="space-y-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <category.icon className={cn('h-5 w-5 mr-3', category.color)} />
                {category.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Grille des templates */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(renderTemplateCard)}
            </div>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun template trouvé
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Essayez de modifier vos critères de recherche'
                  : 'Aucun template disponible dans cette catégorie'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Aperçu du template */}
      {showPreview && renderTemplatePreview()}
    </div>
  );
};
