import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { ChildData } from '../../../wizardStore';
import { ChildFormData, isChildValid, STAGES } from '../stages';

const MAX_CHILDREN = 2;
const DEFAULT_STAGE_INDEX = 1; // Newborn

interface UseChildFormResult {
  children: ChildFormData[];
  activeChildIndex: number;
  activeChild: ChildFormData;
  setActiveChildIndex: (i: number) => void;
  updateActiveChild: (updates: Partial<ChildFormData>) => void;
  addChild: () => void;
  removeChild: (index: number) => void;
  handleDateChange: (event: unknown, selectedDate?: Date) => void;
  canAddChild: boolean;
  isFormValid: boolean;
}

function buildInitialChildren(seed: ChildData[] | undefined): ChildFormData[] {
  if (seed && seed.length > 0) {
    return seed.map((child, index) => ({
      id: `child-${index}`,
      name: child.name || '',
      selectedIndex: STAGES.findIndex((s) => s.stage === child.stage) || DEFAULT_STAGE_INDEX,
      dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : null,
      showDatePicker: false,
    }));
  }
  return [
    {
      id: 'child-0',
      name: '',
      selectedIndex: DEFAULT_STAGE_INDEX,
      dateOfBirth: null,
      showDatePicker: false,
    },
  ];
}

export function useChildForm(seed: ChildData[] | undefined): UseChildFormResult {
  const [children, setChildren] = useState<ChildFormData[]>(() => buildInitialChildren(seed));
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // Keep active index in bounds when children shrink
  useEffect(() => {
    if (activeChildIndex >= children.length) {
      setActiveChildIndex(Math.max(0, children.length - 1));
    }
  }, [children.length, activeChildIndex]);

  const activeChild = children[activeChildIndex] || children[0];

  const updateChild = (index: number, updates: Partial<ChildFormData>) => {
    setChildren((prev) => prev.map((child, i) => (i === index ? { ...child, ...updates } : child)));
  };

  const updateActiveChild = (updates: Partial<ChildFormData>) => {
    updateChild(activeChildIndex, updates);
  };

  const addChild = () => {
    if (children.length >= MAX_CHILDREN) return;
    const newChild: ChildFormData = {
      id: `child-${children.length}`,
      name: '',
      selectedIndex: DEFAULT_STAGE_INDEX,
      dateOfBirth: null,
      showDatePicker: false,
    };
    setChildren([...children, newChild]);
    setActiveChildIndex(children.length);
  };

  const removeChild = (index: number) => {
    if (children.length <= 1) return;
    const next = children.filter((_, i) => i !== index);
    setChildren(next);
    if (activeChildIndex >= next.length) {
      setActiveChildIndex(Math.max(0, next.length - 1));
    } else if (activeChildIndex === index) {
      setActiveChildIndex(Math.max(0, index - 1));
    }
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      updateChild(activeChildIndex, { showDatePicker: false });
    }
    if (selectedDate) {
      updateChild(activeChildIndex, { dateOfBirth: selectedDate });
    }
  };

  return {
    children,
    activeChildIndex,
    activeChild,
    setActiveChildIndex,
    updateActiveChild,
    addChild,
    removeChild,
    handleDateChange,
    canAddChild: children.length < MAX_CHILDREN,
    isFormValid: children.every(isChildValid),
  };
}
