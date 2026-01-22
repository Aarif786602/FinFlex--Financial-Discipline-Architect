
import React, { useState, useEffect } from 'react';
import { generateVisionImage } from '../services/geminiService';

const VisionBoard: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(() => localStorage.getItem('finflex_vision'));
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || isGenerating) return;

    setIsGenerating(true);
    const result = await generateVisionImage(goal);
    if (result) {
      setImageUrl(result);
      localStorage.setItem('finflex_vision', result);
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <i className="fa-solid fa-mountain-sun text-white"></i>
        </div>
        <div>
          <h2 className="text-white text-sm font-black uppercase tracking-widest">Vision Board</h2>
          <p className="text-amber-400 text-[9px] font-black uppercase">Your North Star Goal</p>
        </div>
      </div>

      <div className="relative group">
        {imageUrl ? (
          <div className="relative rounded-[32px] overflow-hidden border border-white/10 shadow-2xl aspect-square bg-slate-800">
            <img 
              src={imageUrl} 
              alt="Financial Goal" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Blueprint Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            <div className="absolute bottom-6 left-6 right-6 p-4 neo-glass rounded-2xl border border-white/5">
                <p className="text-white text-[10px] font-black uppercase tracking-widest text-center">Protocol: Achievement Unlocked</p>
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border-2 border-dashed border-slate-700 aspect-square flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-800/20">
            <i className="fa-solid fa-wand-sparkles text-4xl text-slate-700"></i>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              No vision defined.<br/>Describe your ultimate peak.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center z-20 space-y-4">
             <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
             <p className="text-amber-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Rendering Reality...</p>
          </div>
        )}
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="relative">
          <textarea 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Describe your financial peak (e.g., A minimalist penthouse with a panoramic city view...)"
            rows={3}
            className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all resize-none"
          />
        </div>
        <button 
          disabled={!goal.trim() || isGenerating}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-amber-900/20 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-bolt-lightning"></i>
          {imageUrl ? 'Redefine Vision' : 'Visualize Goal'}
        </button>
      </form>
    </div>
  );
};

export default VisionBoard;
