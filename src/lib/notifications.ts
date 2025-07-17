
export type AppNotification = {
    id: number;
    type: 'new_user' | 'deposit_request' | 'withdrawal_request' | 'deposit_received' | 'withdrawal_approved';
    message: string;
    timestamp: string;
    status: 'read' | 'unread';
    userId: 'admin' | string; // 'admin' for admin notifications, or a specific user ID
};

const notifications: AppNotification[] = [];

// Function to add a new notification
export function addNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'status'>) {
    const newNotification: AppNotification = {
        ...notificationData,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'unread',
    };
    notifications.unshift(newNotification);
}

// Function to get notifications for the admin
export function getAdminNotifications(): AppNotification[] {
    return notifications.filter(n => n.userId === 'admin');
}

// Function to get notifications for a specific user
export function getUserNotifications(userId: string): AppNotification[] {
    return notifications.filter(n => n.userId === userId);
}

// Function to mark all admin notifications as read
export function markAdminNotificationsAsRead() {
    notifications.forEach(n => {
        if (n.userId === 'admin') {
            n.status = 'read';
        }
    });
}

// Function to mark all user notifications as read
export function markUserNotificationsAsRead(userId: string) {
     notifications.forEach(n => {
        if (n.userId === userId) {
            n.status = 'read';
        }
    });
}

// Seed with some initial data for demonstration if needed
// addNotification({
//     type: 'new_user',
//     message: 'A new user, Bob, has just signed up.',
//     userId: 'admin',
// });
