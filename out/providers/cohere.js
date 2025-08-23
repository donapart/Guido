"use strict";
/**
 * Cohere Provider
 * Supports Cohere Command models for text generation and chat
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohereProvider = void 0;
class CohereProvider {
    config;
    constructor(config) {
        this.config = {
            maxTokens: 4096,
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            model: 'command-r-plus',
            ...config
        };
        if (!this.config.apiKey) {
            throw new Error('Cohere API key is required');
        }
    }
    id() {
        return this.config.id;
    }
    supports(model) {
        const supportedModels = [
            'command-r-plus',
            'command-r',
            'command',
            'command-nightly'
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
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async *chat(model, messages, opts) {
        // Convert messages to Cohere format
        const cohereMessages = this.convertMessages(messages);
        const requestBody = {
            model: model,
            chat_history: cohereMessages.slice(0, -1),
            message: cohereMessages[cohereMessages.length - 1]?.message || '',
            max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
            temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
            p: this.config.topP || 0.9,
            k: this.config.topK || 40,
            stream: true
        };
        const response = await fetch(`${this.config.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            yield { type: 'error', error: `Cohere API error: ${response.status}` };
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
                            if (parsed.text) {
                                yield { type: 'text', data: parsed.text };
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
        // Convert messages to Cohere format
        const cohereMessages = this.convertMessages(messages);
        const requestBody = {
            model: model,
            chat_history: cohereMessages.slice(0, -1),
            message: cohereMessages[cohereMessages.length - 1]?.message || '',
            max_tokens: opts?.maxTokens || this.config.maxTokens || 4096,
            temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
            p: this.config.topP || 0.9,
            k: this.config.topK || 40,
            stream: false
        };
        const response = await fetch(`${this.config.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.status}`);
        }
        const result = await response.json();
        return {
            content: result.text || '',
            usage: {
                inputTokens: result.token_count?.prompt_tokens || 0,
                outputTokens: result.token_count?.response_tokens || 0
            },
            finishReason: result.finish_reason === 'COMPLETE' ? 'stop' : result.finish_reason
        };
    }
    convertMessages(messages) {
        return messages.map(msg => ({
            role: msg.role === 'user' ? 'USER' :
                msg.role === 'assistant' ? 'CHATBOT' : 'SYSTEM',
            message: msg.content
        }));
    }
    // Cost estimation for Cohere models
    estimateCost(model, inputTokens, outputTokens) {
        const costs = {
            'command-r-plus': { input: 0.003, output: 0.015 },
            'command-r': { input: 0.0005, output: 0.0015 },
            'command': { input: 0.001, output: 0.002 }
        };
        const cost = costs[model];
        if (!cost)
            return 0;
        return (inputTokens / 1000) * cost.input + (outputTokens / 1000) * cost.output;
    }
    // Detect if input requires classification
    detectClassification(content) {
        const classificationKeywords = [
            'classify', 'categorize', 'sentiment', 'intent',
            'label', 'tag', 'type', 'category'
        ];
        return classificationKeywords.some(keyword => content.toLowerCase().includes(keyword));
    }
    // Detect if input requires function calling
    detectFunctionCalling(content) {
        const functionKeywords = [
            'tool', 'function', 'api', 'call', 'execute',
            'search', 'calculate', 'lookup'
        ];
        return functionKeywords.some(keyword => content.toLowerCase().includes(keyword));
    }
    // Validate model selection
    validateModel(model) {
        return this.supports(model);
    }
}
exports.CohereProvider = CohereProvider;
//# sourceMappingURL=cohere.js.map