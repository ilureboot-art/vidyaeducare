# StoryTeller AI deployment

StoryTeller is intentionally disabled at the generation boundary until its Cloud Run renderer URL and shared secret are configured. Deploy the renderer before enabling purchases in Admin.

## Required APIs

- Cloud Run and Cloud Tasks
- Cloud Build and Artifact Registry
- Cloud Text-to-Speech
- Cloud Storage
- Secret Manager
- Firestore

## Renderer environment

- `FIREBASE_STORAGE_BUCKET`: the Vidya Educare Firebase Storage bucket
- `FIRESTORE_DATABASE`: `vidyaeducaredatabase`
- `APP_CALLBACK_URL`: the public Firebase App Hosting URL
- `CLOUD_RUN_SERVICE_URL`: the renderer service URL
- `CLOUD_TASKS_LOCATION`: `asia-south1`
- `CLOUD_TASKS_QUEUE`: `storyteller-render`
- `CLOUD_TASKS_SERVICE_ACCOUNT`: service account used for task OIDC tokens
- `GEMINI_API_KEY`: server-side secret
- `STORYTELLER_RENDERER_SECRET`: a strong shared secret

The renderer service account needs read/write access to the StoryTeller Firestore records, object creation access to the private output prefix, and Text-to-Speech access. Cloud Run IAM and the application-level shared-secret check are both enforced.

## Deployment order

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com texttospeech.googleapis.com secretmanager.googleapis.com cloudtasks.googleapis.com
gcloud tasks queues create storyteller-render --location asia-south1
gcloud run deploy vidya-storyteller-renderer --source services/storyteller-renderer --region asia-south1 --no-allow-unauthenticated
firebase apphosting:secrets:set STORYTELLER_RENDERER_URL
firebase apphosting:secrets:set STORYTELLER_RENDERER_SECRET
firebase deploy --only firestore:rules,storage --project YOUR_FIREBASE_PROJECT_ID
```

Configure the same `STORYTELLER_RENDERER_SECRET` on Cloud Run and App Hosting. Configure `STORYTELLER_RENDERER_URL` with the Cloud Run service URL. Grant the App Hosting runtime service account `roles/run.invoker`; the application sends a Google-signed ID token with every dispatch.

## Safe activation

1. Deploy with StoryTeller disabled in Admin.
2. Upload the fixed demo MP4.
3. Confirm the renderer health endpoint.
4. Test with a low-balance test user, then a funded test user.
5. Verify one wallet debit, one order, one job, private output, signed download, retry and refund.
6. Enable StoryTeller in Admin only after the end-to-end test passes.

Rollback: disable StoryTeller in Admin immediately. This blocks new checkouts without changing or deleting paid orders. Keep the renderer available until existing paid jobs are completed or refunded.
