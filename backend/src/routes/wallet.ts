import express, { Response } from 'express';
import { Client, Wallet } from 'xrpl';
import { XRPL_TESTNET_URL } from '../config/constants';

const router = express.Router();

/**
 * POST /wallet/connect
 * Teste la connexion d'un wallet XRPL avec un seed
 */
router.post('/connect', async (req: express.Request, res: Response) => {
  try {
    const { seed } = req.body;

    if (!seed || typeof seed !== 'string' || !seed.startsWith('s')) {
      return res.status(400).json({ 
        error: 'Invalid seed. Must start with "s"' 
      });
    }

    // Créer le wallet depuis le seed
    let wallet: Wallet;
    try {
      wallet = Wallet.fromSecret(seed);
    } catch (error: any) {
      return res.status(400).json({ 
        error: 'Invalid seed format: ' + error.message 
      });
    }

    // Se connecter au testnet
    const client = new Client(XRPL_TESTNET_URL);
    await client.connect();

    try {
      // Récupérer les infos du compte
      const accountInfo = await client.request({
        command: 'account_info',
        account: wallet.address,
      });

      const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
      const sequence = accountInfo.result.account_data.Sequence;

      await client.disconnect();

      res.json({
        success: true,
        address: wallet.address,
        balance: balance,
        sequence: sequence,
        activated: true,
        explorer_url: `https://testnet.xrpl.org/accounts/${wallet.address}`,
      });
    } catch (error: any) {
      await client.disconnect();
      
      // Compte non activé
      if (error.message.includes('actNotFound') || error.message.includes('not found')) {
        res.json({
          success: true,
          address: wallet.address,
          balance: 0,
          sequence: 0,
          activated: false,
          explorer_url: `https://testnet.xrpl.org/accounts/${wallet.address}`,
          message: 'Account not activated. Get test XRP from: https://xrpl.org/xrp-testnet-faucet.html',
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Wallet connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect wallet: ' + error.message 
    });
  }
});

/**
 * GET /wallet/balance/:address
 * Récupère le solde d'une adresse XRPL
 */
router.get('/balance/:address', async (req: express.Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validation plus stricte des adresses XRPL
    // Une adresse XRPL valide doit:
    // - Commencer par 'r'
    // - Avoir entre 25 et 35 caractères
    // - Ne contenir que des caractères base58 (pas de 0, O, I, l)
    const xrplAddressRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

    if (!address || !xrplAddressRegex.test(address)) {
      return res.json({
        address: address || 'unknown',
        balance: 0,
        reserve: 10,
        available: 0,
        sequence: 0,
        activated: false,
        invalid: true,
        error: 'Invalid XRPL address format'
      });
    }

    const client = new Client(XRPL_TESTNET_URL);
    await client.connect();

    try {
      const accountInfo = await client.request({
        command: 'account_info',
        account: address,
      });

      const balance = parseFloat(accountInfo.result.account_data.Balance) / 1000000;
      const sequence = accountInfo.result.account_data.Sequence;

      await client.disconnect();

      // Calculer la réserve (10 XRP minimum pour activer un compte)
      const reserve = 10;
      const available = Math.max(0, balance - reserve);

      res.json({
        address: address,
        balance: balance,
        reserve: reserve,
        available: available,
        sequence: sequence,
        activated: true,
      });
    } catch (error: any) {
      await client.disconnect();

      if (error.message.includes('actNotFound') || error.message.includes('not found')) {
        // Compte non activé - retourner 0 mais avec le format attendu
        res.json({
          address: address,
          balance: 0,
          reserve: 10,
          available: 0,
          sequence: 0,
          activated: false,
          message: 'Account not activated. Get test XRP from: https://xrpl.org/xrp-testnet-faucet.html',
        });
      } else if (error.message.includes('Malformed') || error.message.includes('malformed') || error.data?.error === 'actMalformed') {
        // Adresse malformée
        res.json({
          address: address,
          balance: 0,
          reserve: 10,
          available: 0,
          sequence: 0,
          activated: false,
          invalid: true,
          error: 'Address format is invalid on XRPL',
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Balance check error:', error);
    // Retourner un format cohérent même en cas d'erreur
    res.json({
      address: req.params.address || 'unknown',
      balance: 0,
      reserve: 10,
      available: 0,
      sequence: 0,
      activated: false,
      invalid: true,
      error: 'Failed to check balance: ' + error.message
    });
  }
});

/**
 * POST /wallet/send
 * Envoie des XRP (nécessite le seed)
 */
router.post('/send', async (req: express.Request, res: Response) => {
  try {
    const { seed, to_address, amount } = req.body;

    if (!seed || !to_address || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: seed, to_address, amount' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Créer le wallet
    let wallet: Wallet;
    try {
      wallet = Wallet.fromSecret(seed);
    } catch (error: any) {
      return res.status(400).json({ 
        error: 'Invalid seed: ' + error.message 
      });
    }

    const client = new Client(XRPL_TESTNET_URL);
    await client.connect();

    try {
      const { xrpToDrops } = await import('xrpl');

      const payment = {
        TransactionType: 'Payment',
        Account: wallet.address,
        Destination: to_address,
        Amount: xrpToDrops(amount),
      };

      const prepared = await client.autofill(payment);
      const signed = wallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      const transactionResult = typeof result.result.meta === 'object' && result.result.meta !== null
        ? (result.result.meta as any).TransactionResult
        : null;

      await client.disconnect();

      if (transactionResult !== 'tesSUCCESS') {
        return res.status(400).json({ 
          error: `Transaction failed: ${transactionResult}` 
        });
      }

      res.json({
        success: true,
        tx_hash: result.result.hash,
        from: wallet.address,
        to: to_address,
        amount: amount,
        explorer_url: `https://testnet.xrpl.org/transactions/${result.result.hash}`,
      });
    } catch (error: any) {
      await client.disconnect();
      throw error;
    }
  } catch (error: any) {
    console.error('Send XRP error:', error);
    res.status(500).json({ 
      error: 'Failed to send XRP: ' + error.message 
    });
  }
});

export default router;

