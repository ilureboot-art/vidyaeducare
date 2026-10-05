"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Mic2, Play, RefreshCw, Wallet } from "lucide-react";
import { useAuth } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { defaultStorytellerConfig, STORYTELLER_CONSENT_VERSION, StorytellerConfig, storytellerPriceForDuration } from "@/lib/storyteller";
import { PromotionShare } from "@/components/PromotionShare";

const initial = { narrationMode: "AI", title: "", story: "", language: "Marathi", voiceReferenceId: "", voiceStyle: "Natural", duration: 30, music: "None", genre: "Mystery", consentAccepted: false, consentVersion: STORYTELLER_CONSENT_VERSION };

export default function StorytellerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<StorytellerConfig>(defaultStorytellerConfig);
  const [form, setForm] = useState<any>(initial);
  const [projects, setProjects] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const selectedPrice = storytellerPriceForDuration(config, Number(form.duration),form.narrationMode);

  useEffect(() => { fetch("/api/storyteller/config").then(r => r.json()).then(d => { if (d.config) { setConfig(d.config); setForm((f:any) => ({ ...f, language: d.config.languages[0], duration: d.config.durations[0], voiceStyle: d.config.voiceStyles[0], music: d.config.musicCategories[0], genre: d.config.genres[0] })); } }); }, []);
  useEffect(() => {
    if (config.demoEnabled && config.demoAssetPath && window.location.hash === "#storyteller-demo") {
      document.getElementById("storyteller-demo")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [config.demoEnabled, config.demoAssetPath]);
  useEffect(() => { if (!user) return; loadProjects(); const timer=setInterval(loadProjects,5000); return()=>clearInterval(timer); }, [user]);

  async function authorized(path: string, init?: RequestInit) {
    if (!user) throw new Error("Login is required.");
    const token = await user.getIdToken();
    return fetch(path, { ...init, headers: { ...(init?.headers || {}), authorization: `Bearer ${token}`, "content-type": "application/json" } });
  }
  async function loadProjects() { const response = await authorized("/api/storyteller/projects"); const data = await response.json(); if (response.ok) setProjects(data.projects || []); }
  async function checkout() {
    if (!user) return;
    setBusy(true);
    try {
      const idempotencyKey = crypto.randomUUID().replace(/-/g, "");
      const response = await authorized("/api/storyteller/checkout", { method: "POST", body: JSON.stringify({ ...form, idempotencyKey }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error + (data.required ? ` — add ₹${data.required}` : ""));
      toast({ title: "Payment confirmed", description: "Your Reel is queued. You will not be charged again for this project." });
      setForm(initial); await loadProjects();
    } catch (error) { toast({ variant: "destructive", title: "Unable to generate", description: error instanceof Error ? error.message : "Checkout failed." }); }
    finally { setBusy(false); }
  }
  async function uploadVoiceReference(file: File) {
    if (!user) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const data = new FormData(); data.set("file", file);
      const response = await fetch("/api/storyteller/voice-reference", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setForm((current:any) => ({ ...current, voiceReferenceId: result.voiceReferenceId }));
      toast({ title: "Own-voice reference uploaded", description: "Consent is still required before payment and generation." });
    } catch (error) { toast({ variant: "destructive", title: "Upload failed", description: error instanceof Error ? error.message : "Voice upload failed." }); }
    finally { setBusy(false); }
  }
  async function retry(id: string) { const response = await authorized(`/api/storyteller/projects/${id}/retry`, { method: "POST" }); const data = await response.json(); toast(response.ok ? { title: "Retry queued", description: "No additional payment was charged." } : { variant: "destructive", title: "Retry failed", description: data.error }); await loadProjects(); }
  async function download(id: string) { const response = await authorized(`/api/storyteller/projects/${id}/download?download=1`); const data = await response.json(); if (response.ok) window.location.assign(data.url); else toast({ variant: "destructive", title: "Download unavailable", description: data.error }); }
  async function preview(id: string) { const response = await authorized(`/api/storyteller/projects/${id}/download`); const data = await response.json(); if (response.ok) window.open(data.url,"_blank","noopener,noreferrer"); else toast({ variant: "destructive", title: "Preview unavailable", description: data.error }); }

  return <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-8">
    <section className="text-center space-y-3"><Badge>ALL USER REELS ARE PAID</Badge><h1 className="text-4xl md:text-6xl font-black text-primary"><Mic2 className="inline mr-3" />{config.productName}</h1><p className="text-xl text-muted-foreground">{config.tagline}</p><p className="font-black text-2xl">Audio only • ₹19–₹49</p>{config.enabled && <div className="flex justify-center"><PromotionShare title={`Vidya Educare – ${config.productName}`} description="Create your own story-to-audio reel. Login and payment are required before generation. View the current price and demo online." path="/storyteller" imagePath="/promotions/storyteller-ai.webp" /></div>}</section>
    {config.demoEnabled && config.demoAssetPath && <Card id="storyteller-demo"><CardHeader><CardTitle>{config.demoTitle}</CardTitle><CardDescription>{config.demoDescription}</CardDescription></CardHeader><CardContent className="space-y-4"><audio className="w-full" controls controlsList="nodownload" onContextMenu={(event) => event.preventDefault()} preload="metadata" src={config.demoAssetPath} /><PromotionShare title="Vidya Educare StoryTeller AI demo" description="Listen to the free demo to experience story-aware narration and sound design. Creating your own reel requires login and payment; check the current price online." path="/storyteller#storyteller-demo" imagePath="/promotions/storyteller-ai.webp" /></CardContent></Card>}
    {!user ? <Card className="text-center"><CardHeader><CardTitle>Login to create your Reel</CardTitle><CardDescription>Watch the demo for free. Your own Reel requires wallet payment before generation.</CardDescription></CardHeader><CardContent><Button asChild size="lg"><Link href="/login?returnTo=/storyteller">Create Your Reel – ₹{config.reelPrice}</Link></Button></CardContent></Card> : <>
      <Card><CardHeader><CardTitle>Create Your Story to Audio Reel</CardTitle><CardDescription>Configure first. No paid AI API is called until wallet payment succeeds.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4"><Field label="Story title"><Input value={form.title} maxLength={120} onChange={e => setForm({...form,title:e.target.value})}/></Field><Field label="Language"><Picker value={form.language} values={config.languages} onChange={v=>setForm({...form,language:v})}/></Field></div>
        <Field label="Story / Text"><Textarea rows={10} maxLength={10000} value={form.story} onChange={e=>setForm({...form,story:e.target.value})}/></Field>
        <Field label="Narration option"><Picker value={form.narrationMode} values={[...(config.aiNarratorEnabled?["AI"]:[]),...(config.ownVoiceEnabled?["OWN_VOICE"]:[])]} onChange={v=>setForm({...form,narrationMode:v,voiceReferenceId:"",consentAccepted:false})}/></Field>{form.narrationMode === "OWN_VOICE" && <Field label="Your clean voice reference (MP3/WAV/M4A, max 20 MB)"><Input type="file" accept="audio/mpeg,audio/wav,audio/mp4,.m4a" onChange={e=>e.target.files?.[0]&&uploadVoiceReference(e.target.files[0])}/>{form.voiceReferenceId&&<p className="text-sm text-green-700">Voice reference ready.</p>}</Field>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><Field label="Genre"><Picker value={form.genre} values={config.genres} onChange={v=>setForm({...form,genre:v})}/></Field><Field label="Narration style"><Picker value={form.voiceStyle} values={config.voiceStyles} onChange={v=>setForm({...form,voiceStyle:v})}/></Field><Field label="Duration"><Picker value={String(form.duration)} values={config.durations.map(String)} onChange={v=>setForm({...form,duration:Number(v)})}/></Field><Field label="Music"><Picker value={form.music} values={config.musicCategories} onChange={v=>setForm({...form,music:v})}/></Field></div>
        <div className="rounded-xl border p-4 space-y-3"><div className="flex items-start gap-3"><Checkbox id="voice-consent" checked={form.consentAccepted} onCheckedChange={checked=>setForm({...form,consentAccepted:checked===true})}/><Label htmlFor="voice-consent" className="leading-5">{form.narrationMode === "AI" ? "I have rights to this story and consent to AI narration." : "I confirm this is my voice or I have documented permission to use it."} I consent only to creating this paid audio reel. I do not consent to model training or unrelated voice cloning.</Label></div><p className="text-xs text-muted-foreground">Impersonation, fraud, harassment and copyrighted misuse are prohibited. The reference can be withdrawn/deleted subject to legal and transaction retention requirements.</p></div>
        <div className="rounded-xl bg-muted p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p className="font-bold">One paid Reel entitlement</p><p className="text-sm text-muted-foreground">Includes generation, preview, download and re-download.</p></div><Button onClick={checkout} disabled={busy || !config.enabled || (form.narrationMode === "OWN_VOICE" && (!config.ownVoiceEnabled || !form.voiceReferenceId)) || (form.narrationMode === "AI" && !config.aiNarratorEnabled) || !form.consentAccepted}>{busy?<Loader2 className="animate-spin"/>:<Wallet/>} Pay ₹{selectedPrice} & Generate Audio Reel</Button></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>My Reels</CardTitle></CardHeader><CardContent className="space-y-3">{!projects.length?<p className="text-muted-foreground">No purchased Reels yet.</p>:projects.map(p=><div key={p.id} className="border rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-3"><div><p className="font-bold">{p.title}</p><p className="text-sm text-muted-foreground">{p.language} • {p.requestedDuration==="AUTO"?"Auto":`${p.duration}s`} • ₹{p.amountPaid}</p><Badge variant="outline" className="mt-2">{p.generationStatus}</Badge>{p.generationStage&&<p className="text-xs text-muted-foreground mt-1">Progress: {String(p.generationStage).replaceAll("_"," ")}</p>}</div><div className="flex gap-2">{["FAILED","DISPATCH_FAILED"].includes(p.generationStatus)&&<Button variant="outline" onClick={()=>retry(p.id)}><RefreshCw/> Retry Free</Button>}{p.generationStatus==="READY"&&<><Button variant="outline" onClick={()=>preview(p.id)}><Play/> Preview</Button><Button onClick={()=>download(p.id)}><Download/> Download</Button></>}</div></div>)}</CardContent></Card>
    </>}
  </main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Picker({value,values,onChange}:{value:string;values:string[];onChange:(v:string)=>void}) { return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{values.map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>; }

