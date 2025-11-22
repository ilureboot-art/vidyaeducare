'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function SetupAdminPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [generatedSnippet, setGeneratedSnippet] = useState('');

  const handleGenerateSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all fields to generate the snippet.',
      });
      return;
    }
    const snippet = `console.log('CREATE_HEAD_ADMIN', { email: '${email}', password: '${password}', name: '${name}' });`;
    setGeneratedSnippet(snippet);
  };

  const copyToClipboard = () => {
    if (!generatedSnippet) return;
    navigator.clipboard.writeText(generatedSnippet);
    toast({
      title: 'Snippet Copied!',
      description: 'The admin creation snippet has been copied to your clipboard.',
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <CardTitle>Head Admin Creation</CardTitle>
          </div>
          <CardDescription>
            Use this form to securely generate an admin creation snippet.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleGenerateSnippet}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter the admin's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Generate Admin Snippet
            </Button>
          </CardFooter>
        </form>

        {generatedSnippet && (
          <div className="p-6 pt-0">
            <Separator className="my-4" />
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Copy the snippet below and paste it into the chat to finalize the
                admin creation.
              </p>
              <div className="relative">
                <Textarea
                  readOnly
                  value={generatedSnippet}
                  className="h-24 font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-2 top-2 h-7 w-7"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Minimal Separator component for this standalone page
function Separator({ className }: { className?: string }) {
    return <div className={`shrink-0 bg-border h-[1px] w-full ${className}`} />;
}
