import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

interface UseForgotPasswordResult {
  visible: boolean;
  email: string;
  setEmail: (email: string) => void;
  isSubmitting: boolean;
  open: (prefillEmail?: string) => void;
  close: () => void;
  submit: () => Promise<void>;
}

export function useForgotPassword(): UseForgotPasswordResult {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = useCallback((prefillEmail?: string) => {
    if (prefillEmail !== undefined) setEmail(prefillEmail);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const submit = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const { AuthService } = await import('@/src/services/auth/AuthService');
      await AuthService.resetPassword(email);

      Alert.alert(
        'Check Your Email',
        'We have sent a password reset link to your email address.',
        [{ text: 'OK', onPress: () => setVisible(false) }]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email.';
      Alert.alert('Reset Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  return { visible, email, setEmail, isSubmitting, open, close, submit };
}
