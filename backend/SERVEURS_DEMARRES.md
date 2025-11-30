# 🚀 Serveurs démarrés !

## ✅ État actuel

### Backend
- **URL** : http://localhost:3000
- **Statut** : ✅ Fonctionne
- **Health check** : http://localhost:3000/health

### Frontend
- **URL** : http://localhost:8080
- **Statut** : ✅ Fonctionne
- **Fichiers** : `frontend/index.html`

## 🧪 Tester maintenant

### 1. Ouvrir le frontend

**Ouvrez dans votre navigateur** : http://localhost:8080

### 2. Se connecter

Utilisez les comptes de test :
- **Worker** : `alice@test.com` / `password123`
- **Employer** : `bob@test.com` / `password123`

### 3. Tester le flow

1. **Se connecter** comme worker
2. **Démarrer un shift** :
   - Entrer l'ID d'un employer (créez-en un d'abord)
   - Enregistrer un audio de check-in
   - Cliquer "Démarrer le shift"
3. **Terminer le shift** :
   - Sélectionner le shift actif
   - Enregistrer un audio de check-out
   - Cliquer "Terminer le shift"
4. **Se connecter comme employer** :
   - Voir les shifts à valider
   - Valider un shift (crée escrow + NFT)
   - Libérer le paiement

## 🔧 Commandes utiles

### Arrêter les serveurs

```bash
# Arrêter le frontend
lsof -ti:8080 | xargs kill -9

# Arrêter le backend
lsof -ti:3000 | xargs kill -9
```

### Redémarrer

```bash
# Backend
cd /Users/mathisescriva/CascadeProjects/Hackathon_XRP
npm run dev

# Frontend
cd /Users/mathisescriva/CascadeProjects/Hackathon_XRP/frontend
python3 -m http.server 8080
```

## 📋 Vérifications

### Backend fonctionne ?
```bash
curl http://localhost:3000/health
# Devrait retourner: {"status":"ok","timestamp":"..."}
```

### Frontend accessible ?
Ouvrez http://localhost:8080 dans votre navigateur

### CORS OK ?
Le backend a CORS activé, donc pas de problème de cross-origin.

## ✅ Tout est prêt !

**Ouvrez http://localhost:8080 et commencez à tester ! 🎉**

