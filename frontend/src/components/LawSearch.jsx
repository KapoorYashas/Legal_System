import React, { useState, useEffect } from 'react';
import { Scale, Loader, CheckCircle, AlertTriangle, BookOpen, Gavel, FileText, Layers, Plus, X } from 'lucide-react';
import JustificationModal from './JustificationModal';

const API_URL = 'http://localhost:5000';

const LawSearch = () => {
  const [allRules, setAllRules]               = useState([]);
  const [ipcCodes, setIpcCodes]               = useState([]);
  const [bnsCodes, setBnsCodes]               = useState([]);
  const [selectedIpc, setSelectedIpc]         = useState('');
  const [selectedBns, setSelectedBns]         = useState('');
  const [selectedLaw, setSelectedLaw]         = useState(null);
  const [justificationData, setJustificationData] = useState(null);
  const [isLoadingRules, setIsLoadingRules]   = useState(true);
  const [isLoadingJustification, setIsLoadingJustification] = useState(false);
  const [error, setError]                     = useState(null);

  // Combined section list
  const [combinedSections, setCombinedSections] = useState([]); // array of rule objects

  // Popup modal (single or combined)
  const [modalLaw, setModalLaw]   = useState(null);
  const [modalLaws, setModalLaws] = useState(null);

  // Active inline tab for results
  const [activeTab, setActiveTab] = useState('combined'); // 'combined' | section label

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch(`${API_URL}/api/rules`);
        if (!res.ok) throw new Error('Failed to fetch rules');
        const data = await res.json();
        const rules = data.rules || [];
        setAllRules(rules);
        setIpcCodes(rules.map(r => r.IPC).sort());
        setBnsCodes(rules.map(r => r.BNS).sort());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingRules(false);
      }
    };
    fetchRules();
  }, []);

  const handleIpcChange = (ipc) => {
    setSelectedIpc(ipc);
    setSelectedBns('');
    setSelectedLaw(null);
    setJustificationData(null);
    if (ipc) {
      const rule = allRules.find(r => r.IPC === ipc);
      if (rule) { setSelectedBns(rule.BNS); setSelectedLaw(rule); }
    }
  };

  const handleBnsChange = (bns) => {
    setSelectedBns(bns);
    setSelectedIpc('');
    setSelectedLaw(null);
    setJustificationData(null);
    if (bns) {
      const rule = allRules.find(r => r.BNS === bns);
      if (rule) { setSelectedIpc(rule.IPC); setSelectedLaw(rule); }
    }
  };

  // Add current selection to combined list
  const addToCombined = () => {
    if (!selectedLaw) return;
    const already = combinedSections.find(r => r.IPC === selectedLaw.IPC);
    if (!already) setCombinedSections(prev => [...prev, selectedLaw]);
  };

  const removeFromCombined = (rule) =>
    setCombinedSections(prev => prev.filter(r => r.IPC !== rule.IPC));

  // Get justification — single or combined
  const handleGetJustification = async () => {
    const isCombined = combinedSections.length >= 2;
    setIsLoadingJustification(true);
    setJustificationData(null);
    setError(null);
    setActiveTab('combined');
    try {
      let body;
      if (isCombined) {
        body = { sections: combinedSections.map(r => ({ ipc: r.IPC, bns: r.BNS })) };
      } else {
        const target = combinedSections[0] || selectedLaw;
        body = { ipc: target.IPC };
      }
      const res = await fetch(`${API_URL}/api/justification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to fetch justification');
      setJustificationData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingJustification(false);
    }
  };

  // Active data for inline results
  const activeData = (() => {
    if (!justificationData) return null;
    const isCombined = justificationData.mode === 'combined';
    if (!isCombined || activeTab === 'combined') {
      return { common: justificationData.common, different: justificationData.different, conclusion: justificationData.conclusion };
    }
    const sec = (justificationData.per_section || []).find(s => s.label === activeTab);
    return sec ? { common: sec.common, different: sec.different, conclusion: sec.conclusion } : null;
  })();

  const canSearch = combinedSections.length >= 1 || !!selectedLaw;
  const isCombinedMode = combinedSections.length >= 2;

  const selectStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(99,102,241,0.3)',
    color: 'white',
    borderRadius: '12px',
    padding: '14px 18px',
    fontSize: '15px',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '44px',
  };

  return (
    <>
      {/* Single popup */}
      {modalLaw && !modalLaws && (
        <JustificationModal law={modalLaw} onClose={() => setModalLaw(null)} />
      )}
      {/* Combined popup */}
      {modalLaws && (
        <JustificationModal laws={modalLaws} onClose={() => setModalLaws(null)} />
      )}

      <div className="min-h-screen text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3c 50%, #0f172a 100%)' }}>
        <div className="fixed inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.6) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 container mx-auto px-4 py-12 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Scale size={36} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Law Section Search
            </h1>
            <p className="text-slate-400 text-lg">Search by IPC or BNS section — add multiple for a Combined Judgement</p>
          </div>

          {/* Search Card */}
          <div className="rounded-2xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(20px)' }}>
            {isLoadingRules ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader className="animate-spin text-indigo-400" size={24} />
                <span className="text-slate-400">Loading law sections...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* IPC Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(239,68,68,0.3)', color: '#f87171' }}>IPC</span>
                      Indian Penal Code Section
                    </label>
                    <select value={selectedIpc} onChange={e => handleIpcChange(e.target.value)} style={selectStyle}>
                      <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>— Select IPC Section —</option>
                      {ipcCodes.map(code => (
                        <option key={code} value={code} style={{ background: '#1e293b', color: 'white' }}>IPC {code}</option>
                      ))}
                    </select>
                  </div>

                  {/* BNS Dropdown */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>BNS</span>
                      Bharatiya Nyaya Sanhita Section
                    </label>
                    <select value={selectedBns} onChange={e => handleBnsChange(e.target.value)} style={selectStyle}>
                      <option value="" style={{ background: '#1e293b', color: '#94a3b8' }}>— Select BNS Section —</option>
                      {bnsCodes.map(code => (
                        <option key={code} value={code} style={{ background: '#1e293b', color: 'white' }}>BNS {code}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Selected Law Preview */}
                {selectedLaw && (
                  <div className="mb-6">
                    <div className="p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 mb-3">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <BookOpen size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white mb-1">{selectedLaw.Description}</h4>
                          <div className="flex gap-3">
                            <span className="text-xs font-bold text-red-400">IPC {selectedLaw.IPC}</span>
                            <span className="text-xs font-bold text-purple-400">BNS {selectedLaw.BNS}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={addToCombined}
                      disabled={combinedSections.some(r => r.IPC === selectedLaw.IPC)}
                      className="w-full py-3 rounded-xl border border-dashed border-indigo-400/50 text-indigo-300 font-bold flex items-center justify-center gap-2 hover:bg-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {combinedSections.some(r => r.IPC === selectedLaw.IPC) ? (
                        <><CheckCircle size={18} /> Section already in combined list</>
                      ) : (
                        <><Plus size={18} /> Add this section to Combined Judgement</>
                      )}
                    </button>
                  </div>
                )}

                {/* Combined sections list */}
                {combinedSections.length > 0 && (
                  <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={15} className="text-amber-400" />
                      <span className="text-sm font-semibold text-amber-300">Combined Sections ({combinedSections.length})</span>
                      {combinedSections.length >= 2 && (
                        <span className="ml-auto text-xs text-amber-500">Ready for combined analysis</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {combinedSections.map(rule => (
                        <div key={rule.IPC} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}>
                          <span>IPC {rule.IPC} / BNS {rule.BNS}</span>
                          <button onClick={() => removeFromCombined(rule)} className="ml-1 hover:text-white transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={handleGetJustification}
                  disabled={!canSearch || isLoadingJustification}
                  className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{ background: isCombinedMode ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
                >
                  {isLoadingJustification ? (
                    <><Loader className="animate-spin" size={22} /> Analysing Cases...</>
                  ) : isCombinedMode ? (
                    <><Layers size={22} /> Get Combined Judgement</>
                  ) : (
                    <><Gavel size={22} /> Get Case Justification</>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {justificationData && !isLoadingJustification && (
            <div className="space-y-6">
              {/* Stats + tabs + popup link */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-indigo-400" />
                    <span className="text-slate-300 text-sm font-medium">
                      Analysis based on <span className="text-white font-bold">{justificationData.total_cases}</span> case records
                      {justificationData.mode === 'combined' && <span className="text-amber-400 ml-2">· Combined</span>}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (justificationData.mode === 'combined') {
                        setModalLaws(combinedSections);
                      } else {
                        setModalLaw(combinedSections[0] || selectedLaw);
                      }
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-2"
                  >
                    Open in popup
                  </button>
                </div>

                {/* Section tabs (combined mode only) */}
                {justificationData.mode === 'combined' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTab('combined')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${activeTab === 'combined' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      All Combined
                    </button>
                    {(justificationData.per_section || []).map(sec => (
                      <button
                        key={sec.label}
                        onClick={() => setActiveTab(sec.label)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${activeTab === sec.label ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Common Judgements */}
              {activeData && (
                <>
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(16,185,129,0.25)' }}>
                    <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <CheckCircle size={20} className="text-emerald-400" />
                      <h3 className="text-lg font-bold" style={{ color: '#34d399' }}>Common Judgements</h3>
                      <span className="text-xs text-slate-500 ml-1">— repeated patterns across cases</span>
                    </div>
                    <div className="p-6 space-y-4" style={{ background: 'rgba(16,185,129,0.04)' }}>
                      {(activeData.common || []).map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(16,185,129,0.25)', color: '#34d399' }}>{i + 1}</div>
                          <p className="text-sm leading-relaxed text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Different Judgements */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <AlertTriangle size={20} className="text-amber-400" />
                      <h3 className="text-lg font-bold" style={{ color: '#fbbf24' }}>Different / Notable Judgements</h3>
                      <span className="text-xs text-slate-500 ml-1">— exceptional outcomes</span>
                    </div>
                    <div className="p-6 space-y-4" style={{ background: 'rgba(245,158,11,0.04)' }}>
                      {(activeData.different || []).map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(245,158,11,0.25)', color: '#fbbf24' }}>{i + 1}</div>
                          <p className="text-sm leading-relaxed text-slate-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusion Section (Red Theme) */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.25)' }}>
                    <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <FileText size={20} className="text-red-400" />
                      <h3 className="text-lg font-bold" style={{ color: '#f87171' }}>Conclusion</h3>
                      <span className="text-xs text-slate-500 ml-1">— legal application summary</span>
                    </div>
                    <div className="p-6" style={{ background: 'rgba(239,68,68,0.04)' }}>
                      <p className="text-base leading-relaxed text-slate-300 font-medium">
                        {activeData.conclusion}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LawSearch;
