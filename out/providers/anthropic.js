"use strict";
/**
 * Anthropic Claude Provider
 * Supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
class AnthropicProvider {
    config;
    constructor(config) {
        this.config = {
            maxTokens: 4096,
            temperature: 0.7,
            topP: 1.0,
            topK: 40,
            model: 'claude-3-5-sonnet-20241022',
            ...config
        };
        if (!this.config.apiKey) {
            throw new Error('Anthropic API key is required');
        }
    }
    id() {
        return this.config.id;
    }
    supports(model) {
        const supportedModels = [
            'claude-3-5-sonnet-20241022',
            'claude-3-5-haiku-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
        return supportedModels.includes(model);
    }
    estimateTokens(input) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(input.length / 4);
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.config.baseUrl}/v1/models`, {
                headers: {
                    'x-api-key': this.config.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async *chat(model, messages, opts) {
        // Convert messages to Anthropic format
        const anthropicMessages = this.convertMessages(messages);
        const requestBody = {
            model: model,
            messages: anthropicMessages,
            max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
            temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
            stream: true
        };
        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            yield { type: 'error', error: `Anthropic API error: ${response.status}` };
            return;
        }
        const reader = response.body?.getReader();
        if (!reader) {
            yield { type: 'error', error: 'No response body' };
            return;
        }
        let buffer = '';
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += new TextDecoder().decode(value);
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            yield { type: 'done' };
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.delta?.text) {
                                yield { type: 'text', data: parsed.delta.text };
                            }
                        }
                        catch {
                            // Ignore invalid JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async chatComplete(model, messages, opts) {
        // Convert messages to Anthropic format
        const anthropicMessages = this.convertMessages(messages);
        const requestBody = {
            model: model,
            messages: anthropicMessages,
            max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
            temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
            stream: false
        };
        const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }
        const result = await response.json();
        return {
            content: result.content[0]?.text || '',
            usage: {
                inputTokens: result.usage?.input_tokens || 0,
                outputTokens: result.usage?.output_tokens || 0
            },
            finishReason: result.stop_reason === 'end_turn' ? 'stop' : result.stop_reason
        };
    }
    convertMessages(messages) {
        return messages.map(msg => ({
            role: msg.role === 'system' ? 'user' : msg.role,
            content: msg.content
        }));
    }
    // Cost estimation methods
    estimateCost(model, inputTokens, outputTokens) {
        const costs = {
            'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
            'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
            'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
        };
        const cost = costs[model];
        if (!cost)
            return 0;
        return (inputTokens / 1000) * cost.input + (outputTokens / 1000) * cost.output;
    }
    // Detect if input contains images
    detectImages(content) {
        return /data:image\/[^;]+;base64,/.test(content);
    }
    // Validate model selection
    validateModel(model) {
        return this.supports(model);
    }
}
exports.AnthropicProvider = AnthropicProvider;
//# sourceMappingURL=anthropic.js.map