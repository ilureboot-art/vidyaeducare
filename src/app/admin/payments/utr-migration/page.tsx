'use client';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
export default function UtrMigration() {
 const {user}=useAuth();const [preview,setPreview]=useState<any>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function run(action:'preview'|'apply') {if(!user||busy)return;setBusy(true);setError('');try {const response=await fetch('/api/admin/payments/utr-migration',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},body:JSON.stringify({action,...(action==='apply'?{cursor:preview?.fromCursor,previewHash:preview?.previewHash}:{})})});const data=await response.json();if(!response.ok)throw Error(data.error);setPreview(data);}catch(e){setError(e instanceof Error?e.message:'Unable to review.');}finally{setBusy(false);}}
 return <Card><CardHeader><CardTitle>Legacy UTR index review</CardTitle></CardHeader><CardContent className="space-y-4"><p>Review at most 100 ledger entries per page. Applying adds reference claims and an audit record; no money or transaction status changes. Conflicting references block the entire page. The faster indexed deposit check starts only after every page is applied.</p><Button disabled={busy} onClick={()=>run('preview')}>Preview next page</Button>{error&&<p role="alert">{error}</p>}{preview&&<><p>{preview.applied?'Page applied.':preview.complete&&preview.scanned===undefined?'Index complete.':'Page preview.'} Scanned: {preview.scanned||0}; indexable deposits: {preview.indexable||0}</p><ul>{preview.blockers?.map((b:any)=><li key={b.id}>{b.id}: {b.reason}</li>)}</ul><Button disabled={busy||preview.applied||!preview.previewHash||preview.blockers?.length>0} onClick={()=>run('apply')}>Apply this index page</Button></>}</CardContent></Card>;
}
