"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function IbaRecruitmentPage() { return <ProtectedRoute><UserLayout><Recruitment /></UserLayout></ProtectedRoute>; }
function Recruitment() {
  const { user } = useAuth(); const [policy, setPolicy] = useState<any>(undefined);
  useEffect(() => { if (!user) return; user.getIdToken().then((token) => fetch("/api/iba/policy", { headers: { Authorization: `Bearer ${token}` } })).then((r) => r.json()).then((data) => setPolicy(data.policy ?? null)).catch(() => setPolicy(null)); }, [user]);
  if (policy === undefined) return <Loader2 className="animate-spin mt-20" />;
  if (!policy) return <Card className="w-full max-w-3xl"><CardContent className="p-8 text-center">IBA recruitment policy is currently unavailable.</CardContent></Card>;
  return <div className="w-full max-w-4xl space-y-6"><div className="text-center space-y-2"><h1 className="text-3xl md:text-4xl font-bold">{policy.recruitmentTitle}</h1><p className="text-muted-foreground">Independent, flexible and performance-based earning opportunity.</p></div><Card><CardHeader><CardTitle>Benefits</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-3">{policy.recruitmentBenefits.map((benefit: string) => <div key={benefit} className="flex gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" /><span>{benefit}</span></div>)}</CardContent></Card>{policy.earningOpportunityEnabled && <Card className="border-primary"><CardHeader><CardTitle>{policy.earningOpportunityText}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{policy.earningOpportunityDisclaimer}</p></CardContent></Card>}<Card><CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader><CardContent className="space-y-4 whitespace-pre-wrap"><p>{policy.termsAndConditions}</p><p className="text-sm text-muted-foreground border-t pt-4">{policy.disclaimer}</p><p className="text-xs text-muted-foreground">Policy version {policy.version} · Effective {new Date(policy.effectiveFrom).toLocaleDateString("en-IN")}</p></CardContent></Card></div>;
}
