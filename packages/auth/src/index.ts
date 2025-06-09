// Auth context and provider
export { AuthProvider, useAuth } from './contexts/AuthContext';

// Hooks
export { useAuthenticatedFetch } from './hooks/useAuthenticatedFetch';

// Components
export { LoginForm } from './components/LoginForm';
export { RegisterForm } from './components/RegisterForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ProtectedRoute } from './components/ProtectedRoute';
export { UserProfile } from './components/UserProfile';
export { LogoutButton } from './components/LogoutButton';

// Types
export type {
  User,
  AuthState,
  AuthContextType,
  AuthConfig,
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from './types/auth';

export type {
  UserRole,
  RoleConfig,
} from './types/roles';

export {
  ROLES_CONFIG,
  AVAILABLE_ROLES,
  getRoleConfig,
  getRoleLabel,
  getRoleColor,
  canAssignRole,
  getAssignableRoles,
} from './types/roles';

// Validation schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './lib/validations';

export type {
  LoginFormData as LoginFormDataType,
  RegisterFormData as RegisterFormDataType,
  ForgotPasswordFormData as ForgotPasswordFormDataType,
  ResetPasswordFormData as ResetPasswordFormDataType,
} from './lib/validations'; 