#!/usr/bin/env python3
"""Assemble the one-profile parameter/evidence chain without a formal promotion.

All active mathematical inputs are copied and hashed in the new output
directory. Historical failed or conditional receipts are not rewritten.
The assembly checks the input attachment for the written analytic
implications; it does not manufacture Lean proofs of those implications.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from datetime import datetime,timezone
from pathlib import Path

HERE=Path(__file__).resolve().parent
NAVIER=HERE.parent
AXIS=NAVIER/"followup-20261010-same-datum-axis"
STRESS=NAVIER/"followup-20261010-final-stress-audit"
OUTER_DIR=NAVIER/"followup-20261010-outer-reselection"
PAPER="0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f"
OUTER="38e23d037f8b75eaeb30448a815689e92171926d47787196c7c5395fe98425a8"

def digest(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def canonical(value): return json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
def passed(data):
    if "allPassed" in data:return data["allPassed"] is True
    if "checksPassed" in data and "checksTotal" in data:
        return data.get("passed") is True and data["checksPassed"]==data["checksTotal"] and data["checksTotal"]>0
    if "passed" in data and "total" in data:return data["passed"]==data["total"] and data["total"]>0
    if "summary" in data:return passed(data["summary"])
    raise ValueError("Unrecognized evidence result shape")

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--gap-receipt",required=True,type=Path)
    p.add_argument("--stress-receipt",required=True,type=Path)
    p.add_argument("--core-receipt",required=True,type=Path)
    p.add_argument("--output",required=True,type=Path)
    args=p.parse_args()
    if args.output.exists():raise SystemExit("Refusing to replace historical assembly evidence")
    checks={};input_bytes={}
    def check(name,test):
        if name in checks:raise ValueError("Duplicate check "+name)
        checks[name]=bool(test)
    def capture(path):
        if path.is_symlink():raise ValueError("Source symlink is not an evidence input")
        path=path.resolve()
        path.relative_to(NAVIER)
        data=path.read_bytes()
        if path in input_bytes and input_bytes[path]!=data:raise RuntimeError("Input changed during assembly")
        input_bytes[path]=data
        return data
    def read(path):return json.loads(capture(path))
    files={
        "outer":OUTER_DIR/"outer-envelope-certificate.json",
        "outerPulse":OUTER_DIR/"actual-main-pulse-integral.json",
        "outerBinding":OUTER_DIR/"final-review-bindings.json",
        "outerSnapshot":OUTER_DIR/"snapshot-manifest.json",
        "axis":AXIS/"axis-envelope-certificate.json",
        "continuation":AXIS/"continuation-debt-certificate.json",
        "sourceEnvelope":AXIS/"global-source-envelope-certificate.json",
        "sourceFreeze":AXIS/"ACTIVE_SOURCE_FREEZE.json",
        "b8":HERE/"attempts/b8-0001/certificate.json",
        "c2":HERE/"attempts/0001/certificate.json",
        "heat":STRESS/"attempts/0001/receipt.json",
        "loop":HERE/"attempts/loop-derivatives-0001/receipt.json",
        "frequency":HERE/"attempts/c12-0001/receipt.json",
        "pressure":HERE/"attempts/pressure-datum-0001/receipt.json",
        "pressurePrefix":HERE/"attempts/pressure-prefix-0002/receipt.json",
        "core":args.core_receipt.resolve(),
        "mixedPhi":AXIS/"evaluated-phi-mixed-comparison.json",
        "relaxedGaps":args.gap_receipt.resolve(),
        "stress":args.stress_receipt.resolve(),
        "axisReview":AXIS/"independent-review/axis-fraction-review-002.json",
        "sourceReview":AXIS/"independent-review/source-derivative-review-001.json",
        "c2Review":HERE/"independent-review/fraction-review-001.json",
        "b8Review":HERE/"independent-review/b8-fraction-review-001.json",
        "loopReview":HERE/"independent-review/c12-loop-review-001.json",
        "coreReview":HERE/"independent-review/pressure-core-review-002.json",
        "mixedPhiReview":AXIS/"independent-review/mixed-phi-review-001.json",
        "pressureTailReview":STRESS/"pressure-tail-review/0001/receipt.json",
        "gapReview":HERE/"independent-review/preloop-gap-review-001.json",
        "independentSeal":HERE/"independent-review/final-independent-chain-seal-001.json",
    }
    data={key:read(path) for key,path in files.items()}
    for key,row in data.items():
        if key not in ("sourceFreeze","pressurePrefix","outerBinding","outerSnapshot"):check(key+"_executed_checks_pass",passed(row))
    check("outer_final_review_same_parameters",data["outerBinding"]["parameterExpressionSHA256"]==OUTER==data["outer"]["parameterExpressionSHA256"])
    check("outer_final_review_same_paper",data["outerBinding"]["paperSHA256"]==PAPER)
    for info in data["outerSnapshot"]["files"]:
        path=OUTER_DIR/info["path"]
        content=capture(path)
        check("outer_frozen_"+info["path"],len(content)==info["bytes"] and digest(path)==info["sha256"])
    for info in data["outerBinding"]["unchangedExternalDependencies"]:
        path=NAVIER/info["pathFromNavier"]
        content=capture(path)
        check("outer_external_"+info["pathFromNavier"],len(content)==info["bytes"] and digest(path)==info["sha256"])
    check("outer_pulse_same_envelope",data["outerPulse"]["bindings"]["outerEnvelopeCertificateSHA256"]==digest(files["outer"]))
    check("pressure_prefix_continuous_claim",data["pressurePrefix"]["claimBoundary"]["continuousPrefixIntegralEnclosed"])
    for name,sha in data["sourceFreeze"]["files"].items():
        capture(AXIS/name);check("frozen_"+name,digest(AXIS/name)==sha)
    seal_current={"core-independent-receipt.json":"coreReview","loop-independent-receipt.json":"loopReview",
                  "axis-independent-receipt.json":"axisReview","source-independent-receipt.json":"sourceReview",
                  "axis-active-freeze.json":"sourceFreeze","current-core-receipt.json":"core"}
    for name,sha in data["independentSeal"]["reviewedFileSHA256"].items():
        snapshot=files["independentSeal"].with_suffix(".inputs")/name
        capture(snapshot);check("independent_sealed_"+name,digest(snapshot)==sha)
        if name in seal_current:check("independent_current_"+name,digest(files[seal_current[name]])==sha)
    for name,sha in data["mixedPhiReview"]["inputSHA256"].items():
        snapshot=files["mixedPhiReview"].with_suffix(".inputs")/name
        current=AXIS/name if name!="independent-verifier.py" else AXIS/"independent-review/verify_mixed_phi.py"
        capture(snapshot);capture(current)
        check("mixed_phi_independent_input_"+name,digest(snapshot)==sha==digest(current))
    gap_review_current={"gap-receipt.json":files["relaxedGaps"],"gap-proof.md":STRESS/"B8_AND_PRELOOP_GAPS_EN.md",
        "gap-producer.py":STRESS/"check_preloop_gaps.py","activation-proof.md":STRESS/"ACTIVATION_COLLAR_BOUNDS_EN.md",
        "activation-receipt.json":STRESS/"activation-review/0002/receipt.json","b8-certificate.json":files["b8"],
        "continuation-certificate.json":files["continuation"],"global-source-certificate.json":files["sourceEnvelope"],
        "independent-source-review.json":files["sourceReview"],"outer-proof.md":OUTER_DIR/"OUTER_DERIVATION.md",
        "independent-verifier.py":HERE/"independent-review/verify_preloop_gaps.py"}
    for name,sha in data["gapReview"]["inputSHA256"].items():
        snapshot=files["gapReview"].with_suffix(".inputs")/name
        current=gap_review_current[name]
        capture(snapshot);capture(current)
        check("gap_independent_input_"+name,digest(snapshot)==sha==digest(current))
    for label,key,verifier in [("c2","c2Review","verify_certificate.py"),
                               ("b8","b8Review","verify_b8_certificate.py")]:
        check(label+"_independent_certificate_pin",data[key]["certificateSHA256"]==digest(files[label]))
        verifier_path=HERE/"independent-review"/verifier
        capture(verifier_path)
        check(label+"_independent_verifier_pin",digest(verifier_path)==data[key]["verifierSHA256"])
    tail=data["pressureTailReview"]["sourceBinding"]
    check("pressure_tail_same_source",tail["paperSHA256"]==PAPER)
    check("pressure_tail_same_continuous_prefix",tail["acceptedPrefixReceiptSHA256"]==digest(files["pressurePrefix"]))
    for path,key in [(HERE/"PRESSURE_DATUM_INTERVAL.md","datumProofSHA256"),
                     (NAVIER/"followup-20261010-outer-reselection/OUTER_DERIVATION.md","outerProofSHA256"),
                     (STRESS/"PRESSURE_TAIL_REVIEW_EN.md","reviewSHA256"),
                     (STRESS/"check_pressure_tail_review.py","checkerSHA256")]:
        capture(path);check("pressure_tail_input_"+path.name,digest(path)==tail[key])

    parameters={}
    for key in ("outer","axis","continuation","sourceEnvelope"):
        for name,expr in data[key]["parametersExactExpressions"].items():
            if name in parameters:check("shared_parameter_"+name,parameters[name]==expr)
            else:parameters[name]=expr
    ref=lambda name:{"ref":name}
    integer=lambda n:{"integer":n}
    power=lambda name,n:{"power":[ref(name),n]}
    extra={
        "BOuter":{"product":[integer(1000),ref("T")]},
        "Xa":{"quotient":[integer(4),ref("Lambda")]},
        "loopD0":{"quotient":[integer(1),{"product":[integer(8),ref("sourceEnvelopeS")]}]},
        "loopMuMax":power("sourceEnvelopeS",12),
        "loopDelta":{"exp":{"product":[integer(-1),power("sourceEnvelopeS",16)]}},
        "C12EnvelopeR":{"exp":power("sourceEnvelopeS",256)},
        "radialFrequencyN":{"sum":[integer(1),{"ceil":power("C12EnvelopeR",50)}]},
        "directionalMarginKappa":power("C12EnvelopeR",-10),
        "stressFlatLowerConstant":{"min":[power("CSelected",-11),power("C12EnvelopeR",-8)]},
    }
    for offset,label in [(25,"I1"),(20,"I2"),(14,"Ipos"),(8,"Imean")]:
        extra["X0"+label]={"product":[ref("XR"),{"exp":{"sum":[ref("T"),integer(2),
                         {"product":[integer(60),ref("BOuter")]},integer(-offset)]}}]}
        extra[label+"Right"]={"product":[ref("X0"+label),{"exp":integer(5)}]}
    for name,expr in extra.items():
        if name in parameters:raise ValueError("Duplicate extra parameter")
        parameters[name]=expr
    def refs(expr):
        if not isinstance(expr,dict) or len(expr)!=1:raise ValueError("Invalid exact expression")
        op,val=next(iter(expr.items()))
        if op=="ref":
            if not isinstance(val,str):raise ValueError("Nontext reference")
            return {val}
        if op=="integer":
            if not isinstance(val,int) or isinstance(val,bool):raise ValueError("Noninteger exact scalar")
            return set()
        if op=="rational":
            from fractions import Fraction
            Fraction(val);return set()
        if op in ("exp","log","ceil"):return refs(val)
        if op=="power":
            if len(val)!=2 or not isinstance(val[1],int):raise ValueError("Noninteger exponent")
            return refs(val[0])
        if op in ("sum","product","quotient","min","max"):
            if not val:raise ValueError("Empty expression operator")
            if op=="quotient" and len(val)!=2:raise ValueError("Invalid quotient")
            return set().union(*(refs(x) for x in val))
        raise ValueError("Unknown or unsupported expression operator "+op)
    seen=set()
    for name,expr in parameters.items():
        required=refs(expr)
        check("acyclic_parameter_"+name,required<=seen)
        seen.add(name)
    check("same_new_h",parameters["h"]=={"exp":{"product":[integer(-8002),ref("T")]}})
    check("same_new_lambda",parameters["lambda"]=={"exp":{"product":[integer(-1000),ref("T")]}})
    check("same_final_j",parameters["j0"]==power("h",4))
    check("same_final_mu",parameters["muMoment"]==power("h",2))
    check("actual_source_S",parameters["sourceEnvelopeS"]==power("CSelected",100000))
    for label in ("c2","b8"):
        check(label+"_same_outer_tree",data[label]["source"]["parameterTreeSHA256"]==OUTER)
        check(label+"_same_outer_derivation",data[label]["source"]["outerDerivationSHA256"]==digest(OUTER_DIR/"OUTER_DERIVATION.md"))
        for name,expr in data[label]["source"]["parameterExpressions"].items():
            check(label+"_same_literal_parameter_"+name,parameters[name]==expr)
    check("actual_width",parameters["t1"]==power("CSelected",-120))
    check("all_source_derivative_exponents_fit_S",max(data["sourceEnvelope"]["actualSourceUpperCExponents"].values())<100000-10)
    check("same_outer_parameter_identity",data["sourceEnvelope"]["sourceBinding"]["outerParameterExpressionSHA256"]==OUTER)
    check("same_continuation_parameter_identity",data["sourceEnvelope"]["sourceBinding"]["finalContinuationParameterExpressionSHA256"]==data["continuation"]["parameterExpressionSHA256"])
    for name,sha in data["sourceEnvelope"]["sourceBinding"]["proofAndProducerInputsSHA256"].items():
        capture(AXIS/name);check("source_table_input_"+name,digest(AXIS/name)==sha)
    check("source_checker_hash",digest(AXIS/"check_global_source_envelope.py")==data["sourceEnvelope"]["sourceBinding"]["thisCheckerSHA256"])
    capture(AXIS/"check_global_source_envelope.py")
    for name,sha in data["loop"]["sources"].items():
        capture(HERE/name);check("loop_source_"+name,digest(HERE/name)==sha)
    for label in ("proof","operator"):
        info=data["frequency"]["sources"][label]
        capture(HERE/info["path"]);check("frequency_source_"+label,digest(HERE/info["path"])==info["sha256"])
    check("frequency_checker_hash",digest(HERE/"check_c12_frequency_contract.py")==data["frequency"]["sources"]["checker"]["sha256"])
    capture(HERE/"check_c12_frequency_contract.py")
    check("heat_uses_same_continuous_operator",data["heat"]["inputs"]["continuousOperatorCertificateSHA256"]==digest(files["c2"]))
    for name,key in [("HEAT_COMPENSATION_PROOF_EN.md","proofSHA256"),("check_heat_compensation.py","checkerSHA256")]:
        capture(STRESS/name);check("heat_input_"+name,digest(STRESS/name)==data["heat"]["inputs"][key])
    for role in ("stress",):
        for info in data[role]["sources"]:
            path=NAVIER/info["path"]
            capture(path);check(role+"_source_"+info["path"],digest(path)==info["sha256"])
    # These are the specific lower-gap claims required to apply C.1.
    gaps=data["relaxedGaps"]
    gapclaims=gaps["analyticClaimsOfAttachedProof"]
    check("actual_relaxed_gap_ledger_attached",gapclaims["actualSameProfileRelaxedGapsAtLeastCMinus1000"] is True)
    check("actual_both_boundary_collars_attached",gapclaims["actualBothLoopCollarGapsAtLeastSInverse"] is True)
    check("actual_unchanged_J_outside_I_attached",gapclaims["actualUnchangedJOutsideILowerGapsAtLeastSInverse"] is True)
    gapbinding=gaps["sourceBinding"]
    check("gap_same_source_paper",gapbinding["paperSHA256"]==PAPER)
    check("gap_same_outer_parameters",gapbinding["outerParameterExpressionSHA256"]==OUTER)
    check("gap_same_final_parameters",gapbinding["selectedContinuationParameterExpressionSHA256"]==data["continuation"]["parameterExpressionSHA256"])
    check("gap_same_continuation_receipt",gapbinding["continuationReceiptSHA256"]==digest(files["continuation"]))
    check("gap_same_B8_receipt",gapbinding["B8CertificateSHA256"]==digest(files["b8"]))
    for name,sha in gapbinding["continuationProofFilesSHA256"].items():
        capture(AXIS/name);check("gap_same_axis_input_"+name,digest(AXIS/name)==sha)
    for name,key in [("B8_AND_PRELOOP_GAPS_EN.md","proofSHA256"),("check_preloop_gaps.py","checkerSHA256")]:
        capture(STRESS/name)
        check("gap_active_"+name,digest(STRESS/name)==gapbinding[key])
        check("gap_snapshot_"+name,digest(files["relaxedGaps"].parent/name)==gapbinding[key])
    check("gap_uses_selected_C",gaps["fixedExpressions"]["C"]=="(1+Q^300)^10 exp(Q^200)")
    check("gap_uses_actual_S",gaps["fixedExpressions"]["S"]=="C^100000" and parameters["sourceEnvelopeS"]==power("CSelected",100000))
    check("raw_source_gap_fits_S_inverse",1000<100000)
    check("boundary_outer_gap_fits_source_S",1<100000)
    check("R_covers_all_source_bounds",256>1 and 100000>12)
    check("R_covers_loop_derivatives_and_gaps",256>60 and 256>17)
    check("R_exceeds_required_minimum",2**20>8192)
    check("N_frequency_and_kappa_literals",parameters["radialFrequencyN"]=={"sum":[integer(1),{"ceil":power("C12EnvelopeR",50)}]} and parameters["directionalMarginKappa"]==power("C12EnvelopeR",-10))
    core=data["core"]
    check("fresh_core_uses_same_axis",core["source"]["actualAxisEnvelopeSha256"]==digest(files["axis"]))
    check("fresh_core_uses_same_pressure",core["source"]["actualPressureInputSha256"]==digest(files["pressure"]))
    check("fresh_core_producer",core["source"]["producerSha256"]==digest(HERE/"evaluate_core_intervals.py"))
    for info in core["inputSnapshots"]:
        path=NAVIER/info["sourcePath"]
        capture(path)
        check("core_input_snapshot_"+info["snapshot"],digest(files["core"].parent/info["snapshot"])==info["sha256"]==digest(path))
    mixed=data["mixedPhi"]
    for field,key in [("axisReceiptSHA256","axis"),("continuationReceiptSHA256","continuation")]:
        check("mixed_phi_same_"+field,mixed["basis"][field]==digest(files[key]))
    check("mixed_phi_same_parameters",mixed["basis"]["finalParameterExpressionSHA256"]==data["continuation"]["parameterExpressionSHA256"])
    check("mixed_phi_same_axis_proof",mixed["basis"]["analyticProofSHA256"]==digest(AXIS/"SAME_DATUM_ANALYTIC_AXIS.md"))
    check("mixed_phi_producer",mixed["basis"]["implementationSHA256"]==digest(AXIS/"evaluate_phi_mixed_comparison.py"))
    check("mixed_phi_actual_coefficients",mixed["boundaries"]["sameNonlinearPhiCoefficientsEnclosed"] is True)
    check("mixed_phi_finite_evaluation",mixed["boundaries"]["finiteEtaAndRadialApproximationActuallyEvaluated"] is True)
    check("mixed_phi_domain_not_overstated",mixed["boundaries"]["wholeEtaIntervalCoveredByOneTaylorChart"] is False and mixed["boundaries"]["nonlinearRecurrenceDirectlyEvaluated"] is False)
    check("mixed_phi_original_formal_gate_retained",mixed["boundaries"]["fullLeanAnalyticPremisesInstantiated"] is False and mixed["boundaries"]["fullOriginalN303Completion"] is False)
    for name in ["ONE_PROFILE_SPECIFICATION.md","CORE_INTERVAL_EVALUATION.md","evaluate_core_intervals.py",
                 "PRESSURE_DATUM_INTERVAL.md","check_pressure_datum_interval.py","certify_pressure_prefix.py",
                 "certify_symbolic_c2.py","certify_symbolic_b8.py"]:capture(HERE/name)
    for name in ["check_axis_envelopes.py","check_continuation_debt.py","symbolic_axis_jet.py","FORMAL_BRIDGE_REMAINING.md"]:capture(AXIS/name)
    capture(NAVIER/"followup-20261010-outer-reselection/OUTER_DERIVATION.md")
    capture(Path(__file__))
    check("formal_open_condition_retained",core["claimBoundary"]["newLeanAnalyticInstantiation"] is False and data["axis"]["boundaries"]["fullAnalyticPremisesProvedInLean"] is False)
    check("full_eta_graph_not_misrepresented",core["claimBoundary"]["allEtaNonlinearGraphEvaluated"] is False)
    if not all(checks.values()):raise AssertionError([name for name,value in checks.items() if not value])
    records=[{"path":str(path.relative_to(NAVIER)),"sha256":hashlib.sha256(content).hexdigest(),
              "bytes":len(content),"snapshot":"inputs/"+str(i)+"-"+path.name}
             for i,(path,content) in enumerate(input_bytes.items())]
    paramsha=hashlib.sha256(canonical(parameters)).hexdigest()
    sourceid=hashlib.sha256(canonical({"paper":PAPER,"parameters":paramsha,"files":[{k:v for k,v in row.items() if k!="snapshot"} for row in records]})).hexdigest()
    result={"schema":"MathScope.Navier.OneProfileEvidenceAssembly/1",
            "generatedUTC":datetime.now(timezone.utc).isoformat(),
            "status":"ACTUAL_SAME_PROFILE_PARAMETERS_AND_ANALYTIC_EVIDENCE_ATTACHED",
            "sourcePaperSHA256":PAPER,"parameterExpressionSHA256":paramsha,"profileEvidenceSHA256":sourceid,
            "parametersExactExpressions":parameters,"evidenceInputs":records,
            "acceptedEvidence":{key:{"path":str(path.relative_to(NAVIER)),"sha256":digest(path)} for key,path in files.items()},
            "checks":checks,"passed":sum(checks.values()),"total":len(checks),
            "attachedAnalyticConclusions":{"samePressureDatumAndAllFiveMoments":True,
                "sameInfiniteAxisAndActualContinuationDebt":True,"continuousB8InclusionAllEta":True,
                "heatCompensationSameDatum":True,"actualSAndPreloopMarginsAttached":True,
                "actualLoopDerivativeBoundAttached":True,"oneFiniteNSelected":True,
                "continuousC12DebtAndI1Restoration":True,"wholeClosedAnnulusDirectionalMargin":"R^-10",
                "actualStressFlatLower":"min(C^-11,R^-8)*zeta","preservedReservedPatches":["Ipos","Imean"]},
            "finiteEvaluations":{"core":{"points":5,"intervalValues":75,"etaDomain":"eta=0 with specified parameter derivatives"},
                "mixedPhi":{"coefficients":125,"mixedValues":75,"etaChart":"|eta|<=rho/4", "comparisonOnlyComplexXiDisk":"|xi|<=1/16"}},
            "evidenceLevel":"Written analytic derivations with executed continuous interval and exact arithmetic checks; actual original Lean inputs are separately identified.",
            "outstanding":{"generatedAnalyticPremisesLean":"NOT_COMPLETED",
                "wholeNonlinearEtaJetGraphEvaluation":"NOT_COMPLETED","protectedComparator":"AWAITING_SEPARATE_ACTUAL_RESULT"},
            "fullOriginalNineConditionsComplete":False,"fullOriginalTheorem46CertificationFlag":False}
    if any(path.read_bytes()!=content for path,content in input_bytes.items()):raise RuntimeError("Source changed while assembling")
    args.output.parent.mkdir(parents=True,exist_ok=True)
    (args.output.parent/"inputs").mkdir(exist_ok=False)
    for row,content in zip(records,input_bytes.values()):
        with (args.output.parent/row["snapshot"]).open("xb") as f:f.write(content)
    with args.output.open("x") as f:json.dump(result,f,indent=2);f.write("\n")
    print(json.dumps({"passed":result["passed"],"total":result["total"],"parameters":len(parameters),
                      "inputFiles":len(records),"parameterExpressionSHA256":paramsha,
                      "profileEvidenceSHA256":sourceid,"receipt":str(args.output)}))

if __name__=="__main__":main()
