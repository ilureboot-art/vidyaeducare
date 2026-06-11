
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, Share2, Quote, User, Shield, ArrowRight, BrainCircuit, ScrollText, Sparkles, Target, Zap, Rocket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BookOpen,
    title: "Mock Tests",
    description: "Prepare for exams with our extensive library of mock tests for various subjects and standards."
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Compete on live leaderboards in mock tests and win real cash rewards for top scores."
  },
  {
    icon: Users,
    title: "Referral Programs",
    description: "Earn bonuses and continuous commissions through our simple and advanced referral systems."
  }
];

export default function HomePage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  const [trialStats, setTrialStatus] = useState({ tutor: 5, notes: 5 });

  useEffect(() => {
    // Only access localStorage on the client after mount
    if (typeof window !== 'undefined') {
        const tutorCount = parseInt(localStorage.getItem('trial_ai_tutor_count') || '0');
        const notesCount = parseInt(localStorage.getItem('trial_ai_notes_count') || '0');
        setTrialStatus({ 
            tutor: Math.max(0, 5 - tutorCount), 
            notes: Math.max(0, 5 - notesCount) 
        });
    }
  }, []);

  const handleShare = async () => {
    const url = window.location.origin;
    const message = `🎓 Check out Vidya EduCare! It's an amazing platform for mock tests and earning rewards. 
    
Start your journey to success now: ${url}`;
    
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Vidya EduCare', text: message, url });
        } else {
            throw new Error("Share not supported");
        }
    } catch(e) {
        navigator.clipboard.writeText(message);
        toast({ title: "Link Copied!", description: "Promotional message copied to clipboard." });
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full items-center p-4">
      <div className="w-full max-w-6xl mx-auto space-y-24 mb-24">
        
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left pt-8 md:pt-16">
          <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 font-bold">EDUCATION • REWARDS • AI</Badge>
              <h1 className="text-5xl lg:text-7xl font-black text-primary tracking-tighter leading-tight italic uppercase">
                Vidya <span className="text-accent">EduCare</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                Empowering students with cutting-edge AI tools and rewarding academic excellence.
              </p>
              
              {user ? (
                  <div className="pt-4">
                      <div className="p-8 bg-primary/[0.03] rounded-3xl border-2 border-dashed border-primary/20 inline-block shadow-sm">
                        <p className="text-xs font-black text-primary mb-4 flex items-center gap-2 justify-center md:justify-start uppercase tracking-widest">
                            <Shield className="w-4 h-4" /> ACTIVE {isAdmin ? 'ADMIN' : 'USER'} WORKSPACE
                        </p>
                        <Button asChild size="lg" className="px-12 py-10 text-2xl font-black shadow-2xl hover:scale-105 transition-transform rounded-2xl group">
                            <Link href={isAdmin ? "/admin/analytics" : "/profile"}>
                                ENTER DASHBOARD <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <p className="mt-6 text-sm text-muted-foreground text-center md:text-left">Signed in as <span className="text-primary font-black">{user.email}</span></p>
                      </div>
                  </div>
              ) : (
                  <div className="pt-4 flex gap-4 justify-center md:justify-start flex-wrap">
                      <Button asChild size="lg" className="px-10 py-8 text-xl font-black rounded-2xl shadow-xl">
                          <Link href="/signup">JOIN FOR FREE</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="px-10 py-8 text-xl font-black rounded-2xl border-2">
                          <Link href="/login">USER LOGIN</Link>
                      </Button>
                  </div>
              )}
          </div>
          <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl -z-10" />
              <Image 
                src="https://picsum.photos/seed/1/600/400" 
                width={600} 
                height={400} 
                alt="Students" 
                className="rounded-3xl shadow-2xl border-4 border-white" 
                data-ai-hint="students learning" 
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl border border-muted hidden md:block animate-in slide-in-from-right-4 duration-1000">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><Trophy size={20}/></div>
                      <div>
                          <p className="text-xs font-black uppercase text-muted-foreground">Highest Prize Won</p>
                          <p className="text-xl font-black text-primary">₹250.00</p>
                      </div>
                  </div>
              </div>
          </div>
        </section>

        {/* --- SEPARATE TRIAL MODULES --- */}
        
        {/* Trial Module 1: AI Tutor */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-accent/5 p-8 md:p-16 rounded-[3rem] border border-accent/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><BrainCircuit size={200}/></div>
            <div className="space-y-6 relative z-10">
                <Badge variant="secondary" className="bg-accent/10 text-accent border-none uppercase font-black tracking-widest px-4 py-1">Free Trial Tool #1</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter italic">AI DOUBT <span className="text-accent">SOLVER</span></h2>
                <p className="text-lg text-muted-foreground font-medium">
                    Stuck on a concept? Ask our AI tutor anything from Science to History and get a clear, step-by-step bilingual explanation instantly.
                </p>
                <div className="flex items-center gap-2">
                    <Badge className="bg-accent text-white font-black">{trialStats.tutor} FREE QUERIES LEFT</Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">• No Registration Required</span>
                </div>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white font-black py-8 px-10 text-lg rounded-2xl shadow-lg">
                    <Link href="/ai-tutor">TRY DOUBT SOLVER <Sparkles className="ml-2 h-5 w-5"/></Link>
                </Button>
            </div>
            <div className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-accent/20 relative group hover:-translate-y-2 transition-transform">
                <div className="bg-muted/30 rounded-2xl p-4 mb-4">
                    <p className="text-sm font-black text-accent uppercase mb-2 flex items-center gap-2"><Target size={14}/> Student Query:</p>
                    <p className="font-bold italic">"Explain why the sky looks blue in Marathi and English."</p>
                </div>
                <div className="p-4 bg-accent/5 rounded-2xl border-l-4 border-accent">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">AI Response:</p>
                    <p className="text-sm font-medium leading-relaxed">प्रकाश विखुरल्यामुळे आकाश निळे दिसते... Light scattering makes the sky appear blue because shorter wavelengths (blue) scatter more easily.</p>
                </div>
            </div>
        </section>

        {/* Trial Module 2: AI Notes */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-primary/5 p-8 md:p-16 rounded-[3rem] border border-primary/10 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 p-8 opacity-5 -rotate-12"><ScrollText size={200}/></div>
            <div className="order-2 md:order-1 bg-white rounded-3xl shadow-2xl p-8 border-2 border-primary/20 relative hover:-translate-y-2 transition-transform">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ScrollText size={24}/></div>
                    <h4 className="font-black text-primary">Concept Summary Card</h4>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-muted rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded-full w-1/2 animate-pulse" />
                    <div className="pt-4 grid grid-cols-2 gap-2">
                        <div className="h-8 bg-primary/10 rounded-lg flex items-center justify-center text-[10px] font-black text-primary uppercase">ENGLISH</div>
                        <div className="h-8 bg-accent/10 rounded-lg flex items-center justify-center text-[10px] font-black text-accent uppercase">MARATHI</div>
                    </div>
                </div>
            </div>
            <div className="order-1 md:order-2 space-y-6 relative z-10">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase font-black tracking-widest px-4 py-1">Free Trial Tool #2</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter italic">AI NOTES <span className="text-accent">GENERATOR</span></h2>
                <p className="text-lg text-muted-foreground font-medium">
                    Upload a photo of your textbook or paste a chapter. Our AI will synthesize it into structured, bilingual study notes with key bullet points.
                </p>
                <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-white font-black">{trialStats.notes} FREE PAGES LEFT</Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">• No Registration Required</span>
                </div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-black py-8 px-10 text-lg rounded-2xl shadow-lg">
                    <Link href="/ai-notes">GENERATE STUDY NOTES <Zap className="ml-2 h-5 w-5"/></Link>
                </Button>
            </div>
        </section>

        {/* Trial Module 3: Mock Test */}
        <section className="relative py-16 px-8 md:px-16 rounded-[4rem] bg-gradient-to-br from-primary to-indigo-900 shadow-2xl overflow-hidden text-center">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-45"><Trophy size={200} className="text-white"/></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-6 py-2 text-sm font-black tracking-widest uppercase rounded-full">Trial Arena Active</Badge>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">Trial <span className="text-yellow-400">Arena</span></h2>
                <p className="text-primary-foreground/80 text-xl font-medium">
                    Experience the thrill of a real time-bound exam. Take a 5-question trial test and see where you stand on our global performance scale.
                </p>
                <div className="flex justify-center pt-4">
                    <Button asChild size="lg" className="bg-white hover:bg-yellow-400 text-primary hover:text-black font-black py-10 px-12 text-2xl rounded-3xl shadow-2xl group transition-all">
                        <Link href="/trial-mock-test" className="flex items-center gap-4">
                            START FREE TEST <Rocket className="group-hover:scale-110 transition-transform"/>
                        </Link>
                    </Button>
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No registration required • Instant Results</p>
            </div>
        </section>

        {/* Standard Features grid */}
        <section className="space-y-12">
            <div className="text-center">
                <h2 className="text-3xl font-black text-primary tracking-tighter uppercase italic">Platform Core Excellence</h2>
                <div className="h-1 bg-accent w-24 mx-auto mt-2 rounded-full" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <Card key={feature.title} className="text-center hover:shadow-2xl transition-all border-none ring-1 ring-primary/5 p-6 group hover:-translate-y-1">
                        <CardHeader className="items-center">
                            <div className="p-4 bg-primary/5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors mb-2">
                            <feature.icon className="w-10 h-10" />
                            </div>
                            <CardTitle className="text-2xl font-black text-primary">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground font-medium">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* Founder Section */}
        <section className="bg-muted/30 rounded-[3rem] p-8 md:p-20 border-2 border-dashed border-primary/10 relative overflow-hidden">
          <div className="grid md:grid-cols-3 gap-12 items-center">
            <div className="md:col-span-1">
                <div className="relative group">
                    <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image 
                        src="https://picsum.photos/seed/2/400/400" 
                        width={400} 
                        height={400} 
                        alt="Founder" 
                        className="rounded-3xl shadow-2xl mx-auto border-8 border-white relative z-10" 
                        data-ai-hint="portrait professional" 
                    />
                </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <Quote className="w-16 h-16 text-primary opacity-20" />
              <h2 className="text-4xl font-black text-primary tracking-tight leading-tight italic">
                "Education is the foundation of progress. We've built this platform to bridge the gap between effort and reward."
              </h2>
              <div className="pt-4 border-t border-primary/10">
                <p className="text-2xl font-black text-primary">Adv. Sanjay Vidya Vijay Gurav</p>
                <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.2em]">Founder & Owner, Vidya EduCare</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-accent text-white rounded-[3rem] p-12 md:p-20 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">Ready to start your <span className="text-primary">winning streak?</span></h2>
                <p className="text-accent-foreground font-bold text-xl max-w-2xl mx-auto opacity-90">Join thousands of students across the country competing and winning prizes every day.</p>
                <div className="mt-8 flex gap-6 justify-center flex-wrap">
                    <Button asChild size="lg" variant="secondary" className="px-12 py-10 text-2xl font-black shadow-2xl rounded-2xl hover:scale-105 transition-transform">
                        <Link href={user ? (isAdmin ? "/admin/analytics" : "/profile") : "/signup"}>
                            {user ? "ACCESS WORKSPACE" : "CREATE ACCOUNT"}
                        </Link>
                    </Button>
                    <Button size="lg" variant="ghost" onClick={handleShare} className="px-10 py-10 text-xl font-black rounded-2xl border-2 border-white/20 hover:bg-white/10">
                        <Share2 className="mr-3 h-6 w-6"/> SHARE APP
                    </Button>
                </div>
            </div>
        </section>
      </div>
    </main>
  );
}
