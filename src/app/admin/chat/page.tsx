
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Archive, Search, MessageSquare } from "lucide-react";

// Mock data for chat management
const activeChats = [
    { id: "CHAT001", user: "Alice", lastMessage: "I have a problem with my withdrawal...", unread: true },
    { id: "CHAT002", user: "Bob", lastMessage: "Thank you for your help!", unread: false },
    { id: "CHAT003", user: "Charlie", lastMessage: "My referral code isn't working.", unread: true },
];

export default function ChatManagementPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left column for chat list */}
        <div className="lg:col-span-1 flex flex-col h-full">
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Live Support Chats</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search chats..." className="pl-8" />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2">
                    {activeChats.map(chat => (
                        <div key={chat.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${chat.unread ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-muted/50'}`}>
                            <div className="flex justify-between">
                                <p className="font-semibold">{chat.user}</p>
                                {chat.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5"></span>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>

        {/* Right column for active chat window */}
        <div className="lg:col-span-2 flex flex-col h-full">
             <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div>
                        <CardTitle>Alice</CardTitle>
                        <CardDescription>Online</CardDescription>
                    </div>
                    <Button variant="outline" size="icon">
                        <Archive className="h-4 w-4"/>
                        <span className="sr-only">Archive Chat</span>
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">Chat Management</h3>
                    <p className="text-muted-foreground">This is a placeholder for the live chat interface. Select a chat on the left to view the conversation and reply.</p>
                </CardContent>
             </Card>
        </div>
    </div>
  );
}
