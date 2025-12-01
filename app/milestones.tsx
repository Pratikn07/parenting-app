import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { THEME } from '../src/lib/constants';
import { useAuthStore } from '../src/shared/stores/authStore';
import { milestonesService } from '../src/services/milestones/MilestonesService';
import { ProgressRing } from '../src/frontend/components/milestones/ProgressRing';
import { CategoryStats } from '../src/frontend/components/milestones/CategoryStats';
import { MilestoneCard } from '../src/frontend/components/milestones/MilestoneCard';
import { MilestoneFilters } from '../src/frontend/components/milestones/MilestoneFilters';
import type { Child, MilestoneTemplate, MilestoneType, UserMilestoneProgress } from '../src/lib/database.types';
import type { MilestoneStats, UserMilestoneProgressWithTemplate } from '../src/services/milestones/MilestonesService';
import { supabase } from '../src/lib/supabase';

export default function MilestonesScreen() {
    const { user } = useAuthStore();
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [milestones, setMilestones] = useState<MilestoneTemplate[]>([]);
    const [progress, setProgress] = useState<UserMilestoneProgressWithTemplate[]>([]);
    const [stats, setStats] = useState<MilestoneStats | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<'all' | MilestoneType>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    useEffect(() => {
        if (selectedChildId) {
            loadChildMilestones();
        }
    }, [selectedChildId]);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Load children
            const { data: childrenData, error: childrenError } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', user!.id);

            if (childrenError) throw childrenError;

            setChildren(childrenData || []);

            if (childrenData && childrenData.length > 0) {
                setSelectedChildId(childrenData[0].id);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadChildMilestones = async () => {
        if (!user?.id || !selectedChildId) return;

        try {
            const selectedChild = children.find(c => c.id === selectedChildId);
            if (!selectedChild) return;

            // Load relevant milestones for child's age
            const relevantMilestones = await milestonesService.getRelevantMilestones(selectedChild);
            setMilestones(relevantMilestones);

            // Load progress
            const userProgress = await milestonesService.getUserMilestoneProgress(user.id, selectedChildId);
            setProgress(userProgress);

            // Load stats
            const milestoneStats = await milestonesService.getMilestoneStats(user.id, selectedChildId);
            setStats(milestoneStats);
        } catch (error) {
            console.error('Error loading milestones:', error);
        }
    };

    const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
        if (!user?.id || !selectedChildId) return;

        try {
            if (completed) {
                await milestonesService.completeMilestone(user.id, selectedChildId, milestoneId);
            } else {
                await milestonesService.uncompleteMilestone(user.id, selectedChildId, milestoneId);
            }

            // Reload data
            await loadChildMilestones();
        } catch (error) {
            console.error('Error toggling milestone:', error);
        }
    };

    const filteredMilestones = selectedCategory === 'all'
        ? milestones
        : milestones.filter(m => m.category === selectedCategory);

    // Get progress map for easy lookup
    const progressMap = new Map(
        progress.map(p => [p.milestone_template_id, p])
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Loading milestones...</Text>
            </View>
        );
    }

    if (children.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeft size={24} color={THEME.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Milestones</Text>
                    <View style={styles.backButton} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>No Children Yet</Text>
                    <Text style={styles.emptyText}>Add a child to start tracking milestones</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color={THEME.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Milestones</Text>
                <View style={styles.backButton} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Child Selector (if multiple children) */}
                {children.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.childSelector}
                        contentContainerStyle={styles.childSelectorContent}
                    >
                        {children.map(child => (
                            <TouchableOpacity
                                key={child.id}
                                style={[
                                    styles.childPill,
                                    selectedChildId === child.id && styles.childPillActive
                                ]}
                                onPress={() => setSelectedChildId(child.id)}
                            >
                                <Text style={[
                                    styles.childPillText,
                                    selectedChildId === child.id && styles.childPillTextActive
                                ]}>
                                    {child.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* Progress Overview */}
                {stats && (
                    <View style={styles.overviewSection}>
                        <ProgressRing progress={stats.completionRate} />
                        <CategoryStats stats={stats} />
                    </View>
                )}

                {/* Filters */}
                <MilestoneFilters
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />

                {/* Milestone List */}
                <View style={styles.milestonesSection}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory === 'all' ? 'All Milestones' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Milestones`}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                        {filteredMilestones.length} milestone{filteredMilestones.length !== 1 ? 's' : ''} for your child's age
                    </Text>

                    {filteredMilestones.length === 0 ? (
                        <View style={styles.emptyMilestones}>
                            <Text style={styles.emptyMilestonesText}>No milestones in this category yet</Text>
                        </View>
                    ) : (
                        filteredMilestones.map(milestone => (
                            <MilestoneCard
                                key={milestone.id}
                                milestone={milestone}
                                progress={progressMap.get(milestone.id)}
                                onToggle={handleToggleMilestone}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
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
        backgroundColor: THEME.colors.background,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
    },
    scrollView: {
        flex: 1,
    },
    childSelector: {
        marginTop: 16,
    },
    childSelectorContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    childPill: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    childPillActive: {
        backgroundColor: THEME.colors.primary,
        borderColor: THEME.colors.primary,
    },
    childPillText: {
        fontSize: 14,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.secondary,
    },
    childPillTextActive: {
        color: '#FFFFFF',
    },
    overviewSection: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    milestonesSection: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        marginBottom: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
    },
    emptyMilestones: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    emptyMilestonesText: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
});
