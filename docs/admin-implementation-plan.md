# Admin implementation plan — 3 October 2026

## Verified baseline
PR #14 commit 4962648840b7538119de4e9394472ddd0c674fc3 is Current / Release succeeded. Published Firestore notification, paid-only ranking and IBA rules were inspected. Storage rules match the repository; an unauthenticated private-audio read was denied in Rules Playground. The protected fixed audio loads with nodownload.

## Open dependencies and acceptance checks
- StoryTeller persisted settings still contain legacy video copy and durations. Publish corrected audio-only copy and 30/60/90/120 options; reload to verify persistence.
- Google own-voice approval, provider endpoint/key and renderer health remain unverified. Do not enable paid generation until successful synthesis, mixing, signed download and failure-refund tests.
- No live pending payments, IBAs or paid student subscriptions are available. Test notification delivery and reward eligibility using designated test accounts, without changing real wallet balances or IBA decisions.
- Investigate the separate asia-south1 failed build using its logs. A successful studio rollout does not clear this check.
- Student profile end-to-end checks need linked test students and both paid/free test entitlements.

## Ordered implementation
1. Publication usability and truthful readiness: use an in-page confirmation for StoryTeller settings; replace hardcoded health claims with authenticated read-only checks and checked timestamps.
2. Approval Inbox: combine pending payments, eligibility and payouts, show request age, refresh and existing review links. No payment approval logic changes. Bound queries and disclose truncation.
3. In-app notification tracking: live updates, unread filters, read acknowledgements, explicit query errors. Track in-app creation/read separately from push delivery; do not call a stored record delivered.
4. Audit trail: central server-written actor/action/entity/before/after records for admin mutations; redact sensitive values; paginate and restrict reads. Migrate client payment decisions to authenticated server APIs before relying on a global audit record.
5. Admin roles: design finance/academic/support permissions, enforce them in server APIs and rules, preserve master recovery and migrate existing admins. Verify denied operations before rollout.
6. Deposit verification: duplicate UTR detection with bank-account/reference scope and atomic idempotency; suspicious-request review and configurable auto-approval. Preserve existing legitimate requests.
7. Reward eligibility report: paid/free access, live/completed attempt and exclusion reason; admin export and reconcile against per-test/monthly winners.
8. Bulk-action preview: affected-record counts, validation, audit metadata and recovery path; reuse existing CSV preview/rescheduling features.

Each stage: appropriate automated checks → review diff → commit/merge → verify exact Current rollout → live acceptance checks. Existing features and policy amounts are preserved. Stages 1–3 have implementation changes prepared. Stages 4–8 remain planned; release and live acceptance are tracked separately.
