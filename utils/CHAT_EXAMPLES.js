/**
 * EXEMPLES D'UTILISATION - SYSTÈME DE CHAT COMPLET
 * ====================================================
 * 
 * Ce fichier contient des exemples prêts à l'emploi pour utiliser
 * le système de chat dans votre application isi_diet
 */

// ========== EXEMPLE 1: Naviger vers la messagerie ==========
// Depuis n'importe quel écran
export const navigateToMessaging = (navigation) => {
  navigation.navigate('Messagerie');
};

// ========== EXEMPLE 2: Ouvrir une conversation spécifique ==========
export const openChatWithDieticien = (navigation, dieticienId, dieticienName) => {
  navigation.navigate('ChatScreen', {
    dieticienId,
    dieticienName
  });
};

// ========== EXEMPLE 3: Intégration dans un bouton de profil ==========
// Dans ProfilDieteticien.jsx
/*
import { openChatWithDieticien } from '../../../utils/chatExamples';

const ProfilDieteticien = ({ navigation, route }) => {
  const { dieticien } = route.params;

  return (
    <View>
      {/* ... autres éléments ... */}
      
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => openChatWithDieticien(navigation, dieticien.id, dieticien.name)}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>Envoyer un message</Text>
      </TouchableOpacity>
    </View>
  );
};
*/

// ========== EXEMPLE 4: Intégration dans un bouton de la barre d'onglets ==========
// Dans MenuHorizontal.jsx ou tout élément de navigation inférieure
/*
<TouchableOpacity
  onPress={() => navigation.navigate('Messagerie')}
  style={styles.tabItem}
>
  <Ionicons name="chatbubbles" size={24} color={focused ? '#7B68EE' : '#999'} />
  <Text style={[styles.tabLabel, { color: focused ? '#7B68EE' : '#999' }]}>
    Messages
  </Text>
</TouchableOpacity>
*/

// ========== EXEMPLE 5: Depuis la liste des diététiciens ==========
// Dans ListeDieteticiens.jsx
/*
const ListeDieteticiens = ({ navigation }) => {
  const handleContactDieticien = (dieticien) => {
    navigation.navigate('ChatScreen', {
      dieticienId: dieticien.id,
      dieticienName: dieticien.name,
      dieticienAvatar: dieticien.avatar // optionnel
    });
  };

  return (
    <FlatList
      data={dieticiens}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.dieticianCard}
          onPress={() => handleContactDieticien(item)}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialty}>{item.specialty}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#7B68EE" />
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.id}
    />
  );
};
*/

// ========== EXEMPLE 6: Notification de nouveaux messages ==========
// Dans un hook personnalisé
/*
import { useEffect } from 'react';
import { subscribeToUserConversations } from '../services/firebase/chatServices';
import { useAuth } from '../contexts/AuthContext';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = React.useState(0);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToUserConversations(user.uid, (conversations) => {
      const totalUnread = Object.values(conversations).reduce((sum, conv) => {
        return sum + (conv.unreadCount?.[user.uid] || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe?.();
  }, [user]);

  return unreadCount;
};

// Utilisation dans MenuHorizontal.jsx
const MenuHorizontal = ({ navigation }) => {
  const unreadCount = useUnreadMessages();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Messagerie')}
      style={styles.tabItem}
    >
      <Ionicons name="chatbubbles" size={24} color="#7B68EE" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
*/

// ========== EXEMPLE 7: Message rapide depuis un diététicien vers un patient ==========
// Dans un composant admin/diététicien
/*
import { sendMessage, getOrCreateConversation } from '../services/firebase/chatServices';
import { useAuth } from '../contexts/AuthContext';

const QuickMessageButton = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const [sending, setSending] = React.useState(false);
  const [messageText, setMessageText] = React.useState('');

  const handleQuickMessage = async () => {
    try {
      setSending(true);
      const { conversationId } = await getOrCreateConversation(user.uid, patientId);
      await sendMessage(conversationId, user.uid, messageText);
      setMessageText('');
      Alert.alert('Succès', 'Message envoyé à ' + patientName);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Votre message..."
        value={messageText}
        onChangeText={setMessageText}
      />
      <TouchableOpacity onPress={handleQuickMessage} disabled={sending}>
        <Text>{sending ? 'Envoi...' : 'Envoyer'}</Text>
      </TouchableOpacity>
    </View>
  );
};
*/

// ========== EXEMPLE 8: Supprimer une conversation ==========
// Utilisation dans Messagerie.jsx (déjà implémentée)
/*
const handleDeleteConversation = (conversationId, participantName) => {
  Alert.alert(
    'Supprimer la conversation',
    `Êtes-vous sûr de vouloir supprimer la conversation avec ${participantName}?`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(conversationId);
            // Actualiser la liste
            loadConversations();
          } catch (error) {
            Alert.alert('Erreur', 'Impossible de supprimer la conversation');
          }
        },
      },
    ]
  );
};
*/

// ========== EXEMPLE 9: Recherche dans les messages ==========
// Dans ChatScreen.jsx (optionnel)
/*
import { searchMessages } from '../services/firebase/chatServices';

const [searchQuery, setSearchQuery] = React.useState('');
const [searchResults, setSearchResults] = React.useState([]);

const handleSearch = async (query) => {
  setSearchQuery(query);
  if (query.length < 2) {
    setSearchResults([]);
    return;
  }

  try {
    const results = await searchMessages(conversationId, query);
    setSearchResults(results);
  } catch (error) {
    console.error('Erreur de recherche:', error);
  }
};
*/

// ========== EXEMPLE 10: Statistiques de conversation ==========
// Afficher des statistiques sur une conversation
/*
import { getConversationStats } from '../services/firebase/chatServices';

const showConversationStats = async (conversationId) => {
  try {
    const stats = await getConversationStats(conversationId);
    console.log('Statistiques:', {
      totalMessages: stats.totalMessages,
      messagesPerParticipant: stats.messagesPerParticipant,
      averageResponseTime: stats.averageResponseTime
    });
  } catch (error) {
    console.error('Erreur:', error);
  }
};
*/

// ========== EXEMPLE 11: Configuration des réactions emoji ==========
// Émojis disponibles pour les réactions
export const AVAILABLE_REACTIONS = ['👍', '❤️', '😊', '🔥', '😲', '😢'];

// ========== EXEMPLE 12: Formatage des dates/heures ==========
export const formatMessageTime = (timestamp) => {
  const date = timestamp.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
};

// ========== EXEMPLE 13: Gestion des états de message ==========
export const MESSAGE_STATES = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  ERROR: 'error'
};

// Afficher une icône selon l'état
export const getMessageStateIcon = (state) => {
  switch (state) {
    case MESSAGE_STATES.SENDING:
      return 'hourglass-outline';
    case MESSAGE_STATES.SENT:
      return 'checkmark';
    case MESSAGE_STATES.DELIVERED:
      return 'checkmark-done';
    case MESSAGE_STATES.READ:
      return 'checkmark-done'; // Avec couleur différente
    case MESSAGE_STATES.ERROR:
      return 'alert-circle';
    default:
      return 'help-outline';
  }
};

// ========== EXEMPLE 14: Hook pour gérer le chat ==========
/*
import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToConversationMessages,
  sendMessage,
  markAllMessagesAsRead,
} from '../services/firebase/chatServices';

export const useChat = (conversationId, userId) => {
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    
    // S'abonner aux messages
    unsubscribeRef.current = subscribeToConversationMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    // Marquer comme lus
    markAllMessagesAsRead(conversationId, userId);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [conversationId, userId]);

  const sendMsg = useCallback(
    async (text) => {
      try {
        await sendMessage(conversationId, userId, text);
      } catch (error) {
        console.error('Erreur d\'envoi:', error);
        throw error;
      }
    },
    [conversationId, userId]
  );

  return {
    messages,
    loading,
    sendMessage: sendMsg,
  };
};

// Utilisation
const { messages, loading, sendMessage } = useChat(conversationId, userId);
*/

// ========== EXEMPLE 15: Intégration avec le hub de notifications ==========
/*
import messaging from '@react-native-firebase/messaging';

export const setupChatNotifications = async (userId) => {
  // Écouter les messages Firebase
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    if (remoteMessage.data.type === 'chat_message') {
      // Afficher une notification
      // Mettre à jour le badge des messages non lus
      // etc...
    }
  });

  return unsubscribe;
};
*/

export default {};
