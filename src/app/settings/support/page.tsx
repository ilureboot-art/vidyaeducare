
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, BookOpen, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const userFaqs = [
    {
        question: "How do I add or withdraw money from my wallet?",
        answer: "You can add funds by going to the Wallet page, clicking 'Add Funds', and submitting a request after paying to the admin's UPI. To withdraw, click 'Withdraw', enter the amount (min. ₹200) and your payment details. All requests are processed by an admin."
    },
    {
        question: "How do the MockArena rewards and leaderboards work?",
        answer: "MockArena rewards are designed to recognize academic excellence. To qualify for cash prizes, a student must participate in a live session and achieve at least 80% accuracy. The top 5 scorers who meet this accuracy criteria win cash prizes (e.g., ₹250 for Rank #1) credited instantly to the parent's wallet once results are finalized."
    },
    {
        question: "What is Quiz Clash and how do the rewards work?",
        answer: "Quiz Clash features high-stakes live tournaments with shared prize pools. Users register a student for a specific clash (Practice or Pro). In Pro Clashes, the entry fees form a prize pool, which is distributed among the top performers based on score and speed. Unlike MockArena, prizes are based on relative ranking within the tournament participants."
    },
    {
        question: "How do I work as an Independent Business Associate (IBA)?",
        answer: "Working as an IBA is a zero-investment opportunity. You receive a unique Referral Code in your IBA Dashboard. Share this code with students and parents via WhatsApp or social media. When they use your code to subscribe to MockArena packages, you earn instant commissions credited to your wallet."
    },
    {
        question: "What are the income details for the IBA program?",
        answer: "IBAs earn a substantial base commission of up to 17.65% on every MockArena subscription purchased using their referral code. For example, on a ₹3000 plan, you earn approximately ₹530. Combined with the ReferBolt system, you can also earn continuous 'Cycle Bonuses' from a wider network of referrals."
    },
    {
        question: "What's the difference between the IBA Program and the ReferBolt System?",
        answer: "The IBA Program is our standard referral system for earning direct commissions. ReferBolt is a premium subscription that unlocks an advanced multi-level network, allowing you to earn from 'indirect' referrals (people your friends refer) through continuous success cycles."
    },
    {
        question: "How do I add a student to my profile?",
        answer: "To add a student, you first need to purchase a subscription from the Store. This will give you a unique Product Activation Code. Go to the 'My Students' page, click 'Add New Student', enter the code, and then fill in the student's details."
    }
];

export default function SupportPage() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
        <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
        </Link>
      <h1 className="text-3xl font-bold">Support Center</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LifeBuoy /> Contact Support</CardTitle>
            <CardDescription>Reach out for assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              If you encounter issues or need help, please contact our support team.
            </p>
            <Button className="mt-4 w-full">
              <Mail className="mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen /> Documentation</CardTitle>
            <CardDescription>Browse our guides.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-sm">
              Find guides and tutorials to help you manage your application.
            </p>
             <Button variant="outline" className="mt-4 w-full">
                View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
            {userFaqs.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {userFaqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-muted-foreground">No FAQs available at the moment.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
