import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './AuthService';
import { SupabaseAuth } from './SupabaseAuthService';
import { SignInCredentials, SignUpCredentials } from '../../shared/types/auth.types';

// Mock the SupabaseAuthService
vi.mock('./SupabaseAuthService', () => ({
  SupabaseAuth: {
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    getCurrentUser: vi.fn(),
    getSession: vi.fn(),
    isLoggedIn: vi.fn(),
    handleOAuthCallback: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    onAuthStateChange: vi.fn()
  }
}));

describe('AuthService Business Logic', () => {
  const mockSupabaseAuth = vi.mocked(SupabaseAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Authentication', () => {
    it('should successfully sign up with valid email credentials', async () => {
      const credentials: SignUpCredentials = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      const mockResponse = {
        success: true,
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        error: null
      };

      mockSupabaseAuth.signUpWithEmail.mockResolvedValue(mockResponse);

      const result = await AuthService.signUpWithEmail(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.user);
      expect(mockSupabaseAuth.signUpWithEmail).toHaveBeenCalledWith(credentials);
    });

    it('should successfully sign in with valid email credentials', async () => {
      const credentials: SignInCredentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const mockResponse = {
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
        error: null
      };

      mockSupabaseAuth.signInWithEmail.mockResolvedValue(mockResponse);

      const result = await AuthService.signInWithEmail(credentials);

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.signInWithEmail).toHaveBeenCalledWith(credentials);
    });

    it('should handle sign in failure with incorrect credentials', async () => {
      const credentials: SignInCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      mockSupabaseAuth.signInWithEmail.mockResolvedValue({
        success: false,
        user: null,
        error: 'Invalid login credentials'
      });

      const result = await AuthService.signInWithEmail(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid login credentials');
    });
  });

  describe('OAuth Authentication', () => {
    it('should handle Google sign in', async () => {
      mockSupabaseAuth.signInWithGoogle.mockResolvedValue({
        success: true,
        user: { id: 'google-user-123', email: 'test@gmail.com' },
        error: null
      });

      const result = await AuthService.signInWithGoogle();

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.signInWithGoogle).toHaveBeenCalled();
    });

    it('should handle OAuth callback', async () => {
      const mockUrl = 'myapp://auth-callback?code=123&state=abc';
      
      mockSupabaseAuth.handleOAuthCallback.mockResolvedValue();

      await AuthService.handleOAuthCallback(mockUrl);

      expect(mockSupabaseAuth.handleOAuthCallback).toHaveBeenCalledWith(mockUrl);
    });
  });

  describe('Session Management', () => {
    it('should get current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseAuth.getCurrentUser.mockResolvedValue(mockUser);

      const result = await AuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockSupabaseAuth.getCurrentUser).toHaveBeenCalled();
    });

    it('should get current session', async () => {
      const mockSession = { accessToken: 'token-123', refreshToken: 'refresh-123' };
      mockSupabaseAuth.getSession.mockResolvedValue(mockSession);

      const result = await AuthService.getSession();

      expect(result).toEqual(mockSession);
      expect(mockSupabaseAuth.getSession).toHaveBeenCalled();
    });

    it('should check if user is logged in', () => {
      mockSupabaseAuth.isLoggedIn.mockReturnValue(true);

      const result = AuthService.isLoggedIn();

      expect(result).toBe(true);
      expect(mockSupabaseAuth.isLoggedIn).toHaveBeenCalled();
    });

    it('should sign out user', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue();

      await AuthService.signOut();

      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });
  });

  describe('Password Management', () => {
    it('should reset password for valid email', async () => {
      mockSupabaseAuth.resetPassword.mockResolvedValue();

      await AuthService.resetPassword('test@example.com');

      expect(mockSupabaseAuth.resetPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('should update password', async () => {
      mockSupabaseAuth.updatePassword.mockResolvedValue();

      await AuthService.updatePassword('newSecurePassword123!');

      expect(mockSupabaseAuth.updatePassword).toHaveBeenCalledWith('newSecurePassword123!');
    });
  });

  describe('Auth State Monitoring', () => {
    it('should register auth state change callback', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      mockSupabaseAuth.onAuthStateChange.mockReturnValue(mockUnsubscribe);

      const unsubscribe = AuthService.onAuthStateChange(mockCallback);

      expect(mockSupabaseAuth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});
