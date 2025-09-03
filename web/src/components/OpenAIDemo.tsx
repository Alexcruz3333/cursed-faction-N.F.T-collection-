import React, { useState } from 'react';
import OpenAI from 'openai';

export function OpenAIDemo() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
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
      const openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Note: In production, API calls should be made from backend
      });

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
      });

      setResponse(completion.choices[0]?.message?.content || 'No response received');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response from OpenAI';
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-section">
      <h2>🤖 OpenAI Integration Demo</h2>
      <p>
        Test OpenAI integration with GPT-3.5-turbo. 
        <strong> Note:</strong> For production apps, API calls should be made from your backend for security.
      </p>
      
      <form onSubmit={handleSubmit} className="ai-form">
        <div className="form-group">
          <label htmlFor="openai-key">OpenAI API Key:</label>
          <input
            id="openai-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="form-input"
          />
          <small className="form-help">
            Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a>
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="openai-prompt">Prompt:</label>
          <textarea
            id="openai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here... (e.g., 'Explain quantum computing in simple terms')"
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
          <li>Sign up at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer">OpenAI Platform</a></li>
          <li>Generate an API key in the API Keys section</li>
          <li>Add your API key to the form above or set <code>VITE_OPENAI_API_KEY</code> in your .env file</li>
          <li>For production: Move API calls to your backend and never expose API keys in frontend code</li>
        </ol>
      </div>
    </div>
  );
}