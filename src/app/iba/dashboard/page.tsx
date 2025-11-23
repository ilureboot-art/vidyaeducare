
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, IndianRupee, Goal, Percent, ShieldCheck, ChevronRight, BarChart3, HelpCircle, Zap, Loader2 } from "lucide-react";
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
import { useAuth, useFirebase } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";


const dailyTarget = 5;
const monthlyTarget = 150;

const bonusTiers = [
    { target: 60, bonus: 1 },
    { target: 70, bonus: 2 },
    { target: 80, bonus: 3 },
    { target: 90, bonus: 4 },
    { target: 100, bonus: 5 },
];

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
  const { db } = useFirebase();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [ibaReferralCode, setIbaReferralCode] = useState<string | null>(null);
  
  useEffect(() => {
    if (user && db) {
        const fetchIbaData = async (db: Firestore) => {
            try {
                // Assume the IBA-specific data is stored in a subcollection or related doc
                const userWalletDocRef = doc(db, 'wallets', user.uid);
                const userWalletSnap = await getDoc(userWalletDocRef);
                if (userWalletSnap.exists()) {
                    setIbaReferralCode(userWalletSnap.data().referralCode);
                }

                const q = query(collection(db, "transactions"), where("user", "==", user.uid), where("type", "in", ["Commission", "Referral Bonus"]));
                const querySnapshot = await getDocs(q);

                const recentReferrals = querySnapshot.docs.map(d => {
                    const data = d.data();
                    const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
                    return {
                        id: d.id,
                        name: data.description.split(' from ')[1] || data.description.split(' for ')[1] || 'Unknown User',
                        date: date,
                        commission: data.amount,
                    };
                });

                const totalCommission = recentReferrals.reduce((acc, ref) => acc + ref.commission, 0);

                // Mocked sales data for charts
                const salesHistory = [
                    { month: 'Jan', sales: 12 }, { month: 'Feb', sales: 19 }, { month: 'Mar', sales: 3 }, 
                    { month: 'Apr', sales: 5 }, { month: 'May', sales: 2 }, { month: 'Jun', sales: 3 }
                ];

                setReferralData({
                    totalCommission,
                    totalReferrals: recentReferrals.length,
                    dailySales: 0, // Needs complex query
                    monthlySales: 0, // Needs complex query
                    salesHistory,
                    recentReferrals,
                });
            } catch (error) {
                console.error("Error fetching IBA data:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load your IBA dashboard data."
                });
            }
        };
        fetchIbaData(db);
    }
  }, [user, db, toast]);

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
    const message = `🚀 Ace your exams with Vidya EduCare! 🚀

I'm an Independent Business Associate with them, and I highly recommend their platform for serious students.

✨ **Why Vidya EduCare?**
- 📚 Extensive library of realistic mock tests for various standards.
- 🏆 Compete on live leaderboards and win cash prizes for top scores.
- 🎮 Fun skill games to sharpen your mind.

*Become an IBA & start your business journey with Vidya EduCare*
No registration fee and no investment to become an IBA and start a business with Vidya EduCare.

Use my exclusive IBA code to get a special 10% discount on your subscription!

🔑 **My IBA Code**: ${ibaReferralCode}
🔗 **Sign Up Here**: ${shareUrl}

Don't miss out on the best way to prepare for your exams and earn rewards!
#VidyaEduCare #MockTest #ExamPrep #StudySmart #IBA #Referral #Discount`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const fallbackCopy = () => {
      navigator.clipboard.writeText(message);
      toast({
          title: "Promotional Message Copied!",
          description: "Referral link and message copied to clipboard. You can now paste it into WhatsApp.",
      });
    };

    try {
        const newWindow = window.open(whatsappUrl, '_blank');
        if(!newWindow || newWindow.closed || typeof newWindow.closed=='undefined') {
            fallbackCopy();
        }
    } catch(e) {
        fallbackCopy();
    }
  };
  
  if (!ibaReferralCode || !referralData) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const dailyProgress = referralData.dailySales > 0 ? (referralData.dailySales / dailyTarget) * 100 : 0;
  const monthlyProgress = referralData.monthlySales > 0 ? (referralData.monthlySales / monthlyTarget) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck/> IBA Dashboard</h1>
        <p className="text-muted-foreground">Your hub for tracking referrals, sales, and commissions.</p>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">Your Unique IBA Code</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-2xl font-mono p-3 bg-background rounded-md w-full max-w-xs text-center tracking-widest break-all">{ibaReferralCode}</p>
            </div>
          </div>
           <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button variant="outline" className="w-full" onClick={handleCopyToClipboard}><Copy className="mr-2" /> Copy Code</Button>
              <Button className="w-full" onClick={handleShare}><Share2 className="mr-2" /> Share & Promote</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2"><IndianRupee/>{referralData.totalCommission.toFixed(2)}</CardTitle>
                        <CardDescription>Total Commission</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl md:text-2xl flex items-center justify-center gap-2"><Users/>{referralData.totalReferrals}</CardTitle>
                        <CardDescription>Total Sales</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart3/> Sales Analytics</CardTitle>
                    <CardDescription>Visualize your sales performance and growth over time.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {referralData.salesHistory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={referralData.salesHistory}>
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${'${value}'}`}/>
                                <Tooltip
                                  contentStyle={{
                                    background: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                  }}
                                />
                                <Bar dataKey="sales" name="Monthly Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">No sales data yet.</div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Percent/> Commission Structure</CardTitle>
                    <CardDescription>Your commission rates for referring new clients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold">Mock Test Subscriptions</h4>
                        <div className="flex items-baseline justify-between mt-2">
                             <p className="text-2xl font-bold text-primary">17.65%</p>
                             <p className="text-sm text-muted-foreground">of base price</p>
                        </div>
                    </div>
                     <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <h4 className="font-semibold flex items-center gap-2"><Zap className="text-primary"/> ReferBolt Bonus</h4>
                        <p className="text-muted-foreground text-sm mt-1">
                            Subscribe to ReferBolt to get an additional bonus commission on all mock test sales you refer!
                        </p>
                        <Button asChild size="sm" className="mt-3">
                            <Link href="/referbolt">Learn More</Link>
                        </Button>
                    </div>
                     <div className="flex items-center text-sm text-muted-foreground">
                        <HelpCircle className="w-4 h-4 mr-2"/>
                        <span>If a sale involves two IBA codes, the commission is split 50/50 between them.</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tools & Reports</CardTitle>
                </CardHeader>
                 <CardContent>
                    <Link href="/refer/students" className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                        <div className="flex items-center gap-3 font-medium">
                            <Users className="w-5 h-5 text-primary" />
                            <span>View Client List</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><Goal/> Target Progress</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Daily Target</span>
                      <span>{referralData.dailySales} / {dailyTarget} sales</span>
                    </div>
                    <Progress value={dailyProgress} />
                 </div>
                 <div className="space-y-1">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Monthly Target</span>
                      <span>{referralData.monthlySales} / {monthlyTarget} sales</span>
                    </div>
                    <Progress value={monthlyProgress} />
                 </div>
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2"><Percent/> Monthly Bonus Commission</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
                    {bonusTiers.map(tier => (
                        <div key={tier.target} className="p-2 bg-muted/50 rounded-md">
                            <p className="font-bold text-primary">{tier.target}% Target</p>
                            <p className="text-sm text-muted-foreground">+ {tier.bonus}% Bonus</p>
                        </div>
                    ))}
                </CardContent>
             </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Sales</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referralData.recentReferrals.length > 0 ? referralData.recentReferrals.map((ref) => (
                                <TableRow key={ref.id}>
                                    <TableCell>{ref.name}</TableCell>
                                    <TableCell>{new Date(ref.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right text-green-600 font-bold">+ ₹{ref.commission.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">No recent sales yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
    </div>
  );
}


export default function IBADashboardPage() {
    return (
        <ProtectedRoute>
            <TooltipProvider>
                <IBADashboardPageContent />
            </TooltipProvider>
        </ProtectedRoute>
    )
}
