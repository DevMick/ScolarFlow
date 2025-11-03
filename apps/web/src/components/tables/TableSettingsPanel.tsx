// ========================================
// TABLE SETTINGS PANEL - PANNEAU PARAMÈTRES TABLEAU
// ========================================

import React, { useState } from 'react';
import { 
  XMarkIcon,
  PaintBrushIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  CustomTableConfig, 
  TextAlignment,
  DEFAULT_TABLE_STYLING 
} from '@edustats/shared/types';
import { cn } from '../../utils/classNames';

/**
 * Props du composant TableSettingsPanel
 */
interface TableSettingsPanelProps {
  /** Configuration du tableau */
  config: CustomTableConfig;
  /** Callback de mise à jour */
  onUpdate: (updates: Partial<CustomTableConfig>) => void;
  /** Callback de fermeture */
  onClose: () => void;
}

/**
 * Panneau de configuration des paramètres globaux du tableau
 */
export const TableSettingsPanel: React.FC<TableSettingsPanelProps> = ({
  config,
  onUpdate,
  onClose
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [activeTab, setActiveTab] = useState<'styling' | 'behavior' | 'export'>('styling');

  // ========================================
  // MISE À JOUR DES PROPRIÉTÉS
  // ========================================

  const updateStyling = (path: string, value: any) => {
    const pathParts = path.split('.');
    const newStyling = { ...config.styling };
    
    let current: any = newStyling;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    onUpdate({ styling: newStyling });
  };

  const updateFilters = (updates: any) => {
    onUpdate({ 
      filters: { 
        ...config.filters, 
        ...updates 
      } 
    });
  };

  const updateSorting = (updates: any) => {
    onUpdate({ 
      sorting: { 
        ...config.sorting, 
        ...updates 
      } 
    });
  };

  // ========================================
  // ONGLETS
  // ========================================

  const tabs = [
    { id: 'styling', label: 'Style', icon: PaintBrushIcon },
    { id: 'behavior', label: 'Comportement', icon: AdjustmentsHorizontalIcon },
    { id: 'export', label: 'Export', icon: EyeIcon }
  ];

  // ========================================
  // RENDU ONGLET STYLE
  // ========================================

  const renderStylingTab = () => (
    <div className="space-y-6">
      {/* Style des en-têtes */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">En-têtes</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur de fond
              </label>
              <input
                type="color"
                value={config.styling.headerStyle?.backgroundColor || DEFAULT_TABLE_STYLING.headerStyle?.backgroundColor}
                onChange={(e) => updateStyling('headerStyle.backgroundColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur du texte
              </label>
              <input
                type="color"
                value={config.styling.headerStyle?.textColor || DEFAULT_TABLE_STYLING.headerStyle?.textColor}
                onChange={(e) => updateStyling('headerStyle.textColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Poids de police
              </label>
              <select
                value={config.styling.headerStyle?.fontWeight || 'bold'}
                onChange={(e) => updateStyling('headerStyle.fontWeight', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="normal">Normal</option>
                <option value="bold">Gras</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Taille de police
              </label>
              <input
                type="number"
                value={config.styling.headerStyle?.fontSize || 14}
                onChange={(e) => updateStyling('headerStyle.fontSize', parseInt(e.target.value))}
                min="8"
                max="24"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Alignement
            </label>
            <select
              value={config.styling.headerStyle?.textAlign || TextAlignment.Center}
              onChange={(e) => updateStyling('headerStyle.textAlign', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={TextAlignment.Left}>Gauche</option>
              <option value={TextAlignment.Center}>Centre</option>
              <option value={TextAlignment.Right}>Droite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Style du corps */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Corps du tableau</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Taille de police
              </label>
              <input
                type="number"
                value={config.styling.bodyStyle?.fontSize || 14}
                onChange={(e) => updateStyling('bodyStyle.fontSize', parseInt(e.target.value))}
                min="8"
                max="24"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Espacement
              </label>
              <input
                type="number"
                value={config.styling.padding || 8}
                onChange={(e) => updateStyling('padding', parseInt(e.target.value))}
                min="0"
                max="20"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Police
            </label>
            <select
              value={config.styling.bodyStyle?.fontFamily || 'inherit'}
              onChange={(e) => updateStyling('bodyStyle.fontFamily', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="inherit">Par défaut</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="'Courier New', monospace">Courier New</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lignes alternées */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Lignes alternées</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.styling.alternateRowColors || false}
              onChange={(e) => updateStyling('alternateRowColors', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Activer les lignes alternées</span>
          </label>

          {config.styling.alternateRowColors && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur des lignes alternées
              </label>
              <input
                type="color"
                value={config.styling.alternateRowColor || '#f9fafb'}
                onChange={(e) => updateStyling('alternateRowColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Bordures */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Bordures</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.styling.showBorders || false}
              onChange={(e) => updateStyling('showBorders', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Afficher les bordures</span>
          </label>

          {config.styling.showBorders && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <input
                  type="color"
                  value={config.styling.borderColor || '#d1d5db'}
                  onChange={(e) => updateStyling('borderColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Épaisseur
                </label>
                <input
                  type="number"
                  value={config.styling.borderWidth || 1}
                  onChange={(e) => updateStyling('borderWidth', parseInt(e.target.value))}
                  min="0"
                  max="5"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.styling.showGridLines || false}
              onChange={(e) => updateStyling('showGridLines', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Afficher les lignes de grille</span>
          </label>

          {config.styling.showGridLines && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Couleur des lignes
              </label>
              <input
                type="color"
                value={config.styling.gridLineColor || '#e5e7eb'}
                onChange={(e) => updateStyling('gridLineColor', e.target.value)}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDU ONGLET COMPORTEMENT
  // ========================================

  const renderBehaviorTab = () => (
    <div className="space-y-6">
      {/* Tri */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Tri</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.sorting.enabled}
              onChange={(e) => updateSorting({ enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Activer le tri</span>
          </label>

          {config.sorting.enabled && (
            <>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.sorting.multiSort || false}
                  onChange={(e) => updateSorting({ multiSort: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Tri multi-colonnes</span>
              </label>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tri par défaut
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={config.sorting.defaultSort?.columnId || ''}
                    onChange={(e) => updateSorting({ 
                      defaultSort: e.target.value ? {
                        columnId: e.target.value,
                        direction: config.sorting.defaultSort?.direction || 'asc'
                      } : undefined
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Aucun</option>
                    {config.columns.map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                  <select
                    value={config.sorting.defaultSort?.direction || 'asc'}
                    onChange={(e) => updateSorting({ 
                      defaultSort: config.sorting.defaultSort ? {
                        ...config.sorting.defaultSort,
                        direction: e.target.value as 'asc' | 'desc'
                      } : undefined
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    disabled={!config.sorting.defaultSort?.columnId}
                  >
                    <option value="asc">Croissant</option>
                    <option value="desc">Décroissant</option>
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Filtres</h4>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.filters.enabled}
              onChange={(e) => updateFilters({ enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Activer les filtres</span>
          </label>

          {config.filters.enabled && (
            <div className="text-sm text-gray-600">
              <p>Les filtres seront disponibles sur chaque colonne marquée comme "filtrable".</p>
            </div>
          )}
        </div>
      </div>

      {/* Configuration des lignes */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Lignes</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Grouper par
            </label>
            <select
              value={config.rows.groupBy || ''}
              onChange={(e) => onUpdate({ 
                rows: { 
                  ...config.rows, 
                  groupBy: e.target.value || undefined 
                } 
              })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="">Aucun groupement</option>
              {config.columns
                .filter(col => col.type === 'student_info')
                .map(col => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))
              }
            </select>
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.rows.showTotals || false}
              onChange={(e) => onUpdate({ 
                rows: { 
                  ...config.rows, 
                  showTotals: e.target.checked 
                } 
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Afficher les totaux</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.rows.showAverages || false}
              onChange={(e) => onUpdate({ 
                rows: { 
                  ...config.rows, 
                  showAverages: e.target.checked 
                } 
              })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Afficher les moyennes</span>
          </label>
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDU ONGLET EXPORT
  // ========================================

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">Options d'export</h4>
        <p className="mb-4">
          Configurez les paramètres par défaut pour l'export de ce tableau.
        </p>
        
        <div className="space-y-3">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Colonnes exportables</h5>
            <div className="space-y-1">
              {config.columns.map(column => (
                <label key={column.id} className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={column.exportable}
                    onChange={(e) => {
                      const updatedColumns = config.columns.map(col =>
                        col.id === column.id 
                          ? { ...col, exportable: e.target.checked }
                          : col
                      );
                      onUpdate({ columns: updatedColumns });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              💡 Les paramètres d'export détaillés (format, mise en page, etc.) 
              seront configurables lors de chaque export.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Paramètres du tableau
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
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
                'flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="h-4 w-4 mr-1" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'styling' && renderStylingTab()}
        {activeTab === 'behavior' && renderBehaviorTab()}
        {activeTab === 'export' && renderExportTab()}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            // Réinitialiser aux valeurs par défaut
            onUpdate({
              styling: DEFAULT_TABLE_STYLING,
              filters: { enabled: true, filters: [] },
              sorting: { enabled: true, multiSort: false }
            });
          }}
          className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Réinitialiser aux valeurs par défaut
        </button>
      </div>
    </div>
  );
};
