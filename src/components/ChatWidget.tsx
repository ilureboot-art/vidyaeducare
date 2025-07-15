
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '') return;
        
        // Simulate sending the message
        console.log('Message sent:', message);
        toast({
            title: "Query Sent!",
            description: "An admin will get back to you shortly. You can see the conversation in the Admin Chat panel.",
        });
        setMessage('');
        setIsOpen(false);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-14 h-14 shadow-lg">
                    {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                </Button>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50">
                    <Card className="w-80 shadow-2xl">
                        <CardHeader>
                            <CardTitle>Need Help?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Ask us anything, or share your feedback.
                            </p>
                        </CardContent>
                        <CardFooter>
                             <form onSubmit={handleSubmit} className="flex items-center w-full gap-2">
                                <Input 
                                    placeholder="Type your message..." 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <Button type="submit" size="icon">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </>
    );
}
