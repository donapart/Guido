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
     * Text-to-Speech functionality (Webview communication stub)
     */
    speak(options: TTSOptions): Promise<void>;
    /**
     * Stop current speech (Stub)
     */
    stopSpeaking(): void;
    /**
     * Pause current speech (Stub)
     */
    pauseSpeaking(): void;
    /**
     * Resume paused speech (Stub)
     */
    resumeSpeaking(): void;
    /**
     * Play confirmation beep (Stub - actual implementation in webview)
     */
    playBeep(sound?: BeepSound, volume?: number, duration?: number): Promise<void>;
    /**
   * Play notification sound (Stub)
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
     * Get available voices (Stub)
     */
    getAvailableVoices(): any[];
    /**
     * Find best voice for language and preferences (Stub)
     */
    findBestVoice(language: string, gender?: string): any | null;
    /**
     * Test voice with sample text (Stub)
     */
    testVoice(voice: any, sampleText?: string): Promise<void>;
    /**
     * Create audio visualizer data (Stub)
     */
    createAudioVisualizer(): any | null;
    /**
     * Clean up resources (Stub)
     */
    destroy(): Promise<void>;
    private configureUtterance;
    private findVoiceByName;
    private loadVoices;
    private getSampleTextForLanguage;
    private playTone;
    private sleep;
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
//# sourceMappingURL=audioManager.d.ts.map