import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MAROON, BACKGROUND, BORDER, TEXT_PRIMARY } from './src/theme';

// Load cursive font on web for editorial aesthetic
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}
import { UserProvider } from './src/contexts/UserContext';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AppInfoScreen from './src/screens/AppInfoScreen';
import DoINeedThisScreen from './src/screens/DoINeedThisScreen';
import UploadScreen from './src/screens/UploadScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import StylistScreen from './src/screens/StylistScreen';
import DeclutterScreen from './src/screens/DeclutterScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: BACKGROUND, borderTopColor: BORDER },
        tabBarActiveTintColor: MAROON,
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Stylist" component={StylistScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Declutter" component={DeclutterScreen} options={{ tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: BACKGROUND },
            headerTintColor: TEXT_PRIMARY,
            headerTitleStyle: { fontWeight: '600', color: TEXT_PRIMARY },
          }}
        >
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AppInfo"
            component={AppInfoScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="DoINeedThis"
            component={DoINeedThisScreen}
            options={{ title: 'Do I need this?', headerStyle: { backgroundColor: BACKGROUND } }}
          />
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="Upload"
            component={UploadScreen}
            options={{ title: 'Add clothing', headerStyle: { backgroundColor: BACKGROUND } }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}
