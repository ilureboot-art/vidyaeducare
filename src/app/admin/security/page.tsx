
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, ListChecks } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Security</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield /> Security Settings</CardTitle>
          <CardDescription>Manage security policies and administrator access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h3 className="font-semibold">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-muted-foreground">Require all admins to use a second factor for authentication.</p>
                </div>
                <Button variant="outline">Configure 2FA</Button>
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <h3 className="font-semibold">Password Policy</h3>
                    <p className="text-sm text-muted-foreground">Define complexity requirements for admin passwords.</p>
                </div>
                <Button variant="outline">Edit Policy</Button>
            </div>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound /> API Keys</CardTitle>
          <CardDescription>Manage API keys for external service integrations.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">No API keys have been generated yet.</p>
             <Button className="mt-4">Generate New Key</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ListChecks /> Audit Log</CardTitle>
          <CardDescription>Review a log of all significant administrative actions.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">The audit log is empty. Actions will be recorded here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
