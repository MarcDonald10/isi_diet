import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { getPendingRequests } from '../../services/firebase/firebaseService';
import Header from '../components/Header';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
    const navigation = useNavigation();
    const [poidsData] = useState([70, 69, 68.5, 68]);
    const { user, loading } = useAuth();
    const [pendingRequests, setPendingRequests] = useState(0);
    const [scaleAnim] = useState(new Animated.Value(1));
    
    // States pour la modal IMC
    const [showIMCModal, setShowIMCModal] = useState(false);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [imc, setIMC] = useState(null);
    const [diagnostic, setDiagnostic] = useState('');

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

    // Calculer l'IMC et générer le diagnostic
    const calculateIMC = () => {
        if (!height || !weight) {
            Alert.alert('Erreur', 'Veuillez entrer la taille et le poids');
            return;
        }

        const h = parseFloat(height) / 100; // Convertir cm en m
        const w = parseFloat(weight);

        if (h <= 0 || w <= 0) {
            Alert.alert('Erreur', 'Veuillez entrer des valeurs valides');
            return;
        }

        const imcValue = (w / (h * h)).toFixed(1);
        setIMC(imcValue);

        // Générer le diagnostic préliminaire
        let diagnostic = '';
        let color = '#666';

        if (imcValue < 18.5) {
            diagnostic = 'Poids insuffisant\n\nVous êtes en dessous du poids normal. Une consultation avec un professionnel est recommandée pour augmenter votre consommation calorique de manière saine.';
            color = '#FFB347';
        } else if (imcValue >= 18.5 && imcValue < 25) {
            diagnostic = 'Poids normal ✓\n\nBravo ! Votre IMC est dans la plage saine. Continuez à maintenir une alimentation équilibrée et une activité physique régulière.';
            color = '#4CAF50';
        } else if (imcValue >= 25 && imcValue < 30) {
            diagnostic = 'Surpoids\n\nVous êtes légèrement au-dessus du poids normal. Je recommande une augmentation progressive de l\'activité physique et une réduction modérée des calories.';
            color = '#FF9800';
        } else {
            diagnostic = 'Obésité\n\nVotre IMC indique une obésité. Une consultation médicale et un plan nutritionnel personnalisé sont fortement recommandés.';
            color = '#F44336';
        }

        setDiagnostic({ text: diagnostic, color });
    };

    const resetIMCModal = () => {
        setHeight('');
        setWeight('');
        setIMC(null);
        setDiagnostic('');
        setShowIMCModal(false);
    };

    const conseil = user?.pathologie === 'Diabète'
        ? "Pour votre diabète, privilégiez les légumes verts aujourd'hui."
        : "Buvez un grand verre d'eau avant chaque repas !";

    return (
        <View style={styles.container1}>
            <Header
                userPhoto="https://example.com/user-photo.jpg"
                username={ user?.prenom + ' ' + user?.nom }
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />
            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
            >
                {/* Message de bienvenue amélioré */}
                <View style={styles.welcomeSection}>
                    <Text style={styles.welcomeText}>
                        Bonjour, <Text style={styles.userName}>{user?.prenom}</Text> 👋
                    </Text>
                    <Text style={styles.welcomeSubtext}>Excellente journée pour prendre soin de ta santé !</Text>
                </View>


                {/* Carte profil premium */}
                <TouchableOpacity 
                    style={styles.profileCard}
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#815F9C', '#6B4D80']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileGradient}
                    >
                        <View style={styles.profileLeft}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle-outline" size={60} color="#fff" />
                            </View>
                            <View style={styles.profileTextContainer}>
                                <Text style={styles.profileName}>{user?.prenom} {user?.nom}</Text>
                                <Text style={styles.profileStatus}>✓ Suivi en cours</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Indicateurs de santé en grille */}
                <View style={styles.healthIndicators}>
                    <View style={[styles.indicator, styles.indicatorAge]}>
                        <View style={styles.indicatorIconBox}>
                            <Ionicons name="calendar-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.indicatorValue}>{user?.age}</Text>
                        <Text style={styles.indicatorLabel}>Ans</Text>
                    </View>

                    <View style={[styles.indicator, styles.indicatorWeight]}>
                        <View style={styles.indicatorIconBox}>
                            <Ionicons name="scale-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.indicatorValue}>{user?.poids}</Text>
                        <Text style={styles.indicatorLabel}>kg</Text>
                    </View>

                    <View style={[styles.indicator, styles.indicatorGoal]}>
                        <View style={styles.indicatorIconBox}>
                            <Ionicons name="analytics-outline" size={24} color="#fff" />
                        </View>
                        <Text style={styles.indicatorValue}>80%</Text>
                        <Text style={styles.indicatorLabel}>Progr.</Text>
                    </View>
                </View>

                {/* Conseil du jour premium */}
                <TouchableOpacity style={styles.tipContainer} activeOpacity={0.8} onPress={() => setShowIMCModal(true)}>
                    <View style={styles.tipIcon}>
                        <Ionicons name="body-outline" size={28} color="#fff" />
                    </View>
                    <View style={styles.tipContent}>
                        <Text style={styles.tipTitle}>💡Cliquez ici pour calculer votre IMC</Text>
                        <Text style={styles.tipText}>Diagnostic instantané</Text>
                    </View>
                    <Ionicons name="chevron-forward-outline" size={20} color="#FF9800" />
                </TouchableOpacity>

                {/* Demandes de médecins - Notification importante */}
                <TouchableOpacity 
                        style={styles.doctorRequestCard}
                        onPress={() => navigation.navigate('DoctorRequests')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FF6B6B', '#E53935']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.requestGradient}
                        >
                            <View style={styles.requestLeft}>
                                <View style={styles.requestIconContainer}>
                                    <Ionicons name="person-circle-outline" size={40} color="#fff" />
                                </View>
                                <View style={styles.requestContent}>
                                    <Text style={styles.requestTitle}>Liste des médecins</Text>
                                    <Text style={styles.requestSubtext}>
                                        consultez un médecin pour un suivi personnalisé et des conseils adaptés à votre condition.
                                    </Text>
                                </View>
                            </View>
                            <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
                                <Ionicons name="chevron-forward" size={24} color="#E53935" />
                            </Animated.View>
                        </LinearGradient>
                    </TouchableOpacity>

               

                {/* Bannière Master Class Améliorée */}
                {/* <TouchableOpacity 
                    style={styles.promoBanner} 
                    onPress={() => navigation.navigate('MasterClasses')}
                    activeOpacity={0.85}
                >
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' }}
                        style={styles.promoImage}
                    />
                    <View style={styles.promoOverlay} />
                    <View style={styles.promoContent}>
                        <View style={styles.promoBadge}>
                            <Text style={styles.promoBadgeText}>🔴 EN LIVE</Text>
                        </View>
                        <Text style={styles.promoTitle}>Master Class</Text>
                        <Text style={styles.promoSubtitle}>Nutrition & Bien-être</Text>
                        <View style={styles.promoFooter}>
                            <Ionicons name="calendar-outline" size={14} color="#fff" />
                            <Text style={styles.promoDate}>20 juillet à 18h</Text>
                        </View>
                    </View>
                </TouchableOpacity> */}

                {/* Graphique poids redesigné */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <View>
                            <Text style={styles.chartTitle}>📊 Votre progression</Text>
                            <Text style={styles.chartSubtitle}>Derniers 4 jours</Text>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="arrow-forward-outline" size={20} color="#815F9C" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.graphContainer}>
                        {poidsData.map((val, idx) => {
                            const maxVal = 70;
                            const minVal = 68;
                            const range = maxVal - minVal;
                            const heightPercent = ((val - minVal) / range) * 100;
                            const isLatest = idx === poidsData.length - 1;
                            
                            return (
                                <View key={idx} style={styles.barWrapper}>
                                    <View 
                                        style={[
                                            styles.bar, 
                                            { 
                                                height: 120 * (heightPercent / 100),
                                            }
                                        ]} 
                                    >
                                        <LinearGradient
                                            colors={isLatest ? ['#815F9C', '#6B4D80'] : ['#D4A5D4', '#C291C2']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 0, y: 1 }}
                                            style={styles.barGradient}
                                        />
                                    </View>
                                    <Text style={styles.barValue}>{val}</Text>
                                    <Text style={styles.barDate}>J{idx + 1}</Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.chartFooter}>
                        <Text style={styles.chartFooterText}>
                            Objectif: <Text style={styles.chartFooterValue}>{user?.objectif}</Text>
                        </Text>
                    </View>
                </View>

                {/* Espaceur */}
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal Calcul IMC */}
            <Modal
                visible={showIMCModal}
                transparent
                animationType="fade"
                onRequestClose={resetIMCModal}
            >
                <View style={styles.imcModalOverlay}>
                    <View style={styles.imcModalContent}>
                        {/* Header */}
                        <View style={styles.imcModalHeader}>
                            <Text style={styles.imcModalTitle}>📊 Calcul IMC</Text>
                            <TouchableOpacity onPress={resetIMCModal}>
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {!imc ? (
                            <>
                                {/* Formulaire d'entrée */}
                                <View style={styles.imcInputSection}>
                                    <View style={styles.imcInputGroup}>
                                        <Text style={styles.imcInputLabel}>Taille (cm)</Text>
                                        <TextInput
                                            style={styles.imcInput}
                                            placeholder="Exemple: 175"
                                            keyboardType="decimal-pad"
                                            value={height}
                                            onChangeText={setHeight}
                                            placeholderTextColor="#CCC"
                                        />
                                    </View>

                                    <View style={styles.imcInputGroup}>
                                        <Text style={styles.imcInputLabel}>Poids (kg)</Text>
                                        <TextInput
                                            style={styles.imcInput}
                                            placeholder="Exemple: 70"
                                            keyboardType="decimal-pad"
                                            value={weight}
                                            onChangeText={setWeight}
                                            placeholderTextColor="#CCC"
                                        />
                                    </View>
                                </View>

                                {/* Bouton Calculer */}
                                <TouchableOpacity 
                                    style={styles.imcCalculateButton}
                                    onPress={calculateIMC}
                                >
                                    <LinearGradient
                                        colors={['#FF6B6B', '#FF8E72']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.imcCalculateGradient}
                                    >
                                        <Text style={styles.imcCalculateText}>Calculer mon IMC</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Résultat IMC */}
                                <View style={styles.imcResultSection}>
                                    <View style={[styles.imcResultCard, { borderColor: diagnostic?.color }]}>
                                        <Text style={styles.imcResultLabel}>Votre IMC</Text>
                                        <Text style={[styles.imcResultValue, { color: diagnostic?.color }]}>
                                            {imc}
                                        </Text>
                                    </View>

                                    {/* Diagnostic */}
                                    <View style={[styles.imcDiagnosticCard, { backgroundColor: diagnostic?.color + '15' }]}>
                                        <View style={[styles.imcDiagnosticIcon, { backgroundColor: diagnostic?.color }]}>
                                            <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                        </View>
                                        <Text style={[styles.imcDiagnosticText, { color: '#333' }]}>
                                            {diagnostic?.text}
                                        </Text>
                                    </View>
                                </View>

                                {/* Boutons d'action */}
                                <View style={styles.imcActionButtons}>
                                    <TouchableOpacity 
                                        style={styles.imcButtonReset}
                                        onPress={() => {
                                            setHeight('');
                                            setWeight('');
                                            setIMC(null);
                                            setDiagnostic('');
                                        }}
                                    >
                                        <Text style={styles.imcButtonResetText}>Recalculer</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={styles.imcButtonClose}
                                        onPress={resetIMCModal}
                                    >
                                        <LinearGradient
                                            colors={['#815F9C', '#6B4D80']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={styles.imcButtonCloseGradient}
                                        >
                                            <Text style={styles.imcButtonCloseText}>Fermer</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container1: {
        flex: 1,
        backgroundColor: '#F8F7FC',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    welcomeSection: {
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E223D',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    userName: {
        color: '#815F9C',
    },
    welcomeSubtext: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    // Profile Card
    profileCard: {
        marginBottom: 20,
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#815F9C',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    profileGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        paddingRight: 16,
    },
    profileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: 16,
    },
    profileTextContainer: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    profileStatus: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    // Health Indicators
    healthIndicators: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    indicator: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    indicatorAge: {
        backgroundColor: '#4A90E2',
    },
    indicatorWeight: {
        backgroundColor: '#10B981',
    },
    indicatorGoal: {
        backgroundColor: '#8B5CF6',
    },
    indicatorIconBox: {
        marginBottom: 6,
    },
    indicatorValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    indicatorLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    // Tip Container
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF9800',
        elevation: 3,
        shadowColor: '#FF9800',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    tipIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#FF9800',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    tipContent: {
        flex: 1,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E65100',
        marginBottom: 2,
    },
    tipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
        lineHeight: 18,
    },
    // Doctor Request Card
    doctorRequestCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#FF6B6B',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
    },
    requestGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    requestLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requestContent: {
        flex: 1,
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    requestSubtext: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '500',
    },
    badge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    badgeText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FF6B6B',
    },
    // Services Section
    servicesSection: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E223D',
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    serviceCard: {
        width: '48%',
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    serviceGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    serviceCardText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    // Promo Banner
    promoBanner: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
    },
    promoImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    promoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    promoContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
    },
    promoBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    promoBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    promoTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    promoSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.95)',
        fontWeight: '600',
        marginBottom: 8,
    },
    promoFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    promoDate: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    // Chart Card
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E223D',
        marginBottom: 2,
    },
    chartSubtitle: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    graphContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        height: 160,
        marginBottom: 14,
        paddingHorizontal: 8,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
    },
    bar: {
        width: '70%',
        borderRadius: 8,
        justifyContent: 'flex-end',
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#815F9C',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    barGradient: {
        width: '100%',
        height: '100%',
    },
    barValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E223D',
        marginTop: 6,
    },
    barDate: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginTop: 2,
    },
    chartFooter: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E8E8E8',
    },
    chartFooterText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    chartFooterValue: {
        fontWeight: '700',
        color: '#815F9C',
    },

    /* Styles IMC Modal */
    imcModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp('5%'),
    },
    imcModalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: wp('6%'),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    imcModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: hp('2%'),
        paddingBottom: hp('1.5%'),
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },
    imcModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    imcInputSection: {
        marginVertical: hp('2%'),
    },
    imcInputGroup: {
        marginBottom: hp('2%'),
    },
    imcInputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    imcInput: {
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        backgroundColor: '#F5F5F5',
    },
    imcCalculateButton: {
        marginTop: hp('2%'),
        borderRadius: 12,
        overflow: 'hidden',
    },
    imcCalculateGradient: {
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imcCalculateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    imcResultSection: {
        marginVertical: hp('2%'),
    },
    imcResultCard: {
        borderWidth: 2,
        borderRadius: 15,
        padding: wp('5%'),
        marginBottom: hp('2%'),
        backgroundColor: '#F9F9F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imcResultLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    imcResultValue: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: 1,
    },
    imcDiagnosticCard: {
        borderRadius: 12,
        paddingVertical: hp('2%'),
        paddingHorizontal: wp('5%'),
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
    },
    imcDiagnosticIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    imcDiagnosticText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    imcActionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: hp('2%'),
    },
    imcButtonReset: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#FF6B6B',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imcButtonResetText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF6B6B',
    },
    imcButtonClose: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    imcButtonCloseGradient: {
        paddingVertical: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imcButtonCloseText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
});
