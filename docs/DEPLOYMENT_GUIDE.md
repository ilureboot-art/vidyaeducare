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

### Genkit API Key
The app uses Google Gemini for AI tutoring.
1. Get an API key from the [Google AI Studio](https://aistudio.google.com/).
2. You will need to add this to your deployment environment (see Step 3).

### Security Rules
The rules are automatically managed by the build process, but ensure the `firestore.rules` file in the root is synced. The app targets `vidyaeducaredatabase` explicitly in `src/firebase/client-init.ts`.

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
   When prompted during setup or via the console, map the `GEMINI_API_KEY` to a secret.
   ```bash
   firebase apphosting:secrets:set GEMINI_API_KEY
   ```

4. **Deploy**:
   Push your code to the connected GitHub repository. Firebase App Hosting will automatically detect the Next.js environment and deploy.
   **Target Deployment URL**: `https://studio--vidyaeducare.us-central1.hosted.app`

## 4. Final Infrastructure Mapping

Once the app is live:

1. Navigate to `/admin/setup`.
2. **STEP 1**: Click "AUTH ADMIN" and log in with:
   - **Email**: `admin@vidyaeducare.com`
   - **Password**: `password123`
3. **STEP 2**: Click "MAP TO DATABASE". 
   - This creates the `admins`, `users`, `wallets`, and `configs` collections.
   - It populates default mock test packages and academic standards.
4. **SECURE**: Immediately go to `/admin/login` and change the default password in account settings.

---
© 2024 Vidya EduCare Operations.