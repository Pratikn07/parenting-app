import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

// Import from shared types and services
import { AuthFormData } from '../../../shared/types/auth.types';
import { useAuthStore } from '../../../shared/stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export default function AuthScreen() {
  const { login, signup, error, isLoading, clearError, isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  const [isSignIn, setIsSignIn] = useState(false);
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<AuthFormData>>({});
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Handle navigation after successful authentication
  React.useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User authenticated, navigating...');
      if (hasCompletedOnboarding) {
        router.replace('/chat');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  // Auto-check auth state when component mounts (for OAuth return)
  React.useEffect(() => {
    const checkAuthOnFocus = async () => {
      console.log('🔍 Checking auth state...');
      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();
    };
    
    // Check immediately and then every time app comes into focus
    checkAuthOnFocus();
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Partial<AuthFormData> = {};
    
    if (!isSignIn && !formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isSignIn && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!isSignIn && !/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain both letters and numbers';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinueWithGoogle = async () => {
    try {
      setIsOAuthLoading('google');
      clearError();
      
      console.log('Initiating Google Sign In...');
      
      // Import AuthService dynamically to avoid import issues
      const { AuthService } = await import('../../../services/auth/AuthService');
      
      // Initiate Google OAuth flow
      await AuthService.signInWithGoogle();
      
      // No more alert needed - OAuth handles everything
      console.log('OAuth initiated - processing automatically...');
      
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      
      if (error.message?.includes('OAuth completed but session not found')) {
        Alert.alert(
          'Authentication In Progress', 
          'OAuth completed. Please wait a moment for authentication to finalize.',
          [{ text: 'OK' }]
        );
        // Keep loading state - might still succeed
      } else if (!error.message?.includes('cancelled by user')) {
        Alert.alert(
          'Authentication Error', 
          error.message || 'Google Sign In failed. Please try again.',
          [{ text: 'OK' }]
        );
        setIsOAuthLoading(null);
      } else {
        setIsOAuthLoading(null);
      }
    }
  };

  const handleEmailAuth = async () => {
    if (!validateForm()) return;
    
    clearError();
    
    try {
      // TODO: Add analytics tracking
      console.log('Email auth attempt:', isSignIn ? 'signin' : 'signup');
      
      if (isSignIn) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
      
      // Navigation will be handled by the auth store and app routing
    } catch (error) {
      console.error('Email auth failed:', error);
      // Error will be displayed via auth store error state
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(resetEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      setResetLoading(true);
      // TODO: Add analytics tracking
      console.log('Password reset attempt for:', resetEmail);
      
      // TODO: Implement password reset
      console.log('Password reset - Not implemented');
      
      Alert.alert(
        'Coming Soon',
        'Password reset will be available when you connect to a backend service.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
      
    } catch (error) {
      console.error('Password reset failed:', error);
      Alert.alert('Reset Failed', 'Unable to send password reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const renderForgotPasswordModal = () => {
    if (!showForgotPassword) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Reset Password</Text>
          <Text style={styles.modalSubtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Enter your email"
            value={resetEmail}
            onChangeText={setResetEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowForgotPassword(false)}
              disabled={resetLoading}
            >
              <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButtonPrimary, resetLoading && styles.modalButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonPrimaryText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Your Parenting Compass</Text>
            <Text style={styles.subtitle}>
              Your trusted companion for the parenting journey
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#EF4444" strokeWidth={2} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorClose}>
                <Text style={styles.errorCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Auth Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, !isSignIn && styles.toggleButtonActive]}
              onPress={() => {
                setIsSignIn(false);
                clearError();
                setFormErrors({});
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, !isSignIn && styles.toggleTextActive]}>
                Create account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isSignIn && styles.toggleButtonActive]}
              onPress={() => {
                setIsSignIn(true);
                clearError();
                setFormErrors({});
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, isSignIn && styles.toggleTextActive]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Sign In */}
          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={handleContinueWithGoogle}
              disabled={isLoading || isOAuthLoading !== null}
              activeOpacity={0.7}
            >
              {isOAuthLoading === 'google' ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.formContainer}>
            {!isSignIn && (
              <View>
                <Input
                  label="Your name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, name: text }));
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  autoCapitalize="words"
                  error={formErrors.name}
                />
              </View>
            )}

            <View>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, email: text }));
                  if (formErrors.email) {
                    setFormErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={formErrors.email}
              />
            </View>

            <View>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, password: text }));
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                secureTextEntry
                helperText={!isSignIn ? "At least 8 characters with letters and numbers" : undefined}
                error={formErrors.password}
              />
            </View>

            {isSignIn && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => {
                  setResetEmail(formData.email);
                  setShowForgotPassword(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.emailButton, isLoading && styles.emailButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={isLoading || isOAuthLoading !== null}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.emailButtonText}>
                  {isSignIn ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Debug: Manual Auth Check Button */}
            <TouchableOpacity
              style={[styles.emailButton, { backgroundColor: '#6B7280', marginTop: 12 }]}
              onPress={async () => {
                console.log('🔍 Manual auth check triggered');
                const { checkAuthState } = useAuthStore.getState();
                await checkAuthState();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.emailButtonText}>🔍 Check Auth Status</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Reassurance */}
          <View style={styles.reassurance}>
            <Text style={styles.reassuranceText}>
              Private, secure, and easy to change later.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Forgot Password Modal */}
      {renderForgotPasswordModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F3',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  errorClose: {
    padding: 4,
  },
  errorCloseText: {
    fontSize: 18,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  socialContainer: {
    gap: 12,
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  formContainer: {
    gap: 20,
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#D4635A',
    fontWeight: '500',
  },
  emailButton: {
    backgroundColor: '#D4635A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  emailButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  termsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#D4635A',
    fontWeight: '500',
  },
  reassurance: {
    alignItems: 'center',
  },
  reassuranceText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#D4635A',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
