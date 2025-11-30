import express, { Response } from 'express';
import multer from 'multer';
import { AuthRequest, authenticate } from '../middleware/auth';
import { pool } from '../db/connection';
import { saveAudioFile } from '../services/storage';
import { transcribeAudio } from '../services/assemblyai';
import { analyseStartShift, analyseShift } from '../services/llm';
import { StartShiftRequest, EndShiftRequest } from '../types';

const router = express.Router();

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

/**
 * Verify geolocation data for a shift
 * Returns verification result with flags
 */
function verifyGeolocation(
  startLat?: number, startLng?: number,
  endLat?: number, endLng?: number,
  missionLat?: number, missionLng?: number,
  maxDistanceMeters: number = 5000 // 5km default
): {
  verified: boolean;
  distance_from_start?: number;
  distance_from_mission?: number;
  flags: string[];
  confidence: number;
} {
  const flags: string[] = [];
  let confidence = 1.0;

  // Check if start location is provided
  if (startLat === undefined || startLng === undefined) {
    flags.push('no_start_location');
    confidence -= 0.3;
  }

  // Check if end location matches start (within reasonable distance)
  if (startLat && startLng && endLat && endLng) {
    const startEndDistance = calculateDistance(startLat, startLng, endLat, endLng);
    if (startEndDistance > maxDistanceMeters) {
      flags.push('large_distance_between_start_end');
      confidence -= 0.2;
    }
  }

  // Check if location matches mission location
  let distanceFromMission: number | undefined;
  if (missionLat && missionLng && startLat && startLng) {
    distanceFromMission = calculateDistance(startLat, startLng, missionLat, missionLng);
    if (distanceFromMission > maxDistanceMeters) {
      flags.push('far_from_mission_location');
      confidence -= 0.3;
    }
  }

  return {
    verified: flags.length === 0,
    distance_from_start: startLat && startLng && endLat && endLng
      ? calculateDistance(startLat, startLng, endLat, endLng)
      : undefined,
    distance_from_mission: distanceFromMission,
    flags,
    confidence: Math.max(0, confidence),
  };
}
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /worker/transcribe
 * Transcrit un audio sans créer de shift (pour preview)
 */
router.post(
  '/transcribe',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      // Transcription AssemblyAI
      const transcript = await transcribeAudio(audioFile.buffer);

      res.json({
        transcript,
        stt_text: transcript, // Alias pour compatibilité
        length: transcript.length,
      });
    } catch (error) {
      console.error('Transcribe error:', error);
      res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  }
);

/**
 * POST /worker/shifts/start
 * Démarre un shift avec enregistrement audio
 */
router.post(
  '/shifts/start',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        employer_id,
        job_type,
        transcript: existingTranscript,
        latitude,
        longitude,
        location_accuracy,
        mission_id
      } = req.body as StartShiftRequest & {
        transcript?: string;
        latitude?: string;
        longitude?: string;
        location_accuracy?: string;
        mission_id?: string;
      };
      const audioFile = req.file;

      // Parse geolocation data
      const parsedLat = latitude ? parseFloat(latitude) : undefined;
      const parsedLng = longitude ? parseFloat(longitude) : undefined;
      const parsedAccuracy = location_accuracy ? parseFloat(location_accuracy) : undefined;

      if (!employer_id) {
        return res.status(400).json({ error: 'employer_id is required' });
      }

      // Vérifier que l'employeur existe
      const employerCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [
        employer_id,
        'employer',
      ]);

      if (employerCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Employer not found' });
      }

      // Si on a déjà une transcription, on l'utilise, sinon on transcrit
      let transcript: string;
      let audioUrl: string | null = null;

      if (existingTranscript && existingTranscript.trim().length > 0) {
        transcript = existingTranscript;
        if (audioFile) {
          audioUrl = await saveAudioFile(audioFile.buffer, audioFile.originalname);
        }
      } else if (audioFile) {
        audioUrl = await saveAudioFile(audioFile.buffer, audioFile.originalname);
        transcript = await transcribeAudio(audioFile.buffer);
      } else {
        return res.status(400).json({ error: 'Audio file or transcript is required' });
      }

      // Analyse LLM
      const llmAnalysis = await analyseStartShift(transcript);

      // 4. Créer la work_session avec géolocalisation
      const startTime = new Date();

      // Get mission location if mission_id is provided
      let missionLat: number | undefined;
      let missionLng: number | undefined;
      if (mission_id) {
        const missionResult = await pool.query(
          'SELECT latitude, longitude FROM missions WHERE id = $1',
          [mission_id]
        );
        if (missionResult.rows.length > 0) {
          missionLat = missionResult.rows[0].latitude ? parseFloat(missionResult.rows[0].latitude) : undefined;
          missionLng = missionResult.rows[0].longitude ? parseFloat(missionResult.rows[0].longitude) : undefined;
        }
      }

      // Verify geolocation
      const geoVerification = verifyGeolocation(
        parsedLat, parsedLng,
        undefined, undefined, // No end location yet
        missionLat, missionLng
      );

      const result = await pool.query(
        `INSERT INTO work_sessions (
          worker_id, employer_id, mission_id, start_time,
          raw_audio_start_url, stt_start_text,
          llm_structured_json, status,
          start_latitude, start_longitude, start_location_accuracy,
          geo_verification
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'proposed', $8, $9, $10, $11)
        RETURNING id, start_time, status`,
        [
          req.userId,
          employer_id,
          mission_id || null,
          startTime,
          audioUrl,
          transcript,
          JSON.stringify({
            ...llmAnalysis,
            job_type: job_type || llmAnalysis.job_type,
          }),
          parsedLat || null,
          parsedLng || null,
          parsedAccuracy || null,
          JSON.stringify(geoVerification),
        ]
      );

      const workSession = result.rows[0];

      res.status(201).json({
        work_session_id: workSession.id,
        start_time: workSession.start_time,
        status: workSession.status,
        transcript,
        stt_start_text: transcript, // Alias pour compatibilité frontend
        analysis: llmAnalysis,
        geolocation: {
          latitude: parsedLat,
          longitude: parsedLng,
          accuracy: parsedAccuracy,
          verification: geoVerification,
        },
      });
    } catch (error: any) {
      console.error('Start shift error:', error.message);
      res.status(500).json({ error: error.message || 'Failed to start shift' });
    }
  }
);

/**
 * POST /worker/shifts/end
 * Termine un shift avec enregistrement audio
 */
router.post(
  '/shifts/end',
  authenticate,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        work_session_id,
        latitude,
        longitude,
        location_accuracy
      } = req.body as EndShiftRequest & {
        latitude?: string;
        longitude?: string;
        location_accuracy?: string;
      };
      const audioFile = req.file;

      // Parse geolocation data
      const parsedEndLat = latitude ? parseFloat(latitude) : undefined;
      const parsedEndLng = longitude ? parseFloat(longitude) : undefined;
      const parsedEndAccuracy = location_accuracy ? parseFloat(location_accuracy) : undefined;

      if (!work_session_id) {
        return res.status(400).json({ error: 'work_session_id is required' });
      }

      if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      // Récupérer la session
      const sessionResult = await pool.query(
        'SELECT * FROM work_sessions WHERE id = $1 AND worker_id = $2',
        [work_session_id, req.userId]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Work session not found' });
      }

      const session = sessionResult.rows[0];

      if (session.end_time) {
        return res.status(400).json({ error: 'Shift already ended' });
      }

      // Sauvegarder l'audio et transcription
      const audioUrl = await saveAudioFile(audioFile.buffer, audioFile.originalname);
      const transcriptEnd = await transcribeAudio(audioFile.buffer);

      // Analyse LLM complète
      const endTime = new Date();
      const hours = (endTime.getTime() - new Date(session.start_time).getTime()) / (1000 * 60 * 60);

      const llmAnalysis = await analyseShift({
        startTime: session.start_time,
        endTime: endTime.toISOString(),
        startTranscript: session.stt_start_text || '',
        endTranscript: transcriptEnd,
        policy: {
          max_hours_per_day: 12,
          min_hourly_rate: 10,
        },
      });

      // Récupérer le taux horaire (par défaut ou depuis l'employeur)
      const employerResult = await pool.query('SELECT * FROM users WHERE id = $1', [
        session.employer_id,
      ]);
      const { DEFAULT_HOURLY_RATE } = await import('../config/constants');
      const hourlyRate = DEFAULT_HOURLY_RATE; // Par défaut, peut être configuré par employeur
      const amountTotal = hours * hourlyRate;

      // 4. Get mission location for geo verification
      let missionLat: number | undefined;
      let missionLng: number | undefined;
      if (session.mission_id) {
        const missionResult = await pool.query(
          'SELECT latitude, longitude FROM missions WHERE id = $1',
          [session.mission_id]
        );
        if (missionResult.rows.length > 0) {
          missionLat = missionResult.rows[0].latitude ? parseFloat(missionResult.rows[0].latitude) : undefined;
          missionLng = missionResult.rows[0].longitude ? parseFloat(missionResult.rows[0].longitude) : undefined;
        }
      }

      // Get start location from session
      const startLat = session.start_latitude ? parseFloat(session.start_latitude) : undefined;
      const startLng = session.start_longitude ? parseFloat(session.start_longitude) : undefined;

      // Verify geolocation with end location
      const geoVerification = verifyGeolocation(
        startLat, startLng,
        parsedEndLat, parsedEndLng,
        missionLat, missionLng
      );

      // 5. Mettre à jour la work_session avec géolocalisation
      const updateResult = await pool.query(
        `UPDATE work_sessions
         SET end_time = $1,
             raw_audio_end_url = $2,
             stt_end_text = $3,
             llm_structured_json = $4,
             hours = $5,
             hourly_rate = $6,
             amount_total = $7,
             status = 'proposed',
             end_latitude = $9,
             end_longitude = $10,
             end_location_accuracy = $11,
             geo_verification = $12,
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          endTime,
          audioUrl,
          transcriptEnd,
          JSON.stringify(llmAnalysis),
          hours,
          hourlyRate,
          amountTotal,
          work_session_id,
          parsedEndLat || null,
          parsedEndLng || null,
          parsedEndAccuracy || null,
          JSON.stringify(geoVerification),
        ]
      );

      const updatedSession = updateResult.rows[0];

      res.json({
        work_session_id: updatedSession.id,
        start_time: updatedSession.start_time,
        end_time: updatedSession.end_time,
        hours: parseFloat(updatedSession.hours),
        hourly_rate: parseFloat(updatedSession.hourly_rate),
        amount_total: parseFloat(updatedSession.amount_total),
        status: updatedSession.status,
        stt_end_text: transcriptEnd, // Ajouter la transcription
        transcript: transcriptEnd, // Alias pour compatibilité
        analysis: llmAnalysis,
        geolocation: {
          start: { latitude: startLat, longitude: startLng },
          end: { latitude: parsedEndLat, longitude: parsedEndLng, accuracy: parsedEndAccuracy },
          verification: geoVerification,
        },
      });
    } catch (error) {
      console.error('End shift error:', error);
      res.status(500).json({ error: 'Failed to end shift' });
    }
  }
);

/**
 * GET /worker/shifts
 * Liste tous les shifts du worker
 */
router.get('/shifts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT ws.*, e.name as employer_name
       FROM work_sessions ws
       JOIN users e ON ws.employer_id = e.id
       WHERE ws.worker_id = $1
       ORDER BY ws.created_at DESC`,
      [req.userId]
    );

    res.json({
      shifts: result.rows.map((row) => ({
        id: row.id,
        employer_id: row.employer_id,
        employer_name: row.employer_name,
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
    console.error('Get shifts error:', error);
    res.status(500).json({ error: 'Failed to get shifts' });
  }
});

/**
 * GET /worker/profile
 * Récupère le profil du worker avec génération automatique de wallet si nécessaire
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      'SELECT id, name, email, role, xrpl_address FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let user = result.rows[0];

    // Générer automatiquement un wallet XRPL si l'utilisateur n'en a pas
    if (!user.xrpl_address || !user.xrpl_address.startsWith('r') || user.xrpl_address.length < 25) {
      console.log(`🔧 Génération automatique d'un wallet XRPL pour ${user.name} (${user.id})`);
      const { Wallet } = await import('xrpl');
      const wallet = Wallet.generate();
      
      await pool.query(
        'UPDATE users SET xrpl_address = $1 WHERE id = $2',
        [wallet.address, user.id]
      );
      
      user.xrpl_address = wallet.address;
      console.log(`✅ Wallet généré: ${wallet.address}`);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      xrpl_address: user.xrpl_address,
    });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * GET /worker/employers
 * Liste tous les employers disponibles
 */
router.get(
  '/employers',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await pool.query(
        `SELECT id, name, email, xrpl_address
         FROM users
         WHERE role = 'employer'
         ORDER BY name ASC`
      );

      res.json({
        employers: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          xrpl_address: row.xrpl_address,
        })),
      });
    } catch (error) {
      console.error('Get employers error:', error);
      res.status(500).json({ error: 'Failed to get employers' });
    }
  }
);

export default router;
