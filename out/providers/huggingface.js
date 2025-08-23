"use strict";
/**
 * Hugging Face Provider
 * Access to Hugging Face Inference API and Hub models
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceProvider = void 0;
class HuggingFaceProvider {
    config;
    constructor(config) {
        this.config = {
            maxTokens: 1024,
            temperature: 0.7,
            topP: 0.95,
            topK: 50,
            repetitionPenalty: 1.03,
            maxTime: 30,
            useCache: true,
            waitForModel: false,
            model: 'microsoft/DialoGPT-large',
            ...config
        };
        if (!this.config.apiKey) {
            throw new Error('Hugging Face API key is required');
        }
    }
    id() {
        return this.config.id;
    }
    supports(model) {
        const supportedModels = [
            // Chat/Conversational Models
            'microsoft/DialoGPT-large',
            'microsoft/DialoGPT-medium',
            'facebook/blenderbot-400M-distill',
            'facebook/blenderbot_small-90M',
            // Text Generation Models
            'gpt2',
            'gpt2-medium',
            'gpt2-large',
            'gpt2-xl',
            'EleutherAI/gpt-neo-2.7B',
            'EleutherAI/gpt-j-6B',
            'bigscience/bloom-560m',
            'bigscience/bloom-1b1',
            'bigscience/bloom-3b',
            'bigscience/bloom-7b1',
            // Instruction-following Models
            'google/flan-t5-base',
            'google/flan-t5-large',
            'google/flan-t5-xl',
            'google/flan-t5-xxl',
            // Code Generation Models
            'Salesforce/codegen-350M-multi',
            'Salesforce/codegen-2B-multi',
            'Salesforce/codegen-6B-multi',
            'bigcode/santacoder',
            // Llama Models
            'meta-llama/Llama-2-7b-chat-hf',
            'meta-llama/Llama-2-13b-chat-hf',
            'meta-llama/Llama-2-70b-chat-hf',
            // Mistral Models
            'mistralai/Mistral-7B-Instruct-v0.1',
            'mistralai/Mistral-7B-Instruct-v0.2',
            'mistralai/Mixtral-8x7B-Instruct-v0.1'
        ];
        return supportedModels.includes(model);
    }
    estimateTokens(input) {
        // Rough estimation: ~4 characters per token for most HF models
        return Math.ceil(input.length / 4);
    }
    async isAvailable() {
        try {
            const response = await fetch(`${this.config.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            return response.ok;
        }
        catch {
            return false;
        }
    }
    async *chat(model, messages, opts) {
        // For most HF models, we need to convert chat to text format
        const prompt = this.convertMessagesToPrompt(messages);
        const requestBody = {
            inputs: prompt,
            parameters: {
                max_new_tokens: opts?.maxTokens || this.config.maxTokens || 1024,
                temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
                top_p: this.config.topP || 0.95,
                top_k: this.config.topK || 50,
                repetition_penalty: this.config.repetitionPenalty || 1.03,
                return_full_text: false,
                use_cache: this.config.useCache ?? true,
                wait_for_model: this.config.waitForModel ?? false
            },
            options: {
                use_cache: this.config.useCache ?? true,
                wait_for_model: this.config.waitForModel ?? false
            },
            stream: true
        };
        const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            yield { type: 'error', error: `Hugging Face API error: ${response.status} - ${response.statusText}` };
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
                            if (parsed.token?.text) {
                                yield { type: 'text', data: parsed.token.text };
                            }
                            else if (typeof parsed === 'string') {
                                yield { type: 'text', data: parsed };
                            }
                        }
                        catch {
                            // Try to yield the raw data if JSON parsing fails
                            if (data.trim()) {
                                yield { type: 'text', data: data };
                            }
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
        // Convert chat to text format for HF models
        const prompt = this.convertMessagesToPrompt(messages);
        const requestBody = {
            inputs: prompt,
            parameters: {
                max_new_tokens: opts?.maxTokens || this.config.maxTokens || 1024,
                temperature: opts?.temperature ?? this.config.temperature ?? 0.7,
                top_p: this.config.topP || 0.95,
                top_k: this.config.topK || 50,
                repetition_penalty: this.config.repetitionPenalty || 1.03,
                return_full_text: false,
                use_cache: this.config.useCache ?? true,
                wait_for_model: this.config.waitForModel ?? false
            },
            options: {
                use_cache: this.config.useCache ?? true,
                wait_for_model: this.config.waitForModel ?? false
            }
        };
        const response = await fetch(`${this.config.baseUrl}/models/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status} - ${response.statusText}`);
        }
        const result = await response.json();
        // Handle different response formats from HF models
        let content = '';
        if (Array.isArray(result) && result[0]?.generated_text) {
            content = result[0].generated_text;
        }
        else if (result.generated_text) {
            content = result.generated_text;
        }
        else if (typeof result === 'string') {
            content = result;
        }
        return {
            content: content,
            usage: {
                inputTokens: this.estimateTokens(prompt),
                outputTokens: this.estimateTokens(content)
            },
            finishReason: 'stop' // HF doesn't provide finish reasons in most cases
        };
    }
    // Convert chat messages to a single prompt string
    convertMessagesToPrompt(messages) {
        let prompt = '';
        for (const message of messages) {
            switch (message.role) {
                case 'system':
                    prompt += `System: ${message.content}\n\n`;
                    break;
                case 'user':
                    prompt += `Human: ${message.content}\n\n`;
                    break;
                case 'assistant':
                    prompt += `Assistant: ${message.content}\n\n`;
                    break;
            }
        }
        // Add the assistant prefix for the response
        prompt += 'Assistant:';
        return prompt;
    }
    // Get model information from HF Hub
    async getModelInfo(model) {
        try {
            const response = await fetch(`https://huggingface.co/api/models/${model}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            if (!response.ok) {
                return null;
            }
            return await response.json();
        }
        catch {
            return null;
        }
    }
    // Cost estimation for HF Inference API (typically free with rate limits)
    estimateCost(model, inputTokens, outputTokens) {
        // Hugging Face Inference API is generally free with rate limits
        // For enterprise usage, costs would be based on compute time
        // Return 0 for free tier, actual implementations might calculate based on compute units
        return 0;
    }
    // Check if model supports streaming
    supportsStreaming(model) {
        // Most text generation models support streaming
        const streamingModels = [
            'gpt2', 'gpt2-medium', 'gpt2-large', 'gpt2-xl',
            'EleutherAI/gpt-neo-2.7B', 'EleutherAI/gpt-j-6B',
            'microsoft/DialoGPT-large', 'microsoft/DialoGPT-medium',
            'meta-llama/Llama-2-7b-chat-hf', 'meta-llama/Llama-2-13b-chat-hf',
            'mistralai/Mistral-7B-Instruct-v0.1', 'mistralai/Mistral-7B-Instruct-v0.2'
        ];
        return streamingModels.some(supported => model.includes(supported));
    }
    // Check if model is for code generation
    isCodeModel(model) {
        const codeModels = [
            'Salesforce/codegen-350M-multi',
            'Salesforce/codegen-2B-multi',
            'Salesforce/codegen-6B-multi',
            'bigcode/santacoder'
        ];
        return codeModels.includes(model);
    }
    // Validate model selection
    validateModel(model) {
        return this.supports(model);
    }
}
exports.HuggingFaceProvider = HuggingFaceProvider;
//# sourceMappingURL=huggingface.js.map