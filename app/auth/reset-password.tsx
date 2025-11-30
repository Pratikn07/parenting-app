import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { THEME } from '@/src/lib/constants';
import { Input } from '@/src/frontend/components/common/Input';
import { supabase } from '@/src/lib/supabase';

export default function ResetPasswordScreen() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

    useEffect(() => {
        // Handle the deep link when user clicks reset link in email
        const handleDeepLink = async () => {
            const url = await Linking.getInitialURL();
            if (url) {
                console.log('Reset password deep link:', url);
                // The URL will contain the access_token and refresh_token
                // Supabase automatically handles this when we call updateUser
            }
        };

        handleDeepLink();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: { newPassword?: string; confirmPassword?: string } = {};

        if (!newPassword) {
            newErrors.newPassword = 'Password is required';
        } else if (newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain a lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain an uppercase letter';
        } else if (!/(?=.*\d)/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain a number';
        } else if (!/(?=.*[@$!%*?&])/.test(newPassword)) {
            newErrors.newPassword = 'Password must contain a symbol (@$!%*?&)';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                throw new Error(error.message);
            }

            Alert.alert(
                'Password Updated',
                'Your password has been successfully updated. You can now log in with your new password.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/auth'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Enter your new password below
                </Text>

                <View style={styles.form}>
                    <Input
                        label="New Password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChangeText={(text) => {
                            setNewPassword(text);
                            if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: undefined }));
                        }}
                        secureTextEntry
                        error={errors.newPassword}
                        helperText={
                            !errors.newPassword
                                ? '8+ characters with uppercase, lowercase, number, and symbol'
                                : undefined
                        }
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }}
                        secureTextEntry
                        error={errors.confirmPassword}
                    />

                    <TouchableOpacity
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Update Password</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.replace('/auth')}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
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
        marginBottom: 32,
    },
    form: {
        gap: 20,
    },
    button: {
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
    buttonText: {
        fontSize: 18,
        fontFamily: THEME.fonts.bodySemiBold,
        color: '#FFFFFF',
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelText: {
        fontSize: 16,
        color: THEME.colors.text.secondary,
        fontFamily: THEME.fonts.body,
    },
});
