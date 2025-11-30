import express, { Response } from 'express';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { pool } from '../db/connection';
import { Wallet } from 'xrpl';

const router = express.Router();

/**
 * GET /workers
 * Get all workers (for employers/admins)
 */
router.get(
  '/',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await pool.query(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.xrpl_address,
          u.created_at,
          (SELECT COUNT(*) FROM work_sessions ws WHERE ws.worker_id = u.id)::int as total_shifts,
          (SELECT COUNT(*) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::int as completed_shifts,
          (SELECT COALESCE(SUM(ws.hours), 0) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::float as total_hours,
          (SELECT ws.created_at FROM work_sessions ws WHERE ws.worker_id = u.id ORDER BY ws.created_at DESC LIMIT 1) as last_shift
         FROM users u
         WHERE u.role = 'worker'
         ORDER BY u.name ASC`
      );

      // Générer automatiquement des wallets pour les utilisateurs qui n'en ont pas
      const workersWithWallets = await Promise.all(
        result.rows.map(async (row) => {
          if (!row.xrpl_address || !row.xrpl_address.startsWith('r') || row.xrpl_address.length < 25) {
            console.log(`🔧 Génération automatique d'un wallet XRPL pour ${row.name} (${row.id})`);
            const wallet = Wallet.generate();
            
            await pool.query(
              'UPDATE users SET xrpl_address = $1 WHERE id = $2',
              [wallet.address, row.id]
            );
            
            row.xrpl_address = wallet.address;
            console.log(`✅ Wallet généré: ${wallet.address}`);
          }
          
          return {
            id: row.id,
            name: row.name,
            email: row.email,
            xrpl_address: row.xrpl_address,
            avatar: row.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
            total_shifts: row.total_shifts,
            completed_shifts: row.completed_shifts,
            total_hours: parseFloat(row.total_hours) || 0,
            last_shift: row.last_shift,
            rating: 4.5 + Math.random() * 0.5, // Placeholder rating
            created_at: row.created_at,
          };
        })
      );

      res.json({
        workers: workersWithWallets,
      });
    } catch (error) {
      console.error('Get workers error:', error);
      res.status(500).json({ error: 'Failed to get workers' });
    }
  }
);

/**
 * GET /workers/:id
 * Get a specific worker's details
 */
router.get(
  '/:id',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      const result = await pool.query(
        `SELECT
          u.id,
          u.name,
          u.email,
          u.xrpl_address,
          u.created_at,
          (SELECT COUNT(*) FROM work_sessions ws WHERE ws.worker_id = u.id)::int as total_shifts,
          (SELECT COUNT(*) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::int as completed_shifts,
          (SELECT COALESCE(SUM(ws.hours), 0) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::float as total_hours,
          (SELECT COALESCE(SUM(ws.amount_total), 0) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::float as total_earned
         FROM users u
         WHERE u.id = $1 AND u.role = 'worker'`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      let worker = result.rows[0];

      // Générer automatiquement un wallet XRPL si l'utilisateur n'en a pas
      if (!worker.xrpl_address || !worker.xrpl_address.startsWith('r') || worker.xrpl_address.length < 25) {
        console.log(`🔧 Génération automatique d'un wallet XRPL pour ${worker.name} (${worker.id})`);
        const wallet = Wallet.generate();
        
        await pool.query(
          'UPDATE users SET xrpl_address = $1 WHERE id = $2',
          [wallet.address, worker.id]
        );
        
        worker.xrpl_address = wallet.address;
        console.log(`✅ Wallet généré: ${wallet.address}`);
      }

      res.json({
        id: worker.id,
        name: worker.name,
        email: worker.email,
        xrpl_address: worker.xrpl_address,
        avatar: worker.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
        total_shifts: worker.total_shifts,
        completed_shifts: worker.completed_shifts,
        total_hours: parseFloat(worker.total_hours) || 0,
        total_earned: parseFloat(worker.total_earned) || 0,
        rating: 4.5 + Math.random() * 0.5, // Placeholder rating
        created_at: worker.created_at,
      });
    } catch (error) {
      console.error('Get worker error:', error);
      res.status(500).json({ error: 'Failed to get worker' });
    }
  }
);

/**
 * GET /workers/:id/shifts
 * Get a worker's shifts
 */
router.get(
  '/:id/shifts',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Verify worker exists
      const workerResult = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND role = $2',
        [id, 'worker']
      );

      if (workerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      // Get shifts - for employers, only show shifts where they are the employer
      let query = `
        SELECT ws.*, e.name as employer_name, m.title as mission_title
        FROM work_sessions ws
        JOIN users e ON ws.employer_id = e.id
        LEFT JOIN missions m ON ws.mission_id = m.id
        WHERE ws.worker_id = $1
      `;
      const params: any[] = [id];

      // If employer (not admin), only show their shifts
      if (req.userRole === 'employer') {
        query += ' AND ws.employer_id = $2';
        params.push(req.userId);
      }

      query += ' ORDER BY ws.created_at DESC';

      const result = await pool.query(query, params);

      res.json({
        shifts: result.rows.map((row) => ({
          id: row.id,
          employer_id: row.employer_id,
          employer_name: row.employer_name,
          mission_id: row.mission_id,
          mission_title: row.mission_title,
          start_time: row.start_time,
          end_time: row.end_time,
          hours: row.hours ? parseFloat(row.hours) : null,
          hourly_rate: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
          amount_total: row.amount_total ? parseFloat(row.amount_total) : null,
          status: row.status,
          stt_start_text: row.stt_start_text,
          stt_end_text: row.stt_end_text,
          llm_structured_json: row.llm_structured_json,
          xrpl_nft_id: row.xrpl_nft_id,
          xrpl_escrow_tx: row.xrpl_escrow_tx,
          xrpl_payment_tx: row.xrpl_payment_tx,
          created_at: row.created_at,
        })),
      });
    } catch (error) {
      console.error('Get worker shifts error:', error);
      res.status(500).json({ error: 'Failed to get worker shifts' });
    }
  }
);

export default router;
