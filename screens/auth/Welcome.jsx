import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { redirectToInterface } from '../../services/localSotrage/UserConnectData';

const { width } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  
  
  return (
  <View style={styles.container}>
    <View style={styles.heroContainer}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.heroImage}
        resizeMode="cover"
      />
      <View style={styles.heroOverlay} />

      <Ionicons
        name="accessibility-outline"
        size={35}
        color="#fff"
        style={styles.heroIcon}
      />
    </View>
    <View style={styles.content}>
      <Text style={styles.title}>Bienvenue sur IsiDiet</Text>
      <Text style={styles.subtitle}>
        Votre suivi nutritionnel personnalisé, simple et moderne.
      </Text>

      <TouchableOpacity
        style={styles.secondaryButton }
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.85}
      >
        <Ionicons name="log-in-outline" size={20} color="#815F9C" style={{ marginRight: 8 }} />
        <Text style={styles.secondaryButtonText}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('SignUp')}
        activeOpacity={0.85}
      >
        <Ionicons name="person-add-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.primaryButtonText}>S’inscrire</Text>
      </TouchableOpacity>
    </View>
  </View>
)};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F0F5',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  heroContainer: {
    width: '100%',
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
    marginTop: 10,  
  },
  heroImage: {
    width: '60%',
    height: '60%',
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    backgroundColor: 'rgba(129,95,156,0.25)',
  },
  heroIcon: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    backgroundColor: 'rgba(129,95,156,0.15)',
    borderRadius: 32,
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    marginTop: 18,
    width: '100%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7D5F9B',
    textAlign: 'center',
    marginBottom: 38,
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#815F9C',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 22,
    margin: 10,
    shadowColor: '#815F9C',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#815F9C',
    alignItems: 'center',
    margin: 10,
  },
  secondaryButtonText: {
    color: '#815F9C',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default Welcome;