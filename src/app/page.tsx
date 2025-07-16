
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Gamepad2, Zap, HelpCircle, Trophy, Star, Sprout, LogIn, Gift, CheckCircle } from "lucide-react";
import Link from "next/link";
import { ChatWidget } from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <section className="text-center py-8">
        <h1 className="text-5xl font-bold text-primary tracking-tighter">Welcome to GuessMaster!</h1>
        <p className="text-xl text-muted-foreground mt-2">The ultimate number guessing challenge where your intuition can win you real rewards.</p>
        <div className="mt-6 flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-primary/90 hover:bg-primary">
                <Link href="/login"><LogIn className="mr-2"/> Login / Sign Up</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
                <Link href="/play?demo=true"><Sprout className="mr-2"/> Play Demo</Link>
            </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-accent" /> The Game</CardTitle>
            <CardDescription>Simple to learn, thrilling to master.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <p>Guess a secret number between 1 and 100. You have 5 attempts. With each guess, you get a hint: is the number higher or lower? The fewer attempts you take, the bigger the prize!</p>
             <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-base mb-2 text-center">GuessMaster Benefits</h3>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Win up to <span className="font-bold">₹100 on your first guess!</span></span></li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>A true test of skill, logic, and intuition.</span></li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span><span className="font-bold">Instant rewards</span> credited to your wallet.</span></li>
                </ul>
            </div>
          </CardContent>
           <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/how-to-play">Learn How to Play</Link>
                </Button>
           </CardFooter>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trophy className="text-accent" /> Leaderboard</CardTitle>
            <CardDescription>Compete and climb the ranks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
             <p>Think you're the best GuessMaster around? Prove it! Climb the ranks on our global leaderboard and claim bragging rights and exclusive rewards. Every game counts towards your total score.</p>
          </CardContent>
           <CardFooter>
             <Button asChild className="w-full">
                <Link href="/leaderboard">View Leaderboard</Link>
             </Button>
           </CardFooter>
        </Card>
      </section>
      
       <section className="grid md:grid-cols-2 gap-8 items-start">
        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="text-accent" /> Refer & Earn</CardTitle>
            <CardDescription>Invite friends, get instant rewards.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
            <p>Our simple referral program is an easy way to boost your wallet. Share your code and earn every time a friend signs up.</p>
             <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-base mb-2 text-center">Refer & Earn Benefits</h3>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>You get <span className="font-bold">₹5 for every friend</span> who joins.</span></li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Your friend gets a <span className="font-bold">₹5 welcome bonus</span>.</span></li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span><span className="font-bold">No limit</span> to how many friends you can invite.</span></li>
                </ul>
            </div>
          </CardContent>
           <CardFooter>
             <Button asChild className="w-full">
                <Link href="/refer">Get Your Referral Code</Link>
             </Button>
           </CardFooter>
        </Card>

        <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="text-accent" /> ReferBolt System</CardTitle>
            <CardDescription>Unlock continuous commissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-grow">
             <p>Activate our ReferBolt system to earn cash for every friend who joins and subscribes. Create a continuous stream of income from your network.</p>
             <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold text-base mb-2 text-center">ReferBolt Benefits</h3>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Earn a <span className="font-bold">₹50 commission</span> per subscriber.</span></li>
                    <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span><span className="font-bold">Unlimited earning potential</span> through cycles.</span></li>
                     <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0"/><span>Get <span className="font-bold">4 bonus tickets</span> upon subscribing.</span></li>
                </ul>
            </div>
          </CardContent>
           <CardFooter>
             <Button asChild className="w-full">
                <Link href="/referbolt">Learn More & Start Earning</Link>
             </Button>
           </CardFooter>
        </Card>
      </section>

      <ChatWidget />
    </div>
  );
}
