# 🚀 Démarrer le serveur

## ✅ Le serveur répond !

J'ai vérifié : **le serveur tourne déjà sur le port 3000** et répond correctement !

```bash
curl http://localhost:3000/health
# ✅ Retourne: {"status":"ok","timestamp":"..."}
```

## 🔍 Vérifier que le serveur fonctionne

### Test rapide

```bash
# Health check
curl http://localhost:3000/health

# Devrait retourner:
# {"status":"ok","timestamp":"2025-11-29T..."}
```

### Si le serveur ne répond pas

#### Option 1 : Redémarrer le serveur

```bash
# Arrêter le processus existant
lsof -ti:3000 | xargs kill -9

# Redémarrer
npm run dev
```

#### Option 2 : Vérifier les logs

Le serveur devrait afficher :
```
🚀 Server running on port 3000
📝 Environment: development
✅ Connected to PostgreSQL (si DB configurée)
✅ Connected to XRPL testnet
```

#### Option 3 : Vérifier la base de données

Si le serveur ne démarre pas, c'est peut-être à cause de PostgreSQL :

```bash
# Vérifier si PostgreSQL tourne
docker ps | grep postgres

# Si pas de PostgreSQL, démarrer avec Docker
docker-compose up -d postgres

# Attendre que PostgreSQL soit prêt (10-15 secondes)
# Puis lancer les migrations
npm run migrate
```

## 🌐 Accéder au serveur

### Dans le navigateur

Ouvrez : **http://localhost:3000/health**

Vous devriez voir :
```json
{
  "status": "ok",
  "timestamp": "2025-11-29T..."
}
```

### Tester les routes

```bash
# Health check
curl http://localhost:3000/health

# Register (sans auth)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","role":"worker"}'

# Login (après register)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

## 🐛 Problèmes courants

### "Cannot connect to database"

**Solution** : Configurer PostgreSQL

```bash
# Avec Docker
docker-compose up -d postgres
npm run migrate

# Ou PostgreSQL local
createdb hackathon_xrp
npm run migrate
```

### "Port 3000 already in use"

**Solution** : Arrêter le processus existant

```bash
# Trouver le processus
lsof -ti:3000

# L'arrêter
lsof -ti:3000 | xargs kill -9

# Redémarrer
npm run dev
```

### "XRPL connection failed"

**Solution** : C'est normal si XRPL n'est pas configuré. Le serveur continue sans XRPL.

## ✅ Le serveur est prêt !

Si `curl http://localhost:3000/health` retourne `{"status":"ok"}`, alors :
- ✅ Le serveur tourne
- ✅ Les routes sont accessibles
- ✅ Vous pouvez brancher le frontend

**Ouvrez http://localhost:3000/health dans votre navigateur pour vérifier !**

