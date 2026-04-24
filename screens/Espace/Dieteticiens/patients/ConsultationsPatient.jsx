import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDocumentById, getDocumentsByConditions } from '../../../../services/firebase/firebaseService';
import { useAuth } from '../../../../contexts/AuthContext';

const EXAMPLE_PATIENT_DATA = {
  personalInfo: {
    patientName: 'Marie Dubois',
    patientPhoto: 'https://randomuser.me/api/portraits/women/1.jpg',
    age: 35,
    gender: 'Féminin',
    phone: '+33 6 12 34 56 78',
    email: 'marie.dubois@email.com'
  },
  medicalInfo: {
    weight: '68 kg',
    height: '165 cm',
    bmi: '25.0',
    bloodType: 'A+',
    allergies: ['Arachides', 'Lactose'],
    conditions: ['Diabète Type 2', 'Hypertension légère'],
    medications: ['Metformine 500mg', 'Lisinopril 10mg']
  },
  nutritionalInfo: {
    objective: 'Perte de poids - 10kg',
    targetWeight: '58 kg',
    dietaryRestrictions: ['Sans lactose', 'Faible en glucides'],
    mealPreferences: ['Végétarien', 'Sans gluten'],
    currentCalories: '2200 kcal/jour',
    targetCalories: '1800 kcal/jour'
  },
  progressInfo: {
    startDate: '01 Juin 2023',
    initialWeight: '73 kg',
    currentWeight: '68 kg',
    weightLoss: '-5 kg',
    nextGoal: 'Atteindre 65kg d\'ici Décembre 2023'
  },
  consultationHistory: {
    lastVisit: '15 Sept 2023',
    nextVisit: '15 Oct 2023',
    totalConsultations: 4,
    history: [
      {
        id: 1,
        date: '15 Sept 2023',
        weight: '68 kg',
        bmi: '25.0',
        notes: 'Progrès constant, motivation maintenue. Patient respecte bien le plan alimentaire.',
        prescription: 'Continuer le régime actuel, augmenter légèrement l\'activité physique',
        dietPlan: 'Plan faible en glucides maintenu',
        nextObjective: 'Perdre 2kg supplémentaires'
      },
      {
        id: 2,
        date: '15 Août 2023',
        weight: '69.5 kg',
        bmi: '25.5',
        notes: 'Difficulté avec les repas du soir, tendance au grignotage. Stress professionnel évoqué.',
        prescription: 'Ajustement du plan alimentaire soirée, collations saines proposées',
        dietPlan: 'Introduction de collations protéinées',
        nextObjective: 'Stabiliser le poids et réduire grignotage'
      },
      {
        id: 3,
        date: '15 Juillet 2023',
        weight: '71 kg',
        bmi: '26.1',
        notes: 'Bonne adhésion au régime, patient motivé et positif.',
        prescription: 'Maintenir le plan actuel, introduire plus de légumes',
        dietPlan: 'Régime méditerranéen adapté',
        nextObjective: 'Atteindre 69kg'
      },
      {
        id: 4,
        date: '01 Juin 2023',
        weight: '73 kg',
        bmi: '26.8',
        notes: 'Première consultation. Patient motivé pour perdre du poids. Antécédents de diabète.',
        prescription: 'Mise en place d\'un régime faible en glucides, suivi mensuel',
        dietPlan: 'Plan initial - 1800 kcal/jour',
        nextObjective: 'Perdre 2-3kg premier mois'
      }
    ]
  }
};

const ConsultationsPatient = ({ navigation, route }) => {
  const { patient } = route.params;
  const { user, loading } = useAuth();
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [patientInfos, setPatientInfos] = useState([]);
  const [patientInfoModal, setPatientInfoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const consultationInfo = EXAMPLE_PATIENT_DATA;

  const renderConsultationDetailModal = () => {

    const poids = parseFloat(selectedConsultation?.poids);
    const taille = parseFloat(selectedConsultation?.taille) / 100; // cm → m

    const imc = parseInt((poids / (taille * taille)).toFixed(1));

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedConsultation !== null}
        onRequestClose={() => setSelectedConsultation(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détail de la consultation</Text>
              <TouchableOpacity onPress={() => setSelectedConsultation(null)}>
                <Ionicons name="close" size={24} color="#815F9C" />
              </TouchableOpacity>
            </View>

            {selectedConsultation && (
              <ScrollView>
                <View style={styles.detailSection}>
                  <View style={styles.detailHeader}>
                    <View>
                      <Text style={styles.detailDate}>{selectedConsultation.date}</Text>
                      <Text style={styles.detailSubtitle}>Consultation n°{selectedConsultation.id}</Text>
                    </View>
                    <View style={styles.detailMetrics}>
                      <Text style={styles.metricValue}>{selectedConsultation.poids} kg</Text>
                      <Text style={styles.metricLabel}>IMC: {imc || '--'} </Text>
                    </View>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Ionicons name="clipboard-outline" size={20} color="#815F9C" />
                      <Text style={styles.detailCardTitle}>Notes de consultation</Text>
                    </View>
                    <Text style={styles.detailText}>{selectedConsultation.notes}</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Ionicons name="nutrition-outline" size={20} color="#815F9C" />
                      <Text style={styles.detailCardTitle}>Plan diététique</Text>
                    </View>
                    <Text style={styles.detailText}>{selectedConsultation.planDiet}</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text-outline" size={20} color="#815F9C" />
                      <Text style={styles.detailCardTitle}>Prescription</Text>
                    </View>
                    <Text style={styles.detailText}>{selectedConsultation.prescription}</Text>
                  </View>

                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Ionicons name="flag-outline" size={20} color="#815F9C" />
                      <Text style={styles.detailCardTitle}>Objectif suivant</Text>
                    </View>
                    <Text style={styles.detailText}>{selectedConsultation.prochainObjectif}</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    )
  };

  const renderPatientInfoModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={patientInfoModal}
      onRequestClose={() => setPatientInfoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dossier Complet</Text>
            <TouchableOpacity onPress={() => setPatientInfoModal(false)}>
              <Ionicons name="close" size={24} color="#815F9C" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoSection}>

            {patient?.photoUri ? (
              <Image source={{ uri: patient.photoUri }} style={styles.modalPatientPhoto} />
            ) : (
              <View style={[styles.modalPatientPhoto, { backgroundColor: '#EAE3EC', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person-circle-outline" size={40} color="#815F9C" />
              </View>
            )}

            <Text style={styles.modalPatientName}>{patient?.nom + ' ' + patient?.prenom}</Text>

            <View style={styles.quickInfoGrid}>
              <QuickInfo icon="person-outline" label="Âge" value={`${patient?.age} ans`} />
              <QuickInfo icon="call-outline" label="Téléphone" value={patient?.phone} />
              <QuickInfo icon="mail-outline" label="Email" value={patient?.email} />
              <QuickInfo icon="water-outline" label="Groupe" value={patientInfos?.bloodType} />
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Données Médicales</Text>
            <View style={styles.medicalGrid}>
              <MedicalItem label="Poids" value={patientInfos?.poidsActuel || patientInfos?.poids} />
              <MedicalItem label="Taille" value={patientInfos?.tailleActuel || patientInfos?.taille} />
              <MedicalItem label="IMC" value={calculerIMC(patientInfos?.poidsActuel || patientInfos?.poids, patientInfos?.tailleActuel || patientInfos?.taille)} />
            </View>

            {patientInfos?.allergies && (
              <InfoBlock
                icon="warning-outline"
                title="Allergies"
                items={patientInfos.allergies}
                color="#FF6B6B"
              />
            )}

            {patientInfos?.conditions && (
              <InfoBlock
                icon="medical-outline"
                title="Conditions"
                items={patientInfos.conditions}
                color="#4ECDC4"
              />
            )}

            {patientInfos?.medications && (

              <InfoBlock
                icon="fitness-outline"
                title="Médicaments"
                items={patientInfos.medications}
                color="#95E1D3"
              />
            )}
          </View>

          {/* <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Objectifs Nutritionnels</Text>
            <View style={styles.objectiveMainCard}>
              <Text style={styles.objectiveMainText}>{patientInfos?.objectifActuel || patientInfos?.objectif}</Text>
              <View style={styles.objectiveMetrics}>
                <View style={styles.objectiveMetric}>
                  <Text style={styles.objectiveMetricValue}>{consultationInfo.nutritionalInfo?.targetWeight}</Text>
                  <Text style={styles.objectiveMetricLabel}>Objectif</Text>
                </View>
                <View style={styles.objectiveMetric}>
                  <Text style={styles.objectiveMetricValue}>{consultationInfo.nutritionalInfo?.targetCalories}</Text>
                  <Text style={styles.objectiveMetricLabel}>Calories cibles</Text>
                </View>
              </View>
            </View>

            <InfoBlock
              icon="restaurant-outline"
              title="Restrictions"
              items={consultationInfo.nutritionalInfo.dietaryRestrictions}
              color="#FFB347"
            />
            <InfoBlock
              icon="heart-outline"
              title="Préférences"
              items={consultationInfo.nutritionalInfo.mealPreferences}
              color="#B19CD9"
            />
          </View> */}
        </ScrollView>
      </View>
    </Modal>
  );

  useEffect(() => {
    const historyConsultations = async () => {
      try {
        setIsLoading(true);
        const conditionsHistory = [
          ["patientId", "==", patient?.id],
          ["dieteticienId", "==", user?.uid],
        ];
        const documentsHistory = await getDocumentsByConditions(
          "consultations",
          conditionsHistory
        );
        setConsultationHistory(documentsHistory);

        const documentsInfoPatient = await getDocumentById(
          "patients",
          patient?.id
        );
        setPatientInfos(documentsInfoPatient);
        setIsLoading(false);
        return documentsHistory;
      } catch (error) {
        console.error("Erreur de chargement des données :", error);
        setIsLoading(false);
        return [];
      }
    };
    historyConsultations();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const conditionsHistory = [
        ["patientId", "==", patient?.id],
        ["dieteticienId", "==", user?.uid],
      ];
      const documentsHistory = await getDocumentsByConditions(
        "consultations",
        conditionsHistory
      );
      setConsultationHistory(documentsHistory);
      setRefreshing(false);
    } catch (error) {
      console.error("Erreur de rafraîchissement :", error);
      setRefreshing(false);
    }
  };

  const calculerIMC = (poids, taille) => {
    const poidsFloat = parseFloat(poids);
    const tailleFloat = parseFloat(taille) / 100;
    if (poidsFloat && tailleFloat) {
      return (poidsFloat / (tailleFloat * tailleFloat)).toFixed(1);
    }
    return '--';
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Sélectionner une date et heure';
    try {
      const date = new Date(dateTimeString);
      const datePart = date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const timePart = dateTimeString.includes('T') 
        ? dateTimeString.split('T')[1].substring(0, 5)
        : '14:00';
      return `${datePart} à ${timePart}`;
    } catch {
      return 'Sélectionner une date et heure';
    }
  };



  return (
    <View style={styles.container}>
      {/* Header avec info patient */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#815F9C" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.patientHeader}
          onPress={() => setPatientInfoModal(true)}
        >

          {patient?.photoUri ? (
            <Image source={{ uri: patient.photoUri }} style={styles.headerPhoto} />
          ) : (
            <View style={[styles.headerPhoto, { backgroundColor: '#EAE3EC', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person-circle-outline" size={40} color="#815F9C" />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{patient?.nom + ' ' + patient?.prenom}</Text>
            <Text style={styles.headerDetails}>
              {patient?.age} ans • {consultationHistory?.length} consultations
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPatientInfoModal(true)}>
          <Ionicons name="information-circle-outline" size={28} color="#815F9C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent} refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#815F9C"
        />
      }>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#815F9C" />
            <Text style={styles.loaderText}>Chargement des consultations...</Text>
          </View>
        ) : (
          <>
            {/* Card de progression */}
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>Progression Actuelle</Text>
              <View style={styles.progressMetrics}>
                <View style={styles.progressMetric}>
                  <Text style={styles.progressValue}>{patientInfos?.poids} Kg</Text>
                  <Text style={styles.progressLabel}>Poids initial</Text>
                </View>
                <View style={styles.progressArrow}>
                  <Ionicons name="arrow-forward" size={24} color="#815F9C" />
                  <Text style={styles.progressChange}>{parseInt(patientInfos?.poidsActuel) - patientInfos?.poids} Kg</Text>
                </View>
                <View style={styles.progressMetric}>
                  <Text style={styles.progressValue}>{patientInfos?.poidsActuel} Kg</Text>
                  <Text style={styles.progressLabel}>Poids actuel</Text>
                </View>
                <View style={styles.progressArrow}>
                  <Ionicons name="arrow-forward" size={24} color="#7D5F9B" />
                </View>
                <View style={styles.progressMetric}>
                  <Text style={styles.progressValue}>{patientInfos?.objectifActuel}</Text>
                  <Text style={styles.progressLabel}>Objectif</Text>
                </View>
              </View>
              <View style={styles.nextAppointment}>
                <Ionicons name="calendar-outline" size={18} color="#815F9C" />
                <Text style={styles.nextAppointmentText}>
                  Prochain RDV :  { formatDateTime(patientInfos?.prochainRendezVous) || 'Non planifié'}
                </Text>
              </View>
            </View>

            {/* Indicateurs clés */}
            <View style={styles.keyMetrics}>
              <KeyMetric
                icon="scale-outline"
                label="IMC"
                value={calculerIMC(patientInfos?.poidsActuel || patientInfos?.poids, patientInfos?.tailleActuel || patientInfos?.taille)}
                color="#4ECDC4"
              />
              <KeyMetric
                icon="flame-outline"
                label="Calories"
                value={ "-- kcal/jour"}
                color="#FF6B6B"
              />
              <KeyMetric
                icon="trophy-outline"
                label="Objectif"
                value={patientInfos?.objectifActuel || patientInfos?.objectif || "--"}
                color="#FFB347"
              />
            </View>

            {/* Liste des consultations */}
            <View style={styles.consultationsSection}>
              <Text style={styles.sectionTitle}>Historique des Consultations</Text>

              {consultationHistory?.length > 0 ? (

                consultationHistory.map((consultation, index) => (
                  <TouchableOpacity
                    key={consultation.id ?? index}
                    style={styles.consultationCard}
                    onPress={() => setSelectedConsultation(consultation)}
                  >
                    <View style={styles.consultationCardHeader}>
                      <View style={styles.consultationCardLeft}>
                        <View style={styles.consultationNumber}>
                          <Text style={styles.consultationNumberText}>
                            #{index + 1}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.consultationCardDate}>{consultation.date}</Text>
                          <Text style={styles.consultationCardWeight}>{consultation.poids} Kg</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#B9A9CC" />
                    </View>

                    <Text style={styles.consultationCardNotes} numberOfLines={2}>
                      {consultation.notes}
                    </Text>

                    <View style={styles.consultationCardFooter}>
                      <View style={styles.consultationTag}>
                        <Ionicons name="nutrition-outline" size={14} color="#815F9C" />
                        <Text style={styles.consultationTagText} numberOfLines={2}>
                          {consultation.planDiet}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))

              ) : (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="document-outline" size={64} color="#B9A9CC" style={{ marginBottom: 16 }} />
                  <Text style={styles.emptyStateTitle}>Aucune consultation</Text>
                  <Text style={styles.emptyStateMessage}>
                    Aucune consultation enregistrée pour ce patient. Commencez en créant une nouvelle consultation.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bouton nouvelle consultation */}
      <TouchableOpacity
        style={styles.newConsultationButton}
        onPress={() => navigation.navigate('NouvelleConsultation', { patient: patient, dieteticien: user })}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.newConsultationText}>Nouvelle Consultation</Text>
      </TouchableOpacity>

      {renderConsultationDetailModal()}
      {renderPatientInfoModal()}
    </View>
  );
};

// Composants utilitaires
const KeyMetric = ({ icon, label, value, color }) => (
  <View style={styles.keyMetricCard}>
    <View style={[styles.keyMetricIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.keyMetricValue}>{value}</Text>
    <Text style={styles.keyMetricLabel}>{label}</Text>
  </View>
);

const QuickInfo = ({ icon, label, value }) => (
  <View style={styles.quickInfoItem}>
    <Ionicons name={icon} size={20} color="#815F9C" />
    <Text style={styles.quickInfoLabel}>{label}</Text>
    <Text style={styles.quickInfoValue}>{value}</Text>
  </View>
);

const MedicalItem = ({ label, value }) => (
  <View style={styles.medicalItem}>
    <Text style={styles.medicalLabel}>{label}</Text>
    <Text style={styles.medicalValue}>{value}</Text>
  </View>
);

const InfoBlock = ({ icon, title, items, color }) => (
  <View style={styles.infoBlock}>
    <View style={styles.infoBlockHeader}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.infoBlockTitle}>{title}</Text>
    </View>
    {items.map((item, index) => (
      <Text key={index} style={styles.infoBlockItem}>• {item}</Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F0F5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
  },
  patientHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#815F9C',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E223D',
  },
  headerDetails: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: '#815F9C',
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#815F9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#815F9C',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 16,
  },
  progressMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressMetric: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E223D',
  },
  progressLabel: {
    fontSize: 12,
    color: '#7D5F9B',
    marginTop: 4,
  },
  progressArrow: {
    alignItems: 'center',
  },
  progressChange: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: 'bold',
    marginTop: 4,
  },
  nextAppointment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    padding: 12,
    borderRadius: 8,
  },
  nextAppointmentText: {
    fontSize: 14,
    color: '#815F9C',
    marginLeft: 8,
    fontWeight: '600',
  },
  keyMetrics: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  keyMetricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keyMetricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  keyMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
    marginBottom: 4,
  },
  keyMetricLabel: {
    fontSize: 12,
    color: '#7D5F9B',
  },
  consultationsSection: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 16,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAE3EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  consultationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultationCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultationNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#815F9C',
  },
  consultationNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  consultationCardDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
  },
  consultationCardWeight: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 2,
  },
  consultationCardNotes: {
    fontSize: 14,
    color: '#7D5F9B',
    lineHeight: 20,
    marginBottom: 12,
  },
  consultationCardFooter: {
    flexDirection: 'row',
  },
  consultationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
  },
  consultationTagText: {
    fontSize: 12,
    color: '#815F9C',
    marginLeft: 4,
  },
  emptyStateContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#B9A9CC',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  newConsultationButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#815F9C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#815F9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  newConsultationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  detailSection: {
    paddingBottom: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
  },
  detailDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E223D',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 4,
  },
  detailMetrics: {
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  metricLabel: {
    fontSize: 14,
    color: '#7D5F9B',
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: '#F6F0F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#815F9C',
    marginLeft: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#1E223D',
    lineHeight: 22,
  },
  infoSection: {
    marginBottom: 24,
  },
  modalPatientPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#815F9C',
  },
  modalPatientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E223D',
    textAlign: 'center',
    marginBottom: 20,
  },
  quickInfoGrid: {
    gap: 12,
  },
  quickInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0F5',
    padding: 12,
    borderRadius: 8,
  },
  quickInfoLabel: {
    fontSize: 14,
    color: '#7D5F9B',
    marginLeft: 8,
    flex: 1,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E223D',
  },
  medicalGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  medicalItem: {
    flex: 1,
    backgroundColor: '#F6F0F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  medicalLabel: {
    fontSize: 12,
    color: '#7D5F9B',
    marginBottom: 4,
  },
  medicalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
  },
  infoBlock: {
    backgroundColor: '#F6F0F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
    marginLeft: 8,
  },
  infoBlockItem: {
    fontSize: 14,
    color: '#7D5F9B',
    marginBottom: 6,
    marginLeft: 8,
  },
  objectiveMainCard: {
    backgroundColor: '#815F9C',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#815F9C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  objectiveMainText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  objectiveMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  objectiveMetric: {
    alignItems: 'center',
  },
  objectiveMetricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  objectiveMetricLabel: {
    fontSize: 12,
    color: '#E8D9F0',
    marginTop: 4,
  },
});

export default ConsultationsPatient;