
"use client";

import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";


export function UserNotifications() {
  const { user } = useAuth();
  const [userNotifications, setUserNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const notifsRef = collection(db, "notifications");
    const q = query(notifsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp.toDate().toISOString() } as AppNotification));
        setUserNotifications(notifications);
        setUnreadCount(notifications.filter(n => n.status === 'unread').length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = () => {
    // In a real app, this would be an API call to update Firestore
    setUserNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
  };

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
        setTimeout(() => {
            markAllAsRead();
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
                        <div className={`grid gap-1 ${notif.status === 'read' ? 'col-span-2' : ''}`}>
                            <p className="text-sm font-medium">{notif.message}</p>
                            <p className="text-sm text-muted-foreground">
                               {format(new Date(notif.timestamp), 'P p')}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have no new notifications.</p>
            )}
          </div>
        </div>
         {userNotifications.length > 0 && (
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
