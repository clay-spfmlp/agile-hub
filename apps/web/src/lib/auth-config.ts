import { AuthConfig } from '@repo/auth';

export const authConfig: AuthConfig = {
  loginEndpoint: 'http://localhost:8080/api/auth/login',
  registerEndpoint: 'http://localhost:8080/api/auth/register',
  logoutEndpoint: 'http://localhost:8080/api/auth/logout',
  meEndpoint: 'http://localhost:8080/api/auth/me',
  forgotPasswordEndpoint: 'http://localhost:8080/api/auth/forgot-password',
  resetPasswordEndpoint: 'http://localhost:8080/api/auth/reset-password',
  redirectAfterLogin: '/dashboard',
  redirectAfterLogout: '/login',
}; 