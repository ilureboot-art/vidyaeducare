
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
import { defaultNotifications } from "@/lib/notifications";

export function Notifications() {
  const [allNotifications, setAllNotifications] = useState<AppNotification[]>(defaultNotifications);
  const [adminNotifications, setAdminNotifications] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentAdminNotifications = allNotifications
        .filter(n => n.userId === 'admin')
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
    setAdminNotifications(currentAdminNotifications);
    setUnreadCount(currentAdminNotifications.filter(n => n.status === 'unread').length);
  }, [allNotifications]);
  
  const markAllAsRead = () => {
    setAllNotifications(prev => prev.map(n => 
        n.userId === 'admin' ? { ...n, status: 'read' as const } : n
    ));
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
