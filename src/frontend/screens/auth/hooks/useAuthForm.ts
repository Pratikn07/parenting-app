import { useCallback, useState } from 'react';
import type { AuthFormData } from '@/src/shared/types/auth.types';
import { AuthFormErrors, validateAuthForm } from '../validation';

const EMPTY_FORM: AuthFormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

interface UseAuthFormResult {
  formData: AuthFormData;
  formErrors: AuthFormErrors;
  setField: <K extends keyof AuthFormData>(key: K, value: AuthFormData[K]) => void;
  validate: (isSignIn: boolean) => boolean;
  resetErrors: () => void;
  resetConfirmPassword: () => void;
}

export function useAuthForm(): UseAuthFormResult {
  const [formData, setFormData] = useState<AuthFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<AuthFormErrors>({});

  const setField = useCallback(<K extends keyof AuthFormData>(key: K, value: AuthFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: undefined };
    });
  }, []);

  const validate = useCallback(
    (isSignIn: boolean) => {
      const errors = validateAuthForm(formData, { isSignIn });
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    },
    [formData]
  );

  const resetErrors = useCallback(() => setFormErrors({}), []);

  const resetConfirmPassword = useCallback(() => {
    setFormData((prev) => ({ ...prev, confirmPassword: '' }));
  }, []);

  return { formData, formErrors, setField, validate, resetErrors, resetConfirmPassword };
}
