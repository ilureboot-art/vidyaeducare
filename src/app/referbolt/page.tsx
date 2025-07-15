
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Gift, Users, Zap, RefreshCw, CheckCircle } from "lucide-react";

// Mock data - in a real app, this would come from a backend
const referralData = {
  subscribed: true,
  referralCode: "REF-A1B2C3",
  autoSubscribe: false,
  currentCycleReferrals: 2,
  totalCycles: 1,
  totalEarnings: 100,
  walletBalance: 150, // Let's assume user has some balance
};

const REFERRAL_CYCLE_TARGET = 3;
const SUBSCRIPTION_COST = 100;

export default function ReferBoltPage() {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(referralData.subscribed);
  const [autoSubscribe, setAutoSubscribe] = useState(referralData.autoSubscribe);
  const [cycleProgress, setCycleProgress] = useState(referralData.currentCycleReferrals);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  };

  const handleShare = () => {
    const shareUrl = `https://guessmaster.app/join?ref=${referralData.referralCode}`;
    const message = `Use my code ${referralData.referralCode} to sign up for GuessMaster and get rewards! Plus, check out the ReferBolt system to earn even more.`;
    const fullMessage = `${message}\n${shareUrl}`;

    if (navigator.share) {
      navigator.share({
        title: 'Join me on GuessMaster!',
        text: message,
        url: shareUrl,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(fullMessage);
      toast({
        title: "Link Copied!",
        description: "ReferBolt referral link copied to clipboard.",
      });
    }
  };

  const handleSubscribe = () => {
    if (referralData.walletBalance < SUBSCRIPTION_COST) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: `You need at least ₹${SUBSCRIPTION_COST} in your wallet to subscribe.`,
        });
        return;
    }
    // Simulate subscription
    toast({
        title: "Subscribed Successfully!",
        description: `₹${SUBSCRIPTION_COST} deducted. You received 4 bonus tickets!`,
    });
    setIsSubscribed(true);
    setCycleProgress(0); // Reset progress for new cycle
  };


  const renderSubscriptionView = () => (
    <div className="text-center space-y-4">
      <Zap className="w-16 h-16 text-primary mx-auto" />
      <h2 className="text-2xl font-bold">Activate ReferBolt</h2>
      <p className="text-muted-foreground">Subscribe for just ₹{SUBSCRIPTION_COST} to start earning commissions and get bonus tickets!</p>
      <Button size="lg" onClick={handleSubscribe}>
        Subscribe Now
      </Button>
    </div>
  );

  const renderDashboardView = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="referral-code" className="text-sm font-medium">Your Referral Code</Label>
        <div className="flex items-center gap-2 mt-1">
          <p id="referral-code" className="text-lg font-mono p-2 bg-muted rounded-md w-full">{referralData.referralCode}</p>
          <Button variant="outline" size="icon" onClick={handleCopyToClipboard}><Copy className="w-4 h-4" /></Button>
          <Button size="icon" onClick={handleShare}><Share2 className="w-4 h-4" /></Button>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium">Cycle Progress</Label>
        <div className="mt-1 space-y-2">
            <Progress value={(cycleProgress / REFERRAL_CYCLE_TARGET) * 100} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
                {cycleProgress} of {REFERRAL_CYCLE_TARGET} referrals in this cycle.
            </p>
        </div>
        {cycleProgress >= REFERRAL_CYCLE_TARGET && (
            <div className="text-center mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">Cycle complete! Re-subscribe to start a new one.</p>
                <Button size="sm" className="mt-2" onClick={handleSubscribe}><RefreshCw className="mr-2"/> Re-subscribe</Button>
            </div>
        )}
      </div>
      
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
            <Label htmlFor="auto-subscribe" className="font-semibold">Auto-Subscribe</Label>
            <p className="text-xs text-muted-foreground">Automatically use wallet funds to start a new cycle.</p>
        </div>
        <Switch
            id="auto-subscribe"
            checked={autoSubscribe}
            onCheckedChange={setAutoSubscribe}
        />
      </div>

    </div>
  );

  const renderBenefits = () => (
    <div className="space-y-3">
        <h3 className="font-semibold text-lg text-center">ReferBolt Benefits</h3>
        <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Earn <span className="font-bold">₹50 commission</span> per referral (direct & indirect).</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Each cycle consists of <span className="font-bold">3 referrals</span>.</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Receive <span className="font-bold">4 bonus tickets</span> (8 games) instantly upon subscribing.</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span><span className="font-bold">Unlimited earning potential</span> with continuous cycles.</span></li>
        </ul>
    </div>
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Zap /> ReferBolt
          </CardTitle>
          <CardDescription className="text-center">
            Invite friends, earn commissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[250px] flex items-center justify-center">
          {isSubscribed ? renderDashboardView() : renderSubscriptionView()}
        </CardContent>
        <CardFooter className="flex-col !items-start gap-4">
            <div className="w-full p-4 bg-muted/50 rounded-lg">
                {renderBenefits()}
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
