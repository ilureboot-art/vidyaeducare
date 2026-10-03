"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, UserPlus, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AppNotification } from "@/lib/notifications";
import { useDb } from "@/firebase";
import { collection, query, where, orderBy, Timestamp, onSnapshot, limit, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const getIconForType = (type: string) => {
    switch(type) {
        case "new_user":
            return <UserPlus className="w-5 h-5 text-blue-500" />;
        case "deposit_request":
            return <ArrowDown className="w-5 h-5 text-green-500" />;
        case "withdrawal_request":
            return <ArrowUp className="w-5 h-5 text-red-500" />;
        default:
            return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
}

export default function AdminNotificationsPage() {
    const db = useDb();
    const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [savingId, setSavingId] = useState<string | null>(null);
    useEffect(() => {
        if (!db) return;
        return onSnapshot(query(collection(db, "notifications"), where("userId", "==", "admin"), orderBy("timestamp", "desc"), limit(100)), snapshot => {
            setNotifications(snapshot.docs.map(item => {
                const data = item.data();
                return { id: item.id, ...data, timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp } as AppNotification;
            }));
            setError(null);
        }, () => { setError("Notifications could not be loaded. Check access and the required Firestore index."); setNotifications([]); });
    }, [db]);
    const markRead = async (id: string) => {
        if (!db) return;
        setSavingId(id);
        try { await updateDoc(doc(db, "notifications", id), { status: "read", readAt: serverTimestamp() }); }
        catch { setError("Could not mark this notification as read. Please try again."); }
        finally { setSavingId(null); }
    };
    const visible = (notifications ?? []).filter(item => !unreadOnly || item.status !== "read");

    if (!notifications) {
        return (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Bell /> Notifications
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>Live in-app activity, showing the latest 100 notifications. Read status records acknowledgement in this app, not push delivery.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && <p role="alert" className="text-destructive mb-4">{error}</p>}
                    <Button variant="outline" className="mb-4" onClick={() => setUnreadOnly(!unreadOnly)}>{unreadOnly ? "Show all" : "Show unread"}</Button>
                    {visible.length > 0 ? (
                        <div className="space-y-4">
                            {visible.map(notif => (
                                <div key={notif.id} className="flex items-center gap-4 p-4 border rounded-lg even:bg-muted/40 transition-colors">
                                    <Avatar className="h-10 w-10 bg-muted flex items-center justify-center">
                                       <AvatarFallback className="bg-transparent">
                                         {getIconForType(notif.type)}
                                       </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {Number.isFinite(Date.parse(notif.timestamp)) ? format(new Date(notif.timestamp), 'P p') : 'Timestamp unavailable'}
                                        </p>
                                    </div>
                                    {notif.actionUrl && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={notif.actionUrl}>Review request</Link>
                                        </Button>
                                    )}
                                    {notif.status !== 'read' && <Button variant="ghost" size="sm" disabled={savingId !== null} onClick={() => markRead(notif.id)}>{savingId === notif.id ? 'Saving…' : 'Mark read'}</Button>}
                                    {notif.status && <Badge variant={notif.status === 'read' ? 'secondary' : 'default'}>{notif.status}</Badge>}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4" />
                            <p>{error ? "Notification data is unavailable." : unreadOnly ? "No unread notifications in the latest 100." : "No notifications yet."}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

