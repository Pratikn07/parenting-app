import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from '@/src/frontend/components/common/ScreenBackground';
import { useAuthStore } from '@/src/shared/stores/authStore';

import { SettingsHeader } from './components/SettingsHeader';
import { useChildProfile } from './hooks/useChildProfile';
import type { SettingsView } from './types';
import { AccountView } from './views/AccountView';
import { MainView } from './views/MainView';
import { NotificationsView } from './views/NotificationsView';
import { SubscriptionView } from './views/SubscriptionView';

export default function SettingsScreen() {
  const { user } = useAuthStore();
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const { baby } = useChildProfile(user?.id);

  const goToMain = () => setCurrentView('main');

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <SettingsHeader showBack={currentView !== 'main'} onBack={goToMain} />
        <View style={styles.mainContent}>
          {currentView === 'main' && (
            <MainView baby={baby} onNavigate={setCurrentView} />
          )}
          {currentView === 'account' && <AccountView onSave={goToMain} />}
          {currentView === 'notifications' && <NotificationsView />}
          {currentView === 'subscription' && <SubscriptionView />}
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
  mainContent: {
    flex: 1,
  },
});
