# StoryTeller AI deployment

StoryTeller defaults to disabled until its Cloud Run renderer URL and shared secret are configured. Deploy the renderer before enabling purchases in Admin.

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

After setting both App Hosting secrets, bind `STORYTELLER_RENDERER_URL` and
`STORYTELLER_RENDERER_SECRET` in `apphosting.yaml` and deploy a new rollout.
Do not bind absent secrets in the initial application rollout.

Configure the same `STORYTELLER_RENDERER_SECRET` on Cloud Run and App Hosting. Configure `STORYTELLER_RENDERER_URL` with the Cloud Run service URL. Grant the App Hosting runtime service account `roles/run.invoker`; the application sends a Google-signed ID token with every dispatch.

## Safe activation

1. Deploy with StoryTeller disabled in Admin.
2. Upload the fixed demo MP4.
3. Confirm the renderer health endpoint.
4. Test with a low-balance test user, then a funded test user.
5. Verify one wallet debit, one order, one job, private output, signed download, retry and refund.
6. Enable StoryTeller in Admin only after the end-to-end test passes.

Rollback: disable StoryTeller in Admin immediately. This blocks new checkouts without changing or deleting paid orders. Keep the renderer available until existing paid jobs are completed or refunded.

## Sanjay custom narration voice (optional)

The attached `sanjay voice.mp3` is a private 15-second reference recording. Do not commit this recording, a voice-cloning key, or consent recordings to the public repository or demo assets. The stock Google Text-to-Speech voice cannot copy a person's voice from this file.

Chirp 3 Instant Custom Voice requires Google allow-list access and **separate** reference and prescribed consent recordings for each target locale (`mr-IN`, `hi-IN`, `en-IN`). The reference and consent recordings must be mono, at most 10 seconds each, and recorded in the same environment; a 15-second reference must be trimmed and checked first. A single key is not documented to transfer among these three locales. See Google's Instant Custom Voice documentation for the exact prescribed consent scripts and key-generation flow. Obtain the speaker's consent before provisioning. Do not send keys to the browser.

After successfully generating and testing the three language-specific cloning keys, set Cloud Run *secrets* `STORYTELLER_CUSTOM_VOICE_MR_IN`, `STORYTELLER_CUSTOM_VOICE_HI_IN`, and `STORYTELLER_CUSTOM_VOICE_EN_IN` on the renderer service. Set `STORYTELLER_CUSTOM_VOICE_READY=true` on the App Hosting backend **only after** all three work in staging. In Admin > StoryTeller > Voices, add three entries with the same ID and distinct languages:

```
SANJAY_VOICE|Sanjay Voice|Marathi|MALE
SANJAY_VOICE|Sanjay Voice|Hindi|MALE
SANJAY_VOICE|Sanjay Voice|English|MALE
```

Until the readiness flag is set, this voice stays hidden in the public config and the checkout rejects direct requests before wallet deduction. The renderer fails rather than silently replacing a custom voice with another voice if a key is missing. Existing Google voices and paid download flows continue to work. Validate native pronunciation and render/download in all three languages in staging before enabling purchases. Remove the three Admin voice entries and unset readiness to stop new custom-voice checkouts; retain the renderer until paid jobs finish or are refunded.
