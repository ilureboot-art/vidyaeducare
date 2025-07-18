
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, CheckCircle, GraduationCap, Gamepad2, IndianRupee, Star, Share2, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { initialReferralBonus } from "@/lib/store-config";

export default function HomePage() {
  const { toast } = useToast();

  const handleShare = async (type: 'vidya-educare' | 'game' | 'referral' | 'referbolt') => {
    let message = '';
    let url = window.location.origin;
    const referralCode = "ALEX-D7F6E5C"; // Example code

    switch (type) {
      case 'vidya-educare':
        url = `${window.location.origin}/signup?ref=${referralCode}`;
        message = `🎓 Check out Vidya EduCare! It's an amazing platform for mock tests and AI-powered learning. Use my code ${referralCode} to get a bonus when you join!\nStart learning: ${url}`;
        break;
      case 'game':
        url = `${window.location.origin}/signup?ref=${referralCode}`;
        message = `🎮 Join GuessMaster - India's Best Skill Gaming Platform! 🎮\n🚀 Use my referral code: ${referralCode}\n💰 Get ₹${initialReferralBonus} instant bonus on signup\n🎯 Play exciting skill-based number guessing games and win real cash!\nJoin now: ${url}`;
        break;
      case 'referral':
         url = `${window.location.origin}/signup?ref=${referralCode}`;
        message = `💰 Easy money! Join Vidya EduCare using my referral code and we both get a bonus: ${referralCode}\nSign up here: ${url}`;
        break;
      case 'referbolt':
         url = `${window.location.origin}/referbolt`;
        message = `⚡️ Supercharge your earnings with ReferBolt! Earn continuous commissions from your network. Use my code ${referralCode} to get started!\nLearn more: ${url}`;
        break;
    }
    
    const fallbackCopy = () => {
        navigator.clipboard.writeText(message);
        toast({
            title: "Link Copied!",
            description: "Promotional message copied to clipboard.",
        });
    };

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Vidya EduCare!', text: message, url });
      } catch (error) {
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-20">
      
      {/* Vidya EduCare Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
        <div>
            <h1 className="text-5xl font-bold text-primary tracking-tighter">Welcome to Vidya EduCare!</h1>
            <p className="text-xl text-muted-foreground mt-4">Your platform for mastering academic mock tests and achieving excellence.</p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start flex-wrap">
                <Button asChild size="lg">
                    <Link href="/login"><LogIn className="mr-2"/> Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                    <Link href="/mock-test"><BookOpen className="mr-2"/> Take a Mock Test</Link>
                </Button>
                 <Button size="lg" variant="outline" onClick={() => handleShare('vidya-educare')}>
                  <Share2 className="mr-2"/> Share App
                </Button>
            </div>
        </div>
        <div>
            <Image src="https://placehold.co/600x400.png" width={600} height={400} alt="Students learning" className="rounded-lg shadow-xl" data-ai-hint="students learning" />
        </div>
      </section>
      
      {/* Separator */}
       <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-gray-300" />
        </div>
        <div className="relative flex justify-center">
            <span className="bg-background px-4 text-muted-foreground">
                <Star />
            </span>
        </div>
      </div>


      {/* GuessMaster Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
         <div className="order-last md:order-first">
            <Image src="https://placehold.co/600x400.png" width={600} height={400} alt="Fun number game" className="rounded-lg shadow-xl" data-ai-hint="number game" />
        </div>
        <div>
            <h1 className="text-5xl font-bold text-accent tracking-tighter">Play GuessMaster!</h1>
            <p className="text-xl text-muted-foreground mt-4">Test your skills, guess the number, and win real cash prizes!</p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start flex-wrap">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href="/play"><Gamepad2 className="mr-2"/> Play Now</Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => handleShare('game')}>
                  <Share2 className="mr-2"/> Share Game
                </Button>
            </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold">Referral Programs</h2>
            <p className="text-muted-foreground mt-2">Earn rewards by sharing the app with your friends and network.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-primary/20 p-3 rounded-full"><IndianRupee className="w-6 h-6 text-primary" /></div>
                        Refer & Earn
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Share your referral code with friends. When they sign up, you both receive a cash bonus in your wallet!</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="secondary" onClick={() => handleShare('referral')}>
                    <Share2 className="mr-2"/> Share & Earn Now
                  </Button>
                </CardFooter>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-primary/20 p-3 rounded-full"><Zap className="w-6 h-6 text-primary" /></div>
                       ReferBolt System
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Join our premium referral program to earn continuous commissions from your network in cycles. Unlimited earning potential!</p>
                </CardContent>
                 <CardFooter>
                  <Button className="w-full" variant="secondary" onClick={() => handleShare('referbolt')}>
                    <Share2 className="mr-2"/> Share ReferBolt Benefits
                  </Button>
                </CardFooter>
            </Card>
        </div>
      </section>

    </div>
  );
}
