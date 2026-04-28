import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Baby, ChevronRight, Edit2, Plus } from 'lucide-react-native';
import { ModernCard } from '@/src/frontend/components/common/ModernCard';
import { useAuthStore } from '@/src/shared/stores/authStore';
import { THEME } from '@/src/lib/constants';
import type { BabyProfile, SettingsView } from '../types';
import { sharedStyles } from '../sharedStyles';

interface MainViewProps {
  baby: BabyProfile;
  onNavigate: (view: SettingsView) => void;
}

export function MainView({ baby, onNavigate }: MainViewProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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
    ]);
  };

  return (
    <ScrollView style={sharedStyles.contentContainer} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.childName}>{baby.name || 'Baby'}</Text>
          </View>

          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => Alert.alert('Add Child', 'Feature coming soon!')}
          >
            <Plus size={24} color="#3D405B" />
            <Text style={styles.addChildText}>Add Child</Text>
          </TouchableOpacity>
        </View>
      </ModernCard>

      <View style={styles.menuList}>
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('account')}>
          <Text style={styles.menuItemText}>Account</Text>
          <ChevronRight size={20} color="#3D405B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('notifications')}>
          <Text style={styles.menuItemText}>Notifications</Text>
          <ChevronRight size={20} color="#3D405B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('subscription')}>
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
}

const styles = StyleSheet.create({
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
    backgroundColor: '#E07A5F',
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
});
