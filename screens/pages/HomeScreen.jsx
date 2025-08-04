import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';

// Exemple de données utilisateur (à remplacer par vos données dynamiques)
const user = {
    prenom: 'Sarah',
    age: 32,
    poids: 68,
    objectif: 'Perdre 5kg',
    prochaineConsultation: '18/07/2025',
    pathologie: 'Diabète',
    messagesNonLus: 2,
};

export default function HomeScreen() {
    const navigation = useNavigation();
    const [poidsData] = useState([70, 69, 68.5, 68]); // Ex. pour le graphique

    // Conseil du jour basé sur le profil
    const conseil = user.pathologie === 'Diabète'
        ? "Pour votre diabète, privilégiez les légumes verts aujourd’hui."
        : "Buvez un grand verre d’eau avant chaque repas !";

    return (
        <View style={styles.container1}>
            <Header
                userPhoto="https://example.com/user-photo.jpg"
                username="Jean Dupont"
                onChatPress={() => navigation.navigate('Messagerie')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />
            <ScrollView style={styles.container}>
                {/* Message de bienvenue */}
                <Text style={styles.welcomeText}>Bonjour, <Text style={styles.userName}>{user.prenom}</Text> !</Text>

                {/* Résumé du profil */}
                <View style={styles.profileSummary}>
                    <Ionicons name="person-circle-outline" size={48} color="#4CAF50" />
                    <View style={{ marginLeft: 12 }}>
                        <Text style={styles.profileInfo}>Âge : <Text style={styles.profileValue}>{user.age} ans</Text></Text>
                        <Text style={styles.profileInfo}>Poids : <Text style={styles.profileValue}>{user.poids} kg</Text></Text>
                        <Text style={styles.profileInfo}>Objectif : <Text style={styles.profileValue}>{user.objectif}</Text></Text>
                        <Text style={styles.profileInfo}>Prochaine consultation : <Text style={styles.profileValue}>{user.prochaineConsultation}</Text></Text>
                    </View>
                </View>

                {/* Conseil du jour */}
                <View style={styles.tipContainer}>
                    <Ionicons name="leaf-outline" size={24} color="#388E3C" />
                    <Text style={styles.tipText}>{conseil}</Text>
                </View>

                {/* Accès rapide */}
                <View style={styles.quickAccess}>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('StatistiquesSuivi')}>
                        <Ionicons name="stats-chart-outline" size={28} color="#4CAF50" />
                        <Text style={styles.quickLabel}>Statistiques et Suivi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('Paiements')}>
                        <Ionicons name="card-outline" size={28} color="#4CAF50" />
                        <Text style={styles.quickLabel}>Paiements</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('MasterClasses')}>
                        <MaterialIcons name="school" size={28} color="#4CAF50" />
                        <Text style={styles.quickLabel}>Master Classes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickButton} onPress={() => navigation.navigate('ConseilsNutritionnels')}>
                        <Ionicons name="book-outline" size={28} color="#4CAF50" />
                        
                        <Text style={styles.quickLabel}>Conseils Nutritionnels</Text>
                    </TouchableOpacity>
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
    quickAccess: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 22,
        gap: 2,
    },
    quickButton: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 16,
        elevation: 2,
        shadowColor: '#815F9C',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        position: 'relative',
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        // minWidth: 90,
    },
    quickLabel: {
        marginTop: 7,
        fontSize: 12,
        color: '#815F9C', // pomp-and-power
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 0.2,
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