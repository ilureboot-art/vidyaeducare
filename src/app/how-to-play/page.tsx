
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { List, CheckCircle, Award, Ticket, Share2, Zap, Coins, UserCheck, TrendingUp, BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HowToPlayPage() {

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">How to Learn & Earn</CardTitle>
          <CardDescription className="text-center">
            Your complete guide to becoming a master of the Vidya EduCare platform!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-lg">

         <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BrainCircuit className="text-accent" />
              What is Vidya EduCare?
            </h2>
            <p className="text-base">
              Vidya EduCare is a unique platform that blends academic preparation with skill-based earning opportunities. Our mission is to make learning not just effective, but also engaging and rewarding for students.
            </p>
          </div>
          
          <Separator />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <TrendingUp className="text-accent" />
              The Process: How It Works
            </h2>
             <ul className="list-none space-y-4 pl-0">
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center bg-primary/20 text-primary w-8 h-8 rounded-full font-bold text-lg shrink-0 mt-1">1</div>
                  <div><span className="font-bold">Learn & Prepare:</span> Take high-quality mock tests designed for your curriculum to excel in your exams.</div>
                </li>
                 <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center bg-primary/20 text-primary w-8 h-8 rounded-full font-bold text-lg shrink-0 mt-1">2</div>
                  <div><span className="font-bold">Test Your Skills:</span> Compete in live mock tests and aim for the top of the leaderboard to win cash prizes.</div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center bg-primary/20 text-primary w-8 h-8 rounded-full font-bold text-lg shrink-0 mt-1">3</div>
                  <div><span className="font-bold">Earn & Grow:</span> Build a steady income stream through our lucrative referral programs.</div>
                </li>
            </ul>
          </div>
          
          <Separator />

           <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <UserCheck className="text-accent" />
              Core Benefits
            </h2>
             <ul className="list-disc list-inside space-y-2 pl-4 text-base">
                <li><span className="font-semibold">For Students:</span> A fun way to study, test your knowledge, and earn real rewards for your skills.</li>
                <li><span className="font-semibold">For Parents:</span> A productive and engaging platform for your children that encourages learning and critical thinking.</li>
                <li><span className="font-semibold">For Associates:</span> A zero-investment business opportunity to earn commissions by helping students succeed.</li>
            </ul>
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Share2 className="text-accent" />
              Referral Programs
            </h2>
            <p>
              Increase your earnings by inviting friends to the platform. We offer multiple ways to earn through referrals.
            </p>
             <ul className="list-disc list-inside space-y-2 pl-4">
                <li><span className="font-bold">IBA Program:</span> Become an Independent Business Associate (IBA) to earn commissions when your friends subscribe to mock tests.</li>
                <li><Link href="/iba/dashboard"><Button variant="link" className="p-0 text-lg">Go to IBA Dashboard →</Button></Link></li>
                 <li className="pt-2"><span className="font-bold">ReferBolt System:</span> Our premium subscription that lets you earn commissions from a wider network of referrals for continuous income.</li>
                 <li><Link href="/referbolt"><Button variant="link" className="p-0 text-lg">Learn about ReferBolt →</Button></Link></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
