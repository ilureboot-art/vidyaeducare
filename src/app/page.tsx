
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2, Zap, HelpCircle, Trophy, Star, Sprout } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ChatWidget } from "@/components/ChatWidget";

export default function HomePage() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <section className="text-center py-8">
        <h1 className="text-5xl font-bold text-primary tracking-tighter">Welcome to NumberAce!</h1>
        <p className="text-xl text-muted-foreground mt-2">The ultimate number guessing challenge where your intuition can win you real rewards.</p>
        <div className="mt-6 flex gap-4 justify-center">
            <Button asChild size="lg">
                <Link href="/play"><Star className="mr-2"/> Play Now</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
                 <Link href="/how-to-play"><HelpCircle className="mr-2"/> How to Play</Link>
            </Button>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gamepad2 className="text-accent" /> The Game</CardTitle>
            <CardDescription>Simple to learn, thrilling to master.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image 
                src="https://placehold.co/600x400.png"
                alt="NumberAce game screenshot"
                width={600}
                height={400}
                className="rounded-md"
                data-ai-hint="gameplay abstract"
            />
            <p>Guess a secret number between 1 and 100. You have 5 attempts. With each guess, you get a hint: is the number higher or lower? The fewer attempts you take, the bigger the prize!</p>
            <div className="flex gap-4">
                <Button asChild className="w-full">
                    <Link href="/play?start=true"><Star className="mr-2"/> Play Real Game</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/play?demo=true"><Sprout className="mr-2"/> Play Demo</Link>
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="text-accent" /> ReferBolt System</CardTitle>
            <CardDescription>Invite friends, earn commissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image 
                src="https://placehold.co/600x400.png"
                alt="Referral network graphic"
                width={600}
                height={400}
                className="rounded-md"
                data-ai-hint="social network"
            />
            <p>Activate our ReferBolt system to earn cash for every friend who joins and subscribes. With our unique cycle system, you can earn from both direct and indirect referrals, creating a continuous stream of income.</p>
             <Button asChild className="w-full">
                <Link href="/referbolt">Learn More & Start Earning</Link>
             </Button>
          </CardContent>
        </Card>
      </section>
      
       <section>
          <Card>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6 items-center">
                 <div>
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-2"><Trophy /> Compete on the Leaderboard!</h3>
                    <p className="text-muted-foreground mt-2">Think you're the best NumberAce around? Prove it! Climb the ranks on our global leaderboard and claim bragging rights and exclusive rewards. Every game counts towards your total score.</p>
                     <Button asChild className="mt-4">
                        <Link href="/leaderboard">View Leaderboard</Link>
                     </Button>
                 </div>
                 <div className="flex justify-center">
                    <Image 
                        src="https://placehold.co/600x400.png"
                        alt="Trophy and leaderboard"
                        width={300}
                        height={200}
                        className="rounded-md"
                        data-ai-hint="trophy leaderboard"
                     />
                 </div>
            </CardContent>
          </Card>
      </section>
      <ChatWidget />
    </div>
  );
}
