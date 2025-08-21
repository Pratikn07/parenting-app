import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, User, Bell, Heart, Globe, ChevronDown, Search, LogOut, AlertTriangle } from 'lucide-react-native';
import { useAuthStore } from '../../../shared/stores/authStore';

export default function SettingsScreen() {
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyTipsEnabled, setDailyTipsEnabled] = useState(true);
  const [milestoneReminders, setMilestoneReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);
  const [selectedStage, setSelectedStage] = useState('newborn');
  const [selectedFeeding, setSelectedFeeding] = useState('breastfeeding');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You will need to sign in again to access your account.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigate to auth screen
              router.replace('/auth');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(
                'Error',
                'Failed to sign out. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'saved', label: 'Saved Content', icon: Heart },
    { id: 'language', label: 'Language', icon: Globe },
  ];

  const stages = [
    { id: 'expecting', label: 'Expecting' },
    { id: 'newborn', label: 'Newborn (0-3 months)' },
    { id: 'infant', label: 'Infant (3-12 months)' },
  ];

  const feedingOptions = [
    { id: 'breastfeeding', label: 'Breastfeeding' },
    { id: 'formula', label: 'Formula feeding' },
    { id: 'mixed', label: 'Mixed' },
  ];

  const savedItems = [
    {
      id: '1',
      category: 'Sleep',
      source: 'From Chat',
      date: 'Yesterday',
      excerpt: 'Sleep is so important for both you and your baby! At this stage...',
    },
    {
      id: '2',
      category: 'Feeding',
      source: 'From Chat',
      date: '2 days ago',
      excerpt: 'Feeding can feel overwhelming at first, but you\'re giving your baby...',
    },
  ];

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Your name"
            defaultValue={user?.name || ''}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.textInput}
            placeholder="your.email@example.com"
            defaultValue={user?.email || ''}
            keyboardType="email-address"
            editable={false}
            style={[styles.textInput, styles.disabledInput]}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Baby Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Baby Name (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Baby's name"
            defaultValue="Emma"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Birth Date / Due Date</Text>
          <TouchableOpacity style={styles.dateInput}>
            <Text style={styles.dateInputText}>March 15, 2024</Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parenting Stage</Text>
        <View style={styles.segmentedControl}>
          {stages.map((stage) => (
            <TouchableOpacity
              key={stage.id}
              style={[
                styles.segmentButton,
                selectedStage === stage.id && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedStage(stage.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedStage === stage.id && styles.segmentButtonTextActive
              ]}>
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Feeding Preferences</Text>
        <View style={styles.segmentedControl}>
          {feedingOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.segmentButton,
                selectedFeeding === option.id && styles.segmentButtonActive
              ]}
              onPress={() => setSelectedFeeding(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentButtonText,
                selectedFeeding === option.id && styles.segmentButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account Actions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutButtonContent}>
            <LogOut size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </View>
          <AlertTriangle size={16} color="#EF4444" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.logoutHelpText}>
          You'll need to sign in again to access your account and data.
        </Text>
      </View>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Daily Parenting Tips</Text>
            <Text style={styles.settingDescription}>Receive personalized tips based on your baby's age</Text>
          </View>
          <Switch
            value={dailyTipsEnabled}
            onValueChange={setDailyTipsEnabled}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={dailyTipsEnabled ? '#D4635A' : '#F9FAFB'}
          />
        </View>
        {dailyTipsEnabled && (
          <TouchableOpacity style={styles.timeSelector}>
            <Text style={styles.timeSelectorLabel}>Preferred Time</Text>
            <Text style={styles.timeSelectorValue}>9:00 AM</Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Milestone Reminders</Text>
            <Text style={styles.settingDescription}>Get notified about upcoming developmental milestones</Text>
          </View>
          <Switch
            value={milestoneReminders}
            onValueChange={setMilestoneReminders}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={milestoneReminders ? '#D4635A' : '#F9FAFB'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Summary</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Weekly Digest</Text>
            <Text style={styles.settingDescription}>Summary of your week's progress and insights</Text>
          </View>
          <Switch
            value={weeklyDigest}
            onValueChange={setWeeklyDigest}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={weeklyDigest ? '#D4635A' : '#F9FAFB'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Alerts</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>Safety & Health Alerts</Text>
            <Text style={styles.settingDescription}>Critical safety information and health updates</Text>
          </View>
          <Switch
            value={safetyAlerts}
            onValueChange={setSafetyAlerts}
            trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
            thumbColor={safetyAlerts ? '#D4635A' : '#F9FAFB'}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Save Notification Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSavedTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {['All', 'Sleep', 'Feeding', 'Activities', 'Health'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedCategory === filter && styles.filterChipActive
            ]}
            onPress={() => setSelectedCategory(filter)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedCategory === filter && styles.filterChipTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your saved content..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.savedItemsList}>
        {savedItems.map((item) => (
          <View key={item.id} style={styles.savedItemCard}>
            <View style={styles.savedItemHeader}>
              <View style={styles.savedItemBadges}>
                <View style={[styles.categoryPill, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={styles.categoryPillText}>{item.category}</Text>
                </View>
                <Text style={styles.savedItemSource}>{item.source}</Text>
              </View>
              <Text style={styles.savedItemDate}>{item.date}</Text>
            </View>
            <Text style={styles.savedItemExcerpt}>{item.excerpt}</Text>
            <View style={styles.savedItemActions}>
              <TouchableOpacity style={styles.savedItemAction} activeOpacity={0.7}>
                <Text style={styles.savedItemActionText}>View Original</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.savedItemAction} activeOpacity={0.7}>
                <Text style={styles.savedItemActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.savedItemAction} activeOpacity={0.7}>
                <Text style={[styles.savedItemActionText, styles.deleteAction]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderLanguageTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Language</Text>
        <TouchableOpacity style={styles.languageSelector}>
          <Text style={styles.languageSelectorLabel}>Language</Text>
          <View style={styles.languageSelectorRight}>
            <Text style={styles.languageSelectorValue}>{selectedLanguage}</Text>
            <ChevronDown size={20} color="#6B7280" strokeWidth={2} />
          </View>
        </TouchableOpacity>
        <Text style={styles.helperText}>
          This will change both the interface language and the language of responses from your chat companion.
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Save Language Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'saved':
        return renderSavedTab();
      case 'language':
        return renderLanguageTab();
      default:
        return renderProfileTab();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Sleep: '#F0E6FF',
      Feeding: '#FFE5D9',
      Activities: '#E8F5E8',
      Health: '#FEF3E2',
    };
    return colors[category as keyof typeof colors] || '#F3F4F6';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.tabActive
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <tab.icon 
                size={16} 
                color={activeTab === tab.id ? "#FFFFFF" : "#6B7280"} 
                strokeWidth={2} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF7F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabActive: {
    backgroundColor: '#D4635A',
    borderColor: '#D4635A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1F2937',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  segmentButtonTextActive: {
    color: '#1F2937',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  timeSelectorLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  timeSelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D4635A',
    marginRight: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingRight: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#8BA888', // Warm sage green that complements coral theme
    borderColor: '#8BA888', // Warm sage green that complements coral theme
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  savedItemsList: {
    gap: 16,
  },
  savedItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  savedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedItemBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  savedItemSource: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  savedItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  savedItemExcerpt: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  savedItemActions: {
    flexDirection: 'row',
    gap: 16,
  },
  savedItemAction: {
    paddingVertical: 4,
  },
  savedItemActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D4635A',
  },
  deleteAction: {
    color: '#EF4444',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  languageSelectorLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  languageSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSelectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#D4635A',
    marginRight: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#D4635A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: '#D4635A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
  },
  logoutHelpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
