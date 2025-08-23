/**
 * Experimentelle UI-Komponenten für Guido Voice Control
 * Emotionale Visualisierung, Kontext-Anzeige und adaptives Interface
 */
import * as vscode from 'vscode';
import { Intent } from '../experimental/naturalLanguageProcessor';
export interface ExperimentalUIState {
    emotionIndicator: string;
    emotionColor: string;
    confidence: number;
    contextInfo: ContextInfo;
    interfaceMode: string;
    experimentalFeatures: ExperimentalFeatures;
}
export interface ContextInfo {
    project: string;
    file: string;
    userExpertise: string;
    recentCommands: string[];
}
export interface ExperimentalFeatures {
    emotionDetection: boolean;
    contextAwareness: boolean;
    adaptiveInterface: boolean;
    multilingual: boolean;
    personalityAdaptation: boolean;
}
export declare class ExperimentalUI {
    private webview;
    private currentState;
    private emotionColors;
    private interfaceModes;
    constructor(webview: vscode.WebviewPanel);
    private initializeExperimentalUI;
    private setupEmotionColors;
    private setupInterfaceModes;
    private getDefaultState;
    /**
     * Emotionale Visualisierung
     */
    showEmotionVisualization(emotion: string, confidence: number): void;
    /**
     * Kontext-Anzeige
     */
    showContextInfo(context: any): void;
    /**
     * Adaptives Interface
     */
    adaptInterface(userBehavior: any): void;
    /**
     * Experimentelle Features aktivieren/deaktivieren
     */
    toggleExperimentalFeature(feature: keyof ExperimentalFeatures, enabled: boolean): void;
    /**
     * Intent-Visualisierung
     */
    showIntentVisualization(intent: Intent): void;
    /**
     * Performance-Metriken anzeigen
     */
    showPerformanceMetrics(metrics: any): void;
    /**
     * Experimentelle Status-Anzeige
     */
    showExperimentalStatus(status: string, type: 'info' | 'warning' | 'error' | 'success'): void;
    /**
     * Adaptive Antworten visualisieren
     */
    showAdaptiveResponse(response: string, personality: any): void;
    /**
     * Mehrsprachige Verarbeitung anzeigen
     */
    showMultilingualProcessing(original: string, detected: string, translated: string): void;
    private updateUI;
    private determineInterfaceMode;
    private sendEmotionToWebview;
    private sendContextToWebview;
    private sendInterfaceModeToWebview;
    private sendFeatureToggleToWebview;
    private sendIntentToWebview;
    private sendMetricsToWebview;
    private sendStatusToWebview;
    private sendAdaptiveResponseToWebview;
    private sendMultilingualToWebview;
    /**
     * Experimentelle CSS-Styles generieren
     */
    generateExperimentalCSS(): string;
    /**
     * Experimentelle HTML-Struktur generieren
     */
    generateExperimentalHTML(): string;
    /**
     * Experimentelle JavaScript-Funktionen generieren
     */
    generateExperimentalJS(): string;
}
//# sourceMappingURL=experimentalUI.d.ts.map