# Failed hosted Repeat capture and original predecessor readback

**VERIFIED.** The terminal GitHub record for workflow run 44668251828 binds executing commit 1fddc8f30728d1590c6ff6c5c76d7072c65c6015. The dispatch log records a full-source request. The builder failed and the independent subsequent readback was skipped. The diagnostic artifact upload succeeded.

The original runner had a 120-minute owned time ceiling and a separate 12 GiB RSS ceiling. Its predicate emits SOURCE_RSS_LIMIT when measured RSS exceeds that limit. The returned code is SOURCE_TIME_LIMIT, at the original entry cancellation check in the Repeat emitter before invoking constructPostFiveRepeatInverses. The observed GitHub builder interval before the error was approximately 7,587 seconds. The exact instantaneous RSS measurement was absent from the artifact. The first native C5 and direct/split comparison receipts exist. The complete Repeat metadata, appended node stream and associated native registry were absent.

The downloaded original first-correction graph byte-matches the prior successful protected export after decompression. Independently comparing every byte gives 1,024,352,367 bytes and 22,155,584 node records with SHA-256 faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96. The complete native registry also byte-matches, with five group counts [1355,29,2,20,0]. The solely changed manifest field is the executing commit. The verifier checks the actual pinned workflow, copied original runner and both anchored Repeat scripts at the failed executing commit.

The failed attempt verifies the predecessor evidence alone. The new active Repeat native append, exact supported-source application, complete second correction and release remain OPEN. Final jets 0/67. RELEASE HOLD.

Replay with Python assertions enabled.

    python -B verify_failed_repeat_capture.py --work WORK --repo ORIGINAL_GIT_CLONE --out failed-capture-readback.json
