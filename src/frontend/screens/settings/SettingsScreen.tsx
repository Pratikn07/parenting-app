import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronRight,
  ChevronLeft,
  LogOut,
  Plus,
  Edit2,
  User,
  Bell,
  CreditCard,
  Baby,
  Calendar,
  Mail,
  ChevronDown
} from 'lucide-react-native';
import { useAuthStore } from '../../../shared/stores/authStore';
import { supabase } from '../../../lib/supabase';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { ModernCard } from '../../components/common/ModernCard';
import { ModernButton } from '../../components/common/ModernButton';
import { THEME } from '../../../lib/constants';

type SettingsView = 'main' | 'account' | 'notifications' | 'subscription';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [currentView, setCurrentView] = useState<SettingsView>('main');

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyTipsEnabled, setDailyTipsEnabled] = useState(true);
  const [milestoneReminders, setMilestoneReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [selectedStage, setSelectedStage] = useState('newborn');
  const [selectedFeeding, setSelectedFeeding] = useState('breastfeeding');

  const [babyName, setBabyName] = useState('');
  const [babyDob, setBabyDob] = useState<string | null>(null);

  useEffect(() => {
    const fetchBaby = async () => {
      try {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from('children')
          .select('name,date_of_birth')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          setBabyName(data.name || '');
          setBabyDob(data.date_of_birth || null);
        }
      } catch (e) {
        console.log('Fetch baby error:', e);
      }
    };
    fetchBaby();
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/launch');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const stages = [
    { id: 'expecting', label: 'Expecting' },
    { id: 'newborn', label: 'Newborn' },
    { id: 'infant', label: 'Infant' },
  ];

  const feedingOptions = [
    { id: 'breastfeeding', label: 'Breastfeeding' },
    { id: 'formula', label: 'Formula' },
    { id: 'mixed', label: 'Mixed' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      {currentView === 'main' ? (
        <View style={styles.headerSpacer} />
      ) : (
        <TouchableOpacity onPress={() => setCurrentView('main')} style={styles.backButton}>
          <ChevronLeft size={24} color="#3D405B" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMainView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'PN'}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Edit2 size={16} color="#3D405B" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name || 'Pratik Nandoskar'}</Text>
      </View>

      <ModernCard style={styles.familyCard}>
        <Text style={styles.cardTitle}>My Family</Text>
        <View style={styles.familyRow}>
          <View style={styles.childAvatarContainer}>
            <View style={styles.childAvatar}>
              <Baby size={24} color="#E07A5F" />
            </View>
            <Text style={styles.childName}>{babyName || 'Baby'}</Text>
          </View>

          <TouchableOpacity style={styles.addChildButton} onPress={() => Alert.alert('Add Child', 'Feature coming soon!')}>
            <Plus size={24} color="#3D405B" />
            <Text style={styles.addChildText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </ModernCard>

      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('account')}>
          <Text style={styles.menuItemText}>Account</Text>
          <ChevronRight size={20} color="#3D405B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('notifications')}>
          <Text style={styles.menuItemText}>Notifications</Text>
          <ChevronRight size={20} color="#3D405B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setCurrentView('subscription')}>
          <Text style={styles.menuItemText}>Subscription</Text>
          <ChevronRight size={20} color="#3D405B" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderAccountView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.viewTitle}>Account</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      <ModernCard style={styles.card}>
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <User size={20} color="#9CA3AF" />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              defaultValue={user?.name || ''}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Mail size={20} color="#9CA3AF" />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              placeholder="Email"
              defaultValue={user?.email || ''}
              editable={false}
            />
          </View>
        </View>
      </ModernCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Parenting Stage</Text>
      </View>
      <View style={styles.chipContainer}>
        {stages.map((stage) => (
          <TouchableOpacity
            key={stage.id}
            style={[styles.chip, selectedStage === stage.id && styles.chipActive]}
            onPress={() => setSelectedStage(stage.id)}
          >
            <Text style={[styles.chipText, selectedStage === stage.id && styles.chipTextActive]}>
              {stage.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Feeding Preferences</Text>
      </View>
      <View style={styles.chipContainer}>
        {feedingOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.chip, selectedFeeding === option.id && styles.chipActive]}
            onPress={() => setSelectedFeeding(option.id)}
          >
            <Text style={[styles.chipText, selectedFeeding === option.id && styles.chipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ModernButton
        title="Save Changes"
        onPress={() => setCurrentView('main')}
        variant="primary"
        style={{ marginTop: 24, marginBottom: 40 }}
      />
    </ScrollView>
  );

  const renderNotificationsView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.viewTitle}>Notifications</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
      </View>

      <ModernCard style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily Parenting Tips</Text>
            <Text style={styles.settingDesc}>Receive personalized tips every morning</Text>
          </View>
          <Switch
            value={dailyTipsEnabled}
            onValueChange={setDailyTipsEnabled}
            trackColor={{ false: '#E5E7EB', true: '#E07A5F' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        {dailyTipsEnabled && (
          <>
            <View style={styles.divider} />
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

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Milestone Reminders</Text>
            <Text style={styles.settingDesc}>Get notified when it's time for a check-in</Text>
          </View>
          <Switch
            value={milestoneReminders}
            onValueChange={setMilestoneReminders}
            trackColor={{ false: '#E5E7EB', true: '#E07A5F' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </ModernCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Email Notifications</Text>
      </View>

      <ModernCard style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Weekly Digest</Text>
            <Text style={styles.settingDesc}>A summary of your baby's progress</Text>
          </View>
          <Switch
            value={weeklyDigest}
            onValueChange={setWeeklyDigest}
            trackColor={{ false: '#E5E7EB', true: '#E07A5F' }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor="#E5E7EB"
          />
        </View>
      </ModernCard>
    </ScrollView>
  );

  const renderSubscriptionView = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.viewTitle}>Subscription</Text>
      <ModernCard style={styles.emptyStateCard}>
        <CreditCard size={48} color="#E07A5F" />
        <Text style={styles.emptyStateTitle}>Premium Plan</Text>
        <Text style={styles.emptyStateDesc}>Manage your subscription and billing details here.</Text>
        <ModernButton
          title="Manage Subscription"
          onPress={() => { }}
          variant="secondary"
          style={{ marginTop: 16, width: '100%' }}
        />
      </ModernCard>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        <View style={styles.mainContent}>
          {currentView === 'main' && renderMainView()}
          {currentView === 'account' && renderAccountView()}
          {currentView === 'notifications' && renderNotificationsView()}
          {currentView === 'subscription' && renderSubscriptionView()}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    height: 44,
    justifyContent: 'center',
  },
  headerSpacer: {
    height: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#81B29A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  familyCard: {
    padding: 20,
    marginBottom: 24,
    borderRadius: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D405B',
    marginBottom: 16,
  },
  familyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  childAvatarContainer: {
    alignItems: 'center',
    gap: 4,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FDF2F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childName: {
    fontSize: 12,
    color: '#3D405B',
    fontWeight: '500',
  },
  addChildButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addChildText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D405B',
  },
  menuList: {
    gap: 16,
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#3D405B',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#E07A5F', // Red/Pinkish
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#E07A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D405B',
    marginBottom: 24,
    marginTop: 8,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    color: '#3D405B',
    fontWeight: '500',
    padding: 0,
  },
  disabledInput: {
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  chipText: {
    fontSize: 14,
    color: '#3D405B',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
  },
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
