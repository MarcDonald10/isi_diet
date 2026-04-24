import React, { useMemo, useCallback } from 'react';
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

// Placeholder images for tips (nutrition-themed)
const testImages = {
  'Rester Hydraté': { uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c' }, // Water
  'Manger Varié': { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }, // Veggies
  'Équilibrer Son Assiette': { uri: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd' }, // Balanced meal
};

// List of 15 nutritional tips in French
const nutritionalTips = [
  {
    id: '1',
    title: 'Rester Hydraté',
    description: 'Buvez au moins 8 verres d’eau par jour pour favoriser la digestion et la santé globale.',
    category: 'Hydratation',
  },
  {
    id: '2',
    title: 'Manger Varié',
    description: 'Incluez une variété de fruits et légumes colorés pour une diversité de nutriments.',
    category: 'Alimentation Équilibrée',
  },
  {
    id: '3',
    title: 'Équilibrer Son Assiette',
    description: 'Visez la moitié de légumes, un quart de protéines et un quart de céréales complètes par repas.',
    category: 'Alimentation Équilibrée',
  },
  {
    id: '4',
    title: 'Choisir des Céréales Complètes',
    description: 'Préférez le riz brun, le quinoa ou le blé complet aux céréales raffinées.',
    category: 'Glucides',
  },
  {
    id: '5',
    title: 'Limiter les Sucres Ajoutés',
    description: 'Maintenez les sucres ajoutés en dessous de 10 % des calories quotidiennes pour réduire les risques pour la santé.',
    category: 'Contrôle du Sucre',
  },
  {
    id: '6',
    title: 'Incorporer des Graisses Saines',
    description: 'Utilisez des avocats, des noix et de l’huile d’olive pour des graisses bénéfiques pour le cœur.',
    category: 'Graisses',
  },
  {
    id: '7',
    title: 'Prioriser les Protéines',
    description: 'Incluez des protéines maigres comme le poulet, le poisson ou les légumineuses à chaque repas.',
    category: 'Protéines',
  },
  {
    id: '8',
    title: 'Contrôler les Portions',
    description: 'Utilisez des assiettes plus petites pour contrôler les portions et éviter de trop manger.',
    category: 'Contrôle des Portions',
  },
  {
    id: '9',
    title: 'Manger en Pleine Conscience',
    description: 'Mâchez lentement et évitez les distractions pour améliorer la digestion et la satisfaction.',
    category: 'Alimentation Consciente',
  },
  {
    id: '10',
    title: 'Réduire l’Apport en Sodium',
    description: 'Limitez le sel à moins de 2 300 mg par jour pour soutenir la santé cardiaque.',
    category: 'Contrôle du Sodium',
  },
  {
    id: '11',
    title: 'Planifier Ses Repas',
    description: 'Préparez vos repas chaque semaine pour maintenir des habitudes alimentaires saines.',
    category: 'Planification des Repas',
  },
  {
    id: '12',
    title: 'Inclure des Aliments Riches en Fibres',
    description: 'Consommez des haricots, des lentilles et des céréales complètes pour la santé digestive.',
    category: 'Fibres',
  },
  {
    id: '13',
    title: 'Limiter les Aliments Transformés',
    description: 'Choisissez des aliments frais ou peu transformés pour éviter les additifs.',
    category: 'Aliments Entiers',
  },
  {
    id: '14',
    title: 'Snacker Intelligemment',
    description: 'Optez pour des collations riches en nutriments comme le yaourt grec ou les fruits plutôt que des chips.',
    category: 'Collations',
  },
  {
    id: '15',
    title: 'Écouter Son Corps',
    description: 'Mangez lorsque vous avez faim et arrêtez lorsque vous êtes satisfait pour maintenir l’équilibre.',
    category: 'Alimentation Consciente',
  },
];

const ConseilsNutritionnels = ({ navigation }) => {
  // Memoize sorted tips (alphabetically by title)
  const sortedTips = useMemo(() => {
    return [...nutritionalTips].sort((a, b) => a.title.localeCompare(b.title));
  }, []);

  // Group by category for section headers
  const groupedTips = useMemo(() => {
    return sortedTips.reduce((acc, tip) => {
      const category = tip.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push(tip);
      return acc;
    }, {});
  }, [sortedTips]);

  const sortedCategories = useMemo(() => {
    return Object.keys(groupedTips).sort();
  }, [groupedTips]);

  // Render tip item
  const renderTip = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={styles.tipItem}
        onPress={() =>
          navigation.navigate('TipDetails', {
            tipId: item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            image: testImages[item.title] || { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' },
          })
        }
        activeOpacity={0.7}
        accessibilityLabel={`Conseil ${item.title}: ${item.description}, catégorie ${item.category}`}
        accessibilityRole="button"
      >
        <View style={styles.imageContainer}>
          <Image
            source={testImages[item.title] || { uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c' }}
            style={styles.tipPhoto}
          />
        </View>
        <View style={styles.tipInfo}>
          <Text style={styles.tipTitle}>{item.title}</Text>
          <Text style={styles.tipDescription} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  // Render category section
  const renderItem = useCallback(
    ({ item: category }) => (
      <View>
        <View style={styles.categorySeparator}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        {groupedTips[category].map((tip) => (
          <View key={tip.id}>{renderTip({ item: tip })}</View>
        ))}
      </View>
    ),
    [groupedTips, renderTip]
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
        <Text style={styles.headerTitle}>Conseils Nutritionnels</Text>
        <Pressable
          style={({ pressed }) => [pressed && styles.headerIconPressed]}
          accessibilityLabel="Icône Conseils Nutritionnels"
          accessibilityRole="image"
        >
          <Ionicons name="nutrition-outline" size={wp('8%')} color="#F4C430" />
        </Pressable>
      </View>

      {/* Liste des conseils */}
      <FlatList
        data={sortedCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        style={styles.tipList}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun conseil trouvé</Text>}
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
  tipList: {
    flex: 1,
    paddingHorizontal: wp('4%'),
    paddingTop: hp('2%'),
  },
  categorySeparator: {
    marginVertical: hp('1.5%'),
    backgroundColor: '#E6E4F0',
    borderRadius: 12,
    paddingVertical: hp('0.6%'),
    paddingHorizontal: wp('3%'),
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#4A2F7D',
  },
  tipItem: {
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
  tipPhoto: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
  },
  tipInfo: {
    flex: 1,
    paddingLeft: wp('3%'),
  },
  tipTitle: {
    fontSize: wp('5%'),
    fontWeight: '800',
    color: '#333',
    marginBottom: hp('0.8%'),
    letterSpacing: 0.3,
  },
  tipDescription: {
    fontSize: wp('3.5%'),
    color: '#4A2F7D',
    marginBottom: hp('0.8%'),
    fontWeight: '500',
    lineHeight: wp('5%'),
  },
  categoryBadge: {
    backgroundColor: '#4A2F7D', // Violet badge
    paddingVertical: hp('0.4%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: wp('4%'),
    color: '#666',
    marginTop: hp('3%'),
    fontWeight: '500',
  },
});

export default ConseilsNutritionnels;