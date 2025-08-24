
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, CheckCircle, Award, Ticket, Share2, Zap, Coins } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { storeConfig } from "@/lib/store-config";

export default function HowToPlayPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">How to Play & Earn</CardTitle>
          <CardDescription className="text-center">
            Your complete guide to becoming a master of the platform!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 text-lg">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <List className="text-accent" />
              The Basics: GuessMaster Game
            </h2>
            <p>
              GuessMaster is a simple number guessing game. The goal is to guess a secret number between <Badge>1</Badge> and <Badge>100</Badge>. You have a limited number of attempts to guess the correct number.
            </p>
             <ul className="list-disc list-inside space-y-2 pl-4">
              <li>You have <Badge variant="secondary">{storeConfig.gameSettings.maxAttempts}</Badge> attempts per game.</li>
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
              You win the game by guessing the secret number within your {storeConfig.gameSettings.maxAttempts} attempts. The faster you guess, the more coins you win!
            </span>
            <ul className="list-disc list-inside space-y-2 pl-4">
              {storeConfig.gameSettings.rewards.map((reward, index) => (
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
