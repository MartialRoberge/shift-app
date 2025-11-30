import express, { Response } from 'express';
import { AuthRequest, authenticate, requireRole } from '../middleware/auth';
import { pool } from '../db/connection';

const router = express.Router();

// ==================== EMPLOYER ROUTES ====================

/**
 * POST /missions
 * Create a new mission (employers only)
 */
router.post(
  '/',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        title,
        description,
        location,
        address,
        latitude,
        longitude,
        hourly_rate,
        total_hours_needed,
        requirements,
      } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const result = await pool.query(
        `INSERT INTO missions (employer_id, title, description, location, address, latitude, longitude, hourly_rate, total_hours_needed, requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
         RETURNING *`,
        [
          req.userId,
          title,
          description || null,
          location || null,
          address || null,
          latitude || null,
          longitude || null,
          hourly_rate || 15.0,
          total_hours_needed || 100,
          requirements || null,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create mission error:', error);
      res.status(500).json({ error: 'Failed to create mission' });
    }
  }
);

/**
 * GET /missions/employer
 * Get employer's missions
 */
router.get(
  '/employer',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get missions with candidate and worker counts
      const result = await pool.query(
        `SELECT
          m.*,
          COALESCE(
            (SELECT COUNT(*) FROM mission_applications ma WHERE ma.mission_id = m.id AND ma.status = 'pending'),
            0
          )::int as pending_candidates,
          COALESCE(
            (SELECT COUNT(*) FROM mission_workers mw WHERE mw.mission_id = m.id),
            0
          )::int as active_workers
         FROM missions m
         WHERE m.employer_id = $1
         ORDER BY m.created_at DESC`,
        [req.userId]
      );

      res.json({ missions: result.rows });
    } catch (error) {
      console.error('Get employer missions error:', error);
      res.status(500).json({ error: 'Failed to get missions' });
    }
  }
);

/**
 * GET /missions/available
 * Get available missions for workers
 */
router.get('/available', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT
        m.*,
        e.name as employer_name,
        NOT EXISTS (
          SELECT 1 FROM mission_applications ma
          WHERE ma.mission_id = m.id AND ma.worker_id = $1
        ) as can_apply,
        EXISTS (
          SELECT 1 FROM mission_workers mw
          WHERE mw.mission_id = m.id AND mw.worker_id = $1
        ) as is_member
       FROM missions m
       JOIN users e ON m.employer_id = e.id
       WHERE m.status = 'active'
       ORDER BY m.created_at DESC`
      ,
      [req.userId]
    );

    res.json({ missions: result.rows });
  } catch (error) {
    console.error('Get available missions error:', error);
    res.status(500).json({ error: 'Failed to get missions' });
  }
});

/**
 * GET /missions/mine
 * Get missions the worker has joined
 */
router.get('/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT
        m.*,
        e.name as employer_name,
        mw.hours_worked,
        mw.joined_at
       FROM missions m
       JOIN users e ON m.employer_id = e.id
       JOIN mission_workers mw ON mw.mission_id = m.id
       WHERE mw.worker_id = $1
       ORDER BY mw.joined_at DESC`,
      [req.userId]
    );

    res.json({ missions: result.rows });
  } catch (error) {
    console.error('Get my missions error:', error);
    res.status(500).json({ error: 'Failed to get missions' });
  }
});

/**
 * GET /missions/:id
 * Get mission details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        m.*,
        e.name as employer_name,
        e.xrpl_address as employer_xrpl_address
       FROM missions m
       JOIN users e ON m.employer_id = e.id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const mission = result.rows[0];

    // Get active workers
    const workersResult = await pool.query(
      `SELECT u.id, u.name, u.email, mw.hours_worked, mw.joined_at
       FROM mission_workers mw
       JOIN users u ON mw.worker_id = u.id
       WHERE mw.mission_id = $1
       ORDER BY mw.joined_at DESC`,
      [id]
    );

    // Get pending candidates (only for employer)
    let candidates: any[] = [];
    if (req.userId === mission.employer_id || req.userRole === 'admin') {
      const candidatesResult = await pool.query(
        `SELECT ma.*, u.id as worker_id, u.name as worker_name, u.email as worker_email
         FROM mission_applications ma
         JOIN users u ON ma.worker_id = u.id
         WHERE ma.mission_id = $1 AND ma.status = 'pending'
         ORDER BY ma.applied_at DESC`,
        [id]
      );
      candidates = candidatesResult.rows;
    }

    // Get recent shifts for this mission
    const shiftsResult = await pool.query(
      `SELECT ws.*, w.name as worker_name
       FROM work_sessions ws
       JOIN users w ON ws.worker_id = w.id
       WHERE ws.mission_id = $1
       ORDER BY ws.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      ...mission,
      active_workers: workersResult.rows,
      candidates,
      recent_shifts: shiftsResult.rows,
    });
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ error: 'Failed to get mission' });
  }
});

/**
 * PATCH /missions/:id
 * Update a mission
 */
router.patch(
  '/:id',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const updates = req.body;

      // Verify ownership
      const checkResult = await pool.query(
        'SELECT employer_id FROM missions WHERE id = $1',
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      if (checkResult.rows[0].employer_id !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to update this mission' });
      }

      // Build update query dynamically
      const allowedFields = ['title', 'description', 'location', 'address', 'latitude', 'longitude', 'hourly_rate', 'total_hours_needed', 'requirements', 'status'];
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push(updates[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await pool.query(
        `UPDATE missions SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update mission error:', error);
      res.status(500).json({ error: 'Failed to update mission' });
    }
  }
);

/**
 * DELETE /missions/:id
 * Delete a mission
 */
router.delete(
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
        'DELETE FROM missions WHERE id = $1 AND employer_id = $2 RETURNING id',
        [id, req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Mission not found or not authorized' });
      }

      res.json({ message: 'Mission deleted', id });
    } catch (error) {
      console.error('Delete mission error:', error);
      res.status(500).json({ error: 'Failed to delete mission' });
    }
  }
);

// ==================== APPLICATION ROUTES ====================

/**
 * POST /missions/:id/apply
 * Worker applies to a mission
 */
router.post('/:id/apply', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { message } = req.body;

    // Check if mission exists and is active
    const missionResult = await pool.query(
      'SELECT id, status FROM missions WHERE id = $1',
      [id]
    );

    if (missionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    if (missionResult.rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Mission is not accepting applications' });
    }

    // Check if already applied
    const existingResult = await pool.query(
      'SELECT id FROM mission_applications WHERE mission_id = $1 AND worker_id = $2',
      [id, req.userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Already applied to this mission' });
    }

    // Check if already a member
    const memberResult = await pool.query(
      'SELECT id FROM mission_workers WHERE mission_id = $1 AND worker_id = $2',
      [id, req.userId]
    );

    if (memberResult.rows.length > 0) {
      return res.status(409).json({ error: 'Already a member of this mission' });
    }

    const result = await pool.query(
      `INSERT INTO mission_applications (mission_id, worker_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.userId, message || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Apply to mission error:', error);
    res.status(500).json({ error: 'Failed to apply to mission' });
  }
});

/**
 * POST /missions/:id/accept
 * Worker directly accepts/joins a mission (alternative to application flow)
 */
router.post('/:id/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if mission exists and is active
    const missionResult = await pool.query(
      'SELECT id, status FROM missions WHERE id = $1',
      [id]
    );

    if (missionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    if (missionResult.rows[0].status !== 'active') {
      return res.status(400).json({ error: 'Mission is not active' });
    }

    // Check if already a member
    const memberResult = await pool.query(
      'SELECT id FROM mission_workers WHERE mission_id = $1 AND worker_id = $2',
      [id, req.userId]
    );

    if (memberResult.rows.length > 0) {
      return res.status(409).json({ error: 'Already a member of this mission' });
    }

    // Add worker to mission
    const result = await pool.query(
      `INSERT INTO mission_workers (mission_id, worker_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, req.userId]
    );

    res.status(201).json({ message: 'Joined mission successfully', membership: result.rows[0] });
  } catch (error) {
    console.error('Accept mission error:', error);
    res.status(500).json({ error: 'Failed to accept mission' });
  }
});

/**
 * POST /missions/:id/decline
 * Worker declines/leaves a mission
 */
router.post('/:id/decline', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Remove from mission_workers if member
    await pool.query(
      'DELETE FROM mission_workers WHERE mission_id = $1 AND worker_id = $2',
      [id, req.userId]
    );

    // Remove any pending application
    await pool.query(
      'DELETE FROM mission_applications WHERE mission_id = $1 AND worker_id = $2',
      [id, req.userId]
    );

    res.json({ message: 'Left mission successfully' });
  } catch (error) {
    console.error('Decline mission error:', error);
    res.status(500).json({ error: 'Failed to decline mission' });
  }
});

/**
 * GET /missions/:id/candidates
 * Get candidates for a mission (employer only)
 */
router.get(
  '/:id/candidates',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;

      // Verify ownership
      const missionResult = await pool.query(
        'SELECT employer_id FROM missions WHERE id = $1',
        [id]
      );

      if (missionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      if (missionResult.rows[0].employer_id !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const result = await pool.query(
        `SELECT
          ma.*,
          u.id as worker_id,
          u.name as worker_name,
          u.email as worker_email,
          (SELECT COUNT(*) FROM work_sessions ws WHERE ws.worker_id = u.id AND ws.status = 'paid')::int as completed_shifts,
          (SELECT AVG(
            CASE WHEN ws.llm_structured_json->>'confidence' IS NOT NULL
            THEN (ws.llm_structured_json->>'confidence')::float
            ELSE 0.8 END
          ) FROM work_sessions ws WHERE ws.worker_id = u.id)::float as avg_rating
         FROM mission_applications ma
         JOIN users u ON ma.worker_id = u.id
         WHERE ma.mission_id = $1
         ORDER BY ma.applied_at DESC`,
        [id]
      );

      res.json({ candidates: result.rows });
    } catch (error) {
      console.error('Get candidates error:', error);
      res.status(500).json({ error: 'Failed to get candidates' });
    }
  }
);

/**
 * POST /missions/:missionId/candidates/:workerId/accept
 * Accept a candidate
 */
router.post(
  '/:missionId/candidates/:workerId/accept',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { missionId, workerId } = req.params;

      // Verify ownership
      const missionResult = await pool.query(
        'SELECT employer_id FROM missions WHERE id = $1',
        [missionId]
      );

      if (missionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      if (missionResult.rows[0].employer_id !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Update application status
      await pool.query(
        `UPDATE mission_applications
         SET status = 'accepted', responded_at = NOW()
         WHERE mission_id = $1 AND worker_id = $2`,
        [missionId, workerId]
      );

      // Add worker to mission
      await pool.query(
        `INSERT INTO mission_workers (mission_id, worker_id)
         VALUES ($1, $2)
         ON CONFLICT (mission_id, worker_id) DO NOTHING`,
        [missionId, workerId]
      );

      res.json({ message: 'Candidate accepted' });
    } catch (error) {
      console.error('Accept candidate error:', error);
      res.status(500).json({ error: 'Failed to accept candidate' });
    }
  }
);

/**
 * POST /missions/:missionId/candidates/:workerId/reject
 * Reject a candidate
 */
router.post(
  '/:missionId/candidates/:workerId/reject',
  authenticate,
  requireRole('employer', 'admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { missionId, workerId } = req.params;

      // Verify ownership
      const missionResult = await pool.query(
        'SELECT employer_id FROM missions WHERE id = $1',
        [missionId]
      );

      if (missionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Mission not found' });
      }

      if (missionResult.rows[0].employer_id !== req.userId && req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Update application status
      await pool.query(
        `UPDATE mission_applications
         SET status = 'rejected', responded_at = NOW()
         WHERE mission_id = $1 AND worker_id = $2`,
        [missionId, workerId]
      );

      res.json({ message: 'Candidate rejected' });
    } catch (error) {
      console.error('Reject candidate error:', error);
      res.status(500).json({ error: 'Failed to reject candidate' });
    }
  }
);

export default router;
