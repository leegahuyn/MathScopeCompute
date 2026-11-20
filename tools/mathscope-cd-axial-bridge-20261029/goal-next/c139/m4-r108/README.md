# R1-08 authenticated saved-archive binding

The Sites connector re-read the owner-private M1/M2 candidate's current project, its successful publication and saved version 1. The project is active at the same live URL, with access revision 1, one allowlisted owner and zero groups or external visitors. The saved version binds the original deployment ID and source commit to a 9,216,000-byte, two-member tar archive with SHA-256 `6c6723df462a2510e50bd61401ae9ef12c3ceb89c742e6e5fc0ccddfda8c8b4b`.

The archived upload is a 6,902,350-byte gzip archive matching the original publication receipt. Its uncompressed tar contains three directory headers and two regular files. Normalizing the two files in path order, retaining `dist/`, encoding USTAR mode 0644 and zero uid, gid and mtime, then using 10,240-byte record padding reproduces the full authenticated archive hash. The normalizer preserves both member payloads. The archive binds the exact Worker and its embedded HTML to the original authenticated publication screen and four recorded screenshot hashes. Three controls change the entry order, mode or one Worker byte and fail the archive hash comparison.

A fresh read of the actual isolated hosted page returned HTTP 200 with owner authorization and HTTP 401 without authorization. Removing the single provider insertion from the authenticated HTTP response recovers all 28,928,002 original HTML bytes. The insertion still occupies 1,114 bytes at the same offset, with different inserted bytes from the historical read. The browser opened the hosted route, found the R1-08 scope and RELEASE HOLD, repeated both browser fixture runs with matching input, result and Worker hashes, and captured four fresh screens. The browser replay did not substitute a response.

The binding reinforces the existing isolated criterion. Production WebsitePublisher remains a separate scope and R1-08 remains OPEN there. No site content, deployment, access policy or branch was changed.

```powershell
$p = 'work/goal-next/continuation139/m4-r108'
node "$p/verify_archive_binding.cjs" work/goal-next/r108-candidate-deploy.tar.gz work/goal-next/r108-hosted-screen "$p/provider-readback.json" "$p" "$p/archive-replay.json"
```

The current browser replay uses the previously recorded `work/goal-next/r108-private-feasibility/verify_hosted_candidate.cjs` checker and Sites owner dispatch. The authenticated metadata and evidence exclude credentials, account identifiers and archive storage handles. The WebsitePublisher dashboard opened to its sign-in page in the in-app browser. No sign-in action was taken. [Isolated validation candidate](https://mathscope-r108-validation.mobilestrawberry1.chatgpt.site) · [WebsitePublisher dashboard](https://dashboard.websitepublisher.ai/)
