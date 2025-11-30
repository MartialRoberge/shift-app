/**
 * Prompts LLM configurables
 */

export const LLM_PROMPTS = {
  system: {
    shiftAnalysis: `Tu es un assistant expert pour analyser des enregistrements de shifts de travail.
Tu dois extraire les informations structurées et détecter les problèmes potentiels.
Tu dois aussi évaluer le sentiment, l'énergie et l'état émotionnel du travailleur.
Réponds UNIQUEMENT avec un JSON valide, sans texte supplémentaire.`,

    startShift: `Tu es un assistant pour valider des check-ins de travail.
Confirme si c'est bien un début de shift et identifie le type de travail.
Analyse aussi l'énergie et l'humeur du travailleur.`,
  },

  user: {
    shiftAnalysis: (input: {
      startTime?: string;
      endTime?: string;
      startTranscript: string;
      endTranscript?: string;
      policy?: {
        max_hours_per_day?: number;
        min_hourly_rate?: number;
      };
    }) => {
      const { startTime, endTime, startTranscript, endTranscript, policy } = input;

      return `Analyse ce shift de travail :

**Check-in (début)** :
${startTranscript}

${endTranscript ? `**Check-out (fin)** :
${endTranscript}` : ''}

${startTime ? `Heure système de début : ${startTime}` : ''}
${endTime ? `Heure système de fin : ${endTime}` : ''}

${policy ? `Politique :
- Heures max par jour : ${policy.max_hours_per_day || 12}
- Taux horaire minimum : ${policy.min_hourly_rate || 10}` : ''}

Extrais les informations suivantes au format JSON :
{
  "job_type": "type de travail (ex: nettoyage, garde d'enfants, livraison, jardinage, cuisine, construction, etc.)",
  "notes": "résumé concis du shift en 1-2 phrases",
  "summary": "description détaillée du travail effectué",
  "issues": ["liste des problèmes détectés"],
  "risk_flags": ["flags de risque: fatigue, blessure, stress, surcharge_emotionnelle, securite"],
  "legal_flags": ["flags légaux: heures_supplementaires, pause_manquante, etc."],
  "sentiment": "positive | neutral | negative",
  "energy_level": 0.0-1.0 (niveau d'énergie perçu),
  "mood": "emoji représentant l'humeur (ex: 😊, 😓, 💪, 😴)",
  "key_phrases": ["3-5 phrases clés extraites des transcriptions"],
  "recommendations": ["suggestions pour améliorer les prochains shifts"],
  "confidence": 0.0-1.0
}`;
    },

    startShift: (transcript: string) => {
      return `Analyse ce check-in :
"${transcript}"

Réponds en JSON :
{
  "is_valid_start": true/false,
  "job_type": "type de travail identifié (nettoyage, garde, livraison, etc.)",
  "notes": "notes du check-in",
  "mood": "emoji humeur",
  "energy_level": 0.0-1.0,
  "sentiment": "positive | neutral | negative"
}`;
    },
  },
};

