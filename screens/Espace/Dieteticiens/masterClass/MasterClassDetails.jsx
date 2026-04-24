import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { db } from '../../../../services/firebase/firebaseConfig';
import { useAuth } from '../../../../contexts/AuthContext';

const MasterClassDetails = ({ navigation, route }) => {
  const { masterClassId, title } = route.params;
  const { user } = useAuth();
  
  // Données détaillées des master classes
  const [masterClassData, setMasterClassData] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger les données depuis Firebase
  useEffect(() => {
    const fetchMasterClassData = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'masterClasses', masterClassId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setMasterClassData({
            id: docSnap.id,
            ...data,
            status: data.date && new Date(data.date) > new Date() ? 'upcoming' : 'completed',
            currentParticipants: data.participants?.length || 0,
            instructorInfo: {
              name: data.dieticianName || 'Diététicien',
              title: 'Diététicien Spécialiste',
              experience: '5+ ans d\'expérience',
              specialization: data.category || 'Nutrition',
              bio: 'Expert en nutrition et bien-être',
              email: 'contact@diet.com',
            }
          });
        } else {
          Alert.alert('Erreur', 'Master class non trouvée');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        Alert.alert('Erreur', 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterClassData();
  }, [masterClassId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const handleEnrollment = () => {
    if (isEnrolled) {
      Alert.alert(
        'Désinscription',
        'Êtes-vous sûr de vouloir vous désinscrire de cette master class ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Se désinscrire', 
            style: 'destructive',
            onPress: () => setIsEnrolled(false)
          }
        ]
      );
    } else {
      Alert.alert(
        'Inscription réussie !',
        'Vous êtes maintenant inscrit à cette master class. Vous recevrez un email de confirmation.',
        [{ text: 'OK', onPress: () => setIsEnrolled(true) }]
      );
    }
  };

  const handleJoinMeeting = () => {
    if (masterClassData?.meetingLink) {
      Linking.openURL(masterClassData.meetingLink);
    }
  };

  const handleContactInstructor = () => {
    navigation.navigate('ChatScreen', { 
      dieticienId: masterClassData?.dieticianId, 
      dieticienName: masterClassData?.dieticianName 
    });
    
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Master Class</Text>
        </View>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.errorText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  if (!masterClassData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Master Class</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Master class non trouvée</Text>
        </View>
      </View>
    );
  }

  const isUpcoming = masterClassData.status === 'upcoming';
  const progressPercentage = (masterClassData.currentParticipants / masterClassData.maxParticipants) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {masterClassData.title}
        </Text>
        {masterClassData?.dieticianId != user?.uid && (
         <TouchableOpacity onPress={handleContactInstructor}>
          <Ionicons name="chatbubble-outline" size={wp('6%')} color="#F4C430" />
        </TouchableOpacity>
        )}
        
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Image et infos principales */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: masterClassData?.image }}
            style={styles.heroImage}
          />
          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusBadge,
              isUpcoming ? styles.statusUpcoming : styles.statusCompleted
            ]}>
              <Text style={styles.statusText}>
                {isUpcoming ? 'À venir' : 'Terminé'}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations principales */}
        <View style={styles.mainInfoSection}>
          <Text style={styles.title}>{masterClassData.title}</Text>
          <Text style={styles.category}>{masterClassData.category || masterClassData.specialization || 'Master Class'}</Text>
          
          <View style={styles.infoGrid}>
            {masterClassData.date && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={wp('5%')} color="#4A2F7D" />
                <Text style={styles.infoText}>{masterClassData.date}</Text>
              </View>
            )}
            {masterClassData.time && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={wp('5%')} color="#4A2F7D" />
                <Text style={styles.infoText}>{masterClassData.time}</Text>
              </View>
            )}
            {masterClassData.duration && (
              <View style={styles.infoItem}>
                <Ionicons name="hourglass-outline" size={wp('5%')} color="#4A2F7D" />
                <Text style={styles.infoText}>{masterClassData.duration}</Text>
              </View>
            )}
            {masterClassData.location && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={wp('5%')} color="#4A2F7D" />
                <Text style={styles.infoText}>{masterClassData.location}</Text>
              </View>
            )}
          </View>

          {/* Prix et participants */}
          <View style={styles.priceSection}>
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Prix</Text>
              <Text style={styles.priceValue}>{masterClassData.price || 'Gratuit'} F CFA</Text>
            </View>
            <View style={styles.participantsInfo}>
              <Text style={styles.participantsText}>
                {masterClassData.currentParticipants}/{masterClassData.maxParticipants || '?'} participants
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        {masterClassData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{masterClassData.description}</Text>
          </View>
        )}

        {/* Objectifs */}
        {masterClassData.objectives && masterClassData.objectives.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs d'apprentissage</Text>
            {masterClassData.objectives.map((objective, index) => (
              <View key={index} style={styles.objectiveItem}>
                <Ionicons name="checkmark-circle-outline" size={wp('5%')} color="#4CAF50" />
                <Text style={styles.objectiveText}>{objective}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Informations instructeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos de l'instructeur</Text>
          <View style={styles.instructorCard}>
            {masterClassData.instructorInfo?.image && (
              <Image
                source={{ uri: masterClassData.instructorInfo.image }}
                style={styles.instructorImage}
              />
            )}
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>{masterClassData.instructorInfo.name}</Text>
              <Text style={styles.instructorTitle}>{masterClassData.instructorInfo.title}</Text>
              <Text style={styles.instructorExperience}>{masterClassData.instructorInfo.experience}</Text>
              <Text style={styles.instructorSpecialization}>{masterClassData.instructorInfo.specialization}</Text>
            </View>
          </View>
          <Text style={styles.instructorBio}>{masterClassData.instructorInfo.bio}</Text>
          
          <View style={styles.instructorDetails}>
            {masterClassData.instructorInfo?.education && (
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={wp('4%')} color="#4A2F7D" />
                <Text style={styles.detailText}>{masterClassData.instructorInfo.education}</Text>
              </View>
            )}
            {masterClassData.instructorInfo?.certifications && masterClassData.instructorInfo.certifications.length > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="ribbon-outline" size={wp('4%')} color="#4A2F7D" />
                <Text style={styles.detailText}>
                  {masterClassData.instructorInfo.certifications.join(', ')}
                </Text>
              </View>
            )}
            {masterClassData.instructorInfo?.languages && masterClassData.instructorInfo.languages.length > 0 && (
              <View style={styles.detailItem}>
                <Ionicons name="language-outline" size={wp('4%')} color="#4A2F7D" />
                <Text style={styles.detailText}>
                  {masterClassData.instructorInfo.languages.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Programme */}
        {masterClassData.agenda && masterClassData.agenda.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Programme</Text>
            {masterClassData.agenda.map((item, index) => (
              <View key={index} style={styles.agendaItem}>
                <Text style={styles.agendaTime}>{item.time}</Text>
                <Text style={styles.agendaTopic}>{item.topic}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Matériel fourni */}
        {masterClassData.materials && masterClassData.materials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matériel inclus</Text>
            {masterClassData.materials.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <Ionicons name="document-outline" size={wp('4%')} color="#4A2F7D" />
                <Text style={styles.materialText}>{material}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Informations de connexion */}
        {isUpcoming && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de connexion</Text>
            <View style={styles.meetingInfo}>
              <View style={styles.meetingItem}>
                <Text style={styles.meetingLabel}>Lien de connexion :</Text>
                <TouchableOpacity onPress={handleJoinMeeting}>
                  <Text style={styles.meetingLink}>{masterClassData.meetingLink}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.meetingItem}>
                <Text style={styles.meetingLabel}>ID de réunion :</Text>
                <Text style={styles.meetingValue}>{masterClassData.meetingId}</Text>
              </View>
              <View style={styles.meetingItem}>
                <Text style={styles.meetingLabel}>Code d'accès :</Text>
                <Text style={styles.meetingValue}>{masterClassData.passcode}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Prérequis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prérequis</Text>
          <Text style={styles.prerequisitesText}>{masterClassData.prerequisites}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Actions en bas */}
      {isUpcoming && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={() => Alert.alert('Partager', 'Fonctionnalité à venir')}
          >
            <Ionicons name="share-outline" size={wp('6%')} color="#4A2F7D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.enrollButton,
              isEnrolled && styles.enrolledButton
            ]}
            onPress={handleEnrollment}
          >
            <Ionicons 
              name={isEnrolled ? "checkmark-outline" : "add-outline"} 
              size={wp('5%')} 
              color="#fff" 
            />
            <Text style={styles.enrollButtonText}>
              {isEnrolled ? 'Inscrit' : 'S\'inscrire'}
            </Text>
          </TouchableOpacity>
          {isEnrolled && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleJoinMeeting}
            >
              <Ionicons name="videocam-outline" size={wp('6%')} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    paddingTop: hp('5%'),
    backgroundColor: '#4A2F7D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: wp('4%'),
  },
  scrollContainer: {
    flex: 1,
  },
  heroSection: {
    position: 'relative',
    height: hp('25%'),
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusOverlay: {
    position: 'absolute',
    top: wp('4%'),
    right: wp('4%'),
  },
  statusBadge: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('0.8%'),
    borderRadius: 20,
  },
  statusUpcoming: {
    backgroundColor: '#4CAF50',
  },
  statusCompleted: {
    backgroundColor: '#666',
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: wp('3.5%'),
  },
  mainInfoSection: {
    backgroundColor: '#fff',
    padding: wp('5%'),
    marginTop: -wp('8%'),
    marginHorizontal: wp('4%'),
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  title: {
    fontSize: wp('6%'),
    fontWeight: '800',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  category: {
    fontSize: wp('4%'),
    color: '#4A2F7D',
    fontWeight: '600',
    marginBottom: hp('2%'),
  },
  infoGrid: {
    marginBottom: hp('2%'),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  infoText: {
    fontSize: wp('4%'),
    color: '#333',
    marginLeft: wp('3%'),
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: hp('2%'),
    borderTopWidth: 1,
    borderTopColor: '#E6E4F0',
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  priceValue: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: '#4A2F7D',
  },
  participantsInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  participantsText: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('0.5%'),
  },
  progressBar: {
    width: wp('25%'),
    height: hp('0.8%'),
    backgroundColor: '#E6E4F0',
    borderRadius: hp('0.4%'),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: hp('0.4%'),
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: wp('4%'),
    marginTop: hp('2%'),
    padding: wp('5%'),
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#4A2F7D',
    marginBottom: hp('1.5%'),
  },
  description: {
    fontSize: wp('4%'),
    color: '#333',
    lineHeight: wp('6%'),
    textAlign: 'justify',
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  objectiveText: {
    fontSize: wp('4%'),
    color: '#333',
    marginLeft: wp('3%'),
    flex: 1,
    lineHeight: wp('5.5%'),
  },
  instructorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  instructorImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    marginRight: wp('4%'),
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp('0.5%'),
  },
  instructorTitle: {
    fontSize: wp('4%'),
    color: '#4A2F7D',
    fontWeight: '600',
    marginBottom: hp('0.3%'),
  },
  instructorExperience: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('0.3%'),
  },
  instructorSpecialization: {
    fontSize: wp('3.5%'),
    color: '#666',
    fontStyle: 'italic',
  },
  instructorBio: {
    fontSize: wp('4%'),
    color: '#333',
    lineHeight: wp('6%'),
    marginBottom: hp('2%'),
    textAlign: 'justify',
  },
  instructorDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E6E4F0',
    paddingTop: hp('1.5%'),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp('1%'),
  },
  detailText: {
    fontSize: wp('3.5%'),
    color: '#333',
    marginLeft: wp('2%'),
    flex: 1,
    lineHeight: wp('5%'),
  },
  agendaItem: {
    flexDirection: 'row',
    marginBottom: hp('1.5%'),
    paddingBottom: hp('1.5%'),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  agendaTime: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#4A2F7D',
    width: wp('25%'),
  },
  agendaTopic: {
    fontSize: wp('4%'),
    color: '#333',
    flex: 1,
    lineHeight: wp('5.5%'),
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  materialText: {
    fontSize: wp('4%'),
    color: '#333',
    marginLeft: wp('3%'),
    flex: 1,
  },
  meetingInfo: {
    backgroundColor: '#F8F7FC',
    padding: wp('4%'),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  meetingItem: {
    marginBottom: hp('1%'),
  },
  meetingLabel: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#4A2F7D',
    marginBottom: hp('0.3%'),
  },
  meetingLink: {
    fontSize: wp('3.5%'),
    color: '#0066CC',
    textDecorationLine: 'underline',
  },
  meetingValue: {
    fontSize: wp('4%'),
    color: '#333',
    fontFamily: 'monospace',
    backgroundColor: '#fff',
  }
})

export default MasterClassDetails