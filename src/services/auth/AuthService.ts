import { AuthResponse, SignInCredentials, SignUpCredentials, User } from '../../shared/types/auth.types';

class AuthServiceClass {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.parentingapp.com';
  private token: string | null = null;

  async signInWithApple(): Promise<AuthResponse> {
    // TODO: Implement Apple Sign In with expo-apple-authentication
    console.log('Apple Sign In initiated');
    
    // Mock response for now
    return {
      user: {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    // TODO: Implement Google Sign In with expo-auth-session
    console.log('Google Sign In initiated');
    
    // Mock response for now
    return {
      user: {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@gmail.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
    };
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Sign in failed');
      }

      const data = await response.json();
      this.token = data.token;
      
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error('Sign up failed');
      }

      const data = await response.json();
      this.token = data.token;
      
      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${this.baseUrl}/auth/signout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      this.token = null;
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear token even if request fails
      this.token = null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get current user');
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    // TODO: Implement token refresh logic
    return this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }
}

const AuthService = new AuthServiceClass();
export { AuthService };
export default AuthService;
