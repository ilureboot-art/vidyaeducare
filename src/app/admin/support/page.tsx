
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, BookOpen, Mail } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const adminFaqs = [
    {
        question: "What is the corporate Vision & Mission?",
        answer: "Vision: To lead India in academic excellence and financial empowerment. Mission: To provide elite coaching while fostering a sustainable earning ecosystem for all stakeholders."
    },
    {
        question: "How are MockArena prizes calculated?",
        answer: "Prizes are automatically calculated based on accuracy and completion time. Participants must achieve a minimum 80% accuracy in a LIVE session to be eligible for the top 5 rank prizes."
    },
    {
        question: "How do I manage the IBA commission rate?",
        answer: "Navigate to 'Store Settings'. You can adjust the 'Standard IBA Commission (%)' which applies to the base price of all subscription sales globally."
    },
    {
        question: "How are Quiz Clash shared prize pools managed?",
        answer: "For Pro Clashes, 80% of entry fees form the distributable prize pool, shared among the top 4 performers (40%, 30%, 20%, 10%). disbursement is automated upon tournament completion."
    },
    {
        question: "How do I approve or reject a transaction request?",
        answer: "Go to the 'Transactions' page. Pending requests have 'Approve' and 'Reject' actions. Approving a deposit updates the user wallet; rejecting a withdrawal returns funds to the user."
    },
    {
        question: "How does the ReferBolt cycle bonus work?",
        answer: "ReferBolt rewards users who complete a cycle of 3 referrals. You can configure the cycle bonus amount in Store Settings under the ReferBolt section."
    }
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Support Center</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LifeBuoy /> Contact Support</CardTitle>
            <CardDescription>Reach out to the technical team for assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              If you encounter issues with the admin panel or need help with infrastructure, please contact support.
            </p>
            <Button className="mt-4 w-full">
              <Mail className="mr-2" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen /> Operational Guides</CardTitle>
            <CardDescription>System management documentation.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-sm">
              Review tutorials on managing users, scheduling tests, and setting prices.
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
             {adminFaqs.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {adminFaqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left font-bold">{faq.question}</AccordionTrigger>
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
