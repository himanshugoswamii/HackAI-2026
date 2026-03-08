import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, View, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

import LoginScreen from './src/screens/LoginScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import StylistScreen from './src/screens/StylistScreen';
import DeclutterScreen from './src/screens/DeclutterScreen';
import OutfitsScreen from './src/screens/OutfitsScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import { COLORS } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.bg },
            headerTintColor: COLORS.textDark,
            headerTitleStyle: { fontFamily: 'DancingScript_700Bold', fontSize: 22 },
            tabBarIcon: ({ focused }) => {
                let iconName;
                if (route.name === 'Wardrobe') iconName = '👕';
                else if (route.name === 'Miranda') iconName = '✨';
                else if (route.name === 'Monica') iconName = '📦';
                else if (route.name === 'Outfits') iconName = '👗';
                else if (route.name === 'Ralph') iconName = '💬';
                return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>{iconName}</Text>;
            },
            tabBarActiveTintColor: COLORS.gold,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
                backgroundColor: COLORS.tabBg,
                borderTopColor: COLORS.border,
                borderTopWidth: 0.5,
                paddingBottom: Platform.OS === 'ios' ? 22 : 8,
                paddingTop: 8,
                height: Platform.OS === 'ios' ? 85 : 65,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
        })}
    >
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Miranda" component={StylistScreen} />
      <Tab.Screen name="Monica" component={DeclutterScreen} />
      <Tab.Screen name="Outfits" component={OutfitsScreen} />
      <Tab.Screen name="Ralph" component={ChatbotScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ DancingScript_700Bold });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>✨</Text>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashEmoji: { fontSize: 48, marginBottom: 20 },
});
