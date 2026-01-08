
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
  const transcriptRef = useRef<string[]>([]);

  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const currentTurnTranscriptRef = useRef({ user: '', model: '' });

  const stopAllAudio = useCallback(() => {
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
  }, []);

  const endSession = async () => {
    setIsEnding(true);
    onEndSession(transcriptRef.current);
  };

  useEffect(() => {
    const initSession = async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          console.error("API Key missing from environment. Add GEMINI_API_KEY to .env or Vercel.");
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextsRef.current = { input: inputCtx, output: outputCtx };

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-12-2025',
          callbacks: {
            onopen: () => {
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message) => {
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

              const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (audioData) {
                const { output: ctx } = audioContextsRef.current!;
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                stopAllAudio();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => console.error('Live session error:', e),
            onclose: () => setIsActive(false),
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.difficulty === 'Hard' ? 'Puck' : 'Kore' } },
            },
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: `You are acting as ${persona.name}, ${persona.role} at ${persona.company}. 
            Personality: ${persona.personality}.
            
            YOUR BUSINESS INFORMATION (Rep must confirm this in Step 3):
            - Address: ${persona.address}
            - City: ${persona.city}
            - Province: ${persona.province}
            - Postal Code: ${persona.postalCode}
            - Phone: ${persona.phone}
            
            BEHAVIOR GUIDELINES FOR TRAINING:
            - Step 3 (Confirmation): If the rep asks to confirm your details, verify they are correct based on the list above.
            - If the rep FAILS to ask "Are you authorized to confirm info as well as purchase?" within the first minute, be very difficult when they mention the $775 price later. Say things like "Wait, I didn't say I was buying anything" or "I'm just the manager, I can't authorize this."
            - If they DO ask for authorization early, be more cooperative.
            - Raise these specific objections based on the manual: ${persona.objections.join(', ')}.
            - Use the "Complimentary listing" background: "I already have a free listing, why should I pay?"
            - If they offer the 10% credit card discount, show interest.
            - If they use the ARC method (Acknowledge, Reaffirm, Close), you should eventually give in and agree to the invoice.
            
            Context for 411 SMART SEARCH.CA: ${COMPANY_MANUAL}.`,
          },
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to start session:", err);
      }
    };

    initSession();

    return () => {
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
            <img src={persona.avatar} alt={persona.name} className="w-14 h-14 rounded-full border-2 border-orange-500" />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">{persona.name}</h3>
            <p className="text-orange-400 text-[10px] font-bold uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-orange-400 rounded-full animate-ping mr-2"></span>
              2024 SCRIPT SESSION
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowLeadInfo(!showLeadInfo)}
            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${showLeadInfo ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            <span>🏢</span>
            <span className="hidden sm:inline">Lead Info</span>
          </button>
          <button
            onClick={() => setShowScript(!showScript)}
            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 ${showScript ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >
            <span>📄</span>
            <span className="hidden sm:inline">Script</span>
          </button>
          <button
            onClick={endSession}
            disabled={isEnding}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg shadow-red-900/40 transition-all flex items-center space-x-2 active:scale-95 ml-2"
          >
            <span>FINISH</span>
            <span className="text-lg">⏹</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Side: Lead Data (CRM View) */}
        {showLeadInfo && (
          <div className="w-72 bg-slate-800/80 border-r border-slate-700 p-5 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Prospect Details</h4>
              <span className="bg-slate-900 text-[8px] px-2 py-0.5 rounded text-slate-500 font-bold">CRM ID: {persona.id.toUpperCase()}</span>
            </div>

            <div className="space-y-5">
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase">Business Name</p>
                <p className="text-sm font-bold text-white">{persona.company}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase">Address</p>
                <p className="text-xs text-slate-200">{persona.address}</p>
                <p className="text-xs text-slate-200">{persona.city}, {persona.province}</p>
                <p className="text-xs text-slate-200">{persona.postalCode}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-bold uppercase">Phone Number</p>
                <p className="text-sm font-mono font-bold text-orange-400">{persona.phone}</p>
              </div>
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Internal Notes</p>
                <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                  {persona.personality}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-64 h-64 rounded-full border-4 border-orange-500/10 animate-ping"></div>
            <div className="absolute w-48 h-48 rounded-full border-2 border-orange-400/20 animate-pulse"></div>
            <div className="w-32 h-32 bg-gradient-to-tr from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40 relative z-10">
              <span className="text-4xl text-white">📡</span>
            </div>
          </div>

          <div className="text-center space-y-3 relative z-10">
            <p className="text-orange-200 text-sm font-bold uppercase tracking-[0.3em]">Live Feed Active</p>
            <div className="flex flex-col space-y-2">
              <p className="text-slate-400 text-xs italic">"Verify address and city first..."</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Pitching to {persona.company}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Script Cheat Sheet */}
        {showScript && (
          <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Script Cheat Sheet</h4>
            <div className="space-y-4 text-[11px] text-slate-300 leading-relaxed">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-white mb-1">1. Greeting</p>
                <p>"Good morning, my name is [Name] from 411 SMART SEARCH.CA."</p>
              </div>
              <div className="bg-orange-900/20 p-3 rounded-lg border border-orange-500/30">
                <p className="font-bold text-orange-400 mb-1">2. AUTHORIZATION (CRITICAL)</p>
                <p>"Are you authorized to confirm info as well as purchase for your company?"</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-white mb-1">3. Confirmation</p>
                <p>"I'm just calling to verify the address we have for you: {persona.address} in {persona.city}?"</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-white mb-1">4. Value</p>
                <p>"Choice of 2 categories and 7 keywords. Toll free #, website, email."</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="font-bold text-white mb-1">5. The Close</p>
                <p>"Premium upgrade... invoice of $775.00 coming... Spelling of your first and last name?"</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-40 bg-black/60 border-t border-slate-800 p-6 overflow-y-auto">
        <p className="text-[10px] text-slate-500 font-black uppercase mb-4 tracking-[0.2em]">Live Script Verification</p>
        <div className="space-y-4">
          {transcription.length === 0 && (
            <p className="text-slate-600 text-sm italic">Call in progress. Use Step 3 to confirm the business address on the left.</p>
          )}
          {transcription.map((line, i) => (
            <div key={i} className="text-sm text-slate-300 border-l-2 border-orange-500/50 pl-4 py-1 bg-white/5 rounded-r-lg">
              {line.split('\n').map((l, idx) => (
                <p key={idx} className={l.startsWith('Rep:') ? 'text-blue-300' : 'text-slate-100 font-semibold italic'}>
                  {l}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div >
  );
};

export default LiveSession;
