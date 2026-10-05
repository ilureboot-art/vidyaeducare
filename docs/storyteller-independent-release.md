# Independent StoryTeller adult product — implementation and release plan

## Implemented first stage
- AI / OWN_VOICE narration modes, separate duration prices and admin toggles.
- Own Voice access defaults OFF, AI option defaults available but overall service remains OFF.
- Checkout and upload require a server-owned ACTIVE storytellerAccounts record with adultVerified=true. Client writes to these records are denied. This is an enrollment gate, not a completed age verification process.
- Google 2.5 Flash Preview TTS renderer adapter, 24 kHz PCM conversion, existing BGM ducking and loudness normalization. No voice sample required for AI.
- Separate pricing snapshot in each order; disabled modes rejected by server.

## Remaining ordered work
1. Separate hosting origin and Firebase Auth identity/configuration. Independent landing, registration/login and validated adult enrollment; identity and age verification design, terms and retention. Do not grant adultVerified based solely on client checkbox.
2. VidyaEduCare outbound 18+ product link once the destination exists. No fabricated live URL.
3. Configure server secrets and authenticated Cloud Run/Tasks. Verify Google age-related client terms for the actual audience and architecture before enabling generation.
4. Provider billing/quota handling, admin-controlled paid fallback, spend reservations/hard caps and retry limits. Paid API key is NOT automatically a free-first key. Never rotate keys/projects to bypass quota.
5. Finish scene SFX rendering and audio duration/clipping/quality checks. Existing scene metadata does not itself render SFX. Update/verify script-planning model availability; no live model call tested.
6. Create and listen to Marathi/Hindi/English 30-second samples; record actual tokens/cost and retries.
7. Publish named database rules, run live auth/payment/disabled-mode tests without real customer transactions, then merge and deploy exact commit. Keep product OFF until gates pass.

## External prerequisites
Independent domain/hosting target; secure Google TTS and script-model credentials; Firebase deployment credentials; Google billing configuration and adult-service terms confirmation. No secrets in documents or client bundles. No cloning approval has been received/assumed. Final admin prices are editable, existing ₹19/29/39/49 values are provisional defaults.
