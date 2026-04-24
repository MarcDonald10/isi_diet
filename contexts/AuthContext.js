// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/firebaseConfig';
import { getDocumentById } from '../services/firebase/firebaseService';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          // Récupération du user Firestore
          const userData = await getDocumentById('users', currentUser.uid);
          const patientData = await getDocumentById('patients', currentUser.uid);
          
          setUser({ uid: currentUser.uid, email: currentUser.email, ...userData, ...patientData });
          // console.log("User data fetched :", user);
        } else {
          // Aucun utilisateur connecté
          setUser(null);
        }
      } catch (err) {
        console.error("Erreur AuthContext:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fonction pour mettre à jour l'utilisateur en temps réel
  const updateUser = (updatedData) => {
    setUser((prevUser) => ({
      ...prevUser,
      ...updatedData,
    }));
  };

  // Fonction pour recharger les données utilisateur depuis Firestore
  const refreshUser = async () => {
    try {
      if (user?.uid) {
        const userData = await getDocumentById('users', user.uid);
        if(user.type === "Patient"){
          const patientData = await getDocumentById('patients', user.uid);
          setUser({ uid: user.uid, email: user.email, ...userData, ...patientData });
        } else {
          setUser({ uid: user.uid, email: user.email, ...userData });
        }
      }
    } catch (err) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
};
