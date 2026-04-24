import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Images de test pour les diététiciens
const testImages = {
  'Dr. Marie Dubois': { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
  'Dr. Pierre Martin': { uri: 'https://randomuser.me/api/portraits/men/46.jpg' },
  'Dr. Sophie Laurent': { uri: 'https://randomuser.me/api/portraits/women/65.jpg' },
};

const Agenda = ({ navigation }) => {
  const [appointments, setAppointments] = useState([
    {
      id: '1',
      dieticien: 'Dr. Marie Dubois',
      date: '2025-08-11',
      time: '09:00 - 10:00',
      location: 'Cabinet Paris, 12 Rue de la Paix',
      type: 'en personne',
      status: 'confirmed',
      notes: 'Consultation initiale pour diabète',
    },
    {
      id: '2',
      dieticien: 'Dr. Pierre Martin',
      date: '2025-08-12',
      time: '14:30 - 15:30',
      location: 'Visio (Zoom)',
      type: 'visio',
      status: 'pending',
      notes: 'Suivi nutrition sportive',
    },
    {
      id: '3',
      dieticien: 'Dr. Sophie Laurent',
      date: '2025-08-15',
      time: '10:00 - 11:00',
      location: 'Cabinet Lyon, 45 Avenue des Lumières',
      type: 'en personne',
      status: 'confirmed',
      notes: 'Plan pour perte de poids',
    },
    {
      id: '4',
      dieticien: 'Dr. Marie Dubois',
      date: '2025-08-10',
      time: '16:00 - 17:00',
      location: 'Visio (Google Meet)',
      type: 'visio',
      status: 'cancelled',
      notes: 'Consultation annulée',
    },
  ]);
  const [filter, setFilter] = useState('all');

  // Memoize grouped appointments
  const groupedAppointments = useMemo(() => {
    return appointments
      .filter((appt) => filter === 'all' || appt.status === filter)
      .reduce((acc, appt) => {
        const date = appt.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(appt);
        return acc;
      }, {});
  }, [appointments, filter]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedAppointments).sort((a, b) => new Date(a) - new Date(b));
  }, [groupedAppointments]);

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    const isTomorrow =
      date.getFullYear() === tomorrow.getFullYear() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getDate() === tomorrow.getDate();

    if (isToday) return 'Aujourd’hui';
    if (isTomorrow) return 'Demain';
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Annuler un rendez-vous
  const cancelAppointment = useCallback((id, dieticien) => {
    Alert.alert(
      'Annuler le rendez-vous',
      `Voulez-vous vraiment annuler votre rendez-vous avec ${dieticien} ?`,
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: () => {
            setAppointments((prev) =>
              prev.map((appt) => (appt.id === id ? { ...appt, status: 'cancelled' } : appt))
            );
          },
        },
      ]
    );
  }, []);

  const renderAppointment = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.appointmentItem}
        onPress={() =>
          navigation.navigate('Chat', { dieticienId: item.id, dieticienName: item.dieticien })
        }
        activeOpacity={0.8}
        accessibilityLabel={`Rendez-vous avec ${item.dieticien} le ${formatDate(item.date)} à ${item.time}`}
        accessibilityRole="button"
      >
        <Image
          source={testImages[item.dieticien] || { uri: 'https://randomuser.me/api/portraits/lego/1.jpg' }}
          style={styles.dieticianPhoto}
        />
        <View style={styles.appointmentInfo}>
          <Text style={styles.dieticianName}>{item.dieticien}</Text>
          <Text style={styles.appointmentDetail}>
            <Ionicons name="calendar-outline" size={wp('4%')} color="#4A2F7D" /> {formatDate(item.date)}
          </Text>
          <Text style={styles.appointmentDetail}>
            <Ionicons name="time-outline" size={wp('4%')} color="#4A2F7D" /> {item.time}
          </Text>
          <Text style={styles.appointmentDetail}>
            <Ionicons name="location-outline" size={wp('4%')} color="#4A2F7D" /> {item.location}
          </Text>
          <Text style={styles.appointmentDetail}>
            <Ionicons
              name={item.type === 'en personne' ? 'person-outline' : 'videocam-outline'}
              size={wp('4%')}
              color="#4A2F7D"
            />
            {' '}
            {item.type === 'en personne' ? 'En personne' : 'Visio'}
          </Text>
          <Text style={styles.appointmentDetail}>
            <Ionicons name="document-text-outline" size={wp('4%')} color="#4A2F7D" /> {item.notes}
          </Text>
          <View style={styles.actionContainer}>
            <Text
              style={[
                styles.appointmentStatus,
                item.status === 'confirmed' && styles.statusConfirmed,
                item.status === 'pending' && styles.statusPending,
                item.status === 'cancelled' && styles.statusCancelled,
              ]}
            >
              Statut : {item.status === 'confirmed' ? 'Confirmé' : item.status === 'pending' ? 'En attente' : 'Annulé'}
            </Text>
            {item.status !== 'cancelled' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate('Chat', { dieticienId: item.id, dieticienName: item.dieticien })
                  }
                  accessibilityLabel={`Contacter ${item.dieticien}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="chatbubble-outline" size={wp('5%')} color="#F4C430" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => cancelAppointment(item.id, item.dieticien)}
                  accessibilityLabel={`Annuler le rendez-vous avec ${item.dieticien}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={wp('5%')} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation, cancelAppointment]
  );

  const renderItem = useCallback(
    ({ item: date }) => (
      <View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>
        {groupedAppointments[date].map((appt) => (
          <View key={appt.id}>{renderAppointment({ item: appt })}</View>
        ))}
      </View>
    ),
    [groupedAppointments, renderAppointment]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back-outline" size={wp('7%')} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Agenda</Text>
        <Ionicons name="calendar-outline" size={wp('8%')} color="#F4C430" />
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        <View style={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
            accessibilityLabel="Filtrer par Tous"
            accessibilityRole="button"
          >
            <Ionicons
              name="list-outline"
              size={wp('4%')}
              color={filter === 'all' ? '#fff' : '#4A2F7D'}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'confirmed' && styles.filterButtonActive]}
            onPress={() => setFilter('confirmed')}
            accessibilityLabel="Filtrer par Confirmés"
            accessibilityRole="button"
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={wp('4%')}
              color={filter === 'confirmed' ? '#fff' : '#4A2F7D'}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, filter === 'confirmed' && styles.filterTextActive]}>Confirmés</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilter('pending')}
            accessibilityLabel="Filtrer par En attente"
            accessibilityRole="button"
          >
            <Ionicons
              name="hourglass-outline"
              size={wp('4%')}
              color={filter === 'pending' ? '#fff' : '#4A2F7D'}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>En attente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilter('cancelled')}
            accessibilityLabel="Filtrer par Annulés"
            accessibilityRole="button"
          >
            <Ionicons
              name="close-circle-outline"
              size={wp('4%')}
              color={filter === 'cancelled' ? '#fff' : '#4A2F7D'}
              style={styles.filterIcon}
            />
            <Text style={[styles.filterText, filter === 'cancelled' && styles.filterTextActive]}>Annulés</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des rendez-vous */}
      <FlatList
        data={sortedDates}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        style={styles.appointmentList}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun rendez-vous trouvé</Text>}
      />
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
    paddingHorizontal: wp('5%'),
    paddingVertical: hp('3%'),
    paddingTop: hp('6%'),
    backgroundColor: '#4A2F7D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: wp('6.5%'),
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: hp('0.5%'), // Minimal vertical padding
    paddingHorizontal: wp('2%'),
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute buttons evenly
    flexWrap: 'wrap', // Fallback for very small screens
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E6E4F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  filterButtonActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  filterIcon: {
    marginRight: wp('1.5%'),
  },
  filterText: {
    fontSize: wp('3.5%'),
    color: '#4A2F7D',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  appointmentList: {
    flex: 1,
    paddingHorizontal: wp('5%'),
  },
  dateSeparator: {
    marginVertical: hp('2%'),
  },
  dateText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#4A2F7D',
    backgroundColor: '#E6E4F0',
    paddingVertical: hp('0.8%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  appointmentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: wp('4%'),
    marginBottom: hp('2%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dieticianPhoto: {
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    marginRight: wp('4%'),
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  appointmentInfo: {
    flex: 1,
  },
  dieticianName: {
    fontSize: wp('4.8%'),
    fontWeight: '700',
    color: '#333',
    marginBottom: hp('1%'),
  },
  appointmentDetail: {
    fontSize: wp('3.8%'),
    color: '#4A2F7D',
    marginBottom: hp('0.6%'),
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('1%'),
  },
  appointmentStatus: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
  },
  statusConfirmed: {
    color: '#4CAF50',
  },
  statusPending: {
    color: '#F4C430',
  },
  statusCancelled: {
    color: '#E53935',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: wp('2%'),
    marginLeft: wp('2%'),
  },
  emptyText: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#666',
    marginTop: hp('3%'),
  },
});

export default Agenda;