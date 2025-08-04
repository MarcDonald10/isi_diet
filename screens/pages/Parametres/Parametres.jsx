import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';

const Parametres = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Paramètres</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Préférences</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Mode sombre</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Changer la langue</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Modifier le mot de passe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Activer l’authentification à deux facteurs</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Confidentialité</Text>
        <Text style={styles.infoText}>
          Pour supprimer une conversation, cliquez sur l’icône livre sous le message et sélectionnez la conversation. Pour désactiver la mémoire, allez dans « Contrôles des données ».
        </Text>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Supprimer le compte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
  },
  settingText: { fontSize: 14, color: '#333' },
  settingButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  settingButtonText: { color: '#fff', fontSize: 14 },
  infoText: { fontSize: 14, color: '#666', marginBottom: 10 },
});

export default Parametres;