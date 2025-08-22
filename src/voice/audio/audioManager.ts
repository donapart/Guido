/**
 * Audio Manager - Handles TTS, beeps, and audio processing for Guido Voice Control
 */

import { BeepSound, TTSOptions, VoiceConfig } from "../types";

export class AudioManager {
  private config: VoiceConfig;
  private audioContext?: AudioContext;
  private synthesis: SpeechSynthesis;
  private currentUtterance?: SpeechSynthesisUtterance;
  private isMuted = false;
  private masterVolume = 1.0;

  // Pre-defined beep frequencies for different sounds
  private beepProfiles = {
    classic: { frequency: 800, duration: 0.2 },
    modern: { frequency: 1000, duration: 0.15 },
    'sci-fi': { frequency: 440, duration: 0.3, modulation: true },
    gentle: { frequency: 600, duration: 0.25 }
  };

  constructor(config: VoiceConfig) {
    this.config = config;
    this.synthesis = window.speechSynthesis;
    this.masterVolume = config.audio.volume;
  }

  /**
   * Initialize audio system
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (Chrome auto-suspend policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Load available voices
      await this.loadVoices();

      console.log('🎵 Audio Manager initialized');
    } catch (error) {
      console.error('Audio Manager initialization failed:', error);
      throw new Error('Audio system not supported');
    }
  }

  /**
   * Text-to-Speech functionality
   */
  async speak(options: TTSOptions): Promise<void> {
    if (!this.config.audio.ttsEnabled || this.isMuted) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        this.synthesis.cancel();

        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(options.text);
        
        // Configure utterance
        this.configureUtterance(this.currentUtterance, options);

        // Set event handlers
        this.currentUtterance.onend = () => {
          resolve();
        };

        this.currentUtterance.onerror = (event) => {
          reject(new Error(`TTS Error: ${event.error}`));
        };

        this.currentUtterance.onstart = () => {
          console.log('🗣️ TTS started:', options.text.substring(0, 50));
        };

        // Speak
        this.synthesis.speak(this.currentUtterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  /**
   * Pause current speech
   */
  pauseSpeaking(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resumeSpeaking(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Play confirmation beep
   */
  async playBeep(
    sound: BeepSound = 'classic',
    volume: number = this.config.audio.beepVolume,
    duration?: number
  ): Promise<void> {
    if (!this.config.audio.enableBeep || this.isMuted || !this.audioContext) {
      return;
    }

    const profile = this.beepProfiles[sound];
    if (!profile) {
      console.warn(`Unknown beep sound: ${sound}`);
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure oscillator
      oscillator.frequency.setValueAtTime(profile.frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Configure gain (volume)
      const effectiveVolume = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(effectiveVolume, this.audioContext.currentTime);

      // Add modulation for sci-fi sound
      if (profile.modulation) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        lfo.frequency.value = 5; // 5Hz modulation
        lfoGain.gain.value = 50; // Modulation depth
        
        lfo.start();
        lfo.stop(this.audioContext.currentTime + (duration || profile.duration));
      }

      // Apply fade in/out for smooth sound
      const fadeTime = 0.01;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(effectiveVolume, this.audioContext.currentTime + fadeTime);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + (duration || profile.duration) - fadeTime);

      // Play beep
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + (duration || profile.duration));

    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }

  /**
   * Play notification sound
   */
  async playNotificationSound(type: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
    if (this.isMuted || !this.audioContext) {
      return;
    }

    const soundProfiles = {
      info: { frequency: 800, duration: 0.15 },
      success: { frequency: 1000, duration: 0.2, chord: [1000, 1200] },
      warning: { frequency: 600, duration: 0.3, repeat: 2 },
      error: { frequency: 400, duration: 0.5, dissonant: true }
    };

    const profile = soundProfiles[type];
    
    try {
      if (profile.chord) {
        // Play chord for success
        for (const freq of profile.chord) {
          await this.playTone(freq, profile.duration, 0.3);
        }
      } else if (profile.repeat) {
        // Repeat tone for warning
        for (let i = 0; i < profile.repeat; i++) {
          await this.playTone(profile.frequency, profile.duration / profile.repeat, 0.4);
          await this.sleep(50);
        }
      } else {
        // Single tone
        await this.playTone(profile.frequency, profile.duration, 0.4);
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Set master volume
   */
  setVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Volume set to ${Math.round(this.masterVolume * 100)}%`);
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Mute all audio
   */
  mute(): void {
    this.isMuted = true;
    this.stopSpeaking();
    console.log('🔇 Audio muted');
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    this.isMuted = false;
    console.log('🔊 Audio unmuted');
  }

  /**
   * Check if audio is muted
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * Find best voice for language and preferences
   */
  findBestVoice(language: string, gender?: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    
    // Filter by language
    const languageVoices = voices.filter(voice => 
      voice.lang.startsWith(language.split('-')[0])
    );

    if (languageVoices.length === 0) {
      return null;
    }

    // Filter by gender if specified
    if (gender) {
      const genderVoices = languageVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        if (gender === 'female') {
          return !name.includes('male') || name.includes('female');
        } else if (gender === 'male') {
          return name.includes('male') && !name.includes('female');
        }
        return true;
      });
      
      if (genderVoices.length > 0) {
        return genderVoices[0];
      }
    }

    // Prefer local voices
    const localVoices = languageVoices.filter(voice => voice.localService);
    if (localVoices.length > 0) {
      return localVoices[0];
    }

    return languageVoices[0];
  }

  /**
   * Test voice with sample text
   */
  async testVoice(voice: SpeechSynthesisVoice, sampleText?: string): Promise<void> {
    const text = sampleText || this.getSampleTextForLanguage(voice.lang);
    
    await this.speak({
      text,
      voice: voice.name,
      language: voice.lang as any,
      speed: this.config.audio.speed,
      volume: this.config.audio.volume * 0.8 // Slightly lower for testing
    });
  }

  /**
   * Create audio visualizer data (for waveform display)
   */
  createAudioVisualizer(): AudioAnalyser | null {
    if (!this.audioContext) {
      return null;
    }

    try {
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      return {
        analyser,
        bufferLength: analyser.frequencyBinCount,
        dataArray: new Uint8Array(analyser.frequencyBinCount)
      };
    } catch (error) {
      console.error('Failed to create audio visualizer:', error);
      return null;
    }
  }

  /**
   * Clean up resources
   */
  async destroy(): Promise<void> {
    try {
      this.stopSpeaking();
      
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = undefined;
      }
      
      console.log('🎵 Audio Manager destroyed');
    } catch (error) {
      console.error('Audio Manager cleanup failed:', error);
    }
  }

  // Private helper methods

  private configureUtterance(utterance: SpeechSynthesisUtterance, options: TTSOptions): void {
    // Basic settings
    utterance.lang = options.language || this.config.language.recognition;
    utterance.rate = options.speed || this.config.audio.speed;
    utterance.pitch = options.pitch || this.config.audio.pitch;
    utterance.volume = (options.volume || this.config.audio.volume) * this.masterVolume;

    // Voice selection
    if (options.voice && options.voice !== 'auto') {
      const voice = this.findVoiceByName(options.voice);
      if (voice) {
        utterance.voice = voice;
      }
    } else {
      // Auto-select best voice
      const bestVoice = this.findBestVoice(
        utterance.lang,
        this.config.audio.voice.gender
      );
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
    }
  }

  private findVoiceByName(name: string): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();
    return voices.find(voice => 
      voice.name === name || voice.voiceURI === name
    ) || null;
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();
      
      if (voices.length > 0) {
        resolve();
      } else {
        this.synthesis.onvoiceschanged = () => {
          resolve();
        };
        
        // Fallback timeout
        setTimeout(() => {
          resolve();
        }, 3000);
      }
    });
  }

  private getSampleTextForLanguage(lang: string): string {
    const samples = {
      'de': 'Hallo, ich bin Guido, Ihr Sprachassistent.',
      'en': 'Hello, I am Guido, your voice assistant.',
      'fr': 'Bonjour, je suis Guido, votre assistant vocal.',
      'es': 'Hola, soy Guido, tu asistente de voz.',
      'it': 'Ciao, sono Guido, il tuo assistente vocale.'
    };
    
    const langCode = lang.split('-')[0];
    return samples[langCode as keyof typeof samples] || samples['en'];
  }

  private async playTone(
    frequency: number, 
    duration: number, 
    volume: number
  ): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    return new Promise((resolve) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = volume * this.masterVolume;

      oscillator.onended = () => resolve();
      
      oscillator.start();
      oscillator.stop(this.audioContext!.currentTime + duration);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Types for audio visualizer
interface AudioAnalyser {
  analyser: AnalyserNode;
  bufferLength: number;
  dataArray: Uint8Array;
}

// Audio processing utilities
export class AudioProcessor {
  /**
   * Apply noise reduction to audio data
   */
  static applyNoiseReduction(audioData: Float32Array, threshold: number = 0.1): Float32Array {
    const processed = new Float32Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) > threshold) {
        processed[i] = audioData[i];
      } else {
        processed[i] = 0;
      }
    }
    
    return processed;
  }

  /**
   * Apply automatic gain control
   */
  static applyAutoGainControl(audioData: Float32Array, targetLevel: number = 0.7): Float32Array {
    const processed = new Float32Array(audioData.length);
    
    // Find peak
    let peak = 0;
    for (let i = 0; i < audioData.length; i++) {
      peak = Math.max(peak, Math.abs(audioData[i]));
    }
    
    // Calculate gain
    const gain = peak > 0 ? targetLevel / peak : 1;
    
    // Apply gain
    for (let i = 0; i < audioData.length; i++) {
      processed[i] = audioData[i] * gain;
    }
    
    return processed;
  }

  /**
   * Detect silence in audio data
   */
  static detectSilence(audioData: Float32Array, threshold: number = 0.01): boolean {
    let rms = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      rms += audioData[i] * audioData[i];
    }
    
    rms = Math.sqrt(rms / audioData.length);
    return rms < threshold;
  }

  /**
   * Calculate audio volume level
   */
  static calculateVolumeLevel(audioData: Float32Array): number {
    let sum = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    
    return sum / audioData.length;
  }
}
