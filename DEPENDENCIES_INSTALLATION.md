# 📦 Installation des Dépendances - Chat V2

## Installation des Packages

```bash
# Document picker pour les fichiers
expo install expo-document-picker

# Image picker pour les photos
expo install expo-image-picker

# Responsive screen (déjà installé probablement)
npm install react-native-responsive-screen

# ou avec expo
expo install react-native-responsive-screen
```

## Vérification de package.json

Vérifiez que votre `package.json` contient:

```json
{
  "dependencies": {
    "react-native": "latest",
    "expo": "latest",
    "firebase": "^9.x",
    "@react-native-firebase/firestore": "latest",
    "expo-document-picker": "latest",
    "expo-image-picker": "latest",
    "react-native-responsive-screen": "latest",
    "@react-navigation/native": "latest",
    "@expo/vector-icons": "latest"
  }
}
```

## Configuration des Permissions

### iOS (Info.plist)

```xml
<!-- Pour l'accès à la galerie -->
<key>NSPhotoLibraryUsageDescription</key>
<string>L'app a besoin d'accéder à vos photos</string>

<!-- Pour prendre des photos -->
<key>NSCameraUsageDescription</key>
<string>L'app a besoin d'accéder à votre caméra</string>

<!-- Pour les microphones (si audio) -->
<key>NSMicrophoneUsageDescription</key>
<string>L'app a besoin d'accéder à votre micro</string>
```

### Android (AndroidManifest.xml)

```xml
<!-- Dans <manifest> -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

### Demande de Permissions au Runtime (Android 6+)

Le code ChatScreenV2 gère automatiquement les permissions via expo-image-picker et expo-document-picker.

```javascript
// Automatic avec expo
const result = await ImagePicker.launchImageLibraryAsync({...});
// Expo demande les permissions automatiquement
```

## Vérification Installation

```bash
# Test que tout est installé
npm list expo-document-picker
npm list expo-image-picker
npm list react-native-responsive-screen

# Rebuild l'app
expo prebuild --clean
# ou
eas build --platform android --clean
```

## Troubleshooting

### Erreur: "expo-document-picker not found"
```bash
npm install expo-document-picker
expo install expo-document-picker
npx expo-doctor
```

### Erreur: "expo-image-picker not found"
```bash
npm install expo-image-picker
expo install expo-image-picker
npx expo-doctor
```

### Erreur: "Module not found: react-native-responsive-screen"
```bash
npm install react-native-responsive-screen
# ou
yarn add react-native-responsive-screen
```

### Permissions iOS ne s'affichent pas
- Nettoyer le build: `expo prebuild --clean`
- Rebuild l'app
- Vérifier Info.plist

### Permissions Android ne s'affichent pas
- Tester sur device physique ou émulateur avec Android 6+
- Vérifier AndroidManifest.xml
- Nettoyer le cache: `expo prebuild --clean`

## Test des Features

### Test 1: Image Picker
```javascript
// Taper le code dans ChatScreenV2
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
});
console.log(result); // Doit retourner {assets: [...]}
```

### Test 2: Document Picker
```javascript
const result = await DocumentPicker.getDocumentAsync({
  type: '*/*',
});
console.log(result); // Doit retourner {uri, name, size}
```

### Test 3: Responsive Screen
```javascript
import { wp, hp } from 'react-native-responsive-screen';
console.log(wp('50%')); // Doit retourner ~50% de la largeur de l'écran
console.log(hp('50%')); // Doit retourner ~50% de la hauteur de l'écran
```

## Import dans ChatScreenV2

```javascript
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
```

## Important: Paths Relatifs

Dans `ChatScreenV2.jsx`, les imports sont:

```javascript
// Services Firebase
import { ... } from '../../../services/firebase/chatServices';

// Context Auth
import { useAuth } from '../../../contexts/AuthContext';

// Chemin relatif depuis: screens/pages/Chats/ChatScreenV2.jsx
// Vers: services/firebase/chatServices.js
// ../../../ = monter 3 niveaux
```

Si vous recevez une erreur "Module not found", vérifiez les chemins.

## Expo Go vs Build

### Pour Expo Go (développement)
```bash
# Tout fonctionne automatiquement
expo start
```

### Pour Build Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android

# Les permissions doivent être dans Info.plist / AndroidManifest.xml
```

---

**Checksum**: Vérifiez que tous les packages sont à jour
```bash
npm outdated
npm update
```

---

**Version**: 2.0
**Date**: Février 2025

