import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';

interface SocialButtonProps {
  provider: 'google';
  onPress: () => void;
  text: string;
  icon?: React.ReactNode;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  text,
  icon,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.socialButton,
        styles.googleButton,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon || (
        <View style={styles.defaultIcon}>
          <Text style={styles.defaultIconText}>
            G
          </Text>
        </View>
      )}
      <Text style={[
        styles.socialButtonText,
        styles.googleButtonText,
      ]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  defaultIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#1F2937',
  },
});
