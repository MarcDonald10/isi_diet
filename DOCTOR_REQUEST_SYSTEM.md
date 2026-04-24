# Système de Demande de Médecin/Diététicien

## Vue d'ensemble

Cette fonctionnalité permet aux patients de recevoir des demandes de médecins/diététiciens qui souhaitent les ajouter à leur liste de patients. Les patients peuvent ensuite accepter ou rejeter ces demandes.

## Fonctionnalités

### Pour les Médecins/Diététiciens
- **Bouton "Ajouter comme médecin"** visible sur le profil du médecin
- Envoi d'une demande au patient
- Suivi du statut de la demande (en attente, acceptée, rejetée)

### Pour les Patients
- **Réception de demandes** : Les patients reçoivent des notifications de demandes
- **Gestion des demandes** : Accès à l'écran "Demandes de Médecins" pour accepter ou rejeter
- **Ajout automatique** : Une fois acceptée, le médecin est ajouté à leur liste personnelle de médecins

## Architecture Technique

### 1. **Modèle de données Firebase**

#### Collection: `doctorRequests`
```
{
  patientId: string,           // ID du patient
  dieticianId: string,         // ID du diététicien
  dieticianName: string,       // Nom du diététicien
  dieticianPhoto: string,      // URL de la photo
  dieticianSpeciality: string, // Spécialité du diététicien
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Collection: `users` (mise à jour)
Ajout du champ `myDoctors`:
```
{
  myDoctors: [
    {
      id: string,              // ID du diététicien
      name: string,            // Nom
      photo: string,           // URL de la photo
      specialite: string,      // Spécialité
      addedDate: Timestamp     // Date d'ajout
    }
  ]
}
```

### 2. **Services Firebase**

Les fonctions suivantes ont été ajoutées à `firebaseService.js`:

```javascript
// Envoyer une demande
sendDoctorRequest(patientId, dieticianId, dieticianData)

// Récupérer les demandes en attente du patient
getPendingRequests(patientId)

// Accepter une demande
acceptDoctorRequest(requestId, patientId, dieticianId, dieticianData)

// Rejeter une demande
rejectDoctorRequest(requestId)

// Récupérer les demandes envoyées par un diététicien
getSentRequests(dieticianId)

// Vérifier si une demande existe déjà
checkExistingRequest(patientId, dieticianId)
```

### 3. **Composants/Écrans**

#### ProfilDieteticien.jsx
- **Nouveau bouton**: "Ajouter comme médecin"
- **États du bouton**:
  - Normal: "Ajouter comme médecin"
  - Chargement: Affiche un spinner
  - Envoyé: "Demande envoyée" (désactivé et grisé)

#### DoctorRequestsScreen.jsx (Nouveau)
- Affiche toutes les demandes en attente pour le patient connecté
- Permet d'accepter ou rejeter chaque demande
- Interface intuitive avec photo du médecin et détails
- Écran vide amical si aucune demande

### 4. **Navigation**

Route ajoutée:
```javascript
<Stack.Screen name="DoctorRequests" component={DoctorRequestsScreen} />
```

Accès via:
```javascript
navigation.navigate('DoctorRequests')
```

## Flux d'utilisation

### 1. **Médecin envoie une demande**
```
Médecin visualise le profil du patient
    ↓
Clique sur "Ajouter comme médecin"
    ↓
Une demande est créée dans la collection doctorRequests
    ↓
Le bouton passe à "Demande envoyée" (désactivé)
```

### 2. **Patient reçoit la demande**
```
Patient accède à l'écran "Demandes de Médecins"
    ↓
Voit la liste des demandes en attente
    ↓
Peut accepter ✓ ou rejeter ✗
    ↓
Si acceptée: Médecin ajouté à myDoctors
Si rejetée: Demande supprimée
```

## Exemple d'utilisation

### Envoyer une demande (depuis ProfilDieteticien)
```javascript
const handleAddDoctor = async () => {
    await sendDoctorRequest(patientId, dieticianId, {
        name: dieticien.name,
        photo: dieticien.photo,
        specialite: dieticien.specialite,
    });
    setRequestSent(true);
};
```

### Accepter une demande (depuis DoctorRequestsScreen)
```javascript
const handleAccept = async (request) => {
    await acceptDoctorRequest(
        request.id,
        user.uid,
        request.dieticianId,
        dieticianData
    );
};
```

## Sécurité et validation

- ✅ Vérification que l'utilisateur est connecté
- ✅ Évite les doublons (vérification des demandes existantes)
- ✅ Validation des données avant envoi
- ✅ Messages d'erreur explicites
- ✅ Confirmation avant rejet

## Améliorations futures

1. **Notifications en temps réel** : Intégrer Firebase Cloud Messaging
2. **Statut d'acceptation** : Afficher le statut actuel (accepté, rejeté, en attente)
3. **Historique** : Conserver les demandes acceptées/rejetées pour archivage
4. **Notifications visuelles** : Badge sur l'icône de demandes si non lues
5. **Demande inverse** : Les patients peuvent aussi demander aux médecins
6. **Révocation** : Possibilité de supprimer un médecin de sa liste

## Dépannage

### "Erreur : Impossible d'envoyer la demande"
- Vérifiez la connexion internet
- Assurez-vous que l'utilisateur est authentifié
- Vérifiez que Firebase est bien configuré

### "Aucune demande n'apparaît"
- Vérifiez que la demande a bien été créée dans Firestore
- Assurez-vous que le patientId correspond

### Le bouton reste en état "Chargement"
- Vérifiez les logs de la console
- Vérifiez la connexion à Firebase
