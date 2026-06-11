
# Vidya EduCare - Academic Excellence Platform

A comprehensive NextJS platform for Vidya EduCare, combining regional academic preparation with AI-powered learning tools and a structured referral ecosystem.

## 🛡️ Central Development Strategy (GitHub-First)
To ensure maximum stability and synchronization, this project follows a **GitHub-Centric** lifecycle:

1.  **Central Source of Truth (GitHub)**: Your repository is the master record. All code, prompts, and configurations live here.
2.  **Engineering Hub (Firebase Studio AI Chat)**: Use this environment for all **active prompting-based development**. This is where you talk to the AI to build features, UI, and database logic.
3.  **AI Intelligence (Google AI Studio)**: Use this for prompt engineering and model tuning. The platform is now fully synchronized with the latest `gemini-flash-latest` models for optimal performance.
4.  **Production Engine (Firebase App Hosting)**: Automatically pulls from GitHub to deploy your live site.

## 🎓 Guest & Trial Mode
Vidya EduCare offers a **Zero-Registration Trial Experience**. Guests can immediately try:
- **AI Doubt Solver**: 5 free bilingual queries (Fully Operational).
- **AI Notes Generator**: 5 free textbook summary generations (Fully Operational).
- **Trial Arena**: A 5-question mock test with instant global ranking.

Registration is only required for full access to curriculum-specific mock tests, leaderboard cash prizes, and the referral earning systems.

## 🚀 Readiness & Deployment

### 1. Infrastructure Setup
Before going live, configure the Firebase project and the named Firestore instance.
- **Guide**: See [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for detailed instructions.
- **Named Database**: The app targets `vidyaeducaredatabase` (Native Mode).
- **Active URL**: `https://studio--vidyaeducare.us-central1.hosted.app`

### 2. Operational Initialization
Once deployed:
- Navigate to `/admin/setup`.
- Click **"STEP 1: AUTH ADMIN"** to verify the master identity.
- Click **"STEP 2: MAP TO DATABASE"** to initialize global configurations.

### 🔑 Default Master Credentials
- **Access URL**: `/admin/login`
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`

---
© 2024 Vidya EduCare. All rights reserved.
