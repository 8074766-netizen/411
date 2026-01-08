
import React from 'react';
import { AppMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeMode, onModeChange }) => {
  const navItems = [
    { id: AppMode.DASHBOARD, label: 'Overview', icon: '📊' },
    { id: AppMode.KNOWLEDGE_BASE, label: 'Manual & Q&A', icon: '📚' },
    { id: AppMode.ROLEPLAY, label: 'Sales Roleplay', icon: '🎤' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            411 Academy
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">2024 Sales Training</p>
        </div>
        
        <nav className="flex-1 mt-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`w-full flex items-center px-4 py-4 text-sm font-bold rounded-xl transition-all ${
                activeMode === item.id 
                  ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/40 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3 text-lg opacity-80">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Certification</p>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold">Gold Tier</span>
              <span className="text-[10px] text-orange-400 font-bold">85% Avg.</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-orange-500 h-full w-[85%] transition-all duration-1000"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
