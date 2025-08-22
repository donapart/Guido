/**
 * Advanced Audio Manager for Guido Voice Control
 * Handles TTS, audio processing, and voice effects
 */

import * as fs from "fs";
import * as path from "path";

export interface AudioConfig {
  enableBeep: boolean;
  beepType: string;
  beepVolume: number;
  customBeepPath: string;
  ttsEnabled: boolean;
  ttsEngine: string;
  ttsVoice: string;
  ttsSpeed: number;
  ttsVolume: number;
  ttsPitch: number;
  ttsEmphasis: string;
  noiseReduction: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  spatialAudio: boolean;
}

export interface TTSOptions {
  voice?: string;
  speed?: number;
  volume?: number;
  pitch?: number;
  emphasis?: string;
  language?: string;
  ssml?: boolean;
}

export interface AudioEffect {
  type: 'reverb' | 'echo' | 'pitch' | 'speed' | 'volume';
  intensity: number;
  parameters?: Record<string, number>;
}

export class AudioManager {
  private audioContext?: AudioContext;
  private synthesis: SpeechSynthesis;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private effectsChain: AudioEffect[] = [];

  constructor(private config: AudioConfig) {
    this.synthesis = window.speechSynthesis;
    this.initializeAudio();
    this.loadVoices();
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Initialize Web Audio API
      this.audioContext = new AudioContext();
      
      // Load custom beep sounds if specified
      if (this.config.customBeepPath && fs.existsSync(this.config.customBeepPath)) {
        await this.loadCustomBeep();
      }
    } catch (error) {
      console.warn('Failed to initialize audio context:', error);
    }
  }

  private loadVoices(): void {
    // Wait for voices to be loaded
    const loadVoices = () => {
      this.availableVoices = this.synthesis.getVoices();
      
      if (this.availableVoices.length === 0) {
        // Voices not loaded yet, try again
        setTimeout(loadVoices, 100);
      }
    };

    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoices;
    }
    
    loadVoices();
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!this.config.ttsEnabled) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Process text for better speech
        const processedText = this.preprocessTextForTTS(text);
        
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(processedText);
        
        // Apply configuration
        utterance.rate = options?.speed ?? this.config.ttsSpeed;
        utterance.volume = options?.volume ?? this.config.ttsVolume;
        utterance.pitch = options?.pitch ?? this.config.ttsPitch;
        utterance.lang = options?.language ?? 'de-DE';
        
        // Select voice
        const voice = this.selectVoice(options?.voice ?? this.config.ttsVoice, utterance.lang);
        if (voice) {
          utterance.voice = voice;
        }

        // Apply SSML if supported and requested
        if (options?.ssml && this.supportsSSSML()) {
          utterance.text = this.wrapInSSML(processedText, options);
        }

        // Event handlers
        utterance.onstart = () => {
          console.log('TTS started');
        };

        utterance.onend = () => {
          console.log('TTS completed');
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('TTS error:', event.error);
          reject(new Error(`TTS error: ${event.error}`));
        };

        // Apply audio effects if configured
        if (this.effectsChain.length > 0) {
          this.applyAudioEffects(utterance);
        }

        // Speak
        this.synthesis.speak(utterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  async playBeep(type?: string): Promise<void> {
    if (!this.config.enableBeep || !this.audioContext) {
      return;
    }

    const beepType = type ?? this.config.beepType;
    
    try {
      switch (beepType) {
        case 'soft':
          await this.playTone(600, 0.2, 'sine');
          break;
        case 'sharp':
          await this.playTone(1000, 0.15, 'square');
          break;
        case 'melody':
          await this.playMelody();
          break;
        case 'custom':
          await this.playCustomBeep();
          break;
        default:
          await this.playTone(800, 0.2, 'sine');
      }
    } catch (error) {
      console.warn('Failed to play beep:', error);
    }
  }

  private async playTone(frequency: number, duration: number, waveType: OscillatorType = 'sine'): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = waveType;
    gainNode.gain.value = this.config.beepVolume;

    // Smooth attack and release
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(this.config.beepVolume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration - 0.01);

    oscillator.start(now);
    oscillator.stop(now + duration);

    return new Promise(resolve => {
      oscillator.onended = () => resolve();
    });
  }

  private async playMelody(): Promise<void> {
    const notes = [
      { freq: 523, duration: 0.15 }, // C5
      { freq: 659, duration: 0.15 }, // E5
      { freq: 784, duration: 0.2 }   // G5
    ];

    for (const note of notes) {
      await this.playTone(note.freq, note.duration);
      await this.delay(50); // Small gap between notes
    }
  }

  private async playCustomBeep(): Promise<void> {
    if (!this.config.customBeepPath || !this.audioContext) return;

    try {
      const audioBuffer = await this.loadAudioFile(this.config.customBeepPath);
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      gainNode.gain.value = this.config.beepVolume;

      source.start();
    } catch (error) {
      console.warn('Failed to play custom beep:', error);
      // Fallback to default beep
      await this.playTone(800, 0.2);
    }
  }

  private async loadCustomBeep(): Promise<void> {
    // Placeholder for loading custom beep files
    // In a real implementation, this would load audio files
    console.log('Custom beep path configured:', this.config.customBeepPath);
  }

  private async loadAudioFile(filePath: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    // In a browser environment, this would use fetch
    // For now, we'll simulate loading
    throw new Error('Custom audio file loading not implemented in this environment');
  }

  private preprocessTextForTTS(text: string): string {
    let processed = text;

    // Remove or replace problematic characters
    processed = processed.replace(/[<>]/g, '');
    
    // Handle code blocks
    processed = processed.replace(/```[\s\S]*?```/g, '[Code-Block]');
    processed = processed.replace(/`([^`]+)`/g, 'Code: $1');
    
    // Handle URLs
    processed = processed.replace(/https?:\/\/[^\s]+/g, '[Link]');
    
    // Handle file paths
    processed = processed.replace(/[A-Z]:\\[^\s]+/g, '[Dateipfad]');
    processed = processed.replace(/\/[^\s]*\.[a-zA-Z0-9]+/g, '[Dateipfad]');
    
    // Improve pronunciation of technical terms
    const replacements: Record<string, string> = {
      'API': 'A-P-I',
      'HTTP': 'H-T-T-P',
      'JSON': 'Jason',
      'XML': 'X-M-L',
      'SQL': 'S-Q-L',
      'CSS': 'C-S-S',
      'HTML': 'H-T-M-L',
      'JS': 'JavaScript',
      'TS': 'TypeScript',
      'NPM': 'N-P-M',
      'Git': 'Git',
      'GitHub': 'GitHub',
      'VSCode': 'Visual Studio Code',
      'OAuth': 'O-Auth',
      'JWT': 'J-W-T'
    };

    for (const [term, replacement] of Object.entries(replacements)) {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      processed = processed.replace(regex, replacement);
    }

    // Handle numbers and special formatting
    processed = processed.replace(/\b(\d+)\.(\d+)\.(\d+)\b/g, 'Version $1 Punkt $2 Punkt $3');
    processed = processed.replace(/\b(\d{1,3}),(\d{3})\b/g, '$1 Tausend $2');

    return processed;
  }

  private selectVoice(voiceName: string, language: string): SpeechSynthesisVoice | null {
    if (voiceName === 'auto') {
      // Select best voice for language
      return this.availableVoices.find(voice => 
        voice.lang.startsWith(language.split('-')[0]) && voice.localService
      ) || this.availableVoices.find(voice => 
        voice.lang.startsWith(language.split('-')[0])
      ) || null;
    }

    // Find specific voice
    return this.availableVoices.find(voice => 
      voice.name === voiceName || voice.name.includes(voiceName)
    ) || null;
  }

  private supportsSSSML(): boolean {
    // Check if browser supports SSML
    // This is a simplified check
    return 'speechSynthesis' in window;
  }

  private wrapInSSML(text: string, options: TTSOptions): string {
    const emphasis = options.emphasis || this.config.ttsEmphasis;
    const speed = options.speed || this.config.ttsSpeed;
    
    let ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${options.language || 'de-DE'}">`;
    
    if (emphasis !== 'none') {
      ssml += `<emphasis level="${emphasis}">`;
    }
    
    if (speed !== 1.0) {
      ssml += `<prosody rate="${speed}">`;
    }
    
    ssml += text;
    
    if (speed !== 1.0) {
      ssml += '</prosody>';
    }
    
    if (emphasis !== 'none') {
      ssml += '</emphasis>';
    }
    
    ssml += '</speak>';
    
    return ssml;
  }

  private applyAudioEffects(utterance: SpeechSynthesisUtterance): void {
    // Audio effects would be applied here
    // This is a placeholder for advanced audio processing
    console.log('Applying audio effects:', this.effectsChain);
  }

  addAudioEffect(effect: AudioEffect): void {
    this.effectsChain.push(effect);
  }

  removeAudioEffect(type: AudioEffect['type']): void {
    this.effectsChain = this.effectsChain.filter(effect => effect.type !== type);
  }

  clearAudioEffects(): void {
    this.effectsChain = [];
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    return this.availableVoices.filter(voice => 
      voice.lang.startsWith(language.split('-')[0])
    );
  }

  async testVoice(voiceName: string, text: string = "Dies ist ein Test der Sprachausgabe."): Promise<void> {
    await this.speak(text, { voice: voiceName });
  }

  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
  }

  pauseSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  resumeSpeaking(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  isPaused(): boolean {
    return this.synthesis.paused;
  }

  // Audio processing utilities
  async createAudioProcessor(): Promise<AudioWorkletNode | null> {
    if (!this.audioContext) return null;

    try {
      // Load audio worklet for advanced processing
      await this.audioContext.audioWorklet.addModule('path/to/audio-processor.js');
      return new AudioWorkletNode(this.audioContext, 'audio-processor');
    } catch (error) {
      console.warn('Failed to create audio processor:', error);
      return null;
    }
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Advanced TTS with emotion and context
  async speakWithEmotion(text: string, emotion: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm'): Promise<void> {
    const emotionSettings: Record<string, Partial<TTSOptions>> = {
      neutral: { speed: 1.0, pitch: 1.0 },
      happy: { speed: 1.1, pitch: 1.1 },
      sad: { speed: 0.8, pitch: 0.9 },
      excited: { speed: 1.2, pitch: 1.2 },
      calm: { speed: 0.9, pitch: 0.95 }
    };

    const settings = emotionSettings[emotion] || emotionSettings.neutral;
    await this.speak(text, settings);
  }

  async speakWithSSML(ssmlText: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance();
    utterance.text = ssmlText;
    
    return new Promise((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));
      this.synthesis.speak(utterance);
    });
  }

  // Audio quality analysis
  analyzeAudioQuality(audioData: ArrayBuffer): Promise<{
    snr: number;
    clarity: number;
    volume: number;
  }> {
    return new Promise((resolve) => {
      // Simplified audio quality analysis
      // In reality, this would perform FFT analysis
      resolve({
        snr: Math.random() * 30 + 10, // dB
        clarity: Math.random() * 0.3 + 0.7, // 0-1
        volume: Math.random() * 0.5 + 0.3 // 0-1
      });
    });
  }

  // Adaptive audio settings based on environment
  adaptToEnvironment(noiseLevel: 'quiet' | 'normal' | 'noisy'): void {
    const adaptations = {
      quiet: { volume: 0.6, speed: 0.9 },
      normal: { volume: 0.8, speed: 1.0 },
      noisy: { volume: 1.0, speed: 0.8 }
    };

    const settings = adaptations[noiseLevel];
    this.config.ttsVolume = settings.volume;
    this.config.ttsSpeed = settings.speed;
  }

  // Save current settings
  exportSettings(): AudioConfig {
    return { ...this.config };
  }

  // Load settings
  importSettings(config: Partial<AudioConfig>): void {
    Object.assign(this.config, config);
  }

  // Cleanup
  destroy(): void {
    this.stopSpeaking();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
