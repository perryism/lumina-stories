import React, { useState, useEffect } from 'react';
import { AISettings, getSettings, saveSettings, resetSettings } from '../utils/settingsService';
import { debugLogger } from '../utils/debugLogger';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AISettings>(getSettings());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleProviderChange = (provider: 'gemini' | 'openai' | 'local') => {
    setSettings({ ...settings, provider });
    setHasChanges(true);
  };

  const handleApiKeyChange = (field: keyof AISettings, value: string) => {
    setSettings({ ...settings, [field]: value });
    setHasChanges(true);
  };

  const handleModelChange = (provider: 'gemini' | 'openai' | 'local', task: 'outline' | 'chapter' | 'summary', value: string) => {
    setSettings({
      ...settings,
      models: {
        ...settings.models,
        [provider]: {
          ...settings.models[provider],
          [task]: value,
        },
      },
    });
    setHasChanges(true);
  };

  const handleMaxTokensChange = (provider: 'gemini' | 'openai' | 'local', task: 'outline' | 'chapter' | 'summary', value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings({
      ...settings,
      maxTokens: {
        ...settings.maxTokens,
        [provider]: {
          ...settings.maxTokens[provider],
          [task]: numValue,
        },
      },
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      saveSettings(settings);
      setHasChanges(false);
      showMessage('success', 'Settings saved! Please refresh the page for changes to take effect.');
    } catch (error) {
      showMessage('error', 'Failed to save settings');
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaults = resetSettings();
      setSettings(defaults);
      setHasChanges(false);
      showMessage('success', 'Settings reset to defaults');
    }
  };

  const handleDebugModeChange = (enabled: boolean) => {
    setSettings({ ...settings, debugMode: enabled });
    setHasChanges(true);
  };

  const handleExportLogs = () => {
    debugLogger.exportLogs();
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all debug logs?')) {
      debugLogger.clearLogs();
      showMessage('success', 'Debug logs cleared');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
            <p className="text-slate-500 text-sm mt-1">Configure AI provider and models</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Provider Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700">AI Provider</label>
            <div className="grid grid-cols-3 gap-3">
              {(['gemini', 'openai', 'local'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() => handleProviderChange(provider)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    settings.provider === provider
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900 capitalize">{provider}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {provider === 'gemini' && 'Google Gemini'}
                    {provider === 'openai' && 'OpenAI GPT'}
                    {provider === 'local' && 'Local Server'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">API Configuration</h3>

            {settings.provider === 'gemini' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Gemini API Key</label>
                <input
                  type="password"
                  value={settings.geminiApiKey || ''}
                  onChange={(e) => handleApiKeyChange('geminiApiKey', e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {settings.provider === 'openai' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-600">OpenAI API Key</label>
                <input
                  type="password"
                  value={settings.openaiApiKey || ''}
                  onChange={(e) => handleApiKeyChange('openaiApiKey', e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}

            {settings.provider === 'local' && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">API URL</label>
                  <input
                    type="text"
                    value={settings.localApiUrl || ''}
                    onChange={(e) => handleApiKeyChange('localApiUrl', e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-600">API Key (optional)</label>
                  <input
                    type="password"
                    value={settings.localApiKey || ''}
                    onChange={(e) => handleApiKeyChange('localApiKey', e.target.value)}
                    placeholder="not-needed"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Model Configuration</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Outline Model</label>
                  <input
                    type="text"
                    value={settings.models[settings.provider].outline}
                    onChange={(e) => handleModelChange(settings.provider, 'outline', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Chapter Model</label>
                  <input
                    type="text"
                    value={settings.models[settings.provider].chapter}
                    onChange={(e) => handleModelChange(settings.provider, 'chapter', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Summary Model</label>
                  <input
                    type="text"
                    value={settings.models[settings.provider].summary}
                    onChange={(e) => handleModelChange(settings.provider, 'summary', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Max Tokens Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700">Max Tokens Configuration</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Outline Max Tokens</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.maxTokens[settings.provider].outline}
                    onChange={(e) => handleMaxTokensChange(settings.provider, 'outline', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Chapter Max Tokens</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.maxTokens[settings.provider].chapter}
                    onChange={(e) => handleMaxTokensChange(settings.provider, 'chapter', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-600">Summary Max Tokens</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.maxTokens[settings.provider].summary}
                    onChange={(e) => handleMaxTokensChange(settings.provider, 'summary', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Debug Mode */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Debug Mode</h3>
                <p className="text-xs text-slate-500 mt-1">Log all API requests to a downloadable file</p>
              </div>
              <button
                onClick={() => handleDebugModeChange(!settings.debugMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.debugMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.debugMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {settings.debugMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs text-amber-800 font-medium">Debug mode is enabled</p>
                    <p className="text-xs text-amber-700 mt-1">All API requests will be logged. Use the buttons below to manage logs.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleExportLogs}
                    className="flex-1 px-3 py-2 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    Export Logs
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="flex-1 px-3 py-2 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                hasChanges
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

