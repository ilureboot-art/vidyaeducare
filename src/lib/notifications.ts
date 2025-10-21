
'use client';

export type AppNotification = {
    id: number;
    type: 'new_user' | 'deposit_request' | 'withdrawal_request' | 'deposit_received' | 'withdrawal_approved';
    message: string;
    timestamp: string;
    status: 'read' | 'unread';
    userId: 'admin' | string; // 'admin' for admin notifications, or a specific user ID
};

let notifications: AppNotification[] | null = null;
const defaultNotifications: AppNotification[] = [];

const initializeNotifications = (): AppNotification[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    
    if (notifications !== null) {
        return notifications;
    }

    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
        try {
            notifications = JSON.parse(savedNotifications);
            return notifications!;
        } catch (e) {
            console.error("Failed to parse notifications from localStorage", e);
        }
    }
    
    notifications = JSON.parse(JSON.stringify(defaultNotifications));
    localStorage.setItem('notifications', JSON.stringify(notifications));
    return notifications;
}

const saveNotifications = (notifs: AppNotification[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(notifs));
        notifications = notifs;
    }
};

// Function to add a new notification
export function addNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'status'>) {
    const allNotifications = initializeNotifications();
    const newNotification: AppNotification = {
        ...notificationData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'unread',
    };
    allNotifications.unshift(newNotification);
    saveNotifications(allNotifications);
}

// Function to get notifications for the admin
export function getAdminNotifications(): AppNotification[] {
    if (typeof window === 'undefined') {
        return [];
    }
    return initializeNotifications().filter(n => n.userId === 'admin');
}

// Function to get notifications for a specific user
export function getUserNotifications(userId: string): AppNotification[] {
    if (typeof window === 'undefined') {
        return [];
    }
    return initializeNotifications().filter(n => n.userId === userId);
}

// Function to mark all admin notifications as read
export function markAdminNotificationsAsRead() {
    const allNotifications = initializeNotifications();
    allNotifications.forEach(n => {
        if (n.userId === 'admin') {
            n.status = 'read';
        }
    });
    saveNotifications(allNotifications);
}

// Function to mark all user notifications as read
export function markUserNotificationsAsRead(userId: string) {
     const allNotifications = initializeNotifications();
     allNotifications.forEach(n => {
        if (n.userId === userId) {
            n.status = 'read';
        }
    });
    saveNotifications(allNotifications);
}
