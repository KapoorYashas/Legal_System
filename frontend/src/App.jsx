import React, { useState } from 'react';
import LegalChatbot from './components/LegalChatbot.jsx';
import LawSearch from './components/LawSearch.jsx';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('keyword');

  return (
    <div className="App">
      {/* Top Navigation Tabs */}
      <nav className="legal-nav">
        <div className="legal-nav-inner">
          <button
            onClick={() => setActiveTab('keyword')}
            className={`legal-tab ${activeTab === 'keyword' ? 'legal-tab-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Keyword Search
          </button>
          <button
            onClick={() => setActiveTab('lawsearch')}
            className={`legal-tab ${activeTab === 'lawsearch' ? 'legal-tab-active' : ''}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Law Section Search
          </button>
        </div>
      </nav>

      {/* Page Content */}
      <main>
        {activeTab === 'keyword' ? <LegalChatbot /> : <LawSearch />}
      </main>
    </div>
  );
}

export default App;