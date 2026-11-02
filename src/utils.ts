import type { Group, Balance, Settlement } from './types';
import { format as dateFnsFormat } from 'date-fns';

/**
 * Calculate per-member balances for a group.
 * Balance = (amount they paid for expenses + advances) - their share of expenses
 * Positive balance → they are owed money
 * Negative balance → they owe money
 */
export function calculateBalances(group: Group): Balance[] {
  const { members, expenses, advances } = group;

  const balanceMap: Record<string, Balance> = {};
  for (const m of members) {
    balanceMap[m.id] = {
      memberId: m.id,
      memberName: m.name,
      totalPaid: 0,
      totalShare: 0,
      advancePaid: 0,
      netBalance: 0,
    };
  }

  // Add expense payments
  for (const exp of expenses) {
    if (!balanceMap[exp.paidBy]) continue;
    balanceMap[exp.paidBy].totalPaid += exp.amount;

    // Calculate share per person
    const validSplitMembers = exp.splitAmong.filter((id) => balanceMap[id]);
    if (validSplitMembers.length === 0) continue;
    const share = exp.amount / validSplitMembers.length;
    for (const memberId of validSplitMembers) {
      balanceMap[memberId].totalShare += share;
    }
  }

  // Add advances
  for (const adv of advances) {
    if (!balanceMap[adv.paidBy]) continue;
    balanceMap[adv.paidBy].advancePaid += adv.amount;
    balanceMap[adv.paidBy].totalPaid += adv.amount;
  }

  // Compute net balance: positive = owed, negative = owes
  for (const b of Object.values(balanceMap)) {
    b.netBalance = b.totalPaid - b.totalShare;
  }

  return Object.values(balanceMap);
}

/**
 * Compute minimum transactions to settle all debts (greedy algorithm).
 */
export function calculateSettlements(balances: Balance[]): Settlement[] {
  // Deep copy net balances
  const nets = balances.map((b) => ({ ...b, net: b.netBalance }));

  const settlements: Settlement[] = [];

  // Separate creditors (positive) and debtors (negative)
  const creditors = nets.filter((b) => b.net > 0.005).sort((a, b) => b.net - a.net);
  const debtors = nets.filter((b) => b.net < -0.005).sort((a, b) => a.net - b.net);

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const amount = Math.min(creditor.net, -debtor.net);
    if (amount > 0.005) {
      settlements.push({
        from: debtor.memberId,
        fromName: debtor.memberName,
        to: creditor.memberId,
        toName: creditor.memberName,
        amount: Math.round(amount * 100) / 100,
        key: `${debtor.memberId}->${creditor.memberId}`,
      });
    }

    creditor.net -= amount;
    debtor.net += amount;

    if (Math.abs(creditor.net) < 0.005) ci++;
    if (Math.abs(debtor.net) < 0.005) di++;
  }

  return settlements;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const CATEGORY_ICONS: Record<string, string> = {
  food: '🍔',
  transport: '🚗',
  accommodation: '🏨',
  activities: '🎯',
  shopping: '🛍️',
  utilities: '💡',
  other: '📦',
};

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & Drinks',
  transport: 'Transport',
  accommodation: 'Accommodation',
  activities: 'Activities',
  shopping: 'Shopping',
  utilities: 'Utilities',
  other: 'Other',
};

/**
 * Generate a personal bill text for a single member — suitable for WhatsApp.
 */
export function generatePersonalBill(group: Group, memberId: string): string {
  const member = group.members.find((m) => m.id === memberId);
  if (!member) return '';

  const allBalances = calculateBalances(group);
  const allSettlements = calculateSettlements(allBalances);
  const b = allBalances.find((x) => x.memberId === memberId);
  if (!b) return '';

  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const isPos = b.netBalance > 0.01;
  const isNeg = b.netBalance < -0.01;

  // Expenses this member paid for
  const paidExpenses = group.expenses.filter((e) => e.paidBy === memberId);
  // Expenses this member is split into
  const sharedExpenses = group.expenses.filter((e) => e.splitAmong.includes(memberId));
  // Advances this member gave
  const myAdvances = group.advances.filter((a) => a.paidBy === memberId);
  // Settlements involving this member
  const mySettlements = allSettlements.filter((s) => s.from === memberId || s.to === memberId);

  const div = '━━━━━━━━━━━━━━━━━━━━━━';
  const thin = '─────────────────────';
  const lines: string[] = [];

  lines.push(`👋 Hi *${member.name}*!`);
  lines.push('');
  lines.push(`Here's your personal bill for`);
  lines.push(`${group.emoji} *${group.name}*`);
  lines.push(div);
  lines.push('');

  // Their share breakdown
  if (sharedExpenses.length > 0) {
    lines.push(`📋 *YOUR EXPENSE SHARE*`);
    lines.push(thin);
    for (const e of sharedExpenses) {
      const share = e.amount / e.splitAmong.length;
      const payer = memberMap[e.paidBy];
      const youPaid = e.paidBy === memberId;
      lines.push(
        `${CATEGORY_ICONS[e.category]} ${e.title}` +
        ` — *${formatCurrency(share)}*` +
        (youPaid ? ' _(you paid)_' : ` _(paid by ${payer?.name ?? '?'})_`)
      );
    }
    lines.push(`📊 *Total share: ${formatCurrency(b.totalShare)}*`);
    lines.push('');
  }

  // What they actually paid
  if (paidExpenses.length > 0) {
    lines.push(`💳 *YOU PAID FOR*`);
    lines.push(thin);
    for (const e of paidExpenses) {
      lines.push(`${CATEGORY_ICONS[e.category]} ${e.title} — *${formatCurrency(e.amount)}*`);
    }
    lines.push(`💰 *Total paid: ${formatCurrency(paidExpenses.reduce((s, e) => s + e.amount, 0))}*`);
    lines.push('');
  }

  // Advances
  if (myAdvances.length > 0) {
    lines.push(`🤝 *YOUR ADVANCE PAYMENTS*`);
    lines.push(thin);
    for (const a of myAdvances) {
      lines.push(`💰 ${a.note} — *${formatCurrency(a.amount)}*`);
    }
    lines.push('');
  }

  // Net summary
  lines.push(`📊 *YOUR SUMMARY*`);
  lines.push(thin);
  lines.push(`Total paid (expenses + advance): *${formatCurrency(b.totalPaid)}*`);
  lines.push(`Your share of all expenses: *${formatCurrency(b.totalShare)}*`);
  lines.push(
    isPos
      ? `✅ *Net: You get back ${formatCurrency(b.netBalance)}*`
      : isNeg
      ? `❌ *Net: You owe ${formatCurrency(Math.abs(b.netBalance))}*`
      : `✅ *Net: You are fully settled!*`
  );
  lines.push('');

  // Action items
  if (mySettlements.length > 0) {
    lines.push(`💳 *WHAT YOU NEED TO DO*`);
    lines.push(thin);
    for (const s of mySettlements) {
      if (s.from === memberId) {
        lines.push(`👉 Pay *${s.toName}*: *${formatCurrency(s.amount)}*`);
      } else {
        lines.push(`✅ Receive from *${s.fromName}*: *${formatCurrency(s.amount)}*`);
      }
    }
    lines.push('');
  } else {
    lines.push(`🎉 *No action needed — you're all settled!*`);
    lines.push('');
  }

  lines.push(div);
  lines.push(`_Generated by SplitKaro 💸_`);
  lines.push(`_${dateFnsFormat(new Date(), 'dd MMM yyyy, hh:mm a')}_`);

  return lines.join('\n');
}

/**
 * Generate a plain-text receipt suitable for WhatsApp / SMS messaging.
 */
export function generateTextReceipt(group: Group): string {
  const balances = calculateBalances(group);
  const settlements = calculateSettlements(balances);
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  const totalAdvances = group.advances.reduce((s, a) => s + a.amount, 0);
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const isSettled = settlements.length === 0;
  const now = dateFnsFormat(new Date(), 'dd MMM yyyy, hh:mm a');

  const lines: string[] = [];

  const div = '━━━━━━━━━━━━━━━━━━━━━━';
  const thin = '─────────────────────';

  lines.push(`💸 *SplitKaro Receipt*`);
  lines.push(div);
  lines.push(`${group.emoji} *${group.name}*`);
  if (group.description) lines.push(`📝 ${group.description}`);
  lines.push(`👥 Members: ${group.members.map((m) => m.name).join(', ')}`);
  lines.push(`🗓️ Generated: ${now}`);
  lines.push('');

  lines.push(`📊 *SUMMARY*`);
  lines.push(thin);
  lines.push(`💰 Total Expenses: *${formatCurrency(totalExpenses)}*`);
  if (totalAdvances > 0) lines.push(`🤝 Advance Pool: *${formatCurrency(totalAdvances)}*`);
  lines.push(`📌 Status: ${isSettled ? '✅ All Settled!' : `⏳ ${settlements.length} payment(s) pending`}`);
  lines.push('');

  // Per-member breakdown
  lines.push(`👤 *INDIVIDUAL BREAKDOWN*`);
  lines.push(thin);
  for (const b of balances) {
    const isPos = b.netBalance > 0.01;
    const isNeg = b.netBalance < -0.01;
    lines.push(`*${b.memberName}*`);
    lines.push(`  💳 Paid for expenses: ${formatCurrency(b.totalPaid - b.advancePaid)}`);
    if (b.advancePaid > 0) lines.push(`  🤝 Advance given: ${formatCurrency(b.advancePaid)}`);
    lines.push(`  📤 Their share: ${formatCurrency(b.totalShare)}`);
    lines.push(
      isPos
        ? `  ✅ Gets back: *${formatCurrency(b.netBalance)}*`
        : isNeg
        ? `  ❌ Should pay: *${formatCurrency(Math.abs(b.netBalance))}*`
        : `  ✅ All squared up`
    );
    lines.push('');
  }

  // Expense log
  if (group.expenses.length > 0) {
    lines.push(`🧾 *EXPENSE LOG*`);
    lines.push(thin);
    for (const exp of [...group.expenses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )) {
      const payer = memberMap[exp.paidBy];
      lines.push(
        `${CATEGORY_ICONS[exp.category]} ${exp.title} — *${formatCurrency(exp.amount)}* (paid by ${payer?.name ?? '?'})`
      );
    }
    lines.push(`   *Total: ${formatCurrency(totalExpenses)}*`);
    lines.push('');
  }

  // Advance log
  if (group.advances.length > 0) {
    lines.push(`💰 *ADVANCE PAYMENTS*`);
    lines.push(thin);
    for (const adv of group.advances) {
      const payer = memberMap[adv.paidBy];
      lines.push(`🤝 ${adv.note} — *${formatCurrency(adv.amount)}* (by ${payer?.name ?? '?'})`);
    }
    lines.push('');
  }

  // Settlements
  lines.push(`💳 *SETTLEMENT INSTRUCTIONS*`);
  lines.push(thin);
  if (isSettled) {
    lines.push(`🎉 Everyone is settled! No payments needed.`);
  } else {
    for (const s of settlements) {
      lines.push(`👉 *${s.fromName}* pays *${s.toName}* → *${formatCurrency(s.amount)}*`);
    }
  }
  lines.push('');
  lines.push(div);
  lines.push(`_Powered by SplitKaro 💸_`);

  return lines.join('\n');
}
