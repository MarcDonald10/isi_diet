import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { addDocumentUid, updateDocument, uploadFile } from '../../services/firebase/firebaseService';
import Header from '../components/Header';

const PATHO_INFOS = {
  'Diabète': "Importance des glucides à faible IG pour stabiliser la glycémie.",
  'Hypertension': "Limitez le sel et surveillez régulièrement votre tension artérielle.",
  'Obésité': "Privilégiez une alimentation équilibrée et une activité physique régulière.",
  'Cholestérol': "Réduisez les graisses saturées et augmentez les fibres.",
};

const OBJECTIFS = [
  'Perte de poids',
  'Stabilisation',
  'Prise de masse',
  'Amélioration forme',
  'Rééquilibrage alimentaire',
];

const ACTIVITE_LEVELS = ['Faible', 'Modérée', 'Forte'];

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// Composante Modal Personnalisée
const CustomModal = ({ visible, title, message, type = 'info', buttons, onClose }) => {
  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';
  const isOptions = type === 'options';

  const iconName = isSuccess ? 'checkmark-circle' : isError ? 'close-circle' : isWarning ? 'warning' : 'information-circle';
  const iconColor = isSuccess ? '#4CAF50' : isError ? '#F44336' : isWarning ? '#FF9800' : '#2196F3';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close Button */}
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {/* Icon */}
          {!isOptions && (
            <View style={styles.modalIconContainer}>
              <Ionicons name={iconName} size={48} color={iconColor} />
            </View>
          )}

          {/* Title */}
          <Text style={styles.modalTitle}>{title}</Text>

          {/* Message */}
          {message && <Text style={styles.modalMessage}>{message}</Text>}

          {/* Buttons */}
          <View style={styles.modalButtonsContainer}>
            {buttons ? (
              buttons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.modalButton,
                    btn.style === 'destructive' && styles.modalButtonDestructive,
                    btn.style === 'cancel' && styles.modalButtonCancel,
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      btn.style === 'destructive' && styles.modalButtonTextDestructive,
                      btn.style === 'cancel' && styles.modalButtonTextCancel,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity style={styles.modalButton} onPress={onClose}>
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileScreen() {
  const { user,refreshUser,  loading } = useAuth();
  const [profile, setProfile] = useState({
    age: user?.age || '',
    sexe: user?.sexe || '',
    poids: user?.poids || '',
    taille: user?.taille || '',
    activite: user?.activite || '',
    pathologies: user?.pathologies || [],
    objectifs: user?.objectif || '',
    photoUri: user?.photo || null,
    groupeSanguin: user?.groupeSanguin || '',
    allergies: user?.allergies || [],
    conditionsMedicales: user?.conditionsMedicales || [],
    medicaments: user?.medicaments || [],
  });
  const [newPatho, setNewPatho] = useState('');
  const [newAllergie, setNewAllergie] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newMedicament, setNewMedicament] = useState('');
  const [showPathoModal, setShowPathoModal] = useState(false);
  const [showAllergieModal, setShowAllergieModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showMedicamentModal, setShowMedicamentModal] = useState(false);
  const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);
  const [selectedObjectif, setSelectedObjectif] = useState(profile.objectifs);
  const [showObjectifMenu, setShowObjectifMenu] = useState(false);
  const [showActiviteMenu, setShowActiviteMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '', buttons: null });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const navigation = useNavigation();

  // Historique fictif
  const history = [
    { id: '1', date: '01/07/2025', dietitian: 'Dr. Dupont', advice: 'Réduire sucres rapides', type: 'consultation' },
    { id: '2', date: '15/06/2025', dietitian: 'Dr. Martin', advice: 'Augmenter fibres', type: 'suivi' },
    { id: '3', date: '01/06/2025', dietitian: 'Dr. Dupont', advice: 'Première consultation', type: 'consultation' },
  ];

  const objectifsHistory = [
    { id: 'a', objectif: 'Perte de 2 kg', periode: 'Juin-Juillet 2025', atteint: true },
    { id: 'b', objectif: 'Stabilisation', periode: 'Mai 2025', atteint: false },
    { id: 'c', objectif: 'Amélioration habitudes', periode: 'Avril 2025', atteint: true },
  ];

  // Calcul IMC et besoins caloriques
  const calculateIMC = () => {
    const poids = parseFloat(profile.poids) || 0;
    const tailleM = (parseFloat(profile.taille) || 0) / 100;
    return tailleM > 0 ? (poids / (tailleM * tailleM)).toFixed(1) : '--';
  };

  const getIMCCategory = (imc) => {
    const imcValue = parseFloat(imc);
    if (imcValue < 18.5) return { text: 'Insuffisance', color: '#FFB347' };
    if (imcValue < 25) return { text: 'Normal', color: '#4ECDC4' };
    if (imcValue < 30) return { text: 'Surpoids', color: '#FFB347' };
    return { text: 'Obésité', color: '#FF6B6B' };
  };

  const calculateBesoinsCal = () => {
    const poids = parseFloat(profile.poids) || 0;
    return poids > 0
      ? Math.round(22 * poids * (profile.activite === 'Forte' ? 1.5 : profile.activite === 'Modérée' ? 1.3 : 1.1))
      : '--';
  };

  // Gestion de la photo de profil
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setModal({
          visible: true,
          type: 'error',
          title: 'Permission refusée',
          message: 'Vous devez autoriser l\'accès à la bibliothèque de photos.',
          buttons: null,
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingPhoto(true);
        try {
          // Upload la photo vers Firebase Storage
          const fileName = `profile_${user.uid}_${Date.now()}.jpg`;
          const downloadURL = await uploadFile(`profile_photos/${user.uid}`, result.assets[0].uri, fileName);
          
          // Mise à jour de l'état local
          setProfile({ ...profile, photoUri: downloadURL });
          
          setModal({
            visible: true,
            type: 'success',
            title: 'Succès',
            message: 'Photo chargée avec succès',
            buttons: null,
          });
          
          console.log('Photo uploadée:', downloadURL);
        } catch (uploadError) {
          console.error('Erreur upload photo:', uploadError);
          setModal({
            visible: true,
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de charger la photo: ' + uploadError.message,
            buttons: null,
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'accéder à la galerie',
        buttons: null,
      });
    }
  };

  // Validation des données
  const validateProfile = () => {
    const errors = [];
    if (!profile.age || isNaN(parseInt(profile.age))) errors.push('Âge invalide');
    if (!profile.sexe) errors.push('Sexe requis');
    if (!profile.poids || isNaN(parseFloat(profile.poids))) errors.push('Poids invalide');
    if (!profile.taille || isNaN(parseFloat(profile.taille))) errors.push('Taille invalide');
    if (!profile.activite) errors.push('Niveau d\'activité requis');
    if (!profile.objectifs) errors.push('Objectif requis');
    return errors;
  };

  // Ajout/Suppression pathologie
  const addPatho = () => {
    if (newPatho && !profile.pathologies.includes(newPatho)) {
      setProfile({ ...profile, pathologies: [...profile.pathologies, newPatho] });
      setNewPatho('');
      setShowPathoModal(false);
    }
  };

  const removePatho = (p) => {
    setProfile({ ...profile, pathologies: profile.pathologies.filter(x => x !== p) });
  };

  const addAllergie = () => {
    if (newAllergie && !(profile.allergies || []).includes(newAllergie)) {
      setProfile({ ...profile, allergies: [...(profile.allergies || []), newAllergie] });
      setNewAllergie('');
      setShowAllergieModal(false);
    }
  };

  const removeAllergie = (allergie) => {
    setProfile({ ...profile, allergies: (profile.allergies || []).filter(x => x !== allergie) });
  };

  const addCondition = () => {
    if (newCondition && !(profile.conditionsMedicales || []).includes(newCondition)) {
      setProfile({ ...profile, conditionsMedicales: [...(profile.conditionsMedicales || []), newCondition] });
      setNewCondition('');
      setShowConditionModal(false);
    }
  };

  const removeCondition = (condition) => {
    setProfile({ ...profile, conditionsMedicales: (profile.conditionsMedicales || []).filter(x => x !== condition) });
  };

  const addMedicament = () => {
    if (newMedicament && !(profile.medicaments || []).includes(newMedicament)) {
      setProfile({ ...profile, medicaments: [...(profile.medicaments || []), newMedicament] });
      setNewMedicament('');
      setShowMedicamentModal(false);
    }
  };

  const removeMedicament = (medicament) => {
    setProfile({ ...profile, medicaments: (profile.medicaments || []).filter(x => x !== medicament) });
  };

  // Sauvegarde du profil
  const saveProfile = async () => {
    try {
      const errors = validateProfile();
      if (errors?.length > 0) {
        setModal({
          visible: true,
          type: 'error',
          title: 'Erreur',
          message: errors.join('\n'),
          buttons: null,
        });
        return;
      }

      setIsSaving(true);

      const formData = {
        age: parseInt(profile.age),
        sexe: profile.sexe,
        poids: parseFloat(profile.poids),
        taille: parseFloat(profile.taille),
        activite: profile.activite,
        pathologies: profile.pathologies,
        objectif: profile.objectifs,
        photo: profile.photoUri,
        type: 'Patient',
        updatedAt: Timestamp.now(),
        groupeSanguin: profile.groupeSanguin,
        allergies: profile.allergies,
        conditionsMedicales: profile.conditionsMedicales,
        medicaments: profile.medicaments,
      };

      await addDocumentUid('patients', user.uid, formData);
      await updateDocument('users', user.uid, formData);

      // Mise à jour en temps réel du contexte AuthContext
      refreshUser();

      setIsSaving(false);
      
      setModal({
        visible: true,
        type: 'success',
        title: 'Succès',
        message: 'Profil sauvegardé avec succès',
        buttons: null,
      });
    } catch (error) {
      setIsSaving(false);
      console.error('Erreur lors de la sauvegarde du profil:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la sauvegarde',
        buttons: null,
      });
    }
  };

  // Charger le profil au démarrage
  useEffect(() => {
    const loadProfile = async () => {
      try {

        if (user?.uid) {
          const userData = user;
          if (userData) {
            setProfile({
              age: userData.age?.toString() || '0',
              sexe: userData.sexe || 'null',
              poids: userData.poids?.toString() || '0',
              taille: userData.taille?.toString() || '0',
              activite: userData.activite || 'R.A.S',
              pathologies: userData.pathologies || [],
              objectifs: userData.objectif || 'R.A.S',
              photoUri: userData.photoUri || null,
              groupeSanguin: user?.groupeSanguin || '',
              allergies: user?.allergies || [],
              conditionsMedicales: user?.conditionsMedicales || [],
              medicaments: user?.medicaments || [],
            });
            setSelectedObjectif(userData.objectif || 'R.A.S');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      }
    };
    loadProfile();
  }, []);

  const imc = calculateIMC();
  const imcCategory = getIMCCategory(imc);

  console.log('Rendered ProfileScreen with profile:', profile);
  return (
    <>
      <Header
        userPhoto={profile.photoUri || "https://example.com/user-photo.jpg"}
        pageName={"Mon Profil"}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        notificationCount={3}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.container}>
          {/* Header avec photo */}
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.photoContainer} disabled={isUploadingPhoto}>
              {isUploadingPhoto ? (
                <View style={[styles.profileImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(129, 95, 156, 0.1)' }]}>
                  <ActivityIndicator size="large" color="#815F9C" />
                </View>
              ) : profile.photoUri ? (
                <Image source={{ uri: profile.photoUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Ionicons name="person" size={48} color="#B19CD9" />
                </View>
              )}
              {!isUploadingPhoto && (
                <View style={styles.editPhotoButton}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.title}>Mon Profil</Text>
            <Text style={styles.subtitle}>Gérez vos informations de santé</Text>
          </View>

          {/* Statistiques en cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#815F9C' }]}>
              <Ionicons name="calculator-outline" size={28} color="#fff" />
              <Text style={styles.statValue}>{imc}</Text>
              <Text style={styles.statLabel}>IMC</Text>
              <Text style={[styles.statCategory, { color: imcCategory.color }]}>
                {imcCategory.text}
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
              <Ionicons name="flame-outline" size={28} color="#fff" />
              <Text style={styles.statValue}>{calculateBesoinsCal()}</Text>
              <Text style={styles.statLabel}>kcal/jour</Text>
              <Text style={styles.statCategory}>Besoins</Text>
            </View>
          </View>

          {/* Section Infos générales */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="person-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Informations générales</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Âge</Text>
                <TextInput
                  style={styles.infoInput}
                  placeholder="Entrez votre âge"
                  keyboardType="numeric"
                  value={profile.age}
                  onChangeText={text => setProfile({ ...profile, age: text })}
                />
                <Text style={styles.infoUnit}>ans</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Sexe</Text>
                <TextInput
                  style={styles.infoInput}
                  placeholder="Entrez votre sexe"
                  value={profile.sexe}
                  onChangeText={text => setProfile({ ...profile, sexe: text })}
                />
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Poids</Text>
                <TextInput
                  style={styles.infoInput}
                  placeholder="Entrez votre poids"
                  keyboardType="numeric"
                  value={profile.poids}
                  onChangeText={text => setProfile({ ...profile, poids: text })}
                />
                <Text style={styles.infoUnit}>kg</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Taille</Text>
                <TextInput
                  style={styles.infoInput}
                  placeholder="Entrez votre taille"
                  keyboardType="numeric"
                  value={profile.taille}
                  onChangeText={text => setProfile({ ...profile, taille: text })}
                />
                <Text style={styles.infoUnit}>cm</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                <Ionicons name="walk-outline" size={16} color="#815F9C" /> Niveau d'activité
              </Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowActiviteMenu(!showActiviteMenu)}
              >
                <Text style={styles.selectButtonText}>{profile.activite}</Text>
                <Ionicons name={showActiviteMenu ? "chevron-up" : "chevron-down"} size={20} color="#815F9C" />
              </TouchableOpacity>
              {showActiviteMenu && (
                <View style={styles.dropdownMenu}>
                  {ACTIVITE_LEVELS?.map(level => (
                    <TouchableOpacity
                      key={level}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProfile({ ...profile, activite: level });
                        setShowActiviteMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{level}</Text>
                      {profile.activite === level && (
                        <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Section Objectifs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="trophy-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Objectif principal</Text>
            </View>

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.objectifSelectButton}
                onPress={() => setShowObjectifMenu(!showObjectifMenu)}
              >
                <View style={styles.objectifSelectContent}>
                  <Ionicons name="flag" size={20} color="#4ECDC4" />
                  <Text style={styles.objectifSelectText}>{selectedObjectif}</Text>
                </View>
                <Ionicons name={showObjectifMenu ? "chevron-up" : "chevron-down"} size={20} color="#815F9C" />
              </TouchableOpacity>
              {showObjectifMenu && (
                <View style={styles.dropdownMenu}>
                  {OBJECTIFS?.map(obj => (
                    <TouchableOpacity
                      key={obj}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedObjectif(obj);
                        setProfile({ ...profile, objectifs: obj });
                        setShowObjectifMenu(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{obj}</Text>
                      {selectedObjectif === obj && (
                        <Ionicons name="checkmark" size={20} color="#4ECDC4" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* <View style={styles.divider} /> */}

            {/* <Text style={styles.subsectionTitle}>Historique des objectifs</Text>
            {objectifsHistory.map(o => (
              <View key={o.id} style={styles.objectifHistoryItem}>
                <View style={[styles.objectifStatusIcon, o.atteint && styles.objectifStatusIconSuccess]}>
                  <Ionicons 
                    name={o.atteint ? "checkmark" : "time-outline"} 
                    size={16} 
                    color={o.atteint ? "#4ECDC4" : "#B19CD9"} 
                  />
                </View>
                <View style={styles.objectifHistoryContent}>
                  <Text style={styles.objectifHistoryText}>{o.objectif}</Text>
                  <Text style={styles.objectifHistoryPeriod}>{o.periode}</Text>
                </View>
                {o.atteint && (
                  <View style={styles.objectifBadge}>
                    <Text style={styles.objectifBadgeText}>Atteint</Text>
                  </View>
                )}
              </View>
            ))} */}
          </View>

          {/* Section Pathologies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="medkit-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Pathologies</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowPathoModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {profile?.pathologies?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#B19CD9" />
                <Text style={styles.emptyStateText}>Aucune pathologie déclarée</Text>
              </View>
            ) : (
              <>
                {profile?.pathologies?.map((p) => (
                  <View key={p}>
                    <View style={styles.pathoItem}>
                      <View style={styles.pathoIconContainer}>
                        <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                      </View>
                      <View style={styles.pathoContent}>
                        <Text style={styles.pathoText}>{p}</Text>
                        {PATHO_INFOS[p] && (
                          <Text style={styles.pathoInfo}>{PATHO_INFOS[p]}</Text>
                        )}
                      </View>
                      <TouchableOpacity onPress={() => removePatho(p)} style={styles.pathoRemove}>
                        <Ionicons name="close" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Modal ajout pathologie */}
          <Modal visible={showPathoModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ajouter une pathologie</Text>
                  <TouchableOpacity onPress={() => setShowPathoModal(false)}>
                    <Ionicons name="close" size={24} color="#815F9C" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nom de la pathologie"
                  value={newPatho}
                  onChangeText={setNewPatho}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowPathoModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={addPatho}
                  >
                    <Text style={styles.modalAddText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Section Groupe Sanguin */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="water-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Groupe Sanguin</Text>
            </View>

            <TouchableOpacity
              style={styles.bloodGroupButton}
              onPress={() => setShowBloodGroupModal(true)}
            >
              <Ionicons name="crop-outline" size={24} color="#E53935" />
              <Text style={styles.bloodGroupText}>
                {profile.groupeSanguin ? profile.groupeSanguin : 'Sélectionner votre groupe sanguin'}
              </Text>
              <Ionicons name="chevron-down-outline" size={20} color="#999" />
            </TouchableOpacity>

            {/* Modal sélection groupe sanguin */}
            <Modal visible={showBloodGroupModal} transparent animationType="fade">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Sélectionner votre groupe sanguin</Text>
                    <TouchableOpacity onPress={() => setShowBloodGroupModal(false)}>
                      <Ionicons name="close" size={24} color="#815F9C" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.bloodGroupGrid}>
                    {BLOOD_GROUPS?.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.bloodGroupOption,
                          profile.groupeSanguin === group && styles.bloodGroupOptionSelected
                        ]}
                        onPress={() => {
                          setProfile({ ...profile, groupeSanguin: group });
                          setShowBloodGroupModal(false);
                        }}
                      >
                        <Text style={[
                          styles.bloodGroupOptionText,
                          profile.groupeSanguin === group && styles.bloodGroupOptionTextSelected
                        ]}>
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </Modal>
          </View>

          {/* Section Allergies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="warning-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Allergies</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAllergieModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {profile?.allergies?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#B19CD9" />
                <Text style={styles.emptyStateText}>Aucune allergie déclarée</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: '#FFE0E0' }]}>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Allergie</Text>
                  <Text style={styles.tableHeaderText}>Action</Text>
                </View>
                {profile?.allergies?.map((allergie, idx) => (
                  <View key={idx} style={[styles.tableRow, { borderLeftColor: '#E53935' }]}>
                    <View style={styles.itemContent}>
                      <Ionicons name="alert-circle" size={18} color="#E53935" />
                      <Text style={styles.itemText}>{allergie}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeAllergie(allergie)}>
                      <Ionicons name="trash-outline" size={18} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Modal ajout allergie */}
          <Modal visible={showAllergieModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ajouter une allergie</Text>
                  <TouchableOpacity onPress={() => setShowAllergieModal(false)}>
                    <Ionicons name="close" size={24} color="#815F9C" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nom de l'allergie (ex: arachides, latex)"
                  value={newAllergie}
                  onChangeText={setNewAllergie}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowAllergieModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={addAllergie}
                  >
                    <Text style={styles.modalAddText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Section Conditions Médicales */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="pulse-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Conditions Médicales</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowConditionModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {profile?.conditionsMedicales?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#B19CD9" />
                <Text style={styles.emptyStateText}>Aucune condition médicale déclarée</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Condition</Text>
                  <Text style={styles.tableHeaderText}>Action</Text>
                </View>
                {profile?.conditionsMedicales?.map((condition, idx) => (
                  <View key={idx} style={[styles.tableRow, { borderLeftColor: '#1976D2' }]}>
                    <View style={styles.itemContent}>
                      <Ionicons name="pulse" size={18} color="#1976D2" />
                      <Text style={styles.itemText}>{condition}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeCondition(condition)}>
                      <Ionicons name="trash-outline" size={18} color="#1976D2" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Modal ajout condition médicale */}
          <Modal visible={showConditionModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ajouter une condition médicale</Text>
                  <TouchableOpacity onPress={() => setShowConditionModal(false)}>
                    <Ionicons name="close" size={24} color="#815F9C" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Description de la condition"
                  value={newCondition}
                  onChangeText={setNewCondition}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowConditionModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={addCondition}
                  >
                    <Text style={styles.modalAddText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Section Médicaments */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="medkit-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Médicaments</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowMedicamentModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {profile?.medicaments?.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color="#B19CD9" />
                <Text style={styles.emptyStateText}>Aucun médicament déclaré</Text>
              </View>
            ) : (
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: '#F3E5F5' }]}>
                  <Text style={[styles.tableHeaderText, { flex: 1 }]}>Médicament</Text>
                  <Text style={styles.tableHeaderText}>Action</Text>
                </View>
                {profile?.medicaments?.map((medicament, idx) => (
                  <View key={idx} style={[styles.tableRow, { borderLeftColor: '#7B1FA2' }]}>
                    <View style={styles.itemContent}>
                      <Ionicons name="checkmark-circle" size={18} color="#7B1FA2" />
                      <Text style={styles.itemText}>{medicament}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeMedicament(medicament)}>
                      <Ionicons name="trash-outline" size={18} color="#7B1FA2" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Modal ajout médicament */}
          <Modal visible={showMedicamentModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Ajouter un médicament</Text>
                  <TouchableOpacity onPress={() => setShowMedicamentModal(false)}>
                    <Ionicons name="close" size={24} color="#815F9C" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Nom du médicament (ex: Ibuprofène 200mg)"
                  value={newMedicament}
                  onChangeText={setNewMedicament}
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowMedicamentModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalAddButton}
                    onPress={addMedicament}
                  >
                    <Text style={styles.modalAddText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Section Historique */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={20} color="#815F9C" />
              </View>
              <Text style={styles.sectionTitle}>Historique des consultations</Text>
            </View>

            {history?.map((item) => (
              <TouchableOpacity key={item.id} style={styles.historyItem}>
                <View style={[
                  styles.historyIconContainer,
                  { backgroundColor: item.type === 'consultation' ? '#4ECDC4' : '#FFB347' }
                ]}>
                  <Ionicons
                    name={item.type === 'consultation' ? "calendar" : "document-text"}
                    size={20}
                    color="#fff"
                  />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <View style={styles.historyTypeBadge}>
                      <Text style={styles.historyTypeText}>
                        {item.type === 'consultation' ? 'Consultation' : 'Suivi'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.historyDietitian}>{item.dietitian}</Text>
                  <Text style={styles.historyAdvice}>{item.advice}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#B19CD9" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Bouton sauvegarde */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={saveProfile}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.saveButtonText}>Enregistrement...</Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>Sauvegarder les modifications</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Modal de chargement */}
          <Modal
            transparent
            animationType="fade"
            visible={isSaving}
            onRequestClose={() => { }}
          >
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#815F9C" />
                <Text style={styles.loadingText}>Enregistrement en cours...</Text>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>

      {/* Custom Modal for Alerts */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        buttons={modal.buttons}
        onClose={() => setModal({ ...modal, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F6F0F5'
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F6F0F5'
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#815F9C', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  placeholderPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F6F0F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E8D9F0',
    borderStyle: 'dashed'
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#815F9C',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#815F9C',
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 4
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600'
  },
  statCategory: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#815F9C', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 3 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C'
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
    justifyContent: 'center'
  },
  infoGrid: {
    gap: 12,
    marginBottom: 16
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE3EC'
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7D5F9B',
    width: 60
  },
  infoInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
    marginLeft: 12
  },
  infoUnit: {
    fontSize: 14,
    color: '#7D5F9B',
    marginLeft: 8
  },
  inputContainer: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#815F9C',
    marginBottom: 8
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE3EC'
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E223D'
  },
  objectifSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4ECDC4'
  },
  objectifSelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  objectifSelectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D'
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EAE3EC',
    overflow: 'hidden'
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F6F0F5'
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1E223D'
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE3EC',
    marginVertical: 16
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7D5F9B',
    marginBottom: 12
  },
  objectifHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8
  },
  objectifStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#B19CD9'
  },
  objectifStatusIconSuccess: {
    borderColor: '#4ECDC4'
  },
  objectifHistoryContent: {
    flex: 1
  },
  objectifHistoryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E223D',
    marginBottom: 4
  },
  objectifHistoryPeriod: {
    fontSize: 13,
    color: '#7D5F9B'
  },
  objectifBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  objectifBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 12
  },
  pathoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5'
  },
  pathoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  pathoContent: {
    flex: 1
  },
  pathoText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E223D',
    marginBottom: 4
  },
  pathoInfo: {
    fontSize: 13,
    color: '#7D5F9B',
    lineHeight: 18
  },
  pathoRemove: {
    padding: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#815F9C'
  },
  modalInput: {
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAE3EC'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7D5F9B'
  },
  modalAddButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  historyContent: {
    flex: 1
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7D5F9B'
  },
  historyTypeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  historyTypeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#815F9C'
  },
  historyDietitian: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E223D',
    marginBottom: 4
  },
  historyAdvice: {
    fontSize: 13,
    color: '#7D5F9B',
    lineHeight: 18
  },
  // Styles pour le groupe sanguin
  bloodGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    gap: 12,
  },
  bloodGroupText: {
    flex: 1,
    fontSize: 15,
    color: '#1E223D',
    fontWeight: '500',
  },
  bloodGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
    justifyContent: 'space-around',
  },
  bloodGroupOption: {
    width: '22%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  bloodGroupOptionSelected: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  bloodGroupOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  bloodGroupOptionTextSelected: {
    color: '#fff',
  },
  // Styles pour les tableaux
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    width: 50,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderLeftWidth: 4,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#815F9C',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#815F9C', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#A88BAE'
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
    }),
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  modalIconContainer: {
    marginVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    backgroundColor: '#815F9C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonDestructive: {
    backgroundColor: '#F44336',
  },
  modalButtonCancel: {
    backgroundColor: '#E8E8E8',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextDestructive: {
    color: '#fff',
  },
  modalButtonTextCancel: {
    color: '#333',
  },
});