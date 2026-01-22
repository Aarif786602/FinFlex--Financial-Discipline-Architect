
import React, { useMemo } from 'react';
import { DashboardStats } from '../types';
import VisionBoard from './VisionBoard';

interface WealthPathProps {
  stats: DashboardStats;
}

const WealthPath: React.FC<WealthPathProps> = ({ stats }) => {
  const progressPercent = Math.min(100, stats.yearlyGoalProgress);
  
  const paceAnalysis = useMemo(() => {
    if (stats.yearlyGoalProgress >= 100) return "Capital Reserve Met. You are operating at Peak Sovereignty.";
    if (stats.disciplineScore > 90) return "Exceptional Velocity. You are ahead of the architectural timeline.";
    if (stats.disciplineScore > 60) return "Stable Trajectory. Maintain discipline to bridge the remaining gap.";
    return "Velocity Sub-optimal. Aggressive contribution required to satisfy the blueprint.";
  }, [stats.yearlyGoalProgress, stats.disciplineScore]);

  const statsBreakdown = [
    { label: 'Capital Accumulated', value: `₹${stats.totalYearlySavings.toLocaleString()}`, color: 'text-emerald-400', icon: 'fa-vault' },
    { label: 'Capital Required', value: `₹${stats.remainingToYearlyGoal.toLocaleString()}`, color: 'text-rose-400', icon: 'fa-gap' },
    { label: 'Monthly Pace', value: `${Math.round(stats.monthlyContributionProgress)}%`, color: 'text-indigo-400', icon: 'fa-gauge-high' },
    { label: 'Discipline XP', value: `${Math.round(stats.disciplineScore)}`, color: 'text-amber-400', icon: 'fa-shield-halved' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <i className="fa-solid fa-route text-white"></i>
        </div>
        <div>
          <h2 className="text-white text-sm font-black uppercase tracking-widest">Wealth Path</h2>
          <p className="text-emerald-400 text-[9px] font-black uppercase">Goal Achievement Protocol</p>
        </div>
      </div>

      {/* Central Progress Ring */}
      <div className="relative flex flex-col items-center justify-center p-10 bg-slate-800/40 rounded-[48px] border border-white/5 overflow-hidden">
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-slate-700/30"
          />
          <circle
            cx="128"
            cy="128"
            r="110"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 110}
            strokeDashoffset={2 * Math.PI * 110 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            className="text-emerald-500 transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Blueprint Secured</p>
          <h1 className="text-5xl font-black text-white tracking-tighter">{Math.round(progressPercent)}%</h1>
          <div className="mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
             <span className="text-[9px] text-emerald-400 font-black uppercase">Target Lock</span>
          </div>
        </div>
      </div>

      {/* Added VisionBoard to the Wealth Path view */}
      <VisionBoard />

      {/* High-Fidelity Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-2">
        {statsBreakdown.map((item, idx) => (
          <div key={idx} className="neo-glass p-5 rounded-3xl border border-white/5 space-y-2">
             <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">{item.label}</p>
             <p className={`text-xl font-black tracking-tight ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* AI Path Insights */}
      <div className="neo-glass p-8 rounded-[32px] border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <i className="fa-solid fa-brain text-7xl"></i>
        </div>
        <div className="flex items-start gap-4">
           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 flex-shrink-0">
             <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
           </div>
           <div className="space-y-1">
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Architectural Insight</h3>
              <p className="text-slate-300 text-[11px] leading-relaxed italic font-medium">
                "{paceAnalysis}"
              </p>
           </div>
        </div>
      </div>

      {/* Motivational Runway */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[40px] border border-white/5 space-y-4 text-center">
         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Capital Efficiency Status</p>
         <h3 className="text-white text-lg font-black leading-tight uppercase tracking-tight">
            You are ₹{stats.totalYearlySavings.toLocaleString()} closer to financial sovereignty than day zero.
         </h3>
         <div className="pt-2">
            <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
         </div>
      </div>
    </div>
  );
};

export default WealthPath;
