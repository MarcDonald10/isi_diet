import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useAuth } from '../../../contexts/AuthContext';
import { checkIfUserLikedPost, getPostStatistics, togglePostLike } from '../../../services/firebase/commentServices';
import { db } from '../../../services/firebase/firebaseConfig';
import Header from '../../components/Header';

// Placeholder images for posts
const testImages = {
  'Nouveau Master Class : Nutrition de Base': { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
  'Conseil : Restez Hydraté': { uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c' },
  'Astuce Fitness : Bougez Chaque Jour': { uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' },
};

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

// Sample posts data avec timestamps
const initialPosts = [
  {
    id: '1',
    author: 'Dr. Marie Dubois',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: 'Nouveau Master Class : Nutrition de Base',
    description: 'Rejoignez notre prochain Master Class pour apprendre les bases d\'une alimentation saine et équilibrée. Nous couvrirons les macronutriments, la planification des repas et bien plus encore.',
    category: 'Master Class',
    image: testImages['Nouveau Master Class : Nutrition de Base'],
    likes: 25,
    isLiked: false,
    comments: 8,
    timeAgo: '2h',
    readTime: '3 min',
  },
  {
    id: '2',
    author: 'Dr. Pierre Martin',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    title: 'Conseil : Restez Hydraté',
    description: 'L\'hydratation est cruciale pour notre santé. Découvrez pourquoi boire 8 verres d\'eau par jour peut transformer votre bien-être quotidien.',
    category: 'Conseil Nutritionnel',
    image: testImages['Conseil : Restez Hydraté'],
    likes: 15,
    isLiked: true,
    comments: 5,
    timeAgo: '4h',
    readTime: '2 min',
  },
  {
    id: '3',
    author: 'Dr. Sophie Laurent',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    title: 'Astuce Fitness : Bougez Chaque Jour',
    description: 'Incorporez 30 minutes d\'activité physique quotidienne pour améliorer votre bien-être. Même une simple marche peut faire la différence.',
    category: 'Fitness',
    image: testImages['Astuce Fitness : Bougez Chaque Jour'],
    likes: 10,
    isLiked: false,
    comments: 3,
    timeAgo: '6h',
    readTime: '4 min',
  },
  {
    id: '4',
    author: 'Dr. Claire Dupont',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    title: 'Planification des Repas Simplifiée',
    description: 'Découvrez des astuces pratiques pour organiser vos repas hebdomadaires et gagner du temps en cuisine.',
    category: 'Conseil Nutritionnel',
    likes: 12,
    isLiked: false,
    comments: 7,
    timeAgo: '1j',
    readTime: '5 min',
  },
];

const FilDActualites = ({ navigation }) => {
  const [posts, setPosts] = useState(initialPosts);
  const [masterClasses, setMasterClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState({ visible: false, type: 'info', title: '', message: '', buttons: null });
  const [postStats, setPostStats] = useState({});
  const { user } = useAuth();

  // Charger les Master Classes depuis Firebase
  useEffect(() => {
    const fetchMasterClasses = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'masterClasses'),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        const statsData = {};

        for (const docSnap of querySnapshot.docs) {
          const mc = docSnap.data();
          const postId = docSnap.id;
          const formattedDate = mc.date ? new Date(mc.date).toLocaleDateString('fr-FR') : 'À définir';
          const readTime = Math.ceil((mc.description?.length || 0) / 200) + 1;

          let authorName = mc.dieticianName || 'Diététicien';
          let authorAvatar = mc.speakerImage || 'https://randomuser.me/api/portraits/women/44.jpg';

          // Récupérer les données du diététicien depuis la collection 'users' si dieticianId existe
          if (mc.dieticianId) {
            try {
              const userDocRef = doc(db, 'users', mc.dieticianId);
              const userDocSnap = await getDoc(userDocRef);
              
              if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                authorName = userData.displayName || userData.name || mc.dieticianName || 'Diététicien';
                authorAvatar = userData.photo || userData.photoURL || mc.speakerImage || 'https://randomuser.me/api/portraits/women/44.jpg';
                
                console.log('Diététicien trouvé:', { authorName, authorAvatar });
              }
            } catch (userError) {
              console.error('Erreur lors de la récupération du profil du diététicien:', userError);
              // Utiliser les valeurs de fallback de la master class
            }
          }

          // Vérifier si l'utilisateur a liké ce post
          const userLiked = user?.uid ? await checkIfUserLikedPost(postId, user.uid) : false;

          // Charger les statistiques du post
          const stats = await getPostStatistics(postId);
          statsData[postId] = stats;

          data.push({
            id: postId,
            author: authorName,
            avatar: authorAvatar,
            title: mc.title,
            description: mc.description || 'Rejoignez cette master class pour approfondir vos connaissances.',
            category: 'Master Class',
            image: mc.image ? { uri: mc.image } : { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
            likes: mc.likes || 0,
            isLiked: userLiked,
            comments: mc.comments || 0,
            views: stats.views || 0,
            timeAgo: formattedDate,
            readTime: `${readTime} min`,
            masterClassId: docSnap.id,
            status: mc.status || 'upcoming',
            participants: mc.participants?.length || 0,
            date: mc.date,
            dieticianId: mc.dieticianId,
          });
        }

        setMasterClasses(data);
        setPostStats(statsData);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des Master Classes:', error);
        setModal({
          visible: true,
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de charger les master classes',
          buttons: null,
        });
        setLoading(false);
      }
    };

    fetchMasterClasses();
  }, []);

  const filterOptions = [
    { key: 'all', label: 'Tous', icon: 'apps-outline' },
    { key: 'Master Class', label: 'Master Class', icon: 'school-outline' },
    { key: 'Conseil Nutritionnel', label: 'Nutrition', icon: 'leaf-outline' },
    { key: 'Fitness', label: 'Fitness', icon: 'fitness-outline' },
  ];

  // Filtrage des posts
  const filteredPosts = useMemo(() => {
    // Combiner les posts statiques et les master classes Firebase
    const allContent = masterClasses;
    let filtered = allContent;

    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(post => post.category === selectedFilter);
    }

    return filtered.sort((a, b) => {
      // Trier par date si disponible, sinon par ID
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return a.id.localeCompare(b.id);
    });
  }, [posts, selectedFilter, searchQuery, masterClasses]);

  // Toggle like
  const toggleLike = useCallback(async (postId) => {
    try {
      if (!user?.uid) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Authentification requise',
          message: 'Vous devez être connecté pour liker un post',
          buttons: null,
        });
        return;
      }

      // Mettre à jour Firebase
      await togglePostLike(postId, user.uid);

      // Mettre à jour l'état local
      setMasterClasses((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
            : post
        )
      );
    } catch (error) {
      console.error('Erreur lors du like du post:', error);
      setModal({
        visible: true,
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de liker ce post',
        buttons: null,
      });
    }
  }, [user]);

  const getCategoryColor = (category) => {
    const colors = {
      'Master Class': '#7B68EE',
      'Conseil Nutritionnel': '#4CAF50',
      'Fitness': '#FF6B35',
      'Wellness': '#9C27B0',
    };
    return colors[category] || '#666';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Master Class': 'school-outline',
      'Conseil Nutritionnel': 'leaf-outline',
      'Fitness': 'fitness-outline',
      'Wellness': 'heart-outline',
    };
    return icons[category] || 'bookmark-outline';
  };

  // Render post item avec nouveau design
  const renderPost = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() =>  navigation.navigate('MasterClassDetails', { masterClassId: item.masterClassId, title: item.title })}
        activeOpacity={0.95}
      >
        {/* Header de l'article */}
        <View style={styles.postHeader}>
          <View style={styles.authorSection}>
            <Image source={{ uri: item.avatar }} style={styles.authorAvatar} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{item.author}</Text>
              <View style={styles.postMeta}>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.readTime}>{item.readTime} de lecture</Text>
              </View>
            </View>
          </View>

          <View style={styles.categoryContainer}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: getCategoryColor(item.category) + '15' }
            ]}>
              <Ionicons
                name={getCategoryIcon(item.category)}
                size={wp('3.5%')}
                color={getCategoryColor(item.category)}
              />
              <Text style={[
                styles.categoryText,
                { color: getCategoryColor(item.category) }
              ]}>
                {item.category}
              </Text>
            </View>
          </View>
        </View>

        {/* Image principale */}
        {item.image && (
          <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.postImage} />
            <View style={styles.imageOverlay}>
              <View style={styles.readTimeIndicator}>
                <Ionicons name="time-outline" size={wp('3%')} color="#fff" />
                <Text style={styles.readTimeText}>{item.readTime}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Contenu */}
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionBar}>
          <View style={styles.engagementStats}>
            <View style={styles.statItem}>
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={wp('4.5%')}
                color={item.isLiked ? "#FF6B6B" : "#999"}
              />
              <Text style={styles.statText}>{postStats[item.id]?.likes || item.likes || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={wp('4.5%')} color="#999" />
              <Text style={styles.statText}>{postStats[item.id]?.comments || item.comments || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={wp('4.5%')} color="#999" />
              <Text style={styles.statText}>{postStats[item.id]?.views || 0}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, item.isLiked && styles.likedButton]}
              onPress={() => toggleLike(item.id)}
            >
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={wp('5.5%')}
                color={item.isLiked ? "#fff" : "#7B68EE"}
              />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => navigation.navigate('Comments', { postId: item.id, title: item.title })}
            >
              <Ionicons name="chatbubble-outline" size={wp('5.5%')} color="#7B68EE" />
            </Pressable>
            
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation, toggleLike, postStats]
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
      <StatusBar barStyle="light-content" backgroundColor="#7B68EE" />
      <Header
        pageName={"Actualités"}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationPress={() => navigation.navigate('Notifications')}
        notificationCount={3}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#7B68EE" />
          <Text style={styles.loadingText}>Chargement des master classes...</Text>
        </View>
      )}      <ScrollView>
        {/* Header moderne */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>

            <View style={styles.headerCenter}>
              <Text style={styles.headerSubtitle}>Restez informé des dernières actualités</Text>
            </View>

            <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('ListeDieteticiens')}>
              {/* <Ionicons name="people-outline" size={wp('6%')} color="#fff" /> */}
              <FontAwesome6 name="user-doctor" size={35} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>


          {/* Filtres */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {filterOptions.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterButton,
                  selectedFilter === item.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedFilter(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={wp('4%')}
                  color={selectedFilter === item.key ? '#7B68EE' : 'rgba(255,255,255,0.8)'}
                />
                <Text style={[
                  styles.filterButtonText,
                  selectedFilter === item.key && styles.filterButtonTextActive
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Liste des articles */}
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          style={styles.postList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={wp('15%')} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>Aucun article trouvé</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? "Essayez avec d'autres mots-clés"
                  : "Aucun article ne correspond à vos filtres"
                }
              </Text>
            </View>
          }
        />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontWeight: '400',
    marginTop: hp('0.3%'),
  },
  notificationButton: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('15%'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: wp('2%'),
    right: wp('2%'),
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: '#FF6B6B',
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
  postList: {
    flex: 1,
    paddingTop: hp('2%'),
  },
  listContent: {
    paddingHorizontal: wp('1%'),
    paddingBottom: hp('3%'),
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: hp('2%'),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: wp('4%'),
    paddingBottom: wp('2%'),
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    backgroundColor: '#E0E0E0',
  },
  authorInfo: {
    marginLeft: wp('3%'),
    flex: 1,
  },
  authorName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#333',
    marginBottom: hp('0.2%'),
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: wp('3%'),
    color: '#999',
    fontWeight: '500',
  },
  metaDot: {
    width: wp('0.8%'),
    height: wp('0.8%'),
    borderRadius: wp('0.4%'),
    backgroundColor: '#999',
    marginHorizontal: wp('1.5%'),
  },
  readTime: {
    fontSize: wp('3%'),
    color: '#999',
    fontWeight: '500',
  },
  categoryContainer: {
    alignItems: 'flex-end',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('2.5%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 12,
  },
  categoryText: {
    fontSize: wp('3%'),
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: wp('4%'),
    marginBottom: wp('3%'),
    borderRadius: 12,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: hp('25%'),
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: wp('3%'),
    right: wp('3%'),
  },
  readTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: wp('2%'),
    paddingVertical: hp('0.5%'),
    borderRadius: 12,
  },
  readTimeText: {
    fontSize: wp('2.8%'),
    color: '#fff',
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  postContent: {
    paddingHorizontal: wp('4%'),
    paddingBottom: wp('3%'),
  },
  postTitle: {
    fontSize: wp('5%'),
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: hp('1%'),
    lineHeight: wp('6%'),
  },
  postDescription: {
    fontSize: wp('3.8%'),
    color: '#666',
    lineHeight: wp('5.5%'),
    textAlign: 'justify',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: wp('3%'),
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  engagementStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  statText: {
    fontSize: wp('3.5%'),
    color: '#999',
    fontWeight: '600',
    marginLeft: wp('1%'),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp('2%'),
  },
  likedButton: {
    backgroundColor: '#FF6B6B',
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
  // Loading Overlay Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: hp('2%'),
    fontSize: wp('4%'),
    color: '#7B68EE',
    fontWeight: '600',
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
    width: wp('85%'),
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
    backgroundColor: '#7B68EE',
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

export default FilDActualites;