import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { calculateBalances, formatCurrency } from '../utils';
import { AvatarStack } from '../components/Avatar';
import { Plus, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

export const Home: React.FC = () => {
  const groups = useStore((s) => s.groups);

  const totalGroups = groups.length;
  const totalExpenses = groups.reduce((s, g) => s + g.expenses.reduce((a, e) => a + e.amount, 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {groups.length === 0 ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center text-6xl animate-scale-in">
              💸
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <Plus size={20} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Split with friends, stress-free</h1>
          <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
            Track expenses, record advances, and settle up after every trip or event.
          </p>
          <Link
            to="/groups/new"
            className="btn-primary flex items-center gap-2 text-base"
          >
            <Plus size={18} strokeWidth={2.5} /> Create Your First Group
          </Link>

          <div className="mt-16 grid grid-cols-3 gap-6 w-full max-w-md text-center">
            {[
              { icon: '🏕️', label: 'Trips & Travel' },
              { icon: '🍕', label: 'Dinners & Events' },
              { icon: '🏠', label: 'Shared Living' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <div className="text-3xl">{item.icon}</div>
                <div className="text-xs text-gray-400 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Summary bar ── */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="card p-4">
              <div className="text-xs text-gray-400 font-medium mb-1">Total Groups</div>
              <div className="text-2xl font-bold text-gray-900">{totalGroups}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-400 font-medium mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalExpenses)}</div>
            </div>
          </div>

          {/* ── Group list ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Your Groups</h2>
            <Link
              to="/groups/new"
              className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
            >
              <Plus size={16} /> New
            </Link>
          </div>

          <div className="space-y-3">
            {[...groups].reverse().map((group) => {
              const balances = calculateBalances(group);
              const totalExp = group.expenses.reduce((s, e) => s + e.amount, 0);
              const settledCount = (group.settledPairs ?? []).length;

              // My net — use the group-level aggregate
              const totalOwed = balances.filter((b) => b.netBalance > 0.01).reduce((s, b) => s + b.netBalance, 0);
              const totalOwe = balances.filter((b) => b.netBalance < -0.01).reduce((s, b) => s + Math.abs(b.netBalance), 0);

              return (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="card card-interactive p-4 flex items-center gap-4 block"
                >
                  {/* Emoji */}
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shrink-0 border border-slate-100">
                    {group.emoji}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{group.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <AvatarStack members={group.members} max={4} />
                      <span className="text-xs text-gray-400">
                        {group.members.length} members · {format(new Date(group.createdAt), 'dd MMM')}
                      </span>
                    </div>

                    {/* Expense total bar */}
                    {totalExp > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full balance-bar-fill"
                            style={{ width: `${Math.min(100, (settledCount / Math.max(1, balances.length)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{formatCurrency(totalExp)}</span>
                      </div>
                    )}
                  </div>

                  {/* Right side balance */}
                  <div className="shrink-0 text-right">
                    {totalOwed > 0.01 ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp size={12} />
                          <span className="text-xs font-semibold">{formatCurrency(totalOwed)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">owed back</span>
                      </div>
                    ) : totalOwe > 0.01 ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-red-500">
                          <TrendingDown size={12} />
                          <span className="text-xs font-semibold">{formatCurrency(totalOwe)}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">you owe</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Minus size={12} />
                          <span className="text-xs font-medium">settled</span>
                        </div>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-gray-300 mt-1 ml-auto" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
