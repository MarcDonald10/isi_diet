import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

/**
 * Composant réutilisable pour les cartes de service rapide
 * @param {string} icon - Nom de l'icône Ionicons
 * @param {string} label - Texte du label
 * @param {array} colors - Couleurs du dégradé [start, end]
 * @param {function} onPress - Fonction au clic
 */
const ServiceCard = ({ icon, label, colors = ['#815F9C', '#6B4D80'], onPress }) => {
    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <Ionicons name={icon} size={32} color="#fff" />
                <Text style={styles.label}>{label}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
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
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
});

export default ServiceCard;
