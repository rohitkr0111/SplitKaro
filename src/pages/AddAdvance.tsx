import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { ArrowLeft, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export const AddAdvance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const addAdvance = useStore((s) => s.addAdvance);
  const { showToast } = useToast();

  const [paidBy, setPaidBy] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (group && group.members.length > 0) setPaidBy(group.members[0].id);
  }, [group?.id]);

  if (!group) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (!paidBy) return setError('Select who paid');

    addAdvance(group.id, { paidBy, amount: amt, note: note.trim() || 'Advance payment', date: new Date(date).toISOString() });
    showToast('Advance payment recorded ✓');
    navigate(`/groups/${group.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/groups/${group.id}`)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Record Advance</h1>
          <p className="text-gray-400 text-sm">{group.emoji} {group.name}</p>
        </div>
      </div>

      {/* Info callout */}
      <div className="flex gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-5">
        <span className="text-2xl shrink-0">💡</span>
        <div>
          <div className="font-semibold text-amber-800 text-sm">What's an advance?</div>
          <div className="text-amber-700 text-sm mt-0.5 leading-relaxed">
            Money someone put in upfront (before the trip or event). It counts towards their total contribution and affects the final settlement.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount hero */}
        <div className="card p-6 text-center">
          <div className="text-sm text-amber-500 font-semibold mb-2">Advance Amount</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold text-gray-300">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-40 text-5xl font-bold text-amber-600 text-center bg-transparent border-none outline-none placeholder-gray-200"
            />
          </div>
        </div>

        {/* Details */}
        <div className="card p-5 space-y-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (e.g. Hotel deposit, Pre-trip cash…)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 text-gray-900 placeholder-gray-300 font-medium"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-400 text-gray-700 text-sm"
          />
        </div>

        {/* Who paid */}
        <div className="card p-5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Who gave the advance?</div>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <button key={m.id} type="button" onClick={() => setPaidBy(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  paidBy === m.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-100 text-gray-600 hover:border-gray-200 bg-slate-50'
                }`}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                {m.name}
                {paidBy === m.id && <Check size={13} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-shake">
            <X size={14} className="shrink-0" /> {error}
          </div>
        )}

        <button type="submit"
          className="w-full flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-bold text-base transition-all"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 16px rgba(245,158,11,.35)' }}>
          <Check size={18} strokeWidth={2.5} /> Record Advance
        </button>
      </form>
    </div>
  );
};
