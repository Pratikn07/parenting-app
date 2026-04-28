import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Menu, PenSquare } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface ChatHeaderProps {
  userName: string | null | undefined;
  onMenuPress: () => void;
  onNewChat: () => void;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return 'there';
  return name.split(' ')[0];
}

export function ChatHeader({ userName, onMenuPress, onNewChat }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
        <Menu size={24} color="#3D405B" strokeWidth={2} />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {getTimeGreeting()}, {getFirstName(userName)}
      </Text>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerButton} onPress={onNewChat}>
          <PenSquare size={22} color="#3D405B" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FDFCF8',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: THEME.fonts.header,
    color: THEME.colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
