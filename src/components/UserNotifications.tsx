
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
import { collection, doc, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";


export function UserNotifications() {
  const { user } = useAuth();
  const db = useDb();
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingRead, setMarkingRead] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  useEffect(() => {
    setUserNotifications([]);
    setUnreadCount(0);
    setNotificationError(null);
    if (!user || !db) return;

    const notifsRef = collection(db, "notifications");
    const q = query(notifsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"), limit(50));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp;
            return { id: doc.id, ...data, timestamp } as AppNotification;
        });
        setUserNotifications(notifications);
        setUnreadCount(notifications.filter(n => n.status === 'unread').length);
    }, () => setNotificationError('Notifications could not be loaded. Please try again.'));

    return () => unsubscribe();
  }, [user, db]);

  const markAllAsRead = async () => {
    if (!db || markingRead) return;
    const unreadNotifications = userNotifications.filter(notification => notification.status === 'unread');
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(notification => {
      batch.update(doc(db, 'notifications', notification.id), {
        status: 'read',
        readAt: serverTimestamp(),
      });
    });
    setMarkingRead(true);
    setNotificationError(null);
    try {
      await batch.commit();
    } catch (error) {
      console.error('Unable to mark notifications as read:', error);
      setNotificationError('Notifications could not be marked as read. Please try again.');
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications: ${unreadCount} unread recent updates`}>
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
              Your latest 50 updates and alerts. Opening this list does not mark them as read.
            </p>
          </div>
          {notificationError && <p role="alert" className="text-sm text-destructive">{notificationError}</p>}
          <div className="grid gap-2 max-h-80 overflow-y-auto">
            {userNotifications.length > 0 ? (
                userNotifications.map(notif => (
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
                <Button variant="link" size="sm" disabled={markingRead || unreadCount === 0} onClick={() => void markAllAsRead()}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    {markingRead ? 'Marking as read…' : 'Mark recent as read'}
                </Button>
            </div>
         )}
      </PopoverContent>
    </Popover>
  );
}
