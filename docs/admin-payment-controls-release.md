# Admin payment controls release

Status: implementation prepared; production release blocked until Firestore rule publication is available. Google/Firebase sign-in succeeded on 2026-10-03. The named database rules view is read-only; Cloud Shell and Google Cloud console return Site Unavailable in this browser. Do not merge the app before coordinating the rules publication.

## Changes

- Pending deposit/withdrawal decisions use an authenticated server transaction that rereads the payment state and wallet, checks UTR ownership, credits/debits once, and atomically records an immutable audit entry and notification.
- Bank confirmation and a decision reason are mandatory for approval. Rejection never credits/debits/refunds because pending withdrawals were never deducted. Withdrawal minimum ₹650 and retained balance ₹200 remain.
- User-entered UTRs never auto-credit. The old auto-approval control is disabled until a verified bank integration exists.
- Incoming/outgoing UTR namespaces are server-controlled. Incoming submissions use a deterministic unique claim, canonical uppercase/no-whitespace references and retry idempotency. Historical references are scanned in transactions so older spelling variants cannot bypass uniqueness. This full legacy scan is intentionally conservative and should be migrated to canonical claims before transaction volume grows significantly.
- Active Head, existing Sub-admin, Finance, Academic and Support roles are enforced by server permissions. Legacy active Sub-admin operational access remains; role mutations remain reserved for the existing master email accounts; no existing person receives broader role-management authority. Pending/rejected/unknown roles have no admin permission.
- Proposed Firestore rules enforce active membership, scoped financial/academic/configuration writes, prevent client payment decisions and audit tampering, and remove the master write wildcard. Existing client prize/purchase wallet writers are preserved for finance roles; they are not represented as newly audited server payment decisions. New deposit/withdrawal decisions are audited.
- Read-only paginated audit and reward reports are linked in the sidebar. Reward report checks attempt-time paid/live flags including the paid snapshot, preserves historical paid live eligibility and excludes free promotion/completed practice attempts. Filters use IST months; export labels loaded rows and escapes spreadsheet formulas. The report does not distribute rewards or verify bank settlements.
- Bulk scheduling/rescheduling/deletion requires a server-created owner-bound preview valid for 10 minutes, a confirmation, and atomic revalidation/commit. Cap 100 sessions. Changes are version checked, idempotent and audited. Deletion is limited to upcoming sessions without results/leaderboards; backups are retained in audit records for administrator recovery. No automatic restore UI is included.

## Validation and release gate

- TypeScript typecheck and Vitest regression suite, including simulated concurrent decisions, duplicate legacy UTR, rejection without refund, reserve checks, role checks and paid-only eligibility.
- Production Next.js build before creating the PR.
- Financial tests use isolated in-memory transactional storage, never real wallets. Firestore emulator and live role checks remain release gates; static rules tests alone are not proof of deployed authorization.
- Publish and verify rules for named database `vidyaeducaredatabase`, then merge/deploy the matching app commit while preventing legacy browser approvals during the transition.
- Verify backend `studio` in `us-central1` shows this exact merge commit Current / Release succeeded.
- Live read-only smoke checks: Finance report/audit access; Academic denied payment APIs; Pending denied admin APIs; old direct payment status updates denied; bulk preview validation. Do not approve real payments or award prizes as smoke tests.

## Subscription referral rewards

- First successful paid Mock Test subscription credits ₹5 each to the buyer and recorded referrer, atomically with purchase and an immutable per-buyer claim. Registration, free purchases, deposits and renewals do not trigger it.
- Referral and IBA inputs use the same normalized wallet code and resolver. Invalid, ambiguous, inactive, self and duplicate primary/secondary codes are rejected. Existing codes are retained; ambiguous legacy codes require administrator resolution.
- Registration retries preserve existing profile, wallet and attribution. Existing signup rewards are preserved and excluded from a second subscription reward.
- Pending/Credited status and finance-authorized paginated reports are available. Premium ReferBolt cycle progress moves to the qualifying paid referral; renewal fees cannot overdraw the wallet.
- Validation: 144 tests across 21 files passed; TypeScript and production build passed. Purchase tests use serialized in-memory transactions, not live Firestore.
- CLI login check remains No authorized accounts. Publish named database rules and verify deployed permissions before merging this app release.
