
import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import KnowledgeHub from './components/KnowledgeHub';
import RoleplayLab from './components/RoleplayLab';
import LiveSession from './components/LiveSession';
import FeedbackDisplay from './components/FeedbackDisplay';
import { AppMode, Persona, RoleplayResult, SessionFeedback } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<RoleplayResult[]>([]);

  const startRoleplay = (persona: Persona) => {
    setActivePersona(persona);
    setIsLiveActive(true);
  };

  const handleEndLive = (transcript: string[]) => {
    setCurrentTranscript(transcript);
    setIsLiveActive(false);
    setMode(AppMode.FEEDBACK);
  };

  const saveSessionResult = useCallback((feedback: SessionFeedback) => {
    if (!activePersona) return;
    
    const result: RoleplayResult = {
      persona: activePersona,
      transcript: currentTranscript,
      feedback: feedback,
      date: new Date()
    };
    
    setSessionHistory(prev => [result, ...prev]);
  }, [activePersona, currentTranscript]);

  const renderContent = () => {
    if (isLiveActive && activePersona) {
      return <LiveSession persona={activePersona} onEndSession={handleEndLive} />;
    }

    switch (mode) {
      case AppMode.DASHBOARD:
        return <Dashboard history={sessionHistory} />;
      case AppMode.KNOWLEDGE_BASE:
        return <KnowledgeHub />;
      case AppMode.ROLEPLAY:
        return <RoleplayLab onStartSession={startRoleplay} />;
      case AppMode.FEEDBACK:
        return activePersona ? (
          <FeedbackDisplay 
            transcript={currentTranscript} 
            persona={activePersona} 
            onFeedbackGenerated={saveSessionResult}
            onClose={() => {
              setMode(AppMode.ROLEPLAY);
              setActivePersona(null);
            }} 
          />
        ) : <Dashboard history={sessionHistory} />;
      default:
        return <Dashboard history={sessionHistory} />;
    }
  };

  return (
    <Layout activeMode={mode} onModeChange={(m) => { setMode(m); setIsLiveActive(false); }}>
      {renderContent()}
    </Layout>
  );
};

export default App;
