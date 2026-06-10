# Vidya EduCare - Academic Excellence Platform

A comprehensive NextJS platform for Vidya EduCare, combining regional academic preparation with AI-powered learning tools and a structured referral ecosystem.

## 🚀 Readiness & Deployment

### 1. Infrastructure Setup
Before going live, you must configure the Firebase project and the named Firestore instance.
- **Guide**: See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for step-by-step instructions.
- **Named Database**: The app targets `vidyaeducaredatabase` (Native Mode).
- **Active URL**: `https://studio--vidyaeducare.us-central1.hosted.app`

### 2. Operational Initialization
Once deployed:
- Navigate to `/admin/setup`.
- Click **"STEP 1: AUTH ADMIN"** to verify the master identity.
- Click **"STEP 2: MAP TO DATABASE"** to initialize global configurations and security rules.
- **IMPORTANT**: Once the Head Admin is created, change the default password in settings immediately.

### 🔑 Default Master Credentials
- **Access URL**: `/admin/login`
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`

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