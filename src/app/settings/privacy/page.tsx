
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <CardTitle className="text-3xl font-bold text-primary">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your privacy is important to us. It is NumberAce's policy to respect your privacy regarding any information we may collect from you through our app.</p>

          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>

          <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
          <p>We use the information we collect in various ways, including to:</p>
          <ul className="list-disc list-inside space-y-1 pl-4">
            <li>Provide, operate, and maintain our app</li>
            <li>Improve, personalize, and expand our app</li>
            <li>Understand and analyze how you use our app</li>
            <li>Develop new products, services, features, and functionality</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Placeholder</h2>
          <p>This is a placeholder document. The actual privacy policy will need to be drafted by a legal professional.</p>

        </CardContent>
      </Card>
    </div>
  );
}
