import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useFonts, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { ScrollView } from 'react-native-gesture-handler';
import { getUser, updateUser } from '../../../services/localSotrage/UserConnectData';
import { addDocumentUid } from '../../../services/firebase/firebaseService';

// Schéma de validation avec transformation pour le champ sexe
const ProfileSchema = Yup.object().shape({
    age: Yup.number().positive('Âge doit être positif').integer('Âge doit être un entier').required('Âge requis'),
    sexe: Yup.string()
        .transform((value) => value.toUpperCase())
        .matches(/^(H|F|AUTRE)$/, 'Le sexe doit être H, F ou Autre')
        .required('Sexe requis'),
    poids: Yup.number().positive('Poids doit être positif').required('Poids requis'),
    taille: Yup.number().positive('Taille doit être positive').required('Taille requis'),
    objectif: Yup.string().required('Objectif requis'),
});

export default function CompleteProfileScreen() {
    const navigation = useNavigation();
    const [profile, setProfile] = useState({ photo: null });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger la police Inter
    const [fontsLoaded, fontError] = useFonts({
        Inter_500Medium,
        Inter_700Bold,
    });

    // Demander la permission pour la galerie et sélectionner une image
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission refusée', 'Vous devez autoriser l’accès à la galerie pour sélectionner une photo.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setProfile({ ...profile, photo: result.assets[0].uri });
        }
    };

    // Fonction pour envoyer les données à la base de données
    const saveProfileToDatabase = async (values, photo) => {
        try {
            const formData = {
            age: parseInt(values.age),
            sexe: values.sexe,
            poids: parseInt(values.poids),
            taille: parseInt(values.taille),
            objectif: values.objectif,
            photoUri: photo || null,
            type: 1,
        };

            const user = await getUser();
            if (!user?.uid) {
                console.log('Aucun utilisateur connecté', user);
                return { success: false, message: 'Utilisateur non trouvé' };
            }

            await updateUser(formData);
            await addDocumentUid('patients', user.uid, formData);

            return { success: true, message: 'Profil sauvegardé avec succès' };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du profil:', error);
            return { success: false, message: 'Erreur lors de la sauvegarde du profil' };
        }
    };

    // Gestion du chargement des polices
    if (!fontsLoaded && !fontError) {
        return <ActivityIndicator size="large" color="#70035cff" />;
    }

    if (fontError) {
        console.error('Erreur de chargement des polices:', fontError);
        return (
            <View style={styles.container}>
                <Text style={styles.error}>
                    Erreur de chargement des polices. Utilisation de la police par défaut.
                </Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? hp('10%') : 0}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="person-add-outline" size={hp('5%')} color="#70035cff" />
                    <Text style={styles.title}>Complétez votre profil</Text>
                </View>
                <ScrollView>
                    {/* Photo de profil */}
                    <TouchableOpacity
                        style={styles.photoContainer}
                        onPress={pickImage}
                        accessible={true}
                        accessibilityLabel="Sélectionner une photo de profil"
                        accessibilityHint="Appuyez pour choisir une image depuis la galerie"
                    >
                        {profile.photo ? (
                            <Image source={{ uri: profile.photo }} style={styles.photo} />
                        ) : (
                            <View style={styles.photoPlaceholder}>
                                <Ionicons name="camera-outline" size={hp('5%')} color="#636E72" />
                            </View>
                        )}
                        <Text style={styles.photoText}>
                            {profile.photo ? 'Changer la photo' : 'Ajouter une photo de profil'}
                        </Text>
                    </TouchableOpacity>

                    {/* Formulaire */}
                    <Formik
                        initialValues={{
                            age: '',
                            sexe: '',
                            poids: '',
                            taille: '',
                            objectif: '',
                        }}
                        validationSchema={ProfileSchema}
                        onSubmit={async (values) => {
                            setIsSubmitting(true);
                            const result = await saveProfileToDatabase(values, profile.photo);
                            setIsSubmitting(false);
                            if (result.success) {
                                Alert.alert('Succès', result.message);
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Accueil' }],
                                });
                            } else {
                                Alert.alert('Erreur', result.message);
                            }
                        }}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                            <View style={styles.form}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="calendar-outline" size={hp('3%')} color="#636E72" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Âge (ex: 30)"
                                        keyboardType="numeric"
                                        value={values.age}
                                        onChangeText={handleChange('age')}
                                        onBlur={handleBlur('age')}
                                        placeholderTextColor="#636E72"
                                        accessible={true}
                                        accessibilityLabel="Âge"
                                        accessibilityHint="Entrez votre âge en années, par exemple 30"
                                    />
                                </View>
                                {touched.age && errors.age && (
                                    <Text style={styles.error}>
                                        <Ionicons name="alert-circle-outline" size={hp('2%')} color="#E74C3C" /> {errors.age}
                                    </Text>
                                )}

                                <View style={styles.inputContainer}>
                                    <Ionicons name="male-female-outline" size={hp('3%')} color="#636E72" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Sexe (H/F/Autre)"
                                        value={values.sexe}
                                        onChangeText={handleChange('sexe')}
                                        onBlur={handleBlur('sexe')}
                                        placeholderTextColor="#636E72"
                                        accessible={true}
                                        accessibilityLabel="Sexe"
                                        accessibilityHint="Entrez H pour homme, F pour femme, ou Autre"
                                    />
                                </View>
                                {touched.sexe && errors.sexe && (
                                    <Text style={styles.error}>
                                        <Ionicons name="alert-circle-outline" size={hp('2%')} color="#E74C3C" /> {errors.sexe}
                                    </Text>
                                )}

                                <View style={styles.inputContainer}>
                                    <Ionicons name="scale-outline" size={hp('3%')} color="#636E72" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Poids (kg, ex: 70)"
                                        keyboardType="numeric"
                                        value={values.poids}
                                        onChangeText={handleChange('poids')}
                                        onBlur={handleBlur('poids')}
                                        placeholderTextColor="#636E72"
                                        accessible={true}
                                        accessibilityLabel="Poids"
                                        accessibilityHint="Entrez votre poids en kilogrammes, par exemple 70"
                                    />
                                </View>
                                {touched.poids && errors.poids && (
                                    <Text style={styles.error}>
                                        <Ionicons name="alert-circle-outline" size={hp('2%')} color="#E74C3C" /> {errors.poids}
                                    </Text>
                                )}

                                <View style={styles.inputContainer}>
                                    <Ionicons name="resize-outline" size={hp('3%')} color="#636E72" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Taille (m, ex: 1.75)"
                                        keyboardType="numeric"
                                        value={values.taille}
                                        onChangeText={handleChange('taille')}
                                        onBlur={handleBlur('taille')}
                                        placeholderTextColor="#636E72"
                                        accessible={true}
                                        accessibilityLabel="Taille"
                                        accessibilityHint="Entrez votre taille en mètres, par exemple 1.75"
                                    />
                                </View>
                                {touched.taille && errors.taille && (
                                    <Text style={styles.error}>
                                        <Ionicons name="alert-circle-outline" size={hp('2%')} color="#E74C3C" /> {errors.taille}
                                    </Text>
                                )}

                                <View style={styles.inputContainer}>
                                    <Ionicons name="flag-outline" size={hp('3%')} color="#636E72" style={styles.icon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Objectif (ex: Perte de poids)"
                                        value={values.objectif}
                                        onChangeText={handleChange('objectif')}
                                        onBlur={handleBlur('objectif')}
                                        placeholderTextColor="#636E72"
                                        accessible={true}
                                        accessibilityLabel="Objectif"
                                        accessibilityHint="Entrez votre objectif, par exemple Perte de poids"
                                    />
                                </View>
                                {touched.objectif && errors.objectif && (
                                    <Text style={styles.error}>
                                        <Ionicons name="alert-circle-outline" size={hp('2%')} color="#E74C3C" /> {errors.objectif}
                                    </Text>
                                )}

                                <TouchableOpacity
                                    style={[styles.saveButton, isSubmitting && { opacity: 0.6 }]}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                    accessible={true}
                                    accessibilityLabel="Sauvegarder le profil"
                                    accessibilityHint="Appuyez pour enregistrer vos informations de profil"
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="save-outline" size={hp('3%')} color="#FFFFFF" style={styles.saveButtonIcon} />
                                            <Text style={styles.saveButtonText}>Sauvegarder</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </Formik>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
}

// Styles (inchangés)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: wp('5%'),
        paddingVertical: hp('3%'),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('3%'),
    },
    title: {
        fontFamily: 'Inter_700Bold',
        fontSize: hp('3.5%'),
        color: '#2D3436',
        marginLeft: wp('2%'),
    },
    photoContainer: {
        alignItems: 'center',
        marginBottom: hp('3%'),
    },
    photoPlaceholder: {
        width: wp('25%'),
        height: wp('25%'),
        borderRadius: wp('12.5%'),
        backgroundColor: '#F7F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    photo: {
        width: wp('25%'),
        height: wp('25%'),
        borderRadius: wp('12.5%'),
        borderWidth: 2,
        borderColor: '#70035cff',
    },
    photoText: {
        fontFamily: 'Inter_500Medium',
        fontSize: hp('2%'),
        color: '#3498DB',
        marginTop: hp('1%'),
    },
    form: {
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: hp('2%'),
        backgroundColor: '#F7F9FA',
        borderRadius: 12,
        paddingHorizontal: wp('3%'),
        paddingVertical: hp('1%'),
        borderWidth: 1,
        borderColor: '#E0E0E0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    icon: {
        marginRight: wp('2%'),
    },
    input: {
        flex: 1,
        fontFamily: 'Inter_500Medium',
        fontSize: hp('2%'),
        color: '#2D3436',
    },
    error: {
        fontFamily: 'Inter_500Medium',
        fontSize: hp('1.8%'),
        color: '#E74C3C',
        marginBottom: hp('1%'),
        marginLeft: wp('3%'),
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: '#70035cff',
        paddingVertical: hp('2%'),
        paddingHorizontal: wp('5%'),
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: hp('3%'),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    saveButtonIcon: {
        marginRight: wp('2%'),
    },
    saveButtonText: {
        fontFamily: 'Inter_700Bold',
        fontSize: hp('2.2%'),
        color: '#FFFFFF',
    },
});