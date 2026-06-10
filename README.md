# Vidya EduCare - Academic Excellence Platform

A comprehensive NextJS platform for Vidya EduCare, combining regional academic preparation with AI-powered learning tools and a structured referral ecosystem.

## 🚀 Readiness Checklist

### 1. Infrastructure Setup
If this is the first deployment to a new project:
- Navigate to `/admin/setup`.
- Click **"STEP 1: AUTH ADMIN"** to verify the master identity.
- Click **"STEP 2: MAP TO DATABASE"** to initialize global configurations and security rules.
- **IMPORTANT**: Once the Head Admin is created, change the default password in settings immediately.

### 🔑 Default Master Credentials
- **Access URL**: `/admin/login`
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`

### 2. Live Operations
- **Admin Management**: Add sub-admins via the dashboard to help manage student registrations.
- **Store Settings**: Configure subscription packages and GST rates before accepting payments.
- **Mock Tests**: Upload CSV question banks for SSC, CBSE, or ICSE boards.

## 🛠️ Security Architecture
- **Named Database**: Exclusively targets `vidyaeducaredatabase` for native Firestore performance.
- **Regional Rules**: Multi-layered authorization ensuring strict isolation between administrators and students.
- **AI Tutoring**: Integrated with Gemini 2.5 Flash for bilingual (Marathi/English) conceptual explanations.

## 📊 Business Intelligence
- Real-time tracking of revenue, referral cycles, and academic engagement.
- Automated commission calculation for Independent Business Associates (IBA).
- ReferBolt passive income cycle management.

---
© 2024 Vidya EduCare. All rights reserved.