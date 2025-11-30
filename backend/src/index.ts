import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initXRPL, closeXRPL } from './services/xrpl';

// Routes
import authRoutes from './routes/auth';
import workerRoutes from './routes/worker';
import employerRoutes from './routes/employer';
import shiftsRoutes from './routes/shifts';
import statsRoutes from './routes/stats';
import walletRoutes from './routes/wallet';
import missionsRoutes from './routes/missions';
import workersRoutes from './routes/workers';
import xrplRoutes from './routes/xrpl';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true, // Autorise toutes les origines en développement
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers uploadés (pour la démo)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/worker', workerRoutes);
app.use('/employer', employerRoutes);
app.use('/shifts', shiftsRoutes);
app.use('/stats', statsRoutes);
app.use('/wallet', walletRoutes);
app.use('/missions', missionsRoutes);
app.use('/workers', workersRoutes);
app.use('/xrpl', xrplRoutes);

// Gestion des erreurs
import { errorHandler } from './utils/errors';
app.use(errorHandler);

// Démarrage du serveur
async function start() {
  try {
    // Initialiser XRPL (optionnel, peut être lazy-loaded)
    if (process.env.XRPL_NETWORK) {
      try {
        await initXRPL();
      } catch (error) {
        console.warn('⚠️  XRPL connection failed, continuing without it:', error);
      }
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await closeXRPL();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await closeXRPL();
  process.exit(0);
});

start();

