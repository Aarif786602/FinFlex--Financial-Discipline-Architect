
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Transaction, RiskAppetite, MonthlySummary } from './types';
import { RISK_MULTIPLIERS } from './constants';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import TransactionEntry from './components/TransactionEntry';
import Coach from './components/Coach';
import ChatBot from './components/ChatBot';
import WealthPath from './components/WealthPath';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('finflex_profile');
    return saved ? JSON.parse(saved) : {
      name: '',
      monthlyIncome: 0,
      fixedCosts: 0,
      yearlySavingsGoal: 0,
      targetMonthlyContribution: 0,
      riskAppetite: RiskAppetite.MEDIUM,
      savingsRatio: RISK_MULTIPLIERS[RiskAppetite.MEDIUM],
      hasOnboarded: false
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finflex_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'coach' | 'chat' | 'path'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  useEffect(() => {
    if (!isPurging && profile.hasOnboarded) {
      localStorage.setItem('finflex_profile', JSON.stringify(profile));
    }
  }, [profile, isPurging]);

  useEffect(() => {
    if (!isPurging && profile.hasOnboarded) {
      localStorage.setItem('finflex_transactions', JSON.stringify(transactions));
    }
  }, [transactions, isPurging]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = daysInMonth - currentDay + 1;

    const monthlyData: Record<string, MonthlySummary> = {};
    transactions.forEach(t => {
      const d = new Date(t.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          month: d.toLocaleString('default', { month: 'short' }),
          monthIndex: d.getMonth(),
          year: d.getFullYear(),
          totalSpent: 0,
          savingsAchieved: 0
        };
      }
      monthlyData[key].totalSpent += t.amount;
    });

    Object.keys(monthlyData).forEach(key => {
        monthlyData[key].savingsAchieved = profile.monthlyIncome - monthlyData[key].totalSpent;
    });

    const monthlyHistory = Object.values(monthlyData).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.monthIndex - a.monthIndex;
    });

    const currentYearSavings = Object.values(monthlyData)
        .filter(m => m.year === currentYear)
        .reduce((sum, m) => sum + m.savingsAchieved, 0);

    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.timestamp);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalSpentThisMonth = currentMonthTx.reduce((sum, t) => sum + t.amount, 0);
    const variableSpent = currentMonthTx.filter(t => !t.isFixed).reduce((sum, t) => sum + t.amount, 0);

    const idealSavingsFromProfile = profile.monthlyIncome * (profile.savingsRatio || 0.2);
    const monthlyVariableBudget = profile.monthlyIncome - profile.fixedCosts - idealSavingsFromProfile;
    const remainingVariableBudget = Math.max(0, monthlyVariableBudget - variableSpent);
    const dailySafeSpend = remainingVariableBudget / daysRemaining;

    const avgDailyBurn = currentDay > 0 ? totalSpentThisMonth / currentDay : 1;
    const currentLiquidity = profile.monthlyIncome - totalSpentThisMonth;
    const daysOfFreedom = avgDailyBurn > 0 ? Math.floor(currentLiquidity / avgDailyBurn) : 999;

    const projectedMonthlySavings = profile.monthlyIncome - totalSpentThisMonth;
    const disciplineScore = Math.min(100, Math.max(0, (projectedMonthlySavings / idealSavingsFromProfile) * 100));

    const yearlyGoalProgress = profile.yearlySavingsGoal > 0 
        ? Math.min(100, (currentYearSavings / profile.yearlySavingsGoal) * 100)
        : 0;
    const remainingToYearlyGoal = Math.max(0, profile.yearlySavingsGoal - currentYearSavings);
    
    const monthlyContributionProgress = profile.targetMonthlyContribution > 0 
        ? Math.min(100, (projectedMonthlySavings / profile.targetMonthlyContribution) * 100)
        : 0;

    return {
      dailySafeSpend,
      daysOfFreedom,
      disciplineScore,
      totalSpentThisMonth,
      remainingVariableBudget,
      yearlyGoalProgress,
      totalYearlySavings: currentYearSavings,
      remainingToYearlyGoal,
      monthlyHistory,
      monthlyContributionProgress
    };
  }, [profile, transactions]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile({ ...newProfile, hasOnboarded: true });
  };

  const handleSaveTransaction = (t: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: number }) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(item => item.id === editingTransaction.id ? { 
        ...t, 
        id: item.id, 
        timestamp: t.timestamp || item.timestamp 
      } : item));
      setEditingTransaction(null);
    } else {
      const newTx: Transaction = {
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: t.timestamp || Date.now()
      };
      setTransactions(prev => [newTx, ...prev]);
    }
    setActiveTab('dashboard');
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveTab('entry');
  };

  const handleCancelEdit = () => {
      setEditingTransaction(null);
      setActiveTab('dashboard');
  };

  const resetAll = () => {
    if (confirm("INITIATE SYSTEM PURGE? All financial data and wealth records will be permanently erased. This action is irreversible.")) {
      setIsPurging(true);
      localStorage.removeItem('finflex_profile');
      localStorage.removeItem('finflex_transactions');
      localStorage.removeItem('finflex_vision');
      
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 1500);
    }
  };

  if (isPurging) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
        <h2 className="text-rose-500 font-black uppercase tracking-[0.3em] text-sm animate-pulse">System Purging...</h2>
        <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest">Protocol Zero Initiated</p>
      </div>
    );
  }

  if (!profile.hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen max-w-[448px] mx-auto bg-slate-900 flex flex-col relative pb-24 shadow-2xl">
      <header className="p-6 flex justify-between items-center border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <i className="fa-solid fa-bolt text-emerald-500 text-lg"></i>
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">{profile.name}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Status: Active</p>
          </div>
        </div>
        <button 
          onClick={resetAll} 
          title="System Purge"
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 active:scale-90 transition-all border border-transparent hover:border-rose-500/30"
        >
          <i className="fa-solid fa-power-off text-sm"></i>
        </button>
      </header>

      <main className="flex-1 px-6 space-y-8 overflow-y-auto py-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            transactions={transactions} 
            onEditTransaction={handleEditClick} 
          />
        )}
        {activeTab === 'entry' && (
          <TransactionEntry 
            onAdd={handleSaveTransaction} 
            editData={editingTransaction} 
            onCancel={handleCancelEdit}
          />
        )}
        {activeTab === 'coach' && <Coach transactions={transactions} profile={profile} />}
        {activeTab === 'chat' && <ChatBot transactions={transactions} profile={profile} />}
        {activeTab === 'path' && <WealthPath stats={stats} />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[448px] neo-glass h-20 flex items-center justify-around rounded-t-[32px] border-t border-slate-700/30 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <i className="fa-solid fa-shapes text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Growth</span>
        </button>
        <button onClick={() => setActiveTab('coach')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'coach' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Coach</span>
        </button>
        
        <button onClick={() => setActiveTab('entry')} className="w-14 h-14 -mt-10 rounded-2xl safe-spend-gradient flex items-center justify-center text-white shadow-xl shadow-emerald-900/40 active:scale-90 transition-transform border-4 border-slate-900">
          <i className="fa-solid fa-plus text-2xl"></i>
        </button>

        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-indigo-400 scale-110' : 'text-slate-500'}`}>
          <i className="fa-solid fa-comments text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Chat</span>
        </button>

        <button onClick={() => setActiveTab('path')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'path' ? 'text-emerald-400 scale-110' : 'text-slate-500'}`}>
          <i className="fa-solid fa-route text-xl"></i>
          <span className="text-[9px] font-black uppercase tracking-widest">Path</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
