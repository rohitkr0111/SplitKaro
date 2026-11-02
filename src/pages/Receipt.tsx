import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store';
import { calculateBalances, calculateSettlements, formatCurrency, CATEGORY_ICONS, generateTextReceipt } from '../utils';
import { Avatar } from '../components/Avatar';
import { ArrowLeft, Printer, ArrowRight, CheckCircle, XCircle, Copy, Share2, Check, FileDown } from 'lucide-react';
import { format } from 'date-fns';

export const Receipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const group = useStore((s) => s.groups.find((g) => g.id === id));
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState('');
  const [pdfTools, setPdfTools] = useState<typeof import('../receiptPdf') | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfStatus, setPdfStatus] = useState<'preparing' | 'ready' | 'failed'>('preparing');

  useEffect(() => {
    let active = true;
    import('../receiptPdf')
      .then((module) => { if (active) setPdfTools(module); })
      .catch((error: unknown) => {
        console.error('Receipt PDF module failed to load:', error);
        if (active) {
          setPdfStatus('failed');
          setShareError('PDF export could not be loaded. Use Print and choose Save as PDF.');
        }
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!group || !pdfTools) return;
    setPdfFile(null);
    setPdfStatus('preparing');
    try {
      const pdf = pdfTools.createReceiptPdf(group);
      const blob = pdf.output('blob');
      setPdfFile(new File([blob], pdfTools.receiptPdfFilename(group), { type: 'application/pdf' }));
      setPdfStatus('ready');
      setShareError('');
    } catch (error) {
      console.error('Receipt PDF generation failed:', error);
      setPdfStatus('failed');
      setShareError('Could not prepare the PDF. Use Print and choose Save as PDF.');
    }
  }, [group, pdfTools]);

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
  const settledPairs = group.settledPairs ?? [];
  const completedSettlements = settlements.filter((settlement) => settledPairs.includes(settlement.key));
  const pendingSettlements = settlements.filter((settlement) => !settledPairs.includes(settlement.key));
  const memberMap = Object.fromEntries(group.members.map((m) => [m.id, m]));
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  const totalPerPersonShare = group.expenses.reduce(
    (sum, expense) => sum + (expense.splitAmong.length ? expense.amount / expense.splitAmong.length : 0),
    0,
  );
  const totalAdvances = group.advances.reduce((s, a) => s + a.amount, 0);
  const isSettled = pendingSettlements.length === 0;
  const generatedAt = format(new Date(), "dd MMM yyyy, hh:mm a");

  const handlePrint = () => window.print();

  const handleSavePdf = () => {
    try {
      if (!pdfFile) {
        setShareError('The PDF is still preparing. Please try again in a moment.');
        return;
      }
      const url = URL.createObjectURL(pdfFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setShareError('');
    } catch {
      setShareError('Could not create the PDF. Please try Print and choose Save as PDF.');
    }
  };

  const getTextReceipt = () => generateTextReceipt(group);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getTextReceipt());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareError('Could not copy. Please copy manually.');
      setTimeout(() => setShareError(''), 3000);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getTextReceipt());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      if (pdfFile && navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          title: `${group.emoji} ${group.name} — SplitKaro Receipt`,
          files: [pdfFile],
        });
      } else {
        await navigator.share({
          title: `${group.emoji} ${group.name} — SplitKaro Receipt`,
          text: getTextReceipt(),
        });
      }
    } catch {
      // user cancelled or error — ignore
    }
  };

  return (
    <div className="receipt-page max-w-3xl mx-auto px-4 py-6">
      {/* Top nav (hidden on print) */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate(`/groups/${group.id}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={18} /> Back to Group
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-2 rounded-xl font-medium transition-colors text-sm"
        >
          <Printer size={15} /> Print
        </button>
      </div>

      {/* Share / Send Bar */}
      <div className="receipt-tools bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 print:hidden">
        <div className="receipt-tools-copy">
          <span className="receipt-tools-title">Receipt actions</span>
          <span className="receipt-tools-subtitle">Download the PDF, share a copy, or print.</span>
        </div>
        <div className="receipt-actions flex flex-wrap gap-2">
          <button
            onClick={handleSavePdf}
            disabled={pdfStatus !== 'ready'}
            title={pdfStatus === 'ready' ? 'Save receipt as PDF' : pdfStatus === 'failed' ? 'PDF export unavailable' : 'Preparing PDF…'}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <FileDown size={15} /> {pdfStatus === 'ready' ? 'Save PDF' : pdfStatus === 'failed' ? 'PDF unavailable' : 'Preparing PDF…'}
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Printer size={15} /> Print
          </button>
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </button>

          {/* Native Share (works on mobile / supported browsers) */}
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <Share2 size={15} /> Share
          </button>

          {/* Copy text */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm border ${
              copied
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100'
            }`}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
        </div>

        {shareError && (
          <div className="mt-2 text-red-500 text-xs">{shareError}</div>
        )}

      </div>

      {/* Receipt Card */}
      <div className="receipt-card bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Receipt Header */}
        <div className="receipt-header bg-gradient-to-br from-green-600 to-green-800 p-8 text-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{group.emoji}</div>
              <div>
                <div className="receipt-kicker">Group expense statement</div>
                <h1 className="text-3xl font-bold">{group.name}</h1>
                {group.description && <p className="text-green-200 mt-1">{group.description}</p>}
              </div>
            </div>
            <div className="receipt-reference"><span>RECEIPT ID</span><strong>#{group.id.slice(-8).toUpperCase()}</strong></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <StatPill label="Participants" value={String(group.members.length)} />
            <StatPill label="Expenses" value={formatCurrency(totalExpenses)} />
            <StatPill label="Advances" value={formatCurrency(totalAdvances)} />
            <StatPill label="Settlement" value={isSettled ? 'Settled' : `${pendingSettlements.length} due`} highlight={!isSettled} />
          </div>
          <div className="receipt-meta mt-4 text-green-200 text-xs"><span>Issued {generatedAt}</span><span>Group started {format(new Date(group.createdAt), 'dd MMM yyyy')}</span><span>Original SplitKaro record</span></div>
        </div>

        {/* Per-Member Receipts */}
        <div className="receipt-section receipt-members p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Member balances
          </h2>

          {balances.map((b) => {
            const member = memberMap[b.memberId];
            const settledPaid = completedSettlements
              .filter((settlement) => settlement.from === b.memberId)
              .reduce((sum, settlement) => sum + settlement.amount, 0);
            const settledReceived = completedSettlements
              .filter((settlement) => settlement.to === b.memberId)
              .reduce((sum, settlement) => sum + settlement.amount, 0);
            const outstandingBalance = b.netBalance + settledPaid - settledReceived;
            const isPositive = outstandingBalance > 0.01;
            const isNegative = outstandingBalance < -0.01;

            // Expenses paid by this member
            const paidExpenses = group.expenses.filter((e) => e.paidBy === b.memberId);
            // Advances paid by this member
            const paidAdvances = group.advances.filter((a) => a.paidBy === b.memberId);
            // Expenses this member is part of
            const sharedExpenses = group.expenses.filter((e) => e.splitAmong.includes(b.memberId));
            // Settlements involving this member
            const memberSettlements = pendingSettlements.filter((s) => s.from === b.memberId || s.to === b.memberId);

            return (
              <div key={b.memberId} className="receipt-member border border-gray-100 rounded-2xl overflow-hidden">
                {/* Member header */}
                <div className={`receipt-member-head flex items-center gap-4 p-4 ${isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <Avatar name={b.memberName} color={member?.color || '#999'} size="lg" />
                  <div className="flex-1">
                    <div className="text-xl font-bold text-gray-900">{b.memberName}</div>
                    <div className={`text-sm font-semibold mt-0.5 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                      {isPositive
                        ? `Receives ${formatCurrency(outstandingBalance)}`
                        : isNegative
                        ? `Owes ${formatCurrency(Math.abs(outstandingBalance))}`
                        : 'Balance settled'}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(outstandingBalance)}
                  </div>
                </div>

                {/* Summary grid */}
                <div className="receipt-member-metrics p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Paid for expenses</div>
                    <div className="font-bold text-blue-700">{formatCurrency(b.totalPaid - b.advancePaid)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Advance given</div>
                    <div className="font-bold text-purple-700">{formatCurrency(b.advancePaid)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Total paid in</div>
                    <div className="font-bold text-gray-800">{formatCurrency(b.totalPaid)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Their share</div>
                    <div className="font-bold text-orange-600">{formatCurrency(b.totalShare)}</div>
                  </div>
                </div>

                {/* Expenses paid */}
                {paidExpenses.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Expenses Paid</div>
                    <div className="space-y-1.5">
                      {paidExpenses.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 text-sm">
                          <span>{CATEGORY_ICONS[e.category]}</span>
                          <span className="flex-1 text-gray-700 truncate">{e.title}</span>
                          <span className="text-xs text-gray-400">{format(new Date(e.date), 'dd MMM')}</span>
                          <span className="font-semibold text-blue-700">{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advances paid */}
                {paidAdvances.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Advance Payments</div>
                    <div className="space-y-1.5">
                      {paidAdvances.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 text-sm">
                          <span>💰</span>
                          <span className="flex-1 text-gray-700 truncate">{a.note}</span>
                          <span className="text-xs text-gray-400">{format(new Date(a.date), 'dd MMM')}</span>
                          <span className="font-semibold text-purple-700">{formatCurrency(a.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share breakdown */}
                {sharedExpenses.length > 0 && (
                  <div className="p-4 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Their Share Of Expenses</div>
                    <div className="space-y-1.5">
                      {sharedExpenses.map((e) => {
                        const share = e.amount / e.splitAmong.length;
                        const payer = memberMap[e.paidBy];
                        return (
                          <div key={e.id} className="flex items-center gap-2 text-sm">
                            <span>{CATEGORY_ICONS[e.category]}</span>
                            <span className="flex-1 text-gray-700 truncate">{e.title}</span>
                            {payer && (
                              <span className="text-xs text-gray-400">via {payer.name}</span>
                            )}
                            <span className="font-semibold text-orange-600">{formatCurrency(share)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action required */}
                {memberSettlements.length > 0 && (
                  <div className="p-4 bg-yellow-50">
                    <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">Action Required</div>
                    <div className="space-y-2">
                      {memberSettlements.map((s, i) => {
                        const isPayer = s.from === b.memberId;
                        return (
                          <div key={i} className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${isPayer ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {isPayer ? (
                              <>
                                <XCircle size={14} className="shrink-0" />
                                <span>Pay <strong>{s.toName}</strong></span>
                                <ArrowRight size={12} className="ml-auto shrink-0" />
                                <span className="font-bold">{formatCurrency(s.amount)}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={14} className="shrink-0" />
                                <span>Receive from <strong>{s.fromName}</strong></span>
                                <ArrowRight size={12} className="ml-auto shrink-0" />
                                <span className="font-bold">{formatCurrency(s.amount)}</span>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Settled */}
                {memberSettlements.length === 0 && !isNegative && !isPositive && (
                  <div className="p-4 bg-green-50">
                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                      <CheckCircle size={16} /> No action needed — all settled!
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Expense Log */}
        <div className="receipt-section px-6 pb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Expense ledger</h2>
          {group.expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No expenses recorded</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-semibold">Expense</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-semibold">Paid by</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-semibold">Amount</th>
                    <th className="text-right px-4 py-3 text-gray-500 font-semibold">Per Person</th>
                  </tr>
                </thead>
                <tbody>
                  {[...group.expenses]
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((exp, i) => {
                      const payer = memberMap[exp.paidBy];
                      return (
                        <tr key={exp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{CATEGORY_ICONS[exp.category]}</span>
                              <span className="font-medium text-gray-800">{exp.title}</span>
                            </div>
                            {exp.note && <div className="text-xs text-gray-400 mt-0.5 ml-6">{exp.note}</div>}
                          </td>
                          <td className="px-4 py-3 text-gray-500">{format(new Date(exp.date), 'dd MMM yyyy')}</td>
                          <td className="px-4 py-3">
                            {payer && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: payer.color }}>
                                  {payer.name[0]}
                                </div>
                                <span className="text-gray-700">{payer.name}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(exp.amount)}</td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {exp.splitAmong.length > 0 ? formatCurrency(exp.amount / exp.splitAmong.length) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  <tr className="bg-green-50 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total</td>
                    <td className="px-4 py-3 text-right text-green-700">{formatCurrency(totalExpenses)}</td>
                    <td className="px-4 py-3 text-right text-green-700">
                      {formatCurrency(totalPerPersonShare)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Advance log */}
        {group.advances.length > 0 && (
          <div className="receipt-section px-6 pb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Advance ledger</h2>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-amber-700 font-semibold">Note</th>
                    <th className="text-left px-4 py-3 text-amber-700 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 text-amber-700 font-semibold">Paid by</th>
                    <th className="text-right px-4 py-3 text-amber-700 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {group.advances.map((adv, i) => {
                    const payer = memberMap[adv.paidBy];
                    return (
                      <tr key={adv.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-4 py-3 font-medium text-gray-800">{adv.note}</td>
                        <td className="px-4 py-3 text-gray-500">{format(new Date(adv.date), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          {payer && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: payer.color }}>
                                {payer.name[0]}
                              </div>
                              <span className="text-gray-700">{payer.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-amber-700">{formatCurrency(adv.amount)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-amber-50 font-bold">
                    <td colSpan={3} className="px-4 py-3 text-gray-700">Total Advances</td>
                    <td className="px-4 py-3 text-right text-amber-700">{formatCurrency(totalAdvances)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settlement summary */}
        <div className="receipt-section receipt-settlements px-6 pb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {isSettled ? 'Settlement summary' : 'Settlement instructions'}
          </h2>
          {isSettled ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="font-bold text-green-700 text-lg">All expenses are settled!</div>
              <div className="text-green-600 text-sm mt-1">
                {completedSettlements.length > 0
                  ? `${completedSettlements.length} payment${completedSettlements.length === 1 ? '' : 's'} marked as paid. Everyone is up to date.`
                  : "Everyone's accounts are balanced."}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingSettlements.map((s, i) => {
                const from = memberMap[s.from];
                const to = memberMap[s.to];
                return (
                  <div key={i} className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar name={from?.name || s.fromName} color={from?.color || '#999'} size="sm" />
                      <span className="font-semibold text-gray-800 truncate">{s.fromName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 shrink-0">
                      <ArrowRight size={16} />
                      <span className="font-bold">{formatCurrency(s.amount)}</span>
                      <ArrowRight size={16} />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="font-semibold text-gray-800 truncate text-right">{s.toName}</span>
                      <Avatar name={to?.name || s.toName} color={to?.color || '#999'} size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="receipt-footer border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between print:flex">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <span>💸</span>
            <span className="font-semibold text-green-600">SplitKaro</span>
            <span>· Split expenses with friends</span>
          </div>
          <div className="text-gray-400 text-xs">{generatedAt}</div>
        </div>
      </div>

    </div>
  );
};

const StatPill: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`receipt-stat rounded-xl px-3 py-2 text-center ${highlight ? 'is-pending' : ''}`}>
    <div className="text-green-100 text-xs">{label}</div>
    <div className="text-white font-bold text-sm">{value}</div>
  </div>
);
