# 🚀 Vidya EduCare - Deployment & Go-Live Guide

Follow these steps to deploy the Vidya EduCare platform to production using **Firebase App Hosting**.

## 1. Firebase Project Setup

### Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project: `vidyaeducare`.
3. Navigate to **Authentication** > **Sign-in method**.
4. Enable **Email/Password**.

### Firestore (Named Database)
**CRITICAL**: This application is hardcoded to use a specific database instance named `vidyaeducaredatabase` to ensure native mode performance.
1. Navigate to **Firestore Database**.
2. Click the database selector at the top (usually says `(default)`).
3. Select **Create database**.
4. Set the **Database ID** to `vidyaeducaredatabase`.
5. Select **Native mode**.
6. Choose a location (e.g., `asia-south1` for India).
7. Start in **Production Mode**.

## 2. AI & Security Configuration

### Google AI Studio (The AI Engine)
The app uses Google Gemini for AI tutoring.
1. Get an API key from the [Google AI Studio](https://aistudio.google.com/).
2. **Reflecting Changes**: Any changes to your API key restrictions or "Tuned Models" in AI Studio reflect in your app instantly.
3. **Prompt Refinement**: When you improve a prompt in the AI Studio playground, remember to copy it into the corresponding `src/ai/flows/` file in this project to update the production behavior.

## 3. Deploying via Firebase App Hosting

Firebase App Hosting is the recommended way to host this Next.js 14+ application.

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login and Initialize**:
   ```bash
   firebase login
   firebase apphosting:backends:create --project vidyaeducare
   ```

3. **Configure Secrets**:
   When prompted during setup or via the console, map the `GEMINI_API_KEY` from Google AI Studio to a secret in App Hosting.
   ```bash
   firebase apphosting:secrets:set GEMINI_API_KEY
   ```

4. **Deploy**:
   Push your code to the connected GitHub repository. Firebase App Hosting will automatically detect the Next.js environment and deploy.

## 4. 🔄 Synchronization Workflow

To keep your development in **Firebase Studio** in sync with your live environment:

1. **Continue Developing Here**: Make all your changes, UI updates, and feature additions right here in the Studio.
2. **Push to GitHub**: Every change you save here is pushed to your GitHub.
3. **Automatic Live Update**: Firebase App Hosting sees the push and updates your live site automatically.
4. **Google AI Studio**: Use it exclusively for managing your Gemini API keys and training custom models. Your app here will automatically use the latest engine settings you've configured there.

---
© 2024 Vidya EduCare Operations.