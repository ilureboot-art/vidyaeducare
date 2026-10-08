# StoryTeller scene narration and cinematic rendering release

## Implemented
- Validated scene plans (1–6 scenes; exact requested timeline), with explicit narration text, emotion and allowlisted effects.
- Gemini 2.5 Flash script planning and Gemini 2.5 Flash Preview TTS via REST, API audio bytes written directly on the server; no AI Studio manual download.
- Sequential scene narration; measured duration; modest tempo correction up to 1.25×; overlong speech fails rather than silently truncating.
- Original procedural music and ocean/wind/horn/footsteps/clock/heartbeat/splash/impact/alarm effects. These are synthesized effects, not studio recordings. Admin-provided licensed music still overrides the procedural score.
- Dynamic ducking toggle, loudness normalization, conservative limiter, MP3 encoding, full decode and duration checks before private Storage upload and READY.
- Per-scene provider tier and usage metadata retained for review. Metadata is not a final billing statement.
- Free quota failure does not enable paid use automatically. Paid fallback defaults OFF; only HTTP 429 may transition to the explicitly configured paid project.
- Paid requests reserve integer micro-USD against a per-job (including retries) and UTC daily budget before sending. Reservations are retained on failures conservatively. Output token limits bound calls. Rates are conservative estimates for the fixed models and must be reviewed against Google pricing before activation; other infrastructure costs are excluded.

## Production secrets and settings (not configured by this code change)
- `STORYTELLER_GOOGLE_FREE_API_KEY`: Secret Manager secret from a verified free-tier Google project, available to both planner and narration. Key name alone does not prove billing tier. Never put this in frontend code or GitHub.
- Optional `STORYTELLER_GOOGLE_PAID_API_KEY`: separate explicitly authorized paid project. Do not rotate free projects to evade quota.
- `STORYTELLER_MAX_JOB_USD_MICROS`, `STORYTELLER_DAILY_USD_MICROS`: positive integer upper reservation limits; paid calls fail without them. Admin `maxPaidJobUsdMicros` must also be positive and `paidFallbackEnabled` true.
- Existing renderer secret, Cloud Run/Tasks authenticated service URLs/accounts, named Firestore database, private Storage bucket and application callback URL remain required.
- Previous `GEMINI_API_KEY` / `STORYTELLER_GOOGLE_TTS_API_KEY` are no longer used by the AI pipeline: explicit tier keys prevent accidental paid-first use.

## Deployment and acceptance
1. Verify existing Cloud Run service, task queue and IAM; deploy this renderer with service OFF. This session could not access Cloud Run console; no production deployment or secret configuration was completed.
2. Verify free project tier and quota plus current model availability. Google pricing lists a free tier for `gemini-2.5-flash-preview-tts`; actual account access still needs a live test.
3. Configure secrets; verify health, authenticated queue dispatch and callback, and private output access. Keep Own Voice OFF.
4. Generate a non-customer Marathi sample and the 120-second Marseille demo through the real backend; listen for diction, speaker gender, dramatic timing, speech clipping and SFX placement. Repeat Hindi/English samples. Synthetic fixtures do not establish narration quality.
5. Verify wallet debit/retry/refund idempotency and separate adult enrollment before enabling purchases. Existing separate-host/auth and adult verification work is still outstanding.
6. Enable generation only after acceptance; retain an explicit admin paid fallback OFF unless a production spending budget has been authorized.

## Validation
`node --test services/storyteller-renderer/test/pipeline.test.js`: five tests, including actual FFmpeg rendering in both ducking modes and provider quota/fallback guards. API requests mocked; no live Google API synthesis is claimed.

Official references: https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/speech-generation.
