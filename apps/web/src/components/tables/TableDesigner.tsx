// ========================================
// TABLE DESIGNER - INTERFACE PRINCIPALE CONCEPTION TABLEAUX
// ========================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  Cog6ToothIcon,
  SaveIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { 
  CustomTable, 
  CustomTableConfig, 
  TableColumn, 
  TableData,
  ColumnType,
  TableCategory,
  DEFAULT_TABLE_CONFIG,
  DEFAULT_COLUMN_CONFIG
} from '@edustats/shared/types';
import { useCustomTables } from '../../hooks/useCustomTables';
import { useClasses } from '../../hooks/useClasses';
import { cn } from '../../utils/classNames';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

// Composants enfants
import { ColumnEditor } from './ColumnEditor';
import { TablePreview } from './TablePreview';
import { SortableColumnItem } from './SortableColumnItem';
import { TableSettingsPanel } from './TableSettingsPanel';

/**
 * Props du composant TableDesigner
 */
interface TableDesignerProps {
  /** ID du tableau à éditer (undefined pour création) */
  tableId?: string;
  /** Classe sélectionnée par défaut */
  defaultClassId?: number;
  /** Callback lors de la sauvegarde */
  onSave?: (table: CustomTable) => void;
  /** Callback lors de l'annulation */
  onCancel?: () => void;
  /** Mode d'affichage */
  mode?: 'create' | 'edit' | 'view';
}

/**
 * Interface principale de conception de tableaux personnalisés
 */
export const TableDesigner: React.FC<TableDesignerProps> = ({
  tableId,
  defaultClassId,
  onSave,
  onCancel,
  mode = 'create'
}) => {
  // ========================================
  // HOOKS ET ÉTAT
  // ========================================

  const { 
    createTable, 
    updateTable, 
    getTableById, 
    generateTableData,
    loading: tableLoading 
  } = useCustomTables();
  
  const { classes } = useClasses();

  // État principal
  const [table, setTable] = useState<Partial<CustomTable>>({
    name: '',
    description: '',
    category: TableCategory.Custom,
    classId: defaultClassId,
    config: DEFAULT_TABLE_CONFIG,
    isTemplate: false,
    isPublic: false,
    tags: []
  });

  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<TableData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Capteurs pour le drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ========================================
  // CHARGEMENT INITIAL
  // ========================================

  useEffect(() => {
    if (tableId && mode !== 'create') {
      loadTable();
    }
  }, [tableId, mode]);

  const loadTable = async () => {
    try {
      const loadedTable = await getTableById(tableId!);
      setTable(loadedTable);
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error('Erreur lors du chargement du tableau');
      console.error('Erreur chargement tableau:', error);
    }
  };

  // ========================================
  // GÉNÉRATION PREVIEW TEMPS RÉEL
  // ========================================

  const generatePreview = useCallback(
    debounce(async () => {
      if (!table.config?.columns.length || !table.classId || mode === 'view') {
        setPreviewData(null);
        return;
      }

      try {
        setPreviewLoading(true);
        
        // Si on édite un tableau existant, utiliser l'API
        if (tableId) {
          const data = await generateTableData(tableId);
          setPreviewData(data);
        } else {
          // Pour un nouveau tableau, générer un aperçu simulé
          setPreviewData(generateMockPreview());
        }
      } catch (error) {
        console.error('Erreur génération preview:', error);
        setPreviewData(generateMockPreview());
      } finally {
        setPreviewLoading(false);
      }
    }, 1000),
    [table.config, table.classId, tableId, mode]
  );

  useEffect(() => {
    generatePreview();
  }, [generatePreview]);

  // ========================================
  // GESTION DES COLONNES
  // ========================================

  const addColumn = (type: ColumnType) => {
    const newColumn: TableColumn = {
      id: `col_${Date.now()}`,
      label: 'Nouvelle Colonne',
      type,
      ...DEFAULT_COLUMN_CONFIG,
      formatting: {
        ...DEFAULT_COLUMN_CONFIG.formatting!,
        alignment: type === ColumnType.EvaluationScore ? 'center' : 'left'
      }
    };

    const updatedConfig = {
      ...table.config!,
      columns: [...table.config!.columns, newColumn]
    };

    setTable(prev => ({ ...prev, config: updatedConfig }));
    setSelectedColumnId(newColumn.id);
    setHasUnsavedChanges(true);
  };

  const updateColumn = (columnId: string, updates: Partial<TableColumn>) => {
    const updatedConfig = {
      ...table.config!,
      columns: table.config!.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      )
    };

    setTable(prev => ({ ...prev, config: updatedConfig }));
    setHasUnsavedChanges(true);
  };

  const deleteColumn = (columnId: string) => {
    const updatedConfig = {
      ...table.config!,
      columns: table.config!.columns.filter(col => col.id !== columnId)
    };

    setTable(prev => ({ ...prev, config: updatedConfig }));
    
    if (selectedColumnId === columnId) {
      setSelectedColumnId(null);
    }
    
    setHasUnsavedChanges(true);
  };

  const duplicateColumn = (columnId: string) => {
    const originalColumn = table.config!.columns.find(col => col.id === columnId);
    if (!originalColumn) return;

    const duplicatedColumn: TableColumn = {
      ...originalColumn,
      id: `col_${Date.now()}`,
      label: `${originalColumn.label} (Copie)`
    };

    const originalIndex = table.config!.columns.findIndex(col => col.id === columnId);
    const newColumns = [...table.config!.columns];
    newColumns.splice(originalIndex + 1, 0, duplicatedColumn);

    const updatedConfig = {
      ...table.config!,
      columns: newColumns
    };

    setTable(prev => ({ ...prev, config: updatedConfig }));
    setSelectedColumnId(duplicatedColumn.id);
    setHasUnsavedChanges(true);
  };

  // ========================================
  // DRAG & DROP
  // ========================================

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = table.config!.columns.findIndex(col => col.id === active.id);
      const newIndex = table.config!.columns.findIndex(col => col.id === over.id);

      const newColumns = arrayMove(table.config!.columns, oldIndex, newIndex);
      
      const updatedConfig = {
        ...table.config!,
        columns: newColumns
      };

      setTable(prev => ({ ...prev, config: updatedConfig }));
      setHasUnsavedChanges(true);
    }
  };

  // ========================================
  // SAUVEGARDE
  // ========================================

  const handleSave = async () => {
    try {
      if (!table.name?.trim()) {
        toast.error('Le nom du tableau est requis');
        return;
      }

      if (!table.config?.columns.length) {
        toast.error('Le tableau doit avoir au moins une colonne');
        return;
      }

      let savedTable: CustomTable;

      if (tableId && mode === 'edit') {
        savedTable = await updateTable(tableId, {
          name: table.name,
          description: table.description,
          category: table.category,
          config: table.config,
          isTemplate: table.isTemplate,
          isPublic: table.isPublic,
          tags: table.tags
        });
      } else {
        savedTable = await createTable({
          name: table.name!,
          description: table.description,
          category: table.category!,
          classId: table.classId,
          config: table.config!,
          isTemplate: table.isTemplate,
          isPublic: table.isPublic,
          tags: table.tags
        });
      }

      setHasUnsavedChanges(false);
      toast.success(mode === 'edit' ? 'Tableau mis à jour' : 'Tableau créé');
      onSave?.(savedTable);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error('Erreur sauvegarde:', error);
    }
  };

  // ========================================
  // PREVIEW SIMULÉ
  // ========================================

  const generateMockPreview = (): TableData => {
    const headers = table.config!.columns.map(col => col.label);
    const mockRows = [
      {
        studentId: 1,
        cells: table.config!.columns.map(col => ({
          value: getMockCellValue(col),
          formattedValue: getMockFormattedValue(col),
          style: {}
        }))
      },
      {
        studentId: 2,
        cells: table.config!.columns.map(col => ({
          value: getMockCellValue(col),
          formattedValue: getMockFormattedValue(col),
          style: {}
        }))
      }
    ];

    return {
      headers,
      rows: mockRows,
      summary: {
        totalRows: 2,
        calculatedAt: new Date(),
        hasErrors: false
      }
    };
  };

  const getMockCellValue = (column: TableColumn): any => {
    switch (column.type) {
      case ColumnType.StudentInfo:
        return column.source?.field === 'firstName' ? 'Marie' : 'Dupont';
      case ColumnType.EvaluationScore:
        return Math.floor(Math.random() * 20) + 1;
      case ColumnType.Static:
        return column.source?.staticValue || 'Valeur';
      case ColumnType.Calculated:
      case ColumnType.Formula:
        return Math.floor(Math.random() * 20) + 1;
      default:
        return 'Exemple';
    }
  };

  const getMockFormattedValue = (column: TableColumn): string => {
    const value = getMockCellValue(column);
    if (typeof value === 'number' && column.formatting.numberFormat) {
      switch (column.formatting.numberFormat) {
        case '0.00': return value.toFixed(2);
        case '0%': return Math.round(value * 5) + '%';
        default: return value.toString();
      }
    }
    return String(value);
  };

  // ========================================
  // COLONNES DISPONIBLES
  // ========================================

  const availableColumnTypes = useMemo(() => [
    {
      type: ColumnType.StudentInfo,
      label: 'Info Élève',
      description: 'Nom, prénom, âge, etc.',
      icon: '👤',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      type: ColumnType.EvaluationScore,
      label: 'Note Évaluation',
      description: 'Note d\'une évaluation spécifique',
      icon: '📝',
      color: 'bg-green-100 text-green-800'
    },
    {
      type: ColumnType.Calculated,
      label: 'Colonne Calculée',
      description: 'Moyenne, rang, mention, etc.',
      icon: '🧮',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      type: ColumnType.Formula,
      label: 'Formule Personnalisée',
      description: 'Formule avec expressions',
      icon: '⚡',
      color: 'bg-orange-100 text-orange-800'
    },
    {
      type: ColumnType.Static,
      label: 'Valeur Fixe',
      description: 'Texte ou valeur constante',
      icon: '📌',
      color: 'bg-gray-100 text-gray-800'
    }
  ], []);

  // ========================================
  // RENDU
  // ========================================

  return (
    <div className="h-full flex bg-gray-50">
      {/* Panel de configuration */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Nouveau Tableau' : 'Modifier Tableau'}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  showSettings 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
              >
                <Cog6ToothIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Informations de base */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du tableau
              </label>
              <input
                type="text"
                value={table.name || ''}
                onChange={(e) => {
                  setTable(prev => ({ ...prev, name: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Mon tableau personnalisé"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={table.description || ''}
                onChange={(e) => {
                  setTable(prev => ({ ...prev, description: e.target.value }));
                  setHasUnsavedChanges(true);
                }}
                placeholder="Description optionnelle..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={mode === 'view'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Classe
              </label>
              <select
                value={table.classId || ''}
                onChange={(e) => {
                  setTable(prev => ({ ...prev, classId: parseInt(e.target.value) || undefined }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={mode === 'view'}
              >
                <option value="">Sélectionner une classe</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Colonnes */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Colonnes ({table.config?.columns.length || 0})
              </h3>
              {mode !== 'view' && (
                <div className="relative group">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Menu déroulant des types de colonnes */}
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <div className="p-2">
                      {availableColumnTypes.map(columnType => (
                        <button
                          key={columnType.type}
                          onClick={() => addColumn(columnType.type)}
                          className="w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{columnType.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900">
                                {columnType.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {columnType.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des colonnes avec drag & drop */}
            {table.config?.columns.length ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={table.config.columns.map(col => col.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {table.config.columns.map((column, index) => (
                      <SortableColumnItem
                        key={column.id}
                        column={column}
                        index={index}
                        isSelected={selectedColumnId === column.id}
                        onSelect={() => setSelectedColumnId(column.id)}
                        onDelete={() => deleteColumn(column.id)}
                        onDuplicate={() => duplicateColumn(column.id)}
                        disabled={mode === 'view'}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Aucune colonne</p>
                <p className="text-sm">Ajoutez des colonnes pour commencer</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={tableLoading || mode === 'view' || !hasUnsavedChanges}
              className={cn(
                'flex-1 flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors',
                hasUnsavedChanges && mode !== 'view'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {tableLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
          
          {hasUnsavedChanges && (
            <p className="text-xs text-orange-600 mt-2">
              ⚠️ Modifications non sauvegardées
            </p>
          )}
        </div>
      </div>

      {/* Éditeur de colonne */}
      {selectedColumnId && (
        <div className="w-80 bg-white border-r border-gray-200">
          <ColumnEditor
            column={table.config!.columns.find(col => col.id === selectedColumnId)!}
            onUpdate={(updates) => updateColumn(selectedColumnId, updates)}
            onClose={() => setSelectedColumnId(null)}
            disabled={mode === 'view'}
          />
        </div>
      )}

      {/* Preview du tableau */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Aperçu du tableau
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-500">
                <EyeIcon className="h-4 w-4 mr-1" />
                Aperçu temps réel
              </div>
              {previewLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {previewData ? (
            <TablePreview 
              data={previewData} 
              config={table.config!}
              loading={previewLoading}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">Aperçu du tableau</h3>
                <p>Configurez vos colonnes et sélectionnez une classe</p>
                <p className="text-sm">pour voir l'aperçu des données</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel des paramètres */}
      {showSettings && (
        <TableSettingsPanel
          config={table.config!}
          onUpdate={(updates) => {
            setTable(prev => ({ 
              ...prev, 
              config: { ...prev.config!, ...updates } 
            }));
            setHasUnsavedChanges(true);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
