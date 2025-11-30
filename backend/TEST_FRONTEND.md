# 🧪 Guide de test du frontend

## ✅ Tout est prêt !

J'ai créé un frontend léger dans le dossier `frontend/` qui vous permet de tester toutes les fonctionnalités du backend.

## 🚀 Démarrage en 3 étapes

### 1. Démarrer le backend

```bash
# Dans le dossier racine
npm run dev
```

✅ Le backend doit tourner sur `http://localhost:3000`

### 2. Ouvrir le frontend

**Option A : Serveur HTTP simple (recommandé)**

```bash
cd frontend
python3 -m http.server 8080
```

Puis ouvrez : **http://localhost:8080**

**Option B : VS Code Live Server**

1. Installez l'extension "Live Server"
2. Clic droit sur `frontend/index.html`
3. "Open with Live Server"

**Option C : npx serve**

```bash
cd frontend
npx serve .
```

### 3. Tester !

## 📋 Flow de test complet

### Étape 1 : Créer les comptes de test

Si pas encore fait :

```bash
npm run seed
```

Cela crée :
- **Worker** : `alice@test.com` / `password123`
- **Employer** : `bob@test.com` / `password123`

### Étape 2 : Tester en tant que Worker

1. **Ouvrir** http://localhost:8080
2. **Se connecter** avec `alice@test.com` / `password123`
3. **Créer un employer** d'abord (ou utiliser l'ID d'un employer existant)
4. **Démarrer un shift** :
   - Cliquer "🎤 Enregistrer check-in"
   - Parler : "Bonjour, je commence mon shift de garde d'enfants"
   - Cliquer "⏹️ Arrêter"
   - Cliquer "Démarrer le shift"
5. **Terminer le shift** :
   - Sélectionner le shift dans la liste
   - Cliquer "🎤 Enregistrer check-out"
   - Parler : "Je termine, j'ai gardé 2 enfants"
   - Cliquer "⏹️ Arrêter"
   - Cliquer "Terminer le shift"

### Étape 3 : Tester en tant qu'Employer

1. **Se déconnecter** et **se connecter** avec `bob@test.com` / `password123`
2. **Voir les shifts** à valider
3. **Valider un shift** :
   - Cliquer "✅ Valider"
   - Cela crée l'escrow XRPL + NFT
4. **Libérer le paiement** :
   - Cliquer "💰 Libérer paiement"
   - Le worker est payé !

## 🎯 Ce que vous pouvez tester

✅ **Authentification**
- Login / Register
- Gestion des tokens
- Déconnexion

✅ **Enregistrement audio**
- Check-in avec microphone
- Check-out avec microphone
- Upload vers le backend

✅ **Transcription & Analyse**
- Le backend transcrit l'audio (AssemblyAI)
- Le backend analyse avec LLM
- Affichage des résultats

✅ **Validation Employer**
- Liste des shifts proposés
- Validation (crée escrow + NFT XRPL)
- Refus de shift

✅ **Paiement XRPL**
- Création d'escrow
- Mint de NFT
- Release du paiement

## 📊 Vérifications

### Backend fonctionne ?
```bash
curl http://localhost:3000/health
# Devrait retourner: {"status":"ok","timestamp":"..."}
```

### Frontend accessible ?
Ouvrez http://localhost:8080 dans votre navigateur

### CORS OK ?
Ouvrez la console du navigateur (F12), il ne doit pas y avoir d'erreurs CORS

## ⚠️ Notes importantes

1. **Microphone** : Le navigateur demandera l'autorisation
2. **Format audio** : WebM (le backend le convertit)
3. **Employeur** : Pour la démo, vous devez créer un employer et utiliser son ID dans le formulaire
4. **XRPL** : Les transactions se font en testnet

## 🐛 Si ça ne marche pas

### Erreur CORS
- Vérifiez que le backend tourne sur `http://localhost:3000`
- Vérifiez la console du navigateur

### Erreur 401
- Reconnectez-vous
- Vérifiez que le token est bien stocké

### Microphone ne fonctionne pas
- Autorisez l'accès au microphone
- Utilisez Chrome ou Firefox

### Backend ne répond pas
- Vérifiez que PostgreSQL est configuré
- Vérifiez les logs du backend

## ✅ Résultat attendu

Si tout fonctionne, vous devriez voir :
- ✅ Connexion réussie
- ✅ Shift démarré avec transcription
- ✅ Shift terminé avec heures et montant
- ✅ Shift validé avec escrow XRPL
- ✅ Paiement libéré

**Tout est prêt pour tester ! 🎉**

