import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveUser } from '../../services/localSotrage/UserConnectData';
import { getDocumentById, signIn, signUp } from '../../services/firebase/firebaseService';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log('🔐 Tentative de connexion avec :', email);

      // Connexion Firebase (remplace "signIn" par ta fonction réelle)
      const userNew = await signIn(email, password);

      if (!userNew || !userNew.uid) {
        throw new Error('Aucun utilisateur retourné après la connexion.');
      }

      console.log('✅ Utilisateur connecté :', userNew.uid);

      // Récupération des données utilisateur
      const userData = await getDocumentById('users', userNew.uid);

      if (!userData) {
        throw new Error('Données utilisateur introuvables dans Firestore.');
      }

      console.log('📄 Données utilisateur récupérées :', userData);

      // Sauvegarde locale (AsyncStorage ou autre)
      await saveUser(userData);
      if (userData.type === "Patient") {
        navigation.replace('Accueil');
      } else {
        navigation.replace('MenuDieteticien');
      }
      // Navigation vers l’accueil

    } catch (error) {
      console.error('❌ Erreur lors de la connexion :', error.message);
      Alert.alert('Erreur de connexion', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        {/* <Ionicons name="leaf-outline" size={35} color="#fff" style={styles.heroIcon} /> */}
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>Connexion à IsiDiet</Text>
        <Text style={styles.subtitle}>Ravi de vous revoir !</Text>
        <View style={styles.inputGroup}>
          <Ionicons name="mail-outline" size={20} color="#815F9C" style={styles.inputIcon} />
          <TextInput
            placeholder="Email ou téléphone"
            placeholderTextColor="#B9A9CC"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputGroup}>
          <Ionicons name="lock-closed-outline" size={20} color="#815F9C" style={styles.inputIcon} />
          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor="#B9A9CC"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
        </View>
        <TouchableOpacity
          style={styles.forgot}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.loginButtonText}>Se connecter</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signupText}>
            Pas de compte ? <Text style={{ color: '#815F9C', fontWeight: 'bold' }}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F0F5',
  },
  header: {
    width: '100%',
    height: width * 0.65,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 0,
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
    backgroundColor: 'rgba(129,95,156,0.22)',
  },
  heroIcon: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    backgroundColor: 'rgba(129,95,156,0.15)',
    borderRadius: 32,
    padding: 10,
  },
  form: {
    flex: 1,
    paddingHorizontal: 28,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7D5F9B',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EAE3EC',
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 2,
    width: '100%',
    shadowColor: '#815F9C',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#1E223D',
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  forgotText: {
    color: '#7D5F9B',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#815F9C',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 22,
    marginBottom: 18,
    shadowColor: '#815F9C',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  signupLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  signupText: {
    color: '#7D5F9B',
    fontSize: 15,
  },
});

export default LoginScreen;