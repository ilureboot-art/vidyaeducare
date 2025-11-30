
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, X, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth, useDbService } from '@/firebase/client-provider';
import { doc, setDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();
    const db = useDbService();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() === '' || !user || !db) {
            if(!user) toast({ variant: 'destructive', title: 'You must be logged in to chat.'});
            return;
        }
        
        try {
            const chatRef = doc(db, 'chats', user.uid);
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userName = userDoc.exists() ? userDoc.data().name : user.email;

            await setDoc(chatRef, {
                user: userName,
                avatar: (userName || 'U').charAt(0),
                lastMessage: message,
                lastMessageTimestamp: serverTimestamp(),
                unread: true,
            }, { merge: true });

            const messagesCollectionRef = collection(chatRef, 'messages');
            await addDoc(messagesCollectionRef, {
                from: 'user',
                text: message,
                timestamp: serverTimestamp(),
            });

            toast({
                title: "Query Sent!",
                description: "An admin will get back to you shortly. Your conversation will appear here.",
            });
            setMessage('');
            setIsOpen(false);
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
        }
    };

    return (
        <>
            <div className="fixed bottom-24 right-6 z-50 md:bottom-6">
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="rounded-full w-14 h-14 shadow-lg">
                    {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                </Button>
            </div>

            {isOpen && (
                <div className="fixed bottom-44 right-6 z-50 md:bottom-24">
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
