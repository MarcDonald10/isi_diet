import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Composant réutilisable pour les indicateurs de santé
 * @param {string} icon - Nom de l'icône Ionicons
 * @param {string|number} value - Valeur à afficher
 * @param {string} label - Label du l'indicateur
 * @param {string} bgColor - Couleur de fond
 */
const HealthIndicator = ({ icon, value, label, bgColor = '#815F9C' }) => {
    return (
        <View style={[styles.indicator, { backgroundColor: bgColor }]}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
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
    iconContainer: {
        marginBottom: 6,
    },
    value: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    label: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
});

export default HealthIndicator;
