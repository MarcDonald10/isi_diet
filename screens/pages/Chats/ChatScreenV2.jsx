import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
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
    sendMessageWithAttachment,
    softDeleteMessage,
    subscribeToConversationMessages,
} from '../../../services/firebase/chatServices';

// Composante Modal Personnalisée
const CustomModal = ({ visible, title, message, type = 'info', buttons, onClose }) => {
  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isOptions = type === 'options';

  const iconName = isSuccess ? 'checkmark-circle' : isError ? 'close-circle' : isWarning ? 'warning' : 'information-circle';
  const iconColor = isSuccess ? '#4CAF50' : isError ? '#F44336' : isWarning ? '#FF9800' : '#2196F3';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Icon */}
          {!isOptions && (
            <View style={styles.modalIconContainer}>
              <Ionicons name={iconName} size={48} color={iconColor} />
            </View>
          )}

          {/* Title */}
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.modalMessage}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            {buttons ? (
              buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalButton,
                    btn.style === 'destructive' && styles.modalButtonDestructive,
                    btn.style === 'cancel' && styles.modalButtonCancel,
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      btn.style === 'destructive' && styles.modalButtonTextDestructive,
                      btn.style === 'cancel' && styles.modalButtonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ChatScreenV2 = ({ navigation, route }) => {
  const { dieticienId, dieticienName, dieticianAvatar } = route.params;
  const { user } = useAuth();

  // States
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState(null);
  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '', buttons: null });

  const flatListRef = useRef();

  const EMOJI_REACTIONS = ['👍', '❤️', '😊', '🔥', '😲', '😢', '🎉', '👏'];

  // Initialiser la conversation
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        const { conversationId: convId } = await getOrCreateConversation(user.uid, dieticienId);
        setConversationId(convId);
        await markAllMessagesAsRead(convId, user.uid);

        const unsubscribe = subscribeToConversationMessages(convId, (msgs) => {
          setMessages(msgs);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });

        setLoading(false);
        return unsubscribe;
      } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        setModal({
          visible: true,
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger la conversation',
          buttons: null,
        });
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

  // Envoyer un message texte
  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      await sendMessage(conversationId, user.uid, messageText);
      setMessageText('');
    } catch (error) {
      console.error('Erreur d\'envoi:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'envoyer le message',
        buttons: null,
      });
    } finally {
      setSending(false);
    }
  };

  // Envoyer une image
  const handleSendImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingFile(true);
        const file = {
          uri: result.assets[0].uri,
          type: 'image',
          name: `image_${Date.now()}.jpg`,
          size: result.assets[0].fileSize || 0,
        };
        try {
          await sendMessageWithAttachment(conversationId, user.uid, file, 'Photo');
          setModal({
            visible: true,
            type: 'success',
            title: 'Succès',
            message: 'Photo envoyée',
            buttons: null,
          });
        } catch (error) {
          console.error('Erreur envoi image:', error);
          setModal({
            visible: true,
            type: 'error',
            title: 'Erreur',
            message: 'Impossible d\'envoyer l\'image: ' + error.message,
            buttons: null,
          });
        }
      }
    } catch (error) {
      console.error('Erreur ImagePicker:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'accéder à la galerie',
        buttons: null,
      });
    } finally {
      setUploadingFile(false);
    }
  };

  // Envoyer un fichier
  const handleSendFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', '*/*'],
      });

      if (result.type === 'success' && result.uri) {
        setUploadingFile(true);
        
        // Déterminer le type MIME du fichier
        const fileName = result.name || `file_${Date.now()}`;
        let mimeType = 'application/octet-stream';
        
        if (fileName.endsWith('.pdf')) {
          mimeType = 'application/pdf';
        } else if (fileName.endsWith('.doc')) {
          mimeType = 'application/msword';
        } else if (fileName.endsWith('.docx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (fileName.endsWith('.xls')) {
          mimeType = 'application/vnd.ms-excel';
        } else if (fileName.endsWith('.xlsx')) {
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (fileName.endsWith('.txt')) {
          mimeType = 'text/plain';
        }
        
        const file = {
          uri: result.uri,
          type: mimeType,
          name: fileName,
          size: result.size || 0,
        };
        
        try {
          console.log('Envoi fichier:', { name: file.name, type: file.type, size: file.size });
          await sendMessageWithAttachment(conversationId, user.uid, file, `📎 ${result.name}`);
          setModal({
            visible: true,
            type: 'success',
            title: 'Succès',
            message: 'Fichier envoyé',
            buttons: null,
          });
        } catch (error) {
          console.error('Erreur envoi fichier:', error);
          setModal({
            visible: true,
            type: 'error',
            title: 'Erreur',
            message: 'Impossible d\'envoyer le fichier: ' + error.message,
            buttons: null,
          });
        }
      }
    } catch (error) {
      console.error('Erreur DocumentPicker:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'accéder aux fichiers',
        buttons: null,
      });
    } finally {
      setUploadingFile(false);
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
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'éditer le message',
        buttons: null,
      });
    }
  };

  // Supprimer un message
  const handleDeleteMessage = (messageId) => {
    setModal({
      visible: true,
      type: 'warning',
      title: 'Supprimer le message',
      message: 'Êtes-vous sûr de vouloir supprimer ce message?',
      buttons: [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteMessage(conversationId, messageId, user.uid);
            } catch (error) {
              setModal({
                visible: true,
                type: 'error',
                title: 'Erreur',
                message: 'Impossible de supprimer le message',
                buttons: null,
              });
            }
          },
        },
      ],
    });
  };

  // Ajouter une réaction
  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReactionToMessage(conversationId, messageId, emoji, user.uid);
      setShowEmojiMenu(false);
      setSelectedMessageForReaction(null);
    } catch (error) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'ajouter la réaction',
        buttons: null,
      });
    }
  };

  // Retirer une réaction
  const handleRemoveReaction = async (messageId, emoji) => {
    try {
      await removeReactionFromMessage(conversationId, messageId, emoji, user.uid);
    } catch (error) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de retirer la réaction',
        buttons: null,
      });
    }
  };

  // Rendu d'une pièce jointe
  const renderAttachment = (attachment) => {
    if (attachment.type === 'image') {
      return (
        <Image
          source={{ uri: attachment.uri }}
          style={styles.attachmentImage}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={styles.fileAttachment}>
        <Ionicons name="document" size={32} color="#7B68EE" />
        <Text style={styles.fileName}>{attachment.name}</Text>
      </View>
    );
  };

  // Rendu d'un message
  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === user.uid;
    const isDeleted = item.deletedFor?.includes(user.uid);

    if (isDeleted) return null;

    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Image
            source={{ uri: dieticianAvatar || 'https://via.placeholder.com/40' }}
            style={styles.avatar}
          />
        )}

        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {editingMessageId === item.messageId ? (
            <View style={styles.editingContainer}>
              <TextInput
                style={styles.editingInput}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                maxLength={500}
                placeholderTextColor="#999"
              />
              <View style={styles.editingActions}>
                <TouchableOpacity onPress={() => { setEditingMessageId(null); setEditingText(''); }}>
                  <Text style={styles.editingCancel}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleEditMessage(item.messageId)}>
                  <Text style={styles.editingSave}>Enregistrer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {item.attachments && item.attachments.length > 0 && (
                <View style={styles.attachmentsContainer}>
                  {item.attachments.map((att, idx) => (
                    <View key={idx}>{renderAttachment(att)}</View>
                  ))}
                </View>
              )}

              {item.text && (
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
                      <Text style={styles.emojiText}>{emoji}</Text>
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
                    color={item.status === 'read' ? '#7B68EE' : '#999'}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </>
          )}
        </View>

        {/* Actions sur le message */}
        {editingMessageId !== item.messageId && !isDeleted && (
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              const buttons = [];
              if (isOwnMessage) {
                buttons.push({
                  text: 'Éditer',
                  onPress: () => {
                    setEditingMessageId(item.messageId);
                    setEditingText(item.text || '');
                  },
                });
              }
              buttons.push({
                text: 'Réagir 👍',
                onPress: () => {
                  setSelectedMessageForReaction(item.messageId);
                  setShowEmojiMenu(true);
                },
              });
              if (isOwnMessage) {
                buttons.push({
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => handleDeleteMessage(item.messageId),
                });
              }
              setModal({
                visible: true,
                type: 'options',
                title: 'Options du message',
                message: '',
                buttons,
              });
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{dieticienName}</Text>
          <Text style={styles.headerSubtitle}>En ligne</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
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

      {/* Emoji Reaction Menu */}
      <Modal visible={showEmojiMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.emojiOverlay}
          onPress={() => setShowEmojiMenu(false)}
        >
          <View style={styles.emojiMenu}>
            <TouchableOpacity style={styles.emojiCloseBtn} onPress={() => setShowEmojiMenu(false)}>
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.emojiGrid}>
              {EMOJI_REACTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    handleAddReaction(selectedMessageForReaction, emoji);
                    setShowEmojiMenu(false);
                  }}
                >
                  <Text style={styles.emojiOption}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => {
              setModal({
                visible: true,
                type: 'options',
                title: '📎 Ajouter un fichier',
                message: '',
                buttons: [
                  {
                    text: '📷 Photo',
                    onPress: handleSendImage,
                  },
                  {
                    text: '📄 Fichier',
                    onPress: handleSendFile,
                  },
                  {
                    text: 'Annuler',
                    style: 'cancel',
                  },
                ],
              });
            }}
            disabled={uploadingFile || sending}
          >
            {uploadingFile ? (
              <ActivityIndicator color="#7B68EE" size="small" />
            ) : (
              <Ionicons name="add-circle-outline" size={28} color="#7B68EE" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Écrivez un message..."
            placeholderTextColor="#999"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={!sending && !uploadingFile}
          />

          <TouchableOpacity
            style={[styles.sendButton, (sending || !messageText.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sending || !messageText.trim()}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Modal */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        buttons={modal.buttons}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7B68EE',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
    paddingTop: hp('3%'),
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
  headerActions: {
    flexDirection: 'row',
    gap: wp('2%'),
  },
  headerButton: {
    padding: wp('2%'),
  },
  messagesList: {
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
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
    borderRadius: 16,
    paddingHorizontal: wp('3.5%'),
    paddingVertical: hp('1.2%'),
    maxWidth: wp('70%'),
  },
  ownMessageBubble: {
    backgroundColor: '#7B68EE',
  },
  messageText: {
    fontSize: wp('3.8%'),
    color: '#333',
    lineHeight: wp('5.5%'),
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
    marginTop: hp('0.8%'),
    gap: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 14,
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.4%'),
    alignItems: 'center',
    gap: wp('0.5%'),
  },
  emojiText: {
    fontSize: wp('3.2%'),
  },
  reactionCount: {
    fontSize: wp('2%'),
    color: '#333',
    fontWeight: 'bold',
  },
  moreButton: {
    marginLeft: wp('2%'),
    padding: wp('2%'),
  },
  editingContainer: {
    width: '100%',
    gap: hp('0.8%'),
  },
  editingInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('1%'),
    minHeight: hp('5%'),
    fontSize: wp('3.5%'),
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
  },
  editingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: wp('3%'),
  },
  editingCancel: {
    color: '#999',
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  editingSave: {
    color: '#7B68EE',
    fontSize: wp('3%'),
    fontWeight: 'bold',
  },
  attachmentsContainer: {
    marginBottom: hp('1%'),
    gap: hp('0.5%'),
  },
  attachmentImage: {
    width: wp('50%'),
    height: hp('20%'),
    borderRadius: 12,
  },
  fileAttachment: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: wp('3%'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp('2%'),
  },
  fileName: {
    fontSize: wp('3%'),
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('1.5%'),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: wp('2%'),
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
    borderRadius: 24,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    fontSize: wp('3.5%'),
    maxHeight: hp('10%'),
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
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
    opacity: 0.5,
  },
  emojiOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: wp('4%'),
    width: wp('85%'),
    position: 'relative',
  },
  emojiCloseBtn: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    zIndex: 10,
    padding: wp('1%'),
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp('2%'),
    justifyContent: 'center',
    marginTop: hp('1%'),
  },
  emojiOption: {
    fontSize: wp('8%'),
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: wp('6%'),
    width: wp('85%'),
    alignItems: 'center',
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: wp('3%'),
    right: wp('3%'),
    zIndex: 10,
    padding: wp('1%'),
  },
  modalIconContainer: {
    marginVertical: hp('2%'),
  },
  modalTitle: {
    fontSize: wp('4.5%'),
    fontWeight: 'bold',
    color: '#333',
    marginTop: hp('1%'),
    marginBottom: hp('0.5%'),
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: wp('3.8%'),
    color: '#666',
    textAlign: 'center',
    marginBottom: hp('2%'),
    lineHeight: wp('5.5%'),
  },
  modalButtonsContainer: {
    width: '100%',
    gap: hp('1%'),
    marginTop: hp('1%'),
  },
  modalButton: {
    backgroundColor: '#7B68EE',
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonDestructive: {
    backgroundColor: '#F44336',
  },
  modalButtonCancel: {
    backgroundColor: '#E8E8E8',
  },
  modalButtonText: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextDestructive: {
    color: '#fff',
  },
  modalButtonTextCancel: {
    color: '#333',
  },
});

export default ChatScreenV2;
