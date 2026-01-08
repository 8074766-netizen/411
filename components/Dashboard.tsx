
import React from 'react';
import { RoleplayResult } from '../types';

interface DashboardProps {
  history: RoleplayResult[];
}

const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  const totalPitches = history.length;

  const avgOverall = totalPitches > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.feedback?.score || 0), 0) / totalPitches)
    : 0;

  const avgRebuttal = totalPitches > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.feedback?.rebuttalScore || 0), 0) / totalPitches)
    : 0;

  const avgScript = totalPitches > 0
    ? Math.round(history.reduce((acc, curr) => acc + (curr.feedback?.scriptAdherenceScore || 0), 0) / totalPitches)
    : 0;

  const highPerformers = history.filter(h => (h.feedback?.score || 0) >= 80).length;
  const successRate = totalPitches > 0 ? Math.round((highPerformers / totalPitches) * 100) : 0;

  const stats = [
    { label: 'Pitches Practiced', value: totalPitches.toString(), trend: `+${history.length} total`, color: 'orange' },
    { label: 'Overall Quality', value: `${avgOverall}%`, trend: 'Avg. across all', color: 'green' },
    { label: 'Rebuttal Skill', value: `${avgRebuttal}%`, trend: 'ARC Accuracy', color: 'purple' },
    { label: 'Script Accuracy', value: `${avgScript}%`, trend: 'Verbatim Rating', color: 'blue' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Training Dashboard</h2>
          <p className="text-slate-500 mt-1">
            {totalPitches === 0
              ? "Welcome! Start your first roleplay to generate performance data."
              : `Tracking performance from ${totalPitches} training sessions.`}
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-400 font-bold uppercase">Rep Level</p>
          <p className="text-sm font-bold text-orange-600">
            {avgOverall >= 90 ? 'Platinum Rep' : avgOverall >= 75 ? 'Gold Tier' : 'Junior Associate'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{s.label}</p>
            <div className={`text-4xl font-black mb-3 text-slate-900 group-hover:text-orange-600 transition-colors`}>{s.value}</div>
            <p className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">{s.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-xl">Script Mastery Progress</h3>
            <span className="text-xs text-blue-600 font-bold uppercase tracking-widest">Historical Trends</span>
          </div>
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm">No roleplay history yet.</p>
              </div>
            ) : (
              history.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-slate-200 hover:shadow-sm group">
                  <div className="flex items-center">
                    <img src={item.persona.avatar} alt={item.persona.name} className="w-10 h-10 rounded-full mr-4 border-2 border-white shadow-sm" />
                    <div>
                      <span className="text-sm font-bold block text-slate-900 group-hover:text-orange-600 transition-colors">{item.persona.name}</span>
                      <div className="flex space-x-3 mt-1">
                        <span className="text-[9px] text-slate-500 uppercase font-bold">ARC: {item.feedback?.rebuttalScore}%</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Verbatim: {item.feedback?.scriptAdherenceScore}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-black block ${(item.feedback?.score || 0) >= 80 ? 'text-green-600' : (item.feedback?.score || 0) >= 60 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                      {item.feedback?.score}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="text-9xl">📖</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-3">Skill Radar</h3>
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">ARC Method Handling</span>
                  <span className="text-orange-400">{avgRebuttal}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-600 h-full transition-all duration-1000" style={{ width: `${avgRebuttal}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Verbatim Accuracy</span>
                  <span className="text-blue-400">{avgScript}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${avgScript}%` }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400">Overall Rep Success</span>
                  <span className="text-green-400">{successRate}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${successRate}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              Certification Goal: 5 Calls at {'>'}85% Overall Score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
