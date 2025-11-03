// ========================================
// TABLE PREVIEW - APERÇU DU TABLEAU
// ========================================

import React, { useMemo } from 'react';
import { 
  TableData, 
  CustomTableConfig,
  TextAlignment 
} from '@edustats/shared/types';
import { cn } from '../../utils/classNames';

/**
 * Props du composant TablePreview
 */
interface TablePreviewProps {
  /** Données du tableau */
  data: TableData;
  /** Configuration du tableau */
  config: CustomTableConfig;
  /** État de chargement */
  loading?: boolean;
}

/**
 * Composant d'aperçu du tableau avec données réelles
 */
export const TablePreview: React.FC<TablePreviewProps> = ({
  data,
  config,
  loading = false
}) => {
  // ========================================
  // STYLES CALCULÉS
  // ========================================

  const tableStyles = useMemo(() => {
    const { styling } = config;
    
    return {
      table: {
        borderCollapse: 'collapse' as const,
        width: '100%',
        fontSize: styling.bodyStyle?.fontSize ? `${styling.bodyStyle.fontSize}px` : '14px',
        fontFamily: styling.bodyStyle?.fontFamily || 'inherit'
      },
      header: {
        backgroundColor: styling.headerStyle?.backgroundColor || '#f3f4f6',
        color: styling.headerStyle?.textColor || '#1f2937',
        fontWeight: styling.headerStyle?.fontWeight || 'bold',
        fontSize: styling.headerStyle?.fontSize ? `${styling.headerStyle.fontSize}px` : '14px',
        textAlign: styling.headerStyle?.textAlign || TextAlignment.Center,
        padding: `${styling.padding || 8}px`,
        border: styling.showBorders ? `${styling.borderWidth || 1}px solid ${styling.borderColor || '#d1d5db'}` : 'none'
      },
      cell: {
        padding: `${styling.padding || 8}px`,
        border: styling.showBorders ? `${styling.borderWidth || 1}px solid ${styling.borderColor || '#d1d5db'}` : 'none',
        borderTop: styling.showGridLines ? `1px solid ${styling.gridLineColor || '#e5e7eb'}` : 'none'
      }
    };
  }, [config.styling]);

  // ========================================
  // FONCTION D'ALIGNEMENT
  // ========================================

  const getAlignmentClass = (alignment: TextAlignment) => {
    switch (alignment) {
      case TextAlignment.Left: return 'text-left';
      case TextAlignment.Center: return 'text-center';
      case TextAlignment.Right: return 'text-right';
      default: return 'text-left';
    }
  };

  // ========================================
  // RENDU CONDITIONNEL
  // ========================================

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-8 rounded mb-2"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 h-6 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data.rows.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium mb-2">Aucune donnée</h3>
        <p>Sélectionnez une classe avec des élèves</p>
        <p className="text-sm">pour voir l'aperçu des données</p>
      </div>
    );
  }

  // ========================================
  // RENDU PRINCIPAL
  // ========================================

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* En-tête d'information */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{data.rows.length}</span> élève{data.rows.length > 1 ? 's' : ''}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{data.headers.length}</span> colonne{data.headers.length > 1 ? 's' : ''}
            </div>
            {data.summary?.calculatedAt && (
              <div className="text-sm text-gray-500">
                Calculé le {data.summary.calculatedAt.toLocaleString('fr-FR')}
              </div>
            )}
          </div>
          
          {data.summary?.hasErrors && (
            <div className="flex items-center text-sm text-red-600">
              <span className="mr-1">⚠️</span>
              {data.summary.errors?.length || 0} erreur{(data.summary.errors?.length || 0) > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-auto max-h-96">
        <table style={tableStyles.table}>
          {/* En-têtes */}
          <thead>
            <tr>
              {data.headers.map((header, index) => {
                const column = config.columns[index];
                return (
                  <th
                    key={index}
                    style={{
                      ...tableStyles.header,
                      width: column?.formatting.width ? `${column.formatting.width}px` : 'auto',
                      textAlign: column?.formatting.alignment || TextAlignment.Center
                    }}
                    className={cn(
                      'sticky top-0 z-10',
                      getAlignmentClass(column?.formatting.alignment || TextAlignment.Center)
                    )}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Corps du tableau */}
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr
                key={row.studentId}
                className={cn(
                  config.styling.alternateRowColors && rowIndex % 2 === 1
                    ? 'bg-gray-50'
                    : 'bg-white',
                  'hover:bg-blue-50 transition-colors'
                )}
                style={{
                  backgroundColor: config.styling.alternateRowColors && rowIndex % 2 === 1
                    ? config.styling.alternateRowColor || '#f9fafb'
                    : 'white'
                }}
              >
                {row.cells.map((cell, cellIndex) => {
                  const column = config.columns[cellIndex];
                  
                  return (
                    <td
                      key={cellIndex}
                      style={{
                        ...tableStyles.cell,
                        ...cell.style,
                        textAlign: column?.formatting.alignment || TextAlignment.Left,
                        width: column?.formatting.width ? `${column.formatting.width}px` : 'auto'
                      }}
                      className={cn(
                        getAlignmentClass(column?.formatting.alignment || TextAlignment.Left),
                        cell.metadata?.error && 'bg-red-50 text-red-700',
                        cell.metadata?.isCalculated && 'font-medium'
                      )}
                      title={cell.metadata?.error || cell.metadata?.formula || undefined}
                    >
                      {cell.metadata?.error ? (
                        <span className="flex items-center">
                          <span className="mr-1">⚠️</span>
                          #ERREUR
                        </span>
                      ) : (
                        <span>
                          {cell.formattedValue}
                          {cell.metadata?.isCalculated && (
                            <span className="ml-1 text-xs text-blue-600" title="Valeur calculée">
                              ⚡
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé et erreurs */}
      {(data.summary?.errors?.length || data.summary?.warnings?.length) && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {data.summary.errors?.length > 0 && (
            <div className="mb-2">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Erreurs ({data.summary.errors.length})
              </h4>
              <div className="space-y-1">
                {data.summary.errors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs text-red-600">
                    • {error}
                  </p>
                ))}
                {data.summary.errors.length > 3 && (
                  <p className="text-xs text-red-500">
                    ... et {data.summary.errors.length - 3} autres erreurs
                  </p>
                )}
              </div>
            </div>
          )}

          {data.summary.warnings?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-orange-800 mb-1">
                Avertissements ({data.summary.warnings.length})
              </h4>
              <div className="space-y-1">
                {data.summary.warnings.slice(0, 2).map((warning, index) => (
                  <p key={index} className="text-xs text-orange-600">
                    • {warning}
                  </p>
                ))}
                {data.summary.warnings.length > 2 && (
                  <p className="text-xs text-orange-500">
                    ... et {data.summary.warnings.length - 2} autres avertissements
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistiques de performance */}
      {data.summary?.processingTime && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Temps de calcul: {data.summary.processingTime}ms</span>
            <span>
              {data.rows.length} ligne{data.rows.length > 1 ? 's' : ''} • {data.headers.length} colonne{data.headers.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
