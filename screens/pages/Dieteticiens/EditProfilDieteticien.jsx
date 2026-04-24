import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { updateDieteticienProfile, uploadProfileImage } from '../../../services/firebase/firebaseService';

const EditProfilDieteticien = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(user?.photo || null);
    const [formData, setFormData] = useState({
        name: user?.name || user?.nom || '',
        email: user?.email || '',
        specialite: user?.specialite || '',
        location: user?.location || '',
        bio: user?.bio || '',
        experience: user?.experience || '',
        education: user?.education || '',
        phone: user?.phone || '',
        certifications: user?.certifications || [],
        newCertification: '',
        languages: user?.languages || [],
        newLanguage: '',
        availability: user?.availability || [],
        newAvailability: '',
        clinic: user?.clinic || '',
        expertise: user?.expertise || [],
        newExpertise: '',
        price: user?.price || '',
        isAvailable: user?.isAvailable !== false,
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddCertification = () => {
        if (formData.newCertification.trim()) {
            setFormData(prev => ({
                ...prev,
                certifications: [...prev.certifications, formData.newCertification.trim()],
                newCertification: '',
            }));
        }
    };

    const handleRemoveCertification = (index) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index),
        }));
    };


    const handleAddExpertise = () => {
        if (formData.newExpertise.trim()) {
            setFormData(prev => ({
                ...prev,
                expertise: [...prev.expertise, formData.newExpertise.trim()],
                newExpertise: '',
            }));
        }
    };

     const handleRemoveExpertise = (index) => {
        setFormData(prev => ({
            ...prev,
            expertise: prev.expertise.filter((_, i) => i !== index),
        }));
    };

    const handleAddLanguage = () => {
        if (formData.newLanguage.trim() && !formData.languages.includes(formData.newLanguage.trim())) {
            setFormData(prev => ({
                ...prev,
                languages: [...prev.languages, formData.newLanguage.trim()],
                newLanguage: '',
            }));
        }
    };

    const handleRemoveLanguage = (index) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index),
        }));
    };

    const handleAddAvailability = () => {
        if (formData.newAvailability.trim() && !formData.availability.includes(formData.newAvailability.trim())) {
            setFormData(prev => ({
                ...prev,
                availability: [...prev.availability, formData.newAvailability.trim()],
                newAvailability: '',
            }));
        }
    };

    const handleRemoveAvailability = (index) => {
        setFormData(prev => ({
            ...prev,
            availability: prev.availability.filter((_, i) => i !== index),
        }));
    };

    const handlePickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.cancelled) {
                setProfilePhoto(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sélectionner une image');
            console.error('Error picking image:', error);
        }
    };

    const handleSaveProfile = async () => {
        if (!formData.name.trim() || !formData.specialite.trim()) {
            Alert.alert('Validation', 'Veuillez remplir au moins le nom et la spécialité');
            return;
        }

        setLoading(true);
        try {
            let photoURL = user?.photo;

            // Uploader la photo si elle a changé
            if (profilePhoto && profilePhoto !== user?.photo) {
                photoURL = await uploadProfileImage(user.uid, profilePhoto);
            }

            // Préparer les données à sauvegarder clinic
            const updateData = {
                name: formData.name,
                email: formData.email,
                specialite: formData.specialite,
                location: formData.location,
                clinic: formData.clinic,
                bio: formData.bio,
                experience: formData.experience,
                education: formData.education,
                phone: formData.phone,
                certifications: formData.certifications,
                expertise: formData.expertise,
                languages: formData.languages,
                availability: formData.availability,
                price: formData.price,
                isAvailable: formData.isAvailable,
                photo: photoURL,
            };

            // Sauvegarder dans Firebase
            await updateDieteticienProfile(user.uid, updateData);

            // Rafraîchir les données utilisateur
            await refreshUser();

            Alert.alert('Succès', 'Profil mis à jour avec succès !', [
                {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                }
            ]);
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible de mettre à jour le profil. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    const renderCertification = ({ item, index }) => (
        <View style={styles.certificationTag}>
            <Text style={styles.certificationText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveCertification(index)}>
                <Ionicons name="close-circle" size={20} color="#E53E3E" />
            </TouchableOpacity>
        </View>
    );

     const renderExpertise = ({ item, index }) => (
        <View style={styles.certificationTag}>
            <Text style={styles.certificationText}>{item}</Text>
            <TouchableOpacity onPress={() => handleRemoveExpertise(index)}>
                <Ionicons name="close-circle" size={20} color="#E53E3E" />
            </TouchableOpacity>
        </View>
    );

    const renderLanguage = ({ item, index }) => (
        <View style={styles.tagItem}>
            <Text style={styles.tagText}>🌐 {item}</Text>
            <TouchableOpacity onPress={() => handleRemoveLanguage(index)}>
                <Ionicons name="close-circle" size={18} color="#E53E3E" />
            </TouchableOpacity>
        </View>
    );

    const renderAvailability = ({ item, index }) => (
        <View style={styles.tagItem}>
            <Text style={styles.tagText}>📅 {item}</Text>
            <TouchableOpacity onPress={() => handleRemoveAvailability(index)}>
                <Ionicons name="close-circle" size={18} color="#E53E3E" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* En-tête */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Modifier mon profil</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Section Photo de profil */}
                <View style={styles.photoSection}>
                    <Image 
                        source={{ uri: profilePhoto || user?.photo || 'https://via.placeholder.com/130' }}
                        style={styles.profilePhoto}
                    />
                    <TouchableOpacity 
                        style={styles.editPhotoButton}
                        onPress={handlePickImage}
                    >
                        <Ionicons name="camera-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Section Informations de base */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Informations Personnelles</Text>
                    
                    <Text style={styles.inputLabel}>Nom</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Votre nom"
                        value={formData.name}
                        onChangeText={(value) => handleInputChange('name', value)}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        placeholder="Email"
                        value={formData.email}
                        editable={false}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Téléphone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Votre numéro de téléphone"
                        value={formData.phone}
                        onChangeText={(value) => handleInputChange('phone', value)}
                        keyboardType="phone-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Localisation</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ville, Pays"
                        value={formData.location}
                        onChangeText={(value) => handleInputChange('location', value)}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Votre Clinique</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom de votre clinique ou lieu de travail"
                        value={formData.clinic}
                        onChangeText={(value) => handleInputChange('clinic', value)}
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Section Professionnel  */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Informations Professionnelles</Text>
                    
                    <Text style={styles.inputLabel}>Spécialités</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Diabète, Perte de poids"
                        value={formData.specialite}
                        onChangeText={(value) => handleInputChange('specialite', value)}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Expérience</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 10 ans"
                        value={formData.experience}
                        onChangeText={(value) => handleInputChange('experience', value)}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Formation</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Master en Nutrition"
                        value={formData.education}
                        onChangeText={(value) => handleInputChange('education', value)}
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Biographie</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Décrivez votre parcours et votre approche"
                        value={formData.bio}
                        onChangeText={(value) => handleInputChange('bio', value)}
                        multiline
                        numberOfLines={4}
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Section Certifications */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Certifications</Text>
                    
                    <View style={styles.certificationInput}>
                        <TextInput
                            style={styles.certificationField}
                            placeholder="Ajouter une certification"
                            value={formData.newCertification}
                            onChangeText={(value) => handleInputChange('newCertification', value)}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddCertification}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.certificationsList}>
                        <FlatList
                            data={formData.certifications}
                            renderItem={renderCertification}
                            keyExtractor={(_, index) => index.toString()}
                            scrollEnabled={false}
                            nestedScrollEnabled={false}
                        />
                    </View>

                    {formData.certifications.length === 0 && (
                        <Text style={styles.emptyText}>Aucune certification ajoutée</Text>
                    )}
                </View>

                {/* Section Expertise */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Domaine d'Expertise</Text>
                    
                    <View style={styles.certificationInput}>
                        <TextInput
                            style={styles.certificationField}
                            placeholder="Ajouter un domaine d'expertise"
                            value={formData.newExpertise}
                            onChangeText={(value) => handleInputChange('newExpertise', value)}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddExpertise}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.certificationsList}>
                        <FlatList
                            data={formData.expertise}
                            renderItem={renderExpertise}
                            keyExtractor={(_, index) => index.toString()}
                            scrollEnabled={false}
                            nestedScrollEnabled={false}
                        />
                    </View>

                    {formData.expertise.length === 0 && (
                        <Text style={styles.emptyText}>Aucune expertise ajoutée</Text>
                    )}
                </View>

                {/* Section Langues */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Langues Parlées</Text>
                    
                    <View style={styles.certificationInput}>
                        <TextInput
                            style={styles.certificationField}
                            placeholder="Ex: Français, Anglais, Arabe"
                            value={formData.newLanguage}
                            onChangeText={(value) => handleInputChange('newLanguage', value)}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddLanguage}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.certificationsList}>
                        <FlatList
                            data={formData.languages}
                            renderItem={renderLanguage}
                            keyExtractor={(_, index) => index.toString()}
                            scrollEnabled={false}
                            nestedScrollEnabled={false}
                        />
                    </View>

                    {formData.languages.length === 0 && (
                        <Text style={styles.emptyText}>Aucune langue ajoutée</Text>
                    )}
                </View>

                {/* Section Disponibilités */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Disponibilités</Text>
                    
                    <View style={styles.certificationInput}>
                        <TextInput
                            style={styles.certificationField}
                            placeholder="Ex: Lundi 10h-12h"
                            value={formData.newAvailability}
                            onChangeText={(value) => handleInputChange('newAvailability', value)}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddAvailability}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.certificationsList}>
                        <FlatList
                            data={formData.availability}
                            renderItem={renderAvailability}
                            keyExtractor={(_, index) => index.toString()}
                            scrollEnabled={false}
                            nestedScrollEnabled={false}
                        />
                    </View>

                    {formData.availability.length === 0 && (
                        <Text style={styles.emptyText}>Aucune disponibilité ajoutée</Text>
                    )}
                </View>

                {/* Section Tarifs et Disponibilité */}
                <View style={styles.formCard}>
                    <Text style={styles.sectionTitle}>Tarifs & Disponibilité</Text>
                    
                    <Text style={styles.inputLabel}>Prix par consultation (F CFA)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 50"
                        value={formData.price}
                        onChangeText={(value) => handleInputChange('price', value)}
                        keyboardType="decimal-pad"
                        placeholderTextColor="#999"
                    />

                    <Text style={styles.inputLabel}>Disponibilité</Text>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            formData.isAvailable ? styles.toggleButtonActive : styles.toggleButtonInactive
                        ]}
                        onPress={() => handleInputChange('isAvailable', !formData.isAvailable)}
                    >
                        <Ionicons 
                            name={formData.isAvailable ? "checkmark-circle" : "close-circle"} 
                            size={24} 
                            color="#fff" 
                        />
                        <Text style={styles.toggleText}>
                            {formData.isAvailable ? 'Disponible pour les consultations' : 'Non disponible'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Boutons d'action */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        disabled={loading}
                    >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Sauvegarder</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        alignItems: 'center',
        backgroundColor: '#4A2F7D',
        padding: 20,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 15,
    },
    photoSection: {
        alignItems: 'center',
        marginVertical: 30,
    },
    profilePhoto: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 3,
        borderColor: '#F4C430',
    },
    editPhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: '35%',
        backgroundColor: '#4A2F7D',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#F8F7FC',
    },
    formCard: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#F4C430',
        paddingBottom: 10,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F8F7FC',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    inputDisabled: {
        backgroundColor: '#F0F0F0',
        color: '#999',
    },
    textArea: {
        textAlignVertical: 'top',
        paddingTop: 12,
        minHeight: 100,
    },
    certificationInput: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    certificationField: {
        flex: 1,
        backgroundColor: '#F8F7FC',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 14,
        color: '#333',
    },
    addButton: {
        backgroundColor: '#10B981',
        width: 50,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    certificationsList: {
        marginTop: 10,
    },
    certificationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        justifyContent: 'space-between',
    },
    certificationText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '500',
        flex: 1,
    },
    tagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 8,
        justifyContent: 'space-between',
    },
    tagText: {
        fontSize: 14,
        color: '#1976D2',
        fontWeight: '500',
        flex: 1,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginTop: 10,
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: '#10B981',
    },
    toggleButtonInactive: {
        backgroundColor: '#EF4444',
    },
    toggleText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 15,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 15,
        marginHorizontal: 15,
        marginVertical: 30,
        marginBottom: 50,
    },
    cancelButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E0E0E0',
        paddingVertical: 14,
        borderRadius: 12,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#A0AEC0',
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default EditProfilDieteticien;