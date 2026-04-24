import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const RendezVous = ({ route, navigation }) => {
  const { dieticienId, dieticienName } = route.params;
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([
    { id: '1', time: '09:00 - 10:00', available: true },
    { id: '2', time: '10:30 - 11:30', available: true },
    { id: '3', time: '14:00 - 15:00', available: false },
    { id: '4', time: '15:30 - 16:30', available: true },
    { id: '5', time: '17:00 - 18:00', available: true },
  ]);

  // Simuler la récupération des créneaux disponibles pour la date sélectionnée
  useEffect(() => {
    // À remplacer par une requête Firebase pour récupérer les créneaux réels
    setAvailableSlots([
      { id: '1', time: '09:00 - 10:00', available: true },
      { id: '2', time: '10:30 - 11:30', available: true },
      { id: '3', time: '14:00 - 15:00', available: false },
      { id: '4', time: '15:30 - 16:30', available: true },
      { id: '5', time: '17:00 - 18:00', available: true },
    ]);
    setSelectedSlot(null); // Réinitialiser le créneau sélectionné
  }, [selectedDate]);

  // Gestion du changement de date
  const onDateChange = (event, selected) => {
    const currentDate = selected || selectedDate;
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  // Formater la date
  const formatDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Confirmer le rendez-vous
  const confirmAppointment = () => {
    if (selectedSlot) {
      // À remplacer par une requête Firebase pour enregistrer le rendez-vous
      alert(`Rendez-vous confirmé avec ${dieticienName} le ${formatDate(selectedDate)} à ${selectedSlot.time}`);
      navigation.goBack();
    }
  };

  // Rendu des créneaux horaires
  const renderSlot = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.slotItem,
        selectedSlot?.id === item.id && styles.slotItemSelected,
        !item.available && styles.slotItemDisabled,
      ]}
      onPress={() => item.available && setSelectedSlot(item)}
      disabled={!item.available}
      accessibilityLabel={`Créneau ${item.time} ${item.available ? 'disponible' : 'indisponible'}`}
    >
      <Text style={[styles.slotText, !item.available && styles.slotTextDisabled]}>
        {item.time}
      </Text>
      {!item.available && (
        <Text style={styles.slotStatus}>Indisponible</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
          style={styles.dieticianPhoto}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{dieticienName}</Text>
          <Text style={styles.headerSubtitle}>Prendre un rendez-vous</Text>
        </View>
      </View>

      {/* Sélecteur de date */}
      <View style={styles.dateContainer}>
        <Text style={styles.sectionTitle}>Choisir une date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
          accessibilityLabel="Sélectionner une date pour le rendez-vous"
        >
          <Ionicons name="calendar-outline" size={wp('5.5%')} color="#4A2F7D" />
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
            locale="fr-FR"
          />
        )}
      </View>

      {/* Créneaux horaires */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
        <FlatList
          data={availableSlots}
          renderItem={renderSlot}
          keyExtractor={(item) => item.id}
          style={styles.slotList}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun créneau disponible</Text>}
        />

        {/* Bouton de confirmation */}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedSlot && styles.confirmButtonDisabled]}
          onPress={confirmAppointment}
          disabled={!selectedSlot}
          accessibilityLabel="Confirmer le rendez-vous"
        >
          <Text style={styles.confirmButtonText}>Confirmer le rendez-vous</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FC', // Violet clair
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A2F7D', // Violet profond
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    paddingTop: hp('6%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dieticianPhoto: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    marginHorizontal: wp('4%'),
    borderWidth: 2,
    borderColor: '#F4C430', // Bordure dorée
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: wp('4%'),
    color: '#F4C430', // Doré
    marginTop: hp('0.5%'),
  },
  dateContainer: {
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('2%'),
    backgroundColor: '#fff',
    marginHorizontal: wp('5%'),
    marginTop: hp('2%'),
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('1.5%'),
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    padding: wp('4%'),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  dateText: {
    fontSize: wp('4%'),
    color: '#4A2F7D',
    marginLeft: wp('3%'),
  },
  scrollContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('3%'),
  },
  slotList: {
    marginBottom: hp('3%'),
  },
  slotItem: {
    backgroundColor: '#fff',
    padding: wp('4%'),
    borderRadius: 12,
    marginBottom: hp('1.5%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  slotItemSelected: {
    borderWidth: 2,
    borderColor: '#F4C430', // Bordure dorée pour sélection
  },
  slotItemDisabled: {
    backgroundColor: '#E6E4F0',
    opacity: 0.6,
  },
  slotText: {
    fontSize: wp('4%'),
    color: '#333',
    fontWeight: '500',
  },
  slotTextDisabled: {
    color: '#999',
  },
  slotStatus: {
    fontSize: wp('3.5%'),
    color: '#E53935', // Rouge pour indisponible
  },
  confirmButton: {
    backgroundColor: '#F4C430', // Doré
    padding: wp('4%'),
    borderRadius: 15,
    alignItems: 'center',
    marginTop: hp('2%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#F4C43080', // Opacité réduite si désactivé
  },
  confirmButtonText: {
    fontSize: wp('4.5%'),
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#666',
    marginTop: hp('3%'),
  },
});

export default RendezVous;