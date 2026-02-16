import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSound } from '~/composables/useSound'
import { useSettings } from '~/composables/useSettings'

// Mock useSettings
vi.mock('~/composables/useSettings', () => ({
  useSettings: vi.fn(() => ({
    settings: {
      value: {
        soundVolume: 75
      }
    }
  }))
}))

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { setValueAtTime: vi.fn() },
  type: 'sine'
}

const mockGain = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  }
}

const mockAudioContext = {
  createOscillator: vi.fn().mockReturnValue(mockOscillator),
  createGain: vi.fn().mockReturnValue(mockGain),
  currentTime: 0,
  destination: {},
  close: vi.fn()
}

global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext)

describe('useSound', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const sound = useSound()
    expect(sound).toBeDefined()
  })

  it('should play beep sound', () => {
    const { playBeep } = useSound()
    playBeep()

    expect(global.AudioContext).toHaveBeenCalled()
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    expect(mockOscillator.start).toHaveBeenCalled()
    expect(mockOscillator.stop).toHaveBeenCalled()
  })

  it('should play system sound by name', () => {
    // This might be harder to test if it uses Audio object
    // Mocking Audio
    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      volume: 1
    }
    global.Audio = vi.fn().mockImplementation(() => mockAudio) as any

    const { playSystemSound } = useSound()
    playSystemSound('beep')

    expect(global.Audio).toHaveBeenCalledWith('/assets/sounds/beep.mp3')
    expect(mockAudio.play).toHaveBeenCalled()
  })

  it('should respect sound volume', () => {
    const { playSystemSound } = useSound()

    const mockAudio = {
      play: vi.fn().mockResolvedValue(undefined),
      volume: 1
    }
    global.Audio = vi.fn().mockImplementation(() => mockAudio) as any

    playSystemSound('beep')
    expect(mockAudio.volume).toBe(0.75) // 75 from mocked settings
  })

  it('should play startup chime', () => {
    const { playStartupChime } = useSound()
    playStartupChime()

    expect(global.AudioContext).toHaveBeenCalled()
    // Should create multiple oscillators for the chord
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    expect(mockOscillator.start).toHaveBeenCalled()
  })
})
