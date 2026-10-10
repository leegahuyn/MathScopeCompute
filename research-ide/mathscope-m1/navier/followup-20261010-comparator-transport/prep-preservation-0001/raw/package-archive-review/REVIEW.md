# Independent review: two original CI ZIPs in the portable package

**PASS, 37/37.** This is a file-selection and provenance review, with `N106Completed=false`. It does not build a release, regenerate a manifest, run full release validation, or execute mathematical checks, Lean or Comparator.

The current archive allowlist contains exactly the original cancelled Comparator ZIP (135,397 bytes, SHA `1af31713f8f021605af509bab4634fed7ab041636f6f1670be2bd3e3c61788d2`) and the successful transport-diagnostic ZIP (44,015 bytes, SHA `b99bc876ebfdb71cd641247bca1b6cad38c757d9431ba81f7c70ca28a122f2ba`). Their actual bytes and artifact IDs match the policy. Neither archive is N1-06 acceptance evidence by itself.

The source diff changes only the executable syntax of `addon_files()`; the existing generic edition ZIP exclusion, root validation and original-source safeguards stay unchanged. The addon allowlist appends only the dated comparator-transport root. Evaluating the exact current and previous collection helpers against the same actual filesystem shows precisely two extra selected files: these pinned ZIPs. Other existing addon members resolve to the same files. Removing pins in an explicitly labelled in-memory control excludes both ZIPs again. Incorrect hash/size, boolean byte count, path traversal and an archive outside allowed roots are rejected. No repository file is changed by these controls.

The consumer package source reads addon bytes directly, writes each nested ZIP as those bytes, checks member digests and checks that input files did not change during packaging. The new archive policy JSON itself is included in hashed edition provenance. Normal manifest regeneration and full package/member verification still need to occur before claiming an actual distributable ZIP contains these archives. This review does not make that future claim.

The actual collection contained 1,695 addon files at this review snapshot. This count can grow as new separately authorized evidence is added; it is not a fixed release manifest or a gate count. The current English manifest and original criterion/assessment files were byte-checked before and after review and remained unchanged.

Reproduce the narrow review, retaining this receipt, with:

```sh
python -B review_package_archives.py --output reviewer-receipt-0002.json
```

The script uses six exact read-only collection helpers extracted from source snapshots; it does not call the release verifier's `verify()`, `expected_manifest()`, `main()`, or the package generator. Snapshots include current and immutable HEAD versions for review.

한국어: 원본 CI ZIP 두 개의 정확한 바이트·해시만 지정된 후속 경로에서 패키지 수집에 들어가는 변경을 37/37로 독립 확인했다. 일반 ZIP 제외와 원문 보호는 유지된다. **실제 패키지 생성·manifest 재생성·수학 검사·N1-06 완료 판정은 수행하지 않았다.** 새 패키지의 실물 검증은 최종 제작자가 별도로 수행해야 한다.
