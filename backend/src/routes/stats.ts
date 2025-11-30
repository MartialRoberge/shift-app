import express, { Response } from 'express';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { pool } from '../db/connection';

const router = express.Router();

/**
 * GET /stats/global
 * Statistiques globales
 */
router.get('/global', authenticate, requireRole('admin', 'employer'), async (req: AuthRequest, res: Response) => {
  try {
    // Total des heures
    const hoursResult = await pool.query(
      `SELECT COALESCE(SUM(hours), 0) as total_hours
       FROM work_sessions
       WHERE status IN ('validated', 'paid')`
    );
    const totalHours = parseFloat(hoursResult.rows[0].total_hours || '0');

    // Montant total en escrow
    const escrowResult = await pool.query(
      `SELECT COALESCE(SUM(amount_total), 0) as total_escrow
       FROM work_sessions
       WHERE status = 'validated'`
    );
    const totalEscrow = parseFloat(escrowResult.rows[0].total_escrow || '0');

    // Montant total payé
    const paidResult = await pool.query(
      `SELECT COALESCE(SUM(amount_total), 0) as total_paid
       FROM work_sessions
       WHERE status = 'paid'`
    );
    const totalPaid = parseFloat(paidResult.rows[0].total_paid || '0');

    // Nombre de shifts par statut
    const statusResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM work_sessions
       GROUP BY status`
    );
    const shiftsByStatus = statusResult.rows.reduce((acc: any, row: any) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Nombre total de shifts
    const totalShiftsResult = await pool.query('SELECT COUNT(*) as count FROM work_sessions');
    const totalShifts = parseInt(totalShiftsResult.rows[0].count);

    res.json({
      total_hours: totalHours,
      total_escrow: totalEscrow,
      total_paid: totalPaid,
      total_shifts: totalShifts,
      shifts_by_status: shiftsByStatus,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

/**
 * GET /stats/workers/:id/shifts
 * Statistiques pour un worker
 */
router.get('/workers/:id/shifts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Vérifier que l'utilisateur peut accéder à ces stats
    if (req.userId !== id && req.userRole !== 'admin' && req.userRole !== 'employer') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_shifts,
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_total ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN status = 'validated' THEN amount_total ELSE 0 END), 0) as pending_payment
       FROM work_sessions
       WHERE worker_id = $1`,
      [id]
    );

    const stats = result.rows[0];

    res.json({
      worker_id: id,
      total_shifts: parseInt(stats.total_shifts),
      total_hours: parseFloat(stats.total_hours),
      total_earned: parseFloat(stats.total_earned),
      pending_payment: parseFloat(stats.pending_payment),
    });
  } catch (error) {
    console.error('Get worker stats error:', error);
    res.status(500).json({ error: 'Failed to get worker stats' });
  }
});

/**
 * GET /stats/employers/:id/shifts
 * Statistiques pour un employeur
 */
router.get('/employers/:id/shifts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Vérifier que l'utilisateur peut accéder à ces stats
    if (req.userId !== id && req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_shifts,
        COALESCE(SUM(hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_total ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN status = 'validated' THEN amount_total ELSE 0 END), 0) as total_escrow
       FROM work_sessions
       WHERE employer_id = $1`,
      [id]
    );

    const stats = result.rows[0];

    res.json({
      employer_id: id,
      total_shifts: parseInt(stats.total_shifts),
      total_hours: parseFloat(stats.total_hours),
      total_paid: parseFloat(stats.total_paid),
      total_escrow: parseFloat(stats.total_escrow),
    });
  } catch (error) {
    console.error('Get employer stats error:', error);
    res.status(500).json({ error: 'Failed to get employer stats' });
  }
});

export default router;

