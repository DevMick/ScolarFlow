// ========================================
// HOOK NAVIGATION CLAVIER - STYLE EXCEL POUR PRODUCTIVITÉ
// ========================================

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Configuration pour la navigation clavier
 */
interface KeyboardNavigationConfig {
  studentsCount: number;
  fieldsPerRow: string[];
  onCellChange?: (studentId: number, field: string) => void;
  onValueSubmit?: (studentId: number, field: string, value: any) => void;
  onEscape?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  enableWrapping?: boolean; // Retour à la ligne en fin de tableau
  autoFocusDelay?: number; // Délai pour auto-focus
}

/**
 * Interface pour la position actuelle
 */
interface CellPosition {
  studentId: number;
  field: string;
  rowIndex: number;
  fieldIndex: number;
}

/**
 * Interface de retour du hook
 */
interface KeyboardNavigationResult {
  currentCell: CellPosition;
  handleKeyDown: (e: KeyboardEvent) => void;
  focusCell: (studentId: number, field: string) => void;
  moveTo: (direction: 'up' | 'down' | 'left' | 'right') => void;
  moveToNext: () => void;
  moveToPrevious: () => void;
  isInEditMode: boolean;
  enterEditMode: () => void;
  exitEditMode: () => void;
}

/**
 * Hook pour navigation clavier avancée dans un tableau de saisie
 */
export function useKeyboardNavigation(config: KeyboardNavigationConfig): KeyboardNavigationResult {
  const {
    studentsCount,
    fieldsPerRow,
    onCellChange,
    onEscape,
    onSave,
    onUndo,
    enableWrapping = true,
    autoFocusDelay = 100
  } = config;

  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [currentCell, setCurrentCell] = useState<CellPosition>({
    studentId: 0,
    field: fieldsPerRow[0] || 'score',
    rowIndex: 0,
    fieldIndex: 0
  });

  const [isInEditMode, setIsInEditMode] = useState(false);
  const lastNavigationRef = useRef<number>(0);
  const focusTimeoutRef = useRef<number | null>(null);

  // ========================================
  // UTILITAIRES DE POSITION
  // ========================================

  const getRowIndex = useCallback((studentId: number): number => {
    return studentId;
  }, []);

  const getFieldIndex = useCallback((field: string): number => {
    return fieldsPerRow.indexOf(field);
  }, [fieldsPerRow]);

  const getStudentIdFromRowIndex = useCallback((rowIndex: number): number => {
    return Math.max(0, Math.min(studentsCount - 1, rowIndex));
  }, [studentsCount]);

  const getFieldFromIndex = useCallback((fieldIndex: number): string => {
    return fieldsPerRow[Math.max(0, Math.min(fieldsPerRow.length - 1, fieldIndex))] || fieldsPerRow[0];
  }, [fieldsPerRow]);

  const updateCurrentCell = useCallback((newStudentId: number, newField: string) => {
    const rowIndex = getRowIndex(newStudentId);
    const fieldIndex = getFieldIndex(newField);

    const newCell: CellPosition = {
      studentId: newStudentId,
      field: newField,
      rowIndex,
      fieldIndex
    };

    setCurrentCell(newCell);
    
    // Notifier le changement avec un délai pour éviter les appels excessifs
    if (onCellChange) {
      clearTimeout(focusTimeoutRef.current!);
      focusTimeoutRef.current = setTimeout(() => {
        onCellChange(newStudentId, newField);
      }, autoFocusDelay);
    }

    lastNavigationRef.current = Date.now();
  }, [getRowIndex, getFieldIndex, onCellChange, autoFocusDelay]);

  // ========================================
  // FONCTIONS DE DÉPLACEMENT
  // ========================================

  const moveTo = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const { rowIndex, fieldIndex } = currentCell;
    let newRowIndex = rowIndex;
    let newFieldIndex = fieldIndex;

    switch (direction) {
      case 'up':
        newRowIndex = Math.max(0, rowIndex - 1);
        break;

      case 'down':
        newRowIndex = Math.min(studentsCount - 1, rowIndex + 1);
        break;

      case 'left':
        newFieldIndex = fieldIndex - 1;
        if (newFieldIndex < 0) {
          if (enableWrapping && rowIndex > 0) {
            newFieldIndex = fieldsPerRow.length - 1;
            newRowIndex = rowIndex - 1;
          } else {
            newFieldIndex = 0;
          }
        }
        break;

      case 'right':
        newFieldIndex = fieldIndex + 1;
        if (newFieldIndex >= fieldsPerRow.length) {
          if (enableWrapping && rowIndex < studentsCount - 1) {
            newFieldIndex = 0;
            newRowIndex = rowIndex + 1;
          } else {
            newFieldIndex = fieldsPerRow.length - 1;
          }
        }
        break;
    }

    const newStudentId = getStudentIdFromRowIndex(newRowIndex);
    const newField = getFieldFromIndex(newFieldIndex);
    
    updateCurrentCell(newStudentId, newField);
    setIsInEditMode(false); // Sortir du mode édition lors de la navigation
  }, [currentCell, studentsCount, fieldsPerRow, enableWrapping, getStudentIdFromRowIndex, getFieldFromIndex, updateCurrentCell]);

  const moveToNext = useCallback(() => {
    const { rowIndex, fieldIndex } = currentCell;
    
    if (fieldIndex < fieldsPerRow.length - 1) {
      // Aller au champ suivant dans la même ligne
      moveTo('right');
    } else if (rowIndex < studentsCount - 1) {
      // Aller au premier champ de la ligne suivante
      const newStudentId = getStudentIdFromRowIndex(rowIndex + 1);
      const newField = getFieldFromIndex(0);
      updateCurrentCell(newStudentId, newField);
      setIsInEditMode(false);
    }
    // Sinon rester sur la dernière cellule
  }, [currentCell, studentsCount, fieldsPerRow, moveTo, getStudentIdFromRowIndex, getFieldFromIndex, updateCurrentCell]);

  const moveToPrevious = useCallback(() => {
    const { rowIndex, fieldIndex } = currentCell;
    
    if (fieldIndex > 0) {
      // Aller au champ précédent dans la même ligne
      moveTo('left');
    } else if (rowIndex > 0) {
      // Aller au dernier champ de la ligne précédente
      const newStudentId = getStudentIdFromRowIndex(rowIndex - 1);
      const newField = getFieldFromIndex(fieldsPerRow.length - 1);
      updateCurrentCell(newStudentId, newField);
      setIsInEditMode(false);
    }
    // Sinon rester sur la première cellule
  }, [currentCell, fieldsPerRow, moveTo, getStudentIdFromRowIndex, getFieldFromIndex, updateCurrentCell]);

  const focusCell = useCallback((studentId: number, field: string) => {
    updateCurrentCell(studentId, field);
    setIsInEditMode(false);
  }, [updateCurrentCell]);

  // ========================================
  // MODE ÉDITION
  // ========================================

  const enterEditMode = useCallback(() => {
    setIsInEditMode(true);
  }, []);

  const exitEditMode = useCallback(() => {
    setIsInEditMode(false);
  }, []);

  // ========================================
  // GESTIONNAIRE PRINCIPAL DE CLAVIER
  // ========================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Éviter les conflits avec les gestionnaires d'input
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';

    // Raccourcis globaux (fonctionnent toujours)
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          if (onSave) onSave();
          return;

        case 'z':
          e.preventDefault();
          if (onUndo) onUndo();
          return;

        case 'a':
          e.preventDefault();
          // Sélectionner tout - peut être géré par le composant parent
          return;
      }
    }

    // Touches de fonction
    switch (e.key) {
      case 'F1':
      case 'F2':
      case 'F12':
        // Laisser passer les touches de fonction
        return;
    }

    // Si on est en mode édition dans un input, limiter la navigation
    if (isInEditMode && isInputField) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setIsInEditMode(false);
          if (onEscape) onEscape();
          return;

        case 'Enter':
          e.preventDefault();
          setIsInEditMode(false);
          // Après validation, passer à la cellule suivante
          moveToNext();
          return;

        case 'Tab':
          e.preventDefault();
          setIsInEditMode(false);
          if (e.shiftKey) {
            moveToPrevious();
          } else {
            moveToNext();
          }
          return;

        default:
          // Laisser les autres touches dans le champ d'input
          return;
      }
    }

    // Navigation standard (hors mode édition)
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          moveToPrevious();
        } else {
          moveToNext();
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          moveTo('up');
        } else {
          moveTo('down');
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        moveTo('up');
        break;

      case 'ArrowDown':
        e.preventDefault();
        moveTo('down');
        break;

      case 'ArrowLeft':
        e.preventDefault();
        moveTo('left');
        break;

      case 'ArrowRight':
        e.preventDefault();
        moveTo('right');
        break;

      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+Home : Aller à la première cellule
          updateCurrentCell(0, fieldsPerRow[0]);
        } else {
          // Home : Aller au début de la ligne
          updateCurrentCell(currentCell.studentId, fieldsPerRow[0]);
        }
        break;

      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          // Ctrl+End : Aller à la dernière cellule
          updateCurrentCell(studentsCount - 1, fieldsPerRow[fieldsPerRow.length - 1]);
        } else {
          // End : Aller à la fin de la ligne
          updateCurrentCell(currentCell.studentId, fieldsPerRow[fieldsPerRow.length - 1]);
        }
        break;

      case 'PageUp':
        e.preventDefault();
        // Page Up : Remonter de 10 lignes
        moveTo('up');
        for (let i = 0; i < 9; i++) {
          moveTo('up');
        }
        break;

      case 'PageDown':
        e.preventDefault();
        // Page Down : Descendre de 10 lignes
        moveTo('down');
        for (let i = 0; i < 9; i++) {
          moveTo('down');
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsInEditMode(false);
        if (onEscape) onEscape();
        break;

      case ' ':
        // Espace pour certains champs spéciaux (ex: toggle absent)
        if (currentCell.field === 'absent') {
          e.preventDefault();
          // Le composant parent gérera le toggle
        }
        break;

      case 'F2':
        e.preventDefault();
        setIsInEditMode(true);
        break;

      default:
        // Pour les caractères alphanumériques, entrer automatiquement en mode édition
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          if (currentCell.field === 'score' || currentCell.field === 'notes') {
            setIsInEditMode(true);
            // Le caractère sera automatiquement saisi dans l'input
          }
        }
        break;
    }
  }, [
    isInEditMode,
    currentCell,
    fieldsPerRow,
    studentsCount,
    moveTo,
    moveToNext,
    moveToPrevious,
    updateCurrentCell,
    onEscape,
    onSave,
    onUndo
  ]);

  // ========================================
  // EFFETS
  // ========================================

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RÉSULTAT
  // ========================================

  return {
    currentCell,
    handleKeyDown,
    focusCell,
    moveTo,
    moveToNext,
    moveToPrevious,
    isInEditMode,
    enterEditMode,
    exitEditMode
  };
}

/**
 * Hook pour les raccourcis clavier globaux spécifiques aux évaluations
 */
export function useEvaluationKeyboardShortcuts(callbacks: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onShowHelp?: () => void;
  onFinalizeEvaluation?: () => void;
  onExportResults?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            callbacks.onSave?.();
            break;

          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              callbacks.onRedo?.();
            } else {
              callbacks.onUndo?.();
            }
            break;

          case 'a':
            e.preventDefault();
            callbacks.onSelectAll?.();
            break;

          case 'e':
            e.preventDefault();
            callbacks.onExportResults?.();
            break;

          case 'f':
            e.preventDefault();
            callbacks.onFinalizeEvaluation?.();
            break;
        }
      } else {
        switch (e.key) {
          case 'F1':
            e.preventDefault();
            callbacks.onShowHelp?.();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

export default useKeyboardNavigation;
