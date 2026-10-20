# MathScope recovery handoff

M3 remains **62/64**. N7-06 and N8-05 remain OPEN. Initial 1260/1260 is inherited only in its original scope. No M4 acceptance or website update is claimed.

Read work/prune_recovery/RECOVERY_STATUS_KO.md and CURRENT_ID_LEDGER.json first. The original handoff is preserved under recovered/base. New recovery source, proofs, independent reviews and execution logs are under work/prune_recovery. Original source recovered from Git is under work/recovery_git/recovered.

Use Python 3.12+ and Node.js. From this extracted directory:

    python REPRO_RECOVERY.py --package-root . --work-dir ../MathScope_fresh_replay --report-dir ../MathScope_replay_report

PowerShell: see reproPS_RECOVERY.ps1. The fresh work directory must not exist. The runner verifies indexed bytes before copying, runs only this recovery's scoped checks, and records each exit code. It does not rerun the historical Windows or 1700-second finite-cycle job. A successful replay is not M3 64/64 certification.

FINAL_FILE_INDEX.json authenticates every payload file except itself. WORKSPACE_RECOVERY_RECEIPT.json records the automatic scratch loss and distinguishes unrecovered earlier observations from the newly rebuilt implementations. SQLite caches are transient, excluded and regenerated only in the fresh replay copy.
