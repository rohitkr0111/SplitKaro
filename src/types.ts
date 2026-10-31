// Data models for SplitKaro

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
  paidBy: string; // member id
  splitAmong: string[]; // member ids
  date: string; // ISO string
  category: ExpenseCategory;
  note?: string;
}

export interface AdvancePayment {
  id: string;
  groupId: string;
  paidBy: string; // member id
  amount: number;
  note: string;
  date: string; // ISO string
}

export interface Group {
  id: string;
  name: string;
  description: string;
  emoji: string;
  members: Member[];
  expenses: Expense[];
  advances: AdvancePayment[];
  createdAt: string; // ISO string
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
  totalPaid: number;       // actual cash paid (expenses + advances)
  totalShare: number;      // share of expenses they owe
  advancePaid: number;     // total advance money given
  netBalance: number;      // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string;     // member id who pays
  fromName: string;
  to: string;       // member id who receives
  toName: string;
  amount: number;
}
