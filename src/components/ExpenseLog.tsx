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
import { ExpenseEntry, ExpenseCategory } from '../types';
import { 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Wallet,
  Tag,
  AlignLeft,
  IndianRupee,
  Factory,
  Stethoscope,
  Users,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { OperationType, handleFirestoreError } from '../lib/firestore';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  [ExpenseCategory.FODDER]: Factory,
  [ExpenseCategory.MEDICAL]: Stethoscope,
  [ExpenseCategory.LABOR]: Users,
  [ExpenseCategory.ELECTRICITY]: Zap,
  [ExpenseCategory.OTHER]: MoreHorizontal
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FODDER]: 'text-amber-600 bg-amber-50 border-amber-100',
  [ExpenseCategory.MEDICAL]: 'text-rose-600 bg-rose-50 border-rose-100',
  [ExpenseCategory.LABOR]: 'text-blue-600 bg-blue-50 border-blue-100',
  [ExpenseCategory.ELECTRICITY]: 'text-yellow-600 bg-yellow-50 border-yellow-100',
  [ExpenseCategory.OTHER]: 'text-slate-600 bg-slate-50 border-slate-100'
};

export default function ExpenseLog({ user }: { user: User }) {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FODDER);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, `users/${user.uid}/expenses`),
      orderBy('date', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map(d => ({ ...d.data(), id: d.id } as ExpenseEntry)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setSaving(true);
    try {
      const expenseId = crypto.randomUUID();
      const path = `users/${user.uid}/expenses`;
      const data = {
        id: expenseId,
        date: new Date(date).toISOString(),
        category,
        amount: parseFloat(amount),
        description,
        userId: user.uid
      };
      
      await setDoc(doc(db, path, expenseId), data);
      
      // Reset
      setAmount('');
      setDescription('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/expenses`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `users/${user.uid}/expenses`, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/expenses/${id}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Card */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-100 sticky top-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Log Expense</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ExpenseCategory).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                        category === cat 
                          ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-500/20' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
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
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-700"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                <textarea
                  placeholder="What was this for? (e.g. 5 bags of feed)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium min-h-[100px]"
                />
              </div>
            </div>

            <button
              disabled={saving}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : (
                <>
                  <Wallet className="w-5 h-5" />
                  Record Expense
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* List Card */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 px-2">
          Expense History
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Top 20</span>
        </h2>

        {loading ? (
          <div className="p-12 flex justify-center text-slate-400 italic">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No expenses recorded yet. Start tracking your costs!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const Icon = CATEGORY_ICONS[expense.category];
              return (
                <div key={expense.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl border ${CATEGORY_COLORS[expense.category]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{expense.category}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{expense.description || 'No description'}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-black text-rose-600">₹{expense.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Cost</div>
                    </div>
                    <button 
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
