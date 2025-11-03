// ========================================
// HELP COMPONENTS INDEX - INDEX DES COMPOSANTS D'AIDE
// ========================================

// Composants principaux
export { UserGuide } from './UserGuide';
export { FAQ } from './FAQ';
export { 
  ContextualHelp, 
  FloatingHelp, 
  InteractiveTutorial,
  useContextualHelp 
} from './ContextualHelp';
export { 
  QuickHelp, 
  InlineHelp, 
  FieldHelp,
  useRouteHelp 
} from './QuickHelp';

// Types et interfaces
export type { 
  HelpType,
  TooltipPosition,
  QuickHelpType 
} from './QuickHelp';

// Constantes utiles
export const HELP_CONTEXTS = {
  WIZARD_STEP_1: 'wizard-step-1',
  WIZARD_STEP_2: 'wizard-step-2',
  WIZARD_STEP_3: 'wizard-step-3',
  WIZARD_STEP_4: 'wizard-step-4',
  TEMPLATE_GALLERY: 'template-gallery',
  CHART_DISPLAY: 'chart-display',
  EXPORT_OPTIONS: 'export-options',
  PERFORMANCE_MONITOR: 'performance-monitor'
} as const;

export const HELP_TYPES = {
  INFO: 'info',
  TIP: 'tip',
  WARNING: 'warning',
  HELP: 'help'
} as const;
