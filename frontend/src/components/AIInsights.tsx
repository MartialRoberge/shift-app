/**
 * AIInsights - Analyse IA du shift
 * Design professionnel sans emojis, noir/blanc/gris
 */

import { motion } from 'framer-motion'

interface LLMAnalysis {
  job_type?: string
  notes?: string
  summary?: string
  issues?: string[]
  risk_flags?: string[]
  legal_flags?: string[]
  confidence?: number
  mood?: string
  energy_level?: number
  key_phrases?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  recommendations?: string[]
}

interface AIInsightsProps {
  analysis?: LLMAnalysis
  llmData?: LLMAnalysis // Alias for compatibility
  startTranscript?: string
  endTranscript?: string
  compact?: boolean
}

export function AIInsights({ analysis, llmData, startTranscript, endTranscript, compact = false }: AIInsightsProps) {
  // Support both props names
  const data = analysis || llmData
  if (!data) return null

  const confidence = data.confidence || 0
  const jobType = data.job_type || 'Non spécifié'

  const getConfidenceLabel = (conf: number) => {
    if (conf >= 0.8) return 'Haute'
    if (conf >= 0.6) return 'Moyenne'
    return 'Faible'
  }

  if (compact) {
    return (
      <div className="bg-anthracite-50 border border-anthracite-100 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-anthracite-200 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-anthracite-900 capitalize">{jobType}</p>
              <p className="text-xs text-anthracite-400">Analyse IA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-anthracite-900">{Math.round(confidence * 100)}%</p>
            <p className="text-xs text-anthracite-400">confiance</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-anthracite-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-anthracite-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <div>
              <p className="font-medium capitalize">{jobType}</p>
              <p className="text-xs text-anthracite-400">Analyse automatique</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.round(confidence * 100)}%</p>
            <p className="text-xs text-anthracite-400">confiance {getConfidenceLabel(confidence)}</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${confidence * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Notes/Summary */}
        {(data.notes || data.summary) && (
          <div className="bg-anthracite-50 rounded-lg p-3">
            <p className="text-xs text-anthracite-400 mb-1 uppercase tracking-wide">Résumé</p>
            <p className="text-sm text-anthracite-700">{data.notes || data.summary}</p>
          </div>
        )}

        {/* Energy level */}
        {data.energy_level !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-anthracite-500">Niveau d'énergie</span>
              <span className="text-xs font-medium text-anthracite-700">
                {Math.round(data.energy_level * 100)}%
              </span>
            </div>
            <div className="h-2 bg-anthracite-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.energy_level * 100}%` }}
                transition={{ duration: 0.5 }}
                className={`h-full rounded-full ${
                  data.energy_level > 0.7 ? 'bg-anthracite-900' :
                  data.energy_level > 0.4 ? 'bg-anthracite-600' : 'bg-anthracite-400'
                }`}
              />
            </div>
          </div>
        )}

        {/* Transcriptions */}
        {(startTranscript || endTranscript) && (
          <div className="space-y-2">
            <p className="text-xs text-anthracite-400 uppercase tracking-wide">Transcriptions vocales</p>

            {startTranscript && (
              <div className="border-l-2 border-anthracite-300 pl-3 py-1">
                <p className="text-xs text-anthracite-500 mb-0.5">Check-in</p>
                <p className="text-sm text-anthracite-700 italic">"{startTranscript}"</p>
              </div>
            )}

            {endTranscript && (
              <div className="border-l-2 border-anthracite-900 pl-3 py-1">
                <p className="text-xs text-anthracite-500 mb-0.5">Check-out</p>
                <p className="text-sm text-anthracite-700 italic">"{endTranscript}"</p>
              </div>
            )}
          </div>
        )}

        {/* Issues */}
        {data.issues && data.issues.length > 0 && (
          <div className="bg-anthracite-50 border border-anthracite-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-xs font-medium text-anthracite-700">Points d'attention</span>
            </div>
            <ul className="space-y-1">
              {data.issues.map((issue, i) => (
                <li key={i} className="text-sm text-anthracite-600 flex items-start gap-2">
                  <span className="text-anthracite-400 mt-1">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk flags */}
        {data.risk_flags && data.risk_flags.length > 0 && (
          <div className="bg-anthracite-100 border border-anthracite-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-700">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-xs font-medium text-anthracite-800">Alertes</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {data.risk_flags.map((flag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 bg-anthracite-200 text-anthracite-700 rounded"
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Legal flags */}
        {data.legal_flags && data.legal_flags.length > 0 && (
          <div className="border border-anthracite-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-anthracite-600">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs font-medium text-anthracite-700">Points légaux</span>
            </div>
            <ul className="space-y-1">
              {data.legal_flags.map((flag, i) => (
                <li key={i} className="text-sm text-anthracite-600 flex items-start gap-2">
                  <span className="text-anthracite-400 mt-1">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations && data.recommendations.length > 0 && (
          <div className="border border-anthracite-100 rounded-lg p-3">
            <p className="text-xs text-anthracite-400 mb-2 uppercase tracking-wide">Recommandations</p>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-anthracite-600 flex items-start gap-2">
                  <span className="text-anthracite-400 mt-1">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
