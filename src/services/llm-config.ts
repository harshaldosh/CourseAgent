import { supabase } from '../lib/supabase';
import type { LLMConfig } from '../types/llm';

class LLMConfigService {
  private readonly STORAGE_KEY = 'llm_config';

  async saveLLMConfig(config: LLMConfig): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Store in localStorage for now (in production, you might want to store in database)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  }

  getLLMConfig(): LLMConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getDefaultConfig(): LLMConfig {
    return {
      provider: 'openai',
      model: 'gpt-4'
    };
  }

  getCurrentConfig(): LLMConfig {
    return this.getLLMConfig() || this.getDefaultConfig();
  }
}

export const llmConfigService = new LLMConfigService();