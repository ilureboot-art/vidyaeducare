"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, Share2, Quote, User, Shield, ArrowRight, BrainCircuit, ScrollText, Sparkles, Target, Zap, Rocket, ChevronRight, CheckCircle2, HelpCircle, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: BookOpen,
    title: "MockArena",
    description: "Prepare for exams with our extensive library of MockArena practice sets for various subjects and standards."
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description: "Compete on live leaderboards in MockArena sessions and win real cash rewards for top scores."
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
    const faqUrl = `${url}#faq`;
    const message = `🚀 Ace your academic goals & Earn with Vidya EduCare! 📚

I'm using this elite platform to prepare for success. Here's why you should join:

🏆 MockArena & Quiz Clash: Win REAL cash prizes in live tests!
- MockArena Rewards: Get paid for excellence! Top 5 scorers with 80%+ accuracy win real cash.
- Quiz Clash: Compete in live high-stakes tournaments for rewards.

🤖 Vidya AI Doubt Solver: Your 24/7 personal bilingual tutor for instant clarity.
📝 QuickNotes: Transform textbook chapters into study notes instantly.

💰 Diverse Earning Opportunities:
🤝 IBA Program: Start your zero-investment business earning 10% lifetime commissions!
⚡ ReferBolt System: Unlock powerful passive income cycles.
🎁 Refer & Earn: Every referral gets an instant ₹5 wallet bonus!

Start your journey here: ${url}
Learn more in our FAQ: ${faqUrl}

#VidyaEduCare #AcademicExcellence #IBA #PassiveIncome`;
    
    try {
        if (navigator.share) {
            await navigator.share({ title: 'Vidya EduCare', text: message, url });
        } else {
            throw new Error("Share not supported");
        }
    } catch(e) {
        navigator.clipboard.writeText(message);
        toast({ title: "Link Copied!", description: "High-impact share message copied to clipboard." });
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full items-center p-4">
      <div className="w-full max-w-6xl mx-auto space-y-24 mb-24">
        
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left pt-8 md:pt-16">
          <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-4 py-1 font-bold uppercase">ENROLLMENT OPEN • AI-POWERED LEARNING</Badge>
              <h1 className="text-5xl lg:text-7xl font-black text-primary tracking-tighter leading-tight italic uppercase">
                Vidya <span className="text-accent">EduCare</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                Empowering students with cutting-edge AI tools and rewarding academic excellence with real-time prizes.
              </p>
              
              {user ? (
                  <div className="pt-4">
                      <div className="p-8 bg-primary/[0.03] rounded-3xl border-2 border-dashed border-primary/20 inline-block shadow-sm">
                        <p className="text-xs font-black text-primary mb-4 flex items-center gap-2 justify-center md:justify-start uppercase tracking-widest">
                            <Shield className="w-4 h-4" /> ACTIVE {isAdmin ? 'ADMIN' : 'STUDENT'} WORKSPACE
                        </p>
                        <Button asChild size="lg" className="px-12 py-10 text-2xl font-black shadow-2xl hover:scale-105 transition-transform rounded-2xl group">
                            <Link href={isAdmin ? "/admin/analytics" : "/profile"}>
                                ENTER DASHBOARD <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </Button>
                        <p className="mt-6 text-sm text-muted-foreground text-center md:text-left font-medium">Account: <span className="text-primary font-black">{user.email}</span></p>
                      </div>
                  </div>
              ) : (
                  <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Button asChild size="lg" className="px-12 py-10 text-2xl font-black rounded-[2rem] shadow-xl hover:scale-105 transition-all group">
                          <Link href="/signup">
                            JOIN FOR FREE <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform"/>
                          </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="px-12 py-10 text-2xl font-black rounded-[2rem] border-2 hover:bg-primary/5 transition-all">
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
                className="rounded-[3rem] shadow-2xl border-4 border-white relative z-10" 
                data-ai-hint="students learning" 
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-2xl border border-muted hidden md:block animate-in slide-in-from-right-4 duration-1000 z-20">
                  <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-inner"><Trophy size={24}/></div>
                      <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Prize Pool</p>
                          <p className="text-2xl font-black text-primary">₹2,500.00+</p>
                      </div>
                  </div>
              </div>
          </div>
        </section>

        {/* Live Status Bar */}
        <div className="bg-primary p-4 rounded-full flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 shadow-xl border border-white/20">
            <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 fill-white text-primary" />
                <span className="text-xs font-black uppercase tracking-widest">Bilingual AI Ready</span>
            </div>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 fill-white text-primary" />
                <span className="text-xs font-black uppercase tracking-widest">Secure Payments Active</span>
            </div>
            <div className="w-px h-4 bg-white/20 hidden md:block" />
            <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 fill-white text-primary" />
                <span className="text-xs font-black uppercase tracking-widest">24/7 Academic Support</span>
            </div>
        </div>

        {/* Trial Module 1: AI Doubt Solver */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-accent/5 p-8 md:p-16 rounded-[4rem] border border-accent/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><BrainCircuit size={250}/></div>
            <div className="space-y-6 relative z-10">
                <Badge variant="secondary" className="bg-accent/10 text-accent border-none uppercase font-black tracking-widest px-4 py-1">Free Trial Tool #1</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter italic uppercase">VIDYA <span className="text-accent">AI DOUBT SOLVER</span></h2>
                <p className="text-lg text-muted-foreground font-medium">
                    Stuck on a complex concept? Ask our Vidya AI tutor anything and get a clear, step-by-step pedagogical explanation in both Marathi and English instantly.
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <div className="px-4 py-2 bg-accent text-white font-black rounded-xl shadow-lg animate-pulse">{trialStats.tutor} QUERIES LEFT</div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">• Zero Registration</span>
                </div>
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white font-black py-10 px-12 text-xl rounded-[2rem] shadow-xl mt-4">
                    <Link href="/ai-tutor">TRY AI SOLVER NOW <Sparkles className="ml-2 h-6 w-6"/></Link>
                </Button>
            </div>
            <div className="bg-white rounded-[3rem] shadow-2xl p-8 border-2 border-accent/20 relative group hover:-translate-y-2 transition-transform">
                <div className="bg-muted/30 rounded-2xl p-6 mb-4">
                    <p className="text-xs font-black text-accent uppercase mb-3 flex items-center gap-2 tracking-widest"><Target size={14}/> Student Query:</p>
                    <p className="text-lg font-bold italic">"Explain the concept of Gravitation in simple Marathi."</p>
                </div>
                <div className="p-6 bg-accent/5 rounded-2xl border-l-8 border-accent">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">Vidya AI Bilingual Output:</p>
                    <p className="text-md font-medium leading-relaxed">गुरुत्वाकर्षण ही एक अशी शक्ती आहे जी विश्वातील कोणत्याही दोन वस्तूंना एकमेकांकडे आकर्षित करते... Gravitation is a force that attracts any two objects with mass.</p>
                </div>
            </div>
        </section>

        {/* Trial Module 2: QuickNotes */}
        <section className="grid md:grid-cols-2 gap-12 items-center bg-primary/5 p-8 md:p-16 rounded-[4rem] border border-primary/10 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 p-8 opacity-5 -rotate-12"><ScrollText size={250}/></div>
            <div className="order-2 md:order-1 bg-white rounded-[3rem] shadow-2xl p-10 border-2 border-primary/20 relative hover:-translate-y-2 transition-transform">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><ScrollText size={32}/></div>
                    <h4 className="font-black text-primary text-xl">Auto-Synopsis Card</h4>
                </div>
                <div className="space-y-4">
                    <div className="h-4 bg-muted rounded-full w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted rounded-full w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded-full w-1/2 animate-pulse" />
                    <div className="pt-6 grid grid-cols-2 gap-3">
                        <div className="h-10 bg-primary/10 rounded-xl flex items-center justify-center text-[10px] font-black text-primary uppercase tracking-widest border border-primary/20">BILINGUAL</div>
                        <div className="h-10 bg-accent/10 rounded-xl flex items-center justify-center text-[10px] font-black text-accent uppercase tracking-widest border border-accent/20">FORMATTED</div>
                    </div>
                </div>
            </div>
            <div className="order-1 md:order-2 space-y-6 relative z-10">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none uppercase font-black tracking-widest px-4 py-1">Free Trial Tool #2</Badge>
                <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter italic uppercase">VIDYA <span className="text-accent">QUICKNOTES</span></h2>
                <p className="text-lg text-muted-foreground font-medium">
                    Upload a photo of your textbook or paste a chapter. QuickNotes will synthesize the complex material into structured, easy-to-read bilingual study notes.
                </p>
                <div className="flex items-center gap-3 pt-2">
                    <div className="px-4 py-2 bg-primary text-white font-black rounded-xl shadow-lg">{trialStats.notes} FREE PAGES LEFT</div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">• Instant Summary</span>
                </div>
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-black py-10 px-12 text-xl rounded-[2rem] shadow-xl mt-4">
                    <Link href="/ai-notes">USE QUICKNOTES <Zap className="ml-2 h-6 w-6"/></Link>
                </Button>
            </div>
        </section>

        {/* Trial Module 3: MockArena */}
        <section className="relative py-16 px-8 md:px-16 rounded-[4rem] bg-gradient-to-br from-primary to-indigo-900 shadow-2xl overflow-hidden text-center border-b-8 border-accent">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-45"><Trophy size={300} className="text-white"/></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
                <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-8 py-2 text-sm font-black tracking-[0.3em] uppercase rounded-full">TRIAL ARENA ACTIVE</Badge>
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-none">Mock<span className="text-yellow-400">Arena</span></h2>
                <p className="text-primary-foreground/90 text-xl font-medium leading-relaxed">
                    Experience the thrill of a real time-bound exam environment. Take a 5-question quick test and see your instant global ranking.
                </p>
                <div className="flex justify-center pt-4">
                    <Button asChild size="lg" className="bg-white hover:bg-yellow-400 text-primary hover:text-black font-black py-12 px-16 text-3xl rounded-[3rem] shadow-2xl group transition-all transform hover:scale-105 border-none">
                        <Link href="/trial-mock-test" className="flex items-center gap-6">
                            START FREE TEST <Rocket size={32} className="group-hover:scale-125 transition-transform group-hover:rotate-12"/>
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center justify-center gap-4 text-white/50 text-[10px] font-black uppercase tracking-widest pt-4">
                    <span>• NO SIGNUP NEEDED</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>• REAL-TIME RESULTS</span>
                    <span className="w-1 h-1 bg-white/20 rounded-full" />
                    <span>• GLOBAL RANKING</span>
                </div>
            </div>
        </section>

        {/* Standard Features grid */}
        <section className="space-y-12">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Platform Core Excellence</h2>
                <p className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase">Designed for Indian Academic Success</p>
                <div className="h-1.5 bg-accent w-32 mx-auto mt-4 rounded-full shadow-sm" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <Card key={feature.title} className="text-center hover:shadow-2xl transition-all border-none ring-1 ring-primary/10 p-8 group hover:-translate-y-2 rounded-[2.5rem] bg-card">
                        <CardHeader className="items-center pb-2">
                            <div className="p-5 bg-primary/5 rounded-[2rem] group-hover:bg-primary group-hover:text-white transition-all mb-4 shadow-inner">
                            <feature.icon className="w-12 h-12" />
                            </div>
                            <CardTitle className="text-3xl font-black text-primary tracking-tight">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground font-medium text-lg leading-relaxed">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* Founder Section */}
        <section className="bg-muted/30 rounded-[4rem] p-10 md:p-24 border-2 border-dashed border-primary/20 relative overflow-hidden shadow-inner">
          <div className="grid md:grid-cols-3 gap-16 items-center">
            <div className="md:col-span-1">
                <div className="relative group">
                    <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Image 
                        src="https://picsum.photos/seed/2/400/400" 
                        width={400} 
                        height={400} 
                        alt="Founder" 
                        className="rounded-[3rem] shadow-2xl mx-auto border-8 border-white relative z-10 group-hover:scale-[1.02] transition-transform" 
                        data-ai-hint="portrait professional" 
                    />
                </div>
            </div>
            <div className="md:col-span-2 space-y-8">
              <Quote className="w-20 h-20 text-primary opacity-10" />
              <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-tight italic">
                &quot;Our mission is to democratize elite academic coaching and bridge the gap between academic effort and financial reward.&quot;
              </h2>
              <div className="pt-6 border-t-4 border-primary/5">
                <p className="text-3xl font-black text-primary tracking-tight uppercase">Adv. Sanjay Vidya Vijay Gurav</p>
                <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.3em] mt-1">Founder & Owner, Vidya EduCare</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="space-y-12 scroll-mt-24">
            <div className="text-center space-y-2">
                <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic">Frequently Asked Questions</h2>
                <p className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase">Everything you need to know about Vidya EduCare</p>
                <div className="h-1.5 bg-accent w-32 mx-auto mt-4 rounded-full shadow-sm" />
            </div>
            <div className="max-w-4xl mx-auto bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-primary/10">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="vision" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">What is the Vision & Mission of Vidya EduCare?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            <p><b>Vision:</b> To lead India in academic excellence and financial empowerment.</p>
                            <p className="mt-4"><b>Mission:</b> To provide elite AI-powered coaching while fostering a sustainable earning ecosystem for all stakeholders.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="objectives" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">What are the primary Objectives and Benefits?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            <p><b>Objectives:</b> Improve exam performance via MockArena, provide instant conceptual clarity via AI tools, and manage a robust referral-based passive income engine.</p>
                            <p className="mt-4"><b>Benefits:</b> Students win cash rewards for excellence (MockArena & Quiz Clash); Parents get a productive learning environment; Associates (IBAs) start a zero-investment professional business.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="wallet" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic flex gap-2">
                            <Wallet className="w-5 h-5 mt-1 shrink-0" />
                            How do I add or withdraw money from my wallet?
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            <p><b>Adding Funds:</b> Navigate to 'Wallet', click 'Add Funds'. Pay via the provided UPI QR or Bank details, then submit your Transaction ID/UTR for verification.</p>
                            <p className="mt-4"><b>Withdrawals:</b> Go to 'Wallet' and select 'Withdraw'. Enter an amount (minimum ₹200) and your receiving UPI ID. Admins process payouts regularly.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="rewards" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">How do MockArena rewards work?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            Participate in live curriculum-aligned sessions. Achieve an <b>80% accuracy minimum</b> and rank in the top 5 participants to win instant cash prizes (up to ₹250 per session) credited directly to your parent wallet.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="clash" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">What is Quiz Clash and its rewards?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            Quiz Clash features high-stakes live tournaments. <b>Pro Clashes</b> use entry fees to form a prize pool, where 80% is shared among the top 4 performers (40%, 30%, 20%, 10%). <b>Practice Clashes</b> are free for preparation.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="iba" className="border-b-2 border-muted py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">How does the IBA program work and what is the income?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            <p>Becoming an Independent Business Associate (IBA) is a <b>zero-investment opportunity</b>. Share your unique code with others.</p>
                            <p className="mt-4"><b>Income:</b> Earn a <b>10% commission</b> on every MockArena subscription purchased using your code. Commissions are instantly credited to your wallet upon sale approval.</p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="referbolt" className="border-none py-2">
                        <AccordionTrigger className="text-xl font-black text-primary hover:no-underline text-left italic">What is ReferBolt income and how it works?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground text-lg font-medium leading-relaxed pb-6">
                            <p>ReferBolt is a premium multi-level referral engine. It works on <b>"Success Cycles"</b> of just 3 referrals.</p>
                            <p className="mt-4"><b>How it works:</b> Every time your direct or indirect network completes a cycle, you unlock a massive cycle bonus. These cycles repeat automatically, creating a continuous passive income stream as your community grows.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>

        {/* CTA */}
        <section className="bg-accent text-white rounded-[4rem] p-16 md:p-24 text-center shadow-2xl relative overflow-hidden group border-t-8 border-white/20">
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-10">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">Ready to start your <br/><span className="text-primary bg-white px-6 inline-block mt-4 rounded-2xl transform -rotate-1">winning streak?</span></h2>
                <p className="text-accent-foreground font-bold text-2xl max-w-3xl mx-auto opacity-95">Join the national community of goal-oriented students competing and winning rewards every single day.</p>
                <div className="mt-8 flex gap-6 justify-center flex-wrap">
                    <Button asChild size="lg" variant="secondary" className="px-14 py-12 text-3xl font-black shadow-2xl rounded-[2rem] hover:scale-105 transition-all bg-white text-primary border-none">
                        <Link href={user ? (isAdmin ? "/admin/analytics" : "/profile") : "/signup"}>
                            {user ? "ACCESS WORKSPACE" : "CREATE FREE ACCOUNT"}
                        </Link>
                    </Button>
                    <Button size="lg" variant="ghost" onClick={handleShare} className="px-12 py-12 text-2xl font-black rounded-[2rem] border-4 border-white/30 hover:bg-white/10 transition-all">
                        <Share2 className="mr-3 h-8 w-8"/> SHARE APP
                    </Button>
                </div>
            </div>
        </section>
      </div>
    </main>
  );
}
