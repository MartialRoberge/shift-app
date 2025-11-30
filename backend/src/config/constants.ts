/**
 * Constantes de configuration
 */

export const DEFAULT_HOURLY_RATE = 15.0;
export const MAX_HOURS_PER_DAY = 12;
export const MIN_HOURLY_RATE = 10.0;

export const SHIFT_STATUS = {
  PROPOSED: 'proposed',
  VALIDATED: 'validated',
  DISPUTED: 'disputed',
  PAID: 'paid',
  REFUSED: 'refused',
} as const;

export const USER_ROLES = {
  WORKER: 'worker',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
} as const;

export const XRPL_NETWORKS = {
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
} as const;

export const XRPL_TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';
export const XRPL_MAINNET_URL = 'wss://xrplcluster.com';

