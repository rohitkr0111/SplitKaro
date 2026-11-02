import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Group } from './types';
import { calculateBalances, calculateSettlements, formatCurrency } from './utils';

const ink = [28, 43, 35] as const;
const muted = [104, 119, 109] as const;
const line = [225, 232, 227] as const;
const green = [23, 61, 48] as const;
const pageWidth = 210;
const margin = 16;
const contentWidth = pageWidth - margin * 2;

const pdfText = (value: string) => value
  .replace(/₹/g, 'INR ')
  .replace(/[→➜]/g, ' to ')
  .replace(/[•·]/g, '-')
  .replace(/[^\x20-\xFF]/g, '');

const money = (value: number) => pdfText(formatCurrency(value));

export function createReceiptPdf(group: Group): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const balances = calculateBalances(group);
  const settlements = calculateSettlements(balances);
  const settledPairs = group.settledPairs ?? [];
  const completed = settlements.filter((item) => settledPairs.includes(item.key));
  const pending = settlements.filter((item) => !settledPairs.includes(item.key));
  const totalExpenses = group.expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalAdvances = group.advances.reduce((sum, item) => sum + item.amount, 0);
  const memberMap = new Map(group.members.map((member) => [member.id, member.name]));
  let y = 0;

  const footer = () => {
    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setDrawColor(...line);
      doc.line(margin, 283, pageWidth - margin, 283);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      doc.text('SplitKaro  |  Group expense statement', margin, 289);
      doc.text(`${page} / ${pageCount}`, pageWidth - margin, 289, { align: 'right' });
    }
  };

  const newPage = () => {
    doc.addPage();
    y = 20;
  };

  const ensureSpace = (height: number) => {
    if (y + height > 275) newPage();
  };

  const sectionTitle = (title: string) => {
    ensureSpace(13);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text(pdfText(title), margin, y);
    y += 4;
    doc.setDrawColor(...line);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const table = (headers: string[], rows: string[][], widths: number[]) => {
    const rowPadding = 3;
    const headerHeight = 9;
    const drawHeader = () => {
      doc.setFillColor(242, 246, 243);
      doc.roundedRect(margin, y - 5, contentWidth, headerHeight, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...muted);
      let x = margin + 3;
      headers.forEach((header, index) => {
        const right = index === headers.length - 1;
        doc.text(pdfText(header), right ? x + widths[index] - 6 : x, y, { align: right ? 'right' : 'left' });
        x += widths[index];
      });
      y += 7;
    };
    ensureSpace(14);
    drawHeader();

    rows.forEach((row) => {
      const wrapped = row.map((cell, index) => doc.splitTextToSize(pdfText(cell), Math.max(12, widths[index] - 7)) as string[]);
      const lines = Math.max(...wrapped.map((cell) => cell.length), 1);
      const height = Math.max(7, lines * 3.8 + rowPadding);
      if (y + height > 275) {
        newPage();
        drawHeader();
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...ink);
      let x = margin + 3;
      wrapped.forEach((cell, index) => {
        const right = index === wrapped.length - 1;
        doc.text(cell, right ? x + widths[index] - 6 : x, y, { align: right ? 'right' : 'left' });
        x += widths[index];
      });
      y += height;
      doc.setDrawColor(...line);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
    });
    y += 3;
  };

  // Cover summary
  doc.setFillColor(...green);
  doc.roundedRect(margin, 14, contentWidth, 57, 3, 3, 'F');
  doc.setTextColor(195, 215, 202);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SPLITKARO  /  GROUP EXPENSE STATEMENT', margin + 8, 23);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(pdfText(group.name), 112) as string[];
  doc.text(titleLines.slice(0, 2), margin + 8, 34);
  doc.setTextColor(220, 233, 224);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (group.description) {
    const descriptionY = titleLines.length > 1 ? 49 : 43;
    doc.text(doc.splitTextToSize(pdfText(group.description), 112).slice(0, 2), margin + 8, descriptionY);
  }
  doc.setFontSize(8);
  doc.text(`RECEIPT ID  #${group.id.slice(-8).toUpperCase()}`, pageWidth - margin - 8, 25, { align: 'right' });
  doc.text(`ISSUED  ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - margin - 8, 33, { align: 'right' });
  doc.text(`GROUP STARTED  ${format(new Date(group.createdAt), 'dd MMM yyyy')}`, pageWidth - margin - 8, 41, { align: 'right' });

  const cardsY = 76;
  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const status = pending.length === 0 ? 'Settled' : `${pending.length} due`;
  const cardValues = [
    ['PARTICIPANTS', String(group.members.length)],
    ['EXPENSES', money(totalExpenses)],
    ['ADVANCES', money(totalAdvances)],
    ['STATUS', status],
  ];
  cardValues.forEach(([label, value], index) => {
    const x = margin + index * (cardWidth + cardGap);
    doc.setDrawColor(...line);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, cardsY, cardWidth, 20, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...muted);
    doc.text(label, x + 3, cardsY + 7);
    doc.setFontSize(10);
    doc.setTextColor(...ink);
    doc.text(doc.splitTextToSize(pdfText(value), cardWidth - 6), x + 3, cardsY + 14);
  });
  y = 106;

  sectionTitle('Member balances');
  table(['Member', 'Paid', 'Share', 'Balance'], balances.map((balance) => {
    const paid = completed.filter((item) => item.from === balance.memberId).reduce((sum, item) => sum + item.amount, 0);
    const received = completed.filter((item) => item.to === balance.memberId).reduce((sum, item) => sum + item.amount, 0);
    const outstanding = balance.netBalance + paid - received;
    const direction = outstanding > 0.01 ? 'Receives' : outstanding < -0.01 ? 'Owes' : 'Settled';
    return [balance.memberName, money(balance.totalPaid), money(balance.totalShare), `${direction} ${money(Math.abs(outstanding))}`];
  }), [54, 37, 37, 50]);

  sectionTitle('Expense ledger');
  if (group.expenses.length) {
    const rows = [...group.expenses]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((expense) => [
        expense.title,
        format(new Date(expense.date), 'dd MMM yyyy'),
        memberMap.get(expense.paidBy) ?? 'Unknown',
        money(expense.amount),
      ]);
    rows.push(['Total expenses', '', '', money(totalExpenses)]);
    table(['Expense', 'Date', 'Paid by', 'Amount'], rows, [77, 34, 37, 30]);
  } else {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.text('No expenses recorded.', margin, y); y += 8;
  }

  if (group.advances.length) {
    sectionTitle('Advance ledger');
    const rows = group.advances.map((advance) => [
      advance.note,
      format(new Date(advance.date), 'dd MMM yyyy'),
      memberMap.get(advance.paidBy) ?? 'Unknown',
      money(advance.amount),
    ]);
    rows.push(['Total advances', '', '', money(totalAdvances)]);
    table(['Note', 'Date', 'Paid by', 'Amount'], rows, [77, 34, 37, 30]);
  }

  sectionTitle('Settlement instructions');
  if (pending.length) {
    const rows = pending.map((item) => [item.fromName, 'pays', item.toName, money(item.amount)]);
    table(['From', '', 'To', 'Amount'], rows, [55, 27, 66, 30]);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    const message = completed.length
      ? `${completed.length} payment${completed.length === 1 ? '' : 's'} marked paid. Everyone is up to date.`
      : 'Everyone is settled. No payments are due.';
    doc.text(doc.splitTextToSize(pdfText(message), contentWidth), margin, y);
    y += 8;
  }

  if (completed.length && pending.length) {
    ensureSpace(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...muted);
    doc.text(`${completed.length} payment${completed.length === 1 ? '' : 's'} already marked paid.`, margin, y + 2);
  }

  footer();
  return doc;
}

export function receiptPdfFilename(group: Group): string {
  const slug = group.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';
  return `splitkaro-${slug}-receipt.pdf`;
}
