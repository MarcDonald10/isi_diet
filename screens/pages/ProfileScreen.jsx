import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

const PATHO_INFOS = {
    'Diabète': "Diabète : Importance des glucides à faible IG.",
    'Hypertension': "Hypertension : Limitez le sel et surveillez la tension.",
    'Obésité': "Obésité : Privilégiez une alimentation équilibrée et l'activité physique.",
};

const OBJECTIFS = [
    'Perte de poids',
    'Stabilisation',
    'Prise de masse',
    'Amélioration forme',
];

export default function ProfileScreen() {
    const [profile, setProfile] = useState({
        age: '32',
        sexe: 'Femme',
        poids: '68',
        taille: '165',
        activite: 'Modérée',
        pathologies: ['Diabète'],
        objectifs: 'Perte de poids',
    });
    const [newPatho, setNewPatho] = useState('');
    const [showPathoModal, setShowPathoModal] = useState(false);
    const [selectedObjectif, setSelectedObjectif] = useState(profile.objectifs);
    const [showObjectifMenu, setShowObjectifMenu] = useState(false);

    // Historique fictif
    const history = [
        { id: '1', date: '01/07/2025', dietitian: 'Dr. Dupont', advice: 'Réduire sucres rapides' },
        { id: '2', date: '15/06/2025', dietitian: 'Dr. Martin', advice: 'Augmenter fibres' },
    ];
    const objectifsHistory = [
        { id: 'a', objectif: 'Perte de 2 kg', periode: 'Juin-Juillet 2025', atteint: true },
        { id: 'b', objectif: 'Stabilisation', periode: 'Mai 2025', atteint: false },
    ];

    // Calcul IMC et besoins caloriques
    const poids = parseFloat(profile.poids.replace(',', '.')) || 0;
    const tailleM = (parseFloat(profile.taille.replace(',', '.')) || 0) / 100;
    const imc = tailleM > 0 ? (poids / (tailleM * tailleM)).toFixed(1) : '--';
    const besoinsCal = poids > 0 ? Math.round(22 * poids * (profile.activite === 'Forte' ? 1.5 : profile.activite === 'Modérée' ? 1.3 : 1.1)) : '--';

    // Ajout/Suppression pathologie
    const addPatho = () => {
        if (newPatho && !profile.pathologies.includes(newPatho)) {
            setProfile({ ...profile, pathologies: [...profile.pathologies, newPatho] });
            setNewPatho('');
            setShowPathoModal(false);
        }
    };
    const removePatho = (p) => {
        setProfile({ ...profile, pathologies: profile.pathologies.filter(x => x !== p) });
    };

    // Sauvegarde
    const saveProfile = () => {
        Alert.alert('Profil mis à jour', 'Vos informations ont bien été sauvegardées.');
    };

    return (
        <>
            <Header
                userPhoto="https://example.com/user-photo.jpg"
                username="Jean Dupont"
                onChatPress={() => navigation.navigate('Messagerie')}
                onNotificationPress={() => navigation.navigate('Notifications')}
                notificationCount={3}
            />
            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Ionicons name="person-circle" size={64} color="#6C63FF" style={{ marginBottom: 4 }} />
                        <Text style={styles.title}>Mon Profil</Text>
                    </View>

                    {/* Section Infos générales */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="information-circle-outline" size={22} color="#6C63FF" />
                            <Text style={styles.sectionTitle}>Informations générales</Text>
                        </View>
                        <View style={styles.inputRow}>
                            <Ionicons name="calendar-outline" size={22} color="#555" />
                            <TextInput
                                style={styles.input}
                                placeholder="Âge"
                                keyboardType="numeric"
                                value={profile.age}
                                onChangeText={text => setProfile({ ...profile, age: text })}
                            />
                            <Ionicons name="female-outline" size={22} color="#555" style={{ marginLeft: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Sexe"
                                value={profile.sexe}
                                onChangeText={text => setProfile({ ...profile, sexe: text })}
                            />
                        </View>
                        <View style={styles.inputRow}>
                            <Ionicons name="body-outline" size={22} color="#555" />
                            <TextInput
                                style={styles.input}
                                placeholder="Poids (kg)"
                                keyboardType="numeric"
                                value={profile.poids}
                                onChangeText={text => setProfile({ ...profile, poids: text })}
                            />
                            <Ionicons name="resize-outline" size={22} color="#555" style={{ marginLeft: 10 }} />
                            <TextInput
                                style={styles.input}
                                placeholder="Taille (cm)"
                                keyboardType="numeric"
                                value={profile.taille}
                                onChangeText={text => setProfile({ ...profile, taille: text })}
                            />
                        </View>
                        <View style={styles.inputRow}>
                            <Ionicons name="walk-outline" size={22} color="#555" />
                            <TextInput
                                style={styles.input}
                                placeholder="Niveau d'activité (Faible/Modérée/Forte)"
                                value={profile.activite}
                                onChangeText={text => setProfile({ ...profile, activite: text })}
                            />
                        </View>
                        <View style={styles.calculsRow}>
                            <Text style={styles.calculsText}>IMC : <Text style={{ fontWeight: 'bold', color: '#6C63FF' }}>{imc}</Text></Text>
                            <Text style={styles.calculsText}>Besoins caloriques : <Text style={{ fontWeight: 'bold', color: '#6C63FF' }}>{besoinsCal} kcal/j</Text></Text>
                        </View>
                    </View>

                    {/* Section Pathologies */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="medkit-outline" size={22} color="#6C63FF" />
                            <Text style={styles.sectionTitle}>Pathologies</Text>
                            <TouchableOpacity onPress={() => setShowPathoModal(true)} style={{ marginLeft: 8 }}>
                                <Ionicons name="add-circle-outline" size={22} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>
                        {profile.pathologies.length === 0 && <Text style={styles.infoText}>Aucune pathologie déclarée.</Text>}
                        {profile.pathologies.map((p, idx) => (
                            <View key={p} style={styles.pathoItem}>
                                <Ionicons name="alert-circle-outline" size={18} color="#E53935" style={{ marginRight: 4 }} />
                                <Text style={styles.pathoText}>{p}</Text>
                                <TouchableOpacity onPress={() => removePatho(p)}>
                                    <Ionicons name="close-circle-outline" size={18} color="#E53935" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {profile.pathologies.map((p, idx) => (
                            <Text key={p + '_info'} style={styles.pathoInfo}>{PATHO_INFOS[p] || ''}</Text>
                        ))}
                    </View>
                    {/* Modal ajout pathologie */}
                    <Modal visible={showPathoModal} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Ajouter une pathologie</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nom de la pathologie"
                                    value={newPatho}
                                    onChangeText={setNewPatho}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
                                    <Pressable onPress={() => setShowPathoModal(false)} style={{ marginRight: 12 }}>
                                        <Text style={{ color: '#888' }}>Annuler</Text>
                                    </Pressable>
                                    <Pressable onPress={addPatho}>
                                        <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Ajouter</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Section Objectifs */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="trophy-outline" size={22} color="#6C63FF" />
                            <Text style={styles.sectionTitle}>Objectif principal</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowObjectifMenu(!showObjectifMenu)}
                        >
                            <Text style={styles.dropdownText}>{selectedObjectif}</Text>
                            <Ionicons name={showObjectifMenu ? "chevron-up" : "chevron-down"} size={20} color="#4CAF50" />
                        </TouchableOpacity>
                        {showObjectifMenu && (
                            <View style={styles.dropdownMenu}>
                                {OBJECTIFS.map(obj => (
                                    <TouchableOpacity
                                        key={obj}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setSelectedObjectif(obj);
                                            setProfile({ ...profile, objectifs: obj });
                                            setShowObjectifMenu(false);
                                        }}
                                    >
                                        <Text style={styles.dropdownText}>{obj}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                        <Text style={styles.sectionSubtitle}>Historique des objectifs</Text>
                        {objectifsHistory.map(o => (
                            <View key={o.id} style={styles.objectifItem}>
                                <Ionicons name={o.atteint ? "checkmark-circle" : "ellipse-outline"} size={18} color={o.atteint ? "#4CAF50" : "#aaa"} />
                                <Text style={styles.objectifText}>{o.objectif} <Text style={{ color: '#888' }}>({o.periode})</Text></Text>
                            </View>
                        ))}
                    </View>

                    {/* Section Historique */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="time-outline" size={22} color="#6C63FF" />
                            <Text style={styles.sectionTitle}>Historique des consultations</Text>
                        </View>
                        <FlatList
                            data={history}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.historyItem}>
                                    <Ionicons name="calendar-outline" size={22} color="#4CAF50" style={{ marginRight: 8 }} />
                                    <View>
                                        <Text style={styles.historyText}>{item.date} - {item.dietitian}</Text>
                                        <Text style={styles.historyAdvice}>{item.advice}</Text>
                                    </View>
                                    <TouchableOpacity style={{ marginLeft: 10 }}>
                                        <Ionicons name="document-text-outline" size={20} color="#888" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            scrollEnabled={false}
                        />
                    </View>

                    {/* Bouton sauvegarde */}
                    <TouchableOpacity style={styles.saveButton} onPress={saveProfile} activeOpacity={0.85}>
                        <Ionicons name="save-outline" size={24} color="#fff" />
                        <Text style={styles.saveButtonText}>Sauvegarder</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: '#F6F0F5' }, // magnolia
    container: { flex: 1, padding: 18, backgroundColor: '#F6F0F5' }, // magnolia
    header: { alignItems: 'center', marginBottom: 18 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#815F9C', marginTop: 4, letterSpacing: 0.5 }, // pomp-and-power
    section: {
        backgroundColor: '#fff', // fond blanc pour contraste maximal
        borderRadius: 18,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        ...Platform.select({
            ios: { shadowColor: '#815F9C', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 4 },
        }),
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#815F9C', marginLeft: 6 }, // pomp-and-power
    sectionSubtitle: { fontSize: 15, fontWeight: '600', color: '#7D5F9B', marginTop: 10, marginBottom: 4 }, // pomp-and-power-2
    inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#EAE3EC', // magnolia-2
        borderRadius: 8,
        padding: 8,
        marginLeft: 8,
        backgroundColor: '#F6F0F5', // magnolia
        fontSize: 15,
        color: '#1E223D', // space-cadet
    },
    calculsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 2 },
    calculsText: { fontSize: 14, color: '#1E223D' }, // space-cadet
    infoText: { color: '#7D5F9B', fontStyle: 'italic', marginBottom: 4 }, // pomp-and-power-2
    pathoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
        backgroundColor: '#F6F0F5', // magnolia pour contraste avec texte rouge
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginRight: 6
    },
    pathoText: { fontSize: 15, color: '#E53935', marginRight: 6 }, // rouge sur fond magnolia
    pathoInfo: { fontSize: 13, color: '#815F9C', marginLeft: 8, fontStyle: 'italic', marginBottom: 2 }, // violet sur fond clair
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#fff', borderRadius: 14, padding: 20, width: 270, elevation: 5 },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAE3EC',
        borderRadius: 8,
        padding: 12,
        marginBottom: 6,
        backgroundColor: '#F6F0F5', // magnolia
        justifyContent: 'space-between'
    },
    dropdownText: { fontSize: 15, color: '#1E223D' }, // texte foncé sur fond clair
    dropdownMenu: { backgroundColor: '#fff', borderRadius: 8, elevation: 3, marginBottom: 8, marginTop: 2 },
    dropdownItem: { padding: 10 },
    objectifItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    objectifText: { fontSize: 14, color: '#1E223D', marginLeft: 6 }, // texte foncé sur fond blanc
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#EAE3EC', // magnolia-2
        borderRadius: 10
    },
    historyText: { fontSize: 15, color: '#1E223D' }, // texte foncé sur fond clair
    historyAdvice: { fontSize: 13, color: '#7D5F9B' }, // violet doux sur fond clair
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#815F9C', // bouton bien visible
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 18,
        shadowColor: '#815F9C',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    saveButtonText: { color: '#fff', fontSize: 17, marginLeft: 10, fontWeight: 'bold', letterSpacing: 0.5 },
});