"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { approvalAgeHours, type ApprovalItem } from "@/lib/approval-inbox";
export default function ApprovalInbox() {
 const {user}=useAuth(); const [items,setItems]=useState<ApprovalItem[]>([]); const [error,setError]=useState(""); const [busy,setBusy]=useState(true); const [truncated,setTruncated]=useState(false); const [checkedAt,setCheckedAt]=useState(""); const [filter,setFilter]=useState("all");
 async function refresh() {if(!user)return;setBusy(true);setError("");try {const token=await user.getIdToken();const r=await fetch("/api/admin/approval-inbox",{headers:{authorization:`Bearer ${token}`},cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error);setItems(d.items);setTruncated(d.truncated);setCheckedAt(d.checkedAt);}catch(e){setError(e instanceof Error?e.message:"Unable to load approvals.");}finally{setBusy(false);}}
 useEffect(()=>{if(user)void refresh();},[user]);
 return <div className="space-y-6"><h1 className="text-3xl font-bold">Approval Inbox</h1><p>Review payment, IBA eligibility and payout requests using their existing approval screens.</p><Button onClick={refresh} disabled={busy}>{busy?"Loading…":"Refresh"}</Button>{error&&<p role="alert" className="text-destructive">{error}</p>}{checkedAt&&<p className="text-sm text-muted-foreground">Checked: {new Date(checkedAt).toLocaleString()}</p>}{truncated&&<p role="status">Showing up to 100 requests per category. Use the original screens for the complete queue.</p>}
 <div className="flex flex-wrap gap-2">{["all","payment","eligibility","payout"].map(k=><Button key={k} variant={filter===k?"default":"outline"} onClick={()=>setFilter(k)}>{k} ({items.filter(i=>k==="all"||i.kind===k).length}{truncated?"+":""})</Button>)}</div>
 {!busy&&!error&&items.filter(i=>filter==="all"||i.kind===filter).length===0&&<p>No pending requests in this category.</p>}
 {items.filter(i=>filter==="all"||i.kind===filter).map(i=><Card key={i.kind+i.id}><CardHeader><CardTitle>{i.title}</CardTitle></CardHeader><CardContent className="space-y-2"><p>{i.status} · {i.kind}</p><p>Request: {i.id}</p>{i.amount!==undefined&&<p>₹{i.amount.toFixed(2)}</p>}<p>Age: {approvalAgeHours(i.createdAt)===null?"Unknown":approvalAgeHours(i.createdAt)+" hours"}</p><Button asChild><Link href={i.actionUrl}>Review request</Link></Button></CardContent></Card>)}</div>;
}
