import React from 'react';
import { View } from 'react-native';
import { Input } from '@/src/frontend/components/common/Input';
import type { AuthFormData } from '@/src/shared/types/auth.types';
import { AuthFormErrors, PASSWORD_HELPER_TEXT } from '../validation';

interface AuthFormFieldsProps {
  isSignIn: boolean;
  formData: AuthFormData;
  formErrors: AuthFormErrors;
  setField: <K extends keyof AuthFormData>(key: K, value: AuthFormData[K]) => void;
}

export function AuthFormFields({
  isSignIn,
  formData,
  formErrors,
  setField,
}: AuthFormFieldsProps) {
  return (
    <>
      {!isSignIn && (
        <View>
          <Input
            label="Your name"
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text) => setField('name', text)}
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
          onChangeText={(text) => setField('email', text)}
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
          onChangeText={(text) => setField('password', text)}
          secureTextEntry
          error={formErrors.password}
          helperText={!isSignIn && !formErrors.password ? PASSWORD_HELPER_TEXT : undefined}
        />
      </View>

      {!isSignIn && (
        <View>
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={formData.confirmPassword || ''}
            onChangeText={(text) => setField('confirmPassword', text)}
            secureTextEntry
            error={formErrors.confirmPassword}
          />
        </View>
      )}
    </>
  );
}
