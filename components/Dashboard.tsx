
import React, { useMemo, useState, useEffect } from 'react';
import { DashboardStats, Transaction } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  transactions: Transaction[];
  onEditTransaction: (t: Transaction) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drinks': '#10b981', // Emerald
  'Room Rent': '#6366f1',     // Indigo
  'Transport': '#3b82f6',     // Blue
  'Shopping': '#f43f5e',      // Rose
  'Entertainment': '#f59e0b', // Amber
  'Bills': '#06b6d4',         // Cyan
  'Health': '#ef4444',        // Red
  'Other': '#64748b'          // Slate
};

const Dashboard: React.FC<DashboardProps> = ({ stats, transactions, onEditTransaction }) => {
  const [focusMode, setFocusMode] = useState<'budget' | 'wealth'>('budget');
  const [goalView, setGoalView] = useState<'saved' | 'gap'>('saved');
  const [now, setNow] = useState(new Date());

  // Real-time update for the year countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const yearStats = useMemo(() => {
    const currentYear = now.getFullYear();
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31, 23, 59, 59);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = totalDays - daysPassed;
    const secondsLeft = Math.floor((end.getTime() - now.getTime()) / 1000);
    const progressPercent = (daysPassed / totalDays) * 100;
    
    return { daysLeft, totalDays, secondsLeft, progressPercent };
  }, [now]);

  const yearlyGoalMessage = useMemo(() => {
    const p = stats.yearlyGoalProgress;
    if (p >= 100) return "Structure Secured. You are Financially Sovereign.";
    if (p >= 75) return "Final inspection. The finish line is glowing.";
    if (p >= 50) return "Structure complete. Interior finishing in progress.";
    if (p >= 25) return "Building height. You're becoming an Architect.";
    if (p > 0) return "Foundation laid. Every Rupee counts.";
    return "Your blueprint is ready. Time to build.";
  }, [stats.yearlyGoalProgress]);

  // Generate last 7 CONSECUTIVE days
  const dailySpending = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.timestamp);
      d.setHours(0, 0, 0, 0);
      const key = d.toDateString();
      dailyMap[key] = (dailyMap[key] || 0) + t.amount;
    });

    const timeline = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toDateString();
      timeline.push({
        dateLabel: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
        fullDate: key,
        amount: dailyMap[key] || 0
      });
    }
    return timeline.reverse();
  }, [transactions, now]);

  const encouragement = useMemo(() => {
    const dailyTarget = stats.remainingToYearlyGoal / Math.max(1, yearStats.daysLeft);
    if (stats.yearlyGoalProgress >= 100) return "QUEST COMPLETE. WEALTH ASCENDED.";
    if (stats.disciplineScore > 80) return "ELITE DISCIPLINE. Keep the momentum.";
    return `Save ₹${Math.floor(dailyTarget * 0.05)} more today to reach your target.`;
  }, [stats, yearStats.daysLeft]);

  const categoryData = useMemo(() => {
    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totals: Record<string, number> = {};
    currentMonthTx.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });

    const totalSpent = Object.values(totals).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(totals)
      .map(([name, amount]) => ({
        name,
        amount,
        percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: CATEGORY_COLORS[name] || CATEGORY_COLORS['Other']
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, now]);

  const pieSegments = useMemo(() => {
    let cumulativePercent = 0;
    return categoryData.map(cat => {
      const startPercent = cumulativePercent;
      cumulativePercent += cat.percent;
      const r = 15.915;
      const circumference = 2 * Math.PI * r;
      const strokeDasharray = `${(cat.percent * circumference) / 100} ${circumference}`;
      const strokeDashoffset = `${(startPercent * circumference) / -100}`;
      return { ...cat, strokeDasharray, strokeDashoffset };
    });
  }, [categoryData]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Real-time Year Clock */}
      <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-[40px] border border-white/5 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-slate-700/50">
            <div 
              className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] transition-all duration-1000" 
              style={{ width: `${yearStats.progressPercent}%` }}
            />
         </div>
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">Yearly Progress</p>
         <div className="flex items-center gap-4">
            <div className="text-center">
               <span className="text-4xl font-black text-white">{yearStats.daysLeft}</span>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Days Remaining</p>
            </div>
            <div className="w-px h-10 bg-slate-700 mx-2" />
            <div className="text-center">
               <span className="text-4xl font-black text-indigo-400">{yearStats.totalDays}</span>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Mission</p>
            </div>
         </div>
         <div className="mt-4 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <p className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-tighter">
              {yearStats.secondsLeft.toLocaleString()} SECONDS UNTIL RESET
            </p>
         </div>
      </div>

      {/* Focus Toggle */}
      <div className="flex justify-center">
          <div className="bg-slate-800 p-1 rounded-full flex gap-1 border border-white/5">
              <button 
                onClick={() => setFocusMode('budget')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${focusMode === 'budget' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500'}`}
              >
                  Budget
              </button>
              <button 
                onClick={() => setFocusMode('wealth')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${focusMode === 'wealth' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}
              >
                  Wealth
              </button>
          </div>
      </div>

      {/* Hero Display */}
      <div className={`${focusMode === 'budget' ? 'safe-spend-gradient' : 'freedom-gradient'} p-10 rounded-[48px] shadow-2xl transition-colors duration-500 relative overflow-hidden group border border-white/10`}>
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <i className={`fa-solid ${focusMode === 'budget' ? 'fa-shield-halved' : 'fa-gem'} text-9xl rotate-12`}></i>
        </div>
        
        {focusMode === 'budget' ? (
            <>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Daily Safe Allowance</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-white text-7xl font-black tracking-tighter">₹{Math.floor(stats.dailySafeSpend)}</span>
                </div>
            </>
        ) : (
            <>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Wealth Gap Remaining</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-white text-5xl font-black tracking-tighter">₹{stats.remainingToYearlyGoal.toLocaleString()}</span>
                </div>
            </>
        )}
        
        <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <i className="fa-solid fa-bolt-lightning text-yellow-300 text-xs animate-pulse"></i>
            <p className="text-[10px] text-white font-black uppercase tracking-tight">{encouragement}</p>
        </div>
      </div>

      {/* Interactive Goal Navigator Card */}
      <div 
        onClick={() => setGoalView(v => v === 'saved' ? 'gap' : 'saved')}
        className="neo-glass p-8 rounded-[40px] border border-white/5 space-y-6 relative overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-lg hover:border-indigo-500/30"
      >
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Goal Navigator</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Yearly Mission: ₹{(stats.totalYearlySavings + stats.remainingToYearlyGoal).toLocaleString()}</p>
             </div>
             <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-white text-[9px] font-black uppercase tracking-widest">{Math.round(stats.yearlyGoalProgress)}%</span>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-baseline">
                <div>
                   <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">
                      {goalView === 'saved' ? 'Accumulated Capital' : 'Capital Required'}
                   </p>
                   <p className="text-white text-4xl font-black tracking-tighter">
                      ₹{goalView === 'saved' ? stats.totalYearlySavings.toLocaleString() : stats.remainingToYearlyGoal.toLocaleString()}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Status</p>
                   <p className={`text-xs font-black uppercase tracking-tighter ${stats.yearlyGoalProgress >= 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {stats.yearlyGoalProgress >= 100 ? 'Target Reached' : 'On Track'}
                   </p>
                </div>
             </div>

             <div className="relative pt-1">
                <div className="overflow-hidden h-4 text-xs flex rounded-full bg-slate-800 border border-white/5">
                   <div 
                     style={{ width: `${stats.yearlyGoalProgress}%` }} 
                     className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000 relative"
                   >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
             <i className="fa-solid fa-chess-rook text-indigo-400 text-xs mt-1"></i>
             <p className="text-slate-300 text-[11px] font-bold leading-relaxed italic">
                "{yearlyGoalMessage}"
             </p>
          </div>
          
          <div className="absolute bottom-2 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
             <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest">Tap to switch view</p>
          </div>
      </div>

      {/* Wealth Milestones: Combined Monthly and Yearly Progress */}
      <div className="neo-glass p-8 rounded-[40px] border border-white/5 space-y-8">
          <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em] mb-2">Wealth Milestones</h3>
          
          {/* Monthly Progress */}
          <div className="space-y-3">
              <div className="flex justify-between items-end">
                  <div>
                      <h4 className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Mission</h4>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Contribution target progress</p>
                  </div>
                  <span className="text-white text-lg font-black">{Math.round(stats.monthlyContributionProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    style={{ width: `${stats.monthlyContributionProgress}%` }}
                  />
              </div>
          </div>

          {/* Yearly Progress (Now more prominent) */}
          <div className="space-y-3">
              <div className="flex justify-between items-end">
                  <div>
                      <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Yearly Grand Goal</h4>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Total annual savings mission</p>
                  </div>
                  <span className="text-white text-lg font-black">{Math.round(stats.yearlyGoalProgress)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.3)]" 
                    style={{ width: `${stats.yearlyGoalProgress}%` }}
                  />
              </div>
          </div>
      </div>

      {/* Daily Burn Analysis (Last 7 Consecutive Days) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
           <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Daily Burn Analysis</h3>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-500 text-[9px] font-bold uppercase tracking-tight">Exceeded Safe</span>
           </div>
        </div>
        <div className="flex justify-between items-end h-32 px-4 bg-slate-800/20 rounded-[32px] border border-white/5 py-6">
           {dailySpending.map((day, i) => {
             const isOverSafe = day.amount > stats.dailySafeSpend;
             const barHeight = Math.min(100, (day.amount / (Math.max(stats.dailySafeSpend * 1.5, 1000))) * 100);
             
             return (
               <div key={i} className="flex flex-col items-center gap-2 h-full justify-end flex-1">
                  <div className="relative group w-full flex flex-col items-center justify-end h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-[8px] text-white font-black opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap border border-white/5">
                       ₹{day.amount.toLocaleString()}
                    </div>
                    {/* Bar */}
                    <div 
                      className={`w-3 rounded-full transition-all duration-500 ${isOverSafe ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-emerald-500'}`} 
                      style={{ height: `${Math.max(barHeight, 5)}%` }} 
                    />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-tighter ${day.dateLabel === 'Today' ? 'text-white underline underline-offset-4' : 'text-slate-500'}`}>
                    {day.dateLabel}
                  </span>
               </div>
             );
           })}
        </div>
      </div>

      {/* Category Analysis */}
      <div className="neo-glass p-8 rounded-[32px] border border-white/5 space-y-6">
        <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Category Analysis</h3>
        {categoryData.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="6"></circle>
                {pieSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth="6"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  ></circle>
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-white text-[10px] font-black leading-none">TOTAL</span>
                <span className="text-white text-xs font-bold">₹{(categoryData.reduce((s, c) => s + c.amount, 0) / 1000).toFixed(1)}k</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              {categoryData.slice(0, 4).map((cat, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{cat.name}</span>
                  </div>
                  <span className="text-white text-[10px] font-black">₹{cat.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">No spending recorded this month</p>
          </div>
        )}
      </div>

      {/* Discipline Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neo-glass p-6 rounded-3xl border border-white/5">
          <p className="text-orange-500 text-[10px] font-black uppercase mb-2 tracking-widest">Discipline XP</p>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-3xl font-black">{Math.round(stats.disciplineScore)}</span>
          </div>
        </div>
        <div className="neo-glass p-6 rounded-3xl border border-white/5">
          <p className="text-emerald-500 text-[10px] font-black uppercase mb-2 tracking-widest">Saved YTD</p>
          <div className="flex items-baseline gap-1">
            <span className="text-white text-lg font-black">₹{stats.totalYearlySavings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Edit/Recent Transactions */}
      <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
              <h3 className="text-white text-[11px] font-black uppercase tracking-[0.2em]">Recent Logs</h3>
              <p className="text-slate-500 text-[9px] uppercase font-black">Tap to modify</p>
          </div>
          <div className="space-y-3">
              {[...transactions].sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).map((t) => (
                  <div 
                    key={t.id} 
                    onClick={() => onEditTransaction(t)}
                    className="neo-glass p-4 rounded-2xl border border-white/5 flex justify-between items-center hover:border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                      <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs ${t.isFixed ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                              <i className={`fa-solid ${t.isFixed ? 'fa-lock' : 'fa-coins'}`}></i>
                          </div>
                          <div>
                              <p className="text-white text-xs font-bold">{t.category}</p>
                              <p className="text-slate-500 text-[9px] uppercase font-bold">{new Date(t.timestamp).toLocaleDateString()}</p>
                          </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                          <p className="text-white text-sm font-black">₹{t.amount}</p>
                          <i className="fa-solid fa-pen-to-square text-slate-600 text-[10px]"></i>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
