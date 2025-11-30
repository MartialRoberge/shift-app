# 🔌 Intégration Frontend - Guide complet

## ✅ Statut : Prêt pour le frontend !

Votre backend est **100% prêt** à être connecté au frontend.

---

## 🌐 Configuration CORS

Le backend est configuré avec **CORS activé** pour accepter les requêtes depuis n'importe quelle origine (développement).

```typescript
// src/index.ts
app.use(cors()); // ✅ Accepte toutes les origines
```

**Pour la production**, vous pouvez restreindre les origines :

```typescript
app.use(cors({
  origin: 'https://votre-domaine.com',
  credentials: true
}));
```

---

## 📡 Base URL

**URL du backend** : `http://localhost:3000`

Toutes les routes sont préfixées comme suit :
- `/auth/*` - Authentification
- `/worker/*` - Routes worker
- `/employer/*` - Routes employer
- `/shifts/*` - Routes shifts
- `/stats/*` - Statistiques

---

## 🔑 Authentification

### 1. Register (Créer un compte)

```typescript
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Alice Worker',
    email: 'alice@example.com',
    password: 'password123',
    role: 'worker',
    xrpl_address: 'rWorkerAddress...'
  })
});

const data = await response.json();
// { user: {...}, token: "eyJhbGci..." }
```

### 2. Login (Se connecter)

```typescript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'alice@example.com',
    password: 'password123'
  })
});

const { user, token } = await response.json();

// Stocker le token
localStorage.setItem('token', token);
```

### 3. Utiliser le token dans les requêtes

```typescript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/worker/shifts', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const shifts = await response.json();
```

---

## 📤 Upload de fichiers audio

### Start Shift (avec audio)

```typescript
const formData = new FormData();
formData.append('audio', audioFile); // File object
formData.append('employer_id', employerId);
formData.append('job_type', 'childcare'); // Optionnel

const response = await fetch('http://localhost:3000/worker/shifts/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // Ne pas mettre Content-Type pour FormData
  },
  body: formData
});

const data = await response.json();
// { work_session_id, start_time, status, transcript, analysis }
```

### End Shift (avec audio)

```typescript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('work_session_id', workSessionId);

const response = await fetch('http://localhost:3000/worker/shifts/end', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});

const data = await response.json();
// { work_session_id, hours, amount_total, status, analysis }
```

---

## 📋 Exemples complets

### Exemple React/Next.js

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const { user, token } = await response.json();
    localStorage.setItem('token', token);
    setToken(token);
    return { user, token };
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`http://localhost:3000${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  };

  return { token, login, apiCall };
};
```

### Exemple Vue.js

```typescript
// composables/useApi.ts
export const useApi = () => {
  const token = ref<string | null>(
    localStorage.getItem('token')
  );

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      'Authorization': token.value ? `Bearer ${token.value}` : '',
    },
  });

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    token.value = data.token;
    localStorage.setItem('token', data.token);
    return data;
  };

  return { api, login };
};
```

---

## 🔄 Flow complet exemple

### 1. Worker démarre un shift

```typescript
// Enregistrer l'audio
const audioBlob = await navigator.mediaDevices.getUserMedia({ audio: true });
// ... enregistrer l'audio dans un fichier

// Upload
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('employer_id', selectedEmployerId);

const response = await fetch('http://localhost:3000/worker/shifts/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const { work_session_id } = await response.json();
```

### 2. Worker termine le shift

```typescript
const formData = new FormData();
formData.append('audio', checkoutAudioFile);
formData.append('work_session_id', workSessionId);

const response = await fetch('http://localhost:3000/worker/shifts/end', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
});

const { hours, amount_total, status } = await response.json();
```

### 3. Employer valide le shift

```typescript
const response = await fetch(
  `http://localhost:3000/employer/shifts/${shiftId}/validate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${employerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hourly_rate: 15.0,
    }),
  }
);

const { xrpl_escrow_tx, xrpl_nft_id } = await response.json();
```

### 4. Release du paiement

```typescript
const response = await fetch(
  `http://localhost:3000/shifts/${shiftId}/release`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
);

const { xrpl_payment_tx, status } = await response.json();
```

---

## 📊 Endpoints disponibles

### Authentification
- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Se connecter

### Worker
- `POST /worker/shifts/start` - Démarrer shift (multipart/form-data)
- `POST /worker/shifts/end` - Terminer shift (multipart/form-data)
- `GET /worker/shifts` - Liste des shifts

### Employer
- `GET /employer/shifts` - Liste des shifts
- `POST /employer/shifts/:id/validate` - Valider (crée escrow + NFT)
- `POST /employer/shifts/:id/refuse` - Refuser

### Shifts
- `GET /shifts/:id` - Détails d'un shift
- `POST /shifts/:id/release` - Libérer paiement

### Statistiques
- `GET /stats/global` - Stats globales
- `GET /stats/workers/:id/shifts` - Stats worker
- `GET /stats/employers/:id/shifts` - Stats employer

### Health
- `GET /health` - Health check (pas besoin d'auth)

---

## ⚠️ Gestion des erreurs

```typescript
try {
  const response = await fetch('http://localhost:3000/worker/shifts', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('token');
      router.push('/login');
      return;
    }
    
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Gérer l'erreur dans l'UI
}
```

---

## 🔒 Sécurité

1. **Token JWT** : Stockez-le dans `localStorage` ou `sessionStorage`
2. **HTTPS** : En production, utilisez HTTPS
3. **CORS** : Le backend accepte toutes les origines en dev (à restreindre en prod)
4. **Validation** : Le backend valide toutes les entrées

---

## 🧪 Test de connexion

Pour tester que votre frontend peut se connecter :

```bash
# Health check (pas besoin d'auth)
curl http://localhost:3000/health

# Devrait retourner :
# { "status": "ok", "timestamp": "..." }
```

---

## ✅ Checklist avant intégration

- [ ] Backend démarré sur `http://localhost:3000`
- [ ] PostgreSQL configuré et migrations lancées
- [ ] CORS activé (déjà fait ✅)
- [ ] Token JWT stocké après login
- [ ] Headers `Authorization: Bearer <token>` sur toutes les requêtes protégées
- [ ] Gestion des erreurs 401 (token expiré)

---

## 🚀 Prêt à intégrer !

Votre backend est **100% prêt** pour le frontend. Tous les endpoints sont fonctionnels, CORS est configuré, et l'authentification JWT est en place.

**Vous pouvez commencer à brancher votre frontend maintenant !** 🎉

