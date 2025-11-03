// Types pour la gestion des formules d'évaluation

export interface EvaluationFormula {
  id: number;
  userId: number;
  formula: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationFormulaData {
  formula: string;
}

export interface UpdateEvaluationFormulaData {
  formula?: string;
}
