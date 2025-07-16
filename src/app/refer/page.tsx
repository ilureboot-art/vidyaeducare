
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, CheckCircle, Gift } from "lucide-react";

// Mock data - in a real app, this would come from a backend
const referralData = {
  referralCode: "ALEX-D7F6E5",
  referralBonus: 5,
  welcomeBonus: 5,
};

export default function ReferPage() {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
  };

  const handleShare = async () => {
    const shareUrl = `https://guessmaster.app/join?ref=${referralData.referralCode}`;
    const benefits = [
        `You get ₹${referralData.referralBonus} for every friend who joins.`,
        `Your friend gets a ₹${referralData.welcomeBonus} welcome bonus.`,
        `There's no limit to how many friends you can invite!`
    ].join('\n- ');

    const message = `Join me on GuessMaster and get rewarded!\n\nHere are the benefits:\n- ${benefits}\n\nUse my code when you sign up: ${referralData.referralCode}`;
    const fullMessage = `${message}\n\nJoin here: ${shareUrl}`;

    const fallbackCopy = () => {
      navigator.clipboard.writeText(fullMessage);
      toast({
          title: "Link Copied!",
          description: "Referral link and message copied to clipboard.",
      });
    };

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on GuessMaster!',
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

  const renderDashboardView = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-center">Your Unique Referral Code</h3>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-2xl font-mono p-3 bg-muted rounded-md w-full text-center tracking-widest">{referralData.referralCode}</p>
        </div>
      </div>
       <div className="flex items-center gap-2">
          <Button variant="outline" className="w-full" onClick={handleCopyToClipboard}><Copy className="w-4 h-4" /> Copy Code</Button>
          <Button className="w-full" onClick={handleShare}><Share2 className="w-4 h-4" /> Share Link</Button>
        </div>
    </div>
  );

  const renderBenefits = () => (
    <div className="space-y-3">
        <h3 className="font-semibold text-lg text-center">Referral Benefits</h3>
        <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>You get <span className="font-bold">₹{referralData.referralBonus}</span> for every friend who joins.</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Your friend gets a <span className="font-bold">₹{referralData.welcomeBonus} welcome bonus</span>.</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>There's no limit to how many friends you can invite!</span></li>
        </ul>
    </div>
  )

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Gift /> Refer & Earn
          </CardTitle>
          <CardDescription className="text-center">
            Invite friends and you both get rewarded!
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[150px] flex items-center justify-center">
          {renderDashboardView()}
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
