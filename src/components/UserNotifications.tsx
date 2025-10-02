
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCheck } from "lucide-react";
import { getUserNotifications, markUserNotificationsAsRead, type AppNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";

function FormattedDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    if (dateString) {
      setFormattedDate(new Date(dateString).toLocaleString());
    }
  }, [dateString]);

  return <span>{formattedDate}</span>;
}


export function UserNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = () => {
        const userNotifications = getUserNotifications("user-alex-doe");
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter(n => n.status === 'unread').length);
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2000); // Poll for new notifications
    return () => clearInterval(interval);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open && unreadCount > 0) {
        markUserNotificationsAsRead("user-alex-doe");
        setNotifications(getUserNotifications("user-alex-doe"));
        setUnreadCount(0);
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
            {notifications.length > 0 ? (
                notifications.slice(0, 5).map(notif => (
                    <div key={notif.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0">
                        <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                        <div className="grid gap-1">
                            <p className="text-sm font-medium">{notif.message}</p>
                            <p className="text-sm text-muted-foreground">
                               <FormattedDate dateString={notif.timestamp} />
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You have no new notifications.</p>
            )}
          </div>
        </div>
         {notifications.length > 0 && (
            <div className="flex justify-end mt-2">
                <Button variant="link" size="sm" onClick={() => {
                    markUserNotificationsAsRead("user-alex-doe");
                    setNotifications(getUserNotifications("user-alex-doe"));
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

    