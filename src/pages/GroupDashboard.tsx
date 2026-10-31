import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { calculateBalances, calculateSettlements, formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils';
import { Avatar } from '../components/Avatar';
import {
  Wallet, Receipt, Trash2, ArrowRight,
  TrendingUp, Users,
  ShoppingBag, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'expenses' | 'advances' | 'balances';

export const GroupDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const deleteExpense = useStore((s) => s.deleteExpense);
  const deleteAdvance = useStore((s) => s.deleteAdvance);
  const deleteGroup = useStore((s) => s.deleteGroup);

  const [tab, setTab] = useState<Tab>('expenses');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!group) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🤔</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Group not found</h2>
        <Link to="/" className="text-green-600 hover:underline">Go back home</Link>
      </div>
    );
  }

  const balances = calculateBalances(group);
  const settlements = calculateSettlements(balances);
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  const totalAdvances = group.advances.reduce((s, a) => s + a.amount, 0);
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const isSettled = settlements.length === 0;

  const handleDeleteGroup = () => {
    deleteGroup(group.id);
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 p-1">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{group.emoji}</span>
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            </div>
            {group.description && <p className="text-gray-500 text-sm ml-11">{group.description}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/groups/${group.id}/receipt`}
            className="flex items-center gap-1.5 bg-white border border-gray-200 hover:border-green-400 text-gray-700 hover:text-green-700 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Receipt size={15} /> Receipt
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-1"><Users size={12} /> Members</div>
          <div className="text-2xl font-bold text-gray-800">{group.members.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-blue-500 text-xs mb-1">Total Expenses</div>
          <div className="text-xl font-bold text-blue-700">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className={`rounded-2xl p-4 shadow-sm border text-center ${isSettled ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className={`text-xs mb-1 ${isSettled ? 'text-green-500' : 'text-orange-500'}`}>Status</div>
          <div className={`text-sm font-bold ${isSettled ? 'text-green-700' : 'text-orange-700'}`}>
            {isSettled ? '✓ Settled' : `${settlements.length} pending`}
          </div>
        </div>
      </div>

      {/* Members row */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-gray-700">Members</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
              <Avatar name={m.name} color={m.color} size="sm" />
              <span className="text-sm font-medium text-gray-700">{m.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlements (if any) */}
      {!isSettled && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">Pending Settlements</span>
          </div>
          <div className="space-y-2">
            {settlements.map((s, i) => {
              const fromMember = memberMap[s.from];
              const toMember = memberMap[s.to];
              return (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5">
                  <Avatar name={fromMember?.name || s.fromName} color={fromMember?.color || '#999'} size="sm" />
                  <span className="text-sm font-medium text-gray-700 truncate">{s.fromName}</span>
                  <ArrowRight size={14} className="text-orange-400 shrink-0" />
                  <Avatar name={toMember?.name || s.toName} color={toMember?.color || '#999'} size="sm" />
                  <span className="text-sm font-medium text-gray-700 truncate">{s.toName}</span>
                  <span className="ml-auto font-bold text-orange-700 shrink-0">{formatCurrency(s.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Link
          to={`/groups/${group.id}/expenses/new`}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-semibold transition-colors shadow-sm"
        >
          <ShoppingBag size={18} /> Add Expense
        </Link>
        <Link
          to={`/groups/${group.id}/advance`}
          className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-semibold transition-colors shadow-sm"
        >
          <Wallet size={18} /> Record Advance
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5">
        {(['expenses', 'advances', 'balances'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'expenses' ? `Expenses (${group.expenses.length})` :
             t === 'advances' ? `Advances (${group.advances.length})` :
             'Balances'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'expenses' && (
        <div className="space-y-3">
          {group.expenses.length === 0 ? (
            <EmptyState icon="🧾" text="No expenses yet" sub="Add your first expense above" />
          ) : (
            [...group.expenses]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((exp) => {
                const payer = memberMap[exp.paidBy];
                const perPerson = exp.splitAmong.length > 0 ? exp.amount / exp.splitAmong.length : 0;
                return (
                  <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl mt-0.5">{CATEGORY_ICONS[exp.category]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{exp.title}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {format(new Date(exp.date), 'dd MMM yyyy')} · {CATEGORY_LABELS[exp.category]}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-gray-900">{formatCurrency(exp.amount)}</div>
                            <div className="text-xs text-gray-400">{formatCurrency(perPerson)}/person</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {payer && (
                            <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: payer.color }}>
                                {payer.name[0]}
                              </div>
                              paid by {payer.name}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            split among {exp.splitAmong.length}
                          </div>
                        </div>
                        {exp.note && <div className="text-xs text-gray-400 mt-1 italic">{exp.note}</div>}
                      </div>
                      <button
                        onClick={() => deleteExpense(group.id, exp.id)}
                        className="text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {tab === 'advances' && (
        <div className="space-y-3">
          {totalAdvances > 0 && (
            <div className="bg-amber-50 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <TrendingUp size={16} />
                <span className="text-sm font-semibold">Total Advance Pool</span>
              </div>
              <span className="font-bold text-amber-700">{formatCurrency(totalAdvances)}</span>
            </div>
          )}
          {group.advances.length === 0 ? (
            <EmptyState icon="💰" text="No advance payments" sub="Record money paid upfront for the group" />
          ) : (
            [...group.advances]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((adv) => {
                const payer = memberMap[adv.paidBy];
                return (
                  <div key={adv.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">💰</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900">{adv.note}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {format(new Date(adv.date), 'dd MMM yyyy')}
                        </div>
                        {payer && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full w-fit">
                            <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: payer.color }}>
                              {payer.name[0]}
                            </div>
                            {payer.name}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-amber-700">{formatCurrency(adv.amount)}</div>
                      </div>
                      <button
                        onClick={() => deleteAdvance(group.id, adv.id)}
                        className="text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {tab === 'balances' && (
        <div className="space-y-3">
          {balances.map((b) => {
            const member = memberMap[b.memberId];
            const isPositive = b.netBalance > 0.01;
            const isNegative = b.netBalance < -0.01;
            return (
              <div key={b.memberId} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={b.memberName} color={member?.color || '#999'} size="md" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{b.memberName}</div>
                    <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                      {isPositive ? `Gets back ${formatCurrency(b.netBalance)}` :
                       isNegative ? `Owes ${formatCurrency(Math.abs(b.netBalance))}` :
                       'All settled ✓'}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(b.netBalance)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-50 rounded-xl p-2">
                    <div className="text-xs text-blue-500">Paid for expenses</div>
                    <div className="font-bold text-blue-700 text-sm">{formatCurrency(b.totalPaid - b.advancePaid)}</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2">
                    <div className="text-xs text-purple-500">Advance given</div>
                    <div className="font-bold text-purple-700 text-sm">{formatCurrency(b.advancePaid)}</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-2">
                    <div className="text-xs text-orange-500">Their share</div>
                    <div className="font-bold text-orange-700 text-sm">{formatCurrency(b.totalShare)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Group?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">
              This will permanently delete <strong>{group.name}</strong> and all its expenses and advance payments.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyState: React.FC<{ icon: string; text: string; sub: string }> = ({ icon, text, sub }) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-3">{icon}</div>
    <div className="font-semibold text-gray-600">{text}</div>
    <div className="text-gray-400 text-sm mt-1">{sub}</div>
  </div>
);
