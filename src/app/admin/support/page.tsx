"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, BookOpen, Mail, ShieldCheck, Target, Award } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const adminFaqs = [
    {
        question: "What is the corporate Vision & Mission?",
        answer: "Vision: To lead India in academic excellence and financial empowerment. Mission: To provide elite AI-powered coaching while fostering a sustainable earning ecosystem for all stakeholders."
    },
    {
        question: "What are the primary operational Objectives?",
        answer: "Improving exam performance via MockArena, providing instant conceptual clarity via AI tools, and managing a robust referral-based passive income engine for associates."
    },
    {
        question: "How are MockArena prizes calculated and disbursed?",
        answer: "Prizes are automatically calculated based on accuracy and completion time. The system enforces an 80% accuracy minimum for prize eligibility. Once a live session is finalized, the top 5 eligible participants receive their rewards via an atomic transaction to their wallet."
    },
    {
        question: "How are Quiz Clash tournaments managed and rewarded?",
        answer: "Tournament prize pools are formed by entry fees (for Pro Clashes). Ranks are calculated automatically, and the shared prize pool is disbursed to the top 4 performers once the tournament status is updated to 'completed'."
    },
    {
        question: "How do I explain the IBA commission structure?",
        answer: "IBAs earn up to 17.65% base commission on every MockArena subscription. These earnings are credited instantly to their wallet. They can also earn additional bonuses via the ReferBolt Success Cycles as their network expands."
    },
    {
        question: "How do I manage ReferBolt cycles and bonuses?",
        answer: "ReferBolt uses 'Success Cycles' of 3 referrals. Administrators can configure the ReferBolt base price and the cycle bonus values in the 'Store Settings' dashboard. The system tracks cycle completions automatically."
    },
    {
        question: "How do I approve or reject a transaction request?",
        answer: "Navigate to the 'Transactions' page. Pending requests will have 'Approve' and 'Reject' buttons. Approving a deposit credits the user wallet; rejecting a withdrawal returns the held funds to the user wallet."
    },
    {
        question: "How can I change subscription prices or referral bonuses?",
        answer: "Navigate to 'Store Settings'. You can modify MockArena packages, adjust Referral Bonus amounts (Welcome Credits), and update ReferBolt subscription details globally."
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
            <CardDescription>Reach out to the Firebase Studio support team for assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you encounter issues with the admin panel or need help with integrations, please contact our support team.
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
            <CardDescription>Browse our comprehensive documentation for self-service.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">
              Find guides, tutorials, and API references to help you manage your application effectively.
            </p>
             <Button variant="outline" className="mt-4 w-full">
                View Documentation
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Administrative FAQs</CardTitle>
        </CardHeader>
        <CardContent>
             {adminFaqs.length > 0 ? (
                 <Accordion type="single" collapsible className="w-full">
                    {adminFaqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
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
