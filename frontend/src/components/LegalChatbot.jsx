import React, { useState, useEffect } from 'react';
import { Search, Scale, BookOpen, AlertCircle, ChevronDown, X, Check, Loader, Gavel, Layers } from 'lucide-react';
import JustificationModal from './JustificationModal';

const API_URL = 'http://localhost:5000';

const LegalChatbot = () => {
  const [allKeywords, setAllKeywords] = useState([]);
  const [selectedKeywords, setSelectedKeywords] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [justificationLaw, setJustificationLaw] = useState(null);

  // Combined judgement selection
  const [selectedForCombined, setSelectedForCombined] = useState([]); // array of rule objects
  const [combinedMode, setCombinedMode] = useState(false);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetch(`${API_URL}/api/keywords`);
        if (!response.ok) {
          throw new Error('Failed to fetch keywords. Please make sure the backend server is running.');
        }
        const data = await response.json();
        setAllKeywords(data.keywords || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchKeywords();
  }, []);

  const keywordColors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-indigo-500',
    'bg-yellow-500', 'bg-pink-500', 'bg-teal-500'
  ];

  const getKeywordColor = (keyword) => {
    const index = allKeywords.indexOf(keyword);
    return keywordColors[index % keywordColors.length];
  };

  const handleKeywordToggle = (keyword) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const handleSearch = async () => {
    try {
      setError(null);
      setIsLoading(true);
      setShowResults(true);
      setSelectedForCombined([]);
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: selectedKeywords }),
      });
      if (!response.ok) throw new Error('Failed to fetch search results.');
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedKeywords([]);
    setSearchResults([]);
    setShowResults(false);
    setExpandedCategory(null);
    setError(null);
    setSelectedForCombined([]);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Toggle a rule in/out of combined selection
  const toggleCombinedSelect = (rule) => {
    setSelectedForCombined(prev => {
      const exists = prev.find(r => r.IPC === rule.IPC && r.BNS === rule.BNS);
      return exists
        ? prev.filter(r => !(r.IPC === rule.IPC && r.BNS === rule.BNS))
        : [...prev, rule];
    });
  };

  const isSelectedForCombined = (rule) =>
    selectedForCombined.some(r => r.IPC === rule.IPC && r.BNS === rule.BNS);

  // Open combined justification modal
  const handleOpenCombined = () => {
    if (selectedForCombined.length < 2) return;
    setCombinedMode(true);
    setJustificationLaw(selectedForCombined);
  };

  const groupedResults = searchResults.reduce((acc, rule) => {
    const category = rule.Category[0];
    if (!acc[category]) acc[category] = [];
    acc[category].push(rule);
    return acc;
  }, {});

  return (
    <>
      {/* Justification Modal — single or combined */}
      {justificationLaw && (
        <JustificationModal
          law={combinedMode ? null : justificationLaw}
          laws={combinedMode ? justificationLaw : null}
          onClose={() => { setJustificationLaw(null); setCombinedMode(false); }}
        />
      )}

      <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 font-sans antialiased">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/lady-justice.jpg')" }}
        />

        <div className="relative z-10 container mx-auto p-4 md:p-8 lg:p-12 max-w-4xl">
          <header className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
              <Scale className="inline-block h-12 w-12 md:h-16 md:w-16 text-blue-600 mr-3" />
              Legal Expert System
            </h1>
            <p className="text-xl text-gray-700 font-light">Your intelligent guide to Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS) sections</p>
          </header>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-10 mb-8 border border-blue-200">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-5 flex items-center">
                <Search className="mr-4 text-blue-600" size={28} />
                Select Keywords to Begin
              </h2>
              {allKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {allKeywords.map(keyword => (
                    <button
                      key={keyword}
                      onClick={() => handleKeywordToggle(keyword)}
                      className={`
                        px-5 py-2 rounded-full text-base font-medium transition-all duration-300 ease-in-out
                        ${selectedKeywords.includes(keyword)
                          ? `${getKeywordColor(keyword)} text-white shadow-lg transform scale-105`
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
                        }
                        flex items-center
                      `}
                    >
                      {selectedKeywords.includes(keyword) && <Check size={18} className="inline mr-2" />}
                      {keyword}
                    </button>
                  ))}
                </div>
              ) : (
                <p>Loading keywords...</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleSearch}
                disabled={selectedKeywords.length === 0 || isLoading}
                className="
                  bg-blue-600 text-white px-10 py-4 rounded-lg font-bold text-xl shadow-lg
                  hover:bg-blue-700 transition-all duration-300 ease-in-out transform hover:scale-105
                  disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                  flex items-center justify-center
                "
              >
                {isLoading ? <Loader className="animate-spin mr-3" size={24} /> : <Search className="mr-3" size={24} />}
                {isLoading ? 'Searching...' : 'Search Legal Sections'}
              </button>
              <button
                onClick={handleReset}
                className="
                  bg-gray-500 text-white px-10 py-4 rounded-lg font-bold text-xl shadow-lg
                  hover:bg-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105
                  flex items-center justify-center
                "
              >
                <X className="mr-3" size={24} /> Reset Keywords
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-10 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md" role="alert">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}

          {showResults && !isLoading && !error && (
            <div className="mt-10 bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-10 border border-green-200">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h2 className="text-3xl font-bold text-gray-800 flex items-center">
                  <BookOpen className="mr-4 text-green-600" size={28} />
                  Search Results
                </h2>

                {/* Combined Judgement bar */}
                {selectedForCombined.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">
                      {selectedForCombined.length} section{selectedForCombined.length > 1 ? 's' : ''} selected
                    </span>
                    {selectedForCombined.length >= 2 && (
                      <button
                        onClick={handleOpenCombined}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                          color: 'white'
                        }}
                      >
                        <Layers size={16} />
                        Combined Judgement
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedForCombined([])}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Selection hint */}
              {searchResults.length > 0 && selectedForCombined.length === 0 && (
                <p className="text-sm text-indigo-500 mb-4 flex items-center gap-2">
                  <Layers size={14} />
                  Tip: Select multiple law cards to get a <strong>Combined Judgement</strong>
                </p>
              )}

              {Object.keys(groupedResults).length > 0 ? (
                <div className="space-y-5">
                  {Object.entries(groupedResults).map(([category, rules]) => (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <button
                        onClick={() => toggleCategory(category)}
                        className={`
                          w-full flex justify-between items-center p-5 bg-gray-50 hover:bg-gray-100 focus:outline-none
                          transition-all duration-300 ease-in-out
                          ${expandedCategory === category ? 'bg-blue-100 text-blue-800' : 'text-gray-800'}
                        `}
                      >
                        <h3 className="text-xl font-semibold">{category} ({rules.length})</h3>
                        <ChevronDown
                          className={`transform transition-transform duration-300 ${
                            expandedCategory === category ? 'rotate-180 text-blue-600' : 'text-gray-500'
                          }`}
                          size={24}
                        />
                      </button>
                      {expandedCategory === category && (
                        <div className="p-5 border-t border-gray-200 bg-white">
                          {rules.map((rule, index) => {
                            const selected = isSelectedForCombined(rule);
                            return (
                              <div
                                key={index}
                                className={`mb-4 p-4 rounded-md border-l-4 shadow-sm last:mb-0 transition-all duration-200 ${
                                  selected
                                    ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300'
                                    : 'bg-blue-50 border-blue-400'
                                }`}
                              >
                                <p className="font-bold text-lg text-gray-900 mb-2">{rule.Description}</p>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  {/* Left: IPC / BNS codes */}
                                  <div className="flex flex-wrap items-center text-gray-700 text-sm gap-x-3">
                                    <Scale className="text-red-600" size={18} />
                                    <span className="font-semibold">IPC:</span>
                                    <span>{rule.IPC}</span>
                                    <span className="text-gray-400">|</span>
                                    <span className="font-semibold">BNS:</span>
                                    <span>{rule.BNS}</span>
                                  </div>

                                  {/* Right: buttons */}
                                  <div className="flex items-center gap-2">
                                    {/* Checkbox for combined selection */}
                                    <button
                                      onClick={() => toggleCombinedSelect(rule)}
                                      title={selected ? 'Remove from combined' : 'Add to combined judgement'}
                                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                                        selected
                                          ? 'bg-indigo-600 text-white border-indigo-600'
                                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                                      }`}
                                    >
                                      {selected ? <Check size={13} /> : <Layers size={13} />}
                                      {selected ? 'Selected' : 'Select'}
                                    </button>

                                    {/* Individual justification */}
                                    <button
                                      onClick={() => { setCombinedMode(false); setJustificationLaw(rule); }}
                                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:shadow-md active:scale-95"
                                      style={{
                                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                        color: 'white'
                                      }}
                                    >
                                      <Gavel size={15} />
                                      Justification
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200">
                  <AlertCircle className="mx-auto text-yellow-500 h-16 w-16 mb-6" />
                  <p className="text-2xl font-semibold text-gray-700 mb-2">No matching legal sections found.</p>
                  <p className="text-lg text-gray-500">Try selecting a different combination of keywords or fewer keywords.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LegalChatbot;