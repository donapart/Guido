"use strict";
/**
 * Cohere Provider
 * Supports Cohere Command models for text generation and chat
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CohereProvider = void 0;
class CohereProvider {
    config;
    baseUrl;
    constructor(config) {
        this.config = {
            maxTokens: 4096,
            temperature: 0.7,
            topP: 1.0,
            topK: 250,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0,
            model: 'command-r-plus',
            baseUrl: 'https://api.cohere.ai',
            ...config
        };
        this.baseUrl = this.config.baseUrl;
        if (!this.config.apiKey) {
            throw new Error('Cohere API key is required');
        }
    }
    id() {
        return 'cohere';
    }
    name() {
        return 'Cohere';
    }
    async getAvailableModels() {
        return [
            'command-r-plus',
            'command-r',
            'command',
            'command-nightly',
            'command-light',
            'command-light-nightly'
        ];
    }
    async chat(messages, options) {
        const model = options?.model || this.config.model;
        // Convert messages to Cohere format
        const cohereMessages = this.convertMessages(messages);
        const lastMessage = cohereMessages.pop();
        if (!lastMessage || lastMessage.role !== 'USER') {
            throw new Error('Last message must be from user');
        }
        const requestBody = {
            model,
            message: lastMessage.message,
            chat_history: cohereMessages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            p: this.config.topP,
            k: this.config.topK,
            frequency_penalty: this.config.frequencyPenalty,
            presence_penalty: this.config.presencePenalty,
            stop_sequences: this.config.stopSequences,
            stream: options?.stream || false
        };
        const response = await fetch(`${this.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'X-Client-Name': 'guido-model-router'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere API error: ${response.status} - ${error}`);
        }
        if (options?.stream) {
            return response.body;
        }
        const result = await response.json();
        return {
            content: result.text,
            model: model,
            usage: {
                promptTokens: result.token_count.prompt_tokens,
                completionTokens: result.token_count.response_tokens,
                totalTokens: result.token_count.total_tokens
            },
            finishReason: result.finish_reason.toLowerCase()
        };
    }
    async streamChat(messages, onChunk, options) {
        const model = options?.model || this.config.model;
        const cohereMessages = this.convertMessages(messages);
        const lastMessage = cohereMessages.pop();
        if (!lastMessage || lastMessage.role !== 'USER') {
            throw new Error('Last message must be from user');
        }
        const requestBody = {
            model,
            message: lastMessage.message,
            chat_history: cohereMessages,
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            p: this.config.topP,
            k: this.config.topK,
            frequency_penalty: this.config.frequencyPenalty,
            presence_penalty: this.config.presencePenalty,
            stop_sequences: this.config.stopSequences,
            stream: true
        };
        const response = await fetch(`${this.baseUrl}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'X-Client-Name': 'guido-model-router'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere API error: ${response.status} - ${error}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body reader available');
        }
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.event_type === 'text-generation' && parsed.text) {
                                onChunk(parsed.text);
                            }
                        }
                        catch (e) {
                            // Ignore parsing errors for partial chunks
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    estimateTokens(text) {
        // Rough estimation: ~4 characters per token for Cohere
        return Math.ceil(text.length / 4);
    }
    estimateCost(promptTokens, completionTokens, model) {
        const modelName = model || this.config.model;
        // Cohere pricing (as of 2024)
        const pricing = {
            'command-r-plus': { input: 0.003, output: 0.015 },
            'command-r': { input: 0.0005, output: 0.0015 },
            'command': { input: 0.001, output: 0.002 },
            'command-nightly': { input: 0.001, output: 0.002 },
            'command-light': { input: 0.0003, output: 0.0006 },
            'command-light-nightly': { input: 0.0003, output: 0.0006 }
        };
        const rates = pricing[modelName] || pricing['command-r-plus'];
        return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output;
    }
    supportsStreaming() {
        return true;
    }
    supportsImages() {
        return false; // Cohere doesn't support images in chat
    }
    supportsJsonMode() {
        return false;
    }
    supportsFunctionCalling() {
        return true; // Cohere supports function calling
    }
    getMaxContextLength(model) {
        const modelName = model || this.config.model;
        // Context lengths for different Cohere models
        const contextLengths = {
            'command-r-plus': 128000,
            'command-r': 128000,
            'command': 4096,
            'command-nightly': 4096,
            'command-light': 4096,
            'command-light-nightly': 4096
        };
        return contextLengths[modelName] || 4096;
    }
    convertMessages(messages) {
        const converted = [];
        for (const msg of messages) {
            let role;
            switch (msg.role) {
                case 'user':
                    role = 'USER';
                    break;
                case 'assistant':
                    role = 'CHATBOT';
                    break;
                case 'system':
                    role = 'SYSTEM';
                    break;
                default:
                    role = 'USER';
            }
            converted.push({
                role,
                message: msg.content
            });
        }
        return converted;
    }
    async validateConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-Client-Name': 'guido-model-router'
                },
                body: JSON.stringify({
                    model: 'command-light',
                    message: 'test',
                    max_tokens: 1
                })
            });
            return response.status === 200 || response.status === 400;
        }
        catch (error) {
            console.error('Cohere connection validation failed:', error);
            return false;
        }
    }
    getModelCapabilities(model) {
        const modelName = model || this.config.model;
        return {
            maxContextLength: this.getMaxContextLength(modelName),
            supportsImages: this.supportsImages(),
            supportsFunctions: this.supportsFunctionCalling(),
            supportsStreaming: this.supportsStreaming()
        };
    }
    // Cohere-specific methods
    async generateText(prompt, options) {
        const model = options?.model || this.config.model;
        const requestBody = {
            model,
            prompt,
            max_tokens: options?.maxTokens || this.config.maxTokens,
            temperature: options?.temperature || this.config.temperature,
            stop_sequences: options?.stopSequences || this.config.stopSequences,
            return_likelihoods: 'GENERATION'
        };
        const response = await fetch(`${this.baseUrl}/v1/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'X-Client-Name': 'guido-model-router'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere generate API error: ${response.status} - ${error}`);
        }
        const result = await response.json();
        return {
            text: result.generations[0].text,
            likelihood: result.generations[0].likelihood,
            tokenLikelihood: result.generations[0].token_likelihoods
        };
    }
    async classify(inputs, examples) {
        const requestBody = {
            inputs,
            examples
        };
        const response = await fetch(`${this.baseUrl}/v1/classify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
                'X-Client-Name': 'guido-model-router'
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere classify API error: ${response.status} - ${error}`);
        }
        const result = await response.json();
        return result.classifications;
    }
}
exports.CohereProvider = CohereProvider;
//# sourceMappingURL=cohere_backup.js.map