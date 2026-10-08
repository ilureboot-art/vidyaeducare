# Server test engine rollout — 8 October 2026

Status: candidate under acceptance; not marked completed or live.

## Release dependency

Publish the read-only question-format preflight first. Inventory every page and review invalid IDs, bilingual choices, duplicate IDs or inconsistent answer translations before enabling restrictive rules. Actual answer correctness needs an academic reviewer. Never guess or silently replace a key. No historic question data is deleted.

The engine candidate moves MockArena start/save/submit/review to authenticated server transactions. Server-owned entitlement and completed purchase proof govern access. Legacy paid booleans do not authorize server attempts. Live deadlines cannot be extended by a late start, reload, switching questions or client clock changes. Saved revisions prevent stale writes; the first accepted submission creates the result/ranking/statistics once. Late answer mutations are discarded and deadline-expired submissions cannot enter prize ranking. Completed tests remain practice; answer review waits for the scheduled live window to close.

Existing answer-containing testSets become the private academic source; only academic roles can read them. Parent subject selection uses a metadata-only paginated catalog. Public attempt responses contain text/choices without answer keys. Attempts/enrollments are server-only. Client writes to scores, results and statistics are denied.

QuizClash migrates enrollment, available-wallet fee debit, per-question 30-second deadlines, one-use lifelines and scoring to server transactions. One parent enrollment per tournament and stable ledger IDs prevent retry charges and duplicate results. Pro entry requires verified paid student entitlement. Switch consumes a spare question without extending time. The existing hint stays a generic concept hint; it is not represented as generated AI.

Visiting results never pays prizes. A Finance-authorized preview and explicit close/settle operation verifies private attempt proof, paid eligibility and immutable result evidence. Active attempts prevent settlement; closure prevents unstarted enrolled students from starting. Stable prize transaction IDs, wallet credit, earnings and audit entries commit atomically. Pro pool distribution retains the existing 80% distributable pool and 40/30/20/10 weights. Standings remain provisional until settlement; legacy/inconsistent results require review and cannot trigger payment. No real fee or cash credit is performed during acceptance tests.

## Required acceptance before completion

- Application tests/typecheck/build; real isolated Firestore transactions and client-rule adversarial tests.
- All production question-format pages scanned; unresolved records listed for academic review.
- Exact App Hosting commit becomes Current; restrictive rules published afterward and checked again.
- Authorized parent registration/activation, owned attempt start/resume/submit/review, finance-only settlement and Academic/Finance/Support denial checks on staging/live test identities.
- No active old-client test is interrupted by rule publication; reload communicates the new server flow.
- Legacy access evidence review completed without inventing paid grants.

AI quotas, full permission alignment, remaining UTR/ledger migration, push-device acceptance, scalable reports and academic weekly plans remain separate pending phases. This candidate does not complete them.
