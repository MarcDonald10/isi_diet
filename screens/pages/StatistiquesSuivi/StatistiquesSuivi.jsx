import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LineChart } from 'react-native-chart-kit'; // Nécessite react-native-chart-kit
import { Ionicons } from '@expo/vector-icons';

const StatistiquesSuivi = () => {
  const data = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr'],
    datasets: [{ data: [70, 68, 67, 65] }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=80&q=80' }}
          style={styles.headerImage}
        />
        <Text style={styles.header}>Statistiques et Suivi</Text>
      </View>
      <Text style={styles.subHeader}>Évolution du poids</Text>
      <LineChart
        data={data}
        width={340}
        height={200}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(129, 95, 156, ${opacity})`, // pomp-and-power
          labelColor: (opacity = 1) => `rgba(30, 34, 61, ${opacity})`, // space-cadet
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#7D5F9B', // pomp-and-power-2
          },
        }}
        bezier
        style={styles.chart}
      />
      <View style={styles.statsContainer}>
        <Text style={styles.statText}>Patients diabétiques : <Text style={styles.statValue}>120</Text></Text>
        <Text style={styles.statText}>Patients hypertendus : <Text style={styles.statValue}>80</Text></Text>
        <Text style={styles.statText}>Patients obèses : <Text style={styles.statValue}>50</Text></Text>
      </View>
      <TouchableOpacity style={styles.exportButton}>
        <Ionicons name="download-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.exportText}>Exporter le rapport</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F0F5', padding: 15 }, // magnolia
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#EAE3EC', // magnolia-2
    backgroundColor: '#fff',
  },
  header: { fontSize: 22, fontWeight: 'bold', color: '#815F9C', letterSpacing: 0.2 }, // pomp-and-power
  subHeader: { fontSize: 16, fontWeight: '600', color: '#7D5F9B', marginBottom: 10 }, // pomp-and-power-2
  chart: {
    borderRadius: 16,
    marginBottom: 18,
    backgroundColor: '#fff',
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#815F9C',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#EAE3EC', // magnolia-2
    elevation: 1,
  },
  statText: { fontSize: 15, color: '#1E223D', marginVertical: 5 }, // space-cadet
  statValue: { color: '#815F9C', fontWeight: 'bold' }, // pomp-and-power
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#815F9C', // pomp-and-power
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#815F9C',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  exportText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default StatistiquesSuivi;