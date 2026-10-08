'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export default function QuestionRepair() {
 const { user } = useAuth(); const [setId,setId] = useState(''), [preview,setPreview] = useState<any>(null), [busy,setBusy] = useState(false), [error,setError] = useState('');
 async function run(action: 'preview'|'apply') {
  if(!user || busy) return; setBusy(true); setError('');
  try { const res=await fetch('/api/admin/question-bank/repair',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},body:JSON.stringify({action,setId,previewHash:preview?.previewHash})});const data=await res.json();if(!res.ok)throw new Error(data.error);setPreview(data); } catch(e) {setError(e instanceof Error?e.message:'Unable to review.');} finally {setBusy(false);}
 }
 return <Card><CardHeader><CardTitle>Question formatting repair</CardTitle></CardHeader><CardContent className="space-y-4">
 <p>Preview agreeing bilingual option labels and whitespace repairs. Conflicting keys, missing translations and duplicate choices require academic review. This does not certify factual correctness.</p>
 <Input aria-label="Question set ID" value={setId} onChange={e=>{setId(e.target.value);setPreview(null);}} placeholder="SET-…" />
 <Button disabled={busy || !setId} onClick={()=>run('preview')}>Preview repair</Button>
 {error && <p role="alert">{error}</p>}
 {preview && <><p>{preview.setId}: {preview.changedQuestions} changed questions. {preview.applied?'Applied with private backup.':preview.ready?'Formatting ready.':'Academic review required.'}</p><ul>{preview.issues.map((i:any,n:number)=><li key={n}>{i.questionId}: {i.reason}</li>)}</ul><p>Applying changes this set only, preserves question order and saves the original privately. Existing attempt snapshots and results are unchanged.</p><Button disabled={busy || !preview.ready || !preview.changedQuestions || preview.applied} onClick={()=>run('apply')}>Apply previewed formatting repair</Button></>}
 </CardContent></Card>;
}
