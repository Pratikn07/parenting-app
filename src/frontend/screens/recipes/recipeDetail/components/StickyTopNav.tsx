import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Heart, Share2 } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';

interface StickyTopNavProps {
  topInset: number;
  isSaved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onShare?: () => void;
}

export function StickyTopNav({
  topInset,
  isSaved,
  onBack,
  onToggleSave,
  onShare,
}: StickyTopNavProps) {
  return (
    <View style={[styles.stickyTopNav, { top: topInset }]}>
      <TouchableOpacity style={styles.circleButton} onPress={onBack}>
        <ArrowLeft size={24} color={THEME.colors.text.primary} />
      </TouchableOpacity>
      <View style={styles.topRightButtons}>
        <TouchableOpacity
          style={[styles.circleButton, { marginRight: 12 }]}
          onPress={onShare}
        >
          <Share2 size={22} color={THEME.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.circleButton} onPress={onToggleSave}>
          <Heart
            size={22}
            color={isSaved ? THEME.colors.primary : THEME.colors.text.primary}
            fill={isSaved ? THEME.colors.primary : 'transparent'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stickyTopNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 1000,
  },
  topRightButtons: {
    flexDirection: 'row',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
