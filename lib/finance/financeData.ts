export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
  paymentMethod?: string;
  notes?: string;
};

export type Expense = Transaction;
