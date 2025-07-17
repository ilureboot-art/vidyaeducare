
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Zap, Share2, IndianRupee, Users, CheckCircle, Repeat } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { walletData, addTransaction } from "@/lib/user-data";
import { initialReferboltSubscription } from "@/lib/store-config";

// Mock user data for ReferBolt
const initialReferboltData = {
  isSubscribed: true,
  autoRenew: false,
  totalCommissions: 250,
  totalReferrals: 5,
  cycleProgress: 2,
  cycleGoal: 3,
  referralHistory: [
    { id: 1, name: "Charlie", date: "2024-07-28", commission: 50 },
    { id: 2, name: "Diana", date: "2024-07-29", commission: 50 },
    { id: 3, name: "Frank", date: "2024-08-01", commission: 50 },
    { id: 4, name: "Grace", date: "2024-08-02", commission: 50 },
    { id: 5, name: "Heidi", date: "2024-08-03", commission: 50 },
  ]
};

const benefits = [
    { text: "Earn a ₹50 commission for every referral who subscribes." },
    { text: "Complete a cycle with just 3 referrals." },
    { text: "Earn from both direct & indirect referrals as your network grows." },
    { text: "Get a bonus of 4 game tickets (worth 8 games) upon subscribing." },
    { text: "Unlimited earning potential through continuous cycles." },
];

export default function ReferBoltPage() {
  const { toast } = useToast();
  const [data, setData] = useState(initialReferboltData);
  const [autoRenew, setAutoRenew] = useState(data.autoRenew);

  const handleCompleteCycle = () => {
    // This is a simulation function. In a real app, this would be triggered by a backend event.
    if (autoRenew) {
      const cost = initialReferboltSubscription.price;
      if (walletData.balance < cost) {
        toast({
          variant: "destructive",
          title: "Auto-Renewal Failed",
          description: "Insufficient wallet balance to start a new cycle.",
        });
        return;
      }
      
      // 1. Deduct fee from wallet
      walletData.balance -= cost;

      // 2. Add transaction
      addTransaction({
        id: Date.now(),
        type: 'withdrawal',
        description: 'ReferBolt Auto-Renewal',
        amount: -cost,
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      });
      
      // 3. Reset cycle
      setData(prev => ({ ...prev, cycleProgress: 0, totalCommissions: prev.totalCommissions + 100 })); // Assuming a cycle completion bonus

      toast({
        title: "Cycle Complete & Renewed!",
        description: `₹${cost} has been deducted for your new cycle. Your new balance is ₹${walletData.balance.toFixed(2)}.`,
      });

    } else {
       setData(prev => ({ ...prev, cycleProgress: prev.cycleGoal }));
       toast({
        title: "Cycle Complete!",
        description: "Go to the store to manually start a new cycle.",
      });
    }
  }

  const handleShare = async () => {
    // In a real app, this code would be fetched for the logged-in user
    const referralCode = "ALEX-D7F6E5";
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const benefitsText = benefits.map(b => `- ${b.text}`).join("\n");

    const message = `🤝 Join Referbolt - India's Best Skill Gaming Platform! 🤝
🚀 Use my referral code: ${referralCode}
ReferBolt Benefits
${benefitsText}

💸 Earn real cash through referbolt
Join now: ${shareUrl}
#GuessMaster #SkillGaming #CashPrizes #ReferralBonus #Referbolt`;

    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "ReferBolt benefits message copied to clipboard.",
        });
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unlock Your Earnings with GuessMaster ReferBolt!',
          text: message,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error("Share failed, falling back to clipboard:", error);
          fallbackCopy();
        }
      }
    } else {
      fallbackCopy();
    }
  };

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
                        <p className="text-xs text-muted-foreground">+₹50 this week</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalReferrals}</div>
                         <p className="text-xs text-muted-foreground">+1 this week</p>
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
                 <CardFooter>
                    <Button onClick={handleCompleteCycle} disabled={data.cycleProgress >= data.cycleGoal} className="w-full">Simulate Cycle Completion</Button>
                 </CardFooter>
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
                            {data.referralHistory.map((ref) => (
                                <TableRow key={ref.id}>
                                    <TableCell className="font-medium">{ref.name}</TableCell>
                                    <TableCell>{ref.date}</TableCell>
                                    <TableCell className="text-right font-bold text-green-600">₹{ref.commission}</TableCell>
                                </TableRow>
                            ))}
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
