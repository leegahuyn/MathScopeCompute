// Generated after actual pinned Lean checks. Review raw evidence before updating.
// Imported browser data cannot mutate this module's release authority.
export const SHIPPED_AUDIT_DIGESTS = {
  "m0-finite-d2": "2016205d34c6d44eb658a43074aaf79910c37fc0c862779dd8ea293f1d5a7dbb",
  "m0-finite-integer": "0c1c4d3b73faf9f83c1d812e09dc93b1e8dd4d78818a3ad1a9dd1542e05798ba",
  "m0-analytic-gap": "581f88ef3df935d7ac48289001c484542c3bb937c10054cb6893a92c3c0474a7",
  "m0-conditional-user-gap": "4d4456c8f32f3ca7a353a322118ae16329ee3ba747c4bb029a0a0de49e0ff355",
  "m0-comparison-gap": "ef4ae4f281a9b44e0cfab0da9cf14b100f6290622b8a64ec59958bdc0853f55b"
};
export const SHIPPED_PROOF_BUNDLES = [
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-finite-d2",
    "label": "Finite complex · d² = 0 for every integer vector",
    "scope": "Universal v in Z^4 for the fixed D1 and D0 matrices of the D=1 Cech–de Rham fixture. No full prismatic comparison or omitted-weight claim.",
    "explanation": {
      "student": "For these two fixed integer matrices, applying the two differentials in succession gives the zero vector for every integer input. This verifies the finite chain condition.",
      "expert": "The kernel checks ∀ v : C0, d1 (d0 v) = zeroC2. Its only foundational dependency is propext. This does not prove a geometric comparison or a cohomology rank statement."
    },
    "jobSpec": {
      "claimId": "M0.FINITE.D_SQUARED_ZERO",
      "target": "MathScope.M0.Finite.differential_squared_zero",
      "requestedGrade": "EXACT_FINITE",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Defs.lean",
          "content": "import Init\n\n/-!\nMathScope M0: concrete finite algebra definitions.\n\nThese integer modules are the D = 1 Cech--de Rham matrix fixture used in the\nblueprint.  This file does not identify a finite truncation with a complete\nprismatic complex.  The geometric comparison and the omitted weights require\nseparate certificates.\n-/\n\nnamespace MathScope.M0\n\nstructure C0 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int\n  deriving DecidableEq, Repr\n\nstructure C1 where\n  u : Int\n  v : Int\n  w : Int\n  x : Int\n  y : Int\n  deriving DecidableEq, Repr\n\nstructure C2 where\n  a : Int\n  b : Int\n  c : Int\n  deriving DecidableEq, Repr\n\n/-- Coordinates of the actual 5 by 4 integer matrix in the blueprint. -/\ndef d0 (v : C0) : C1 :=\n  ⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩\n\n/-- Coordinates of the actual 3 by 5 integer matrix in the blueprint. -/\ndef d1 (v : C1) : C2 :=\n  ⟨-v.v + v.w, 0, -v.u - v.y⟩\n\ndef zeroC2 : C2 := ⟨0, 0, 0⟩\n\n/-- The literal matrices are retained for an independently evaluated certificate. -/\ndef matrixD0 : List (List Int) :=\n  [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1],\n   [-1, 0, 1, 0], [0, -1, 0, 0]]\n\ndef matrixD1 : List (List Int) :=\n  [[0, -1, 1, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0, -1]]\n\ndef dot (row column : List Int) : Int :=\n  (row.zipWith (fun a b => a * b) column).foldl (fun a b => a + b) 0\n\n/-- Fixed shape 3 by 5 times 5 by 4; no unbounded indexing is requested. -/\ndef matrixProduct : List (List Int) :=\n  matrixD1.map fun row =>\n    (List.range 4).map fun j => dot row (matrixD0.map fun input => input[j]!)\n\nend MathScope.M0\n",
          "sha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37"
        },
        {
          "path": "MathScope/M0/Finite.lean",
          "content": "import MathScope.M0.Defs\n\n/-!\nUniversal integer-coordinate statement for one fixed finite complex.\nNo claim about all prismatic complexes, cohomology ranks, omitted Laurent\nweights, or Frobenius follows from this single finite theorem.\n-/\n\nnamespace MathScope.M0.Finite\n\nopen MathScope.M0\n\n/-- Literal 3 by 4 product evaluated by the kernel; audit dependencies below. -/\ntheorem matrix_product_zero :\n    matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] := by\n  decide\n\n/-- D1 D0 = 0 for every vector in Z^4, for the specified matrices. -/\ntheorem differential_squared_zero (v : C0) : d1 (d0 v) = zeroC2 := by\n  change C2.mk (-v.d + v.d) 0 (-v.b - -v.b) = C2.mk 0 0 0\n  rw [Int.add_left_neg, Int.sub_self]\n\n/-- Exact integer fixture, including negative and large coordinates. -/\ntheorem integer_fixture :\n    d1 (d0 ⟨-7, 9007199254740993, 11, -13⟩) = zeroC2 := by\n  decide\n\nset_option pp.fullNames true\n\n#check matrix_product_zero\n#print axioms matrix_product_zero\n#check differential_squared_zero\n#print axioms differential_squared_zero\n#check integer_fixture\n#print axioms integer_fixture\n\nend MathScope.M0.Finite\n",
          "sha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713"
        }
      ],
      "assumptions": [],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.FINITE.D_SQUARED_ZERO",
            "kind": "theorem",
            "statement": "MathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2"
          }
        ],
        "edges": []
      },
      "context": {
        "modelId": "p1-cech-de-rham-D1-integer-complex",
        "domain": "Z^4",
        "truncationD": 1,
        "inputShape": [
          5,
          4
        ],
        "outputShape": [
          3,
          5
        ]
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Finite.differential_squared_zero",
      "targetType": "MathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2",
      "axioms": {
        "all": [
          "propext"
        ],
        "standard": [
          "propext"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.256243,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Defs",
          "sourceFile": "MathScope/M0/Defs.lean",
          "sourceSha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37",
          "exitCode": 0,
          "logFile": "lean-defs-audit.txt",
          "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "outputOleanSha256": "678574633fa396804fc3f98751d460a7051810f28098c610db4a8b219026a371"
        },
        {
          "module": "MathScope.M0.Finite",
          "sourceFile": "MathScope/M0/Finite.lean",
          "sourceSha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713",
          "exitCode": 0,
          "logFile": "lean-finite-audit.txt",
          "logSha256": "72fca58e1260d3418a194d3322ba18cdc9df903a4b1eba45453ff2c8c4890935",
          "outputOleanSha256": "5c23ec5f12afebae9ec10754d27bce512d0b63f70f4dcf64984c059717b6c8c2"
        }
      ],
      "targetModuleLog": "MathScope.M0.Finite.matrix_product_zero : MathScope.M0.matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]\n'MathScope.M0.Finite.matrix_product_zero' depends on axioms: [propext]\nMathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.differential_squared_zero' depends on axioms: [propext]\nMathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.integer_fixture' does not depend on any axioms\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-finite-integer",
    "label": "Exact integer fixture · no axiom dependencies",
    "scope": "One exact integer vector (-7, 9007199254740993, 11, -13) under the specified finite differentials. This is a concrete fixture, not a universal theorem.",
    "explanation": {
      "student": "This exact calculation includes an integer beyond JavaScript's safe Number range. Lean computes the result without rounding.",
      "expert": "The theorem integer_fixture is kernel-evaluated, and #print axioms returns no dependencies. Its quantifier scope is the single displayed vector."
    },
    "jobSpec": {
      "claimId": "M0.FINITE.INTEGER_FIXTURE",
      "target": "MathScope.M0.Finite.integer_fixture",
      "requestedGrade": "EXACT_FINITE",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Defs.lean",
          "content": "import Init\n\n/-!\nMathScope M0: concrete finite algebra definitions.\n\nThese integer modules are the D = 1 Cech--de Rham matrix fixture used in the\nblueprint.  This file does not identify a finite truncation with a complete\nprismatic complex.  The geometric comparison and the omitted weights require\nseparate certificates.\n-/\n\nnamespace MathScope.M0\n\nstructure C0 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int\n  deriving DecidableEq, Repr\n\nstructure C1 where\n  u : Int\n  v : Int\n  w : Int\n  x : Int\n  y : Int\n  deriving DecidableEq, Repr\n\nstructure C2 where\n  a : Int\n  b : Int\n  c : Int\n  deriving DecidableEq, Repr\n\n/-- Coordinates of the actual 5 by 4 integer matrix in the blueprint. -/\ndef d0 (v : C0) : C1 :=\n  ⟨v.b, v.d, v.d, v.c - v.a, -v.b⟩\n\n/-- Coordinates of the actual 3 by 5 integer matrix in the blueprint. -/\ndef d1 (v : C1) : C2 :=\n  ⟨-v.v + v.w, 0, -v.u - v.y⟩\n\ndef zeroC2 : C2 := ⟨0, 0, 0⟩\n\n/-- The literal matrices are retained for an independently evaluated certificate. -/\ndef matrixD0 : List (List Int) :=\n  [[0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 0, 1],\n   [-1, 0, 1, 0], [0, -1, 0, 0]]\n\ndef matrixD1 : List (List Int) :=\n  [[0, -1, 1, 0, 0], [0, 0, 0, 0, 0], [-1, 0, 0, 0, -1]]\n\ndef dot (row column : List Int) : Int :=\n  (row.zipWith (fun a b => a * b) column).foldl (fun a b => a + b) 0\n\n/-- Fixed shape 3 by 5 times 5 by 4; no unbounded indexing is requested. -/\ndef matrixProduct : List (List Int) :=\n  matrixD1.map fun row =>\n    (List.range 4).map fun j => dot row (matrixD0.map fun input => input[j]!)\n\nend MathScope.M0\n",
          "sha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37"
        },
        {
          "path": "MathScope/M0/Finite.lean",
          "content": "import MathScope.M0.Defs\n\n/-!\nUniversal integer-coordinate statement for one fixed finite complex.\nNo claim about all prismatic complexes, cohomology ranks, omitted Laurent\nweights, or Frobenius follows from this single finite theorem.\n-/\n\nnamespace MathScope.M0.Finite\n\nopen MathScope.M0\n\n/-- Literal 3 by 4 product evaluated by the kernel; audit dependencies below. -/\ntheorem matrix_product_zero :\n    matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]] := by\n  decide\n\n/-- D1 D0 = 0 for every vector in Z^4, for the specified matrices. -/\ntheorem differential_squared_zero (v : C0) : d1 (d0 v) = zeroC2 := by\n  change C2.mk (-v.d + v.d) 0 (-v.b - -v.b) = C2.mk 0 0 0\n  rw [Int.add_left_neg, Int.sub_self]\n\n/-- Exact integer fixture, including negative and large coordinates. -/\ntheorem integer_fixture :\n    d1 (d0 ⟨-7, 9007199254740993, 11, -13⟩) = zeroC2 := by\n  decide\n\nset_option pp.fullNames true\n\n#check matrix_product_zero\n#print axioms matrix_product_zero\n#check differential_squared_zero\n#print axioms differential_squared_zero\n#check integer_fixture\n#print axioms integer_fixture\n\nend MathScope.M0.Finite\n",
          "sha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713"
        }
      ],
      "assumptions": [],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.FINITE.INTEGER_FIXTURE",
            "kind": "theorem",
            "statement": "MathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2"
          }
        ],
        "edges": []
      },
      "context": {
        "modelId": "p1-cech-de-rham-D1-integer-fixture",
        "input": [
          "-7",
          "9007199254740993",
          "11",
          "-13"
        ],
        "numericType": "Int"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Finite.integer_fixture",
      "targetType": "MathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2",
      "axioms": {
        "all": [],
        "standard": [],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.256243,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Defs",
          "sourceFile": "MathScope/M0/Defs.lean",
          "sourceSha256": "b00496552d9de1c5271fc319670902785af5a0785aa1fe31451985aa1f2bbe37",
          "exitCode": 0,
          "logFile": "lean-defs-audit.txt",
          "logSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "outputOleanSha256": "678574633fa396804fc3f98751d460a7051810f28098c610db4a8b219026a371"
        },
        {
          "module": "MathScope.M0.Finite",
          "sourceFile": "MathScope/M0/Finite.lean",
          "sourceSha256": "07b6309d8b638c13924c63ce3c0d4a4b2023211e56ec68c95210ffdcf88b5713",
          "exitCode": 0,
          "logFile": "lean-finite-audit.txt",
          "logSha256": "72fca58e1260d3418a194d3322ba18cdc9df903a4b1eba45453ff2c8c4890935",
          "outputOleanSha256": "5c23ec5f12afebae9ec10754d27bce512d0b63f70f4dcf64984c059717b6c8c2"
        }
      ],
      "targetModuleLog": "MathScope.M0.Finite.matrix_product_zero : MathScope.M0.matrixProduct = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]\n'MathScope.M0.Finite.matrix_product_zero' depends on axioms: [propext]\nMathScope.M0.Finite.differential_squared_zero (v : MathScope.M0.C0) :\n  MathScope.M0.d1 (MathScope.M0.d0 v) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.differential_squared_zero' depends on axioms: [propext]\nMathScope.M0.Finite.integer_fixture :\n  MathScope.M0.d1 (MathScope.M0.d0 { a := -7, b := 9007199254740993, c := 11, d := -13 }) = MathScope.M0.zeroC2\n'MathScope.M0.Finite.integer_fixture' does not depend on any axioms\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-analytic-gap",
    "label": "Real spectral implication · explicit gap hypothesis",
    "scope": "For any subset of real energies and a supplied GapAt hypothesis in one fixed energy unit, no positive energy below the bound belongs to that set. No self-adjoint operator, semigroup, QFT or continuum construction is provided.",
    "explanation": {
      "student": "If a positive gap has already been established or supplied as a hypothesis, this theorem rules out energies between zero and that gap. The theorem does not establish the gap itself.",
      "expert": "The real-valued universal implication retains hGap in its full Lean type. Only propext, Classical.choice and Quot.sound are used; there is no custom axiom. No limiting or differentiability operation is formalized."
    },
    "jobSpec": {
      "claimId": "M0.ANALYTIC.GAP_EXCLUSION",
      "target": "MathScope.M0.Analytic.gap_excludes_interval",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        }
      ],
      "assumptions": [
        {
          "id": "M0.HYP.GAP_AT",
          "kind": "HYPOTHESIS",
          "statement": "hGap : GapAt spectrum delta; equivalently 0 < delta and every positive energy in spectrum is at least delta.",
          "source": "MathScope/M0/Analytic.lean",
          "status": "EXPLICIT_PARAMETER"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.ANALYTIC.GAP_EXCLUSION",
            "kind": "theorem",
            "statement": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum"
          },
          {
            "id": "M0.HYP.GAP_AT",
            "kind": "hypothesis",
            "statement": "hGap : GapAt spectrum delta; equivalently 0 < delta and every positive energy in spectrum is at least delta."
          }
        ],
        "edges": [
          {
            "from": "M0.ANALYTIC.GAP_EXCLUSION",
            "to": "M0.HYP.GAP_AT",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "real-spectral-set-interface",
        "energyDomain": "mathlib Real",
        "variables": [
          "spectrum : Set Real",
          "delta : Real"
        ],
        "energyUnit": "fixed shared energy unit"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Analytic.gap_excludes_interval",
      "targetType": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.950517,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        }
      ],
      "targetModuleLog": "MathScope.M0.Analytic.gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (energy : ℝ) : 0 < energy → energy < delta → energy ∉ spectrum\n'MathScope.M0.Analytic.gap_excludes_interval' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.M0.Analytic.smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n  (hGap : MathScope.M0.Analytic.GapAt spectrum delta) (hPositive : 0 < epsilon) (hSmaller : epsilon ≤ delta) :\n  MathScope.M0.Analytic.GapAt spectrum epsilon\n'MathScope.M0.Analytic.smaller_positive_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\nMathScope.M0.Analytic.gap_transfer (original observed : Set ℝ) (delta : ℝ)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) (hInclusion : original ⊆ observed) :\n  MathScope.M0.Analytic.GapAt original delta\n'MathScope.M0.Analytic.gap_transfer' depends on axioms: [propext, Classical.choice, Quot.sound]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-conditional-user-gap",
    "label": "User-assumed Δ = 1 · conditional corollary",
    "scope": "Consequence of two named custom axioms about one uninterpreted real spectrum and a gap at 1. It does not identify this spectrum with any Yang–Mills Hamiltonian.",
    "explanation": {
      "student": "The gap at 1 is deliberately assumed. Lean verifies its consequence and keeps the names of both assumptions visible. Changing that assumption requires a different audit.",
      "expert": "#print axioms includes MathScope.M0.Conditional.selectedSpectrum and MathScope.M0.Conditional.userAssumedGapAtOne in addition to the three standard dependencies. The selected set is an interface, not a quantum construction."
    },
    "jobSpec": {
      "claimId": "M0.CONDITIONAL.SELECTED_GAP",
      "target": "MathScope.M0.Conditional.selected_gap_excludes_interval",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        },
        {
          "path": "MathScope/M0/Conditional.lean",
          "content": "import MathScope.M0.Analytic\n\n/-!\nExplicit USER_AXIOM demonstration, deliberately isolated from Finite and\nAnalytic import paths.  The selected spectrum is an uninterpreted object.\nIt is not defined to be the spectrum of a quantum Yang--Mills Hamiltonian.\nThe selected bound is 1 in a fixed, declared energy unit; the source changes\nwhen that assumption changes.\n-/\n\nnamespace MathScope.M0.Conditional\n\nopen MathScope.M0.Analytic\n\naxiom selectedSpectrum : Set ℝ\n\naxiom userAssumedGapAtOne : GapAt selectedSpectrum 1\n\n/-- Conditional consequence, with both custom dependencies printed below. -/\ntheorem selected_gap_excludes_interval :\n    ∀ energy, 0 < energy → energy < (1 : ℝ) → energy ∉ selectedSpectrum :=\n  gap_excludes_interval selectedSpectrum 1 userAssumedGapAtOne\n\nset_option pp.fullNames true\n\n#check selectedSpectrum\n#check userAssumedGapAtOne\n#check selected_gap_excludes_interval\n#print axioms selected_gap_excludes_interval\n\nend MathScope.M0.Conditional\n",
          "sha256": "79c3fd19000b46cecb1181dfb89a16d81b49735446fa7cafaf82a0434d51c917"
        }
      ],
      "assumptions": [
        {
          "id": "M0.AXIOM.SELECTED_SPECTRUM",
          "kind": "USER_AXIOM",
          "declaration": "MathScope.M0.Conditional.selectedSpectrum",
          "statement": "selectedSpectrum : Set Real (uninterpreted spectrum object)",
          "source": "MathScope/M0/Conditional.lean",
          "status": "ASSUMED"
        },
        {
          "id": "M0.AXIOM.GAP_ONE",
          "kind": "USER_AXIOM",
          "declaration": "MathScope.M0.Conditional.userAssumedGapAtOne",
          "statement": "userAssumedGapAtOne : GapAt selectedSpectrum 1",
          "source": "MathScope/M0/Conditional.lean",
          "status": "ASSUMED"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.CONDITIONAL.SELECTED_GAP",
            "kind": "theorem",
            "statement": "MathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum"
          },
          {
            "id": "M0.AXIOM.SELECTED_SPECTRUM",
            "kind": "user_axiom",
            "statement": "selectedSpectrum : Set Real (uninterpreted spectrum object)"
          },
          {
            "id": "M0.AXIOM.GAP_ONE",
            "kind": "user_axiom",
            "statement": "userAssumedGapAtOne : GapAt selectedSpectrum 1"
          }
        ],
        "edges": [
          {
            "from": "M0.CONDITIONAL.SELECTED_GAP",
            "to": "M0.AXIOM.SELECTED_SPECTRUM",
            "type": "DEPENDS_ON"
          },
          {
            "from": "M0.CONDITIONAL.SELECTED_GAP",
            "to": "M0.AXIOM.GAP_ONE",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "user-axiom-gap-interface",
        "delta": "1",
        "deltaRole": "DECLARED_GAP_BOUND",
        "energyUnit": "fixed shared energy unit",
        "fieldIsRecomputed": false
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Conditional.selected_gap_excludes_interval",
      "targetType": "MathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound",
          "MathScope.M0.Conditional.selectedSpectrum",
          "MathScope.M0.Conditional.userAssumedGapAtOne"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": [
          "MathScope.M0.Conditional.selectedSpectrum",
          "MathScope.M0.Conditional.userAssumedGapAtOne"
        ]
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.979182,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        },
        {
          "module": "MathScope.M0.Conditional",
          "sourceFile": "MathScope/M0/Conditional.lean",
          "sourceSha256": "79c3fd19000b46cecb1181dfb89a16d81b49735446fa7cafaf82a0434d51c917",
          "exitCode": 0,
          "logFile": "lean-conditional-audit.txt",
          "logSha256": "57725831910b2082c3afa838394e95c39285f72d0b69118fbc04a0643de2f55c",
          "outputOleanSha256": "8173b47041ac3b410883f72fe1659d170ad1256782d57fe1a3f6e2643b69d24a"
        }
      ],
      "targetModuleLog": "MathScope.M0.Conditional.selectedSpectrum : Set ℝ\nMathScope.M0.Conditional.userAssumedGapAtOne : MathScope.M0.Analytic.GapAt MathScope.M0.Conditional.selectedSpectrum 1\nMathScope.M0.Conditional.selected_gap_excludes_interval (energy : ℝ) :\n  0 < energy → energy < 1 → energy ∉ MathScope.M0.Conditional.selectedSpectrum\n'MathScope.M0.Conditional.selected_gap_excludes_interval' depends on axioms: [propext,\n Classical.choice,\n Quot.sound,\n MathScope.M0.Conditional.selectedSpectrum,\n MathScope.M0.Conditional.userAssumedGapAtOne]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  },
  {
    "schemaVersion": "mathscope.shipped-proof/1",
    "id": "m0-comparison-gap",
    "label": "Comparison adapter · explicit spectrum inclusion",
    "scope": "A gap on an observed superset transfers to an original subset when the explicit SpectrumComparison.inclusion field is supplied in the same energy unit.",
    "explanation": {
      "student": "A gap seen in a larger certified set applies to its subsets. An arbitrary observation channel usually gives a subset, so this direction must be checked before transferring a conclusion.",
      "expert": "The adapter theorem requires original ⊆ observed; no projection or channel certificate is inferred from a picture. Prismatic, RH/BSD and paper-level NS imports remain separate reference or development tasks."
    },
    "jobSpec": {
      "claimId": "M0.COMPARISON.GAP_TRANSFER",
      "target": "MathScope.M0.Comparison.transport_gap",
      "requestedGrade": "CONDITIONAL_FORMAL",
      "sourceFiles": [
        {
          "path": "MathScope/M0/Analytic.lean",
          "content": "import Mathlib.Basic.Real.Basic\n\n/-!\nConditional real spectral statements.\n\n`GapAt` is a predicate on a set of real numbers in one fixed energy unit.\nIts arguments and hypotheses are explicit; this is not a construction of a\nHilbert space, a self-adjoint Hamiltonian, a quantum field theory, or a\ncontinuum limit.  No interchange of limits, sums or derivatives is used.\n-/\n\nnamespace MathScope.M0.Analytic\n\n/-- A positive lower bound on every positive member of a real spectrum. -/\ndef GapAt (spectrum : Set ℝ) (delta : ℝ) : Prop :=\n  0 < delta ∧ ∀ energy ∈ spectrum, 0 < energy → delta ≤ energy\n\n/-- A supplied gap excludes all positive energies strictly below it. -/\ntheorem gap_excludes_interval (spectrum : Set ℝ) (delta : ℝ)\n    (hGap : GapAt spectrum delta) :\n    ∀ energy, 0 < energy → energy < delta → energy ∉ spectrum := by\n  intro energy hPositive hBelow hMember\n  exact (not_lt_of_ge (hGap.2 energy hMember hPositive)) hBelow\n\n/-- The same spectrum retains every smaller positive certified lower bound. -/\ntheorem smaller_positive_gap (spectrum : Set ℝ) (delta epsilon : ℝ)\n    (hGap : GapAt spectrum delta) (hPositive : 0 < epsilon)\n    (hSmaller : epsilon ≤ delta) : GapAt spectrum epsilon := by\n  refine ⟨hPositive, ?_⟩\n  intro energy hMember hEnergy\n  exact le_trans hSmaller (hGap.2 energy hMember hEnergy)\n\n/-- An observed superset is sufficient; an arbitrary channel subset is not. -/\ntheorem gap_transfer (original observed : Set ℝ) (delta : ℝ)\n    (hObserved : GapAt observed delta) (hInclusion : original ⊆ observed) :\n    GapAt original delta := by\n  refine ⟨hObserved.1, ?_⟩\n  intro energy hOriginal hPositive\n  exact hObserved.2 energy (hInclusion hOriginal) hPositive\n\nset_option pp.fullNames true\n\n#check gap_excludes_interval\n#print axioms gap_excludes_interval\n#check smaller_positive_gap\n#print axioms smaller_positive_gap\n#check gap_transfer\n#print axioms gap_transfer\n\nend MathScope.M0.Analytic\n",
          "sha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313"
        },
        {
          "path": "MathScope/M0/Comparison.lean",
          "content": "import MathScope.M0.Analytic\n\n/-!\nAn explicit local adapter theorem with its necessary inclusion hypothesis.\nPrismatic comparison, global trace formulas, BSD and the attached PDE paper\nremain THEOREM REFERENCE until exact exported Lean statements are imported\nand their adapter obligations are proved.  A URL is not such an adapter.\n-/\n\nnamespace MathScope.M0.Comparison\n\nopen MathScope.M0.Analytic\n\nstructure SpectrumComparison (original observed : Set ℝ) where\n  inclusion : original ⊆ observed\n\ntheorem transport_gap (original observed : Set ℝ) (delta : ℝ)\n    (comparison : SpectrumComparison original observed)\n    (hObserved : GapAt observed delta) : GapAt original delta :=\n  gap_transfer original observed delta hObserved comparison.inclusion\n\nset_option pp.fullNames true\n\n#check transport_gap\n#print axioms transport_gap\n\nend MathScope.M0.Comparison\n",
          "sha256": "c5629d6c17cde5f67e50c577a2a7b71dd0b7223db657fdb27527312c2d02a2af"
        }
      ],
      "assumptions": [
        {
          "id": "M0.HYP.SPECTRUM_INCLUSION",
          "kind": "HYPOTHESIS",
          "statement": "comparison : SpectrumComparison original observed, containing original subset observed.",
          "source": "MathScope/M0/Comparison.lean",
          "status": "EXPLICIT_PARAMETER"
        },
        {
          "id": "M0.HYP.OBSERVED_GAP",
          "kind": "HYPOTHESIS",
          "statement": "hObserved : GapAt observed delta",
          "source": "MathScope/M0/Comparison.lean",
          "status": "EXPLICIT_PARAMETER"
        }
      ],
      "dependencyGraph": {
        "nodes": [
          {
            "id": "M0.COMPARISON.GAP_TRANSFER",
            "kind": "theorem",
            "statement": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta"
          },
          {
            "id": "M0.HYP.SPECTRUM_INCLUSION",
            "kind": "hypothesis",
            "statement": "comparison : SpectrumComparison original observed, containing original subset observed."
          },
          {
            "id": "M0.HYP.OBSERVED_GAP",
            "kind": "hypothesis",
            "statement": "hObserved : GapAt observed delta"
          }
        ],
        "edges": [
          {
            "from": "M0.COMPARISON.GAP_TRANSFER",
            "to": "M0.HYP.SPECTRUM_INCLUSION",
            "type": "DEPENDS_ON"
          },
          {
            "from": "M0.COMPARISON.GAP_TRANSFER",
            "to": "M0.HYP.OBSERVED_GAP",
            "type": "DEPENDS_ON"
          }
        ]
      },
      "context": {
        "modelId": "spectral-inclusion-adapter",
        "inclusionDirection": "original subset observed",
        "energyUnit": "fixed shared energy unit"
      },
      "environment": {
        "leanVersion": "Lean (version 4.34.1, x86_64-unknown-linux-gnu, commit 5045d0056413266e57c625dcd7c365b10e377c52, Release)",
        "leanCommit": "5045d0056413266e57c625dcd7c365b10e377c52",
        "mathlibCommit": "d13f23b723b8a846827a245b89c10fc7d3f11612",
        "mathlibLakeManifestSha256": "8f67b2cf24143ac091cdb425e886c2164b2fc2d6fbccd6db9454b697f9541a67",
        "runtimeLibrarySha256": "6b30cc963d065fc9d2f87f7e9cbe0682b23000ae5425bccd769c5d477fa74f13",
        "driverSha256": "0e3f7d16718c0d2b6bf5bf80f26c66358b0468b35607d6ef0d921857b50440aa",
        "driverSourceSha256": "dbcada6e01a624daf70f53689fc95fa71b1a53c3e0279d2c2157c11c1e62e78e",
        "importClosureDigest": "77ae522db918211a75ca552740d37573830858450c2bd20061e9c01d3715f577",
        "importManifestSha256": "b596afdb954f29f3b327eca57e8fafe0ba141fe5fc1abb8c988a35d3d937a4b4",
        "importModuleCount": 2258,
        "unresolvedImportCount": 0,
        "kernelModified": false,
        "runtimeModified": false,
        "verifierGuardModified": false,
        "frontend": "official shared-library frontend with explicit installation root"
      }
    },
    "audit": {
      "schemaVersion": "mathscope.lean-audit/1",
      "checkedAt": "2026-10-09T12:05:54.113613+00:00",
      "target": "MathScope.M0.Comparison.transport_gap",
      "targetType": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta",
      "axioms": {
        "all": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "standard": [
          "propext",
          "Classical.choice",
          "Quot.sound"
        ],
        "custom": []
      },
      "compileExitCode": 0,
      "sorry": false,
      "warnings": [],
      "elapsedSeconds": 0.930312,
      "environmentDigest": "75b1093cfdc55f91f4d23ea844acb2678fb600d11afb89133417c14e8a6e7721",
      "moduleBuilds": [
        {
          "module": "MathScope.M0.Analytic",
          "sourceFile": "MathScope/M0/Analytic.lean",
          "sourceSha256": "5b1e099473e7a4b23eee0ab7b9132e07a8c093e0249e2ccb7a74189811ae7313",
          "exitCode": 0,
          "logFile": "lean-analytic-audit.txt",
          "logSha256": "be64cfe388ea601349c533fc59596334cb470379ff467860a1d98c0017958292",
          "outputOleanSha256": "c3088e9d3cc88b97b031a6fde2635ed08d9c657a4b2a532ffa5224f98c5013ce"
        },
        {
          "module": "MathScope.M0.Comparison",
          "sourceFile": "MathScope/M0/Comparison.lean",
          "sourceSha256": "c5629d6c17cde5f67e50c577a2a7b71dd0b7223db657fdb27527312c2d02a2af",
          "exitCode": 0,
          "logFile": "lean-comparison-audit.txt",
          "logSha256": "34b3b75a629b4c83d2d4edd466741c14bc62377eaf58c94c87f5757ccaf9d124",
          "outputOleanSha256": "7ed6c46839f259880b3887b295fdff8146b3524f5ffe9af235952e75b025b728"
        }
      ],
      "targetModuleLog": "MathScope.M0.Comparison.transport_gap (original observed : Set ℝ) (delta : ℝ)\n  (comparison : MathScope.M0.Comparison.SpectrumComparison original observed)\n  (hObserved : MathScope.M0.Analytic.GapAt observed delta) : MathScope.M0.Analytic.GapAt original delta\n'MathScope.M0.Comparison.transport_gap' depends on axioms: [propext, Classical.choice, Quot.sound]\n",
      "negativeControls": [
        {
          "name": "NegativeFalse",
          "sourceFile": "NegativeFalse.lean",
          "sourceSha256": "bb8c5d5918222e9b4d279b6e41df5059171fb75ecca29b8c1f367d396ba5f261",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativefalse-audit.txt",
          "logSha256": "7cdcd37943712cee8cdf758bb022f59b662172bf2e9819758aec45781dce1592"
        },
        {
          "name": "NegativeMatrix",
          "sourceFile": "NegativeMatrix.lean",
          "sourceSha256": "1ce60aeb2856a9bbd80e2deaf6b0a2e84f61a5b0adf8a7b661fb6dcdb90b4c9b",
          "exitCode": 1,
          "rejected": true,
          "logFile": "lean-negativematrix-audit.txt",
          "logSha256": "2d1e52c5f095cad04e2fb1c8a8596ce23479c189d08ba56b100bf070dfbb28b8"
        }
      ],
      "fullEnvironmentEvidence": "evidence/lean-environment.json",
      "fullValidationEvidence": "evidence/lean-validation.json",
      "compilerTrust": "Official Lean shared library and normal kernel; installation path explicitly supplied; unchanged kernel/runtime/guards."
    }
  }
];
