// src/navigation/AppNavigate.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import MasterClassDetails from '../screens/Espace/Dieteticiens/masterClass/MasterClassDetails';
import MasterClassForm from '../screens/Espace/Dieteticiens/masterClass/MasterClassForm';
import ConsultationsPatient from '../screens/Espace/Dieteticiens/patients/ConsultationsPatient';
import NouvelleConsultation from '../screens/Espace/Dieteticiens/patients/NouvelleConsultation';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import Welcome from '../screens/auth/Welcome';
import Agenda from '../screens/pages/Agendas/Agenda';
import RendezVous from '../screens/pages/Agendas/RendezVous';
import Chat from '../screens/pages/Chats/Chat';
import ChatScreenV2 from '../screens/pages/Chats/ChatScreenV2';
import CommentsScreen from '../screens/pages/Chats/CommentsScreen';
// import Messagerie from '../screens/pages/Messageries/Messagerie';
import ConseilsNutritionnels from '../screens/pages/ConseilsNutritionnels/ConseilsNutritionnels';
import TipDetails from '../screens/pages/ConseilsNutritionnels/TipDetails';
import EditProfilDieteticien from '../screens/pages/Dieteticiens/EditProfilDieteticien';
import ListeDieteticiens from '../screens/pages/Dieteticiens/ListeDieteticiens';
import ProfilDieteticien from '../screens/pages/Dieteticiens/ProfilDieteticien';
import DoctorRequestsScreen from '../screens/pages/DoctorRequestsScreen';
import MasterClasses from '../screens/pages/MasterClasses/MasterClasses';
import Messagerie from '../screens/pages/Messageries/Messagerie';
import NotificationScreen from '../screens/pages/Notifications/NotificationScreen';
import Paiements from '../screens/pages/Paiements/Paiements';
import Parametres from '../screens/pages/Parametres/Parametres';
import CompleteProfileScreen from '../screens/pages/Profil/CompleteProfileScreen';
import ProfileScreen from '../screens/pages/ProfileScreen';
import StatistiquesSuivi from '../screens/pages/StatistiquesSuivi/StatistiquesSuivi';
import FilDActualites from '../screens/pages/actualites/FilDActualites';
import SettingPatient from '../screens/pages/setting/SettingPatient';
import MenuDieteticien from './MenuDieteticien';
import MenuHorizontal from './MenuHorizontal';
import DoctorDetailScreen from '../screens/Espace/Dieteticiens/DoctorDetailScreen';
import NewAppointmentScreen from '../screens/pages/Agendas/NewAppointmentScreen';

const Stack = createStackNavigator();

export default function AppNavigate() {

    const { user, loading } = useAuth();

  console.log("User in AppNavigator:", user);
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#815F9C" />
      </View>
    );
  }
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                }}
                // initialRouteName="Welcome">
                initialRouteName={user?.type === "Patient" ? "Accueil" :  user?.type === "Diététicien" ? "MenuDieteticien" :  "Welcome"}>
                <Stack.Screen
                    name="Welcome"
                    component={Welcome}
                />
                <Stack.Screen
                    name="Accueil"
                    // component={MenuDieteticien}
                    component={MenuHorizontal}
                />

                <Stack.Screen
                    name="MenuDieteticien"
                    component={MenuDieteticien}
                />

                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="ConseilsNutritionnels" component={ConseilsNutritionnels} />
                <Stack.Screen name="MasterClasses" component={MasterClasses} />
                <Stack.Screen name="Paiements" component={Paiements} />
                <Stack.Screen name="StatistiquesSuivi" component={StatistiquesSuivi} />
                <Stack.Screen name="Parametres" component={Parametres} />
                <Stack.Screen name="Notifications" component={NotificationScreen} />
                <Stack.Screen name="CompleteProfilePatient" component={CompleteProfileScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="ProfilDieteticien" component={ProfilDieteticien} />
                <Stack.Screen name="EditDieteticien" component={EditProfilDieteticien} />
                <Stack.Screen name="ChatApp" component={Chat} />
                <Stack.Screen name="ChatScreen" component={ChatScreenV2} />
                <Stack.Screen name="Comments" component={CommentsScreen} />
                <Stack.Screen name="Messagerie" component={Messagerie} />
                <Stack.Screen name="RendezVous" component={RendezVous} />
                <Stack.Screen name="Agenda" component={Agenda} />
                <Stack.Screen name="TipDetails" component={TipDetails} />
                <Stack.Screen name="FilDActualites" component={FilDActualites} />
                <Stack.Screen name="SettingPatient" component={SettingPatient} />
                <Stack.Screen name="ConsultationsPatient" component={ConsultationsPatient} />
                <Stack.Screen name="MasterClassForm" component={MasterClassForm} />
                <Stack.Screen name="MasterClassDetails" component={MasterClassDetails} />
                <Stack.Screen name="NouvelleConsultation" component={NouvelleConsultation} />
                <Stack.Screen name="DoctorRequests" component={DoctorRequestsScreen} />
                <Stack.Screen name="ListeDieteticiens" component={ListeDieteticiens} />
                <Stack.Screen name="DoctorDetail" component={DoctorDetailScreen} />
                <Stack.Screen name="NewAppointment" component={NewAppointmentScreen} />
                {/*     */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}