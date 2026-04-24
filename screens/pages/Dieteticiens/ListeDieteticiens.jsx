import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ListeDieteticiens = ({ navigation }) => {
  const [dieteticiens, setDieteticiens] = useState([
    {
      id: '1',
      name: 'Dr. Marie Dubois',
      specialite: 'Diabète, Perte de poids',
      photo: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.8,
      consultations: 120,
      location: 'Paris, France',
    },
    {
      id: '2',
      name: 'Dr. Pierre Martin',
      specialite: 'Hypertension, Nutrition sportive',
      photo: 'https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.5,
      consultations: 85,
      location: 'Lyon, France',
    },
    {
      id: '3',
      name: 'Dr. Sophie Laurent',
      specialite: 'Obésité, Nutrition pédiatrique',
      photo: 'https://images.pexels.com/photos/5215020/pexels-photo-5215020.jpeg?auto=compress&cs=tinysrgb&w=600',
      rating: 4.9,
      consultations: 150,
      location: 'Marseille, France',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Tous');

  const filteredDieteticiens = dieteticiens.filter(
    (dieteticien) =>
      dieteticien.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filter === 'Tous' || dieteticien.specialite.includes(filter))
  );

  const renderDieteticien = ({ item }) => (
    <TouchableOpacity
      style={styles.dieteticienCard}
      onPress={() => navigation.navigate('ProfilDieteticien', { dieticienId: item.id })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.photo }} style={styles.dieteticienPhoto} />
      <View style={styles.dieteticienInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.dieteticienName}>{item.name}</Text>
          {/* {item.rating >= 4.8 && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )} */}
        </View>
        <Text style={styles.dieteticienSpecialite}>{item.specialite}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#4A2F7D" />
          <Text style={styles.dieteticienLocation}>{item.location}</Text>
        </View>
        <View style={styles.dieteticienStats}>
          <Text style={styles.statText}>⭐ {item.rating}/5</Text>
          <Text style={styles.statText}>📋 {item.consultations} consultations</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() =>
              navigation.navigate('ChatApp', { dieticienId: item.id, dieticienName: item.name })
            }
            accessibilityLabel={`Contacter ${item.name}`}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Contacter</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('ProfilDieteticien', { dieticienId: item.id })}
            accessibilityLabel={`Voir le profil de ${item.name}`}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trouver un Diététicien</Text>
        <Ionicons name="people-outline" size={30} color="#4A2F7D" />
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={22} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un diététicien..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Rechercher un diététicien par nom"
        />
      </View>

      {/* Filtres */}
      <View style={styles.filterContainer}>
        {['Tous', 'Diabète', 'Hypertension', 'Obésité'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste des diététiciens */}
      <FlatList
        data={filteredDieteticiens}
        renderItem={renderDieteticien}
        keyExtractor={(item) => item.id}
        style={styles.dieteticienList}
        ListEmptyComponent={<Text style={styles.emptyText}>Aucun diététicien trouvé</Text>}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E4F0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#4A2F7D',
    fontFamily: 'System',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#E6E4F0',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 2,
    marginBottom: 10,
  },
  filterButtonActive: {
    backgroundColor: '#4A2F7D',
  },
  filterText: {
    fontSize: 14,
    color: '#4A2F7D',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  dieteticienList: {
    flex: 1,
  },
  dieteticienCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  dieteticienPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  dieteticienInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dieteticienName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  premiumBadge: {
    backgroundColor: '#F4C430',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  premiumText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dieteticienSpecialite: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dieteticienLocation: {
    fontSize: 14,
    color: '#4A2F7D',
    marginLeft: 5,
  },
  dieteticienStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statText: {
    fontSize: 14,
    color: '#4A2F7D',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A2F7D',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginHorizontal: 5,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});

export default ListeDieteticiens;