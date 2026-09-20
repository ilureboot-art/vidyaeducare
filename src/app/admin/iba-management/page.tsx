"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { defaultIbaRemunerationPolicy, getIndiaWeekRange, IbaRemunerationPolicy } from "@/lib/iba-remuneration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save, Send, Ban, CheckCircle2, Users, IndianRupee, Clock3 } from "lucide-react";

type ManagementData = { ibas: any[]; payouts: any[]; sales: any[]; stats: Record<string, number> };

export default function IbaManagementPage() {
  const { user } = useAuth(); const { toast } = useToast();
  const [policy, setPolicy] = useState<IbaRemunerationPolicy>(defaultIbaRemunerationPolicy);
  const [policies, setPolicies] = useState<any[]>([]); const [history, setHistory] = useState<any[]>([]);
  const [management, setManagement] = useState<ManagementData>({ ibas: [], payouts: [], sales: [], stats: {} });
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [ibaFilter, setIbaFilter] = useState(""); const [statusFilter, setStatusFilter] = useState("ALL"); const [periodFilter, setPeriodFilter] = useState("");

  const api = useCallback(async (url: string, init?: RequestInit) => {
    if (!user) throw new Error("Authentication required.");
    const token = await user.getIdToken();
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(init?.headers || {}) } });
    const data = await response.json(); if (!response.ok) throw new Error(data.details?.join(" ") || data.error || "Request failed."); return data;
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return; setLoading(true);
    try {
      const [policyData, managementData] = await Promise.all([api("/api/admin/iba/policy"), api("/api/admin/iba/management")]);
      setPolicies(policyData.policies); setHistory(policyData.history); setPolicy(policyData.policies[0] || { ...defaultIbaRemunerationPolicy }); setManagement(managementData);
    } catch (error) { toast({ variant: "destructive", title: "Unable to load IBA management", description: String(error) }); }
    finally { setLoading(false); }
  }, [api, toast, user]);
  useEffect(() => { load(); }, [load]);

  const update = <K extends keyof IbaRemunerationPolicy>(key: K, value: IbaRemunerationPolicy[K]) => setPolicy((current) => ({ ...current, [key]: value }));
  const policyAction = async (action: "SAVE" | "PUBLISH" | "DEACTIVATE") => {
    if (action !== "SAVE" && !window.confirm(`${action === "PUBLISH" ? "Publish" : "Deactivate"} this remuneration policy? This action will be recorded in audit history.`)) return;
    setSaving(true); try { await api("/api/admin/iba/policy", { method: "POST", body: JSON.stringify({ action, policy }) }); toast({ title: `Policy ${action.toLowerCase()} successful` }); await load(); } catch (error) { toast({ variant: "destructive", title: "Policy action failed", description: String(error) }); } finally { setSaving(false); }
  };
  const eligibilityAction = async (ibaUid: string, status: string) => {
    const remarks = window.prompt("Optional reason/remarks:") || "";
    try { await api("/api/admin/iba/management", { method: "POST", body: JSON.stringify({ action: "SET_ELIGIBILITY", ibaUid, status, remarks }) }); await load(); } catch (error) { toast({ variant: "destructive", title: "Eligibility update failed", description: String(error) }); }
  };
  const activationAction = async (iba: any) => {
    const active = iba.policyActive !== true;
    if (!window.confirm(`${active ? "Activate" : "Deactivate"} Fixed Monthly Remuneration for ${iba.name}? This decision is audited and will affect future payouts.`)) return;
    const remarks = window.prompt("Optional reason/remarks:") || "";
    try { await api("/api/admin/iba/management", { method: "POST", body: JSON.stringify({ action: "SET_POLICY_ACTIVE", ibaUid: iba.uid, active, remarks }) }); toast({ title: `IBA remuneration ${active ? "activated" : "deactivated"}` }); await load(); } catch (error) { toast({ variant: "destructive", title: "Activation failed", description: String(error) }); }
  };
  const payoutAction = async (payoutId: string, status: string) => {
    const paymentReference = status === "PAID" ? window.prompt("Payment reference / transaction ID:") : ""; if (status === "PAID" && !paymentReference) return;
    try { await api("/api/admin/iba/management", { method: "POST", body: JSON.stringify({ action: "UPDATE_PAYOUT", payoutId, status, paymentReference, payoutDate: status === "PAID" ? new Date().toISOString() : null }) }); await load(); } catch (error) { toast({ variant: "destructive", title: "Payout update failed", description: String(error) }); }
  };
  const calculatePayout = async (iba: any) => {
    const week = getIndiaWeekRange(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const fixedRemuneration = iba.status === "APPROVED" && iba.policyActive === true && window.confirm("Include the approved Fixed Monthly Remuneration in this payout?") ? policy.fixedMonthlyRemuneration : 0;
    try { await api("/api/admin/iba/management", { method: "POST", body: JSON.stringify({ action: "CALCULATE_PAYOUT", ibaUid: iba.uid, periodStart: week.start.toISOString(), periodEndExclusive: week.endExclusive.toISOString(), fixedRemuneration }) }); await load(); } catch (error) { toast({ variant: "destructive", title: "Payout calculation failed", description: String(error) }); }
  };
  const saleAction = async (saleId: string, status: "CANCELLED" | "REFUNDED") => {
    if (!window.confirm(`Mark this sale as ${status.toLowerCase()}? Linked payouts may be placed on hold or require an adjustment.`)) return;
    try { const result = await api("/api/admin/iba/management", { method: "POST", body: JSON.stringify({ action: "UPDATE_SALE_STATUS", saleId, status }) }); toast({ title: result.adjustmentRequired ? "Sale updated; paid-payout adjustment required" : "Sale updated" }); await load(); } catch (error) { toast({ variant: "destructive", title: "Sale update failed", description: String(error) }); }
  };

  if (loading) return <div className="h-80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  const stats = management.stats;
  const matchesIba = (value: string) => !ibaFilter || value.toLowerCase().includes(ibaFilter.toLowerCase());
  const filteredIbas = management.ibas.filter((iba) => matchesIba(`${iba.uid} ${iba.name} ${iba.email}`) && (statusFilter === "ALL" || (iba.status || "TRAINING") === statusFilter));
  const filteredSales = management.sales.filter((sale) => matchesIba(sale.ibaUid) && (statusFilter === "ALL" || sale.status === statusFilter) && (!periodFilter || String(sale.soldAt).startsWith(periodFilter)));
  const filteredPayouts = management.payouts.filter((payout) => matchesIba(payout.ibaUid) && (statusFilter === "ALL" || payout.status === statusFilter) && (!periodFilter || String(payout.periodStart).startsWith(periodFilter)));
  return <div className="space-y-6 max-w-7xl mx-auto">
    <div><h1 className="text-3xl font-bold">IBA Management</h1><p className="text-muted-foreground">Policy, eligibility, earnings and payout controls.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat icon={<Users />} label="Total IBAs" value={stats.totalIbas || 0} />
      <Stat icon={<CheckCircle2 />} label="Paid Active" value={stats.paidActiveIbas || 0} />
      <Stat icon={<Clock3 />} label="Pending Payouts" value={stats.pendingPayouts || 0} />
      <Stat icon={<IndianRupee />} label="Total Liability" value={`₹${((stats.commissionLiability || 0) + (stats.fixedLiability || 0)).toLocaleString("en-IN")}`} />
    </div>
    <Tabs defaultValue="policy">
      <TabsList className="flex flex-wrap h-auto"><TabsTrigger value="policy">Remuneration Policy</TabsTrigger><TabsTrigger value="ibas">IBA Eligibility</TabsTrigger><TabsTrigger value="sales">Sales Review</TabsTrigger><TabsTrigger value="payouts">Payouts</TabsTrigger><TabsTrigger value="recruitment">Recruitment</TabsTrigger><TabsTrigger value="history">Audit History</TabsTrigger></TabsList>
      <div className="grid sm:grid-cols-3 gap-3 my-4"><Input placeholder="Filter by IBA name, email or ID" value={ibaFilter} onChange={(e) => setIbaFilter(e.target.value)} /><select className="h-10 border rounded-md bg-background px-3" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="ALL">All statuses</option>{["TRAINING","ELIGIBLE_PENDING_APPROVAL","APPROVED","NOT_ELIGIBLE","SUSPENDED","COMPLETED","CANCELLED","REFUNDED","PENDING_REVIEW","PAID","ON_HOLD","REJECTED"].map((s) => <option key={s}>{s}</option>)}</select><Input type="month" aria-label="Filter by month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} /></div>
      <TabsContent value="policy"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle>Edit Policy</CardTitle><Badge>{policy.status}</Badge></div></CardHeader><CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4"><Field label="Policy title"><Input value={policy.title} onChange={(e) => update("title", e.target.value)} /></Field><Field label="Effective date"><Input type="datetime-local" value={policy.effectiveFrom?.slice(0,16)} onChange={(e) => update("effectiveFrom", e.target.value ? new Date(e.target.value).toISOString() : "")} /></Field></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NumberField label="Fixed monthly remuneration (₹)" value={policy.fixedMonthlyRemuneration} onChange={(v) => update("fixedMonthlyRemuneration", v)} />
          <NumberField label="Standard commission (%)" value={policy.standardCommissionPercentage} onChange={(v) => update("standardCommissionPercentage", v)} />
          <NumberField label="Reduced commission (%)" value={policy.reducedCommissionPercentage} onChange={(v) => update("reducedCommissionPercentage", v)} />
          <NumberField label="Minimum achievement (%)" value={policy.minimumAchievementPercentage} onChange={(v) => update("minimumAchievementPercentage", v)} />
          <NumberField label="Weekly sales target" value={policy.weeklySalesTarget} onChange={(v) => update("weeklySalesTarget", v)} />
          <NumberField label="Training period (months)" value={policy.trainingPeriodMonths} onChange={(v) => update("trainingPeriodMonths", v)} />
          <NumberField label="Monthly training target" value={policy.monthlyTrainingTarget} onChange={(v) => update("monthlyTrainingTarget", v)} />
          <Field label="Payout frequency"><select className="w-full h-10 border rounded-md bg-background px-3" value={policy.payoutFrequency} onChange={(e) => update("payoutFrequency", e.target.value as any)}><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select></Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4"><Field label="Required product ID"><Input value={policy.requiredProductId} onChange={(e) => update("requiredProductId", e.target.value)} /></Field><Field label="Required subscription/product"><Input value={policy.requiredProductName} onChange={(e) => update("requiredProductName", e.target.value)} /></Field></div>
        <div className="grid sm:grid-cols-3 gap-3"><Toggle label="Paid Active IBA required" checked={policy.paidActiveIbaRequired} onChange={(v) => update("paidActiveIbaRequired", v)} /><Toggle label="Training is commission-only" checked={policy.trainingCommissionOnly} onChange={(v) => update("trainingCommissionOnly", v)} /><Toggle label="Management approval required" checked={policy.managementApprovalRequired} onChange={(v) => update("managementApprovalRequired", v)} /></div>
        <Field label="Terms & Conditions"><Textarea value={policy.termsAndConditions} onChange={(e) => update("termsAndConditions", e.target.value)} /></Field><Field label="Policy disclaimer"><Textarea value={policy.disclaimer} onChange={(e) => update("disclaimer", e.target.value)} /></Field>
        <div className="flex flex-wrap gap-2"><Button disabled={saving} onClick={() => policyAction("SAVE")} variant="outline"><Save className="mr-2 h-4 w-4" />Save Draft</Button><Button disabled={saving} onClick={() => policyAction("PUBLISH")}><Send className="mr-2 h-4 w-4" />Publish New Version</Button><Button disabled={saving || !policy.id} onClick={() => policyAction("DEACTIVATE")} variant="destructive"><Ban className="mr-2 h-4 w-4" />Deactivate</Button></div>
      </CardContent></Card></TabsContent>
      <TabsContent value="ibas"><Card><CardContent className="pt-6 overflow-auto"><p className="text-sm text-muted-foreground mb-4">Approve an eligible IBA, then activate their Fixed Monthly Remuneration individually. Activation checks the current subscription, training target and account status. Existing commissions and finalized payouts are unaffected.</p><Table><TableHeader><TableRow><TableHead>IBA</TableHead><TableHead>Paid Active</TableHead><TableHead>Status</TableHead><TableHead>Fixed benefit</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filteredIbas.map((iba) => <TableRow key={iba.uid}><TableCell><div className="font-medium">{iba.name}</div><div className="text-xs text-muted-foreground">{iba.email || iba.uid}</div></TableCell><TableCell>{iba.paidActive ? "Yes" : "No"}</TableCell><TableCell><Badge variant="outline">{iba.status || "TRAINING"}</Badge></TableCell><TableCell><Badge variant={iba.policyActive === true ? "default" : "secondary"}>{iba.policyActive === true ? "ACTIVE" : "INACTIVE"}</Badge></TableCell><TableCell className="flex flex-wrap gap-1"><Button size="sm" disabled={iba.managementStatus === "APPROVED"} onClick={() => eligibilityAction(iba.uid,"APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => eligibilityAction(iba.uid,"NOT_ELIGIBLE")}>Reject</Button><Button size="sm" variant="destructive" onClick={() => eligibilityAction(iba.uid,"SUSPENDED")}>Suspend</Button><Button size="sm" variant={iba.policyActive === true ? "destructive" : "default"} disabled={iba.policyActive !== true && iba.managementStatus !== "APPROVED"} onClick={() => activationAction(iba)}>{iba.policyActive === true ? "Deactivate benefit" : "Activate benefit"}</Button><Button size="sm" variant="secondary" onClick={() => calculatePayout(iba)}>Calculate Payout</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="sales"><Card><CardContent className="pt-6 overflow-auto"><Table><TableHeader><TableRow><TableHead>Sale / IBA</TableHead><TableHead>Product</TableHead><TableHead>Amount</TableHead><TableHead>Eligibility</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filteredSales.map((s) => <TableRow key={s.id}><TableCell><div className="font-mono text-xs">{s.id}</div><div>{s.ibaUid}</div></TableCell><TableCell>{s.productName}</TableCell><TableCell>₹{Number(s.baseAmount||0).toLocaleString("en-IN")}</TableCell><TableCell>{s.eligible ? "Eligible" : s.ineligibilityReason || "Ineligible"}</TableCell><TableCell><Badge variant="outline">{s.status}</Badge></TableCell><TableCell className="space-x-1"><Button size="sm" variant="outline" disabled={s.status !== "COMPLETED"} onClick={() => saleAction(s.id,"CANCELLED")}>Cancel</Button><Button size="sm" variant="destructive" disabled={s.status !== "COMPLETED"} onClick={() => saleAction(s.id,"REFUNDED")}>Refund</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
      <TabsContent value="payouts"><Card><CardContent className="pt-6 overflow-auto"><Table><TableHeader><TableRow><TableHead>IBA / Period</TableHead><TableHead>Sales</TableHead><TableHead>Commission</TableHead><TableHead>Fixed Remuneration</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filteredPayouts.map((p) => <TableRow key={p.id}><TableCell>{p.ibaUid}<div className="text-xs">{String(p.periodStart).slice(0,10)}</div></TableCell><TableCell>{p.eligibleSales}</TableCell><TableCell>{p.commissionPercentage}% / ₹{Number(p.commissionAmount||0).toLocaleString("en-IN")}</TableCell><TableCell>₹{Number(p.fixedRemuneration||0).toLocaleString("en-IN")}</TableCell><TableCell>₹{Number(p.totalPayable||0).toLocaleString("en-IN")}</TableCell><TableCell><Badge>{p.status}</Badge></TableCell><TableCell className="space-x-1"><Button size="sm" onClick={() => payoutAction(p.id,"APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => payoutAction(p.id,"ON_HOLD")}>Hold</Button><Button size="sm" onClick={() => payoutAction(p.id,"PAID")}>Mark Paid</Button></TableCell></TableRow>)}</TableBody></Table>{!filteredPayouts.length && <p className="text-center text-muted-foreground py-8">No matching policy-based payouts.</p>}</CardContent></Card></TabsContent>
      <TabsContent value="recruitment"><Card><CardHeader><CardTitle>IBA Recruitment Content</CardTitle></CardHeader><CardContent className="space-y-4"><Field label="Recruitment title"><Input value={policy.recruitmentTitle} onChange={(e) => update("recruitmentTitle",e.target.value)} /></Field><Field label="Benefits (one per line)"><Textarea rows={7} value={policy.recruitmentBenefits.join("\n")} onChange={(e) => update("recruitmentBenefits",e.target.value.split("\n").filter(Boolean))} /></Field><Toggle label="Enable earning-opportunity claim" checked={policy.earningOpportunityEnabled} onChange={(v) => update("earningOpportunityEnabled",v)} /><Field label="Earning-opportunity text"><Input value={policy.earningOpportunityText} onChange={(e) => update("earningOpportunityText",e.target.value)} /></Field><Field label="Mandatory disclaimer"><Textarea value={policy.earningOpportunityDisclaimer} onChange={(e) => update("earningOpportunityDisclaimer",e.target.value)} /></Field><p className="text-sm text-muted-foreground">Save or publish from the Remuneration Policy tab. The earning claim is hidden until enabled.</p></CardContent></Card></TabsContent>
      <TabsContent value="history"><Card><CardContent className="pt-6 overflow-auto"><Table><TableHeader><TableRow><TableHead>Version</TableHead><TableHead>Action</TableHead><TableHead>Admin UID</TableHead><TableHead>Changed At</TableHead><TableHead>Effective From</TableHead></TableRow></TableHeader><TableBody>{history.map((h) => <TableRow key={h.id}><TableCell>v{h.policyVersion}</TableCell><TableCell>{h.action}</TableCell><TableCell className="font-mono text-xs">{h.changedBy}</TableCell><TableCell>{h.changedAt ? new Date(h.changedAt).toLocaleString("en-IN") : "—"}</TableCell><TableCell>{h.effectiveFrom ? new Date(h.effectiveFrom).toLocaleString("en-IN") : "—"}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent>
    </Tabs>
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) { return <Card><CardContent className="p-4 flex items-center gap-3"><div className="text-primary">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <Field label={label}><Input type="number" min="0" value={value} onChange={(e) => onChange(Number(e.target.value))} /></Field>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <div className="flex items-center justify-between gap-3 border rounded-lg p-3"><Label>{label}</Label><Switch checked={checked} onCheckedChange={onChange} /></div>; }
