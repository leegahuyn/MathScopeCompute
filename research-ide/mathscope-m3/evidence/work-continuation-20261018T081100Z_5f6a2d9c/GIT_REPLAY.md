# Git replay

This additive continuation reuses checkpoint ed7d7ca85afbe668c44afc0e142bc40ec150fe53. The 74MB nested baseline ZIP is provided in the delivered ZIP and is not duplicated in Git.

Prepare a separate copy of `research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1` and run its RESTORE_GIT_TRANSPORT.py. Then run this directory's REPRO_RESUMED.py with --base-directory pointing to that reconstructed copy, --work-dir a new directory, and --report-dir outside this directory. The exact baseline index b08f307e1e740d7db7351b7449504a7e9a86ad11f7186913531b26d5dc3fa0cb and all 1230 baseline files are checked. Only twelve new jobs run; the previous22 jobs are reused.

M3 remains62/64. No main merge, site publication, or existing asset modification/deletion.
