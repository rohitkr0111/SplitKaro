import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { calculateBalances, calculateSettlements, formatCurrency, CATEGORY_ICONS, CATEGORY_LABELS } from '../utils';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import type { Expense, ExpenseCategory } from '../types';
import {
  ShoppingBag, Wallet, Receipt, Trash2, ArrowRight,
  TrendingUp, Users, UserPlus, Check, X, ArrowLeft,
  Search, Filter, Edit3, CheckCircle2,
  ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { format } from 'date-fns';

type Tab = 'expenses' | 'advances' | 'balances';

/* ── Edit Expense Modal ─────────────────────────────────────── */
const EditExpenseModal: React.FC<{
  expense: Expense;
  members: { id: string; name: string; color: string }[];
  groupId: string;
  onClose: () => void;
}> = ({ expense, members, groupId, onClose }) => {
  const updateExpense = useStore((s) => s.updateExpense);
  const { showToast } = useToast();
  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidBy, setPaidBy] = useState(expense.paidBy);
  const [splitAmong, setSplitAmong] = useState(expense.splitAmong);
  const [category, setCategory] = useState<ExpenseCategory>(expense.category);
  const [note, setNote] = useState(expense.note ?? '');

  const toggle = (id: string) =>
    setSplitAmong((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const save = () => {
    const amt = parseFloat(amount);
    if (!title.trim() || !amt || splitAmong.length === 0) return;
    updateExpense(groupId, expense.id, {
      title: title.trim(), amount: amt, paidBy, splitAmong, category,
      note: note.trim() || undefined,
    });
    showToast('Expense updated ✓');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Edit Expense</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Category row */}
        <div className="flex gap-2 flex-wrap mb-4">
          {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                category === cat ? 'bg-green-50 border-green-400 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat].split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-sm font-medium"
            placeholder="Expense title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-xl font-bold"
            placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-400 text-sm"
            placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Paid by</div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button key={m.id} onClick={() => setPaidBy(m.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                  paidBy === m.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                }`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                {m.name}
                {paidBy === m.id && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-gray-500 mb-2">Split among</div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const sel = splitAmong.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggle(m.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    sel ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-400'
                  }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${!sel ? 'opacity-40' : ''}`}
                    style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancel</button>
          <button onClick={save} className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Dashboard ─────────────────────────────────────────── */
export const GroupDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const deleteExpense = useStore((s) => s.deleteExpense);
  const deleteAdvance = useStore((s) => s.deleteAdvance);
  const deleteGroup = useStore((s) => s.deleteGroup);
  const addMember = useStore((s) => s.addMember);
  const removeMember = useStore((s) => s.removeMember);
  const toggleSettledPair = useStore((s) => s.toggleSettledPair);
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('expenses');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [memberError, setMemberError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const addMemberRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showAddMember) addMemberRef.current?.focus(); }, [showAddMember]);

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
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  const totalAdvances = group.advances.reduce((s, a) => s + a.amount, 0);
  const settledPairs = group.settledPairs ?? [];
  const pendingSettlements = settlements.filter((s) => !settledPairs.includes(s.key));
  const isFullySettled = pendingSettlements.length === 0;

  // Filter expenses
  const filteredExpenses = group.expenses
    .filter((e) => {
      const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.note ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === 'all' || e.category === filterCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return setMemberError('Enter a name');
    if (group.members.some((m) => m.name.toLowerCase() === name.toLowerCase()))
      return setMemberError('Already exists');
    addMember(group.id, name);
    setNewMemberName('');
    setMemberError('');
    setShowAddMember(false);
    showToast(`${name} added to the group 🎉`);
  };

  const handleDeleteExpense = (expId: string, title: string) => {
    deleteExpense(group.id, expId);
    showToast(`"${title}" deleted`, 'error');
  };

  const handleDeleteAdvance = (advId: string) => {
    deleteAdvance(group.id, advId);
    showToast('Advance payment removed', 'error');
  };

  const handleToggleSettled = (key: string, fromName: string, toName: string) => {
    toggleSettledPair(group.id, key);
    const isNowSettled = !settledPairs.includes(key);
    showToast(
      isNowSettled
        ? `✓ ${fromName} → ${toName} marked as settled`
        : `Unmarked settlement`,
      isNowSettled ? 'success' : 'info'
    );
  };

  const handleDeleteGroup = () => {
    deleteGroup(group.id);
    navigate('/');
  };

  const maxBalance = Math.max(...balances.map((b) => Math.abs(b.netBalance)), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl border border-slate-100 shrink-0">
              {group.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{group.name}</h1>
              {group.description && <p className="text-gray-400 text-sm">{group.description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/groups/${group.id}/receipt`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 text-sm font-medium transition-colors">
            <Receipt size={14} /> Receipt
          </Link>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-3 text-center">
          <div className="text-xs text-gray-400 mb-0.5">Members</div>
          <div className="text-xl font-bold text-gray-800">{group.members.length}</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xs text-gray-400 mb-0.5">Total Spent</div>
          <div className="text-lg font-bold text-blue-600">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className={`card p-3 text-center ${isFullySettled ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
          <div className={`text-xs mb-0.5 ${isFullySettled ? 'text-green-500' : 'text-orange-500'}`}>
            {isFullySettled ? 'Status' : 'Pending'}
          </div>
          <div className={`text-lg font-bold ${isFullySettled ? 'text-green-700' : 'text-orange-700'}`}>
            {isFullySettled ? '✓ Done' : `${pendingSettlements.length} left`}
          </div>
        </div>
      </div>

      {/* ── Members card ── */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-green-600" />
            <span className="text-sm font-semibold text-gray-700">Members ({group.members.length})</span>
          </div>
          <button
            onClick={() => { setShowAddMember((v) => !v); setMemberError(''); setNewMemberName(''); }}
            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              showAddMember ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}>
            {showAddMember ? <><X size={12} /> Cancel</> : <><UserPlus size={12} /> Add</>}
          </button>
        </div>

        {/* Add member form */}
        {showAddMember && (
          <div className="mb-3 animate-slide-up">
            <div className="flex gap-2">
              <input
                ref={addMemberRef}
                type="text"
                value={newMemberName}
                onChange={(e) => { setNewMemberName(e.target.value); setMemberError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Member name…"
                className={`flex-1 px-3 py-2 rounded-xl border text-sm ${memberError ? 'border-red-300' : 'border-gray-200 focus:border-green-400'}`}
              />
              <button onClick={handleAddMember}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                <Check size={14} /> Add
              </button>
            </div>
            {memberError && <p className="text-red-500 text-xs mt-1.5 ml-1">{memberError}</p>}
          </div>
        )}

        {/* Member chips */}
        <div className="flex flex-wrap gap-2">
          {group.members.map((m) => {
            const isUsed = group.expenses.some((e) => e.paidBy === m.id || e.splitAmong.includes(m.id)) ||
              group.advances.some((a) => a.paidBy === m.id);
            const memberBalance = balances.find((b) => b.memberId === m.id);
            const net = memberBalance?.netBalance ?? 0;
            return (
              <div key={m.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-100 bg-slate-50 group/chip transition-colors hover:border-slate-200">
                <Avatar name={m.name} color={m.color} size="xs" />
                <span className="text-sm font-medium text-gray-700">{m.name}</span>
                {Math.abs(net) > 0.01 && (
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${net > 0 ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                    {net > 0 ? '+' : ''}{formatCurrency(net)}
                  </span>
                )}
                {!isUsed && (
                  <button
                    onClick={() => { removeMember(group.id, m.id); showToast(`${m.name} removed`,'info'); }}
                    className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/chip:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Settlements banner ── */}
      {settlements.length > 0 && (
        <div className={`card p-4 mb-4 ${isFullySettled ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            {isFullySettled
              ? <CheckCircle2 size={15} className="text-green-600" />
              : <Zap size={15} className="text-amber-600" />}
            <span className={`text-sm font-semibold ${isFullySettled ? 'text-green-800' : 'text-amber-800'}`}>
              {isFullySettled ? 'All settled! 🎉' : 'Settle Up'}
            </span>
            {!isFullySettled && (
              <span className="ml-auto text-xs text-amber-600 font-medium">
                {settledPairs.length}/{settlements.length} done
              </span>
            )}
          </div>
          <div className="space-y-2">
            {settlements.map((s) => {
              const isSettled = settledPairs.includes(s.key);
              const from = memberMap[s.from];
              return (
                <div key={s.key}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isSettled ? 'bg-white/60 opacity-60' : 'bg-white shadow-sm'
                  }`}>
                  <Avatar name={from?.name ?? s.fromName} color={from?.color ?? '#999'} size="sm" />
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className={`text-sm font-semibold truncate ${isSettled ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {s.fromName}
                    </span>
                    <ArrowRight size={12} className="text-gray-300 shrink-0" />
                    <span className={`text-sm font-semibold truncate ${isSettled ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {s.toName}
                    </span>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${isSettled ? 'text-gray-400' : 'text-amber-700'}`}>
                    {formatCurrency(s.amount)}
                  </span>
                  <button
                    onClick={() => handleToggleSettled(s.key, s.fromName, s.toName)}
                    className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSettled
                        ? 'border-green-500 bg-green-500 text-white scale-110'
                        : 'border-gray-300 hover:border-green-400 text-transparent hover:text-green-400'
                    }`}>
                    <Check size={13} strokeWidth={3} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-3 mb-5">
        <Link to={`/groups/${group.id}/expenses/new`}
          className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 8px rgba(22,163,74,.3)' }}>
          <ShoppingBag size={16} /> Add Expense
        </Link>
        <Link to={`/groups/${group.id}/advance`}
          className="flex-1 flex items-center justify-center gap-2 text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-sm"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 2px 8px rgba(245,158,11,.3)' }}>
          <Wallet size={16} /> Advance
        </Link>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-100 mb-5 gap-1">
        {([
          { key: 'expenses', label: 'Expenses', count: group.expenses.length },
          { key: 'advances', label: 'Advances', count: group.advances.length },
          { key: 'balances', label: 'Balances', count: null },
        ] as const).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
              tab === key ? 'text-green-700 tab-active' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {label}
            {count !== null && count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Expenses Tab ── */}
      {tab === 'expenses' && (
        <div>
          {/* Search + filter row */}
          {group.expenses.length > 0 && (
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search expenses…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 text-sm bg-white"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  filterCategory !== 'all' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}>
                <Filter size={14} />
                {filterCategory !== 'all' ? CATEGORY_LABELS[filterCategory].split(' ')[0] : 'Filter'}
              </button>
            </div>
          )}

          {/* Category filter pills */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4 animate-slide-up">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  filterCategory === 'all' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500'
                }`}>
                All
              </button>
              {(Object.keys(CATEGORY_ICONS) as ExpenseCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    filterCategory === cat ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat].split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Expense list */}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={search || filterCategory !== 'all' ? '🔍' : '🧾'}
              text={search || filterCategory !== 'all' ? 'No matching expenses' : 'No expenses yet'}
              sub={search || filterCategory !== 'all' ? 'Try a different search or filter' : 'Tap "Add Expense" to log your first one'}
            />
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((exp) => {
                const payer = memberMap[exp.paidBy];
                const perPerson = exp.splitAmong.length > 0 ? exp.amount / exp.splitAmong.length : 0;
                const isExpanded = expandedExpense === exp.id;
                const splitMembers = exp.splitAmong.map((id) => memberMap[id]).filter(Boolean);

                return (
                  <div key={exp.id} className="card expense-item overflow-hidden">
                    {/* Main row */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer"
                      onClick={() => setExpandedExpense(isExpanded ? null : exp.id)}>
                      {/* Category icon */}
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0 border border-slate-100">
                        {CATEGORY_ICONS[exp.category]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{exp.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {payer && (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ backgroundColor: payer.color }}>{payer.name[0]}</div>
                              <span className="text-xs text-gray-400">{payer.name}</span>
                            </div>
                          )}
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{format(new Date(exp.date), 'dd MMM')}</span>
                          {exp.note && <span className="text-xs text-gray-400 truncate">· {exp.note}</span>}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <div className="font-bold text-gray-900">{formatCurrency(exp.amount)}</div>
                        <div className="text-xs text-gray-400">{formatCurrency(perPerson)}/ea</div>
                      </div>

                      {/* Expand icon */}
                      <div className="text-gray-300 ml-1">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-50 bg-slate-50/50 animate-slide-up">
                        <div className="pt-3 flex flex-wrap gap-4">
                          {/* Split members */}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-400 font-medium mb-2">Split among</div>
                            <div className="flex flex-wrap gap-1.5">
                              {splitMembers.map((m) => (
                                <div key={m.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-100 text-xs font-medium text-gray-700">
                                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ backgroundColor: m.color }}>{m.name[0]}</div>
                                  {m.name} · {formatCurrency(perPerson)}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-start gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingExpense(exp); setExpandedExpense(null); }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors">
                              <Edit3 size={12} /> Edit
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteExpense(exp.id, exp.title); }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Total summary */}
          {filteredExpenses.length > 0 && (
            <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-100 text-sm">
              <span className="text-gray-500 font-medium">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''}</span>
              <span className="font-bold text-gray-800">
                {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Advances Tab ── */}
      {tab === 'advances' && (
        <div>
          {totalAdvances > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-sm mb-4">
              <span className="text-amber-700 font-medium flex items-center gap-2">
                <TrendingUp size={14} /> Total Advance Pool
              </span>
              <span className="font-bold text-amber-800">{formatCurrency(totalAdvances)}</span>
            </div>
          )}

          {group.advances.length === 0 ? (
            <EmptyState icon="💰" text="No advance payments" sub='Tap "Advance" to record money paid upfront' />
          ) : (
            <div className="space-y-2">
              {[...group.advances]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((adv) => {
                  const payer = memberMap[adv.paidBy];
                  return (
                    <div key={adv.id} className="card p-4 flex items-center gap-3 expense-item">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl shrink-0 border border-amber-100">💰</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{adv.note}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {payer && (
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                style={{ backgroundColor: payer.color }}>{payer.name[0]}</div>
                              <span className="text-xs text-gray-400">{payer.name}</span>
                            </div>
                          )}
                          <span className="text-gray-200">·</span>
                          <span className="text-xs text-gray-400">{format(new Date(adv.date), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="font-bold text-amber-700">{formatCurrency(adv.amount)}</div>
                      <button
                        onClick={() => handleDeleteAdvance(adv.id)}
                        className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ── Balances Tab ── */}
      {tab === 'balances' && (
        <div className="space-y-3">
          {balances.map((b) => {
            const member = memberMap[b.memberId];
            const isPos = b.netBalance > 0.01;
            const isNeg = b.netBalance < -0.01;
            const pct = Math.abs(b.netBalance) / maxBalance;

            return (
              <div key={b.memberId} className="card p-4 expense-item">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={b.memberName} color={member?.color ?? '#999'} size="md" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{b.memberName}</div>
                    <div className={`text-xs font-medium mt-0.5 ${isPos ? 'text-green-600' : isNeg ? 'text-red-500' : 'text-gray-400'}`}>
                      {isPos ? `Gets back ${formatCurrency(b.netBalance)}` :
                       isNeg ? `Owes ${formatCurrency(Math.abs(b.netBalance))}` :
                       'All squared up ✓'}
                    </div>
                  </div>
                  <div className={`text-xl font-bold ${isPos ? 'text-green-600' : isNeg ? 'text-red-500' : 'text-gray-300'}`}>
                    {isPos ? '+' : ''}{formatCurrency(b.netBalance)}
                  </div>
                </div>

                {/* Balance bar */}
                <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div
                    className={`absolute h-full rounded-full balance-bar-fill ${isPos ? 'bg-green-500' : isNeg ? 'bg-red-400' : 'bg-gray-300'}`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  <StatMini label="Paid" value={formatCurrency(b.totalPaid - b.advancePaid)} color="blue" />
                  <StatMini label="Advance" value={formatCurrency(b.advancePaid)} color="purple" />
                  <StatMini label="Share" value={formatCurrency(b.totalShare)} color="orange" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          members={group.members}
          groupId={group.id}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {/* ── Delete group confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center px-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="text-4xl text-center mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete "{group.name}"?</h3>
            <p className="text-gray-500 text-sm text-center mb-5">All expenses and advance payments will be permanently lost.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">
                Cancel
              </button>
              <button onClick={handleDeleteGroup}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helpers ── */
const EmptyState: React.FC<{ icon: string; text: string; sub: string }> = ({ icon, text, sub }) => (
  <div className="text-center py-14 animate-fade-in">
    <div className="text-4xl mb-3">{icon}</div>
    <div className="font-semibold text-gray-500">{text}</div>
    <div className="text-gray-400 text-sm mt-1">{sub}</div>
  </div>
);

const StatMini: React.FC<{ label: string; value: string; color: 'blue' | 'purple' | 'orange' }> = ({ label, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-2 text-center`}>
      <div className="text-[10px] font-medium opacity-70 mb-0.5">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
};
