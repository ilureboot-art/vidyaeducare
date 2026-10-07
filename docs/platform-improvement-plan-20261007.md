# Vidya EduCare implementation plan — 7 October 2026

Status: approved to start implementation; production fixes are not complete.
Reviewed main: a69ed764c62b3e748fc53e5fd62c58fb4cdd45c2. StoryTeller PR #19 is separate and remains unmerged.

## Product requirements retained

- Ranking and cash prizes require a verified active paid subscription, including paid June students. Free promotion, trial and reward-free-month access do not qualify.
- Completed tests are practice only. Upcoming tests may advertise rewards, but only a valid live attempt qualifies.
- ₹5 to each referral participant is credited once after the first qualifying paid Mock Test subscription. No signup, free-test or renewal bonus.
- IBA and referral codes use one canonical owner mapping. Preserve primary 100% and primary/secondary 50–50 attribution rules and existing ReferBolt cycle policy.
- StoryTeller remains a separate adult product; Own Voice stays OFF pending provider authorization. Do not enable paid fallback without configured admin/environment budgets.
- Existing features must remain usable. Changes to promotion dates, final policy language, product prices and independent domain require concrete decisions, not guessed business rules.

## Ordered phases and acceptance criteria

| Phase | Implementation | Prerequisite and acceptance |
| --- | --- | --- |
| 0 — Verification baseline | Separate Vitest and Node renderer tests; inventory routes, fields, permissions and live release; add executable emulator and staging checks. | Both runners pass separately. Capture exact production commit/rules versions before rollout. Static rule-string tests do not prove enforcement. |
| 1 — Trusted enrollment and access | Server APIs for student create/update/delete and activation redemption. Entitlements backed by paid orders, validity dates, product and access type. One-use activation claimed atomically. Restrict student reads to owner and authorized admins. Make entitlement/ownership fields immutable to clients. Restrict users create and activationCodes writes. | Registration, multi-student purchase, activation, expiry and goals still work. Unauthenticated/other-parent writes denied. Migration dry run identifies legacy records without silently marking them paid. Backend and client migration must precede restrictive rules. |
| 2 — Server test engine | Split public question content from private answers. Server-issued attempt ID and authoritative deadline; answers-only submissions; server scoring and eligibility; one accepted attempt per student/test. Autosave/resume without extending time. Server writes result, leaderboard and student statistics atomically. | Tampered scores, leaked answer key, repeats, expired/unpaid submissions rejected. Late starts use remaining session time. Reload and retry preserve answers; completed practice never enters cash ranking. Migrate current test sets before restricting their reads. |
| 3 — ReferBolt and remaining rules | Client may change only approved autoRenew field; server owns subscription, cycle, commission and history. Migrate legacy mismatched codes using canonical wallet ownership, flag collisions for review. Restrict QuizClash result writes and implement server-authoritative tournament submissions. Align all admin reads/writes with role capabilities. | Owner cannot forge paid status, cycle progress, score or commission. Code identity and existing commission/cycle calculations preserved. Finance/Academic/Support/Head role matrix passes positive and negative tests. |
| 4 — AI entitlement and spend controls | Authenticated server gateway for tutor/notes/question generation. Persist trial usage and atomically reserve paid usage. Admin-only question generation; input/image limits, throttling and daily budgets; friendly errors without internal secrets. | Direct server-action invocation cannot bypass payment/trial limit. Parallel/replayed requests cannot spend unlimited quota. Trial remains available through explicit bounded guest identity; configure actual provider limits before enablement. |
| 5 — Wallet reliability | Available/reserved balances; stable withdrawal request ID; reserve on request, debit once on paid approval, release once on rejection/cancellation. Indexed normalized UTR claims with legacy migration and collision report. Exact integer-paise ledger and daily reconciliation. | Concurrent withdrawal/purchase cannot consume reserved money; retry/approve/reject is idempotent. Deposit approval still requires bank verification. Simulated bank tests only; no real transfer performed by tests. Audit records correlate request, ledger and actor. |
| 6 — Notifications and scalable operations | FCM permission/token lifecycle, background service worker, role-targeted approval deep links, deduplication, bounded notification lists and delivery records. Paginated admin lists and indexed filters. Operations dashboard for approvals, failed jobs, dues and expiry. | Foreground/background/installed Android-browser checks; revoked tokens handled. Push contains no student/payment secrets. Dashboard permissions mirror API roles; paging cannot skip/duplicate records. No stale push can approve an already-decided request. |
| 7 — Policy and release confidence | Admin-configured promotion dates/timezone/year and completed-test access policy. Replace privacy/terms placeholders with reviewed final text, versioned acceptance, retention/deletion and refund disclosures. Deployment health view using server-verified rollout data; backups and tested restoration. | Business policy signed off before changing June access. Final legal content reviewed before publication. Restore exercise succeeds; dashboard never labels an unverified build as Current. |
| 8 — IBA and financial reports | Earnings statements showing order, primary/secondary split, paid/free rate, reversals, ReferBolt progress and payouts. Reconciliation exceptions and approval workflow. Reward dispute cases, eligibility reasons, rank freeze and payout tracking. | Report totals reconcile with immutable ledger; refunds and disputed awards traced; exports preserve role/privacy boundaries. Manual evidence review for disputed outcomes. |
| 9 — Academic advances | Extend existing goals/mistake notebook into weak-topic weekly plans; parent weekly summaries; question duplicate/answer-key/translation quality review with human approval. | Do not rebuild existing goals features. Recommendations use authorized student data, have understandable reasons, and avoid presenting AI output as verified textbook truth. Messaging requires opt-in and approved recipients. |
| 10 — Independent StoryTeller acceptance | Continue PR #19 renderer/secrets/Tasks setup, callback state transitions and idempotency, actual free-tier verification, authorized paid fallback budgets, adult enrollment and independent auth/origin. Marathi/Hindi/English audio listening tests. Finish 120-second Marseille demo and homepage playback. | Generation remains OFF until auth, entitlement, quota, retries/refunds and media decoding pass. Duplicate READY must not double-count; stale FAILED cannot undo successful output. Do not claim finished audio without downloadable verified bytes. Hide demo download UI; streaming cannot guarantee absolute prevention of capture. Own Voice OFF. |

## Phase 1 migration design

1. Inventory students.parentId, mockTestSubscribed, activationCodes, user subscription dates and purchase transactions without exporting unnecessary personal data.
2. Define server-owned entitlement records containing owner/student IDs, order reference, product, access type, start/end, status and audit timestamps. Store sensitive proof separately from public profile fields.
3. Dry-run legacy classification: verified purchase, complimentary/free grant, expired or unresolved. Keep unresolved records for admin review; never infer paid status from a client-editable boolean alone.
4. Implement compatible authenticated endpoints and client callers, then staging tests and migration. Deny client entitlement/ownership changes only after all legitimate callers have migrated.
5. Use immutable server-paid evidence for both Firestore reads and attempts; preserve practice access according to the approved promotion policy.

## Release procedure for every phase

Small isolated PRs; focused tests; application typecheck/build when runtime code changes. For security-sensitive changes run emulator adversarial tests and staging multi-role checks. Back up necessary data, dry-run migrations and record affected counts. Deploy compatible backend/client first, then migration and stricter rules; verify the exact rollout commit and actual rules version. Roll back application behavior without restoring known-insecure rules; retain an audited recovery path. A merged PR or successful build alone is not verified production readiness.

## Current delivery

- Implementation plan documented with dependencies and acceptance criteria.
- First code change separates node:test renderer files from Vitest discovery; default Vitest excludes remain preserved. Renderer command: `node --test services/storyteller-renderer/test/pipeline.test.js` after PR #19 is present.
- Validation on the available combined local working copy: application tests 146/146; Node renderer tests 5/5.
- Phases 1–10 pending. No production rules, paid entitlements, money movement, prices or product settings changed in this delivery.
- External prerequisites: authenticated Firebase/Google Cloud deployment access, staging/emulator credentials, real provider project/quota verification, push credentials and device test access. Existing Cloud Run Console access was unavailable; do not assume it has recovered.

## Implementation backlog — no recommendation is silently dropped

Every item below requires implementation evidence, its acceptance tests, an exact release commit and production verification before it is marked complete. “Code tested” is not “live”. Phase order above controls dependencies; independent fixes may ship earlier.

| ID | Deliverable | Phase | Current state |
| --- | --- | --- | --- |
| V01 | Emulator authorization and staging multi-role checks | 0 | Pending environment setup |
| S01 | Authenticated student CRUD and owner-bound registration | 1 | Pending |
| S02 | Atomic activation redemption and server-owned entitlement | 1 | Pending |
| S03 | Legacy entitlement dry run and evidence review | 1 | Pending |
| S04 | Private student reads; immutable owner/paid fields; safe user creation | 1 | Pending compatible client migration |
| T01 | Private answer keys and test-set migration | 2 | Pending |
| T02 | Server attempt, remaining deadline, autosave/resume | 2 | Pending |
| T03 | Server score, duplicate protection, atomic results/ranking/stats | 2 | Pending |
| R01 | Server-owned ReferBolt subscription/cycle/commission | 3 | Pending |
| R02 | Canonical IBA/referral code collision report and migration | 3 | Pending |
| R03 | Server QuizClash scoring and private writes | 3 | Pending |
| R04 | Finance/Academic/Support/Head permission matrix | 3 | Pending enforcement tests |
| A01 | Authenticated tutor/notes/question gateway and bounded guest trial | 4 | Pending |
| A02 | Atomic AI usage limits, budgets, image/input limits, safe errors | 4 | Pending |
| W01 | Withdrawal reservations and idempotent decisions/retries | 5 | Pending |
| W02 | Indexed normalized UTR legacy migration and collision report | 5 | Pending |
| W03 | Integer-paise ledger, audit correlations and reconciliation | 5 | Pending |
| N01 | FCM tokens, background worker, deep links and deduplication | 6 | Pending credentials and device checks |
| N02 | Paginated admin/notification lists and indexed filters | 6 | Pending |
| N03 | Role-aware operations dashboard | 6 | Pending |
| P01 | Explicit promotion campaign dates/year/timezone | 7 | Pending business dates |
| P02 | Final privacy/terms, consent versioning, retention/refund rules | 7 | Pending final policy text |
| P03 | Verified deployment health, backups and restore exercise | 7 | Pending |
| I01 | Order-level IBA splits, reversals, ReferBolt and payout statements | 8 | Pending |
| I02 | Financial exceptions and approval workflow | 8 | Pending |
| I03 | Paid reward eligibility report, disputes, rank freeze, payout tracking | 8 | Pending |
| E01 | Weak-topic weekly plans extending goals/mistake notebook | 9 | Pending |
| E02 | Opt-in parent weekly summaries | 9 | Pending |
| E03 | Duplicate/answer/translation question review with human approval | 9 | Pending |
| ST01 | Terminal callback guards: duplicate READY and late FAILED protection | 10 | Code tested; deployment verification pending |
| ST02 | Per-attempt callback identity, stale retry protection and durable dispatch | 10 | Pending; ST01 does not cover separate retry attempts |
| ST03 | PR #19 renderer, secrets, Tasks IAM, verified free project/quota and budgeted fallback | 10 | Pending external setup and acceptance |
| ST04 | Independent adult registration/login/origin | 10 | Pending |
| ST05 | Marathi/Hindi/English listening QA, 120-second demo, protected homepage playback | 10 | Pending actual generated audio |

Previously delivered payment decisions/audit, duplicate UTR checks, approval inbox, bulk-action preview, paid reward logic, standard-wise student lists, editable registration/wallet instructions, study goals and ₹5 referral/canonical code changes remain in scope for regression verification. Their earlier delivery does not substitute for V01/R04 or full production end-to-end checks. Own Voice and generation remain OFF until their release prerequisites pass.

ST01 test coverage: simultaneous READY callbacks count once; late FAILED/GENERATING cannot regress READY; refunded output cannot be resurrected or refunded twice; aborted transaction attempts cannot dispatch a retry; malformed/missing-asset/negative-cost requests make no writes. These are transaction-mock regression tests, not a substitute for real-provider or emulator acceptance.

## Completed release tracker

Only entries with implemented code, passing acceptance tests and verified live release belong here. This is separate from the implementation backlog above. No new phase is marked completed yet.

## Next isolated release: notification list reliability

N02 partial implementation bounds the recent-notification subscription to 50 records, displays every loaded record in a scrollable list, scopes the unread badge and explicit read action to those recent records, removes automatic bulk marking when the popover opens, clears another account's state on sign-out/account switch and displays load/write failures. Older notifications remain stored. Full history pagination, admin lists, global unread counts and FCM remain pending. This partial release is not N02 completion.

## Wallet and authentication release candidate

- Server admin authentication and withdrawal authentication check revoked tokens. Master email bypass requires a verified email. Active database roles still use the existing capability matrix.
- New withdrawal requests atomically move money from available `balance` to `reservedBalance`. All existing purchase routes spend only available balance. Approval consumes the reservation without a second debit; rejection restores available funds once. Existing unreserved requests retain the old decision path. No legacy requests or balances are silently migrated.
- The wallet form sends a stable request ID across retries of the same payload. Matching repeated server requests return the same transaction; conflicting payloads cannot reuse the key. Legacy callers without a key remain compatible but do not gain retry idempotency.
- The wallet shows available and reserved funds separately. Decision audit records include reserved balances before/after.
- Finance-authorized `/api/admin/payments/reconciliation` paginates wallets and compares reservation totals with held pending withdrawals. Each account scan is bounded; incomplete scans explicitly require review rather than claiming a match. This is a reservation report API, not full bank/ledger reconciliation or a finished report UI.
- Tests cover concurrent duplicate withdrawals, insufficient parallel reservations, rejection release, held approval without double debit, revoked/unverified-master authentication, financial role denial and incomplete-report handling. Application tests: 159 passed; TypeScript/build passed. An isolated real Firestore emulator transaction test also passed for contention, release and settlement. This uses Admin SDK operations and does not validate deployed Security Rules or a production browser flow.
- Reproduce the isolated transaction test with `npx --yes firebase-tools@14.12.0 emulators:exec --only firestore --project demo-vidya-wallet --config tests/firebase-wallet-emulator.json 'RUN_WALLET_EMULATOR=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:9080 npx vitest run src/lib/wallet-reservations.emulator.test.ts'`. The fixed demo project and loopback guard prevent this test from targeting production.
- Full server scoring, answer-key migration, entitlement migration, restrictive student rules, integer-paise global ledger, cancellation flow, bank reconciliation and complete reports remain pending. No completed-tracker entry is added for this candidate.
