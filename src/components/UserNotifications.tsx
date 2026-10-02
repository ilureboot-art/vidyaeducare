
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AppNotification } from "@/lib/notifications";
import { useAuth, useDb } from "@/firebase";
import { collection, doc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";


export function UserNotifications() {
  const { user } = useAuth();
  const db = useDb();
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !db) return;

    const notifsRef = collection(db, "notifications");
    const q = query(notifsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp;
            return { id: doc.id, ...data, timestamp } as AppNotification;
        });
        setUserNotifications(notifications);
        setUnreadCount(notifications.filter(n => n.status === 'unread').length);
    });

    return () => unsubscribe();
  }, [user, db]);

  const markAllAsRead = async () => {
    if (!db) return;
    const unreadNotifications = userNotifications.filter(notification => notification.status === 'unread').slice(0, 450);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
      batch.update(doc(db, 'notifications', notification.id), {
        status: 'read',
        readAt: serverTimestamp(),
      });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error('Unable to mark notifications as read:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
        setTimeout(() => {
            void markAllAsRead();
        }, 500);
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              Your recent updates and alerts.
            </p>
          </div>
          <div className="grid gap-2">
            {userNotifications.length > 0 ? (
                userNotifications.slice(0, 5).map(notif => (
                    <div key={notif.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        {notif.status === 'unread' && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                        <Link href={notif.actionUrl || "/profile"} className={`grid gap-1 rounded-sm hover:text-primary ${notif.status === 'read' ? 'col-span-2' : ''}`}>
                            <p className="text-sm font-medium">{notif.message}</p>
                            <p className="text-sm text-muted-foreground">
                               {format(new Date(notif.timestamp), 'P p')}
                            </p>
                        </Link>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have no new notifications.</p>
            )}
          </div>
        </div>
         {userNotifications.length > 0 && (
            <div className="flex justify-end mt-2">
                <Button variant="link" size="sm" onClick={() => void markAllAsRead()}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>
         )}
      </PopoverContent>
    </Popover>
  );
}
