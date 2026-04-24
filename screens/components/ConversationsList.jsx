// components/ConversationsList.js
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useConversations } from '../hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ConversationsList = ({ userId, onSelectConversation }) => {
  const { conversations, loading } = useConversations(userId);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const renderConversation = ({ item }) => {
    const lastMessageTime = item.lastMessage?.timestamp?.toDate();
    const timeAgo = lastMessageTime
      ? formatDistanceToNow(lastMessageTime, { addSuffix: true, locale: fr })
      : '';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onSelectConversation(item)}
      >
        <Image
          source={{ uri: item.otherUser?.avatar || 'https://via.placeholder.com/50' }}
          style={styles.avatar}
        />
        
        <View style={styles.conversationContent}>
          <View style={styles.header}>
            <Text style={styles.userName}>{item.otherUser?.name}</Text>
            <Text style={styles.time}>{timeAgo}</Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                item.unreadCount > 0 && styles.unreadMessage
              ]}
              numberOfLines={1}
            >
              {item.lastMessage?.text || 'Aucun message'}
            </Text>
            
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.role}>
            {item.otherUser?.role === 'dietitian' ? '🩺 Diététicien' : '👤 Patient'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={conversations}
      renderItem={renderConversation}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={() => (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune conversation</Text>
        </View>
      )}
    />
  );
};

// components/ChatScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useMessages, useSendMessage } from '../hooks/useChat';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const ChatScreen = ({ conversationId, currentUserId, receiverId }) => {
  const { messages, loading } = useMessages(conversationId, currentUserId);
  const { sendMessage, sending } = useSendMessage();
  
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const flatListRef = useRef(null);

  // Auto-scroll vers le bas
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() && !selectedFile) return;

    const success = await sendMessage(
      conversationId,
      currentUserId,
      messageText,
      receiverId,
      selectedFile
    );

    if (success) {
      setMessageText('');
      setSelectedFile(null);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedFile({
        uri: result.assets[0].uri,
        name: `image_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: result.assets[0].fileSize || 0
      });
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });

    if (result.type === 'success') {
      setSelectedFile({
        uri: result.uri,
        name: result.name,
        type: result.mimeType,
        size: result.size
      });
    }
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Supprimer le message',
      'Voulez-vous vraiment supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await chatService.deleteMessage(messageId, currentUserId, conversationId);
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const messageTime = item.createdAt?.toDate();
    const timeString = messageTime
      ? format(messageTime, 'HH:mm', { locale: fr })
      : '';

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          item.isMine ? styles.myMessage : styles.otherMessage
        ]}
        onLongPress={() => item.isMine && handleDeleteMessage(item.id)}
      >
        <View style={styles.messageBubble}>
          {item.attachments?.length > 0 && (
            <View style={styles.attachmentContainer}>
              {item.attachments.map((attachment, index) => (
                <TouchableOpacity key={index}>
                  {attachment.type.startsWith('image/') ? (
                    <Image
                      source={{ uri: attachment.url }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.attachmentFile}>
                      <Text style={styles.attachmentName}>
                        📎 {attachment.name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {item.text ? (
            <Text style={styles.messageText}>{item.text}</Text>
          ) : null}
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{timeString}</Text>
            {item.isMine && (
              <Text style={styles.readStatus}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {selectedFile && (
        <View style={styles.selectedFileContainer}>
          <Text style={styles.selectedFileName}>📎 {selectedFile.name}</Text>
          <TouchableOpacity onPress={() => setSelectedFile(null)}>
            <Text style={styles.removeFile}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
          <Text style={styles.icon}>🖼️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handlePickDocument} style={styles.iconButton}>
          <Text style={styles.icon}>📎</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Écrivez un message..."
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || (!messageText.trim() && !selectedFile)}
          style={[
            styles.sendButton,
            (sending || (!messageText.trim() && !selectedFile)) && styles.sendButtonDisabled
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  // ConversationsList styles
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#FFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 77,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },

  // ChatScreen styles
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesContainer: {
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    color: '#FFF',
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginRight: 4,
  },
  readStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 5,
  },
  attachmentFile: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  attachmentName: {
    color: '#FFF',
    fontSize: 14,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#E8F4FD',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  selectedFileName: {
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  removeFile: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  iconButton: {
    padding: 8,
  },
  icon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
});