import { useSettings } from '~/composables/useSettings'

export function useSound() {
  const { settings } = useSettings()

  /**
   * Plays a system sound by name.
   * Looks for the sound in /assets/sounds/[name].wav
   */
  const playSystemSound = (name: string) => {
    const volume = settings.value.soundVolume / 100
    const audio = new Audio(`/assets/sounds/${name}.wav`)
    audio.volume = volume
    audio.play().catch((err) => {
      // If sound file fails to play (e.g. not found), fallback to beep
      if (name !== 'beep') {
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

  /**
   * Generates a classic Mac startup chime using Web Audio API.
   * Plays a C major-ish chord with square waves.
   */
  const playStartupChime = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const context = new AudioContextClass()
      const masterGain = context.createGain()
      masterGain.connect(context.destination)

      const volume = (settings.value?.soundVolume || 75) / 100
      masterGain.gain.setValueAtTime(volume, context.currentTime)

      // C major chord: C3, E3, G3, C4
      const frequencies = [130.81, 164.81, 196.00, 261.63]

      frequencies.forEach((freq) => {
        const osc = context.createOscillator()
        const gain = context.createGain()

        osc.type = 'square'
        osc.frequency.setValueAtTime(freq, context.currentTime)

        gain.gain.setValueAtTime(0.1, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.0)

        osc.connect(gain)
        gain.connect(masterGain)

        osc.start()
        osc.stop(context.currentTime + 2.0)
      })

      // Close context after playback
      setTimeout(() => {
        if (context.state !== 'closed') {
          context.close()
        }
      }, 2500)
    } catch (e) {
      console.error('Failed to play startup chime:', e)
    }
  }

  /**
   * Generates a "crumpling paper" sound for the trash using Web Audio API.
   */
  const playTrashSound = () => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const context = new AudioContextClass()
      const volume = (settings.value?.soundVolume || 75) / 100

      // Create white noise
      const bufferSize = 2 * context.sampleRate
      const noiseBuffer = context.createBuffer(1, bufferSize, context.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const noise = context.createBufferSource()
      noise.buffer = noiseBuffer

      const filter = context.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(1000, context.currentTime)

      const gain = context.createGain()
      gain.gain.setValueAtTime(volume * 0.2, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(context.destination)

      noise.start()
      noise.stop(context.currentTime + 0.3)

      setTimeout(() => {
        context.close()
      }, 500)
    } catch (e) {
      console.error('Failed to play trash sound:', e)
    }
  }

  return {
    playSystemSound,
    playBeep,
    playStartupChime,
    playTrashSound
  }
}
