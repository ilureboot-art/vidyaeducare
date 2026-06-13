"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, BookOpen, Mail, ArrowLeft, Target, Award, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const userFaqs = [
    {
        question: "What is the Vision of Vidya EduCare?",
        answer: "Our vision is to become India's most trusted platform for academic excellence and financial empowerment, bridging the gap between student effort and real-world reward through innovation."
    },
    {
        question: "What is the Mission of Vidya EduCare?",
        answer: "To democratize elite academic coaching using AI-powered bilingual tools while creating a sustainable, zero-investment earning ecosystem for students, parents, and associates across the country."
    },
    {
        question: "What are the core Objectives of the platform?",
        answer: "1. Academic Performance: To improve student scores through curriculum-aligned MockArena tests. 2. Conceptual Clarity: To provide 24/7 bilingual doubt resolution via GuruAI. 3. Financial Empowerment: To provide a professional passive income engine through ReferBolt and the IBA program."
    },
    {
        question: "What are the primary Benefits of joining Vidya EduCare?",
        answer: "Students benefit from personalized AI learning and cash rewards for excellence. Parents gain a productive environment for their children. Associates (IBAs) unlock a professional business opportunity with lifetime commissions and network growth cycles."
    },
    {
        question: "How do I add or withdraw money from my wallet?",
        answer: "You can add funds by going to the Wallet page, clicking 'Add Funds', and submitting a request after paying to the admin's UPI. To withdraw, click 'Withdraw', enter the amount (min. ₹200) and your payment details. All requests are processed by an admin."
    },
    {
        question: "How do the MockArena rewards and leaderboards work?",
        answer: "MockArena rewards recognize academic excellence. To qualify for cash prizes, a student must participate in a live session and achieve at least 80% accuracy. The top 5 scorers who meet this accuracy criteria win cash prizes (e.g., ₹250 for Rank #1) credited instantly to the parent's wallet."
    },
    {
        question: "What is Quiz Clash and how do the rewards work?",
        answer: "Quiz Clash features high-stakes live tournaments. Pro Clashes require an entry fee which forms a prize pool. This pool is distributed among the top 4 performers based on score and speed. Prizes are credited automatically to your wallet upon tournament completion."
    },
    {
        question: "How do I work as an Independent Business Associate (IBA)?",
        answer: "Working as an IBA is a zero-investment opportunity. You receive a unique Referral Code in your IBA Dashboard. Share this code with students and parents. When they subscribe to MockArena packages, you earn instant commissions (up to 17.65%) credited to your wallet."
    },
    {
        question: "What is ReferBolt and how do the earnings work?",
        answer: "ReferBolt is a premium success engine. Once activated, you earn from a multi-level network using 'Success Cycles'. Every 3 successful referrals (including those made by people you referred) completes a cycle and grants a substantial bonus. Cycles repeat automatically for continuous income."
    },
    {
        question: "How do I add a student to my profile?",
        answer: "To add a student, purchase a subscription from the Store to receive a Product Activation Code. Go to the 'My Students' page, click 'Add New Student', enter the code, and then fill in the student's details."
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
