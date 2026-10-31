import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { ArrowLeft, Check } from 'lucide-react';
import { format } from 'date-fns';

export const AddAdvance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const addAdvance = useStore((s) => s.addAdvance);

  const [paidBy, setPaidBy] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (group && group.members.length > 0) {
      setPaidBy(group.members[0].id);
    }
  }, [group]);

  if (!group) return <div className="text-center py-16 text-gray-500">Group not found</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (!paidBy) return setError('Select who paid the advance');

    addAdvance(group.id, {
      paidBy,
      amount: amt,
      note: note.trim() || 'Advance payment',
      date: new Date(date).toISOString(),
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
        <h1 className="text-2xl font-bold text-gray-900">Record Advance Payment</h1>
        <p className="text-gray-500 text-sm">
          Record money someone paid upfront for the group — this will be counted towards their total contribution.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <div className="font-semibold text-amber-800 text-sm">What is an Advance Payment?</div>
          <div className="text-amber-700 text-sm mt-0.5">
            When someone pays money upfront (e.g. before the trip) to cover group expenses. This is tracked separately from individual expense payments.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Who paid */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Who gave the advance?</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaidBy(m.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  paidBy === m.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300'
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

        {/* Amount, note, date */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 text-2xl font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Gave cash before trip, Hotel booking deposit..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-semibold text-lg transition-colors shadow-md"
        >
          Record Advance Payment
        </button>
      </form>
    </div>
  );
};
