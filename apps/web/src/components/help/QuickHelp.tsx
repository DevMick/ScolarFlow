// ========================================
// QUICK HELP - AIDE RAPIDE AVEC TOOLTIPS
// ========================================

import React, { useState, useRef, useEffect } from 'react';
import { 
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/classNames';

/**
 * Types d'aide rapide
 */
type QuickHelpType = 'info' | 'tip' | 'warning' | 'help';

/**
 * Position du tooltip
 */
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

/**
 * Props du composant QuickHelp
 */
interface QuickHelpProps {
  /** Contenu de l'aide */
  content: React.ReactNode;
  /** Type d'aide */
  type?: QuickHelpType;
  /** Position du tooltip */
  position?: TooltipPosition;
  /** Titre du tooltip */
  title?: string;
  /** Déclencheur (hover ou click) */
  trigger?: 'hover' | 'click';
  /** Délai d'affichage en ms */
  delay?: number;
  /** Largeur maximale du tooltip */
  maxWidth?: number;
  /** Afficher la flèche */
  showArrow?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
  /** Enfants (élément déclencheur) */
  children?: React.ReactNode;
}

/**
 * Props du composant Tooltip
 */
interface TooltipProps {
  /** Contenu du tooltip */
  content: React.ReactNode;
  /** Titre du tooltip */
  title?: string;
  /** Type d'aide */
  type?: QuickHelpType;
  /** Position */
  position: TooltipPosition;
  /** Largeur maximale */
  maxWidth: number;
  /** Afficher la flèche */
  showArrow: boolean;
  /** Visible */
  visible: boolean;
  /** Callback de fermeture */
  onClose?: () => void;
  /** Référence de l'élément parent */
  parentRef: React.RefObject<HTMLElement>;
}

/**
 * Composant Tooltip
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  title,
  type = 'info',
  position,
  maxWidth,
  showArrow,
  visible,
  onClose,
  parentRef
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [actualPosition, setActualPosition] = useState<Exclude<TooltipPosition, 'auto'>>(
    position === 'auto' ? 'top' : position
  );
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // ========================================
  // CALCUL DE POSITION
  // ========================================

  useEffect(() => {
    if (!visible || !parentRef.current || !tooltipRef.current) return;

    const parent = parentRef.current;
    const tooltip = tooltipRef.current;
    const parentRect = parent.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalPosition = position === 'auto' ? 'top' : position;
    let left = 0;
    let top = 0;

    // Calcul automatique de la position si 'auto'
    if (position === 'auto') {
      const spaceTop = parentRect.top;
      const spaceBottom = viewportHeight - parentRect.bottom;
      const spaceLeft = parentRect.left;
      const spaceRight = viewportWidth - parentRect.right;

      if (spaceTop >= tooltipRect.height + 10) {
        finalPosition = 'top';
      } else if (spaceBottom >= tooltipRect.height + 10) {
        finalPosition = 'bottom';
      } else if (spaceRight >= tooltipRect.width + 10) {
        finalPosition = 'right';
      } else if (spaceLeft >= tooltipRect.width + 10) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // Fallback
      }
    }

    // Calcul des coordonnées selon la position
    switch (finalPosition) {
      case 'top':
        left = parentRect.left + (parentRect.width - tooltipRect.width) / 2;
        top = parentRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        left = parentRect.left + (parentRect.width - tooltipRect.width) / 2;
        top = parentRect.bottom + 8;
        break;
      case 'left':
        left = parentRect.left - tooltipRect.width - 8;
        top = parentRect.top + (parentRect.height - tooltipRect.height) / 2;
        break;
      case 'right':
        left = parentRect.right + 8;
        top = parentRect.top + (parentRect.height - tooltipRect.height) / 2;
        break;
    }

    // Ajustements pour rester dans la viewport
    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setActualPosition(finalPosition);
    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      maxWidth: `${maxWidth}px`,
      zIndex: 9999
    });
  }, [visible, position, maxWidth, parentRef]);

  // ========================================
  // STYLES ET ICÔNES
  // ========================================

  const getTypeStyles = (type: QuickHelpType) => {
    switch (type) {
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          icon: <InformationCircleIcon className="h-4 w-4 text-blue-600" />
        };
      case 'tip':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          icon: <LightBulbIcon className="h-4 w-4 text-yellow-600" />
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-900',
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
        };
      case 'help':
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-900',
          icon: <QuestionMarkCircleIcon className="h-4 w-4 text-gray-600" />
        };
      default:
        return {
          bg: 'bg-white border-gray-200',
          text: 'text-gray-900',
          icon: <InformationCircleIcon className="h-4 w-4 text-gray-600" />
        };
    }
  };

  const getArrowClasses = (position: Exclude<TooltipPosition, 'auto'>) => {
    const baseClasses = 'absolute w-2 h-2 transform rotate-45';
    const typeStyles = getTypeStyles(type);
    
    switch (position) {
      case 'top':
        return `${baseClasses} ${typeStyles.bg.replace('bg-', 'bg-')} border-r border-b ${typeStyles.bg.includes('blue') ? 'border-blue-200' : typeStyles.bg.includes('yellow') ? 'border-yellow-200' : typeStyles.bg.includes('orange') ? 'border-orange-200' : 'border-gray-200'} -bottom-1 left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${baseClasses} ${typeStyles.bg.replace('bg-', 'bg-')} border-l border-t ${typeStyles.bg.includes('blue') ? 'border-blue-200' : typeStyles.bg.includes('yellow') ? 'border-yellow-200' : typeStyles.bg.includes('orange') ? 'border-orange-200' : 'border-gray-200'} -top-1 left-1/2 -translate-x-1/2`;
      case 'left':
        return `${baseClasses} ${typeStyles.bg.replace('bg-', 'bg-')} border-r border-t ${typeStyles.bg.includes('blue') ? 'border-blue-200' : typeStyles.bg.includes('yellow') ? 'border-yellow-200' : typeStyles.bg.includes('orange') ? 'border-orange-200' : 'border-gray-200'} -right-1 top-1/2 -translate-y-1/2`;
      case 'right':
        return `${baseClasses} ${typeStyles.bg.replace('bg-', 'bg-')} border-l border-b ${typeStyles.bg.includes('blue') ? 'border-blue-200' : typeStyles.bg.includes('yellow') ? 'border-yellow-200' : typeStyles.bg.includes('orange') ? 'border-orange-200' : 'border-gray-200'} -left-1 top-1/2 -translate-y-1/2`;
      default:
        return '';
    }
  };

  if (!visible) return null;

  const typeStyles = getTypeStyles(type);

  return (
    <div
      ref={tooltipRef}
      style={tooltipStyle}
      className={cn(
        'rounded-lg border shadow-lg p-3 animate-in fade-in-0 zoom-in-95 duration-200',
        typeStyles.bg
      )}
    >
      {/* Flèche */}
      {showArrow && (
        <div className={getArrowClasses(actualPosition)} />
      )}

      {/* Header avec titre et bouton fermer */}
      {(title || onClose) && (
        <div className="flex items-start justify-between mb-2">
          {title && (
            <div className="flex items-center">
              {typeStyles.icon}
              <h4 className={cn('ml-2 font-medium text-sm', typeStyles.text)}>
                {title}
              </h4>
            </div>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Contenu */}
      <div className={cn('text-sm', typeStyles.text)}>
        {content}
      </div>
    </div>
  );
};

/**
 * Composant QuickHelp principal
 */
export const QuickHelp: React.FC<QuickHelpProps> = ({
  content,
  type = 'info',
  position = 'auto',
  title,
  trigger = 'hover',
  delay = 300,
  maxWidth = 300,
  showArrow = true,
  className,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // ========================================
  // GESTION DES ÉVÉNEMENTS
  // ========================================

  const showTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const id = setTimeout(() => {
      setIsVisible(true);
    }, trigger === 'hover' ? delay : 0);
    
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const toggleTooltip = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  // ========================================
  // NETTOYAGE
  // ========================================

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  // Fermer au clic extérieur pour le mode click
  useEffect(() => {
    if (trigger === 'click' && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          setIsVisible(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [trigger, isVisible]);

  // ========================================
  // RENDU
  // ========================================

  const triggerProps = trigger === 'hover' ? {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip
  } : {
    onClick: toggleTooltip
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        {...triggerProps}
      >
        {children || (
          <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
        )}
      </div>

      <Tooltip
        content={content}
        title={title}
        type={type}
        position={position}
        maxWidth={maxWidth}
        showArrow={showArrow}
        visible={isVisible}
        onClose={trigger === 'click' ? () => setIsVisible(false) : undefined}
        parentRef={triggerRef}
      />
    </>
  );
};

/**
 * Composant d'aide inline
 */
interface InlineHelpProps {
  /** Contenu de l'aide */
  content: React.ReactNode;
  /** Type d'aide */
  type?: QuickHelpType;
  /** Titre */
  title?: string;
  /** Fermable */
  dismissible?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  content,
  type = 'info',
  title,
  dismissible = false,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const getTypeStyles = (type: QuickHelpType) => {
    switch (type) {
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          icon: <InformationCircleIcon className="h-4 w-4 text-blue-600" />
        };
      case 'tip':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          icon: <LightBulbIcon className="h-4 w-4 text-yellow-600" />
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-900',
          icon: <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
        };
      case 'help':
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-900',
          icon: <QuestionMarkCircleIcon className="h-4 w-4 text-gray-600" />
        };
      default:
        return {
          bg: 'bg-white border-gray-200',
          text: 'text-gray-900',
          icon: <InformationCircleIcon className="h-4 w-4 text-gray-600" />
        };
    }
  };

  const typeStyles = getTypeStyles(type);

  return (
    <div className={cn(
      'rounded-lg border p-3',
      typeStyles.bg,
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {typeStyles.icon}
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h4 className={cn('font-medium text-sm mb-1', typeStyles.text)}>
              {title}
            </h4>
          )}
          
          <div className={cn('text-sm', typeStyles.text)}>
            {content}
          </div>
        </div>
        
        {dismissible && (
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Composant d'aide pour les champs de formulaire
 */
interface FieldHelpProps {
  /** Contenu de l'aide */
  content: React.ReactNode;
  /** Position du tooltip */
  position?: TooltipPosition;
  /** Classe CSS personnalisée */
  className?: string;
}

export const FieldHelp: React.FC<FieldHelpProps> = ({
  content,
  position = 'right',
  className
}) => {
  return (
    <QuickHelp
      content={content}
      type="help"
      position={position}
      trigger="hover"
      delay={200}
      maxWidth={250}
      className={className}
    >
      <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
    </QuickHelp>
  );
};

/**
 * Hook pour l'aide contextuelle basée sur l'URL
 */
export const useRouteHelp = () => {
  const [currentRoute, setCurrentRoute] = useState('');

  useEffect(() => {
    setCurrentRoute(window.location.pathname);
    
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const getRouteHelp = () => {
    const routeHelpMap: Record<string, { title: string; content: React.ReactNode }> = {
      '/statistics/wizard': {
        title: 'Assistant de création',
        content: (
          <div>
            <p>Cet assistant vous guide dans la création d'une analyse statistique personnalisée.</p>
            <p className="mt-2 text-xs">Suivez les étapes pour configurer vos sources de données, choisir vos métriques et personnaliser l'affichage.</p>
          </div>
        )
      },
      '/statistics/templates': {
        title: 'Galerie de templates',
        content: (
          <div>
            <p>Utilisez nos templates prêts à l'emploi pour créer rapidement des analyses courantes.</p>
            <p className="mt-2 text-xs">Filtrez par catégorie ou recherchez le template qui correspond à vos besoins.</p>
          </div>
        )
      },
      '/statistics/results': {
        title: 'Résultats d\'analyse',
        content: (
          <div>
            <p>Consultez et interagissez avec vos graphiques statistiques.</p>
            <p className="mt-2 text-xs">Utilisez les contrôles pour personnaliser l'affichage et exporter vos résultats.</p>
          </div>
        )
      }
    };

    return routeHelpMap[currentRoute] || null;
  };

  return {
    currentRoute,
    routeHelp: getRouteHelp()
  };
};

export default QuickHelp;
