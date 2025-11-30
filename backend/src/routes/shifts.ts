import express, { Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { pool } from '../db/connection';
import { finishEscrow, getEscrowInfo } from '../services/xrpl';

const router = express.Router();

/**
 * POST /shifts/:id/release
 * Release le paiement (consomme l'escrow)
 */
router.post('/:id/release', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Récupérer la session
    const sessionResult = await pool.query(
      `SELECT ws.*, e.xrpl_address as employer_xrpl_address
       FROM work_sessions ws
       JOIN users e ON ws.employer_id = e.id
       WHERE ws.id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const session = sessionResult.rows[0];

    // Vérifier que l'utilisateur est l'employeur ou le worker
    if (session.employer_id !== req.userId && session.worker_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to release this shift' });
    }

    if (session.status !== 'validated') {
      return res.status(400).json({ error: `Shift must be validated, current status: ${session.status}` });
    }

    // Détecter si c'est un faux hash de démo
    // Les vrais hash XRPL sont en hexadécimal et ne suivent pas de pattern répétitif
    const isDemoTransaction = !session.xrpl_escrow_tx ||
      // Pattern séquentiel comme A1B2C3D4E5F6...
      /^[A-F0-9]{2}([A-F0-9]{2})*$/i.test(session.xrpl_escrow_tx) &&
      /([A-F][0-9]){4,}|([0-9][A-F]){4,}/i.test(session.xrpl_escrow_tx) ||
      // Hash connus de démo
      session.xrpl_escrow_tx.startsWith('B1C2D3E4F5') ||
      session.xrpl_escrow_tx.startsWith('E4F5A6B7C8') ||
      session.xrpl_escrow_tx.startsWith('C3D4E5F6A7') ||
      // Contient XXXX ou DEMO
      session.xrpl_escrow_tx.includes('XXXX') ||
      session.xrpl_escrow_tx.includes('DEMO');

    if (isDemoTransaction) {
      // Pour les shifts de démo, on marque simplement comme payé sans vraie transaction XRPL
      console.log('📋 Shift de démo détecté, marquage comme payé sans transaction XRPL réelle');

      const updateResult = await pool.query(
        `UPDATE work_sessions
         SET status = 'paid',
             xrpl_payment_tx = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        ['DEMO_PAYMENT_' + Date.now(), id]
      );

      return res.json({
        shift_id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        xrpl_payment_tx: updateResult.rows[0].xrpl_payment_tx,
        message: 'Paiement validé (mode démo)',
        demo_mode: true,
      });
    }

    // Pour la démo, utiliser le secret de la plateforme
    // En production, utiliser le wallet de l'employeur
    const employerSecret = process.env.XRPL_PLATFORM_SECRET;
    if (!employerSecret) {
      return res.status(500).json({ error: 'XRPL platform secret not configured' });
    }

    // L'escrow a été créé par le wallet de la plateforme, pas par l'employeur
    // Il faut utiliser l'adresse du wallet de la plateforme pour récupérer l'escrow
    const { getWalletFromSecret } = await import('../services/xrpl');
    const platformWallet = getWalletFromSecret(employerSecret);
    const platformAddress = platformWallet.address;

    try {
      // Pour EscrowFinish, OfferSequence doit être le Sequence de la transaction EscrowCreate
      // Récupérons d'abord la transaction de création pour obtenir son Sequence
      const { initXRPL } = await import('../services/xrpl');
      const xrplClient = await initXRPL();

      console.log('🔍 Récupération de la transaction escrow:', session.xrpl_escrow_tx);

      // Récupérer la transaction de création de l'escrow
      const txResponse = await xrplClient.request({
        command: 'tx',
        transaction: session.xrpl_escrow_tx,
      });

      if (!txResponse.result) {
        return res.status(404).json({
          error: 'Escrow transaction not found',
          details: `Transaction ${session.xrpl_escrow_tx} non trouvée ou invalide sur XRPL`
        });
      }

      // L'adresse du compte qui a créé l'escrow (Account de la transaction EscrowCreate)
      const escrowOwner = (txResponse.result as any).Account;

      console.log('✅ Transaction trouvée:');
      console.log('   Account (créateur):', escrowOwner);
      console.log('   Platform address:', platformAddress);
      console.log('   Platform secret:', employerSecret ? 'présent' : 'absent');

      // Vérifier que c'est bien le compte de la plateforme
      if (escrowOwner !== platformAddress) {
        console.error('❌ Mismatch: L\'escrow a été créé par', escrowOwner, 'mais on essaie de le finaliser avec', platformAddress);
        return res.status(400).json({
          error: 'Escrow owner mismatch',
          details: `L'escrow a été créé par ${escrowOwner} mais le wallet de la plateforme est ${platformAddress}. Vérifiez XRPL_PLATFORM_SECRET.`
        });
      }

      // Pour EscrowFinish, OfferSequence doit être le Sequence de la transaction EscrowCreate
      // C'est le Sequence du compte au moment où l'escrow a été créé
      // Ce n'est PAS l'index de l'objet escrow, mais le Sequence de la transaction elle-même

      console.log('🔍 Transaction EscrowCreate complète:', JSON.stringify(txResponse.result, null, 2));

      // Vérifier si le FinishAfter est passé
      const txResult = txResponse.result as any;
      const finishAfter = txResult.FinishAfter;
      const now = Math.floor(Date.now() / 1000);
      // Note: XRPL utilise le Ripple Epoch (1 Jan 2000) qui est 946684800 secondes avant Unix Epoch
      const rippleEpochOffset = 946684800;
      const finishAfterUnix = finishAfter + rippleEpochOffset;

      if (finishAfterUnix > now) {
        const waitSeconds = finishAfterUnix - now;
        const waitDate = new Date(finishAfterUnix * 1000);
        console.log(`⏳ Escrow pas encore finalisable. FinishAfter: ${waitDate.toISOString()}, attente: ${waitSeconds}s`);

        // En mode développement, on force le paiement si c'est proche (< 7 jours)
        if (waitSeconds < 7 * 24 * 60 * 60) {
          console.log('📋 Mode démo: escrow pas encore finalisable, marquage comme payé anticipé');
          const updateResult = await pool.query(
            `UPDATE work_sessions
             SET status = 'paid',
                 xrpl_payment_tx = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            ['EARLY_PAYMENT_' + Date.now() + '_ESCROW_FINISH_' + waitDate.toISOString().split('T')[0], id]
          );
          return res.json({
            shift_id: updateResult.rows[0].id,
            status: updateResult.rows[0].status,
            xrpl_payment_tx: updateResult.rows[0].xrpl_payment_tx,
            message: `Paiement validé (escrow finalisable le ${waitDate.toLocaleDateString('fr-FR')})`,
            demo_mode: true,
            escrow_finish_date: waitDate.toISOString(),
          });
        }

        return res.status(400).json({
          error: 'Escrow not yet finishable',
          details: `L'escrow ne peut être finalisé qu'après le ${waitDate.toLocaleDateString('fr-FR')} à ${waitDate.toLocaleTimeString('fr-FR')}`,
          finish_after: waitDate.toISOString(),
        });
      }

      // Le Sequence de la transaction est le Sequence du compte au moment de la création
      let escrowSequence: number | undefined;

      if (txResult.Sequence !== undefined && txResult.Sequence !== null) {
        escrowSequence = typeof txResult.Sequence === 'string' ? parseInt(txResult.Sequence, 10) : Number(txResult.Sequence);
        if (!isNaN(escrowSequence) && escrowSequence > 0) {
          console.log('✅ Utilisation du Sequence de la transaction EscrowCreate:', escrowSequence);
        } else {
          escrowSequence = undefined;
        }
      }

      if (escrowSequence === undefined || isNaN(escrowSequence) || escrowSequence <= 0) {
        console.error('❌ Impossible de déterminer escrowSequence depuis la transaction');
        console.error('   Transaction result:', JSON.stringify(txResponse.result, null, 2));
        return res.status(400).json({
          error: 'Could not determine escrow sequence',
          details: 'Impossible de déterminer le sequence de l\'escrow depuis la transaction EscrowCreate'
        });
      }

      // Vérifier que l'escrow existe toujours
      // On utilise le Sequence de la transaction car PreviousTxnID peut changer
      const { getEscrowInfo } = await import('../services/xrpl');
      const escrows = await getEscrowInfo(platformAddress);

      // Trouver l'escrow par son Sequence (stocké dans le champ Sequence de l'objet escrow)
      // Note: L'escrow contient un champ "PreviousTxnID" qui correspond au dernier tx qui l'a modifié
      // Mais on peut aussi matcher par Destination et Amount
      const expectedDestination = session.worker_xrpl_address;
      const escrow = escrows.find((e: any) => {
        // Match par destination et vérification que c'est le bon escrow
        return e.Destination === expectedDestination;
      });

      if (!escrow) {
        console.warn('⚠️  Escrow non trouvé pour destination:', expectedDestination);
        console.warn('   Escrows disponibles:', escrows.map((e: any) => ({
          dest: e.Destination,
          amount: e.Amount,
        })));
        // On continue avec le sequence de la transaction originale
      } else {
        console.log('✅ Escrow trouvé dans account_objects');
        console.log('   Destination:', escrow.Destination);
        console.log('   Amount:', escrow.Amount);
      }

      // S'assurer que c'est bien un nombre avant de passer à finishEscrow
      const finalSequence = typeof escrowSequence === 'string' ? parseInt(escrowSequence, 10) : Number(escrowSequence);

      if (isNaN(finalSequence) || finalSequence <= 0) {
        console.error('❌ escrowSequence invalide après conversion:', finalSequence, '(original:', escrowSequence, ')');
        return res.status(400).json({
          error: 'Invalid escrow sequence',
          details: `Le sequence de l'escrow est invalide: ${escrowSequence}`
        });
      }

      console.log('✅ Sequence final validé:', finalSequence, '(type:', typeof finalSequence, ')');

      // Utiliser le secret de la plateforme et l'adresse du créateur (qui doit être la même)
      const paymentTx = await finishEscrow(
        employerSecret,
        platformAddress, // Doit correspondre au wallet dérivé de employerSecret
        finalSequence
      );

      // Mettre à jour la DB
      const updateResult = await pool.query(
        `UPDATE work_sessions
         SET status = 'paid',
             xrpl_payment_tx = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [paymentTx, id]
      );

      res.json({
        shift_id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
        xrpl_payment_tx: updateResult.rows[0].xrpl_payment_tx,
        message: 'Payment released successfully',
      });
    } catch (xrplError: any) {
      console.error('XRPL release error:', xrplError);
      res.status(500).json({
        error: 'Failed to release escrow',
        details: xrplError.message,
      });
    }
  } catch (error) {
    console.error('Release shift error:', error);
    res.status(500).json({ error: 'Failed to release shift' });
  }
});

/**
 * GET /shifts/:id
 * Détails d'un shift
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `SELECT ws.*,
              w.name as worker_name,
              w.xrpl_address as worker_xrpl_address,
              e.name as employer_name,
              e.xrpl_address as employer_xrpl_address
       FROM work_sessions ws
       JOIN users w ON ws.worker_id = w.id
       JOIN users e ON ws.employer_id = e.id
       WHERE ws.id = $1
       AND (ws.worker_id = $2 OR ws.employer_id = $2)`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shift = result.rows[0];

    res.json({
      id: shift.id,
      worker_name: shift.worker_name,
      worker_xrpl_address: shift.worker_xrpl_address,
      employer_name: shift.employer_name,
      employer_xrpl_address: shift.employer_xrpl_address,
      start_time: shift.start_time,
      end_time: shift.end_time,
      hours: shift.hours ? parseFloat(shift.hours) : null,
      hourly_rate: shift.hourly_rate ? parseFloat(shift.hourly_rate) : null,
      amount_total: shift.amount_total ? parseFloat(shift.amount_total) : null,
      status: shift.status,
      stt_start_text: shift.stt_start_text,
      stt_end_text: shift.stt_end_text,
      llm_structured_json: shift.llm_structured_json,
      xrpl_proposal_tx: shift.xrpl_proposal_tx,
      xrpl_nft_id: shift.xrpl_nft_id,
      xrpl_escrow_tx: shift.xrpl_escrow_tx,
      xrpl_payment_tx: shift.xrpl_payment_tx,
      created_at: shift.created_at,
      updated_at: shift.updated_at,
    });
  } catch (error) {
    console.error('Get shift error:', error);
    res.status(500).json({ error: 'Failed to get shift' });
  }
});

export default router;

