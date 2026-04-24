import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const Chat = ({ route, navigation }) => {
  const { dieticienId, dieticienName } = route.params;
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Bonjour, comment puis-je vous aider avec votre plan alimentaire ?',
      sender: 'dieteticien',
      timestamp: '2025-08-10 10:30',
      date: '2025-08-10',
    },
    {
      id: '2',
      text: 'Bonjour ! J’aimerais des conseils pour gérer mon diabète.',
      sender: 'user',
      timestamp: '2025-08-10 10:32',
      date: '2025-08-10',
    },
    {
      id: '3',
      text: 'Je vous recommande d’augmenter votre consommation de légumes verts.',
      sender: 'dieteticien',
      timestamp: '2025-08-11 10:35',
      date: '2025-08-11',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef(null);

  // Simuler l'envoi d'un message
  const sendMessage = () => {
    if (newMessage.trim()) {
      const today = new Date().toISOString().split('T')[0];
      setMessages([
        ...messages,
        {
          id: `${messages.length + 1}`,
          text: newMessage,
          sender: 'user',
          timestamp: today + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: today,
        },
      ]);
      setNewMessage('');
      // Simuler une réponse automatique
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${prev.length + 1}`,
            text: 'Merci pour votre message ! Je vais examiner votre demande.',
            sender: 'dieteticien',
            timestamp: today + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: today,
          },
        ]);
      }, 1000);
    }
  };

  // Faire défiler vers le dernier message
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Grouper les messages par date
  const groupedMessages = messages.reduce((acc, message) => {
    const date = message.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {});

  const messageDates = Object.keys(groupedMessages).sort();

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === 'user' ? styles.userMessage : styles.dieteticienMessage,
      ]}
    >
      <Text style={[styles.messageText, item.sender === 'user' && styles.userMessageText]}>
        {item.text}
      </Text>
      <Text style={styles.messageTimestamp}>{item.timestamp.split(' ')[1]}</Text>
    </View>
  );

  const renderItem = ({ item: date }) => (
    <View>
      <View style={styles.dateSeparator}>
        <Text style={styles.dateText}>{date === new Date().toISOString().split('T')[0] ? 'Aujourd’hui' : date}</Text>
      </View>
      {groupedMessages[date].map((message) => (
        <View key={message.id}>{renderMessage({ item: message })}</View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? hp('12%') : hp('8%')}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600' }}
          style={styles.dieteticienPhoto}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{dieticienName}</Text>
          <Text style={styles.headerStatus}>En ligne</Text>
        </View>
      </View>

      {/* Liste des messages */}
      <FlatList
        ref={flatListRef}
        data={messageDates}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          value={newMessage}
          onChangeText={setNewMessage}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          multiline
          maxLength={500}
          accessibilityLabel="Écrire un message au diététicien"
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          accessibilityLabel="Envoyer le message"
        >
          <Ionicons name="send" size={wp('6%')} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC', // Fond violet clair
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A2F7D', // Violet profond
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    paddingTop: hp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dieteticienPhoto: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginHorizontal: wp('4%'),
    borderWidth: 2,
    borderColor: '#F4C430', // Bordure dorée
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#fff',
  },
  headerStatus: {
    fontSize: wp('3.5%'),
    color: '#F4C430', // Doré
    marginTop: hp('0.5%'),
  },
  messageList: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  messageListContent: {
    paddingVertical: hp('3%'),
    paddingBottom: hp('2%'),
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: hp('2%'),
  },
  dateText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#666',
    backgroundColor: '#E6E4F0',
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 12,
  },
  messageContainer: {
    maxWidth: wp('80%'),
    padding: wp('4%'),
    borderRadius: 20,
    marginBottom: hp('2%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  userMessage: {
    backgroundColor: '#4A2F7D', // Violet
    alignSelf: 'flex-end',
    borderTopRightRadius: 5,
  },
  dieteticienMessage: {
    backgroundColor: '#fff', // Blanc
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
  },
  messageText: {
    fontSize: wp('4%'),
    color: '#333',
    fontWeight: '500',
  },
  userMessageText: {
    color: '#fff', // Texte blanc pour lisibilité
  },
  messageTimestamp: {
    fontSize: wp('3%'),
    color: '#999',
    marginTop: hp('0.5%'),
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: wp('4%'),
    margin: wp('5%'),
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6E4F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputContainerFocused: {
    borderColor: '#4A2F7D', // Bordure violette au focus
  },
  input: {
    flex: 1,
    paddingVertical: hp('1.5%'),
    fontSize: wp('4%'),
    color: '#333',
    marginRight: wp('3%'),
    maxHeight: hp('15%'), // Hauteur max pour multiligne
  },
  sendButton: {
    backgroundColor: '#F4C430', // Doré
    padding: wp('3.5%'),
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#F4C43080', // Opacité réduite si désactivé
  },
});

export default Chat;