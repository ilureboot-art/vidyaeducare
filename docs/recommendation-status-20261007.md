# Recommendation verification — 7 October 2026

None of the full security/scoring/migration phases is marked completed. Repository implementation, a successful build, and verified production operation are separate states.

| Recommendation | Evidence and remaining work |
| --- | --- |
| Server-only paid subscription/activation | Pending. Student mockTestSubscribed and activation codes remain client editable until server/client migration and verified legacy classification are complete. |
| Private live answer keys and authoritative scoring/timing/ranking | Pending. Existing mock-test page still reads answers and calculates results in the browser. |
| Private student reads and safe registration | Rules candidate tested: parent-bound reads, immutable parent ownership, server registration, protected user subscription/role fields. Production publication pending; full allowed-field/admin capability matrix still pending. |
| Server-owned ReferBolt | Rules candidate tested: owner may update boolean autoRenew only; creation/deletion and economic fields are server-only. Production publication pending. |
| Subscription expiry per attempt | Pending authoritative attempt service and trusted entitlement migration. |
| AI authentication, entitlement, quota and budgets | Pending bounded server gateway and persisted usage controls. |
| QuizClash verified participant/server score writes | Pending client/API migration; public write rule is not silently tightened before replacement. |
| Deadline/autosave/resume | Pending server attempt engine. |
| Promotion dates and completed-test policy | Pending explicit admin campaign dates and business-policy decision. No recurring June policy is guessed. |
| Withdrawal reservations/idempotency | PR #23 merged; unit/real transaction emulator tests passed. Exact production browser acceptance remains pending. Legacy callers without requestId remain compatible but lack retry idempotency. |
| Indexed UTR validation | UTR claims exist; approval still scans legacy transactions. Legacy migration/collision review and removal of scan remain pending. |
| FCM background approval alerts | Pending push configuration, role-targeted delivery, service worker and actual device acceptance. |
| Consistent admin role/field permissions | Server capability matrix and revoked-token/verified-master checks exist. Full Firestore/client matrix and adversarial acceptance pending. |
| Final Privacy/Terms | Placeholder text remains. Final refund, retention/deletion and AI-upload terms need concrete business text and review. |
| Paginated lists | Recent notification listener bounded to 50; explicit acknowledgement implemented in PR #22. Full notification history/admin list pagination/global unread counts pending. |
| Admin Operations Dashboard | Approval inbox/readiness exists. Unified failed-job, due-payout and expiry view pending. |
| Wallet Reconciliation Report | PR #23 adds a Finance-only reservation API with bounded scans and incomplete flags. Full bank/immutable-ledger reconciliation and report UI pending. |
| IBA Earnings Statement | Dashboard has sales/payout data. Complete sale-wise statement, split/reversal reconciliation and export pending. |
| Student Learning Plan | Existing goals/mistake notebook retained. Weak-topic weekly recommendations pending. |
| Parent Weekly Report | Pending report generation, opt-in and verified recipients. |
| Question Quality Review | Pending duplicate, answer-key and translation review/approval workflow. |
| Reward Dispute Review | Eligibility report exists; dispute cases, rank freeze and payout review pending. |
| Deployment Health Dashboard | Readiness endpoint exists but does not verify Current commit/rollout. Full server-verified deployment/service/test view pending. |

## Current rules candidate validation

TypeScript check passed; 160 application tests passed. Three real Firestore rules emulator tests passed for parent-only student reads, ownership takeover rejection, autoRenew allowance, subscription/commission forgery denial, user creation/paid-role forgery denial and unverified-master denial. Emulator project is fixed to `demo-vidya-profile-rules`; no production data is used.

Run: `npx --yes firebase-tools@14.12.0 emulators:exec --only firestore --project demo-vidya-profile-rules --config firebase.rules-emulator.json 'RUN_PROFILE_RULES_EMULATOR=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:9081 npx vitest run src/lib/profile-rules.emulator.test.ts'`.

These tests do not validate named-database production publication, paid student activation, answer-key migration, every admin screen or all legacy records. Publish only the reviewed rules candidate to the existing named database after confirming compatible registration/ReferBolt callers. App Hosting rollout does not publish Firestore Rules.
