
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { OPPORTUNITY_COST_RATE, OPPORTUNITY_COST_YEARS } from '../constants';

interface TransactionEntryProps {
  onAdd: (t: Omit<Transaction, 'id' | 'timestamp'> & { timestamp?: number }) => void;
  editData?: Transaction | null;
  onCancel?: () => void;
}

const CATEGORIES = ['Food & Drinks', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];
const FIXED_CATEGORIES = [
  { name: 'Room Rent', icon: 'fa-house-chimney' },
  { name: 'Electricity', icon: 'fa-bolt' },
  { name: 'Internet/WiFi', icon: 'fa-wifi' },
  { name: 'Water/Gas', icon: 'fa-faucet' },
  { name: 'Streaming/Subs', icon: 'fa-play' },
  { name: 'Insurance/EMI', icon: 'fa-shield-heart' },
  { name: 'Other Fixed', icon: 'fa-lock' }
];

const TransactionEntry: React.FC<TransactionEntryProps> = ({ onAdd, editData, onCancel }) => {
  const [entryMode, setEntryMode] = useState<'daily' | 'fixed'>('daily');
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('Food & Drinks');
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(Date.now());
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>({});
  const [showFullDatePicker, setShowFullDatePicker] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (editData) {
      setAmount(editData.amount.toString());
      setCategory(editData.category);
      setSelectedTimestamp(editData.timestamp);
      setEntryMode(editData.isFixed ? 'fixed' : 'daily');
    }
  }, [editData]);

  const opportunityCost = useMemo(() => {
    const p = Number(amount);
    if (isNaN(p) || p <= 0) return 0;
    return Math.floor(p * Math.pow(1 + OPPORTUNITY_COST_RATE, OPPORTUNITY_COST_YEARS));
  }, [amount]);

  // Generate last 7 days for the quick strip
  const dateStrip = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        label: i === 0 ? 'Today' : i === 1 ? 'Yest.' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        timestamp: d.getTime(),
        isToday: i === 0
      });
    }
    return days;
  }, []);

  const handleKeyPress = (val: string) => {
    setShowError(false);
    setAmount(prev => {
      if (prev.length >= 9 && val !== '.') return prev;
      if (prev === '0' && val !== '.') return val;
      if (val === '.' && prev.includes('.')) return prev;
      return prev + val;
    });
  };

  const handleDelete = () => {
    setShowError(false);
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleSaveDaily = () => {
    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setShowError(true);
      return;
    }
    onAdd({
      amount: numericAmount,
      category,
      isFixed: false,
      note: '',
      timestamp: selectedTimestamp
    });
  };

  const handleSaveFixedBulk = () => {
    const entries = Object.entries(fixedAmounts);
    const validEntries = entries.filter(([_, amt]) => Number(amt) > 0);
    
    if (validEntries.length === 0) {
      alert("Please enter at least one valid amount > 0");
      return;
    }

    validEntries.forEach(([cat, amt]) => {
      onAdd({
        amount: Number(amt),
        category: cat,
        isFixed: true,
        note: 'Bulk Monthly Fixed',
        timestamp: Date.now()
      });
    });
    setFixedAmounts({});
  };

  const preventInvalidChars = (e: React.KeyboardEvent) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-white text-xs font-black uppercase tracking-widest">
          {editData ? 'Modify Record' : 'Log Engine'}
        </h2>
        {editData && (
          <button onClick={onCancel} className="text-rose-500 text-[10px] font-black uppercase">Cancel</button>
        )}
      </div>

      {!editData && (
        <div className="bg-slate-800 p-1.5 rounded-2xl flex border border-white/5">
          <button 
            onClick={() => setEntryMode('daily')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${entryMode === 'daily' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <i className="fa-solid fa-calendar-day"></i>
            Daily Log
          </button>
          <button 
            onClick={() => setEntryMode('fixed')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${entryMode === 'fixed' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <i className="fa-solid fa-receipt"></i>
            Fixed Bills
          </button>
        </div>
      )}

      {entryMode === 'daily' ? (
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className={`flex justify-center items-center gap-2 transition-colors duration-300 ${showError ? 'text-rose-500' : 'text-white'}`}>
              <span className={`text-2xl font-bold ${showError ? 'text-rose-500/50' : 'text-slate-500'}`}>₹</span>
              <span className="text-6xl font-black tracking-tighter">{amount}</span>
            </div>
            {showError && (
              <p className="text-rose-500 text-[9px] font-black uppercase tracking-widest mt-2 animate-pulse">Amount must be greater than zero</p>
            )}
          </div>

          {/* New Quick Date Selection Strip */}
          <div className="space-y-3">
            <p className="text-center text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Incident Date</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
              {dateStrip.map((day) => (
                <button
                  key={day.timestamp}
                  onClick={() => {
                    setSelectedTimestamp(day.timestamp);
                    setShowFullDatePicker(false);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all ${selectedTimestamp === day.timestamp && !showFullDatePicker ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}
                >
                  <span className="text-[9px] font-black uppercase">{day.label}</span>
                  <span className="text-[11px] font-bold">{day.date}</span>
                </button>
              ))}
              <button
                onClick={() => setShowFullDatePicker(!showFullDatePicker)}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border transition-all ${showFullDatePicker ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}
              >
                <i className="fa-solid fa-calendar text-xs mb-1"></i>
                <span className="text-[9px] font-black uppercase">Other</span>
              </button>
            </div>

            {showFullDatePicker && (
              <div className="px-2 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="date" 
                  value={new Date(selectedTimestamp).toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedTimestamp(new Date(e.target.value).getTime())}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-emerald-500 outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-full flex items-center gap-2">
              <i className="fa-solid fa-seedling text-orange-500 text-[10px]"></i>
              <span className="text-orange-400 text-[10px] font-black uppercase tracking-wider">
                 10yr Growth Cost: ₹{opportunityCost.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all border ${category === cat ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 px-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="h-14 rounded-2xl bg-slate-800/50 text-white text-xl font-bold active:bg-slate-700 active:scale-95 transition-all border border-white/5"
              >
                {key}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-14 rounded-2xl bg-slate-800/50 text-slate-400 text-xl active:bg-slate-700 active:scale-95 transition-all border border-white/5"
            >
              <i className="fa-solid fa-delete-left"></i>
            </button>
          </div>

          <button
            onClick={handleSaveDaily}
            disabled={Number(amount) <= 0}
            className="w-full py-5 rounded-3xl bg-emerald-500 text-white font-black text-xl shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
          >
            {editData ? 'Update Record' : 'Commit Entry'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="px-2">
            <h3 className="text-white text-lg font-black uppercase tracking-tighter mb-1">Monthly Fixed Bills</h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Enter all recurring costs at once</p>
            
            <div className="space-y-4">
              {FIXED_CATEGORIES.map((cat) => (
                <div key={cat.name} className="neo-glass p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <i className={`fa-solid ${cat.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest mb-1">{cat.name}</p>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-black">₹</span>
                      <input 
                        type="number"
                        placeholder="0"
                        min="0"
                        step="0.01"
                        onKeyDown={preventInvalidChars}
                        value={fixedAmounts[cat.name] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || Number(val) >= 0) {
                            setFixedAmounts(prev => ({ ...prev, [cat.name]: val }));
                          }
                        }}
                        className="w-full bg-transparent border-none text-white text-xl font-black pl-5 focus:outline-none placeholder:text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSaveFixedBulk}
            disabled={Object.values(fixedAmounts).every(v => !v || Number(v) <= 0)}
            className="w-full py-5 rounded-3xl bg-indigo-500 text-white font-black text-xl shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest"
          >
            Commit All Bills
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionEntry;
