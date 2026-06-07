
# Vidya EduCare - Admin & User Platform

This is a comprehensive NextJS application for Vidya EduCare, combining academic excellence with AI-powered learning tools and a rewarding referral system.

## 🔑 Login Credentials

### 1. Administrator Account
- **Access URL**: `/admin/login`
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`

### 2. Standard User (Test Account)
- **Access URL**: `/login`
- **Email**: `student@vidyaeducare.com`
- **Password**: `password123`
- *Note: Use the "Create Test User" tool at `/admin/setup` to initialize these accounts.*

## 🚀 Key Features

### For Students (Users)
- **AI Doubt Solver**: Get instant bilingual (Marathi/English) conceptual explanations for any MCQ during test review.
- **AI Notes Generator**: Personalized study notes created automatically based on your test performance.
- **Quiz Clash**: Compete in live tournaments for prize pools or practice for glory.
- **Wallet System**: Manage funds for subscriptions and tournament entries.

### For Administrators
- **Business Intelligence**: Real-time tracking of registrations, revenue, and academic volume.
- **Test Set Management**: Create MCQs manually, via AI generation, or bulk-upload via **CSV format**.
- **Recommendation Discount**: Dynamic pricing system that rewards users for referring 2 new customers within 30 days.
- **Global Configuration**: Manage boards, standards, subjects, and payment gateway details.

## 🛠️ Security & Stability
- **Deterministic Navigation**: Implemented a navigation mutex to prevent infinite redirection loops.
- **Role-Based Access**: Strict isolation between Admin and User zones.
- **Role Caching**: Synchronous session caching for instant dashboard loading.

## 📝 Setup Instructions
1. Navigate to `/admin/setup`.
2. Click **"Configure Head Admin"** to create the master account.
3. Click **"Create Test User"** to set up a student profile for testing.
