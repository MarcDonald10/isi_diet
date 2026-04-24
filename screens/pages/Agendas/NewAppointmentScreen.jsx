import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { getDocumentsByConditions, addDocument } from '../../../services/firebase/firebaseService';

const { width } = Dimensions.get('window');

// ─── Constantes ───────────────────────────────────────────────────────────────

const TYPES_RDV = [
    { key: 'premiere',  label: 'Première consultation', icon: 'person-add-outline',       color: '#6366F1', bg: '#EEF2FF' },
    { key: 'suivi',     label: 'Suivi régulier',         icon: 'refresh-circle-outline',   color: '#10B981', bg: '#ECFDF5' },
    { key: 'bilan',     label: 'Bilan nutritionnel',     icon: 'clipboard-outline',         color: '#F59E0B', bg: '#FFFBEB' },
    { key: 'urgence',   label: 'Urgence',                icon: 'alert-circle-outline',     color: '#EF4444', bg: '#FEF2F2' },
];

const DUREES = [
    { value: 30,  label: '30 min' },
    { value: 45,  label: '45 min' },
    { value: 60,  label: '1h' },
    { value: 90,  label: '1h30' },
];

const SLOTS_MATIN    = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const SLOTS_APREM    = ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
const SLOTS_OCCUPE   = ['09:00', '14:30', '16:00']; // simulé — à remplacer par Firebase

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();
const DAYS_SHORT = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
const MONTHS_FR  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const isSameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
const isBeforeToday = (d) => { const t = new Date(); t.setHours(0,0,0,0); return d < t; };

// ─── Sous-composants ──────────────────────────────────────────────────────────

const StepIndicator = ({ current, total }) => (
    <View style={styles.stepRow}>
        {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={styles.stepItem}>
                <View style={[styles.stepDot, i < current && styles.stepDotDone, i === current && styles.stepDotActive]}>
                    {i < current
                        ? <Ionicons name="checkmark" size={11} color="#fff" />
                        : <Text style={[styles.stepDotNum, i === current && styles.stepDotNumActive]}>{i + 1}</Text>
                    }
                </View>
                {i < total - 1 && <View style={[styles.stepLine, i < current && styles.stepLineDone]} />}
            </View>
        ))}
    </View>
);

const SectionLabel = ({ label, sub }) => (
    <View style={styles.sectionLabelWrap}>
        <Text style={styles.sectionLabel}>{label}</Text>
        {sub && <Text style={styles.sectionSub}>{sub}</Text>}
    </View>
);

const AvatarFallback = ({ name = '', size = 44, color = '#815F9C' }) => (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '18' }]}>
        <Text style={{ color, fontSize: size * 0.35, fontWeight: '800' }}>
            {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </Text>
    </View>
);

// ─── Calendrier custom ────────────────────────────────────────────────────────
const CalendarPicker = ({ selected, onSelect }) => {
    const today = new Date();
    const [viewYear,  setViewYear]  = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
    const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
    const cells        = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : new Date(viewYear, viewMonth, i - firstDay + 1));

    const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
    const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

    return (
        <View style={styles.calendar}>
            {/* Navigation mois */}
            <View style={styles.calNavRow}>
                <TouchableOpacity style={styles.calNavBtn} onPress={prevMonth}>
                    <Ionicons name="chevron-back" size={18} color="#1A1035" />
                </TouchableOpacity>
                <Text style={styles.calMonthLabel}>{MONTHS_FR[viewMonth]} {viewYear}</Text>
                <TouchableOpacity style={styles.calNavBtn} onPress={nextMonth}>
                    <Ionicons name="chevron-forward" size={18} color="#1A1035" />
                </TouchableOpacity>
            </View>

            {/* Jours de la semaine */}
            <View style={styles.calDaysHeader}>
                {DAYS_SHORT.map(d => (
                    <Text key={d} style={styles.calDayHeaderText}>{d}</Text>
                ))}
            </View>

            {/* Grille */}
            <View style={styles.calGrid}>
                {cells.map((date, idx) => {
                    if (!date) return <View key={idx} style={styles.calCell} />;
                    const isSelected = selected && isSameDay(date, selected);
                    const isToday    = isSameDay(date, today);
                    const isPast     = isBeforeToday(date);
                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.calCell, isSelected && styles.calCellSelected, isToday && !isSelected && styles.calCellToday, isPast && styles.calCellPast]}
                            onPress={() => !isPast && onSelect(date)}
                            disabled={isPast}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.calCellText, isSelected && styles.calCellTextSelected, isPast && styles.calCellTextPast, isToday && !isSelected && styles.calCellTextToday]}>
                                {date.getDate()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// ─── Écran principal ──────────────────────────────────────────────────────────
export default function NewAppointmentScreen({ navigation, route }) {
    const { user } = useAuth();
    // Optionnel : patient pré-sélectionné depuis la liste
    const preselectedPatient = route?.params?.patient || null;

    const [step, setStep]             = useState(0); // 0 patient / 1 type / 2 date / 3 heure / 4 recap
    const [patients, setPatients]     = useState([]);
    const [loadingPats, setLoadingPats] = useState(true);
    const [saving, setSaving]         = useState(false);

    // Formulaire
    const [selectedPatient, setSelectedPatient] = useState(preselectedPatient);
    const [searchPatient, setSearchPatient]     = useState('');
    const [selectedType, setSelectedType]       = useState(null);
    const [selectedDate, setSelectedDate]       = useState(null);
    const [selectedSlot, setSelectedSlot]       = useState(null);
    const [selectedDuree, setSelectedDuree]     = useState(45);
    const [note, setNote]                       = useState('');

    const slideAnim = useRef(new Animated.Value(0)).current;

    const TOTAL_STEPS = preselectedPatient ? 4 : 5;
    const currentStep = preselectedPatient ? step - 1 : step; // skip step 0 si patient pré-sélectionné

    // ── Chargement patients ────────────────────────────────────────────────
    useEffect(() => {
        if (preselectedPatient) { setStep(1); setLoadingPats(false); return; }
        const load = async () => {
            try {
                const pats = await getDocumentsByConditions('users', [['type', '==', 'Patient']]);
                setPatients(pats || []);
            } catch (e) { console.error(e); }
            finally { setLoadingPats(false); }
        };
        load();
    }, []);

    // ── Animation de transition entre steps ───────────────────────────────
    const goToStep = (next) => {
        Animated.sequence([
            Animated.timing(slideAnim, { toValue: -20, duration: 120, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0,   duration: 180, useNativeDriver: true }),
        ]).start();
        setStep(next);
    };

    const goNext = () => goToStep(step + 1);
    const goBack = () => { if (step === 0 || (preselectedPatient && step === 1)) navigation.goBack(); else goToStep(step - 1); };

    // ── Validation par step ────────────────────────────────────────────────
    const canProceed = () => {
        if (step === 0) return !!selectedPatient;
        if (step === 1) return !!selectedType;
        if (step === 2) return !!selectedDate;
        if (step === 3) return !!selectedSlot;
        return true;
    };

    // ── Enregistrement Firebase ────────────────────────────────────────────
    const handleSave = async () => {
        try {
            setSaving(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            await addDocument('appointments', {
                dieticianId:   user?.uid,
                patientId:     selectedPatient.id,
                patientName:   `${selectedPatient.nom || ''} ${selectedPatient.prenom || ''}`.trim(),
                patientPhoto:  selectedPatient.photoUri || '',
                type:          selectedType.key,
                typeLabel:     selectedType.label,
                date:          dateStr,
                heure:         selectedSlot,
                duree:         selectedDuree,
                note:          note.trim(),
                status:        'confirmed',
                createdAt:     new Date(),
                updatedAt:     new Date(),
            });
            Alert.alert(
                'RDV planifié ✓',
                `Rendez-vous avec ${selectedPatient.nom} ${selectedPatient.prenom} le ${selectedDate.toLocaleDateString('fr-FR')} à ${selectedSlot}.`,
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            console.error(e);
            Alert.alert('Erreur', 'Impossible de planifier le rendez-vous.');
        } finally { setSaving(false); }
    };

    // ── Patients filtrés ───────────────────────────────────────────────────
    const filteredPats = patients.filter(p =>
        `${p.nom || ''} ${p.prenom || ''}`.toLowerCase().includes(searchPatient.toLowerCase())
    );

    // ── Render step ────────────────────────────────────────────────────────
    const renderStep = () => {
        switch (step) {

            // ── STEP 0 : Choisir le patient ────────────────────────────────
            case 0:
                return (
                    <View style={styles.stepContent}>
                        <SectionLabel label="Sélectionner un patient" sub="Choisissez le patient pour ce rendez-vous" />
                        <View style={styles.searchBar}>
                            <Ionicons name="search-outline" size={17} color="#A09AB8" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher…"
                                value={searchPatient}
                                onChangeText={setSearchPatient}
                                placeholderTextColor="#C4B5D8"
                            />
                        </View>
                        {loadingPats ? (
                            <ActivityIndicator color="#815F9C" style={{ marginTop: 30 }} />
                        ) : (
                            <FlatList
                                data={filteredPats}
                                keyExtractor={item => item.id}
                                scrollEnabled={false}
                                ListEmptyComponent={<Text style={styles.emptyText}>Aucun patient trouvé</Text>}
                                renderItem={({ item }) => {
                                    const name = `${item.nom || ''} ${item.prenom || ''}`.trim();
                                    const isSelected = selectedPatient?.id === item.id;
                                    return (
                                        <TouchableOpacity
                                            style={[styles.patientRow, isSelected && styles.patientRowSelected]}
                                            onPress={() => setSelectedPatient(item)}
                                            activeOpacity={0.8}
                                        >
                                            {item.photoUri
                                                ? <Image source={{ uri: item.photoUri }} style={styles.patientRowAvatar} />
                                                : <AvatarFallback name={name} size={44} />
                                            }
                                            <View style={styles.patientRowInfo}>
                                                <Text style={[styles.patientRowName, isSelected && { color: '#815F9C' }]}>{name}</Text>
                                                {item.objectif && <Text style={styles.patientRowSub}>{item.objectif}</Text>}
                                            </View>
                                            {isSelected && <Ionicons name="checkmark-circle" size={22} color="#815F9C" />}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                );

            // ── STEP 1 : Type de rendez-vous ───────────────────────────────
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <SectionLabel label="Type de consultation" sub="Sélectionnez la nature du rendez-vous" />
                        <View style={styles.typeGrid}>
                            {TYPES_RDV.map(type => {
                                const isSelected = selectedType?.key === type.key;
                                return (
                                    <TouchableOpacity
                                        key={type.key}
                                        style={[styles.typeCard, { backgroundColor: type.bg }, isSelected && styles.typeCardSelected, isSelected && { borderColor: type.color }]}
                                        onPress={() => setSelectedType(type)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.typeIconBox, { backgroundColor: isSelected ? type.color : type.color + '20' }]}>
                                            <Ionicons name={type.icon} size={22} color={isSelected ? '#fff' : type.color} />
                                        </View>
                                        <Text style={[styles.typeLabel, { color: type.color }]}>{type.label}</Text>
                                        {isSelected && (
                                            <View style={[styles.typeCheck, { backgroundColor: type.color }]}>
                                                <Ionicons name="checkmark" size={10} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <SectionLabel label="Durée" sub="Choisissez la durée estimée" />
                        <View style={styles.dureeRow}>
                            {DUREES.map(d => (
                                <TouchableOpacity
                                    key={d.value}
                                    style={[styles.dureeChip, selectedDuree === d.value && styles.dureeChipSelected]}
                                    onPress={() => setSelectedDuree(d.value)}
                                >
                                    <Text style={[styles.dureeChipText, selectedDuree === d.value && styles.dureeChipTextSelected]}>{d.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            // ── STEP 2 : Date ─────────────────────────────────────────────
            case 2:
                return (
                    <View style={styles.stepContent}>
                        <SectionLabel label="Choisir la date" sub="Sélectionnez un jour disponible" />
                        <CalendarPicker selected={selectedDate} onSelect={setSelectedDate} />
                        {selectedDate && (
                            <View style={styles.selectedDateBadge}>
                                <Ionicons name="calendar-outline" size={16} color="#815F9C" />
                                <Text style={styles.selectedDateText}>
                                    {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </Text>
                            </View>
                        )}
                    </View>
                );

            // ── STEP 3 : Heure ────────────────────────────────────────────
            case 3:
                return (
                    <View style={styles.stepContent}>
                        <SectionLabel label="Choisir l'heure" sub="Créneaux disponibles pour ce jour" />

                        <Text style={styles.slotGroupTitle}>Matin</Text>
                        <View style={styles.slotsGrid}>
                            {SLOTS_MATIN.map(slot => {
                                const isOccupied = SLOTS_OCCUPE.includes(slot);
                                const isSelected = selectedSlot === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        style={[styles.slotChip, isSelected && styles.slotChipSelected, isOccupied && styles.slotChipOccupied]}
                                        onPress={() => !isOccupied && setSelectedSlot(slot)}
                                        disabled={isOccupied}
                                    >
                                        {isOccupied
                                            ? <Ionicons name="close" size={14} color="#CBD5E0" />
                                            : <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>{slot}</Text>
                                        }
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.slotGroupTitle}>Après-midi</Text>
                        <View style={styles.slotsGrid}>
                            {SLOTS_APREM.map(slot => {
                                const isOccupied = SLOTS_OCCUPE.includes(slot);
                                const isSelected = selectedSlot === slot;
                                return (
                                    <TouchableOpacity
                                        key={slot}
                                        style={[styles.slotChip, isSelected && styles.slotChipSelected, isOccupied && styles.slotChipOccupied]}
                                        onPress={() => !isOccupied && setSelectedSlot(slot)}
                                        disabled={isOccupied}
                                    >
                                        {isOccupied
                                            ? <Ionicons name="close" size={14} color="#CBD5E0" />
                                            : <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>{slot}</Text>
                                        }
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Légende */}
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#815F9C' }]} /><Text style={styles.legendText}>Disponible</Text></View>
                            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#E2E8F0' }]} /><Text style={styles.legendText}>Occupé</Text></View>
                        </View>
                    </View>
                );

            // ── STEP 4 : Récap + Note ─────────────────────────────────────
            case 4:
                return (
                    <View style={styles.stepContent}>
                        <SectionLabel label="Récapitulatif" sub="Vérifiez les informations avant de confirmer" />

                        {/* Carte récap */}
                        <LinearGradient colors={['#1E1040', '#3D2070']} style={styles.recapCard}>
                            <View style={styles.recapPatientRow}>
                                {selectedPatient?.photoUri
                                    ? <Image source={{ uri: selectedPatient.photoUri }} style={styles.recapAvatar} />
                                    : <AvatarFallback name={`${selectedPatient?.nom} ${selectedPatient?.prenom}`} size={48} color="#C4B5D8" />
                                }
                                <View>
                                    <Text style={styles.recapPatientName}>{selectedPatient?.nom} {selectedPatient?.prenom}</Text>
                                    <View style={[styles.recapTypeBadge, { backgroundColor: selectedType?.color + '30' }]}>
                                        <Text style={[styles.recapTypeBadgeText, { color: selectedType?.color }]}>{selectedType?.label}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.recapDivider} />

                            <View style={styles.recapRows}>
                                <RecapRow icon="calendar-outline"    value={selectedDate?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                                <RecapRow icon="time-outline"        value={`${selectedSlot} — durée ${DUREES.find(d => d.value === selectedDuree)?.label}`} />
                                <RecapRow icon="person-outline"      value={`Dr. ${user?.nom || ''} ${user?.prenom || ''}`} />
                            </View>
                        </LinearGradient>

                        {/* Note */}
                        <SectionLabel label="Note (optionnel)" sub="Informations complémentaires pour ce RDV" />
                        <TextInput
                            style={styles.noteInput}
                            placeholder="Ex : Apporter les résultats d'analyses, jeûn depuis 12h…"
                            placeholderTextColor="#C4B5D8"
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                );

            default: return null;
        }
    };

    const stepIndex = preselectedPatient ? step - 1 : step;
    const totalSteps = preselectedPatient ? 4 : 5;
    const isLastStep = step === 4;

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBack} onPress={goBack}>
                    <Ionicons name="arrow-back" size={20} color="#1A1035" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Planifier un RDV</Text>
                    <Text style={styles.headerSub}>
                        Étape {Math.max(stepIndex + 1, 1)} sur {totalSteps}
                    </Text>
                </View>
                <TouchableOpacity style={styles.headerClose} onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={20} color="#A09AB8" />
                </TouchableOpacity>
            </View>

            {/* ── Indicateur de progression ── */}
            <View style={styles.progressWrap}>
                <View style={[styles.progressBar, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
            </View>

            {/* ── Résumé contextuel (patient sélectionné) ── */}
            {selectedPatient && step >= 1 && (
                <View style={styles.contextBanner}>
                    {selectedPatient.photoUri
                        ? <Image source={{ uri: selectedPatient.photoUri }} style={styles.contextAvatar} />
                        : <AvatarFallback name={`${selectedPatient.nom} ${selectedPatient.prenom}`} size={32} color="#815F9C" />
                    }
                    <Text style={styles.contextName} numberOfLines={1}>{selectedPatient.nom} {selectedPatient.prenom}</Text>
                    {selectedType && (
                        <>
                            <View style={styles.contextDot} />
                            <Text style={[styles.contextType, { color: selectedType.color }]}>{selectedType.label}</Text>
                        </>
                    )}
                    {selectedDate && (
                        <>
                            <View style={styles.contextDot} />
                            <Text style={styles.contextDate}>{selectedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</Text>
                        </>
                    )}
                    {selectedSlot && (
                        <>
                            <View style={styles.contextDot} />
                            <Text style={styles.contextDate}>{selectedSlot}</Text>
                        </>
                    )}
                </View>
            )}

            {/* ── Contenu du step ── */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
                    {renderStep()}
                </Animated.View>
            </ScrollView>

            {/* ── Bouton suivant / confirmer ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
                    onPress={isLastStep ? handleSave : goNext}
                    disabled={!canProceed() || saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.nextBtnText}>
                                {isLastStep ? 'Confirmer le rendez-vous' : 'Suivant'}
                            </Text>
                            {!isLastStep && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                            {isLastStep && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// ─── RecapRow helper ──────────────────────────────────────────────────────────
const RecapRow = ({ icon, value }) => (
    <View style={styles.recapRow}>
        <Ionicons name={icon} size={15} color="rgba(255,255,255,0.5)" />
        <Text style={styles.recapRowText}>{value}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container:  { flex: 1, backgroundColor: '#F4F0FA' },

    // Header
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 54 : 40, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EBF8', gap: 10 },
    headerBack:  { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center' },
    headerClose: { marginLeft: 'auto', width: 38, height: 38, borderRadius: 12, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: '#1A1035', letterSpacing: -0.2 },
    headerSub:   { fontSize: 12, color: '#A09AB8', fontWeight: '500', marginTop: 1 },

    // Progress bar
    progressWrap:{ height: 3, backgroundColor: '#EDE8F5' },
    progressBar: { height: '100%', backgroundColor: '#815F9C', borderRadius: 2 },

    // Context banner
    contextBanner:{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0EBF8', gap: 8, flexWrap: 'wrap' },
    contextAvatar:{ width: 32, height: 32, borderRadius: 9 },
    contextName:  { fontSize: 13, fontWeight: '700', color: '#1A1035', flex: 1, maxWidth: 140 },
    contextDot:   { width: 3, height: 3, borderRadius: 2, backgroundColor: '#C4B5D8' },
    contextType:  { fontSize: 12, fontWeight: '600' },
    contextDate:  { fontSize: 12, color: '#A09AB8', fontWeight: '600' },

    // Scroll
    scrollView:   { flex: 1 },
    scrollContent:{ padding: 18, paddingBottom: 30 },
    stepContent:  { gap: 16 },

    // Section label
    sectionLabelWrap:{ marginBottom: 4 },
    sectionLabel:    { fontSize: 15, fontWeight: '800', color: '#1A1035', letterSpacing: -0.2 },
    sectionSub:      { fontSize: 12, color: '#A09AB8', marginTop: 3 },

    // Step 0 — Patient
    searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderWidth: 1.5, borderColor: '#EDE8F5' },
    searchInput:    { flex: 1, fontSize: 14, color: '#1A1035', fontWeight: '500' },
    patientRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 12, borderWidth: 1.5, borderColor: '#EDE8F5', marginBottom: 8 },
    patientRowSelected: { borderColor: '#815F9C', backgroundColor: '#FAF5FF' },
    patientRowAvatar:{ width: 44, height: 44, borderRadius: 12 },
    patientRowInfo: { flex: 1 },
    patientRowName: { fontSize: 14, fontWeight: '700', color: '#1A1035' },
    patientRowSub:  { fontSize: 12, color: '#A09AB8', marginTop: 2 },
    emptyText:      { textAlign: 'center', color: '#A09AB8', fontSize: 13, paddingVertical: 30 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },

    // Step 1 — Type
    typeGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    typeCard:     { width: (width - 36 - 12) / 2 - 6, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: 'transparent', alignItems: 'flex-start', gap: 10, position: 'relative' },
    typeCardSelected: { borderWidth: 2 },
    typeIconBox:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    typeLabel:    { fontSize: 13, fontWeight: '700', lineHeight: 18 },
    typeCheck:    { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    dureeRow:     { flexDirection: 'row', gap: 10 },
    dureeChip:    { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE8F5', backgroundColor: '#fff', alignItems: 'center' },
    dureeChipSelected:  { backgroundColor: '#815F9C', borderColor: '#815F9C' },
    dureeChipText:      { fontSize: 13, fontWeight: '600', color: '#A09AB8' },
    dureeChipTextSelected: { color: '#fff', fontWeight: '700' },

    // Step 2 — Calendrier
    calendar:         { backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#EDE8F5' },
    calNavRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    calNavBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F0FA', alignItems: 'center', justifyContent: 'center' },
    calMonthLabel:    { fontSize: 15, fontWeight: '800', color: '#1A1035' },
    calDaysHeader:    { flexDirection: 'row', marginBottom: 8 },
    calDayHeaderText: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#A09AB8' },
    calGrid:          { flexDirection: 'row', flexWrap: 'wrap' },
    calCell:          { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    calCellSelected:  { backgroundColor: '#815F9C', borderRadius: 10 },
    calCellToday:     { borderWidth: 1.5, borderColor: '#815F9C', borderRadius: 10 },
    calCellPast:      { opacity: 0.3 },
    calCellText:      { fontSize: 13, fontWeight: '600', color: '#1A1035' },
    calCellTextSelected:{ color: '#fff', fontWeight: '800' },
    calCellTextPast:  { color: '#A09AB8' },
    calCellTextToday: { color: '#815F9C', fontWeight: '800' },

    selectedDateBadge:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0EDFF', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#DDD6FE' },
    selectedDateText: { fontSize: 13, color: '#815F9C', fontWeight: '700' },

    // Step 3 — Créneaux
    slotGroupTitle: { fontSize: 13, fontWeight: '700', color: '#A09AB8', marginBottom: 8, marginTop: 4 },
    slotsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    slotChip:       { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#EDE8F5', backgroundColor: '#fff', minWidth: 72, alignItems: 'center' },
    slotChipSelected:{ backgroundColor: '#815F9C', borderColor: '#815F9C' },
    slotChipOccupied:{ backgroundColor: '#F8F8F8', borderColor: '#EDE8F5' },
    slotText:       { fontSize: 13, fontWeight: '600', color: '#1A1035' },
    slotTextSelected:{ color: '#fff', fontWeight: '700' },
    legendRow:      { flexDirection: 'row', gap: 18, marginTop: 6 },
    legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot:      { width: 10, height: 10, borderRadius: 5 },
    legendText:     { fontSize: 12, color: '#A09AB8', fontWeight: '500' },

    // Step 4 — Récap
    recapCard:      { borderRadius: 18, padding: 20, overflow: 'hidden' },
    recapPatientRow:{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
    recapAvatar:    { width: 48, height: 48, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    recapPatientName:{ color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
    recapTypeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
    recapTypeBadgeText:{ fontSize: 12, fontWeight: '700' },
    recapDivider:   { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginBottom: 14 },
    recapRows:      { gap: 10 },
    recapRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
    recapRowText:   { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '500', flex: 1 },

    noteInput:      { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#EDE8F5', padding: 14, fontSize: 14, color: '#1A1035', minHeight: 110, fontWeight: '500' },

    // Footer
    footer:    { backgroundColor: '#fff', padding: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 16, borderTopWidth: 1, borderTopColor: '#F0EBF8' },
    nextBtn:   { backgroundColor: '#815F9C', borderRadius: 16, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    nextBtnDisabled:{ backgroundColor: '#C4B5D8' },
    nextBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },

    // Step indicator (non utilisé visuellement mais gardé)
    stepRow:    { flexDirection: 'row', alignItems: 'center' },
    stepItem:   { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot:    { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#EDE8F5', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    stepDotDone:{ backgroundColor: '#815F9C', borderColor: '#815F9C' },
    stepDotActive:{ borderColor: '#815F9C' },
    stepDotNum: { fontSize: 11, fontWeight: '700', color: '#A09AB8' },
    stepDotNumActive:{ color: '#815F9C' },
    stepLine:   { flex: 1, height: 2, backgroundColor: '#EDE8F5' },
    stepLineDone:{ backgroundColor: '#815F9C' },
});