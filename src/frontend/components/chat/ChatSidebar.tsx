import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatSession, Child, User } from '../../../lib/database.types';
import { GroupedSessions } from '../../../services/chat/ChatService';
import { THEME } from '../../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8;

interface ChatSidebarProps {
  visible: boolean;
  onClose: () => void;
  sessions: GroupedSessions;
  currentSessionId?: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  children?: Child[];
  isLoading?: boolean;
  user?: User | null;
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
  children = [],
  isLoading = false,
  user,
  onProfilePress,
}) => {
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
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

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const filterSessions = (sessionList: ChatSession[]): ChatSession[] => {
    if (!searchQuery.trim()) return sessionList;
    const query = searchQuery.toLowerCase();
    return sessionList.filter(s => 
      s.title?.toLowerCase().includes(query) ||
      s.topic?.toLowerCase().includes(query)
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
        onLongPress={() => onDeleteSession(session.id)}
      >
        <View style={styles.sessionIcon}>
          <Ionicons 
            name="chatbubble-outline" 
            size={18} 
            color={isActive ? THEME.colors.primary : THEME.colors.text.secondary} 
          />
        </View>
        <View style={styles.sessionContent}>
          <Text 
            style={[styles.sessionTitle, isActive && styles.sessionTitleActive]}
            numberOfLines={1}
          >
            {session.title || 'New conversation'}
          </Text>
          {childName && (
            <Text style={styles.sessionChildName}>
              About {childName}
            </Text>
          )}
        </View>
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

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View 
        style={[styles.backdrop, { opacity: fadeAnim }]}
      >
        <TouchableOpacity 
          style={styles.backdropTouch} 
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
        {/* Header - Simplified */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={THEME.colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={THEME.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={THEME.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Sessions List */}
        <ScrollView 
          style={styles.sessionsList}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading conversations...</Text>
            </View>
          ) : !hasAnySessions ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={THEME.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyText}>
                Start a new chat to get personalized parenting advice
              </Text>
            </View>
          ) : (
            <>
              {renderSessionGroup('Today', sessions.today)}
              {renderSessionGroup('Yesterday', sessions.yesterday)}
              {renderSessionGroup('Previous 7 Days', sessions.lastWeek)}
              {renderSessionGroup('Older', sessions.older)}
            </>
          )}
        </ScrollView>

        {/* Footer - User Profile */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.profileItem}
            onPress={onProfilePress}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || 'Guest User'}
              </Text>
              <Text style={styles.profileAction}>Manage account</Text>
            </View>
            <Ionicons name="settings-outline" size={20} color={THEME.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
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
    backgroundColor: 'rgba(61, 64, 91, 0.4)', // Using text.primary with opacity
  },
  backdropTouch: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: THEME.colors.background, // Soft Cream #FDFCF8
    paddingTop: 60,
    borderRightWidth: 1,
    borderRightColor: THEME.colors.ui.border, // #E5E7EB
    // Subtle shadow for depth
    shadowColor: '#3D405B',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.ui.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    fontFamily: THEME.fonts.header,
  },
  closeButton: {
    padding: 8,
    backgroundColor: THEME.colors.ui.inputBg,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.ui.inputBg, // #F9FAFB
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.ui.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: THEME.colors.text.primary, // #3D405B
    fontSize: 14,
  },
  sessionsList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  sessionGroup: {
    marginBottom: 16,
  },
  groupTitle: {
    color: THEME.colors.text.secondary, // #6B7280
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  sessionItemActive: {
    backgroundColor: 'rgba(224, 122, 95, 0.1)', // Terracotta with low opacity
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.2)',
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
  },
  sessionTitle: {
    color: THEME.colors.text.primary, // #3D405B
    fontSize: 14,
    fontWeight: '500',
  },
  sessionTitleActive: {
    color: THEME.colors.primary, // #E07A5F
    fontWeight: '600',
  },
  sessionChildName: {
    color: THEME.colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(224, 122, 95, 0.1)', // Terracotta tint
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    color: THEME.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.ui.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: THEME.colors.ui.white,
    paddingBottom: 32, // Extra padding for safe area
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  profileAction: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
});

export default ChatSidebar;
