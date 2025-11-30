export interface AuthFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  parenting_stage: 'expecting' | 'newborn' | 'infant' | 'toddler' | 'preschool';
  feeding_preference: 'breastfeeding' | 'formula' | 'mixed';
  has_completed_onboarding: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

export type AuthProvider = 'google' | 'email';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}
