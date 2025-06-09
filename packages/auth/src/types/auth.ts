export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'SCRUM_MASTER' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface AuthConfig {
  loginEndpoint: string;
  registerEndpoint: string;
  logoutEndpoint: string;
  meEndpoint: string;
  forgotPasswordEndpoint: string;
  resetPasswordEndpoint: string;
  redirectAfterLogin: string;
  redirectAfterLogout: string;
} 