
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Archive, Search, Send } from "lucide-react";

type Message = {
    from: 'user' | 'admin';
    text: string;
};

type Chat = {
    id: string;
    user: string;
    lastMessage: string;
    unread: boolean;
    avatar: string;
    messages: Message[];
};

const initialChats: Chat[] = [];

export default function ChatManagementPage() {
    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [reply, setReply] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const handleSelectChat = (chat: Chat) => {
        setActiveChat(chat);
        setChats(chats.map(c => c.id === chat.id ? { ...c, unread: false } : c));
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !activeChat) return;

        const newMessage: Message = { from: 'admin', text: reply };
        
        const updatedChat: Chat = {
            ...activeChat,
            messages: [...activeChat.messages, newMessage],
            lastMessage: reply,
        };

        setChats(chats.map(c => c.id === activeChat.id ? updatedChat : c));
        setActiveChat(updatedChat);
        setReply("");
    };

    const filteredChats = chats.filter(chat => 
        chat.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
        chat.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left column for chat list */}
        <div className="lg:col-span-1 flex flex-col h-full">
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Live Support Chats</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search chats..." 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-2">
                    {filteredChats.length > 0 ? filteredChats.map(chat => (
                        <div key={chat.id} onClick={() => handleSelectChat(chat)} className={`p-3 rounded-lg cursor-pointer transition-colors ${activeChat?.id === chat.id ? 'bg-primary/20' : 'hover:bg-muted/50'} ${chat.unread ? 'border-l-4 border-primary' : ''}`}>
                            <div className="flex justify-between">
                                <p className="font-semibold">{chat.user}</p>
                                {chat.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full mt-1.5"></span>}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                    )) : (
                        <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                            No active chats.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right column for active chat window */}
        <div className="lg:col-span-2 flex flex-col h-full">
            {activeChat ? (
             <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between border-b">
                    <div>
                        <CardTitle>{activeChat.user}</CardTitle>
                        <CardDescription>Online</CardDescription>
                    </div>
                    <Button variant="outline" size="icon">
                        <Archive className="h-4 w-4"/>
                        <span className="sr-only">Archive Chat</span>
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/20">
                    {activeChat.messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.from === 'admin' ? 'justify-end' : ''}`}>
                            {msg.from === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>{activeChat.avatar}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.from === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.from === 'admin' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback>AD</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                </CardContent>
                 <CardContent className="py-4 border-t">
                     <form onSubmit={handleSendReply} className="flex items-center gap-2">
                        <Input 
                            placeholder="Type your reply..." 
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                        <Button type="submit">
                            <Send className="mr-2"/>
                            Send
                        </Button>
                    </form>
                 </CardContent>
             </Card>
            ) : (
                <Card className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Select a chat to view the conversation.</p>
                </Card>
            )}
        </div>
    </div>
  );
}
