
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, CheckCircle, GraduationCap, Gamepad2, IndianRupee, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-20">
      
      {/* Vidya EduCare Section */}
      <section className="grid md:grid-cols-2 gap-8 items-center text-center md:text-left">
        <div>
            <h1 className="text-5xl font-bold text-primary tracking-tighter">Welcome to Vidya EduCare!</h1>
            <p className="text-xl text-muted-foreground mt-4">Your platform for mastering academic mock tests and achieving excellence.</p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start flex-wrap">
                <Button asChild size="lg" className="bg-primary/90 hover:bg-primary">
                    <Link href="/login"><LogIn className="mr-2"/> Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                    <Link href="/mock-test"><BookOpen className="mr-2"/> Take a Mock Test</Link>
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
                <Button asChild size="lg" variant="secondary">
                     <Link href="/play?mode=demo">Play Demo Game</Link>
                </Button>
            </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold">Why Choose Our Platform?</h2>
            <p className="text-muted-foreground mt-2">A unique blend of education and skill-based gaming.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-accent/20 p-3 rounded-full"><GraduationCap className="w-6 h-6 text-accent-foreground" /></div>
                        Live Mock Tests
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Experience real exam scenarios with timed mock tests designed as per the latest syllabus for SSC, CBSE, and other boards.</p>
                </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-accent/20 p-3 rounded-full"><Trophy className="w-6 h-6 text-accent-foreground" /></div>
                       Compete & Win
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Climb the leaderboard in both mock tests and skill games. Earn badges and win cash rewards for top performance.</p>
                </CardContent>
            </Card>
             <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-accent/20 p-3 rounded-full"><Users className="w-6 h-6 text-accent-foreground" /></div>
                        Referral Programs
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Join as an Independent Business Associate (IBA) or use our ReferBolt system to earn attractive commissions.</p>
                </CardContent>
            </Card>
        </div>
      </section>

    </div>
  );
}
