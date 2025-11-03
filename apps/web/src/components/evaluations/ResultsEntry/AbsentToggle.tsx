// ========================================
// ABSENT TOGGLE - GESTION INTUITIVE DES ABSENCES
// ========================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../../utils/classNames';
import type { AbsentReason } from '../../../types';

/**
 * Props du composant AbsentToggle
 */
interface AbsentToggleProps {
  studentId: number;
  studentName: string;
  isAbsent: boolean;
  absentReason?: AbsentReason | null;
  isFocused: boolean;
  isDisabled?: boolean;
  className?: string;
  onToggle: (studentId: number, isAbsent: boolean, reason?: AbsentReason) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * Raisons d'absence disponibles avec labels français
 */
const ABSENT_REASONS: Array<{ value: AbsentReason; label: string; description: string }> = [
  { 
    value: 'illness', 
    label: 'Maladie', 
    description: 'Élève malade ou en arrêt médical' 
  },
  { 
    value: 'family_reason', 
    label: 'Raison familiale', 
    description: 'Événement familial important' 
  },
  { 
    value: 'school_activity', 
    label: 'Activité scolaire', 
    description: 'Voyage scolaire ou activité éducative' 
  },
  { 
    value: 'medical_appointment', 
    label: 'Rendez-vous médical', 
    description: 'Consultation médicale ou spécialisée' 
  },
  { 
    value: 'exclusion', 
    label: 'Exclusion', 
    description: 'Mesure disciplinaire temporaire' 
  },
  { 
    value: 'unjustified', 
    label: 'Non justifiée', 
    description: 'Absence sans motif valable' 
  },
  { 
    value: 'other', 
    label: 'Autre', 
    description: 'Autre motif non listé' 
  }
];

/**
 * Composant pour gérer l'absence d'un élève avec sélection de raison
 */
export const AbsentToggle = React.memo<AbsentToggleProps>(({
  studentId,
  studentName,
  isAbsent,
  absentReason,
  isFocused,
  isDisabled = false,
  className = '',
  onToggle,
  onFocus,
  onBlur
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [showReasonMenu, setShowReasonMenu] = useState(false);
  const [selectedReason, setSelectedReason] = useState<AbsentReason | null>(absentReason || null);
  
  const checkboxRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsAbsent = e.target.checked;
    
    if (newIsAbsent) {
      // Marquer comme absent - afficher le menu de sélection de raison
      setShowReasonMenu(true);
    } else {
      // Marquer comme présent - effacer la raison
      setSelectedReason(null);
      onToggle(studentId, false);
    }
  }, [studentId, onToggle]);

  const handleReasonSelect = useCallback((reason: AbsentReason) => {
    setSelectedReason(reason);
    setShowReasonMenu(false);
    onToggle(studentId, true, reason);
  }, [studentId, onToggle]);

  const handleReasonButtonClick = useCallback(() => {
    if (isAbsent) {
      setShowReasonMenu(!showReasonMenu);
    }
  }, [isAbsent, showReasonMenu]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (e.target === checkboxRef.current) {
          // Toggle absent status
          const newIsAbsent = !isAbsent;
          if (newIsAbsent) {
            setShowReasonMenu(true);
          } else {
            setSelectedReason(null);
            onToggle(studentId, false);
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (e.target === buttonRef.current && isAbsent) {
          setShowReasonMenu(!showReasonMenu);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowReasonMenu(false);
        break;

      case 'ArrowDown':
        if (showReasonMenu) {
          e.preventDefault();
          // Focus sur le premier élément du menu
          const firstItem = menuRef.current?.querySelector('[role="menuitem"]') as HTMLElement;
          firstItem?.focus();
        }
        break;
    }
  }, [isAbsent, showReasonMenu, studentId, onToggle]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent, reason: AbsentReason) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleReasonSelect(reason);
        break;

      case 'Escape':
        e.preventDefault();
        setShowReasonMenu(false);
        checkboxRef.current?.focus();
        break;

      case 'ArrowDown':
        e.preventDefault();
        const nextItem = (e.target as HTMLElement).nextElementSibling as HTMLElement;
        nextItem?.focus();
        break;

      case 'ArrowUp':
        e.preventDefault();
        const prevItem = (e.target as HTMLElement).previousElementSibling as HTMLElement;
        prevItem?.focus();
        break;
    }
  }, [handleReasonSelect]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Fermer le menu si le focus sort du composant
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setShowReasonMenu(false);
      onBlur?.();
    }
  }, [onBlur]);

  // ========================================
  // EFFETS
  // ========================================

  // Auto-focus sur la checkbox quand le composant devient focal
  useEffect(() => {
    if (isFocused && checkboxRef.current) {
      checkboxRef.current.focus();
    }
  }, [isFocused]);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowReasonMenu(false);
      }
    };

    if (showReasonMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReasonMenu]);

  // Synchroniser avec les props
  useEffect(() => {
    setSelectedReason(absentReason || null);
  }, [absentReason]);

  // ========================================
  // RENDU
  // ========================================

  const getReasonInfo = (reason: AbsentReason | null) => {
    return ABSENT_REASONS.find(r => r.value === reason);
  };

  const selectedReasonInfo = getReasonInfo(selectedReason);

  return (
    <div 
      className={cn('relative', className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {/* Checkbox principal */}
      <div className="flex items-center space-x-2">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={isAbsent}
          onChange={handleCheckboxChange}
          disabled={isDisabled}
          className={cn(
            'w-4 h-4 text-blue-600 border-gray-300 rounded transition-colors',
            'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isFocused && 'ring-2 ring-blue-500 ring-opacity-50'
          )}
          data-testid={`absent-checkbox-${studentId}`}
          aria-label={`Marquer ${studentName} comme absent`}
          aria-describedby={isAbsent ? `absent-reason-${studentId}` : undefined}
        />

        {/* Bouton de sélection de raison */}
        {isAbsent && (
          <button
            ref={buttonRef}
            type="button"
            onClick={handleReasonButtonClick}
            disabled={isDisabled}
            className={cn(
              'px-2 py-1 text-xs border border-gray-300 rounded transition-colors',
              'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              selectedReasonInfo ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-700'
            )}
            aria-label="Sélectionner la raison d'absence"
            aria-haspopup="menu"
            aria-expanded={showReasonMenu}
          >
            {selectedReasonInfo ? selectedReasonInfo.label : 'Raison ?'}
          </button>
        )}
      </div>

      {/* Label de la raison sélectionnée */}
      {isAbsent && selectedReasonInfo && (
        <div 
          className="text-xs text-gray-600 mt-1"
          id={`absent-reason-${studentId}`}
        >
          {selectedReasonInfo.description}
        </div>
      )}

      {/* Menu de sélection des raisons */}
      {showReasonMenu && (
        <div
          ref={menuRef}
          className={cn(
            'absolute top-full left-0 z-30 mt-1 w-64 py-1',
            'bg-white border border-gray-200 rounded-md shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
          role="menu"
          aria-label="Raisons d'absence"
        >
          {ABSENT_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              role="menuitem"
              tabIndex={0}
              onClick={() => handleReasonSelect(reason.value)}
              onKeyDown={(e) => handleMenuKeyDown(e, reason.value)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-blue-50 focus:bg-blue-50 focus:outline-none',
                selectedReason === reason.value && 'bg-blue-100 text-blue-800'
              )}
            >
              <div className="font-medium">{reason.label}</div>
              <div className="text-xs text-gray-600 mt-1">{reason.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

AbsentToggle.displayName = 'AbsentToggle';

export default AbsentToggle;
