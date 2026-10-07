# Legacy access review and report UI — 7 October 2026

PR #24 commit d8a3f288cda456b1e765a23c1723ddb89701fc04 was verified Current in Firebase studio/us-central1, build-2026-10-07-005. The matching Firestore rules were published to vidyaeducaredatabase through Firebase Console, source SHA-256 1a7068d181f7438ba17863ccf7c6fb38c40374af0424f4b3756f4203c29c1bea. Reload confirmed the new starred production version. This proves release/publication, not completion of the full security phase or all user-flow acceptance.

## This release

- Admin Payment Reports provides a UI for the existing wallet reservation reconciliation API and a new legacy subscription inventory.
- Finance-capable roles only; server verifies revoked-token and role authorization. No automatic approval, migration, payment, or entitlement change.
- Each parent page has at most 20 users and at most 50 student records per user. A 51st record flags an incomplete scan. Code values and personal name/email/phone data are omitted.
- Client-editable paid booleans, old codes, and user subscription claims never count as verified payment. Rows explicitly require paid-order/provenance review before the trusted entitlement migration.
- Account/report switches clear stale data and invalidate outstanding responses. Reports use no-store responses and cursors. The wallet report remains reservation-only, not full bank or ledger reconciliation.

Validation: 166 application tests passed; four opt-in emulator tests skipped in the default run; TypeScript passed. Production build and exact rollout/live-page verification must be recorded separately after completion. No completed-tracker entry is added for full S03/W03: trusted payment evidence, collision resolution, approved migration, full ledger and bank comparison remain pending.

## Remaining ordered work

1. S01–S03: server student/activation APIs, immutable entitlement records, legacy evidence review and compatible client migration.
2. T01–T03: private answer keys, authoritative deadline/attempt/autosave, server score/ranking and test-set migration.
3. R02–R04: canonical code collision review, QuizClash server scoring and full role/field matrix.
4. A01–A02: authenticated AI gateway, persisted quotas and spend limits.
5. W02–W03: indexed UTR legacy migration, integer-paise immutable ledger, full reconciliation and cancellation.
6. N01–N03: background FCM/device acceptance, full pagination and operations dashboard.
7. P01–P03: approved campaign dates/final policies, verified deployment health and restoration exercise.
8. I01–I03/E01–E03: complete IBA statements, disputes, weekly learning/parent reports and question review.
9. ST02–ST05: renderer/provider setup, retry identity, independent adult auth and actual audio acceptance/demo. PR #19 remains draft until its prerequisites pass.

Business dates and final policy text, provider authorization/quotas and real-device push checks require concrete external evidence; defaults are not guessed.
