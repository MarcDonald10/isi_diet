import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Header from '../components/Header';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase/firebaseConfig';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const TYPES_REPAS = [
    { label: 'Petit-déjeuner', icon: 'sunny-outline' },
    { label: 'Déjeuner', icon: 'restaurant-outline' },
    { label: 'Dîner', icon: 'moon-outline' },
];

const FILTERS = [
    { label: 'Tous', icon: 'filter' },
    { label: 'Végétarien', icon: 'leaf' },
    { label: 'Faible sel', icon: 'google-assistant' },
    { label: 'Diabète', icon: 'heart-pulse' },
];

const CONDITIONS_CONFIG = {
    diabete:      { color: '#E53935', bg: '#FFE8E8', label: 'Diabète' },
    cholesterol:  { color: '#F57C00', bg: '#FFF3E0', label: 'Cholestérol' },
    hypertension: { color: '#E53935', bg: '#FFE8E8', label: 'Hypertension' },
};

// ─── Petit composant : badge condition médicale ───────────────────────────────
const ConditionBadge = ({ type }) => {
    const cfg = CONDITIONS_CONFIG[type];
    if (!cfg) return null;
    return (
        <View style={[styles.conditionBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name="alert-circle" size={14} color={cfg.color} />
            <Text style={[styles.conditionBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};

// ─── Carte de sélection de consultation ──────────────────────────────────────
const ConsultationCard = ({ consultation, isSelected, onPress }) => {
    const hasConditions = consultation.diabete || consultation.cholesterol || consultation.hypertension;

    return (
        <TouchableOpacity
            style={[styles.consultationCard, isSelected && styles.consultationCardSelected]}
            onPress={onPress}
            activeOpacity={0.82}
        >
            <View style={styles.consultationCardTop}>
                <View style={styles.consultationCardLeft}>
                    <Text style={[styles.consultationCardName, isSelected && styles.consultationCardNameSelected]}>
                        {consultation.patientName}
                    </Text>
                    <Text style={styles.consultationCardDate}>
                        {new Date(consultation.date).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                        })}
                    </Text>
                </View>
                <View style={styles.consultationCardRight}>
                    {isSelected && (
                        <View style={styles.selectedDot}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.consultationCardStats}>
                {consultation.poids && (
                    <View style={styles.statChip}>
                        <Ionicons name="barbell-outline" size={13} color="#815F9C" />
                        <Text style={styles.statChipText}>{consultation.poids} kg</Text>
                    </View>
                )}
                {consultation.imc && (
                    <View style={styles.statChip}>
                        <Ionicons name="calculator-outline" size={13} color="#815F9C" />
                        <Text style={styles.statChipText}>IMC {consultation.imc}</Text>
                    </View>
                )}
                {consultation.objectif && (
                    <View style={styles.statChip}>
                        <Ionicons name="flag-outline" size={13} color="#815F9C" />
                        <Text style={styles.statChipText}>{consultation.objectif}</Text>
                    </View>
                )}
            </View>

            {hasConditions && (
                <View style={styles.consultationCardConditions}>
                    {consultation.diabete      && <ConditionBadge type="diabete" />}
                    {consultation.cholesterol  && <ConditionBadge type="cholesterol" />}
                    {consultation.hypertension && <ConditionBadge type="hypertension" />}
                </View>
            )}
        </TouchableOpacity>
    );
};

// ─── Panneau détail consultation (accordéon) ─────────────────────────────────
const ConsultationDetail = ({ consultation }) => {
    const [expanded, setExpanded] = useState(false);
    const anim = useRef(new Animated.Value(0)).current;

    const toggle = () => {
        Animated.timing(anim, {
            toValue: expanded ? 0 : 1,
            duration: 220,
            useNativeDriver: false,
        }).start();
        setExpanded(!expanded);
    };

    return (
        <View style={styles.detailPanel}>
            <TouchableOpacity style={styles.detailToggle} onPress={toggle} activeOpacity={0.8}>
                <Ionicons name="information-circle-outline" size={18} color="#815F9C" />
                <Text style={styles.detailToggleText}>Détails de la consultation</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#815F9C" />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.detailBody}>
                    <View style={styles.detailGrid}>
                        <DetailItem icon="barbell-outline"    label="Poids"    value={`${consultation.poids} kg`} />
                        <DetailItem icon="calculator-outline" label="IMC"      value={consultation.imc} />
                        <DetailItem icon="fitness-outline"    label="Activité" value={consultation.activite} />
                        <DetailItem icon="flag-outline"       label="Objectif" value={consultation.objectif} />
                    </View>

                    {(consultation.diabete || consultation.cholesterol || consultation.hypertension) && (
                        <View style={styles.detailConditions}>
                            <Text style={styles.detailConditionsTitle}>Conditions médicales</Text>
                            <View style={styles.detailConditionsList}>
                                {consultation.diabete      && <ConditionBadge type="diabete" />}
                                {consultation.cholesterol  && <ConditionBadge type="cholesterol" />}
                                {consultation.hypertension && <ConditionBadge type="hypertension" />}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <View style={styles.detailItem}>
        <Ionicons name={icon} size={18} color="#815F9C" />
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
);

// ─── Composant repas ──────────────────────────────────────────────────────────
const MealRow = ({ meal, onToggle }) => (
    <View style={[styles.mealItem, !meal.compatible && styles.mealItemIncompat]}>
        <Ionicons
            name={meal.icon}
            size={22}
            color={meal.compatible ? '#4CAF50' : '#E53935'}
            style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
            <Text style={styles.mealType}>{meal.type}</Text>
            <Text style={styles.mealDesc}>{meal.desc}</Text>
            <Text style={styles.mealDetails}>
                {meal.portions} • {meal.calories} kcal
                {!meal.compatible && (
                    <Text style={{ color: '#E53935' }}>  ⚠ Non adapté</Text>
                )}
            </Text>
        </View>
        <TouchableOpacity
            style={[styles.checkButton, meal.consumed && styles.checkButtonActive]}
            onPress={onToggle}
        >
            <Ionicons
                name={meal.consumed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={meal.consumed ? '#4CAF50' : '#B0B3C6'}
            />
        </TouchableOpacity>
    </View>
);

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function MealPlanScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const [loading, setLoading]           = useState(true);
    const [consultations, setConsultations] = useState([]);          // toutes les consultations
    const [activeId, setActiveId]           = useState(null);        // id de la consultation active
    const [weeklyPlan, setWeeklyPlan]       = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('Tous');
    const [poids, setPoids]                 = useState('');
    const [sensation, setSensation]         = useState('');
    const [graphData]                       = useState([70, 69.5, 69, 68.8, 68.5]);
    const [modalVisible, setModalVisible]   = useState(false);
    const [newPlan, setNewPlan]             = useState({ day: '', meals: [] });

    const activeConsultation = consultations.find(c => c.id === activeId) || null;

    // ── Chargement ────────────────────────────────────────────────────────────
    useEffect(() => { fetchConsultations(); }, [user]);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            if (!user?.uid) { setLoading(false); return; }

            const q = query(collection(db, 'consultations'), where('patientId', '==', user.uid));
            const snap = await getDocs(q);

            if (!snap.empty) {
                const list = snap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => new Date(b.date) - new Date(a.date));

                setConsultations(list);
                setActiveId(list[0].id);
                setPoids(list[0].poids || '');
                createMealPlanFromConsultation(list[0]);
            }
        } catch (err) {
            console.error('Erreur chargement consultations :', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Changer de consultation active ────────────────────────────────────────
    const selectConsultation = (consultation) => {
        setActiveId(consultation.id);
        setPoids(consultation.poids || '');
        setSensation('');
        createMealPlanFromConsultation(consultation);
    };

    // ── Construire le plan à partir d'une consultation ────────────────────────
    const createMealPlanFromConsultation = (c) => {
        const baseMeals = [
            { type: 'Petit-déjeuner', icon: 'sunny-outline',     desc: c.petitDej  || 'À définir', portions: '1 bol',      calories: 300, compatible: true,               consumed: false },
            { type: 'Déjeuner',       icon: 'restaurant-outline', desc: c.dejeuner  || 'À définir', portions: '1 assiette', calories: 500, compatible: true,               consumed: false },
            { type: 'Dîner',          icon: 'moon-outline',        desc: c.diner     || 'À définir', portions: '1 assiette', calories: 400, compatible: !c.hypertension,    consumed: false },
        ];
        setWeeklyPlan(JOURS.map(day => ({ id: day.toLowerCase(), day, meals: baseMeals.map(m => ({ ...m })) })));
    };

    // ── Toggle repas consommé ─────────────────────────────────────────────────
    const toggleConsumed = (dayIdx, mealIdx) => {
        setWeeklyPlan(prev => {
            const next = prev.map((d, di) =>
                di !== dayIdx ? d : {
                    ...d,
                    meals: d.meals.map((m, mi) =>
                        mi !== mealIdx ? m : { ...m, consumed: !m.consumed }
                    )
                }
            );
            return next;
        });
    };

    // ── Ajout plan manuel ─────────────────────────────────────────────────────
    const handleAddPlan = () => {
        if (newPlan.day) {
            setWeeklyPlan(prev => [...prev, { ...newPlan, id: String(prev.length + 1) }]);
            setModalVisible(false);
            setNewPlan({ day: '', meals: [] });
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#815F9C" />
                <Text style={styles.loadingText}>Chargement des consultations…</Text>
            </View>
        );
    }

    return (
        <>
            <Header
                userPhoto={user?.photo || 'https://example.com/user-photo.jpg'}
                username={user?.nom || 'Utilisateur'}
                onProfilePress={() => navigation.navigate('Profile')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />

            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* ── SECTION : Consultations ── */}
                {consultations.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            icon="calendar-outline"
                            title="Consultations"
                            badge={consultations.length}
                        />

                        {/* Carrousel horizontal */}
                        <FlatList
                            data={consultations}
                            keyExtractor={item => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.consultationList}
                            renderItem={({ item }) => (
                                <ConsultationCard
                                    consultation={item}
                                    isSelected={item.id === activeId}
                                    onPress={() => selectConsultation(item)}
                                />
                            )}
                        />

                        {/* Détail accordéon de la consultation active */}
                        {activeConsultation && (
                            <ConsultationDetail consultation={activeConsultation} />
                        )}
                    </View>
                )}

                {/* ── SECTION : Plan alimentaire ── */}
                <View style={styles.section}>
                    <SectionHeader icon="restaurant-outline" title="Plan Alimentaire" />

                    {/* Filtres */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                        {FILTERS.map(f => (
                            <TouchableOpacity
                                key={f.label}
                                style={[styles.filterButton, selectedFilter === f.label && styles.filterButtonActive]}
                                onPress={() => setSelectedFilter(f.label)}
                            >
                                <MaterialCommunityIcons
                                    name={f.icon}
                                    size={16}
                                    color={selectedFilter === f.label ? '#fff' : '#815F9C'}
                                />
                                <Text style={[styles.filterText, selectedFilter === f.label && styles.filterTextActive]}>
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Jours */}
                    {weeklyPlan.map((day, dayIdx) => (
                        <View key={day.id} style={styles.dayCard}>
                            <View style={styles.dayHeader}>
                                <Text style={styles.dayText}>{day.day}</Text>
                                <Text style={styles.dayCalories}>
                                    {day.meals.reduce((s, m) => s + m.calories, 0)} kcal
                                </Text>
                            </View>
                            {day.meals.map((meal, mealIdx) => (
                                <MealRow
                                    key={meal.type}
                                    meal={meal}
                                    onToggle={() => toggleConsumed(dayIdx, mealIdx)}
                                />
                            ))}
                        </View>
                    ))}
                </View>

                {/* ── SECTION : Suivi ── */}
                {/* <View style={styles.section}>
                    <SectionHeader icon="analytics-outline" title="Suivi" />

                    <View style={styles.graphCard}>
                        <Text style={styles.graphTitle}>Évolution du poids</Text>
                        <View style={styles.graphContainer}>
                            {graphData.map((val, idx) => (
                                <View key={idx} style={styles.barWrapper}>
                                    <Text style={styles.barValue}>{val}</Text>
                                    <View style={[styles.bar, { height: 10 + (70 - val) * 12 }]} />
                                </View>
                            ))}
                        </View>
                    </View>

                   
                    <View style={styles.inputCard}>
                        <View style={styles.inputGroup}>
                            <Ionicons name="barbell-outline" size={18} color="#815F9C" />
                            <TextInput
                                style={styles.input}
                                placeholder="Poids actuel (kg)"
                                keyboardType="numeric"
                                value={poids}
                                onChangeText={setPoids}
                                placeholderTextColor="#B0B3C6"
                            />
                        </View>
                        <View style={styles.inputDivider} />
                        <View style={styles.inputGroup}>
                            <Ionicons name="happy-outline" size={18} color="#815F9C" />
                            <TextInput
                                style={styles.input}
                                placeholder="Sensation après repas"
                                value={sensation}
                                onChangeText={setSensation}
                                placeholderTextColor="#B0B3C6"
                            />
                        </View>
                    </View>
                </View>

               
                <View style={styles.actionsRow}>
                    <ActionButton icon="shopping-cart" label="Liste de courses" onPress={() => Alert.alert('Liste de courses', 'À brancher')} />
                    <ActionButton icon="download"      label="Exporter"          onPress={() => Alert.alert('Export', 'PDF / email à brancher')} />
                </View>

                <TouchableOpacity style={styles.customizeButton}>
                    <Ionicons name="filter-outline" size={20} color="#fff" />
                    <Text style={styles.customizeText}>Personnaliser le plan</Text>
                </TouchableOpacity> */}

            </ScrollView>

            {/* ── Modal ajout plan ── */}
            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Nouveau Plan</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#815F9C" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: '65%' }}>
                            <Text style={styles.modalLabel}>Jour de la semaine</Text>
                            <View style={styles.chipRow}>
                                {JOURS.map(jour => (
                                    <TouchableOpacity
                                        key={jour}
                                        style={[styles.chip, newPlan.day === jour && styles.chipSelected]}
                                        onPress={() => setNewPlan({ ...newPlan, day: jour })}
                                    >
                                        <Text style={[styles.chipText, newPlan.day === jour && styles.chipTextSelected]}>
                                            {jour.slice(0, 3)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {newPlan.meals.map((meal, index) => (
                                <View key={index} style={styles.mealForm}>
                                    <Text style={styles.modalLabel}>Repas {index + 1}</Text>

                                    <View style={styles.chipRow}>
                                        {TYPES_REPAS.map(type => (
                                            <TouchableOpacity
                                                key={type.label}
                                                style={[styles.chip, meal.type === type.label && styles.chipSelected]}
                                                onPress={() => {
                                                    const m = [...newPlan.meals];
                                                    m[index] = { ...meal, type: type.label, icon: type.icon };
                                                    setNewPlan({ ...newPlan, meals: m });
                                                }}
                                            >
                                                <Ionicons name={type.icon} size={16} color={meal.type === type.label ? '#fff' : '#815F9C'} />
                                                <Text style={[styles.chipText, meal.type === type.label && styles.chipTextSelected]}>
                                                    {type.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {['desc', 'portions'].map(field => (
                                        <TextInput
                                            key={field}
                                            style={styles.modalInput}
                                            placeholder={field === 'desc' ? 'Description' : 'Portions (ex: 1 assiette)'}
                                            value={meal[field]}
                                            onChangeText={text => {
                                                const m = [...newPlan.meals];
                                                m[index] = { ...meal, [field]: text };
                                                setNewPlan({ ...newPlan, meals: m });
                                            }}
                                            placeholderTextColor="#B9A9CC"
                                        />
                                    ))}

                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder="Calories"
                                        keyboardType="numeric"
                                        value={String(meal.calories)}
                                        onChangeText={text => {
                                            const m = [...newPlan.meals];
                                            m[index] = { ...meal, calories: parseInt(text) || 0 };
                                            setNewPlan({ ...newPlan, meals: m });
                                        }}
                                        placeholderTextColor="#B9A9CC"
                                    />

                                    <View style={styles.mealFormActions}>
                                        <TouchableOpacity
                                            style={[styles.compatChip, meal.compatible && styles.compatChipActive]}
                                            onPress={() => {
                                                const m = [...newPlan.meals];
                                                m[index] = { ...meal, compatible: !meal.compatible };
                                                setNewPlan({ ...newPlan, meals: m });
                                            }}
                                        >
                                            <Ionicons
                                                name={meal.compatible ? 'checkmark-circle' : 'alert-circle'}
                                                size={16}
                                                color={meal.compatible ? '#4CAF50' : '#E53935'}
                                            />
                                            <Text style={[styles.compatChipText, meal.compatible && { color: '#4CAF50' }]}>
                                                {meal.compatible ? 'Compatible' : 'Non compatible'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.deleteChip}
                                            onPress={() => setNewPlan({ ...newPlan, meals: newPlan.meals.filter((_, i) => i !== index) })}
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#E53935" />
                                            <Text style={styles.deleteChipText}>Supprimer</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.addMealButton}
                            onPress={() => setNewPlan({ ...newPlan, meals: [...newPlan.meals, { type: '', icon: 'restaurant-outline', desc: '', portions: '', calories: 0, compatible: true, consumed: false }] })}
                        >
                            <Ionicons name="add-circle-outline" size={18} color="#fff" />
                            <Text style={styles.addMealText}>Ajouter un repas</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.submitButton} onPress={handleAddPlan}>
                            <Text style={styles.submitText}>Créer le plan</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

// ─── Sous-composant titre de section ──────────────────────────────────────────
const SectionHeader = ({ icon, title, badge }) => (
    <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#815F9C" />
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge !== undefined && (
            <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{badge}</Text>
            </View>
        )}
    </View>
);

// ─── Sous-composant bouton action ─────────────────────────────────────────────
const ActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Feather name={icon} size={18} color="#815F9C" />
        <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Écran
    loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F0F5', gap: 12 },
    loadingText:   { color: '#815F9C', fontSize: 14 },
    container:     { flex: 1, backgroundColor: '#F6F0F5' },

    // Sections
    section:       { marginTop: 12, paddingHorizontal: 14 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionTitle:  { fontSize: 16, fontWeight: '700', color: '#1E223D', flex: 1 },
    sectionBadge:  { backgroundColor: '#815F9C', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
    sectionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    // Consultation cards (carousel)
    consultationList: { paddingBottom: 4, paddingRight: 14 },
    consultationCard: {
        width: 230,
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#EAE3EC',
    },
    consultationCardSelected: { borderColor: '#815F9C', backgroundColor: '#FAF5FF' },
    consultationCardTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    consultationCardLeft: { flex: 1 },
    consultationCardRight:{ alignItems: 'flex-end' },
    consultationCardName: { fontSize: 14, fontWeight: '700', color: '#1E223D', marginBottom: 3 },
    consultationCardNameSelected: { color: '#815F9C' },
    consultationCardDate: { fontSize: 12, color: '#999' },
    selectedDot:  { backgroundColor: '#815F9C', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

    consultationCardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    statChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F0F5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    statChipText: { fontSize: 12, color: '#815F9C', fontWeight: '600' },

    consultationCardConditions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    conditionBadge:     { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
    conditionBadgeText: { fontSize: 12, fontWeight: '700' },

    // Détail accordéon
    detailPanel:       { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#EAE3EC', marginTop: 10, overflow: 'hidden' },
    detailToggle:      { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 8 },
    detailToggleText:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#815F9C' },
    detailBody:        { padding: 14, borderTopWidth: 1, borderTopColor: '#EAE3EC' },
    detailGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    detailItem:        { width: '47%', backgroundColor: '#F6F0F5', borderRadius: 10, padding: 12, alignItems: 'center' },
    detailLabel:       { fontSize: 11, color: '#888', marginTop: 5, fontWeight: '500' },
    detailValue:       { fontSize: 15, fontWeight: '700', color: '#815F9C', marginTop: 2 },
    detailConditions:  { marginTop: 12 },
    detailConditionsTitle: { fontSize: 13, fontWeight: '700', color: '#1E223D', marginBottom: 8 },
    detailConditionsList:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    // Filtres
    filtersRow:         { marginBottom: 12 },
    filterButton:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: '#815F9C', paddingVertical: 6, paddingHorizontal: 14, marginRight: 8, backgroundColor: '#fff', gap: 6 },
    filterButtonActive: { backgroundColor: '#815F9C', borderColor: '#815F9C' },
    filterText:         { color: '#815F9C', fontSize: 13, fontWeight: '500' },
    filterTextActive:   { color: '#fff', fontWeight: '700' },

    // Journée
    dayCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#EAE3EC', shadowColor: '#815F9C', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    dayHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dayText:    { fontSize: 16, fontWeight: '700', color: '#815F9C' },
    dayCalories:{ fontSize: 13, color: '#999', fontWeight: '500' },

    // Repas
    mealItem:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F6F0F5', borderRadius: 10, padding: 10, marginBottom: 8 },
    mealItemIncompat: { backgroundColor: '#fff3f3' },
    mealType:       { fontWeight: '700', color: '#1E223D', fontSize: 14 },
    mealDesc:       { color: '#7D5F9B', fontSize: 13, marginTop: 1 },
    mealDetails:    { color: '#815F9C', fontSize: 12, marginTop: 2 },
    checkButton:    { marginLeft: 8, borderRadius: 16, padding: 4, backgroundColor: '#EAE3EC' },
    checkButtonActive: { backgroundColor: '#e6f9ed' },

    // Graphique
    graphCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#EAE3EC', marginBottom: 12 },
    graphTitle:     { fontSize: 14, fontWeight: '700', color: '#1E223D', marginBottom: 12 },
    graphContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 80 },
    barWrapper:     { alignItems: 'center', gap: 4 },
    barValue:       { fontSize: 10, color: '#999', fontWeight: '600' },
    bar:            { width: 28, backgroundColor: '#815F9C', borderRadius: 6 },

    // Inputs suivi
    inputCard:      { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: '#EAE3EC', marginBottom: 12 },
    inputGroup:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
    inputDivider:   { height: 1, backgroundColor: '#EAE3EC', marginVertical: 10 },
    input:          { flex: 1, backgroundColor: '#F6F0F5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1E223D' },

    // Actions
    actionsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 12, marginHorizontal: 14, marginBottom: 12 },
    actionButton:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#EAE3EC', gap: 8, elevation: 1, shadowColor: '#815F9C', shadowOpacity: 0.05, shadowRadius: 4 },
    actionText:     { color: '#815F9C', fontWeight: '700', fontSize: 13 },
    customizeButton:{ flexDirection: 'row', backgroundColor: '#4CAF50', padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 14, gap: 8, elevation: 2, shadowColor: '#4CAF50', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    customizeText:  { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Modal
    modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
    modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle:     { fontSize: 18, fontWeight: '700', color: '#815F9C' },
    modalLabel:     { fontSize: 13, fontWeight: '700', color: '#1E223D', marginBottom: 8 },
    modalInput:     { backgroundColor: '#F6F0F5', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1.5, borderColor: '#EAE3EC', color: '#1E223D', fontSize: 14 },

    chipRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
    chip:       { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: '#EAE3EC', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#fff', gap: 5 },
    chipSelected: { backgroundColor: '#815F9C', borderColor: '#815F9C' },
    chipText:     { color: '#815F9C', fontSize: 13, fontWeight: '500' },
    chipTextSelected: { color: '#fff', fontWeight: '700' },

    mealForm:       { backgroundColor: '#FAF5FF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#EAE3EC' },
    mealFormActions:{ flexDirection: 'row', gap: 10, marginTop: 8 },
    compatChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE3EC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 6, flex: 1 },
    compatChipActive: { backgroundColor: '#e6f9ed' },
    compatChipText: { color: '#815F9C', fontSize: 13 },
    deleteChip:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE3E3', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 6 },
    deleteChipText: { color: '#E53935', fontSize: 13, fontWeight: '700' },

    addMealButton:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#815F9C', borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 10, gap: 8 },
    addMealText:    { color: '#fff', fontSize: 14, fontWeight: '700' },
    submitButton:   { backgroundColor: '#4CAF50', borderRadius: 12, padding: 14, alignItems: 'center' },
    submitText:     { color: '#fff', fontSize: 15, fontWeight: '700' },
});