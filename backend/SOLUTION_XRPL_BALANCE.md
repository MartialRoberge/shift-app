# 💰 Solution : Solde XRPL insuffisant

## 🔍 Problème

L'erreur indique que le wallet n'a pas assez de XRP pour :
1. Activer le compte worker (10 XRP)
2. Créer l'escrow (120 XRP dans votre cas)
3. Frais de transaction (~5 XRP)

**Total nécessaire** : ~135 XRP

## ✅ Solutions

### Option 1 : Obtenir plus de XRP de test (recommandé)

1. Allez sur : https://xrpl.org/xrp-testnet-faucet.html
2. Entrez votre adresse : `r7VVQQTwjMibGGcbf2XwVdwxuSXzQo4zv`
3. Obtenez 1000 XRP de test
4. Réessayez de valider le shift

### Option 2 : Réduire le montant du shift

Pour tester avec moins de XRP, vous pouvez modifier le shift de test :

```bash
# Modifier le shift pour avoir moins d'heures
# Par exemple, 1 heure au lieu de 8 heures = 15 XRP au lieu de 120 XRP
```

### Option 3 : Utiliser un mode démo (sans vraies transactions XRPL)

Pour la démo du hackathon, on peut simuler les transactions XRPL.

## 🔧 Vérifier votre solde

```bash
npm run check-xrpl
```

Cela vous dira exactement combien de XRP vous avez.

## 💡 Recommandation

Pour le hackathon, la solution la plus simple est d'obtenir plus de XRP de test via le faucet. C'est gratuit et instantané !

