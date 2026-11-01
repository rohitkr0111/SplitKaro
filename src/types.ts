export interface Member {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  date: string;
  category: ExpenseCategory;
  note?: string;
}

export interface AdvancePayment {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  note: string;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  emoji: string;
  members: Member[];
  expenses: Expense[];
  advances: AdvancePayment[];
  settledPairs: string[]; // "fromId->toId" pairs marked as settled
  createdAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'utilities'
  | 'other';

export interface Balance {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalShare: number;
  advancePaid: number;
  netBalance: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
  key: string; // "fromId->toId"
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
