import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import {
  calculateBalances,
  calculateSettlements,
  formatCurrency,
  CATEGORY_ICONS,
  generatePersonalBill,
} from '../utils';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Copy, Check, Share2, ArrowRight,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';

// WhatsApp SVG icon
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const PersonalBills: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const group = useStore((s) => s.groups.find((g) => g.id === id));

  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [copiedMember, setCopiedMember] = useState<string | null>(null);

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

  const handleCopy = async (memberId: string) => {
    const text = generatePersonalBill(group, memberId);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMember(memberId);
      showToast('Bill copied to clipboard!');
      setTimeout(() => setCopiedMember(null), 2500);
    } catch {
      showToast('Could not copy — try WhatsApp', 'error');
    }
  };

  const handleWhatsApp = (memberId: string) => {
    const text = encodeURIComponent(generatePersonalBill(group, memberId));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async (memberId: string, memberName: string) => {
    const text = generatePersonalBill(group, memberId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group.emoji} ${group.name} — Bill for ${memberName}`,
          text,
        });
      } catch { /* cancelled */ }
    } else {
      handleCopy(memberId);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/groups/${group.id}`)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Personal Bills</h1>
          <p className="text-gray-400 text-sm">{group.emoji} {group.name}</p>
        </div>
      </div>

      {/* Explainer */}
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 flex gap-3">
        <span className="text-2xl shrink-0">📨</span>
        <div>
          <div className="font-semibold text-green-800 text-sm">Send individual bills</div>
          <div className="text-green-700 text-sm mt-0.5 leading-relaxed">
            Each person gets their own personalised bill — what they paid, their share, and exactly what they need to do to settle up.
          </div>
        </div>
      </div>

      {/* Per-member bill cards */}
      <div className="space-y-3">
        {balances.map((b) => {
          const member = memberMap[b.memberId];
          if (!member) return null;

          const isPos = b.netBalance > 0.01;
          const isNeg = b.netBalance < -0.01;
          const isExpanded = expandedMember === b.memberId;
          const isCopied = copiedMember === b.memberId;

          // Their action items
          const mySettlements = settlements.filter(
            (s) => s.from === b.memberId || s.to === b.memberId
          );
          const paidExpenses = group.expenses.filter((e) => e.paidBy === b.memberId);
          const sharedExpenses = group.expenses.filter((e) =>
            e.splitAmong.includes(b.memberId)
          );
          const myAdvances = group.advances.filter((a) => a.paidBy === b.memberId);

          return (
            <div key={b.memberId} className="card overflow-hidden">
              {/* Top section — always visible */}
              <div className="p-4">
                {/* Member info row */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar name={member.name} color={member.color} size="md" />
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{member.name}</div>
                    <div className={`text-sm font-medium mt-0.5 ${isPos ? 'text-green-600' : isNeg ? 'text-red-500' : 'text-gray-400'}`}>
                      {isPos
                        ? `Gets back ${formatCurrency(b.netBalance)}`
                        : isNeg
                        ? `Owes ${formatCurrency(Math.abs(b.netBalance))}`
                        : 'All settled ✓'}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isPos ? 'text-green-600' : isNeg ? 'text-red-500' : 'text-gray-300'}`}>
                    {isPos ? '+' : ''}{formatCurrency(b.netBalance)}
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-blue-400 font-medium mb-0.5">Paid in</div>
                    <div className="text-xs font-bold text-blue-700">{formatCurrency(b.totalPaid)}</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-orange-400 font-medium mb-0.5">Their share</div>
                    <div className="text-xs font-bold text-orange-700">{formatCurrency(b.totalShare)}</div>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center ${isPos ? 'bg-green-50' : isNeg ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className={`text-[10px] font-medium mb-0.5 ${isPos ? 'text-green-400' : isNeg ? 'text-red-400' : 'text-gray-400'}`}>
                      Balance
                    </div>
                    <div className={`text-xs font-bold ${isPos ? 'text-green-700' : isNeg ? 'text-red-700' : 'text-gray-400'}`}>
                      {isPos ? '+' : ''}{formatCurrency(b.netBalance)}
                    </div>
                  </div>
                </div>

                {/* Action items summary */}
                {mySettlements.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {mySettlements.map((s, i) => {
                      const isPayer = s.from === b.memberId;
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
                            isPayer ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {isPayer ? (
                            <XCircle size={14} className="shrink-0" />
                          ) : (
                            <CheckCircle size={14} className="shrink-0" />
                          )}
                          <span className="flex-1 font-medium">
                            {isPayer ? `Pay ${s.toName}` : `Receive from ${s.fromName}`}
                          </span>
                          <ArrowRight size={12} className="opacity-40 shrink-0" />
                          <span className="font-bold">{formatCurrency(s.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {mySettlements.length === 0 && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm rounded-xl px-3 py-2 mb-4">
                    <CheckCircle size={14} />
                    <span className="font-medium">No action needed — fully settled!</span>
                  </div>
                )}

                {/* Share buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWhatsApp(b.memberId)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ background: '#25D366' }}
                  >
                    <WhatsAppIcon /> WhatsApp
                  </button>
                  <button
                    onClick={() => handleNativeShare(b.memberId, member.name)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => handleCopy(b.memberId)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                      isCopied
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Expandable detail bill */}
              <button
                onClick={() => setExpandedMember(isExpanded ? null : b.memberId)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition-colors"
              >
                {isExpanded ? <><ChevronUp size={13} /> Hide bill preview</> : <><ChevronDown size={13} /> Preview bill</>}
              </button>

              {/* Bill preview */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 animate-slide-up">
                  <BillPreview
                    group={group}
                    memberId={b.memberId}
                    memberName={member.name}
                    balance={b}
                    sharedExpenses={sharedExpenses}
                    paidExpenses={paidExpenses}
                    myAdvances={myAdvances}
                    mySettlements={mySettlements}
                    memberMap={memberMap}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
};

/* ─── Bill Preview Component ─────────────────────────── */
const BillPreview: React.FC<{
  group: { emoji: string; name: string };
  memberId: string;
  memberName: string;
  balance: ReturnType<typeof calculateBalances>[0];
  sharedExpenses: ReturnType<typeof useStore.getState>['groups'][0]['expenses'];
  paidExpenses: ReturnType<typeof useStore.getState>['groups'][0]['expenses'];
  myAdvances: ReturnType<typeof useStore.getState>['groups'][0]['advances'];
  mySettlements: ReturnType<typeof calculateSettlements>;
  memberMap: Record<string, { name: string; color: string }>;
}> = ({ group, memberName, balance, sharedExpenses, paidExpenses, myAdvances, mySettlements, memberMap }) => {
  const isPos = balance.netBalance > 0.01;
  const isNeg = balance.netBalance < -0.01;

  return (
    <div className="bg-white rounded-2xl p-4 text-sm font-mono border border-slate-100">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="font-bold text-gray-800">👋 Hi {memberName}!</div>
        <div className="text-gray-500 text-xs mt-1">Your personal bill for</div>
        <div className="font-bold text-gray-800">{group.emoji} {group.name}</div>
        <div className="text-gray-300 text-xs mt-1">{'━'.repeat(22)}</div>
      </div>

      {/* Expense share */}
      {sharedExpenses.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">📋 YOUR EXPENSE SHARE</div>
          <div className="space-y-1">
            {sharedExpenses.map((e) => {
              const share = e.amount / e.splitAmong.length;
              const payer = memberMap[e.paidBy];
              const youPaid = e.paidBy === balance.memberId;
              return (
                <div key={e.id} className="flex items-start justify-between gap-2 text-xs text-gray-600">
                  <span className="flex-1">{CATEGORY_ICONS[e.category]} {e.title}{youPaid ? ' (you paid)' : ` (via ${payer?.name})`}</span>
                  <span className="font-bold shrink-0">{formatCurrency(share)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5 pt-1.5 border-t border-dashed border-gray-200 text-xs font-bold text-gray-700">
            <span>Total share</span><span>{formatCurrency(balance.totalShare)}</span>
          </div>
        </div>
      )}

      {/* Paid for */}
      {paidExpenses.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">💳 YOU PAID FOR</div>
          <div className="space-y-1">
            {paidExpenses.map((e) => (
              <div key={e.id} className="flex justify-between text-xs text-gray-600">
                <span>{CATEGORY_ICONS[e.category]} {e.title}</span>
                <span className="font-bold">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advances */}
      {myAdvances.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-bold text-gray-500 mb-1.5">🤝 ADVANCE GIVEN</div>
          <div className="space-y-1">
            {myAdvances.map((a) => (
              <div key={a.id} className="flex justify-between text-xs text-gray-600">
                <span>💰 {a.note}</span>
                <span className="font-bold">{formatCurrency(a.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="border-t border-dashed border-gray-200 pt-3 mb-3">
        <div className="text-xs font-bold text-gray-500 mb-1.5">📊 YOUR SUMMARY</div>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Total paid</span>
            <span className="font-semibold">{formatCurrency(balance.totalPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Your share</span>
            <span className="font-semibold">{formatCurrency(balance.totalShare)}</span>
          </div>
          <div className={`flex justify-between font-bold text-sm mt-1 pt-1 border-t border-gray-100 ${isPos ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-gray-400'}`}>
            <span>{isPos ? '✅ You get back' : isNeg ? '❌ You owe' : '✅ Settled'}</span>
            <span>{Math.abs(balance.netBalance) > 0.01 ? formatCurrency(Math.abs(balance.netBalance)) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {mySettlements.length > 0 && (
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1.5">💳 WHAT TO DO</div>
          <div className="space-y-1">
            {mySettlements.map((s, i) => {
              const isPayer = s.from === balance.memberId;
              return (
                <div key={i} className={`text-xs font-semibold ${isPayer ? 'text-red-600' : 'text-green-600'}`}>
                  {isPayer ? `👉 Pay ${s.toName}: ${formatCurrency(s.amount)}` : `✅ Receive from ${s.fromName}: ${formatCurrency(s.amount)}`}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-center text-gray-300 text-[10px] mt-3 pt-2 border-t border-gray-100">
        Generated by SplitKaro 💸 · {format(new Date(), 'dd MMM yyyy')}
      </div>
    </div>
  );
};
