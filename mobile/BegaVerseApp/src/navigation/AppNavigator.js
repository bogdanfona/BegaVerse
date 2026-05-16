import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ARCameraScreen from '../screens/ARCameraScreen';
import QuestsScreen from '../screens/QuestsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ARContentScreen from '../screens/ARContentScreen'; // NEW
import ARDimensionScreen from '../screens/ARDimensionScreen';
import AR3DWorldScreen from '../screens/AR3DWorldScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0077BE',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ARCamera" 
          component={ARCameraScreen}
          options={{ 
            title: 'AR Scanner',
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="Quests" 
          component={QuestsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ARContent" 
          component={ARContentScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
  name="ARDimension" 
  component={ARDimensionScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen 
  name="AR3DWorld" 
  component={AR3DWorldScreen}
  options={{ headerShown: false }}
/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}