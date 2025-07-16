
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifeBuoy, BookOpen, Mail } from "lucide-react";

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
              Find guides, tutorials, and API references to help you manage your NumberAce application effectively.
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
            <p className="text-muted-foreground">No FAQs available at the moment. This section will be populated with common questions and answers for administrators.</p>
        </CardContent>
      </Card>
    </div>
  );
}
