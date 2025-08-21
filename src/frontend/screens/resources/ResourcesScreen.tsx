import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Search, Bookmark, Share, Clock, Sparkles, TrendingUp, BookOpen, BarChart3, MessageCircle, Calendar, Heart, CheckCircle, Circle } from 'lucide-react-native';

export default function ResourcesScreen() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const tabs = [
    { id: 'today', label: 'Today', icon: Sparkles },
    { id: 'milestones', label: 'Milestones', icon: TrendingUp },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
  ];

  const categories = ['All', 'Sleep', 'Feeding', 'Health', 'Activities', 'Well-being', 'Daily Care'];
  const milestoneCategories = ['All', 'Physical', 'Cognitive', 'Social', 'Communication'];

  const featuredArticles = [
    {
      id: '1',
      category: 'sleep',
      readTime: 5,
      title: 'Understanding Your Baby\'s Sleep Patterns',
      summary: 'Learn about newborn sleep cycles and how to establish healthy sleep habits from the start.',
    },
    {
      id: '2',
      category: 'feeding',
      readTime: 8,
      title: 'Breastfeeding: The First Few Weeks',
      summary: 'A comprehensive guide to getting started with breastfeeding, including common challenges and solutions.',
    },
    {
      id: '3',
      category: 'emotional',
      readTime: 6,
      title: 'Postpartum Self-Care for New Moms',
      summary: 'Taking care of yourself while caring for your newborn - practical tips for new mothers.',
    },
  ];

  const milestones = [
    {
      id: '1',
      title: 'Holds head up briefly',
      description: 'Can lift and hold head up for short periods during tummy time',
      category: 'Physical',
      completed: true,
    },
    {
      id: '2',
      title: 'Follows objects with eyes',
      description: 'Tracks moving objects and faces with their gaze',
      category: 'Cognitive',
      completed: true,
    },
    {
      id: '3',
      title: 'Responds to familiar voices',
      description: 'Shows recognition and response to parent voices',
      category: 'Social',
      completed: false,
    },
    {
      id: '4',
      title: 'Makes cooing sounds',
      description: 'Begins to make soft vowel sounds and coos',
      category: 'Communication',
      completed: false,
    },
  ];

  const weeklyStats = [
    { label: 'Questions Asked', value: 12, icon: MessageCircle },
    { label: 'Tips Received', value: 7, icon: Calendar },
    { label: 'Content Saved', value: 5, icon: Heart },
    { label: 'Milestones', value: 2, icon: TrendingUp },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      sleep: '#F0E6FF',
      feeding: '#FFE5D9',
      health: '#E8F5E8',
      activities: '#FEF3E2',
      emotional: '#EBF8FF',
      'well-being': '#FDF2F8',
      'daily care': '#F3F4F6',
    };
    return colors[category.toLowerCase() as keyof typeof colors] || '#F3F4F6';
  };

  const renderTodayTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Your Daily Tip</Text>
        <Text style={styles.tabSubtitle}>Personalized guidance for your parenting journey</Text>
      </View>

      <View style={styles.tipCard}>
        <View style={styles.tipCardHeader}>
          <View style={styles.tipBadges}>
            <View style={[styles.categoryPill, { backgroundColor: getCategoryColor('sleep') }]}>
              <Text style={styles.categoryPillText}>sleep</Text>
            </View>
            <View style={styles.agePill}>
              <Text style={styles.agePillText}>0-3 months</Text>
            </View>
            <View style={styles.readTimePill}>
              <Clock size={12} color="#6B7280" strokeWidth={2} />
              <Text style={styles.readTimePillText}>2 min read</Text>
            </View>
          </View>
          <View style={styles.tipActions}>
            <TouchableOpacity style={styles.tipActionButton} activeOpacity={0.7}>
              <Bookmark size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.tipActionButton} activeOpacity={0.7}>
              <Share size={20} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.tipTitle}>Gentle Sleep Routine</Text>
        <Text style={styles.tipDescription}>
          At 2 months, your baby is starting to develop more predictable sleep patterns. Try establishing a simple bedtime routine: dim the lights, give a warm bath, and feed in a quiet environment.
        </Text>

        <View style={styles.quickTips}>
          <Text style={styles.quickTipsTitle}>QUICK TIPS</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Start the routine 30 minutes before desired bedtime</Text>
            <Text style={styles.tipItem}>• Keep the room temperature comfortable (68-70°F)</Text>
            <Text style={styles.tipItem}>• Use soft, soothing sounds or white noise</Text>
            <Text style={styles.tipItem}>• Be consistent with timing each night</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMilestonesTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Milestone Tracker</Text>
        <Text style={styles.tabSubtitle}>Track your baby's developmental progress</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressCardTitle}>Overall Progress</Text>
        <Text style={styles.progressCardSubtitle}>Your baby's milestone achievements</Text>
        
        <View style={styles.completedMilestones}>
          <Text style={styles.completedLabel}>Completed Milestones</Text>
          <Text style={styles.completedFraction}>3 of 6</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>

        <View style={styles.categoryStats}>
          <View style={styles.categoryStat}>
            <Circle size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.categoryStatLabel}>Physical</Text>
            <Text style={styles.categoryStatCount}>1/2</Text>
          </View>
          <View style={styles.categoryStat}>
            <Circle size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.categoryStatLabel}>Cognitive</Text>
            <Text style={styles.categoryStatCount}>1/1</Text>
          </View>
          <View style={styles.categoryStat}>
            <Circle size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.categoryStatLabel}>Social</Text>
            <Text style={styles.categoryStatCount}>1/2</Text>
          </View>
          <View style={styles.categoryStat}>
            <Circle size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.categoryStatLabel}>Communication</Text>
            <Text style={styles.categoryStatCount}>0/1</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {milestoneCategories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedCategory === category && styles.filterChipTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.milestonesList}>
        {milestones
          .filter(milestone => selectedCategory === 'All' || milestone.category === selectedCategory)
          .map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.milestoneContent}>
              <View style={styles.milestoneIcon}>
                {milestone.completed ? (
                  <CheckCircle size={24} color="#8BA888" strokeWidth={2} fill="#8BA888" />
                ) : (
                  <Circle size={24} color="#D1D5DB" strokeWidth={2} />
                )}
              </View>
              <View style={styles.milestoneText}>
                <Text style={[
                  styles.milestoneTitle,
                  milestone.completed && styles.milestoneTitleCompleted
                ]}>
                  {milestone.title}
                </Text>
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderLibraryTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Educational Library</Text>
        <Text style={styles.tabSubtitle}>Expert articles and guides for your parenting journey</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterChip,
              selectedCategory === category && styles.filterChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedCategory === category && styles.filterChipTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.articlesSection}>
        <Text style={styles.sectionTitle}>Featured Articles</Text>
        <View style={styles.articlesList}>
          {featuredArticles.map((article) => (
            <View key={article.id} style={styles.articleCard}>
              <View style={styles.articleHeader}>
                <View style={[styles.categoryPill, { backgroundColor: getCategoryColor(article.category) }]}>
                  <Text style={styles.categoryPillText}>{article.category}</Text>
                </View>
                <View style={styles.readTimePill}>
                  <Clock size={12} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.readTimePillText}>{article.readTime} min read</Text>
                </View>
              </View>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary}>{article.summary}</Text>
              <TouchableOpacity style={styles.readButton} activeOpacity={0.7}>
                <Text style={styles.readButtonText}>Read Article</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderProgressTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Weekly Progress</Text>
        <Text style={styles.tabSubtitle}>Your parenting journey this week</Text>
      </View>

      <View style={styles.statsGrid}>
        {weeklyStats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={styles.statIcon}>
              <stat.icon size={20} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.engagementCard}>
        <Text style={styles.engagementTitle}>Weekly Engagement</Text>
        <Text style={styles.engagementSubtitle}>Your learning and interaction progress</Text>
        
        <View style={styles.engagementProgress}>
          <Text style={styles.engagementLabel}>Questions & Interactions</Text>
          <Text style={styles.engagementCount}>12 of 15</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
        
        <Text style={styles.engagementMessage}>
          Great job staying engaged! Keep asking questions and exploring resources.
        </Text>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.activitySubtitle}>Your parenting journey highlights this week</Text>
        
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Completed milestone: Holds head up briefly</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Saved 3 new sleep tips to your collection</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Asked 5 questions about feeding schedules</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'today':
        return renderTodayTab();
      case 'milestones':
        return renderMilestonesTab();
      case 'library':
        return renderLibraryTab();
      case 'progress':
        return renderProgressTab();
      default:
        return renderTodayTab();
    }
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
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Heart size={20} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Resources & Tips</Text>
            <Text style={styles.headerSubtitle}>Your personalized parenting guidance</Text>
          </View>
        </View>
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
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8BA888', // Warm sage green that complements coral theme
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  },
  tabHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tipBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  agePill: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  agePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  readTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  readTimePillText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  tipActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  tipTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 20,
  },
  quickTips: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  quickTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  completedMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  completedFraction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8BA888', // Warm sage green
    borderRadius: 4,
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStat: {
    alignItems: 'center',
    flex: 1,
  },
  categoryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 2,
  },
  categoryStatCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    backgroundColor: '#8BA888', // Warm sage green
    borderColor: '#8BA888', // Warm sage green
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  milestonesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    marginRight: 16,
  },
  milestoneText: {
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
    color: '#6B7280',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  articlesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  articlesList: {
    gap: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  articleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  readButton: {
    backgroundColor: '#8BA888', // Warm sage green
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  readButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  engagementCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  engagementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  engagementSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  engagementProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  engagementLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  engagementCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  engagementMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    fontStyle: 'italic',
  },
  recentActivity: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8BA888', // Warm sage green
    marginRight: 12,
  },
  activityText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
});
