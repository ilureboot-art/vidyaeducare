
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
        question: "What's the difference between the IBA Program and the ReferBolt System?",
        answer: "The IBA (Independent Business Associate) Program is our standard referral system primarily for earning commissions from mock test subscriptions. ReferBolt is a premium subscription that unlocks a more advanced referral structure, allowing you to earn from a larger network (indirect referrals) for continuous, passive income."
    },
    {
        question: "How do I add a student to my profile?",
        answer: "To add a student, you first need to purchase a subscription from the Store. This will give you a unique Product Activation Code. Go to the 'My Students' page, click 'Add New Student', enter the code, and then fill in the student's details."
    },
    {
        question: "How do game tickets work?",
        answer: "One ticket gives you two plays in the GuessMaster game. You can buy more tickets from the Store. You can also play a demo game for free to practice."
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
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>
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
