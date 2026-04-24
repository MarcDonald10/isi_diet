# 🧪 Guide Rapide - Tester l'Envoi de Fichiers

## ✅ Avant de Tester

1. **Vérifier les imports**:
   ```bash
   # Ouvert: services/firebase/chatServices.js
   # Vérifier: import { storage } from './firebaseConfig';
   # Vérifier: import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
   ```

2. **Vérifier firebaseConfig.js**:
   ```javascript
   export const storage = getStorage(app); // Doit être là
   ```

3. **Vérifier ChatScreenV2.jsx**:
   ```javascript
   import { sendMessageWithAttachment } from '../../../services/firebase/chatServices';
   ```

## 🚀 Tester les Fichiers

### Test 1: Image depuis la Galerie

```
1. Ouvrir l'app
2. Naviguer vers un chat
3. Tap bouton + (en bas à gauche)
4. Sélect "📷 Photo"
5. Choisir une image de votre galerie
6. ✅ Spinner affiche (uploading...)
7. Attendre 2-5 secondes
8. ✅ Alert: "Succès - Photo envoyée"
9. ✅ Image preview visible dans le chat

Résultat attendu:
- Message envoyé
- Image affichée en preview
- Timestamp visible
- Checkmark de lecture
```

### Test 2: Fichier depuis le Gestionnaire

```
1. Ouvrir l'app
2. Naviguer vers un chat
3. Tap bouton + (en bas à gauche)
4. Sélect "📄 Fichier"
5. Choisir un document PDF/DOC/XLSX
6. ✅ Spinner affiche
7. Attendre 3-10 secondes selon la taille
8. ✅ Alert: "Succès - Fichier envoyé"
9. ✅ Carte fichier visible:
   - Icône document
   - Nom du fichier
```

### Test 3: Plusieurs Fichiers D'affilée

```
1. Envoyer image
2. Attendre confirmation
3. Envoyer fichier
4. Attendre confirmation
5. Envoyer un autre fichier
6. ✅ Tous les 3 visibles dans le chat
7. ✅ Ordre chronologique correct
8. ✅ Pas de duplication
```

### Test 4: Erreur Intentionnelle

```
1. Passer en Mode Airplane
2. Tap + → Photo
3. Tap Image
4. ✅ Voir erreur dans alert
5. Retirer Mode Airplane
6. Essayer à nouveau
7. ✅ Fonctionne
```

## 🔍 Vérifier dans Firebase Console

### Storage
```
1. Firebase Console → Projet sprinterit
2. Storage → Browse
3. Regarder dossier: chat/
4. ✅ Fichiers uploadés visibles
5. Format: {conversationId}/{timestamp}_{filename}
```

### Firestore
```
1. Firebase Console → Firestore Database
2. Collections → conversations
3. Cliquer sur une conversation
4. Collection → messages
5. Chercher un message avec type="image" ou type="file"
6. Vérifier champ: attachments
7. ✅ attachment.uri = URL valide depuis Storage
```

## 🐛 Dépannage

### ❌ "Spinner tourne mais rien ne se passe"
```
Actions:
1. Vérifier la connectivité internet
2. Vérifier que Firebase Storage Rules permettent write
3. Regarder console.error() pour le vrai erreur
4. Vérifier storageBucket dans firebaseConfig.js
```

### ❌ "Impossible d'accéder à la galerie"
```
Actions:
1. iOS: Vérifier Info.plist permissions
2. Android: Vérifier AndroidManifest.xml permissions
3. Vérifier que l'app a les permissions
4. Redémarrer l'app
5. Test sur device physique (pas émulateur)
```

### ❌ "Fichier envoyé mais pas visible"
```
Actions:
1. Vérifier que le message est dans Firestore
2. Vérifier que attachment.uri existe
3. Essayer accéder l'URL directement dans navigateur
4. Si 403 error → Vérifier Storage Rules
5. Si 404 error → Fichier non uploadé
```

### ❌ "File not found error"
```
Actions:
1. Vérifier que file.uri valide
2. Vérifier que fichier existe localement
3. Vérifier les permissions filesystem
4. Essayer un autre fichier
```

## 📊 Logs à Vérifier

### Console.log pour Debugging

```javascript
// Dans ChatScreenV2.jsx, chercher:
console.log('Erreur ImagePicker:', error);
console.log('Erreur envoi image:', error);
console.error('Erreur upload Firebase Storage:', error);

// Dans chatServices.js, chercher:
console.error('Erreur lors de l\'envoi du fichier:', error);
```

### Ouvrir Console

```
# Expo CLI
expo start

# Dans terminal où expo tourne:
- Presser 'i' pour iOS
- Presser 'a' pour Android
- Presser 'j' pour console React Native

# Console affichera tous les console.log/error
```

## ✅ Checklist de Succès

- [ ] Image uploadée avec checkmark
- [ ] Fichier uploadé avec checkmark
- [ ] Alert de succès affichée
- [ ] Fichiers visibles dans Firebase Storage
- [ ] Firestore documents avec attachment.uri correct
- [ ] URLs accessibles depuis navigateur
- [ ] Preview image affichée
- [ ] Card fichier affichée avec nom
- [ ] Timestamp correct sur messages
- [ ] Pas d'erreur dans console

## 🎯 Résumé

**Si tout fonctionne**:
```
✅ Images uploadées → preview visible
✅ Fichiers uploadés → card visible
✅ Firebase Storage rempli
✅ Firestore documents corrects
✅ Pas d'erreurs
→ PRODUCTION READY
```

**Si erreurs**:
```
❌ Vérifier les logs
❌ Vérifier Firebase Storage Rules
❌ Vérifier permissions
❌ Vérifier connectivité
→ Déboguer puis re-tester
```

---

**Temps estimé de test**: 10-15 minutes  
**Difficulté**: Facile  
**Risque**: Aucun (test en développement)

