import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  setDoc,
  query, 
  orderBy,
  onSnapshot,
  limit,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { MilkEntry, Cow } from '../types';
import { 
  Plus, 
  Milk, 
  Trash2, 
  Calendar as CalendarIcon, 
  AlertCircle,
  Hash,
  Droplet,
  Percent
} from 'lucide-react';
import { format } from 'date-fns';
import { OperationType, handleFirestoreError } from '../lib/firestore';

export default function IncomeLog({ user }: { user: User }) {
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [cows, setCows] = useState<Cow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [litres, setLitres] = useState('');
  const [fat, setFat] = useState('');
  const [snf, setSnf] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCow, setSelectedCow] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, `users/${user.uid}/milk_entries`),
      orderBy('date', 'desc'),
      limit(20)
    );
    const cowQ = query(collection(db, `users/${user.uid}/cows`));

    const unsubCows = onSnapshot(cowQ, (snap) => {
      setCows(snap.docs.map(d => d.data() as Cow));
    });

    const unsubscribe = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id } as MilkEntry)));
      setLoading(false);
    });

    return () => {
      unsubscribe();
      unsubCows();
    };
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!litres || !amount) return;

    setSaving(true);
    try {
      const entryId = crypto.randomUUID();
      const path = `users/${user.uid}/milk_entries`;
      const data = {
        id: entryId,
        date: new Date(date).toISOString(),
        litres: parseFloat(litres),
        fatPercent: fat ? parseFloat(fat) : undefined,
        snfPercent: snf ? parseFloat(snf) : undefined,
        amountPaid: parseFloat(amount),
        cowId: selectedCow || 'herd', // Changed from undefined to 'herd'
        userId: user.uid
      };
      
      await setDoc(doc(db, path, entryId), data);
      
      // Reset
      setLitres('');
      setFat('');
      setSnf('');
      setAmount('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/milk_entries`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/milk_entries`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/milk_entries/${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Card */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Add Milk Entry</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Litres</label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={litres}
                    onChange={(e) => setLitres(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-700"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fat %</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SNF %</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={snf}
                    onChange={(e) => setSnf(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cow (Optional)</label>
              <select
                value={selectedCow}
                onChange={(e) => setSelectedCow(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="">Full Herd</option>
                {cows.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              disabled={saving}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : (
                <>
                  <Milk className="w-5 h-5" />
                  Save Entry
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* List Card */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
          Recent Slips
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Last 20</span>
        </h2>

        {loading ? (
          <div className="p-12 flex justify-center text-slate-400 italic">Loading entries...</div>
        ) : entries.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Milk className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No milk entries found. Add your first slip!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-600">
                    <span className="text-[10px] font-bold uppercase leading-none">{format(new Date(entry.date), 'MMM')}</span>
                    <span className="text-lg font-black leading-none">{format(new Date(entry.date), 'dd')}</span>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{entry.litres} Litres</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      {entry.fatPercent && <span>Fat: {entry.fatPercent}%</span>}
                      {entry.snfPercent && <span>SNF: {entry.snfPercent}%</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-black text-emerald-600">₹{entry.amountPaid.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Payment</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
