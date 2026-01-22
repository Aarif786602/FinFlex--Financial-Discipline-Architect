
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Transaction } from '../types';
import { getFinancialAdvice, CoachResponse, encode, decode, decodeAudioData } from '../services/geminiService';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface CoachProps {
  profile: UserProfile;
  transactions: Transaction[];
}

const Coach: React.FC<CoachProps> = ({ profile, transactions }) => {
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<CoachResponse | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>('Connecting...');
  
  // Audio Refs
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      const res = await getFinancialAdvice(profile, transactions);
      setAdvice(res);
      setLoading(false);
    };
    fetchAdvice();
    return () => stopLiveSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLiveSession = async () => {
    setIsLive(true);
    setLiveStatus('Initializing Architect...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setLiveStatus('Architect Listening');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = audioContextRef.current?.output;
              if (ctx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                activeSourcesRef.current.add(source);
                source.onended = () => activeSourcesRef.current.delete(source);
              }
            }
            if (message.serverContent?.interrupted) {
              activeSourcesRef.current.forEach(s => s.stop());
              activeSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            setLiveStatus('Link Error');
          },
          onclose: () => {
            setLiveStatus('Link Closed');
            setIsLive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
          systemInstruction: `You are the FinFlex Live Architect. Use the context of the user's spending data to give fast, firm, and helpful financial advice via voice. Be punchy and professional.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setLiveStatus('Access Denied');
      setIsLive(false);
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
    }
    setIsLive(false);
    setLiveStatus('Disconnected');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-indigo-400 font-bold animate-pulse uppercase tracking-widest text-xs">Analyzing your discipline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fa-solid fa-robot text-2xl text-white"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">FinFlex Coach</h2>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{advice?.disciplineRating}</span>
          </div>
        </div>
        
        <button 
          onClick={isLive ? stopLiveSession : startLiveSession}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${isLive ? 'bg-rose-500 border-rose-500 text-white animate-pulse' : 'border-indigo-500/30 text-indigo-400'}`}
        >
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-white' : 'bg-indigo-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest">{isLive ? 'End Session' : 'Go Live'}</span>
        </button>
      </div>

      {isLive ? (
        <div className="neo-glass p-12 rounded-[40px] flex flex-col items-center justify-center space-y-8 border-indigo-500/50">
           <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
              <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center border-4 border-white/10 z-10 relative">
                 <i className="fa-solid fa-microphone text-3xl text-white"></i>
              </div>
           </div>
           <div className="text-center">
              <h3 className="text-white text-lg font-black uppercase tracking-widest">{liveStatus}</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Voice protocol active. Speak now.</p>
           </div>
        </div>
      ) : (
        <>
          <div className="neo-glass p-8 rounded-[32px] border-l-4 border-l-indigo-500">
            <p className="text-slate-200 text-lg leading-relaxed font-medium italic">
              "{advice?.advice}"
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-lightbulb text-orange-400 mt-1"></i>
              <div>
                <p className="text-white font-bold text-sm mb-1">Tactical Tip</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {advice?.contextualTip}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {!isLive && (
        <button 
          onClick={() => window.location.reload()}
          className="w-full py-4 rounded-2xl border-2 border-indigo-500/30 text-indigo-400 text-sm font-bold active:bg-indigo-500/10 transition-all"
        >
          Refresh Analysis
        </button>
      )}
    </div>
  );
};

export default Coach;
