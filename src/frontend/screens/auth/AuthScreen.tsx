import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, AlertCircle } from '@expo/vector-icons';
import { router } from 'expo-router';
import { THEME } from '@/src/lib/constants';

// Import from shared types and services
import { AuthFormData } from '@/src/shared/types/auth.types';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { Input } from '../../components/common/Input';

export default function AuthScreen() {
  const { 
    login, 
    signup, 
    error, 
    isLoading, 
    clearError, 
    isAuthenticated, 
    hasCompletedOnboarding 
  } = useAuthStore();

  const [isSignIn, setIsSignIn] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<AuthFormData>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      if (hasCompletedOnboarding) {
        router.replace('/chat');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isAuthenticated, hasCompletedOnboarding]);

  // Auto-check auth state when component mounts
  useEffect(() => {
    const checkAuthOnFocus = async () => {
      const { checkAuthState } = useAuthStore.getState();
      await checkAuthState();
    };
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

  const handleEmailAuth = async () => {
    if (!validateForm()) return;
    
    clearError();
    
    try {
      if (isSignIn) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (error) {
      console.error('Email auth failed:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }
    
    try {
      setResetLoading(true);
      // Import AuthService dynamically if needed or use store action
      const { AuthService } = await import('@/src/services/auth/AuthService');
      await AuthService.resetPassword(resetEmail);
      
      Alert.alert(
        'Check Your Email',
        'We have sent a password reset link to your email address.',
        [{ text: 'OK', onPress: () => setShowForgotPassword(false) }]
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message || 'Unable to send reset email.');
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
            placeholderTextColor="#9CA3AF"
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
                <Text style={styles.modalButtonPrimaryText}>Send Link</Text>
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
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <AntDesign name="arrowleft" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignIn ? 'Welcome back' : 'Create account'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignIn 
                ? 'Enter your details to sign in.' 
                : 'Start your parenting journey today.'}
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <AntDesign name="close" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

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
                    if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
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
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
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
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: undefined }));
                }}
                secureTextEntry
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
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignIn ? 'Log in' : 'Sign up'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle Mode */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignIn ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setIsSignIn(!isSignIn);
                clearError();
                setFormErrors({});
              }}
            >
              <Text style={styles.footerLink}>
                {isSignIn ? 'Sign up' : 'Log in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {renderForgotPasswordModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    marginTop: 16,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: THEME.fonts.header,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
  formContainer: {
    gap: 20,
    marginBottom: 32,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontFamily: THEME.fonts.bodySemiBold,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: THEME.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: THEME.fonts.body,
  },
  footerLink: {
    fontSize: 16,
    color: THEME.colors.primary,
    fontFamily: THEME.fonts.bodySemiBold,
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
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontFamily: THEME.fonts.body,
  },
  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
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
    padding: 16,
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});