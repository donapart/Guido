"use strict";
/**
 * Advanced Dashboard UI for Model Router
 * Enhanced experimental UI with interactive elements and visualizations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedDashboardUI = void 0;
const vscode = __importStar(require("vscode"));
class AdvancedDashboardUI {
    panel;
    router;
    updateInterval;
    constructor(router) {
        this.router = router;
    }
    createDashboard() {
        this.panel = vscode.window.createWebviewPanel('guidoAdvancedDashboard', '🚀 Guido Advanced Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.file(__dirname)]
        });
        this.panel.webview.html = this.generateDashboardHTML();
        this.setupMessageHandling();
        // Auto-update every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateDashboard();
        }, 30000);
        this.panel.onDidDispose(() => {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
        });
    }
    generateDashboardHTML() {
        return `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Guido Advanced Dashboard</title>
        <style>
            ${this.generateDashboardCSS()}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body>
        <div class="dashboard-container">
            <header class="dashboard-header">
                <h1>🚀 Guido Advanced Dashboard</h1>
                <div class="status-indicators">
                    <div class="status-item" id="connectionStatus">
                        <span class="status-dot offline"></span>
                        <span>Verbindungsstatus</span>
                    </div>
                    <div class="status-item" id="budgetStatus">
                        <span class="budget-indicator">€0.00</span>
                        <span>Tagesbudget</span>
                    </div>
                </div>
            </header>

            <div class="dashboard-grid">
                <!-- Routing Visualization -->
                <div class="dashboard-card routing-card">
                    <h2>🎯 Routing Visualizer</h2>
                    <div class="routing-input">
                        <input type="text" id="routingPrompt" placeholder="Prompt eingeben für Routing-Analyse...">
                        <button onclick="analyzeRouting()">Analysieren</button>
                    </div>
                    <div id="routingVisualization" class="routing-viz">
                        <p>Geben Sie einen Prompt ein, um die Routing-Regeln zu visualisieren</p>
                    </div>
                </div>

                <!-- Usage Statistics -->
                <div class="dashboard-card stats-card">
                    <h2>📊 Nutzungsstatistiken</h2>
                    <div class="stats-tabs">
                        <button class="tab-button active" onclick="showStatsTab('daily')">Täglich</button>
                        <button class="tab-button" onclick="showStatsTab('weekly')">Wöchentlich</button>
                        <button class="tab-button" onclick="showStatsTab('monthly')">Monatlich</button>
                    </div>
                    <div id="statsContent" class="stats-content">
                        <canvas id="usageChart" width="400" height="200"></canvas>
                        <div class="stats-summary">
                            <div class="stat-item">
                                <span class="stat-value" id="dailyRequests">0</span>
                                <span class="stat-label">Anfragen heute</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="dailyCost">€0.00</span>
                                <span class="stat-label">Kosten heute</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value" id="dailyTokens">0</span>
                                <span class="stat-label">Tokens heute</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Cost Breakdown -->
                <div class="dashboard-card cost-card">
                    <h2>💰 Kostenschlüsselung</h2>
                    <canvas id="costChart" width="300" height="300"></canvas>
                    <div class="cost-details" id="costDetails">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Model Performance -->
                <div class="dashboard-card performance-card">
                    <h2>⚡ Model Performance</h2>
                    <div class="performance-list" id="performanceList">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Ollama Model Manager -->
                <div class="dashboard-card ollama-card">
                    <h2>🦙 Ollama Model Manager</h2>
                    <div class="ollama-controls">
                        <input type="text" id="modelSearch" placeholder="Modell suchen...">
                        <button onclick="refreshOllamaModels()">🔄 Aktualisieren</button>
                        <button onclick="showPullModelDialog()">⬇️ Modell herunterladen</button>
                    </div>
                    <div id="ollamaModels" class="model-grid">
                        <!-- Dynamically populated -->
                    </div>
                </div>

                <!-- Router Configuration -->
                <div class="dashboard-card config-card">
                    <h2>⚙️ Router Konfiguration</h2>
                    <div class="config-editor">
                        <div class="config-section">
                            <label>Aktiver Modus:</label>
                            <select id="routerMode" onchange="updateRouterMode()">
                                <option value="auto">Automatisch</option>
                                <option value="speed">Geschwindigkeit</option>
                                <option value="quality">Qualität</option>
                                <option value="cheap">Kostengünstig</option>
                                <option value="local-only">Nur lokal</option>
                                <option value="privacy-strict">Strenger Datenschutz</option>
                            </select>
                        </div>
                        <div class="config-section">
                            <label>Tagesbudget (€):</label>
                            <input type="number" id="dailyBudget" min="0" step="0.01" onchange="updateBudget()">
                        </div>
                        <div class="config-section">
                            <label>Provider aktiviert:</label>
                            <div id="providerToggles" class="provider-toggles">
                                <!-- Dynamically populated -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Live Monitoring -->
                <div class="dashboard-card monitoring-card">
                    <h2>📡 Live Monitoring</h2>
                    <div class="monitoring-content">
                        <div class="metric">
                            <span class="metric-label">Aktive Verbindungen:</span>
                            <span class="metric-value" id="activeConnections">0</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Durchschnittliche Antwortzeit:</span>
                            <span class="metric-value" id="avgResponseTime">0ms</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Erfolgsrate:</span>
                            <span class="metric-value" id="successRate">100%</span>
                        </div>
                        <div class="activity-log" id="activityLog">
                            <h4>Aktivitätsprotokoll</h4>
                            <div class="log-entries" id="logEntries">
                                <!-- Real-time log entries -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal Dialogs -->
        <div id="pullModelModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closePullModelDialog()">&times;</span>
                <h3>Ollama Modell herunterladen</h3>
                <input type="text" id="pullModelName" placeholder="Modellname (z.B. llama2:7b)">
                <div class="modal-actions">
                    <button onclick="pullOllamaModel()">Herunterladen</button>
                    <button onclick="closePullModelDialog()">Abbrechen</button>
                </div>
                <div id="pullProgress" class="progress-container" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="pullProgressFill"></div>
                    </div>
                    <div class="progress-text" id="pullProgressText"></div>
                </div>
            </div>
        </div>

        <script>
            ${this.generateDashboardJS()}
        </script>
    </body>
    </html>`;
    }
    generateDashboardCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            line-height: 1.6;
        }

        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 10px;
            border: 1px solid var(--vscode-panel-border);
        }

        .dashboard-header h1 {
            color: var(--vscode-textLink-foreground);
            font-size: 2em;
            font-weight: 600;
        }

        .status-indicators {
            display: flex;
            gap: 20px;
        }

        .status-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--vscode-errorLens-errorBackground);
        }

        .status-dot.online {
            background: var(--vscode-testing-iconPassed);
        }

        .budget-indicator {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }

        .dashboard-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            padding: 20px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .dashboard-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dashboard-card h2 {
            margin-bottom: 15px;
            color: var(--vscode-textLink-foreground);
            font-size: 1.3em;
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 5px;
        }

        .routing-input {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .routing-input input {
            flex: 1;
            padding: 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 5px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        .routing-input button, button {
            padding: 10px 20px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .routing-input button:hover, button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        .routing-viz {
            min-height: 200px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 15px;
        }

        .rule-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: var(--vscode-editor-background);
            border-radius: 5px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }

        .rule-item.matched {
            border-left-color: var(--vscode-testing-iconPassed);
            background: rgba(0, 255, 0, 0.1);
        }

        .rule-score {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 20px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .stats-tabs {
            display: flex;
            margin-bottom: 20px;
        }

        .tab-button {
            flex: 1;
            padding: 10px;
            border: none;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }

        .tab-button.active {
            border-bottom-color: var(--vscode-textLink-foreground);
            background: var(--vscode-editor-inactiveSelectionBackground);
        }

        .stats-summary {
            display: flex;
            justify-content: space-around;
            margin-top: 20px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            display: block;
            font-size: 1.5em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .stat-label {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }

        .cost-details {
            margin-top: 20px;
        }

        .cost-item {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .performance-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .performance-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: var(--vscode-editor-background);
            border-radius: 5px;
        }

        .performance-metrics {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
        }

        .metric-badge {
            padding: 3px 8px;
            border-radius: 12px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
        }

        .ollama-controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .ollama-controls input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 5px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        .model-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            max-height: 400px;
            overflow-y: auto;
        }

        .model-card {
            padding: 15px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            transition: transform 0.2s;
        }

        .model-card:hover {
            transform: scale(1.02);
        }

        .model-card.running {
            border-left: 4px solid var(--vscode-testing-iconPassed);
        }

        .model-name {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .model-size {
            color: var(--vscode-descriptionForeground);
            font-size: 0.9em;
        }

        .model-actions {
            margin-top: 10px;
            display: flex;
            gap: 5px;
        }

        .model-actions button {
            padding: 5px 10px;
            font-size: 0.8em;
        }

        .config-section {
            margin-bottom: 15px;
        }

        .config-section label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }

        .config-section input, .config-section select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 5px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }

        .provider-toggles {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }

        .provider-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .provider-toggle input[type="checkbox"] {
            width: auto;
        }

        .monitoring-content {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .metric {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            background: var(--vscode-editor-background);
            border-radius: 5px;
        }

        .metric-value {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
        }

        .activity-log {
            margin-top: 15px;
        }

        .log-entries {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 5px;
            padding: 10px;
        }

        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid var(--vscode-panel-border);
            font-size: 0.9em;
        }

        .log-entry:last-child {
            border-bottom: none;
        }

        .log-time {
            color: var(--vscode-descriptionForeground);
        }

        /* Modal Styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
            background-color: var(--vscode-editor-background);
            margin: 15% auto;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 10px;
            width: 400px;
            position: relative;
        }

        .close {
            color: var(--vscode-descriptionForeground);
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
        }

        .close:hover {
            color: var(--vscode-errorForeground);
        }

        .modal-actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .progress-container {
            margin-top: 20px;
        }

        .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--vscode-editor-background);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--vscode-panel-border);
        }

        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-background);
            width: 0%;
            transition: width 0.3s ease;
        }

        .progress-text {
            text-align: center;
            margin-top: 10px;
            font-size: 0.9em;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-header {
                flex-direction: column;
                gap: 15px;
            }
            
            .stats-summary {
                flex-direction: column;
                gap: 10px;
            }
        }

        /* Dark Theme Adjustments */
        @media (prefers-color-scheme: dark) {
            .dashboard-card {
                box-shadow: 0 2px 8px rgba(255, 255, 255, 0.05);
            }
        }
    `;
    }
    generateDashboardJS() {
        return `
        const vscode = acquireVsCodeApi();
        let usageChart, costChart;
        let currentStatsTab = 'daily';

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            initializeCharts();
            loadDashboardData();
            setupEventListeners();
        });

        function initializeCharts() {
            // Usage Chart
            const usageCtx = document.getElementById('usageChart').getContext('2d');
            usageChart = new Chart(usageCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Anfragen',
                        data: [],
                        borderColor: '#0e639c',
                        backgroundColor: 'rgba(14, 99, 156, 0.1)',
                        tension: 0.4
                    }, {
                        label: 'Kosten (€)',
                        data: [],
                        borderColor: '#d73a49',
                        backgroundColor: 'rgba(215, 58, 73, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                        }
                    }
                }
            });

            // Cost Chart
            const costCtx = document.getElementById('costChart').getContext('2d');
            costChart = new Chart(costCtx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#ff6384',
                            '#36a2eb',
                            '#cc65fe',
                            '#ffce56',
                            '#fd6c6c',
                            '#7cb342'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function setupEventListeners() {
            // Listen for messages from extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                    case 'updateStats':
                        updateUsageStats(message.data);
                        break;
                    case 'updateRouting':
                        updateRoutingVisualization(message.data);
                        break;
                    case 'updateOllama':
                        updateOllamaModels(message.data);
                        break;
                    case 'updateConfig':
                        updateConfiguration(message.data);
                        break;
                    case 'logActivity':
                        addLogEntry(message.data);
                        break;
                }
            });
        }

        function loadDashboardData() {
            vscode.postMessage({ type: 'loadStats' });
            vscode.postMessage({ type: 'loadOllamaModels' });
            vscode.postMessage({ type: 'loadConfiguration' });
        }

        function analyzeRouting() {
            const prompt = document.getElementById('routingPrompt').value;
            if (!prompt.trim()) return;

            vscode.postMessage({
                type: 'analyzeRouting',
                prompt: prompt
            });
        }

        function updateRoutingVisualization(data) {
            const viz = document.getElementById('routingVisualization');
            
            let html = \`
                <div class="routing-result">
                    <div class="selected-route">
                        <h4>Ausgewählte Route:</h4>
                        <div class="route-info">
                            <span class="provider">\${data.selectedProvider}</span>
                            <span class="model">\${data.selectedModel}</span>
                            <span class="confidence">Konfidenz: \${(data.confidence * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="routing-rules">
                        <h4>Routing-Regeln:</h4>
                        \${data.rules.map(rule => \`
                            <div class="rule-item \${rule.matched ? 'matched' : ''}">
                                <span class="rule-text">\${rule.rule}</span>
                                <span class="rule-score">\${rule.score.toFixed(2)}</span>
                            </div>
                        \`).join('')}
                    </div>
                    \${data.alternatives.length > 0 ? \`
                        <div class="alternatives">
                            <h4>Alternativen:</h4>
                            \${data.alternatives.map(alt => \`
                                <div class="alternative-item">
                                    <span>\${alt.provider}/\${alt.model}</span>
                                    <span>Score: \${alt.score.toFixed(2)}</span>
                                </div>
                            \`).join('')}
                        </div>
                    \` : ''}
                </div>
            \`;
            
            viz.innerHTML = html;
        }

        function showStatsTab(tab) {
            currentStatsTab = tab;
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector(\`[onclick="showStatsTab('\${tab}')"]\`).classList.add('active');
            
            vscode.postMessage({
                type: 'loadStats',
                period: tab
            });
        }

        function updateUsageStats(data) {
            // Update summary stats
            document.getElementById('dailyRequests').textContent = data.daily.requests;
            document.getElementById('dailyCost').textContent = \`€\${data.daily.cost.toFixed(2)}\`;
            document.getElementById('dailyTokens').textContent = data.daily.tokens.toLocaleString();

            // Update budget indicator
            document.querySelector('.budget-indicator').textContent = \`€\${data.monthly.budgetUsed.toFixed(2)}/\${data.monthly.budget.toFixed(2)}\`;

            // Update usage chart
            if (currentStatsTab === 'weekly' && data.weekly.trends) {
                usageChart.data.labels = data.weekly.trends.map(t => t.date);
                usageChart.data.datasets[0].data = data.weekly.trends.map(t => t.requests);
                usageChart.data.datasets[1].data = data.weekly.trends.map(t => t.cost);
                usageChart.update();
            }

            // Update cost breakdown chart
            const costBreakdown = Object.entries(data.costBreakdown);
            costChart.data.labels = costBreakdown.map(([provider]) => provider);
            costChart.data.datasets[0].data = costBreakdown.map(([, data]) => data.cost);
            costChart.update();

            // Update cost details
            updateCostDetails(data.costBreakdown);

            // Update performance list
            updatePerformanceList(data.topModels);
        }

        function updateCostDetails(breakdown) {
            const container = document.getElementById('costDetails');
            container.innerHTML = Object.entries(breakdown)
                .map(([provider, data]) => \`
                    <div class="cost-item">
                        <span>\${provider}</span>
                        <span>€\${data.cost.toFixed(3)} (\${data.requests} Anfragen)</span>
                    </div>
                \`).join('');
        }

        function updatePerformanceList(models) {
            const container = document.getElementById('performanceList');
            container.innerHTML = models.map(model => \`
                <div class="performance-item">
                    <div>
                        <div class="model-name">\${model.provider}/\${model.model}</div>
                        <div class="performance-metrics">
                            <span class="metric-badge">\${model.usage} Verwendungen</span>
                            <span class="metric-badge">Ø €\${model.avgCost.toFixed(4)}</span>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function refreshOllamaModels() {
            vscode.postMessage({ type: 'refreshOllamaModels' });
        }

        function updateOllamaModels(models) {
            const container = document.getElementById('ollamaModels');
            container.innerHTML = models.map(model => \`
                <div class="model-card \${model.isRunning ? 'running' : ''}">
                    <div class="model-name">\${model.name}</div>
                    <div class="model-size">\${formatSize(model.size)}</div>
                    <div class="model-actions">
                        \${model.isRunning ? 
                            '<button onclick="stopOllamaModel(\\'' + model.name + '\\')">⏹️ Stop</button>' :
                            '<button onclick="startOllamaModel(\\'' + model.name + '\\')">▶️ Start</button>'
                        }
                        <button onclick="deleteOllamaModel('\\'' + model.name + '\\')">🗑️ Löschen</button>
                    </div>
                </div>
            \`).join('');
        }

        function formatSize(bytes) {
            const sizes = ['B', 'KB', 'MB', 'GB'];
            let i = 0;
            while (bytes >= 1024 && i < sizes.length - 1) {
                bytes /= 1024;
                i++;
            }
            return \`\${bytes.toFixed(1)} \${sizes[i]}\`;
        }

        function showPullModelDialog() {
            document.getElementById('pullModelModal').style.display = 'block';
        }

        function closePullModelDialog() {
            document.getElementById('pullModelModal').style.display = 'none';
            document.getElementById('pullProgress').style.display = 'none';
        }

        function pullOllamaModel() {
            const modelName = document.getElementById('pullModelName').value;
            if (!modelName.trim()) return;

            document.getElementById('pullProgress').style.display = 'block';
            vscode.postMessage({
                type: 'pullOllamaModel',
                model: modelName
            });
        }

        function startOllamaModel(modelName) {
            vscode.postMessage({
                type: 'startOllamaModel',
                model: modelName
            });
        }

        function stopOllamaModel(modelName) {
            vscode.postMessage({
                type: 'stopOllamaModel',
                model: modelName
            });
        }

        function deleteOllamaModel(modelName) {
            if (confirm(\`Modell "\${modelName}" wirklich löschen?\`)) {
                vscode.postMessage({
                    type: 'deleteOllamaModel',
                    model: modelName
                });
            }
        }

        function updateRouterMode() {
            const mode = document.getElementById('routerMode').value;
            vscode.postMessage({
                type: 'updateRouterMode',
                mode: mode
            });
        }

        function updateBudget() {
            const budget = parseFloat(document.getElementById('dailyBudget').value);
            vscode.postMessage({
                type: 'updateBudget',
                budget: budget
            });
        }

        function updateConfiguration(config) {
            document.getElementById('routerMode').value = config.mode;
            document.getElementById('dailyBudget').value = config.dailyBudget;

            // Update provider toggles
            const container = document.getElementById('providerToggles');
            container.innerHTML = config.providers.map(provider => \`
                <div class="provider-toggle">
                    <input type="checkbox" id="provider_\${provider.id}" 
                           \${provider.enabled ? 'checked' : ''} 
                           onchange="toggleProvider('\${provider.id}')">
                    <label for="provider_\${provider.id}">\${provider.name}</label>
                </div>
            \`).join('');
        }

        function toggleProvider(providerId) {
            const enabled = document.getElementById(\`provider_\${providerId}\`).checked;
            vscode.postMessage({
                type: 'toggleProvider',
                providerId: providerId,
                enabled: enabled
            });
        }

        function addLogEntry(entry) {
            const container = document.getElementById('logEntries');
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = \`
                <span class="log-time">\${new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span class="log-message">\${entry.message}</span>
            \`;
            
            container.insertBefore(logEntry, container.firstChild);
            
            // Keep only last 50 entries
            while (container.children.length > 50) {
                container.removeChild(container.lastChild);
            }
        }

        // Auto-refresh data every 30 seconds
        setInterval(() => {
            loadDashboardData();
        }, 30000);
    `;
    }
    setupMessageHandling() {
        this.panel?.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'loadStats':
                    await this.sendUsageStatistics(message.period);
                    break;
                case 'analyzeRouting':
                    await this.analyzeRouting(message.prompt);
                    break;
                case 'loadOllamaModels':
                    await this.sendOllamaModels();
                    break;
                case 'refreshOllamaModels':
                    await this.refreshOllamaModels();
                    break;
                case 'pullOllamaModel':
                    await this.pullOllamaModel(message.model);
                    break;
                case 'startOllamaModel':
                    await this.startOllamaModel(message.model);
                    break;
                case 'stopOllamaModel':
                    await this.stopOllamaModel(message.model);
                    break;
                case 'deleteOllamaModel':
                    await this.deleteOllamaModel(message.model);
                    break;
                case 'loadConfiguration':
                    await this.sendConfiguration();
                    break;
                case 'updateRouterMode':
                    await this.updateRouterMode(message.mode);
                    break;
                case 'updateBudget':
                    await this.updateBudget(message.budget);
                    break;
                case 'toggleProvider':
                    await this.toggleProvider(message.providerId, message.enabled);
                    break;
            }
        });
    }
    async sendUsageStatistics(period = 'daily') {
        // Mock data - in real implementation, this would come from a usage tracking system
        const stats = {
            daily: {
                requests: 42,
                tokens: 15420,
                cost: 0.23,
                providers: {
                    'openai': 25,
                    'anthropic': 12,
                    'ollama': 5
                }
            },
            weekly: {
                requests: 287,
                tokens: 98540,
                cost: 1.67,
                trends: [
                    { date: '2024-01-15', requests: 35, cost: 0.21 },
                    { date: '2024-01-16', requests: 42, cost: 0.23 },
                    { date: '2024-01-17', requests: 38, cost: 0.25 },
                    { date: '2024-01-18', requests: 51, cost: 0.31 },
                    { date: '2024-01-19', requests: 47, cost: 0.28 },
                    { date: '2024-01-20', requests: 39, cost: 0.22 },
                    { date: '2024-01-21', requests: 35, cost: 0.17 }
                ]
            },
            monthly: {
                requests: 1204,
                tokens: 412890,
                cost: 7.23,
                budget: 50.00,
                budgetUsed: 7.23
            },
            topModels: [
                { model: 'gpt-4', provider: 'openai', usage: 156, avgCost: 0.042 },
                { model: 'claude-3-sonnet', provider: 'anthropic', usage: 89, avgCost: 0.031 },
                { model: 'llama2:7b', provider: 'ollama', usage: 67, avgCost: 0.000 },
                { model: 'gpt-3.5-turbo', provider: 'openai', usage: 134, avgCost: 0.012 }
            ],
            costBreakdown: {
                'OpenAI': { requests: 290, cost: 4.23 },
                'Anthropic': { requests: 156, cost: 2.87 },
                'Cohere': { requests: 89, cost: 0.13 },
                'Ollama': { requests: 67, cost: 0.00 }
            }
        };
        this.panel?.webview.postMessage({
            type: 'updateStats',
            data: stats
        });
    }
    async analyzeRouting(prompt) {
        try {
            // Simulate routing analysis
            const analysis = {
                prompt,
                rules: [
                    { rule: 'Prompt length > 1000 chars', score: 0.8, matched: prompt.length > 1000, reasoning: 'Long prompts benefit from high-context models' },
                    { rule: 'Contains code keywords', score: 0.6, matched: /\b(function|class|import|const|let|var)\b/i.test(prompt), reasoning: 'Code-related prompts work well with coding-optimized models' },
                    { rule: 'Question format detected', score: 0.7, matched: /\?/.test(prompt), reasoning: 'Questions often need detailed responses' },
                    { rule: 'Local-only mode', score: 0.9, matched: false, reasoning: 'Privacy mode prefers local models' }
                ],
                selectedProvider: 'anthropic',
                selectedModel: 'claude-3-sonnet',
                confidence: 0.85,
                alternatives: [
                    { provider: 'openai', model: 'gpt-4', score: 0.82 },
                    { provider: 'ollama', model: 'llama2:7b', score: 0.45 }
                ]
            };
            this.panel?.webview.postMessage({
                type: 'updateRouting',
                data: analysis
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Routing-Analyse fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async sendOllamaModels() {
        // Mock Ollama models - in real implementation, this would query Ollama API
        const models = [
            {
                name: 'llama2:7b',
                tag: '7b',
                size: 3825300000,
                digest: 'sha256:abc123',
                modified: '2024-01-15T10:30:00Z',
                details: {
                    format: 'gguf',
                    family: 'llama',
                    families: ['llama'],
                    parameter_size: '7B',
                    quantization_level: 'Q4_0'
                },
                isRunning: true,
                memoryUsage: 4200000000
            },
            {
                name: 'codellama:13b',
                tag: '13b',
                size: 7365400000,
                digest: 'sha256:def456',
                modified: '2024-01-14T15:20:00Z',
                details: {
                    format: 'gguf',
                    family: 'llama',
                    families: ['llama'],
                    parameter_size: '13B',
                    quantization_level: 'Q4_0'
                },
                isRunning: false
            },
            {
                name: 'mistral:7b',
                tag: '7b',
                size: 4109800000,
                digest: 'sha256:ghi789',
                modified: '2024-01-13T09:45:00Z',
                details: {
                    format: 'gguf',
                    family: 'mistral',
                    families: ['mistral'],
                    parameter_size: '7B',
                    quantization_level: 'Q4_0'
                },
                isRunning: false
            }
        ];
        this.panel?.webview.postMessage({
            type: 'updateOllama',
            data: models
        });
    }
    async refreshOllamaModels() {
        // Simulate refresh
        await this.sendOllamaModels();
        vscode.window.showInformationMessage('Ollama-Modelle aktualisiert');
    }
    async pullOllamaModel(modelName) {
        vscode.window.showInformationMessage(`Lade Modell ${modelName} herunter...`);
        // In real implementation, this would start a pull operation and show progress
    }
    async startOllamaModel(modelName) {
        vscode.window.showInformationMessage(`Starte Modell ${modelName}...`);
        await this.sendOllamaModels(); // Refresh to show updated status
    }
    async stopOllamaModel(modelName) {
        vscode.window.showInformationMessage(`Stoppe Modell ${modelName}...`);
        await this.sendOllamaModels(); // Refresh to show updated status
    }
    async deleteOllamaModel(modelName) {
        vscode.window.showInformationMessage(`Lösche Modell ${modelName}...`);
        await this.sendOllamaModels(); // Refresh to show updated list
    }
    async sendConfiguration() {
        const config = {
            mode: 'auto',
            dailyBudget: 5.00,
            providers: [
                { id: 'openai', name: 'OpenAI', enabled: true },
                { id: 'anthropic', name: 'Anthropic', enabled: true },
                { id: 'cohere', name: 'Cohere', enabled: false },
                { id: 'ollama', name: 'Ollama', enabled: true }
            ]
        };
        this.panel?.webview.postMessage({
            type: 'updateConfig',
            data: config
        });
    }
    async updateRouterMode(mode) {
        // Update router configuration
        vscode.window.showInformationMessage(`Router-Modus geändert zu: ${mode}`);
    }
    async updateBudget(budget) {
        // Update budget configuration
        vscode.window.showInformationMessage(`Tagesbudget gesetzt auf: €${budget.toFixed(2)}`);
    }
    async toggleProvider(providerId, enabled) {
        // Toggle provider
        vscode.window.showInformationMessage(`Provider ${providerId} ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    }
    updateDashboard() {
        if (this.panel?.visible) {
            this.sendUsageStatistics();
            this.sendOllamaModels();
        }
    }
    dispose() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.panel?.dispose();
    }
}
exports.AdvancedDashboardUI = AdvancedDashboardUI;
//# sourceMappingURL=advancedDashboard.js.map