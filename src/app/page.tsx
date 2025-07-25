
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Trophy, Users, LogIn, CheckCircle, GraduationCap, Gamepad2, IndianRupee, Star, Share2, Zap, BrainCircuit, Quote } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { storeConfig } from "@/lib/store-config";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const features = [
  {
    icon: BookOpen,
    title: "Mock Tests",
    description: "Prepare for exams with our extensive library of mock tests for various subjects and standards."
  },
  {
    icon: Gamepad2,
    title: "Skill-Based Gaming",
    description: "Play GuessMaster, test your number-guessing skills, and win real cash rewards."
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
    quote: "I love playing GuessMaster in my free time! It's fun, challenging, and I've actually won some good pocket money. The referral system is a great bonus."
  },
   {
    name: "Anjali M.",
    role: "Parent of 12th Grader",
    avatar: "AM",
    quote: "The combination of serious mock tests and fun skill games is perfect. It keeps my daughter engaged in learning. Highly recommended!"
  }
];


export default function HomePage() {
  const { toast } = useToast();

  const handleShare = async () => {
    const referralCode = "ALEX-D7F6E5C"; // Example code for the current user
    const url = `${window.location.origin}/signup?ref=${referralCode}`;
    const message = `🎓 Check out Vidya EduCare! It's an amazing platform for mock tests, skill-based games, and earning rewards. 
    
Use my code ✨ ${referralCode} ✨ to get a ₹${storeConfig.referralBonus} bonus when you join!

Here's what you get:
- 📚 Access to a huge library of mock tests.
- 🎮 Fun skill games like GuessMaster to win cash.
- 💸 Earn rewards by referring friends.

Start your journey to success now: ${url}
#VidyaEduCare #EdTech #MockTest #SkillGames #ReferAndEarn`;
    
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
        // Fallback to clipboard if share fails for any reason
        fallbackCopy();
      }
    } else {
      fallbackCopy();
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-24">
      
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
        <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-primary tracking-tighter">Learn, Play, and Earn with Vidya EduCare.</h1>
            <p className="text-xl text-muted-foreground mt-4">The ultimate platform combining academic excellence with skill-based gaming to make learning rewarding.</p>
            <div className="mt-8 flex gap-4 justify-center md:justify-start flex-wrap">
                <Button asChild size="lg">
                    <Link href="/signup"><LogIn className="mr-2"/> Join for Free</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                    <Link href="/how-to-play"><BookOpen className="mr-2"/> Learn More</Link>
                </Button>
            </div>
        </div>
        <div>
            <Image src="https://placehold.co/600x400.png" width={600} height={400} alt="Promotional image for Vidya EduCare" className="rounded-lg shadow-xl" data-ai-hint="promotion marketing" />
        </div>
      </section>
      
      {/* How it Works Section */}
      <section>
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">A Rewarding Journey in 3 Steps</h2>
          <p className="text-muted-foreground">Getting started is simple and straightforward.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
                <div className="flex items-center justify-center bg-primary/20 text-primary w-16 h-16 rounded-full text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold">Sign Up</h3>
                <p className="text-muted-foreground mt-2">Create your account in minutes. Use a referral code to get an instant bonus!</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="flex items-center justify-center bg-primary/20 text-primary w-16 h-16 rounded-full text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold">Learn & Play</h3>
                <p className="text-muted-foreground mt-2">Access mock tests and play GuessMaster to test your skills.</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="flex items-center justify-center bg-primary/20 text-primary w-16 h-16 rounded-full text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold">Earn Rewards</h3>
                <p className="text-muted-foreground mt-2">Win cash prizes from games and earn bonuses by referring your friends.</p>
            </div>
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
                  <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
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

      {/* Demo Game Section */}
      <section>
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">Experience the Fun</h2>
          <p className="text-muted-foreground">Try the GuessMaster game right now. No sign-up required!</p>
        </div>
        <Card className="max-w-2xl mx-auto shadow-xl overflow-hidden bg-gradient-to-tr from-primary/10 to-background">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8">
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Gamepad2/> GuessMaster Demo</CardTitle>
              <CardDescription className="mt-2">Can you guess the secret number between 1 and 100 in 5 tries? Test your logic and win bragging rights!</CardDescription>
              <Button asChild className="mt-6" size="lg">
                <Link href="/play?mode=demo">Play Demo Game</Link>
              </Button>
            </div>
            <div className="hidden md:block">
              <Image src="https://placehold.co/400x300.png" width={400} height={300} alt="GuessMaster Game" className="object-cover h-full w-full" data-ai-hint="gameplay numbers" />
            </div>
          </div>
        </Card>
      </section>

      {/* Testimonials Section */}
      <section>
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl font-bold">Trusted by Parents and Users</h2>
            <p className="text-muted-foreground">Don't just take our word for it. Here's what people are saying.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="flex flex-col">
                  <CardContent className="pt-6 flex-grow">
                      <Quote className="w-8 h-8 text-primary/50 mb-4"/>
                      <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                  </CardContent>
                  <CardFooter className="mt-4">
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={`https://placehold.co/40x40.png?text=${testimonial.avatar}`} data-ai-hint="profile avatar" />
                              <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          </div>
                      </div>
                  </CardFooter>
              </Card>
            ))}
          </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary text-primary-foreground rounded-lg p-12 text-center">
          <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mt-4 max-w-2xl mx-auto">Join thousands of users who are acing their exams and winning rewards. Sign up today and get an instant welcome bonus!</p>
          <div className="mt-8 flex gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-primary hover:bg-white/90">
                  <Link href="/signup">Create Your Account</Link>
              </Button>
               <Button size="lg" variant="ghost" onClick={handleShare}>
                  <Share2 className="mr-2"/> Share with Friends
                </Button>
          </div>
      </section>

    </div>
  );
}
