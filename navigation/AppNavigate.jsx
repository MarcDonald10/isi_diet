// src/navigation/AppNavigate.tsx
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import MenuHorizontal from './MenuHorizontal';
import { createStackNavigator } from '@react-navigation/stack';
import ConseilsNutritionnels from '../screens/pages/ConseilsNutritionnels/ConseilsNutritionnels';
import MasterClasses from '../screens/pages/MasterClasses/MasterClasses';
import Paiements from '../screens/pages/Paiements/Paiements';
import StatistiquesSuivi from '../screens/pages/StatistiquesSuivi/StatistiquesSuivi';
import Parametres from '../screens/pages/Parametres/Parametres';
import Welcome from '../screens/auth/Welcome';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

const Stack = createStackNavigator();

export default function AppNavigate() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
                initialRouteName="Welcome">
                <Stack.Screen
                    name="Welcome"
                    component={Welcome}
                />
                <Stack.Screen
                    name="Accueil"
                    component={MenuHorizontal}
                />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="ConseilsNutritionnels" component={ConseilsNutritionnels} />
                <Stack.Screen name="MasterClasses" component={MasterClasses} />
                <Stack.Screen name="Paiements" component={Paiements} />
                <Stack.Screen name="StatistiquesSuivi" component={StatistiquesSuivi} />
                <Stack.Screen name="Parametres" component={Parametres} />
                {/* MembersScreen */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}