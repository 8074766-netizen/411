
import React, { useEffect, useState, useRef } from 'react';
import { getSalesFeedback } from '../services/geminiService';
import { Persona, SessionFeedback } from '../types';

interface FeedbackDisplayProps {
  transcript: string[];
  persona: Persona;
  onClose: () => void;
  onFeedbackGenerated?: (feedback: SessionFeedback) => void;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ transcript, persona, onClose, onFeedbackGenerated }) => {
  const [feedback, setFeedback] = useState<SessionFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const reportedRef = useRef(false);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!transcript || transcript.length === 0) {
        console.warn("No transcript data available for feedback.");
        setLoading(false);
        return;
      }

      try {
        const fullTranscript = transcript.join('\n\n');
        const result = await getSalesFeedback(fullTranscript, persona);
        setFeedback(result);

        if (onFeedbackGenerated && !reportedRef.current) {
          onFeedbackGenerated(result);
          reportedRef.current = true;
        }
      } catch (err) {
        console.error("Feedback generation failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [transcript, persona, onFeedbackGenerated]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Analyzing your sales performance...</p>
        <p className="text-slate-400 text-xs text-center max-w-sm">Comparing pitch to 2024 script standards and ARC objection handling.</p>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-6 text-center px-4">
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">No Evaluation Data</h2>
          <p className="text-slate-500 max-w-md">
            We couldn't generate an evaluation for this session. This usually happens if the conversation was too short or if there was a connection issue.
          </p>
        </div>
        <button
          onClick={onClose}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Session Evaluation</h2>
        <button
          onClick={onClose}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Score Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="text-6xl font-black">#1</span>
          </div>
          <p className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Total Rating</p>
          <div className={`text-6xl font-black mb-3 ${(feedback?.score || 0) >= 80 ? 'text-green-600' : (feedback?.score || 0) >= 60 ? 'text-orange-600' : 'text-red-600'
            }`}>
            {feedback?.score}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-1000 ${(feedback?.score || 0) >= 80 ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${feedback?.score}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{feedback?.summary}"</p>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 flex flex-col justify-center space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Ratings</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">Rebuttal Handling (ARC Method)</span>
                <span className="font-black text-orange-600">{feedback?.rebuttalScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full transition-all duration-1000 shadow-sm" style={{ width: `${feedback?.rebuttalScore}%` }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-700">Script Accuracy (Verbatim)</span>
                <span className="font-black text-blue-600">{feedback?.scriptAdherenceScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-1000 shadow-sm" style={{ width: `${feedback?.scriptAdherenceScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 shadow-sm">
          <p className="text-xs text-green-700 uppercase font-bold mb-4 flex items-center tracking-widest">
            <span className="mr-2">⭐</span> Key Strengths
          </p>
          <ul className="space-y-3">
            {feedback.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-green-800 flex items-start">
                <span className="mr-3 text-green-400 mt-1">▶</span> {s}
              </li>
            ))}
            {(!feedback.strengths || feedback.strengths.length === 0) && (
              <li className="text-sm text-green-700 italic opacity-60">No specific strengths identified.</li>
            )}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-xs text-red-700 uppercase font-bold mb-4 flex items-center tracking-widest">
            <span className="mr-2">📉</span> Critical Feedback
          </p>
          <ul className="space-y-3">
            {feedback.improvements?.map((im, i) => (
              <li key={i} className="text-sm text-red-800 flex items-start">
                <span className="mr-3 text-red-400 mt-1">▶</span> {im}
              </li>
            ))}
            {(!feedback.improvements || feedback.improvements.length === 0) && (
              <li className="text-sm text-red-700 italic opacity-60">No major improvements needed.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-xl font-bold border-b border-slate-100 pb-4">Professional Pitch Analysis</h3>
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
          {feedback?.detailedAnalysis}
        </div>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-[0.2em]">Session Logs</h4>
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {transcript.map((line, i) => (
            <div key={i} className="text-[11px] text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              {line.split('\n').map((l, idx) => (
                <p key={idx} className={l.startsWith('Rep:') ? 'text-blue-600 font-bold mb-1' : 'text-slate-800 font-medium mb-1'}>
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay;
