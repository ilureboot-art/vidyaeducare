
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, CheckCircle, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
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

      <section className="space-y-8">
        <div className="text-center">
            <h2 className="text-3xl font-bold">Why Choose Vidya EduCare?</h2>
            <p className="text-muted-foreground mt-2">Features designed for your success.</p>
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
                    <p>Climb the leaderboard, earn badges, and win cash rewards for top performance. Excellence deserves recognition.</p>
                </CardContent>
            </Card>
             <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <div className="bg-accent/20 p-3 rounded-full"><Users className="w-6 h-6 text-accent-foreground" /></div>
                        IBA Partner Program
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Join as an Independent Business Associate (IBA) to sell our mock test products and earn attractive commissions.</p>
                </CardContent>
            </Card>
        </div>
      </section>

    </div>
  );
}
