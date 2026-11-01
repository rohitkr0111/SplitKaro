import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils';
import type { ExpenseCategory } from '../types';
import { ArrowLeft, Check, Info, Users, X } from 'lucide-react';
import { format } from 'date-fns';

export const AddExpense: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const addExpense = useStore((s) => s.addExpense);
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [_step] = useState(1);

  useEffect(() => {
    if (group) {
      setSplitAmong(group.members.map((m) => m.id));
      if (group.members.length > 0) setPaidBy(group.members[0].id);
    }
  }, [group?.id]);

  if (!group) return null;

  const perPerson = splitAmong.length > 0 && parseFloat(amount) ? parseFloat(amount) / splitAmong.length : 0;

  const toggleSplit = (mid: string) =>
    setSplitAmong((p) => p.includes(mid) ? p.filter((x) => x !== mid) : [...p, mid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please enter a title');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (!paidBy) return setError('Select who paid');
    if (splitAmong.length === 0) return setError('Select at least one person');

    addExpense(group.id, { title: title.trim(), amount: amt, paidBy, splitAmong, category, date: new Date(date).toISOString(), note: note.trim() || undefined });
    showToast(`"${title.trim()}" added ✓`);
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/groups/${group.id}`)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Expense</h1>
          <p className="text-gray-400 text-sm">{group.emoji} {group.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Amount — hero input */}
        <div className="card p-6 text-center">
          <div className="text-sm text-gray-400 font-medium mb-2">Total amount</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-gray-400">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-40 text-5xl font-bold text-gray-900 text-center bg-transparent border-none outline-none placeholder-gray-200"
            />
          </div>
          {perPerson > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold animate-scale-in">
              <Info size={12} /> {formatCurrency(perPerson)} per person ({splitAmong.length} people)
            </div>
          )}
        </div>

        {/* Title & details */}
        <div className="card p-5 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was this for? (e.g. Hotel, Dinner…)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-gray-900 placeholder-gray-300 font-medium"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-gray-700 text-sm"
            />
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              className="px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-gray-700 text-sm"
            />
          </div>
        </div>

        {/* Category */}
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category</div>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  category === cat ? 'bg-green-600 text-white scale-105 shadow-sm' : 'bg-slate-50 text-gray-500 hover:bg-slate-100'
                }`}>
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                <span className="truncate w-full text-center leading-none">{CATEGORY_LABELS[cat].split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Paid by */}
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Paid by</div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <button key={m.id} type="button" onClick={() => setPaidBy(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  paidBy === m.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-600 hover:border-gray-200 bg-slate-50'
                }`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                {m.name}
                {paidBy === m.id && <Check size={13} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {/* Split among */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={13} /> Split among
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSplitAmong(group.members.map((m) => m.id))}
                className="text-xs text-green-600 font-semibold hover:text-green-700">All</button>
              <span className="text-gray-200">|</span>
              <button type="button" onClick={() => setSplitAmong([])}
                className="text-xs text-gray-400 font-semibold hover:text-gray-600">None</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => {
              const sel = splitAmong.includes(m.id);
              return (
                <button key={m.id} type="button" onClick={() => toggleSplit(m.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    sel ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400 bg-slate-50'
                  }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${!sel ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                  {m.name}
                  {sel && <Check size={13} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
            <X size={14} className="shrink-0" /> {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full text-base flex items-center justify-center gap-2">
          <Check size={18} strokeWidth={2.5} /> Add Expense
        </button>
      </form>
    </div>
  );
};
