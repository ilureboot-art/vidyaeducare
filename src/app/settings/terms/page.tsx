
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
            <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
            </Link>
          <CardTitle className="text-3xl font-bold text-primary">Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>Welcome to GuessMaster! These terms and conditions outline the rules and regulations for the use of our application.</p>
            
            <h2 className="text-xl font-semibold">1. Introduction</h2>
            <p>By accessing this app, we assume you accept these terms and conditions. Do not continue to use GuessMaster if you do not agree to all of the terms and conditions stated on this page.</p>

            <h2 className="text-xl font-semibold">2. License</h2>
            <p>Unless otherwise stated, GuessMaster and/or its licensors own the intellectual property rights for all material on GuessMaster. All intellectual property rights are reserved.</p>

            <h2 className="text-xl font-semibold">3. User Content</h2>
            <p>In these terms and conditions, "your user content" means material (including without limitation text, images, audio material, video material, and audio-visual material) that you submit to this app, for whatever purpose.</p>
            <p>You grant to GuessMaster a worldwide, irrevocable, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate and distribute your user content in any existing or future media.</p>

            <h2 className="text-xl font-semibold">4. Placeholder</h2>
            <p>This is a placeholder document. The actual terms and conditions will need to be drafted by a legal professional.</p>

        </CardContent>
      </Card>
    </div>
  );
}

    