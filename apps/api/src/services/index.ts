// ========================================
// EXPORT CENTRAL DES SERVICES BACKEND
// ========================================

export { EvaluationService } from './evaluationService';
export { CalculationService } from './calculationService';
export { ResultService } from './resultService';
export { ValidationService } from './validationService';

// Services existants
export { AuthService } from './authService';
export { ClassService } from './classService';
export { StudentService } from './studentService';
export { TokenService } from './tokenService';

// Export des services PDF et export (s'ils existent)
export * from './pdfParsingService';
export * from './exportService';
