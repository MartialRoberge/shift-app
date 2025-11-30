import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void
  maxDuration?: number // en secondes
  className?: string
  prompt?: string // Question/contexte pour le vocal
}

export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 60,
  className = '',
  prompt,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Audio analyser pour visualisation
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onRecordingComplete(audioBlob, duration)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Timer
      timerRef.current = window.setInterval(() => {
        setDuration((d) => {
          if (d >= maxDuration) {
            stopRecording()
            return d
          }
          return d + 1
        })
      }, 1000)

      // Animation niveau audio
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(avg / 255)
        }
        animationRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()
    } catch (err) {
      console.error('Erreur microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = (duration / maxDuration) * 100

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Prompt/Question */}
      {prompt && !isRecording && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-anthracite-600 mb-6 max-w-[280px]"
        >
          {prompt}
        </motion.p>
      )}

      {/* Bouton avec animation audio centrée */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {/* Cercles de pulsation - centrés sur le bouton */}
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1 + audioLevel * 0.4,
                  opacity: 0.15 + audioLevel * 0.15,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="absolute bg-red-500 rounded-full"
                style={{ width: 100, height: 100 }}
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: 1.15 + audioLevel * 0.35,
                  opacity: 0.1 + audioLevel * 0.1,
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 0.05 }}
                className="absolute bg-red-500 rounded-full"
                style={{ width: 100, height: 100 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Bouton principal */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg ${
            isRecording
              ? 'bg-red-500 shadow-red-500/30'
              : 'bg-anthracite-900 hover:bg-anthracite-800 shadow-anthracite-900/30'
          }`}
        >
          <AnimatePresence mode="wait">
            {isRecording ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                className="w-6 h-6 bg-white rounded-sm"
              />
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Timer et barre de progression */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-[200px] mt-6"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-red-500 font-mono font-medium">{formatTime(duration)}</span>
              <span className="text-anthracite-400">{formatTime(maxDuration)}</span>
            </div>
            <div className="h-1.5 bg-anthracite-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-anthracite-400 mt-4"
      >
        {isRecording ? 'Appuyez pour terminer' : 'Appuyez pour enregistrer'}
      </motion.p>
    </div>
  )
}
