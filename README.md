# Welcome to Antigravity!

Welcome to your new developer home! Your Firebase Studio project has been successfully migrated to Antigravity.

Antigravity is our next-generation, agent-first IDE designed for high-velocity, autonomous development. Because Antigravity runs locally on your machine, you now have access to powerful local workflows and fully integrated AI editing capabilities that go beyond a cloud-based web IDE.

## Getting Started
- **Run Locally**: Use the **Run and Debug** menu on the left sidebar to start your local development server.
  - Or in a terminal run `npm run dev` and visit `http://localhost:9002`.
- **Deploy**: You can deploy your changes to Firebase App Hosting by using the integrated terminal and standard Firebase CLI commands, just as you did in Firebase Studio.
- **Cleanup**: Cleanup unused artifacts with the @cleanup workflow.

Enjoy the next era of AI-driven development!

File any bugs at https://github.com/firebase/firebase-tools/issues

**Firebase Studio Export Date:** 2026-06-17


---

## Previous README.md contents:

# Vidya EduCare - Academic Excellence Platform

A comprehensive NextJS platform for Vidya EduCare, combining regional academic preparation with AI-powered learning tools and a structured referral ecosystem.

## 🛡️ Central Development Strategy (GitHub-First)
To ensure maximum stability and synchronization, this project follows a **GitHub-Centric** lifecycle:

1.  **Central Source of Truth (GitHub)**: Your repository is the master record. All code, prompts, and configurations live here.
2.  **Engineering Hub (Firebase Studio AI Chat)**: Use this environment for all **active prompting-based development**. This is where you talk to the AI to build features, UI, and database logic. Changes here save to GitHub.
3.  **AI Intelligence (Google AI Studio)**: Use this for prompt engineering and model tuning. **Note**: This is a manual sync. When you refine a prompt in AI Studio, you must copy it back into the code files in Firebase Studio.
4.  **Production Engine (Firebase App Hosting)**: Automatically pulls from GitHub to deploy your live site.

## 🎓 Operational Readiness Checklist (Go-Live)
Before inviting users, you must complete the following steps in your production environment:

1. **Named Database Setup**: In the Firebase Console, you **MUST** create a Firestore database named exactly `vidyaeducaredatabase` in Native Mode.
2. **System Initialization**: 
    - Navigate to `/admin/setup` on your production URL.
    - Perform **STEP 1: AUTH ADMIN** to verify the master account.
    - Perform **STEP 2: MAP TO DATABASE** to generate default prices, subjects, and boards.
3. **AI Secrets**: Add your `GEMINI_API_KEY` to your Firebase App Hosting secrets manager.

## 🔑 Master Admin Access
- **Email**: `admin@vidyaeducare.com`
- **Password**: `password123`
- **Login URL**: `/admin/login`

## 🚀 Guest & Trial Features
Vidya EduCare offers a **Zero-Registration Trial Experience** to drive conversion:
- **AI Doubt Solver**: 5 free bilingual queries (Bilingual Marathi/English).
- **AI Notes Generator**: 5 free textbook summary generations.
- **Trial Arena**: A 5-question mock test with instant global ranking.

Registration is only required for full access to curriculum-specific mock tests, leaderboard cash prizes, and the referral earning systems.

---
© Vidya EduCare. All rights reserved.
