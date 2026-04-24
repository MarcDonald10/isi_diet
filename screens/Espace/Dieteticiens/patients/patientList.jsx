import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../../contexts/AuthContext';
import { getOrCreateConversation } from '../../../../services/firebase/chatServices';
import {
    acceptDoctorRequest,
    getDocumentsByConditions,
    rejectDoctorRequest,
} from '../../../../services/firebase/firebaseService';
import Header from '../../../components/Header';

const { width } = Dimensions.get('window');

const FILTERS  = ['Tous', 'Diabète', 'Hypertension', 'Obésité'];
const TABS     = [
    { key: 'patients',  label: 'Mes patients',  icon: 'people-outline'  },
    { key: 'requests',  label: 'Demandes',       icon: 'mail-outline'    },
];

// ─── Initiales avatar ─────────────────────────────────────────────────────────
const AvatarFallback = ({ name = '', size = 56, color = '#815F9C' }) => (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '18' }]}>
        <Text style={[styles.avatarInitials, { color, fontSize: size * 0.35 }]}>
            {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </Text>
    </View>
);

// ─── Carte patient ────────────────────────────────────────────────────────────
const PatientCard = ({ item, onPress, onChat, chatLoading }) => {
    const fullName = `${item?.patient.nom || ''} ${item?.patient.prenom || ''}`.trim();
    return (
        <TouchableOpacity style={styles.patientCard} onPress={onPress} activeOpacity={0.82}>
            {/* Avatar */}
            {item?.patient.photo ? (
                <Image source={{ uri: item.patient.photo }} style={styles.patientAvatar} />
            ) : (
                <AvatarFallback name={fullName} size={56} />
            )}

            {/* Infos */}
            <View style={styles.patientInfo}>
                <Text style={styles.patientName} numberOfLines={1}>{fullName}</Text>
                {item?.patient.objectif ? (
                    <View style={styles.conditionBadge}>
                        <Text style={styles.conditionBadgeText}>{item.patient.objectif}</Text>
                    </View>
                ) : null}
                <View style={styles.rdvRow}>
                    <Ionicons name="calendar-outline" size={12} color="#A09AB8" />
                    <Text style={styles.rdvText}>
                        {item?.patient.nextAppointment ? `Prochain RDV : ${item.patient.nextAppointment}` : 'Aucun RDV planifié'}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.cardActions}>
                <TouchableOpacity
                    style={[styles.chatBtn, chatLoading && styles.chatBtnLoading]}
                    onPress={onChat}
                    disabled={chatLoading}
                >
                    {chatLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="chatbubble-outline" size={17} color="#fff" />
                    }
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color="#A09AB8" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

// ─── Carte demande ────────────────────────────────────────────────────────────
const RequestCard = ({ item, onAccept, onReject }) => {
    const fullName = `${item?.patient.nom || ''} ${item?.patient.prenom || ''}`.trim();
    return (
        <View style={styles.requestCard}>
            {item?.patient.photo  ? (
                <Image source={{ uri: item.patient.photo || ' ' }} style={styles.requestAvatar} />
            ) : (
                <AvatarFallback name={fullName} size={52} color="#6366F1" />
            )}

            <View style={styles.requestInfo}>
                <Text style={styles.requestName} numberOfLines={1}>{fullName}</Text>
                {item?.patient?.age && (
                    <Text style={styles.requestSub}>{item?.patient.age} ans</Text>
                )}
                <Text style={styles.requestDate}>
                    {item?.createdAt
                        ? new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Date inconnue'
                    }
                </Text>
            </View>

            <View style={styles.requestActions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
                    <Ionicons name="checkmark" size={18} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
                    <Ionicons name="close" size={18} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, sub }) => (
    <View style={styles.emptyBox}>
        <View style={styles.emptyIconBox}>
            <Ionicons name={icon} size={34} color="#C4B5D8" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
    </View>
);

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function PatientList({ navigation }) {
    const { user } = useAuth();

    const [activeTab, setActiveTab]       = useState('patients');
    const [patients, setPatients]         = useState([]);
    const [requests, setRequests]         = useState([]);
    const [search, setSearch]             = useState('');
    const [activeFilter, setActiveFilter] = useState('Tous');
    const [loading, setLoading]           = useState(true);
    const [refreshing, setRefreshing]     = useState(false);
    const [loadingChatId, setLoadingChatId] = useState(null);

    const tabUnderline = useRef(new Animated.Value(0)).current;
    const TAB_W = (width - 32) / TABS.length;

    // ── Chargement ─────────────────────────────────────────────────────────
    useEffect(() => { loadAll(); }, [user?.uid]);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [pats, reqs] = await Promise.all([
                // getDocumentsByConditions('users', [['type', '==', 'Patient']]).catch(() => []),
                // Demandes reçues par ce diététicien
                getDocumentsByConditions('doctorRequests', [
                    ['dieticianId', '==', user?.uid],
                    ['status',      '==', 'accepted'],
                ]).catch(() => []),

                 getDocumentsByConditions('doctorRequests', [
                    ['dieticianId', '==', user?.uid],
                    ['status',      '==', 'pending'],
                ]).catch(() => []),
            ]);
            setPatients(pats || []);
            setRequests(reqs || []);
        } catch (e) {
            console.error('Erreur chargement:', e);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAll();
        setRefreshing(false);
    };

    // ── Changement d'onglet ────────────────────────────────────────────────
    const switchTab = (key) => {
        const idx = TABS.findIndex(t => t.key === key);
        Animated.spring(tabUnderline, { toValue: idx * TAB_W, useNativeDriver: true, tension: 80, friction: 10 }).start();
        setActiveTab(key);
        setSearch('');
    };

    // ── Chat ───────────────────────────────────────────────────────────────
    const handleOpenChat = async (patient) => {
        if (!user?.uid) { Alert.alert('Erreur', 'Utilisateur non authentifié'); return; }
        try {
            setLoadingChatId(patient.id);
            await getOrCreateConversation(user.uid, patient.id);
            navigation.navigate('ChatScreen', {
                dieticienId:     patient.id,
                dieticienName:   `${patient?.nom || ''} ${patient?.prenom || ''}`.trim(),
                dieticianAvatar: patient?.photoUri,
            });
        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', 'Impossible d\'ouvrir la conversation');
        } finally {
            setLoadingChatId(null);
        }
    };

    // ── Accepter/Rejeter demande ───────────────────────────────────────────
    const handleAccept = (req) => {
        Alert.alert('Accepter', `Accepter la demande de ${req.patientName || 'ce patient'} ?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Accepter', onPress: async () => {
                try {
                    await acceptDoctorRequest(req.id, req.patientId, user.uid, {
                        name:      `${user?.nom || ''} ${user?.prenom || ''}`.trim(),
                        photo:     user?.photoUri || '',
                        specialite:user?.specialite || '',
                    });
                    setRequests(prev => prev.filter(r => r.id !== req.id));
                    Alert.alert('Accepté ✓', `${req.patientName || 'Le patient'} a été ajouté à vos patients.`);
                    loadAll();
                } catch (e) { Alert.alert('Erreur', "Impossible d'accepter."); }
            }},
        ]);
    };

    const handleReject = (req) => {
        Alert.alert('Rejeter', `Rejeter la demande de ${req.patientName || 'ce patient'} ?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Rejeter', style: 'destructive', onPress: async () => {
                try {
                    await rejectDoctorRequest(req.id);
                    setRequests(prev => prev.filter(r => r.id !== req.id));
                } catch (e) { Alert.alert('Erreur', 'Impossible de rejeter.'); }
            }},
        ]);
    };

    // ── Filtrage ───────────────────────────────────────────────────────────
    const filteredPatients = patients.filter(p => {
        const name      = `${p?.nom || ''} ${p?.prenom || ''}`.toLowerCase();
        const matchSearch = name.includes(search.toLowerCase());
        const matchFilter = activeFilter === 'Tous' || p?.condition === activeFilter;
        return matchSearch && matchFilter;
    });

    return (
        <View style={styles.container}>
            <Header
                pageName="Mes Patients"
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={requests.length}
            />

            {/* ── Onglets ── */}
            <View style={styles.tabsContainer}>
                {TABS.map((tab, idx) => {
                    const isActive = activeTab === tab.key;
                    const badge    = tab.key === 'requests' ? requests.length : null;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, { width: TAB_W }]}
                            onPress={() => switchTab(tab.key)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.tabInner}>
                                <Ionicons name={tab.icon} size={15} color={isActive ? '#815F9C' : '#A09AB8'} />
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                                {badge > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text style={styles.tabBadgeText}>{badge}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                <Animated.View style={[styles.tabUnderline, { width: TAB_W - 24, transform: [{ translateX: Animated.add(tabUnderline, new Animated.Value(12)) }] }]} />
            </View>

            {/* ── Recherche + Filtres (patients seulement) ── */}
            {activeTab === 'patients' && (
                <>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color="#A09AB8" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher un patient…"
                            value={search}
                            onChangeText={setSearch}
                            placeholderTextColor="#C4B5D8"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={18} color="#C4B5D8" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                        {FILTERS.map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                                onPress={() => setActiveFilter(f)}
                            >
                                <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>{f}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView> */}
                </>
            )}

            {/* ── Contenu ── */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#815F9C" />
                    <Text style={styles.loadingText}>Chargement…</Text>
                </View>
            ) : (
                <>
                    {/* MES PATIENTS */}
                    {activeTab === 'patients' && (
                        <FlatList
                            data={filteredPatients}
                            keyExtractor={item => item?.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#815F9C" />}
                            ListHeaderComponent={
                                filteredPatients.length > 0 && (
                                    <Text style={styles.listMeta}>{filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''}</Text>
                                )
                            }
                            ListEmptyComponent={
                                <EmptyState
                                    icon="people-outline"
                                    title="Aucun patient"
                                    sub={search || activeFilter !== 'Tous' ? 'Ajustez votre recherche ou vos filtres.' : 'Vos patients apparaîtront ici.'}
                                />
                            }
                            renderItem={({ item }) => (
                                <PatientCard
                                    item={item}
                                    onPress={() => navigation.navigate('ConsultationsPatient', { patient: item.patient })}
                                    onChat={() => handleOpenChat(item)}
                                    chatLoading={loadingChatId === item.id}
                                />
                            )}
                        />
                    )}

                    {/* DEMANDES */}
                    {activeTab === 'requests' && (
                        <FlatList
                            data={requests}
                            keyExtractor={item => item?.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#815F9C" />}
                            ListHeaderComponent={
                                requests.length > 0 && (
                                    <Text style={styles.listMeta}>{requests.length} demande{requests.length > 1 ? 's' : ''} en attente</Text>
                                )
                            }
                            ListEmptyComponent={
                                <EmptyState
                                    icon="mail-open-outline"
                                    title="Aucune demande"
                                    sub="Les patients qui souhaitent être suivis apparaîtront ici."
                                />
                            }
                            renderItem={({ item }) => (
                                <RequestCard
                                    item={item}
                                    onAccept={() => handleAccept(item)}
                                    onReject={() => handleReject(item)}
                                />
                            )}
                        />
                    )}
                </>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#F4F0FA', marginTop: '5%' },

    // Tabs
    tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, paddingVertical: 6, borderWidth: 1.5, borderColor: '#EDE8F5', position: 'relative', overflow: 'hidden' },
    tabItem:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    tabInner:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
    tabLabel:      { fontSize: 13, fontWeight: '600', color: '#A09AB8' },
    tabLabelActive:{ color: '#815F9C', fontWeight: '700' },
    tabBadge:      { backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    tabBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
    tabUnderline:  { position: 'absolute', bottom: 2, height: 3, backgroundColor: '#815F9C', borderRadius: 2 },

    // Search
    searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, marginBottom: 4, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderWidth: 1.5, borderColor: '#EDE8F5' },
    searchInput: { flex: 1, fontSize: 14, color: '#1A1035', fontWeight: '500' },

    // Filters
    filtersRow:          { marginBottom: 6, marginTop: 6 },
    filterChip:          { borderRadius: 20, borderWidth: 1.5, borderColor: '#EDE8F5', paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#fff' },
    filterChipActive:    { backgroundColor: '#815F9C', borderColor: '#815F9C' },
    filterChipText:      { fontSize: 13, fontWeight: '600', color: '#815F9C' },
    filterChipTextActive:{ color: '#fff' },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30 },
    listMeta:    { fontSize: 12, color: '#A09AB8', fontWeight: '600', marginBottom: 10 },

    // Patient card
    patientCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#EDE8F5', gap: 12, elevation: 2, shadowColor: '#815F9C', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    patientAvatar: { width: 56, height: 56, borderRadius: 14 },
    patientInfo:   { flex: 1, gap: 5 },
    patientName:   { fontSize: 14, fontWeight: '800', color: '#1A1035' },
    conditionBadge:    { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    conditionBadgeText:{ fontSize: 11, color: '#6366F1', fontWeight: '700' },
    rdvRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rdvText:       { fontSize: 11, color: '#A09AB8', fontWeight: '500' },
    cardActions:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chatBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: '#815F9C', alignItems: 'center', justifyContent: 'center' },
    chatBtnLoading:{ opacity: 0.7 },
    moreBtn:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

    // Avatar fallback
    avatarFallback:{ alignItems: 'center', justifyContent: 'center' },
    avatarInitials:{ fontWeight: '800' },

    // Request card
    requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1.5, borderColor: '#EDE8F5', elevation: 2, shadowColor: '#815F9C', shadowOpacity: 0.06, shadowRadius: 6 },
    requestAvatar:  { width: 52, height: 52, borderRadius: 13 },
    requestInfo:    { flex: 1 },
    requestName:    { fontSize: 14, fontWeight: '800', color: '#1A1035', marginBottom: 3 },
    requestSub:     { fontSize: 12, color: '#6366F1', fontWeight: '600', marginBottom: 2 },
    requestDate:    { fontSize: 11, color: '#A09AB8', fontStyle: 'italic' },
    requestActions: { gap: 8 },
    acceptBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    rejectBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },

    // Loading
    loadingBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#A09AB8', fontSize: 14 },

    // Empty
    emptyBox:    { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
    emptyIconBox:{ width: 70, height: 70, borderRadius: 20, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1035', marginBottom: 8 },
    emptySub:    { fontSize: 13, color: '#A09AB8', textAlign: 'center', lineHeight: 20 },
});