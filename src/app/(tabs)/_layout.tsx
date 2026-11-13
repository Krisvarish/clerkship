import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import ThemedText from '../../components/ui/ThemedText';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 12);
  const barHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.sage,
        tabBarInactiveTintColor: '#A8A196',
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom: bottomPadding,
            height: barHeight,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <ThemedText
                variant="small"
                weight={focused ? 'semibold' : 'regular'}
                color={focused ? Colors.sage : '#A8A196'}
              >
                Schedule
              </ThemedText>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name="calendar"
              size={22}
              color={focused ? Colors.sage : '#A8A196'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Subjects',
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <ThemedText
                variant="small"
                weight={focused ? 'semibold' : 'regular'}
                color={focused ? Colors.sage : '#A8A196'}
              >
                Subjects
              </ThemedText>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name="bar-chart-2"
              size={22}
              color={focused ? Colors.sage : '#A8A196'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="semesters"
        options={{
          title: 'Semesters',
          tabBarLabel: ({ focused, color }) => (
            <View style={styles.labelWrapper}>
              <ThemedText
                variant="small"
                weight={focused ? 'semibold' : 'regular'}
                color={focused ? Colors.sage : '#A8A196'}
              >
                Semesters
              </ThemedText>
              {focused && <View style={styles.activeDot} />}
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) => (
            <Feather
              name="layers"
              size={22}
              color={focused ? Colors.sage : '#A8A196'}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FAF7F2',
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
    paddingTop: 8,
    elevation: 4,
    shadowColor: '#2C352E',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  labelWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sage,
    marginTop: 3,
  },
});
