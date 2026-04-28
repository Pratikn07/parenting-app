import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { ModernCard } from '@/src/frontend/components/common/ModernCard';
import { sharedStyles } from '../sharedStyles';

const SWITCH_TRACK = { false: '#E5E7EB', true: '#E07A5F' };

export function NotificationsView() {
  const [dailyTipsEnabled, setDailyTipsEnabled] = useState(true);
  const [milestoneReminders, setMilestoneReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <ScrollView style={sharedStyles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={sharedStyles.viewTitle}>Notifications</Text>

      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Push Notifications</Text>
      </View>

      <ModernCard style={sharedStyles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Parenting Tips</Text>
            <Text style={styles.settingDesc}>Receive personalized tips every morning</Text>
          </View>
          <Switch
            value={dailyTipsEnabled}
            onValueChange={setDailyTipsEnabled}
            trackColor={SWITCH_TRACK}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {dailyTipsEnabled && (
          <>
            <View style={sharedStyles.divider} />
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Delivery Time</Text>
              </View>
              <View style={styles.timeSelector}>
                <Text style={styles.timeText}>9:00 AM</Text>
                <ChevronDown size={16} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={sharedStyles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Milestone Reminders</Text>
            <Text style={styles.settingDesc}>Get notified when it's time for a check-in</Text>
          </View>
          <Switch
            value={milestoneReminders}
            onValueChange={setMilestoneReminders}
            trackColor={SWITCH_TRACK}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </ModernCard>

      <View style={sharedStyles.sectionHeader}>
        <Text style={sharedStyles.sectionTitle}>Email Notifications</Text>
      </View>

      <ModernCard style={sharedStyles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Weekly Digest</Text>
            <Text style={styles.settingDesc}>A summary of your baby's progress</Text>
          </View>
          <Switch
            value={weeklyDigest}
            onValueChange={setWeeklyDigest}
            trackColor={SWITCH_TRACK}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </ModernCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D405B',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D405B',
  },
});
