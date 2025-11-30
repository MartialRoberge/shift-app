# 🧪 Comment tester - Guide rapide

## ✅ Frontend créé !

J'ai créé un frontend léger dans `frontend/` qui permet de tester toutes les fonctionnalités.

## 🚀 Démarrage en 3 commandes

### 1. Démarrer le backend

```bash
npm run dev
```

✅ Backend sur `http://localhost:3000`

### 2. Ouvrir le frontend

```bash
cd frontend
python3 -m http.server 8080
```

Puis ouvrez : **http://localhost:8080**

### 3. Tester !

## 📋 Flow de test complet

### Étape 1 : Créer les comptes

```bash
# Dans le dossier racine
npm run seed
```

Cela crée :
- **Worker** : `alice@test.com` / `password123`
- **Employer** : `bob@test.com` / `password123`

### Étape 2 : Tester le Worker

1. **Ouvrir** http://localhost:8080
2. **Se connecter** avec `alice@test.com` / `password123`
3. **Créer un employer** d'abord :
   - Se déconnecter
   - S'inscrire comme "Employer" avec `bob@test.com`
   - **Copier l'ID de l'employer** (affiché après inscription, ou dans la console)
4. **Se reconnecter** comme worker
5. **Démarrer un shift** :
   - Coller l'ID de l'employer dans le champ
   - Cliquer "🎤 Enregistrer check-in"
   - Parler : "Bonjour, je commence mon shift de garde d'enfants"
   - Cliquer "⏹️ Arrêter"
   - Cliquer "Démarrer le shift"
6. **Terminer le shift** :
   - Sélectionner le shift actif
   - Cliquer "🎤 Enregistrer check-out"
   - Parler : "Je termine, j'ai gardé 2 enfants"
   - Cliquer "⏹️ Arrêter"
   - Cliquer "Terminer le shift"

### Étape 3 : Tester l'Employer

1. **Se déconnecter** et **se connecter** avec `bob@test.com` / `password123`
2. **Voir les shifts** à valider (liste automatique)
3. **Valider un shift** :
   - Cliquer "✅ Valider"
   - Cela crée l'escrow XRPL + NFT
4. **Libérer le paiement** :
   - Cliquer "💰 Libérer paiement"
   - Le worker est payé !

## 🎯 Ce que vous testez

✅ **Authentification** - Login/Register  
✅ **Enregistrement audio** - Microphone navigateur  
✅ **Transcription** - AssemblyAI  
✅ **Analyse LLM** - OpenAI  
✅ **Validation** - Employer valide le shift  
✅ **XRPL Escrow** - Création d'escrow  
✅ **XRPL NFT** - Mint de NFT  
✅ **Paiement** - Release de l'escrow  

## ⚠️ Notes importantes

1. **Microphone** : Le navigateur demandera l'autorisation
2. **Employer ID** : Vous devez créer un employer et copier son ID
3. **Format audio** : WebM (le backend le convertit)
4. **XRPL** : Transactions en testnet

## 🐛 Dépannage

### Backend ne répond pas
```bash
# Vérifier que le backend tourne
curl http://localhost:3000/health
```

### Erreur CORS
- Vérifiez que le backend tourne sur `http://localhost:3000`
- Ouvrez la console du navigateur (F12)

### Microphone ne fonctionne pas
- Autorisez l'accès au microphone
- Utilisez Chrome ou Firefox

### Erreur 401
- Reconnectez-vous
- Vérifiez que le token est stocké

## ✅ Résultat attendu

Si tout fonctionne :
- ✅ Connexion réussie
- ✅ Shift démarré avec transcription
- ✅ Shift terminé avec heures et montant calculés
- ✅ Shift validé avec escrow XRPL créé
- ✅ NFT minté
- ✅ Paiement libéré

**Tout est prêt ! Bon test ! 🎉**

