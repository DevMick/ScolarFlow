// ========================================
// VIRTUALIZED LIST - LISTE VIRTUALISÉE HAUTE PERFORMANCE
// ========================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '../../utils/classNames';

/**
 * Interface pour les éléments de la liste
 */
interface VirtualizedItem {
  id: string | number;
  height?: number;
  data: any;
}

/**
 * Props du composant VirtualizedList
 */
interface VirtualizedListProps<T extends VirtualizedItem> {
  /** Éléments à afficher */
  items: T[];
  /** Hauteur de l'élément par défaut */
  itemHeight: number;
  /** Hauteur du conteneur */
  height: number;
  /** Largeur du conteneur */
  width?: number;
  /** Nombre d'éléments à rendre en plus (buffer) */
  overscan?: number;
  /** Fonction de rendu d'un élément */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** Fonction de rendu du placeholder de chargement */
  renderLoading?: () => React.ReactNode;
  /** Fonction de rendu quand la liste est vide */
  renderEmpty?: () => React.ReactNode;
  /** Callback lors du scroll */
  onScroll?: (scrollTop: number, scrollLeft: number) => void;
  /** Callback lors de la sélection d'un élément */
  onItemSelect?: (item: T, index: number) => void;
  /** Éléments sélectionnés */
  selectedItems?: Set<string | number>;
  /** Activer la sélection multiple */
  multiSelect?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Style personnalisé */
  style?: React.CSSProperties;
  /** Activer le mode de débogage */
  debug?: boolean;
}

/**
 * Hook pour calculer les éléments visibles
 */
const useVisibleRange = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number = 5
) => {
  return useMemo(() => {
    if (itemCount === 0) {
      return { start: 0, end: 0, visibleStart: 0, visibleEnd: 0 };
    }

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );

    const start = Math.max(0, visibleStart - overscan);
    const end = Math.min(itemCount - 1, visibleEnd + overscan);

    return { start, end, visibleStart, visibleEnd };
  }, [itemCount, itemHeight, containerHeight, scrollTop, overscan]);
};

/**
 * Composant de liste virtualisée haute performance
 */
export const VirtualizedList = <T extends VirtualizedItem>({
  items,
  itemHeight,
  height,
  width = '100%',
  overscan = 5,
  renderItem,
  renderLoading,
  renderEmpty,
  onScroll,
  onItemSelect,
  selectedItems = new Set(),
  multiSelect = false,
  className,
  style,
  debug = false
}: VirtualizedListProps<T>) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // ========================================
  // CALCULS DÉRIVÉS
  // ========================================

  const itemCount = items.length;
  const totalHeight = itemCount * itemHeight;
  const { start, end, visibleStart, visibleEnd } = useVisibleRange(
    itemCount,
    itemHeight,
    height,
    scrollTop,
    overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(start, end + 1).map((item, index) => ({
      ...item,
      originalIndex: start + index
    }));
  }, [items, start, end]);

  // ========================================
  // GESTION DU SCROLL
  // ========================================

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop: newScrollTop, scrollLeft: newScrollLeft } = event.currentTarget;
    
    setScrollTop(newScrollTop);
    setScrollLeft(newScrollLeft);
    setIsScrolling(true);

    // Callback externe
    onScroll?.(newScrollTop, newScrollLeft);

    // Arrêter l'indicateur de scroll après un délai
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // ========================================
  // GESTION DE LA SÉLECTION
  // ========================================

  const handleItemClick = useCallback((item: T, index: number, event: React.MouseEvent) => {
    if (onItemSelect) {
      onItemSelect(item, index);
    }
  }, [onItemSelect]);

  const handleItemKeyDown = useCallback((item: T, index: number, event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onItemSelect) {
        onItemSelect(item, index);
      }
    }
  }, [onItemSelect]);

  // ========================================
  // MÉTHODES PUBLIQUES
  // ========================================

  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let targetScrollTop: number;

    switch (align) {
      case 'start':
        targetScrollTop = index * itemHeight;
        break;
      case 'center':
        targetScrollTop = index * itemHeight - (height - itemHeight) / 2;
        break;
      case 'end':
        targetScrollTop = index * itemHeight - height + itemHeight;
        break;
    }

    targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - height));
    container.scrollTop = targetScrollTop;
  }, [itemHeight, height, totalHeight]);

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight - height;
    }
  }, [totalHeight, height]);

  // ========================================
  // EFFETS
  // ========================================

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RENDU
  // ========================================

  // Liste vide
  if (itemCount === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height, width, ...style }}
      >
        {renderEmpty ? renderEmpty() : (
          <div className="text-gray-500 text-center">
            <div className="text-4xl mb-2">📋</div>
            <div>Aucun élément à afficher</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-auto',
        isScrolling && 'pointer-events-none',
        className
      )}
      style={{ height, width, ...style }}
      onScroll={handleScroll}
      role="listbox"
      aria-label="Liste virtualisée"
    >
      {/* Conteneur total pour maintenir la hauteur de scroll */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Éléments visibles */}
        {visibleItems.map((item, index) => {
          const originalIndex = item.originalIndex;
          const itemTop = originalIndex * itemHeight;
          const isSelected = selectedItems.has(item.id);
          
          const itemStyle: React.CSSProperties = {
            position: 'absolute',
            top: itemTop,
            left: 0,
            right: 0,
            height: item.height || itemHeight,
            zIndex: isSelected ? 2 : 1
          };

          return (
            <div
              key={item.id}
              style={itemStyle}
              className={cn(
                'transition-colors duration-150',
                isSelected && 'bg-blue-50 border-l-4 border-blue-500',
                onItemSelect && 'cursor-pointer hover:bg-gray-50'
              )}
              onClick={(e) => handleItemClick(item, originalIndex, e)}
              onKeyDown={(e) => handleItemKeyDown(item, originalIndex, e)}
              tabIndex={onItemSelect ? 0 : -1}
              role="option"
              aria-selected={isSelected}
            >
              {renderItem(item, originalIndex, itemStyle)}
            </div>
          );
        })}

        {/* Indicateur de scroll (mode debug) */}
        {debug && (
          <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
            <div>Items: {itemCount}</div>
            <div>Visible: {visibleStart}-{visibleEnd}</div>
            <div>Rendered: {start}-{end}</div>
            <div>Scroll: {scrollTop}px</div>
            <div>Scrolling: {isScrolling ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Indicateur de scroll */}
        {isScrolling && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs z-10">
            {Math.round((scrollTop / (totalHeight - height)) * 100)}%
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPOSANTS UTILITAIRES
// ========================================

/**
 * Hook pour gérer la sélection dans une liste virtualisée
 */
export const useVirtualizedSelection = <T extends VirtualizedItem>(
  items: T[],
  multiSelect: boolean = false
) => {
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());

  const selectItem = useCallback((item: T) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (multiSelect) {
        if (newSelection.has(item.id)) {
          newSelection.delete(item.id);
        } else {
          newSelection.add(item.id);
        }
      } else {
        newSelection.clear();
        newSelection.add(item.id);
      }
      return newSelection;
    });
  }, [multiSelect]);

  const selectAll = useCallback(() => {
    if (multiSelect) {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  }, [items, multiSelect]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  return {
    selectedItems,
    selectItem,
    selectAll,
    clearSelection,
    getSelectedItems,
    selectedCount: selectedItems.size
  };
};

/**
 * Composant de liste virtualisée avec recherche intégrée
 */
interface VirtualizedSearchListProps<T extends VirtualizedItem> extends Omit<VirtualizedListProps<T>, 'items'> {
  /** Tous les éléments */
  allItems: T[];
  /** Fonction de recherche */
  searchFunction: (items: T[], query: string) => T[];
  /** Placeholder pour la recherche */
  searchPlaceholder?: string;
  /** Valeur de recherche initiale */
  initialSearchQuery?: string;
}

export const VirtualizedSearchList = <T extends VirtualizedItem>({
  allItems,
  searchFunction,
  searchPlaceholder = "Rechercher...",
  initialSearchQuery = "",
  ...listProps
}: VirtualizedSearchListProps<T>) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isSearching, setIsSearching] = useState(false);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return allItems;
    }
    
    setIsSearching(true);
    const results = searchFunction(allItems, searchQuery);
    setIsSearching(false);
    return results;
  }, [allItems, searchQuery, searchFunction]);

  return (
    <div className="flex flex-col h-full">
      {/* Barre de recherche */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Statistiques de recherche */}
        {searchQuery && (
          <div className="mt-2 text-sm text-gray-600">
            {filteredItems.length} résultat(s) trouvé(s) sur {allItems.length}
          </div>
        )}
      </div>

      {/* Liste virtualisée */}
      <div className="flex-1">
        <VirtualizedList
          {...listProps}
          items={filteredItems}
          height={listProps.height - 80} // Ajuster pour la barre de recherche
        />
      </div>
    </div>
  );
};

export default VirtualizedList;
