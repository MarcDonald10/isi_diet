// hooks/useChat.js
import { useState, useEffect, useCallback } from 'react';
import chatService from '../services/chatService';

/**
 * Hook pour gérer les conversations
 */
export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribe = chatService.subscribeToConversations(
      userId,
      (convs) => {
        setConversations(convs);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { conversations, loading, error };
};

/**
 * Hook pour gérer les messages d'une conversation
 */
export const useMessages = (conversationId, userId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!conversationId || !userId) return;

    setLoading(true);
    const unsubscribe = chatService.subscribeToMessages(
      conversationId,
      userId,
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId, userId]);

  // Marquer automatiquement les messages comme lus
  useEffect(() => {
    if (!conversationId || !userId || messages.length === 0) return;

    const unreadMessages = messages.filter(
      msg => !msg.isMine && !msg.readBy?.includes(userId)
    );

    if (unreadMessages.length > 0) {
      // Marquer le dernier message non lu
      const lastUnread = unreadMessages[unreadMessages.length - 1];
      chatService.markMessageAsRead(lastUnread.id, conversationId, userId);
    }
  }, [messages, conversationId, userId]);

  return { messages, loading, error };
};

/**
 * Hook pour envoyer des messages
 */
export const useSendMessage = () => {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (conversationId, senderId, text, receiverId, file = null) => {
    try {
      setSending(true);
      setError(null);

      if (file) {
        await chatService.sendMessageWithAttachment(
          conversationId,
          senderId,
          text,
          file,
          receiverId
        );
      } else {
        await chatService.sendMessage(
          conversationId,
          senderId,
          text,
          receiverId
        );
      }

      setSending(false);
      return true;
    } catch (err) {
      setError(err.message);
      setSending(false);
      return false;
    }
  }, []);

  return { sendMessage, sending, error };
};

/**
 * Hook pour le compteur de messages non lus
 */
export const useUnreadCount = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      const count = await chatService.getTotalUnreadCount(userId);
      setUnreadCount(count);
    };

    fetchUnreadCount();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  return unreadCount;
};

/**
 * Hook pour rechercher dans les messages
 */
export const useSearchMessages = (conversationId, userId) => {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (searchText) => {
    if (!searchText.trim()) {
      setResults([]);
      return;
    }

    try {
      setSearching(true);
      const searchResults = await chatService.searchMessages(
        conversationId,
        searchText,
        userId
      );
      setResults(searchResults);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [conversationId, userId]);

  return { results, searching, search };
};