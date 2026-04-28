import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flower2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { THEME } from '@/src/lib/constants';
import { getAgeInMonths } from '@/src/lib/dateUtils';
import { logger } from '@/src/lib/logger';
import { useAuthStore } from '@/src/shared/stores';
import { useChildStore } from '@/src/shared/stores/childStore';
import { recommendationsService, PersonalizedContent } from '@/src/services';
import { progressService } from '@/src/services/progress/ProgressService';
import { milestonesService } from '@/src/services/milestones/MilestonesService';
import type { MilestoneStats } from '@/src/services/milestones/MilestonesService';
import { supabase } from '@/src/lib/supabase';
import type { Child, MilestoneTemplate, UserMilestoneProgress, UserProgressStats } from '@/src/lib/database.types';

import { ChildSelector } from '@/src/frontend/components/chat/ChildSelector';
import EmergencyButton from './components/EmergencyButton';
import ContextualHeroCard from './components/ContextualHeroCard';
import QuickLogRow from './components/QuickLogRow';
import ProgressRings from './components/ProgressRings';
import MilestoneSpotlight from './components/MilestoneSpotlight';
import WeeklyStats from './components/WeeklyStats';
import MilestoneLogSheet from './components/MilestoneLogSheet';

export default function BloomScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { children, activeChild, activeChildId, setChildren, setActiveChild } = useChildStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null);
  const [milestones, setMilestones] = useState<MilestoneTemplate[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<Map<string, UserMilestoneProgress>>(new Map());
  const [milestoneStats, setMilestoneStats] = useState<MilestoneStats | null>(null);
  const [progressStats, setProgressStats] = useState<UserProgressStats | null>(null);
  const [showMilestoneSheet, setShowMilestoneSheet] = useState(false);

  const loadUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);
      setChildren(childrenData || []);

      const content = await recommendationsService.getPersonalizedContent(user.id);
      setPersonalizedContent(content);

      const stats = await progressService.getCurrentWeekStats(user.id);
      setProgressStats(stats);
    } catch (err) {
      logger.error('Error loading Bloom user data:', err);
    }
  }, [user?.id, setChildren]);

  const loadChildData = useCallback(async (child: Child) => {
    if (!user?.id) return;

    try {
      const relevantMilestones = await milestonesService.getRelevantMilestones(child);
      setMilestones(relevantMilestones);

      const userProgress = await milestonesService.getUserMilestoneProgress(user.id, child.id);
      const progressMap = new Map(userProgress.map((p) => [p.milestone_template_id, p]));
      setMilestoneProgress(progressMap);

      const mStats = await milestonesService.getMilestoneStats(user.id, child.id);
      setMilestoneStats(mStats);
    } catch (err) {
      logger.error('Error loading Bloom child data:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadUserData();
      setIsLoading(false);
    };
    init();
  }, [loadUserData]);

  useEffect(() => {
    if (activeChild) {
      loadChildData(activeChild);
    } else {
      setMilestones([]);
      setMilestoneProgress(new Map());
      setMilestoneStats(null);
    }
  }, [activeChild?.id, loadChildData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadUserData();
    if (activeChild) {
      await loadChildData(activeChild);
    }
    setIsRefreshing(false);
  }, [loadUserData, loadChildData, activeChild]);

  const childName = activeChild?.name || 'Your little one';
  const childAgeMonths = activeChild?.birth_date ? getAgeInMonths(activeChild.birth_date) : null;

  const weeklyMilestones = progressStats?.milestones_completed || 0;
  const weeklyChats = progressStats?.questions_asked || 0;
  const weeklyRecipes = progressStats?.content_saved || 0;

  const handleLogMilestone = () => {
    setShowMilestoneSheet(true);
  };

  const handleLogNote = () => {
    Alert.alert('Quick Note', 'Note capture coming in Phase 3!');
  };

  const handleLogPhoto = () => {
    Alert.alert('Photo Capture', 'Photo capture coming in Phase 3!');
  };

  const handleLogMood = () => {
    Alert.alert('Mood Log', 'Mood tracking coming in Phase 3!');
  };

  const handleMilestoneLogged = () => {
    if (activeChild) {
      loadChildData(activeChild);
    }
  };

  const handleViewAllMilestones = () => {
    setShowMilestoneSheet(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading your journey...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Flower2 size={20} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Bloom</Text>
            <Text style={styles.headerSubtitle}>
              {childName}'s journey{childAgeMonths !== null ? ` · ${childAgeMonths}mo` : ''}
            </Text>
          </View>
        </View>
      </View>

      {children.length > 1 && (
        <ChildSelector
          children={children}
          selectedChildId={activeChildId}
          onSelectChild={setActiveChild}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={THEME.colors.primary}
            colors={[THEME.colors.primary]}
          />
        }
      >
        <EmergencyButton />

        <ContextualHeroCard
          childName={childName}
          childAgeMonths={childAgeMonths}
          dailyTip={personalizedContent?.dailyTip || null}
        />

        <QuickLogRow
          onLogMilestone={handleLogMilestone}
          onLogNote={handleLogNote}
          onLogPhoto={handleLogPhoto}
          onLogMood={handleLogMood}
        />

        <MilestoneSpotlight
          milestones={milestones}
          progress={milestoneProgress}
          onViewAll={handleViewAllMilestones}
        />

        <ProgressRings stats={milestoneStats?.byType || null} />

        <WeeklyStats
          milestonesLogged={weeklyMilestones}
          chatConversations={weeklyChats}
          recipesSaved={weeklyRecipes}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <MilestoneLogSheet
        visible={showMilestoneSheet}
        onClose={() => setShowMilestoneSheet(false)}
        onLogged={handleMilestoneLogged}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: THEME.colors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: THEME.fonts.body,
    color: THEME.colors.text.secondary,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
