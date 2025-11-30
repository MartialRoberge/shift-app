# 🚀 Guide de démarrage rapide

## Installation en 5 minutes

### 1. Prérequis
- Node.js 18+ installé
- PostgreSQL installé et démarré
- Comptes API : AssemblyAI, OpenAI

### 2. Installation

```bash
# Cloner le projet (si nécessaire)
cd Hackathon_XRP

# Installer les dépendances
npm install

# Créer la base de données

createdb hackathon_xrp

# Configurer l'environnement
cp env.example .env
# Éditer .env et remplir vos clés API
```

### 3. Configuration `.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/hackathon_xrp
ASSEMBLYAI_API_KEY=votre_cle_assemblyai
OPENAI_API_KEY=votre_cle_openai
XRPL_NETWORK=testnet
XRPL_PLATFORM_SECRET=sVotreSecretXRPL...
```

**Obtenir des clés API :**
- AssemblyAI : https://www.assemblyai.com/
- OpenAI : https://platform.openai.com/
- XRPL Testnet : https://xrpl.org/xrp-testnet-faucet.html

### 4. Initialiser la base de données

```bash
# Créer les tables
npm run migrate

# Créer des utilisateurs de test
npm run seed
```

### 5. Démarrer le serveur

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000` ✅

## Test rapide

### 1. Se connecter en tant que worker

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "password": "password123"
  }'
```

Copier le `token` de la réponse.

### 2. Démarrer un shift (exemple)

```bash
# Remplacez YOUR_TOKEN par le token obtenu
curl -X POST http://localhost:3000/worker/shifts/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "employer_id=EMPLOYER_UUID" \
  -F "audio=@chemin/vers/votre/audio.mp3"
```

### 3. Vérifier le health check

```bash
curl http://localhost:3000/health
```

## 🐳 Alternative avec Docker

Si vous préférez Docker :

```bash
# Démarrer PostgreSQL + Backend
docker-compose up -d

# Lancer les migrations
docker-compose exec backend npm run migrate

# Créer les users de test
docker-compose exec backend npm run seed
```

## 📚 Prochaines étapes

1. Consulter `API_EXAMPLES.md` pour tous les endpoints
2. Tester avec Postman ou un client HTTP
3. Intégrer le frontend
4. Configurer XRPL avec de vrais wallets

## ⚠️ Dépannage

**Erreur de connexion PostgreSQL :**
```bash
# Vérifier que PostgreSQL tourne
pg_isready

# Vérifier la DATABASE_URL dans .env
```

**Erreur AssemblyAI :**
- Vérifier que la clé API est correcte
- Vérifier le format audio (mp3, wav, m4a supportés)

**Erreur XRPL :**
- Pour testnet, obtenir des XRP de test : https://xrpl.org/xrp-testnet-faucet.html
- Vérifier que le secret est correct

## 📝 Notes

- Les fichiers audio sont stockés dans `./uploads`
- En développement, les erreurs détaillées sont affichées
- Le LLM utilise GPT-4o-mini par défaut (modifiable dans `src/config/prompts.ts`)

