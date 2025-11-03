// Types d'authentification pour EduStats
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  establishment?: string;
  directionRegionale: string;
  secteurPedagogique: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  establishment?: string;
  directionRegionale: string;
  secteurPedagogique: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  gender?: 'M' | 'F';
  establishment?: string;
  directionRegionale?: string;
  secteurPedagogique?: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}
