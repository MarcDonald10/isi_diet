// services/chatService.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs,
  getDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase/firebaseConfig';

/**
 * Structure des collections Firestore :
 * 
 * conversations/{conversationId}
 *   - participants: [userId1, userId2]
 *   - participantsData: { userId: { name, avatar, role } }
 *   - lastMessage: { text, senderId, timestamp, isRead }
 *   - unreadCount: { userId: count }
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 * 
 * messages/{messageId}
 *   - conversationId: string
 *   - senderId: string
 *   - text: string
 *   - attachments: [{ name, url, type, size }]
 *   - isRead: boolean
 *   - readBy: [userId]
 *   - createdAt: timestamp
 *   - updatedAt: timestamp
 *   - deletedBy: [userId] // Pour suppression logique
 */

class ChatService {
  
  // ==================== CONVERSATIONS ====================
  
  /**
   * Créer ou récupérer une conversation entre deux utilisateurs
   */
  async getOrCreateConversation(currentUserId, otherUserId, otherUserData) {
    try {
      // Vérifier si une conversation existe déjà
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', currentUserId)
      );
      
      const snapshot = await getDocs(q);
      let existingConv = null;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.participants.includes(otherUserId)) {
          existingConv = { id: doc.id, ...data };
        }
      });
      
      if (existingConv) {
        return existingConv;
      }
      
      // Créer une nouvelle conversation
      const newConvRef = await addDoc(conversationsRef, {
        participants: [currentUserId, otherUserId],
        participantsData: {
          [currentUserId]: otherUserData.currentUser,
          [otherUserId]: otherUserData.otherUser
        },
        lastMessage: null,
        unreadCount: {
          [currentUserId]: 0,
          [otherUserId]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const newConv = await getDoc(newConvRef);
      return { id: newConv.id, ...newConv.data() };
      
    } catch (error) {
      console.error('Erreur getOrCreateConversation:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer toutes les conversations d'un utilisateur (temps réel)
   */
  subscribeToConversations(userId, callback) {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const conversations = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Calculer les informations de l'autre participant
        const otherUserId = data.participants.find(id => id !== userId);
        const otherUserData = data.participantsData[otherUserId];
        
        conversations.push({
          id: doc.id,
          ...data,
          otherUser: otherUserData,
          unreadCount: data.unreadCount?.[userId] || 0
        });
      });
      callback(conversations);
    }, (error) => {
      console.error('Erreur subscribeToConversations:', error);
      callback([]);
    });
  }
  
  /**
   * Supprimer une conversation
   */
  async deleteConversation(conversationId) {
    try {
      const batch = writeBatch(db);
      
      // Supprimer tous les messages de la conversation
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('conversationId', '==', conversationId));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Supprimer la conversation
      const convRef = doc(db, 'conversations', conversationId);
      batch.delete(convRef);
      
      await batch.commit();
      
    } catch (error) {
      console.error('Erreur deleteConversation:', error);
      throw error;
    }
  }
  
  // ==================== MESSAGES ====================
  
  /**
   * Envoyer un message texte
   */
  async sendMessage(conversationId, senderId, text, receiverId) {
    try {
      const messagesRef = collection(db, 'messages');
      const batch = writeBatch(db);
      
      // Ajouter le message
      const newMessageRef = doc(messagesRef);
      batch.set(newMessageRef, {
        conversationId,
        senderId,
        text,
        attachments: [],
        isRead: false,
        readBy: [senderId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedBy: []
      });
      
      // Mettre à jour la conversation
      const convRef = doc(db, 'conversations', conversationId);
      batch.update(convRef, {
        lastMessage: {
          text,
          senderId,
          timestamp: serverTimestamp(),
          isRead: false
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      return { id: newMessageRef.id };
      
    } catch (error) {
      console.error('Erreur sendMessage:', error);
      throw error;
    }
  }
  
  /**
   * Envoyer un message avec pièce jointe
   */
  async sendMessageWithAttachment(conversationId, senderId, text, file, receiverId) {
    try {
      // 1. Upload le fichier
      const attachmentData = await this.uploadAttachment(conversationId, file);
      
      // 2. Créer le message
      const messagesRef = collection(db, 'messages');
      const batch = writeBatch(db);
      
      const newMessageRef = doc(messagesRef);
      batch.set(newMessageRef, {
        conversationId,
        senderId,
        text: text || '',
        attachments: [attachmentData],
        isRead: false,
        readBy: [senderId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedBy: []
      });
      
      // 3. Mettre à jour la conversation
      const convRef = doc(db, 'conversations', conversationId);
      const lastMessageText = text || `📎 ${attachmentData.name}`;
      
      batch.update(convRef, {
        lastMessage: {
          text: lastMessageText,
          senderId,
          timestamp: serverTimestamp(),
          isRead: false
        },
        [`unreadCount.${receiverId}`]: increment(1),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      return { id: newMessageRef.id };
      
    } catch (error) {
      console.error('Erreur sendMessageWithAttachment:', error);
      throw error;
    }
  }
  
  /**
   * Upload une pièce jointe
   */
  async uploadAttachment(conversationId, file) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `conversations/${conversationId}/attachments/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Convertir le fichier en blob si nécessaire (pour React Native)
      const blob = await fetch(file.uri).then(r => r.blob());
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        name: file.name,
        url: downloadURL,
        type: file.type || file.mimeType,
        size: file.size,
        storagePath
      };
      
    } catch (error) {
      console.error('Erreur uploadAttachment:', error);
      throw error;
    }
  }
  
  /**
   * Récupérer les messages d'une conversation (temps réel)
   */
  subscribeToMessages(conversationId, userId, callback) {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filtrer les messages supprimés par cet utilisateur
        if (!data.deletedBy?.includes(userId)) {
          messages.push({
            id: doc.id,
            ...data,
            isMine: data.senderId === userId
          });
        }
      });
      callback(messages);
    }, (error) => {
      console.error('Erreur subscribeToMessages:', error);
      callback([]);
    });
  }
  
  /**
   * Marquer un message comme lu
   */
  async markMessageAsRead(messageId, conversationId, userId) {
    try {
      const batch = writeBatch(db);
      
      // Mettre à jour le message
      const messageRef = doc(db, 'messages', messageId);
      batch.update(messageRef, {
        isRead: true,
        readBy: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      // Réinitialiser le compteur non lu
      const convRef = doc(db, 'conversations', conversationId);
      batch.update(convRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Erreur markMessageAsRead:', error);
      throw error;
    }
  }
  
  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  async markAllMessagesAsRead(conversationId, userId) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('isRead', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.senderId !== userId) {
          batch.update(doc.ref, {
            isRead: true,
            readBy: arrayUnion(userId),
            updatedAt: serverTimestamp()
          });
        }
      });
      
      // Réinitialiser le compteur
      const convRef = doc(db, 'conversations', conversationId);
      batch.update(convRef, {
        [`unreadCount.${userId}`]: 0
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Erreur markAllMessagesAsRead:', error);
      throw error;
    }
  }
  
  /**
   * Supprimer un message (suppression logique)
   */
  async deleteMessage(messageId, userId, conversationId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message introuvable');
      }
      
      const messageData = messageDoc.data();
      
      // Ajouter l'utilisateur à deletedBy
      await updateDoc(messageRef, {
        deletedBy: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      // Si tous les participants ont supprimé, supprimer définitivement
      const convDoc = await getDoc(doc(db, 'conversations', conversationId));
      const participants = convDoc.data().participants;
      
      const updatedDeletedBy = [...(messageData.deletedBy || []), userId];
      
      if (participants.every(p => updatedDeletedBy.includes(p))) {
        // Supprimer les pièces jointes du storage
        if (messageData.attachments?.length > 0) {
          for (const attachment of messageData.attachments) {
            if (attachment.storagePath) {
              const storageRef = ref(storage, attachment.storagePath);
              await deleteObject(storageRef).catch(() => {});
            }
          }
        }
        
        // Supprimer le message
        await deleteDoc(messageRef);
      }
      
    } catch (error) {
      console.error('Erreur deleteMessage:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir le nombre total de messages non lus pour un utilisateur
   */
  async getTotalUnreadCount(userId) {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );
      
      const snapshot = await getDocs(q);
      let totalUnread = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        totalUnread += data.unreadCount?.[userId] || 0;
      });
      
      return totalUnread;
      
    } catch (error) {
      console.error('Erreur getTotalUnreadCount:', error);
      return 0;
    }
  }
  
  /**
   * Rechercher dans les messages
   */
  async searchMessages(conversationId, searchText, userId) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId)
      );
      
      const snapshot = await getDocs(q);
      const results = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (
          !data.deletedBy?.includes(userId) &&
          data.text.toLowerCase().includes(searchText.toLowerCase())
        ) {
          results.push({ id: doc.id, ...data });
        }
      });
      
      return results;
      
    } catch (error) {
      console.error('Erreur searchMessages:', error);
      return [];
    }
  }
}

export default new ChatService();