import { supabase } from '../../lib/supabase';
import { AuthResponse, SignInCredentials, SignUpCredentials } from '../../shared/types/auth.types';
import { Profile } from '../../lib/database.types';

/**
 * Real Supabase Authentication Service
 * Replaces the mock authentication system with actual Supabase auth calls
 */
class SupabaseAuthService {
  /**
   * Sign in with email and password
   */
  async signInWithEmail(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed - no user or session returned');
      }

      // Get the user's profile from our profiles table (optional for now)
      let profile = null;
      try {
        profile = await this.getUserProfile(data.user.id);
      } catch (error) {
        console.log('📝 No profile found, creating basic profile from auth data');
        // Create basic profile from auth metadata
        profile = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.email || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          parenting_stage: 'expecting' as const,
          feeding_preference: 'breastfeeding' as const,
          has_completed_onboarding: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return {
        user: profile,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user || !data.session) {
        throw new Error('Registration failed - no user or session returned');
      }

      // Get the user's profile (should be auto-created by trigger)
      const profile = await this.getUserProfile(data.user.id);

      return {
        user: profile,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth - Fixed Expo Go Implementation  
   */
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { makeRedirectUri } = await import('expo-auth-session');
      const WebBrowser = await import('expo-web-browser');
      
      console.log('Starting Google OAuth with proper redirect handling...');

      // Create proper redirect URI for development build
      const redirectUri = makeRedirectUri({
        scheme: 'com.pratikn07.mycuratedhaven',
        path: 'auth/callback'
      });
      
      console.log('Using redirect URI:', redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            // Always show Google account chooser and consent screen
            prompt: 'select_account consent',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Open OAuth URL in browser
      if (data?.url) {
        console.log('Opening Google OAuth URL:', data.url);
        
        const result = await WebBrowser.openBrowserAsync(data.url, {
          showTitle: true,
          toolbarColor: '#D4635A',
          controlsColor: '#FFFFFF',
          dismissButtonStyle: 'done',
        });
        
        console.log('WebBrowser result:', result);

        // Handle different result types
        if (result.type === 'success') {
          // Browser was closed via deep link redirect - this is what we want
          console.log('OAuth redirect successful, checking for session...');
        } else if (result.type === 'cancel') {
          // User manually closed browser or OAuth was cancelled
          console.log('OAuth was cancelled by user');
          throw new Error('Google sign-in was cancelled');
        } else {
          console.log('OAuth completed, checking for session...');
        }
        
        // Give a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check for session after OAuth completion
      const session = await this.getSession();
      const currentUser = await this.getCurrentUser();

      if (session && currentUser) {
        return {
          user: currentUser,
          token: session.access_token,
          refreshToken: session.refresh_token || '',
        };
      } else {
        throw new Error('OAuth completed but session not found');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }



  /**
   * Sign in with Apple OAuth
   */
  async signInWithApple(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // For OAuth, we need to handle the redirect flow
      // This will return immediately, and the actual auth happens in the callback
      throw new Error('OAuth flow initiated - redirect to Apple');
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      // Note: We don't clear Google's browser session as it causes
      // unwanted deep link redirects that auto-trigger sign-in
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<Profile | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw new Error(error.message);
      }

      if (!user) {
        return null;
      }

      // Try to get profile from profiles table, fallback to auth metadata
      try {
        return await this.getUserProfile(user.id);
      } catch (profileError) {
        console.log('📝 No profile table found, using auth metadata');
        // Create basic profile from auth metadata
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          parenting_stage: 'expecting' as const,
          feeding_preference: 'breastfeeding' as const,
          has_completed_onboarding: false,
          created_at: user.created_at,
          updated_at: user.created_at,
        };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    const session = supabase.auth.getSession();
    return !!session;
  }

  /**
   * Handle OAuth callback (for Google/Apple sign-in)
   */
  async handleOAuthCallback(url: string): Promise<void> {
    try {
      console.log('🔗 Processing OAuth callback URL:', url);
      
      // Parse URL hash parameters
      const urlObj = new URL(url.replace('#', '?'));
      const accessToken = urlObj.searchParams.get('access_token');
      const refreshToken = urlObj.searchParams.get('refresh_token');
      
      if (!accessToken) {
        throw new Error('No access token found in callback URL');
      }

      // Set the session with the tokens from callback
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ OAuth callback handled successfully, session established');
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Get user profile from the users table
   */
  private async getUserProfile(userId: string): Promise<Profile> {
    try {
      // First try to get existing user profile
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        return data;
      }

      // If no user found, create a new profile record
      if (error?.code === 'PGRST116' || error?.message?.includes('No rows')) {
        console.log('📝 No user profile found, creating new one');
        
        // Get user info from auth
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser?.user) {
          throw new Error('Could not get auth user info');
        }

        const userData = authUser.user;
        
        // Create new user profile
        const newProfile = {
          id: userId,
          email: userData.email || '',
          name: userData.user_metadata?.full_name || userData.user_metadata?.name || '',
          avatar_url: userData.user_metadata?.avatar_url || '',
          locale: 'en-US',
          has_completed_onboarding: false
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          throw new Error(`Failed to create user profile: ${createError.message}`);
        }

        console.log('✅ Created new user profile');
        return createdUser;
      }

      // Other error
      throw new Error(`Failed to get user profile: ${error?.message}`);
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Set up auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      callback(event, session);
    });
  }
}

export const SupabaseAuth = new SupabaseAuthService();