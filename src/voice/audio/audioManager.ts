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
    // Speech synthesis will be initialized in webview context
    this.synthesis = (globalThis as any).speechSynthesis;
    this.masterVolume = config.audio.volume;
  }

  /**
   * Initialize audio system
   */
    async initialize(): Promise<void> {
    try {
      // Note: Audio Manager runs in Node.js context, actual audio APIs are in webview
      // This is a stub that communicates with the webview for audio operations
      console.log('🎵 Audio Manager initialized (Node.js stub)');
    } catch (error) {
      console.error('Audio Manager initialization failed:', error);
      throw new Error('Audio system not supported');
    }
  }

  /**
   * Text-to-Speech functionality (Webview communication stub)
   */
  async speak(options: TTSOptions): Promise<void> {
    if (!this.config.audio.ttsEnabled || this.isMuted) {
      return;
    }

    // In the actual implementation, this would send a message to the webview
    // The webview would handle the TTS using browser APIs
    console.log('🗣️ TTS request (stub):', options.text.substring(0, 50));
    
    // Simulate TTS completion
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, options.text.length * 50); // Simulate speaking time
    });
  }

  /**
   * Stop current speech (Stub)
   */
  stopSpeaking(): void {
    console.log('🛑 TTS stop request (stub)');
  }

  /**
   * Pause current speech (Stub)
   */
  pauseSpeaking(): void {
    console.log('⏸️ TTS pause request (stub)');
  }

  /**
   * Resume paused speech (Stub)
   */
  resumeSpeaking(): void {
    console.log('▶️ TTS resume request (stub)');
  }

  /**
   * Play confirmation beep (Stub - actual implementation in webview)
   */
  async playBeep(
    sound: BeepSound = 'classic',
    volume: number = this.config.audio.beepVolume,
    duration?: number
  ): Promise<void> {
    if (!this.config.audio.enableBeep || this.isMuted) {
      return;
    }

    const profile = this.beepProfiles[sound];
    if (!profile) {
      console.warn(`Unknown beep sound: ${sound}`);
      return;
    }

    console.log(`🔊 Beep request (stub): ${sound} at ${volume} volume for ${duration || profile.duration}ms`);
    
    // In actual implementation, this would send a message to webview
    // The webview would play the beep using Web Audio API
  }

     /**
    * Play notification sound (Stub)
    */
   async playNotificationSound(type: 'info' | 'success' | 'warning' | 'error'): Promise<void> {
     if (this.isMuted) {
       return;
     }

     console.log(`🔔 Notification sound request (stub): ${type}`);
     
     // In actual implementation, this would send a message to webview
     // The webview would play the notification sound using Web Audio API
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
   * Get available voices (Stub)
   */
  getAvailableVoices(): any[] {
    console.log('🎤 Get voices request (stub)');
    // In actual implementation, this would query webview for available voices
    return [];
  }

  /**
   * Find best voice for language and preferences (Stub)
   */
  findBestVoice(language: string, gender?: string): any | null {
    console.log(`🎤 Find best voice request (stub): ${language}, ${gender}`);
    // In actual implementation, this would be handled by webview
    return null;
  }

  /**
   * Test voice with sample text (Stub)
   */
  async testVoice(voice: any, sampleText?: string): Promise<void> {
    const text = sampleText || this.getSampleTextForLanguage(voice?.lang || 'en');
    console.log(`🧪 Voice test request (stub): ${text}`);
    
    // Simulate test
    await this.speak({
      text,
      voice: voice?.name || 'auto',
      speed: this.config.audio.speed,
      volume: this.config.audio.volume * 0.8
    });
  }

  /**
   * Create audio visualizer data (Stub)
   */
  createAudioVisualizer(): any | null {
    console.log('📊 Audio visualizer request (stub)');
    // In actual implementation, this would be handled by webview
    return null;
  }

  /**
   * Clean up resources (Stub)
   */
  async destroy(): Promise<void> {
    try {
      this.stopSpeaking();
      console.log('🎵 Audio Manager destroyed (stub)');
    } catch (error) {
      console.error('Audio Manager cleanup failed:', error);
    }
  }

  // Private helper methods

  private configureUtterance(utterance: any, options: TTSOptions): void {
    console.log('⚙️ Configure utterance (stub):', options);
    // In actual implementation, this would be handled by webview
  }

  private findVoiceByName(name: string): any | null {
    console.log(`🔍 Find voice by name (stub): ${name}`);
    // In actual implementation, this would query webview
    return null;
  }

  private async loadVoices(): Promise<void> {
    console.log('📥 Load voices (stub)');
    // In actual implementation, this would be handled by webview
    return Promise.resolve();
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
    console.log(`🎵 Play tone (stub): ${frequency}Hz for ${duration}s at ${volume} volume`);
    // In actual implementation, this would send message to webview
    return Promise.resolve();
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
