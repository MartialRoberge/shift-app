export type UserRole = 'worker' | 'employer' | 'admin';
export type ShiftStatus = 'proposed' | 'validated' | 'disputed' | 'paid' | 'refused';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  xrpl_address?: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WorkSession {
  id: string;
  worker_id: string;
  employer_id: string;
  client_id?: string;
  start_time: Date;
  end_time?: Date;
  raw_audio_start_url?: string;
  raw_audio_end_url?: string;
  stt_start_text?: string;
  stt_end_text?: string;
  llm_structured_json?: any;
  hours?: number;
  hourly_rate?: number;
  amount_total?: number;
  status: ShiftStatus;
  xrpl_proposal_tx?: string;
  xrpl_nft_id?: string;
  xrpl_escrow_tx?: string;
  xrpl_payment_tx?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ShiftAnalysis {
  job_type: string;
  notes?: string;
  issues?: string[];
  risk_flags?: string[];
  legal_flags?: string[];
  confidence?: number;
}

export interface AuthRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
}

export interface StartShiftRequest {
  employer_id: string;
  job_type?: string;
}

export interface EndShiftRequest {
  work_session_id: string;
}

export interface ValidateShiftRequest {
  hourly_rate?: number;
  start_time?: string;
  end_time?: string;
  adjustments?: any;
}

