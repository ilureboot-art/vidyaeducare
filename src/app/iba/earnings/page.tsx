"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/firebase";
import UserLayout from "@/components/UserLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, IndianRupee, Loader2, Target, CalendarDays } from "lucide-react";

export default function IbaEarningsPage() {
  return <ProtectedRoute><UserLayout><Earnings /></UserLayout></ProtectedRoute>;
}

function Earnings() {
  const { user } = useAuth(); const [data, setData] = useState<any>(null); const [error, setError] = useState("");
  useEffect(() => { if (!user) return; (async () => { try { const token = await user.getIdToken(); const response = await fetch("/api/iba/dashboard", { headers: { Authorization: `Bearer ${token}` } }); const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); } catch (err) { setError(err instanceof Error ? err.message : "Unable to load earnings."); } })(); }, [user]);
  if (error) return <Card className="max-w-3xl w-full"><CardContent className="p-6 text-destructive">{error}</CardContent></Card>;
  if (!data) return <div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  const weekly = data.weekly; const training = data.training;
  return <div className="w-full max-w-6xl space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">My Earnings</h1><p className="text-muted-foreground">Policy-based performance and payout information.</p></div><Badge className="w-fit">{data.status.replaceAll("_", " ")}</Badge></div>
    {!data.policy && <Card className="border-amber-500"><CardContent className="p-4 text-sm">The new remuneration policy is not published yet. Existing commission rules remain in effect.</CardContent></Card>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric icon={<Target />} label="Weekly Target" value={`${weekly.sales} / ${weekly.target}`} />
      <Metric icon={<CalendarDays />} label="Achievement" value={`${weekly.achievementPercentage.toFixed(1)}%`} />
      <Metric icon={<IndianRupee />} label="Pending Payout" value={money(data.earnings.pending)} />
      <Metric icon={<IndianRupee />} label="Paid Amount" value={money(data.earnings.paid)} />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <Card><CardHeader><CardTitle className="flex items-center gap-2">Weekly Sales Performance <TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-4 w-4" /></TooltipTrigger><TooltipContent className="max-w-xs">The standard rate applies at or above the policy threshold. Cancelled, refunded, failed, duplicate and ineligible sales do not count.</TooltipContent></Tooltip></TooltipProvider></CardTitle></CardHeader><CardContent className="space-y-4"><Progress value={Math.min(100, weekly.achievementPercentage)} /><div className="grid grid-cols-2 gap-3 text-sm"><Info label="Completed sales" value={weekly.sales} /><Info label="Remaining sales" value={weekly.remaining} /><Info label="Current commission" value={`${weekly.commissionPercentage}%`} /><Info label="Week" value={`${date(weekly.weekStart)} – ${date(new Date(new Date(weekly.weekEndExclusive).getTime()-1))}`} /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Training & Fixed Remuneration</CardTitle></CardHeader><CardContent className="space-y-3"><Progress value={Math.min(100, training.achievementPercentage)} /><Info label="Training period" value={`${date(training.start)} – ${date(new Date(new Date(training.endExclusive).getTime()-1))}`} /><Info label="Days remaining" value={training.daysRemaining} /><Info label="Training sales" value={`${training.sales} / ${training.target}`} /><Info label="Training achievement" value={`${training.achievementPercentage.toFixed(1)}%`} /><Info label="Fixed remuneration eligibility" value={data.fixedRemuneration.eligible ? "Approved" : data.fixedRemuneration.approvalStatus} /><Info label="Approved Fixed Monthly Remuneration" value={money(data.fixedRemuneration.approvedAmount)} /></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Earnings History</CardTitle></CardHeader><CardContent className="overflow-auto"><Table><TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Sales Commission</TableHead><TableHead>Fixed Monthly Remuneration</TableHead><TableHead>Referral Income</TableHead><TableHead>Other / Adjustments</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.earnings.history.map((p: any) => <TableRow key={p.id}><TableCell>{date(p.periodStart)}</TableCell><TableCell>{money(p.commissionAmount)}</TableCell><TableCell>{money(p.fixedRemuneration)}</TableCell><TableCell>{money(p.referralIncome)}</TableCell><TableCell>{money(p.adjustments)}</TableCell><TableCell className="font-bold">{money(p.totalPayable)}</TableCell><TableCell><Badge variant="outline">{p.status}</Badge></TableCell></TableRow>)}</TableBody></Table>{!data.earnings.history.length && <p className="py-8 text-center text-muted-foreground">No policy-based earnings have been calculated yet.</p>}</CardContent></Card>
    <Button asChild variant="outline"><Link href="/iba/recruitment">View IBA opportunity & policy information</Link></Button>
  </div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) { return <Card><CardContent className="p-5 flex gap-3 items-center"><div className="text-primary">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>; }
function Info({ label, value }: { label: string; value: React.ReactNode }) { return <div className="flex justify-between gap-3 border-b pb-2"><span className="text-muted-foreground">{label}</span><span className="font-medium text-right">{value}</span></div>; }
function money(value: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0)); }
function date(value: any) { return new Date(value).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }); }
