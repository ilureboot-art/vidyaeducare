
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Zap, Share2, IndianRupee, Users, CheckCircle, Repeat, Loader2, Sparkles, TrendingUp, ShieldCheck, History } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth, useDb } from "@/firebase";
import { doc, onSnapshot, DocumentData, updateDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const benefits = [
    { text: "Earn continuous commissions from a multi-level referral network." },
    { text: "Complete cycles of just 3 referrals for massive bonuses." },
    { text: "Unlock earnings from both direct & indirect referral activity." },
    { text: "Unlimited potential through automatic cycle renewal." },
    { text: "FREE access included with any MockArena pack purchase." },
];

function ReferBoltPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDb();
  
  const [data, setData] = useState<DocumentData | null | { isSubscribed: boolean }>(null);
  
  useEffect(() => {
    if (user && db) {
        const referboltDocRef = doc(db, "referbolt", user.uid);
        const unsub = onSnapshot(referboltDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data());
            } else {
                setData({ isSubscribed: false });
            }
        }, async (error) => {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: referboltDocRef.path,
                    operation: 'get',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setData({ isSubscribed: false });
        });
        return () => unsub();
    }
  }, [user, db]);

  const handleAutoRenewToggle = async (checked: boolean) => {
      if (!user || !db || !data || !('isSubscribed' in data) || !data.isSubscribed) return;
      const referboltDocRef = doc(db, "referbolt", user.uid);
      
      updateDoc(referboltDocRef, { autoRenew: checked })
          .then(() => {
              toast({
                  title: "Auto-renewal settings updated!",
                  description: `Auto-renewal is now ${checked ? 'enabled' : 'disabled'}.`
              });
          })
          .catch(async (serverError) => {
              const permissionError = new FirestorePermissionError({
                  path: referboltDocRef.path,
                  operation: 'update',
                  requestResourceData: { autoRenew: checked },
              } satisfies SecurityRuleContext);
              errorEmitter.emit('permission-error', permissionError);
          });
  };

  const handleShare = async () => {
    if (!data || !('referralCode' in data)) return;
    const referralCode = data.referralCode;
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;

    const message = `⚡ Activate Passive Income with Vidya ReferBolt! ⚡

I've unlocked the ReferBolt Success Cycle on Vidya EduCare! This is a powerful multi-level referral engine for continuous income.

💰 ReferBolt Continuous Earnings:
🔄 Cycle Bonus: Complete a cycle with just 3 people for massive credit payouts!
📈 Passive Network: Earn from your direct referrals AND their network activity.
🤝 Automatic Cycles: The cycles renew automatically for infinite earning potential.

🏆 Academic Excellence & Rewards:
- MockArena: Students win REAL cash prizes for Top 5 rankings (80%+ score).
- Quiz Clash: Compete in live tournaments with high-value shared prize pools.
- AI Suite: Includes GuruAI (Personal Tutor) & QuickNotes (Auto-Summaries).

🎁 Bonus: New users get an instant ₹5 wallet bonus on signup!

🔑 Use my network code to join the success cycle: ${referralCode}
🔗 Join the Network: ${shareUrl}

Let's build a profitable learning community together! 💸🚀`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "High-impact ReferBolt message copied to clipboard.",
        });
    }

    try {
        const newWindow = window.open(whatsappUrl, '_blank');
        if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
            fallbackCopy();
        }
    } catch(e) {
        fallbackCopy();
    }
  };
  
  if (!data) {
      return (
          <div className="w-full max-w-2xl mx-auto flex items-center justify-center h-96">
              <Loader2 className="animate-spin text-primary" size={32}/>
          </div>
      )
  }

  if (!('isSubscribed' in data) || !data.isSubscribed) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card className="shadow-2xl border-none ring-1 ring-primary/10 overflow-hidden">
                <CardHeader className="text-center bg-primary/[0.02] border-b pb-12 pt-12">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-primary/10 rounded-3xl animate-pulse">
                           <Zap className="w-12 h-12 text-primary fill-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-4xl font-black text-primary tracking-tighter uppercase italic">
                        REFER<span className="text-accent">BOLT</span> SYSTEM
                    </CardTitle>
                    <CardDescription className="text-lg font-bold text-muted-foreground mt-2">
                        Advanced Continuous Earning Infrastructure
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <p className="text-center text-muted-foreground font-medium text-lg leading-relaxed px-4">
                        ReferBolt is a premium multi-level referral engine. Once activated, you earn commissions from a wider network of referrals, creating a recurring cycle of income as your community grows.
                    </p>
                    
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-center text-primary">System Benefits</h3>
                        <div className="grid gap-3">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-transparent hover:border-primary/10 transition-all">
                                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0"/>
                                    <span className="text-sm font-bold">{benefit.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 grid gap-4">
                        <Button asChild size="lg" className="w-full py-10 text-2xl font-black rounded-3xl shadow-xl hover:scale-[1.02] transition-transform bg-primary">
                            <Link href="/store">SUBSCRIBE TO REFERBOLT</Link>
                        </Button>
                        <Button variant="outline" size="lg" className="w-full py-10 text-xl font-black rounded-3xl border-2 hover:bg-muted/50" onClick={handleShare}>
                            <Share2 className="mr-3 h-6 w-6" /> SHARE SYSTEM BENEFITS
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="bg-primary/5 text-center justify-center p-4">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles size={14} className="text-accent fill-accent" /> Unlock your continuous earning potential
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="shadow-2xl border-none ring-1 ring-primary/10 overflow-hidden">
         <CardHeader className="bg-primary/[0.02] border-b p-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-2xl">
                        <Zap className="w-10 h-10 text-primary fill-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-black text-primary uppercase italic tracking-tighter">ReferBolt Hub</CardTitle>
                        <CardDescription className="font-bold flex items-center gap-2">
                            <ShieldCheck size={14} className="text-green-600"/> PREMIUM STATUS ACTIVE
                        </CardDescription>
                    </div>
                </div>
                <div className="flex flex-col items-center md:items-end gap-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Network Code</p>
                    <Badge variant="outline" className="px-6 py-2 text-xl font-mono tracking-widest bg-background border-dashed border-2">{data.referralCode}</Badge>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-primary/10 bg-primary/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Commissions</CardTitle>
                        <IndianRupee className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-primary tracking-tighter">₹{data.totalCommissions?.toLocaleString() || 0}</div>
                        <p className="text-[10px] font-bold text-green-600 mt-1">LIFETIME EARNINGS</p>
                    </CardContent>
                </Card>
                 <Card className="border-accent/10 bg-accent/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Global Connections</CardTitle>
                        <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-accent tracking-tighter">{data.totalReferrals || 0}</div>
                        <p className="text-[10px] font-bold text-accent mt-1">REFERRAL NETWORK SIZE</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-primary/20 shadow-inner rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <CardTitle className="text-lg font-black uppercase italic text-primary flex items-center gap-2">
                            <TrendingUp size={20}/> Current Success Cycle
                        </CardTitle>
                         <div className="flex items-center space-x-2 bg-background px-4 py-2 rounded-full border shadow-sm">
                            <Switch id="auto-renew" checked={data.autoRenew || false} onCheckedChange={handleAutoRenewToggle} />
                            <Label htmlFor="auto-renew" className="text-[10px] font-black uppercase tracking-widest cursor-pointer">Auto-Renew</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="flex items-center gap-6">
                        <div className="flex-1 space-y-2">
                            <Progress value={((data.cycleProgress || 0) / (data.cycleGoal || 3)) * 100} className="h-4 rounded-full" />
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <span>Cycle Start</span>
                                <span>{data.cycleGoal || 3} Referrals to Bonus</span>
                            </div>
                        </div>
                        <div className="text-center p-4 bg-primary text-white rounded-2xl shadow-xl min-w-[100px]">
                            <p className="text-3xl font-black">{data.cycleProgress || 0}</p>
                            <p className="text-[8px] font-black uppercase">ACTIVE</p>
                        </div>
                    </div>
                    <p className="text-center text-sm font-bold text-muted-foreground bg-muted/50 p-4 rounded-xl border-dashed border">
                        Complete this cycle by referring just 3 friends to unlock your next massive bonus credit!
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                    <History className="w-4 h-4" /> RECENT NETWORK ACTIVITY
                </h3>
                <div className="border rounded-[2rem] overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-black uppercase text-[10px]">Recipient</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Date</TableHead>
                                <TableHead className="text-right font-black uppercase text-[10px]">Credit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.referralHistory && data.referralHistory.length > 0 ? data.referralHistory.map((ref: any) => (
                                <TableRow key={ref.id} className="hover:bg-muted/30 transition-colors even:bg-muted/40 hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-bold text-sm">{ref.name}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{new Date(ref.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-black text-green-600">+ ₹{ref.commission}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-32 italic font-medium">No recent network activity recorded.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-8 bg-primary/[0.02] border-t">
             <Button variant="default" size="lg" className="w-full py-10 text-2xl font-black rounded-3xl shadow-2xl group transition-all" onClick={handleShare}>
                <Share2 className="mr-3 h-8 w-8 group-hover:rotate-12 transition-transform" />
                RECRUIT NEW REFERRALS
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ReferBoltPage() {
    return (
        <ProtectedRoute>
            <UserLayout>
                <ReferBoltPageContent />
            </UserLayout>
        </ProtectedRoute>
    );
}
