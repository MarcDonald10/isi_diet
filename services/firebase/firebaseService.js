// firebaseService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes
} from 'firebase/storage';
import { auth, db, storage } from './firebaseConfig';


// ─────────────────────────────────────────────────────────────────────────────
// 🔐 AUTHENTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export const signUp = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = async () => {
  await signOut(auth);
};


// ─────────────────────────────────────────────────────────────────────────────
// 👤 UTILISATEURS
// ─────────────────────────────────────────────────────────────────────────────

export const addDocumentUsers = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data);
    return uid;
  } catch (error) {
    console.error('Erreur lors de la création du document utilisateur :', error);
    throw error;
  }
};

export const addDocumentUid = async (collectionName, uid, data) => {
  try {
    const userRef = doc(db, collectionName, uid);
    await setDoc(userRef, data);
    return uid;
  } catch (error) {
    console.error('Erreur lors de la création du document :', error);
    throw error;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 📦 FIRESTORE — CRUD GÉNÉRIQUE
// ─────────────────────────────────────────────────────────────────────────────

export const addDocument = async (collectionName, data) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

export const getDocuments = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDocumentById = async (collectionName, id) => {
  const docSnap = await getDoc(doc(db, collectionName, id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
};

export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), data);
};

export const deleteDocument = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id));
};

export const getDocumentsWhere = async (collectionName, field, operator, value) => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Récupérer des documents avec plusieurs conditions
 * @param {string} collectionName
 * @param {Array} conditions - [ ['champ', 'operateur', 'valeur'], ... ]
 */
export const getDocumentsByConditions = async (collectionName, conditions) => {
  try {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);
    conditions.forEach(condition => { q = query(q, where(...condition)); });
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ☁️ STORAGE
// ─────────────────────────────────────────────────────────────────────────────

export const uploadFile = async (folder, fileUri, fileName) => {
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const fileRef = ref(storage, `${folder}/${fileName}`);
  await uploadBytes(fileRef, blob);
  return await getDownloadURL(fileRef);
};

export const deleteFile = async (filePath) => {
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
};

/**
 * Uploader une image de profil vers Firebase Storage
 * @param {string} userId
 * @param {string} imageUri - URI locale
 */
export const uploadProfileImage = async (userId, imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${userId}/profile.jpg`);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 👨‍⚕️ MÉDECINS — Mes médecins & liste globale
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Récupérer la liste des médecins suivis par un patient.
 * Les médecins sont stockés dans le tableau `myDoctors` du document user.
 * @param {string} patientId
 * @returns {Array} Liste des médecins avec { id, name, photo, specialite, addedDate, ... }
 */
export const getMyDoctors = async (patientId) => {
  try {
    const patientDoc = await getDocumentById('users', patientId);
    if (!patientDoc) return [];
    // myDoctors est un tableau d'objets stocké directement dans le document user
    return patientDoc.myDoctors || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de mes médecins:', error);
    return [];
  }
};

/**
 * Récupérer tous les médecins/diététiciens disponibles sur la plateforme.
 * Filtre les utilisateurs dont le rôle est 'dietician' ou 'doctor'.
 * @returns {Array} Liste de tous les praticiens
 */
export const getAllDoctors = async () => {
  try {
    // Récupère tous les utilisateurs dont le role est 'dietician'
    // Adapte 'dietician' selon la valeur réelle dans ta base (ex: 'doctor', 'dieteticien')
    const dieticians = await getDocumentsWhere('users', 'type', '==', 'Diététicien');
    return dieticians;
  } catch (error) {
    console.error('Erreur lors de la récupération des médecins:', error);
    return [];
  }
};

/**
 * Retirer un médecin de la liste personnelle d'un patient.
 * @param {string} patientId
 * @param {string} doctorId
 */
export const removeMyDoctor = async (patientId, doctorId) => {
  try {
    const patientDoc = await getDocumentById('users', patientId);
    if (!patientDoc) return;
    const updated = (patientDoc.myDoctors || []).filter(d => d.id !== doctorId);
    await updateDocument('users', patientId, { myDoctors: updated });
    return true;
  } catch (error) {
    console.error('Erreur lors du retrait du médecin:', error);
    throw error;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// 📋 DEMANDES MÉDECIN / DIÉTÉTICIEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Envoyer une demande d'ajout à la liste de médecins d'un patient
 * @param {string} patientId
 * @param {string} dieticianId
 * @param {object} dieticianData - { name, photo, specialite }
 */
export const sendDoctorRequest = async (patientId, dieticianId, patient) => {
  try {
    const docId = await addDocument('doctorRequests', {
      patientId,
      dieticianId,
      patient,
      status:             'pending', // pending | accepted | rejected
      createdAt:          new Date(),
      updatedAt:          new Date(),
    });
    return docId;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande:', error);
    throw error;
  }
};

/**
 * Récupérer les demandes en attente reçues par un patient
 * @param {string} patientId
 */
export const getPendingRequests = async (patientId) => {
  try {
    // On filtre uniquement les demandes encore en attente
    return await getDocumentsByConditions('doctorRequests', [
      ['patientId', '==', patientId],
      ['status',    '==', 'pending'],
    ]);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes:', error);
    throw error;
  }
};

/**
 * Accepter une demande et ajouter le médecin à la liste du patient
 * @param {string} requestId
 * @param {string} patientId
 * @param {string} dieticianId
 * @param {object} dieticianData - { name, photo, specialite }
 */
export const acceptDoctorRequest = async (requestId, patientId, dieticianId, dieticianData) => {
  try {
    // 1. Passer la demande en "accepted"
    await updateDocument('doctorRequests', requestId, {
      status:    'accepted',
      updatedAt: new Date(),
    });

    // 2. Ajouter le médecin dans le tableau myDoctors du patient
    const patientDoc = await getDocumentById('users', patientId);
    const myDoctors  = patientDoc?.myDoctors || [];

    if (!myDoctors.find(d => d.id === dieticianId)) {
      myDoctors.push({
        id:        dieticianId,
        name:      dieticianData.name,
        photo:     dieticianData.photo || '',
        specialite:dieticianData.specialite || '',
        addedDate: new Date(),
      });
      await updateDocument('users', patientId, { myDoctors });
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la demande:', error);
    throw error;
  }
};

/**
 * Rejeter une demande
 * @param {string} requestId
 */
export const rejectDoctorRequest = async (requestId) => {
  try {
    await updateDocument('doctorRequests', requestId, {
      status:    'rejected',
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Erreur lors du rejet de la demande:', error);
    throw error;
  }
};

/**
 * Récupérer les demandes envoyées par un diététicien
 * @param {string} dieticianId
 */
export const getSentRequests = async (dieticianId) => {
  try {
    return await getDocumentsWhere('doctorRequests', 'dieticianId', '==', dieticianId);
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes envoyées:', error);
    throw error;
  }
};

/**
 * Vérifier si une demande (pending) existe déjà entre un patient et un diététicien
 * @param {string} patientId
 * @param {string} dieticianId
 * @returns {boolean}
 */
export const checkExistingRequest = async (patientId, dieticianId) => {
  try {
    const requests = await getDocumentsByConditions('doctorRequests', [
      ['patientId',   '==', patientId],
      ['dieticianId', '==', dieticianId],
      ['status',      '==', 'pending'],
    ]);
    return requests.length > 0;
  } catch (error) {
    console.error('Erreur lors de la vérification de la demande:', error);
    return false;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ✏️ PROFIL DIÉTÉTICIEN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mettre à jour le profil d'un diététicien
 * @param {string} dieticienId
 * @param {object} updateData
 */
export const updateDieteticienProfile = async (dieticienId, updateData) => {
  try {
    await updateDoc(doc(db, 'users', dieticienId), {
      ...updateData,
      updatedAt: new Date(),
    });
    return dieticienId;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
};