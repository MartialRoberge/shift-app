# 🧪 Guide de test complet - Flow end-to-end

## ✅ Étape 1 : Wallet connecté (DÉJÀ FAIT)

Votre wallet XRPL est connecté ! Vous pouvez maintenant tester le flow complet.

---

## 🎯 Étape 2 : Créer un shift (Worker)

### 2.1 Obtenir l'ID d'un employer

**Option A : Utiliser un employer existant**
1. Déconnectez-vous (bouton "Déconnexion")
2. Connectez-vous avec : `bob@test.com` / `password123` (employer)
3. Notez l'ID de l'employer (visible dans l'URL ou la console)
4. Déconnectez-vous à nouveau

**Option B : Créer un nouveau employer**
1. Sur la page de connexion, cliquez sur "Inscription"
2. Remplissez :
   - Nom : "Test Employer"
   - Email : `employer-test@test.com`
   - Mot de passe : `password123`
   - Rôle : **Employer**
   - Adresse XRPL : Laissez vide ou utilisez une autre adresse de test
3. Notez l'ID de l'employer (visible après inscription)

### 2.2 Démarrer un shift

1. **Connectez-vous en tant que Worker** :
   - Email : `alice@test.com`
   - Mot de passe : `password123`

2. **Dans la section "Démarrer un shift"** :
   - Collez l'ID de l'employer dans "ID de l'employeur (UUID)"
   - (Optionnel) Type de travail : "Garde d'enfants"

3. **Enregistrez le check-in** :
   - Cliquez sur "🎤 Enregistrer check-in"
   - Parlez quelque chose (ex: "Bonjour, je commence mon shift de garde d'enfants à 9h")
   - Cliquez sur "⏹️ Arrêter"
   - Cliquez sur "Démarrer le shift"

4. **Vérifiez** :
   - Un message de succès devrait apparaître
   - Le shift apparaît dans "Mes shifts" avec le statut "ongoing"

### 2.3 Terminer le shift

1. **Dans la section "Terminer un shift"** :
   - Sélectionnez le shift actif dans le dropdown

2. **Enregistrez le check-out** :
   - Cliquez sur "🎤 Enregistrer check-out"
   - Parlez quelque chose (ex: "Je termine mon shift, j'ai gardé 2 enfants pendant 8 heures")
   - Cliquez sur "⏹️ Arrêter"
   - Cliquez sur "Terminer le shift"

3. **Vérifiez** :
   - Le shift passe au statut "proposed"
   - Les heures sont calculées
   - Le montant est estimé

---

## 🎯 Étape 3 : Valider le shift (Employer)

1. **Déconnectez-vous** et **connectez-vous en tant qu'Employer** :
   - Email : `bob@test.com` (ou celui que vous avez créé)
   - Mot de passe : `password123`

2. **Dans la section "Employer Dashboard"** :
   - Cliquez sur "Actualiser" pour voir les shifts à valider
   - Vous devriez voir le shift que vous venez de créer

3. **Valider le shift** :
   - Cliquez sur "✅ Valider" sur le shift
   - ⚠️ **Cela va créer un escrow XRPL et un NFT !**
   - Vérifiez que vous avez assez de XRP (le wallet de la plateforme doit avoir ~100 XRP)

4. **Vérifiez** :
   - Le statut passe à "validated"
   - Un message confirme la création de l'escrow et du NFT
   - Les hashs de transaction sont affichés

5. **Voir sur l'explorer** :
   - Cliquez sur les liens "Voir sur XRPL Explorer"
   - Vous verrez l'escrow et le NFT créés

---

## 🎯 Étape 4 : Libérer le paiement (Employer)

1. **Toujours connecté en tant qu'Employer** :
   - Dans la liste des shifts validés
   - Cliquez sur "💰 Libérer paiement"

2. **Vérifiez** :
   - Le statut passe à "paid"
   - Un message confirme le paiement
   - Le hash de transaction est affiché

3. **Vérifier sur l'explorer** :
   - Cliquez sur le lien de transaction
   - Vous verrez que l'escrow a été consommé
   - Le worker a reçu les XRP

---

## 🎯 Étape 5 : Vérifier côté Worker

1. **Déconnectez-vous** et **reconnectez-vous en tant que Worker** :
   - Email : `alice@test.com`
   - Mot de passe : `password123`

2. **Dans "Mes shifts"** :
   - Cliquez sur "Actualiser"
   - Vous devriez voir le shift avec le statut "paid"

3. **Vérifier le wallet du worker** :
   - Allez sur http://localhost:8080/xrpl-wallet.html
   - Connectez-vous avec le wallet du worker
   - Vérifiez que le solde a augmenté (si le worker a une adresse XRPL configurée)

---

## 📋 Checklist de test

- [ ] Wallet XRPL connecté
- [ ] Shift créé (check-in → check-out)
- [ ] Shift en statut "proposed"
- [ ] Shift validé par l'employer
- [ ] Escrow XRPL créé (vérifié sur explorer)
- [ ] NFT minté (vérifié sur explorer)
- [ ] Paiement libéré
- [ ] Shift en statut "paid"
- [ ] Transaction visible sur l'explorer

---

## 🐛 Problèmes courants

### "Aucun shift à valider"
- Vérifiez que vous avez bien terminé le shift en tant que worker
- Vérifiez que le statut est "proposed"
- Actualisez la page employer

### "Erreur lors de la validation"
- Vérifiez que le wallet de la plateforme a assez de XRP (100 XRP minimum)
- Vérifiez que les adresses XRPL des users sont valides
- Regardez les logs du backend

### "Erreur lors de la libération"
- Vérifiez que le shift est bien en statut "validated"
- Vérifiez que l'escrow existe toujours
- Regardez les logs du backend

---

## 🔗 Liens utiles

- **Frontend** : http://localhost:8080
- **Wallet** : http://localhost:8080/xrpl-wallet.html
- **Backend Health** : http://localhost:3000/health
- **XRPL Explorer (Testnet)** : https://testnet.xrpl.org

---

## 💡 Astuces

1. **Ouvrez la console du navigateur** (F12) pour voir les logs détaillés
2. **Regardez les logs du backend** pour voir les transactions XRPL
3. **Utilisez l'explorer XRPL** pour vérifier toutes les transactions
4. **Testez avec de petits montants** d'abord (30 XRP au lieu de 120 XRP)

---

**Bon test ! 🚀**

