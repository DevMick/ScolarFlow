// ========================================
// TYPES API GÉNÉRIQUES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
  timestamp?: Date;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    startIndex: number;
    endIndex: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  statusCode?: number;
  details?: any;
  timestamp?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// ========================================
// TYPES DE TRI ET FILTRAGE
// ========================================

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  dateRange?: [Date, Date];
  status?: string[];
  tags?: string[];
  categories?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface QueryOptions extends PaginationOptions {
  sort?: SortOptions;
  filters?: FilterOptions;
  include?: string[];
  fields?: string[];
}

// ========================================
// TYPES UTILITAIRES
// ========================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// ========================================
// TYPES POUR DATES ET TEMPS
// ========================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  startTime: string; // Format HH:mm
  endTime: string;   // Format HH:mm
}

export interface AcademicPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// ========================================
// TYPES POUR NOTIFICATIONS
// ========================================

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ========================================
// TYPES POUR UPLOAD DE FICHIERS
// ========================================

export interface FileUploadOptions {
  maxSize: number;
  allowedTypes: string[];
  multiple: boolean;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: number;
}

export interface FileUploadResult {
  success: boolean;
  files: UploadedFile[];
  errors: string[];
}

// ========================================
// TYPES POUR EXPORT DE DONNÉES
// ========================================

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface GenericExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders: boolean;
  dateFormat?: string;
  encoding?: string;
  customFields?: string[];
}

export interface ExportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  format: ExportFormat;
  filename: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

// ========================================
// TYPES POUR STATISTIQUES
// ========================================

export interface StatisticsData {
  [key: string]: number | string | Date | StatisticsData;
}

export interface GenericChartDataPoint {
  label: string;
  value: number;
  color?: string;
  metadata?: any;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  category?: string;
}

export interface ComparisonData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// ========================================
// TYPES POUR CONFIGURATION
// ========================================

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxFileSize: number;
    maxStudentsPerClass: number;
    maxEvaluationsPerMonth: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  dateFormat: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}

// ========================================
// TYPES POUR AUDIT ET LOGS
// ========================================

export interface AuditLog {
  id: string;
  userId: number;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  timestamp: Date;
  source: string;
}

// ========================================
// TYPES POUR CACHE ET PERFORMANCE
// ========================================

export interface CacheOptions {
  ttl: number; // Time to live en secondes
  key: string;
  tags?: string[];
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
}

// ========================================
// CONSTANTES UTILES
// ========================================

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
} as const;

export const DEFAULT_SORT = {
  field: 'createdAt',
  direction: 'desc' as const,
} as const;

export const MAX_ITEMS_PER_PAGE = 100;
export const MIN_ITEMS_PER_PAGE = 5;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;