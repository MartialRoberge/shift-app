# ✅ Configuration complète

Vos identifiants ont été configurés dans le fichier `.env`.

## 🔑 Identifiants configurés

- ✅ **AssemblyAI** : API Key configurée
- ✅ **OpenAI** : API Key configurée  
- ✅ **XRPL Testnet** : 
  - Adresse : `r7VVQQTwjMibGGcbf2XwVdwxuSXzQo4zv`
  - Secret : Configuré dans `.env`

## 📋 Prochaines étapes

### 1. Vérifier la base de données PostgreSQL

Le `.env` est configuré avec :
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hackathon_xrp
```

**Si votre configuration PostgreSQL est différente**, modifiez `DATABASE_URL` dans `.env`.

### 2. Créer la base de données

```bash
# Si vous utilisez PostgreSQL par défaut
createdb hackathon_xrp

# Ou avec un utilisateur spécifique
createdb -U votre_user hackathon_xrp
```

### 3. Lancer les migrations

```bash
npm run migrate
```

### 4. (Optionnel) Créer des users de test

```bash
npm run seed
```

Cela crée :
- Worker : `alice@test.com` / `password123`
- Employer : `bob@test.com` / `password123`
- Admin : `admin@test.com` / `password123`

### 5. Démarrer le serveur

```bash
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000` ✅

## 🧪 Test rapide

Une fois le serveur démarré :

```bash
# Health check
curl http://localhost:3000/health

# Se connecter (si vous avez lancé le seed)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@test.com", "password": "password123"}'
```

## ⚠️ Notes importantes

1. **Sécurité** : Le fichier `.env` contient des secrets. Ne le commitez JAMAIS dans Git (déjà dans `.gitignore`).

2. **XRPL Testnet** : Assurez-vous que votre wallet testnet a des XRP de test. Si besoin :
   - https://xrpl.org/xrp-testnet-faucet.html

3. **Base de données** : Si vous utilisez Docker, vous pouvez utiliser `docker-compose up` qui configure PostgreSQL automatiquement.

## 🐛 Dépannage

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL tourne
pg_isready

# Vérifier la connexion
psql -U postgres -d hackathon_xrp -c "SELECT 1;"
```

### Erreur AssemblyAI
- Vérifier que la clé API est correcte
- Vérifier votre quota sur https://www.assemblyai.com/

### Erreur OpenAI
- Vérifier que la clé API est correcte
- Vérifier votre quota sur https://platform.openai.com/

### Erreur XRPL
- Vérifier que le wallet testnet a des XRP
- Vérifier que le secret est correct
- Explorer : https://testnet.xrpl.org/

## 🚀 Prêt à démarrer !

Tout est configuré. Il ne reste plus qu'à :
1. Créer la base de données
2. Lancer les migrations
3. Démarrer le serveur

Bon hackathon ! 🎉

