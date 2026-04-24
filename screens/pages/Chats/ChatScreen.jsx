import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../../contexts/AuthContext';
import {
    addReactionToMessage,
    editMessage,
    getOrCreateConversation,
    markAllMessagesAsRead,
    removeReactionFromMessage,
    sendMessage,
    softDeleteMessage,
    subscribeToConversationMessages
} from '../../../services/firebase/chatServices';

const ChatScreen = ({ navigation, route }) => {
  const { dieticienId, dieticienName } = route.params;
  const { user } = useAuth();

  // States
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dieticianInfo, setDieticianInfo] = useState({
    name: dieticienName,
    avatar: null,
  });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const flatListRef = useRef();

  // Initialiser la conversation
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);

        // Créer/récupérer la conversation
        const { conversationId: convId } = await getOrCreateConversation(
          user.uid,
          dieticienId
        );

        setConversationId(convId);

        // Marquer tous comme lus
        await markAllMessagesAsRead(convId, user.uid);

        // S'abonner aux messages
        const unsubscribe = subscribeToConversationMessages(convId, (msgs) => {
          setMessages(msgs);
          // Scroll vers le bas
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        setLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        Alert.alert('Erreur', 'Impossible de charger la conversation');
        setLoading(false);
      }
    };

    const unsubscribe = initializeChat();
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe.then(unsub => unsub && unsub());
      }
    };
  }, [user.uid, dieticienId]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      await sendMessage(conversationId, user.uid, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Erreur d\'envoi:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  // Éditer un message
  const handleEditMessage = async (messageId) => {
    if (!editingText.trim() || !conversationId) return;

    try {
      await editMessage(conversationId, messageId, editingText);
      setEditingMessageId(null);
      setEditingText('');
    } catch (error) {
      console.error('Erreur d\'édition:', error);
      Alert.alert('Erreur', 'Impossible d\'éditer le message');
    }
  };

  // Supprimer un message
  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Supprimer le message',
      'Voulez-vous supprimer ce message?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteMessage(conversationId, messageId, user.uid);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le message');
            }
          },
        },
      ]
    );
  };

  // Ajouter une réaction
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReactionToMessage(conversationId, messageId, emoji, user.uid);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la réaction');
    }
  };

  // Retirer une réaction
  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await removeReactionFromMessage(conversationId, messageId, emoji, user.uid);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de retirer la réaction');
    }
  };

  // Rendu d'un message
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.uid;
    const isDeleted = item.deletedFor?.includes(user.uid);

    if (isDeleted) return null;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage && styles.ownMessageContainer,
        ]}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: dieticianInfo.avatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage && styles.ownMessageBubble,
          ]}
        >
          {editingMessageId === item.messageId ? (
            <View style={styles.editingContainer}>
              <TextInput
                style={styles.editingInput}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                maxLength={500}
              />
              <View style={styles.editingActions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingMessageId(null);
                    setEditingText('');
                  }}
                >
                  <Text style={styles.editingCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditMessage(item.messageId)}>
                  <Text style={styles.editingSave}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                {item.text}
              </Text>
              {item.isEdited && (
                <Text style={styles.editedLabel}>(édité)</Text>
              )}
            </>
          )}

          {/* Réactions */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View style={styles.reactionsContainer}>
              {Object.entries(item.reactions).map(([emoji, users]) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.reactionBadge}
                  onPress={() => {
                    if (users.includes(user.uid)) {
                      handleRemoveReaction(item.messageId, emoji);
                    } else {
                      handleAddReaction(item.messageId, emoji);
                    }
                  }}
                >
                  <Text>{emoji}</Text>
                  <Text style={styles.reactionCount}>{users.length}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Timestamp et statut */}
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isOwnMessage && styles.ownTimestamp]}>
              {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isOwnMessage && (
              <Ionicons
                name={
                  item.status === 'read'
                    ? 'checkmark-done'
                    : item.status === 'delivered'
                    ? 'checkmark'
                    : 'hourglass-outline'
                }
                size={12}
                color="#999"
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>

        {/* Actions sur le message */}
        {editingMessageId !== item.messageId && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert(
                'Options',
                '',
                [
                  ...(isOwnMessage ? [
                    {
                      text: 'Éditer',
                      onPress: () => {
                        setEditingMessageId(item.messageId);
                        setEditingText(item.text);
                      },
                    },
                  ] : []),
                  {
                    text: 'Réactions',
                    onPress: () => {
                      Alert.alert('Ajouter une réaction', '', [
                        { text: '👍', onPress: () => handleAddReaction(item.messageId, '👍') },
                        { text: '❤️', onPress: () => handleAddReaction(item.messageId, '❤️') },
                        { text: '😊', onPress: () => handleAddReaction(item.messageId, '😊') },
                        { text: '🔥', onPress: () => handleAddReaction(item.messageId, '🔥') },
                        { text: 'Annuler', style: 'cancel' },
                      ]);
                    },
                  },
                  {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => handleDeleteMessage(item.messageId),
                  },
                  { text: 'Annuler', style: 'cancel' },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B68EE" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{dieticianInfo.name}</Text>
          <Text style={styles.headerSubtitle}>En ligne</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.messageId}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add" size={28} color="#7B68EE" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Écrivez un message..."
          placeholderTextColor="#999"
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    paddingTop: hp('4%'),
  },
  headerInfo: {
    flex: 1,
    marginLeft: wp('3%'),
  },
  headerTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: wp('3%'),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: hp('0.3%'),
  },
  messagesList: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: hp('1.5%'),
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    marginRight: wp('2%'),
  },
  messageBubble: {
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1%'),
    maxWidth: wp('70%'),
  },
  ownMessageBubble: {
    backgroundColor: '#7B68EE',
  },
  messageText: {
    fontSize: wp('3.5%'),
    color: '#333',
    lineHeight: wp('5%'),
  },
  ownMessageText: {
    color: '#fff',
  },
  editedLabel: {
    fontSize: wp('2.5%'),
    color: '#999',
    fontStyle: 'italic',
    marginTop: hp('0.3%'),
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('0.5%'),
  },
  timestamp: {
    fontSize: wp('2.5%'),
    color: '#999',
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp('0.5%'),
    gap: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: wp('1.5%'),
    paddingVertical: hp('0.3%'),
    alignItems: 'center',
  },
  reactionCount: {
    fontSize: wp('2%'),
    marginLeft: wp('1%'),
    color: '#333',
  },
  moreButton: {
    marginLeft: wp('2%'),
    padding: wp('2%'),
  },
  editingContainer: {
    width: '100%',
  },
  editingInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.8%'),
    minHeight: hp('5%'),
    fontSize: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#ddd',
  },
  editingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp('0.8%'),
    gap: wp('2%'),
  },
  editingCancel: {
    color: '#999',
    fontSize: wp('3%'),
  },
  editingSave: {
    color: '#7B68EE',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  attachButton: {
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    marginHorizontal: wp('2%'),
    fontSize: wp('3.5%'),
    maxHeight: hp('10%'),
    color: '#333',
  },
  sendButton: {
    width: wp('10%'),
    height: wp('10%'),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    borderRadius: wp('5%'),
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default ChatScreen;
