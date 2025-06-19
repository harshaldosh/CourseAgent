export interface LLMProvider {
  id: string;
  name: string;
  apiUrl: string;
  models: string[];
  requiresApiKey: boolean;
}

export interface LLMConfig {
  provider: 'openai' | 'groq' | 'gemini';
  model: string;
  apiKey?: string;
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  groq: {
    id: 'groq',
    name: 'GROQ',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'],
    requiresApiKey: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: ['gemini-pro', 'gemini-pro-vision', 'gemini-2.0-flash'],
    requiresApiKey: true
  }
};