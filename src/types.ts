/**
 * Types for Ksheera-Sagara App
 */

export enum ExpenseCategory {
  FODDER = 'Fodder',
  MEDICAL = 'Medical',
  LABOR = 'Labor',
  ELECTRICITY = 'Electricity',
  OTHER = 'Other'
}

export interface Cow {
  id: string;
  name: string;
  breed?: string;
  tagNumber?: string;
  createdAt: number;
}

export interface MilkEntry {
  id: string;
  date: string; // ISO String
  cowId?: string;
  litres: number;
  fatPercent?: number;
  snfPercent?: number;
  amountPaid: number;
  userId: string;
}

export interface ExpenseEntry {
  id: string;
  date: string; // ISO String
  category: ExpenseCategory;
  description?: string;
  amount: number;
  userId: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitPerLitre: number;
  totalLitres: number;
  expenseBreakdown: Record<ExpenseCategory, number>;
}
