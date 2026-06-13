"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, IndianRupee, Goal, Percent, ShieldCheck, ChevronRight, BarChart3, HelpCircle, Zap, Loader2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth, useDb } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserLayout from "@/components/UserLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';


const dailyTarget = 5;
const monthlyTarget = 150;

const bonusTiers = [
    { target: 60, bonus: 1 },
    { target: 70, bonus: 2 },
    { target: 80, bonus: 3 },
    { target: 90, bonus: 4 },
    { target: 100, bonus: 5 },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

interface ReferralData {
    totalCommission: number;
    totalReferrals: number;
    dailySales: number;
    monthlySales: number;
    salesHistory: { month: string; sales: number }[];
    recentReferrals: { id: string; name: string; date: string; commission: number }[];
}

function IBADashboardPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useDb();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [ibaReferralCode, setIbaReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user && db) {
        const fetchIbaData = async (db: Firestore) => {
            setIsLoading(true);
            setError(null);
            try {
                const userWalletDocRef = doc(db, 'wallets', user.uid);
                const userWalletSnap = await getDoc(userWalletDocRef).catch(async (serverError) => {
                    if (serverError.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: userWalletDocRef.path,
                            operation: 'get',
                        } satisfies SecurityRuleContext);
                        errorEmitter.emit('permission-error', permissionError);
                    }
                    throw serverError;
                });

                if (userWalletSnap.exists()) {
                    setIbaReferralCode(userWalletSnap.data().referralCode);
                } else {
                    setIbaReferralCode(`REF${user.uid.slice(0, 6).toUpperCase()}`);
                }

                const txColRef = collection(db, "transactions");
                const q = query(txColRef, where("user", "==", user.uid), where("type", "in", ["Commission", "Referral Bonus"]));
                const querySnapshot = await getDocs(q).catch(async (serverError) => {
                    if (serverError.code === 'permission-denied') {
                        const permissionError = new FirestorePermissionError({
                            path: txColRef.path,
                            operation: 'list',
                        } satisfies SecurityRuleContext);
                        errorEmitter.emit('permission-error', permissionError);
                    }
                    throw serverError;
                });

                const recentReferrals = querySnapshot.docs.map(d => {
                    const data = d.data();
                    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
                    return {
                        id: d.id,
                        name: data.description.split(' from ')[1] || data.description.split(' for ')[1] || 'Commission Received',
                        date: date,
                        commission: data.amount,
                    };
                });

                const totalCommission = recentReferrals.reduce((acc, ref) => acc + ref.commission, 0);

                const salesHistory = [
                    { month: 'Jan', sales: 0 }, { month: 'Feb', sales: 0 }, { month: 'Mar', sales: 0 }, 
                    { month: 'Apr', sales: 0 }, { month: 'May', sales: 0 }, { month: 'Jun', sales: recentReferrals.length }
                ];

                setReferralData({
                    totalCommission,
                    totalReferrals: recentReferrals.length,
                    dailySales: 0,
                    monthlySales: recentReferrals.length,
                    salesHistory,
                    recentReferrals,
                });
            } catch (err: any) {
                console.error("Error fetching IBA data:", err);
                if (err.code !== 'permission-denied') {
                    setError("Could not load IBA dashboard statistics. Please check your connection.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchIbaData(db);
    }
  }, [user, db]);

  const handleCopyToClipboard = () => {
    if (!ibaReferralCode) return;
    navigator.clipboard.writeText(ibaReferralCode);
    toast({
      title: "Copied!",
      description: "IBA Referral code copied to clipboard.",
    });
  };

  const handleShare = async () => {
    if (!ibaReferralCode) return;
    const shareUrl = `${window.location.origin}/signup?ref=${ibaReferralCode}`;
    const message = `🎓 Transform your education with Vidya EduCare! 🎓

I'm an Independent Business Associate with Vidya EduCare, and I'm sharing my exclusive referral code to help you get a special discount on premium MockArena packages.

✨ Why Vidya EduCare?
- 🏆 MockArena: Win cash prizes in live curriculum tests.
- 🤖 GuruAI: Your personal 24/7 bilingual tutor.
- 📝 QuickNotes: Transform textbooks into structured summaries.

🔑 Use my IBA Code for a special discount: ${ibaReferralCode}
🔗 Sign Up Here: ${shareUrl}

Join the national community of high-achievers today! 🚀

#VidyaEduCare #IBA #MockArena #GuruAI #EducationSuccess #ReferralDiscount`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Syncing IBA Performance...</p>
      </div>
    );
  }

  if (error) {
      return (
          <div className="w-full max-w-4xl mx-auto p-4">
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Synchronization Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button className="mt-4" onClick={() => window.location.reload()}>Retry Sync</Button>
          </div>
      )
  }

  const dailyProgress = referralData!.dailySales > 0 ? (referralData!.dailySales / dailyTarget) * 100 : 0;
  const monthlyProgress = referralData!.monthlySales > 0 ? (referralData!.monthlySales / monthlyTarget) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck/> IBA Dashboard</h1>
        <p className="text-muted-foreground">Your hub for tracking referrals, sales, and commissions.</p>
          
          <div className="text-center p-4 bg-muted rounded-lg border">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Unique IBA Code</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-2xl font-mono p-3 bg-background rounded-md w-full max-w-xs text-center tracking-widest border border-dashed">{ibaReferralCode}</p>
            </div>
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button variant="outline" className="w-full" onClick={handleCopyToClipboard}><Copy className="mr-2 h-4 w-4" /> Copy Code</Button>
              <Button className="w-full" onClick={handleShare}><Share2 className="mr-2 h-4 w-4" /> Share & Promote</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
                <Card className="bg-primary/[0.02]">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2 text-primary"><IndianRupee size={20}/>{formatCurrency(referralData?.totalCommission || 0)}</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase">Total Commission</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="bg-primary/[0.02]">
                    <CardHeader className="py-4">
                        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2"><Users size={20}/>{referralData?.totalReferrals}</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase">Total Referrals</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 size={18}/> Sales Analytics</CardTitle>
                    <CardDescription>Visualizing your recent performance.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={referralData!.salesHistory}>
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                              }}
                            />
                            <Bar dataKey="sales" name="Referrals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Percent size={18}/> Commission Structure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center border">
                        <div>
                            <h4 className="font-bold">Mock Test Subscriptions</h4>
                            <p className="text-xs text-muted-foreground">Standard Referral Rate</p>
                        </div>
                        <p className="text-2xl font-black text-primary">17.65%</p>
                    </div>
                     <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold flex items-center gap-2"><Zap className="text-primary" size={14}/> ReferBolt Bonus</h4>
                            <p className="text-xs text-muted-foreground">Extra commission for ReferBolt subscribers.</p>
                        </div>
                        <Button asChild size="sm" variant="secondary" className="font-bold text-[10px]">
                            <Link href="/referbolt">VIEW BONUS</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><Goal size={18}/> Target Progress</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                      <span>Daily Target</span>
                      <span>{referralData!.dailySales} / {dailyTarget}</span>
                    </div>
                    <Progress value={dailyProgress} className="h-2" />
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                      <span>Monthly Target</span>
                      <span>{referralData!.monthlySales} / {monthlyTarget}</span>
                    </div>
                    <Progress value={monthlyProgress} className="h-2" />
                 </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referralData!.recentReferrals.length > 0 ? referralData!.recentReferrals.map((ref) => (
                                <TableRow key={ref.id}>
                                    <TableCell className="font-medium text-sm">{ref.name}</TableCell>
                                    <TableCell className="text-xs">{new Date(ref.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right text-green-600 font-bold text-sm">+ ₹{formatCurrency(ref.commission)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24 text-xs font-medium">No recent referral commissions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                     <Button variant="ghost" className="w-full text-xs text-muted-foreground" asChild>
                        <Link href="/refer/students">View Full Client List <ChevronRight className="ml-1 h-3 w-3"/></Link>
                    </Button>
                </CardFooter>
            </Card>
    </div>
  );
}


export default function IBADashboardPage() {
  return (
      <ProtectedRoute>
          <UserLayout>
              <TooltipProvider>
                  <IBADashboardPageContent />
              </TooltipProvider>
          </UserLayout>
      </ProtectedRoute>
  )
}
