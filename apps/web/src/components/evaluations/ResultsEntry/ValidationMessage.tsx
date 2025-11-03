// ========================================
// VALIDATION MESSAGE - MESSAGES D'ERREUR CONTEXTUELS
// ========================================

import React from 'react';
import { cn } from '../../../utils/classNames';

/**
 * Interface pour les données de validation
 */
interface ValidationData {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Props du composant ValidationMessage
 */
interface ValidationMessageProps {
  studentId: number;
  validation: ValidationData;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  maxWidth?: string;
  showOnHover?: boolean;
}

/**
 * Composant pour afficher les messages de validation
 */
export const ValidationMessage = React.memo<ValidationMessageProps>(({
  studentId,
  validation,
  position = 'bottom',
  className = '',
  maxWidth = 'max-w-xs',
  showOnHover = false
}) => {
  const { errors, warnings, suggestions } = validation;
  
  // Ne rien afficher si pas de messages
  if (errors.length === 0 && warnings.length === 0 && suggestions.length === 0) {
    return null;
  }

  // Classes pour le positionnement
  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2 top-0',
    right: 'left-full ml-2 top-0'
  };

  // Classes pour la flèche indicatrice
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-0',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-0',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-0',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-0'
  };

  // Déterminer le type principal pour la couleur
  const messageType = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'info';
  
  const typeStyles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      arrow: 'border-red-200',
      icon: '❌'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      arrow: 'border-yellow-200',
      icon: '⚠️'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      arrow: 'border-blue-200',
      icon: '💡'
    }
  };

  const styles = typeStyles[messageType];

  return (
    <div 
      className={cn(
        'absolute z-40 p-3 border rounded-lg shadow-lg transition-opacity duration-200',
        maxWidth,
        styles.container,
        positionClasses[position],
        showOnHover && 'opacity-0 group-hover:opacity-100',
        className
      )}
      id={`validation-message-${studentId}`}
      role="alert"
      aria-live="polite"
    >
      {/* Flèche indicatrice */}
      <div 
        className={cn(
          'absolute w-0 h-0 border-4',
          styles.arrow,
          arrowClasses[position]
        )}
        style={{
          borderTopColor: position === 'bottom' ? 'transparent' : undefined,
          borderBottomColor: position === 'top' ? 'transparent' : undefined,
          borderLeftColor: position === 'right' ? 'transparent' : undefined,
          borderRightColor: position === 'left' ? 'transparent' : undefined,
        }}
      />

      {/* Contenu du message */}
      <div className="space-y-2">
        {/* Erreurs */}
        {errors.length > 0 && (
          <div>
            <div className="flex items-center text-sm font-medium mb-1">
              <span className="mr-1">❌</span>
              Erreur{errors.length > 1 ? 's' : ''}
            </div>
            <ul className="text-xs space-y-1 ml-5">
              {errors.map((error, index) => (
                <li key={index} className="leading-tight">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Avertissements */}
        {warnings.length > 0 && (
          <div>
            <div className="flex items-center text-sm font-medium mb-1">
              <span className="mr-1">⚠️</span>
              Attention
            </div>
            <ul className="text-xs space-y-1 ml-5">
              {warnings.map((warning, index) => (
                <li key={index} className="leading-tight">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && errors.length === 0 && (
          <div>
            <div className="flex items-center text-sm font-medium mb-1">
              <span className="mr-1">💡</span>
              Suggestion{suggestions.length > 1 ? 's' : ''}
            </div>
            <ul className="text-xs space-y-1 ml-5">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="leading-tight">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

ValidationMessage.displayName = 'ValidationMessage';

/**
 * Composant simplifié pour messages d'erreur inline
 */
export const InlineValidationMessage = React.memo<{
  message: string;
  type?: 'error' | 'warning' | 'info';
  className?: string;
}>(({ message, type = 'error', className = '' }) => {
  const typeStyles = {
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  };

  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div className={cn('flex items-center text-xs mt-1', typeStyles[type], className)}>
      <span className="mr-1">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
});

InlineValidationMessage.displayName = 'InlineValidationMessage';

export default ValidationMessage;
