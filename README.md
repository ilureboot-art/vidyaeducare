# Vidya EduCare - Admin & User Platform

This is a comprehensive NextJS application for Vidya EduCare, combining academic mock tests with a rewarding referral system.

## Admin Credentials
- **Login URL**: `/admin/login`
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`

## Admin Account Features

### 1. Business Intelligence
- **Analytics Dashboard**: Real-time tracking of total users, revenue, and academic engagement.
- **User Management**: View, manage, and take action (ban/unban) on all player accounts.
- **Transaction Ledger**: Approve or reject financial requests with automatic wallet synchronization.

### 2. Content & Education
- **AI-Powered Question Bank**: Generate MCQs using AI, upload via CSV, or create them manually.
- **Mock Test Scheduler**: Set dates and times for academic tests across different boards and standards.
- **Quiz Clash Management**: Create live tournaments with prize pools and automated daily scheduling.

### 3. Platform Configuration
- **Store Settings**: Manage subscription packages (1 Year, 6 Months) and ReferBolt access.
- **Academic Config**: Dynamically update available Boards, Standards, and Subjects.
- **Payment Gateway**: Configure Bank and UPI details for user deposits, including QR codes.

### 4. Growth & Support
- **ReferBolt & IBA Management**: Track referral cycles, commissions, and sub-admin performance.
- **Live Support Chat**: Real-time communication with users directly from the admin panel.
- **System Status**: Monitor the operational health of APIs, Databases, and AI services.

## Security Note
The application uses strict role-based access control (RBAC). Admin accounts are isolated from the user environment. Non-admin users are strictly prevented from accessing any `/admin/*` routes.
