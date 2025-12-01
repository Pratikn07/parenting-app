import { Tabs } from 'expo-router';
import { Star, MessageCircle } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="../milestones"
        options={{
          title: 'Milestones',
          tabBarIcon: ({ color }) => <Star size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}