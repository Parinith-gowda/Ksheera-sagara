import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { MilkEntry, ExpenseEntry, Cow } from '../types';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  Sparkles,
  Lightbulb,
  ShieldAlert
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

export default function GauGuru({ user }: { user: User }) {
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'guru'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubMilk = onSnapshot(collection(db, `users/${user.uid}/milk_entries`), snap => 
      setMilkEntries(snap.docs.map(d => d.data() as MilkEntry))
    );
    const unsubExpense = onSnapshot(collection(db, `users/${user.uid}/expenses`), snap => 
      setExpenses(snap.docs.map(d => d.data() as ExpenseEntry))
    );
    const unsubCows = onSnapshot(collection(db, `users/${user.uid}/cows`), snap => 
      setCows(snap.docs.map(d => d.data() as Cow))
    );
    return () => { unsubMilk(); unsubExpense(); unsubCows(); };
  }, [user.uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

       console.log("Gemini Key:", apiKey); // temporary test

       if (!apiKey) {
         throw new Error("Gemini API Key missing");
       }

       const ai = new GoogleGenAI({ apiKey });

      const statsContext = `
        Current User Dairy Stats:
        - Total Cows: ${cows.length}
        - Total Milk History: ${milkEntries.length} entries
        - Total Expense History: ${expenses.length} entries
        - Total Milk Yield: ${milkEntries.reduce((sum, m) => sum + m.litres, 0)} Liters
        - Total Income: ₹${milkEntries.reduce((sum, m) => sum + m.amountPaid, 0)}
        - Total Expenses: ₹${expenses.reduce((sum, e) => sum + e.amount, 0)}
        - Expense Breakdown: ${JSON.stringify(expenses.reduce((acc: any, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {}))}
      `;

      const prompt = `
        You are GauGuru, an expert AI agricultural assistant specializing in dairy farming in India.
        Your goal is to help the farmer maximize profit.
        
        ${statsContext}
        
        Farmer asks: "${userMessage}"
        
        Provide concise, data-driven advice. If expenses are high (especially fodder), suggest cost-cutting measures like home-grown fodder. If profit per liter is low, suggest ways to increase Fat/SNF. 
        Always be encouraging and practical. Keep responses focused on "Money" and "Financial Health".
      `;

      const response = await ai.models.generateContent({
         model: "gemini-2.5-flash",
         contents: prompt,
      });

      const responseText = response.text || "I'm not sure how to help with that.";
      setMessages(prev => [...prev, { role: 'guru', text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      let errorMessage = "I'm having trouble connecting right now.";
      if (error instanceof Error && error.message.includes("API Key")) {
        errorMessage = "API Key error: Please check your .env.local file and ensure the GEMINI_API_KEY is set correctly.";
      }
      setMessages(prev => [...prev, { role: 'guru', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "How can I reduce fodder cost?",
    "Show me my profit analysis.",
    "Tips to increase milk fat%?",
    "Should I sell a low-yield cow?"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="bg-emerald-600 p-6 rounded-t-3xl text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif">GauGuru AI</h2>
            <p className="text-xs text-white/70 font-medium tracking-wide">Dairy Profit Expert</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <div className="text-[10px] font-bold uppercase opacity-60">Status</div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
            Online & Ready
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-sm mx-auto">
            <div className="p-4 bg-emerald-50 rounded-full">
               <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Namaste! I am GauGuru.</h3>
              <p className="text-sm text-slate-500 font-medium">
                I help you analyze your farm data to find hidden profits and reduce losses. Ask me anything!
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full">
              {suggestions.map(s => (
                <button 
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => handleSend(), 0); }}
                  className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 p-3 rounded-xl border border-slate-100 transition-all text-left flex items-center gap-2"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-3xl ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-emerald-50 text-slate-800 rounded-tl-none border border-emerald-100'
            }`}>
              <div className="flex items-center gap-2 mb-2 opacity-60">
                 {m.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                 <span className="text-[10px] font-bold uppercase tracking-widest">{m.role === 'guru' ? 'GauGuru' : 'You'}</span>
              </div>
              <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-strong:text-emerald-900">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3">
               <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
               <span className="text-sm text-slate-500 font-medium">GauGuru is thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 rounded-b-3xl">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask GauGuru about your farm..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-100 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
        <div className="mt-3 flex items-center gap-2 justify-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
           <ShieldAlert className="w-3 h-3" />
           AI analysis may occasionally hallucinate. Use as support tool.
        </div>
      </div>
    </div>
  );
}
