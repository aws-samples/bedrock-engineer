import { SoundType } from '@/types/sound'
import Snd from 'snd-lib'

export class SoundService {
  private static instance: SoundService
  private snd: Snd | null = null
  private isInitialized = false
  private currentSoundKit: SoundType = SoundType.NONE
  private isMuted = false

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService()
    }
    return SoundService.instance
  }

  public async initialize(soundType: SoundType = SoundType.SND01): Promise<void> {
    if (soundType === SoundType.NONE) {
      this.isInitialized = false
      this.snd = null
      return
    }

    try {
      if (!this.snd) {
        this.snd = new Snd({
          easySetup: false,
          preloadSoundKit: null // We'll load manually
        })
      }

      this.currentSoundKit = soundType

      // Load the sound kit immediately
      if (this.snd) {
        try {
          await this.snd.load(this.currentSoundKit)
          console.log('Sound kit loaded:', this.currentSoundKit)
          this.isInitialized = true
        } catch (error) {
          console.error('Failed to load sound kit:', error)
          this.isInitialized = false
        }
      }
    } catch (error) {
      console.error('Failed to initialize sound service:', error)
      this.isInitialized = false
    }
  }

  public playTypingSound(): void {
    if (
      !this.isInitialized ||
      !this.snd ||
      this.isMuted ||
      this.currentSoundKit === SoundType.NONE
    ) {
      return
    }

    try {
      this.snd.playType()
    } catch (error) {
      console.error('Failed to play typing sound:', error)
    }
  }

  public playChatCompleteSound(): void {
    if (
      !this.isInitialized ||
      !this.snd ||
      this.isMuted ||
      this.currentSoundKit === SoundType.NONE
    ) {
      return
    }

    try {
      this.snd.playCelebration()
    } catch (error) {
      console.error('Failed to play chat complete sound:', error)
    }
  }

  public async changeSoundKit(soundType: SoundType): Promise<void> {
    if (soundType === SoundType.NONE) {
      this.currentSoundKit = SoundType.NONE
      this.isInitialized = false
      return
    }

    if (!this.snd) {
      await this.initialize(soundType)
      return
    }

    this.currentSoundKit = soundType

    try {
      await this.snd.load(soundType)
      console.log('Sound kit changed to:', soundType)
    } catch (error) {
      console.error('Failed to change sound kit:', error)
    }
  }

  public mute(): void {
    if (this.snd) {
      this.snd.mute()
      this.isMuted = true
    }
  }

  public unmute(): void {
    if (this.snd) {
      this.snd.unmute()
      this.isMuted = false
    }
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted
  }

  public getCurrentSoundKit(): SoundType {
    return this.currentSoundKit
  }
}

export default SoundService.getInstance()
