import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronRight,
  ChevronDown,
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  MessageCircle,
  Heart,
  Sparkles,
  BarChart3,
  Calendar,
  Bookmark,
  BookOpen,
  Lightbulb,
  Search,
  X,
  PlayCircle,
  Award,
  ArrowRight,
  Plus,
  Baby,
  Circle,
} from 'lucide-react-native';
import { useAuthStore } from '../../../shared/stores';
import { 
  recommendationsService, 
  PersonalizedContent,
  MilestoneService,
  MilestonesBySection,
  MilestoneProgress,
  MilestoneTemplateWithStatus,
  ProgressService,
  ProgressStats,
  DateRange,
  DatePreset,
} from '../../../services';
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { ModernCard } from '../../components/common/ModernCard';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { THEME } from '../../../lib/constants';
import { Child, MilestoneType } from '../../../lib/database.types';

const { width } = Dimensions.get('window');

// Category filter type that includes 'All'
type CategoryFilter = 'All' | 'Physical' | 'Cognitive' | 'Social' | 'Communication';

export default function ResourcesScreen() {
  const [activeTab, setActiveTab] = useState('nextsteps');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  // Personalized content state
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Milestone state
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [milestoneData, setMilestoneData] = useState<MilestonesBySection | null>(null);
  const [milestoneProgress, setMilestoneProgress] = useState<MilestoneProgress | null>(null);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [milestonesError, setMilestonesError] = useState<string | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'past' | 'current' | 'upcoming'>('current');

  // Custom milestone modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customMilestone, setCustomMilestone] = useState({
    title: '',
    description: '',
    category: 'physical' as MilestoneType,
  });

  // Progress tab state
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>('week');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Saved articles state
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());

  const { user } = useAuthStore();

  // Load children on mount
  useEffect(() => {
    if (user?.id) {
      loadChildren();
    }
  }, [user?.id]);

  // Load personalized content when nextsteps tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'nextsteps') {
      loadPersonalizedContent();
    }
  }, [user?.id, activeTab]);

  // Load milestones when milestones tab is active and child is selected
  useEffect(() => {
    if (activeTab === 'milestones' && selectedChild?.id) {
      loadMilestones();
    }
  }, [activeTab, selectedChild?.id]);

  // Load progress stats when progress tab is active
  useEffect(() => {
    if (user?.id && activeTab === 'progress') {
      loadProgressStats();
    }
  }, [user?.id, activeTab, datePreset, customDateRange]);

  const loadProgressStats = async () => {
    if (!user?.id) return;
    setProgressLoading(true);
    try {
      // Get date range based on preset or custom range
      const dateRange = datePreset === 'custom' 
        ? customDateRange 
        : ProgressService.getDateRangeFromPreset(datePreset);
      
      const stats = await ProgressService.getProgressStats(user.id, dateRange);
      setProgressStats(stats);
    } catch (err) {
      console.error('Error loading progress stats:', err);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
  };

  const handleCustomDateRangeChange = (range: DateRange) => {
    setCustomDateRange(range);
  };

  // Load saved articles status when personalized content loads
  useEffect(() => {
    if (user?.id && personalizedContent?.recommendedArticles) {
      loadSavedArticlesStatus();
    }
  }, [user?.id, personalizedContent?.recommendedArticles]);

  const loadSavedArticlesStatus = async () => {
    if (!user?.id || !personalizedContent?.recommendedArticles) return;
    try {
      const articleIds = personalizedContent.recommendedArticles.map(a => a.id);
      const savedStatus = await ProgressService.getArticlesSavedStatus(user.id, articleIds);
      const savedIds = new Set(
        Object.entries(savedStatus)
          .filter(([_, isSaved]) => isSaved)
          .map(([id]) => id)
      );
      setSavedArticleIds(savedIds);
    } catch (err) {
      console.error('Error loading saved articles status:', err);
    }
  };

  const handleToggleSaveArticle = async (articleId: string) => {
    if (!user?.id) return;
    try {
      const result = await ProgressService.toggleSaveArticle(user.id, articleId);
      setSavedArticleIds(prev => {
        const newSet = new Set(prev);
        if (result.saved) {
          newSet.add(articleId);
        } else {
          newSet.delete(articleId);
        }
        return newSet;
      });
      // Refresh progress stats if on progress tab
      if (activeTab === 'progress') {
        loadProgressStats();
      }
    } catch (err) {
      console.error('Error toggling save article:', err);
      Alert.alert('Error', 'Failed to save article');
    }
  };

  const loadChildren = async () => {
    if (!user?.id) return;
    try {
      const childrenData = await MilestoneService.getChildrenForUser(user.id);
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0]);
      }
    } catch (err) {
      console.error('Error loading children:', err);
    }
  };

  const loadPersonalizedContent = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const content = await recommendationsService.getPersonalizedContent(user.id);
      setPersonalizedContent(content);
    } catch (err) {
      console.error('Error loading personalized content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMilestones = async () => {
    if (!selectedChild?.id) return;
    setMilestonesLoading(true);
    setMilestonesError(null);
    try {
      const [sections, progress] = await Promise.all([
        MilestoneService.getMilestonesBySection(selectedChild.id),
        MilestoneService.getMilestoneProgress(selectedChild.id),
      ]);
      setMilestoneData(sections);
      setMilestoneProgress(progress);
    } catch (err) {
      console.error('Error loading milestones:', err);
      setMilestonesError(err instanceof Error ? err.message : 'Failed to load milestones');
    } finally {
      setMilestonesLoading(false);
    }
  };

  const handleCompleteTip = async () => {
    if (!user?.id || !personalizedContent?.dailyTip) return;
    try {
      await recommendationsService.completeTip(user.id, personalizedContent.dailyTip.id);
      await loadPersonalizedContent();
    } catch (err) {
      console.error('Error completing tip:', err);
      setError('Failed to complete tip');
    }
  };

  const handleSkipTip = async () => {
    if (!user?.id || !personalizedContent?.dailyTip) return;
    try {
      await recommendationsService.skipTip(user.id, personalizedContent.dailyTip.id);
      await loadPersonalizedContent();
    } catch (err) {
      console.error('Error skipping tip:', err);
      setError('Failed to skip tip');
    }
  };

  const handleToggleMilestone = async (milestone: MilestoneTemplateWithStatus) => {
    if (!selectedChild?.id) return;
    
    try {
      if (milestone.isCompleted && milestone.milestoneId) {
        // Unmark milestone
        await MilestoneService.unmarkMilestone(milestone.milestoneId);
      } else {
        // Mark milestone complete
        await MilestoneService.markMilestoneComplete(selectedChild.id, milestone.id);
      }
      // Reload milestones
      await loadMilestones();
    } catch (err) {
      console.error('Error toggling milestone:', err);
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  const handleAddCustomMilestone = async () => {
    if (!selectedChild?.id || !customMilestone.title.trim()) return;
    
    try {
      await MilestoneService.addCustomMilestone(selectedChild.id, {
        title: customMilestone.title,
        description: customMilestone.description || undefined,
        milestone_type: customMilestone.category,
        achieved_at: new Date().toISOString(),
      });
      setShowCustomModal(false);
      setCustomMilestone({ title: '', description: '', category: 'physical' });
      await loadMilestones();
    } catch (err) {
      console.error('Error adding custom milestone:', err);
      Alert.alert('Error', 'Failed to add milestone');
    }
  };

  // Map category filter to milestone type
  const getCategoryType = (filter: CategoryFilter): MilestoneType | null => {
    const mapping: Record<CategoryFilter, MilestoneType | null> = {
      'All': null,
      'Physical': 'physical',
      'Cognitive': 'cognitive',
      'Social': 'social',
      'Communication': 'emotional',
    };
    return mapping[filter];
  };

  // Filter milestones by category
  const filterByCategory = (milestones: MilestoneTemplateWithStatus[]): MilestoneTemplateWithStatus[] => {
    if (selectedCategory === 'All') return milestones;
    const categoryType = getCategoryType(selectedCategory);
    return milestones.filter(m => m.category === categoryType);
  };

  const tabs = [
    { id: 'nextsteps', label: 'For You', icon: Sparkles },
    { id: 'milestones', label: 'Milestones', icon: TrendingUp },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  const milestoneCategories: CategoryFilter[] = ['All', 'Physical', 'Cognitive', 'Social', 'Communication'];

  // Dynamic progress stats with 5 categories
  const dynamicProgressStats = [
    { label: 'Questions', value: progressStats?.questionsAsked || 0, icon: MessageCircle, color: '#E07A5F' },
    { label: 'Articles', value: progressStats?.articlesRead || 0, icon: BookOpen, color: '#3D405B' },
    { label: 'Tips', value: progressStats?.tipsViewed || 0, icon: Lightbulb, color: '#81B29A' },
    { label: 'Saved', value: progressStats?.savedArticles || 0, icon: Bookmark, color: '#F2CC8F' },
    { label: 'Milestones', value: progressStats?.milestonesCompleted || 0, icon: Award, color: '#8BA888' },
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resources</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          >
            <tab.icon
              size={16}
              color={activeTab === tab.id ? "#FFFFFF" : "#1F2937"}
              style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}
            />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNextStepsTab = () => {
    const dailyTip = personalizedContent?.dailyTip;
    const recommendedArticles = personalizedContent?.recommendedArticles || [];

    return (
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.greeting}>Today's Focus</Text>
          <Text style={styles.subGreeting}>Personalized just for you</Text>
        </View>

        {isLoading ? (
          <ModernCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#E07A5F" />
            <Text style={styles.loadingText}>Curating your content...</Text>
          </ModernCard>
        ) : error ? (
          <ModernCard style={styles.errorCard}>
            <Text style={styles.errorText}>Unable to load content</Text>
            <TouchableOpacity onPress={loadPersonalizedContent} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </ModernCard>
        ) : dailyTip ? (
          <ModernCard style={styles.featuredCard}>
            <View style={styles.featuredHeader}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{dailyTip.category}</Text>
              </View>
              <View style={styles.timeTag}>
                <Clock size={12} color="#666" />
                <Text style={styles.timeText}>2 min read</Text>
              </View>
            </View>

            <Text style={styles.featuredTitle}>{dailyTip.title}</Text>
            <Text style={styles.featuredDescription}>{dailyTip.description}</Text>

            {dailyTip.quick_tips && (
              <View style={styles.quickTipsContainer}>
                {dailyTip.quick_tips.map((tip, index) => (
                  <View key={index} style={styles.quickTipRow}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.quickTipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.featuredFooter}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCompleteTip}
              >
                <CheckCircle size={18} color="#FFF" />
                <Text style={styles.primaryButtonText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSkipTip}
              >
                <Text style={styles.secondaryButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>
          </ModernCard>
        ) : null}

        {recommendedArticles.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Recommended</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recommendedArticles.map((article) => {
                const isSaved = savedArticleIds.has(article.id);
                return (
                  <TouchableOpacity key={article.id} activeOpacity={0.9}>
                    <ModernCard style={styles.articleCard}>
                      <View style={styles.articleImagePlaceholder}>
                        <PlayCircle size={32} color="#E07A5F" />
                        {/* Bookmark Button */}
                        <TouchableOpacity
                          style={styles.bookmarkButton}
                          onPress={() => handleToggleSaveArticle(article.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Bookmark
                            size={20}
                            color={isSaved ? '#E07A5F' : '#FFFFFF'}
                            fill={isSaved ? '#E07A5F' : 'transparent'}
                          />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.articleContent}>
                        <Text style={styles.articleCategory}>{article.category}</Text>
                        <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
                        <View style={styles.articleFooter}>
                          <Text style={styles.articleReason} numberOfLines={1}>
                            {article.recommendationReason}
                          </Text>
                        </View>
                      </View>
                    </ModernCard>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderMilestoneSection = (
    title: string,
    sectionKey: 'past' | 'current' | 'upcoming',
    milestones: MilestoneTemplateWithStatus[],
    color: string
  ) => {
    const filtered = filterByCategory(milestones);
    const isExpanded = expandedSection === sectionKey;
    const completedCount = filtered.filter(m => m.isCompleted).length;

    if (filtered.length === 0) return null;

    return (
      <View style={styles.milestoneSection}>
        <TouchableOpacity
          style={styles.sectionHeaderRow}
          onPress={() => setExpandedSection(isExpanded ? 'current' : sectionKey)}
        >
          <View style={[styles.sectionIndicator, { backgroundColor: color }]} />
          <Text style={styles.sectionHeaderText}>{title}</Text>
          <Text style={styles.sectionCount}>
            {completedCount}/{filtered.length}
          </Text>
          <ChevronDown
            size={20}
            color="#6B7280"
            style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.milestoneList}>
            {filtered.map((milestone) => (
              <ModernCard key={milestone.id} style={styles.milestoneItem}>
                <TouchableOpacity
                  style={styles.milestoneRow}
                  onPress={() => handleToggleMilestone(milestone)}
                >
                  <View style={[
                    styles.checkbox,
                    milestone.isCompleted && styles.checkboxChecked
                  ]}>
                    {milestone.isCompleted && <CheckCircle size={16} color="#FFF" />}
                  </View>
                  <View style={styles.milestoneContent}>
                    <Text style={[
                      styles.milestoneTitle,
                      milestone.isCompleted && styles.milestoneTitleCompleted
                    ]}>{milestone.title}</Text>
                    <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                    <View style={styles.milestoneMetaRow}>
                      <View style={[
                        styles.categoryBadge,
                        { backgroundColor: `${MilestoneService.getCategoryColor(milestone.category)}20` }
                      ]}>
                        <Text style={[
                          styles.categoryBadgeText,
                          { color: MilestoneService.getCategoryColor(milestone.category) }
                        ]}>
                          {MilestoneService.getCategoryDisplayName(milestone.category)}
                        </Text>
                      </View>
                      <Text style={styles.ageRange}>
                        {MilestoneService.getAgeRangeDisplay(milestone.age_min_months, milestone.age_max_months)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </ModernCard>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMilestonesTab = () => {
    if (children.length === 0) {
      return (
        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ModernCard style={styles.emptyStateCard}>
            <Baby size={48} color="#E07A5F" />
            <Text style={styles.emptyStateTitle}>No Children Added</Text>
            <Text style={styles.emptyStateText}>
              Add a child in your profile to start tracking developmental milestones.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.emptyStateButtonText}>Go to Settings</Text>
            </TouchableOpacity>
          </ModernCard>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Child Picker */}
        {children.length > 1 && (
          <TouchableOpacity
            style={styles.childPicker}
            onPress={() => setShowChildPicker(true)}
          >
            <Baby size={20} color="#E07A5F" />
            <Text style={styles.childPickerText}>
              {selectedChild?.name || 'Select Child'}
            </Text>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>
        )}

        {/* Progress Overview Card */}
        <ModernCard style={styles.progressOverviewCard}>
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercentage}>
                {milestoneProgress?.percentage || 0}%
              </Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>Development Tracker</Text>
              <Text style={styles.progressSubtitle}>
                {milestoneProgress?.completed || 0} of {milestoneProgress?.total || 0} milestones achieved
              </Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${milestoneProgress?.percentage || 0}%` }]} />
          </View>
        </ModernCard>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {milestoneCategories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setSelectedCategory(category)}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {milestonesLoading ? (
          <ModernCard style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#E07A5F" />
            <Text style={styles.loadingText}>Loading milestones...</Text>
          </ModernCard>
        ) : milestonesError ? (
          <ModernCard style={styles.errorCard}>
            <Text style={styles.errorText}>{milestonesError}</Text>
            <TouchableOpacity onPress={loadMilestones} style={styles.retryButton}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </ModernCard>
        ) : milestoneData ? (
          <>
            {/* Milestone Sections */}
            {renderMilestoneSection('Current Age', 'current', milestoneData.current, '#81B29A')}
            {renderMilestoneSection('Past Milestones', 'past', milestoneData.past, '#6B7280')}
            {renderMilestoneSection('Coming Up', 'upcoming', milestoneData.upcoming, '#F2CC8F')}

            {/* Custom Milestones */}
            {milestoneData.custom.length > 0 && (
              <View style={styles.milestoneSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionIndicator, { backgroundColor: '#E07A5F' }]} />
                  <Text style={styles.sectionHeaderText}>Custom Milestones</Text>
                  <Text style={styles.sectionCount}>{milestoneData.custom.length}</Text>
                </View>
                <View style={styles.milestoneList}>
                  {milestoneData.custom.map((milestone) => (
                    <ModernCard key={milestone.id} style={styles.milestoneItem}>
                      <View style={styles.milestoneRow}>
                        <View style={[styles.checkbox, styles.checkboxChecked]}>
                          <CheckCircle size={16} color="#FFF" />
                        </View>
                        <View style={styles.milestoneContent}>
                          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                          {milestone.description && (
                            <Text style={styles.milestoneDesc}>{milestone.description}</Text>
                          )}
                        </View>
                      </View>
                    </ModernCard>
                  ))}
                </View>
              </View>
            )}

            {/* Add Custom Milestone Button */}
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={() => setShowCustomModal(true)}
            >
              <Plus size={20} color="#E07A5F" />
              <Text style={styles.addCustomButtonText}>Add Custom Milestone</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    );
  };

  const renderProgressTab = () => {
    const getDateRangeLabel = (): string => {
      if (datePreset === 'custom' && customDateRange) {
        return ProgressService.formatDateRange(customDateRange);
      }
      return ProgressService.getPresetLabel(datePreset);
    };

    const getTotalActivity = (): number => {
      if (!progressStats) return 0;
      return (
        progressStats.questionsAsked +
        progressStats.articlesRead +
        progressStats.tipsViewed +
        progressStats.savedArticles +
        progressStats.milestonesCompleted
      );
    };

    return (
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.greeting}>Your Progress</Text>
          <Text style={styles.subGreeting}>
            {progressLoading 
              ? 'Loading stats...' 
              : getTotalActivity() > 0
                ? "You're doing great, keep it up!"
                : "Start exploring to track your progress!"}
          </Text>
        </View>

        {/* Date Range Filter */}
        <DateRangeFilter
          selectedPreset={datePreset}
          customRange={customDateRange}
          onPresetChange={handleDatePresetChange}
          onCustomRangeChange={handleCustomDateRangeChange}
        />

        {/* Loading State */}
        {progressLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : (
          <>
            {/* Stats Grid - 5 items */}
            <View style={styles.statsGrid}>
              {dynamicProgressStats.map((stat, index) => (
                <ModernCard key={index} style={styles.statItem}>
                  <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                    <stat.icon size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </ModernCard>
              ))}
            </View>

            {/* Category Progress */}
            {milestoneProgress && (
              <ModernCard style={styles.categoryProgressCard}>
                <Text style={styles.categoryProgressTitle}>Milestone Progress by Category</Text>
                {Object.entries(milestoneProgress.byCategory).map(([category, data]) => (
                  <View key={category} style={styles.categoryProgressRow}>
                    <View style={styles.categoryProgressLabel}>
                      <View style={[
                        styles.categoryDot,
                        { backgroundColor: MilestoneService.getCategoryColor(category as MilestoneType) }
                      ]} />
                      <Text style={styles.categoryProgressText}>
                        {MilestoneService.getCategoryDisplayName(category as MilestoneType)}
                      </Text>
                    </View>
                    <View style={styles.categoryProgressBar}>
                      <View 
                        style={[
                          styles.categoryProgressFill,
                          { 
                            width: data.total > 0 ? `${(data.completed / data.total) * 100}%` : '0%',
                            backgroundColor: MilestoneService.getCategoryColor(category as MilestoneType) 
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.categoryProgressValue}>
                      {data.completed}/{data.total}
                    </Text>
                  </View>
                ))}
              </ModernCard>
            )}

            {/* Insight Card */}
            <ModernCard style={styles.insightCard}>
              <View style={styles.insightHeader}>
                <Sparkles size={20} color="#E07A5F" />
                <Text style={styles.insightTitle}>
                  {datePreset === 'all' ? 'Overall Insight' : `${getDateRangeLabel()} Insight`}
                </Text>
              </View>
              <Text style={styles.insightText}>
                {getTotalActivity() > 0
                  ? `Great job! You've had ${getTotalActivity()} interactions${datePreset !== 'all' ? ` in the ${getDateRangeLabel().toLowerCase()}` : ''}. ${
                      progressStats && progressStats.questionsAsked > 0 
                        ? `You asked ${progressStats.questionsAsked} question${progressStats.questionsAsked !== 1 ? 's' : ''} - keep learning!`
                        : progressStats && progressStats.milestonesCompleted > 0
                          ? `You tracked ${progressStats.milestonesCompleted} milestone${progressStats.milestonesCompleted !== 1 ? 's' : ''} - celebrate those moments!`
                          : 'Keep exploring and tracking your parenting journey!'
                    }`
                  : "Start exploring resources and tracking milestones to see personalized insights here."}
              </Text>
              <TouchableOpacity style={styles.insightAction} onPress={() => setActiveTab('milestones')}>
                <Text style={styles.insightActionText}>View Milestones</Text>
                <ArrowRight size={16} color="#E07A5F" />
              </TouchableOpacity>
            </ModernCard>
          </>
        )}
      </ScrollView>
    );
  };

  // Custom Milestone Modal
  const renderCustomMilestoneModal = () => (
    <Modal
      visible={showCustomModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCustomModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Custom Milestone</Text>
            <TouchableOpacity onPress={() => setShowCustomModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g., First word - 'mama'"
              placeholderTextColor="#9CA3AF"
              value={customMilestone.title}
              onChangeText={(text) => setCustomMilestone(prev => ({ ...prev, title: text }))}
            />

            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Add details about this milestone..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={customMilestone.description}
              onChangeText={(text) => setCustomMilestone(prev => ({ ...prev, description: text }))}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categorySelectRow}>
              {(['physical', 'cognitive', 'social', 'emotional'] as MilestoneType[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categorySelectChip,
                    customMilestone.category === cat && styles.categorySelectChipActive,
                    customMilestone.category === cat && { borderColor: MilestoneService.getCategoryColor(cat) }
                  ]}
                  onPress={() => setCustomMilestone(prev => ({ ...prev, category: cat }))}
                >
                  <Text style={[
                    styles.categorySelectText,
                    customMilestone.category === cat && { color: MilestoneService.getCategoryColor(cat) }
                  ]}>
                    {MilestoneService.getCategoryDisplayName(cat)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCustomModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                !customMilestone.title.trim() && styles.modalSaveButtonDisabled
              ]}
              onPress={handleAddCustomMilestone}
              disabled={!customMilestone.title.trim()}
            >
              <Text style={styles.modalSaveText}>Add Milestone</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Child Picker Modal
  const renderChildPickerModal = () => (
    <Modal
      visible={showChildPicker}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowChildPicker(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowChildPicker(false)}
      >
        <View style={styles.childPickerModal}>
          <Text style={styles.childPickerTitle}>Select Child</Text>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childPickerItem,
                selectedChild?.id === child.id && styles.childPickerItemActive
              ]}
              onPress={() => {
                setSelectedChild(child);
                setShowChildPicker(false);
              }}
            >
              <Baby size={20} color={selectedChild?.id === child.id ? '#E07A5F' : '#6B7280'} />
              <Text style={[
                styles.childPickerItemText,
                selectedChild?.id === child.id && styles.childPickerItemTextActive
              ]}>
                {child.name || 'Unnamed Child'}
              </Text>
              {selectedChild?.id === child.id && (
                <CheckCircle size={20} color="#E07A5F" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScreenBackground />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        <View style={styles.mainContent}>
          {activeTab === 'nextsteps' && renderNextStepsTab()}
          {activeTab === 'milestones' && renderMilestonesTab()}
          {activeTab === 'progress' && renderProgressTab()}
        </View>
      </SafeAreaView>
      {renderCustomMilestoneModal()}
      {renderChildPickerModal()}
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
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    height: 44,
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
  searchButton: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 21,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#8BA888',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    opacity: 0.6,
  },
  tabTextActive: {
    color: '#FFFFFF',
    opacity: 1,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#1F2937',
    opacity: 0.7,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#1F2937',
    opacity: 0.7,
    fontSize: 16,
  },
  errorCard: {
    padding: 30,
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
  },
  retryText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  featuredCard: {
    padding: 20,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#E07A5F',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: '#FDF2F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#E07A5F',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#666',
    fontSize: 12,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 30,
  },
  featuredDescription: {
    fontSize: 16,
    color: '#1F2937',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 20,
  },
  quickTipsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  quickTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E07A5F',
    marginTop: 8,
  },
  quickTipText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  featuredFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8BA888',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#8BA888',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
  },
  seeAllText: {
    color: '#E07A5F',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingRight: 20,
    paddingBottom: 20,
  },
  articleCard: {
    width: 200,
    marginRight: 16,
    padding: 0,
    overflow: 'hidden',
  },
  articleImagePlaceholder: {
    height: 100,
    backgroundColor: '#FDF2F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleContent: {
    padding: 16,
  },
  articleCategory: {
    fontSize: 12,
    color: '#E07A5F',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleReason: {
    fontSize: 12,
    color: '#999',
  },
  // Child Picker
  childPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  childPickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Progress Overview
  progressOverviewCard: {
    padding: 24,
    marginBottom: 24,
    backgroundColor: '#8BA888',
  },
  progressCircleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    borderColor: '#E07A5F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E07A5F',
    borderRadius: 3,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  categoryChipActive: {
    backgroundColor: '#E07A5F',
    borderColor: '#E07A5F',
  },
  categoryChipText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  // Milestone Sections
  milestoneSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 10,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  milestoneList: {
    gap: 12,
  },
  milestoneItem: {
    padding: 16,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#81B29A',
    borderColor: '#81B29A',
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  milestoneTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  milestoneDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  milestoneMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ageRange: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // Add Custom Button
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF2F0',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 16,
    gap: 8,
  },
  addCustomButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E07A5F',
  },
  // Empty State
  emptyStateCard: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: '#E07A5F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyStateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statItem: {
    width: (width - 52) / 2,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  // Category Progress Card
  categoryProgressCard: {
    padding: 20,
    marginBottom: 16,
  },
  categoryProgressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  categoryProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  categoryProgressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryProgressText: {
    fontSize: 14,
    color: '#1F2937',
  },
  categoryProgressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 45,
    textAlign: 'right',
  },
  categoryProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  // Insight Card
  insightCard: {
    padding: 20,
    backgroundColor: '#FDF2F0',
    borderWidth: 0,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E07A5F',
  },
  insightText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  insightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightActionText: {
    color: '#E07A5F',
    fontWeight: '700',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categorySelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categorySelectChipActive: {
    backgroundColor: '#FDF2F0',
  },
  categorySelectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#E07A5F',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Child Picker Modal
  childPickerModal: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 16,
  },
  childPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  childPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  childPickerItemActive: {
    backgroundColor: '#FDF2F0',
  },
  childPickerItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  childPickerItemTextActive: {
    fontWeight: '600',
    color: '#E07A5F',
  },
});
