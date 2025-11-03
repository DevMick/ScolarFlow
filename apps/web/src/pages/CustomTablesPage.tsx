// ========================================
// CUSTOM TABLES PAGE - PAGE TABLEAUX PERSONNALISÉS
// ========================================

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { 
  CustomTable, 
  TableCategory,
  TableExportOptions 
} from '@edustats/shared/types';
import { useCustomTables } from '../hooks/useCustomTables';
import { useClasses } from '../hooks/useClasses';
import { TableDesigner, TemplateGallery } from '../components/tables';
import { cn } from '../utils/classNames';
import { toast } from 'react-hot-toast';

/**
 * Page principale de gestion des tableaux personnalisés
 */
export const CustomTablesPage: React.FC = () => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [tables, setTables] = useState<CustomTable[]>([]);
  const [filteredTables, setFilteredTables] = useState<CustomTable[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TableCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [currentView, setCurrentView] = useState<'list' | 'designer' | 'templates'>('list');
  const [editingTableId, setEditingTableId] = useState<string | undefined>();
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingTable, setExportingTable] = useState<CustomTable | null>(null);

  // ========================================
  // HOOKS
  // ========================================

  const { 
    getTables, 
    deleteTable, 
    duplicateTable, 
    exportTable,
    loading 
  } = useCustomTables();
  
  const { classes } = useClasses();

  // ========================================
  // CHARGEMENT DES DONNÉES
  // ========================================

  useEffect(() => {
    loadTables();
  }, [selectedCategory, selectedClassId]);

  const loadTables = async () => {
    try {
      const options: any = {};
      if (selectedCategory !== 'all') options.category = selectedCategory;
      if (selectedClassId) options.classId = selectedClassId;

      const result = await getTables(options);
      setTables(result.tables);
      setFilteredTables(result.tables);
    } catch (error) {
      toast.error('Erreur lors du chargement des tableaux');
      console.error('Erreur chargement tableaux:', error);
    }
  };

  // ========================================
  // FILTRAGE ET RECHERCHE
  // ========================================

  useEffect(() => {
    let filtered = tables;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(table =>
        table.name.toLowerCase().includes(query) ||
        table.description?.toLowerCase().includes(query) ||
        table.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTables(filtered);
  }, [tables, searchQuery]);

  // ========================================
  // GESTION DES ACTIONS
  // ========================================

  const handleCreateTable = () => {
    setEditingTableId(undefined);
    setCurrentView('designer');
  };

  const handleEditTable = (tableId: string) => {
    setEditingTableId(tableId);
    setCurrentView('designer');
  };

  const handleDeleteTable = async (table: CustomTable) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le tableau "${table.name}" ?`)) {
      return;
    }

    try {
      await deleteTable(table.id);
      toast.success('Tableau supprimé');
      loadTables();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error('Erreur suppression:', error);
    }
  };

  const handleDuplicateTable = async (table: CustomTable) => {
    try {
      await duplicateTable(table.id, `${table.name} (Copie)`);
      toast.success('Tableau dupliqué');
      loadTables();
    } catch (error) {
      toast.error('Erreur lors de la duplication');
      console.error('Erreur duplication:', error);
    }
  };

  const handleExportTable = (table: CustomTable) => {
    setExportingTable(table);
    setShowExportModal(true);
  };

  const handleSaveTable = (table: CustomTable) => {
    toast.success(editingTableId ? 'Tableau mis à jour' : 'Tableau créé');
    setCurrentView('list');
    setEditingTableId(undefined);
    loadTables();
  };

  // ========================================
  // CONFIGURATION DES CATÉGORIES
  // ========================================

  const categories = [
    { id: 'all' as const, label: 'Tous les tableaux', count: tables.length },
    { id: TableCategory.Bulletin, label: 'Bulletins', count: tables.filter(t => t.category === TableCategory.Bulletin).length },
    { id: TableCategory.ConseilClasse, label: 'Conseils de classe', count: tables.filter(t => t.category === TableCategory.ConseilClasse).length },
    { id: TableCategory.Bilan, label: 'Bilans', count: tables.filter(t => t.category === TableCategory.Bilan).length },
    { id: TableCategory.Communication, label: 'Communication', count: tables.filter(t => t.category === TableCategory.Communication).length },
    { id: TableCategory.Custom, label: 'Personnalisés', count: tables.filter(t => t.category === TableCategory.Custom).length }
  ];

  // ========================================
  // RENDU DES COMPOSANTS
  // ========================================

  const renderTableCard = (table: CustomTable) => (
    <div
      key={table.id}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 truncate">{table.name}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {table.description || 'Aucune description'}
          </p>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {table.isTemplate && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Template
            </span>
          )}
          {table.isPublic && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Public
            </span>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Colonnes</span>
          <span className="font-medium">{table.config.columns.length}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Classe</span>
          <span className="font-medium">
            {table.classId 
              ? classes.find(c => c.id === table.classId)?.name || 'Inconnue'
              : 'Aucune'
            }
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Modifié</span>
          <span className="font-medium">
            {new Date(table.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>

      {/* Tags */}
      {table.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {table.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))}
          {table.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{table.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleEditTable(table.id)}
          className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
        >
          <PencilIcon className="h-3 w-3 mr-1" />
          Modifier
        </button>
        
        <button
          onClick={() => handleDuplicateTable(table)}
          className="flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
        >
          <DocumentDuplicateIcon className="h-3 w-3 mr-1" />
          Dupliquer
        </button>
        
        <button
          onClick={() => handleExportTable(table)}
          className="flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
        >
          <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
          Export
        </button>
        
        <button
          onClick={() => handleDeleteTable(table)}
          className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors"
        >
          <TrashIcon className="h-3 w-3 mr-1" />
          Supprimer
        </button>
      </div>
    </div>
  );

  const renderExportModal = () => {
    if (!showExportModal || !exportingTable) return null;

    const [exportOptions, setExportOptions] = useState<TableExportOptions>({
      format: 'excel',
      includeHeaders: true,
      includeFormatting: true,
      includeFormulas: false,
      pageOrientation: 'portrait',
      paperSize: 'A4'
    });

    const handleExport = async () => {
      try {
        const result = await exportTable(exportingTable.id, exportOptions);
        
        if (result.downloadUrl) {
          // Créer un lien de téléchargement
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        
        toast.success('Export généré avec succès');
        setShowExportModal(false);
      } catch (error) {
        toast.error('Erreur lors de l\'export');
        console.error('Erreur export:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Exporter "{exportingTable.name}"
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    format: e.target.value as any 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="html">HTML (.html)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeHeaders}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeHeaders: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inclure les en-têtes</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFormatting}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeFormatting: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Conserver la mise en forme</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFormulas}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      includeFormulas: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inclure les formules</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  if (currentView === 'designer') {
    return (
      <TableDesigner
        tableId={editingTableId}
        mode={editingTableId ? 'edit' : 'create'}
        onSave={handleSaveTable}
        onCancel={() => setCurrentView('list')}
      />
    );
  }

  if (currentView === 'templates') {
    return (
      <TemplateGallery
        onSelectTemplate={(config) => {
          // Créer un nouveau tableau avec la config du template
          setCurrentView('designer');
        }}
        onClose={() => setCurrentView('list')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableaux Personnalisés</h1>
              <p className="text-gray-600 mt-1">
                Créez et gérez vos tableaux de données personnalisés
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentView('templates')}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Squares2X2Icon className="h-4 w-4 mr-2" />
                Templates
              </button>
              
              <button
                onClick={handleCreateTable}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau tableau
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              {/* Filtres */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Filtres</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classe
                    </label>
                    <select
                      value={selectedClassId || ''}
                      onChange={(e) => setSelectedClassId(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Toutes les classes</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.level})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Catégories */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Catégories</h3>
                <nav className="space-y-1">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <span>{category.label}</span>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre de recherche */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un tableau..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Liste des tableaux */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTables.map(renderTableCard)}
              </div>
            ) : (
              <div className="text-center py-12">
                <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun tableau trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Commencez par créer votre premier tableau personnalisé'
                  }
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreateTable}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer un tableau
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'export */}
      {renderExportModal()}
    </div>
  );
};
