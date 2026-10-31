import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { calculateBalances } from '../utils';
import { formatCurrency } from '../utils';
import { Plus, Users, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const Home: React.FC = () => {
  const groups = useStore((s) => s.groups);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      {groups.length === 0 && (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">💸</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Split expenses with ease</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Track who paid what on trips and events, record advance payments, and settle up fairly.
          </p>
          <Link
            to="/groups/new"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-lg"
          >
            <Plus size={20} /> Create Your First Group
          </Link>
        </div>
      )}

      {groups.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
            <Link
              to="/groups/new"
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={16} /> New Group
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => {
              const balances = calculateBalances(group);
              const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
              const totalAdvances = group.advances.reduce((s, a) => s + a.amount, 0);
              const unsettled = balances.filter((b) => Math.abs(b.netBalance) > 0.01).length;

              return (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{group.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-green-700">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-gray-500 text-sm truncate">{group.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-gray-400 text-xs">
                        <Clock size={12} />
                        {format(new Date(group.createdAt), 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mb-1">
                        <Users size={12} /> Members
                      </div>
                      <div className="font-bold text-gray-800">{group.members.length}</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-blue-500 text-xs mb-1">Expenses</div>
                      <div className="font-bold text-blue-700 text-sm">{formatCurrency(totalExpenses)}</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${unsettled > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                      <div className={`text-xs mb-1 ${unsettled > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                        {unsettled > 0 ? 'Pending' : 'Settled'}
                      </div>
                      <div className={`font-bold text-sm ${unsettled > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                        {unsettled > 0 ? `${unsettled} left` : '✓ All done'}
                      </div>
                    </div>
                  </div>

                  {totalAdvances > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                      <TrendingUp size={12} />
                      <span>{formatCurrency(totalAdvances)} in advance payments</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
