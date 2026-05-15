import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  setDoc,
  query, 
  orderBy,
  onSnapshot,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Cow, MilkEntry } from '../types';
import { 
  Plus, 
  Trash2, 
  Beef as CowIcon,
  Tag,
  Dna,
  Milk,
  TrendingUp,
  TrendingDown,
  Activity,
  History,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { OperationType, handleFirestoreError } from '../lib/firestore';

export default function CowAnalysis({ user }: { user: User }) {
  const [cows, setCows] = useState<Cow[]>([]);
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const cowQ = query(collection(db, `users/${user.uid}/cows`), orderBy('createdAt', 'desc'));
    const milkQ = query(collection(db, `users/${user.uid}/milk_entries`));

    const unsubCows = onSnapshot(cowQ, (snap) => {
      setCows(snap.docs.map(d => ({ ...d.data(), id: d.id } as Cow)));
      setLoading(false);
    });

    const unsubMilk = onSnapshot(milkQ, (snap) => {
      setMilkEntries(snap.docs.map(d => d.data() as MilkEntry));
    });

    return () => {
      unsubCows();
      unsubMilk();
    };
  }, [user.uid]);

  const cowStats = useMemo(() => {
    return cows.map(cow => {
      const entries = milkEntries.filter(m => m.cowId === cow.id);
      const totalLitres = entries.reduce((sum, m) => sum + m.litres, 0);
      const totalIncome = entries.reduce((sum, m) => sum + m.amountPaid, 0);
      const avgFat = entries.length > 0 ? entries.reduce((sum, m) => sum + (m.fatPercent || 0), 0) / entries.length : 0;
      
      return {
        ...cow,
        totalLitres,
        totalIncome,
        avgFat,
        entriesCount: entries.length
      };
    });
  }, [cows, milkEntries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    try {
      const id = crypto.randomUUID();
      const path = `users/${user.uid}/cows`;
      const data = {
        id,
        name,
        breed,
        tagNumber,
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, path, id), data);
      
      // Reset
      setName('');
      setBreed('');
      setTagNumber('');
      setShowAdd(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/cows`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Note: In production you'd delete sub-entries too, but for brief:
      await deleteDoc(doc(db, `users/${user.uid}/cows`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/cows/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cow-wise Analysis</h2>
          <p className="text-slate-500 font-medium">Manage and track individual cow performance.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <Plus className="w-5 h-5" />
          Add Cow
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50 mb-8 max-w-xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cow Name/ID</label>
                <input
                  type="text"
                  placeholder="e.g. Lakshmi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  required
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Breed</label>
                <div className="relative">
                  <Dna className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Holstein, Jersey..."
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tag Number</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tag ID"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>
             </div>
             <div className="col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                >
                  {saving ? 'Adding...' : 'Add Cow'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
             </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 italic">Finding cows...</div>
      ) : cowStats.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
           <CowIcon className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1} />
           <p className="text-slate-500 font-medium">No cows registered. Add your cattle to track individual profits!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cowStats.map((cow) => (
            <div key={cow.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                      <CowIcon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cow.name}</h3>
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                         <span className="flex items-center gap-1"><Dna className="w-3 h-3" /> {cow.breed || 'Unknown'}</span>
                         <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {cow.tagNumber || 'No Tag'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(cow.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="p-3 bg-slate-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Yield</div>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                         <Milk className="w-3 h-3 text-emerald-500" />
                         {cow.totalLitres}L
                      </div>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Income</div>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                         <span className="text-emerald-500 font-black">₹</span>
                         {cow.totalIncome.toLocaleString()}
                      </div>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg Fat</div>
                      <div className="flex items-center gap-1 font-bold text-slate-900">
                         <Activity className="w-3 h-3 text-emerald-500" />
                         {cow.avgFat.toFixed(1)}%
                      </div>
                   </div>
                </div>

                <div className="mt-6 flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-50">
                   <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">{cow.entriesCount} Slips recorded</span>
                   </div>
                   <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-black uppercase">Active</span>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
