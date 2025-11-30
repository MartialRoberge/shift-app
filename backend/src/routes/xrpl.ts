import express, { Response } from 'express';
import { Client } from 'xrpl';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { pool } from '../db/connection';
import { XRPL_TESTNET_URL } from '../config/constants';
import { getEscrowInfo } from '../services/xrpl';

const router = express.Router();

interface XRPLTransaction {
  hash: string;
  type: 'escrow_create' | 'escrow_finish' | 'nft_mint' | 'payment';
  amount: number;
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  workerName?: string;
  shiftId?: string;
}

/**
 * GET /xrpl/dashboard
 * Dashboard XRPL avec stats et transactions pour un employeur/agence
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get employer's XRPL address
      const userResult = await pool.query(
        'SELECT xrpl_address FROM users WHERE id = $1',
        [req.userId]
      );
      const walletAddress = userResult.rows[0]?.xrpl_address;

      // Get escrow balance (validated shifts not yet paid)
      const escrowResult = await pool.query(
        `SELECT COALESCE(SUM(amount_total), 0) as total_escrow
         FROM work_sessions
         WHERE employer_id = $1 AND status = 'validated'`,
        [req.userId]
      );
      const escrowBalance = parseFloat(escrowResult.rows[0]?.total_escrow || '0');

      // Get total paid
      const paidResult = await pool.query(
        `SELECT COALESCE(SUM(amount_total), 0) as total_paid
         FROM work_sessions
         WHERE employer_id = $1 AND status = 'paid'`,
        [req.userId]
      );
      const totalPaid = parseFloat(paidResult.rows[0]?.total_paid || '0');

      // Get pending transactions count
      const pendingResult = await pool.query(
        `SELECT COUNT(*) as count
         FROM work_sessions
         WHERE employer_id = $1 AND status IN ('proposed', 'validated')`,
        [req.userId]
      );
      const pendingTransactions = parseInt(pendingResult.rows[0]?.count || '0');

      // Get recent transactions from work_sessions with XRPL data
      const transactionsResult = await pool.query(
        `SELECT
           ws.id,
           ws.worker_id,
           ws.amount_total,
           ws.status,
           ws.xrpl_escrow_tx,
           ws.xrpl_nft_id,
           ws.xrpl_payment_tx,
           ws.created_at,
           ws.updated_at,
           u.name as worker_name
         FROM work_sessions ws
         JOIN users u ON ws.worker_id = u.id
         WHERE ws.employer_id = $1
           AND (ws.xrpl_escrow_tx IS NOT NULL OR ws.xrpl_payment_tx IS NOT NULL OR ws.xrpl_nft_id IS NOT NULL)
         ORDER BY ws.updated_at DESC
         LIMIT 20`,
        [req.userId]
      );

      // Transform to transaction format
      const transactions: XRPLTransaction[] = [];

      for (const row of transactionsResult.rows) {
        // Add escrow creation transaction
        if (row.xrpl_escrow_tx) {
          transactions.push({
            hash: row.xrpl_escrow_tx,
            type: 'escrow_create',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.created_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }

        // Add NFT mint transaction
        if (row.xrpl_nft_id) {
          transactions.push({
            hash: row.xrpl_nft_id,
            type: 'nft_mint',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.created_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }

        // Add payment transaction (escrow finish)
        if (row.xrpl_payment_tx && row.status === 'paid') {
          transactions.push({
            hash: row.xrpl_payment_tx,
            type: 'escrow_finish',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.updated_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }
      }

      // Sort by timestamp descending
      transactions.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      res.json({
        escrowBalance,
        totalPaid,
        pendingTransactions,
        recentTransactions: transactions.slice(0, 10),
        walletAddress,
      });
    } catch (error) {
      console.error('XRPL dashboard error:', error);
      res.status(500).json({ error: 'Failed to get XRPL dashboard data' });
    }
  }
);

/**
 * GET /xrpl/transactions
 * Liste toutes les transactions XRPL d'un employeur
 */
router.get(
  '/transactions',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit = '50', offset = '0', type } = req.query;

      let query = `
        SELECT
          ws.id,
          ws.worker_id,
          ws.amount_total,
          ws.status,
          ws.xrpl_escrow_tx,
          ws.xrpl_nft_id,
          ws.xrpl_payment_tx,
          ws.created_at,
          ws.updated_at,
          u.name as worker_name,
          m.title as mission_title
        FROM work_sessions ws
        JOIN users u ON ws.worker_id = u.id
        LEFT JOIN missions m ON ws.mission_id = m.id
        WHERE ws.employer_id = $1
          AND (ws.xrpl_escrow_tx IS NOT NULL OR ws.xrpl_payment_tx IS NOT NULL OR ws.xrpl_nft_id IS NOT NULL)
        ORDER BY ws.updated_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [req.userId, parseInt(limit as string), parseInt(offset as string)]);

      // Transform to transaction format
      const transactions: XRPLTransaction[] = [];

      for (const row of result.rows) {
        if (row.xrpl_escrow_tx) {
          transactions.push({
            hash: row.xrpl_escrow_tx,
            type: 'escrow_create',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.created_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }

        if (row.xrpl_nft_id) {
          transactions.push({
            hash: row.xrpl_nft_id,
            type: 'nft_mint',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.created_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }

        if (row.xrpl_payment_tx && row.status === 'paid') {
          transactions.push({
            hash: row.xrpl_payment_tx,
            type: 'escrow_finish',
            amount: parseFloat(row.amount_total || '0'),
            timestamp: row.updated_at,
            status: 'success',
            workerName: row.worker_name,
            shiftId: row.id,
          });
        }
      }

      // Filter by type if specified
      const filteredTransactions = type
        ? transactions.filter(t => t.type === type)
        : transactions;

      res.json({
        transactions: filteredTransactions,
        total: filteredTransactions.length,
      });
    } catch (error) {
      console.error('XRPL transactions error:', error);
      res.status(500).json({ error: 'Failed to get XRPL transactions' });
    }
  }
);

/**
 * GET /xrpl/escrows
 * Récupère les escrows actifs depuis XRPL
 */
router.get(
  '/escrows',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get employer's XRPL address
      const userResult = await pool.query(
        'SELECT xrpl_address FROM users WHERE id = $1',
        [req.userId]
      );
      const walletAddress = userResult.rows[0]?.xrpl_address;

      if (!walletAddress) {
        return res.json({ escrows: [], message: 'No XRPL wallet configured' });
      }

      // Get platform wallet address
      const platformAddress = process.env.XRPL_PLATFORM_ADDRESS;
      if (!platformAddress) {
        return res.json({ escrows: [], message: 'Platform wallet not configured' });
      }

      try {
        const escrows = await getEscrowInfo(platformAddress);

        // Map escrows to shifts from database
        const shiftsResult = await pool.query(
          `SELECT ws.*, u.name as worker_name
           FROM work_sessions ws
           JOIN users u ON ws.worker_id = u.id
           WHERE ws.employer_id = $1 AND ws.status = 'validated'`,
          [req.userId]
        );

        const enrichedEscrows = escrows.map((escrow: any) => {
          // Try to match escrow to shift by destination address
          const matchingShift = shiftsResult.rows.find(
            (shift: any) => shift.xrpl_escrow_tx === escrow.PreviousTxnID
          );

          return {
            ...escrow,
            workerName: matchingShift?.worker_name,
            shiftId: matchingShift?.id,
            amountXRP: parseInt(escrow.Amount) / 1000000,
          };
        });

        res.json({ escrows: enrichedEscrows });
      } catch (error: any) {
        console.warn('Could not fetch escrows from XRPL:', error.message);
        res.json({ escrows: [], message: 'Could not fetch escrows from XRPL' });
      }
    } catch (error) {
      console.error('XRPL escrows error:', error);
      res.status(500).json({ error: 'Failed to get XRPL escrows' });
    }
  }
);

/**
 * GET /xrpl/verify/:hash
 * Vérifie une transaction sur XRPL testnet
 */
router.get('/verify/:hash', async (req: express.Request, res: Response) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length < 10) {
      return res.status(400).json({ error: 'Invalid transaction hash' });
    }

    const client = new Client(XRPL_TESTNET_URL);
    await client.connect();

    try {
      const txResult = await client.request({
        command: 'tx',
        transaction: hash,
      });

      await client.disconnect();

      const tx = txResult.result as any;
      const meta = typeof tx.meta === 'object' ? tx.meta : {};

      res.json({
        verified: true,
        hash: tx.hash,
        type: tx.TransactionType,
        account: tx.Account,
        destination: tx.Destination,
        amount: tx.Amount ? parseInt(tx.Amount) / 1000000 : null,
        result: (meta as any).TransactionResult,
        ledgerIndex: tx.ledger_index,
        date: tx.date,
        explorerUrl: `https://testnet.xrpl.org/transactions/${hash}`,
      });
    } catch (error: any) {
      await client.disconnect();

      if (error.message.includes('txnNotFound')) {
        return res.json({ verified: false, error: 'Transaction not found' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('XRPL verify error:', error);
    res.status(500).json({ error: 'Failed to verify transaction: ' + error.message });
  }
});

export default router;
