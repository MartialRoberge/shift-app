# Exemples d'utilisation de l'API

## 🔐 Authentification

### Créer un worker

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Worker",
    "email": "alice@example.com",
    "password": "password123",
    "role": "worker",
    "xrpl_address": "rWorkerAddress123..."
  }'
```

### Créer un employeur

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Employer",
    "email": "bob@example.com",
    "password": "password123",
    "role": "employer",
    "xrpl_address": "rEmployerAddress456..."
  }'
```

### Se connecter

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Réponse :
```json
{
  "user": {
    "id": "uuid",
    "name": "Alice Worker",
    "email": "alice@example.com",
    "role": "worker",
    "xrpl_address": "rWorkerAddress123..."
  },
  "token": "jwt-token-here"
}
```

## 👷 Worker - Démarrer un shift

```bash
curl -X POST http://localhost:3000/worker/shifts/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@/path/to/checkin-audio.mp3" \
  -F "employer_id=EMPLOYER_UUID" \
  -F "job_type=childcare"
```

Réponse :
```json
{
  "work_session_id": "uuid",
  "start_time": "2024-01-15T10:00:00Z",
  "status": "proposed",
  "transcript": "Bonjour, je commence mon shift de garde d'enfants...",
  "analysis": {
    "job_type": "childcare",
    "notes": "Début de shift confirmé"
  }
}
```

## 👷 Worker - Terminer un shift

```bash
curl -X POST http://localhost:3000/worker/shifts/end \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@/path/to/checkout-audio.mp3" \
  -F "work_session_id=WORK_SESSION_UUID"
```

Réponse :
```json
{
  "work_session_id": "uuid",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T18:00:00Z",
  "hours": 8.0,
  "hourly_rate": 15.0,
  "amount_total": 120.0,
  "status": "proposed",
  "analysis": {
    "job_type": "childcare",
    "notes": "Shift terminé, 2 enfants gardés",
    "issues": [],
    "risk_flags": [],
    "legal_flags": []
  }
}
```

## 👷 Worker - Lister ses shifts

```bash
curl -X GET "http://localhost:3000/worker/shifts?status=proposed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 👔 Employer - Lister les shifts à valider

```bash
curl -X GET "http://localhost:3000/employer/shifts?status=proposed" \
  -H "Authorization: Bearer EMPLOYER_TOKEN"
```

## 👔 Employer - Valider un shift

```bash
curl -X POST http://localhost:3000/employer/shifts/SHIFT_UUID/validate \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hourly_rate": 15.0,
    "adjustments": {}
  }'
```

Réponse :
```json
{
  "shift_id": "uuid",
  "status": "validated",
  "hours": 8.0,
  "amount_total": 120.0,
  "xrpl_escrow_tx": "tx-hash-here",
  "xrpl_nft_id": "nft-id-here",
  "message": "120 XRP locked in escrow for this shift"
}
```

## 👔 Employer - Refuser un shift

```bash
curl -X POST http://localhost:3000/employer/shifts/SHIFT_UUID/refuse \
  -H "Authorization: Bearer EMPLOYER_TOKEN"
```

## 💰 Release du paiement

```bash
curl -X POST http://localhost:3000/shifts/SHIFT_UUID/release \
  -H "Authorization: Bearer TOKEN"
```

Réponse :
```json
{
  "shift_id": "uuid",
  "status": "paid",
  "xrpl_payment_tx": "tx-hash-here",
  "message": "Payment released successfully"
}
```

## 📊 Statistiques

### Statistiques globales

```bash
curl -X GET http://localhost:3000/stats/global \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

Réponse :
```json
{
  "total_hours": 120.5,
  "total_escrow": 1807.5,
  "total_paid": 5000.0,
  "total_shifts": 45,
  "shifts_by_status": {
    "proposed": 5,
    "validated": 10,
    "paid": 30
  }
}
```

### Statistiques d'un worker

```bash
curl -X GET http://localhost:3000/stats/workers/WORKER_UUID/shifts \
  -H "Authorization: Bearer TOKEN"
```

### Statistiques d'un employeur

```bash
curl -X GET http://localhost:3000/stats/employers/EMPLOYER_UUID/shifts \
  -H "Authorization: Bearer TOKEN"
```

## 📝 Détails d'un shift

```bash
curl -X GET http://localhost:3000/shifts/SHIFT_UUID \
  -H "Authorization: Bearer TOKEN"
```

## 🔍 Health Check

```bash
curl -X GET http://localhost:3000/health
```

## 📝 Notes

- Remplacez `YOUR_TOKEN`, `EMPLOYER_TOKEN`, etc. par les tokens JWT obtenus lors de la connexion
- Les UUIDs doivent être remplacés par les vrais IDs de votre base de données
- Pour les fichiers audio, utilisez des formats supportés par AssemblyAI (mp3, wav, m4a, etc.)
- Les adresses XRPL doivent être valides (format commençant par `r` pour testnet/mainnet)

