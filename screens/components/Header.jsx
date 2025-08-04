import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Pour les icônes (notifications et chat)

const Header = ({ userPhoto, username, onChatPress, onNotificationPress, notificationCount }) => {
  return (
    <View style={styles.header}>
      {/* Photo de l'utilisateur et nom */}
      <View style={styles.userContainer}>
        <Image
          source={userPhoto ? { uri: userPhoto } : ''} // Image par défaut si pas de photo
          style={styles.userPhoto}
        />
        <Text style={styles.username}>{username || 'Utilisateur'}</Text>
      </View>

      {/* Boutons de chat et notification */}
      <View style={styles.actionsContainer}>
        {/* <TouchableOpacity onPress={onChatPress} style={styles.iconButton}>
          <Ionicons name="chatbubble-outline" size={28} color="#333" />
        </TouchableOpacity> */}
        <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={28} color="#333" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EAE3EC', // magnolia-2
    elevation: 3,
    shadowColor: '#815F9C', // pomp-and-power
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#F6F0F5', // magnolia
    backgroundColor: '#EAE3EC', // magnolia-2
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#815F9C', // pomp-and-power
    letterSpacing: 0.2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 18,
    position: 'relative',
    backgroundColor: '#F6F0F5', // magnolia
    borderRadius: 16,
    padding: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 2,
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default Header;