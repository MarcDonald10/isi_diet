import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';

const masterClassImages = {
  'Gestion du diabète': { uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80' },
  'Nutrition et hypertension': { uri: 'https://images.unsplash.com/photo-1510626176961-4b57d4fbad04?auto=format&fit=crop&w=400&q=80' },
};

const MasterClasses = ({ navigation }) => {
  const [masterClasses, setMasterClasses] = useState([
    { id: '1', titre: 'Gestion du diabète', type: 'En direct', image: masterClassImages['Gestion du diabète'] },
    { id: '2', titre: 'Nutrition et hypertension', type: 'Préenregistré', image: masterClassImages['Nutrition et hypertension'] },
  ]);

  const renderMasterClass = ({ item }) => (
    <TouchableOpacity
      style={styles.classItem}
      onPress={() => navigation.navigate('ClassDetail', { titre: item.titre })}
    >
      <Image source={item.image} style={styles.classImage} />
      <View style={styles.classInfo}>
        <Text style={styles.classTitre}>{item.titre}</Text>
        <Text style={styles.classType}>{item.type}</Text>
        <TouchableOpacity style={styles.inscriptionButton}>
          <Text style={styles.inscriptionText}>S’inscrire</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Master Classes</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Gratuit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Premium</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={masterClasses}
        renderItem={renderMasterClass}
        keyExtractor={(item) => item.id}
        style={styles.classList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F0F5', padding: 15 }, // magnolia
  header: { fontSize: 22, fontWeight: 'bold', color: '#815F9C', marginBottom: 15, letterSpacing: 0.2 }, // pomp-and-power
  filterContainer: { flexDirection: 'row', marginBottom: 15 },
  filterButton: {
    backgroundColor: '#815F9C', // pomp-and-power
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#EAE3EC', // magnolia-2
  },
  filterText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  classList: { flex: 1 },
  classItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#815F9C',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1.5,
    borderColor: '#EAE3EC', // magnolia-2
    overflow: 'hidden',
  },
  classImage: { width: 100, height: 100, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  classInfo: { flex: 1, padding: 14, justifyContent: 'center' },
  classTitre: { fontSize: 17, fontWeight: 'bold', color: '#1E223D', marginBottom: 4 }, // space-cadet
  classType: { fontSize: 14, color: '#7D5F9B', marginBottom: 10 }, // pomp-and-power-2
  inscriptionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginTop: 4,
    shadowColor: '#4CAF50',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inscriptionText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});

export default MasterClasses;