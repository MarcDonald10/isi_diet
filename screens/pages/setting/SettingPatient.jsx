import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { logOut } from '../../../services/firebase/firebaseService';
import { deleteUser } from '../../../services/localSotrage/UserConnectData';

const SettingPatient = ({ navigation }) => {
    
    const [notifications, setNotifications] = React.useState(true);
    const [darkMode, setDarkMode] = React.useState(false);
    const [emailNotifs, setEmailNotifs] = React.useState(true);

    const settingsSections = [
        {
            title: 'Compte',
            items: [
                {
                    icon: 'person-outline',
                    label: 'Modifier le profil',
                    onPress: () => navigation.navigate('EditProfile'),
                    type: 'link'
                },
                {
                    icon: 'lock-closed-outline',
                    label: 'Sécurité',
                    onPress: () => navigation.navigate('Security'),
                    type: 'link'
                },
                {
                    icon: 'notifications-outline',
                    label: 'Notifications push',
                    type: 'switch',
                    value: notifications,
                    onValueChange: setNotifications
                }
            ]
        },
        {
            title: 'Préférences',
            items: [
                {
                    icon: 'moon-outline',
                    label: 'Mode sombre',
                    type: 'switch',
                    value: darkMode,
                    onValueChange: setDarkMode
                },
                {
                    icon: 'mail-outline',
                    label: 'Notifications email',
                    type: 'switch',
                    value: emailNotifs,
                    onValueChange: setEmailNotifs
                },
                {
                    icon: 'language-outline',
                    label: 'Langue',
                    onPress: () => navigation.navigate('Language'),
                    type: 'link',
                    value: 'Français'
                }
            ]
        },
        {
            title: 'Assistance',
            items: [
                {
                    icon: 'help-circle-outline',
                    label: 'Centre d\'aide',
                    onPress: () => navigation.navigate('Help'),
                    type: 'link'
                },
                {
                    icon: 'document-text-outline',
                    label: 'Conditions d\'utilisation',
                    onPress: () => navigation.navigate('Terms'),
                    type: 'link'
                },
                {
                    icon: 'shield-checkmark-outline',
                    label: 'Politique de confidentialité',
                    onPress: () => navigation.navigate('Privacy'),
                    type: 'link'
                }
            ]
        }
    ];

      const deconnextion = async() => {
    
        await logOut();
        await deleteUser();
        navigation.navigate('Login');
      }

    const renderItem = (item) => {
        return (
            <TouchableOpacity
                key={item.label}
                style={styles.settingItem}
                onPress={item.type === 'link' ? item.onPress : null}
            >
                <View style={styles.settingItemLeft}>
                    <Ionicons name={item.icon} size={24} color="#815F9C" />
                    <Text style={styles.settingItemLabel}>{item.label}</Text>
                </View>

                {item.type === 'switch' ? (
                    <Switch
                        value={item.value}
                        onValueChange={item.onValueChange}
                        trackColor={{ false: '#EAE3EC', true: '#815F9C' }}
                        thumbColor={item.value ? '#fff' : '#f4f3f4'}
                    />
                ) : (
                    <View style={styles.settingItemRight}>
                        {item.value && <Text style={styles.settingItemValue}>{item.value}</Text>}
                        <Ionicons name="chevron-forward" size={20} color="#B9A9CC" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Header
                 pageName={"Paramètres"}
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />
            <ScrollView style={styles.container}>
                {settingsSections.map((section) => (
                    <View key={section.title} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionContent}>
                            {section.items.map(renderItem)}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={deconnextion}
                >
                    <Ionicons name="log-out-outline" size={24} color="#E53935" />
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>
            </ScrollView>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F0F5',
        marginTop: '5%',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#815F9C',
        marginBottom: 10,
        marginLeft: 4,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAE3EC',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EAE3EC',
    },
    settingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingItemLabel: {
        fontSize: 16,
        color: '#1E223D',
        marginLeft: 12,
    },
    settingItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingItemValue: {
        fontSize: 14,
        color: '#7D5F9B',
        marginRight: 8,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E53935',
    },
    logoutText: {
        fontSize: 16,
        color: '#E53935',
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default SettingPatient;