import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { checkExistingRequest, getDocumentById, sendDoctorRequest } from '../../../services/firebase/firebaseService';

const ProfilDieteticien = ({ route, navigation }) => {
    const { dieticienId } = route.params;
    const { user } = useAuth();
    const [dieticien, setDieticien] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [requesting, setRequesting] = React.useState(false);
    const [requestSent, setRequestSent] = React.useState(false);
    
    // Vérifier si l'utilisateur connecté est le dieteticien lui-même
    const isDieteticienProfile = user?.uid === dieticienId;

    // Charger les données depuis Firebase
    React.useEffect(() => {
        const loadDieticien = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getDocumentById('users', dieticienId);
                if (data) {
                    setDieticien(data);
                } else {
                    setError('Le profil du diététicien n\'a pas pu être trouvé.');
                }
            } catch (err) {
                console.error('Erreur lors du chargement du profil:', err);
                setError('Erreur lors du chargement du profil. Veuillez réessayer.');
            } finally {
                setLoading(false);
            }
        };
        loadDieticien();
    }, [dieticienId]);

    // Vérifier si une demande existe au chargement
    React.useEffect(() => {
        const checkRequest = async () => {
            if (user?.uid && !isDieteticienProfile) {
                const exists = await checkExistingRequest(user.uid, dieticienId);
                setRequestSent(exists);
            }
        };
        checkRequest();
    }, [user?.uid, dieticienId, isDieteticienProfile]);

    const handleAddDoctor = async () => {
        if (!user?.uid) {
            Alert.alert('Erreur', 'Vous devez être connecté pour envoyer une demande.');
            return;
        }

        if (!dieticien) {
            Alert.alert('Erreur', 'Les informations du diététicien ne sont pas disponibles.');
            return;
        }

        setRequesting(true);
        try {
            await sendDoctorRequest(user.uid, dieticienId, {
                name: dieticien.name,
                photo: dieticien.photo,
                specialite: dieticien.specialite,
            });
            setRequestSent(true);
            Alert.alert(
                'Succès',
                `Une demande a été envoyée à ${dieticien.name}. En attente de confirmation...`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Erreur:', error);
            Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Veuillez réessayer.');
        } finally {
            setRequesting(false);
        }
    };

    const renderReview = ({ item }) => (
        <View style={styles.reviewCard}>
            <Text style={styles.reviewAuthor}>{item.author}</Text>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            <Text style={styles.reviewRating}>Note : {item.rating}/5</Text>
        </View>
    );

    const renderMasterClass = ({ item }) => (
        <TouchableOpacity
            style={styles.masterClassCard}
            onPress={() => navigation.navigate('MasterClasses', { masterClassId: item.id })}
        >
            <Text style={styles.masterClassTitle}>{item.title}</Text>
            <Text style={styles.masterClassDate}>{item.date}</Text>
        </TouchableOpacity>
    );

    // Affichage du LoadingIndicator
    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chargement...</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4A2F7D" />
                    <Text style={styles.loadingText}>Chargement du profil...</Text>
                </View>
            </View>
        );
    }

    // Affichage du message d'erreur
    if (error || !dieticien) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Erreur</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#E74C3C" />
                    <Text style={styles.errorText}>{error || 'Le profil n\'a pas pu être chargé.'}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.retryButtonText}>Retour</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* En-tête */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{dieticien.name}</Text>
            </View>
            <ScrollView>
                {/* Profil principal */}
                <View style={styles.profileCard}>
                    {dieticien.photo && (
                        <Image source={{ uri: dieticien.photo }} style={styles.profilePhoto} />
                    )}
                    <Text style={styles.profileName}>{dieticien.name}</Text>
                    {dieticien.specialite && (
                        <Text style={styles.profileSpecialite}>{dieticien.specialite}</Text>
                    )}
                    {dieticien.location && (
                        <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={16} color="#4A2F7D" />
                            <Text style={styles.profileLocation}>{dieticien.location}</Text>
                        </View>
                    )}
                    {(dieticien.rating || dieticien.consultations) && (
                        <View style={styles.profileStats}>
                            {dieticien.rating && (
                                <Text style={styles.statText}>⭐ {dieticien.rating}/5</Text>
                            )}
                            {dieticien.consultations && (
                                <Text style={styles.statText}>📋 {dieticien.consultations} consultations</Text>
                            )}
                        </View>
                    )}
                </View>

                {/* À propos */}
                {dieticien.bio && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>À propos</Text>
                        <Text style={styles.sectionText}>{dieticien.bio}</Text>
                    </View>
                )}

                {/* Expérience et formation */}
                {(dieticien.experience || dieticien.education || dieticien.certifications) && (
                    <View style={styles.detailsCard}>
                        {dieticien.experience && (
                            <>
                                <Text style={styles.sectionTitle}>Expérience</Text>
                                <Text style={styles.sectionText}>{dieticien.experience}</Text>
                            </>
                        )}
                        {dieticien.education && (
                            <>
                                <Text style={styles.sectionTitle}>Formation</Text>
                                <Text style={styles.sectionText}>{dieticien.education}</Text>
                            </>
                        )}
                        {dieticien.certifications && dieticien.certifications.length > 0 && (
                            <>
                                <Text style={styles.sectionTitle}>Certifications</Text>
                                {dieticien.certifications.map((cert, index) => (
                                    <Text key={index} style={styles.sectionText}>• {cert}</Text>
                                ))}
                            </>
                        )}
                    </View>
                )}

                {/* Master Classes animées */}
                {dieticien.masterClasses && dieticien.masterClasses.length > 0 && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>Master Classes Animées</Text>
                        <FlatList
                            data={dieticien.masterClasses}
                            renderItem={renderMasterClass}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.masterClassList}
                        />
                    </View>
                )}

                {/* Avis des patients */}
                {dieticien.reviews && dieticien.reviews.length > 0 && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>Avis des Patients</Text>
                        <FlatList
                            data={dieticien.reviews}
                            renderItem={renderReview}
                            keyExtractor={(item) => item.id}
                            style={styles.reviewList}
                        />
                    </View>
                )}

                {/* Disponibilités */}
                {dieticien.availability && dieticien.availability.length > 0 && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>📅 Disponibilités</Text>
                        {dieticien.availability.map((slot, index) => (
                            <Text key={index} style={styles.sectionText}>• {slot}</Text>
                        ))}
                    </View>
                )}

                {/* Langues Parlées */}
                {dieticien.languages && dieticien.languages.length > 0 && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>🌐 Langues Parlées</Text>
                        <View style={styles.tagsContainer}>
                            {dieticien.languages.map((language, index) => (
                                <View key={index} style={styles.languageTag}>
                                    <Text style={styles.languageTagText}>{language}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Tarifs et Disponibilité */}
                {(dieticien.price || dieticien.isAvailable !== undefined) && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>💰 Tarifs & Disponibilité</Text>
                        {dieticien.price && (
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceLabel}>Prix par consultation:</Text>
                                <Text style={styles.priceValue}>{dieticien.price}€</Text>
                            </View>
                        )}
                        {dieticien.isAvailable !== undefined && (
                            <View style={[
                                styles.availabilityStatus,
                                dieticien.isAvailable ? styles.availableTrue : styles.availableFalse
                            ]}>
                                <Ionicons 
                                    name={dieticien.isAvailable ? "checkmark-circle" : "close-circle"} 
                                    size={20} 
                                    color="#fff" 
                                />
                                <Text style={styles.availabilityText}>
                                    {dieticien.isAvailable ? 'Disponible pour les consultations' : 'Non disponible pour le moment'}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Boutons d'action */}
                <View style={styles.actionButtons}>
                    {isDieteticienProfile && (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => navigation.navigate('EditDieteticien')}
                            accessibilityLabel="Éditer le profil"
                        >
                            <Ionicons name="pencil-outline" size={20} color="#333" />
                            <Text style={styles.editButtonText}>Update Profil</Text>
                        </TouchableOpacity>
                    )}
                    
                    {!isDieteticienProfile && (
                        <>
                            <TouchableOpacity
                                style={styles.contactButton}
                                onPress={() =>
                                    navigation.navigate('ChatApp', {
                                        dieticienId: dieticien.id,
                                        dieticienName: dieticien.name,
                                    })
                                }
                                accessibilityLabel={`Contacter ${dieticien.name}`}
                            >
                                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Contacter</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[
                                    styles.addDoctorButton,
                                    requestSent && styles.addDoctorButtonDisabled
                                ]}
                                onPress={handleAddDoctor}
                                disabled={requesting || requestSent}
                                accessibilityLabel={`Ajouter ${dieticien.name} comme médecin`}
                            >
                                {requesting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons 
                                            name={requestSent ? "checkmark-circle" : "add-circle-outline"} 
                                            size={20} 
                                            color="#fff" 
                                        />
                                        <Text style={styles.buttonText}>
                                            {requestSent ? 'Demande envoyée' : 'Ajouter comme médecin'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#4A2F7D',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        marginTop: 20,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4A2F7D',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    profileCard: {
        backgroundColor: '#fff',
        marginBottom: 20,
        padding: 25,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    profilePhoto: {
        width: 130,
        height: 130,
        borderRadius: 65,
        marginBottom: 15,
        borderWidth: 3,
        borderColor: '#F4C430',
    },
    profileName: {
        fontSize: 26,
        fontWeight: '700',
        color: '#333',
        marginBottom: 5,
    },
    profileSpecialite: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    profileLocation: {
        fontSize: 14,
        color: '#4A2F7D',
        marginLeft: 5,
    },
    profileStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    },
    statText: {
        fontSize: 14,
        color: '#4A2F7D',
        fontWeight: '500',
    },
    detailsCard: {
        backgroundColor: '#fff',
        marginBottom: 20,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    sectionText: {
        fontSize: 15,
        color: '#666',
        marginBottom: 8,
    },
    masterClassList: {
        marginTop: 10,
    },
    masterClassCard: {
        backgroundColor: '#F8F7FC',
        borderRadius: 12,
        padding: 15,
        marginRight: 15,
        width: 220,
    },
    masterClassTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    masterClassDate: {
        fontSize: 13,
        color: '#666',
    },
    reviewList: {
        marginTop: 10,
    },
    reviewCard: {
        backgroundColor: '#F8F7FC',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
    },
    reviewAuthor: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    reviewComment: {
        fontSize: 14,
        color: '#666',
        marginVertical: 5,
    },
    reviewRating: {
        fontSize: 13,
        color: '#4A2F7D',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    languageTag: {
        backgroundColor: '#E3F2FD',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1976D2',
    },
    languageTagText: {
        fontSize: 14,
        color: '#1976D2',
        fontWeight: '600',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 4,
        borderLeftColor: '#F4C430',
    },
    priceLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        flex: 1,
    },
    priceValue: {
        fontSize: 18,
        color: '#F4C430',
        fontWeight: '700',
    },
    availabilityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        justifyContent: 'center',
    },
    availableTrue: {
        backgroundColor: '#10B981',
    },
    availableFalse: {
        backgroundColor: '#EF4444',
    },
    availabilityText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 10,
        marginHorizontal: 5,
        marginBottom: 30,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A2F7D',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4C430',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    appointmentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F4C430',
        paddingVertical: 14,
        paddingHorizontal: 25,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addDoctorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addDoctorButtonDisabled: {
        backgroundColor: '#A0AEC0',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
});

export default ProfilDieteticien;
