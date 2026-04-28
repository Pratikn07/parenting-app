import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { AlertCircle, ArrowLeft, Clock, Tag } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/src/lib/constants';
import { supabase } from '@/src/lib/supabase';

// Article type matching database schema
interface Article {
    id: string;
    slug: string;
    title: string;
    body_md: string;
    age_min_days: number | null;
    age_max_days: number | null;
    tags: string[];
    locale: string;
    last_reviewed_at: string | null;
    reviewer: string | null;
    created_at: string;
    updated_at: string;
}

// Simple markdown renderer for basic formatting
const renderMarkdown = (markdown: string): React.ReactNode[] => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) {
            elements.push(<View key={index} style={styles.spacer} />);
            return;
        }

        // Headers
        if (trimmedLine.startsWith('## ')) {
            elements.push(
                <Text key={index} style={styles.h2}>
                    {trimmedLine.replace('## ', '')}
                </Text>
            );
            return;
        }

        if (trimmedLine.startsWith('# ')) {
            elements.push(
                <Text key={index} style={styles.h1}>
                    {trimmedLine.replace('# ', '')}
                </Text>
            );
            return;
        }

        // Bullet points
        if (trimmedLine.startsWith('- ')) {
            const content = formatInlineMarkdown(trimmedLine.substring(2));
            elements.push(
                <View key={index} style={styles.bulletItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{content}</Text>
                </View>
            );
            return;
        }

        // Regular paragraph
        const content = formatInlineMarkdown(trimmedLine);
        elements.push(
            <Text key={index} style={styles.paragraph}>{content}</Text>
        );
    });

    return elements;
};

// Format inline markdown (bold, italic)
const formatInlineMarkdown = (text: string): React.ReactNode => {
    // Simple bold detection: **text**
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);

        if (boldMatch && boldMatch.index !== undefined) {
            // Add text before bold
            if (boldMatch.index > 0) {
                parts.push(remaining.substring(0, boldMatch.index));
            }
            // Add bold text
            parts.push(
                <Text key={keyIndex++} style={styles.bold}>{boldMatch[1]}</Text>
            );
            remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        } else {
            parts.push(remaining);
            break;
        }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
};

// Fetch article by ID
async function getArticleById(id: string): Promise<Article | null> {
    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching article:', error);
        return null;
    }

    return data;
}

// Get tag color
const getTagColor = (tag: string): string => {
    const colors: Record<string, string> = {
        sleep: '#6366F1',
        feeding: '#10B981',
        safety: '#EF4444',
        development: '#F59E0B',
        health: '#EC4899',
        expecting: '#8B5CF6',
    };
    return colors[tag.toLowerCase()] || '#6B7280';
};

// Estimate read time from content
const estimateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [article, setArticle] = useState<Article | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchArticle = async () => {
            if (typeof id === 'string') {
                setIsLoading(true);
                const data = await getArticleById(id);
                setArticle(data);
                setIsLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Loading article...</Text>
            </View>
        );
    }

    if (!article) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color={THEME.colors.text.secondary} />
                <Text style={styles.errorText}>Article not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonGeneric}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const readTime = estimateReadTime(article.body_md);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={THEME.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Article</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Title Section */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>{article.title}</Text>

                    {/* Meta Row */}
                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Clock size={14} color={THEME.colors.text.secondary} />
                            <Text style={styles.metaText}>{readTime} min read</Text>
                        </View>
                    </View>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {article.tags.map((tag, idx) => (
                                <View
                                    key={idx}
                                    style={[styles.tag, { backgroundColor: getTagColor(tag) + '20' }]}
                                >
                                    <Tag size={12} color={getTagColor(tag)} />
                                    <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
                                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Article Content */}
                <View style={styles.content}>
                    {renderMarkdown(article.body_md)}
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Last updated: {new Date(article.updated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                </View>
            </ScrollView>
        </View>
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
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        backgroundColor: THEME.colors.background,
    },
    errorText: {
        fontSize: 18,
        color: THEME.colors.text.secondary,
        fontFamily: THEME.fonts.body,
    },
    backButtonGeneric: {
        padding: 12,
        backgroundColor: THEME.colors.ui.inputBg,
        borderRadius: 8,
    },
    backButtonText: {
        color: THEME.colors.primary,
        fontFamily: THEME.fonts.bodySemiBold,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.ui.border,
        backgroundColor: THEME.colors.background,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontFamily: THEME.fonts.bodySemiBold,
        color: THEME.colors.text.primary,
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    titleSection: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        lineHeight: 36,
        marginBottom: 16,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 14,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    tagText: {
        fontSize: 12,
        fontFamily: THEME.fonts.bodyMedium,
    },
    divider: {
        height: 1,
        backgroundColor: THEME.colors.ui.border,
        marginHorizontal: 24,
        marginBottom: 24,
    },
    content: {
        paddingHorizontal: 24,
    },
    // Markdown styles
    h1: {
        fontSize: 24,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginTop: 24,
        marginBottom: 12,
    },
    h2: {
        fontSize: 20,
        fontFamily: THEME.fonts.header,
        color: THEME.colors.text.primary,
        marginTop: 20,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        lineHeight: 26,
        marginBottom: 12,
    },
    bold: {
        fontFamily: THEME.fonts.bodySemiBold,
    },
    bulletItem: {
        flexDirection: 'row',
        paddingLeft: 8,
        marginBottom: 8,
    },
    bullet: {
        fontSize: 16,
        color: THEME.colors.primary,
        marginRight: 8,
        width: 16,
    },
    bulletText: {
        flex: 1,
        fontSize: 16,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.primary,
        lineHeight: 24,
    },
    spacer: {
        height: 8,
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 16,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.ui.border,
        marginTop: 24,
    },
    footerText: {
        fontSize: 12,
        fontFamily: THEME.fonts.body,
        color: THEME.colors.text.secondary,
        textAlign: 'center',
    },
});
