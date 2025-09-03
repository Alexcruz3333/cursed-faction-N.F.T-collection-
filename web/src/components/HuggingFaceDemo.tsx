import React, { useState } from 'react';
import { HfInference } from '@huggingface/inference';

export function HuggingFaceDemo() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('microsoft/DialoGPT-medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your HuggingFace API key');
      return;
    }
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const hf = new HfInference(apiKey);

      const result = await hf.textGeneration({
        model: model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          return_full_text: false,
        }
      });
      
      setResponse(result.generated_text || 'No response received');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from HuggingFace';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-section">
      <h2>🤗 HuggingFace Integration Demo</h2>
      <p>
        Test HuggingFace Inference API with various models. 
        <strong> Note:</strong> For production apps, API calls should be made from your backend for security.
      </p>
      
      <form onSubmit={handleSubmit} className="ai-form">
        <div className="form-group">
          <label htmlFor="hf-key">HuggingFace API Key:</label>
          <input
            id="hf-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="hf_..."
            className="form-input"
          />
          <small className="form-help">
            Get your API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer">HuggingFace Settings</a>
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="hf-model">Model:</label>
          <select
            id="hf-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="form-select"
          >
            <option value="microsoft/DialoGPT-medium">DialoGPT (Conversational)</option>
            <option value="gpt2">GPT-2 (Text Generation)</option>
            <option value="EleutherAI/gpt-neo-1.3B">GPT-Neo 1.3B</option>
            <option value="distilgpt2">DistilGPT-2 (Fast)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="hf-prompt">Prompt:</label>
          <textarea
            id="hf-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here... (e.g., 'Hello, how are you today?')"
            className="form-textarea"
            rows={4}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {response && (
        <div className="response-box">
          <h3>Response:</h3>
          <p>{response}</p>
        </div>
      )}

      <div className="setup-info">
        <h3>🔧 Setup Instructions:</h3>
        <ol>
          <li>Create an account at <a href="https://huggingface.co" target="_blank" rel="noopener noreferrer">HuggingFace</a></li>
          <li>Generate an access token in Settings → Access Tokens</li>
          <li>Add your token to the form above or set <code>VITE_HUGGINGFACE_API_KEY</code> in your .env file</li>
          <li>Choose different models to experiment with various AI capabilities</li>
          <li>For production: Move API calls to your backend and never expose API keys in frontend code</li>
        </ol>
      </div>
    </div>
  );
}