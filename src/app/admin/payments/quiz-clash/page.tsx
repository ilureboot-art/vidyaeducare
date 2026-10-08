"use client";
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
export default function QuizSettlementPage() {
  const { user } = useAuth(), { toast } = useToast();
  const [id, setId] = useState(''), [preview, setPreview] = useState<any>(null), [busy, setBusy] = useState(false);
  const run = async (settle: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const response = await fetch(settle ? '/api/admin/payments/quiz-clash' : `/api/admin/payments/quiz-clash?tournamentId=${encodeURIComponent(id)}`, { method: settle ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` }, ...(settle ? { body: JSON.stringify({ action: 'close-and-settle', tournamentId: preview.tournamentId, previewHash: preview.previewHash }) } : {}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed.');
      if (settle) { setPreview(null); toast({ title: 'Tournament settled', description: 'Server credits and audit entries committed once.' }); }
      else setPreview(data);
    } catch (error) { setPreview(null); toast({ variant: 'destructive', title: 'Settlement unavailable', description: error instanceof Error ? error.message : 'Please retry.' }); }
    finally { setBusy(false); }
  };
  return <Card><CardHeader><CardTitle>Quiz Clash Settlement</CardTitle></CardHeader><CardContent className="space-y-4">
    <p>Finance approval closes entry and credits verified winners. Active attempts must finish first. Students who have not started cannot begin after closure.</p>
    <Input aria-label="Tournament ID" value={id} onChange={e => { setId(e.target.value); setPreview(null); }} placeholder="Tournament ID" />
    <Button disabled={busy || !id} onClick={() => run(false)}>Preview settlement</Button>
    {preview && <><p>{preview.title} · Pool ₹{preview.prizePool} · Unstarted students: {preview.unstartedStudents}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Student ID</th><th>Score</th><th>Paid</th><th>Rank</th><th>Prize</th></tr></thead><tbody>{preview.rows.map((r: any) => <tr key={r.id}><td>{r.studentId}</td><td>{r.score}</td><td>{r.paid ? 'Yes' : 'No'}</td><td>{r.rank || 'Ineligible'}</td><td>₹{r.prize.toFixed(2)}</td></tr>)}</tbody></table></div>
      <Button disabled={busy || preview.alreadySettled} onClick={() => run(true)}>{preview.alreadySettled ? 'Already settled' : 'Close tournament and credit previewed prizes'}</Button></>}
  </CardContent></Card>;
}
