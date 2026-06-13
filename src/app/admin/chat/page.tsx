"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Archive, Search, Send, Loader2, MessageSquare } from "lucide-react";
import { useDb, useAuth } from "@/firebase";
import { collection, doc, updateDoc, addDoc, serverTimestamp, query, orderBy, Timestamp, onSnapshot } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from "@/lib/utils";

type Message = {
    id: string;
    from: 'user' | 'admin';
    text: string;
    timestamp?: Timestamp;
};

type Chat = {
    id: string;
    user: string;
    lastMessage: string;
    lastMessageTimestamp?: Timestamp;
    unread: boolean;
    avatar: string;
};

type ActiveChat = Chat & {
    messages: Message[] | null;
}


export default function ChatManagementPage() {
    const db = useDb();
    const { user, isResolved, isAdmin } = useAuth();
    const [chats, setChats] = useState<Chat[] | null>(null);
    const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
    const [reply, setReply] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [messagesUnsubscribe, setMessagesUnsubscribe] = useState<(() => void) | null>(null);
    
    useEffect(() => {
        if (!db || !isResolved || !isAdmin) return;
        
        const chatsCollection = collection(db, "chats");
        const q = query(chatsCollection, orderBy("lastMessageTimestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatList = snapshot.docs.map((chatDoc) => {
                return {
                    id: chatDoc.id,
                    ...chatDoc.data(),
                } as Chat;
            });
            setChats(chatList);
        }, async (error) => {
            console.error("Chat sync error:", error.code);
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: chatsCollection.path,
                    operation: 'list',
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            }
            setChats([]);
        });

        return () => unsubscribe();
    }, [db, isResolved, isAdmin]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);


    const handleSelectChat = async (chatId: string) => {
        if (!chats || !db) return;
        
        // Unsubscribe from previous chat messages listener
        if (messagesUnsubscribe) {
            messagesUnsubscribe();
        }

        const selected = chats.find(c => c.id === chatId);
        if (selected) {
             if (selected.unread) {
                 const chatDocRef = doc(db, "chats", selected.id);
                 updateDoc(chatDocRef, { unread: false })
                    .catch(async (e) => {
                        const permissionError = new FirestorePermissionError({
                            path: chatDocRef.path,
                            operation: 'update',
                            requestResourceData: { unread: false },
                        } satisfies SecurityRuleContext);
                        errorEmitter.emit('permission-error', permissionError);
                    });
             }

            // Set active chat immediately with null messages (loading state)
            setActiveChat({ ...selected, messages: null });

            // Subscribe to new chat's messages
            const messagesCollection = collection(db, "chats", chatId, "messages");
            const messagesQuery = query(messagesCollection, orderBy("timestamp", "asc"));
            const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const messages = snapshot.docs.map(msgDoc => ({
                    id: msgDoc.id,
                    ...msgDoc.data(),
                } as Message));
                setActiveChat(prev => prev ? { ...prev, messages } : null);
            }, async (error) => {
                if (error.code === 'permission-denied') {
                    const permissionError = new FirestorePermissionError({
                        path: messagesCollection.path,
                        operation: 'list',
                    } satisfies SecurityRuleContext);
                    errorEmitter.emit('permission-error', permissionError);
                }
                setActiveChat(prev => prev ? { ...prev, messages: [] } : null);
            });
            setMessagesUnsubscribe(() => unsubscribe);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim() || !activeChat || !db) return;

        const newMessage: Omit<Message, 'id' | 'timestamp'> = { from: 'admin', text: reply };
        
        const messagesCollectionRef = collection(db, "chats", activeChat.id, "messages");
        addDoc(messagesCollectionRef, { ...newMessage, timestamp: serverTimestamp() })
            .catch(async (e) => {
                const permissionError = new FirestorePermissionError({
                    path: messagesCollectionRef.path,
                    operation: 'create',
                    requestResourceData: newMessage,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });

        const chatDocRef = doc(db, "chats", activeChat.id);
        updateDoc(chatDocRef, {
            lastMessage: reply,
            lastMessageTimestamp: serverTimestamp(),
        }).catch(async (e) => {
            const permissionError = new FirestorePermissionError({
                path: chatDocRef.path,
                operation: 'update',
                requestResourceData: { lastMessage: reply },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
        
        setReply("");
    };
    
  if (chats === null) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Syncing Help Desk...</p>
      </div>
    );
  }

  const filteredChats = chats.filter(chat => 
    chat.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
    chat.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        {/* Left column for chat list */}
        <div className="lg:col-span-1 flex flex-col h-full">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="flex items-center gap-2 text-primary uppercase italic tracking-tighter">Support Inbox</CardTitle>
                    <div className="relative mt-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search chats..." 
                            className="pl-8 bg-background" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {filteredChats.length > 0 ? (
                        <div className="divide-y divide-border">
                            {filteredChats.map((chat, index) => (
                                <div 
                                    key={chat.id} 
                                    onClick={() => handleSelectChat(chat.id)} 
                                    className={cn(
                                        "p-4 cursor-pointer transition-colors hover:bg-primary/5",
                                        activeChat?.id === chat.id ? 'bg-primary/10 border-l-4 border-primary' : (index % 2 === 0 ? 'bg-muted/10' : 'bg-muted/30'),
                                        chat.unread && !activeChat?.id && 'font-bold'
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold uppercase truncate max-w-[150px]">{chat.user}</p>
                                        {chat.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-sm"></span>}
                                        {!chat.unread && chat.lastMessageTimestamp && (
                                            <span className="text-[9px] text-muted-foreground font-medium">
                                                {format(chat.lastMessageTimestamp.toDate(), 'HH:mm')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground h-full flex flex-col items-center justify-center p-8 gap-4 opacity-50">
                            <MessageSquare size={48} className="text-primary/20" />
                            <p className="text-xs font-black uppercase tracking-widest">No active chats found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Right column for active chat window */}
        <div className="lg:col-span-2 flex flex-col h-full">
            {activeChat ? (
             <Card className="flex-1 flex flex-col shadow-2xl border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                    <div className="flex items-center gap-3">
                         <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-black uppercase">{activeChat.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-widest">{activeChat.user}</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Session
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest">
                        <Archive className="h-3 w-3 mr-2"/>
                        Archive
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto bg-muted/20 shadow-inner">
                    {activeChat.messages === null ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-primary" />
                        </div>
                    ) : activeChat.messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-30 gap-3">
                            <MessageSquare size={48} />
                            <p className="text-xs font-black uppercase tracking-widest">Wait for user response...</p>
                        </div>
                    ) : (
                        activeChat.messages.map((msg) => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.from === 'admin' ? 'justify-end' : '')}>
                                {msg.from === 'user' && (
                                    <Avatar className="w-8 h-8 border shadow-sm">
                                        <AvatarFallback className="text-[10px] font-bold bg-muted">{activeChat.avatar}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs md:max-w-md p-4 rounded-[1.5rem] shadow-sm",
                                    msg.from === 'admin' 
                                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                                        : 'bg-background border rounded-bl-none'
                                )}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    {msg.timestamp && (
                                        <p className={cn(
                                            "text-[8px] mt-1 font-bold uppercase tracking-widest",
                                            msg.from === 'admin' ? 'text-primary-foreground/50' : 'text-muted-foreground'
                                        )}>
                                            {format(msg.timestamp.toDate(), 'p')}
                                        </p>
                                    )}
                                </div>
                                 {msg.from === 'admin' && (
                                    <Avatar className="w-8 h-8 border border-primary/20 shadow-sm">
                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">AD</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </CardContent>
                 <CardContent className="py-6 border-t bg-background">
                     <form onSubmit={handleSendReply} className="flex items-center gap-3">
                        <Input 
                            placeholder="Type your response..." 
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            className="h-12 rounded-2xl bg-muted/30 focus-visible:ring-primary"
                        />
                        <Button type="submit" size="lg" className="rounded-2xl h-12 px-6 font-black shadow-xl" disabled={!reply.trim()}>
                            <Send className="mr-2 h-4 w-4"/>
                            SEND
                        </Button>
                    </form>
                 </CardContent>
             </Card>
            ) : (
                <Card className="flex-1 flex flex-col items-center justify-center text-center p-12 border-none bg-muted/10">
                    <div className="p-8 bg-primary/5 rounded-[3rem] border-2 border-dashed border-primary/10">
                        <MessageSquare size={64} className="text-primary/20 mx-auto mb-4" />
                        <p className="text-lg font-black text-primary uppercase italic tracking-tighter">Communications Center</p>
                        <p className="text-xs text-muted-foreground font-bold mt-2 uppercase tracking-widest">Select a chat from the left to begin resolving student queries.</p>
                    </div>
                </Card>
            )}
        </div>
    </div>
  );
}