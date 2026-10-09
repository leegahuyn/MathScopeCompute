export const provenance = {
  "sources": [
    {
      "id": "N00",
      "url": "https://cdn.openai.com/pdf/32d9f210-8b73-45e0-91bc-82a30aef8a9a/navier-stokes.pdf",
      "attachmentSha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "pages": [
        1,
        166
      ]
    },
    {
      "id": "N01",
      "url": "https://openai.com/index/navier-stokes-solution/",
      "publicationDate": "2026-09-08",
      "updateDate": "2026-09-10",
      "retrievedDate": "2026-10-09",
      "status": "ANNOUNCEMENT",
      "claim": "OpenAI reports an analytical and Lean proof for forced alternatives C/D. This record is an attributed publication claim."
    },
    {
      "id": "N02",
      "url": "https://www.claymath.org/news/navier-stokes-announcement/",
      "publicationDate": "2026-09-11",
      "retrievedDate": "2026-10-09",
      "status": "INSTITUTIONAL_ANNOUNCEMENT",
      "claim": "Clay describes the problem as apparently settled and explains that evaluation and attribution follow a deliberate process. No final prize adjudication is inferred."
    },
    {
      "id": "N03",
      "url": "https://github.com/openai/NavierStokesAndEuler",
      "commit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd"
    },
    {
      "id": "N04",
      "url": "https://www.claymath.org/wp-content/uploads/2022/06/navierstokes.pdf"
    }
  ],
  "lock": {
    "schemaVersion": 1,
    "attachment": {
      "fileName": "01-navier-stokes.pdf",
      "pageCount": 166,
      "sha256": "0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f",
      "title": "Finite Time Blowup for Navier–Stokes",
      "author": "OpenAI",
      "date": "2026-09-08"
    },
    "repository": {
      "url": "https://github.com/openai/NavierStokesAndEuler",
      "commit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
      "toolchain": "leanprover/lean4:v4.34.0-rc2",
      "files": [
        {
          "path": "lean-toolchain",
          "sha256": "8190e75a201741065fe508b28955dd64dd72d090babe5f70ce6848879d68ae88"
        },
        {
          "path": "lakefile.toml",
          "sha256": "97b2804da5b9a2cd0aaf44ce42b7c39e9947beff9d2ac01a11e0d3d867af1c09"
        },
        {
          "path": "lake-manifest.json",
          "sha256": "5ec1dc8e009008d0efb9601cd38f6ba54e753fd538b0e5f8c3e6c5ec72ee1e09"
        },
        {
          "path": "NavierStokes.lean",
          "sha256": "aa93efae7c7d7e44f2bb421d85587e7e9610e03ce67e15a15ed86acad2d014a1"
        },
        {
          "path": "NavierStokes/ComparatorSolution.lean",
          "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
        },
        {
          "path": "NavierStokes/ComparatorR3Theorem.lean",
          "sha256": "d05cd1c55e78709dabe1996546eb6ddaaa46e602d2ef1b05c6e2085320781207"
        },
        {
          "path": "NavierStokes/ComparatorTheorem.lean",
          "sha256": "629c992327e531611c20165eb14db24edcabcf8f646a1d2689be9ac6fe2a9c68"
        },
        {
          "path": "NavierStokes/Flatness.lean",
          "sha256": "550606d4d1e14fb16612375de57d837df325a7b2265de6ed056c935ff96b2bc6"
        },
        {
          "path": "NavierStokes/ProblemStatement.lean",
          "sha256": "d2f5cdf24a060acd41011b50492e89058991965e18d2cb797c58d915f95af633"
        },
        {
          "path": "ComparatorChallenges/NavierStokes.lean",
          "sha256": "0cd193b8d5cbd0266e6e2f72e68dd5abcdcf2430ebd435dd9289737e9aa7da61"
        },
        {
          "path": "ComparatorChallenges/NavierStokes.json",
          "sha256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8"
        }
      ],
      "originalFullBuild": {
        "schemaVersion": 2,
        "attempted": true,
        "performed": false,
        "performedMeaning": "Compatibility field: the entire original defaultTargets build completed successfully with exit 0. It does not mean merely invoking the command; attempted records that separately.",
        "wholeDefaultBuildPassed": false,
        "requiredDefaultTargets": [
          "NavierStokes",
          "Euler",
          "ComparatorChallenges"
        ],
        "exitCode": -15,
        "startedAt": "2026-10-09T15:23:30.991157+00:00",
        "completedAt": "2026-10-09T15:37:13.760832+00:00",
        "terminationReason": "Explicit stop request",
        "scope": "Original default lake build using the pinned official rc2 kernel through the separately audited explicit-path shell entry.",
        "reason": "The original default invocation was recorded and then explicitly stopped to prioritize NS C/D dependencies after unrelated Euler compilation started. Its result is not counted as whole-default success.",
        "vanillaCLIStatus": "ENVIRONMENT_PATH_DETECTION_FAILED",
        "vanillaCLIResults": "official-validation/official-command-results.json",
        "cacheProfile": {
          "status": "FINISHED",
          "exitCode": 0,
          "entry": "Original Cache.Main CLI body with explicit pinned CacheM context only",
          "cacheAlgorithmsChanged": false,
          "unsafeFlagsUsed": false,
          "endpoint": "https://lakecache.blob.core.windows.net/mathlib4-master",
          "lastProgress": {
            "downloaded": 8747,
            "attempted": 8747,
            "requested": 8747
          },
          "log": "cache-context-explicit.log",
          "logSHA256": "6e01f287ffad23379ad402dd872baeb7f38032d059e90fe4795a6553359273f1"
        },
        "defaultLog": "official-validation/lake-build-full-pinned.log",
        "defaultLogSHA256": "6e05a1754e2110c57701e554b70c6f0fcc94d7dd333c3c7f5152def81a012929",
        "transitionRecord": "official-validation/priority-transition.json",
        "additionalPinnedDeclarationAudit": "repository.pinnedRc2Validation",
        "auditFile": "official-validation/official-audit-summary.json",
        "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff"
      },
      "pinnedRc2Validation": {
        "schemaVersion": 1,
        "sourceCommit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
        "checkedAt": "2026-10-09T16:06:24.537829+00:00",
        "scope": "The two exact C/D exported Lean declaration types at the original pinned rc2 commit. Separate from the 14:39 Lean4.34.1 component receipt, full default build, full paper-to-formal equivalence, and numerical profile certification.",
        "toolchain": "leanprover/lean4:v4.34.0-rc2",
        "kernelCommit": "6a10ac8c22beadecabdbb0919c2b50214762f91d",
        "executionProfile": {
          "kind": "PINNED_OFFICIAL_KERNEL_EXPLICIT_PATH_ENTRY",
          "vanillaCLIOutcome": "Environment path detection failed; exact vanilla commands and exits are separately logged.",
          "entrySourceUnchangedFromPreviouslyApprovedDriver": true,
          "driverSHA256": "a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682",
          "officialSharedLibrarySHA256": "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5",
          "taskManagerWorkers": 1,
          "logicalOptionsReplaced": false,
          "proofSourcesChanged": false,
          "manifestChanged": false,
          "originalReleaseBytesChanged": false
        },
        "nsSubmissionBuild": {
          "target": "NavierStokes.ComparatorSolution",
          "exitCode": 0,
          "passed": true,
          "staticLocalSourceDependencyCount": 609,
          "reportedLakeJobs": 9371,
          "log": {
            "file": "official-validation/lake-build-ns-priority-pinned.log",
            "sha256": "f5ca33d2c60d99d59dbc9752bb614bf75964288e2533647584a9e264138192d5"
          },
          "commandReceipt": {
            "file": "official-validation/full-pinned-command-results.json",
            "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
            "stage": "lake-build-ns-priority-pinned"
          }
        },
        "submittedDeclarations": {
          "names": [
            "NavierStokes.Comparator.navier_stokes_breakdown_R3",
            "NavierStokes.Comparator.navier_stokes_breakdown_periodic"
          ],
          "entrySourceSHA256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d",
          "exitCode": 0,
          "kernelCommandAccepted": true,
          "passed": true,
          "axiomClosureRecordedForBothTargets": true,
          "permittedAxioms": [
            "Classical.choice",
            "Quot.sound",
            "propext"
          ],
          "unpermittedAxioms": [],
          "axioms": [
            {
              "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_R3",
              "report": "[propext, Classical.choice, Quot.sound]",
              "axioms": [
                "propext",
                "Classical.choice",
                "Quot.sound"
              ]
            },
            {
              "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_periodic",
              "report": "[propext, Classical.choice, Quot.sound]",
              "axioms": [
                "propext",
                "Classical.choice",
                "Quot.sound"
              ]
            }
          ],
          "originalSourceFile": "NavierStokes/ComparatorSolution.lean",
          "sourceURL": "https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ComparatorSolution.lean",
          "sourceSHA256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227",
          "oleanSHA256": "5025fa4e63160cea4fff8dd8f8350acabd3478cdc08563f383484fd01620de76",
          "oleanSizeBytes": 147272,
          "exactNormalTypes": "NavierStokes.Comparator.navier_stokes_breakdown_R3 : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧\n      NavierStokes.Comparator.ForceConditionDecay f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p\nNavierStokes.Comparator.navier_stokes_breakdown_periodic : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧\n      NavierStokes.Comparator.ForceConditionPeriodic f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p",
          "sourceCopy": {
            "file": "official-validation/OfficialComparatorSolution.lean",
            "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
          },
          "entrySource": {
            "file": "official-validation/PinnedDeclarations.lean",
            "sha256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d"
          },
          "log": {
            "file": "official-validation/ns-pinned-declarations.log",
            "sha256": "4fc376bfe81caf561a1fd501d13f4ea2d9e2d6d41ee9fa687b82f2649ebb3a08"
          },
          "commandReceipt": {
            "file": "official-validation/full-pinned-command-results.json",
            "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
            "stage": "ns-pinned-declarations"
          }
        },
        "comparator": {
          "status": "BLOCKED",
          "passed": false,
          "exitCode": 1,
          "reachedComparatorProcess": false,
          "blocker": "Required systemd user guard cannot start: no user bus. Session UID 0 also fails the documented unprivileged-user guarantee. Comparator was not reached. No sandbox guard omitted or replaced.",
          "configSHA256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8",
          "guardBypassUsed": false,
          "alternateWeakerPathCountedAsSuccess": false,
          "commandReceipt": {
            "file": "official-validation/comparator-pinned-guarded.json",
            "sha256": "cb7dda2f8777f5419a03777a7ff4a4dd4b504c8c2292f699ac93287e6578e276"
          },
          "log": {
            "file": "official-validation/comparator-pinned-guarded.log",
            "sha256": "746707a49085d66703eb45f2baea0df38a88bab7346195ece161e8e14ef2a3d1"
          },
          "independentEnvironment": {
            "file": "official-validation/comparator-environment-independent.json",
            "sha256": "f7b8b6f2baa8061c0b08a772fa6ce47c85bb098cf27ea4509f801b4f3b18230a"
          }
        },
        "wholeDefaultBuildPassed": false,
        "remainingBuildScope": {
          "submittedLocalDependencyClosure": {
            "sourceModules": 609,
            "oleanArtifactsPresent": 609,
            "oleanArtifactsMissing": 0
          },
          "navierStokesRootSourceClosure": {
            "sourceModules": 753,
            "oleanArtifactsPresent": 692,
            "oleanArtifactsMissing": 61
          },
          "navierStokesWholeLibrary": {
            "sourceModules": 817,
            "oleanArtifactsPresent": 702,
            "oleanArtifactsMissing": 115
          },
          "eulerWholeLibrary": {
            "sourceModules": 1840,
            "oleanArtifactsPresent": 23,
            "oleanArtifactsMissing": 1817
          },
          "comparatorChallenges": {
            "sourceModules": 2,
            "oleanArtifactsPresent": 0,
            "oleanArtifactsMissing": 2
          },
          "grade": "POST_BUILD_ARTIFACT_INVENTORY_ONLY",
          "receipt": {
            "file": "official-validation/remaining-build-scope.json",
            "sha256": "4824f6c994416743f8682e22f6d941713cf0965b20f33183d29ce9529eaf4e20"
          }
        },
        "pinnedEntryKernelControls": {
          "file": "official-validation/pinned-entry-kernel-controls.json",
          "sha256": "83360471e078eaa0c76e2dc06f223a4ac0b62e937b8c309ce7611500ee884a10"
        },
        "originalTrackedSourcesUnchanged": true,
        "completeNumericalPaperProfileCertified": false,
        "browserKernelRerun": false,
        "browserSourceValidationPromotesKernelPass": false,
        "historicalComponentAuditAutomaticallyPromoted": false,
        "numericFieldInstantiatesExistentialWitness": false,
        "auditFile": "official-validation/official-audit-summary.json",
        "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff",
        "historicalComponentAudit": {
          "file": "evidence/lean-validation.json",
          "sha256": "90f162823a56035559a584476854a27b2ed135f373183c43593ed47439d8ffe1",
          "checkedAt": "2026-10-09T14:39:01.694607+00:00",
          "toolchain": "Lean/mathlib4.34.1",
          "targetCount": 13,
          "unchanged": true
        }
      }
    },
    "publicStatus": [
      {
        "id": "N01",
        "url": "https://openai.com/index/navier-stokes-solution/",
        "publicationDate": "2026-09-08",
        "updateDate": "2026-09-10",
        "retrievedDate": "2026-10-09",
        "status": "ANNOUNCEMENT",
        "claim": "OpenAI reports an analytical and Lean proof for forced alternatives C/D. This record is an attributed publication claim."
      },
      {
        "id": "N02",
        "url": "https://www.claymath.org/news/navier-stokes-announcement/",
        "publicationDate": "2026-09-11",
        "retrievedDate": "2026-10-09",
        "status": "INSTITUTIONAL_ANNOUNCEMENT",
        "claim": "Clay describes the problem as apparently settled and explains that evaluation and attribution follow a deliberate process. No final prize adjudication is inferred."
      }
    ],
    "scope": "User attachment and pinned source definitions. Unforced A/B are not claimed by this module."
  },
  "contract": {
    "schemaVersion": 1,
    "paper": "N00",
    "theorem": "Theorem1.1",
    "references": [
      {
        "pages": [
          1
        ],
        "statement": "Theorem1.1"
      },
      {
        "pages": [
          120,
          123,
          124,
          125,
          126
        ],
        "statement": "Lemma10.3; Corollary10.6; final viscosity/periodic comparison"
      }
    ],
    "quantifiers": [
      {
        "name": "nu",
        "domain": "real",
        "condition": "nu>0",
        "quantifier": "for every"
      },
      {
        "name": "f",
        "domain": "C_c^infinity(R^3 x (0,infinity);R^3)",
        "quantifier": "there exists",
        "divergenceFreeRequired": false,
        "divergenceNote": "Global cutoff force is not in general divergence free; source p118."
      },
      {
        "name": "u,p",
        "domain": "smooth on R^3 x [0,1)",
        "quantifier": "there exist",
        "fixedCompactSpatialSupport": true
      }
    ],
    "initialVelocity": "u(x,0)=0",
    "equation": "partial_t u+(u dot grad)u-nu Delta u+grad p=f; div u=0",
    "boundedEnergy": "sup_{0<=t<1} integral_{R^3}|u(x,t)|^2 dx < infinity",
    "blowup": "limsup_{t -> 1-} ||u(t)||_infinity = infinity",
    "forbiddenPromotions": [
      "f=0",
      "smooth velocity at t=1",
      "numerical plot proves theorem",
      "standalone exterior has finite R3 energy",
      "N1-N3 leading candidate is a full Navier-Stokes solution"
    ],
    "formalGrade": "THEOREM_REFERENCE",
    "mainTheoremKernelCheckedLocally": false
  },
  "map": {
    "sections": [
      {
        "id": "1",
        "title": "Introduction",
        "firstPage": 1,
        "lastPage": 2,
        "role": "Main forced theorem 1.1, literature and exact Clay scope."
      },
      {
        "id": "2",
        "title": "Physical description of the blowup",
        "firstPage": 3,
        "lastPage": 6,
        "role": "Inward swirl, axial outflow, anisotropic contraction, pulses and heat exterior."
      },
      {
        "id": "3",
        "title": "Proof outline",
        "firstPage": 6,
        "lastPage": 24,
        "role": "Coordinate relation, stress matching, divergence-free pulses, correction cycle, summation and localization."
      },
      {
        "id": "4",
        "title": "Constructing the leading order flow",
        "firstPage": 24,
        "lastPage": 45,
        "role": "Leading radial/axial profiles, moments and admissible stress cone; Theorem 4.6."
      },
      {
        "id": "5",
        "title": "Correcting the base flow to every order",
        "firstPage": 45,
        "lastPage": 62,
        "role": "Higher-order coefficient induction; divergence-preserving cutoff summation; Proposition 5.5."
      },
      {
        "id": "6",
        "title": "Auxiliary torus and separation of oscillatory supports",
        "firstPage": 62,
        "lastPage": 73,
        "role": "Dyadic charts, auxiliary T², support separation and coefficient algebra."
      },
      {
        "id": "7",
        "title": "Oscillatory realization and correction of the residual stress",
        "firstPage": 73,
        "lastPage": 88,
        "role": "Phase and amplitude equations, covariance matching, curls and retained remainders."
      },
      {
        "id": "8",
        "title": "Compactly supported mean corrections",
        "firstPage": 88,
        "lastPage": 100,
        "role": "Pressure reconstruction, auxiliary-time inversion, two conserved moments and three defect constraints."
      },
      {
        "id": "9",
        "title": "Residual improvement and the local field",
        "firstPage": 100,
        "lastPage": 116,
        "role": "Fixed-order correction cycle; sigma_j=1/5+j/10; common-domain all-order summation."
      },
      {
        "id": "10",
        "title": "Compact forcing and whole-space breakdown",
        "firstPage": 116,
        "lastPage": 126,
        "role": "Localization, smooth force extension, energy estimate, comparison, viscosity scaling and periodic corollary."
      },
      {
        "id": "A",
        "title": "Matching radial moments and constructing the heat exterior",
        "firstPage": 126,
        "lastPage": 144,
        "role": "Moment invertibility and nonlinear correction; explicit heat profile (A.32)–(A.37)."
      },
      {
        "id": "B",
        "title": "Analytic profiles near the axis and their continuation",
        "firstPage": 144,
        "lastPage": 157,
        "role": "Analytic axis profiles, continuation, shear bounds and exact matching of five moments."
      },
      {
        "id": "C",
        "title": "Realizing the admissible stress cone",
        "firstPage": 157,
        "lastPage": 165,
        "role": "Periodic loops of shear, radial oscillations and restoration of five moments."
      },
      {
        "id": "References",
        "title": "References",
        "firstPage": 165,
        "lastPage": 166,
        "role": "22 cited works."
      }
    ],
    "pageCoverage": [
      {
        "page": 1,
        "sections": [
          "1"
        ],
        "characters": 3354,
        "textSha256": "1b24d58a211d340682c55ed340878c1371964cbdc9ca7754c51890e6bf1cf08d",
        "namedStatements": [
          "Theorem 1.1",
          "Corollary 10.6"
        ]
      },
      {
        "page": 2,
        "sections": [
          "1"
        ],
        "characters": 4190,
        "textSha256": "9ca3e01ce56a5077f4a46b4315521f368680c6123802d2113076b05df835df76",
        "namedStatements": []
      },
      {
        "page": 3,
        "sections": [
          "2"
        ],
        "characters": 3575,
        "textSha256": "506a09520e3d5877f889a9b982881a8acd67770257c60287f5ed0098bb577524",
        "namedStatements": [
          "Theorem 1.1"
        ]
      },
      {
        "page": 4,
        "sections": [
          "2"
        ],
        "characters": 2385,
        "textSha256": "eb0fbae4226535b1ddcd3497cb20ebff39d86bf4706ef574e85dd03e867bf092",
        "namedStatements": []
      },
      {
        "page": 5,
        "sections": [
          "2"
        ],
        "characters": 3773,
        "textSha256": "7d48042d70cbc0533df35f7f2f639cacba7492b0cc4d573f697a83e08b03e97c",
        "namedStatements": []
      },
      {
        "page": 6,
        "sections": [
          "2",
          "3"
        ],
        "characters": 3935,
        "textSha256": "29c8d5b90145ba0124d5b016be3950c5724badc54b2d2bb2d3c84e3e4630c754",
        "namedStatements": []
      },
      {
        "page": 7,
        "sections": [
          "3"
        ],
        "characters": 3720,
        "textSha256": "b411b65fc3d22456bc1f6041ac204aa8a88955b9f8e989c3549abf6e130d83d3",
        "namedStatements": [
          "Proposition 5.5",
          "Proposition 7.5",
          "Proposition 9.6",
          "Theorem 1.1",
          "Lemma 10.3",
          "Lemma 4.1"
        ]
      },
      {
        "page": 8,
        "sections": [
          "3"
        ],
        "characters": 3746,
        "textSha256": "e078cb481ba6f64cdbd3b3caec5857dc3a188b907ae208c9789a0733d9703ae9",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition B.2",
          "Proposition 10.1"
        ]
      },
      {
        "page": 9,
        "sections": [
          "3"
        ],
        "characters": 4876,
        "textSha256": "f5c3cf4f29719d1d1a2a7c5faa851f78e130ac7ec47ff73a16bc070c4f057bcb",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 4.5",
          "Proposition 7.5",
          "Lemma A.8",
          "Lemma 4.4"
        ]
      },
      {
        "page": 10,
        "sections": [
          "3"
        ],
        "characters": 3528,
        "textSha256": "24c74843238d719003204366948a3e188c122c3d81d7f247185e0f48491f3d46",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition A.4",
          "Lemma A.6",
          "Proposition A.7",
          "Proposition B.2",
          "Corollary B.10",
          "Proposition B.8",
          "Lemma 4.4",
          "Lemma A.8",
          "Proposition C.2",
          "Proposition C.3"
        ]
      },
      {
        "page": 11,
        "sections": [
          "3"
        ],
        "characters": 3420,
        "textSha256": "cac403e220a06671425c4c9da401fd6ae7e35b7a14859756d88a517ccd059dc6",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 7.7"
        ]
      },
      {
        "page": 12,
        "sections": [
          "3"
        ],
        "characters": 4099,
        "textSha256": "cc16a4af40f79839ad63fdd40824e687f6d4b5547049bd196c67df715647b87e",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 13,
        "sections": [
          "3"
        ],
        "characters": 3273,
        "textSha256": "92a934e8dd06c85292e42c1826621fd2bf0ff6900cda77d79418a450a7c04fd8",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition 5.5",
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7",
          "Proposition 9.6",
          "Proposition 9.5"
        ]
      },
      {
        "page": 14,
        "sections": [
          "3"
        ],
        "characters": 3872,
        "textSha256": "0163ea0f9f100a88693986d6da5d54e8316c1ecea4e9780df8aab8d2e2cd2aaf",
        "namedStatements": [
          "Proposition 9.6",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 7.6",
          "Lemma 9.7",
          "Proposition 9.9"
        ]
      },
      {
        "page": 15,
        "sections": [
          "3"
        ],
        "characters": 3439,
        "textSha256": "52ee8c6b2e7d1a9854e5923fb4aad610879d893c88f9470b87ca48d6aef3290b",
        "namedStatements": [
          "Proposition 9.3",
          "Proposition 9.6",
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 1.1",
          "Theorem 3.1"
        ]
      },
      {
        "page": 16,
        "sections": [
          "3"
        ],
        "characters": 3772,
        "textSha256": "e3a0098a7442a27a56d21038deb9ca6aa6cd3362502e360ae35c575221e59291",
        "namedStatements": [
          "Proposition 10.1",
          "Theorem 3.1",
          "Lemma 10.2",
          "Lemma 10.3"
        ]
      },
      {
        "page": 17,
        "sections": [
          "3"
        ],
        "characters": 4263,
        "textSha256": "8df1204c60aa7d7924098a237931d2d2bfa6c9cde1b51137db86f020285caacd",
        "namedStatements": [
          "Lemma 10.4",
          "Lemma 10.5",
          "Theorem 1.1",
          "Corollary 10.6"
        ]
      },
      {
        "page": 18,
        "sections": [
          "3"
        ],
        "characters": 3273,
        "textSha256": "51bc9b71b4f2a59759c82369943168c40442ea59f9e1a86d982cfc6cbe73bc5a",
        "namedStatements": [
          "Definition 3.2",
          "Definition 3.3"
        ]
      },
      {
        "page": 19,
        "sections": [
          "3"
        ],
        "characters": 3523,
        "textSha256": "0746de42c3e9124227b4c51158aba8ad61d6b712123277758efbf471a43d27c1",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition 5.5",
          "Proposition 4.2"
        ]
      },
      {
        "page": 20,
        "sections": [
          "3"
        ],
        "characters": 3466,
        "textSha256": "f8bd8e020ca34698343dd05e3ccd2964f3e6ba2525e69d4211afd5b009ec3774",
        "namedStatements": [
          "Proposition 5.5",
          "Proposition 8.1",
          "Definition 9.4",
          "Theorem 3.1",
          "Lemma 4.1"
        ]
      },
      {
        "page": 21,
        "sections": [
          "3"
        ],
        "characters": 3886,
        "textSha256": "8cac9dbf7b0703169b7b98c4d5dfc2cc54e06a54f6d9b20145d2135599b8544d",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 5.2",
          "Proposition 8.3"
        ]
      },
      {
        "page": 22,
        "sections": [
          "3"
        ],
        "characters": 3672,
        "textSha256": "756799b36df467b9a372af016660c8abaf49052fd5b52145d29182748e62f1c0",
        "namedStatements": [
          "Proposition 7.5",
          "Definition 9.4"
        ]
      },
      {
        "page": 23,
        "sections": [
          "3"
        ],
        "characters": 3816,
        "textSha256": "ca106a3ac8d233e8b22b97cb91564201739b1234a7d44116f672992139e375b1",
        "namedStatements": [
          "Definition 6.5",
          "Definition 6.4"
        ]
      },
      {
        "page": 24,
        "sections": [
          "3",
          "4"
        ],
        "characters": 3866,
        "textSha256": "625ce5cec71f9f03c0fc4d30d632498eec95a2e49b50312fb917f0de27656292",
        "namedStatements": [
          "Proposition 9.6",
          "Lemma 5.4",
          "Proposition 7.5",
          "Theorem 4.6",
          "Lemma 4.4",
          "Proposition 4.2",
          "Theorem 3.1"
        ]
      },
      {
        "page": 25,
        "sections": [
          "4"
        ],
        "characters": 3860,
        "textSha256": "6830925a0eacd17663ccf1f07748ae70b80b7a49853499921e4ea898fa2956fa",
        "namedStatements": [
          "Lemma 4.1",
          "Theorem 4.6",
          "Definition 3.2"
        ]
      },
      {
        "page": 26,
        "sections": [
          "4"
        ],
        "characters": 4380,
        "textSha256": "5a1ab04764ad24e5cfd75b62998971bf920dbad4b84ae15c52ac710dfd636dca",
        "namedStatements": [
          "Proposition 4.2"
        ]
      },
      {
        "page": 27,
        "sections": [
          "4"
        ],
        "characters": 4125,
        "textSha256": "8544b6b3c0536ce30e2d849e48fac597d88b5e446bcfec526092083883cfcee9",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 4.2",
          "Definition 3.2"
        ]
      },
      {
        "page": 28,
        "sections": [
          "4"
        ],
        "characters": 3967,
        "textSha256": "cd8ebf541f1f22cd8ddfefbb1ad8d9ffcaa01644b363e383e02e88748a4819fc",
        "namedStatements": [
          "Lemma 4.4",
          "Lemma 4.3"
        ]
      },
      {
        "page": 29,
        "sections": [
          "4"
        ],
        "characters": 3921,
        "textSha256": "a33c276f5579a995c5375fa628d7d2e660f7409a2e2e9a3b30b850248d22e9fb",
        "namedStatements": []
      },
      {
        "page": 30,
        "sections": [
          "4"
        ],
        "characters": 4537,
        "textSha256": "9040966739690169b90a4bb869a94de42799f32c6229203f3507768adf929040",
        "namedStatements": [
          "Proposition C.2",
          "Lemma A.8",
          "Proposition 7.5",
          "Lemma 4.5"
        ]
      },
      {
        "page": 31,
        "sections": [
          "4"
        ],
        "characters": 3733,
        "textSha256": "b8fca4ec5f20f5ec8963b721ff7c094bc754b66a22c13de49a9b25d3b530da54",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition A.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 32,
        "sections": [
          "4"
        ],
        "characters": 3589,
        "textSha256": "5132b8be272b61c17807ff180f52337bb46b416252c8f7170bc65e3fcfbe2776",
        "namedStatements": [
          "Theorem 4.6",
          "Proposition 7.5",
          "Proposition 7.6",
          "Lemma 4.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 33,
        "sections": [
          "4"
        ],
        "characters": 4135,
        "textSha256": "055e2293cb22f53212927cea519c6f08d217660dd601e81dd43aaa3d872686d1",
        "namedStatements": [
          "Proposition 4.2",
          "Lemma 5.2",
          "Lemma 8.7"
        ]
      },
      {
        "page": 34,
        "sections": [
          "4"
        ],
        "characters": 3668,
        "textSha256": "5c63a3edefb3d5e4b7dc0f6e9883e9fc76d7c0f2836fa0adc2310e22c2071d4d",
        "namedStatements": [
          "Lemma 4.7",
          "Lemma 4.8",
          "Proposition 4.10",
          "Lemma 4.11",
          "Theorem 4.6"
        ]
      },
      {
        "page": 35,
        "sections": [
          "4"
        ],
        "characters": 3375,
        "textSha256": "5fb49cb9ee06a57c4b5a969c744dcaa1e833348a640880c315266f451af7b631",
        "namedStatements": [
          "Lemma 4.8",
          "Lemma 4.4"
        ]
      },
      {
        "page": 36,
        "sections": [
          "4"
        ],
        "characters": 4334,
        "textSha256": "40dfa68da613f4306e076a8291a41fb0fb323f83f9bb947f88feec88f0bdab22",
        "namedStatements": [
          "Proposition A.4",
          "Lemma A.5",
          "Lemma A.6",
          "Proposition A.7",
          "Lemma 4.9",
          "Lemma 4.8",
          "Lemma A.8",
          "Proposition A.10",
          "Proposition 4.10"
        ]
      },
      {
        "page": 37,
        "sections": [
          "4"
        ],
        "characters": 4794,
        "textSha256": "c502bb236014ae00d110aa12f24032990c91249fe4c234674b3a55025610f9a2",
        "namedStatements": [
          "Proposition B.2",
          "Proposition B.3",
          "Lemma 4.8",
          "Proposition B.5",
          "Corollary B.6"
        ]
      },
      {
        "page": 38,
        "sections": [
          "4"
        ],
        "characters": 3955,
        "textSha256": "ee4afb37d12c1fc854db587d806803583010baab48f22792fc76745386b142a2",
        "namedStatements": [
          "Lemma B.7",
          "Proposition B.8",
          "Lemma 4.11"
        ]
      },
      {
        "page": 39,
        "sections": [
          "4"
        ],
        "characters": 3749,
        "textSha256": "b2a3d940ce308238486a60d67bc127e4dad8d11e9cdc3b4cccb27f8e3a662171",
        "namedStatements": [
          "Lemma C.1",
          "Lemma 4.5",
          "Theorem 4.6",
          "Lemma 4.8",
          "Proposition 4.10",
          "Lemma 4.11",
          "Lemma 4.7",
          "Lemma 4.9"
        ]
      },
      {
        "page": 40,
        "sections": [
          "4"
        ],
        "characters": 4060,
        "textSha256": "b2d8a5ab0a0291e35e0f1643126eaea5e145878fbef1235e43d210273ea1dba3",
        "namedStatements": [
          "Definition 3.3",
          "Proposition 4.10",
          "Lemma 4.4",
          "Lemma 4.8",
          "Lemma 4.9"
        ]
      },
      {
        "page": 41,
        "sections": [
          "4"
        ],
        "characters": 4268,
        "textSha256": "65c9369455e512ab3a133ce641cc9b18f14b063f8b9d8c9ff842cac1d865e4f5",
        "namedStatements": [
          "Lemma 4.11"
        ]
      },
      {
        "page": 42,
        "sections": [
          "4"
        ],
        "characters": 3990,
        "textSha256": "b9cdec7927ef36bf19d3efee5c2dac7313a19facdd2af242db6266f40ab3a97d",
        "namedStatements": [
          "Lemma 4.4",
          "Lemma 4.11",
          "Lemma 4.7"
        ]
      },
      {
        "page": 43,
        "sections": [
          "4"
        ],
        "characters": 3991,
        "textSha256": "619c41db5587ea732d78dfe786c4e099f373259df59778749f0b20bc054ea5cd",
        "namedStatements": [
          "Lemma 4.7",
          "Lemma 4.4",
          "Proposition 4.10",
          "Proposition 4.2"
        ]
      },
      {
        "page": 44,
        "sections": [
          "4"
        ],
        "characters": 3766,
        "textSha256": "21537223bc8fd16995a5ad6a4004cf992761a8ef7e01e2c47cd3406854bfa31d",
        "namedStatements": [
          "Lemma 4.9",
          "Proposition 4.10"
        ]
      },
      {
        "page": 45,
        "sections": [
          "4",
          "5"
        ],
        "characters": 3629,
        "textSha256": "fe8d51f01117a0952203d6087e328274342e9e1c4a3ca7668eda75c19bf02f10",
        "namedStatements": [
          "Lemma 4.8",
          "Theorem 4.6",
          "Proposition 5.5",
          "Lemma 5.1",
          "Lemma 5.2",
          "Proposition 5.3",
          "Lemma 5.4"
        ]
      },
      {
        "page": 46,
        "sections": [
          "5"
        ],
        "characters": 4326,
        "textSha256": "d53190a953003430a619dc798d00a7875e4eefb6a087d2822cb8ce5125924b2f",
        "namedStatements": [
          "Lemma 5.2"
        ]
      },
      {
        "page": 47,
        "sections": [
          "5"
        ],
        "characters": 4248,
        "textSha256": "dd8389d653f50950c013c9d2a83818c8c27fef892b225c30bf54e88d74965c93",
        "namedStatements": [
          "Lemma 5.1",
          "Theorem 4.6",
          "Proposition B.2"
        ]
      },
      {
        "page": 48,
        "sections": [
          "5"
        ],
        "characters": 3750,
        "textSha256": "46b0ce7ecacc1a8d66ab8f2c9a4455816e5e1f59ea503fbb36ceb227a3548900",
        "namedStatements": []
      },
      {
        "page": 49,
        "sections": [
          "5"
        ],
        "characters": 4413,
        "textSha256": "485b61f50bc30be917110baab32ad436fe7aed7347d481a7bf75f035eee16f91",
        "namedStatements": [
          "Lemma 5.1",
          "Lemma 5.2"
        ]
      },
      {
        "page": 50,
        "sections": [
          "5"
        ],
        "characters": 3863,
        "textSha256": "a20bb467d68d4ec0730761f7573a2b1b15b553012f88c1dc33925b4c2ef2aedd",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 5.2",
          "Lemma 5.1"
        ]
      },
      {
        "page": 51,
        "sections": [
          "5"
        ],
        "characters": 4196,
        "textSha256": "dd5efa2ae666c13ceb277731b23acb8a18e63e8123b31b4dc0ec49ead114671f",
        "namedStatements": [
          "Lemma 5.1"
        ]
      },
      {
        "page": 52,
        "sections": [
          "5"
        ],
        "characters": 3762,
        "textSha256": "e16a63dc60f5c1c0616142b6c8df77c96075c7bbeb77b6a14f1c7357753c3566",
        "namedStatements": [
          "Lemma A.1"
        ]
      },
      {
        "page": 53,
        "sections": [
          "5"
        ],
        "characters": 6250,
        "textSha256": "4b2b556ced847fc931009bf527e65d0c4b7121af1694e60e6853bf1264f15656",
        "namedStatements": []
      },
      {
        "page": 54,
        "sections": [
          "5"
        ],
        "characters": 4176,
        "textSha256": "b4f5869d39184bdecf8afa2a0af737e68303adccffc3df5af259cca30af74c6d",
        "namedStatements": [
          "Lemma A.9",
          "Lemma 5.1",
          "Lemma 5.2"
        ]
      },
      {
        "page": 55,
        "sections": [
          "5"
        ],
        "characters": 3725,
        "textSha256": "32677cc3be4efd7f1e3d12f725890097627cb101d2fb9e93ff279c1e48b60993",
        "namedStatements": [
          "Proposition 5.3",
          "Theorem 4.6",
          "Lemma 5.1",
          "Lemma 5.2",
          "Proposition 4.2"
        ]
      },
      {
        "page": 56,
        "sections": [
          "5"
        ],
        "characters": 3788,
        "textSha256": "84a6d0a5bf1dcbbcec09452e7536ac6c21e7a2496d8a9ed43c017977c9620fc4",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Lemma 5.2"
        ]
      },
      {
        "page": 57,
        "sections": [
          "5"
        ],
        "characters": 4420,
        "textSha256": "45f6de6ba6b40f44b3af93518a0cdca8f73d8d0b040e6eecaecd9f47af983a56",
        "namedStatements": [
          "Lemma 5.4"
        ]
      },
      {
        "page": 58,
        "sections": [
          "5"
        ],
        "characters": 3655,
        "textSha256": "305d8636aa4626b61a6d5f645b16836583eccfd77492e298835cd219d703c035",
        "namedStatements": []
      },
      {
        "page": 59,
        "sections": [
          "5"
        ],
        "characters": 3756,
        "textSha256": "84172a1d380ee1be8ba3177b95c215028474f6e24e0d1455b45e4fee8efc0f4d",
        "namedStatements": []
      },
      {
        "page": 60,
        "sections": [
          "5"
        ],
        "characters": 3941,
        "textSha256": "dedbaeec527a32959d3ed27253c2e36b0799af49beb7431d4138287470ce491b",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Proposition 5.5",
          "Theorem 4.6",
          "Lemma 5.2"
        ]
      },
      {
        "page": 61,
        "sections": [
          "5"
        ],
        "characters": 3847,
        "textSha256": "b86382275b24ba891cb52e20c1a5d832d54bc27967405efd7045664c6adafe74",
        "namedStatements": [
          "Proposition 5.3",
          "Lemma 5.4",
          "Lemma 5.2"
        ]
      },
      {
        "page": 62,
        "sections": [
          "5",
          "6"
        ],
        "characters": 3750,
        "textSha256": "317090fdfdf126583eed6af06fb9db581753bcf887508c469eb567f898c79742",
        "namedStatements": [
          "Proposition 7.5",
          "Lemma 6.1",
          "Lemma 6.2",
          "Proposition 6.6"
        ]
      },
      {
        "page": 63,
        "sections": [
          "6"
        ],
        "characters": 4037,
        "textSha256": "5c53cae12853a93ef2f4673e6a6e5f759912ca2d28e9282de6108bc1e08ccaca",
        "namedStatements": []
      },
      {
        "page": 64,
        "sections": [
          "6"
        ],
        "characters": 3868,
        "textSha256": "1cbcb157d46580008cc36bb07313225c58777625ee656d1a22ca971571aace83",
        "namedStatements": [
          "Lemma 8.2",
          "Lemma 6.1"
        ]
      },
      {
        "page": 65,
        "sections": [
          "6"
        ],
        "characters": 4632,
        "textSha256": "7ee460a998c06cf95bb1207418a67668d3556aa3ff157ec4aebd9061e2c35d1c",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 6.1"
        ]
      },
      {
        "page": 66,
        "sections": [
          "6"
        ],
        "characters": 3604,
        "textSha256": "dc9194767d232a9007e270be87d47377cb5e7665ce2e69e29d829efd0e4f9eb4",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 6.2"
        ]
      },
      {
        "page": 67,
        "sections": [
          "6"
        ],
        "characters": 3818,
        "textSha256": "a37296a76f6573a7c3fc302abe73ccfbfe4dc6fc678310702f88ff56478794a7",
        "namedStatements": [
          "Lemma 6.2"
        ]
      },
      {
        "page": 68,
        "sections": [
          "6"
        ],
        "characters": 3695,
        "textSha256": "324309a20dcacfc39eb2d10f24ac55c256e4659dc911343c402a81358fc0cc02",
        "namedStatements": [
          "Lemma 6.3"
        ]
      },
      {
        "page": 69,
        "sections": [
          "6"
        ],
        "characters": 3791,
        "textSha256": "0716363f30b70a58b54c30bd9857c175a0441f7091e71ee541c4a7273eb6d70e",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 6.6",
          "Theorem 4.6",
          "Definition 6.4"
        ]
      },
      {
        "page": 70,
        "sections": [
          "6"
        ],
        "characters": 3319,
        "textSha256": "dfe6a57c6ff2eeeb58400942c043636681284b326dc91c280689e5b1abaafb49",
        "namedStatements": [
          "Definition 6.5"
        ]
      },
      {
        "page": 71,
        "sections": [
          "6"
        ],
        "characters": 3241,
        "textSha256": "0b2b44bf3c59984d78112e392343f98f98d79036b4335e741aa88ee22701d77e",
        "namedStatements": [
          "Proposition 6.6"
        ]
      },
      {
        "page": 72,
        "sections": [
          "6"
        ],
        "characters": 3739,
        "textSha256": "18d9386422f1048628392e17c91bc0433056120e053748ec2f3bae6028923122",
        "namedStatements": [
          "Lemma 6.1",
          "Lemma 6.2",
          "Proposition 7.2"
        ]
      },
      {
        "page": 73,
        "sections": [
          "6",
          "7"
        ],
        "characters": 3896,
        "textSha256": "a0093288069561fde6369974e889ed67f274d49ba7fee4ab2c6135d7e65aa712",
        "namedStatements": [
          "Proposition 9.6",
          "Proposition 5.5",
          "Lemma 6.1",
          "Proposition 7.2",
          "Proposition 7.6",
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 74,
        "sections": [
          "7"
        ],
        "characters": 4384,
        "textSha256": "ab3bdfee6290dffdc6afd97b645f68390e0edd39e6891a2bf8d5e721a497fb12",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma 4.5"
        ]
      },
      {
        "page": 75,
        "sections": [
          "7"
        ],
        "characters": 4191,
        "textSha256": "ae9738a4b6617e5b7bf5265f1967122ccafd77eb9798efcec25c96605012c3b5",
        "namedStatements": [
          "Proposition 9.1",
          "Lemma 7.1"
        ]
      },
      {
        "page": 76,
        "sections": [
          "7"
        ],
        "characters": 3892,
        "textSha256": "7306b5d34ba70a5aac38d52d5f49a3d5d15a15056cd78a5d7a9e9fbe1cf0e762",
        "namedStatements": []
      },
      {
        "page": 77,
        "sections": [
          "7"
        ],
        "characters": 3945,
        "textSha256": "2dbc96b26ddfd4330c4705a0f893b003935be2f4fb8c60eb7443beec58c7c160",
        "namedStatements": [
          "Lemma 7.1",
          "Proposition 7.2",
          "Lemma 7.4",
          "Lemma 6.2"
        ]
      },
      {
        "page": 78,
        "sections": [
          "7"
        ],
        "characters": 3940,
        "textSha256": "82c205ce65ae132d3be6066111a5af3ed79e28538b18369147bee6a475ae0c1a",
        "namedStatements": [
          "Lemma 7.1",
          "Proposition 7.2"
        ]
      },
      {
        "page": 79,
        "sections": [
          "7"
        ],
        "characters": 4072,
        "textSha256": "56d2ffb79e1464f878a14e48cf4489a844f9bf4a0d475acf59f4e6aca857b439",
        "namedStatements": []
      },
      {
        "page": 80,
        "sections": [
          "7"
        ],
        "characters": 3598,
        "textSha256": "18abcdd70f7076b377a87019f2577721d32df72177a8c6414a80be4de1631caa",
        "namedStatements": [
          "Proposition 5.5",
          "Corollary 7.3",
          "Lemma 7.1",
          "Lemma 7.4"
        ]
      },
      {
        "page": 81,
        "sections": [
          "7"
        ],
        "characters": 4285,
        "textSha256": "1f2b011c6a91533b05bc62bc0ae3a9d3369267937b4f14fbfc69649a9794ce7c",
        "namedStatements": [
          "Lemma 7.4",
          "Proposition 7.5",
          "Proposition 7.6"
        ]
      },
      {
        "page": 82,
        "sections": [
          "7"
        ],
        "characters": 4190,
        "textSha256": "9b419b9e08645d5f8637993c22be1e23a39c146401378068ec7fe54f248509dc",
        "namedStatements": [
          "Lemma 6.2",
          "Proposition 7.5",
          "Lemma 7.4",
          "Lemma 7.1"
        ]
      },
      {
        "page": 83,
        "sections": [
          "7"
        ],
        "characters": 4372,
        "textSha256": "a161fc6a2ebc8f989beac0f7e27bfae74c65b4894c09109dc7351c17bbc2b588",
        "namedStatements": [
          "Lemma 7.4"
        ]
      },
      {
        "page": 84,
        "sections": [
          "7"
        ],
        "characters": 3758,
        "textSha256": "e949fc67708f39b80410a10ff29e1ff4737b73ee9b86d6a681f30ee9a1674d3e",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 7.6",
          "Lemma 7.4"
        ]
      },
      {
        "page": 85,
        "sections": [
          "7"
        ],
        "characters": 3894,
        "textSha256": "1da0ea21bf2fd951c7df948029ccd38b0fe8f4209a8f6ce727e559179a6d6360",
        "namedStatements": [
          "Definition 6.5",
          "Proposition 7.6",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 86,
        "sections": [
          "7"
        ],
        "characters": 3765,
        "textSha256": "f51350161bc7ec03e6dae801dcc6228f023583409b54937eb3f652e798ed9569",
        "namedStatements": [
          "Lemma 7.7",
          "Lemma 7.1",
          "Proposition 7.2"
        ]
      },
      {
        "page": 87,
        "sections": [
          "7"
        ],
        "characters": 3581,
        "textSha256": "b25351f0e0aff8f5f040cb418583fb18f0e15ae7e93c07f52d41d3bf38fb40c0",
        "namedStatements": [
          "Corollary 7.8",
          "Lemma 7.7"
        ]
      },
      {
        "page": 88,
        "sections": [
          "7",
          "8"
        ],
        "characters": 4121,
        "textSha256": "11da2ed1cfc2d4004ec9ef8c42af8b8b4c2cc01ddfcecbaa02adf720b773d68f",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 8.1",
          "Proposition 8.3",
          "Corollary 8.5",
          "Lemma 8.2",
          "Lemma 8.6",
          "Lemma 8.7",
          "Lemma 8.8",
          "Proposition 9.6",
          "Lemma 6.2",
          "Definition 6.4",
          "Proposition 8.4"
        ]
      },
      {
        "page": 89,
        "sections": [
          "8"
        ],
        "characters": 3709,
        "textSha256": "fe1c78a00ffe502ce8da53d3b085402e155f89064a99ab02b524db9b1dbf68cc",
        "namedStatements": [
          "Proposition 8.1",
          "Lemma 8.2"
        ]
      },
      {
        "page": 90,
        "sections": [
          "8"
        ],
        "characters": 4396,
        "textSha256": "e0017f57efded900dc78d20d6c54db140ac2568fea5ac815bc9e6454d4d26e98",
        "namedStatements": [
          "Lemma 8.2"
        ]
      },
      {
        "page": 91,
        "sections": [
          "8"
        ],
        "characters": 3984,
        "textSha256": "439a2c38ee5b3d4e87a612e979d478f5b6b10853dfe9abd1f875a781b50bd8dc",
        "namedStatements": [
          "Lemma 6.2"
        ]
      },
      {
        "page": 92,
        "sections": [
          "8"
        ],
        "characters": 3848,
        "textSha256": "2d6d77d8a096f1b07b98adf70a7117aabd182fb46990b3dfd3aee01cdb6f8a66",
        "namedStatements": [
          "Lemma 8.2",
          "Proposition 8.3",
          "Theorem 4.6"
        ]
      },
      {
        "page": 93,
        "sections": [
          "8"
        ],
        "characters": 3784,
        "textSha256": "fde3a5813fa0c3a0e3cc76e141a62b008ef81ee2938e96fed7e9095325208484",
        "namedStatements": [
          "Lemma 8.2",
          "Corollary 8.5"
        ]
      },
      {
        "page": 94,
        "sections": [
          "8"
        ],
        "characters": 4406,
        "textSha256": "815fb41626588a67a40d0f62a96e8e22dc9b0eb8191ed9d5e7a127bd5521f0ed",
        "namedStatements": [
          "Proposition 8.4"
        ]
      },
      {
        "page": 95,
        "sections": [
          "8"
        ],
        "characters": 3709,
        "textSha256": "1f3bc3f0c4af7dd137011412663442c14f7ed7b020d0428572ada6283d654125",
        "namedStatements": [
          "Corollary 8.5",
          "Proposition 8.4",
          "Lemma 8.2",
          "Lemma 8.6"
        ]
      },
      {
        "page": 96,
        "sections": [
          "8"
        ],
        "characters": 4063,
        "textSha256": "ff8e68de317bf547a32754a84d7db668cd0a8dfbfc3dc50616ab93142556cb2d",
        "namedStatements": [
          "Proposition 8.3",
          "Lemma 8.2",
          "Corollary 8.5",
          "Lemma 8.6"
        ]
      },
      {
        "page": 97,
        "sections": [
          "8"
        ],
        "characters": 3752,
        "textSha256": "0203b0e90e89064fa5dd278c45abc253d4027ff25272ce530e00c41e4e14ce9b",
        "namedStatements": [
          "Proposition 5.5",
          "Lemma 8.7",
          "Lemma 8.8"
        ]
      },
      {
        "page": 98,
        "sections": [
          "8"
        ],
        "characters": 3883,
        "textSha256": "23d5f6f99820d7aaddc6399456fb7d5ddc01ee10e598582fe7e122aa2baf23e3",
        "namedStatements": [
          "Lemma 8.2",
          "Lemma 8.8",
          "Lemma 8.7"
        ]
      },
      {
        "page": 99,
        "sections": [
          "8"
        ],
        "characters": 4134,
        "textSha256": "5f301af18378620fa349ef0eec7f21d82acdbabec2e8101559e73fab492e4444",
        "namedStatements": [
          "Lemma 8.7",
          "Lemma 6.2"
        ]
      },
      {
        "page": 100,
        "sections": [
          "8",
          "9"
        ],
        "characters": 3797,
        "textSha256": "d74c2d853cf4f26d518cf6a3e11ded7c0f8799c70f27d8b338fda6b43971d180",
        "namedStatements": [
          "Proposition 9.6",
          "Theorem 3.1",
          "Proposition 5.5",
          "Lemma 7.7",
          "Proposition 7.2",
          "Lemma 9.7",
          "Proposition 9.9"
        ]
      },
      {
        "page": 101,
        "sections": [
          "9"
        ],
        "characters": 3681,
        "textSha256": "82f6b7735ca270319c5024c5b46497b3dd12801c7ea48a9c6eadca836cc9d310",
        "namedStatements": [
          "Lemma 7.7",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 9.6",
          "Proposition 7.2"
        ]
      },
      {
        "page": 102,
        "sections": [
          "9"
        ],
        "characters": 3520,
        "textSha256": "2b0c37e017f7088c510a8196d07db32d32d1fca669750be6f4257b512e7ed60a",
        "namedStatements": [
          "Proposition 7.2",
          "Lemma 9.2"
        ]
      },
      {
        "page": 103,
        "sections": [
          "9"
        ],
        "characters": 4019,
        "textSha256": "60db3d0f3ada32ffa8f7377da94f35355db1bb587e6b1ee9296a2817dd9b4260",
        "namedStatements": [
          "Lemma 6.1",
          "Proposition 9.1",
          "Lemma 9.2",
          "Proposition 7.2",
          "Proposition 9.3"
        ]
      },
      {
        "page": 104,
        "sections": [
          "9"
        ],
        "characters": 4289,
        "textSha256": "0c092af9f1e67ae3d927ac459d0374d4a7ccfa3fe072c1197c5f1ddc0b07f6c8",
        "namedStatements": [
          "Lemma 9.2",
          "Proposition 7.6"
        ]
      },
      {
        "page": 105,
        "sections": [
          "9"
        ],
        "characters": 3961,
        "textSha256": "2ce96c78e6df4d2d08b1798fbbbb0858981e620dec6d8de165d28772a603d53a",
        "namedStatements": [
          "Proposition 7.6",
          "Proposition 7.2",
          "Lemma 6.2",
          "Proposition 9.1",
          "Lemma 8.2",
          "Proposition 8.1"
        ]
      },
      {
        "page": 106,
        "sections": [
          "9"
        ],
        "characters": 3894,
        "textSha256": "8b20c7454e8a3b20d03994fffbf08f1fcf8843d7033c50a0586432ed18dea7bd",
        "namedStatements": [
          "Proposition 9.5",
          "Proposition 9.6",
          "Definition 9.4",
          "Proposition 9.3",
          "Proposition 8.3"
        ]
      },
      {
        "page": 107,
        "sections": [
          "9"
        ],
        "characters": 4352,
        "textSha256": "b8a8ee16e6165a2e997149f2150fb499d23f2a5fb2c3060ebdb51f3571298f57",
        "namedStatements": [
          "Proposition 7.5",
          "Proposition 9.6",
          "Definition 9.4"
        ]
      },
      {
        "page": 108,
        "sections": [
          "9"
        ],
        "characters": 3613,
        "textSha256": "f24850b4935e39ae0fab85f4a862f32055f14bd616b1305729906ca94318808d",
        "namedStatements": [
          "Proposition 7.2",
          "Proposition 9.1",
          "Lemma 9.2"
        ]
      },
      {
        "page": 109,
        "sections": [
          "9"
        ],
        "characters": 4248,
        "textSha256": "efaa8b1c48bf85f759d0f077c11f23b23e16a45f41cbf7b9c5b215f8d226b2c6",
        "namedStatements": [
          "Proposition 9.3",
          "Lemma 7.7",
          "Corollary 7.8"
        ]
      },
      {
        "page": 110,
        "sections": [
          "9"
        ],
        "characters": 3481,
        "textSha256": "e8b0f06d88886831a551755eadcefbd283af4fa05301a7110a1c371e3778fdb4",
        "namedStatements": [
          "Lemma 8.6"
        ]
      },
      {
        "page": 111,
        "sections": [
          "9"
        ],
        "characters": 3832,
        "textSha256": "b18c9b020febb29a51ccb1a9f5446a088268119861c5fbe052c4bedeb2e11afa",
        "namedStatements": [
          "Proposition 9.3",
          "Lemma 5.4",
          "Lemma 9.7",
          "Lemma 9.8"
        ]
      },
      {
        "page": 112,
        "sections": [
          "9"
        ],
        "characters": 3713,
        "textSha256": "c5bea2a89aeff26d21c246328a0337616e75441cff9034c8e954868d00575d1c",
        "namedStatements": [
          "Corollary 7.3",
          "Lemma 8.7"
        ]
      },
      {
        "page": 113,
        "sections": [
          "9"
        ],
        "characters": 3867,
        "textSha256": "f2f17addefe6d3071fc8b60f6f50097b4ac3b80eccf4a159279f43c4c22116ab",
        "namedStatements": [
          "Lemma 9.8"
        ]
      },
      {
        "page": 114,
        "sections": [
          "9"
        ],
        "characters": 3826,
        "textSha256": "d3728ee90e196028fcab0176aaf5ee0f0528eae110622238754a4172a02545a3",
        "namedStatements": [
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 3.1",
          "Lemma 9.7",
          "Lemma 9.8"
        ]
      },
      {
        "page": 115,
        "sections": [
          "9"
        ],
        "characters": 3693,
        "textSha256": "2d73ffcd646b538140a8259eb561675fba83011e3418485bc4505127628a2e6e",
        "namedStatements": [
          "Lemma 5.4",
          "Theorem 3.1",
          "Theorem 4.6",
          "Proposition 5.5"
        ]
      },
      {
        "page": 116,
        "sections": [
          "9",
          "10"
        ],
        "characters": 3611,
        "textSha256": "b37cff2794d7ac739e0ddd9feca4dfb8388e94c3f8adc01763de5f105cc5513e",
        "namedStatements": [
          "Theorem 3.1",
          "Lemma A.6",
          "Theorem 1.1"
        ]
      },
      {
        "page": 117,
        "sections": [
          "10"
        ],
        "characters": 3725,
        "textSha256": "b61dcb1cd2644c6d04c4aa487fde98c5ebbd6886bb0db4aef121a1b49c795635",
        "namedStatements": [
          "Proposition 10.1",
          "Lemma 10.3",
          "Lemma 10.2",
          "Lemma 10.4",
          "Lemma 10.5",
          "Theorem 1.1",
          "Corollary 10.6",
          "Theorem 3.1",
          "Proposition 5.5"
        ]
      },
      {
        "page": 118,
        "sections": [
          "10"
        ],
        "characters": 3578,
        "textSha256": "5332dc3c925254de6333cbf485211d162fb6df10fe88835bdbeb50499e8ce2aa",
        "namedStatements": [
          "Theorem 3.1",
          "Lemma 10.2",
          "Lemma 10.3"
        ]
      },
      {
        "page": 119,
        "sections": [
          "10"
        ],
        "characters": 4586,
        "textSha256": "75a1e892d4d4ed39d6d87456cbfe7a243d587dbfa8026387c3ec735e0888b78d",
        "namedStatements": [
          "Theorem 3.1",
          "Proposition 9.9"
        ]
      },
      {
        "page": 120,
        "sections": [
          "10"
        ],
        "characters": 4714,
        "textSha256": "e743a15a9302cb7d2a7e226f0ec8a4d87ab45cea3f0a29b0b794a38b189eb840",
        "namedStatements": [
          "Lemma 10.3"
        ]
      },
      {
        "page": 121,
        "sections": [
          "10"
        ],
        "characters": 3582,
        "textSha256": "d306092b6108977f856fd208c62791f265b4dfe270a165d56d2b0b490104ed16",
        "namedStatements": [
          "Lemma 10.3",
          "Lemma 10.4",
          "Lemma 10.5",
          "Proposition 10.1"
        ]
      },
      {
        "page": 122,
        "sections": [
          "10"
        ],
        "characters": 4080,
        "textSha256": "8b9248a4889172872a564415887513275c939ec9be580ca232e5efce65e3f0c0",
        "namedStatements": []
      },
      {
        "page": 123,
        "sections": [
          "10"
        ],
        "characters": 3718,
        "textSha256": "25d99dc29af4d8065a47378456cd34cb90db3a2d530d42c3326b4716594be9a9",
        "namedStatements": [
          "Lemma 10.3",
          "Theorem 3.1",
          "Lemma 10.5"
        ]
      },
      {
        "page": 124,
        "sections": [
          "10"
        ],
        "characters": 3974,
        "textSha256": "610c472fbdee84d0aa1839d9cc02fe9637a499c492ddbfe5b578cc986ae9fb8d",
        "namedStatements": [
          "Theorem 1.1",
          "Lemma 10.3",
          "Lemma 10.4",
          "Theorem 3.1",
          "Lemma 10.5"
        ]
      },
      {
        "page": 125,
        "sections": [
          "10"
        ],
        "characters": 3273,
        "textSha256": "6de87a02ffcd8089161e287fb79191d4e4a6728fbc34626e27c5168855041843",
        "namedStatements": [
          "Proposition 10.1",
          "Lemma 10.3",
          "Corollary 10.6"
        ]
      },
      {
        "page": 126,
        "sections": [
          "10",
          "A"
        ],
        "characters": 3547,
        "textSha256": "22dfb839a10032dd4d6a7db7886197f8021d12f4187821f81614d35fd301cc91",
        "namedStatements": [
          "Theorem 4.6",
          "Lemma A.5",
          "Lemma A.8",
          "Proposition B.8",
          "Proposition C.2",
          "Proposition A.7",
          "Lemma A.1",
          "Lemma A.2",
          "Lemma 4.4"
        ]
      },
      {
        "page": 127,
        "sections": [
          "A"
        ],
        "characters": 3922,
        "textSha256": "0c15847edcfa316c2cc5ef42205565360eff2edab4dcb5dd178add15df747dde",
        "namedStatements": [
          "Lemma A.2"
        ]
      },
      {
        "page": 128,
        "sections": [
          "A"
        ],
        "characters": 3395,
        "textSha256": "7ab1b04158d62214e7f98afcc2984d23f775cd7456c17cf6202f2e63b3529660",
        "namedStatements": [
          "Corollary A.3",
          "Lemma A.1",
          "Lemma 4.4"
        ]
      },
      {
        "page": 129,
        "sections": [
          "A"
        ],
        "characters": 3802,
        "textSha256": "0ac04a725e5241e73931a56e0617e943bea148a1ee6ac2163a5d226654f4f76c",
        "namedStatements": [
          "Definition 3.3"
        ]
      },
      {
        "page": 130,
        "sections": [
          "A"
        ],
        "characters": 4041,
        "textSha256": "50cee327ff112326be662171dadd851bb0848e6dd9c20ab6a58ef2602349d99a",
        "namedStatements": [
          "Proposition A.4"
        ]
      },
      {
        "page": 131,
        "sections": [
          "A"
        ],
        "characters": 4250,
        "textSha256": "499a511975ad82687614ecfcc7e6fc88e2b182ef6f5ead6e372d2f3dc86f7c5c",
        "namedStatements": [
          "Proposition A.4"
        ]
      },
      {
        "page": 132,
        "sections": [
          "A"
        ],
        "characters": 4163,
        "textSha256": "e2498af4e162c3f18175dea60df6788f472ece08287ead9a11f660aaf74defe7",
        "namedStatements": [
          "Lemma A.2"
        ]
      },
      {
        "page": 133,
        "sections": [
          "A"
        ],
        "characters": 4019,
        "textSha256": "d8661b5f427440c6f204757acc900d723a87cd2b4fe16ddd6cdc6583ec5f074f",
        "namedStatements": [
          "Lemma A.2",
          "Proposition B.2",
          "Lemma A.5"
        ]
      },
      {
        "page": 134,
        "sections": [
          "A"
        ],
        "characters": 3989,
        "textSha256": "cfdf145368a3b37c90fd7ef1c9b3887fe28dee40fde7a75c83390bfe6d767f13",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition A.4",
          "Lemma 4.5"
        ]
      },
      {
        "page": 135,
        "sections": [
          "A"
        ],
        "characters": 3917,
        "textSha256": "4630ffa71cfaf1353d2d16f3177669f29f08212cc21417764caf20532b5391ad",
        "namedStatements": []
      },
      {
        "page": 136,
        "sections": [
          "A"
        ],
        "characters": 3750,
        "textSha256": "dcedcee3622ce1230c5af4fba5ff114d5835eafbf61990601541c975a84e9b84",
        "namedStatements": []
      },
      {
        "page": 137,
        "sections": [
          "A"
        ],
        "characters": 4219,
        "textSha256": "f0b098ccc864eba2bbc31d8b88bf4b9fff0ca90ff833dec6f6fe1bbc18fc6e39",
        "namedStatements": [
          "Proposition A.4",
          "Lemma A.6",
          "Proposition A.7",
          "Proposition 4.2",
          "Lemma A.8",
          "Proposition A.10"
        ]
      },
      {
        "page": 138,
        "sections": [
          "A"
        ],
        "characters": 3778,
        "textSha256": "af52d5ed70d8b58ec59bc6735968346a1a550b0e9bcd9bfbf009839b576872d7",
        "namedStatements": [
          "Lemma A.6"
        ]
      },
      {
        "page": 139,
        "sections": [
          "A"
        ],
        "characters": 4491,
        "textSha256": "e1fc6a81874736d108870f20ab3819ea8b46e3823ff24a44801d2dde54ee1b3c",
        "namedStatements": [
          "Proposition A.4",
          "Proposition A.7"
        ]
      },
      {
        "page": 140,
        "sections": [
          "A"
        ],
        "characters": 4607,
        "textSha256": "a0b7778debe6a759b336b523b46526137e0a1c2adc75763e453878ae53ec3a6e",
        "namedStatements": [
          "Lemma A.1",
          "Lemma A.2",
          "Proposition A.4",
          "Lemma A.8",
          "Proposition A.10",
          "Proposition B.2",
          "Corollary B.10"
        ]
      },
      {
        "page": 141,
        "sections": [
          "A"
        ],
        "characters": 5038,
        "textSha256": "764ca0418005bde49f39793e322068a93f4afd3e486147692e2b1b13bddafd6d",
        "namedStatements": [
          "Lemma A.6",
          "Lemma A.9"
        ]
      },
      {
        "page": 142,
        "sections": [
          "A"
        ],
        "characters": 4119,
        "textSha256": "091773eb19b4d6e64eb4b9bc2f10ba873961f9cb20b47ff479f2e2b3e2bffca2",
        "namedStatements": [
          "Proposition A.10",
          "Lemma A.8",
          "Lemma A.6"
        ]
      },
      {
        "page": 143,
        "sections": [
          "A"
        ],
        "characters": 3903,
        "textSha256": "78e5909a501075c2dc292b1e82cbfddc289cb2b6648e6a4f1120d19d187013d7",
        "namedStatements": [
          "Lemma A.9"
        ]
      },
      {
        "page": 144,
        "sections": [
          "A",
          "B"
        ],
        "characters": 3391,
        "textSha256": "c369e9bfd847806633ef2b8bac41b3121ac0c1c4d4f979c030ed7d41188d90b1",
        "namedStatements": [
          "Proposition B.2",
          "Lemma A.5",
          "Corollary B.10",
          "Proposition B.3"
        ]
      },
      {
        "page": 145,
        "sections": [
          "B"
        ],
        "characters": 4048,
        "textSha256": "414b9e6fc0f48ce552fc7f51ed22ab4487e4c7f2d3a20e5f8c6c5251d78df2bb",
        "namedStatements": [
          "Lemma B.1",
          "Proposition B.2"
        ]
      },
      {
        "page": 146,
        "sections": [
          "B"
        ],
        "characters": 3853,
        "textSha256": "33ae4af9bd70434a1539db6f9e629ae7924a3612277d949c7654c3ef1b73fce3",
        "namedStatements": [
          "Proposition B.2"
        ]
      },
      {
        "page": 147,
        "sections": [
          "B"
        ],
        "characters": 3449,
        "textSha256": "f887f0f2d5b418757b7543d2ffa470584ec970603c078cb137b07c226b02ffcb",
        "namedStatements": [
          "Lemma B.1"
        ]
      },
      {
        "page": 148,
        "sections": [
          "B"
        ],
        "characters": 3778,
        "textSha256": "52e63ae9c76635db28b3e27769c9cbbd3750d3af7d6a5816192b546fa374ed61",
        "namedStatements": [
          "Proposition B.3",
          "Lemma B.4"
        ]
      },
      {
        "page": 149,
        "sections": [
          "B"
        ],
        "characters": 3672,
        "textSha256": "7d3fe8e9f6c47230e57ea88c2a7a4444d946235865039891825652b9cee16924",
        "namedStatements": []
      },
      {
        "page": 150,
        "sections": [
          "B"
        ],
        "characters": 3857,
        "textSha256": "b762a81b371b8537ba92d99bc020a04ef2e051a5a89d9ccb8f47003ccb242fdc",
        "namedStatements": [
          "Proposition B.2",
          "Lemma A.5",
          "Lemma B.4",
          "Proposition B.5",
          "Proposition B.3"
        ]
      },
      {
        "page": 151,
        "sections": [
          "B"
        ],
        "characters": 4255,
        "textSha256": "0e48e571d71ee6172d2759b165a1e1868390b8020bf131b56cc8132c38c13d72",
        "namedStatements": [
          "Lemma B.4",
          "Proposition B.5"
        ]
      },
      {
        "page": 152,
        "sections": [
          "B"
        ],
        "characters": 3864,
        "textSha256": "7a18658b35398de4686bb5a949d844345c29721f1516e588a3421f089ede0fdd",
        "namedStatements": [
          "Lemma B.4",
          "Lemma 4.5",
          "Lemma A.9"
        ]
      },
      {
        "page": 153,
        "sections": [
          "B"
        ],
        "characters": 4066,
        "textSha256": "caa940b43c6a921a6e4ded5829fc32ebbdb2f17e6264903757acf19a7d82ad6b",
        "namedStatements": [
          "Lemma B.4",
          "Proposition B.2",
          "Proposition B.5"
        ]
      },
      {
        "page": 154,
        "sections": [
          "B"
        ],
        "characters": 3609,
        "textSha256": "d96eb095bf43c0abb0c70514336d70086bab16c45ad9e140379be5960b053d27",
        "namedStatements": [
          "Proposition B.8",
          "Lemma B.7",
          "Proposition B.5",
          "Lemma B.4"
        ]
      },
      {
        "page": 155,
        "sections": [
          "B"
        ],
        "characters": 4342,
        "textSha256": "0a112ece194bf3302897af4a8e6da2be1232c25905a0481eefdec9d412483826",
        "namedStatements": [
          "Proposition B.8",
          "Lemma 4.4",
          "Proposition B.5"
        ]
      },
      {
        "page": 156,
        "sections": [
          "B"
        ],
        "characters": 4109,
        "textSha256": "892acd57f05169753cf6058cc0b6fe75cbf8d4c7374291050ad40c86e704efbe",
        "namedStatements": []
      },
      {
        "page": 157,
        "sections": [
          "B",
          "C"
        ],
        "characters": 4053,
        "textSha256": "d52d995f0f6a49c3c2682d87cb97b4693de455075184e447515097d447d36102",
        "namedStatements": [
          "Corollary A.3",
          "Lemma A.2",
          "Lemma 4.4",
          "Lemma B.7",
          "Corollary B.10",
          "Proposition B.2",
          "Corollary B.6"
        ]
      },
      {
        "page": 158,
        "sections": [
          "C"
        ],
        "characters": 4031,
        "textSha256": "df93e2df128d6dac1564f9b61e4c0aaee7a3e11d0b26b9ac9b202d42e4afe928",
        "namedStatements": [
          "Lemma 4.5",
          "Lemma C.1",
          "Proposition C.2",
          "Corollary B.10",
          "Proposition A.4",
          "Proposition A.7",
          "Proposition B.8",
          "Lemma A.8",
          "Corollary B.6"
        ]
      },
      {
        "page": 159,
        "sections": [
          "C"
        ],
        "characters": 4183,
        "textSha256": "20244dbba2be2b3a5f51891c0763e729df1f3747f15cc2786da02866cb8e9077",
        "namedStatements": []
      },
      {
        "page": 160,
        "sections": [
          "C"
        ],
        "characters": 3591,
        "textSha256": "3f12cc6d979263d30937c3af99b9da50e6205704bebffcee8c72488b0f1ddce2",
        "namedStatements": []
      },
      {
        "page": 161,
        "sections": [
          "C"
        ],
        "characters": 4498,
        "textSha256": "7c4100dc914f0b26474e73ad3d9480f3df99b92e8532a9604e6f7ad5ca7bd5fc",
        "namedStatements": [
          "Lemma C.1",
          "Proposition C.2"
        ]
      },
      {
        "page": 162,
        "sections": [
          "C"
        ],
        "characters": 4067,
        "textSha256": "dbe61305d23a293236d0d643d421850b88d42454229b99f344ae998053931440",
        "namedStatements": [
          "Lemma C.1",
          "Lemma A.1",
          "Corollary A.3",
          "Lemma A.2"
        ]
      },
      {
        "page": 163,
        "sections": [
          "C"
        ],
        "characters": 4199,
        "textSha256": "16b743e4e859f7cace2c6872a497c7420c8a9a512c28c65c2416b6c037eaadde",
        "namedStatements": [
          "Lemma 4.4",
          "Proposition C.2",
          "Proposition C.3",
          "Theorem 4.6",
          "Proposition 4.10",
          "Proposition B.5",
          "Lemma A.8"
        ]
      },
      {
        "page": 164,
        "sections": [
          "C"
        ],
        "characters": 3888,
        "textSha256": "d04db8407bf2f878ce414ac2bfebc283ce0eda89d331ca1e2745de12a57e3a35",
        "namedStatements": [
          "Proposition A.10",
          "Theorem 4.6",
          "Proposition B.2",
          "Corollary B.6",
          "Proposition C.2",
          "Lemma A.6",
          "Lemma A.5",
          "Proposition 4.2"
        ]
      },
      {
        "page": 165,
        "sections": [
          "C",
          "References"
        ],
        "characters": 4797,
        "textSha256": "bcce45290cadd6ec5b3a811f31766feb15ead2a3afd8fe7f1e4906020df9d47b",
        "namedStatements": [
          "Proposition A.4",
          "Proposition C.2",
          "Theorem 4.6"
        ]
      },
      {
        "page": 166,
        "sections": [
          "References"
        ],
        "characters": 1304,
        "textSha256": "a5d94c77247600bb82cf649b07e9c0b774a3a6c004bb7961008e313af90a49c6",
        "namedStatements": []
      }
    ],
    "coveragePass": true,
    "dependencyPath": [
      "Theorem4.6",
      "Proposition5.5",
      "Proposition7.5",
      "Proposition9.6",
      "Proposition9.9",
      "Proposition10.1",
      "Lemma10.3",
      "Theorem1.1"
    ],
    "claimGraph": [
      {
        "id": "leading",
        "label": "Axisymmetric leading profile",
        "references": [
          "Theorem 4.6",
          "Appendices A–C"
        ],
        "dependsOn": []
      },
      {
        "id": "background",
        "label": "All-order corrected background + annular stress",
        "references": [
          "Proposition 5.5"
        ],
        "dependsOn": [
          "leading"
        ]
      },
      {
        "id": "waves",
        "label": "Two pulse families and covariance matching",
        "references": [
          "Lemma 7.4",
          "Proposition 7.5",
          "Lemma 7.7"
        ],
        "dependsOn": [
          "background"
        ]
      },
      {
        "id": "moments",
        "label": "Pressure and five moment corrections",
        "references": [
          "Proposition 8.3",
          "Lemma 8.7",
          "Lemma 8.8"
        ],
        "dependsOn": [
          "waves"
        ]
      },
      {
        "id": "iteration",
        "label": "Recompute and improve full residual",
        "references": [
          "Propositions 9.3, 9.5, 9.6"
        ],
        "dependsOn": [
          "moments"
        ]
      },
      {
        "id": "summation",
        "label": "Locally finite summation, flat residual",
        "references": [
          "Lemma 5.4",
          "Proposition 9.9",
          "Theorem 3.1"
        ],
        "dependsOn": [
          "iteration"
        ]
      },
      {
        "id": "localization",
        "label": "Smooth compact force, energy and breakdown",
        "references": [
          "Proposition 10.1",
          "Lemmas 10.2–10.5",
          "Theorem 1.1"
        ],
        "dependsOn": [
          "summation"
        ]
      },
      {
        "id": "periodic",
        "label": "Periodic counterpart",
        "references": [
          "Corollary 10.6"
        ],
        "dependsOn": [
          "localization"
        ]
      }
    ],
    "implementationMap": [
      {
        "module": "coordinates.mjs",
        "pages": [
          24,
          25
        ],
        "references": [
          "4.1",
          "4.2"
        ]
      },
      {
        "module": "profile.mjs",
        "pages": [
          25,
          26,
          27,
          34,
          35,
          36,
          37
        ],
        "references": [
          "4.4",
          "4.5",
          "4.6",
          "4.10",
          "4.13",
          "Theorem4.6"
        ]
      },
      {
        "module": "radial.mjs",
        "pages": [
          129,
          130,
          133,
          139,
          155,
          156,
          157,
          161,
          162,
          163
        ],
        "references": [
          "A.5-A.13",
          "A.21",
          "B.35-B.40",
          "C.12",
          "C.17",
          "C.18"
        ]
      },
      {
        "module": "axis-series.mjs",
        "pages": [
          144,
          145,
          146,
          147,
          148
        ],
        "references": [
          "B.1-B.16",
          "PropositionB.2"
        ]
      },
      {
        "module": "heat.mjs",
        "pages": [
          138,
          139
        ],
        "references": [
          "LemmaA.6",
          "A.32-A.38"
        ]
      }
    ],
    "audit": "All166 page text and section/statement structure mapped. This is not a line-by-line independent proof audit."
  },
  "analyticContracts": [
    {
      "id": "AXIS_B_RHO",
      "operator": "nonlinear axis fixed point and all eta derivatives",
      "norm": "||a||_{B_rho}=sup_{alpha,beta} |a_alpha_beta|/w_alpha_beta; w=20^(-alpha)rho^(-beta) beta! binom(alpha+beta,beta)/((alpha+1)^2(beta+1)^2)",
      "domain": "Y=Lambda X complex analytic neighborhood; eta in a common complex neighborhood Omega of [-1,1]",
      "quantifiers": "There exist rho>0, invariant radius R, and contraction constant 0<=k<1 such that F maps the closed ball into itself and ||F(a)-F(b)||<=k||a-b|| for all a,b in the ball. Banach completeness is required.",
      "requiredBounds": [
        "sup_Omega |g|<=1",
        "holomorphic coefficients and denominators separated from zero",
        "uniform all-eta coefficient/tail and derivative bounds"
      ],
      "status": "THEOREM_REFERENCE_UNINSTANTIATED",
      "sources": [
        "N00 pp145-148 B.11-B.16"
      ]
    },
    {
      "id": "DERIVATIVE_LIMIT_EXCHANGE",
      "operator": "partial_eta of infinite reconstruction / derivative of uniform limit",
      "norm": "uniform convergence of derivative on an open real set s; pointwise convergence of functions at each x in s",
      "domain": "s subset R is open; f_n,fp_n,g,gp:s->R",
      "quantifiers": "TendstoUniformlyOn fp gp atTop s; eventually for every x in s HasDerivAt(f_n)(fp_n x)x; for every x in s f_n x tends to g x. Then for each x in s HasDerivAt g(gp x)x.",
      "leanTarget": "MathScope.Navier.Analytic.uniform_derivative_exchange",
      "status": "LOCAL_ADAPTER_BUILD_STATUS_IN_LEAN_LEDGER",
      "limitation": "No array sample establishes these universal convergence hypotheses."
    },
    {
      "id": "HEAT_DOMINATED_DIFFERENTIATION",
      "operator": "derivatives of H under the infinite integral",
      "domain": "Z>=0, 0<h<.01; each fixed derivative order m>=0",
      "norm": "L1(0,infinity) in v",
      "quantifiers": "For each fixed m, abs(partial_Z^m integrand) <= (h)_m exp(-v)v^(h+m), an integrable majorant uniform over Z>=0. Gamma(1+h)>0.",
      "status": "ANALYTIC_REFERENCE_PLUS_EXPLICIT_FINITE_INTERVAL_QUADRATURE",
      "sources": [
        "N00 p138 A.32-A.35"
      ],
      "limitation": "Implemented derivative orders0..4; unbounded m cannot be inferred from finite output."
    },
    {
      "id": "HEAT_TAYLOR",
      "operator": "finite Taylor expansion at Z=0",
      "domain": "Z>=0,h>0,finiteN",
      "norm": "absolute scalar remainder <= (h)_(N+1)(1+h)_(N+1) Z^(N+1)/(N+1)!",
      "quantifiers": "For every finite N the Taylor remainder bound follows from the derivative majorant. The infinite Taylor series has radius0 for h>0.",
      "status": "FINITE_REMAINDER_EVALUATOR",
      "sources": [
        "N00 p138 A.35"
      ]
    },
    {
      "id": "BOREL_CUTOFF",
      "operator": "background and all-order correction synthesis beyond M1",
      "domain": "common local physical domain with cutoffs epsilon_k selected per derivative seminorm",
      "norm": "C^m seminorms weighted by q powers; for each fixed m,sum_k norm_m(term_k)<infinity",
      "quantifiers": "For every derivative order m choose all sufficiently late cutoff thresholds so term_k is bounded by2^-k in that seminorm; common supports and divergence-preserving construction are required.",
      "status": "THEOREM_REFERENCE_OUT_OF_M1",
      "sources": [
        "N00 pp59-62 Proposition5.5",
        "N00 pp111-116 Proposition9.9"
      ]
    },
    {
      "id": "SEMIGROUP",
      "operator": "Fourier diffusion exp(-nu|k|^2 t)",
      "domain": "nu>=0,t>=0,k in Z^3; L2(T3) for contraction",
      "norm": "abs multiplier<=1; coefficient ell2 contraction",
      "quantifiers": "For every nonnegative rate and time,exp(-rate*time)<=1. Infinite-dimensional norm estimate additionally requires Parseval and summability.",
      "leanTarget": "MathScope.Navier.Analytic.diffusion_semigroup_bound",
      "status": "LOCAL_ADAPTER_BUILD_STATUS_IN_LEAN_LEDGER"
    },
    {
      "id": "RESIDUAL_STABILITY",
      "operator": "residual to solution error",
      "domain": "specified time interval, normed PDE class, initial/boundary errors and admissible constants",
      "norm": "||u-u_approx|| <= C_stab (||R|| + initialError + boundaryError)",
      "quantifiers": "A stability bound with finite explicitly supplied C_stab is a separate hypothesis; if totalResidual<=epsilon and C_stab>=0 then error<=C_stab epsilon.",
      "leanTarget": "MathScope.Navier.Analytic.stable_residual_budget",
      "status": "LOCAL_CONDITIONAL_ADAPTER",
      "limitation": "No global C_stab is provided for the candidate profile; residual is not reported as a solution-error bound."
    },
    {
      "id": "SPECTRAL_CONTINUUM",
      "operator": "Galerkin limit beyond finite FFT fixture",
      "domain": "solenoidal Fourier fields on T3; fixednu>0,time interval before any asserted singularity",
      "norm": "specified Hs convergence sufficient to multiply and differentiate; e.g. s>5/2 for3D product/control, with separate time regularity",
      "quantifiers": "A uniform-in-cutoff stability/compactness argument and convergence of nonlinear terms are required; finite dealiased convolution identity supplies neither.",
      "status": "THEOREM_REFERENCE_NO_CONTINUUM_LIMIT_CLAIM"
    },
    {
      "id": "SPECTRAL_MEASURE",
      "operator": "general infinite-dimensional spectral interpretation",
      "domain": "a densely defined self-adjoint nonnegative operator on a specified Hilbert space",
      "norm": "spectral measure integral exp(-t lambda); Hilbert norm",
      "quantifiers": "Requires self-adjointness, positivity and spectral theorem hypotheses; the scalar diffusion adapter does not certify these for arbitraryPDE operators.",
      "status": "NOT_USED_BY_CURRENT_NS_NUMERICS"
    }
  ],
  "evidenceGrades": {
    "THEOREM_REFERENCE": "Citation and precise statement, no local kernel proof of the full source claim.",
    "SOURCE_FORMULA": "Direct source expression, evaluated with stated normalization and domain.",
    "VERIFIED_NUMERICAL_ENCLOSURE": "Finite real interval quadrature/series and explicit error budget, without full PDE theorem.",
    "FINITE_NUMERICAL_FIXTURE": "Independent finite numerical consistency checks.",
    "FORMAL_NONLINEAR_AXIS_COEFFICIENTS": "Actual finite nonlinear recurrence coefficients; invariant ball, radius and tail are not certified.",
    "PARTIAL_CANDIDATE_WITH_BLOCKERS": "Source axis/exterior components and explicitly unverified continuation; full theorem gate remains closed.",
    "KERNEL_CHECKED_COMPONENTS": "Only exact named imported/local theorem types and their listed axioms pass the local unchanged kernel.",
    "FULL_CERTIFIED_PROFILE": "Reserved; no current computation may emit this grade."
  },
  "officialValidation": {
    "schemaVersion": 1,
    "sourceCommit": "f9e8bc5b38b6e212696e8a30e3e91517af887bbd",
    "checkedAt": "2026-10-09T16:06:24.537829+00:00",
    "scope": "The two exact C/D exported Lean declaration types at the original pinned rc2 commit. Separate from the 14:39 Lean4.34.1 component receipt, full default build, full paper-to-formal equivalence, and numerical profile certification.",
    "toolchain": "leanprover/lean4:v4.34.0-rc2",
    "kernelCommit": "6a10ac8c22beadecabdbb0919c2b50214762f91d",
    "executionProfile": {
      "kind": "PINNED_OFFICIAL_KERNEL_EXPLICIT_PATH_ENTRY",
      "vanillaCLIOutcome": "Environment path detection failed; exact vanilla commands and exits are separately logged.",
      "entrySourceUnchangedFromPreviouslyApprovedDriver": true,
      "driverSHA256": "a187c5263205d221e47724bbaf729cd377f40683b2670a543e3b7e6495108682",
      "officialSharedLibrarySHA256": "cddf08bd2b9239f8ce2e2aba8630c47e37b6b341b47705d9d0ba910ad6db13b5",
      "taskManagerWorkers": 1,
      "logicalOptionsReplaced": false,
      "proofSourcesChanged": false,
      "manifestChanged": false,
      "originalReleaseBytesChanged": false
    },
    "nsSubmissionBuild": {
      "target": "NavierStokes.ComparatorSolution",
      "exitCode": 0,
      "passed": true,
      "staticLocalSourceDependencyCount": 609,
      "reportedLakeJobs": 9371,
      "log": {
        "file": "official-validation/lake-build-ns-priority-pinned.log",
        "sha256": "f5ca33d2c60d99d59dbc9752bb614bf75964288e2533647584a9e264138192d5"
      },
      "commandReceipt": {
        "file": "official-validation/full-pinned-command-results.json",
        "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
        "stage": "lake-build-ns-priority-pinned"
      }
    },
    "submittedDeclarations": {
      "names": [
        "NavierStokes.Comparator.navier_stokes_breakdown_R3",
        "NavierStokes.Comparator.navier_stokes_breakdown_periodic"
      ],
      "entrySourceSHA256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d",
      "exitCode": 0,
      "kernelCommandAccepted": true,
      "passed": true,
      "axiomClosureRecordedForBothTargets": true,
      "permittedAxioms": [
        "Classical.choice",
        "Quot.sound",
        "propext"
      ],
      "unpermittedAxioms": [],
      "axioms": [
        {
          "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_R3",
          "report": "[propext, Classical.choice, Quot.sound]",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ]
        },
        {
          "declaration": "NavierStokes.Comparator.navier_stokes_breakdown_periodic",
          "report": "[propext, Classical.choice, Quot.sound]",
          "axioms": [
            "propext",
            "Classical.choice",
            "Quot.sound"
          ]
        }
      ],
      "originalSourceFile": "NavierStokes/ComparatorSolution.lean",
      "sourceURL": "https://github.com/openai/NavierStokesAndEuler/blob/f9e8bc5b38b6e212696e8a30e3e91517af887bbd/NavierStokes/ComparatorSolution.lean",
      "sourceSHA256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227",
      "oleanSHA256": "5025fa4e63160cea4fff8dd8f8350acabd3478cdc08563f383484fd01620de76",
      "oleanSizeBytes": 147272,
      "exactNormalTypes": "NavierStokes.Comparator.navier_stokes_breakdown_R3 : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionDecay u₀ ∧\n      NavierStokes.Comparator.ForceConditionDecay f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessRn nu u₀ f v p\nNavierStokes.Comparator.navier_stokes_breakdown_periodic : ∀ nu > 0,\n  ∃ u₀ f,\n    NavierStokes.Comparator.InitialVelocityConditionPeriodic u₀ ∧\n      NavierStokes.Comparator.ForceConditionPeriodic f ∧\n        ¬∃ v p, NavierStokes.Comparator.NavierStokesExistenceAndSmoothnessPeriodic nu u₀ f v p",
      "sourceCopy": {
        "file": "official-validation/OfficialComparatorSolution.lean",
        "sha256": "52950d5d618a8d34c9bfbdb16641c81c276e97b6d7fd2a76c08577353f0b0227"
      },
      "entrySource": {
        "file": "official-validation/PinnedDeclarations.lean",
        "sha256": "b0cf547fcf21a5760c90e326489a2cacdc890c71bfc4d51ecceccb826893f43d"
      },
      "log": {
        "file": "official-validation/ns-pinned-declarations.log",
        "sha256": "4fc376bfe81caf561a1fd501d13f4ea2d9e2d6d41ee9fa687b82f2649ebb3a08"
      },
      "commandReceipt": {
        "file": "official-validation/full-pinned-command-results.json",
        "sha256": "bf992d41b39bdd257ecb9b46e5caf1b6cff634466b6a05052f4d27333f346274",
        "stage": "ns-pinned-declarations"
      }
    },
    "comparator": {
      "status": "BLOCKED",
      "passed": false,
      "exitCode": 1,
      "reachedComparatorProcess": false,
      "blocker": "Required systemd user guard cannot start: no user bus. Session UID 0 also fails the documented unprivileged-user guarantee. Comparator was not reached. No sandbox guard omitted or replaced.",
      "configSHA256": "7610ecead7b390d80ff7f4229a3ff8f18d630e046f7ad1de4f92c7e8e76845b8",
      "guardBypassUsed": false,
      "alternateWeakerPathCountedAsSuccess": false,
      "commandReceipt": {
        "file": "official-validation/comparator-pinned-guarded.json",
        "sha256": "cb7dda2f8777f5419a03777a7ff4a4dd4b504c8c2292f699ac93287e6578e276"
      },
      "log": {
        "file": "official-validation/comparator-pinned-guarded.log",
        "sha256": "746707a49085d66703eb45f2baea0df38a88bab7346195ece161e8e14ef2a3d1"
      },
      "independentEnvironment": {
        "file": "official-validation/comparator-environment-independent.json",
        "sha256": "f7b8b6f2baa8061c0b08a772fa6ce47c85bb098cf27ea4509f801b4f3b18230a"
      }
    },
    "wholeDefaultBuildPassed": false,
    "remainingBuildScope": {
      "submittedLocalDependencyClosure": {
        "sourceModules": 609,
        "oleanArtifactsPresent": 609,
        "oleanArtifactsMissing": 0
      },
      "navierStokesRootSourceClosure": {
        "sourceModules": 753,
        "oleanArtifactsPresent": 692,
        "oleanArtifactsMissing": 61
      },
      "navierStokesWholeLibrary": {
        "sourceModules": 817,
        "oleanArtifactsPresent": 702,
        "oleanArtifactsMissing": 115
      },
      "eulerWholeLibrary": {
        "sourceModules": 1840,
        "oleanArtifactsPresent": 23,
        "oleanArtifactsMissing": 1817
      },
      "comparatorChallenges": {
        "sourceModules": 2,
        "oleanArtifactsPresent": 0,
        "oleanArtifactsMissing": 2
      },
      "grade": "POST_BUILD_ARTIFACT_INVENTORY_ONLY",
      "receipt": {
        "file": "official-validation/remaining-build-scope.json",
        "sha256": "4824f6c994416743f8682e22f6d941713cf0965b20f33183d29ce9529eaf4e20"
      }
    },
    "pinnedEntryKernelControls": {
      "file": "official-validation/pinned-entry-kernel-controls.json",
      "sha256": "83360471e078eaa0c76e2dc06f223a4ac0b62e937b8c309ce7611500ee884a10"
    },
    "originalTrackedSourcesUnchanged": true,
    "completeNumericalPaperProfileCertified": false,
    "browserKernelRerun": false,
    "browserSourceValidationPromotesKernelPass": false,
    "historicalComponentAuditAutomaticallyPromoted": false,
    "numericFieldInstantiatesExistentialWitness": false,
    "auditFile": "official-validation/official-audit-summary.json",
    "auditSHA256": "48b6adab5d50078b974baba02b01db5e771dfe8c18b99de4040823f3bed9e8ff",
    "historicalComponentAudit": {
      "file": "evidence/lean-validation.json",
      "sha256": "90f162823a56035559a584476854a27b2ed135f373183c43593ed47439d8ffe1",
      "checkedAt": "2026-10-09T14:39:01.694607+00:00",
      "toolchain": "Lean/mathlib4.34.1",
      "targetCount": 13,
      "unchanged": true
    }
  }
};
