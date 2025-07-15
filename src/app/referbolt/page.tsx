
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Zap } from "lucide-react";
import Link from "next/link";

export default function ReferBoltPage() {
  const { toast } = useToast();

  const handleSimulateReferral = () => {
    toast({
      title: "Commission Earned!",
      description: "You've earned ₹50 commission from a new subscriber in your network!",
    });
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
          <ul className="space-y-2 text-sm p-4 bg-muted/50 rounded-lg">
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Earn a <span className="font-bold">₹50 commission</span> for every direct referral who subscribes.</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Unlock multi-level commissions as your network grows.</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Requires a one-time subscription to activate.</span></li>
          </ul>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <Button asChild className="w-full">
                <Link href="/store">Subscribe to ReferBolt Now</Link>
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleSimulateReferral}>
                Simulate Referral Commission
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
