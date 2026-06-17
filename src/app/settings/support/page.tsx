
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
        question: "What is the Vision of Vidya EduCare?",
        answer: "Our vision is to lead India in academic excellence and financial empowerment, bridging the gap between student effort and real-world reward."
    },
    {
        question: "What are the Benefits for Students and Associates?",
        answer: "Students win cash rewards for excellence (MockArena & Vidya Quiz Clash), parents get a productive learning environment, and associates (IBAs) start a zero-investment professional business."
    },
    {
        question: "How do I add or withdraw money from my wallet?",
        answer: "Add funds via UPI/Bank transfer and submit the Transaction ID. Withdrawals (min ₹650, maintaining a ₹200 minimum balance) are processed by administrators into your designated UPI ID."
    },
    {
        question: "How do the MockArena rewards work?",
        answer: "Achieve at least 80% accuracy in a live session and rank in the top 5 to win instant cash prizes credited to your parent wallet."
    },
    {
        question: "How does the IBA program work?",
        answer: "The Independent Business Associate (IBA) program is a zero-investment business. Share your unique code and earn a 10% commission on every subscription sale."
    },
    {
        question: "What is ReferBolt passive income?",
        answer: "ReferBolt uses 'Success Cycles' of 3 referrals. Every cycle completed by your growing network grants a substantial bonus, repeating automatically for continuous passive income."
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
                            <AccordionTrigger className="text-left italic font-bold">
                                {faq.question}
                            </AccordionTrigger>
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
