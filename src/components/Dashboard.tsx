import { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { MilkEntry, ExpenseEntry, ExpenseCategory } from '../types';
import {
  TrendingUp,
  IndianRupee,
  ArrowDownRight,
  Download,
  Loader2 as Loader2Icon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard({ user }: { user: User }) {
  const [milkEntries, setMilkEntries] = useState<MilkEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const milkQuery = query(
      collection(db, `users/${user.uid}/milk_entries`),
      orderBy('date', 'desc')
    );

    const expenseQuery = query(
      collection(db, `users/${user.uid}/expenses`),
      orderBy('date', 'desc')
    );

    const unsubMilk = onSnapshot(milkQuery, (snap) => {
      setMilkEntries(snap.docs.map(d => d.data() as MilkEntry));
    });

    const unsubExpense = onSnapshot(expenseQuery, (snap) => {
      setExpenses(snap.docs.map(d => d.data() as ExpenseEntry));
      setLoading(false);
    });

    return () => {
      unsubMilk();
      unsubExpense();
    };
  }, [user.uid]);

  const summary = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const currentMilk = milkEntries.filter(m => {
      const d = new Date(m.date);
      return d >= start && d <= end;
    });

    const currentExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    const totalIncome = currentMilk.reduce((sum, m) => sum + m.amountPaid, 0);
    const totalExpenses = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalLitres = currentMilk.reduce((sum, m) => sum + m.litres, 0);

    const expenseBreakdown: Record<ExpenseCategory, number> = {
      [ExpenseCategory.FODDER]: 0,
      [ExpenseCategory.MEDICAL]: 0,
      [ExpenseCategory.LABOR]: 0,
      [ExpenseCategory.ELECTRICITY]: 0,
      [ExpenseCategory.OTHER]: 0
    };

    currentExpenses.forEach(e => {
      expenseBreakdown[e.category] += e.amount;
    });

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      totalLitres,
      profitPerLitre: totalLitres > 0 ? (totalIncome - totalExpenses) / totalLitres : 0,
      expenseBreakdown
    };
  }, [milkEntries, expenses]);

  const chartData = useMemo(() => {
    const data: any[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthLabel = format(d, 'MMM');

      const monthIncome = milkEntries
        .filter(m => {
          const date = new Date(m.date);
          return date >= start && date <= end;
        })
        .reduce((sum, m) => sum + m.amountPaid, 0);

      const monthExpense = expenses
        .filter(e => {
          const date = new Date(e.date);
          return date >= start && date <= end;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      data.push({
        name: monthLabel,
        Income: monthIncome,
        Expense: monthExpense,
        Profit: monthIncome - monthExpense
      });
    }
    return data;
  }, [milkEntries, expenses]);

  const pieData = Object.entries(summary.expenseBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({ name: key, value }));

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Header
      pdf.setFillColor(16, 185, 129);
      pdf.rect(0, 0, 210, 25, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text("Ksheera-Sagara Financial Report", 14, 15);

      pdf.setFontSize(10);
      pdf.text(format(new Date(), "MMMM yyyy"), 160, 15);

      let y = 35;

      const cardWidth = 60;
      const cardHeight = 25;

      const drawCard = (
        x: number,
        title: string,
        value: string,
        r: number,
        g: number,
        b: number
      ) => {
        pdf.setFillColor(r, g, b);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 4, 4, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(title, x + 5, y + 8);

        pdf.setFontSize(16);
        pdf.text(value, x + 5, y + 18);
      };

      drawCard(10, "Income", formatCurrency(summary.totalIncome), 16, 185, 129);
      drawCard(75, "Expenses", formatCurrency(summary.totalExpenses), 239, 68, 68);
      drawCard(140, "Net Profit", formatCurrency(summary.netProfit), 59, 130, 246);

      y += 40;

      autoTable(pdf, {
        startY: y,
        head: [["Metric", "Value"]],
        body: [
          ["Total Milk", `${summary.totalLitres} L`],
          ["Profit Per Litre", formatCurrency(summary.profitPerLitre)],
          [
            "Input Cost %",
            summary.totalIncome > 0
              ? `${((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0)}%`
              : "0%"
          ]
        ],
        headStyles: {
          fillColor: [16, 185, 129]
        }
      });

      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 15,
        head: [["Expense Category", "Amount"]],
        body: Object.entries(summary.expenseBreakdown)
          .filter(([_, val]) => val > 0)
          .map(([cat, val]) => [cat, formatCurrency(val)]),
        headStyles: {
          fillColor: [239, 68, 68]
        }
      });

      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 15,
        head: [["Date", "Litres", "Amount"]],
        body: milkEntries.slice(0, 10).map((m) => [
          format(new Date(m.date), "dd MMM"),
          `${m.litres} L`,
          formatCurrency(m.amountPaid)
        ]),
        headStyles: {
          fillColor: [59, 130, 246]
        }
      });

      pdf.save("Ksheera_Sagara_Report_" + format(new Date(), "MMM_yyyy") + ".pdf");

    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF");
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2Icon className="animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6" ref={dashboardRef} id="dashboard-content">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
          <p className="text-slate-500 font-medium">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
            <span className="font-bold text-slate-500 text-sm">Income</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">₹{summary.totalIncome.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><ArrowDownRight className="w-5 h-5" /></div>
            <span className="font-bold text-slate-500 text-sm">Expenses</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">₹{summary.totalExpenses.toLocaleString()}</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-xl ${summary.netProfit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-500 text-sm">Net Profit</span>
          </div>
          <div className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{summary.netProfit.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Income vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 font-bold">Total Milk</div>
          <div className="text-lg font-bold text-slate-900">{summary.totalLitres} L</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 font-bold">Profit / L</div>
          <div className="text-lg font-bold text-slate-900">₹{summary.profitPerLitre.toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 font-bold">Input Cost %</div>
          <div className="text-lg font-bold text-slate-900">
            {summary.totalIncome > 0 ? ((summary.totalExpenses / summary.totalIncome) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
