import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function NotificationScreen() {
  const navigation = useNavigation();

  // Données simulées pour les notifications
  const notifications = [
    {
      id: '1',
      icon: 'calendar-outline',
      title: 'Rendez-vous confirmé',
      details: 'Consultation avec Dr. Dupont le 08/08/2025',
    },
    {
      id: '2',
      icon: 'nutrition-outline',
      title: 'Nouveau plan alimentaire',
      details: 'Plan hebdomadaire mis à jour pour vous',
    },
    {
      id: '3',
      icon: 'play-circle-outline',
      title: 'Master Class disponible',
      details: 'Nouveau cours sur le diabète par Dr. Martin',
    },
    {
      id: '4',
      icon: 'chatbubbles-outline',
      title: 'Nouveau message',
      details: 'Dr. Dupont a répondu à votre question',
    },
  ];

  // Fonction pour tronquer les détails à 25 caractères
  const truncateDetails = (text) => {
    return text.length > 35 ? text.substring(0, 34) + '...' : text;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="notifications-outline" size={40} color="#4CAF50" />
        <Text style={styles.title}>Notifications</Text>
      </View>

      {/* Liste des notifications */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.notificationItem}
            accessibilityLabel={`${item.title}: ${item.details}`}
          >
            <Ionicons name={item.icon} size={32} color="#4CAF50" style={styles.icon} />
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationDetails}>{truncateDetails(item.details)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        }
      />

      {/* Bouton de retour à l'accueil */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Retour à l'accueil"
      >
        <Ionicons name="home-outline" size={24} color="#fff" />
        <Text style={styles.backButtonText}>Retour à l'accueil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,

  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    height: 80,
    // borderRadius: 10,
    marginBottom: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  notificationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    backgroundColor: '#490a48ff',
    padding: 15,
    // borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});