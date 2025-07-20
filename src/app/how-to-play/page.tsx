
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { List, CheckCircle, Award, Ticket, Share2, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
              <li>You start with <Badge variant="secondary">5</Badge> attempts per game.</li>
              <li>Enter your guess in the input box and click "Guess".</li>
              <li>After each guess, you'll get a hint: <Badge variant="outline">higher</Badge> or <Badge variant="outline">lower</Badge>.</li>
              <li>Use the hints to narrow down the possible numbers.</li>
            </ul>
          </div>
          
           <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Ticket className="text-accent" />
              Tickets & Gameplay
            </h2>
             <ul className="list-disc list-inside space-y-2 pl-4">
               <li>Each game session requires one <Badge variant="secondary">Game Play</Badge>.</li>
               <li>Every <Badge>Ticket</Badge> you own gives you <Badge>2 Game Plays</Badge>.</li>
               <li>You can purchase more tickets from the <Button variant="link" asChild className="p-0 text-lg"><Link href="/store">Store</Link></Button>.</li>
                <li>You can play a <Button variant="link" asChild className="p-0 text-lg"><Link href="/play?mode=demo">Demo Game</Link></Button> anytime to practice without using your tickets.</li>
            </ul>
          </div>


          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Award className="text-accent" />
              Winning & Rewards
            </h2>
            <span>
              You win the game by guessing the secret number within your 5 attempts. The faster you guess, the higher your reward!
            </span>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><span className="font-bold">1st Attempt:</span> ₹100</li>
              <li><span className="font-bold">2nd Attempt:</span> ₹75</li>
              <li><span className="font-bold">3rd Attempt:</span> ₹50</li>
              <li><span className="font-bold">4th Attempt:</span> ₹25</li>
              <li><span className="font-bold">5th Attempt:</span> ₹15</li>
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
