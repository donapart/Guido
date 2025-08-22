/**
 * Audio Manager - Handles TTS, beeps, and audio processing for Guido Voice Control
 */
import { BeepSound, TTSOptions, VoiceConfig } from "../types";
export declare class AudioManager {
    private config;
    private audioContext?;
    private synthesis;
    private currentUtterance?;
    private isMuted;
    private masterVolume;
    private beepProfiles;
    constructor(config: VoiceConfig);
    /**
     * Initialize audio system
     */
    initialize(): Promise<void>;
    /**
     * Text-to-Speech functionality
     */
    speak(options: TTSOptions): Promise<void>;
    /**
     * Stop current speech
     */
    stopSpeaking(): void;
    /**
     * Pause current speech
     */
    pauseSpeaking(): void;
    /**
     * Resume paused speech
     */
    resumeSpeaking(): void;
    /**
     * Play confirmation beep
     */
    playBeep(sound?: BeepSound, volume?: number, duration?: number): Promise<void>;
    /**
     * Play notification sound
     */
    playNotificationSound(type: 'info' | 'success' | 'warning' | 'error'): Promise<void>;
    /**
     * Set master volume
     */
    setVolume(volume: number): void;
    /**
     * Get current volume
     */
    getVolume(): number;
    /**
     * Mute all audio
     */
    mute(): void;
    /**
     * Unmute audio
     */
    unmute(): void;
    /**
     * Check if audio is muted
     */
    isMutedState(): boolean;
    /**
     * Get available voices
     */
    getAvailableVoices(): SpeechSynthesisVoice[];
    /**
     * Find best voice for language and preferences
     */
    findBestVoice(language: string, gender?: string): SpeechSynthesisVoice | null;
    /**
     * Test voice with sample text
     */
    testVoice(voice: SpeechSynthesisVoice, sampleText?: string): Promise<void>;
    /**
     * Create audio visualizer data (for waveform display)
     */
    createAudioVisualizer(): AudioAnalyser | null;
    /**
     * Clean up resources
     */
    destroy(): Promise<void>;
    private configureUtterance;
    private findVoiceByName;
    private loadVoices;
    private getSampleTextForLanguage;
    private playTone;
    private sleep;
}
interface AudioAnalyser {
    analyser: AnalyserNode;
    bufferLength: number;
    dataArray: Uint8Array;
}
export declare class AudioProcessor {
    /**
     * Apply noise reduction to audio data
     */
    static applyNoiseReduction(audioData: Float32Array, threshold?: number): Float32Array;
    /**
     * Apply automatic gain control
     */
    static applyAutoGainControl(audioData: Float32Array, targetLevel?: number): Float32Array;
    /**
     * Detect silence in audio data
     */
    static detectSilence(audioData: Float32Array, threshold?: number): boolean;
    /**
     * Calculate audio volume level
     */
    static calculateVolumeLevel(audioData: Float32Array): number;
}
export {};
//# sourceMappingURL=audioManager.d.ts.map