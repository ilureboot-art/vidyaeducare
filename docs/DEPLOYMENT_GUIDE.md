
# 🚀 Vidya EduCare - Deployment & Go-Live Guide

Follow these steps to deploy and manage the Vidya EduCare platform using the **Centralized GitHub Workflow**.

## 1. The "Central Hub" Workflow
The best way to manage this project is to treat **GitHub** as your central hub.

*   **Firebase Studio** sends code to GitHub.
*   **Google AI Studio** provides keys and logic that are stored in the code on GitHub.
*   **Firebase App Hosting** deploys directly from GitHub.

## 2. Firebase Project Setup

### Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `vidyaeducare`.
3. Enable **Email/Password** provider.

### Firestore (Named Database)
**CRITICAL**: This application uses a specific database instance named `vidyaeducaredatabase`.
1. Navigate to **Firestore Database**.
2. Click the database selector at the top and select **Create database**.
3. Set the **Database ID** to `vidyaeducaredatabase`.
4. Select **Native mode** and choose a location (e.g., `asia-south1`).

## 3. AI Synchronization (Intelligence vs. Code)
*   **Automatic Sync**: Changes to API Keys and "Tuned Models" in Google AI Studio reflect instantly in your app once secrets are set.
*   **Manual Sync (Prompt Engineering)**: When you refine a prompt in the Google AI Studio Playground, you **must** copy the text and paste it into the relevant file in `src/ai/flows/` here in the Studio. This ensures your "Intelligence" version matches your "Code" version.

## 4. Deploying via Firebase App Hosting

1. **Initialize Backend**:
   ```bash
   firebase apphosting:backends:create --project vidyaeducare
   ```

2. **Configure Secrets**:
   Map your `GEMINI_API_KEY` from Google AI Studio to an App Hosting secret:
   ```bash
   firebase apphosting:secrets:set GEMINI_API_KEY
   ```

3. **Live Push**:
   Push your changes to GitHub. App Hosting will detect the push and update your live site.

---
© 2024 Vidya EduCare Operations.
