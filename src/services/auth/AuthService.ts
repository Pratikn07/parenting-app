import { SupabaseAuth } from './SupabaseAuthService';
import { AuthResponse, SignInCredentials, SignUpCredentials } from '../../shared/types/auth.types';

// Production authentication service using Supabase
class AuthServiceClass {
  async signInWithEmail(credentials: SignInCredentials): Promise<AuthResponse> {
    return SupabaseAuth.signInWithEmail(credentials);
  }

  async signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResponse> {
    return SupabaseAuth.signUpWithEmail(credentials);
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    return SupabaseAuth.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    return SupabaseAuth.signOut();
  }

  async getCurrentUser(): Promise<any> {
    return SupabaseAuth.getCurrentUser();
  }

  async getSession(): Promise<any> {
    return SupabaseAuth.getSession();
  }

  isLoggedIn(): boolean {
    return SupabaseAuth.isLoggedIn();
  }

  async handleOAuthCallback(url: string): Promise<void> {
    return SupabaseAuth.handleOAuthCallback(url);
  }

  async resetPassword(email: string): Promise<void> {
    return SupabaseAuth.resetPassword(email);
  }

  async updatePassword(newPassword: string): Promise<void> {
    return SupabaseAuth.updatePassword(newPassword);
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return SupabaseAuth.onAuthStateChange(callback);
  }
}

export const AuthService = new AuthServiceClass();