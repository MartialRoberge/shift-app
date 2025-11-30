# 🐛 Debug XRPL - Validation de shift

## ✅ Ce qui fonctionne

- ✅ Solde XRPL : 100 XRP (suffisant)
- ✅ Connexion XRPL : OK
- ✅ Secret XRPL : Valide
- ✅ Adresse : r7VVQQTwjMibGGcbf2XwVdwxuSXzQo4zv

## 🔍 Pour diagnostiquer l'erreur

### 1. Vérifier les logs du serveur

Le serveur a été redémarré avec des logs détaillés. Quand vous cliquez sur "Valider", regardez les logs :

```bash
tail -f /tmp/backend-xrpl.log
```

Vous devriez voir :
- `🔍 Création escrow XRPL...`
- `From: r7VVQQTwjMibGGcbf2XwVdwxuSXzQo4zv`
- `To: [adresse worker]`
- `Amount: 120 XRP`

### 2. Vérifier l'adresse XRPL du worker

Le problème peut venir d'une adresse XRPL invalide pour le worker. Vérifiez :

```bash
npm run check-xrpl
```

### 3. Causes possibles

1. **Adresse worker invalide** : L'adresse XRPL du worker n'est pas valide ou n'existe pas
2. **Compte worker non activé** : Le compte worker doit avoir au moins 10 XRP pour être activé
3. **Problème de réseau** : Connexion XRPL instable
4. **Erreur de transaction** : Code d'erreur spécifique XRPL

### 4. Solution temporaire (pour tester)

Si vous voulez tester sans XRPL, vous pouvez modifier temporairement le code pour simuler la création :

```typescript
// Dans src/routes/employer.ts, ligne ~130
// Commenter les appels XRPL et utiliser des valeurs de test
const escrowTx = 'test_escrow_tx_' + Date.now();
const nftId = 'test_nft_' + Date.now();
```

## 📋 Prochaines étapes

1. **Réessayez de valider un shift**
2. **Regardez les logs** : `tail -f /tmp/backend-xrpl.log`
3. **Copiez-moi l'erreur exacte** que vous voyez dans les logs

Les logs détaillés vous diront exactement ce qui ne va pas !

