
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { AppNotification } from "@/lib/notifications";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { useFirebase } from "@/firebase";

export function Notifications() {
  const { db } = useFirebase();
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!db) return;
    const notifsRef = collection(db, "notifications");
    const q = query(notifsRef, where("userId", "==", 'admin'), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp;
            return { id: doc.id, ...data, timestamp } as AppNotification;
        });
        setAdminNotifications(notifications);
        setUnreadCount(notifications.filter(n => n.status === 'unread').length);
    });

    return () => unsubscribe();
  }, [db]);
  
  const markAllAsRead = () => {
    // In a real app, this would be an API call to update Firestore docs
    if (adminNotifications) {
        setAdminNotifications(adminNotifications.map(n => ({...n, status: 'read' as const})));
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
        setTimeout(() => {
            markAllAsRead();
        }, 500);
    }
  }
  
  if (!adminNotifications) {
      return (
          <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
          </Button>
      );
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
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
      <PopoverContent className="w-96">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium leading-none">Notifications</h4>
            <Link href="/admin/notifications" passHref>
                <Button variant="link" size="sm">View All</Button>
            </Link>
          </div>
          <div className="grid gap-2 max-h-80 overflow-y-auto">
            {adminNotifications.length > 0 ? (
                adminNotifications.slice(0, 5).map(notif => (
                    <div key={notif.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        {notif.status === 'unread' && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                        <div className={`grid gap-1 ${notif.status === 'read' ? 'col-span-2' : ''}`}>
                            <p className="text-sm font-medium">{notif.message}</p>
                            <p className="text-sm text-muted-foreground">
                               {format(new Date(notif.timestamp), 'P p')}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
            )}
          </div>
        </div>
         {adminNotifications.length > 0 && (
            <div className="flex justify-end mt-2">
                <Button variant="link" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>
         )}
      </PopoverContent>
    </Popover>
  );
}
