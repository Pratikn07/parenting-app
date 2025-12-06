import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Child } from '../../../lib/database.types';
import { THEME } from '../../../lib/constants';
import { getFormattedAge, getDevelopmentalStage } from '../../../lib/dateUtils';

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  children,
  selectedChildId,
  onSelectChild,
}) => {
  if (children.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children.map((child) => {
          const isSelected = selectedChildId === child.id;
          const stage = child.birth_date ? getDevelopmentalStage(child.birth_date) : { label: 'Expecting', icon: '🤰' };

          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                isSelected && styles.childChipSelected,
              ]}
              onPress={() => onSelectChild(child.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                isSelected && styles.iconContainerSelected,
              ]}>
                <Text style={styles.iconText}>{stage.icon}</Text>
              </View>

              <View style={styles.childInfo}>
                <Text style={[
                  styles.childName,
                  isSelected && styles.childNameSelected,
                ]}>
                  {child.name}
                </Text>
                <View style={styles.metaContainer}>
                  <Text style={[
                    styles.childMeta,
                    isSelected && styles.childMetaSelected,
                  ]}>
                    {child.birth_date ? getFormattedAge(child.birth_date) : 'Coming soon'} • {stage.label}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#FDFCF8',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 140,
  },
  childChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainerSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconText: {
    fontSize: 18,
  },
  childInfo: {
    flexDirection: 'column',
  },
  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  childNameSelected: {
    color: '#FFFFFF',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childMeta: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: '500',
  },
  childMetaSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default ChildSelector;


