import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import StylistScreen from './src/screens/StylistScreen';
import DeclutterScreen from './src/screens/DeclutterScreen';
import OutfitsScreen from './src/screens/OutfitsScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: true,
            tabBarIcon: ({ focused }) => {
                let iconName;
                if (route.name === 'Wardrobe') iconName = '👕';
                else if (route.name === 'Stylist') iconName = '✨';
                else if (route.name === 'Declutter') iconName = '📦';
                else if (route.name === 'Outfits') iconName = '👗';
                else if (route.name === 'Chatbot') iconName = '💬';
                return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{iconName}</Text>;
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: { paddingBottom: 5 }
        })}
    >
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Stylist" component={StylistScreen} />
      <Tab.Screen name="Declutter" component={DeclutterScreen} />
      <Tab.Screen name="Outfits" component={OutfitsScreen} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={TabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
