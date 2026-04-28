import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Plus, User } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import type { ChildFormData, StageDef } from '../stages';

interface ChildTabsProps {
  children: ChildFormData[];
  activeIndex: number;
  activeStage: StageDef;
  canAddChild: boolean;
  onSelect: (index: number) => void;
  onAddChild: () => void;
}

export function ChildTabs({
  children,
  activeIndex,
  activeStage,
  canAddChild,
  onSelect,
  onAddChild,
}: ChildTabsProps) {
  return (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {children.map((child, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.tab,
                isActive && styles.tabActive,
                isActive && {
                  borderColor: activeStage.textColor,
                  backgroundColor: activeStage.color,
                },
              ]}
              onPress={() => onSelect(index)}
              activeOpacity={0.7}
            >
              <User size={16} color={isActive ? activeStage.textColor : '#6B7280'} />
              <Text
                style={[
                  styles.tabText,
                  isActive && {
                    color: activeStage.textColor,
                    fontFamily: THEME.fonts.bodySemiBold,
                  },
                ]}
              >
                {child.name || `Child ${index + 1}`}
              </Text>
            </TouchableOpacity>
          );
        })}

        {canAddChild && (
          <TouchableOpacity style={styles.addTab} onPress={onAddChild} activeOpacity={0.7}>
            <Plus size={18} color={THEME.colors.primary} />
            <Text style={styles.addTabText}>Add Child</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  tabsContent: {
    gap: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tabActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 14,
    fontFamily: THEME.fonts.body,
    color: '#6B7280',
  },
  addTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
    borderStyle: 'dashed',
    gap: 6,
  },
  addTabText: {
    fontSize: 14,
    fontFamily: THEME.fonts.bodySemiBold,
    color: THEME.colors.primary,
  },
});
