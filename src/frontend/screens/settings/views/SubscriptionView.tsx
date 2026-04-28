import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { ModernCard } from '@/src/frontend/components/common/ModernCard';
import { ModernButton } from '@/src/frontend/components/common/ModernButton';
import { sharedStyles } from '../sharedStyles';

export function SubscriptionView() {
  return (
    <ScrollView style={sharedStyles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.viewTitle}>Subscription</Text>
      <ModernCard style={styles.emptyStateCard}>
        <CreditCard size={48} color="#E07A5F" />
        <Text style={styles.emptyStateTitle}>Premium Plan</Text>
        <Text style={styles.emptyStateDesc}>
          Manage your subscription and billing details here.
        </Text>
        <ModernButton
          title="Manage Subscription"
          onPress={() => {}}
          variant="secondary"
          style={{ marginTop: 16, width: '100%' }}
        />
      </ModernCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyStateCard: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D405B',
  },
  emptyStateDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
});
