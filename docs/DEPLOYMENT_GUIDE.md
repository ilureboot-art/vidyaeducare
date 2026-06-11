
# 🚀 Vidya EduCare - Deployment & Go-Live Guide

Follow these steps to deploy and manage the Vidya EduCare platform using the **Centralized GitHub Workflow**.

## 1. The "Integrated Development" Workflow
The best way to manage this project is to treat **GitHub** as your central hub while using specialized studios for work.

*   **Firebase Studio (AI Chat)**: This is your **Prompting-Based Development Hub**. Use the chat here to build features, write UI code, and configure Firebase logic. Changes made here are saved to your repository.
*   **GitHub**: Acts as the master storage. It holds the "Production Ready" version of your code.
*   **Google AI Studio**: Provides keys and a playground for testing prompts. Copy successful prompts from AI Studio into `src/ai/flows/` in the code.
*   **Firebase App Hosting**: Deploys directly from GitHub every time you save a feature.

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
