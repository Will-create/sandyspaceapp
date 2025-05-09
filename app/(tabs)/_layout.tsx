import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Image, Settings } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#400605',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#ecf0f1',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#400605',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: 'white',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catégories',
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Galerie',
          tabBarIcon: ({ color, size }) => (
            <Image size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tab screens */}
      <Tabs.Screen
        name="products/[category]"
        options={{
          href: null, // Prevent direct navigation
        }}
      />
      <Tabs.Screen
        name="products/add"
        options={{
          href: null, // Prevent direct navigation
        }}
      />
    </Tabs>
  );
}