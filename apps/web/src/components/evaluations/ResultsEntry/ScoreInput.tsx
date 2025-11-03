// ========================================
// SCORE INPUT - SAISIE DE NOTE INTELLIGENTE
// ========================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ValidationMessage } from './ValidationMessage';
import { cn } from '../../../utils/classNames';
import type { Evaluation } from '../../../types';

/**
 * Interface de validation pour une note
 */
interface ScoreValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  normalizedValue?: number | null;
}

/**
 * Props du composant ScoreInput
 */
interface ScoreInputProps {
  studentId: number;
  studentName: string;
  evaluation: Evaluation;
  initialValue?: number | null;
  isAbsent: boolean;
  isFocused: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  className?: string;
  onValueChange: (studentId: number, score: number | null) => void;
  onValidationError: (studentId: number, errors: any[]) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnterPressed?: () => void;
  onEscapePressed?: () => void;
}

/**
 * Formats de saisie acceptés
 */
const SCORE_PATTERNS = {
  DECIMAL_DOT: /^(\d{1,2})\.(\d{1,2})$/,     // 15.5
  DECIMAL_COMMA: /^(\d{1,2}),(\d{1,2})$/,   // 15,5
  INTEGER: /^(\d{1,2})$/,                    // 15
  FRACTION: /^(\d{1,2})\/(\d{1,2})$/,       // 15/20
  ABSENT_MARKERS: /^(abs|absent|a|-|\/)/i   // ABS, ABSENT, A, -, /
};

/**
 * Composant de saisie de note avec validation temps réel
 */
export const ScoreInput = React.memo<ScoreInputProps>(({
  studentId,
  studentName,
  evaluation,
  initialValue,
  isAbsent,
  isFocused,
  isDisabled = false,
  placeholder,
  className = '',
  onValueChange,
  onValidationError,
  onFocus,
  onBlur,
  onEnterPressed,
  onEscapePressed
}) => {
  // ========================================
  // ÉTAT LOCAL
  // ========================================

  const [rawValue, setRawValue] = useState<string>(() => {
    if (isAbsent) return 'ABS';
    if (initialValue === null || initialValue === undefined) return '';
    return initialValue.toString();
  });

  const [validation, setValidation] = useState<ScoreValidation>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  });

  const [showValidation, setShowValidation] = useState(false);
  const [lastValidValue, setLastValidValue] = useState<string>('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<number | null>(null);

  // ========================================
  // VALIDATION DE NOTE
  // ========================================

  const validateScore = useCallback((value: string): ScoreValidation => {
    // Cas spéciaux
    if (!value || value.trim() === '') {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: ['Saisissez une note ou marquez comme absent'],
        normalizedValue: null
      };
    }

    const trimmedValue = value.trim();
    const maxScore = Number(evaluation.maxScore);

    // Vérifier les marqueurs d'absence
    if (SCORE_PATTERNS.ABSENT_MARKERS.test(trimmedValue)) {
      return {
        isValid: false,
        errors: ['Utilisez la case "Absent" pour marquer un élève absent'],
        warnings: [],
        suggestions: ['Cochez la case "Absent" ou saisissez une note numérique'],
        normalizedValue: null
      };
    }

    let normalizedScore: number | null = null;
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Parser différents formats
    if (SCORE_PATTERNS.INTEGER.test(trimmedValue)) {
      // Nombre entier
      normalizedScore = parseInt(trimmedValue, 10);
    } 
    else if (SCORE_PATTERNS.DECIMAL_DOT.test(trimmedValue)) {
      // Décimal avec point
      normalizedScore = parseFloat(trimmedValue);
    }
    else if (SCORE_PATTERNS.DECIMAL_COMMA.test(trimmedValue)) {
      // Décimal avec virgule (français)
      normalizedScore = parseFloat(trimmedValue.replace(',', '.'));
      suggestions.push(`Format reconnu: ${normalizedScore} (virgule convertie en point)`);
    }
    else if (SCORE_PATTERNS.FRACTION.test(trimmedValue)) {
      // Fraction (ex: 15/20)
      const match = trimmedValue.match(SCORE_PATTERNS.FRACTION);
      if (match) {
        const numerator = parseInt(match[1], 10);
        const denominator = parseInt(match[2], 10);
        
        if (denominator === 0) {
          errors.push('Division par zéro impossible');
        } else {
          // Convertir selon le barème de l'évaluation
          normalizedScore = (numerator / denominator) * maxScore;
          suggestions.push(`Fraction convertie: ${numerator}/${denominator} = ${normalizedScore.toFixed(2)}/${maxScore}`);
        }
      }
    }
    else {
      // Format non reconnu
      errors.push(`Format non reconnu: "${trimmedValue}"`);
      suggestions.push('Formats acceptés: 15, 15.5, 15,5, 15/20');
      
      return {
        isValid: false,
        errors,
        warnings,
        suggestions,
        normalizedValue: null
      };
    }

    // Validation de la valeur numérique
    if (normalizedScore !== null) {
      // Vérifier les limites
      if (normalizedScore < 0) {
        errors.push('La note ne peut pas être négative');
      } else if (normalizedScore > maxScore) {
        errors.push(`La note ne peut pas dépasser ${maxScore}`);
        suggestions.push(`Note maximale pour cette évaluation: ${maxScore}`);
      }

      // Avertissements pour les notes suspectes
      if (normalizedScore === 0) {
        warnings.push('Note de 0 - Vérifiez si l\'élève était présent');
      } else if (normalizedScore === maxScore) {
        warnings.push('Note parfaite - Félicitations à l\'élève !');
      } else if (normalizedScore < maxScore * 0.3) {
        warnings.push('Note très basse - Envisagez un entretien avec l\'élève');
      } else if (normalizedScore > maxScore * 0.95) {
        warnings.push('Excellente note !');
      }

      // Suggestions d'arrondi si nécessaire
      const rounded = Math.round(normalizedScore * 2) / 2; // Arrondi au demi-point
      if (Math.abs(normalizedScore - rounded) > 0.01) {
        suggestions.push(`Suggestion d'arrondi: ${rounded}`);
      }
    }

    const isValid = errors.length === 0 && normalizedScore !== null;

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      normalizedValue: isValid ? normalizedScore : null
    };
  }, [evaluation.maxScore]);

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setRawValue(newValue);

    // Validation en temps réel avec debounce
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validationResult = validateScore(newValue);
      setValidation(validationResult);
      setShowValidation(true);

      // Notifier les erreurs au parent
      if (validationResult.errors.length > 0) {
        onValidationError(studentId, validationResult.errors.map(error => ({
          field: 'score',
          message: error,
          type: 'error' as const
        })));
      } else {
        onValidationError(studentId, []);
      }

      // Notifier la valeur valide au parent
      if (validationResult.isValid && validationResult.normalizedValue !== null) {
        onValueChange(studentId, validationResult.normalizedValue || null);
        setLastValidValue(newValue);
      } else if (newValue === '') {
        onValueChange(studentId, null);
        setLastValidValue('');
      }
    }, 300); // Debounce de 300ms
  }, [validateScore, onValidationError, onValueChange, studentId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        // Si la valeur est valide, la sauvegarder et passer au suivant
        if (validation.isValid) {
          onEnterPressed?.();
        }
        break;

      case 'Escape':
        e.preventDefault();
        // Revenir à la dernière valeur valide
        setRawValue(lastValidValue);
        setValidation({ isValid: true, errors: [], warnings: [], suggestions: [] });
        setShowValidation(false);
        onEscapePressed?.();
        break;

      case 'Tab':
        // Ne pas empêcher - géré par le parent
        if (validation.isValid) {
          onValueChange(studentId, validation.normalizedValue || null);
        }
        break;

      // Raccourcis pour saisie rapide
      case 'a':
      case 'A':
        if (e.ctrlKey) {
          e.preventDefault();
          inputRef.current?.select();
        }
        break;
    }
  }, [validation, lastValidValue, onEnterPressed, onEscapePressed, onValueChange, studentId]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setShowValidation(true);
    // Sélectionner tout le texte pour faciliter la saisie
    e.target.select();
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    // Masquer la validation après un délai
    setTimeout(() => setShowValidation(false), 200);
    
    // Valider une dernière fois et sauvegarder
    if (validation.isValid && validation.normalizedValue !== null) {
      onValueChange(studentId, validation.normalizedValue || null);
    }
    
    onBlur?.();
  }, [validation, onValueChange, studentId, onBlur]);

  // ========================================
  // EFFETS
  // ========================================

  // Auto-focus quand le composant devient focal
  useEffect(() => {
    if (isFocused && inputRef.current && !isAbsent && !isDisabled) {
      inputRef.current.focus();
    }
  }, [isFocused, isAbsent, isDisabled]);

  // Mise à jour quand l'état absent change
  useEffect(() => {
    if (isAbsent) {
      setRawValue('ABS');
      setValidation({ isValid: true, errors: [], warnings: [], suggestions: [] });
      setShowValidation(false);
    } else if (rawValue === 'ABS') {
      setRawValue(initialValue?.toString() || '');
    }
  }, [isAbsent, initialValue]);

  // Mise à jour de la valeur initiale
  useEffect(() => {
    if (!isAbsent && initialValue !== undefined) {
      const newValue = initialValue?.toString() || '';
      setRawValue(newValue);
      setLastValidValue(newValue);
    }
  }, [initialValue, isAbsent]);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  // ========================================
  // RENDU
  // ========================================

  const inputClasses = cn(
    'w-full px-2 py-1 text-center text-sm border rounded-md transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
    
    // États de validation
    isAbsent && 'bg-gray-50 text-gray-500 cursor-not-allowed',
    !isAbsent && validation.errors.length > 0 && 'border-red-500 bg-red-50',
    !isAbsent && validation.warnings.length > 0 && validation.errors.length === 0 && 'border-yellow-500 bg-yellow-50',
    !isAbsent && validation.isValid && validation.normalizedValue !== null && 'border-green-500 bg-green-50',
    
    // Focus state
    isFocused && !isAbsent && 'ring-2 ring-blue-500 ring-opacity-50',
    
    className
  );

  const displayValue = useMemo(() => {
    if (isAbsent) return 'ABS';
    return rawValue;
  }, [isAbsent, rawValue]);

  const placeholderText = useMemo(() => {
    if (isAbsent) return 'Absent';
    return placeholder || `0-${evaluation.maxScore}`;
  }, [isAbsent, placeholder, evaluation.maxScore]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isAbsent || isDisabled}
        className={inputClasses}
        placeholder={placeholderText}
        autoComplete="off"
        spellCheck={false}
        data-testid={`score-input-${studentId}`}
        aria-label={`Note pour ${studentName}`}
        aria-describedby={validation.errors.length > 0 ? `score-error-${studentId}` : undefined}
        aria-invalid={validation.errors.length > 0}
      />

      {/* Affichage de la validation */}
      {showValidation && !isAbsent && (validation.errors.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
        <ValidationMessage
          studentId={studentId}
          validation={validation}
          position="bottom"
          className="z-20"
        />
      )}

      {/* Indicateur de valeur normalisée */}
      {!isAbsent && validation.isValid && validation.normalizedValue !== null && rawValue !== (validation.normalizedValue || 0).toString() && (
        <div className="absolute -bottom-5 left-0 text-xs text-green-600">
          = {validation.normalizedValue}
        </div>
      )}
    </div>
  );
});

ScoreInput.displayName = 'ScoreInput';

export default ScoreInput;
