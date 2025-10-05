
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, UserPlus, ArrowDown, ArrowUp } from "lucide-react";
import { getAdminNotifications, type AppNotification } from "@/lib/notifications";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

function FormattedDate({ dateString }: { dateString: string }) {
    if (!dateString) return null;
    try {
        // Format the date directly. This is safe for server and client.
        return <span>{format(new Date(dateString), 'P p')}</span>;
    } catch (error) {
        console.error("Invalid date string provided to FormattedDate:", dateString, error);
        return <span>Invalid Date</span>;
    }
}


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
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        setNotifications(getAdminNotifications());
    }, []);

    if (!isClient) {
        return null;
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
                                            <FormattedDate dateString={notif.timestamp} />
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
