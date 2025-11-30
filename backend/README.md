# Hackathon XRP - Backend API

Backend API pour la gestion de shifts de travail avec intégration XRPL, AssemblyAI et LLM.

## 🏗️ Architecture

- **Frontend** : Interface web/mobile (non inclus)
- **Backend** : API REST Node.js/Express/TypeScript
- **Base de données** : PostgreSQL
- **STT** : AssemblyAI
- **LLM** : OpenAI (ou autre)
- **Blockchain** : XRPL (escrow, NFT)

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 14+
- Clés API :
  - AssemblyAI
  - OpenAI (ou autre LLM)
  - XRPL (testnet ou mainnet)

## 🚀 Installation

1. **Cloner et installer les dépendances**

```bash
npm install
```

2. **Configurer l'environnement**

Copier `env.example` vers `.env` et remplir les variables :

```bash
cp env.example .env
```

Variables importantes :
- `DATABASE_URL` : URL de connexion PostgreSQL
- `ASSEMBLYAI_API_KEY` : Clé API AssemblyAI
- `OPENAI_API_KEY` : Clé API OpenAI
- `XRPL_NETWORK` : `testnet` ou `mainnet`
- `XRPL_PLATFORM_SECRET` : Secret du wallet XRPL pour les opérations

3. **Créer la base de données**

```bash
createdb hackathon_xrp
```

4. **Lancer les migrations**

```bash
npm run migrate
```

5. **Démarrer le serveur**

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000`

## 📚 API Endpoints

### Authentification

- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter

### Worker

- `POST /worker/shifts/start` - Démarrer un shift (avec audio)
- `POST /worker/shifts/end` - Terminer un shift (avec audio)
- `GET /worker/shifts` - Liste des shifts du worker

### Employer

- `GET /employer/shifts` - Liste des shifts à valider
- `POST /employer/shifts/:id/validate` - Valider un shift (crée escrow + NFT)
- `POST /employer/shifts/:id/refuse` - Refuser un shift

### Shifts

- `GET /shifts/:id` - Détails d'un shift
- `POST /shifts/:id/release` - Libérer le paiement (consomme l'escrow)

### Statistiques

- `GET /stats/global` - Statistiques globales
- `GET /stats/workers/:id/shifts` - Stats d'un worker
- `GET /stats/employers/:id/shifts` - Stats d'un employeur

## 🔄 Flow complet

1. **Worker check-in**
   - Upload audio → AssemblyAI (STT) → LLM (analyse) → Création `work_session` avec status `proposed`

2. **Worker check-out**
   - Upload audio → AssemblyAI (STT) → LLM (analyse complète) → Mise à jour `work_session` avec heures et montant

3. **Employeur valide**
   - Validation → Création escrow XRPL → Mint NFT → Status `validated`

4. **Release paiement**
   - Consommation escrow → Paiement au worker → Status `paid`

## 🗄️ Modèle de données

### Table `users`
- `id`, `role` (worker/employer/admin), `name`, `email`, `xrpl_address`, `password_hash`

### Table `work_sessions`
- `id`, `worker_id`, `employer_id`, `start_time`, `end_time`
- `raw_audio_start_url`, `raw_audio_end_url`
- `stt_start_text`, `stt_end_text`
- `llm_structured_json` (JSONB)
- `hours`, `hourly_rate`, `amount_total`
- `status` (proposed/validated/disputed/paid/refused)
- `xrpl_nft_id`, `xrpl_escrow_tx`, `xrpl_payment_tx`

## 🔧 Configuration XRPL

Pour le hackathon, le backend utilise un compte "plateforme" pour signer les transactions. En production, chaque user devrait avoir son propre wallet.

**Testnet** :
- Obtenir des XRP de test : https://xrpl.org/xrp-testnet-faucet.html
- Explorer : https://testnet.xrpl.org/

## 📝 Notes

- Les fichiers audio sont stockés localement dans `./uploads` (configurable)
- Le LLM utilise GPT-4o-mini par défaut (modifiable dans `src/services/llm.ts`)
- Les métadonnées NFT sont encodées en hex (limite 256 bytes). En production, utiliser IPFS.

## 🧪 Test rapide

### Option 1 : Utiliser le script de seed

```bash
npm run seed
```

Cela crée automatiquement :
- Worker : `alice@test.com` / `password123`
- Employer : `bob@test.com` / `password123`
- Admin : `admin@test.com` / `password123`

### Option 2 : Créer manuellement

```bash
# Créer un worker
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "role": "worker", "xrpl_address": "rWorker..."}'

# Créer un employeur
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob", "role": "employer", "xrpl_address": "rEmployer..."}'
```

Voir `API_EXAMPLES.md` pour plus d'exemples d'utilisation.

## 🐳 Docker (Optionnel)

Pour démarrer rapidement avec Docker :

```bash
docker-compose up
```

Cela démarre :
- PostgreSQL sur le port 5432
- Le backend sur le port 3000

Puis lancer les migrations :
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

## 📦 Structure du projet

```
src/
├── db/
│   ├── connection.ts      # Pool PostgreSQL
│   ├── schema.sql          # Schéma DB
│   ├── migrate.ts          # Script de migration
│   └── seed.ts             # Script de seed (users de test)
├── services/
│   ├── storage.ts          # Gestion fichiers audio
│   ├── assemblyai.ts       # Intégration AssemblyAI
│   ├── llm.ts              # Intégration LLM
│   └── xrpl.ts             # Intégration XRPL
├── routes/
│   ├── auth.ts             # Authentification
│   ├── worker.ts           # Routes worker
│   ├── employer.ts         # Routes employer
│   ├── shifts.ts           # Routes shifts
│   └── stats.ts            # Statistiques
├── middleware/
│   └── auth.ts             # JWT middleware
├── utils/
│   ├── validation.ts       # Validation Zod
│   ├── errors.ts           # Classes d'erreurs
│   └── logger.ts           # Logger
├── types/
│   └── index.ts            # Types TypeScript
└── index.ts                # Point d'entrée
```

## 🐛 Dépannage

- **Erreur de connexion PostgreSQL** : Vérifier `DATABASE_URL`
- **Erreur AssemblyAI** : Vérifier la clé API et le format audio
- **Erreur XRPL** : Vérifier le réseau (testnet/mainnet) et les secrets
- **Erreur LLM** : Vérifier la clé OpenAI et les quotas

## 📄 License

MIT

