import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../../../contexts/AuthContext';
import { db, storage } from '../../../../services/firebase/firebaseConfig';

const MasterClassForm = ({ navigation }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [date, setDate] = useState(null);
    const [time, setTime] = useState(null);
    const [maxParticipants, setMaxParticipants] = useState('');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [requirements, setRequirements] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 90; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const generateTimes = () => {
        const times = [];
        for (let i = 8; i < 20; i++) {
            times.push(`${i.toString().padStart(2, '0')}:00`);
            times.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return times;
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleSelectDate = (dateObj) => {
        setDate(dateObj);
        setShowDatePicker(false);
    };

    const handleSelectTime = (timeStr) => {
        setTime(timeStr);
        setShowTimePicker(false);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Désolé, nous avons besoin des permissions pour accéder à vos photos!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        // Validation des champs obligatoires
        if (!title.trim() || !description.trim() || !date || !time) {
            Alert.alert('Validation', 'Veuillez remplir tous les champs obligatoires (Titre, Description, Date, Heure)');
            return;
        }

        if (!user?.uid) {
            Alert.alert('Erreur', 'Vous devez être connecté pour créer une Master Class');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;

            // Upload l'image si elle existe
            if (imageUri) {
                try {
                    const response = await fetch(imageUri);
                    const blob = await response.blob();
                    const timestamp = new Date().getTime();
                    const imageName = `masterclass_${user.uid}_${timestamp}.jpg`;
                    const storageRef = ref(storage, `masterClasses/${user.uid}/${imageName}`);
                    
                    await uploadBytes(storageRef, blob);
                    imageUrl = await getDownloadURL(storageRef);
                } catch (imageError) {
                    console.error('Erreur lors de l\'upload de l\'image:', imageError);
                    Alert.alert('Avertissement', 'L\'image n\'a pas pu être uploadée, mais la Master Class sera créée sans image');
                }
            }

            // Préparer les données
            const masterClassData = {
                title: title.trim(),
                description: description.trim(),
                date: formatDate(date),
                time: time,
                duration: duration.trim() || 'Non spécifiée',
                price: price.trim() ? parseFloat(price) : 0,
                maxParticipants: maxParticipants.trim() ? parseInt(maxParticipants) : null,
                requirements: requirements.trim() || '',
                image: imageUrl || null,
                dieticianId: user.uid,
                dieticianName: user.name || user.nom || 'Diététicien',
                createdAt: new Date(),
                participants: [],
                status: 'active',
            };

            // Enregistrer dans Firestore
            const docRef = await addDoc(collection(db, 'masterClasses'), masterClassData);
            
            Alert.alert(
                'Succès',
                'Master Class créée avec succès !',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    }
                ]
            );
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la Master Class. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#815F9C" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Nouvelle Master Class</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.container}>
                
                <View style={styles.form}>
                    <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#815F9C" />
                                <Text style={styles.uploadText}>Ajouter une image</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.label}>Titre*</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ex: Nutrition et Diabète"
                        placeholderTextColor="#B9A9CC"
                    />

                    <Text style={styles.label}>Description*</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Décrivez votre master class..."
                        placeholderTextColor="#B9A9CC"
                        multiline
                        numberOfLines={4}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Date*</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.pickerButton, !date && styles.inputEmpty]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color="#815F9C" />
                                <Text style={[styles.pickerButtonText, !date && styles.placeholderText]}>
                                    {date ? formatDate(date) : 'JJ/MM/AAAA'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Heure*</Text>
                            <TouchableOpacity
                                style={[styles.input, styles.pickerButton, !time && styles.inputEmpty]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={18} color="#815F9C" />
                                <Text style={[styles.pickerButtonText, !time && styles.placeholderText]}>
                                    {time || 'HH:MM'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Date Picker Modal */}
                    <Modal
                        visible={showDatePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowDatePicker(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Sélectionner une date</Text>
                                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                        <Ionicons name="close" size={24} color="#815F9C" />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={generateDates()}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.dateTimeOption,
                                                date && formatDate(date) === formatDate(item) && styles.dateTimeOptionSelected
                                            ]}
                                            onPress={() => {
                                                handleSelectDate(item);
                                                setShowDatePicker(false);
                                            }}
                                        >
                                            <Ionicons
                                                name={date && formatDate(date) === formatDate(item) ? "checkmark-circle" : "ellipse-outline"}
                                                size={24}
                                                color={date && formatDate(date) === formatDate(item) ? "#815F9C" : "#B9A9CC"}
                                            />
                                            <Text style={[
                                                styles.dateTimeOptionText,
                                                date && formatDate(date) === formatDate(item) && styles.dateTimeOptionTextSelected
                                            ]}>
                                                {formatDate(item)}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </Modal>

                    {/* Time Picker Modal */}
                    <Modal
                        visible={showTimePicker}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowTimePicker(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Sélectionner l'heure</Text>
                                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                        <Ionicons name="close" size={24} color="#815F9C" />
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={generateTimes()}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={[
                                                styles.dateTimeOption,
                                                time === item && styles.dateTimeOptionSelected
                                            ]}
                                            onPress={() => {
                                                handleSelectTime(item);
                                                setShowTimePicker(false);
                                            }}
                                        >
                                            <Ionicons
                                                name={time === item ? "checkmark-circle" : "ellipse-outline"}
                                                size={24}
                                                color={time === item ? "#815F9C" : "#B9A9CC"}
                                            />
                                            <Text style={[
                                                styles.dateTimeOptionText,
                                                time === item && styles.dateTimeOptionTextSelected
                                            ]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </View>
                    </Modal>

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Durée</Text>
                            <TextInput
                                style={styles.input}
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="Ex: 1h30"
                                placeholderTextColor="#B9A9CC"
                            />
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Prix</Text>
                            <TextInput
                                style={styles.input}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="Ex: 29.99€"
                                placeholderTextColor="#B9A9CC"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Nombre max. de participants</Text>
                    <TextInput
                        style={styles.input}
                        value={maxParticipants}
                        onChangeText={setMaxParticipants}
                        placeholder="Ex: 20"
                        placeholderTextColor="#B9A9CC"
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Prérequis</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={requirements}
                        onChangeText={setRequirements}
                        placeholder="Ex: Matériel nécessaire, connaissances requises..."
                        placeholderTextColor="#B9A9CC"
                        multiline
                        numberOfLines={3}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                <Text style={styles.submitButtonText}>Créer la Master Class</Text>
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
        backgroundColor: '#F6F0F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EAE3EC',
        marginTop: Platform.OS === 'ios' ? 40 : 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#815F9C',
    },
    form: {
        padding: 16,
    },
    imageUpload: {
        width: '100%',
        height: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EAE3EC',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 8,
        color: '#815F9C',
        fontSize: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E223D',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#EAE3EC',
        color: '#1E223D',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    halfWidth: {
        width: '48%',
    },
    submitButton: {
        backgroundColor: '#815F9C',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EAE3EC',
        height: 50,
        marginBottom: 16,
    },
    pickerButtonText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#1E223D',
        fontWeight: '500',
        flex: 1,
    },
    inputEmpty: {
        borderColor: '#E8D5F2',
    },
    placeholderText: {
        color: '#B9A9CC',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#EAE3EC',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#815F9C',
    },
    dateTimeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F0EDFA',
    },
    dateTimeOptionSelected: {
        backgroundColor: '#F0EDFA',
    },
    dateTimeOptionText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#6B5580',
        fontWeight: '500',
    },
    dateTimeOptionTextSelected: {
        color: '#815F9C',
        fontWeight: '700',
    },
});

export default MasterClassForm;