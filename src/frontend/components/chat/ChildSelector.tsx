import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Baby, ChevronDown, Check } from 'lucide-react-native';
import { Child } from '../../../lib/database.types';
import { THEME } from '../../../lib/constants';

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string | null;
  onSelectChild: (childId: string) => void;
  compact?: boolean;
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  
  if (months < 1) return 'Newborn';
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years}y`;
  return `${years}y ${remainingMonths}mo`;
}

export function ChildSelector({ 
  children, 
  selectedChildId, 
  onSelectChild,
  compact = true 
}: ChildSelectorProps) {
  if (children.length === 0) {
    return null;
  }

  // For single child, show a simple indicator
  if (children.length === 1) {
    const child = children[0];
    return (
      <View style={styles.singleChildContainer}>
        <View style={styles.childBadge}>
          <Baby size={14} color={THEME.colors.primary} strokeWidth={2} />
          <Text style={styles.singleChildText}>
            Chatting about {child.name || 'Baby'} ({calculateAge(child.date_of_birth)})
          </Text>
        </View>
      </View>
    );
  }

  // For multiple children, show selector chips
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Asking about:</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {children.map((child) => {
          const isSelected = selectedChildId === child.id;
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onSelectChild(child.id)}
              activeOpacity={0.7}
            >
              {isSelected && (
                <Check size={14} color="#FFF" strokeWidth={2.5} style={styles.checkIcon} />
              )}
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}>
                {child.name || 'Baby'}
              </Text>
              <Text style={[
                styles.chipAge,
                isSelected && styles.chipAgeSelected,
              ]}>
                {calculateAge(child.date_of_birth)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  checkIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.text.primary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipAge: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginLeft: 6,
  },
  chipAgeSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  singleChildContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  childBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  singleChildText: {
    fontSize: 13,
    color: THEME.colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
});

