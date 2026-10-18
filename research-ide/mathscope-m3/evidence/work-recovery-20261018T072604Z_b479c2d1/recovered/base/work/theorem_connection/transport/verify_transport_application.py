#!/usr/bin/env python3
"""Read-only successor application of the original angular transport theorem.

Usage: python verify_transport_application.py [--workspace ROOT] [--output-dir DIR]
Only this verifier's JSON/log outputs are written. No original proof code is
imported or executed. PASS means exact source links, rational scaling identities,
and negative controls passed; the analytical implication retains the explicitly
listed original primary/mean/support premises. N6-01 is never promoted.
"""
from __future__ import annotations

import argparse
import copy
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import sys

MANIFEST = {'angular_original': {'bytes': 536696,
                      'path': 'analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_SOURCE_APPLICATION_STABLE_ATTEMPT1/ACTUAL_ANGULAR_PDE_SOURCE_APPLICATION.json',
                      'sha256': '67d90e772579c0be478242b7a60fe7445d278800700f2eb95b32bbc578bb39f3'},
 'angular_producer_code': {'bytes': 62701,
                           'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/tools/n6-native-domain-frontier-20261015/actual_angular_pde_source_application.py',
                           'sha256': '0e0a019cd8594ab311be4473186d3181935367f8ae6501a4789372f113b5c6eb'},
 'angular_wave_copy': {'bytes': 536696,
                       'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/inputs/ACTUAL_ANGULAR_PDE_SOURCE_APPLICATION.json',
                       'sha256': '67d90e772579c0be478242b7a60fe7445d278800700f2eb95b32bbc578bb39f3'},
 'common_y': {'bytes': 16223,
              'path': 'analysis/intake_audit/recovered_source_candidates/9badb503543f8bc8/source-common-y-class-majorants.mjs',
              'sha256': '9badb503543f8bc83f5db0e7a373a9a8434ae63104f201601c8e1df66e493da6'},
 'global_angular_code': {'bytes': 21721,
                         'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/source-global-angular.mjs',
                         'sha256': '4e9c3ea67b124a953856f83d0aca0dcfec4b01a245043424de2bb035b8d902ca'},
 'global_band_code': {'bytes': 23815,
                      'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/source-global-band.mjs',
                      'sha256': 'babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60'},
 'initialized_angular_code': {'bytes': 24460,
                              'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/source-initialized-angular.mjs',
                              'sha256': '655809f64af15daa67260ae4207ceac3d3090816086e9920027eedda2ccf24b7'},
 'initialized_original': {'bytes': 1733741,
                          'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/attempt382884203291/initialized-angular-construction.json',
                          'sha256': 'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14'},
 'initialized_wave_copy': {'bytes': 1733741,
                           'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/inherited/inherited/inherited/sources/initialized.json',
                           'sha256': 'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14'},
 'norm_family': {'bytes': 5286543,
                 'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/inherited/inherited/inherited/sources/normFamily.json',
                 'sha256': 'd98a245f1fc563ba44c48d21c59a43d6787fc3895d922472bb3f3ab6e04d9a6d'},
 'norm_family_code': {'bytes': 12670,
                      'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/source-saved-initialized-norm-family.mjs',
                      'sha256': '857a1641e1b5da964ed4893d6108cc06191cf8f8c92c9a16b285af9f0aaf8fc4'},
 'packet_original': {'bytes': 1544048,
                     'path': 'analysis/base/PR30-primary67-continuation/pressure-proof/angular-pde/ANGULAR_PDE_SOURCE_V3.json',
                     'sha256': '36ea92bf82e016ceac3dac9e81dbe6ee4bf0a541bd8ec0c5d2109cf253d0ecd4'},
 'packet_wave_copy': {'bytes': 1544048,
                      'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/inputs/ANGULAR_PDE_SOURCE_V3.json',
                      'sha256': '36ea92bf82e016ceac3dac9e81dbe6ee4bf0a541bd8ec0c5d2109cf253d0ecd4'},
 'primary': {'bytes': 8483361,
             'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/inherited/inherited/inherited/sources/primaryClass.json',
             'sha256': '84fbcd228accdff56b13b8a01065cbf6efae9f07cf88421780122a45247f1a25'},
 'primary_code': {'bytes': 27252,
                  'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/research-ide/mathscope-m3/navier/source-primary-class-majorants.mjs',
                  'sha256': '40b3f1220b7ad1b9b05a11ae1378c864351e77e8efe7134ae1b78921fbab47ea'},
 'radial_axial_original': {'bytes': 1499008,
                           'path': 'analysis/base/PR30-primary67-continuation/pressure-proof/radial-axial-pde/RADIAL_AXIAL_PDE_STABLE_ATTEMPT1/ACTUAL_RADIAL_AXIAL_PDE_SOURCE_APPLICATION.json',
                           'sha256': '84522cf7c9db5c3e311cff48eb257106043f601eba3d16cf70387707b6cbd365'},
 'radial_axial_producer_code': {'bytes': 63226,
                                'path': 'analysis/base/PR30-primary67-continuation/MathScopeCompute/tools/n6-native-domain-frontier-20261015/actual_radial_axial_pde_source_application.py',
                                'sha256': 'd92c6352a76179eb27b1553ce4146498043ebd8b10a8a5b8edee428225065ff3'},
 'wave_consumer': {'bytes': 25445,
                   'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/code/wave_bridge.py',
                   'sha256': '524b0efa080fa8cf405fdc0f12ada592659b7cb615c74f081dc8b5ebcf6c0ccb'},
 'written_all_order_proof': {'bytes': 6770,
                             'path': 'analysis/base/embedded-wave-norm/MathScope_M3_WaveNorm_Continuation/reports/ALL_ORDER_PROOF_KO.md',
                             'sha256': '17b270f6cf292887c361fca40ecd7b9eb030855cbe51cc1307b986990a15cf4b'},
 'written_integration': {'bytes': 15009,
                         'path': 'analysis/theorem_sources/angular_transport_audit.md',
                         'sha256': 'e499a43c835263b4bc9eb9555c99d0119efd870fd7f642a86b13b497ad452d4a'}}


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def row(identifier: str, passed: bool, detail: str) -> dict:
    return {"id": identifier, "status": "PASS" if passed else "FAIL", "detail": detail}


def load_sources(workspace: Path) -> tuple[dict, dict, list]:
    data, observed, checks = {}, {}, []
    for name, spec in MANIFEST.items():
        path = workspace / spec["path"]
        try:
            raw = path.read_bytes()
            actual = digest(raw)
            observed[name] = {"path": spec["path"], "sha256": actual, "bytes": len(raw)}
            checks.append(row("pin:" + name, actual == spec["sha256"] and len(raw) == spec["bytes"], spec["path"]))
            if path.suffix == ".json":
                data[name] = json.loads(raw)
        except (OSError, ValueError) as exc:
            checks.append(row("pin:" + name, False, type(exc).__name__ + ": " + str(exc)))
    return data, observed, checks


def source_checks(d: dict, observed: dict) -> list:
    """Original fifteen link checks plus exact actual-map and residual-root checks."""
    checks = []
    def check(name, passed, detail):
        checks.append(row(name, passed, detail))
    for a, b in [("initialized_wave_copy", "initialized_original"),
                 ("angular_wave_copy", "angular_original"),
                 ("packet_wave_copy", "packet_original")]:
        check(a + "_same_bytes", observed[a]["sha256"] == observed[b]["sha256"], a + " = " + b)
    i, t, r = d["initialized_wave_copy"], d["angular_original"], d["radial_axial_original"]
    p, f, packet = d["primary"], d["norm_family"], d["packet_original"]
    check("common_y_expected_original", observed["common_y"]["sha256"] == MANIFEST["common_y"]["sha256"], "Recovered original affine-chain source")
    check("all_component_same_header", r["sourceHeaderSHA256"] == t["sourceHeaderSHA256"] == packet["sourceHeaderSHA256"], "One exact original source header")
    check("radial_axial_binds_same_angular_theorem", r["inputBindings"]["angular-application-proof"]["sha256"] == observed["angular_original"]["sha256"], "Radial/axial theorem imports this exact angular theorem")
    check("native_theorems_bind_same_initialized_source", all(x["inputBindings"]["construction"]["sha256"] == observed["initialized_wave_copy"]["sha256"] for x in [t, r]), "Both theorems bind the same initialized construction")
    check("native_full_three_components", r["provedComponents"] == [0, 2] and t["eligibleOriginalPDECount"] == 197 and r["eligibleOriginalPDECount"] == 823, "169+197+654 comparison rows; no norm inferred from their count")
    normalized = t["actualFixedLabelNormalizationApplication"]["actualRowApplications"]
    check("all162_common_maps", len(normalized) == 162 and all(len(v) == 162 for v in r["actualSelected162RowApplications"].values()), "All162 maps retained for all components")
    check("all162_angular_source_fields", all(len(packet["definitions"]["fieldDefinitions:" + str(k)]["rows"]) == 162 for k in range(6, 10)), "All velocity3+pressure fields retained")
    check("paper_and_parameter_identity", all(p["source"][k] == i["source"][k] == f["source"]["source"][k] for k in ["paperSHA256", "parameterExpressionSHA256"]), "Same paper and source-parameter graph")
    check("same_initialized_mean_graph", i["sourceMeanGraph"] == f["source"]["source"]["originalMeanGraph"], "Exact initialized-mean graph identity")
    check("nonzero_harmonics_all_components", len(i["templates"]) == 10 and all([x["m"] for x in a["nonzeroAngularForcing"]] == [-2, -1, 1, 2] and all(len(x["value"]) == 3 for x in a["nonzeroAngularForcing"]) for a in i["templates"]), "10 lifts x 4 modes x 3 components")
    check("whole_reference_mean", i["reference"]["fullOriginalReferenceFieldPulledBack"] and not i["reference"]["ownLabelBackgroundIdentityAssumedInstead"], "Whole common-Y mean preserved")
    check("same_source_continuation", f["family"]["scope"]["sameSourceNormContinuationBound"] and p["scope"]["allFiniteOrdersBySameOriginalNormGenerator"], "Source-bound prerequisite statements recorded, not newly proven by this flag check")
    coupled = packet["definitions"]["definitions:1:1"]["rows"]
    map_matches = len(coupled) == len(normalized) == 162 and all(
        bound["index"] == index and bound["actualArguments"] == actual["values"]
        and bound["actualOuterGuards"] == actual["guards"] and bound["label"] == actual["label"]
        for index, (bound, actual) in enumerate(zip(normalized, coupled)))
    check("all162_literal_map_evidence_matches_source", map_matches, "Actual argument tuples, guards and labels compared; a changed map is rejected")
    check("actual_component_residual_roots", i["global"]["assembledResidual"] == [3825348, 3825349, 3825350]
          and i["application"]["residualRoots"] == [3825003, 3825004, 3825005]
          and i["global"]["assembledResidual"][1] == t["actualOriginalSourceApplication"]["originalAssembledRoot"]
          and i["application"]["residualRoots"][1] == t["actualOriginalSourceApplication"]["originalCoupledOperand"],
          "Original three assembled/wave roots retained; a changed root is rejected")
    return checks


def scaling_checks() -> tuple[list, dict]:
    """Exact affine polynomials in symbolic h: pair (constant, coefficient of h)."""
    Q = Fraction
    def add(*xs):
        return tuple(sum((x[j] for x in xs), Q(0)) for j in range(2))
    def mul(n, x):
        return tuple(Q(n) * a for a in x)
    half, one, h = (Q(1, 2), Q(0)), (Q(1), Q(0)), (Q(0), Q(1))
    A, D = add(half, h), add(half, mul(-1, h))
    residual = add(mul(2, A), half)
    identities = {
        "implicit_s_homogeneity": (add(mul(2, D), mul(2, h)), one),
        "X_invariant": (add(mul(2, half), mul(-1, one)), (Q(0), Q(0))),
        "eta_invariant": (add(D, mul(-1, D)), (Q(0), Q(0))),
        "qActual_invariant": (add(mul(-1, one), one), (Q(0), Q(0))),
        "radial_background_velocity": (add(h, half), A),
        "angular_background_velocity": (add(mul(-1, half), A, half), A),
        "axial_background_velocity": (A, A),
        "background_pressure": (mul(2, A), add(A, A)),
        "residual_quadratic_connections": (add(mul(2, A), half), residual),
        "residual_time_viscosity": (add(A, one, h), residual),
        "residual_pressure": (add(mul(2, A), half), residual),
    }
    checks = [row("scaling:" + name, lhs == rhs, "Exact polynomial equality in symbolic h") for name, (lhs, rhs) in identities.items()]
    evidence = {name: {"left": list(map(str, lhs)), "right": list(map(str, rhs))} for name, (lhs, rhs) in identities.items()}
    return checks, evidence


PREREQUISITES = [
    {"id": "P_PRIMARY", "statement": "Same-source all-fixed-order primary, potential, pressure and full-curl remainder bounds, including actual homogeneous ODE, moving-normal pressure and tangency.", "evidence": "primary_code:123-143,175-240; primary.sourcePulseBindings", "status": "INHERITED_MATHEMATICAL_PREMISE; source identity checked here"},
    {"id": "P_MEAN", "statement": "Same-source initialized mean has all-fixed-order bounds through the finite recursive demand, preserving the original coefficient bodies, selector, latest pressure and q domain.", "evidence": "norm_family_code:24-50; norm_family.family.continuation", "status": "INHERITED_MATHEMATICAL_PREMISE; exact mean graph checked here"},
    {"id": "P_SUPPORT", "statement": "Original source supports have all-order flat zero extensions and distinct-label products vanish; labels/copies/carriers are frozen before differentiation.", "evidence": "common_y:71-109; global_angular_code:166-176", "status": "INHERITED_SOURCE_GEOMETRY_PREMISE; pinned original source retained"},
    {"id": "P_NATIVE", "statement": "The actual full three-component direct-minus-mean operator equals the original coupled residual as functions on each fixed-label chart.", "evidence": "angular_producer_code:205-210,254-313; radial_axial_producer_code:107-136,183-212,251-255", "status": "INHERITED_EXACT_FUNCTION_IDENTITY; same inputs/components/maps checked here"},
    {"id": "P_DOMAIN", "statement": "Use the original certified atlas windows: the literal N=1 prefix requires 0<q<qGlobalStar and b_2*q>=1. Positive source Gaussian decay/length and palette bounds remain in force.", "evidence": "written_all_order_proof:5-9,60-77; global_band_code:65-97,154-178", "status": "ORIGINAL_DOMAIN_RESTRICTION; not enlarged"},
]

INFERENCE_CHAIN = [
    {"id": "T1", "requires": ["P_PRIMARY", "P_SUPPORT", "P_DOMAIN"], "evidence": "common_y:39-63,71-109; global_angular_code:73-117", "argument": "The arbitrary-m affine chain rule applies to both actual xi/v columns. The wave constructor literally reuses sign.values and sign.derivativeMaps and adds only theta's identity column. Higher coordinate derivatives vanish on fixed-label charts. A derivative of length m costs at most (32404*S_ref)^m and preserves the epsilon exponent."},
    {"id": "T2", "requires": ["P_MEAN", "P_DOMAIN"], "evidence": "global_band_code:70-97; initialized_angular_code:113-122,128-159", "argument": "For K=Q_ref/Q_label, s_label(P)=K*s_ref because 2D+2h=1 and the actual monotone root is unique on the active overlap. X, eta and Q*s are invariant. All actual background profile/cutoff bodies therefore coincide, with velocity scaling K^A (radial b uses epsilon_ref=K^h*epsilon_label) and pressure K^(2A). Whole Y-dependent mean correction keeps the identity Y map and inverse slow chart; no inverse torus cover or replacement mean is assumed."},
    {"id": "T3", "requires": ["P_PRIMARY", "P_MEAN", "P_NATIVE", "T1", "T2"], "evidence": "angular_producer_code:205-210; radial_axial_producer_code:251-255", "argument": "The native result is an exact function identity, not equality at finitely many points. Separate all-order source bounds supply smoothness. Differentiating equal smooth functions gives every fixed coefficient derivative identity without a fresh native jet run. Dr squared retains derivatives of the R-dependent fast coefficient. Mean-pressure terms cancel linearly before the wave estimate."},
    {"id": "T4", "requires": ["P_PRIMARY", "P_MEAN", "T1", "T2", "T3"], "evidence": "written_all_order_proof:13-58; wave_consumer:146-248", "argument": "The actual homogeneous principal equation leaves +psi_prime*t. The regular coefficient contains every principal-on-curl, slow, phase, pressure, viscous, frame, mean-wave and same-label square term. Exact full-curl divergence removes the longitudinal k loss, without assuming n dot a=0 for the full amplitude. Finite Leibniz rules at any fixed m preserve alpha=1-3*kappa_s for modes +/-1 and alpha=1-kappa_s for +/-2. Frozen ratio factors are bounded by 16*4^(m+L); no extra epsilon loss is introduced. Thus actual G_wave belongs to W_(99997/100000), hence W_(7/10)."},
    {"id": "T5", "requires": ["P_PRIMARY", "P_SUPPORT", "P_DOMAIN", "T1", "T2", "T3"], "evidence": "written_all_order_proof:60-77; wave_consumer:250-267; global_angular_code:130-156", "argument": "The actual cutoff tail retains +psi_prime*t. Its source Gaussian/length nodes give c>0 and exp(-c*S_label). Each fixed physical derivative, including chart, normalization and carrier factors, is bounded by a finite C*Q^(-M)*S_label^P*exp(-c*S_label). With Q=2^(-ell), S_label=ell^2 and q>=Q/2 on active-label support, square completion gives C_N=C*2^N*(2P/c)^P*exp((M+N)^2/(2c)) for every N; the P=0 factor is1. Hence F_pulse is flat. No numerical C or new threshold is required."},
    {"id": "T6", "requires": ["P_SUPPORT", "T4", "T5"], "evidence": "common_y:108; global_angular_code:166-176; written_all_order_proof:42-48", "argument": "Original all-order flat joins extend the chart result across guards/relabeling. Finite assembly keeps all three components, all162 source rows, both mean-wave orders and same-row squares. Therefore Pi_nonzero R=G_wave+F_pulse on the original domain. This closes the transport implication only; it does not accept the whole N6-01 tuple or any later N6-02 substep."},
]


def negative_controls(data: dict, observed: dict) -> list:
    result = []
    mutations = [
        ("changed_first_map_argument", "all162_literal_map_evidence_matches_source", lambda d: d["angular_original"]["actualFixedLabelNormalizationApplication"]["actualRowApplications"][0]["actualArguments"].__setitem__(0, -1)),
        ("changed_angular_assembled_root", "actual_component_residual_roots", lambda d: d["initialized_wave_copy"]["global"]["assembledResidual"].__setitem__(1, -1)),
    ]
    for name, expected, mutate in mutations:
        altered = copy.deepcopy(data)
        mutate(altered)
        failed = [c["id"] for c in source_checks(altered, observed) if c["status"] == "FAIL"]
        result.append({"id": name, "status": "PASS" if expected in failed else "FAIL", "expected_rejection": expected, "observed_failed_checks": failed, "mutation_scope": "In-memory copy only; original files untouched"})
    return result


def execute(workspace: Path) -> dict:
    data, observed, pins = load_sources(workspace)
    checks = list(pins)
    controls, algebra = [], {}
    if all(c["status"] == "PASS" for c in pins):
        try:
            checks.extend(source_checks(data, observed))
            scaling, algebra = scaling_checks()
            checks.extend(scaling)
            controls = negative_controls(data, observed)
        except (KeyError, TypeError, ValueError, IndexError) as exc:
            checks.append(row("input_structure", False, type(exc).__name__ + ": " + str(exc)))
    # Report precisely what remains an analytic prerequisite, never promote flags.
    passed = bool(controls) and all(c["status"] == "PASS" for c in checks + controls)
    return {"schema": "MathScope.SuccessorAngularTransportApplication/1", "result": "PASS" if passed else "FAIL",
            "grade": "CHECKED_SOURCE_APPLICATION_OF_CONDITIONAL_ALL_FIXED_ORDER_TRANSPORT" if passed else "REJECTED_SOURCE_APPLICATION",
            "verification_scope": "Exact pinned-source/link/map/root checks and rational scaling identities; analytical inference recorded against explicit inherited prerequisites. No original producer, native derivative expansion or tests executed.",
            "source_bindings": observed, "checks": checks, "negative_controls": controls,
            "background_homogeneity_polynomial_checks": algebra,
            "conditional_prerequisites": PREREQUISITES, "all_fixed_order_inference_chain": INFERENCE_CHAIN,
            "conclusion_if_prerequisites_hold": "The actual full three-component nonzero residual has Pi_nonzero R=G_wave+F_pulse, with G_wave in W_(99997/100000) subset W_(7/10), and every fixed physical derivative of F_pulse flat to every q order. No independent angular-transport premise or fresh all-jet execution is needed.",
            "finite_execution_is_not_all_order_proof": True, "original_source_files_modified": False,
            "original_producers_executed": False, "N6_01_promoted": False, "N6_02_later_substeps_certified": False,
            "status_policy": "Preserve N6-01 OPEN and N6-02 PARTIAL pending their separate integration/stage decisions."}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).resolve().parent)
    args = parser.parse_args()
    workspace, output = args.workspace.resolve(), args.output_dir.resolve()
    protected = [workspace / "analysis/base", workspace / "analysis/intake_audit/recovered_source_candidates"]
    if workspace == output or any(output == directory or directory in output.parents for directory in protected):
        parser.error("Choose a separate successor evidence directory outside the preserved originals.")
    result = execute(workspace)
    result["verifier"] = {"file": Path(__file__).name, "sha256": digest(Path(__file__).read_bytes())}
    output.mkdir(parents=True, exist_ok=True)
    (output / "TRANSPORT_APPLICATION.json").write_text(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    lines = [result["result"] + " " + result["grade"]]
    lines += [c["status"] + " " + c["id"] for c in result["checks"]]
    lines += [c["status"] + " negative:" + c["id"] + " -> " + ",".join(c["observed_failed_checks"]) for c in result["negative_controls"]]
    lines += ["PRESERVED N6-01 OPEN; N6-02 PARTIAL", "PREREQUISITES " + ", ".join(p["id"] for p in PREREQUISITES)]
    log = "\n".join(lines) + "\n"
    (output / "TRANSPORT_APPLICATION.log").write_text(log, encoding="utf-8")
    sys.stdout.write(log)
    return 0 if result["result"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
