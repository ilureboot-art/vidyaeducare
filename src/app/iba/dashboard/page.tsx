
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Users, IndianRupee, Goal, Percent, ShieldCheck, ChevronRight } from "lucide-react";
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

const initialReferralData = {
  referralCode: "ALEX-IBA-5C",
  totalReferrals: 0,
  totalCommission: 0,
  dailySales: 0,
  monthlySales: 0,
  recentReferrals: []
};

const dailyTarget = 5;
const monthlyTarget = 150;

const bonusTiers = [
    { target: 60, bonus: 1 },
    { target: 70, bonus: 2 },
    { target: 80, bonus: 3 },
    { target: 90, bonus: 4 },
    { target: 100, bonus: 5 },
];

export default function IBADashboardPage() {
  const { toast } = useToast();
  const [referralData, setReferralData] = useState(initialReferralData);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    toast({
      title: "Copied!",
      description: "IBA Referral code copied to clipboard.",
    });
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/signup?ref=${referralData.referralCode}`;
    const message = `Join Vidya EduCare using my IBA code and get a special discount! 
    
Code: ${referralData.referralCode}
Join here: ${shareUrl}`;

    const fallbackCopy = () => {
      navigator.clipboard.writeText(message);
      toast({
          title: "Link Copied!",
          description: "Referral link and message copied to clipboard.",
      });
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Vidya EduCare!',
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
  
  const dailyProgress = (referralData.dailySales / dailyTarget) * 100;
  const monthlyProgress = (referralData.monthlySales / monthlyTarget) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldCheck/> IBA Dashboard</h1>
        <p className="text-muted-foreground">Your hub for tracking referrals, sales, and commissions.</p>
          
          <div className="text-center p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">Your Unique IBA Code</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-2xl font-mono p-3 bg-background rounded-md w-full max-w-xs text-center tracking-widest">{referralData.referralCode}</p>
            </div>
          </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="w-full" onClick={handleCopyToClipboard}><Copy className="mr-2" /> Copy Code</Button>
              <Button className="w-full" onClick={handleShare}><Share2 className="mr-2" /> Share Link</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center justify-center gap-2"><IndianRupee/>{referralData.totalCommission}</CardTitle>
                        <CardDescription>Total Commission</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center justify-center gap-2"><Users/>{referralData.totalReferrals}</CardTitle>
                        <CardDescription>Total Sales</CardDescription>
                    </CardHeader>
                </Card>
            </div>

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
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referralData.recentReferrals.length > 0 ? referralData.recentReferrals.map((ref: any) => (
                                <TableRow key={ref.id}>
                                    <TableCell>{ref.name}</TableCell>
                                    <TableCell>{ref.date}</TableCell>
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
