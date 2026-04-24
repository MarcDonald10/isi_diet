# 🗨️ Système de Chat Complet avec Firebase

Documentation complète du système de chat backend lié à Firebase.

---

## 📋 Table des Matières

1. [Structure Firebase](#structure-firebase)
2. [API - Conversations](#api---conversations)
3. [API - Messages](#api---messages)
4. [API - Gestion des Messages](#api---gestion-des-messages)
5. [Utilitaires](#utilitaires)
6. [Exemples d'Utilisation](#exemples-dutilisation)

---

## 🏗️ Structure Firebase

### Collections

```
firestore/
├── conversations/
│   ├── {conversationId}
│   │   ├── participants: [userId1, userId2]
│   │   ├── createdAt: Timestamp
│   │   ├── updatedAt: Timestamp
│   │   ├── lastMessage: string (100 premiers caractères)
│   │   ├── lastMessageTime: Timestamp
│   │   ├── unreadCount: { userId1: 0, userId2: 5 }
│   │   ├── status: 'active' | 'archived'
│   │   └── messages/
│   │       ├── {messageId}
│   │       │   ├── senderId: string
│   │       │   ├── text: string
│   │       │   ├── createdAt: Timestamp
│   │       │   ├── isRead: boolean
│   │       │   ├── readAt: Timestamp
│   │       │   ├── type: 'text' | 'image' | 'file'
│   │       │   ├── attachments: []
│   │       │   ├── status: 'sent' | 'delivered' | 'read'
│   │       │   ├── reactions: { '😊': [userId1, userId2] }
│   │       │   ├── editHistory: [{ originalText, editedAt }]
│   │       │   ├── isEdited: boolean
│   │       │   ├── deletedFor: [userId1]
│   │       │   └── updatedAt: Timestamp
│   │       └── ...
│   └── ...
└── ...
```

---

## 📞 API - Conversations

### `getOrCreateConversation(userId1, userId2)`

Créer ou récupérer une conversation entre deux utilisateurs.

**Paramètres:**
- `userId1` (string): ID du premier utilisateur
- `userId2` (string): ID du second utilisateur

**Retour:**
```javascript
{
  conversationId: string,
  conversation: {
    participants: [string, string],
    createdAt: Timestamp,
    updatedAt: Timestamp,
    lastMessage: string,
    unreadCount: { userId1: number, userId2: number }
  }
}
```

**Exemple:**
```javascript
import { getOrCreateConversation } from '@services/firebase/chatServices';

const { conversationId, conversation } = await getOrCreateConversation(
  'user123',
  'user456'
);
```

---

### `getUserConversations(userId)`

Récupérer toutes les conversations d'un utilisateur.

**Paramètres:**
- `userId` (string): ID de l'utilisateur

**Retour:** Array de conversations avec infos de l'autre utilisateur

**Exemple:**
```javascript
import { getUserConversations } from '@services/firebase/chatServices';

const conversations = await getUserConversations('user123');
conversations.forEach(conv => {
  console.log(conv.otherUser.name); // Nom de l'autre utilisateur
  console.log(conv.unreadMessages); // Nombre de messages non lus
});
```

---

### `getConversationDetails(conversationId)`

Récupérer les détails d'une conversation spécifique.

**Paramètres:**
- `conversationId` (string): ID de la conversation

**Retour:** Object avec détails de la conversation

**Exemple:**
```javascript
import { getConversationDetails } from '@services/firebase/chatServices';

const details = await getConversationDetails('user123_user456');
```

---

### `deleteConversation(conversationId)`

Supprimer complètement une conversation et tous ses messages.

**Paramètres:**
- `conversationId` (string): ID de la conversation

**Exemple:**
```javascript
import { deleteConversation } from '@services/firebase/chatServices';

await deleteConversation('user123_user456');
```

---

## 💬 API - Messages

### `sendMessage(conversationId, senderId, messageText, options)`

Envoyer un message dans une conversation.

**Paramètres:**
- `conversationId` (string): ID de la conversation
- `senderId` (string): ID de l'expéditeur
- `messageText` (string): Contenu du message
- `options` (object): Options supplémentaires
  - `type` (string): 'text' | 'image' | 'file'
  - `attachments` (array): Liste des pièces jointes

**Retour:** Object message créé

**Exemple:**
```javascript
import { sendMessage } from '@services/firebase/chatServices';

const message = await sendMessage(
  'user123_user456',
  'user123',
  'Bonjour! Comment ça va?',
  { type: 'text' }
);

console.log(message.messageId); // ID du message créé
```

---

### `getConversationMessages(conversationId, pageSize, lastMessage)`

Récupérer les messages d'une conversation (avec pagination).

**Paramètres:**
- `conversationId` (string): ID de la conversation
- `pageSize` (number): Nombre de messages par page (défaut: 30)
- `lastMessage` (object): Dernier message pour la pagination

**Retour:** Array de messages

**Exemple:**
```javascript
import { getConversationMessages } from '@services/firebase/chatServices';

// Premiers messages
const messages = await getConversationMessages('user123_user456', 30);

// Messages suivants (pagination)
const moreMessages = await getConversationMessages(
  'user123_user456',
  30,
  messages[messages.length - 1]
);
```

---

### `subscribeToConversationMessages(conversationId, callback)`

Écouter les messages en temps réel (live updates).

**Paramètres:**
- `conversationId` (string): ID de la conversation
- `callback` (function): Fonction appelée avec les messages

**Retour:** Function pour arrêter l'écoute

**Exemple:**
```javascript
import { subscribeToConversationMessages } from '@services/firebase/chatServices';

const unsubscribe = subscribeToConversationMessages(
  'user123_user456',
  (messages) => {
    setMessages(messages); // Update state avec les nouveaux messages
  }
);

// Pour arrêter l'écoute:
unsubscribe();
```

---

### `subscribeToUserConversations(userId, callback)`

Écouter les conversations en temps réel.

**Paramètres:**
- `userId` (string): ID de l'utilisateur
- `callback` (function): Fonction appelée avec les conversations

**Retour:** Function pour arrêter l'écoute

**Exemple:**
```javascript
import { subscribeToUserConversations } from '@services/firebase/chatServices';

const unsubscribe = subscribeToUserConversations(
  'user123',
  (conversations) => {
    setConversations(conversations); // Update state
  }
);
```

---

## ✏️ API - Gestion des Messages

### `markMessageAsRead(conversationId, messageId, userId)`

Marquer un message comme lu.

**Exemple:**
```javascript
import { markMessageAsRead } from '@services/firebase/chatServices';

await markMessageAsRead('user123_user456', 'msgId123', 'user123');
```

---

### `markAllMessagesAsRead(conversationId, userId)`

Marquer tous les messages comme lus.

**Exemple:**
```javascript
import { markAllMessagesAsRead } from '@services/firebase/chatServices';

await markAllMessagesAsRead('user123_user456', 'user123');
```

---

### `editMessage(conversationId, messageId, newText)`

Éditer un message existant.

**Exemple:**
```javascript
import { editMessage } from '@services/firebase/chatServices';

await editMessage(
  'user123_user456',
  'msgId123',
  'Texte édité du message'
);
```

---

### `deleteMessage(conversationId, messageId)`

Supprimer complètement un message (hard delete).

**Exemple:**
```javascript
import { deleteMessage } from '@services/firebase/chatServices';

await deleteMessage('user123_user456', 'msgId123');
```

---

### `softDeleteMessage(conversationId, messageId, userId)`

Masquer un message pour un utilisateur spécifique (soft delete).

**Exemple:**
```javascript
import { softDeleteMessage } from '@services/firebase/chatServices';

await softDeleteMessage('user123_user456', 'msgId123', 'user123');
```

---

### `addReactionToMessage(conversationId, messageId, emoji, userId)`

Ajouter une réaction emoji à un message.

**Exemple:**
```javascript
import { addReactionToMessage } from '@services/firebase/chatServices';

await addReactionToMessage(
  'user123_user456',
  'msgId123',
  '😊',
  'user123'
);
```

---

### `removeReactionFromMessage(conversationId, messageId, emoji, userId)`

Retirer une réaction emoji d'un message.

**Exemple:**
```javascript
import { removeReactionFromMessage } from '@services/firebase/chatServices';

await removeReactionFromMessage(
  'user123_user456',
  'msgId123',
  '😊',
  'user123'
);
```

---

## 🔍 Utilitaires

### `searchMessages(conversationId, searchText)`

Chercher des messages dans une conversation.

**Exemple:**
```javascript
import { searchMessages } from '@services/firebase/chatServices';

const results = await searchMessages('user123_user456', 'bonjour');
```

---

### `getConversationStats(conversationId)`

Obtenir les statistiques d'une conversation.

**Retour:**
```javascript
{
  totalMessages: number,
  messagesByUser: { userId: count, ... },
  avgResponseTime: number // en secondes
}
```

**Exemple:**
```javascript
import { getConversationStats } from '@services/firebase/chatServices';

const stats = await getConversationStats('user123_user456');
console.log(stats.totalMessages); // Total des messages
console.log(stats.avgResponseTime); // Temps moyen de réponse
```

---

## 💻 Exemples d'Utilisation

### Exemple 1: Démarrer une conversation

```javascript
import {
  getOrCreateConversation,
  sendMessage,
  subscribeToConversationMessages
} from '@services/firebase/chatServices';

// Créer ou récupérer la conversation
const { conversationId } = await getOrCreateConversation(
  'user123',
  'user456'
);

// Envoyer un message
await sendMessage(
  conversationId,
  'user123',
  'Salut! Comment tu vas?'
);

// Écouter les nouveaux messages
const unsubscribe = subscribeToConversationMessages(
  conversationId,
  (messages) => {
    console.log('Messages mis à jour:', messages);
  }
);
```

---

### Exemple 2: Composant React Hook pour Chat

```javascript
import React, { useState, useEffect } from 'react';
import {
  getUserConversations,
  subscribeToUserConversations,
  sendMessage,
  subscribeToConversationMessages,
  markAllMessagesAsRead
} from '@services/firebase/chatServices';

function ChatScreen({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Écouter les conversations
  useEffect(() => {
    const unsubscribe = subscribeToUserConversations(userId, (convs) => {
      setConversations(convs);
    });

    return unsubscribe;
  }, [userId]);

  // Écouter les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedConversation) return;

    // Marquer les messages comme lus
    markAllMessagesAsRead(selectedConversation.conversationId, userId);

    const unsubscribe = subscribeToConversationMessages(
      selectedConversation.conversationId,
      (msgs) => {
        setMessages(msgs);
      }
    );

    return unsubscribe;
  }, [selectedConversation, userId]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    await sendMessage(
      selectedConversation.conversationId,
      userId,
      messageText
    );

    setMessageText('');
  };

  return (
    <div>
      <div className="conversations-list">
        {conversations.map(conv => (
          <div
            key={conv.conversationId}
            onClick={() => setSelectedConversation(conv)}
          >
            <h3>{conv.otherUser.name}</h3>
            <p>{conv.lastMessage}</p>
            {conv.unreadMessages > 0 && (
              <span>{conv.unreadMessages} non lus</span>
            )}
          </div>
        ))}
      </div>

      {selectedConversation && (
        <div className="chat-area">
          <div className="messages-list">
            {messages.map(msg => (
              <div key={msg.messageId} className="message">
                <p>{msg.text}</p>
                <span>{msg.status}</span>
              </div>
            ))}
          </div>

          <div className="message-input">
            <input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage}>Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatScreen;
```

---

### Exemple 3: Utilisation dans React Native

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  getOrCreateConversation,
  subscribeToConversationMessages,
  sendMessage,
  markAllMessagesAsRead,
} from '@services/firebase/chatServices';

function ChatScreen({ route, navigation }) {
  const { dieticienId, userId } = route.params;
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState(null);

  // Créer/récupérer la conversation
  useEffect(() => {
    const initConversation = async () => {
      const { conversationId } = await getOrCreateConversation(
        userId,
        dieticienId
      );
      setConversationId(conversationId);

      // Marquer comme lus
      await markAllMessagesAsRead(conversationId, userId);

      // Écouter les messages
      const unsubscribe = subscribeToConversationMessages(
        conversationId,
        setMessages
      );

      return unsubscribe;
    };

    return initConversation().then(unsub => unsub);
  }, [userId, dieticienId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId) return;

    await sendMessage(conversationId, userId, messageText);
    setMessageText('');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.messageId}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.senderId === userId ? 'flex-end' : 'flex-start',
            }}
          >
            <Text>{item.text}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: 'row' }}>
        <TextInput
          style={{ flex: 1 }}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Écrivez un message..."
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <Text>Envoyer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default ChatScreen;
```

---

## 📊 Règles Firebase Firestore

Pour sécuriser votre chat, utilisez ces règles Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      
      // Messages
      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        allow update, delete: if request.auth.uid == resource.data.senderId;
      }
    }
  }
}
```

---

## 🚀 Points Clés

✅ **Temps réel**: Utilise `onSnapshot()` pour les mises à jour en direct
✅ **Pagination**: Support complet de la pagination avec `startAfter()`
✅ **Compteur non-lu**: Suivi automatique des messages non lus
✅ **Historique d'édition**: Garde trace de toutes les modifications
✅ **Réactions**: Support des emojis de réaction
✅ **Soft delete**: Permet aux utilisateurs de masquer les messages
✅ **Statistiques**: Analysez les conversations avec des statistiques

---

## 📝 Notes Importantes

1. Les IDs de conversation sont auto-générées: `[userId1, userId2].sort().join('_')`
2. Les messages sont stockés en sous-collection pour performance
3. Le `createdAt` utilise `serverTimestamp()` pour éviter les décalages horaires
4. Tous les messages sont marqués comme lus automatiquement au chargement
5. Les réactions utilisent les emojis comme clé

---

**Système de chat complet et scalable! 🎉**
