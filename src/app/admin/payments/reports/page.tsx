'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
type Report = { rows: Record<string, unknown>[]; nextCursor: string | null; scope: string; evaluatedAt: string };
export default function PaymentReportsPage() {
  const {user} = useAuth();
  const [kind,setKind] = useState<'reconciliation'|'access-review'>('reconciliation');
  const [report,setReport] = useState<Report|null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(false);
  const sequence = useRef(0);
  async function load(cursor?: string) {
    if (!user) return;
    const ticket = ++sequence.current;
    setLoading(true); setError('');
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/admin/payments/${kind}${cursor?`?cursor=${encodeURIComponent(cursor)}`:''}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load report.');
      if (ticket===sequence.current) setReport(data);
    } catch(e) {
      if (ticket===sequence.current) {setReport(null);setError(e instanceof Error?e.message:'Unable to load report.');}
    } finally {if(ticket===sequence.current)setLoading(false);}
  }
  useEffect(()=>{setReport(null);setError('');void load();return ()=>{sequence.current++;};},[user?.uid,kind]);
  const fields = report?.rows.length?Object.keys(report.rows[0]):[];
  return <Card><CardHeader><CardTitle>Payment and access review reports</CardTitle></CardHeader><CardContent className="space-y-4">
    <div className="flex gap-2 flex-wrap"><Button variant={kind==='reconciliation'?'default':'outline'} onClick={()=>setKind('reconciliation')}>Wallet reservations</Button><Button variant={kind==='access-review'?'default':'outline'} onClick={()=>setKind('access-review')}>Legacy subscription review</Button><Button variant="outline" disabled={loading||!user} onClick={()=>void load()}>Refresh first page</Button></div>
    {loading&&<p role="status">Loading report…</p>}{error&&<p role="alert" className="text-destructive">{error}</p>}
    {report&&<><p className="text-sm text-muted-foreground">{report.scope}</p><p className="text-xs">Evaluated: {report.evaluatedAt}</p><div className="overflow-auto"><table className="w-full text-sm"><thead><tr>{fields.map(f=><th className="text-left p-2" key={f}>{f}</th>)}</tr></thead><tbody>{report.rows.map(row=><tr key={String(row.userId)}>{fields.map(f=><td className="p-2 border-t" key={f}>{typeof row[f]==='object'?JSON.stringify(row[f]):String(row[f]??'')}</td>)}</tr>)}</tbody></table></div>{!report.rows.length&&<p>No records on this page.</p>}<Button disabled={loading||!report.nextCursor} onClick={()=>void load(report.nextCursor!)}>Next page</Button></>}
  </CardContent></Card>;
}
