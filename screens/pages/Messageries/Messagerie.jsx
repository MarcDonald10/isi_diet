import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../../contexts/AuthContext';
import { deleteConversation, getUserConversations } from '../../../services/firebase/chatServices';
import Header from '../../components/Header';

const MessagerieScreen = ({ navigation }) => {
  const { user } = useAuth();

  // States
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Charger les conversations quand l'écran est focused
  useFocusEffect(
    React.useCallback(() => {
      loadConversations();
    }, [user])
  );

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await getUserConversations(user?.uid);
      setConversations(convs);
    } catch (error) {
      console.error('Erreur de chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

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
              await loadConversations();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la conversation');
            }
          },
        },
      ]
    );
  };

  const renderConversationItem = ({ item }) => {
    const otherParticipant = item.otherUser;
    const unreadCount = item.unreadCount?.[user?.uid] || 0;
    const lastMessageTime = item.lastMessageTime?.toDate?.() || new Date();
    // console.log("Other participant:", item.otherUser);
    const formatTime = (date) => {
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return 'Hier';
      } else {
        return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
      }
    };

    return (
      <TouchableOpacity
        style={[styles.conversationItem, unreadCount > 0 && styles.unreadConversation]}
        onPress={() => {
          navigation.navigate('ChatScreen', {
            dieticienId: otherParticipant?.id,
            dieticienName: otherParticipant?.name,
          });
        }}
        onLongPress={() => handleDeleteConversation(item.conversationId, otherParticipant?.name)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: otherParticipant?.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
            }}
            style={styles.avatar}
          />
          {otherParticipant?.isOnline && (
            <View style={styles.onlineBadge} />
          )}
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationInfo}>
          <View style={styles.headerRow}>
            <Text
              style={[styles.participantName, unreadCount > 0 && styles.unreadText]}
              numberOfLines={1}
            >
              {otherParticipant?.name + ' ' + otherParticipant?.prenom || 'Utilisateurs'}
            </Text>
            <Text style={styles.timestamp}>{formatTime(lastMessageTime)}</Text>
          </View>

          <Text
            style={[styles.lastMessage, unreadCount > 0 && styles.unreadLastMessage]}
            numberOfLines={1}
          >
            {item.lastMessage || 'Pas de messages'}
          </Text>
        </View>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={wp('15%')} color="#CCC" />
      <Text style={styles.emptyText}>Aucune conversation</Text>
      <Text style={styles.emptySubtext}>
        Commencez une conversation avec un diététicien
      </Text>
    </View>
  );

  // if (loading && !refreshing) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator size="large" color="#7B68EE" />
  //     </View>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}

      <Header
        pageName={"Messagerie"}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        notificationCount={3}
      />
      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
        </View>
      ) : (
      <FlatList
        data={conversations}
        keyExtractor={item => item.conversationId}
        renderItem={renderConversationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7B68EE"
          />
        }
        contentContainerStyle={conversations.length === 0 && styles.emptyListContent}
      />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    marginTop: '5%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


  searchButton: {
    padding: wp('2%'),
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  unreadConversation: {
    backgroundColor: '#F9F7FF',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: wp('3%'),
  },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: wp('3%'),
    height: wp('3%'),
    borderRadius: wp('1.5%'),
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.5%'),
  },
  participantName: {
    fontSize: wp('4%'),
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#7B68EE',
  },
  timestamp: {
    fontSize: wp('3%'),
    color: '#999',
    marginLeft: wp('2%'),
  },
  lastMessage: {
    fontSize: wp('3.2%'),
    color: '#999',
  },
  unreadLastMessage: {
    color: '#333',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#7B68EE',
    borderRadius: wp('3%'),
    width: wp('6%'),
    height: wp('6%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: wp('2.5%'),
    fontWeight: 'bold',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#999',
    marginTop: hp('2%'),
  },
  emptySubtext: {
    fontSize: wp('3.5%'),
    color: '#CCC',
    marginTop: hp('1%'),
  },
});

export default MessagerieScreen;