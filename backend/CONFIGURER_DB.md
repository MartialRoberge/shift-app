# 🗄️ Configurer la base de données

## ✅ Bonne nouvelle : Le serveur fonctionne !

Le serveur répond bien sur le port 3000 :
```bash
curl http://localhost:3000/health
# ✅ {"status":"ok","timestamp":"..."}
```

Mais la base de données PostgreSQL n'est pas encore configurée.

## 🚀 Solution rapide : Docker

### Option 1 : Démarrer Docker Desktop

1. **Ouvrir Docker Desktop** sur votre Mac
2. **Attendre** que Docker soit complètement démarré (icône Docker dans la barre de menu)
3. **Puis exécuter** :

```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Attendre 10 secondes que PostgreSQL soit prêt
sleep 10

# Créer les tables
npm run migrate

# Créer les users de test
npm run seed
```

### Option 2 : PostgreSQL local

Si vous avez PostgreSQL installé localement :

```bash
# Créer la base de données
createdb hackathon_xrp

# Ou avec un utilisateur spécifique
createdb -U votre_user hackathon_xrp

# Modifier .env si nécessaire
# DATABASE_URL=postgresql://votre_user:password@localhost:5432/hackathon_xrp

# Créer les tables
npm run migrate

# Créer les users de test
npm run seed
```

## 🧪 Tester après configuration

Une fois la base de données configurée :

```bash
# Test 1: Health check (devrait toujours fonctionner)
curl http://localhost:3000/health

# Test 2: Register (devrait maintenant fonctionner)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"worker","email":"test@test.com","password":"test123"}'

# Test 3: Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 📋 Checklist

- [ ] Docker Desktop est démarré (ou PostgreSQL local installé)
- [ ] PostgreSQL est en cours d'exécution
- [ ] `npm run migrate` a réussi
- [ ] `npm run seed` a réussi
- [ ] Le serveur répond sur http://localhost:3000/health
- [ ] Les routes API fonctionnent

## ⚠️ Si Docker ne démarre pas

1. **Vérifier Docker Desktop** : Est-il installé et démarré ?
2. **Vérifier les permissions** : Docker a-t-il les permissions nécessaires ?
3. **Alternative** : Installer PostgreSQL localement

## ✅ Une fois configuré

Vous pourrez :
- ✅ Créer des comptes
- ✅ Se connecter
- ✅ Démarrer des shifts
- ✅ Valider des shifts
- ✅ Tester toutes les fonctionnalités

**Le serveur est prêt, il ne manque plus que la base de données ! 🎉**

