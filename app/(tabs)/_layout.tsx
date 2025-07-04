import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getMyCart } from '@/services/cart.service';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [cartCount, setCartCount] = useState(0);

  const loadCartCount = useCallback(async () => {
    try {
      const result = await getMyCart();
      if ('error' in result) {
        setCartCount(0);
      } else {
        setCartCount(result.data.items.length);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartCount(0);
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [loadCartCount])
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1565C0',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.select({
            ios: 90,
            android: 70,
            default: 70,
          }),
          paddingBottom: Platform.select({
            ios: 30,
            android: 10,
            default: 10,
          }),
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbox"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="message.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyze"
        options={{
          title: 'Analyze',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="camera.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="cart.fill" color={color} />
          ),
          tabBarBadge: cartCount > 0 ? (cartCount > 99 ? '99+' : cartCount) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="[id]/index"
        options={{
          title: 'Product Detail',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 32 : 28} name="info.circle.fill" color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: "Search",
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}
