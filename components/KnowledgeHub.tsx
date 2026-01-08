
import React, { useState, useRef, useEffect } from 'react';
import { getKnowledgeResponse } from '../services/geminiService';
import { Message } from '../types';
import { COMPANY_MANUAL } from '../constants';

interface ExtendedMessage extends Message {
  sources?: any[];
}

const KnowledgeHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'MANUAL'>('CHAT');
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { 
      role: 'assistant', 
      content: "Hi there! I'm your training mentor. Ready to master the 411 Smart Search script? You can ask me about package pricing, handle common objections, or walk through the ARC method. What's on your mind?", 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ExtendedMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await getKnowledgeResponse(input, messages);
      const assistantMsg: ExtendedMessage = { 
        role: 'assistant', 
        content: result.text || '', 
        timestamp: new Date(),
        sources: result.sources 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I hit a little snag there. Could you try asking that again?", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatContent = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50">
        <button 
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'CHAT' ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'text-slate-500 hover:bg-white'}`}
        >
          Ask Sales Mentor AI
        </button>
        <button 
          onClick={() => setActiveTab('MANUAL')}
          className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'MANUAL' ? 'text-orange-600 border-b-2 border-orange-600 bg-white' : 'text-slate-500 hover:bg-white'}`}
        >
          2024 Training Manual
        </button>
      </div>

      {activeTab === 'CHAT' ? (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl transition-all ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none shadow-lg' 
                    : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {formatContent(m.content)}
                  </div>
                  
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Sources</p>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((source: any, idx: number) => (
                          source.web && (
                            <a 
                              key={idx} 
                              href={source.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] bg-white px-2 py-1 rounded border border-slate-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors"
                            >
                              {source.web.title || 'Source'}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <p className={`text-[9px] mt-2 font-bold uppercase tracking-wider opacity-40 text-right`}>
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-none flex flex-col space-y-2">
                   <div className="flex space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter animate-pulse">Consulting Grounding Data...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about competitors, script details, or SEO..."
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm outline-none transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={isTyping}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-all flex items-center shadow-lg shadow-orange-900/20 active:scale-95"
              >
                <span className="font-bold text-xs uppercase tracking-widest">Ask</span>
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-3xl mx-auto prose prose-slate">
            <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">411 SMART SEARCH.CA - 2024 ACADEMY</h1>
            <div className="space-y-8 text-slate-700">
              {COMPANY_MANUAL.split('\n\n').map((section, idx) => (
                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {section.trim()}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeHub;
