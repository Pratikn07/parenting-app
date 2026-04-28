import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '@/src/lib/constants';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { AuthHeader } from './components/AuthHeader';
import { AuthErrorBanner } from './components/AuthErrorBanner';
import { AuthFormFields } from './components/AuthFormFields';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { useAuthForm } from './hooks/useAuthForm';
import { useAuthRedirect } from './hooks/useAuthRedirect';
import { useForgotPassword } from './hooks/useForgotPassword';

export default function AuthScreen() {
  const { login, signup, error, isLoading, clearError } = useAuthStore();
  const { formData, formErrors, setField, validate, resetErrors, resetConfirmPassword } =
    useAuthForm();
  const forgot = useForgotPassword();

  const [isSignIn, setIsSignIn] = useState(true);

  useAuthRedirect();

  const handleEmailAuth = async () => {
    if (!validate(isSignIn)) return;
    clearError();
    try {
      if (isSignIn) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
    } catch (err) {
      console.error('Email auth failed:', err);
    }
  };

  const toggleMode = () => {
    setIsSignIn((prev) => !prev);
    clearError();
    resetErrors();
    resetConfirmPassword();
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
          <AuthHeader isSignIn={isSignIn} onBack={() => router.back()} />

          {error && <AuthErrorBanner message={error} onDismiss={clearError} />}

          <View style={styles.formContainer}>
            <AuthFormFields
              isSignIn={isSignIn}
              formData={formData}
              formErrors={formErrors}
              setField={setField}
            />

            {isSignIn && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => forgot.open(formData.email)}
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
                <Text style={styles.primaryButtonText}>{isSignIn ? 'Log in' : 'Sign up'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignIn ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.footerLink}>{isSignIn ? 'Sign up' : 'Log in'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={forgot.visible}
        email={forgot.email}
        onEmailChange={forgot.setEmail}
        isSubmitting={forgot.isSubmitting}
        onSubmit={forgot.submit}
        onCancel={forgot.close}
      />
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
});
