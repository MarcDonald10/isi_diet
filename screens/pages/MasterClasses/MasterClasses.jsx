import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Placeholder images for master classes or instructors
const testImages = {
  'Nutrition Basics': { uri: 'https://randomuser.me/api/portraits/women/44.jpg' },
  'Fitness Fundamentals': { uri: 'https://randomuser.me/api/portraits/men/46.jpg' },
  'Meal Planning': { uri: 'https://randomuser.me/api/portraits/women/65.jpg' },
};

const MasterClasses = ({ navigation }) => {
  const [masterClasses, setMasterClasses] = useState([
    {
      id: '1',
      title: 'Nutrition Basics',
      instructor: 'Dr. Marie Dubois',
      date: '2025-08-12',
      time: '10:00 - 11:30',
      duration: '1h 30m',
      location: 'Online (Zoom)',
      category: 'Nutrition',
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Fitness Fundamentals',
      instructor: 'Dr. Pierre Martin',
      date: '2025-08-13',
      time: '14:00 - 15:00',
      duration: '1h',
      location: 'Online (Google Meet)',
      category: 'Fitness',
      status: 'upcoming',
    },
    {
      id: '3',
      title: 'Meal Planning',
      instructor: 'Dr. Sophie Laurent',
      date: '2025-08-10',
      time: '09:00 - 10:30',
      duration: '1h 30m',
      location: 'Online (Zoom)',
      category: 'Nutrition',
      status: 'completed',
    },
  ]);

  // Memoize sorted master classes
  const sortedMasterClasses = useMemo(() => {
    return masterClasses.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [masterClasses]);

  // Group by date for section headers
  const groupedMasterClasses = useMemo(() => {
    return sortedMasterClasses.reduce((acc, mc) => {
      const date = mc.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(mc);
      return acc;
    }, {});
  }, [sortedMasterClasses]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedMasterClasses).sort((a, b) => new Date(a) - new Date(b));
  }, [groupedMasterClasses]);

  // Format date
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

  // Render master class item
  const renderMasterClass = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.masterClassItem}
        onPress={() =>
          navigation.navigate('MasterClassDetails', { masterClassId: item.id, title: item.title })
        }
        activeOpacity={0.7}
        accessibilityLabel={`Master Class ${item.title} avec ${item.instructor} le ${formatDate(item.date)} à ${item.time}, durée ${item.duration}, ${item.location}`}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          <Image
            source={testImages[item.title] || { uri: 'https://randomuser.me/api/portraits/lego/1.jpg' }}
            style={styles.masterClassPhoto}
          />
        </View>
        <View style={styles.masterClassInfo}>
          <Text style={styles.masterClassTitle}>{item.title}</Text>
          <Text style={styles.masterClassDetail}>
            <Ionicons name="person-outline" size={wp('3.5%')} color="#4A2F7D" /> {item.instructor}
          </Text>
          <Text style={styles.masterClassDetail}>
            <Ionicons name="calendar-outline" size={wp('3.5%')} color="#4A2F7D" /> {formatDate(item.date)}
          </Text>
          <Text style={styles.masterClassDetail}>
            <Ionicons name="time-outline" size={wp('3.5%')} color="#4A2F7D" /> {item.time} ({item.duration})
          </Text>
          <Text style={styles.masterClassDetail}>
            <Ionicons name="location-outline" size={wp('3.5%')} color="#4A2F7D" /> {item.location}
          </Text>
          <Text style={styles.masterClassDetail}>
            <Ionicons name="pricetag-outline" size={wp('3.5%')} color="#4A2F7D" /> {item.category}
          </Text>
          <View style={styles.actionContainer}>
            <View
              style={[
                styles.statusBadge,
                item.status === 'upcoming' ? styles.statusUpcoming : styles.statusCompleted,
              ]}
            >
              <Text style={styles.statusText}>
                {item.status === 'upcoming' ? 'À venir' : 'Terminé'}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
                onPress={() =>
                  navigation.navigate('Chat', { dieticienId: item.id, dieticienName: item.instructor })
                }
                accessibilityLabel={`Contacter ${item.instructor}`}
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-outline" size={wp('4.5%')} color="#4A2F7D" />
              </Pressable>
              {item.status === 'upcoming' && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  onPress={() => alert(`Inscription à ${item.title}`)}
                  accessibilityLabel={`S'inscrire à ${item.title}`}
                  accessibilityRole="button"
                >
                  <Ionicons name="play-circle-outline" size={wp('4.5%')} color="#4CAF50" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  // Render date section
  const renderItem = useCallback(
    ({ item: date }) => (
      <View>
        <View style={styles.dateSeparator}>
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>
        {groupedMasterClasses[date].map((mc) => (
          <View key={mc.id}>{renderMasterClass({ item: mc })}</View>
        ))}
      </View>
    ),
    [groupedMasterClasses, renderMasterClass]
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
        <Text style={styles.headerTitle}>Master Classes</Text>
        <Pressable
          style={({ pressed }) => [pressed && styles.headerIconPressed]}
          accessibilityLabel="Icône Master Classes"
          accessibilityRole="image"
        >
          <Ionicons name="school-outline" size={wp('8%')} color="#F4C430" />
        </Pressable>
      </View>

      {/* Liste des master classes */}
      <FlatList
        data={sortedDates}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        style={styles.masterClassList}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucune master class trouvée</Text>}
        initialNumToRender={10}
        windowSize={5}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    paddingTop: hp('5%'),
    backgroundColor: '#4A2F7D', // Solid violet
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: wp('6.5%'),
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerIconPressed: {
    transform: [{ scale: 0.9 }],
  },
  masterClassList: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
  },
  dateSeparator: {
    marginVertical: hp('1.5%'),
    backgroundColor: '#E6E4F0',
    borderRadius: 12,
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('3%'),
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#4A2F7D',
  },
  masterClassItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp('3.5%'),
    marginBottom: hp('1.5%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 0.5,
    borderColor: '#E6E4F0',
  },
  imageContainer: {
    borderRadius: wp('8%'),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430', // Solid gold border
  },
  masterClassPhoto: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
  },
  masterClassInfo: {
    flex: 1,
    paddingLeft: wp('3%'),
  },
  masterClassTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: '#333',
    marginBottom: hp('0.8%'),
    letterSpacing: 0.3,
  },
  masterClassDetail: {
    fontSize: wp('3.5%'),
    color: '#4A2F7D',
    marginBottom: hp('0.5%'),
    fontWeight: '500',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp('0.8%'),
  },
  statusBadge: {
    paddingVertical: hp('0.4%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#fff',
  },
  statusUpcoming: {
    backgroundColor: '#4CAF50',
  },
  statusCompleted: {
    backgroundColor: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: wp('2%'),
    marginLeft: wp('2%'),
    borderRadius: 8,
    backgroundColor: '#F8F7FC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.95 }],
    elevation: 1,
    shadowOpacity: 0.1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#666',
    marginTop: hp('3%'),
    fontWeight: '500',
  },
});

export default MasterClasses;