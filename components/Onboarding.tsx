
import React, { useState } from 'react';
import { UserProfile, RiskAppetite } from '../types';
import { RISK_MULTIPLIERS } from '../constants';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    monthlyIncome: 0,
    fixedCosts: 0,
    yearlySavingsGoal: 0,
    targetMonthlyContribution: 0,
    riskAppetite: RiskAppetite.MEDIUM,
    savingsRatio: RISK_MULTIPLIERS[RiskAppetite.MEDIUM]
  });

  const next = () => setStep(s => s + 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data as UserProfile);
  };

  const steps = [
    (
      <div key="step1" className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Protocol <span className="text-emerald-400">Zero</span>.</h1>
          <p className="text-slate-400 font-medium">Identify yourself, Architect of Wealth.</p>
        </div>
        <input 
          autoFocus
          className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 text-xl text-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
          placeholder="First Name"
          value={data.name}
          onChange={e => setData({...data, name: e.target.value})}
        />
        <button disabled={!data.name} onClick={next} className="w-full p-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all shadow-xl">
          Initialize
        </button>
      </div>
    ),
    (
      <div key="step2" className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Income.</h2>
          <p className="text-slate-400">Monthly post-tax net inflow.</p>
        </div>
        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">₹</span>
          <input 
            type="number"
            className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 pl-12 text-2xl text-white focus:border-emerald-500 outline-none"
            placeholder="Amount"
            value={data.monthlyIncome || ''}
            onChange={e => setData({...data, monthlyIncome: Number(e.target.value)})}
          />
        </div>
        <button disabled={!data.monthlyIncome} onClick={next} className="w-full p-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all">
          Next
        </button>
      </div>
    ),
    (
      <div key="step3" className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Targets.</h2>
          <p className="text-slate-400">What is your saving mission?</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase">Year</span>
            <input 
              type="number"
              className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 pl-16 text-xl text-white focus:border-emerald-500 outline-none"
              placeholder="Yearly Goal"
              value={data.yearlySavingsGoal || ''}
              onChange={e => setData({...data, yearlySavingsGoal: Number(e.target.value)})}
            />
          </div>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black uppercase">Month</span>
            <input 
              type="number"
              className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 pl-16 text-xl text-white focus:border-emerald-500 outline-none"
              placeholder="Monthly Target"
              value={data.targetMonthlyContribution || ''}
              onChange={e => setData({...data, targetMonthlyContribution: Number(e.target.value)})}
            />
          </div>
        </div>
        <button disabled={!data.yearlySavingsGoal || !data.targetMonthlyContribution} onClick={next} className="w-full p-5 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest active:scale-95 transition-all">
          Next
        </button>
      </div>
    ),
    (
      <div key="step4" className="space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Blueprint.</h2>
          <p className="text-slate-400">Define your aggressive savings ratio.</p>
        </div>
        
        <div className="space-y-2">
            <div className="flex justify-between items-end mb-1">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Savings Target</span>
                <span className="text-emerald-400 text-2xl font-black">{Math.round((data.savingsRatio || 0) * 100)}%</span>
            </div>
            <input 
                type="range"
                min="0.05"
                max="0.75"
                step="0.01"
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                value={data.savingsRatio}
                onChange={e => setData({...data, savingsRatio: parseFloat(e.target.value)})}
            />
            <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <span>Safe (5%)</span>
                <span>Extreme (75%)</span>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[RiskAppetite.LOW, RiskAppetite.MEDIUM, RiskAppetite.HIGH].map((r) => (
            <button
              key={r}
              onClick={() => setData({
                ...data, 
                riskAppetite: r, 
                savingsRatio: RISK_MULTIPLIERS[r]
              })}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${data.riskAppetite === r && data.savingsRatio === RISK_MULTIPLIERS[r] ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-700 bg-slate-800/50 text-slate-600'}`}
            >
              <span className="font-black uppercase text-[10px] tracking-widest">{r}</span>
            </button>
          ))}
        </div>

        <div className="bg-slate-800/50 border border-white/5 p-4 rounded-2xl space-y-1">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Monthly Target Accumulation</p>
            <p className="text-white text-xl font-black">₹{Math.round((data.monthlyIncome || 0) * (data.savingsRatio || 0)).toLocaleString()}</p>
        </div>

        <div className="relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black">₹</span>
          <input 
            type="number"
            className="w-full bg-slate-800/50 border-2 border-slate-700 rounded-2xl p-5 pl-12 text-2xl text-white focus:border-indigo-500 outline-none"
            placeholder="Fixed Costs"
            value={data.fixedCosts || ''}
            onChange={e => setData({...data, fixedCosts: Number(e.target.value)})}
          />
        </div>

        <button onClick={handleSubmit} className="w-full p-5 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest active:scale-95 shadow-2xl shadow-emerald-500/20 transition-all">
          Construct Profile
        </button>
      </div>
    )
  ];

  return (
    <div className="min-h-screen max-w-[448px] mx-auto bg-slate-900 p-8 flex flex-col justify-center">
      <div className="mb-10">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>
      {steps[step - 1]}
    </div>
  );
};

export default Onboarding;
