
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, CheckCircle, Award, Ticket, Share2, Zap, Coins, UserCheck, TrendingUp, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoreConfig, type GameSettings } from "@/lib/store-config";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

export default function HowToPlayPage() {
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const config = getStoreConfig();
    setGameSettings(config.gameSettings);
  }, []);

  if (!isClient || !gameSettings) {
    return null; // or a loading spinner
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">How to Play & Earn</CardTitle>
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
              Vidya EduCare is a unique platform that blends academic preparation with skill-based gaming. Our mission is to make learning not just effective, but also engaging and rewarding for students.
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
                  <div><span className="font-bold">Play & Sharpen Skills:</span> Engage in fun, skill-based games like GuessMaster to test your logic and win coins.</div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="flex items-center justify-center bg-primary/20 text-primary w-8 h-8 rounded-full font-bold text-lg shrink-0 mt-1">3</div>
                  <div><span className="font-bold">Earn & Grow:</span> Win cash prizes for top performance and build a steady income stream through our referral programs.</div>
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
              <List className="text-accent" />
              The Basics: GuessMaster Game
            </h2>
            <p>
              GuessMaster is a simple number guessing game. The goal is to guess a secret number between <Badge>1</Badge> and <Badge>100</Badge>. You have a limited number of attempts to guess the correct number.
            </p>
             <ul className="list-disc list-inside space-y-2 pl-4">
              <li>You have <Badge variant="secondary">{gameSettings.maxAttempts}</Badge> attempts per game.</li>
              <li>Enter your guess in the input box and click "Guess".</li>
              <li>After each guess, you'll get a hint: <Badge variant="outline">higher</Badge> or <Badge variant="outline">lower</Badge>.</li>
              <li>Use the hints to narrow down the possible numbers.</li>
            </ul>
          </div>
          
           <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Ticket className="text-accent" />
              Free Gameplay
            </h2>
             <ul className="list-disc list-inside space-y-2 pl-4">
               <li>The GuessMaster game is completely free to play!</li>
               <li>You can play as many times as you want to practice and win coins.</li>
            </ul>
          </div>


          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Award className="text-accent" />
              Winning & Rewards
            </h2>
            <span>
              You win the game by guessing the secret number within your {gameSettings.maxAttempts} attempts. The faster you guess, the more coins you win!
            </span>
            <ul className="list-disc list-inside space-y-2 pl-4">
              {gameSettings.rewards.map((reward, index) => (
                <li key={index}><span className="font-bold">{index + 1}{index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'} Attempt:</span> <span className="font-semibold text-primary flex items-center gap-1">{reward} <Coins size={16} /></span></li>
              ))}
            </ul>
          </div>
          
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

    