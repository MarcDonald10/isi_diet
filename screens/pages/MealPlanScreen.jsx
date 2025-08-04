import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Header from '../components/Header';

export default function MealPlanScreen() {
    // Exemple de plan hebdo enrichi
    const [weeklyPlan, setWeeklyPlan] = useState([
        {
            id: '1',
            day: 'Lundi',
            meals: [
                { type: 'Petit-déjeuner', icon: 'sunny-outline', desc: 'Avoine, lait, fruits', portions: '1 bol', calories: 320, compatible: true, consumed: false },
                { type: 'Déjeuner', icon: 'restaurant-outline', desc: 'Poulet, riz, légumes', portions: '1 assiette', calories: 540, compatible: true, consumed: false },
                { type: 'Dîner', icon: 'moon-outline', desc: 'Poisson, quinoa', portions: '1 assiette', calories: 410, compatible: false, consumed: false },
            ],
        },
        {
            id: '2',
            day: 'Mardi',
            meals: [
                { type: 'Petit-déjeuner', icon: 'sunny-outline', desc: 'Yogourt, noix', portions: '1 bol', calories: 280, compatible: true, consumed: false },
                { type: 'Déjeuner', icon: 'restaurant-outline', desc: 'Salade, thon', portions: '1 assiette', calories: 390, compatible: true, consumed: false },
                { type: 'Dîner', icon: 'moon-outline', desc: 'Légumes sautés', portions: '1 assiette', calories: 350, compatible: true, consumed: false },
            ],
        },
    ]);
    const [selectedFilter, setSelectedFilter] = useState('Tous');
    const [poids, setPoids] = useState('');
    const [sensation, setSensation] = useState('');
    const [graphData] = useState([70, 69.5, 69, 68.8, 68.5]); // Ex. poids

    // Marquer un repas comme consommé
    const toggleConsumed = (dayIdx, mealIdx) => {
        const newPlan = [...weeklyPlan];
        newPlan[dayIdx].meals[mealIdx].consumed = !newPlan[dayIdx].meals[mealIdx].consumed;
        setWeeklyPlan(newPlan);
    };

    // Personnalisation (exemple)
    const filters = [
        { label: 'Tous', icon: 'filter' },
        { label: 'Végétarien', icon: 'leaf' },
        { label: 'Faible sel', icon: 'droplet' },
        { label: 'Diabète', icon: 'heart-pulse' },
    ];

    // Générer un nouveau plan (exemple)
    const generateNewPlan = () => {
        Alert.alert('Nouveau plan', 'Un nouveau plan hebdomadaire a été généré !');
    };

    // Export (exemple)
    const exportPlan = () => {
        Alert.alert('Export', 'Fonction export PDF/email à brancher.');
    };

    // Générer liste de courses (exemple)
    const generateShoppingList = () => {
        Alert.alert('Liste de courses', 'Fonction à brancher.');
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
            <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="restaurant-outline" size={40} color="#6C63FF" />
                    <Text style={styles.title}>Plan Alimentaire</Text>
                </View>

                {/* Filtres */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                    {filters.map(f => (
                        <TouchableOpacity
                            key={f.label}
                            style={[
                                styles.filterButton,
                                selectedFilter === f.label && styles.filterButtonActive,
                            ]}
                            onPress={() => setSelectedFilter(f.label)}
                        >
                            <MaterialCommunityIcons name={f.icon} size={18} color={selectedFilter === f.label ? "#fff" : "#6C63FF"} />
                            <Text style={[
                                styles.filterText,
                                selectedFilter === f.label && { color: "#fff", fontWeight: 'bold' }
                            ]}>{f.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Générer un nouveau plan */}
                <TouchableOpacity style={styles.generateButton} onPress={generateNewPlan}>
                    <Feather name="refresh-cw" size={18} color="#fff" />
                    <Text style={styles.generateText}>Générer un nouveau plan</Text>
                </TouchableOpacity>

                {/* Weekly Plan */}
                {weeklyPlan.map((day, dayIdx) => (
                    <View key={day.id} style={styles.dayContainer}>
                        <Text style={styles.dayText}>{day.day}</Text>
                        {day.meals.map((meal, mealIdx) => (
                            <View key={meal.type} style={[
                                styles.mealItem,
                                !meal.compatible && { backgroundColor: '#fff3f3' }
                            ]}>
                                <Ionicons name={meal.icon} size={22} color={meal.compatible ? "#4CAF50" : "#E53935"} style={{ marginRight: 8 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mealType}>{meal.type}</Text>
                                    <Text style={styles.mealDesc}>{meal.desc}</Text>
                                    <Text style={styles.mealDetails}>
                                        {meal.portions} • {meal.calories} kcal
                                        {!meal.compatible && <Text style={{ color: '#E53935' }}>  (⚠ Non adapté)</Text>}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[
                                        styles.checkButton,
                                        meal.consumed && styles.checkButtonActive
                                    ]}
                                    onPress={() => toggleConsumed(dayIdx, mealIdx)}
                                >
                                    <Ionicons
                                        name={meal.consumed ? "checkmark-circle" : "ellipse-outline"}
                                        size={24}
                                        color={meal.consumed ? "#4CAF50" : "#B0B3C6"}
                                    />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ))}

                {/* Personnalisation & Export */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={generateShoppingList}>
                        <Feather name="shopping-cart" size={20} color="#6C63FF" />
                        <Text style={styles.actionText}>Liste de courses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={exportPlan}>
                        <Feather name="download" size={20} color="#6C63FF" />
                        <Text style={styles.actionText}>Exporter</Text>
                    </TouchableOpacity>
                </View>

                {/* Suivi graphique */}
                <View style={styles.statsContainer}>
                    <Text style={styles.statsTitle}>Évolution du poids</Text>
                    <View style={styles.graphContainer}>
                        {graphData.map((val, idx) => (
                            <View key={idx} style={[styles.bar, { height: 10 + (70 - val) * 12 }]}>
                                <Text style={styles.barLabel}>{val}kg</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Entrée poids/sensation */}
                <View style={styles.inputRow}>
                    <Ionicons name="barbell-outline" size={20} color="#6C63FF" />
                    <TextInput
                        style={styles.input}
                        placeholder="Poids actuel"
                        keyboardType="numeric"
                        value={poids}
                        onChangeText={setPoids}
                    />
                    <Ionicons name="happy-outline" size={20} color="#6C63FF" style={{ marginLeft: 10 }} />
                    <TextInput
                        style={styles.input}
                        placeholder="Sensation après repas"
                        value={sensation}
                        onChangeText={setSensation}
                    />
                </View>

                {/* Personnaliser le plan */}
                <TouchableOpacity style={styles.customizeButton}>
                    <Ionicons name="filter-outline" size={24} color="#fff" />
                    <Text style={styles.customizeText}>Personnaliser le plan</Text>
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F6F0F5', padding: 0 }, // magnolia
    header: { alignItems: 'center', marginTop: 18, marginBottom: 10 },
    title: { fontSize: 25, fontWeight: 'bold', color: '#815F9C', marginTop: 4, letterSpacing: 0.5 }, // pomp-and-power
    filtersRow: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 10 },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#815F9C', // pomp-and-power
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginRight: 10,
        backgroundColor: '#fff',
    },
    filterButtonActive: {
        backgroundColor: '#815F9C', // pomp-and-power
        borderColor: '#815F9C',
    },
    filterText: { marginLeft: 6, color: '#815F9C', fontSize: 14 }, // pomp-and-power
    generateButton: {
        flexDirection: 'row',
        backgroundColor: '#815F9C', // pomp-and-power
        padding: 12,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 18,
        marginBottom: 10,
        marginTop: 2,
        shadowColor: '#815F9C',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    generateText: { color: '#fff', fontSize: 15, marginLeft: 10, fontWeight: 'bold' },
    dayContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        shadowColor: '#815F9C',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    dayText: { fontSize: 18, fontWeight: 'bold', color: '#815F9C', marginBottom: 10, letterSpacing: 0.2 }, // pomp-and-power
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F0F5', // magnolia pour contraste
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
    },
    mealType: { fontWeight: 'bold', color: '#1E223D', fontSize: 15 }, // space-cadet
    mealDesc: { color: '#7D5F9B', fontSize: 14 }, // pomp-and-power-2
    mealDetails: { color: '#815F9C', fontSize: 13, marginTop: 2 }, // pomp-and-power
    checkButton: {
        marginLeft: 10,
        borderRadius: 16,
        padding: 4,
        backgroundColor: '#EAE3EC', // magnolia-2
    },
    checkButtonActive: {
        backgroundColor: '#e6f9ed',
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 6,
        marginBottom: 10,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        shadowColor: '#815F9C',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    actionText: { color: '#815F9C', fontWeight: 'bold', marginLeft: 8, fontSize: 14 }, // pomp-and-power
    statsContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 14,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        elevation: 2,
        shadowColor: '#815F9C',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    statsTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E223D', marginBottom: 10 }, // space-cadet
    graphContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 70,
        marginTop: 8,
        gap: 8,
    },
    bar: {
        width: 22,
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
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 10,
        marginHorizontal: 14,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#EAE3EC', // magnolia-2
        shadowColor: '#815F9C',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#EAE3EC', // magnolia-2
        borderRadius: 8,
        padding: 7,
        marginLeft: 8,
        backgroundColor: '#F6F0F5', // magnolia
        fontSize: 14,
        color: '#1E223D', // space-cadet
    },
    customizeButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 18,
        marginTop: 6,
        shadowColor: '#4CAF50',
        shadowOpacity: 0.10,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    customizeText: { color: '#fff', fontSize: 16, marginLeft: 10, fontWeight: 'bold' },
});