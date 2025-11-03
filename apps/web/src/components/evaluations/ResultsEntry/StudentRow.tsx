// ========================================
// STUDENT ROW - LIGNE ÉLÈVE DANS LE TABLEAU
// ========================================

import React, { useCallback, useMemo } from 'react';
import { ScoreInput } from './ScoreInput';
import { AbsentToggle } from './AbsentToggle';
import { InlineValidationMessage } from './ValidationMessage';
import { cn } from '../../../utils/classNames';
import type { 
  Student, 
  EvaluationResult, 
  Evaluation, 
  EvaluationResultInput,
  AbsentReason 
} from '../../../types';

/**
 * Interface pour les erreurs de validation d'une ligne
 */
interface RowValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

/**
 * Props du composant StudentRow
 */
interface StudentRowProps {
  student: Student & { result: EvaluationResult };
  result: EvaluationResult;
  evaluation: Evaluation;
  index: number;
  isCurrentRow: boolean;
  currentField: 'score' | 'notes' | 'absent';
  validationErrors: RowValidationError[];
  onScoreChange: (studentId: number, score: number | null) => void;
  onAbsentToggle: (studentId: number, isAbsent: boolean, reason?: AbsentReason) => void;
  onNotesChange: (studentId: number, notes: string) => void;
  onValidationError: (studentId: number, errors: RowValidationError[]) => void;
  onFocus: (field: 'score' | 'notes' | 'absent') => void;
  className?: string;
}

/**
 * Composant représentant une ligne d'élève dans le tableau de saisie
 */
export const StudentRow = React.memo<StudentRowProps>(({
  student,
  result,
  evaluation,
  index,
  isCurrentRow,
  currentField,
  validationErrors = [],
  onScoreChange,
  onAbsentToggle,
  onNotesChange,
  onValidationError,
  onFocus,
  className = ''
}) => {
  // ========================================
  // ÉTAT CALCULÉ
  // ========================================

  const isAbsent = result.isAbsent || false;
  const score = result.score;
  const notes = result.notes || '';
  const absentReason = result.absentReason;

  // Calculer le pourcentage si une note est présente
  const scorePercentage = useMemo(() => {
    if (score === null || score === undefined || isAbsent) return null;
    return ((score / Number(evaluation.maxScore)) * 100).toFixed(1);
  }, [score, evaluation.maxScore, isAbsent]);

  // Déterminer la couleur de la note selon le pourcentage
  const scoreColorClass = useMemo(() => {
    if (scorePercentage === null) return '';
    const percentage = parseFloat(scorePercentage);
    
    if (percentage >= 90) return 'text-green-600 font-semibold';
    if (percentage >= 70) return 'text-green-500';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 30) return 'text-orange-500';
    return 'text-red-500';
  }, [scorePercentage]);

  // Vérifier s'il y a des erreurs pour cette ligne
  const hasErrors = validationErrors.some(error => error.type === 'error');
  const hasWarnings = validationErrors.some(error => error.type === 'warning');

  // ========================================
  // GESTIONNAIRES D'ÉVÉNEMENTS
  // ========================================

  const handleScoreChange = useCallback((studentId: number, newScore: number | null) => {
    onScoreChange(studentId, newScore);
  }, [onScoreChange]);

  const handleAbsentToggle = useCallback((studentId: number, isAbsent: boolean, reason?: AbsentReason) => {
    onAbsentToggle(studentId, isAbsent, reason);
  }, [onAbsentToggle]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    onNotesChange(student.id, newNotes);
  }, [student.id, onNotesChange]);

  const handleScoreValidationError = useCallback((studentId: number, errors: any[]) => {
    onValidationError(studentId, errors);
  }, [onValidationError]);

  const handleFocus = useCallback((field: 'score' | 'notes' | 'absent') => {
    onFocus(field);
  }, [onFocus]);

  const handleNotesKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Permettre Tab et Enter pour la navigation
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (e.key === 'Enter' && e.shiftKey) {
        // Shift+Enter: ligne précédente
        return;
      }
      // La navigation sera gérée par le composant parent
    }
  }, []);

  // ========================================
  // RENDU
  // ========================================

  const rowClasses = cn(
    'grid grid-cols-12 gap-1 p-2 transition-colors duration-150',
    'hover:bg-gray-50 focus-within:bg-blue-50',
    isCurrentRow && 'bg-blue-50 ring-2 ring-blue-200',
    hasErrors && 'bg-red-50',
    hasWarnings && !hasErrors && 'bg-yellow-50',
    isAbsent && 'bg-gray-50 text-gray-600',
    index % 2 === 0 ? 'bg-white' : 'bg-gray-25',
    className
  );

  return (
    <div className={rowClasses} data-testid={`student-row-${student.id}`}>
      {/* Numéro de ligne */}
      <div className="col-span-1 flex items-center justify-center text-sm text-gray-500">
        {index + 1}
      </div>

      {/* Nom de l'élève */}
      <div className="col-span-4 flex items-center">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {student.lastName} {student.firstName}
          </div>
          {student.studentNumber && (
            <div className="text-xs text-gray-500 truncate">
              #{student.studentNumber}
            </div>
          )}
        </div>
        
        {/* Indicateurs visuels de statut */}
        <div className="flex items-center space-x-1 ml-2">
          {hasErrors && (
            <span 
              className="text-red-500 text-xs" 
              title="Erreurs de validation"
              aria-label="Erreurs de validation"
            >
              ❌
            </span>
          )}
          {hasWarnings && !hasErrors && (
            <span 
              className="text-yellow-500 text-xs" 
              title="Avertissements"
              aria-label="Avertissements"
            >
              ⚠️
            </span>
          )}
          {isAbsent && (
            <span 
              className="text-gray-500 text-xs" 
              title={`Absent${absentReason ? ` (${absentReason})` : ''}`}
              aria-label={`Absent${absentReason ? ` pour ${absentReason}` : ''}`}
            >
              🚫
            </span>
          )}
          {!isAbsent && score !== null && (
            <span 
              className={cn('text-xs', scoreColorClass)} 
              title={`${scorePercentage}%`}
              aria-label={`${scorePercentage} pourcent`}
            >
              📊
            </span>
          )}
        </div>
      </div>

      {/* Saisie de note */}
      <div className="col-span-2 flex items-center relative">
        <ScoreInput
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
          evaluation={evaluation}
          initialValue={score}
          isAbsent={isAbsent}
          isFocused={isCurrentRow && currentField === 'score'}
          onValueChange={handleScoreChange}
          onValidationError={handleScoreValidationError}
          onFocus={() => handleFocus('score')}
          onEnterPressed={() => {/* Géré par le parent */}}
          onEscapePressed={() => {/* Géré par le parent */}}
          className="w-full"
        />
        
        {/* Affichage du pourcentage */}
        {!isAbsent && scorePercentage !== null && (
          <div className={cn('absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-xs', scoreColorClass)}>
            {scorePercentage}%
          </div>
        )}
      </div>

      {/* Toggle absent */}
      <div className="col-span-2 flex items-center justify-center">
        <AbsentToggle
          studentId={student.id}
          studentName={`${student.firstName} ${student.lastName}`}
          isAbsent={isAbsent}
          absentReason={absentReason}
          isFocused={isCurrentRow && currentField === 'absent'}
          onToggle={handleAbsentToggle}
          onFocus={() => handleFocus('absent')}
        />
      </div>

      {/* Commentaires */}
      <div className="col-span-3 flex items-center">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          onKeyDown={handleNotesKeyDown}
          onFocus={() => handleFocus('notes')}
          disabled={isAbsent}
          placeholder={isAbsent ? 'Absent' : 'Commentaires...'}
          className={cn(
            'w-full px-2 py-1 text-sm border border-gray-300 rounded resize-none',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
            isCurrentRow && currentField === 'notes' && 'ring-2 ring-blue-500 ring-opacity-50',
            'min-h-[32px] max-h-16'
          )}
          rows={1}
          data-testid={`notes-input-${student.id}`}
          aria-label={`Commentaires pour ${student.firstName} ${student.lastName}`}
        />
      </div>

      {/* Messages de validation inline pour toute la ligne */}
      {validationErrors.length > 0 && (
        <div className="col-span-12 mt-1">
          {validationErrors.map((error, errorIndex) => (
            <InlineValidationMessage
              key={errorIndex}
              message={`${error.field}: ${error.message}`}
              type={error.type}
              className="mb-1"
            />
          ))}
        </div>
      )}
    </div>
  );
});

StudentRow.displayName = 'StudentRow';

export default StudentRow;
