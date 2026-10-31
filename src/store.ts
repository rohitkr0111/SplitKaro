import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Group, Member, Expense, AdvancePayment } from './types';

interface StoreState {
  groups: Group[];
  // Group actions
  createGroup: (name: string, description: string, emoji: string, memberNames: string[]) => string;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'description' | 'emoji'>>) => void;
  deleteGroup: (groupId: string) => void;
  // Member actions
  addMember: (groupId: string, name: string) => void;
  removeMember: (groupId: string, memberId: string) => void;
  // Expense actions
  addExpense: (groupId: string, expense: Omit<Expense, 'id' | 'groupId'>) => void;
  updateExpense: (groupId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'groupId'>>) => void;
  deleteExpense: (groupId: string, expenseId: string) => void;
  // Advance actions
  addAdvance: (groupId: string, advance: Omit<AdvancePayment, 'id' | 'groupId'>) => void;
  deleteAdvance: (groupId: string, advanceId: string) => void;
}

const MEMBER_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
  '#f97316', '#84cc16',
];

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      groups: [],

      createGroup: (name, description, emoji, memberNames) => {
        const groupId = uuidv4();
        const members: Member[] = memberNames.map((n, i) => ({
          id: uuidv4(),
          name: n.trim(),
          color: MEMBER_COLORS[i % MEMBER_COLORS.length],
        }));
        set((state) => ({
          groups: [
            ...state.groups,
            {
              id: groupId,
              name,
              description,
              emoji,
              members,
              expenses: [],
              advances: [],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return groupId;
      },

      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates } : g
          ),
        })),

      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        })),

      addMember: (groupId, name) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            const newMember: Member = {
              id: uuidv4(),
              name: name.trim(),
              color: MEMBER_COLORS[g.members.length % MEMBER_COLORS.length],
            };
            return { ...g, members: [...g.members, newMember] };
          }),
        })),

      removeMember: (groupId, memberId) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              members: g.members.filter((m) => m.id !== memberId),
              expenses: g.expenses.filter(
                (e) => e.paidBy !== memberId
              ).map((e) => ({
                ...e,
                splitAmong: e.splitAmong.filter((id) => id !== memberId),
              })),
              advances: g.advances.filter((a) => a.paidBy !== memberId),
            };
          }),
        })),

      addExpense: (groupId, expense) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              expenses: [
                ...g.expenses,
                { ...expense, id: uuidv4(), groupId },
              ],
            };
          }),
        })),

      updateExpense: (groupId, expenseId, updates) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              expenses: g.expenses.map((e) =>
                e.id === expenseId ? { ...e, ...updates } : e
              ),
            };
          }),
        })),

      deleteExpense: (groupId, expenseId) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              expenses: g.expenses.filter((e) => e.id !== expenseId),
            };
          }),
        })),

      addAdvance: (groupId, advance) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              advances: [
                ...g.advances,
                { ...advance, id: uuidv4(), groupId },
              ],
            };
          }),
        })),

      deleteAdvance: (groupId, advanceId) =>
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              advances: g.advances.filter((a) => a.id !== advanceId),
            };
          }),
        })),
    }),
    { name: 'splitkaro-store' }
  )
);
