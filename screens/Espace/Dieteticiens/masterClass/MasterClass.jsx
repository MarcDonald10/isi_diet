import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import Header from '../../../components/Header';
import { db } from '../../../../services/firebase/firebaseConfig';
import { useAuth } from '../../../../contexts/AuthContext';

// Placeholder images for master classes or instructors


const MasterClass = ({ navigation }) => {
  const { user } = useAuth();
  const [masterClasses, setMasterClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Charger les Master Classes depuis Firebase
  useEffect(() => {
    const fetchMasterClasses = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'masterClasses'),
          orderBy('date', 'asc')
        );
        const querySnapshot = await getDocs(q);
        const data = [];

        querySnapshot.forEach((doc) => {
          const masterClass = doc.data();
          data.push({
            id: doc.id,
            ...masterClass,
            date: masterClass.date || new Date().toISOString().split('T')[0],
            time: masterClass.time || '00:00',
            status: new Date(masterClass.date) > new Date() ? 'upcoming' : 'completed',
          });
        });

        setMasterClasses(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des Master Classes:', error);
        Alert.alert('Erreur', 'Impossible de charger les Master Classes');
      } finally {
        setLoading(false);
      }
    };

    fetchMasterClasses();
  }, []);


  // Fonction de filtrage
  const filteredMasterClasses = useMemo(() => {
    let filtered = masterClasses;

    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(mc =>
        mc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mc.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mc.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtre par catégorie/statut
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'upcoming' || selectedFilter === 'completed') {
        filtered = filtered.filter(mc => mc.status === selectedFilter);
      } else {
        filtered = filtered.filter(mc => mc.category.toLowerCase() === selectedFilter);
      }
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [masterClasses, selectedFilter, searchQuery]);



  // Render master class item avec nouveau design
  const renderMasterClass = useCallback(
    ({ item }) => {
      const progressPercentage = item.maxParticipants > 0 
        ? (item.participants?.length || 0) / item.maxParticipants * 100 
        : 0;
      const isUpcoming = item.status === 'upcoming';
      const participantsCount = item.participants?.length || 0;

      return (
        <TouchableOpacity
          style={styles.masterClassCard}
          onPress={() =>
            navigation.navigate('MasterClassDetails', { masterClassId: item.id, title: item.title })
          }
          activeOpacity={0.8}
        >
          {/* Image de couverture */}
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.masterClassImage}
            />
          )}

          {/* Header de la carte */}
          <View style={styles.cardHeader}>
            <View style={styles.instructorSection}>
              <View style={styles.instructorAvatar}>
                <Ionicons name="person-circle" size={wp('12%')} color="#7B68EE" />
              </View>
              <View style={styles.instructorInfo}>
                <Text style={styles.instructorName}>{item.dieticianName || 'Diététicien'}</Text>
                <View style={styles.categoryBadge}>
                  <View style={[styles.categoryDot, { backgroundColor: '#7B68EE' }]} />
                  <Text style={styles.categoryText}>{item.category || 'Nutrition'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statusSection}>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: isUpcoming ? '#4CAF50' : '#9E9E9E' }
              ]}>
                <Ionicons
                  name={isUpcoming ? "time-outline" : "checkmark-outline"}
                  size={wp('3.5%')}
                  color="#fff"
                />
                <Text style={styles.statusIndicatorText}>
                  {isUpcoming ? 'À venir' : 'Terminé'}
                </Text>
              </View>
            </View>
          </View>

          {/* Contenu principal */}
          <View style={styles.cardContent}>
            <Text style={styles.masterClassTitle}>{item.title}</Text>
            <Text style={styles.masterClassDescription} numberOfLines={2}>{item.description}</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={wp('4%')} color="#7B68EE" />
                <Text style={styles.infoText}>{item.date || 'Date non définie'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={wp('4%')} color="#7B68EE" />
                <Text style={styles.infoText}>{item.time || 'Heure non définie'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="hourglass-outline" size={wp('4%')} color="#7B68EE" />
                <Text style={styles.infoText}>{item.duration || '1h'}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelText, { color: '#7B68EE' }]}>
                  {item.level || 'Tous niveaux'}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer de la carte */}
          <View style={styles.cardFooter}>
            <View style={styles.participantsSection}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(progressPercentage, 100)}%`,
                        backgroundColor: progressPercentage > 80 ? '#FF6B35' : '#4CAF50'
                      }
                    ]}
                  />
                </View>
                {/* <Text style={styles.participantsText}>
                  {participantsCount}/{item.maxParticipants || '?'} participants
                </Text> */}
              </View>
            </View>

            <View style={styles.priceSection}>
              <Text style={styles.priceText}>{item.price || 'Gratuit'} F CFA</Text>
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() =>
                     navigation.navigate('Comments', { postId: item.id, title: item.title })
                  }
                >
                  <Ionicons name="chatbubble-outline" size={wp('6.5%')} color="#7B68EE" />
                </Pressable>
                {isUpcoming && (
                  <Pressable
                    style={[styles.actionBtn, styles.joinBtn]}
                    onPress={() => Alert.alert('Inscription', `Inscrit à ${item.title}`)}
                  >
                    <Ionicons name="play-outline" size={wp('4.5%')} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [navigation]
  );

  const renderFilterButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === item.key && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(item.key)}
    >
      <Ionicons
        name={item.icon}
        size={wp('4%')}
        color={selectedFilter === item.key ? '#fff' : '#7B68EE'}
      />
      <Text style={[
        styles.filterButtonText,
        selectedFilter === item.key && styles.filterButtonTextActive
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A5ACD" />
      <Header
        pageName={"Master Classes"}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        notificationCount={3}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Chargement des Master Classes...</Text>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.headerContainer}>
            <View style={styles.header}>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Master Classes</Text>
                <Text style={styles.headerSubtitle}>{masterClasses.length} cours disponibles</Text>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('MasterClassForm')}
              >
                <View style={styles.addButtonContent}>
                  <Ionicons name="add" size={wp('6%')} color="#7B68EE" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={wp('5%')} color="#9E9E9E" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un cours, instructeur..."
                  placeholderTextColor="#9E9E9E"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={wp('5%')} color="#9E9E9E" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Filtres 
            <FlatList
              data={filterOptions}
              renderItem={renderFilterButton}
              keyExtractor={item => item.key}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersContainer}
              contentContainerStyle={styles.filtersContent}
            />*/}
          </View>

          {/* Liste des master classes */}
          <FlatList
            data={filteredMasterClasses}
            renderItem={renderMasterClass}
            keyExtractor={(item) => item.id}
            style={styles.masterClassList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="school-outline" size={wp('15%')} color="#E0E0E0" />
                <Text style={styles.emptyTitle}>Aucun cours trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? "Essayez avec d'autres mots-clés"
                    : "Aucune master class ne correspond à vos filtres"
                  }
                </Text>
              </View>
            }
          />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    marginTop: hp('3%'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#7B68EE',
    fontWeight: '500',
  },
  headerContainer: {
    backgroundColor: '#7B68EE',
    paddingBottom: hp('2%'),
    elevation: 8,
    shadowColor: '#7B68EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('5%'),
    paddingTop: hp('6%'),
    paddingBottom: hp('2%'),
  },
  headerButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: wp('6%'),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: wp('3.5%'),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: hp('0.3%'),
  },
  addButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: wp('5%'),
    marginBottom: hp('1.5%'),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: wp('3%'),
    fontSize: wp('4%'),
    color: '#333',
  },
  filtersContainer: {
    marginTop: hp('1%'),
  },
  filtersContent: {
    paddingHorizontal: wp('5%'),
    paddingBottom: hp('0.5%'),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1%'),
    borderRadius: 20,
    marginRight: wp('3%'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterButtonText: {
    marginLeft: wp('1.5%'),
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  filterButtonTextActive: {
    color: '#7B68EE',
  },
  masterClassList: {
    flex: 1,
    paddingTop: hp('2%'),
    paddingHorizontal: wp('2%'),
  },
  listContent: {
    paddingBottom: hp('3%'),
  },
  masterClassCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: hp('2%'),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  masterClassImage: {
    width: '100%',
    height: hp('20%'),
    resizeMode: 'cover',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp('4%'),
    paddingBottom: wp('2%'),
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  instructorAvatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: '#E0E0E0',
  },
  instructorInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  instructorName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.3%'),
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: wp('2%'),
    height: wp('2%'),
    borderRadius: wp('1%'),
    marginRight: wp('1.5%'),
  },
  categoryText: {
    fontSize: wp('3.5%'),
    color: '#666',
    fontWeight: '500',
  },
  statusSection: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 12,
  },
  statusIndicatorText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    color: '#fff',
    marginLeft: wp('1%'),
  },
  cardContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: wp('3%'),
  },
  masterClassTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: hp('1%'),
    lineHeight: wp('6.5%'),
  },
  masterClassDescription: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp('1.5%'),
    lineHeight: wp('4.5%'),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1%'),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: wp('3.5%'),
    color: '#555',
    marginLeft: wp('2%'),
    fontWeight: '500',
  },
  levelBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 8,
  },
  levelText: {
    fontSize: wp('3%'),
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('3%'),
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  participantsSection: {
    flex: 1,
    marginRight: wp('4%'),
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: hp('0.6%'),
    backgroundColor: '#E5E5E5',
    borderRadius: hp('0.3%'),
    overflow: 'hidden',
    marginBottom: hp('0.5%'),
  },
  progressFill: {
    height: '100%',
    borderRadius: hp('0.3%'),
  },
  participantsText: {
    fontSize: wp('3%'),
    color: '#666',
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: wp('4.5%'),
    fontWeight: '700',
    color: '#7B68EE',
    marginRight: wp('3%'),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  joinBtn: {
    backgroundColor: '#7B68EE',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp('8%'),
    paddingHorizontal: wp('8%'),
  },
  emptyTitle: {
    fontSize: wp('5%'),
    fontWeight: '600',
    color: '#666',
    marginTop: hp('2%'),
    marginBottom: hp('1%'),
  },
  emptySubtitle: {
    fontSize: wp('3.8%'),
    color: '#999',
    textAlign: 'center',
    lineHeight: wp('5.5%'),
  },
});

export default MasterClass;