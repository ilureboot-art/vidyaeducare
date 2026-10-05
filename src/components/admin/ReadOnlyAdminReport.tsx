'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Papa from 'papaparse';
export function ReadOnlyAdminReport({ kind }: { kind: 'audit' | 'reward-eligibility' | 'referral-rewards' }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [referralStatus, setReferralStatus] = useState('CREDITED');
  const [month, setMonth] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async (append = false) => {
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams();
      if (kind === 'referral-rewards') params.set('status', referralStatus);
      if (append && cursor) params.set('cursor', cursor);
      if (month && kind === 'reward-eligibility') params.set('month', month);
      const response = await fetch(`/api/admin/${kind}?${params}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRows(previous => append ? [...previous, ...result.rows] : result.rows); setCursor(result.nextCursor);
    } catch (e) { setError(e instanceof Error ? e.message : 'Report unavailable.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (user) void load(); }, [user]); // Explicit refresh applies month filtering.
  const exportCsv = () => {
    const safe = rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value])));
    const url = URL.createObjectURL(new Blob(['\uFEFF' + Papa.unparse(safe, { escapeFormulae: true })], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${kind}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const columns = kind === 'referral-rewards' ? ['createdAt', 'buyerUid', 'referrerUid', 'purchaseTransactionId', 'amountEach', 'status'] : kind === 'audit' ? ['createdAt', 'action', 'actorEmail', 'entityId', 'previousStatus', 'newStatus', 'reason', 'walletBefore', 'walletAfter'] : ['studentId', 'testId', 'date', 'accessType', 'rankingEligible', 'perTestCashPrizeEligible', 'monthlyCashPrizeEligible', 'reason', 'mismatch'];
  return <div className="space-y-4"><h1 className="text-2xl font-bold">{kind === 'referral-rewards' ? 'Subscription Referral Rewards' : kind === 'audit' ? 'Admin Audit Trail' : 'Paid-only Reward Eligibility'}</h1>
    <p className="text-sm text-muted-foreground">{kind === 'referral-rewards' ? '₹5 each after the first paid Mock Test subscription, once per referred user. These are referral rewards, separate from IBA commission and test cash prizes.' : kind === 'audit' ? 'Server decisions include actor, time, reason and wallet change. Records cannot be edited here.' : 'Paid live attempt snapshots qualify in all months, including June. Completed practice and free promotion attempts do not qualify. Historical live attempts retain their eligibility. This report does not distribute prizes.'}</p>
    <div className="flex gap-2">{kind === 'referral-rewards' && <select aria-label="Referral reward status" value={referralStatus} onChange={e => { setReferralStatus(e.target.value); setRows([]); setCursor(null); }}><option value="CREDITED">Credited</option><option value="PENDING_SUBSCRIPTION">Pending subscription</option></select>}{kind === 'reward-eligibility' && <Input type="month" aria-label="Attempt month" value={month} onChange={event => setMonth(event.target.value)} />}
    <Button disabled={busy} onClick={() => load()}>Refresh</Button><Button variant="outline" disabled={!rows.length || busy} onClick={exportCsv}>Export loaded rows</Button></div>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <p>{rows.length} loaded records{kind === 'reward-eligibility' && ` · ${rows.filter(row => row.rankingEligible).length} eligible · ${rows.filter(row => row.mismatch).length} exceptions`}. {cursor ? 'More records remain; load further pages before using totals.' : 'All matching records loaded.'}</p>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{columns.map(key => <th className="p-2 text-left" key={key}>{key}</th>)}</tr></thead><tbody>{rows.map(row => <tr className="border-t" key={row.id}>{columns.map(key => <td className="p-2" key={key}>{String(row[key] ?? '')}</td>)}</tr>)}</tbody></table></div>
    {cursor && <Button disabled={busy} onClick={() => load(true)}>Load next page</Button>}</div>;
}
