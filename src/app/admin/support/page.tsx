
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
        question: "How do I approve or reject a user's transaction request?",
        answer: "Navigate to the 'Transactions' page. Find the transaction with a 'Pending' status. You will see 'Approve' and 'Reject' buttons in the 'Actions' column. Clicking 'Approve' for a deposit will add funds to the user's wallet. Clicking 'Reject' for a withdrawal will refund the amount back to the user."
    },
    {
        question: "How do I manage sub-admin requests?",
        answer: "Go to the 'Admin Management' page. Under the 'Sub-admin Requests' card, you will see a list of pending applications. You can approve a request to make them a sub-admin or reject it."
    },
    {
        question: "What is the Vidya EduCare AI Agent for?",
        answer: "The AI Agent is a powerful tool for generating educational content. You can find it under the 'Vidya EduCare AI Agent' tab. Provide it with study material (text or a file), specify the topic, grade, and desired outputs (like notes, MCQs, or a study plan), and the AI will generate the content for you to use on the platform."
    },
    {
        question: "How can I change the ticket prices or referral bonuses?",
        answer: "All store-related configurations are on the 'Store Settings' page. There, you can add or remove ticket packages, change their prices, and adjust the monetary values for the referral bonus and the ReferBolt system."
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
              Find guides, tutorials, and API references to help you manage your GuessMaster application effectively.
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
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <p className="text-muted-foreground">No FAQs available at the moment. This section will be populated with common questions and answers for administrators.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
