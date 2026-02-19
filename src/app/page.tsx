
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, Share2, Quote, User, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/firebase";

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

const testimonials = [
  {
    name: "Priya S.",
    role: "Parent of 10th Grader",
    avatar: "PS",
    quote: "Vidya EduCare has been a game-changer for my son's exam preparation. The mock tests are comprehensive and the platform is very user-friendly."
  },
  {
    name: "Rohan K.",
    role: "User",
    avatar: "RK",
    quote: "The referral system is a great bonus. I've been able to earn a nice side income while helping other students find this amazing platform."
  },
   {
    name: "Anjali M.",
    role: "Parent of 12th Grader",
    avatar: "AM",
    quote: "The combination of serious mock tests and earning opportunities is perfect. It keeps my daughter engaged in learning. Highly recommended!"
  }
];


export default function HomePage() {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();

  const handleShare = async () => {
    const url = window.location.origin;
    const message = `🎓 Check out Vidya EduCare! It's an amazing platform for mock tests and earning rewards. 
    
Start your journey to success now: ${url}
#VidyaEduCare #EdTech #MockTest #ReferAndEarn`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    try {
        window.open(whatsappUrl, '_blank');
    } catch(e) {
        navigator.clipboard.writeText(message);
        toast({ title: "Link Copied!", description: "Promotional message copied to clipboard." });
    }
  };

  return (
    <main className="flex-1 flex flex-col w-full items-center p-4">
      <div className="w-full max-w-6xl mx-auto space-y-24">
        
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left pt-8 md:pt-0">
          <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-primary tracking-tighter">Welcome to Vidya Educare</h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-4">The ultimate platform combining academic excellence with rewarding opportunities to make learning impactful.</p>
              
              {user ? (
                  <div className="mt-8 space-y-4">
                      <div className="p-6 bg-primary/[0.03] rounded-2xl border border-primary/10 inline-block text-center md:text-left">
                        <p className="text-sm font-bold text-primary mb-3 flex items-center gap-2 justify-center md:justify-start">
                            <Shield className="w-4 h-4" /> ACTIVE SESSION DETECTED
                        </p>
                        <Button asChild size="lg" className="px-10 py-8 text-xl font-black shadow-xl hover:scale-105 transition-transform">
                            <Link href={isAdmin ? "/admin/analytics" : "/profile"}>
                                RETURN TO WORKSPACE <ArrowRight className="ml-2" />
                            </Link>
                        </Button>
                        <p className="mt-4 text-xs text-muted-foreground font-medium">Logged in as <span className="text-primary">{user.email}</span></p>
                      </div>
                  </div>
              ) : (
                  <div className="mt-8 flex gap-2 md:gap-4 justify-center md:justify-start flex-wrap">
                      <Button asChild size="lg">
                          <Link href="/signup"><LogIn className="mr-2"/> Join for Free</Link>
                      </Button>
                      <Button asChild size="lg" variant="secondary">
                          <Link href="/how-to-play">Learn More</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                          <Link href="/login"><User className="mr-2"/> Player Login</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline">
                          <Link href="/admin/login"><Shield className="mr-2"/> Admin Login</Link>
                      </Button>
                  </div>
              )}
          </div>
          <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <Image src="https://picsum.photos/seed/1/600/400" width={600} height={400} alt="Promotional image" className="relative rounded-lg shadow-2xl" data-ai-hint="students learning" />
          </div>
        </section>
        
        {/* Features Section */}
        <section>
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-3xl font-bold">Everything You Need to Succeed</h2>
              <p className="text-muted-foreground">One platform, limitless possibilities.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => (
                    <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow border-primary/5">
                        <CardHeader className="items-center">
                            <div className="p-3 bg-primary/10 rounded-full">
                              <feature.icon className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        {/* Founder's Note Section */}
        <section className="bg-muted/50 rounded-lg p-6 md:p-12 border">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
                <Image src="https://picsum.photos/seed/2/400/400" width={400} height={400} alt="Mr. Sanjay Vidya Vijay Gurav" className="rounded-lg shadow-xl mx-auto border-4 border-white" data-ai-hint="portrait professional" />
            </div>
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold text-primary">A Note From Our Founder</h2>
              <Quote className="w-10 h-10 text-primary/20 my-4" />
              <p className="text-lg text-muted-foreground italic">
                "Our mission at Vidya EduCare has always been to make learning an accessible, engaging, and genuinely rewarding experience. We believe that by combining serious academic preparation with powerful referral programs, we can empower students not only to excel in their exams but also to build valuable skills in a fun environment."
              </p>
              <div className="mt-6">
                <p className="text-xl font-bold">Mr. Sanjay Vidya Vijay Gurav</p>
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Founder & Owner, Vidya EduCare</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
            <h2 className="text-3xl md:text-4xl font-black relative z-10">Ready to Get Started?</h2>
            <p className="mt-4 max-w-2xl mx-auto relative z-10 font-medium opacity-90">Join thousands of users who are acing their exams and winning rewards. Sign up today and get an instant welcome bonus!</p>
            <div className="mt-8 flex gap-2 md:gap-4 justify-center flex-wrap relative z-10">
                {user ? (
                    <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-white/90 font-bold px-8">
                        <Link href={isAdmin ? "/admin/analytics" : "/profile"}>Return to Workspace</Link>
                    </Button>
                ) : (
                    <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-white/90 font-bold px-8">
                        <Link href="/signup">Create Your Account</Link>
                    </Button>
                )}
                <Button size="lg" variant="ghost" onClick={handleShare} className="hover:bg-white/10 font-bold">
                    <Share2 className="mr-2 h-5 w-5"/> Share with Friends
                  </Button>
            </div>
        </section>

      </div>
    </main>
  );
}
