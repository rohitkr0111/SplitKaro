import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils';
import type { ExpenseCategory } from '../types';
import { ArrowLeft, Check, Info } from 'lucide-react';
import { format } from 'date-fns';

export const AddExpense: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const addExpense = useStore((s) => s.addExpense);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!group) return <div className="text-center py-16 text-gray-500">Group not found</div>;

  // Initialize with all members selected
  React.useEffect(() => {
    setSplitAmong(group.members.map((m) => m.id));
    if (group.members.length > 0) setPaidBy(group.members[0].id);
  }, [group.members]);

  const toggleSplitMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const perPersonShare = () => {
    const amt = parseFloat(amount) || 0;
    return splitAmong.length > 0 ? amt / splitAmong.length : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Title is required');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (!paidBy) return setError('Select who paid');
    if (splitAmong.length === 0) return setError('Select at least one person to split among');

    addExpense(group.id, {
      title: title.trim(),
      amount: amt,
      paidBy,
      splitAmong,
      category,
      date: new Date(date).toISOString(),
      note: note.trim() || undefined,
    });
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(`/groups/${group.id}`)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={18} /> Back to {group.name}
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-500 text-sm">Record a new expense for {group.emoji} {group.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                    : 'bg-gray-50 text-gray-600 hover:bg-green-50'
                }`}
              >
                <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                <span className="truncate w-full text-center">{CATEGORY_LABELS[cat].split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Amount */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              What was this for? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hotel stay, Dinner, Taxi..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Amount (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-2xl font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any additional details..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Paid by */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Paid by</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaidBy(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  paidBy === m.id
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: m.color }}
                >
                  {m.name[0].toUpperCase()}
                </div>
                <span className="truncate">{m.name}</span>
                {paidBy === m.id && <Check size={14} className="ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Split among */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Split among</label>
            {amount && splitAmong.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <Info size={12} />
                {formatCurrency(perPersonShare())} / person
              </div>
            )}
          </div>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSplitAmong(group.members.map((m) => m.id))}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => setSplitAmong([])}
              className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-medium"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.members.map((m) => {
              const selected = splitAmong.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleSplitMember(m.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-400 hover:border-green-300'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${!selected ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: m.color }}
                  >
                    {m.name[0].toUpperCase()}
                  </div>
                  <span className="truncate">{m.name}</span>
                  {selected && <Check size={14} className="ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold text-lg transition-colors shadow-md"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};
