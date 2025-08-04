import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const ConseilsNutritionnels = () => {
  const conseils = [
    { id: '1', titre: 'Menu du jour', description: 'Petit-déjeuner : Pain complet + avocat' },
    { id: '2', titre: 'Aliments à privilégier', description: 'Légumes verts, céréales complètes' },
    { id: '3', titre: 'Aliments à éviter', description: 'Sucre raffiné, aliments frits' },
  ];

  const renderConseil = ({ item }) => (
    <View style={styles.conseilItem}>
      <Text style={styles.conseilTitre}>{item.titre}</Text>
      <Text style={styles.conseilDescription}>{item.description}</Text>
      <TouchableOpacity style={styles.detailsButton}>
        <Text style={styles.detailsText}>Voir détails</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conseils Nutritionnels</Text>
      <FlatList
        data={conseils}
        renderItem={renderConseil}
        keyExtractor={(item) => item.id}
        style={styles.conseilList}
      />
      <TouchableOpacity style={styles.searchButton}>
        <Text style={styles.searchText}>Rechercher un aliment</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  conseilList: { flex: 1 },
  conseilItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  conseilTitre: { fontSize: 16, fontWeight: '600', color: '#333' },
  conseilDescription: { fontSize: 14, color: '#666', marginVertical: 5 },
  detailsButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  detailsText: { color: '#fff', fontSize: 14 },
  searchButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  searchText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ConseilsNutritionnels;