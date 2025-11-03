// ========================================
// AUTO-SAVE INDICATOR - INDICATEUR DE SAUVEGARDE
// ========================================

import React from 'react';
import { cn } from '../../../utils/classNames';

/**
 * Props du composant AutoSaveIndicator
 */
interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

/**
 * Composant pour afficher l'état de la sauvegarde automatique
 */
export const AutoSaveIndicator = React.memo<AutoSaveIndicatorProps>(({
  isSaving,
  lastSaved,
  error,
  hasUnsavedChanges,
  className = ''
}) => {
  // ========================================
  // UTILITAIRES DE FORMATAGE
  // ========================================

  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 10) {
      return 'À l\'instant';
    } else if (diffSeconds < 60) {
      return `Il y a ${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes}min`;
    } else {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // ========================================
  // DÉTERMINATION DE L'ÉTAT
  // ========================================

  let message: string;
  let icon: string;
  let colorClasses: string;

  if (error) {
    message = 'Erreur de sauvegarde';
    icon = '❌';
    colorClasses = 'text-red-600 bg-red-50 border-red-200';
  } else if (isSaving) {
    message = 'Sauvegarde...';
    icon = '⏳';
    colorClasses = 'text-blue-600 bg-blue-50 border-blue-200';
  } else if (hasUnsavedChanges) {
    message = 'Modifications non sauvegardées';
    icon = '⚠️';
    colorClasses = 'text-yellow-600 bg-yellow-50 border-yellow-200';
  } else if (lastSaved) {
    message = `Sauvegardé ${formatLastSaved(lastSaved)}`;
    icon = '✅';
    colorClasses = 'text-green-600 bg-green-50 border-green-200';
  } else {
    message = 'Aucune modification';
    icon = '📝';
    colorClasses = 'text-gray-600 bg-gray-50 border-gray-200';
  }

  // ========================================
  // RENDU
  // ========================================

  return (
    <div 
      className={cn(
        'flex items-center px-3 py-1.5 border rounded-md text-sm transition-colors duration-200',
        colorClasses,
        className
      )}
      data-testid="auto-save-indicator"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Icône avec animation pour la sauvegarde */}
      <span 
        className={cn(
          'mr-2 transition-transform duration-200',
          isSaving && 'animate-pulse'
        )}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Message principal */}
      <span className="font-medium">
        {message}
      </span>

      {/* Détails de l'erreur si présente */}
      {error && (
        <span 
          className="ml-2 text-xs opacity-75 truncate max-w-32" 
          title={error}
        >
          ({error})
        </span>
      )}

      {/* Indicateur de connexion réseau si applicable */}
      {error && error.includes('réseau') && (
        <span 
          className="ml-2" 
          title="Problème de connexion réseau"
          aria-label="Problème de connexion réseau"
        >
          📶
        </span>
      )}
    </div>
  );
});

AutoSaveIndicator.displayName = 'AutoSaveIndicator';

/**
 * Version compacte de l'indicateur pour les espaces restreints
 */
export const CompactAutoSaveIndicator = React.memo<AutoSaveIndicatorProps>(({
  isSaving,
  lastSaved,
  error,
  hasUnsavedChanges,
  className = ''
}) => {
  let icon: string;
  let colorClass: string;
  let tooltip: string;

  if (error) {
    icon = '❌';
    colorClass = 'text-red-600';
    tooltip = `Erreur: ${error}`;
  } else if (isSaving) {
    icon = '⏳';
    colorClass = 'text-blue-600';
    tooltip = 'Sauvegarde en cours...';
  } else if (hasUnsavedChanges) {
    icon = '⚠️';
    colorClass = 'text-yellow-600';
    tooltip = 'Modifications non sauvegardées';
  } else if (lastSaved) {
    icon = '✅';
    colorClass = 'text-green-600';
    tooltip = `Sauvegardé ${lastSaved.toLocaleTimeString('fr-FR')}`;
  } else {
    icon = '📝';
    colorClass = 'text-gray-600';
    tooltip = 'Aucune modification';
  }

  return (
    <span 
      className={cn(
        'inline-block w-6 h-6 text-center transition-colors duration-200',
        isSaving && 'animate-pulse',
        colorClass,
        className
      )}
      title={tooltip}
      aria-label={tooltip}
      data-testid="compact-auto-save-indicator"
    >
      {icon}
    </span>
  );
});

CompactAutoSaveIndicator.displayName = 'CompactAutoSaveIndicator';

export default AutoSaveIndicator;
