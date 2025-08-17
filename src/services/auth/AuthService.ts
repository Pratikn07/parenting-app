import { AuthResponse, SignInCredentials, SignUpCredentials, User } from '../../shared/types/auth.types';
import { supabase, createUserProfile } from '../supabase';

class AuthServiceClass {
  async signInWithApple(): Promise<AuthResponse> {
    try {
      // For OAuth, we need to handle the redirect flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'yourapp://callback',
        },
      });

      if (error) throw error;

      // OAuth returns a URL for redirect, not immediate user data
      // The actual authentication happens after redirect
      // For now, return a placeholder that indicates OAuth is in progress
      throw new Error('OAuth redirect initiated. Please complete authentication in browser.');
    } catch (error) {
      console.error('Apple Sign In error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      // For OAuth, we need to handle the redirect flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'yourapp://callback',
        },
      });

      if (error) throw error;

      // OAuth returns a URL for redirect, not immediate user data
      // The actual authentication happens after redirect
      // For now, return a placeholder that indicates OAuth is in progress
      throw new Error('OAuth redirect initiated. Please complete authentication in browser.');
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    }
  }

  // Handle OAuth callback after redirect
  async handleOAuthCallback(): Promise<AuthResponse | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      // Create user profile if it doesn't exist
      if (session.user) {
        try {
          await createUserProfile(session.user.id, session.user.email || '');
        } catch (profileError) {
          // Profile might already exist, which is fine
          console.log('Profile creation skipped:', profileError);
        }
      }

      return {
        user: {
          id: session.user?.id || '',
          name: session.user?.user_metadata?.full_name || session.user?.email || '',
          email: session.user?.email || '',
          createdAt: new Date(session.user?.created_at || ''),
          updatedAt: new Date(session.user?.updated_at || ''),
        },
        token: session.access_token || '',
        refreshToken: session.refresh_token || '',
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return null;
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return {
        user: {
          id: data.user?.id || '',
          name: data.user?.user_metadata?.full_name || data.user?.email || '',
          email: data.user?.email || '',
          createdAt: new Date(data.user?.created_at || ''),
          updatedAt: new Date(data.user?.updated_at || ''),
        },
        token: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signUp(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      // Create user profile
      if (data.user) {
        try {
          await createUserProfile(data.user.id, email);
        } catch (profileError) {
          console.log('Profile creation error:', profileError);
        }
      }

      return {
        user: {
          id: data.user?.id || '',
          name: name,
          email: email,
          createdAt: new Date(data.user?.created_at || ''),
          updatedAt: new Date(data.user?.updated_at || ''),
        },
        token: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token || '',
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        name: user.user_metadata?.full_name || user.email || '',
        email: user.email || '',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at),
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data.session?.access_token || null;
    } catch (error) {
      console.error('Refresh token error:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // For compatibility with existing code
  setToken(token: string): void {
    // Supabase handles token management automatically
    console.log('Token management is handled by Supabase automatically');
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Send password reset email
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Update user password
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(updates: { name?: string; email?: string }): Promise<User> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: updates.email,
        data: {
          full_name: updates.name,
        },
      });

      if (error) throw error;

      // Also update the users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .update({
            email: updates.email,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      return {
        id: data.user?.id || '',
        name: updates.name || data.user?.user_metadata?.full_name || '',
        email: updates.email || data.user?.email || '',
        createdAt: new Date(data.user?.created_at || ''),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

const AuthService = new AuthServiceClass();
export { AuthService };
export default AuthService;
