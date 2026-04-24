import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ClassesMessagingScreen({ navigation }) {
  
  const classes = [
    { id: '1', title: 'Nutrition et diabète', dietitian: 'Dr. Dupont', format: 'Vidéo' },
    { id: '2', title: 'Alimentation équilibrée', dietitian: 'Dr. Martin', format: 'Webinaire' },
  ];

  const messages = [
    { id: '1', dietitian: 'Dr. Dupont', lastMessage: 'Rendez-vous confirmé' },
    { id: '2', dietitian: 'Dr. Martin', lastMessage: 'Conseils envoyés' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="school-outline" size={40} color="#4CAF50" />
        <Text style={styles.title}>Master Classes & Messagerie</Text>
      </View>

      {/* Master Classes */}
      <Text style={styles.subtitle}>Master Classes</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.classItem}>
            <Ionicons name={item.format === 'Vidéo' ? 'play-circle-outline' : 'videocam-outline'} size={24} color="#4CAF50" />
            <View>
              <Text style={styles.classText}>{item.title} - {item.dietitian}</Text>
              <Text style={styles.classFormat}>{item.format}</Text>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.paymentButton}>
        <Ionicons name="card-outline" size={24} color="#fff" />
        <Text style={styles.paymentText}>S'abonner aux cours premium</Text>
      </TouchableOpacity>

      {/* Messaging */}
      <Text style={styles.subtitle}>Messagerie</Text>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.messageItem}>
            <Ionicons name="chatbubbles-outline" size={24} color="#4CAF50" />
            <View>
              <Text style={styles.messageText}>{item.dietitian}</Text>
              <Text style={styles.messageContent}>{item.lastMessage}</Text>
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.appointmentButton}>
        <Ionicons name="calendar-outline" size={24} color="#fff" />
        <Text style={styles.appointmentText}>Prendre un rendez-vous</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: '#F6F0F5' }, // magnolia
  header: { alignItems: 'center', marginBottom: 10, paddingTop: 18 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#815F9C', letterSpacing: 0.2 }, // pomp-and-power
  subtitle: { fontSize: 17, fontWeight: 'bold', color: '#7D5F9B', marginVertical: 10, marginLeft: 20 }, // pomp-and-power-2
  classItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 5, marginBottom: 10 },
  classText: { fontSize: 16, color: '#333' },
  classFormat: { fontSize: 14, color: '#555' },
  messageList: { paddingHorizontal: 12, paddingTop: 8 },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#EAE3EC', // magnolia-2
    shadowColor: '#815F9C',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  messageIcon: {
    backgroundColor: '#F6F0F5',
    borderRadius: 20,
    padding: 8,
    marginRight: 12,
  },
  messageText: { fontSize: 16, color: '#1E223D', fontWeight: 'bold' }, // space-cadet
  messageContent: { fontSize: 14, color: '#7D5F9B', marginTop: 2 }, // pomp-and-power-2
  paymentButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  paymentText: { color: '#fff', fontSize: 16, marginLeft: 10 },
  appointmentButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  appointmentText: { color: '#fff', fontSize: 16, marginLeft: 10 },
});