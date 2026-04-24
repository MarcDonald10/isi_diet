import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Header from '../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { getDocumentsByConditions } from '../../services/firebase/firebaseService';

const { width } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

const formatRelative = (ts) => {
    if (!ts) return '';
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        const diff = Date.now() - d.getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const day = Math.floor(diff / 86400000);
        if (m < 2)   return "À l'instant";
        if (m < 60)  return `Il y a ${m}min`;
        if (h < 24)  return `Il y a ${h}h`;
        if (day < 2) return 'Hier';
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    } catch { return ''; }
};

const PALETTE = ['#A78BFA', '#34D399', '#F472B6', '#60A5FA', '#FBBF24', '#F87171'];
const colorFromName = (name = '') => PALETTE[name.charCodeAt(0) % PALETTE.length];
const initialsFrom  = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const ACTIVITY_MAP = {
    premiere: { icon: 'person-add-outline',     color: '#6366F1' },
    suivi:    { icon: 'refresh-circle-outline', color: '#10B981' },
    bilan:    { icon: 'clipboard-outline',       color: '#F59E0B' },
    urgence:  { icon: 'alert-circle-outline',   color: '#EF4444' },
    default:  { icon: 'calendar-outline',       color: '#815F9C' },
};
const activityMeta = (type) => ACTIVITY_MAP[type] || ACTIVITY_MAP.default;

// ─── Sous-composants ──────────────────────────────────────────────────────────

const SectionTitle = ({ label }) => <Text style={styles.sectionTitle}>{label}</Text>;

const AppointmentCard = ({ appt, navigation }) => {
    const isConfirmed = appt.status === 'confirmed';
    const name  = appt.patientName || '—';
    const color = colorFromName(name);
    return (
        <TouchableOpacity
            style={styles.apptCard}
            activeOpacity={0.82}
            onPress={() => navigation?.navigate('AppointmentDetail', { appt })}
        >
            {appt.patientPhoto ? (
                <Image source={{ uri: appt.patientPhoto }} style={styles.apptAvatarImg} />
            ) : (
                <View style={[styles.apptAvatar, { backgroundColor: color + '22' }]}>
                    <Text style={[styles.apptInitials, { color }]}>{initialsFrom(name)}</Text>
                </View>
            )}
            <View style={styles.apptInfo}>
                <Text style={styles.apptName} numberOfLines={1}>{name}</Text>
                <Text style={styles.apptType} numberOfLines={1}>{appt.typeLabel || appt.type || '—'}</Text>
            </View>
            <View style={styles.apptRight}>
                <View style={[styles.apptTimePill, { backgroundColor: color + '18' }]}>
                    <Ionicons name="time-outline" size={12} color={color} />
                    <Text style={[styles.apptTimeText, { color }]}>{appt.heure || '—'}</Text>
                </View>
                <View style={[styles.apptStatusDot, { backgroundColor: isConfirmed ? '#10B981' : '#F59E0B' }]} />
            </View>
        </TouchableOpacity>
    );
};

const UpcomingCard = ({ appt, navigation }) => (
    <TouchableOpacity
        style={styles.upcomingCard}
        activeOpacity={0.82}
        onPress={() => navigation?.navigate('AppointmentDetail', { appt })}
    >
        <View style={styles.upcomingDateBox}>
            <Text style={styles.upcomingDay}>
                {new Date(appt.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit' })}
            </Text>
            <Text style={styles.upcomingMonth}>
                {new Date(appt.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })}
            </Text>
        </View>
        <View style={styles.upcomingInfo}>
            <Text style={styles.upcomingName} numberOfLines={1}>{appt.patientName}</Text>
            <Text style={styles.upcomingType} numberOfLines={1}>{appt.typeLabel || appt.type}</Text>
        </View>
        <View style={styles.upcomingTimePill}>
            <Ionicons name="time-outline" size={12} color="#815F9C" />
            <Text style={styles.upcomingTimeText}>{appt.heure}</Text>
        </View>
    </TouchableOpacity>
);

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function DieticianHomeScreen({ navigation }) {
    const { user } = useAuth();

    const [refreshing, setRefreshing]       = useState(false);
    const [loading, setLoading]             = useState(true);
    const [todayAppts, setTodayAppts]       = useState([]);
    const [futureAppts, setFutureAppts]     = useState([]);
    const [allAppts, setAllAppts]           = useState([]);
    const [patientsCount, setPatientsCount] = useState(0);
    const [recentActivity, setRecentActivity] = useState([]);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const cardsAnim  = useRef(new Animated.Value(0)).current;
    const listAnim   = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(120, [
            Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.spring(cardsAnim,  { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.spring(listAnim,   { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        ]).start();
        loadData();
    }, [user?.uid]);

    const loadData = async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const today = todayStr();

            const appts = await getDocumentsByConditions('appointments', [
                ['dieticianId', '==', user.uid],
            ]).catch(() => []);

            const sorted = (appts || []).sort((a, b) => {
                const da = new Date(`${a.date}T${a.heure || '00:00'}`);
                const db = new Date(`${b.date}T${b.heure || '00:00'}`);
                return da - db;
            });

            setAllAppts(sorted);
            setTodayAppts(sorted.filter(a => a.date === today));
            setFutureAppts(sorted.filter(a => a.date > today).slice(0, 3));

            // Patients uniques
            const ids = new Set(sorted.map(a => a.patientId).filter(Boolean));
            setPatientsCount(ids.size);

            // Activité récente = 3 derniers RDV passés
            const past = sorted
                .filter(a => a.date < today)
                .slice(-3)
                .reverse()
                .map(a => ({
                    ...activityMeta(a.type),
                    text: `${a.typeLabel || a.type} — ${a.patientName}`,
                    time: formatRelative(a.updatedAt || a.createdAt),
                }));

            setRecentActivity(
                past.length > 0 ? past : [
                    { icon: 'calendar-outline', color: '#A09AB8', text: 'Aucune activité récente', time: '' },
                ]
            );
        } catch (e) {
            console.error('Dashboard load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

    const dayLabel = (() => {
        const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
        return s.charAt(0).toUpperCase() + s.slice(1);
    })();

    const quickActions = [
        { icon: 'calendar-plus',      label: 'Planifier\nRDV',    color: '#10B981', bg: '#ECFDF5', nav: 'NewAppointment' },
    ];

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Header
                onProfilePress={() => navigation?.navigate('Profile')}
                onNotificationPress={() => navigation?.navigate('Notifications')}
                notificationCount={todayAppts.length}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#815F9C" />}
            >
                {/* ── Hero ── */}
                <Animated.View style={[styles.hero, {
                    opacity: headerAnim,
                    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }]}>
                    <LinearGradient colors={['#1E1040', '#3D2070']} style={styles.heroBg}>
                        <View style={styles.heroCircle1} />
                        <View style={styles.heroCircle2} />
                        <View style={styles.heroContent}>
                            <View style={styles.heroLeft}>
                                <View style={styles.heroPill}>
                                    <View style={styles.heroPillDot} />
                                    <Text style={styles.heroPillText}>En service</Text>
                                </View>
                                <Text style={styles.heroGreeting}>Bonjour,</Text>
                                <Text style={styles.heroName}>{user?.prenom || user?.nom || 'Diét.'} 👋</Text>
                                <Text style={styles.heroDate}>{dayLabel}</Text>
                                <View style={styles.heroStats}>
                                    <View style={styles.heroStatItem}>
                                        <Text style={styles.heroStatValue}>{loading ? '—' : todayAppts.length}</Text>
                                        <Text style={styles.heroStatLabel}>Auj.</Text>
                                    </View>
                                    <View style={styles.heroStatSep} />
                                    <View style={styles.heroStatItem}>
                                        <Text style={styles.heroStatValue}>{loading ? '—' : allAppts.length}</Text>
                                        <Text style={styles.heroStatLabel}>Total RDV</Text>
                                    </View>
                                    <View style={styles.heroStatSep} />
                                    <View style={styles.heroStatItem}>
                                        <Text style={[styles.heroStatValue, { color: '#4ADE80' }]}>{loading ? '—' : patientsCount}</Text>
                                        <Text style={styles.heroStatLabel}>Patients</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.heroRight}>
                                <Image
                                    source={{ uri: user?.photo || user?.photoUri || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                                    style={styles.heroAvatar}
                                />
                                <View style={styles.heroBadge}>
                                    <MaterialCommunityIcons name="stethoscope" size={12} color="#fff" />
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* ── Actions rapides ── */}
                <Animated.View style={[styles.section, {
                    opacity: cardsAnim,
                    transform: [{ translateY: cardsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }]}>
                    <SectionTitle label="Actions rapides" />
                    <View style={styles.quickGrid}>
                        {quickActions.map((a, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.quickCard, { backgroundColor: a.bg }]}
                                onPress={() => navigation?.navigate(a.nav)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.quickIconBox, { backgroundColor: a.color }]}>
                                    <MaterialCommunityIcons name={a.icon} size={22} color="#fff" />
                                </View>
                                <Text style={[styles.quickLabel, { color: a.color }]}>{a.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* ── RDV du jour ── */}
                <Animated.View style={[styles.section, {
                    opacity: listAnim,
                    transform: [{ translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                }]}>
                    <View style={styles.sectionRow}>
                        <SectionTitle label="Rendez-vous du jour" />
                        <TouchableOpacity
                            style={styles.seeAllBtn}
                            onPress={() => navigation?.navigate('AllAppointments', { appointments: allAppts })}
                        >
                            <Text style={styles.seeAllText}>Voir tout</Text>
                            <Ionicons name="arrow-forward" size={14} color="#815F9C" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.skeletonWrap}>
                            {[1, 2, 3].map(i => <View key={i} style={styles.skeleton} />)}
                        </View>
                    ) : todayAppts.length > 0 ? (
                        todayAppts.map(appt => (
                            <AppointmentCard key={appt.id} appt={appt} navigation={navigation} />
                        ))
                    ) : (
                        <View style={styles.emptyBox}>
                            <Ionicons name="calendar-outline" size={34} color="#C4B5D8" />
                            <Text style={styles.emptyText}>Aucun RDV aujourd'hui</Text>
                            <TouchableOpacity
                                style={styles.emptyBtn}
                                onPress={() => navigation?.navigate('NewAppointment')}
                            >
                                <Text style={styles.emptyBtnText}>Planifier un RDV</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>

                {/* ── Prochains RDV ── */}
                {futureAppts.length > 0 && (
                    <Animated.View style={[styles.section, { opacity: listAnim }]}>
                        <View style={styles.sectionRow}>
                            <SectionTitle label="Prochains rendez-vous" />
                            <TouchableOpacity
                                style={styles.seeAllBtn}
                                onPress={() => navigation?.navigate('AllAppointments', { appointments: allAppts })}
                            >
                                <Text style={styles.seeAllText}>Tout voir</Text>
                                <Ionicons name="arrow-forward" size={14} color="#815F9C" />
                            </TouchableOpacity>
                        </View>
                        {futureAppts.map(appt => (
                            <UpcomingCard key={appt.id} appt={appt} navigation={navigation} />
                        ))}
                    </Animated.View>
                )}

                {/* ── Activité récente ── */}
                <Animated.View style={[styles.section, { opacity: listAnim }]}>
                    <SectionTitle label="Activité récente" />
                    <View style={styles.activityCard}>
                        {recentActivity.map((item, i) => (
                            <View key={i} style={[styles.activityRow, i < recentActivity.length - 1 && styles.activityRowBorder]}>
                                <View style={[styles.activityIcon, { backgroundColor: item.color + '18' }]}>
                                    <Ionicons name={item.icon} size={18} color={item.color} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityText} numberOfLines={2}>{item.text}</Text>
                                    {!!item.time && <Text style={styles.activityTime}>{item.time}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F0FA', marginTop: '5%' },
    scroll:    { paddingBottom: 20 },

    // Hero
    hero:        { marginBottom: 24 },
    heroBg:      { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
    heroCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.04)', top: -40, right: -30 },
    heroCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', bottom: 10, left: 20 },
    heroContent: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    heroLeft:    { flex: 1 },
    heroRight:   { marginLeft: 16, alignItems: 'center' },
    heroPill:    { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12, gap: 6 },
    heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80' },
    heroPillText:{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
    heroGreeting:{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },
    heroName:    { color: '#fff', fontSize: 24, fontWeight: '800', marginVertical: 3, letterSpacing: -0.3 },
    heroDate:    { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 18 },
    heroStats:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
    heroStatItem:{ alignItems: 'center', flex: 1 },
    heroStatSep: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.15)' },
    heroStatValue:{ color: '#fff', fontSize: 18, fontWeight: '800' },
    heroStatLabel:{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500', marginTop: 1 },
    heroAvatar:  { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)' },
    heroBadge:   { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1E1040' },

    // Sections
    section:     { paddingHorizontal: 18, marginBottom: 22 },
    sectionRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle:{ fontSize: 15, fontWeight: '800', color: '#1A1035', marginBottom: 14, letterSpacing: -0.2 },
    seeAllBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
    seeAllText:  { fontSize: 12, fontWeight: '600', color: '#815F9C' },

    // Quick actions
    quickGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    quickCard:   { width: (width - 36 - 12) / 2 - 6, borderRadius: 16, padding: 16, alignItems: 'flex-start', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
    quickIconBox:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    quickLabel:  { fontSize: 12, fontWeight: '700', lineHeight: 17 },

    // Today appt card
    apptCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#EDE8F5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
    apptAvatar:   { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    apptAvatarImg:{ width: 46, height: 46, borderRadius: 14, marginRight: 12 },
    apptInitials: { fontSize: 15, fontWeight: '800' },
    apptInfo:     { flex: 1 },
    apptName:     { fontSize: 14, fontWeight: '700', color: '#1A1035', marginBottom: 3 },
    apptType:     { fontSize: 12, color: '#8B80A0', fontWeight: '500' },
    apptRight:    { alignItems: 'flex-end', gap: 8 },
    apptTimePill: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    apptTimeText: { fontSize: 11, fontWeight: '700' },
    apptStatusDot:{ width: 8, height: 8, borderRadius: 4 },

    // Upcoming card
    upcomingCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: '#EDE8F5', gap: 12 },
    upcomingDateBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F0EDFF', alignItems: 'center', justifyContent: 'center' },
    upcomingDay:     { fontSize: 17, fontWeight: '800', color: '#815F9C', lineHeight: 19 },
    upcomingMonth:   { fontSize: 10, fontWeight: '700', color: '#A09AB8', textTransform: 'uppercase' },
    upcomingInfo:    { flex: 1 },
    upcomingName:    { fontSize: 13, fontWeight: '700', color: '#1A1035', marginBottom: 2 },
    upcomingType:    { fontSize: 11, color: '#A09AB8', fontWeight: '500' },
    upcomingTimePill:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0EDFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
    upcomingTimeText:{ fontSize: 11, fontWeight: '700', color: '#815F9C' },

    // Empty state
    emptyBox:    { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#EDE8F5', gap: 10 },
    emptyText:   { fontSize: 13, color: '#A09AB8', fontWeight: '500' },
    emptyBtn:    { backgroundColor: '#815F9C', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
    emptyBtnText:{ color: '#fff', fontSize: 13, fontWeight: '700' },

    // Skeleton
    skeletonWrap:{ gap: 10 },
    skeleton:    { height: 72, borderRadius: 16, backgroundColor: '#EDE8F5' },

    // Activity
    activityCard:     { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#EDE8F5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }) },
    activityRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
    activityRowBorder:{ borderBottomWidth: 1, borderBottomColor: '#F3F0F8' },
    activityIcon:     { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    activityInfo:     { flex: 1 },
    activityText:     { fontSize: 13, fontWeight: '600', color: '#1A1035', marginBottom: 3 },
    activityTime:     { fontSize: 11, color: '#A0949E', fontWeight: '500' },
});