# Wallet and UTR release candidate — 8 October 2026

Keep this PR open. No production money, claims, migration status or deployment was changed.

## Withdrawal cancellation
The authenticated owner may cancel only a Pending server-reserved withdrawal. Transaction contention with approval/cancellation is serialized by Firestore. Cancellation restores the reservation once; retries return success without another credit. Other owners, Completed/Rejected requests, unreserved legacy requests and invalid wallet reservations are rejected. Original transaction is retained with Cancelled status; audit and owner notification are atomic. The wallet recent-activity list provides the button for reserved withdrawals.

## Indexed UTR migration
Finance-only /admin/payments/utr-migration reviews at most 100 immutable ledger documents per page. Preview changes nothing. Apply requires the same page hash and cursor; invalid references, duplicate legacy references and conflicting existing claims block the whole page. Claims, cursor and audit are atomic. No balance or payment status changes. The migration does not treat a submitted UTR as bank proof or credit it automatically.

Deposit submission retains the complete legacy duplicate scan until the private paymentMigrations/utr state is COMPLETE. Thereafter it uses the normalized global paymentUtrClaims index. All pages must be indexed after publishing rules that prohibit client deposit creation and ledger mutation; bank verification remains separate. Rejected references remain occupied under the existing no-reuse policy. Resolve legacy collisions with finance evidence before retrying; never force a COMPLETE state.

## Validation and release order
Final combined run: 180 normal application tests pass; 18 isolated tests pass, including contention/retry cancellation, wrong owner and terminal/legacy denial, UTR preview without writes, conflicting references, stale preview, atomic indexing and indexed duplicate deposit replay. TypeScript and production build pass. These are synthetic demo-project tests, not real money acceptance.

This PR stacks on #29, which stacks on #28. The user requested one later coordinated deployment. Production banking, finance acceptance and the full integer-paise ledger migration remain pending; no completed-tracker entry is created.
