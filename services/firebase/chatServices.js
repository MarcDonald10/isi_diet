import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    startAfter,
    updateDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

/**
 * ==================== CONVERSATIONS ====================
 */

/**
 * Créer ou récupérer une conversation entre deux utilisateurs
 * @param {string} userId1 - ID du premier utilisateur
 * @param {string} userId2 - ID du second utilisateur
 * @returns {Promise<{conversationId: string, conversation: object}>}
 */
export const getOrCreateConversation = async (userId1, userId2) => {
  try {
    // Créer une ID de conversation unique (toujours dans le même ordre)
    const conversationId = [userId1, userId2].sort().join('_');

    // Vérifier si la conversation existe
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      return {
        conversationId,
        conversation: conversationSnap.data(),
      };
    }

    // Créer une nouvelle conversation
    const conversationData = {
      participants: [userId1, userId2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0,
      },
      status: 'active',
    };

    await setDoc(conversationRef, conversationData);

    return {
      conversationId,
      conversation: conversationData,
    };
  } catch (error) {
    console.error('Erreur lors de la création/récupération de conversation:', error);
    throw error;
  }
};

/**
 * Récupérer toutes les conversations d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>}
 */
export const getUserConversations = async (userId) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const conversationsSnap = await getDocs(q);
    const conversations = [];

    for (const docSnap of conversationsSnap.docs) {
      const conversationData = docSnap.data();
      const otherUserId = conversationData.participants.find(id => id !== userId);

      // Récupérer les infos de l'autre utilisateur
      const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
      const otherUserData = otherUserDoc.data();

      conversations.push({
        conversationId: docSnap.id,
        ...conversationData,
        otherUser: {
          id: otherUserId,
          name: otherUserData?.nom || otherUserData?.name || 'Utilisateur',
          avatar: otherUserData?.photo || null,
          email: otherUserData?.email || null,
          ...otherUserData,
        },
        unreadMessages: conversationData.unreadCount?.[userId] || 0,
      });
    }

    return conversations;
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    throw error;
  }
};

/**
 * Récupérer une conversation spécifique avec ses détails
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<object>}
 */
export const getConversationDetails = async (conversationId) => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      throw new Error('Conversation non trouvée');
    }

    return {
      conversationId: conversationSnap.id,
      ...conversationSnap.data(),
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des détails:', error);
    throw error;
  }
};

/**
 * ==================== MESSAGES ====================
 */

/**
 * Envoyer un message
 * @param {string} conversationId - ID de la conversation
 * @param {string} senderId - ID de l'expéditeur
 * @param {string} messageText - Contenu du message
 * @param {object} options - Options supplémentaires (type, attachments, etc.)
 * @returns {Promise<object>}
 */
export const sendMessage = async (conversationId, senderId, messageText, options = {}) => {
  try {
    if (!messageText.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    // Ajouter le message à la sous-collection 'messages'
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    const messageData = {
      senderId,
      text: messageText.trim(),
      createdAt: serverTimestamp(),
      isRead: false,
      readAt: null,
      type: options.type || 'text', // 'text', 'image', 'file', etc.
      attachments: options.attachments || [],
      status: 'sent', // 'sent', 'delivered', 'read'
      reactions: {}, // { emoji: [userId1, userId2], ... }
      editHistory: [],
      deletedFor: [], // IDs des utilisateurs qui ont supprimé ce message
    };

    const messageRef = await addDoc(messagesRef, messageData);

    // Mettre à jour la conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    const conversationData = conversationSnap.data();

    // Récupérer l'ID du destinataire
    const recipientId = conversationData.participants.find(id => id !== senderId);

    await updateDoc(conversationRef, {
      lastMessage: messageText.substring(0, 100),
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: (conversationData.unreadCount?.[recipientId] || 0) + 1,
    });

    return {
      messageId: messageRef.id,
      ...messageData,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

/**
 * Récupérer les messages d'une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {number} pageSize - Nombre de messages par page
 * @param {object} lastMessage - Dernier message pour la pagination
 * @returns {Promise<Array>}
 */
export const getConversationMessages = async (
  conversationId,
  pageSize = 30,
  lastMessage = null
) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    let q;
    if (lastMessage) {
      q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastMessage),
        limit(pageSize)
      );
    } else {
      q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
    }

    const messagesSnap = await getDocs(q);
    const messages = [];

    messagesSnap.forEach(docSnap => {
      messages.push({
        messageId: docSnap.id,
        ...docSnap.data(),
      });
    });

    // Retourner en ordre croissant pour l'affichage
    return messages.reverse();
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    throw error;
  }
};

/**
 * Écouter les messages en temps réel
 * @param {string} conversationId - ID de la conversation
 * @param {function} callback - Fonction appelée à chaque modification
 * @returns {function} Fonction pour arrêter l'écoute
 */
export const subscribeToConversationMessages = (conversationId, callback) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (messagesSnap) => {
      const messages = [];
      messagesSnap.forEach(docSnap => {
        messages.push({
          messageId: docSnap.id,
          ...docSnap.data(),
        });
      });
      callback(messages);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des messages:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Erreur lors de l\'abonnement aux messages:', error);
    throw error;
  }
};

/**
 * Écouter les conversations en temps réel
 * @param {string} userId - ID de l'utilisateur
 * @param {function} callback - Fonction appelée à chaque modification
 * @returns {function} Fonction pour arrêter l'écoute
 */
export const subscribeToUserConversations = (userId, callback) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (conversationsSnap) => {
      const conversations = [];

      for (const docSnap of conversationsSnap.docs) {
        const conversationData = docSnap.data();
        const otherUserId = conversationData.participants.find(id => id !== userId);

        try {
          const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
          const otherUserData = otherUserDoc.data();

          conversations.push({
            conversationId: docSnap.id,
            ...conversationData,
            otherUser: {
              id: otherUserId,
              name: otherUserData?.nom || otherUserData?.name || 'Utilisateur',
              avatar: otherUserData?.photo || null,
            },
            unreadMessages: conversationData.unreadCount?.[userId] || 0,
          });
        } catch (err) {
          console.error('Erreur lors de la récupération des infos utilisateur:', err);
        }
      }

      callback(conversations);
    }, (error) => {
      console.error('Erreur lors de l\'écoute des conversations:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Erreur lors de l\'abonnement aux conversations:', error);
    throw error;
  }
};

/**
 * ==================== GESTION DES MESSAGES ====================
 */

/**
 * Marquer un message comme lu
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export const markMessageAsRead = async (conversationId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    
    await updateDoc(messageRef, {
      isRead: true,
      readAt: serverTimestamp(),
      status: 'read',
    });

    // Mettre à jour le compteur non-lu de la conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    const conversationData = conversationSnap.data();

    const currentUnreadCount = conversationData.unreadCount?.[userId] || 0;
    
    if (currentUnreadCount > 0) {
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: currentUnreadCount - 1,
      });
    }
  } catch (error) {
    console.error('Erreur lors du marquage du message comme lu:', error);
    throw error;
  }
};

/**
 * Marquer tous les messages comme lus dans une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export const markAllMessagesAsRead = async (conversationId, userId) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('isRead', '==', false)
    );

    const messagesSnap = await getDocs(q);
    const batch = writeBatch(db);

    messagesSnap.forEach(docSnap => {
      batch.update(docSnap.ref, {
        isRead: true,
        readAt: serverTimestamp(),
        status: 'read',
      });
    });

    await batch.commit();

    // Réinitialiser le compteur non-lu
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Erreur lors du marquage de tous les messages:', error);
    throw error;
  }
};

/**
 * Éditer un message
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @param {string} newText - Nouveau texte
 * @returns {Promise<void>}
 */
export const editMessage = async (conversationId, messageId, newText) => {
  try {
    if (!newText.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    // Garder l'historique d'édition - utiliser ISO string au lieu de serverTimestamp
    const editHistory = messageData.editHistory || [];
    editHistory.push({
      originalText: messageData.text,
      editedAt: new Date().toISOString(),
    });

    await updateDoc(messageRef, {
      text: newText.trim(),
      editHistory,
      isEdited: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erreur lors de l\'édition du message:', error);
    throw error;
  }
};

/**
 * Supprimer un message
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @returns {Promise<void>}
 */
export const deleteMessage = async (conversationId, messageId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    console.error('Erreur lors de la suppression du message:', error);
    throw error;
  }
};

/**
 * Soft delete d'un message (visible seulement pour l'utilisateur)
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export const softDeleteMessage = async (conversationId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    const deletedFor = messageData.deletedFor || [];
    if (!deletedFor.includes(userId)) {
      deletedFor.push(userId);
      await updateDoc(messageRef, { deletedFor });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression douce du message:', error);
    throw error;
  }
};

/**
 * Ajouter une réaction à un message
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @param {string} emoji - Emoji de réaction
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export const addReactionToMessage = async (conversationId, messageId, emoji, userId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    const reactions = messageData.reactions || {};
    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId);
    }

    await updateDoc(messageRef, { reactions });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de réaction:', error);
    throw error;
  }
};

/**
 * Retirer une réaction d'un message
 * @param {string} conversationId - ID de la conversation
 * @param {string} messageId - ID du message
 * @param {string} emoji - Emoji de réaction
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<void>}
 */
export const removeReactionFromMessage = async (conversationId, messageId, emoji, userId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    const reactions = messageData.reactions || {};
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
      await updateDoc(messageRef, { reactions });
    }
  } catch (error) {
    console.error('Erreur lors du retrait de réaction:', error);
    throw error;
  }
};

/**
 * ==================== UTILITAIRES ====================
 */

/**
 * Chercher des messages dans une conversation
 * @param {string} conversationId - ID de la conversation
 * @param {string} searchText - Texte à chercher
 * @returns {Promise<Array>}
 */
export const searchMessages = async (conversationId, searchText) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));

    const messagesSnap = await getDocs(q);
    const results = [];

    messagesSnap.forEach(docSnap => {
      const messageData = docSnap.data();
      if (messageData.text && messageData.text.toLowerCase().includes(searchText.toLowerCase())) {
        results.push({
          messageId: docSnap.id,
          ...messageData,
        });
      }
    });

    return results;
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw error;
  }
};

/**
 * Obtenir les statistiques d'une conversation
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<object>}
 */
export const getConversationStats = async (conversationId) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnap = await getDocs(messagesRef);

    let totalMessages = 0;
    let messagesByUser = {};
    let avgResponseTime = 0;

    let lastSenderId = null;
    let lastMessageTime = null;
    const responseTimes = [];

    messagesSnap.forEach(docSnap => {
      const messageData = docSnap.data();
      totalMessages++;

      const senderId = messageData.senderId;
      messagesByUser[senderId] = (messagesByUser[senderId] || 0) + 1;

      if (lastSenderId && lastSenderId !== senderId && lastMessageTime) {
        const responseTime = messageData.createdAt - lastMessageTime;
        responseTimes.push(responseTime);
      }

      lastSenderId = senderId;
      lastMessageTime = messageData.createdAt;
    });

    if (responseTimes.length > 0) {
      avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    return {
      totalMessages,
      messagesByUser,
      avgResponseTime: Math.round(avgResponseTime / 1000), // en secondes
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

/**
 * Supprimer une conversation
 * @param {string} conversationId - ID de la conversation
 * @returns {Promise<void>}
 */
export const deleteConversation = async (conversationId) => {
  try {
    // Supprimer tous les messages
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const messagesSnap = await getDocs(messagesRef);
    const batch = writeBatch(db);

    messagesSnap.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });

    // Supprimer la conversation
    batch.delete(doc(db, 'conversations', conversationId));

    await batch.commit();
  } catch (error) {
    console.error('Erreur lors de la suppression de la conversation:', error);
    throw error;
  }
};

// export default {
//   // Conversations
//   getOrCreateConversation,
//   getUserConversations,
//   getConversationDetails,
//   subscribeToUserConversations,
//   deleteConversation,
  
//   // Messages
//   sendMessage,
//   getConversationMessages,
//   subscribeToConversationMessages,
  
//   // Gestion des messages
//   markMessageAsRead,
//   markAllMessagesAsRead,
//   editMessage,
/**
 * Envoyer un message avec pièce jointe (image, fichier, etc.)
 * @param {string} conversationId - ID de la conversation
 * @param {string} senderId - ID de l'expéditeur
 * @param {object} file - Objet fichier {uri, type, name}
 * @param {string} messageText - Texte optionnel du message
 * @returns {Promise<void>}
 */
export const sendMessageWithAttachment = async (conversationId, senderId, file, messageText = '') => {
  try {
    if (!file || !file.uri) {
      throw new Error('Fichier invalide');
    }

    let downloadURL = null;
    let fileSize = 0;

    // Upload du fichier vers Firebase Storage
    try {
      console.log('Début de l\'upload - URI:', file.uri);
      
      const response = await fetch(file.uri);
      
      if (!response.ok) {
        throw new Error(`Erreur fetch: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      fileSize = blob.size;
      
      console.log('Blob créé - Taille:', fileSize, 'Type:', blob.type);

      const fileName = file.name || `file_${Date.now()}`;
      const storageRef = ref(storage, `chat/${conversationId}/${Date.now()}_${fileName}`);

      console.log('Upload vers Storage:', storageRef.fullPath);
      
      // Upload le fichier
      const uploadResult = await uploadBytes(storageRef, blob);
      
      console.log('Upload réussi');
      
      // Récupérer l'URL de téléchargement
      downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('URL obtenue:', downloadURL.substring(0, 50) + '...');
    } catch (uploadError) {
      console.error('Erreur upload Firebase Storage:', uploadError);
      throw new Error('Impossible d\'uploader le fichier: ' + uploadError.message);
    }

    // Créer le message
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    
    const messageData = {
      senderId,
      text: messageText.trim() || (file.type.includes('image') ? '📷 Photo' : `📎 ${file.name}`),
      createdAt: serverTimestamp(),
      isRead: false,
      readAt: null,
      type: file.type,
      attachments: [{
        type: file.type,
        name: file.name,
        uri: downloadURL,
        size: fileSize,
        uploadedAt: new Date().toISOString(),
      }],
      status: 'sent',
      reactions: {},
      editHistory: [],
      isEdited: false,
      deletedFor: [],
      updatedAt: serverTimestamp(),
    };

    await setDoc(messageRef, messageData);
    
    console.log('Message créé avec succès');

    // Mettre à jour la conversation
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: messageText.trim() || (file.type.includes('image') ? '📷 Photo' : `📎 ${file.name}`),
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('Conversation mise à jour');
  } catch (error) {
    console.error('Erreur lors de l\'envoi du fichier:', error);
    throw error;
  }
};

/**
 * ==================== MESSAGES WITH ATTACHMENTS ====================
 */

export default {
  getOrCreateConversation,
  getUserConversations,
  getConversationDetails,
  deleteConversation,

  // Real-time listeners
  subscribeToConversationMessages,
  subscribeToUserConversations,

  // Message operations
  sendMessage,
  getConversationMessages,
  markMessageAsRead,
  markAllMessagesAsRead,
  editMessage,
  deleteMessage,
  softDeleteMessage,
  addReactionToMessage,
  removeReactionFromMessage,
  sendMessageWithAttachment,
  
  // Utilitaires
  searchMessages,
  getConversationStats,
};


