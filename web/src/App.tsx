import { useState } from 'react'
import { SandpackDemo } from './components/SandpackDemo'
import { OpenAIDemo } from './components/OpenAIDemo'
import { HuggingFaceDemo } from './components/HuggingFaceDemo'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'sandpack' | 'openai' | 'huggingface'>('sandpack')

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Cursed Faction - React Frontend Demo</h1>
        <p>Interactive development environment with live code editing and AI integrations</p>
      </header>

      <nav className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'sandpack' ? 'active' : ''}`}
          onClick={() => setActiveTab('sandpack')}
        >
          🏗️ Sandpack Editor
        </button>
        <button 
          className={`tab-btn ${activeTab === 'openai' ? 'active' : ''}`}
          onClick={() => setActiveTab('openai')}
        >
          🤖 OpenAI Demo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'huggingface' ? 'active' : ''}`}
          onClick={() => setActiveTab('huggingface')}
        >
          🤗 HuggingFace Demo
        </button>
      </nav>

      <main className="main-content">
        {activeTab === 'sandpack' && <SandpackDemo />}
        {activeTab === 'openai' && <OpenAIDemo />}
        {activeTab === 'huggingface' && <HuggingFaceDemo />}
      </main>

      <footer className="app-footer">
        <p>Built for Cursor agents and AI-assisted development</p>
        <p>
          <a href="https://github.com/Alexcruz3333/cursed-faction-N.F.T-collection-" target="_blank" rel="noopener noreferrer">
            📁 View Repository
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
