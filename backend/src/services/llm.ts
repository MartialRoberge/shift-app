import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ShiftAnalysis } from '../types';
import { LLM_PROMPTS } from '../config/prompts';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyseShiftInput {
  startTime?: string;
  endTime?: string;
  startTranscript: string;
  endTranscript?: string;
  policy?: {
    max_hours_per_day?: number;
    min_hourly_rate?: number;
  };
}

/**
 * Analyse un shift avec un LLM pour extraire les informations structurées
 */
export async function analyseShift(input: AnalyseShiftInput): Promise<ShiftAnalysis> {
  const systemPrompt = LLM_PROMPTS.system.shiftAnalysis;
  const userPrompt = LLM_PROMPTS.user.shiftAnalysis(input);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // ou gpt-4 pour plus de précision
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from LLM');
    }

    const parsed = JSON.parse(content) as ShiftAnalysis;
    return parsed;
  } catch (error) {
    console.error('LLM analysis error:', error);
    
    // Fallback : retourner une analyse basique
    return {
      job_type: 'unknown',
      notes: input.startTranscript,
      issues: [],
      risk_flags: [],
      legal_flags: [],
      confidence: 0.5,
    };
  }
}

/**
 * Analyse uniquement le check-in (pour start shift)
 */
export async function analyseStartShift(transcript: string): Promise<Partial<ShiftAnalysis>> {
  // Vérifier si OpenAI est configuré
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY non configuré, utilisation du mode démo');
    return {
      job_type: 'unknown',
      notes: transcript,
    };
  }

  const systemPrompt = LLM_PROMPTS.system.startShift;
  const userPrompt = LLM_PROMPTS.user.startShift(transcript);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.warn('⚠️ Pas de contenu dans la réponse LLM');
      return { job_type: 'unknown', notes: transcript };
    }

    const parsed = JSON.parse(content);
    return {
      job_type: parsed.job_type || 'unknown',
      notes: parsed.notes || transcript,
    };
  } catch (error: any) {
    console.error('❌ LLM start analysis error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    // Retourner une valeur par défaut au lieu de faire planter
    return {
      job_type: 'unknown',
      notes: transcript,
    };
  }
}

