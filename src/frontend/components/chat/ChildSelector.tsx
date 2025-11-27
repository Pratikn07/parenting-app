import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Child } from '../../../lib/database.types';
import { THEME } from '../../../lib/constants';

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

  const getChildAge = (dateOfBirth: string): string => {
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + 
                   (now.getMonth() - birth.getMonth());
    
    if (months < 1) return 'Newborn';
    if (months < 12) return `${months}mo`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years}y`;
    return `${years}y ${remainingMonths}mo`;
  };

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {children.map((child) => {
          const isSelected = selectedChildId === child.id;
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
                styles.avatar,
                isSelected && styles.avatarSelected,
              ]}>
                <Text style={[
                  styles.avatarText,
                  isSelected && styles.avatarTextSelected,
                ]}>
                  {getInitial(child.name)}
                </Text>
              </View>
              <View style={styles.childInfo}>
                <Text style={[
                  styles.childName,
                  isSelected && styles.childNameSelected,
                ]}>
                  {child.name}
                </Text>
                <Text style={[
                  styles.childAge,
                  isSelected && styles.childAgeSelected,
                ]}>
                  {getChildAge(child.date_of_birth)}
                </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FDFCF8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  childChipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  avatarTextSelected: {
    color: '#FFFFFF',
  },
  childInfo: {
    flexDirection: 'column',
  },
  childName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  childNameSelected: {
    color: '#FFFFFF',
  },
  childAge: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  childAgeSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ChildSelector;


