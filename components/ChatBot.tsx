
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Transaction, ChatMessage } from '../types';
import { chatWithGemini } from '../services/geminiService';

interface ChatBotProps {
  profile: UserProfile;
  transactions: Transaction[];
}

const ChatBot: React.FC<ChatBotProps> = ({ profile, transactions }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    let currentResponse = "";
    // Placeholder for model message
    setMessages(prev => [...prev, { role: 'model', content: "..." }]);

    await chatWithGemini(
      profile,
      transactions,
      messages,
      userMsg,
      (text) => {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: 'model', content: text };
          return newMessages;
        });
      }
    );

    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-4 px-2">
        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i className="fa-solid fa-headset text-white"></i>
        </div>
        <div>
          <h2 className="text-white text-sm font-black uppercase tracking-widest">Architect Support</h2>
          <p className="text-emerald-400 text-[9px] font-black uppercase">Online • Context Aware</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 px-2 pb-4 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="text-center py-10 opacity-50">
            <i className="fa-solid fa-comments text-4xl text-slate-700 mb-4"></i>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
              Ask about your spending patterns,<br/>wealth goals, or financial strategy.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
          >
            <div 
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && messages[messages.length-1]?.content === "..." && (
            <div className="flex justify-start animate-pulse">
                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-indigo-400 rounded-full"></div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command the AI..."
          className="flex-1 bg-slate-800/50 border border-white/10 rounded-2xl px-4 py-4 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button 
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 transition-all"
        >
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatBot;
