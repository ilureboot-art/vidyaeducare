"use client";
import {useEffect,useState} from "react";
import {useAuth} from "@/firebase";
import {Button} from "@/components/ui/button";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
type Check={name:string;status:string;detail:string};
export default function SystemStatusPage(){
 const {user}=useAuth();const [checks,setChecks]=useState<Check[]>([]);const [error,setError]=useState("");const [busy,setBusy]=useState(true);const [time,setTime]=useState("");
 async function refresh(){if(!user)return;setBusy(true);setError("");try{const token=await user.getIdToken();const r=await fetch("/api/admin/system-status",{headers:{authorization:`Bearer ${token}`},cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error);setChecks(d.checks);setTime(d.checkedAt);}catch(e){setError(e instanceof Error?e.message:"Unable to check services.");}finally{setBusy(false);}}
 useEffect(()=>{if(user)void refresh();},[user]);
 return <div className="space-y-6"><h1 className="text-3xl font-bold">System Status</h1><p>Read-only checks. Configured services still require an end-to-end production test.</p><Button disabled={busy} onClick={refresh}>{busy?"Checking…":"Refresh checks"}</Button>{error&&<p role="alert" className="text-destructive">{error}</p>}{time&&<p>Checked: {new Date(time).toLocaleString()}</p>}{checks.map(c=><Card key={c.name}><CardHeader><CardTitle>{c.name}: {c.status}</CardTitle></CardHeader><CardContent>{c.detail}</CardContent></Card>)}</div>;
}
