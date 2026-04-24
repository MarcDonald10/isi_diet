import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { logOut } from '../../services/firebase/firebaseService';
import { deleteUser } from '../../services/localSotrage/UserConnectData';

const { width, height } = Dimensions.get('window');

const Header = ({ pageName = 'Accueil', onNotificationPress, notificationCount }) => {
     const navigation = useNavigation();
  const { user, loading } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-width * 0.7));

  const toggleMenu = () => {
    const toValue = menuVisible ? -width * 0.7 : 0;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
    setMenuVisible(!menuVisible);
  };

  const deconnextion = async() => {

    await logOut();
    await deleteUser();
    navigation.navigate('Login');
  }
  const menuItems = [
    { icon: 'person-outline', label: 'Mon Profil', onPress: () => user?.type === "Patient" ? navigation.navigate('Profile') : navigation.navigate('ProfilDieteticien',{dieticienId: user?.uid}) },
    { icon: 'settings-outline', label: 'Paramètres', onPress: () => navigation.navigate('SettingPatient') },
    { icon: 'log-out-outline', label: 'Déconnexion', onPress: () => deconnextion() },
  ];

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Ionicons name="menu-outline" size={28} color="#815F9C" />
        </TouchableOpacity>

        <Text style={styles.pageName}>{pageName}</Text>

        <View style={styles.actionsContainer}>
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

      {/* Menu latéral */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={toggleMenu}
        />
      )}
      
      <Animated.View 
        style={[
          styles.menu,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        <View style={styles.menuHeader}>
          <Image
            source={user?.photo ? { uri: user.photo } : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"}
            style={styles.menuUserPhoto}
          />
          <Text style={styles.menuUsername}>{user?.prenom + ' ' + user?.nom || 'Utilisateur'}</Text>
        </View>

        <View style={styles.menuItems}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                item.onPress();
              }}
            >
              <Ionicons name={item.icon} size={24} color="#815F9C" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </>
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
  menuButton: {
    padding: 8,
  },
  pageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  userPhoto: {
    width: 50,
    height: 50,
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1,
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '70%',
    height: '100%',
    backgroundColor: '#fff',
    zIndex: 2,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    padding: 20,
    backgroundColor: '#F6F0F5',
    borderTopRightRadius: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  menuUserPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  menuUsername: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
    textAlign: 'center',
  },
  menuItems: {
    padding: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 5,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#1E223D',
    fontWeight: '500',
  },
});

export default Header;