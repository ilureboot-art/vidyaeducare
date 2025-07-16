
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Zap, Share2 } from "lucide-react";
import Link from "next/link";

export default function ReferBoltPage() {
  const { toast } = useToast();

  const handleSimulateReferral = () => {
    toast({
      title: "Commission Earned!",
      description: "You've earned ₹50 commission from a new subscriber in your network!",
    });
  };

  const handleShare = async () => {
    // In a real app, this code would be fetched for the logged-in user
    const referralCode = "ALEX-D7F6E5";
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    const benefits = [
        "Earn a ₹50 commission for every referral who subscribes.",
        "Complete a cycle with just 3 referrals.",
        "Earn from both direct & indirect referrals as your network grows.",
        "Get a bonus of 4 game tickets (8 games worth ₹100/-) upon subscribing.",
        "Unlimited earning potential through continuous cycles."
    ].join("\n- ");

    const message = `🤝 Join Referbolt - India's Best Skill Gaming Platform! 🤝
🚀 Use my referral code: ${referralCode}
ReferBolt Benefits
- ${benefits}

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
        // Fallback to clipboard if share API fails
        // This can happen if the user denies permission or if the API is not supported
        console.error("Share failed, falling back to clipboard:", error);
        fallbackCopy();
      }
    } else {
      // Fallback for browsers that do not support the Share API
      fallbackCopy();
    }
  };

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
                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Earn a <span className="font-bold">₹50 commission</span> for every referral who subscribes.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Complete a cycle with just <span className="font-bold">3 referrals</span>.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Earn from both <span className="font-bold">direct & indirect referrals</span> as your network grows.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Get a bonus of <span className="font-bold">4 game tickets</span> (worth 8 games) upon subscribing.</span></li>
                <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span><span className="font-bold">Unlimited earning potential</span> through continuous cycles.</span></li>
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
            <Button variant="secondary" className="w-full" onClick={handleSimulateReferral}>
                Simulate Referral Commission
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
