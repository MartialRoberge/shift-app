/**
 * Sound Design System - Professional Audio Feedback
 * Clics secs, subtils et professionnels inspirés des apps premium
 */

class SoundSystem {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private volume: number = 0.15 // Volume réduit pour plus de discrétion

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Clic sec et professionnel - interaction principale
   * Court, net, sans traînée
   */
  click() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Son percussif court
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02)
    oscillator.type = 'sine'

    // Filtre passe-bas pour adoucir
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, ctx.currentTime)

    // Envelope très courte - clic sec
    gainNode.gain.setValueAtTime(this.volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.03)
  }

  /**
   * Tap léger - boutons secondaires
   */
  tap() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(800, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.015)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.02)
  }

  /**
   * Succès - confirmation subtile
   * Un seul son propre, pas de mélodie
   */
  success() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.8, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  }

  /**
   * Erreur - son neutre, pas alarmant
   */
  error() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(300, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.7, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  }

  /**
   * Notification - ping discret
   */
  notification() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(1046, ctx.currentTime) // C6
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.06)
  }

  /**
   * Slide - feedback tactile pour les sliders
   */
  slide() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.04)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.05)
  }

  /**
   * Blockchain - clic digital court
   */
  blockchain() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(2000, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.02)
    oscillator.type = 'square'

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(3000, ctx.currentTime)

    gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.03)
  }

  /**
   * Payment - confirmation nette
   */
  payment() {
    if (!this.enabled) return

    const ctx = this.getContext()

    // Premier son
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.frequency.setValueAtTime(1200, ctx.currentTime)
    osc1.type = 'sine'
    gain1.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.05)

    // Deuxième son (confirmation)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.06)
    osc2.type = 'sine'
    gain2.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime + 0.06)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)

    osc2.start(ctx.currentTime + 0.06)
    osc2.stop(ctx.currentTime + 0.12)
  }

  /**
   * Shift start - signal de début
   */
  shiftStart() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.06)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  }

  /**
   * Shift end - signal de fin
   */
  shiftEnd() {
    if (!this.enabled) return

    const ctx = this.getContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.setValueAtTime(1000, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06)
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(this.volume * 0.6, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.08)
  }
}

// Instance singleton exportée
export const sounds = new SoundSystem()

// Hook React pour utiliser les sons
import { useCallback } from 'react'

export function useSounds() {
  const click = useCallback(() => sounds.click(), [])
  const tap = useCallback(() => sounds.tap(), [])
  const success = useCallback(() => sounds.success(), [])
  const error = useCallback(() => sounds.error(), [])
  const notification = useCallback(() => sounds.notification(), [])
  const slide = useCallback(() => sounds.slide(), [])
  const blockchain = useCallback(() => sounds.blockchain(), [])
  const payment = useCallback(() => sounds.payment(), [])
  const shiftStart = useCallback(() => sounds.shiftStart(), [])
  const shiftEnd = useCallback(() => sounds.shiftEnd(), [])

  return {
    click,
    tap,
    success,
    error,
    notification,
    slide,
    blockchain,
    payment,
    shiftStart,
    shiftEnd,
    setEnabled: sounds.setEnabled.bind(sounds),
    setVolume: sounds.setVolume.bind(sounds),
  }
}
