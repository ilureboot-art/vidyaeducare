# Trusted student activation release

This release migrates the existing parent profile create/activate/subjects/goals/remove callers to authenticated server actions. It does not complete the private-answer-key/server-scoring work.

- New purchases create random activation codes and server-only hashed claim documents linked to the completed purchase, owner, product, validity dates and paid/complimentary access type.
- Creation is owner-bound and idempotent for a stable request identifier. Registration cannot inject subscription, ownership, statistics or earnings fields.
- Activation checks completed purchase evidence and expiry, and consumes the code, creates the entitlement and updates the student in one transaction. Concurrent use by different students succeeds once. Repeating the same activation is safe.
- Paid and complimentary access remain distinct. The compatibility access helper checks new entitlement expiry; complimentary access cannot qualify as paid. Legacy booleans remain a compatibility path until the authoritative attempt service/migration is deployed.
- Removal archives the profile and revokes its entitlement; no historical payment or result records are deleted.
- Rules deny client creation/deletion of students, paid/ownership changes and all activation claim/code/entitlement writes. Ordinary student fields/statistics retain existing compatibility until the test engine migration. Full allowed-field and role enforcement remains pending.
- No legacy code is automatically trusted. Codes without server purchase evidence receive a review-required error. The live inventory preceding implementation contained 11 users, 5 students, no claimed paid students and no unused codes; no legacy paid entitlements were silently granted or migrated.

Validation: application tests, TypeScript, production build and isolated Firestore transaction/rule tests. The emulator uses a fixed demo project and loopback endpoint. Capture exact deployment and published rules source separately before recording production completion. Real paid purchase/activation acceptance is not performed on customer money by these tests.

Next: authoritative private answer keys, server attempts/deadline/autosave, score/ranking/statistics, then QuizClash/permissions, AI quotas, UTR/ledger, FCM/reports and academic advances.
