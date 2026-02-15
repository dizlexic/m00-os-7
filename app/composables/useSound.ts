import { useSettings } from '~/composables/useSettings'

export function useSound() {
  const { settings } = useSettings()

  /**
   * Plays a system sound by name.
   * Looks for the sound in /assets/sounds/[name].mp3
   */
  const playSystemSound = (name: string) => {
    const volume = settings.value.soundVolume / 100
    const audio = new Audio(`/assets/sounds/${name}.mp3`)
    audio.volume = volume
    audio.play().catch((err) => {
      // If sound file fails to play (e.g. not found), fallback to beep
      if (name === 'beep' || name === 'alert') {
        playBeep()
      }
      console.warn(`Failed to play sound "${name}":`, err)
    })
  }

  /**
   * Generates a classic system beep using Web Audio API.
   */
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      const volume = settings.value.soundVolume / 100

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(440, context.currentTime) // A4 note

      gainNode.gain.setValueAtTime(volume, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1)

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start()
      oscillator.stop(context.currentTime + 0.1)

      // Close context after playback
      setTimeout(() => {
        context.close()
      }, 200)
    } catch (e) {
      console.error('Failed to play beep:', e)
    }
  }

  return {
    playSystemSound,
    playBeep
  }
}
