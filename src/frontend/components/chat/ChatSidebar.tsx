import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { X, Search, Trash2, MessageSquare, User } from 'lucide-react-native';
import { THEME } from '../../../lib/constants';
import { GroupedSessions, ChatSession } from '../../../services/chat/ChatService';
import { Child } from '../../../lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85;

interface ChatSidebarProps {
  visible: boolean;
  onClose: () => void;
  sessions: GroupedSessions;
  currentSessionId?: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  children: Child[];
  isLoading?: boolean;
  user?: { name?: string; email?: string } | null;
  onProfilePress?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  visible,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  children,
  isLoading = false,
  user,
  onProfilePress,
}) => {
  const [slideAnim] = useState(new Animated.Value(-SIDEBAR_WIDTH));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getChildName = (childId: string | null): string | null => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child?.name || null;
  };

  const filterSessions = (sessionList: ChatSession[]): ChatSession[] => {
    if (!searchQuery.trim()) return sessionList;
    const query = searchQuery.toLowerCase();
    return sessionList.filter(session =>
      session.title?.toLowerCase().includes(query)
    );
  };

  const renderSessionItem = (session: ChatSession) => {
    const isActive = session.id === currentSessionId;
    const childName = getChildName(session.child_id);

    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionItem, isActive && styles.sessionItemActive]}
        onPress={() => {
          onSelectSession(session);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.sessionIcon}>
          <MessageSquare size={18} color={isActive ? THEME.colors.primary : THEME.colors.text.secondary} />
        </View>
        <View style={styles.sessionContent}>
          <Text
            style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
            numberOfLines={1}
          >
            {session.title || 'New conversation'}
          </Text>
          {childName && (
            <Text style={styles.sessionChild} numberOfLines={1}>
              {childName}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteSession(session.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color={THEME.colors.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSessionGroup = (title: string, sessionList: ChatSession[]) => {
    const filtered = filterSessions(sessionList);
    if (filtered.length === 0) return null;

    return (
      <View style={styles.sessionGroup}>
        <Text style={styles.groupTitle}>{title}</Text>
        {filtered.map(renderSessionItem)}
      </View>
    );
  };

  const hasAnySessions =
    sessions.today.length > 0 ||
    sessions.yesterday.length > 0 ||
    sessions.lastWeek.length > 0 ||
    sessions.older.length > 0;

  const getUserInitials = (): string => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chat History</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={THEME.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={18} color={THEME.colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor={THEME.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Sessions List */}
          <ScrollView
            style={styles.sessionsList}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : hasAnySessions ? (
              <>
                {renderSessionGroup('Today', sessions.today)}
                {renderSessionGroup('Yesterday', sessions.yesterday)}
                {renderSessionGroup('Previous 7 Days', sessions.lastWeek)}
                {renderSessionGroup('Older', sessions.older)}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <MessageSquare size={32} color={THEME.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptyText}>
                  Start a new chat to begin your parenting journey
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer with Profile */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.profileSection}
              onPress={onProfilePress}
              activeOpacity={0.7}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitials}>{getUserInitials()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || 'Guest User'}
                </Text>
                {user?.email && (
                  <Text style={styles.profileEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `rgba(61, 64, 91, 0.4)`,
  },
  backdropTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: THEME.colors.background,
    shadowColor: THEME.colors.text.primary,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    fontFamily: THEME.fonts.header,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: THEME.colors.text.primary,
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sessionGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  sessionItemActive: {
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
  },
  sessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  sessionTitleActive: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  sessionChild: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(224, 122, 95, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: THEME.colors.ui.white,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  profileEmail: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
});

export default ChatSidebar;
