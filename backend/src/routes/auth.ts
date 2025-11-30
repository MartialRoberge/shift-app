import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Wallet } from 'xrpl';
import { pool } from '../db/connection';
import { generateToken } from '../middleware/auth';
import { UserRole } from '../types';

const router = express.Router();

/**
 * Génère un nouveau wallet XRPL pour un utilisateur
 * Note: Le wallet n'est pas activé sur le réseau, il faudra lui envoyer 10 XRP minimum
 */
function generateXRPLWallet(): { address: string; seed: string } {
  const wallet = Wallet.generate();
  return {
    address: wallet.address,
    seed: wallet.seed || '',
  };
}

/**
 * POST /auth/register
 * Création d'un compte (simplifié pour hackathon)
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, xrpl_address } = req.body;

    if (!name || !role || !['worker', 'employer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Name and valid role are required' });
    }

    let password_hash: string | null = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Générer une adresse XRPL si non fournie
    let finalXrplAddress = xrpl_address;
    let xrplSeed: string | null = null;
    if (!finalXrplAddress) {
      const wallet = generateXRPLWallet();
      finalXrplAddress = wallet.address;
      xrplSeed = wallet.seed;
      console.log(`✅ Nouveau wallet XRPL généré pour ${name}: ${finalXrplAddress}`);
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, role, password_hash, xrpl_address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, xrpl_address, created_at`,
      [name, email || null, role, password_hash, finalXrplAddress || null]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        xrpl_address: user.xrpl_address,
      },
      token,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /auth/login
 * Connexion (email/password ou simple avec name pour démo)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    let query = 'SELECT * FROM users WHERE ';
    const params: any[] = [];

    if (email) {
      query += 'email = $1';
      params.push(email);
    } else if (name) {
      query += 'name = $1';
      params.push(name);
    } else {
      return res.status(400).json({ error: 'Email or name required' });
    }

    const result = await pool.query(query, params);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Vérifier le mot de passe si fourni
    if (password && user.password_hash) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        xrpl_address: user.xrpl_address,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /auth/users
 * Liste les utilisateurs par rôle (pour la démo - permet de se connecter facilement)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT id, name, email, role, xrpl_address, city, country, avatar_url, created_at
      FROM users
    `;
    const params: any[] = [];

    if (role && ['worker', 'employer', 'admin'].includes(role as string)) {
      query += ' WHERE role = $1';
      params.push(role);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, params);

    res.json({
      users: result.rows.map(user => {
        // Clean up name by removing role suffix (e.g., "Jean Dupont_worker" -> "Jean Dupont")
        let cleanName = user.name;
        if (cleanName.endsWith('_worker')) {
          cleanName = cleanName.replace(/_worker$/, '');
        } else if (cleanName.endsWith('_employer')) {
          cleanName = cleanName.replace(/_employer$/, '');
        }

        return {
          id: user.id,
          name: cleanName,
          email: user.email,
          role: user.role,
          xrpl_address: user.xrpl_address,
          city: user.city,
          country: user.country,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
        };
      }),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * POST /auth/quick-login
 * Connexion rapide par ID (pour la démo)
 */
router.post('/quick-login', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        xrpl_address: user.xrpl_address,
        city: user.city,
        country: user.country,
      },
      token,
    });
  } catch (error) {
    console.error('Quick login error:', error);
    res.status(500).json({ error: 'Quick login failed' });
  }
});

/**
 * POST /auth/fix-wallets
 * Génère automatiquement des wallets XRPL pour tous les utilisateurs qui n'en ont pas
 */
router.post('/fix-wallets', async (req: Request, res: Response) => {
  try {
    // Pour simplifier, on permet à n'importe qui de corriger les wallets (en production, ajouter auth)
    // En production, décommenter ces lignes :
    // const token = req.headers.authorization?.replace('Bearer ', '');
    // if (!token) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    // Récupérer tous les utilisateurs sans adresse XRPL valide
    const users = await pool.query(`
      SELECT id, name, email, role, xrpl_address 
      FROM users 
      WHERE xrpl_address IS NULL 
         OR xrpl_address NOT LIKE 'r%'
         OR LENGTH(xrpl_address) < 25
    `);

    const fixedUsers = [];

    for (const user of users.rows) {
      // Générer une nouvelle adresse XRPL
      const wallet = generateXRPLWallet();
      
      await pool.query(
        'UPDATE users SET xrpl_address = $1 WHERE id = $2',
        [wallet.address, user.id]
      );

      fixedUsers.push({
        id: user.id,
        name: user.name,
        role: user.role,
        xrpl_address: wallet.address,
      });
    }

    res.json({
      message: `${fixedUsers.length} wallet(s) XRPL généré(s)`,
      users: fixedUsers,
    });
  } catch (error: any) {
    console.error('Fix wallets error:', error);
    res.status(500).json({ error: 'Failed to fix wallets' });
  }
});

export default router;

