import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { BegaNotificationProvider } from '../components/BegaNotification';
import { BegaColors } from '../../constants/theme';

import HomeScreen      from '../screens/HomeScreen';
import ARCameraScreen  from '../screens/ARCameraScreen';
import QuestsScreen    from '../screens/QuestsScreen';
import ProfileScreen   from '../screens/ProfileScreen';
import ARContentScreen from '../screens/ARContentScreen';
import ARDimensionScreen from '../screens/ARDimensionScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <BegaNotificationProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: BegaColors.navy },
            headerTintColor: BegaColors.cyan,
            headerTitleStyle: { fontWeight: 'bold', letterSpacing: 1, fontFamily: 'monospace' },
          }}
        >
          <Stack.Screen name="Home"        component={HomeScreen}        options={{ headerShown: false }} />
          <Stack.Screen name="ARCamera"    component={ARCameraScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="Quests"      component={QuestsScreen}      options={{ headerShown: false }} />
          <Stack.Screen name="Profile"     component={ProfileScreen}     options={{ headerShown: false }} />
          <Stack.Screen name="ARContent"   component={ARContentScreen}   options={{ headerShown: false }} />
          <Stack.Screen name="ARDimension" component={ARDimensionScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </BegaNotificationProvider>
  );
}
