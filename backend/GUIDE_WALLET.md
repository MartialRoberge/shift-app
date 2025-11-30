# 🎯 Guide pratique : Utiliser les wallets XRPL

## 📋 Ce que vous devez faire concrètement

### Étape 1 : Vérifier que tout tourne

```bash
# Terminal 1 : Backend
cd /Users/mathisescriva/CascadeProjects/Hackathon_XRP
npm run dev
# ✅ Doit afficher "Server running on port 3000"

# Terminal 2 : Frontend (si pas déjà lancé)
cd /Users/mathisescriva/CascadeProjects/Hackathon_XRP/frontend
python3 -m http.server 8080
# ✅ Doit afficher "Serving HTTP on 0.0.0.0 port 8080"
```

### Étape 2 : Obtenir une adresse XRPL de test

**Option A : Utiliser le faucet (recommandé pour débuter)**

1. Allez sur : https://xrpl.org/xrp-testnet-faucet.html
2. Cliquez sur "Generate credentials"
3. **Copiez et sauvegardez** :
   - L'adresse XRPL (commence par `r...`)
   - Le seed (commence par `s...`) ⚠️ **GARDEZ-LE SECRET !**
4. Le faucet vous donne automatiquement 1000 XRP de test

**Option B : Utiliser votre seed existante**

Si vous avez déjà un seed de test, vous pouvez l'utiliser directement.

### Étape 3 : Connecter le wallet dans l'app

1. **Ouvrez votre navigateur** : http://localhost:8080/xrpl-wallet.html

2. **Choisissez une méthode de connexion** :

   **Méthode 1 : Seed (le plus simple pour tester)**
   - Cliquez sur "🔑 Connecter avec Seed"
   - Collez votre seed (commence par `s...`)
   - Cliquez sur "Se connecter"
   - ✅ Vous devriez voir votre adresse et votre solde

   **Méthode 2 : XUMM (si vous avez l'app)**
   - Installez XUMM sur votre téléphone
   - Cliquez sur "📱 Connecter avec XUMM"
   - Scannez le QR code avec XUMM
   - Approuvez la connexion

   **Méthode 3 : GemWallet (si vous avez l'extension)**
   - Installez l'extension GemWallet
   - Cliquez sur "💎 Connecter avec GemWallet"
   - Approuvez dans l'extension

3. **Vérifiez** :
   - Votre adresse XRPL s'affiche
   - Votre solde XRP s'affiche
   - Un lien "Voir sur XRPL Explorer" est disponible

### Étape 4 : Utiliser le wallet dans l'application

1. **Retournez à l'app principale** : http://localhost:8080

2. **Inscrivez-vous ou connectez-vous** :
   - Si vous créez un compte, l'adresse XRPL sera **automatiquement pré-remplie** !
   - Sinon, connectez-vous avec un compte existant

3. **Testez le flow complet** :
   - Worker : Créez un shift (check-in/check-out)
   - Employer : Validez le shift (crée escrow + NFT)
   - Employer : Libérez le paiement (worker reçoit les XRP)

### Étape 5 : Vérifier sur l'explorer

1. Cliquez sur le lien "Voir sur XRPL Explorer" dans la page wallet
2. Ou allez sur : https://testnet.xrpl.org
3. Entrez votre adresse XRPL
4. Vous verrez :
   - Votre solde
   - Les transactions (escrows, NFTs, paiements)
   - L'historique complet

## 🎬 Scénario de test complet

### Test 1 : Worker avec wallet connecté

1. ✅ Connectez un wallet sur `/xrpl-wallet.html`
2. ✅ Allez sur `/index.html`
3. ✅ Inscrivez-vous en tant que "Worker"
   - L'adresse XRPL est déjà remplie !
4. ✅ Créez un shift (check-in → check-out)
5. ✅ Le shift est créé avec votre adresse XRPL

### Test 2 : Employer valide et paie

1. ✅ Connectez-vous en tant qu'employer (`bob@test.com`)
2. ✅ Voyez les shifts à valider
3. ✅ Cliquez sur "✅ Valider"
   - Un escrow XRPL est créé
   - Un NFT est minté
4. ✅ Cliquez sur "💰 Libérer paiement"
   - Le worker reçoit les XRP
   - Vérifiez sur l'explorer !

## 🔍 Vérifications

### ✅ Checklist

- [ ] Backend tourne sur port 3000
- [ ] Frontend tourne sur port 8080
- [ ] Wallet connecté (adresse visible)
- [ ] Solde affiché (au moins 10 XRP pour activation)
- [ ] Adresse pré-remplie lors de l'inscription
- [ ] Shift créé avec succès
- [ ] Escrow créé lors de la validation
- [ ] NFT minté (visible sur explorer)
- [ ] Paiement libéré (XRP transféré)

## 🐛 Problèmes courants

### "XUMM n'est pas installé"
→ Utilisez la méthode Seed pour tester rapidement

### "Solde insuffisant"
→ Allez sur le faucet : https://xrpl.org/xrp-testnet-faucet.html

### "Erreur de connexion"
→ Vérifiez que vous êtes sur le testnet (pas mainnet)

### "L'adresse n'est pas pré-remplie"
→ Rechargez la page après avoir connecté le wallet

## 💡 Astuces

1. **Gardez votre seed en sécurité** : Ne le partagez jamais !
2. **Utilisez le testnet** : Tous les XRP sont gratuits
3. **Vérifiez l'explorer** : C'est le meilleur moyen de voir ce qui se passe
4. **Testez avec plusieurs wallets** : Worker et Employer peuvent avoir des wallets différents

## 🚀 Prochaines étapes

Une fois que tout fonctionne :
- Testez avec XUMM (plus réaliste)
- Testez avec GemWallet
- Créez plusieurs shifts
- Testez les différents statuts (proposed, validated, paid)
- Explorez les NFTs sur l'explorer

---

**Besoin d'aide ?** Vérifiez la console du navigateur (F12) pour voir les logs détaillés.

