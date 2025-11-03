// ========================================
// SORTABLE COLUMN ITEM - ÉLÉMENT COLONNE TRIABLE
// ========================================

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Bars3Icon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { TableColumn, ColumnType } from '@edustats/shared/types';
import { cn } from '../../utils/classNames';

/**
 * Props du composant SortableColumnItem
 */
interface SortableColumnItemProps {
  /** Colonne à afficher */
  column: TableColumn;
  /** Index de la colonne */
  index: number;
  /** Colonne sélectionnée */
  isSelected: boolean;
  /** Callback de sélection */
  onSelect: () => void;
  /** Callback de suppression */
  onDelete: () => void;
  /** Callback de duplication */
  onDuplicate: () => void;
  /** Mode désactivé */
  disabled?: boolean;
}

/**
 * Élément de colonne avec drag & drop et actions
 */
export const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  index,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  disabled = false
}) => {
  // ========================================
  // DRAG & DROP
  // ========================================

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: column.id,
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // ========================================
  // CONFIGURATION DES TYPES
  // ========================================

  const getColumnTypeConfig = (type: ColumnType) => {
    switch (type) {
      case ColumnType.StudentInfo:
        return {
          icon: '👤',
          label: 'Info Élève',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case ColumnType.EvaluationScore:
        return {
          icon: '📝',
          label: 'Note',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case ColumnType.Calculated:
        return {
          icon: '🧮',
          label: 'Calculée',
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case ColumnType.Formula:
        return {
          icon: '⚡',
          label: 'Formule',
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case ColumnType.Static:
        return {
          icon: '📌',
          label: 'Fixe',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          icon: '❓',
          label: 'Inconnu',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const typeConfig = getColumnTypeConfig(column.type);

  // ========================================
  // INFORMATIONS DE CONFIGURATION
  // ========================================

  const getConfigurationInfo = () => {
    switch (column.type) {
      case ColumnType.StudentInfo:
        return column.source?.field || 'Non configuré';
      case ColumnType.EvaluationScore:
        return column.source?.evaluationId ? `Éval #${column.source.evaluationId}` : 'Non configuré';
      case ColumnType.Static:
        return column.source?.staticValue || 'Non configuré';
      case ColumnType.Formula:
      case ColumnType.Calculated:
        return column.formula?.expression ? 
          (column.formula.expression.length > 30 ? 
            `${column.formula.expression.substring(0, 30)}...` : 
            column.formula.expression
          ) : 'Non configuré';
      default:
        return 'Configuration inconnue';
    }
  };

  // ========================================
  // VALIDATION DE LA COLONNE
  // ========================================

  const isColumnValid = () => {
    switch (column.type) {
      case ColumnType.StudentInfo:
        return !!column.source?.field;
      case ColumnType.EvaluationScore:
        return !!column.source?.evaluationId;
      case ColumnType.Static:
        return !!column.source?.staticValue;
      case ColumnType.Formula:
      case ColumnType.Calculated:
        return !!column.formula?.expression;
      default:
        return false;
    }
  };

  const isValid = isColumnValid();

  // ========================================
  // RENDU
  // ========================================

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white border rounded-lg transition-all duration-200',
        isSelected 
          ? 'border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm',
        !isValid && 'border-red-200 bg-red-50',
        isDragging && 'shadow-lg z-10'
      )}
    >
      {/* Contenu principal */}
      <div
        onClick={onSelect}
        className="p-3 cursor-pointer"
      >
        <div className="flex items-start space-x-3">
          {/* Handle de drag */}
          {!disabled && (
            <button
              {...attributes}
              {...listeners}
              className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          )}

          {/* Icône et type */}
          <div className="flex-shrink-0">
            <div className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
              typeConfig.color
            )}>
              <span className="mr-1">{typeConfig.icon}</span>
              {typeConfig.label}
            </div>
          </div>

          {/* Informations de la colonne */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={cn(
                'text-sm font-medium truncate',
                isValid ? 'text-gray-900' : 'text-red-700'
              )}>
                {column.label || 'Sans nom'}
              </h4>
              
              <div className="flex items-center space-x-1 ml-2">
                {/* Indicateurs d'état */}
                {!isValid && (
                  <span className="text-red-500" title="Configuration incomplète">
                    ⚠️
                  </span>
                )}
                
                {column.formula?.expression && (
                  <span className="text-blue-500" title="Contient une formule">
                    ⚡
                  </span>
                )}
                
                {!column.exportable && (
                  <EyeSlashIcon className="h-3 w-3 text-gray-400" title="Non exportable" />
                )}
              </div>
            </div>

            <p className={cn(
              'text-xs mt-1 truncate',
              isValid ? 'text-gray-500' : 'text-red-600'
            )}>
              {getConfigurationInfo()}
            </p>

            {/* Propriétés */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {column.formatting.width && (
                  <span className="bg-gray-100 px-1 rounded">
                    {column.formatting.width}px
                  </span>
                )}
                
                <span className="bg-gray-100 px-1 rounded">
                  {column.formatting.alignment}
                </span>
                
                {column.formatting.numberFormat && (
                  <span className="bg-gray-100 px-1 rounded">
                    {column.formatting.numberFormat}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (visibles au hover) */}
      {!disabled && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Dupliquer la colonne"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Supprimer la colonne"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Indicateur de position */}
      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
        <div className="bg-gray-300 text-gray-600 text-xs px-1 py-0.5 rounded font-mono">
          {index + 1}
        </div>
      </div>

      {/* Indicateur de formatage conditionnel */}
      {column.formatting.conditionalFormatting?.length > 0 && (
        <div className="absolute -right-1 -top-1">
          <div className="bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {column.formatting.conditionalFormatting.length}
          </div>
        </div>
      )}
    </div>
  );
};
