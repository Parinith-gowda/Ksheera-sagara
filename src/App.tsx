import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Receipt, 
  TrendingUp, 
  MessageSquareText,
  LogOut,
  ChevronRight,
  Loader2,
  Beef as CowIcon,
  Milk,
  Wallet
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncomeLog from './components/IncomeLog';
import ExpenseLog from './components/ExpenseLog';
import CowAnalysis from './components/CowAnalysis';
import GauGuru from './components/GauGuru';

type ActivePage = 'dashboard' | 'income' | 'expense' | 'cows' | 'gauguru';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center">
              <Milk className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Ksheera-Sagara</h1>
            <p className="text-slate-600 text-lg">
              Empowering dairy farmers with data-driven profitability.
            </p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
          
          <div className="pt-8 grid grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <TrendingUp className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-sm">Track Profit</div>
              <div className="text-xs text-slate-500">Know exactly how much you earn.</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <MessageSquareText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-sm">AI Advice</div>
              <div className="text-xs text-slate-500">GauGuru helps reduce costs.</div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'income': return <IncomeLog user={user} />;
      case 'expense': return <ExpenseLog user={user} />;
      case 'cows': return <CowAnalysis user={user} />;
      case 'gauguru': return <GauGuru user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Milk Log', icon: PlusCircle },
    { id: 'expense', label: 'Expenses', icon: Receipt },
    { id: 'cows', label: 'Cow-wise', icon: CowIcon },
    { id: 'gauguru', label: 'GauGuru', icon: MessageSquareText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0 md:pl-64">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex-col py-8 z-20">
        <div className="px-8 mb-8 flex items-center gap-3">
          <Milk className="w-8 h-8 text-emerald-600" />
          <h1 className="font-bold text-xl text-slate-900">Ksheera-Sagara</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id as ActivePage)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${
                activePage === item.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {activePage === item.id && <ChevronRight className="ml-auto w-4 h-4" />}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-auto">
          <button 
            onClick={logOut}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <header className="flex md:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Milk className="w-6 h-6 text-emerald-600" />
            <h1 className="font-bold text-lg">Ksheera-Sagara</h1>
          </div>
          <button onClick={logOut} className="p-2 text-slate-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 flex md:hidden p-2 pb-8 z-30">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id as ActivePage)}
            className={`flex-1 flex flex-col items-center gap-1 py-1 transition-all ${
              activePage === item.id 
                ? 'text-emerald-600' 
                : 'text-slate-400'
            }`}
          >
            <item.icon className={`w-5 h-5 ${activePage === item.id ? 'fill-emerald-100' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-tight">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
