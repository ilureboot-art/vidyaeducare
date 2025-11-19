

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Zap, Share2, IndianRupee, Users, CheckCircle, Repeat, Loader2 } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { db as dbPromise } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, DocumentData, type Firestore } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";

const benefits = [
    { text: "Earn a commission for every referral who subscribes." },
    { text: "Complete a cycle with just 3 referrals." },
    { text: "Earn from both direct & indirect referrals as your network grows." },
    { text: "Unlimited earning potential through continuous cycles." },
    { text: "Get free access by purchasing any Mock Test subscription." },
];

function ReferBoltPageContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [data, setData] = useState<DocumentData | null | { isSubscribed: boolean }>({ isSubscribed: false });
  const [autoRenew, setAutoRenew] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    const initDb = async () => {
      const dbInstance = await dbPromise;
      setDb(dbInstance);
    };
    initDb();
  }, []);

  useEffect(() => {
    if (user && db) {
        const referboltDocRef = doc(db, "referbolt", user.uid);
        const unsub = onSnapshot(referboltDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const docData = docSnap.data();
                setData(docData);
                setAutoRenew(docData.autoRenew || false);
            } else {
                setData({ isSubscribed: false });
            }
        });
        return () => unsub();
    }
  }, [user, db]);

  const handleShare = async () => {
    if (!data || !('referralCode' in data)) return;
    const referralCode = data.referralCode;
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const benefitsText = benefits.map(b => `✅ ${b.text}`).join("\n");

    const message = `🤝 Unlock continuous earnings with the ReferBolt System on Vidya EduCare! 🤝

🚀 Use my referral code: ${referralCode}

✨ **ReferBolt Benefits:**
${benefitsText}

💸 This is the ultimate way to build a steady stream of income.
Subscribe and start your earning cycle now: ${shareUrl}

#VidyaEduCare #ReferBolt #PassiveIncome #ReferAndEarn`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "ReferBolt benefits message copied to clipboard.",
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

  if (!data.isSubscribed) {
    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
                    <Zap /> ReferBolt System
                </CardTitle>
                <CardDescription className="text-center">
                    The advanced referral system for earning continuous commissions.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <p className="text-center">
                    ReferBolt is our premium referral program. Once you subscribe, you unlock the ability to earn commissions not just from your direct referrals, but from their referrals too, creating a cycle of passive income.
                </p>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2 text-center">ReferBolt Benefits</h3>
                    <ul className="space-y-2 text-sm">
                        {benefits.map((benefit, index) => (
                             <li key={index} className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>{benefit.text}</span></li>
                        ))}
                    </ul>
                </div>
                </CardContent>
                <CardFooter className="flex-col gap-4">
                    <Button asChild className="w-full">
                        <Link href="/store">Subscribe to ReferBolt Now</Link>
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleShare}>
                        <Share2 className="mr-2" />
                        Share Benefits
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
         <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
                <Zap /> ReferBolt Dashboard
            </CardTitle>
            <CardDescription className="text-center">
                Track your earnings, performance, and referral cycles.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{data.totalCommissions.toLocaleString()}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalReferrals}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Current Cycle Progress</CardTitle>
                         <div className="flex items-center space-x-2">
                            <Switch id="auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
                            <Label htmlFor="auto-renew" className="flex items-center gap-1.5"><Repeat className="w-4 h-4" /> Enable Auto-Renewal</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center gap-4">
                        <Progress value={(data.cycleProgress / data.cycleGoal) * 100} className="w-full" />
                        <span className="font-bold text-lg text-primary">{data.cycleProgress}/{data.cycleGoal}</span>
                    </div>
                    <p className="text-center mt-2 text-muted-foreground">Complete the cycle to earn a bonus and start a new one!</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Referral History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>New User</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.referralHistory && data.referralHistory.length > 0 ? data.referralHistory.map((ref: any) => (
                                <TableRow key={ref.id}>
                                    <TableCell className="font-medium">{ref.name}</TableCell>
                                    <TableCell>{new Date(ref.date).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">₹{ref.commission}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">No referral history yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </CardContent>
        <CardFooter>
             <Button variant="outline" className="w-full" onClick={handleShare}>
                <Share2 className="mr-2" />
                Share Your Referral Link
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ReferBoltPage() {
    return (
        <ProtectedRoute>
            <ReferBoltPageContent />
        </ProtectedRoute>
    );
}
