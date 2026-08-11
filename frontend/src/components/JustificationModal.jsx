import React, { useState, useEffect } from "react";
import {
  X,
  Scale,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  FileText,
  Layers,
} from "lucide-react";

const API_URL = "http://localhost:5000";

/* ── Shared spinner ──────────────────────────────────────────────────────── */
const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="relative">
      <div className="w-14 h-14 rounded-full" style={{ border: "3px solid rgba(99,102,241,0.2)" }} />
      <div
        className="absolute inset-0 w-14 h-14 rounded-full animate-spin"
        style={{ border: "3px solid transparent", borderTopColor: "#6366f1" }}
      />
    </div>
    <p className="text-slate-400 text-sm animate-pulse">Analysing past case records...</p>
  </div>
);

/* ── Judgement section (Common or Different) ─────────────────────────────── */
const JudgementSection = ({ items, type }) => {
  const isCommon = type === "common";
  const color    = isCommon ? "#34d399" : "#fbbf24";
  const bg       = isCommon ? "rgba(16,185,129,0.08)"  : "rgba(245,158,11,0.08)";
  const border   = isCommon ? "rgba(16,185,129,0.2)"   : "rgba(245,158,11,0.2)";
  const iconBg   = isCommon ? "rgba(16,185,129,0.2)"   : "rgba(245,158,11,0.2)";
  const numBg    = isCommon ? "rgba(16,185,129,0.3)"   : "rgba(245,158,11,0.3)";
  const Icon     = isCommon ? CheckCircle : AlertTriangle;
  const title    = isCommon ? "Common Judgements" : "Different / Notable Judgements";
  const subtitle = isCommon ? "— repeated patterns across cases" : "— exceptional outcomes";

  if (!items || items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} className={isCommon ? "text-emerald-400" : "text-amber-400"} />
        </div>
        <h3 className="text-base font-bold" style={{ color }}>{title}</h3>
        <span className="text-xs text-slate-500 ml-1">{subtitle}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="p-4 rounded-xl text-sm leading-relaxed transition-all hover:scale-[1.01]"
            style={{ background: bg, border: `1px solid ${border}`, color: "#cbd5e1" }}
          >
            <div className="flex gap-3">
              <div
                className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: numBg, color }}
              >
                {i + 1}
              </div>
              <p>{item}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Modal ──────────────────────────────────────────────────────────── */
const JustificationModal = ({ law, laws, onClose }) => {
  const [data, setData]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState(null);
  const [activeTab, setActiveTab] = useState("combined"); // 'combined' | section label

  const isCombined = !!laws && laws.length > 1;

  /* ── Fetch ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchJustification = async () => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        let body;
        if (isCombined) {
          body = {
            sections: laws.map(l => ({ ipc: l.IPC, bns: l.BNS })),
          };
        } else {
          body = { ipc: law.IPC };
        }

        const response = await fetch(`${API_URL}/api/justification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error("Failed to fetch justification data.");
        setData(await response.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (law || (laws && laws.length > 0)) fetchJustification();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [law, laws]);

  /* ── Active data slice ───────────────────────────────────────────────── */
  const activeData = (() => {
    if (!data) return null;
    if (!isCombined || activeTab === "combined") {
      return { common: data.common, different: data.different, conclusion: data.conclusion };
    }
    const sec = (data.per_section || []).find(s => s.label === activeTab);
    return sec ? { common: sec.common, different: sec.different, conclusion: sec.conclusion } : null;
  })();

  if (!law && (!laws || laws.length === 0)) return null;

  /* ── Modal title info ────────────────────────────────────────────────── */
  const title = isCombined
    ? `Combined Judgement (${laws.length} sections)`
    : law.Description;

  const badges = isCombined
    ? laws.map(l => [
        { label: `IPC ${l.IPC}`, style: { background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" } },
        { label: `BNS ${l.BNS}`, style: { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" } },
      ]).flat()
    : [
        { label: `IPC ${law.IPC}`, style: { background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" } },
        { label: `BNS ${law.BNS}`, style: { background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" } },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid rgba(99,102,241,0.3)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 px-6 pt-6 pb-4 rounded-t-2xl"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4 pr-8">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: isCombined ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {isCombined ? <Layers size={22} className="text-white" /> : <Scale size={22} className="text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{title}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {badges.map((b, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold" style={b.style}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <BookOpen size={15} className="text-indigo-400" />
            <p className="text-sm text-indigo-300 font-medium">
              {isCombined ? "Combined Case Justification Analysis" : "Case Justification Analysis"}
            </p>
            {data && !isLoading && (
              <span className="ml-auto text-xs text-slate-500">{data.total_cases} cases analysed</span>
            )}
          </div>

          {/* ── Section tabs (combined mode only) ── */}
          {isCombined && data && !isLoading && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("combined")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeTab === "combined"
                    ? "bg-amber-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                All Combined
              </button>
              {(data.per_section || []).map(sec => (
                <button
                  key={sec.label}
                  onClick={() => setActiveTab(sec.label)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    activeTab === sec.label
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">
          {isLoading && <Spinner />}

          {error && !isLoading && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {activeData && !isLoading && !error && (
            <div className="space-y-6">
              <JudgementSection items={activeData.common}    type="common" />

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,0.2)" }} />
                <FileText size={14} className="text-slate-500" />
                <div className="flex-1 h-px" style={{ background: "rgba(99,102,241,0.2)" }} />
              </div>

              <JudgementSection items={activeData.different} type="different" />

              {/* Conclusion Section (Red Theme) */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}>
                    <FileText size={15} className="text-red-400" />
                  </div>
                  <h3 className="text-base font-bold" style={{ color: "#f87171" }}>Conclusion</h3>
                  <span className="text-xs text-slate-500 ml-1">— legal application summary</span>
                </div>
                <div
                  className="p-4 rounded-xl text-sm leading-relaxed border"
                  style={{ 
                    background: "rgba(239,68,68,0.08)", 
                    borderColor: "rgba(239,68,68,0.2)", 
                    color: "#cbd5e1" 
                  }}
                >
                  <p>{activeData.conclusion}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JustificationModal;
