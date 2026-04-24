import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Animated } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../components/Header';
import { getUser } from '../../services/localSotrage/UserConnectData';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingRequests } from '../../services/firebase/firebaseService';

export default function HomeScreen() {
    const navigation = useNavigation();
    const [poidsData] = useState([70, 69, 68.5, 68]);
    const { user, loading } = useAuth();
    const [pendingRequests, setPendingRequests] = useState(0);
    const [scaleAnim] = useState(new Animated.Value(1));

    // Charger les demandes de médecins
    useFocusEffect(
        React.useCallback(() => {
            loadPendingRequests();
        }, [user?.uid])
    );

    const loadPendingRequests = async () => {
        try {
            if (user?.uid) {
                const requests = await getPendingRequests(user.uid);
                setPendingRequests(requests?.length || 0);
                // Animation du badge
                if (requests?.length > 0) {
                    Animated.sequence([
                        Animated.timing(scaleAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
                        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                    ]).start();
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    // Conseil du jour basé sur le profil 
    const conseil = user?.pathologie === 'Diabète'
        ? "Pour votre diabète, privilégiez les légumes verts aujourd’hui."
        : "Buvez un grand verre d’eau avant chaque repas !";

    return (
        <View style={styles.container1}>
            <Header
                userPhoto="https://example.com/user-photo.jpg"
                username={ user?.prenom + ' ' + user?.nom }
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />
            <ScrollView style={styles.container}>
                {/* Message de bienvenue */}
                <Text style={styles.welcomeText}>Bonjour, <Text style={styles.userName}>{user?.prenom}</Text> !</Text>

                {/* Résumé du profil */}
                <View style={styles.profileSummary}>
                    <Ionicons name="person-circle-outline" size={48} color="#4CAF50" />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.profileInfo}>Âge : <Text style={styles.profileValue}>{user?.age} ans</Text></Text>
                        <Text style={styles.profileInfo}>Poids : <Text style={styles.profileValue}>{user?.poids} kg</Text></Text>
                        <Text style={styles.profileInfo}>Objectif : <Text style={styles.profileValue}>{user?.objectif}</Text></Text>
                        <Text style={styles.profileInfo}>Prochaine consultation : <Text style={styles.profileValue}>{user?.prochaineConsultation}</Text></Text>
                    </View>
                </View>

                {/* Conseil du jour */}
                <View style={styles.tipContainer}>
                    <Ionicons name="leaf-outline" size={24} color="#388E3C" />
                    <Text style={styles.tipText}>{conseil}</Text>
                </View>

                

                {/* Bannière promotionnelle */}
                <TouchableOpacity style={styles.promoBanner} onPress={() => navigation.navigate('ClassesMessaging')}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }}
                        style={styles.promoImage}
                    />
                    <View style={styles.promoContent}>
                        <Text style={styles.promoTitle}>Master Class : Nutrition & Bien-être</Text>
                        <Text style={styles.promoSubtitle}>Rejoignez-nous le 20 juillet à 18h !</Text>
                        <Text style={styles.promoCta}>Voir l’événement</Text>
                    </View>
                </TouchableOpacity>

                {/* Statistiques rapides */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>Évolution du poids</Text>
                    <View style={styles.graphContainer}>
                        {/* Graphique simple (barres) */}
                        {poidsData.map((val, idx) => (
                            <View key={idx} style={[styles.bar, { height: 20 + (70 - val) * 10 }]}>
                                <Text style={styles.barLabel}>{val}kg</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container1: {
        flex: 1,
        backgroundColor: '#F6F0F5', // magnolia
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E223D', // space-cadet
        marginBottom: 8,
        textAlign: 'left',
        letterSpacing: 0.2,
    },
    userName: {
        color: '#815F9C', // pomp-and-power
        fontWeight: 'bold',
    },
    profileSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        elevation: 3,
        shadowColor: '#815F9C',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    profileInfo: {
        fontSize: 15,
        color: '#7D5F9B', // pomp-and-power-2
        marginBottom: 2,
    },
    profileValue: {
        color: '#1E223D', // space-cadet
        fontWeight: '700',
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EAE3EC', // magnolia-2
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    tipText: {
        marginLeft: 10,
        color: '#815F9C', // pomp-and-power
        fontSize: 15,
        fontStyle: 'italic',
        flex: 1,
    },
    
    badge: {
        position: 'absolute',
        top: 8,
        right: 18,
        backgroundColor: '#E53935',
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 16,
        alignItems: 'center',
        zIndex: 2,
        borderWidth: 1,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    promoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        elevation: 3,
        shadowColor: '#815F9C',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    promoImage: {
        width: 80,
        height: 80,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    promoContent: {
        flex: 1,
        padding: 14,
    },
    promoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E223D', // space-cadet
        marginBottom: 2,
    },
    promoSubtitle: {
        fontSize: 13,
        color: '#815F9C', // pomp-and-power
        marginBottom: 4,
    },
    promoCta: {
        fontSize: 13,
        color: '#7D5F9B', // pomp-and-power-2
        fontWeight: 'bold',
    },
    statsContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        elevation: 2,
        shadowColor: '#815F9C',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    statsTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1E223D', // space-cadet
        marginBottom: 10,
    },
    graphContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 70,
        marginTop: 8,
        gap: 8,
    },
    bar: {
        width: 72,
        backgroundColor: '#815F9C', // pomp-and-power
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginHorizontal: 2,

    },
    barLabel: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,

    },
});