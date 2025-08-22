/**
 * Guido Voice Control - Frontend JavaScript with Speech API Integration
 */

(function() {
    'use strict';

    // Global state
    const state = {
        isListening: false,
        isRecording: false,
        isProcessing: false,
        currentLanguage: 'de-DE',
        recognition: null,
        synthesis: window.speechSynthesis,
        config: null,
        stats: {
            sessions: 0,
            duration: 0,
            accuracy: 0,
            commands: 0
        },
        audioContext: null,
        mediaStream: null
    };

    // VSCode API
    const vscode = acquireVsCodeApi();

    // DOM Elements
    const elements = {
        // Status
        statusDot: document.getElementById('statusDot'),
        statusText: document.getElementById('statusText'),
        mainStatus: document.getElementById('mainStatus'),
        wakeWordDisplay: document.getElementById('wakeWordDisplay'),
        waveform: document.getElementById('waveform'),
        
        // Controls
        startBtn: document.getElementById('startBtn'),
        stopBtn: document.getElementById('stopBtn'),
        muteBtn: document.getElementById('muteBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        
        // Transcript
        transcriptSection: document.getElementById('transcriptSection'),
        liveTranscript: document.getElementById('liveTranscript'),
        confidenceLevel: document.getElementById('confidenceLevel'),
        confidenceProgress: document.getElementById('confidenceProgress'),
        
        // Response
        responseSection: document.getElementById('responseSection'),
        aiResponse: document.getElementById('aiResponse'),
        responseModel: document.getElementById('responseModel'),
        responseDuration: document.getElementById('responseDuration'),
        responseCost: document.getElementById('responseCost'),
        repeatBtn: document.getElementById('repeatBtn'),
        copyBtn: document.getElementById('copyBtn'),
        insertBtn: document.getElementById('insertBtn'),
        
        // Settings
        settingsSection: document.getElementById('settingsSection'),
        languageSelect: document.getElementById('languageSelect'),
        voiceSelect: document.getElementById('voiceSelect'),
        speedSlider: document.getElementById('speedSlider'),
        speedValue: document.getElementById('speedValue'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeValue: document.getElementById('volumeValue'),
        beepToggle: document.getElementById('beepToggle'),
        ttsToggle: document.getElementById('ttsToggle'),
        
        // Stats
        statsSection: document.getElementById('statsSection'),
        totalSessions: document.getElementById('totalSessions'),
        totalDuration: document.getElementById('totalDuration'),
        avgAccuracy: document.getElementById('avgAccuracy'),
        commandCount: document.getElementById('commandCount'),
        
        // Debug
        debugSection: document.getElementById('debugSection'),
        debugLog: document.getElementById('debugLog'),
        clearLogBtn: document.getElementById('clearLogBtn'),
        exportLogBtn: document.getElementById('exportLogBtn'),
        
        // Modal
        confirmationModal: document.getElementById('confirmationModal'),
        confirmationText: document.getElementById('confirmationText'),
        originalText: document.getElementById('originalText'),
        confirmYes: document.getElementById('confirmYes'),
        confirmNo: document.getElementById('confirmNo'),
        
        // Loading
        loadingOverlay: document.getElementById('loadingOverlay'),
        loadingText: document.getElementById('loadingText'),
        
        // Footer
        connectionStatus: document.getElementById('connectionStatus')
    };

    // Check microphone permission
    async function checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (stream) {
                log('✅ Mikrofon-Berechtigung erteilt');
                return true;
            }
        } catch (error) {
            log('❌ Mikrofon-Berechtigung verweigert: ' + error.message);
            vscode.postMessage({ command: 'microphonePermissionDenied', error: error.message });
            return false;
        }
    }

    // Initialize
    async function init() {
        console.log('🎤 Guido Voice Control initializing...');

        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
            log('Voice Control wird deaktiviert, da keine Mikrofon-Berechtigung vorliegt.');
            return;
        }

        setupEventListeners();
        setupSpeechRecognition();
        loadAvailableVoices();
        updateConnectionStatus(true);

        log('Voice Control initialized');
    }

    // Event Listeners Setup
    function setupEventListeners() {
        // Control buttons
        elements.startBtn.addEventListener('click', startListening);
        elements.stopBtn.addEventListener('click', stopListening);
        elements.muteBtn.addEventListener('click', toggleMute);
        elements.settingsBtn.addEventListener('click', toggleSettings);
        
        // Response actions
        elements.repeatBtn.addEventListener('click', repeatLastResponse);
        elements.copyBtn.addEventListener('click', copyResponse);
        elements.insertBtn.addEventListener('click', insertResponse);
        
        // Settings
        elements.languageSelect.addEventListener('change', changeLanguage);
        elements.voiceSelect.addEventListener('change', changeVoice);
        elements.speedSlider.addEventListener('input', updateSpeed);
        elements.volumeSlider.addEventListener('input', updateVolume);
        elements.beepToggle.addEventListener('change', toggleBeep);
        elements.ttsToggle.addEventListener('change', toggleTTS);
        
        // Debug
        elements.clearLogBtn?.addEventListener('click', clearDebugLog);
        elements.exportLogBtn?.addEventListener('click', exportDebugLog);
        
        // Confirmation modal
        elements.confirmYes.addEventListener('click', confirmAction);
        elements.confirmNo.addEventListener('click', cancelAction);
        
        // VSCode message handling
        window.addEventListener('message', handleVSCodeMessage);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
        
        // Page visibility for cleanup
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Speech Recognition Setup
    function setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            showError('Speech Recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        
        state.recognition.continuous = true;
        state.recognition.interimResults = true;
        state.recognition.lang = state.currentLanguage;
        
        // Recognition event handlers
        state.recognition.onstart = function() {
            log('Speech recognition started');
            updateStatus('listening', 'Höre zu...');
        };
        
        state.recognition.onresult = function(event) {
            handleRecognitionResult(event);
        };
        
        state.recognition.onerror = function(event) {
            handleRecognitionError(event);
        };
        
        state.recognition.onend = function() {
            log('Speech recognition ended');
            if (state.isListening && !state.isProcessing) {
                // Auto-restart if still in listening mode
                setTimeout(() => {
                    if (state.isListening) {
                        state.recognition.start();
                    }
                }, 100);
            }
        };
    }

    // Recognition Result Handler
    function handleRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                finalTranscript += transcript;
                confidence = result[0].confidence;
            } else {
                interimTranscript += transcript;
            }
        }

        // Update live transcript
        const displayText = finalTranscript + (interimTranscript ? ' ' + interimTranscript : '');
        elements.liveTranscript.textContent = displayText || 'Hört zu...';
        
        // Update confidence indicator
        if (confidence > 0) {
            updateConfidence(confidence);
        }

        // Check for wake word
        if (!state.isRecording && state.config) {
            const fullText = (finalTranscript + interimTranscript).toLowerCase();
            const wakeWords = [state.config.wakeWord.toLowerCase(), ...state.config.alternativeWakeWords.map(w => w.toLowerCase())];
            
            for (const wakeWord of wakeWords) {
                if (fullText.includes(wakeWord)) {
                    onWakeWordDetected();
                    break;
                }
            }
        }

        // Check for stop words during recording
        if (state.isRecording && finalTranscript && state.config) {
            const transcript = finalTranscript.toLowerCase();
            const stopWords = state.config.recording.stopWords[getCurrentLanguageCode()] || [];
            
            for (const stopWord of stopWords) {
                if (transcript.includes(stopWord.toLowerCase())) {
                    stopRecording(finalTranscript, confidence);
                    return;
                }
            }
        }

        // Handle confirmation responses
        if (state.isConfirming && finalTranscript) {
            handleConfirmationResponse(finalTranscript);
        }

        // Auto-stop recording after final result
        if (state.isRecording && finalTranscript && !interimTranscript) {
            setTimeout(() => {
                if (state.isRecording) {
                    stopRecording(finalTranscript, confidence);
                }
            }, 2000);
        }
    }

    // Wake Word Detection
    function onWakeWordDetected() {
        if (state.isRecording || state.isProcessing) {
            return;
        }

        log('Wake word detected!');
        playBeep();
        startRecording();
        
        // Notify extension
        vscode.postMessage({
            command: 'wakeWordDetected',
            timestamp: Date.now()
        });
    }

    // Start Recording
    function startRecording() {
        state.isRecording = true;
        updateStatus('recording', '🔴 Aufnahme läuft - sagen Sie "stop" zum Beenden');
        showWaveform();
        
        // Set recording timeout
        const timeout = state.config?.recording?.timeoutSeconds || 30;
        setTimeout(() => {
            if (state.isRecording) {
                stopRecording('', 0, 'timeout');
            }
        }, timeout * 1000);
        
        log('Recording started');
    }

    // Stop Recording
    function stopRecording(transcript, confidence, reason = 'manual') {
        if (!state.isRecording) {
            return;
        }

        state.isRecording = false;
        hideWaveform();
        updateStatus('processing', '🧠 Verarbeitung läuft...');
        
        log(`Recording stopped (${reason}): "${transcript}"`);
        
        // Notify extension
        vscode.postMessage({
            command: 'recordingStopped',
            transcript: transcript,
            confidence: confidence,
            reason: reason,
            timestamp: Date.now()
        });
        
        state.stats.sessions++;
        updateStats();
    }

    // Handle Recognition Errors
    function handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        log(`Recognition error: ${event.error}`);
        
        switch (event.error) {
            case 'no-speech':
                if (state.isRecording) {
                    showError('Keine Sprache erkannt');
                }
                break;
            case 'audio-capture':
                showError('Mikrofon-Zugriff fehlgeschlagen');
                break;
            case 'not-allowed':
                showError('Mikrofon-Berechtigung erforderlich');
                break;
            case 'network':
                showError('Netzwerk-Fehler bei Spracherkennung');
                break;
            default:
                showError(`Spracherkennungs-Fehler: ${event.error}`);
        }
        
        // Reset state
        if (state.isRecording) {
            state.isRecording = false;
            hideWaveform();
        }
        
        updateStatus('error', 'Fehler bei Spracherkennung');
    }

    // Control Functions
    function startListening() {
        if (state.isListening) {
            return;
        }

        try {
            state.isListening = true;
            state.recognition.start();
            
            elements.startBtn.disabled = true;
            elements.stopBtn.disabled = false;
            
            updateStatus('listening', `Höre auf "${state.config?.wakeWord || 'Guido'}"...`);
            
            log('Listening started');
            
        } catch (error) {
            console.error('Failed to start listening:', error);
            showError('Fehler beim Starten der Spracherkennung');
            state.isListening = false;
        }
    }

    function stopListening() {
        if (!state.isListening) {
            return;
        }

        state.isListening = false;
        state.isRecording = false;
        
        if (state.recognition) {
            state.recognition.stop();
        }
        
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
        
        updateStatus('idle', 'Gestoppt');
        hideWaveform();
        
        log('Listening stopped');
    }

    function toggleMute() {
        // Implementation would depend on audio context
        const isMuted = elements.muteBtn.textContent.includes('🔇');
        
        if (isMuted) {
            elements.muteBtn.innerHTML = '<span class="btn-icon">🔇</span>Stumm';
            // Unmute logic
        } else {
            elements.muteBtn.innerHTML = '<span class="btn-icon">🔊</span>An';
            // Mute logic
        }
        
        log(`Audio ${isMuted ? 'unmuted' : 'muted'}`);
    }

    function toggleSettings() {
        elements.settingsSection.classList.toggle('collapsed');
        const isCollapsed = elements.settingsSection.classList.contains('collapsed');
        elements.settingsBtn.innerHTML = `<span class="btn-icon">${isCollapsed ? '⚙️' : '✖️'}</span>${isCollapsed ? 'Settings' : 'Schließen'}`;
    }

    // Settings Functions
    function changeLanguage() {
        const newLanguage = elements.languageSelect.value;
        state.currentLanguage = newLanguage;
        
        if (state.recognition) {
            state.recognition.lang = newLanguage;
        }
        
        log(`Language changed to: ${newLanguage}`);
        
        // Notify extension
        vscode.postMessage({
            command: 'languageChanged',
            language: newLanguage
        });
    }

    function changeVoice() {
        const voiceId = elements.voiceSelect.value;
        log(`Voice changed to: ${voiceId}`);
        
        // Notify extension
        vscode.postMessage({
            command: 'voiceChanged',
            voiceId: voiceId
        });
    }

    function updateSpeed() {
        const speed = parseFloat(elements.speedSlider.value);
        elements.speedValue.textContent = `${speed}x`;
        
        // Notify extension
        vscode.postMessage({
            command: 'speedChanged',
            speed: speed
        });
    }

    function updateVolume() {
        const volume = parseFloat(elements.volumeSlider.value);
        elements.volumeValue.textContent = `${Math.round(volume * 100)}%`;
        
        // Notify extension
        vscode.postMessage({
            command: 'volumeChanged',
            volume: volume
        });
    }

    function toggleBeep() {
        const enabled = elements.beepToggle.checked;
        
        // Notify extension
        vscode.postMessage({
            command: 'beepToggled',
            enabled: enabled
        });
    }

    function toggleTTS() {
        const enabled = elements.ttsToggle.checked;
        
        // Notify extension
        vscode.postMessage({
            command: 'ttsToggled',
            enabled: enabled
        });
    }

    // Response Functions
    function repeatLastResponse() {
        if (elements.aiResponse.textContent && elements.aiResponse.textContent !== 'Bereit für Ihre Frage...') {
            speakText(elements.aiResponse.textContent);
        }
    }

    function copyResponse() {
        const text = elements.aiResponse.textContent;
        if (text && text !== 'Bereit für Ihre Frage...') {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Antwort kopiert!');
            }).catch(() => {
                showError('Kopieren fehlgeschlagen');
            });
        }
    }

    function insertResponse() {
        const text = elements.aiResponse.textContent;
        if (text && text !== 'Bereit für Ihre Frage...') {
            vscode.postMessage({
                command: 'insertText',
                text: text
            });
        }
    }

    // TTS Function
    function speakText(text, options = {}) {
        if (!state.synthesis || !text) {
            return;
        }

        // Cancel any ongoing speech
        state.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = state.currentLanguage;
        utterance.rate = parseFloat(elements.speedSlider.value) || 1.0;
        utterance.volume = parseFloat(elements.volumeSlider.value) || 0.8;
        
        // Apply custom voice if selected
        const selectedVoice = elements.voiceSelect.value;
        if (selectedVoice && selectedVoice !== 'auto') {
            const voices = state.synthesis.getVoices();
            const voice = voices.find(v => v.name === selectedVoice || v.voiceURI === selectedVoice);
            if (voice) {
                utterance.voice = voice;
            }
        }

        utterance.onstart = () => {
            log('TTS started');
        };

        utterance.onend = () => {
            log('TTS finished');
        };

        utterance.onerror = (event) => {
            console.error('TTS error:', event);
            log(`TTS error: ${event.error}`);
        };

        state.synthesis.speak(utterance);
    }

    // Audio Functions
    function playBeep() {
        if (!state.config?.audio?.enableBeep) {
            return;
        }

        try {
            // Create beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // 800Hz tone
            gainNode.gain.value = state.config.audio.beepVolume || 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + (state.config.audio.beepDuration || 200) / 1000);

            log('Beep played');
        } catch (error) {
            console.error('Failed to play beep:', error);
        }
    }

    // UI Update Functions
    function updateStatus(type, message) {
        elements.statusDot.className = `status-dot ${type}`;
        elements.statusText.textContent = getStatusText(type);
        elements.mainStatus.className = `status-card ${type}`;
        
        const emoji = getStatusEmoji(type);
        elements.mainStatus.querySelector('.status-emoji').textContent = emoji;
        elements.mainStatus.querySelector('.status-message').innerHTML = message || getDefaultStatusMessage(type);
        
        // Notify extension of state change
        vscode.postMessage({
            command: 'stateChanged',
            state: type,
            message: message
        });
    }

    function updateConfidence(confidence) {
        const percentage = Math.round(confidence * 100);
        elements.confidenceLevel.textContent = `${percentage}%`;
        elements.confidenceProgress.style.width = `${percentage}%`;
    }

    function showWaveform() {
        elements.waveform.classList.remove('hidden');
    }

    function hideWaveform() {
        elements.waveform.classList.add('hidden');
    }

    function updateStats() {
        elements.totalSessions.textContent = state.stats.sessions;
        elements.totalDuration.textContent = formatDuration(state.stats.duration);
        elements.avgAccuracy.textContent = state.stats.accuracy > 0 ? `${state.stats.accuracy}%` : '--';
        elements.commandCount.textContent = state.stats.commands;
    }

    // Voice Management
    function loadAvailableVoices() {
        const voices = state.synthesis.getVoices();
        
        if (voices.length === 0) {
            // Voices might not be loaded yet
            state.synthesis.onvoiceschanged = loadAvailableVoices;
            return;
        }

        elements.voiceSelect.innerHTML = '<option value="auto">Automatisch</option>';
        
        // Group voices by language
        const languageGroups = {};
        voices.forEach(voice => {
            const lang = voice.lang.split('-')[0];
            if (!languageGroups[lang]) {
                languageGroups[lang] = [];
            }
            languageGroups[lang].push(voice);
        });

        // Add voices to select
        Object.entries(languageGroups).forEach(([lang, voiceList]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = getLanguageName(lang);
            
            voiceList.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} ${voice.localService ? '(lokal)' : '(online)'}`;
                optgroup.appendChild(option);
            });
            
            elements.voiceSelect.appendChild(optgroup);
        });

        log(`Loaded ${voices.length} voices`);
    }

    // Confirmation Modal
    function showConfirmationModal(data) {
        elements.confirmationText.textContent = data.confirmationText || 'Soll ich das ausführen?';
        elements.originalText.textContent = data.originalText || '';
        elements.confirmationModal.classList.remove('hidden');
        
        // Store original text for confirmation
        elements.confirmationModal.dataset.originalText = data.originalText || '';
        
        log('Confirmation modal shown');
    }

    function hideConfirmationModal() {
        elements.confirmationModal.classList.add('hidden');
        elements.confirmationModal.dataset.originalText = '';
    }

    function confirmAction() {
        const originalText = elements.confirmationModal.dataset.originalText;
        hideConfirmationModal();
        
        vscode.postMessage({
            command: 'confirmationReceived',
            confirmed: true,
            originalText: originalText
        });
        
        log('Action confirmed');
    }

    function cancelAction() {
        hideConfirmationModal();
        
        vscode.postMessage({
            command: 'confirmationReceived',
            confirmed: false,
            originalText: ''
        });
        
        log('Action cancelled');
    }

    // Handle confirmation during voice input
    function handleConfirmationResponse(transcript) {
        const text = transcript.toLowerCase();
        const confirmWords = state.config?.confirmation?.confirmWords?.[getCurrentLanguageCode()] || ['ja', 'yes'];
        const cancelWords = state.config?.confirmation?.cancelWords?.[getCurrentLanguageCode()] || ['nein', 'no'];
        
        const isConfirm = confirmWords.some(word => text.includes(word.toLowerCase()));
        const isCancel = cancelWords.some(word => text.includes(word.toLowerCase()));
        
        if (isConfirm) {
            confirmAction();
        } else if (isCancel) {
            cancelAction();
        }
        
        state.isConfirming = false;
    }

    // VSCode Message Handling
    function handleVSCodeMessage(event) {
        const message = event.data;
        
        switch (message.command) {
            case 'configure':
                state.config = message.config;
                applyConfiguration();
                break;
                
            case 'showResponse':
                showResponse(message.data);
                break;
                
            case 'showConfirmation':
                showConfirmationModal(message.data);
                state.isConfirming = true;
                break;
                
            case 'updateStats':
                state.stats = { ...state.stats, ...message.stats };
                updateStats();
                break;
                
            case 'stateChanged':
                if (message.state) {
                    updateStatus(message.state, '');
                }
                break;
                
            case 'error':
                showError(message.error);
                break;
                
            case 'showLoading':
                showLoading(message.text);
                break;
                
            case 'hideLoading':
                hideLoading();
                break;
                
            default:
                log(`Unknown command: ${message.command}`);
        }
    }

    function applyConfiguration() {
        if (!state.config) return;
        
        // Update wake word display
        elements.wakeWordDisplay.textContent = state.config.wakeWord;
        
        // Update language
        elements.languageSelect.value = state.config.language.recognition;
        state.currentLanguage = state.config.language.recognition;
        
        // Update audio settings
        elements.speedSlider.value = state.config.audio.speed;
        elements.speedValue.textContent = `${state.config.audio.speed}x`;
        elements.volumeSlider.value = state.config.audio.volume;
        elements.volumeValue.textContent = `${Math.round(state.config.audio.volume * 100)}%`;
        elements.beepToggle.checked = state.config.audio.enableBeep;
        elements.ttsToggle.checked = state.config.audio.ttsEnabled;
        
        // Show debug section if enabled
        if (state.config.emergency?.debugMode) {
            elements.debugSection.style.display = 'block';
        }
        
        log('Configuration applied');
    }

    function showResponse(data) {
        elements.aiResponse.textContent = data.text;
        
        // Update metadata
        if (data.metadata) {
            elements.responseModel.textContent = `🤖 ${data.metadata.provider}:${data.metadata.model}`;
            elements.responseDuration.textContent = `⏱️ ${data.metadata.duration}ms`;
            elements.responseCost.textContent = `💰 $${data.metadata.cost.toFixed(4)}`;
        }
        
        // Auto-scroll to response
        elements.responseSection.scrollIntoView({ behavior: 'smooth' });
        
        updateStatus('idle', 'Bereit für nächste Eingabe');
        
        log('Response displayed');
    }

    // Utility Functions
    function showError(message) {
        console.error(message);
        log(`ERROR: ${message}`);
        updateStatus('error', message);
        
        // Show as notification if possible
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Guido Voice Control - Fehler', {
                body: message,
                icon: '🎤'
            });
        }
    }

    function showNotification(message) {
        log(`NOTIFICATION: ${message}`);
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Guido Voice Control', {
                body: message,
                icon: '🎤'
            });
        }
    }

    function showLoading(text = 'Verarbeitung läuft...') {
        elements.loadingText.textContent = text;
        elements.loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        elements.loadingOverlay.classList.add('hidden');
    }

    function log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (elements.debugLog) {
            elements.debugLog.textContent += logMessage + '\n';
            elements.debugLog.scrollTop = elements.debugLog.scrollHeight;
        }
    }

    function clearDebugLog() {
        if (elements.debugLog) {
            elements.debugLog.textContent = '';
        }
    }

    function exportDebugLog() {
        if (elements.debugLog) {
            const logContent = elements.debugLog.textContent;
            const blob = new Blob([logContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `guido-voice-log-${new Date().toISOString().slice(0, 10)}.txt`;
            a.click();
            
            URL.revokeObjectURL(url);
        }
    }

    // Keyboard Shortcuts
    function handleKeyboardShortcuts(event) {
        // Alt + F4 - Panic mode (emergency stop)
        if (event.altKey && event.key === 'F4') {
            event.preventDefault();
            stopListening();
            hideConfirmationModal();
            hideLoading();
            log('PANIC MODE ACTIVATED');
            return;
        }
        
        // Space - Toggle listening (when not in input field)
        if (event.code === 'Space' && !event.target.matches('input, select, textarea')) {
            event.preventDefault();
            if (state.isListening) {
                stopListening();
            } else {
                startListening();
            }
            return;
        }
        
        // Escape - Cancel current operation
        if (event.key === 'Escape') {
            if (!elements.confirmationModal.classList.contains('hidden')) {
                cancelAction();
            } else if (state.isRecording) {
                stopRecording('', 0, 'cancelled');
            }
            return;
        }
    }

    function handleVisibilityChange() {
        if (document.hidden) {
            // Page hidden - reduce activity
            log('Page hidden, reducing activity');
        } else {
            // Page visible - resume normal operation
            log('Page visible, resuming normal operation');
            updateConnectionStatus(true);
        }
    }

    function updateConnectionStatus(connected) {
        elements.connectionStatus.textContent = connected ? '🟢 Verbunden' : '🔴 Getrennt';
        elements.connectionStatus.style.color = connected ? 'var(--success-color)' : 'var(--danger-color)';
    }

    // Helper Functions
    function getStatusText(type) {
        switch (type) {
            case 'idle': return 'Bereit';
            case 'listening': return 'Hört zu';
            case 'recording': return 'Nimmt auf';
            case 'processing': return 'Verarbeitet';
            case 'error': return 'Fehler';
            default: return 'Unbekannt';
        }
    }

    function getStatusEmoji(type) {
        switch (type) {
            case 'idle': return '🎯';
            case 'listening': return '👂';
            case 'recording': return '🔴';
            case 'processing': return '🧠';
            case 'error': return '❌';
            default: return '❓';
        }
    }

    function getDefaultStatusMessage(type) {
        switch (type) {
            case 'idle': return 'Sagen Sie "Guido" um zu beginnen';
            case 'listening': return 'Höre zu...';
            case 'recording': return 'Aufnahme läuft...';
            case 'processing': return 'Verarbeite Eingabe...';
            case 'error': return 'Ein Fehler ist aufgetreten';
            default: return 'Status unbekannt';
        }
    }

    function getCurrentLanguageCode() {
        return state.currentLanguage.split('-')[0];
    }

    function getLanguageName(code) {
        const names = {
            'de': 'Deutsch',
            'en': 'English',
            'fr': 'Français',
            'es': 'Español',
            'it': 'Italiano'
        };
        return names[code] || code;
    }

    function formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging
    window.guidoVoiceControl = {
        state,
        startListening,
        stopListening,
        playBeep,
        speakText,
        log
    };

})();
