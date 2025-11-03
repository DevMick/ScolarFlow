// ========================================
// CREATE WIZARD - EXPORTS PRINCIPAUX
// ========================================

export { EvaluationWizard as default } from './EvaluationWizard';
export { EvaluationWizard } from './EvaluationWizard';
export type { WizardStep, WizardStepProps } from './EvaluationWizard';

// Hooks
export { useWizardState } from './hooks/useWizardState';
export { useDraftSave } from './hooks/useDraftSave';

// Composants de navigation
export { WizardProgress } from './components/WizardProgress';
export { WizardNavigation, MobileWizardNavigation } from './components/WizardNavigation';

// Étapes
export { StepTemplate } from './steps/StepTemplate';
export { StepBasicInfo } from './steps/StepBasicInfo';
export { StepParameters } from './steps/StepParameters';
export { StepSchedule } from './steps/StepSchedule';
export { StepPreview } from './steps/StepPreview';

// Templates
export { TemplateGallery } from './templates/TemplateGallery';
export { TemplateCard } from './templates/TemplateCard';
export { 
  evaluationTemplates, 
  templateCategories, 
  schoolLevels,
  filterTemplates,
  getPopularTemplates,
  getRecentTemplates
} from './templates/templateData';
export type { EvaluationTemplate } from './templates/templateData';

// Utilitaires
export * from './templates/templateData';
