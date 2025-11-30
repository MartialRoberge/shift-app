# SHIFT - Blockchain-based Interim Work Platform

Application de gestion de travail intérimaire avec vérification blockchain (XRPL), analyse IA des shifts et paiements sécurisés.

## Architecture

```
shift-app/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # Composants réutilisables (BottomNav, VoiceRecorder, Wallet...)
│   │   ├── routes/      # Pages (SelectRole, WorkerHome, AgencyHome)
│   │   └── ...
│   └── ...
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/      # API endpoints (auth, worker, employer, shifts, stats)
│   │   ├── services/    # Services (AssemblyAI, LLM, XRPL, Storage)
│   │   ├── db/          # PostgreSQL (schema, migrations, seed)
│   │   └── ...
│   └── ...
└── package.json       # Scripts racine pour gérer les deux projets
```

## Stack technique

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Framer Motion (animations)
- TailwindCSS (styling)
- React Router (navigation)

### Backend
- Node.js + Express + TypeScript
- PostgreSQL (base de données)
- AssemblyAI (Speech-to-Text)
- OpenAI (analyse LLM des shifts)
- XRPL (blockchain - escrow, NFT)

## Installation

```bash
# Cloner le projet
git clone <repo>
cd shift-app

# Installer toutes les dépendances
npm run install:all

# Configurer l'environnement backend
cp backend/env.example backend/.env
# Éditer backend/.env avec vos clés API

# Créer la base de données PostgreSQL
createdb hackathon_xrp

# Lancer les migrations
npm run migrate

# Créer les utilisateurs de test
npm run seed
```

## Démarrage

```bash
# Lancer frontend ET backend en parallèle
npm run dev

# Ou séparément :
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3000
```

## Utilisateurs de test

Après `npm run seed` :

| Role     | Email            | Password    |
|----------|------------------|-------------|
| Worker   | alice@test.com   | password123 |
| Employer | bob@test.com     | password123 |
| Admin    | admin@test.com   | password123 |

## Flow de l'application

### Worker
1. Accepte une mission publiée par l'agence
2. Démarre un shift quand il veut (check-in vocal + GPS)
3. Travaille le temps souhaité
4. Termine le shift (check-out vocal + GPS)
5. L'IA analyse la cohérence des données
6. Shift soumis pour validation

### Agence
1. Publie des missions globales (ex: "500h de manutention")
2. Reçoit et accepte/refuse les candidatures
3. Suit l'avancement des missions en temps réel
4. Valide les shifts soumis (avec aide de l'analyse IA)
5. Paiement automatique via blockchain

## API Endpoints

### Auth
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter

### Worker
- `POST /worker/shifts/start` - Démarrer un shift (avec audio)
- `POST /worker/shifts/end` - Terminer un shift (avec audio)
- `GET /worker/shifts` - Liste des shifts du worker

### Employer
- `GET /employer/shifts` - Liste des shifts à valider
- `POST /employer/shifts/:id/validate` - Valider un shift
- `POST /employer/shifts/:id/refuse` - Refuser un shift

### Shifts
- `GET /shifts/:id` - Détails d'un shift
- `POST /shifts/:id/release` - Libérer le paiement

## Analyse LLM

Chaque shift est analysé par l'IA qui retourne :

```json
{
  "notes": "Résumé de la journée",
  "issues": ["Points d'attention"],
  "job_type": "logistics",
  "confidence": 0.95,
  "risk_flags": ["fatigue_reported", "safety_concern"],
  "legal_flags": ["overtime_requires_validation"]
}
```

## License

MIT
