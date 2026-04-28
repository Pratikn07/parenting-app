import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { MessageCircle, Utensils, Flower2, Store } from 'lucide-react-native';
import { THEME } from '@/src/lib/constants';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const ICON_SIZE_SELECTED = 24;
const ICON_SIZE_UNSELECTED = 22;

function TabIcon({ routeName, isFocused }: { routeName: string; isFocused: boolean }) {
  const color = isFocused ? THEME.colors.primary : THEME.colors.text.secondary;
  const size = isFocused ? ICON_SIZE_SELECTED : ICON_SIZE_UNSELECTED;
  const strokeWidth = isFocused ? 2.5 : 2;

  switch (routeName) {
    case 'chat':
      return (
        <MessageCircle
          size={size}
          color={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'recipes':
      return (
        <Utensils
          size={size}
          color={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'shop':
      return (
        <Store
          size={size}
          color={color}
          strokeWidth={strokeWidth}
        />
      );
    case 'bloom':
      return (
        <Flower2
          size={size}
          color={color}
          strokeWidth={strokeWidth}
        />
      );
    default:
      return null;
  }
}

function AnimatedTabItem({
  routeKey,
  routeName,
  isFocused,
  onPress,
  accessibilityLabel,
}: {
  routeKey: string;
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(dotOpacity, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 12,
    }).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  };

  const handlePress = async () => {
    if (!isFocused) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        key={routeKey}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={accessibilityLabel}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.tabItem}
      >
        <TabIcon routeName={routeName} isFocused={isFocused} />
        <Animated.View 
          style={[
            styles.activeIndicator, 
            { opacity: dotOpacity, transform: [{ scale: dotOpacity }] }
          ]} 
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  // @ts-ignore
  if (focusedOptions.tabBarStyle?.display === 'none') {
    return null;
  }

  // Floating dock bottom inset
  const bottomPadding = Math.max(insets.bottom, 24);

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomPadding }]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 40 : 80}
        tint="light"
        style={styles.blurView}
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <AnimatedTabItem
                key={route.key}
                routeKey={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                accessibilityLabel={options.tabBarAccessibilityLabel}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recipes' }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop' }} />
      <Tabs.Screen name="bloom" options={{ title: 'Bloom' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    alignItems: 'center',
    zIndex: 10,
  },
  blurView: {
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: THEME.colors.text.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
    width: '100%',
    maxWidth: 400,
    // Provide a subtle border for depth as described in the UI/UX glassmorphism skill
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(253, 250, 247, 0.65)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: 48,
    position: 'relative',
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
    position: 'absolute',
    bottom: 4,
  },
});