import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDocument, updateDocument } from '../../../../services/firebase/firebaseService';

const NouvelleConsultation = ({ navigation, route }) => {
  const { patient, dieteticien } = route.params;
  const patientName = route?.params?.patientName || 'Marie Dubois';
  const patientId = route?.params?.patientId;
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(14);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [pickerTab, setPickerTab] = useState('calendar'); // 'calendar' ou 'clock'
  
  // États du formulaire
  const [formData, setFormData] = useState({
    // Mesures de base
    poids: '',
    taille: '',
    
    // Objectif
    objectif: 'perte', // perte, prise, maintien, muscle
    objectifPrecis: '',
    
    // Habitudes alimentaires
    repasParJour: '3',
    petitDej: '',
    dejeuner: '',
    diner: '',
    allergies: '',
    
    // Contraintes médicales
    diabete: false,
    hypertension: false,
    cholesterol: false,
    digestif: '',
    
    // Activité physique
    activite: 'moyen', // faible, moyen, élevé
    
    // Notes consultation
    notes: '',
    prescription: '',
    planDiet: '',
    prochainObjectif: '',
    prochainRendezVous: ''
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const calculerIMC = () => {
    const poids = parseFloat(formData.poids);
    const taille = parseFloat(formData.taille) / 100;
    if (poids && taille) {
      return (poids / (taille * taille)).toFixed(1);
    }
    return '--';
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Champs obligatoires
    if (!formData.poids || parseFloat(formData.poids) <= 0) {
      newErrors.poids = 'Le poids est obligatoire';
    }
    
    if (!formData.taille || parseFloat(formData.taille) <= 0) {
      newErrors.taille = 'La taille est obligatoire';
    }
    
    if (!formData.objectif) {
      newErrors.objectif = 'L\'objectif est obligatoire';
    }
    
    if (!formData.notes || formData.notes.trim().length === 0) {
      newErrors.notes = 'Les observations sont obligatoires';
    }
    
    if (!formData.planDiet || formData.planDiet.trim().length === 0) {
      newErrors.planDiet = 'Le plan diététique est obligatoire';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getNextSuggestedDate = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  const handleDateSelect = (days) => {
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + days);
    const dateString = selectedDate.toISOString().split('T')[0];
    const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    const fullDateTime = `${dateString}T${timeString}`;
    updateField('prochainRendezVous', fullDateTime);
    setShowDatePicker(false);
  };

  const handleConfirmDateTime = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const timeString = `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
    const fullDateTime = `${dateString}T${timeString}`;
    updateField('prochainRendezVous', fullDateTime);
    setShowDatePicker(false);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Sélectionner une date et heure';
    try {
      const date = new Date(dateTimeString);
      const datePart = date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const timePart = dateTimeString.includes('T') 
        ? dateTimeString.split('T')[1].substring(0, 5)
        : '14:00';
      return `${datePart} à ${timePart}`;
    } catch {
      return 'Sélectionner une date et heure';
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const getNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    setSelectedDate(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedDate);
    const firstDay = getFirstDayOfMonth(selectedDate);
    const days = [];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    // Jours vides avant le premier jour
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === new Date().getMonth();
      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
          onPress={() => handleDayClick(day)}
        >
          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={getPreviousMonth}>
            <Ionicons name="chevron-back" size={24} color="#815F9C" />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={getNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#815F9C" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarWeekDays}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
            <Text key={index} style={styles.calendarWeekDay}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days}
        </View>
      </View>
    );
  };

  const renderClock = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    return (
      <View style={styles.clockContainer}>
        <View style={styles.timeDisplayBox}>
          <Text style={styles.timeDisplay}>
            {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.clockSelectors}>
          <View style={styles.clockSelector}>
            <Text style={styles.selectorLabel}>Heure</Text>
            <ScrollView 
              style={styles.hourMinuteScroll}
              contentOffset={{ x: 0, y: (selectedHour - 2) * 40 }}
            >
              {hours.map(hour => (
                <TouchableOpacity
                  key={`hour-${hour}`}
                  style={[
                    styles.hourOption,
                    selectedHour === hour && styles.hourOptionSelected
                  ]}
                  onPress={() => setSelectedHour(hour)}
                >
                  <Text style={[
                    styles.hourOptionText,
                    selectedHour === hour && styles.hourOptionTextSelected
                  ]}>
                    {String(hour).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={styles.timeSeparatorBig}>:</Text>

          <View style={styles.clockSelector}>
            <Text style={styles.selectorLabel}>Minutes</Text>
            <ScrollView 
              style={styles.hourMinuteScroll}
              contentOffset={{ x: 0, y: (selectedMinute - 2) * 40 }}
            >
              {minutes.map(minute => (
                <TouchableOpacity
                  key={`minute-${minute}`}
                  style={[
                    styles.hourOption,
                    selectedMinute === minute && styles.hourOptionSelected
                  ]}
                  onPress={() => setSelectedMinute(minute)}
                >
                  <Text style={[
                    styles.hourOptionText,
                    selectedMinute === minute && styles.hourOptionTextSelected
                  ]}>
                    {String(minute).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!validateForm()) {
      Alert.alert(
        'Formulaire incomplet',
        'Veuillez remplir tous les champs obligatoires marqués d\'un *',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      // Préparer les données pour la BD
      const consultationData = {
        ...formData,
        patientId: patient?.id,
        patientName: patient?.nom + ' ' + patient?.prenom,
        dieteticienId: dieteticien?.id,
        date: new Date().toISOString(),
        imc: calculerIMC(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatePatientData = {
        tailleActuel: formData.taille,
        poidsActuel: formData.poids,
        objectifActuel: formData.objectifPrecis,
        isDiabete: formData.diabete,
        isHypertension: formData.hypertension,
        isCholesterol: formData.cholesterol,
        prochainRendezVous: formData?.prochainRendezVous,
        updatedAt: new Date().toISOString(),

      }
      // Simuler l'appel API (remplacer par votre vraie fonction)
      const newConsulte = await addDocument("consultations", consultationData);
      await updateDocument("patients", patient?.id, updatePatientData);
      // Simulation d'un délai réseau
      // await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Consultation enregistrée:', consultationData);

      // Succès
      Alert.alert(
        'Succès',
        'La consultation a été enregistrée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation?.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} disabled={loading}>
          <Ionicons name="close" size={28} color="#815F9C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Consultation</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info */}
        <View style={styles.patientBanner}>
          <Ionicons name="person-circle-outline" size={32} color="#815F9C" />
          <Text style={styles.patientBannerText}>{patientName}</Text>
        </View>

        {/* Section 1: Mesures de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="fitness-outline" size={18} color="#815F9C" /> Mesures
          </Text>
          
          <View style={styles.row}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Poids (kg) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.poids && styles.inputError]}
                placeholder="68"
                keyboardType="decimal-pad"
                value={formData.poids}
                onChangeText={(val) => updateField('poids', val)}
                editable={!loading}
              />
              {errors.poids && <Text style={styles.errorText}>{errors.poids}</Text>}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Taille (cm) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.taille && styles.inputError]}
                placeholder="165"
                keyboardType="number-pad"
                value={formData.taille}
                onChangeText={(val) => updateField('taille', val)}
                editable={!loading}
              />
              {errors.taille && <Text style={styles.errorText}>{errors.taille}</Text>}
            </View>
          </View>

          <View style={styles.imcCard}>
            <Text style={styles.imcLabel}>IMC calculé</Text>
            <Text style={styles.imcValue}>{calculerIMC()}</Text>
          </View>
        </View>

        {/* Section 2: Objectif */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="flag-outline" size={18} color="#815F9C" /> Objectif <Text style={styles.required}>*</Text>
          </Text>
          
          <View style={styles.objectifButtons}>
            {[
              { key: 'perte', label: 'Perte de poids', icon: 'trending-down' },
              { key: 'prise', label: 'Prise de poids', icon: 'trending-up' },
              { key: 'maintien', label: 'Maintien', icon: 'remove' },
              { key: 'muscle', label: 'Masse musculaire', icon: 'barbell' }
            ].map(obj => (
              <TouchableOpacity
                key={obj.key}
                style={[
                  styles.objectifButton,
                  formData.objectif === obj.key && styles.objectifButtonActive
                ]}
                onPress={() => updateField('objectif', obj.key)}
                disabled={loading}
              >
                <Ionicons 
                  name={obj.icon} 
                  size={20} 
                  color={formData.objectif === obj.key ? '#fff' : '#815F9C'} 
                />
                <Text style={[
                  styles.objectifButtonText,
                  formData.objectif === obj.key && styles.objectifButtonTextActive
                ]}>
                  {obj.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Objectif précis (ex: -10kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Décrivez l'objectif..."
              value={formData.objectifPrecis}
              onChangeText={(val) => updateField('objectifPrecis', val)}
              editable={!loading}
            />
          </View>
        </View>

        {/* Section 3: Habitudes alimentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="restaurant-outline" size={18} color="#815F9C" /> Habitudes Alimentaires
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Repas par jour</Text>
            <View style={styles.radioGroup}>
              {['2', '3', '4', '5+'].map(nb => (
                <TouchableOpacity
                  key={nb}
                  style={[
                    styles.radioButton,
                    formData.repasParJour === nb && styles.radioButtonActive
                  ]}
                  onPress={() => updateField('repasParJour', nb)}
                  disabled={loading}
                >
                  <Text style={[
                    styles.radioButtonText,
                    formData.repasParJour === nb && styles.radioButtonTextActive
                  ]}>
                    {nb}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Petit déjeuner type</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Café, pain complet, fruit..."
              multiline
              numberOfLines={2}
              value={formData.petitDej}
              onChangeText={(val) => updateField('petitDej', val)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Déjeuner type</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Viande, légumes, riz..."
              multiline
              numberOfLines={2}
              value={formData.dejeuner}
              onChangeText={(val) => updateField('dejeuner', val)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Dîner type</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Ex: Soupe, salade, poisson..."
              multiline
              numberOfLines={2}
              value={formData.diner}
              onChangeText={(val) => updateField('diner', val)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Allergies / Aliments interdits</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Lactose, arachides, gluten..."
              value={formData.allergies}
              onChangeText={(val) => updateField('allergies', val)}
              editable={!loading}
            />
          </View>
        </View>

        {/* Section 4: Contraintes médicales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="medical-outline" size={18} color="#815F9C" /> Contraintes Médicales
          </Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Diabète</Text>
            <Switch
              value={formData.diabete}
              onValueChange={(val) => updateField('diabete', val)}
              trackColor={{ false: '#E0E0E0', true: '#B19CD9' }}
              thumbColor={formData.diabete ? '#815F9C' : '#f4f3f4'}
              disabled={loading}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Hypertension</Text>
            <Switch
              value={formData.hypertension}
              onValueChange={(val) => updateField('hypertension', val)}
              trackColor={{ false: '#E0E0E0', true: '#B19CD9' }}
              thumbColor={formData.hypertension ? '#815F9C' : '#f4f3f4'}
              disabled={loading}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Cholestérol</Text>
            <Switch
              value={formData.cholesterol}
              onValueChange={(val) => updateField('cholesterol', val)}
              trackColor={{ false: '#E0E0E0', true: '#B19CD9' }}
              thumbColor={formData.cholesterol ? '#815F9C' : '#f4f3f4'}
              disabled={loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Problèmes digestifs</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Ballonnements, constipation..."
              value={formData.digestif}
              onChangeText={(val) => updateField('digestif', val)}
              editable={!loading}
            />
          </View>
        </View>

        {/* Section 5: Activité physique */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="barbell-outline" size={18} color="#815F9C" /> Activité Physique
          </Text>
          
          <View style={styles.activiteButtons}>
            {[
              { key: 'faible', label: 'Faible', desc: 'Sédentaire' },
              { key: 'moyen', label: 'Moyen', desc: '2-3x/semaine' },
              { key: 'élevé', label: 'Élevé', desc: '4+/semaine' }
            ].map(act => (
              <TouchableOpacity
                key={act.key}
                style={[
                  styles.activiteButton,
                  formData.activite === act.key && styles.activiteButtonActive
                ]}
                onPress={() => updateField('activite', act.key)}
                disabled={loading}
              >
                <Text style={[
                  styles.activiteButtonLabel,
                  formData.activite === act.key && styles.activiteButtonLabelActive
                ]}>
                  {act.label}
                </Text>
                <Text style={[
                  styles.activiteButtonDesc,
                  formData.activite === act.key && styles.activiteButtonDescActive
                ]}>
                  {act.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 6: Notes de consultation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="create-outline" size={18} color="#815F9C" /> Notes de Consultation
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Observations générales <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.notes && styles.inputError]}
              placeholder="Notes sur l'état du patient, motivation, remarques..."
              multiline
              numberOfLines={4}
              value={formData.notes}
              onChangeText={(val) => updateField('notes', val)}
              editable={!loading}
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Plan diététique <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.planDiet && styles.inputError]}
              placeholder="Ex: Régime méditerranéen, 1800 kcal/jour..."
              multiline
              numberOfLines={3}
              value={formData.planDiet}
              onChangeText={(val) => updateField('planDiet', val)}
              editable={!loading}
            />
            {errors.planDiet && <Text style={styles.errorText}>{errors.planDiet}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prescription / Recommandations</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Recommandations à suivre jusqu'à la prochaine consultation..."
              multiline
              numberOfLines={3}
              value={formData.prescription}
              onChangeText={(val) => updateField('prescription', val)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prochain objectif</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Perdre 2kg supplémentaires..."
              value={formData.prochainObjectif}
              onChangeText={(val) => updateField('prochainObjectif', val)}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prochain rendez-vous</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
              disabled={loading}
            >
              <Ionicons name="calendar-outline" size={20} color="#815F9C" />
              <Text style={styles.datePickerButtonText}>
                {formatDateTime(formData.prochainRendezVous)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Sélectionner date et heure</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color="#815F9C" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.pickerTabs}>
              <TouchableOpacity
                style={[styles.pickerTab, pickerTab === 'calendar' && styles.pickerTabActive]}
                onPress={() => setPickerTab('calendar')}
              >
                <Ionicons 
                  name="calendar-outline" 
                  size={20} 
                  color={pickerTab === 'calendar' ? '#815F9C' : '#B9A9CC'} 
                />
                <Text style={[styles.pickerTabText, pickerTab === 'calendar' && styles.pickerTabTextActive]}>
                  Calendrier
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerTab, pickerTab === 'clock' && styles.pickerTabActive]}
                onPress={() => setPickerTab('clock')}
              >
                <Ionicons 
                  name="time-outline" 
                  size={20} 
                  color={pickerTab === 'clock' ? '#815F9C' : '#B9A9CC'} 
                />
                <Text style={[styles.pickerTabText, pickerTab === 'clock' && styles.pickerTabTextActive]}>
                  Heure
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.datePickerContent}>
              {pickerTab === 'calendar' ? renderCalendar() : renderClock()}
            </ScrollView>

            <View style={styles.datePickerFooter}>
              <TouchableOpacity
                style={styles.datePickerConfirmButton}
                onPress={handleConfirmDateTime}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.datePickerConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={() => navigation?.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Enregistrement...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F0F5',
  },
  header: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  content: {
    flex: 1,
  },
  patientBanner: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  patientBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E223D',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 16,
  },
  required: {
    color: '#F44336',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E223D',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F6F0F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E223D',
    borderWidth: 1,
    borderColor: '#EAE3EC',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: '#F6F0F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E223D',
    borderWidth: 1,
    borderColor: '#EAE3EC',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imcCard: {
    backgroundColor: '#815F9C',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  imcLabel: {
    fontSize: 12,
    color: '#E8D9F0',
    marginBottom: 4,
  },
  imcValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  objectifButtons: {
    gap: 8,
    marginBottom: 16,
  },
  objectifButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EAE3EC',
    backgroundColor: '#F6F0F5',
  },
  objectifButtonActive: {
    backgroundColor: '#815F9C',
    borderColor: '#815F9C',
  },
  objectifButtonText: {
    fontSize: 14,
    color: '#815F9C',
    fontWeight: '600',
    marginLeft: 8,
  },
  objectifButtonTextActive: {
    color: '#fff',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EAE3EC',
    backgroundColor: '#F6F0F5',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#815F9C',
    borderColor: '#815F9C',
  },
  radioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#815F9C',
  },
  radioButtonTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  switchLabel: {
    fontSize: 14,
    color: '#1E223D',
  },
  activiteButtons: {
    gap: 8,
  },
  activiteButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EAE3EC',
    backgroundColor: '#F6F0F5',
  },
  activiteButtonActive: {
    backgroundColor: '#815F9C',
    borderColor: '#815F9C',
  },
  activiteButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 4,
  },
  activiteButtonLabelActive: {
    color: '#fff',
  },
  activiteButtonDesc: {
    fontSize: 12,
    color: '#7D5F9B',
  },
  activiteButtonDescActive: {
    color: '#E8D9F0',
  },
  footer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAE3EC',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#815F9C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#815F9C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  datePickerButton: {
    backgroundColor: '#F6F0F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E223D',
    borderWidth: 1,
    borderColor: '#EAE3EC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#1E223D',
    fontWeight: '500',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerHeader: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  pickerTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
  },
  pickerTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  pickerTabActive: {
    borderBottomColor: '#815F9C',
  },
  pickerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B9A9CC',
  },
  pickerTabTextActive: {
    color: '#815F9C',
  },
  datePickerContent: {
    backgroundColor: '#fff',
    maxHeight: '70%',
    padding: 16,
  },
  datePickerFooter: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EAE3EC',
  },
  datePickerConfirmButton: {
    backgroundColor: '#815F9C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  calendarMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E223D',
    textTransform: 'capitalize',
  },
  calendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  calendarWeekDay: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#815F9C',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDaySelected: {
    backgroundColor: '#815F9C',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1E223D',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clockContainer: {
    alignItems: 'center',
  },
  timeDisplayBox: {
    backgroundColor: '#F6F0F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#815F9C',
  },
  clockSelectors: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 0,
  },
  clockSelector: {
    alignItems: 'center',
    width: 80,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#815F9C',
    marginBottom: 8,
  },
  hourMinuteScroll: {
    height: 180,
    borderWidth: 1,
    borderColor: '#EAE3EC',
    borderRadius: 8,
    backgroundColor: '#F6F0F5',
    // padding:10
  },
  hourOption: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3EC',
    paddingHorizontal: 12
  },
  hourOptionSelected: {
    backgroundColor: '#815F9C',
    borderBottomColor: '#815F9C',
    
  },
  hourOptionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#7D5F9B',
  },
  hourOptionTextSelected: {
    color: '#fff',
  },
  timeSeparatorBig: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#815F9C',
    marginBottom: 8,
  },
});

export default NouvelleConsultation;