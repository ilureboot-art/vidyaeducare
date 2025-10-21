
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
import { getAdminNotifications, markAdminNotificationsAsRead, type AppNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = () => {
        const adminNotifications = getAdminNotifications();
        setNotifications(adminNotifications);
        setUnreadCount(adminNotifications.filter(n => n.status === 'unread').length);
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll for new notifications
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
        setTimeout(() => {
          markAdminNotificationsAsRead();
          const adminNotifications = getAdminNotifications();
          setNotifications(adminNotifications);
          setUnreadCount(0);
        }, 500);
    }
  }
  
  if (!notifications) {
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
            {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notif => (
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
         {notifications.length > 0 && (
            <div className="flex justify-end mt-2">
                <Button variant="link" size="sm" onClick={() => {
                    markAdminNotificationsAsRead();
                    const userNotifications = getAdminNotifications();
                    setNotifications(userNotifications);
                    setUnreadCount(0);
                }}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>
         )}
      </PopoverContent>
    </Popover>
  );
}

    