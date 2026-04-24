import AsyncStorage from '@react-native-async-storage/async-storage';

// Types d'utilisateurs avec leurs valeurs numériques
const USER_TYPES = {
  PATIENT: 1,
  DIETETICIEN: 2,
};

// Clé pour stocker les données utilisateur
const USER_STORAGE_KEY = '@user_data';

// Enregistrer un utilisateur
const saveUser = async (userData) => {
  try {
    if (!Object.values(USER_TYPES).includes(userData.type)) {
      throw new Error('Type d\'utilisateur invalide');
    }
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    console.log('Utilisateur enregistré avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'utilisateur:', error);
    return false;
  }
};

// Récupérer l'utilisateur
const getUser = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    // console.log('Utilisateur récupéré:', userData);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

// Modifier l'utilisateur
const updateUser = async (updatedData) => {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      throw new Error('Aucun utilisateur trouvé');
    }
    if (updatedData.type && !Object.values(USER_TYPES).includes(updatedData.type)) {
      throw new Error('Type d\'utilisateur invalide');
    }
    const newUserData = { ...currentUser, ...updatedData };
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUserData));
    console.log('Utilisateur modifié avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la modification de l\'utilisateur:', error);
    return false;
  }
};

// Supprimer l'utilisateur
const deleteUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    console.log('Utilisateur supprimé avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return false;
  }
};

// Rediriger vers l'interface appropriée en fonction de type
const redirectToInterface = async (navigation) => {
  try {
    const user = await getUser();
    console.log('Utilisateur récupéré pour redirection:', user);
    if (!user) {
    //   navigation.replace('Startup');
      return;
    }
    switch (user.type) {
      case USER_TYPES.PATIENT:
        navigation.replace('Accueil');
        break;
      case USER_TYPES.DIETETICIEN:
        navigation.replace('Accueil');
        break;
    //   default:
    //     navigation.replace('Login');
    }
  } catch (error) {
    console.error('Erreur lors de la redirection:', error);
    navigation.replace('Login');
  }
};

// Convertir la valeur numérique de type en nom lisible pour l'affichage
const getUserTypeLabel = (type) => {
  switch (type) {
    case USER_TYPES.PATIENT:
      return 'PATIENT';
    case USER_TYPES.DIETETICIEN:
      return 'DIETETICIEN';
    default:
      return 'Inconnu';
  }
};

export { saveUser, getUser, updateUser, deleteUser, redirectToInterface, getUserTypeLabel, USER_TYPES };