import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Images de test via liens internet
const testImages = {
  'Dr. Marie': { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
  'Dr. Pierre': { uri: 'https://randomuser.me/api/portraits/men/46.jpg' },
};

const Messagerie = ({ navigation }) => {
  const [conversations, setConversations] = useState([
    { id: '1', dieticien: 'Dr. Marie', lastMessage: 'Votre plan est prêt !', unread: 2 },
    { id: '2', dieticien: 'Dr. Pierre', lastMessage: 'Rendez-vous demain ?', unread: 0 },
  ]);
  const [message, setMessage] = useState('');

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('ChatDetail', { dieticien: item.dieticien })}
    >
      <Image
        source={testImages[item.dieticien] || { uri: 'https://randomuser.me/api/portraits/lego/1.jpg' }}
        style={styles.dieticianPhoto}
      />
      <View style={styles.conversationInfo}>
        <Text style={styles.dieticianName}>{item.dieticien}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage}</Text>
      </View>
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messagerie</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RendezVous')}>
          <Ionicons name="calendar-outline" size={26} color="#815F9C" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        style={styles.conversationList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor="#7D5F9B"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F0F5' }, // magnolia
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EAE3EC', // magnolia-2
    elevation: 2,
    shadowColor: '#815F9C',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#815F9C', letterSpacing: 0.2 },
  conversationList: { flex: 1 },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC', // magnolia-2
    alignItems: 'center',
  },
  dieticianPhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#EAE3EC',
    backgroundColor: '#F6F0F5',
  },
  conversationInfo: { flex: 1 },
  dieticianName: { fontSize: 16, fontWeight: 'bold', color: '#1E223D' }, // space-cadet
  lastMessage: { fontSize: 14, color: '#7D5F9B', marginTop: 2 }, // pomp-and-power-2
  unreadBadge: {
    backgroundColor: '#E53935',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#EAE3EC', // magnolia-2
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F6F0F5', // magnolia
    borderRadius: 20,
    marginRight: 10,
    color: '#1E223D',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#EAE3EC',
  },
  sendButton: {
    backgroundColor: '#815F9C', // pomp-and-power
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Messagerie;