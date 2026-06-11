# Vidya EduCare - Academic Excellence Platform

A comprehensive NextJS platform for Vidya EduCare, combining regional academic preparation with AI-powered learning tools and a structured referral ecosystem.

## 🔄 Development & Synchronization Loop
This project uses a hybrid development workflow designed for maximum agility:

1. **Development (Firebase Studio)**: All coding, UI design, and database logic happens in Firebase Studio.
2. **Version Control (GitHub)**: Code is pushed from Studio to your GitHub repository.
3. **Live Deployment (Firebase App Hosting)**: Your live project is linked to GitHub. Every push automatically triggers a production build.
4. **AI Intelligence (Google AI Studio)**: Manage your Gemini API keys and fine-tune AI behavior in Google AI Studio. The app here consumes those services via the keys set in App Hosting secrets. **Note**: While keys and tuned models reflect live, prompt text changes should be copied from AI Studio playground into your code files here.

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

---
© 2024 Vidya EduCare. All rights reserved.