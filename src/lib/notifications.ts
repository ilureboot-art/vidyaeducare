
'use client';

export type AppNotification = {
    id: string;
    type: 'new_user' | 'deposit_request' | 'withdrawal_request' | 'deposit_received' | 'withdrawal_approved' | 'deposit_rejected' | 'withdrawal_rejected';
    message: string;
    timestamp: string;
    status: 'read' | 'unread';
    userId: 'admin' | string; // 'admin' for admin notifications, or a specific user ID
};
