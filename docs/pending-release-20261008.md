# Pending coordinated release — 8 October 2026

No merge, deployment or production data correction is authorized in this preparation phase. Keep PRs open until the coordinated release.

## Question review
The source was read only: 131 flagged sets from the 1,199-set preflight. The earlier row parser appended the first digit of the set name to 119 IDs; question-format-preflight-20261008.md now contains original document IDs.

The key-free review manifest records source versions, question IDs and reasons, never answer keys. 62 sets pass the conservative formatting proposal; 69 need further academic review. This is formatting validation, not certification of factual correctness. Supported agreeing legacy markers include Option A–H, Marathi अ/ब/क/ड and Eng/Mar label suffixes. Exact option text takes precedence. No missing key is guessed; conflicting suffixes/keys, duplicate choices and missing translations remain blocked. No production set has changed.

The Academic-only repair endpoint provides preview hash and transactional version checks. Applying a complete valid set creates a private source backup and audit entry in the same transaction. Historical attempt snapshots/results are not changed. The repair screen is /admin/question-bank/repair. Restrict private backup reads with the candidate rules before applying data repairs.

## AI quotas
All three AI action wrappers enforce persisted trial quotas, active server-owned paid expiry, Academic authorization for question generation, input/output bounds, provider token limits, global daily call ceiling, network trial ceiling, throttling and request idempotency. Provider failure consumes the reservation. No real provider call was made in these tests.

The default five free attempts remain. Paid defaults to 100 daily requests; global defaults to 1,000 provider requests. These are call/token limits, not a verified rupee billing cap. Configure configs/aiUsage and enable Firestore TTL on aiUsageRequests.expiresAt during release. Cached outputs remain private. The Tutor and Notes screens now display remaining quota from the server, check verified entitlement rather than legacy booleans, and refresh after each provider attempt. Marketing no longer promises unlimited access.

## Acceptance still required
Private-key migration and scoring/QuizClash candidate is PR #28. Release must avoid interrupting active legacy attempts. Verify staging and an authorized paid parent before production. Production provider billing, device FCM, full wallet/UTR migration, wider role enforcement and academic reports are not completed merely by these PRs. Nothing has been added to the completed tracker.

## Validation
180 application tests pass; 17 emulator-dependent tests are skipped in the ordinary run. Final isolated emulator verification is recorded in the PR. Nine question repair edge-case tests pass, including exact text precedence, Marathi labels, CSV column shift, identical paired choices, conflicting keys and duplicate IDs. TypeScript and production build pass. Provider billing, production migrations and device push remain unverified.
