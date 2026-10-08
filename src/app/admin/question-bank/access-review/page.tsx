"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export default function QuestionAccessReview() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]), [cursor, setCursor] = useState<string | null>(null), [count, setCount] = useState(0), [issues, setIssues] = useState(0), [error, setError] = useState(''), [busy, setBusy] = useState(false), [finished, setFinished] = useState(false);
  const load = async (next: string | null) => {
    if (!user || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/admin/question-bank/access-review${next ? `?cursor=${encodeURIComponent(next)}` : ''}`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Review unavailable.');
      setRows(data.rows); setCursor(data.nextCursor); setCount(n => n + data.rows.length); setIssues(n => n + data.rows.filter((r: any) => r.status !== 'FORMAT_READY').length); setFinished(!data.nextCursor);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please retry.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { if (user) void load(null); }, [user?.uid]);
  return <Card><CardHeader><CardTitle>Question access migration review</CardTitle></CardHeader><CardContent className="space-y-4">
    <p>Read-only checks for IDs, bilingual choices, duplicate IDs and answer translation alignment. This does not verify textbook correctness or change any records.</p>
    <p>Reviewed {count} sets · {issues} require review · {finished ? 'Scan complete' : 'More pages remain'}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>ID</th><th>Name</th><th>Standard</th><th>Questions</th><th>Status</th><th>Issue</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.id}</td><td>{r.name}</td><td>{r.standard}</td><td>{r.questionCount}</td><td>{r.status}</td><td>{r.issue || 'None'}</td></tr>)}</tbody></table></div>
    <Button disabled={busy || finished} onClick={() => load(cursor)}>Review next page</Button>
  </CardContent></Card>;
}
