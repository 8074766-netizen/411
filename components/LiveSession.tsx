
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Persona } from '../types';
import { decode, encode, decodeAudioData, createBlob } from '../services/audioUtils';
import { COMPANY_MANUAL, COMPANY_NAME } from '../constants';

interface LiveSessionProps {
  persona: Persona;
  onEndSession: (transcript: string[]) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ persona, onEndSession }) => {
  const [isActive, setIsActive] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [showLeadInfo, setShowLeadInfo] = useState(true);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const transcriptRef = useRef<string[]>([]);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const currentTurnTranscriptRef = useRef({ user: '', model: '' });

  const stopAllAudio = useCallback(() => {
    for (const source of sourcesRef.current.values()) {
      source.stop();
      sourcesRef.current.delete(source);
    }
    nextStartTimeRef.current = 0;
  }, []);

  const endSession = async () => {
    setIsEnding(true);
    if (sessionRef.current) {
      // sessionRef.current.close() is handled by cleanup usually but we can be explicit
    }
    onEndSession(transcriptRef.current);
  };

  useEffect(() => {
    // Create new instance here to ensure fresh session
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
      apiVersion: 'v1alpha'
    });
    let isMounted = true;

    const initSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextsRef.current = { input: inputCtx, output: outputCtx };

        let session: any = null;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.0-flash-exp',
          callbacks: {
            onopen: async () => {
              console.log('Live session connected');
              setIsActive(true);
              setConnectionError(null);

              if (inputCtx.state === 'suspended') await inputCtx.resume();
              if (outputCtx.state === 'suspended') await outputCtx.resume();

              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Calculate RMS level for UI feedback
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const level = Math.sqrt(sum / inputData.length);
                if (isMounted) setAudioLevel(level);

                const currentSession = sessionRef.current;
                if (!currentSession) return;

                const pcmBlob = createBlob(inputData);

                // Trying the most direct format which works in latest @google/genai
                currentSession.sendRealtimeInput([pcmBlob]);
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
              console.log('Microphone stream active');
            },
            onmessage: async (message) => {
              console.log('AI Message:', message);
              if (message.serverContent?.outputTranscription) {
                currentTurnTranscriptRef.current.model += message.serverContent.outputTranscription.text;
              } else if (message.serverContent?.inputTranscription) {
                currentTurnTranscriptRef.current.user += message.serverContent.inputTranscription.text;
              }

              if (message.serverContent?.turnComplete) {
                const entry = `${persona.name}: ${currentTurnTranscriptRef.current.model}\nRep: ${currentTurnTranscriptRef.current.user}`;
                transcriptRef.current.push(entry);
                setTranscription([...transcriptRef.current]);
                currentTurnTranscriptRef.current = { user: '', model: '' };
              }

              const modelTurn = message.serverContent?.modelTurn;
              if (modelTurn) {
                for (const part of modelTurn.parts) {
                  const audioData = part.inlineData?.data;
                  if (audioData) {
                    const { output: ctx } = audioContextsRef.current!;

                    // Gapless playback logic
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                    const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;
                    source.connect(ctx.destination);

                    source.addEventListener('ended', () => {
                      sourcesRef.current.delete(source);
                    });

                    source.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += buffer.duration;
                    sourcesRef.current.add(source);
                  }
                }
              }

              if (message.serverContent?.interrupted) {
                stopAllAudio();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => {
              console.error('Live session error:', e);
              if (isMounted) {
                setIsActive(false);
                setConnectionError("Connection to AI failed. Please check your API key and internet.");
              }
            },
            onclose: (e) => {
              console.log('Live session closed', e);
              if (isMounted) setIsActive(false);
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: persona.difficulty === 'Hard' ? 'Puck' : 'Kore'
                }
              },
            },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: `You are acting as ${persona.name}, ${persona.role} at ${persona.company}.
            Personality: ${persona.personality}.

            YOUR BUSINESS INFORMATION:
            - Address: ${persona.address}, ${persona.city}, ${persona.province}
            - Phone: ${persona.phone}

            DIRECTIONS:
            1. Respond naturally and promptly to audio input.
            2. If the user greets you, reply as the persona.
            3. Follow the sales training guidelines for objections and ARC method.
            4. Context: ${COMPANY_MANUAL}.`,
          },
        });

        session = await sessionPromise;
        sessionRef.current = session;
      } catch (err: any) {
        console.error("Failed to start session:", err);
        if (isMounted) setConnectionError(err.message || "Failed to access microphone.");
      }
    };

    initSession();

    return () => {
      isMounted = false;
      stopAllAudio();
      audioContextsRef.current?.input.close();
      audioContextsRef.current?.output.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 relative">
      <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img src={persona.avatar} alt={persona.name} className="w-14 h-14 rounded-full border-2 border-orange-500 shadow-lg" />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{persona.name}</h3>
            <p className="text-orange-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping mr-2"></span>
              2024 SCRIPT SESSION
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLeadInfo(!showLeadInfo)}
            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${showLeadInfo ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            <span>🏢</span>
            <span className="hidden sm:inline">Lead Data</span>
          </button>
          <button
            onClick={() => setShowScript(!showScript)}
            className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${showScript ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            <span>📄</span>
            <span className="hidden sm:inline">Script</span>
          </button>
          <button
            onClick={endSession}
            disabled={isEnding}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/40 transition-all flex items-center space-x-2 active:scale-95 ml-2"
          >
            <span>DISCONNECT</span>
            <span className="text-lg">⏹</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Side: Lead Data (CRM View) */}
        {showLeadInfo && (
          <div className="w-72 bg-slate-800/80 border-r border-slate-700 p-6 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Prospect Insights</h4>
              <span className="bg-slate-900 text-[8px] px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-widest">Verified</span>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Business Entity</p>
                <p className="text-sm font-bold text-white leading-tight">{persona.company}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Site Location</p>
                <p className="text-xs text-slate-200">{persona.address}</p>
                <p className="text-xs text-slate-200">{persona.city}, {persona.province}</p>
                <p className="text-xs text-slate-200 font-mono tracking-tighter">{persona.postalCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Direct Phone</p>
                <p className="text-sm font-mono font-bold text-orange-400">{persona.phone}</p>
              </div>
              <div className="pt-6 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-3 tracking-wider">Psychographic Profile</p>
                <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-4 rounded-xl border border-slate-700 leading-relaxed">
                  {persona.personality}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 via-orange-500/5 to-slate-900/0 pointer-events-none"></div>

          {connectionError && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl border border-red-400 shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Session Error</p>
                <p className="text-sm font-bold">{connectionError}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="ml-4 bg-white text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 active:scale-95 transition-all"
              >
                Reconnect
              </button>
            </div>
          )}

          <div className="relative flex items-center justify-center">
            {/* Audio Level Ring */}
            <div
              className="absolute rounded-full border-4 border-orange-500/30 transition-all duration-75"
              style={{
                width: `${160 + (audioLevel * 400)}px`,
                height: `${160 + (audioLevel * 400)}px`,
                opacity: isActive ? 1 : 0
              }}
            ></div>

            <div className="absolute w-80 h-80 rounded-full border-2 border-orange-500/10 animate-[ping_3s_linear_infinite]"></div>
            <div className="absolute w-64 h-64 rounded-full border border-orange-400/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
            <div className={`w-40 h-40 bg-gradient-to-tr from-orange-600 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_60px_-15px_rgba(234,88,12,0.6)] relative z-10 border-4 border-white/10 transition-transform ${audioLevel > 0.1 ? 'scale-110' : 'scale-100'}`}>
              <span className={`text-6xl ${isActive ? 'animate-bounce' : 'opacity-50'}`}>🎙️</span>
            </div>
          </div>

          <div className="text-center space-y-4 relative z-10 max-w-sm">
            <div className={`inline-block px-4 py-1 rounded-full border transition-all ${isActive ? 'bg-orange-500/10 border-orange-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <p className={`${isActive ? 'text-orange-400' : 'text-slate-500'} text-[10px] font-black uppercase tracking-[0.4em]`}>
                {isActive ? 'Encrypted Line Active' : 'Connecting to Persona...'}
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              {isActive ? (
                <p className="text-slate-400 text-xs italic font-medium">"Focus on authorization before the $775 pitch..."</p>
              ) : (
                <div className="flex justify-center space-x-1">
                  <div className="w-1 h-3 bg-slate-700 rounded-full animate-bounce"></div>
                  <div className="w-1 h-3 bg-slate-700 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-3 bg-slate-700 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              )}
              <p className="text-slate-500 text-[9px] uppercase font-bold tracking-widest bg-slate-800/50 py-1 rounded">Targeting: {persona.company}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Script Cheat Sheet */}
        {showScript && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Execution Script</h4>
            <div className="space-y-4 text-[11px] text-slate-300 leading-relaxed">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                <p className="font-black text-white mb-2 uppercase tracking-tighter text-[9px] text-blue-400">Step 1: Introduction</p>
                <p className="italic">"Good morning/afternoon, my name is [Name] from 411 SMART SEARCH.CA."</p>
              </div>
              <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/40 shadow-inner">
                <p className="font-black text-orange-400 mb-2 uppercase tracking-tighter text-[9px]">Step 2: AUTHORIZATION (CRITICAL)</p>
                <p className="font-bold text-white">"Are you authorized to confirm info as well as purchase for your company?"</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <p className="font-black text-white mb-2 uppercase tracking-tighter text-[9px] text-slate-500">Step 3: Business Verification</p>
                <p>"Verifying your primary listing address at: {persona.address} in {persona.city}?"</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <p className="font-black text-white mb-2 uppercase tracking-tighter text-[9px] text-slate-500">Step 4: Value Stack</p>
                <p>"Premium upgrade includes 2 categories, 7 keywords, image gallery, and toll-free linking."</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <p className="font-black text-white mb-2 uppercase tracking-tighter text-[9px] text-green-400">Step 5: The Commitment</p>
                <p>"One-time invoice of $775.00 for the annual placement. May I have the spelling of your name?"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-44 bg-black/60 backdrop-blur-md border-t border-slate-800 p-6 overflow-y-auto">
        <p className="text-[10px] text-slate-500 font-black uppercase mb-4 tracking-[0.3em] flex items-center">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          Live Script Monitor
        </p>
        <div className="space-y-4">
          {transcription.length === 0 && (
            <div className="flex items-center space-x-3 text-slate-600 text-xs italic">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-slate-700 rounded-full animate-[bounce_1s_infinite]"></div>
                <div className="w-1 h-3 bg-slate-700 rounded-full animate-[bounce_1s_infinite_100ms]"></div>
                <div className="w-1 h-3 bg-slate-700 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
              </div>
              <p>Waiting for voice input... Start with Step 1.</p>
            </div>
          )}
          {transcription.map((line, i) => (
            <div key={i} className="text-sm border-l-2 border-orange-500/30 pl-4 py-2 bg-white/5 rounded-r-xl transition-all hover:bg-white/10">
              {line.split('\n').map((l, idx) => (
                <p key={idx} className={l.startsWith('Rep:') ? 'text-blue-300 font-medium' : 'text-slate-100 font-bold italic'}>
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

export default LiveSession;
