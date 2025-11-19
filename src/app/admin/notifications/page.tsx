
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, UserPlus, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AppNotification } from "@/lib/notifications";
import { getFirebase } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, Timestamp, type Firestore } from "firebase/firestore";

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
    const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
    const [db, setDb] = useState<Firestore | null>(null);

    useEffect(() => {
        const initFirebase = async () => {
          const { db } = await getFirebase();
          setDb(db);
        };
        initFirebase();
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!db) return;
            const notifsRef = collection(db, "notifications");
            const q = query(notifsRef, where("userId", "==", "admin"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const notifs = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp;
                return { id: doc.id, ...data, timestamp } as AppNotification
            });
            setNotifications(notifs);
        };
        if (db) {
            fetchNotifications();
        }
    }, [db]);

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
                    <CardDescription>A log of all important events across the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <div className="space-y-4">
                            {notifications.map(notif => (
                                <div key={notif.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                    <Avatar className="h-10 w-10 bg-muted flex items-center justify-center">
                                       <AvatarFallback className="bg-transparent">
                                         {getIconForType(notif.type)}
                                       </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{notif.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(notif.timestamp), 'P p')}
                                        </p>
                                    </div>
                                    {notif.status && <Badge variant={notif.status === 'read' ? 'secondary' : 'default'}>{notif.status}</Badge>}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-4" />
                            <p>No notifications yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
