import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const Paiements = () => {
  const abonnements = [
    { id: '1', titre: 'Abonnement Premium', prix: 'Inconnu', status: 'Actif' },
    { id: '2', titre: 'Master Class : Diabète', prix: 'Inconnu', status: 'Acheté' },
  ];

  const renderAbonnement = ({ item }) => (
    <View style={styles.abonnementItem}>
      <Text style={styles.abonnementTitre}>{item.titre}</Text>
      <Text style={styles.abonnementPrix}>Prix : {item.prix}</Text>
      <Text style={styles.abonnementStatus}>Statut : {item.status}</Text>
      <TouchableOpacity style={styles.actionButton}>
        <Text style={styles.actionText}>Gérer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Paiements</Text>
      <Text style={styles.infoText}>
        Pour plus d’informations sur les abonnements, visitez{' '}
        <Text style={styles.link}>https://x.ai/grok</Text>
      </Text>
      <FlatList
        data={abonnements}
        renderItem={renderAbonnement}
        keyExtractor={(item) => item.id}
        style={styles.abonnementList}
      />
      <TouchableOpacity style={styles.addPaymentButton}>
        <Text style={styles.addPaymentText}>Ajouter un moyen de paiement</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  infoText: { fontSize: 14, color: '#666', marginBottom: 15 },
  link: { color: '#007bff', textDecorationLine: 'underline' },
  abonnementList: { flex: 1 },
  abonnementItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  abonnementTitre: { fontSize: 16, fontWeight: '600', color: '#333' },
  abonnementPrix: { fontSize: 14, color: '#666', marginVertical: 5 },
  abonnementStatus: { fontSize: 14, color: '#666' },
  actionButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  actionText: { color: '#fff', fontSize: 14 },
  addPaymentButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  addPaymentText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Paiements;