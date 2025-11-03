// ========================================
// TYPES FRONTEND - EXPORTS PRINCIPAUX
// ========================================

// Re-export des types de base depuis le package shared
export type {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  AuthResponse,
  Class,
  CreateClassData,
  UpdateClassData,
  Student,
  CreateStudentData,
  UpdateStudentData,
  BulkStudentOperation,
  Evaluation,
  EvaluationResult,
  EvaluationResultInput,
  CreateEvaluationData,
  UpdateEvaluationData,
  BulkEvaluationResultInput,
  ImportJob,
  ImportResult,
  ParsedStudent,
  ImportError,
  DuplicateStudent,
  EvaluationExportOptions,
  ExportResult,
  EvaluationType,
  AbsentHandling,
  RoundingMethod,
  AbsentReason,
  ApiResponse,
  PaginatedResponse
} from '@edustats/shared/types';

// ========================================
// TYPES SPÉCIFIQUES AU FRONTEND
// ========================================

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AutoSaveConfig {
  enabled?: boolean;
  delay?: number;
  maxRetries?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface CellPosition {
  row: number;
  column: number;
  field?: string;
  id?: string | number;
}

export interface KeyboardShortcut {
  key: string | string[];
  description: string;
  action: () => void;
  category?: string;
  enabled?: boolean;
}

export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export interface FormComponentProps extends BaseComponentProps {
  name?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  placeholder?: string;
  error?: string;
  warning?: string;
  success?: string;
  hint?: string;
}

export interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;
  role?: string;
}

export type AsyncCallback<T = void> = () => Promise<T>;
export type EventHandler<T = any> = (event: T) => void;

export interface Action<T = any> {
  type: string;
  payload?: T;
}

export default {};