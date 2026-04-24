import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const TipDetails = ({ navigation, route }) => {
  const { title, description, category, image } = route.params;

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
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <Pressable
          style={({ pressed }) => [pressed && styles.headerIconPressed]}
          accessibilityLabel="Icône Conseil Nutritionnel"
          accessibilityRole="image"
        >
          <Ionicons name="nutrition-outline" size={wp('8%')} color="#F4C430" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {image && (
          <View style={styles.imageContainer}>
            <Image source={image} style={styles.tipPhoto} />
          </View>
        )}
        <View style={styles.detailsContainer}>
          <Text style={styles.tipTitle}>{title}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
          <Text style={styles.tipDescription}>{description}</Text>
        </View>
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={() => alert(`Partage du conseil: ${title}`)}
            accessibilityLabel={`Partager le conseil ${title}`}
            accessibilityRole="button"
          >
            <Ionicons name="share-outline" size={wp('5%')} color="#4A2F7D" />
            <Text style={styles.actionText}>Partager</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={() => navigation.navigate('Chat', { dieticienId: 'nutritionist', dieticienName: 'Nutritionniste' })}
            accessibilityLabel="Contacter un nutritionniste"
            accessibilityRole="button"
          >
            <Ionicons name="chatbubble-outline" size={wp('5%')} color="#4A2F7D" />
            <Text style={styles.actionText}>Contacter</Text>
          </Pressable>
        </View>
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
    fontSize: wp('6%'),
    fontWeight: '800',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerIconPressed: {
    transform: [{ scale: 0.9 }],
  },
  content: {
    flex: 1,
    paddingHorizontal: wp('4%'),
  },
  contentContainer: {
    paddingTop: hp('2%'),
    paddingBottom: hp('4%'),
  },
  imageContainer: {
    borderRadius: wp('10%'),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430', // Solid gold border
    alignSelf: 'center',
    marginBottom: hp('2%'),
  },
  tipPhoto: {
    width: wp('80%'),
    height: wp('50%'),
    borderRadius: wp('10%'),
  },
  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: wp('4%'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    borderWidth: 0.5,
    borderColor: '#E6E4F0',
    marginBottom: hp('2%'),
  },
  tipTitle: {
    fontSize: wp('5.5%'),
    fontWeight: '800',
    color: '#333',
    marginBottom: hp('1%'),
    letterSpacing: 0.3,
  },
  categoryBadge: {
    backgroundColor: '#4A2F7D', // Violet badge
    paddingVertical: hp('0.4%'),
    paddingHorizontal: wp('2%'),
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: hp('1%'),
  },
  categoryText: {
    fontSize: wp('3.2%'),
    fontWeight: '600',
    color: '#fff',
  },
  tipDescription: {
    fontSize: wp('4%'),
    color: '#4A2F7D',
    fontWeight: '500',
    lineHeight: wp('5.5%'),
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: hp('2%'),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FC',
    paddingVertical: hp('1%'),
    paddingHorizontal: wp('4%'),
    borderRadius: 12,
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
  actionText: {
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#4A2F7D',
    marginLeft: wp('2%'),
  },
});

export default TipDetails;