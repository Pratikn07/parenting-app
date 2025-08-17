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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple, Mail } from 'lucide-react-native';
import { router } from 'expo-router';

// Import from shared types and services
import { AuthService } from '../../../services/auth/AuthService';
import { AnalyticsService } from '../../../services/analytics/AnalyticsService';
import { AuthFormData } from '../../../shared/types/auth.types';
import { useAuthStore } from '../../../shared/stores/authStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SocialButton } from '../../components/auth/SocialButton';

export default function AuthScreen() {
  const [isSignIn, setIsSignIn] = useState(false);
  const { login } = useAuthStore();
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });

  const handleContinueWithApple = async () => {
    try {
      AnalyticsService.track('auth_apple_initiated');
      await AuthService.signInWithApple();
      // Note: In a real app, you'd get the auth response and pass it to login()
      await login(formData.email, formData.password); // Mock for now
      router.replace('/onboarding');
    } catch (error) {
      console.error('Apple Sign In failed:', error);
    }
  };

  const handleContinueWithGoogle = async () => {
    try {
      AnalyticsService.track('auth_google_initiated');
      await AuthService.signInWithGoogle();
      // Note: In a real app, you'd get the auth response and pass it to login()
      await login(formData.email, formData.password); // Mock for now
      router.replace('/onboarding');
    } catch (error) {
      console.error('Google Sign In failed:', error);
    }
  };

  const handleEmailAuth = async () => {
    try {
      AnalyticsService.track(isSignIn ? 'auth_email_signin' : 'auth_email_signup');
      
      if (isSignIn) {
        await login(formData.email, formData.password);
      } else {
        // For sign up, you'd typically call a signup service first, then login
        await AuthService.signUp(formData.name, formData.email, formData.password);
        await login(formData.email, formData.password);
      }
      
      router.replace('/onboarding');
    } catch (error) {
      console.error('Email auth failed:', error);
    }
  };

  const handleForgotPassword = () => {
    AnalyticsService.track('auth_forgot_password');
    // TODO: Implement forgot password
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
            <Text style={styles.title}>Welcome to My Curated Haven</Text>
            <Text style={styles.subtitle}>
              Your trusted companion for the parenting journey
            </Text>
          </View>

          {/* Auth Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, !isSignIn && styles.toggleButtonActive]}
              onPress={() => setIsSignIn(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, !isSignIn && styles.toggleTextActive]}>
                Create account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, isSignIn && styles.toggleButtonActive]}
              onPress={() => setIsSignIn(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleText, isSignIn && styles.toggleTextActive]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Sign In */}
          <View style={styles.socialContainer}>
            <SocialButton
              provider="apple"
              onPress={handleContinueWithApple}
              icon={<Apple size={20} color="#000000" strokeWidth={2} fill="#000000" />}
              text="Continue with Apple"
            />

            <SocialButton
              provider="google"
              onPress={handleContinueWithGoogle}
              text="Continue with Google"
            />
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
              <Input
                label="Your name"
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                autoCapitalize="words"
              />
            )}

            <Input
              label="Email"
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
              secureTextEntry
              helperText={!isSignIn ? "At least 8 characters with letters and numbers" : undefined}
            />

            {isSignIn && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <Button
              title={isSignIn ? 'Sign in' : 'Create account'}
              onPress={handleEmailAuth}
              variant="primary"
            />
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
    marginBottom: 40,
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
});
