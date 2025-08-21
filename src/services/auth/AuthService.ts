import { MockAuthService } from './MockAuthService';
import { AuthResponse, SignInCredentials, SignUpCredentials } from '../../shared/types/auth.types';

// Frontend-only authentication service
class AuthServiceClass {
  async signInWithEmail(credentials: SignInCredentials): Promise<AuthResponse> {
    return MockAuthService.signInWithEmail(credentials);
  }

  async signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResponse> {
    return MockAuthService.signUpWithEmail(credentials);
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    return MockAuthService.signInWithGoogle();
  }

  async signInWithApple(): Promise<AuthResponse> {
    return MockAuthService.signInWithApple();
  }

  async signOut(): Promise<void> {
    return MockAuthService.signOut();
  }

  async getCurrentUser(): Promise<any> {
    return MockAuthService.getCurrentUser();
  }

  async getSession(): Promise<any> {
    return MockAuthService.getSession();
  }

  isLoggedIn(): boolean {
    return MockAuthService.isLoggedIn();
  }

  async handleOAuthCallback(url: string): Promise<void> {
    return MockAuthService.handleOAuthCallback(url);
  }
}

export const AuthService = new AuthServiceClass();