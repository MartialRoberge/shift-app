# 🔧 Solution : Erreur "Failed to create XRPL escrow/NFT"

## 🐛 Problème

Lors de la validation d'un shift côté employeur, vous obtenez l'erreur :
```
Failed to create XRPL escrow/NFT
```

## 🔍 Diagnostic

### Étape 1 : Vérifier la configuration XRPL

Exécutez le script de diagnostic :

```bash
npm run diagnose-xrpl
```

Ce script vérifie :
- ✅ Configuration XRPL_PLATFORM_SECRET
- ✅ Connexion au réseau XRPL
- ✅ Solde du wallet
- ✅ État du compte

### Étape 2 : Causes possibles

#### 1. **Solde XRP insuffisant** (le plus probable)

**Symptômes :**
- Erreur : "Insufficient XRP balance" ou "tecUNFUNDED"
- Le wallet n'a pas assez de XRP

**Solution :**
1. Vérifiez le solde :
   ```bash
   npm run check-xrpl
   ```

2. Si le solde < 20 XRP, obtenez des XRP de test :
   - Allez sur : https://xrpl.org/xrp-testnet-faucet.html
   - Entrez l'adresse du wallet (affichée par le script)
   - Cliquez sur "Generate credentials" ou utilisez votre adresse

3. **Minimum requis :**
   - 10 XRP pour activer un compte worker (si nécessaire)
   - Montant de l'escrow (ex: 30 XRP)
   - 5 XRP pour les frais de transaction
   - **Total recommandé : ≥ 50 XRP**

#### 2. **Compte worker non activé**

**Symptômes :**
- Erreur : "tecNO_DST" ou "Destination account does not exist"

**Solution :**
Le système devrait activer automatiquement le compte worker, mais si ça échoue :
1. Vérifiez que le worker a une adresse XRPL valide
2. Activez manuellement le compte worker avec des XRP de test

#### 3. **Problème de connexion**

**Symptômes :**
- Erreur : "ECONNREFUSED" ou "Connection failed"

**Solution :**
1. Vérifiez votre connexion internet
2. Vérifiez que le serveur XRPL testnet est accessible
3. Réessayez après quelques secondes

#### 4. **Secret XRPL invalide**

**Symptômes :**
- Erreur : "Invalid secret" ou erreur lors de la création du wallet

**Solution :**
1. Vérifiez que `XRPL_PLATFORM_SECRET` dans `.env` est un seed valide
2. Le seed doit commencer par `s` (ex: `sEd7D9xhHkVVLX3CYhZCZxHe3gnGwxj`)

## 🛠️ Solutions étape par étape

### Solution rapide

1. **Vérifier le solde :**
   ```bash
   npm run diagnose-xrpl
   ```

2. **Si solde insuffisant :**
   - Obtenez des XRP de test sur : https://xrpl.org/xrp-testnet-faucet.html
   - Utilisez l'adresse affichée par le script

3. **Réessayer la validation**

### Solution complète

1. **Diagnostic complet :**
   ```bash
   npm run diagnose-xrpl
   ```

2. **Vérifier les logs du serveur :**
   - Regardez la console du serveur backend
   - Cherchez les messages d'erreur XRPL détaillés

3. **Vérifier les adresses XRPL :**
   - Vérifiez que le worker a une adresse XRPL valide
   - Vérifiez que l'employeur a une adresse XRPL valide

4. **Tester manuellement :**
   ```bash
   npm run check-xrpl
   ```

## 📋 Checklist de vérification

- [ ] `XRPL_PLATFORM_SECRET` est défini dans `.env`
- [ ] Le wallet a au moins 20 XRP (recommandé : 50 XRP)
- [ ] Connexion internet active
- [ ] Le worker a une adresse XRPL valide
- [ ] L'employeur a une adresse XRPL valide
- [ ] Le serveur backend est en cours d'exécution

## 🔗 Liens utiles

- **Faucet XRPL Testnet :** https://xrpl.org/xrp-testnet-faucet.html
- **Explorer XRPL Testnet :** https://testnet.xrpl.org/
- **Documentation XRPL :** https://xrpl.org/docs.html

## 💡 Messages d'erreur améliorés

L'application affiche maintenant des messages d'erreur plus détaillés :

- **"Fonds XRPL insuffisants"** → Obtenez des XRP de test
- **"Connexion XRPL échouée"** → Vérifiez votre connexion internet
- **"Secret XRPL invalide"** → Vérifiez XRPL_PLATFORM_SECRET dans .env

## 🎯 Prochaines étapes

1. Exécutez `npm run diagnose-xrpl`
2. Suivez les instructions affichées
3. Réessayez de valider le shift

Si le problème persiste, vérifiez les logs du serveur backend pour plus de détails.

