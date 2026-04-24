import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDocument, addDocumentUsers, signUp } from '../../services/firebase/firebaseService';
import { deleteUser, saveUser } from '../../services/localSotrage/UserConnectData';

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('Patient');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  // Champs spécifiques aux patients
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [conditions, setConditions] = useState('');
  const [objectives, setObjectives] = useState('');
  // Champs spécifiques aux diététiciens
  const [qualifications, setQualifications] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !phone) {
      alert('Veuillez remplir tous les champs requis.');
      return;
    }

    setLoading(true);

    try {
      // 1. Création du compte Firebase Auth
      deleteUser()
      const user = await signUp(email, password);

      console.log('Utilisateur créé avec succès:', user.uid);
      // return null
      // 2. Création de l'objet à enregistrer dans Firestore
      const userData = {
        uid: user?.uid,              // UID sécurisé
        type: userType,
        email,
        nom: firstName,
        prenom: firstName,
        phone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Ajout dans Firestore
      await addDocumentUsers(user?.uid, userData);

      // 4. Sauvegarde locale (async storage ou contexte global)
      await saveUser(userData);

      // 5. Redirection 
      if (userType === "Patient") {
        navigation.replace('Accueil');
      }
      if (userType === "Diététicien") {
        navigation.replace('MenuDieteticien');
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription :', error);
      Alert("Une erreur s'est produite lors de l'inscription. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <Ionicons name="person-add-outline" size={25} color="#fff" style={styles.heroIcon} />
      </View>
      <View style={styles.form}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez ISI Diet et commencez votre suivi personnalisé.</Text>

        <Text style={styles.label}>Type d'utilisateur</Text>
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              userType === 'Patient' && styles.radioButtonActive,
            ]}
            onPress={() => setUserType('Patient')}
          >
            <Ionicons
              name={userType === 'Patient' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#815F9C"
            />
            <Text style={styles.radioLabel}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioButton,
              userType === 'Diététicien' && styles.radioButtonActive,
            ]}
            onPress={() => setUserType('Diététicien')}
          >
            <Ionicons
              name={userType === 'Diététicien' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color="#815F9C"
            />
            <Text style={styles.radioLabel}>Diététicien</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          style={styles.input}
          placeholderTextColor="#B9A9CC"
        />
        <TextInput
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
          style={styles.input}
          placeholderTextColor="#B9A9CC"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#B9A9CC"
        />
        <TextInput
          placeholder="Téléphone"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType="phone-pad"
          placeholderTextColor="#B9A9CC"
        />
        <TextInput
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          placeholderTextColor="#B9A9CC"
        />


        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>S'inscrire</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Déjà un compte ? <Text style={{ color: '#815F9C', fontWeight: 'bold' }}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F0F5',
  },
  header: {
    width: '100%',
    height: width * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    paddingHorizontal: 24,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#7D5F9B',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  label: {
    fontWeight: 'bold',
    color: '#815F9C',
    marginTop: 10,
    marginBottom: 2,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    justifyContent: 'center',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EAE3EC',
    marginHorizontal: 6,
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    backgroundColor: '#815F9C22',
    borderColor: '#815F9C',
  },
  radioLabel: {
    color: '#7D5F9B',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#EAE3EC',
    color: '#1E223D',
    width: '100%',
  },
  button: {
    marginVertical: 16,
    borderRadius: 18,
    paddingVertical: 14,
    width: '100%',
    backgroundColor: '#815F9C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#815F9C',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  link: {
    marginTop: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#7D5F9B',
    fontSize: 15,
    textAlign: 'center',
  },
});

export default SignUpScreen;