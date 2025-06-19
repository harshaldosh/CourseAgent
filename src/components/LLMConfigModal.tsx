import React, { useState, useEffect } from 'react';
import { X, Save, Settings } from 'lucide-react';
import { LLM_PROVIDERS, type LLMConfig } from '../types/llm';
import { llmConfigService } from '../services/llm-config';
import toast from 'react-hot-toast';

interface LLMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: LLMConfig) => void;
}

const LLMConfigModal: React.FC<LLMConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<LLMConfig>(llmConfigService.getCurrentConfig());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(llmConfigService.getCurrentConfig());
    }
  }, [isOpen]);

  const handleProviderChange = (provider: 'openai' | 'groq' | 'gemini') => {
    const providerInfo = LLM_PROVIDERS[provider];
    setConfig(prev => ({
      ...prev,
      provider,
      model: providerInfo.models[0] // Set default model for the provider
    }));
  };

  const handleSave = async () => {
    if (!config.apiKey && LLM_PROVIDERS[config.provider].requiresApiKey) {
      toast.error('API key is required for this provider');
      return;
    }

    setSaving(true);
    try {
      await llmConfigService.saveLLMConfig(config);
      toast.success('LLM configuration saved successfully');
      onSave?.(config);
      onClose();
    } catch (error) {
      console.error('Failed to save LLM config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentProvider = LLM_PROVIDERS[config.provider];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">LLM Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              LLM Provider
            </label>
            <div className="space-y-2">
              {Object.values(LLM_PROVIDERS).map((provider) => (
                <label key={provider.id} className="flex items-center">
                  <input
                    type="radio"
                    value={provider.id}
                    checked={config.provider === provider.id}
                    onChange={(e) => handleProviderChange(e.target.value as any)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">{provider.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {currentProvider.models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {currentProvider.requiresApiKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={`Enter your ${currentProvider.name} API key`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your API key will be stored locally and used for quiz generation and evaluation.
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Provider Information</h4>
            <p className="text-xs text-blue-700">
              <strong>{currentProvider.name}:</strong> {
                config.provider === 'openai' ? 'Industry-leading language models with excellent performance.' :
                config.provider === 'groq' ? 'Fast inference with open-source models like Llama and Mixtral.' :
                'Google\'s powerful Gemini models with multimodal capabilities.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LLMConfigModal;