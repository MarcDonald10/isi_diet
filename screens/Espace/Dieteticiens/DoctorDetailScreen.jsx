import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import { useAuth } from '../../contexts/AuthContext';
import {
    checkExistingRequest,
    getMyDoctors,
    sendDoctorRequest,
} from '../../../services/firebase/firebaseService';
import { useAuth } from '../../../contexts/AuthContext';

const { width } = Dimensions.get('window');
const TABS = ['Profil', 'Disponibilités', 'Avis'];

// ─── Sous-composants ──────────────────────────────────────────────────────────

const Stars = ({ rating = 0, size = 14 }) => (
    <View style={{ flexDirection: 'row', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
        ))}
    </View>
);

const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoIconBox}>
            <Ionicons name={icon} size={16} color="#815F9C" />
        </View>
        <View>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value || '—'}</Text>
        </View>
    </View>
);

const StatPill = ({ value, label, color }) => (
    <View style={[styles.statPill, { borderColor: color + '30' }]}>
        <Text style={[styles.statPillValue, { color }]}>{value}</Text>
        <Text style={styles.statPillLabel}>{label}</Text>
    </View>
);

const MOCK_REVIEWS = [
    { id: '1', author: 'A. Kamga', rating: 5, text: "Très à l'écoute et professionnel. Je recommande vivement.", date: 'Mars 2026' },
    { id: '2', author: 'P. Nkomo', rating: 4, text: 'Bon suivi nutritionnel, plans alimentaires adaptés.', date: 'Fév. 2026' },
    { id: '3', author: 'E. Mbarga', rating: 5, text: 'Résultats visibles dès le premier mois.', date: 'Jan. 2026' },
];

const MOCK_SLOTS = ['Lun 08:00', 'Lun 10:00', 'Mar 09:00', 'Mer 14:00', 'Jeu 11:00', 'Ven 16:00'];

// ─── États du bouton de suivi ─────────────────────────────────────────────────
// idle | loading | pending | following
const FOLLOW_CONFIG = {
    idle: { label: 'Demande de suivi', icon: 'person-add-outline', bg: '#815F9C', color: '#fff', disabled: false },
    loading: { label: 'Envoi en cours…', icon: null, bg: '#A08AB8', color: '#fff', disabled: true },
    pending: { label: 'Demande envoyée', icon: 'time-outline', bg: '#EDE8F5', color: '#815F9C', disabled: true },
    following: { label: 'Suivi en cours', icon: 'checkmark-circle-outline', bg: '#ECFDF5', color: '#10B981', disabled: true },
};

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function DoctorDetailScreen({ route, navigation }) {
    const { doctor = {} } = route.params || {};
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState(0);
    const [followStatus, setFollowStatus] = useState('idle');
    const scrollY = useRef(new Animated.Value(0)).current;

    const name = doctor.nom + ' ' + doctor.prenom || 'Dr. Inconnu';
    const photo = doctor.photo || doctor.dieticianPhoto;
    const speciality = doctor.specialite || doctor.dieticianSpeciality || 'Nutritionniste';
    const rating = doctor.rating || 0;
    const city = doctor.location || 'Inconnu';
    const bio = doctor.bio || 'Aucun détail disponible pour le moment.';

    // ── Vérifier le statut existant au montage ────────────────────────────
    useEffect(() => { checkStatus(); }, [user?.uid, doctor.id]);

    const checkStatus = async () => {
        if (!user?.uid || !doctor.id) return;
        try {
            const myDoctors = await getMyDoctors(user.uid);
            if (myDoctors.some(d => d.id === doctor.id)) { setFollowStatus('following'); return; }
            const hasPending = await checkExistingRequest(user.uid, doctor.id);
            if (hasPending) { setFollowStatus('pending'); return; }
            setFollowStatus('idle');
        } catch (e) { console.error('Erreur vérification statut:', e); }
    };

    // ── Envoyer une demande de suivi ──────────────────────────────────────
    const handleSendRequest = async () => {
        if (!user?.uid) {
            Alert.alert('Connexion requise', 'Vous devez être connecté pour envoyer une demande.');
            return;
        }
        Alert.alert(
            'Demande de suivi',
            `Envoyer une demande de suivi à ${name} ?\n\nIl recevra une notification et pourra accepter ou refuser.`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Envoyer', onPress: async () => {
                        try {
                            setFollowStatus('loading');
                            await sendDoctorRequest(user.uid, doctor.id, user);
                            setFollowStatus('pending');
                            Alert.alert('Demande envoyée ✓', `${name} a bien reçu votre demande de suivi.`);
                        } catch (e) {
                            console.error(e);
                            setFollowStatus('idle');
                            Alert.alert('Erreur', "Impossible d'envoyer la demande. Réessayez.");
                        }
                    }
                },
            ]
        );
    };

    const cfg = FOLLOW_CONFIG[followStatus];

    // ── Animations header ─────────────────────────────────────────────────
    const headerBg = scrollY.interpolate({ inputRange: [100, 160], outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'], extrapolate: 'clamp' });
    const headerOpacity = scrollY.interpolate({ inputRange: [100, 160], outputRange: [0, 1], extrapolate: 'clamp' });

    return (
        <View style={styles.container}>

            {/* ── Header flottant ── */}
            <Animated.View style={[styles.floatingHeader, { backgroundColor: headerBg }]}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={20} color="#1A1035" />
                </TouchableOpacity>
                <Animated.Text style={[styles.floatingHeaderTitle, { opacity: headerOpacity }]} numberOfLines={1}>
                    {name}
                </Animated.Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Ionicons name="share-social-outline" size={20} color="#1A1035" />
                </TouchableOpacity>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
            >
                {/* ── Hero ── */}
                <LinearGradient colors={['#1E1040', '#4A2F7D']} style={styles.heroBg}>
                    <View style={styles.heroDecCircle1} />
                    <View style={styles.heroDecCircle2} />
                    <View style={styles.heroContent}>
                        <View style={styles.avatarWrapper}>
                            {photo ? (
                                <Image source={{ uri: photo }} style={styles.heroAvatar} />
                            ) : (
                                <View style={[styles.heroAvatar, styles.heroAvatarFallback]}>
                                    <Text style={styles.heroAvatarInitials}>
                                        {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.availBadge, { backgroundColor: doctor.available ? '#10B981' : '#6B7280' }]}>
                                <View style={styles.availDot} />
                                <Text style={styles.availText}>{doctor.available ? 'Disponible' : 'Occupé'}</Text>
                            </View>
                        </View>
                        <Text style={styles.heroName}>{name}</Text>
                        <View style={styles.specialityPill}>
                            <MaterialCommunityIcons name="stethoscope" size={13} color="#C4B5D8" />
                            <Text style={styles.specialityText}>{speciality}</Text>
                        </View>
                        <View style={styles.heroRating}>
                            <Stars rating={rating} size={16} />
                            <Text style={styles.heroRatingText}>{rating.toFixed(1)} </Text>
                            {/* <Text style={styles.heroRatingText}>{rating.toFixed(1)} ({doctor.reviewsCount || 24} avis)</Text> */}
                        </View>
                    </View>
                </LinearGradient>

                {/* ── Stats ── */}
                <View style={styles.statsRow}>
                    <StatPill value={doctor.patientsCount || '—'} label="Patients" color="#6366F1" />
                    <StatPill value={`${doctor.experience || 8}`} label="Expérience" color="#10B981" />
                    <StatPill value={`${rating.toFixed(1)}/5`} label="Note" color="#F59E0B" />
                </View>

                {/* ── Onglets ── */}
                <View style={styles.tabsRow}>
                    {TABS.map((t, i) => (
                        <TouchableOpacity key={i} style={[styles.tabItem, activeTab === i && styles.tabItemActive]} onPress={() => setActiveTab(i)}>
                            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.tabContent}>

                    {/* ── PROFIL ── */}
                    {activeTab === 0 && (
                        <View style={{ gap: 16 }}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>À propos</Text>
                                <Text style={styles.bioText}>{bio}</Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Informations</Text>
                                <View style={{ gap: 12 }}>
                                    <InfoRow icon="location-outline" label="Localisation" value={city} />
                                    <InfoRow icon="language-outline" label="Langues" value={doctor.languages?.[0] + ', ' + doctor.languages?.[1] || 'Aucune'} />
                                    <InfoRow icon="school-outline" label="Certifications" value={doctor.certifications?.[0] + ', ' + doctor.certifications?.[1] || 'Aucune'} />
                                    <InfoRow icon="business-outline" label="Cabinet" value={doctor.clinic || 'Clinique Nutritionnelle Centrale'} />
                                </View>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Domaines d'expertise</Text>
                                <View style={styles.expertiseGrid}>
                                    {(doctor.expertise || ['Aucun domaine d\'expertise spécifié']).map((e, i) => (
                                        <View key={i} style={styles.expertiseBadge}>
                                            <Text style={styles.expertiseBadgeText}>{e}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── DISPONIBILITÉS ── */}
                    {activeTab === 1 && (
                        <View style={{ gap: 16 }}>
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>Créneaux habituels</Text>
                                <Text style={styles.slotSubtitle}>Indicatif — les RDV se planifient après acceptation du suivi</Text>
                                <View style={styles.slotsGrid}>
                                    {MOCK_SLOTS.map((slot, i) => (
                                        <View key={i} style={styles.slotChip}>
                                            <Text style={styles.slotText}>{slot}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            {/* Hint contextuel */}
                            <View style={styles.hintCard}>
                                <View style={styles.hintIconBox}>
                                    <Ionicons name="information-circle-outline" size={20} color="#815F9C" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.hintTitle}>Comment prendre rendez-vous ?</Text>
                                    <Text style={styles.hintText}>
                                        Envoyez d'abord une demande de suivi. Une fois que {name} l'accepte, vous pourrez planifier vos consultations ensemble.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── AVIS ── */}
                    {activeTab === 2 && (
                        <View style={{ gap: 12 }}>
                            <View style={[styles.card, styles.ratingCard]}>
                                <View style={styles.ratingCardLeft}>
                                    <Text style={styles.ratingBig}>{rating.toFixed(1)}</Text>
                                    <Stars rating={rating} size={18} />
                                    <Text style={styles.ratingCount}>{doctor.reviewsCount || 0} avis</Text>
                                </View>
                                <View style={styles.ratingBars}>
                                    {[5, 4, 3, 2, 1].map(n => (
                                        <View key={n} style={styles.ratingBarRow}>
                                            <Text style={styles.ratingBarNum}>{n}</Text>
                                            <View style={styles.ratingBarTrack}>
                                                <View style={[styles.ratingBarFill, {
                                                    width: `${n === 5 ? 65 : n === 4 ? 20 : n === 3 ? 10 : 3}%`,
                                                    backgroundColor: n >= 4 ? '#10B981' : n === 3 ? '#F59E0B' : '#EF4444',
                                                }]} />
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            {MOCK_REVIEWS.map(review => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewHeader}>
                                        <View style={styles.reviewAuthorBubble}>
                                            <Text style={styles.reviewAuthorInitial}>{review.author[0]}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewAuthor}>{review.author}</Text>
                                            <Text style={styles.reviewDate}>{review.date}</Text>
                                        </View>
                                        <Stars rating={review.rating} size={12} />
                                    </View>
                                    <Text style={styles.reviewText}>{review.text}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                <View style={{ height: 110 }} />
            </Animated.ScrollView>

            {/* ── CTA fixe ── */}
            <View style={styles.ctaBar}>
                <TouchableOpacity
                    style={styles.ctaSecondary}
                    onPress={() => navigation.navigate('ChatScreen', {
                        dieticienId: doctor?.uid,
                        dieticienName: doctor?.nom + ' ' + doctor?.prenom,
                    })}>
                    <Ionicons name="chatbubble-outline" size={20} color="#815F9C" />
                    <Text style={styles.ctaSecondaryText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.ctaPrimary, { backgroundColor: cfg.bg }, cfg.disabled && { opacity: 0.88 }]}
                    onPress={handleSendRequest}
                    disabled={cfg.disabled}
                    activeOpacity={cfg.disabled ? 1 : 0.8}
                >
                    {followStatus === 'loading' ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            {cfg.icon && <Ionicons name={cfg.icon} size={18} color={cfg.color} />}
                            <Text style={[styles.ctaPrimaryText, { color: cfg.color }]}>{cfg.label}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F0FA' },

    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 36, paddingBottom: 10, paddingHorizontal: 16 },
    headerBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
    floatingHeaderTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '800', color: '#1A1035', marginHorizontal: 8 },

    heroBg: { paddingTop: Platform.OS === 'ios' ? 90 : 76, paddingBottom: 32, paddingHorizontal: 20, overflow: 'hidden' },
    heroDecCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -40 },
    heroDecCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: 0, left: 10 },
    heroContent: { alignItems: 'center' },
    avatarWrapper: { marginBottom: 14, alignItems: 'center' },
    heroAvatar: { width: 96, height: 96, borderRadius: 28, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
    heroAvatarFallback: { backgroundColor: '#4A2F7D', alignItems: 'center', justifyContent: 'center' },
    heroAvatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
    availBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 5, marginTop: 8 },
    availDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    availText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    heroName: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
    specialityPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 12 },
    specialityText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
    heroRating: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    heroRatingText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },

    statsRow: { flexDirection: 'row', marginHorizontal: 16, gap: 10, backgroundColor: '#fff', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, paddingHorizontal: 14, paddingVertical: 16, marginBottom: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) },
    statPill: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingVertical: 10 },
    statPillValue: { fontSize: 16, fontWeight: '800' },
    statPillLabel: { fontSize: 11, color: '#A09AB8', fontWeight: '500', marginTop: 2 },

    tabsRow: { flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1.5, borderColor: '#EDE8F5' },
    tabItem: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#815F9C' },
    tabText: { fontSize: 13, fontWeight: '600', color: '#A09AB8' },
    tabTextActive: { color: '#fff', fontWeight: '700' },
    tabContent: { paddingHorizontal: 16 },

    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#EDE8F5' },
    cardTitle: { fontSize: 14, fontWeight: '800', color: '#1A1035', marginBottom: 12 },

    bioText: { fontSize: 13, color: '#4A4060', lineHeight: 21, fontWeight: '500' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    infoIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center' },
    infoLabel: { fontSize: 11, color: '#A09AB8', fontWeight: '500' },
    infoValue: { fontSize: 13, color: '#1A1035', fontWeight: '700', marginTop: 1 },
    expertiseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    expertiseBadge: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    expertiseBadgeText: { fontSize: 12, color: '#6366F1', fontWeight: '700' },

    slotSubtitle: { fontSize: 12, color: '#A09AB8', marginBottom: 14 },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE8F5', backgroundColor: '#F4F0FA' },
    slotText: { fontSize: 13, fontWeight: '600', color: '#4A4060' },

    hintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F0EDFF', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#DDD6FE' },
    hintIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EDE8F5', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    hintTitle: { fontSize: 13, fontWeight: '800', color: '#1A1035', marginBottom: 4 },
    hintText: { fontSize: 12, color: '#4A4060', lineHeight: 18 },

    ratingCard: { flexDirection: 'row', gap: 16 },
    ratingCardLeft: { alignItems: 'center', justifyContent: 'center', gap: 6 },
    ratingBig: { fontSize: 40, fontWeight: '800', color: '#1A1035', lineHeight: 44 },
    ratingCount: { fontSize: 11, color: '#A09AB8', fontWeight: '500' },
    ratingBars: { flex: 1, gap: 5, justifyContent: 'center' },
    ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ratingBarNum: { fontSize: 11, color: '#A09AB8', width: 10, fontWeight: '600' },
    ratingBarTrack: { flex: 1, height: 6, backgroundColor: '#F4F0FA', borderRadius: 3, overflow: 'hidden' },
    ratingBarFill: { height: '100%', borderRadius: 3 },
    reviewCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#EDE8F5' },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    reviewAuthorBubble: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
    reviewAuthorInitial: { fontSize: 15, fontWeight: '800', color: '#6366F1' },
    reviewAuthor: { fontSize: 13, fontWeight: '800', color: '#1A1035' },
    reviewDate: { fontSize: 11, color: '#A09AB8', marginTop: 1 },
    reviewText: { fontSize: 13, color: '#4A4060', lineHeight: 20 },

    ctaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16, gap: 12, borderTopWidth: 1, borderTopColor: '#EDE8F5' },
    ctaSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#EDE8F5', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13 },
    ctaSecondaryText: { fontSize: 14, fontWeight: '700', color: '#815F9C' },
    ctaPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
    ctaPrimaryText: { fontSize: 14, fontWeight: '800' },
});