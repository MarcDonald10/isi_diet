# Guide Complet du Système de Chat - isi_diet

## 📋 Vue d'ensemble

Le système de chat complet est maintenant intégré dans l'application avec Firebase Firestore comme backend. Il offre une expérience de messagerie en temps réel avec:

- **Conversations en temps réel** via `onSnapshot` listeners
- **Édition et suppression** de messages
- **Réactions emoji** sur les messages
- **Comptage des messages non lus**
- **Historique des modifications** sur les messages
- **Recherche** dans les conversations
- **Gestion des statuts** de lecture

---

## 🗂️ Structure des Fichiers

```
screens/pages/
├── Messageries/
│   └── Messagerie.jsx          # Liste des conversations (NOUVEAU)
├── Chats/
│   ├── Chat.jsx                # (existant - peut être supprimé)
│   └── ChatScreen.jsx          # Écran de chat détaillé (NOUVEAU)
└── ...

services/firebase/
├── chatServices.js             # Services Firebase pour le chat (COMPLÉTISÉ)
└── firebaseConfig.js           # Configuration Firebase
```

---

## 🎯 Composants Créés

### 1. **MessagerieScreen** (`Messagerie.jsx`)

**Responsabilité**: Afficher la liste de toutes les conversations de l'utilisateur

**Props Route**:
```javascript
// Navigation: navigation.navigate('Messagerie')
```

**Fonctionnalités**:
- ✅ Charge les conversations depuis Firebase
- ✅ Affiche le dernier message de chaque conversation
- ✅ Montre le nombre de messages non lus
- ✅ Rafraîchir les données (pull-to-refresh)
- ✅ Suppression de conversation (long press)
- ✅ Indicateur de statut en ligne/hors ligne
- ✅ Formatage intelligent des timestamps

**État Données**:
```javascript
{
  conversationId: "user1_user2",
  participants: [
    { userId, name, avatar, isOnline },
    { userId, name, avatar, isOnline }
  ],
  lastMessage: "Hello!",
  lastMessageTime: Timestamp,
  unreadCount: { userId1: 0, userId2: 5 },
  updatedAt: Timestamp
}
```

**Code Example**:
```javascript
import MessagerieScreen from '../../screens/pages/Messageries/Messagerie';

// Dans votre Stack Navigator
<Stack.Screen 
  name="Messagerie" 
  component={MessagerieScreen} 
/>
```

---

### 2. **ChatScreen** (`screens/pages/Chats/ChatScreen.jsx`)

**Responsabilité**: Afficher et gérer une conversation individuelle

**Props Route**:
```javascript
navigation.navigate('ChatScreen', {
  dieticienId: 'user123',
  dieticienName: 'Dr. Marie Dubois'
})
```

**Fonctionnalités**:
- ✅ Messages en temps réel
- ✅ Envoyer des messages
- ✅ Éditer des messages (propres messages)
- ✅ Supprimer des messages (soft delete)
- ✅ Ajouter des réactions emoji
- ✅ Marquer les messages comme lus
- ✅ Afficher le statut d'envoi (sent, delivered, read)
- ✅ Timestamps intelligents
- ✅ Scroll automatique vers les nouveaux messages

**Actions Disponibles**:
- Appuyer long sur un message pour le menu
- Réactions via bouton "more"
- Édition de ses propres messages
- Suppression pour soi-même

---

## 🔄 Flux de Données

```
┌─────────────────────────────────────────────────────┐
│  MessagerieScreen                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ useEffect: loadConversations()               │  │
│  │ → getUserConversations(userId)               │  │
│  │ → subscribeToUserConversations() [listener]  │  │
│  └──────────────────────────────────────────────┘  │
│  Affiche liste de conversations                     │
└─────────────────────────────────────────────────────┘
                      ↓
        Navigation au ChatScreen
                      ↓
┌─────────────────────────────────────────────────────┐
│  ChatScreen                                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ useEffect: initializeChat()                  │  │
│  │ → getOrCreateConversation(userId, otherId)   │  │
│  │ → subscribeToConversationMessages() [live]   │  │
│  │ → markAllMessagesAsRead()                    │  │
│  └──────────────────────────────────────────────┘  │
│  Affiche messages en temps réel                     │
│  Gère envoi/édition/suppression                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Intégration dans la Navigation

### Mise à jour de votre `AppNavigate.jsx`:

```javascript
import ChatScreen from '../screens/pages/Chats/ChatScreen';
import MessagerieScreen from '../screens/pages/Messageries/Messagerie';

export const ChatStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Messagerie" 
      component={MessagerieScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="ChatScreen" 
      component={ChatScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);

export const MainTabs = () => (
  <Tab.Navigator>
    {/* ... autres tabs ... */}
    <Tab.Screen 
      name="MessagesTab" 
      component={ChatStack}
      options={{
        tabBarLabel: 'Messages',
        tabBarIcon: ({ color }) => (
          <Ionicons name="chatbubbles" size={24} color={color} />
        )
      }}
    />
  </Tab.Navigator>
);
```

---

## 🔧 Services Firebase (`chatServices.js`)

### Fonctions Principales

**Conversation Management**:
```javascript
// Créer/récupérer une conversation
const { conversationId } = await getOrCreateConversation(userId1, userId2);

// Récupérer toutes les conversations d'un utilisateur
const conversations = await getUserConversations(userId);

// Récupérer une conversation spécifique
const details = await getConversationDetails(conversationId);

// Supprimer une conversation
await deleteConversation(conversationId);
```

**Real-time Listeners**:
```javascript
// S'abonner aux messages d'une conversation
const unsubscribe = subscribeToConversationMessages(conversationId, (messages) => {
  console.log('Nouveaux messages:', messages);
});
// Puis: unsubscribe() pour arrêter l'écoute

// S'abonner aux conversations d'un utilisateur
const unsubscribe = subscribeToUserConversations(userId, (conversations) => {
  console.log('Conversations mises à jour:', conversations);
});
```

**Message Operations**:
```javascript
// Envoyer un message
await sendMessage(conversationId, senderId, messageText);

// Marquer les messages comme lus
await markAllMessagesAsRead(conversationId, userId);

// Éditer un message
await editMessage(conversationId, messageId, newText);

// Supprimer un message (pour soi-même)
await softDeleteMessage(conversationId, messageId, userId);

// Ajouter une réaction
await addReactionToMessage(conversationId, messageId, '👍', userId);

// Retirer une réaction
await removeReactionFromMessage(conversationId, messageId, '👍', userId);
```

---

## 📊 Structure Firestore

```
conversations/
├── {conversationId}/
│   ├── participants: ["user1", "user2"]
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   ├── lastMessage: "Hello!"
│   ├── lastMessageTime: Timestamp
│   ├── unreadCount: { user1: 0, user2: 3 }
│   ├── status: "active"
│   └── messages/
│       ├── {messageId}/
│       │   ├── senderId: "user1"
│       │   ├── text: "Hello!"
│       │   ├── createdAt: Timestamp
│       │   ├── isRead: false
│       │   ├── readAt: Timestamp
│       │   ├── status: "sent"
│       │   ├── type: "text"
│       │   ├── reactions: { "👍": ["user2"] }
│       │   ├── isEdited: false
│       │   ├── editHistory: []
│       │   ├── deletedFor: []
│       │   └── updatedAt: Timestamp
│       └── ...

```

---

## ⚙️ Configuration Firestore Rules

Ajoutez ces règles à votre Firestore pour sécuriser le chat:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Conversations - seuls les participants peuvent y accéder
    match /conversations/{conversationId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      
      // Messages dans une conversation
      match /messages/{messageId} {
        allow read, write: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
        
        // Un utilisateur peut éditer/supprimer son propre message
        allow delete: if request.auth.uid == resource.data.senderId;
        allow update: if request.auth.uid == resource.data.senderId && 
                         request.resource.data.text != resource.data.text;
      }
    }
  }
}
```

---

## 🎨 Personnalisation

### Couleurs Principales

```javascript
// Primary Purple
#7B68EE    // Boutons, accents
#F9F7FF    // Conversations non lues

// Neutres
#FFF       // Backgrounds
#333       // Texte principal
#999       // Texte secondaire
#CCC       // Désactivé

// Actions
#4CAF50    // En ligne
#E8E8E8    // Messages reçus
```

### Polices et Tailles

```javascript
// Heading
fontSize: wp('5.5%')  // 22-24px
fontWeight: 'bold'

// Body
fontSize: wp('3.5%')  // 14-16px
fontWeight: '500'

// Caption
fontSize: wp('3%')    // 12-13px
color: '#999'
```

---

## 🚀 Déploiement

### Avant le déploiement en production:

1. ✅ **Règles Firestore**: Vérifier que les règles de sécurité sont activées
2. ✅ **Authentication**: Configurer les fournisseurs d'authentification
3. ✅ **Storage**: Vérifier les limites de stockage
4. ✅ **Indexes**: Créer les indexes composites nécessaires:
   - `conversations` + `updatedAt` (descending)
   - `messages` + `createdAt` (ascending)

---

## 📱 Utilisation

### Démarrer une conversation

```javascript
// Option 1: Depuis la liste des diététiciens
onPress={() => {
  navigation.navigate('ChatScreen', {
    dieticienId: dietician.id,
    dieticienName: dietician.name
  });
}}

// Option 2: Depuis un profil de diététicien
<Button 
  title="Envoyer un message"
  onPress={() => {
    navigation.navigate('Messagerie');
  }}
/>
```

### Répondre aux messages

```javascript
// Cliquer sur le message pour voir les options
- Éditer (propres messages)
- Ajouter une réaction
- Supprimer pour moi
```

---

## 🐛 Dépannage

**Q: Les messages n'apparaissent pas en temps réel?**
A: Vérifier que `subscribeToConversationMessages` est bien appelé et que le listener n'est pas supprimé

**Q: Les messages non lus ne se mettent pas à jour?**
A: Assurer que `markAllMessagesAsRead` est appelé quand on ouvre une conversation

**Q: Performance lente avec beaucoup de messages?**
A: Implémenter la pagination avec `getConversationMessages`

---

## 📞 Support

Pour toute question ou bug report:
1. Vérifier les logs console
2. Vérifier les règles Firestore
3. Vérifier la connectivity réseau
4. Vérifier l'authentification utilisateur

