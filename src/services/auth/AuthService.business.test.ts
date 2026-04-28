import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './AuthService';
import { SupabaseAuth } from './SupabaseAuthService';
import type {
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
  User,
} from '../../shared/types/auth.types';

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
    onAuthStateChange: vi.fn(),
  },
}));

const mockSupabaseAuth = vi.mocked(SupabaseAuth);

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  parenting_stage: 'infant',
  feeding_preference: 'mixed',
  has_completed_onboarding: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

const buildAuthResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => ({
  user: buildUser(),
  token: 'access-token',
  refreshToken: 'refresh-token',
  ...overrides,
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signInWithEmail delegates to SupabaseAuth and returns its response', async () => {
    const credentials: SignInCredentials = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };
    const expected = buildAuthResponse();
    mockSupabaseAuth.signInWithEmail.mockResolvedValue(expected);

    const result = await AuthService.signInWithEmail(credentials);

    expect(mockSupabaseAuth.signInWithEmail).toHaveBeenCalledWith(credentials);
    expect(result).toBe(expected);
  });

  it('signUpWithEmail delegates to SupabaseAuth and returns its response', async () => {
    const credentials: SignUpCredentials = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'SecurePass123!',
    };
    const expected = buildAuthResponse({
      user: buildUser({ has_completed_onboarding: false }),
    });
    mockSupabaseAuth.signUpWithEmail.mockResolvedValue(expected);

    const result = await AuthService.signUpWithEmail(credentials);

    expect(mockSupabaseAuth.signUpWithEmail).toHaveBeenCalledWith(credentials);
    expect(result).toBe(expected);
  });

  it('propagates rejection when SupabaseAuth throws', async () => {
    const credentials: SignInCredentials = {
      email: 'test@example.com',
      password: 'wrong',
    };
    const error = new Error('Invalid login credentials');
    mockSupabaseAuth.signInWithEmail.mockRejectedValue(error);

    await expect(AuthService.signInWithEmail(credentials)).rejects.toThrow(
      'Invalid login credentials'
    );
  });
});
