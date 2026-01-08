
import React, { useState } from 'react';
import { PERSONAS } from '../constants';
import { Persona } from '../types';

interface RoleplayLabProps {
  onStartSession: (persona: Persona) => void;
}

const RoleplayLab: React.FC<RoleplayLabProps> = ({ onStartSession }) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Challenge Selection</h2>
        <p className="text-slate-600 font-medium">
          Select a prospect below to begin a high-fidelity voice simulation. Each persona has unique behavioral triggers based on our 2024 script standards.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PERSONAS.map((p) => (
          <div 
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex flex-col cursor-pointer transition-all duration-500 transform rounded-3xl border-2 p-8 overflow-hidden relative group ${
              selected === p.id 
                ? 'border-orange-500 bg-orange-50/30 scale-[1.02] shadow-2xl ring-4 ring-orange-500/10' 
                : 'border-slate-200 bg-white hover:border-orange-200 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {/* Header */}
            <div className="flex items-center space-x-5 mb-6">
              <div className="relative">
                <img src={p.avatar} alt={p.name} className="w-16 h-16 rounded-2xl border-2 border-white shadow-md object-cover" />
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter text-white ${
                  p.difficulty === 'Easy' ? 'bg-green-500' : 
                  p.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-red-600'
                }`}>
                  {p.difficulty}
                </div>
              </div>
              <div className="overflow-hidden">
                <h3 className="font-black text-xl text-slate-900 truncate">{p.name}</h3>
                <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest truncate">
                  {p.role} @ {p.company}
                </p>
              </div>
            </div>
            
            {/* Business Contact Snippet */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-white transition-colors">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Address</p>
              <p className="text-[11px] font-bold text-slate-700">{p.address}, {p.city}, {p.province} {p.postalCode}</p>
              <p className="text-[11px] font-medium text-slate-500">{p.phone}</p>
            </div>

            {/* Description */}
            <div className="flex-1 mb-8">
              <div className="relative">
                <span className="absolute -top-4 -left-2 text-4xl text-slate-100 font-serif select-none pointer-events-none">“</span>
                <p className="text-sm text-slate-600 leading-relaxed font-medium relative z-10 italic">
                  {p.personality}
                </p>
              </div>
            </div>
            
            {/* Metadata Section */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Common Objections</p>
                <div className="flex flex-wrap gap-2">
                  {p.objections.map((obj, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 group-hover:bg-white transition-colors">
                      {obj}
                    </span>
                  ))}
                </div>
              </div>

              {selected === p.id && (
                <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSession(p);
                    }}
                    className="w-full bg-slate-900 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center space-x-3 active:scale-95 group/btn"
                  >
                    <span className="text-xs uppercase tracking-[0.2em]">Initiate Live Call</span>
                    <span className="text-xl group-hover/btn:animate-bounce">🎙️</span>
                  </button>
                </div>
              )}
            </div>

            {/* Selection Indicator */}
            {selected === p.id && (
              <div className="absolute top-4 right-4">
                <div className="bg-orange-500 text-white rounded-full p-1.5 shadow-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleplayLab;
