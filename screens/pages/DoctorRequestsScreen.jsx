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
import { useAuth } from '../../contexts/AuthContext';
import {
    acceptDoctorRequest,
    getAllDoctors,
    getDocumentById,
    getMyDoctors,
    getPendingRequests,
    rejectDoctorRequest,
} from '../../services/firebase/firebaseService';

const { width } = Dimensions.get('window');

const TABS = [
    { key: 'mine',     label: 'Mes médecins',   icon: 'heart-outline' },
    { key: 'all',      label: 'Tous les médecins', icon: 'earth-outline' },
];

// ─── Étoiles rating ───────────────────────────────────────────────────────────
const Stars = ({ rating = 0 }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Ionicons
                key={i}
                name={i <= Math.round(rating) ? 'star' : 'star-outline'}
                size={11}
                color="#F59E0B"
            />
        ))}
    </View>
);

// ─── Badge spécialité ─────────────────────────────────────────────────────────
const SpecialityBadge = ({ label }) => (
    <View style={styles.badge}>
        <Text style={styles.badgeText}>{label}</Text>
    </View>
);

// ─── Carte médecin (grande) ───────────────────────────────────────────────────
const DoctorCard = ({ doctor, onPress, action }) => (
    <TouchableOpacity style={styles.doctorCard} onPress={onPress} activeOpacity={0.82}>
        <View style={styles.doctorCardInner}>
            <Image
                source={{ uri: doctor.photo || doctor.dieticianPhoto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
                style={styles.doctorAvatar}
            />
            {/* Indicateur disponibilité */}
            <View style={[styles.availDot, { backgroundColor: doctor.available ? '#10B981' : '#CBD5E0' }]} />

            <View style={styles.doctorMeta}>
                <Text style={styles.doctorName} numberOfLines={1}>
                    {doctor.nom || ' '}  {doctor.prenom || ''}
                </Text>
                <SpecialityBadge label={doctor.specialite || doctor.dieticianSpeciality || 'Nutritionniste'} />
                <Stars rating={doctor.rating || 4} />

                <View style={styles.doctorStats}>
                    <View style={styles.doctorStatItem}>
                        <Ionicons name="people-outline" size={12} color="#8B80A0" />
                        <Text style={styles.doctorStatText}>{doctor.patientsCount || '—'} patients</Text>
                    </View>
                    <View style={styles.doctorStatItem}>
                        <Ionicons name="location-outline" size={12} color="#8B80A0" />
                        <Text style={styles.doctorStatText} numberOfLines={1}>{doctor.location || ' inconnu'}</Text>
                    </View>
                </View>
            </View>

            {action && <View style={styles.doctorCardAction}>{action}</View>}
        </View>
    </TouchableOpacity>
);

// ─── Carte demande ────────────────────────────────────────────────────────────
const RequestCard = ({ item, onAccept, onReject }) => (
    <View style={styles.requestCard}>
        <Image
            source={{ uri: item.dieticianPhoto || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
            style={styles.requestAvatar}
        />
        <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{item.dieticianName}</Text>
            <Text style={styles.requestSpeciality}>{item.dieticianSpeciality || 'Nutritionniste'}</Text>
            <Text style={styles.requestDate}>
                {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
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

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon, title, sub }) => (
    <View style={styles.emptyBox}>
        <View style={styles.emptyIconBox}>
            <Ionicons name={icon} size={36} color="#C4B5D8" />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptySub}>{sub}</Text>
    </View>
);

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function DoctorsScreen({ navigation }) {
    const { user } = useAuth();

    const [activeTab, setActiveTab]     = useState('mine');
    const [myDoctors, setMyDoctors]     = useState([]);
    const [allDoctors, setAllDoctors]   = useState([]);
    const [requests, setRequests]       = useState([]);
    const [search, setSearch]           = useState('');
    const [loading, setLoading]         = useState(true);
    const [refreshing, setRefreshing]   = useState(false);

    const tabUnderline = useRef(new Animated.Value(0)).current;
    const TAB_W = (width - 32) / TABS.length;

    // ── Chargement ─────────────────────────────────────────────────────────
    useEffect(() => { loadAll(); }, [user?.uid]);

    const loadAll = async () => {
        try {
            setLoading(true);
            if (!user?.uid) return;
            const [mine, all, reqs] = await Promise.all([
                getMyDoctors(user.uid).catch(() => []),
                getAllDoctors().catch(() => []),
                getPendingRequests(user.uid).catch(() => []),
            ]);
            setMyDoctors(mine || []);
            setAllDoctors(all || []);
            setRequests(reqs || []);
        } catch (e) {
            console.error(e);
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

    // ── Actions demandes ───────────────────────────────────────────────────
    const handleAccept = async (req) => {
        try {
            await acceptDoctorRequest(req.id, user.uid, req.dieticianId, {
                name: req.dieticianName,
                photo: req.dieticianPhoto,
                specialite: req.dieticianSpeciality,
            });
            setRequests(prev => prev.filter(r => r.id !== req.id));
            Alert.alert('Accepté', `${req.dieticianName} ajouté à vos médecins.`);
            loadAll();
        } catch (e) { Alert.alert('Erreur', 'Impossible d\'accepter.'); }
    };

    const handleReject = (req) => {
        Alert.alert('Rejeter', `Rejeter la demande de ${req.dieticianName} ?`, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Rejeter', style: 'destructive', onPress: async () => {
                try {
                    await rejectDoctorRequest(req.id);
                    setRequests(prev => prev.filter(r => r.id !== req.id));
                } catch (e) { Alert.alert('Erreur', 'Impossible de rejeter.'); }
            }},
        ]);
    };

    // ── Filtrage search ────────────────────────────────────────────────────
    const filterDoctors = (list) => {
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(d =>
            (d.name || d.dieticianName || '').toLowerCase().includes(q) ||
            (d.specialite || d.dieticianSpeciality || '').toLowerCase().includes(q) ||
            (d.city || '').toLowerCase().includes(q)
        );
    };

    const displayedMine = filterDoctors(myDoctors);
    const displayedAll  = filterDoctors(allDoctors);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color="#1A1035" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Médecins</Text>
                    <Text style={styles.headerSub}>{myDoctors.length} suivi{myDoctors.length > 1 ? 's' : ''} • {allDoctors.length} disponibles</Text>
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name="options-outline" size={20} color="#815F9C" />
                </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            {(activeTab === 'mine' || activeTab === 'all') && (
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color="#A09AB8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'mine' ? 'Rechercher dans mes médecins…' : 'Nom, spécialité, ville…'}
                        placeholderTextColor="#B8B0CC"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={18} color="#B8B0CC" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Onglets */}
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
                                <Ionicons
                                    name={tab.icon}
                                    size={15}
                                    color={isActive ? '#815F9C' : '#A09AB8'}
                                />
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                                {badge > 0 && (
                                    <View style={styles.tabBadge}>
                                        <Text style={styles.tabBadgeText}>{badge}</Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })}
                {/* Underline animée */}
                <Animated.View style={[styles.tabUnderline, { width: TAB_W - 24, transform: [{ translateX: Animated.add(tabUnderline, new Animated.Value(12)) }] }]} />
            </View>

            {/* Contenu */}
            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#815F9C" />
                    <Text style={styles.loadingText}>Chargement…</Text>
                </View>
            ) : (
                <>
                    {/* ── MES MÉDECINS ── */}
                    {activeTab === 'mine' && (
                        <FlatList
                            data={displayedMine}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#815F9C" />}
                            ListHeaderComponent={
                                myDoctors.length > 0 && (
                                    <View style={styles.listMeta}>
                                        <Text style={styles.listMetaText}>{displayedMine.length} médecin{displayedMine.length > 1 ? 's' : ''}</Text>
                                    </View>
                                )
                            }
                            ListEmptyComponent={
                                <EmptyState
                                    icon="heart-dislike-outline"
                                    title="Aucun médecin suivi"
                                    sub="Acceptez des demandes ou trouvez un médecin dans la liste globale."
                                />
                            }
                            renderItem={({ item }) => (
                                <DoctorCard
                                    doctor={item}
                                    onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
                                    action={
                                        <TouchableOpacity
                                            style={styles.viewBtn}
                                            onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
                                        >
                                            <Text style={styles.viewBtnText}>Voir</Text>
                                            <Ionicons name="arrow-forward" size={13} color="#815F9C" />
                                        </TouchableOpacity>
                                    }
                                />
                            )}
                        />
                    )}

                    {/* ── TOUS LES MÉDECINS ── */}
                    {activeTab === 'all' && (
                        <FlatList
                            data={displayedAll}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#815F9C" />}
                            ListHeaderComponent={
                                allDoctors.length > 0 && (
                                    <View style={styles.listMeta}>
                                        <Text style={styles.listMetaText}>{displayedAll.length} médecin{displayedAll.length > 1 ? 's' : ''} trouvé{displayedAll.length > 1 ? 's' : ''}</Text>
                                    </View>
                                )
                            }
                            ListEmptyComponent={
                                <EmptyState
                                    icon="search-outline"
                                    title="Aucun résultat"
                                    sub="Essayez un autre terme de recherche."
                                />
                            }
                            renderItem={({ item }) => {
                                const isAlreadyMine = myDoctors.some(d => d.id === item.id);
                                return (
                                    <DoctorCard
                                        doctor={item}
                                        onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
                                        action={
                                            isAlreadyMine ? (
                                                <View style={styles.alreadyBadge}>
                                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                                    <Text style={styles.alreadyBadgeText}>Suivi</Text>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    style={styles.addBtn}
                                                    onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
                                                >
                                                    <Ionicons name="add" size={16} color="#fff" />
                                                    <Text style={styles.addBtnText}>Consulter</Text>
                                                </TouchableOpacity>
                                            )
                                        }
                                    />
                                );
                            }}
                        />
                    )}

                    
                </>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#F4F0FA' },

    // Header
    header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBF8' },
    backBtn:    { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerTitle:{ fontSize: 18, fontWeight: '800', color: '#1A1035', letterSpacing: -0.3 },
    headerSub:  { fontSize: 12, color: '#A09AB8', fontWeight: '500', marginTop: 1 },
    filterBtn:  { marginLeft: 'auto', width: 38, height: 38, borderRadius: 12, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center' },

    // Search
    searchBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderWidth: 1.5, borderColor: '#EDE8F5' },
    searchInput:{ flex: 1, fontSize: 14, color: '#1A1035', fontWeight: '500' },

    // Tabs
    tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 8, borderRadius: 14, paddingVertical: 6, paddingHorizontal: 0, position: 'relative', borderWidth: 1.5, borderColor: '#EDE8F5', overflow: 'hidden' },
    tabItem:    { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
    tabInner:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
    tabLabel:   { fontSize: 12, fontWeight: '600', color: '#A09AB8' },
    tabLabelActive: { color: '#815F9C', fontWeight: '700' },
    tabBadge:   { backgroundColor: '#EF4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    tabBadgeText:{ color: '#fff', fontSize: 10, fontWeight: '800' },
    tabUnderline:{ position: 'absolute', bottom: 2, height: 3, backgroundColor: '#815F9C', borderRadius: 2 },

    // List
    listContent:{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 30 },
    listMeta:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
    listMetaText:{ fontSize: 12, color: '#A09AB8', fontWeight: '600' },

    // Doctor card
    doctorCard: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#EDE8F5', ...StyleSheet.flatten({ elevation: 2, shadowColor: '#815F9C', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }) },
    doctorCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
    doctorAvatar:   { width: 62, height: 62, borderRadius: 16, backgroundColor: '#EDE8F5' },
    availDot:       { position: 'absolute', top: 52, left: 60, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
    doctorMeta:     { flex: 1, gap: 5 },
    doctorName:     { fontSize: 15, fontWeight: '800', color: '#1A1035', letterSpacing: -0.2 },
    doctorStats:    { flexDirection: 'row', gap: 12, marginTop: 2 },
    doctorStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    doctorStatText: { fontSize: 11, color: '#8B80A0', fontWeight: '500' },
    doctorCardAction:{ alignItems: 'flex-end', justifyContent: 'center' },

    // Badge spécialité
    badge:      { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeText:  { fontSize: 11, color: '#6366F1', fontWeight: '700' },

    // Bouton Voir
    viewBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4F0FA', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1.5, borderColor: '#E8E0F5' },
    viewBtnText:{ fontSize: 12, color: '#815F9C', fontWeight: '700' },

    // Bouton Ajouter
    addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#815F9C', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
    addBtnText: { fontSize: 12, color: '#fff', fontWeight: '700' },

    // Badge déjà suivi
    alreadyBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
    alreadyBadgeText:{ fontSize: 12, color: '#10B981', fontWeight: '700' },

    // Request card
    requestCard:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1.5, borderColor: '#EDE8F5', elevation: 2, shadowColor: '#815F9C', shadowOpacity: 0.06, shadowRadius: 6 },
    requestAvatar:  { width: 54, height: 54, borderRadius: 14, backgroundColor: '#EDE8F5' },
    requestInfo:    { flex: 1 },
    requestName:    { fontSize: 14, fontWeight: '800', color: '#1A1035', marginBottom: 3 },
    requestSpeciality: { fontSize: 12, color: '#6366F1', fontWeight: '600', marginBottom: 4 },
    requestDate:    { fontSize: 11, color: '#A09AB8', fontStyle: 'italic' },
    requestActions: { gap: 8 },
    acceptBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
    rejectBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },

    // Loading
    loadingBox:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#A09AB8', fontSize: 14 },

    // Empty
    emptyBox:    { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
    emptyIconBox:{ width: 72, height: 72, borderRadius: 22, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:  { fontSize: 16, fontWeight: '700', color: '#1A1035', marginBottom: 8 },
    emptySub:    { fontSize: 13, color: '#A09AB8', textAlign: 'center', lineHeight: 20 },
});