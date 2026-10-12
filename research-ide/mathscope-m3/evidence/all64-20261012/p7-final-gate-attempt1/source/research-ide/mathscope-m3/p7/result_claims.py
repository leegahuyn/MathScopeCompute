"""Fresh, bounded P7 computations with distinct result and research types.

Presented completeness lists are checked against freshly computed exact data.
They are inventories, never authentication tokens. Neither a finite zero
certificate nor a specific elliptic curve's equality proves a universal
conjecture. An interval comparison of leading terms is not an exact identity.

Research text is exported unchanged alongside explicit Lean proposition and
proof binders. The exporter does NOT translate arbitrary mathematical prose
into a formal definition: this semantic boundary is part of every export.
"""
from __future__ import annotations

from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import re

from . import ball_backend as balls
from .elliptic_arithmetic import evaluate_elliptic_arithmetic
from .elliptic_analytic import elliptic_central_certificate
from .elliptic_local import as_curve
from .zero_certificate import certify_zeros

SCHEMA = "MathScope.M3.P7.TypedResultClaim/1"
RESULT_TYPES = ("FINITE_HEIGHT_ZERO_CERTIFICATE", "SPECIFIC_CURVE_RANK_EQUALITY",
                "REFINED_LEADING_TERM_CHECK", "UNIVERSAL_CONJECTURE")
COMPLETENESS_KEYS = ("coefficientIndices", "primeFactors", "positiveZeroIndices")
TYPE_MEANINGS = {
    "FINITE_HEIGHT_ZERO_CERTIFICATE": "Only zeros with 0<Im(s)<=the stated finite T; multiplicities and a zero-free boundary are required.",
    "SPECIFIC_CURVE_RANK_EQUALITY": "The fresh arithmetic rank interval and certified analytic rank of one exact curve agree.",
    "REFINED_LEADING_TERM_CHECK": "A separately typed leading-coefficient comparison with period, regulator, Tamagawa, torsion and independent Sha obligations.",
    "UNIVERSAL_CONJECTURE": "A research statement with universal quantifiers; no finite computation in this runner proves it.",
}


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("ascii")


def _seal(value):
    value["computationSha256"] = sha256(_canonical(value)).hexdigest()
    return value


def _text(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 4096 or "\x00" in value:
        raise ValueError("Research text must be a bounded nonempty string without NUL")
    return value


def export_research_hypotheses(hypotheses):
    """Export the precise binder list, without pretending prose is formalized.

    The generated theorem bundles the assumptions themselves. It has no
    conclusion about RH, BSD or an infinite operator. A mathematical use of
    these parameters still requires formal definitions and the stated bridge.
    """
    if not isinstance(hypotheses, list) or len(hypotheses) > 16:
        raise ValueError("At most 16 explicitly identified research hypotheses can be exported")
    entries = []
    seen = set()
    for index, row in enumerate(hypotheses):
        if not isinstance(row, dict) or set(row) != {"id", "statement", "role"}:
            raise ValueError("Each hypothesis needs exactly id, statement and role")
        identifier = row["id"]
        if (not isinstance(identifier, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_.:-]{0,95}", identifier)
                or identifier in seen or row["role"] not in ("ASSUMPTION", "TARGET") ):
            raise ValueError("Research hypothesis IDs must be distinct and roles must be explicit")
        seen.add(identifier)
        entries.append({**deepcopy(row), "statement": _text(row["statement"]),
                        "propositionParameter": "P"+str(index), "proofBinder": "h"+str(index),
                        "leanType": "P"+str(index), "formalizationStatus": "UNINTERPRETED_PROPOSITION_PARAMETER",
                        "mathematicalStatementProved": False})
    lines = ["import Init", "namespace MathScope.P7.ExportedResearch",
             "-- This theorem bundles user hypotheses; mathematical prose has not been translated.",
             "-- No conclusion about RH, BSD, an operator domain or a spectral bridge follows."]
    for row in entries:
        # One JSON line inside a Lean line comment prevents an input newline,
        # comment terminator, quote or Unicode sequence from becoming code.
        lines.append("-- assumption ledger: "+json.dumps(row, ensure_ascii=True, sort_keys=True))
    if entries:
        props = " ".join(row["propositionParameter"] for row in entries)
        binders = " ".join("("+row["proofBinder"]+" : "+row["leanType"]+")" for row in entries)
        conclusion = " ∧ ".join(row["propositionParameter"] for row in entries)
        proof = entries[-1]["proofBinder"]
        for row in reversed(entries[:-1]):
            proof = "And.intro "+row["proofBinder"]+" ("+proof+")"
        lines.append("theorem exportedHypotheses ("+props+" : Prop) "+binders+" : "+conclusion+" := "+proof)
    else:
        lines.append("theorem exportedHypotheses : True := True.intro")
    lines.extend(["#print exportedHypotheses", "#print axioms exportedHypotheses", "end MathScope.P7.ExportedResearch", ""])
    source = "\n".join(lines)
    return {"schema": "MathScope.M3.P7.ResearchHypothesisExport/1",
            "status": "CONDITIONAL_ON_TARGET" if any(row["role"] == "TARGET" for row in entries) else "RESEARCH_HYPOTHESES_ONLY",
            "assumptionList": entries, "leanSource": source,
            "leanSourceSHA256": sha256(source.encode("utf-8")).hexdigest(),
            "theoremName": "MathScope.P7.ExportedResearch.exportedHypotheses",
            "theoremMeaning": "Conjunction of the explicitly supplied proposition assumptions; no independent mathematical conclusion.",
            "semanticTranslationPerformed": False,
            "proseToFormalDefinitionAndBridgeObligations": [row["id"] for row in entries],
            "axiomDeclarationsAdded": [], "kernelCompilationExecutedForThisExport": False,
            "binderListIsNotAPrintAxiomsReceipt": True, "formalMathProofIssued": False}


def completeness_audit(expected, presented=None):
    if not isinstance(expected, dict) or set(expected) != set(COMPLETENESS_KEYS):
        raise ValueError("The producer must supply all three completeness inventories")
    if presented is not None and (not isinstance(presented, dict) or set(presented) != set(COMPLETENESS_KEYS)):
        raise ValueError("Presented completeness needs coefficientIndices, primeFactors and positiveZeroIndices, including empty lists")
    present = deepcopy(expected if presented is None else presented)
    missing, extra, duplicates = {}, {}, {}
    for key in COMPLETENESS_KEYS:
        for values in (expected[key], present[key]):
            if not isinstance(values, list) or len(values) > 4096 or any(type(x) is not int or not 1 <= x <= 2**128 for x in values):
                raise ValueError("Completeness indices must be bounded exact positive integers")
        want, have = set(expected[key]), set(present[key])
        missing[key], extra[key] = sorted(want-have), sorted(have-want)
        duplicates[key] = sorted(x for x in have if present[key].count(x) != 1)
    defects = any(missing.values()) or any(extra.values()) or any(duplicates.values())
    return {"status": "REJECTED_INCOMPLETE_OR_ALTERED_INVENTORY" if defects else "COMPLETE_FOR_THE_STATED_FINITE_COMPUTATION",
            "pass": not defects, "expected": deepcopy(expected), "presented": present,
            "missing": missing, "unexpected": extra, "duplicates": duplicates,
            "listWasProvidedByCaller": presented is not None,
            "freshComputationSuppliedExpectedInventory": True,
            "infiniteCoefficientsOrZerosEnumerated": False}


def _promotion(value):
    if value is None:
        return {"status": "NO_SCOPE_PROMOTION_REQUESTED", "rejected": False}
    if not isinstance(value, dict) or set(value) != {"sourceDomain", "targetDomain", "sourceClaimId"}:
        raise ValueError("A promotion request needs exact source domain, target domain and source claim ID")
    _text(value["sourceClaimId"])
    if value["sourceDomain"] not in ("FINITE_FIELD", "CLASSICAL_ZETA", "ELLIPTIC_CURVE_Q"):
        raise ValueError("Unknown source mathematical domain")
    if value["targetDomain"] not in ("CLASSICAL_RH", "UNIVERSAL_BSD", "SAME_SUBJECT"):
        raise ValueError("Unknown target mathematical domain")
    if value["sourceDomain"] == "FINITE_FIELD" and value["targetDomain"] == "CLASSICAL_RH":
        return {"status": "REJECTED_FINITE_FIELD_TO_CLASSICAL_RH_AXIOM_COPY", "rejected": True,
                "request": deepcopy(value), "reason": "These theorems have different objects and quantifiers. Renaming or copying a finite-field theorem supplies no classical zeta theorem or admissible axiom bridge."}
    if value["targetDomain"] in ("CLASSICAL_RH", "UNIVERSAL_BSD"):
        return {"status": "REJECTED_FINITE_TO_UNIVERSAL_PROMOTION", "rejected": True,
                "request": deepcopy(value), "reason": "A finite height or a particular elliptic curve does not satisfy the universal quantifier."}
    return {"status": "SAME_SUBJECT_REQUIRES_THE_FRESH_CHECK_BELOW", "rejected": False,
            "request": deepcopy(value)}


def _arb(record):
    low, high = (balls.dyadic_to_fraction(record[key]) for key in ("lower", "upper"))
    return balls.arb(balls.fmpq((low+high).numerator, (low+high).denominator)/2,
                     balls.fmpq((high-low).numerator, (high-low).denominator)/2)


def _curve_computation(data, refined):
    allowed = {"model", "coefficientLimit", "precisionBits", "heightIterations", "knownPoints", "tolerance", "conditionalShaOrder"}
    if not isinstance(data, dict) or "model" not in data or set(data)-allowed:
        raise ValueError("A curve claim needs one exact model and supported arithmetic/analytic controls")
    if not refined and "conditionalShaOrder" in data:
        raise ValueError("A Sha-order hypothesis belongs only to the refined leading-term result type")
    arithmetic_data = {key: value for key, value in data.items() if key not in ("tolerance", "conditionalShaOrder")}
    arithmetic_data.setdefault("coefficientLimit", 128)
    arithmetic_data.setdefault("precisionBits", 192)
    arithmetic = evaluate_elliptic_arithmetic(arithmetic_data)
    minimal = as_curve(arithmetic["model"]["minimalAinvs"])
    analytic = elliptic_central_certificate(minimal, precision_bits=arithmetic_data["precisionBits"],
                                           coefficient_limit=arithmetic_data["coefficientLimit"],
                                           tolerance=data.get("tolerance", "1e-35"))
    if analytic["model"]["hash"] != arithmetic["model"]["minimalHash"]:
        raise ValueError("Arithmetic and analytic evidence must describe the identical minimal model")
    a, b = arithmetic["arithmeticRank"], analytic["analyticRank"]
    equal = type(a["exactRank"]) is int and type(b["exactRank"]) is int and a["lowerBound"] == a["upperBound"] == a["exactRank"] == b["exactRank"]
    expected = {"coefficientIndices": list(range(1, arithmetic_data["coefficientLimit"]+1)),
                "primeFactors": sorted(row["prime"] for row in arithmetic["localRows"]),
                "positiveZeroIndices": []}
    claim = {"status": "SPECIFIC_CURVE_RANK_EQUALITY_CERTIFIED_WITH_DEPENDENCIES" if equal else "RANK_EQUALITY_UNRESOLVED",
             "exactModel": deepcopy(arithmetic["model"]), "arithmeticRankInterval": [a["lowerBound"], a["upperBound"]],
             "analyticRank": b["exactRank"], "rankEqualityEstablishedForThisCurve": equal,
             "arithmeticUpperUsedAnalyticRank": False, "analyticZeroEvidence": deepcopy(b),
             "rankUpperCertificateSHA256": a["rankUpperCertificate"]["certificateSHA256"],
             "universalBSDProved": False}
    hypotheses = []
    if refined:
        missing = []
        if not equal:
            missing.append("CERTIFIED_MATCHING_ARITHMETIC_AND_ANALYTIC_RANK")
        if not arithmetic["rationalTorsion"]["exactOrderProved"]:
            missing.append("EXACT_RATIONAL_TORSION")
        if not arithmetic["saturation"]["proved"]:
            missing.append("FULL_SATURATED_MORDELL_WEIL_BASIS")
        if arithmetic["regulator"]["status"] != "CERTIFIED_FULL_REGULATOR":
            missing.append("FULL_REGULATOR")
        missing.append("INDEPENDENT_PROOF_OF_SHA_FINITENESS_AND_ORDER")
        leading = None
        comparison = None
        assumed = data.get("conditionalShaOrder")
        if assumed is not None:
            if type(assumed) is not int or not 1 <= assumed <= 10**12:
                raise ValueError("conditionalShaOrder must be a bounded positive integer hypothesis")
            hypotheses.append({"id": "P7-SHA-FINITE-ORDER", "role": "ASSUMPTION",
                               "statement": "For the exact curve with minimal model hash "+minimal.model_hash+", Sha(E/Q) is finite and has order "+str(assumed)+". This has not been independently proved by this computation."})
        if equal and not [item for item in missing if item != "INDEPENDENT_PROOF_OF_SHA_FINITENESS_AND_ORDER"]:
            rank = a["exactRank"]
            if rank not in (0, 1):
                missing.append("CERTIFIED_LEADING_DERIVATIVE_OF_REQUIRED_ORDER")
            else:
                with balls.flint_workprec(arithmetic_data["precisionBits"]):
                    value = _arb(analytic["values"]["L" if rank == 0 else "LPrime"])
                    omega = _arb(arithmetic["realPeriod"]["realPeriodOmega"])
                    regulator = _arb(arithmetic["regulator"]["value"])
                    factor = omega*regulator*arithmetic["global"]["tamagawaProduct"]/(arithmetic["rationalTorsion"]["order"]**2)
                    if not factor > 0:
                        raise ValueError("The full period/regulator/Tamagawa/torsion factor must be strictly positive")
                    leading = {"derivativeOrder": rank, "factorial": 1, "coefficient": balls.serialize_arb(value),
                               "arithmeticFactorWithoutSha": balls.serialize_arb(factor),
                               "bsdPredictedShaRatio": balls.serialize_arb(value/factor),
                               "ratioDoesNotComputeSha": True}
                    if assumed is not None:
                        residual = value-assumed*factor
                        comparison = {"assumedShaOrder": assumed, "residual": balls.serialize_arb(residual),
                                      "status": "CONDITIONAL_INTERVAL_COMPATIBLE" if residual.contains(0) else "CONDITIONAL_EQUALITY_EXCLUDED_BY_INTERVAL",
                                      "identityProvedByIntervalOverlap": False}
        claim = {"status": "INCOMPLETE_INDEPENDENT_SHA_INFORMATION", "rankEquality": claim,
                 "formula": "L^(r)(E,1)/r! = Omega_E * Reg_E * product(c_p) * #Sha(E/Q) / #E(Q)_tors^2",
                 "normalization": "Full real Neron period of the global minimal model and the Cremona/Neron-Tate height pairing; h_Cremona=2*h_Silverman.",
                 "leadingTerm": leading, "conditionalComparison": comparison,
                 "missingDependencies": missing,
                 "sha": deepcopy(arithmetic["sha"]), "ManinConstant": deepcopy(arithmetic["bsdLedger"]["ManinConstant"]),
                 "refinedLeadingTermIdentityProved": False, "universalBSDProved": False}
    return claim, {"arithmetic": arithmetic, "analytic": analytic}, expected, hypotheses


def evaluate_result_claim(data):
    allowed = {"resultType", "input", "presentedCompleteness", "researchHypotheses", "promotion"}
    if not isinstance(data, dict) or set(data)-allowed or data.get("resultType") not in RESULT_TYPES or "input" not in data:
        raise ValueError("A typed result needs an explicit supported resultType and input")
    kind = data["resultType"]
    promotion = _promotion(data.get("promotion"))
    hypotheses = deepcopy(data.get("researchHypotheses", []))
    # Validate text and binder construction before an expensive mathematical job.
    export_research_hypotheses(hypotheses)
    expected = {key: [] for key in COMPLETENESS_KEYS}
    evidence, claim = {}, {}
    if promotion["rejected"]:
        claim = {"status": promotion["status"], "rejected": True}
    elif kind == "UNIVERSAL_CONJECTURE":
        if not isinstance(data["input"], dict) or set(data["input"]) != {"conjecture"} or data["input"]["conjecture"] not in ("CLASSICAL_RH", "UNIVERSAL_BSD"):
            raise ValueError("A universal research result needs only its explicit CLASSICAL_RH or UNIVERSAL_BSD conjecture tag")
        claim = {"status": "RESEARCH_OPEN", "conjecture": data["input"]["conjecture"],
                 "quantifiers": "Every nontrivial classical zeta zero" if data["input"]["conjecture"] == "CLASSICAL_RH" else "Every elliptic curve over Q, including both rank equality and the refined leading-term statement",
                 "finiteEvidenceCanDischargeUniversalQuantifier": False,
                 "proofSupplied": False}
    elif kind == "FINITE_HEIGHT_ZERO_CERTIFICATE":
        certificate = certify_zeros(data["input"])
        evidence = {"zeros": certificate}
        passed = (certificate["pass"] is True and certificate["scope"].get("finiteRHToRequestedHeight") is True
                  and certificate["scope"].get("upperBoundaryZeroFreeByWholeContour") is True
                  and certificate.get("countSaturation", {}).get("remainingZerosInRectangle") == 0)
        expected["positiveZeroIndices"] = [row["positiveZeroIndex"] for row in certificate["hardyRoots"] if "positiveZeroIndex" in row]
        claim = {"status": "FINITE_HEIGHT_ZERO_CERTIFIED_WITH_DEPENDENCIES" if passed else "FINITE_HEIGHT_UNRESOLVED",
                 "finiteCertificateValid": passed, "heightInterval": certificate["scope"].get("heightInterval"),
                 "positiveZeroCountIncludingMultiplicity": certificate.get("positiveZeroCount"),
                 "wholeStripCountAndLineBracketsAreDifferentAlgorithms": True,
                 "globalRHProved": False}
    else:
        claim, evidence, expected, extra = _curve_computation(data["input"], kind == "REFINED_LEADING_TERM_CHECK")
        hypotheses.extend(extra)
    completeness = completeness_audit(expected, data.get("presentedCompleteness"))
    exported = export_research_hypotheses(hypotheses)
    status = claim["status"] if completeness["pass"] else "REJECTED_INCOMPLETE_OR_ALTERED_INVENTORY"
    result = {"schema": SCHEMA, "resultType": kind, "request": deepcopy(data), "status": status,
              "typeMeanings": deepcopy(TYPE_MEANINGS), "claim": claim, "evidence": evidence,
              "completeness": completeness, "promotionAudit": promotion, "researchExport": exported,
              "freshMathematicalComputationsExecuted": list(evidence),
              "scope": {"specificCurveRankEqualityEstablished": status == "SPECIFIC_CURVE_RANK_EQUALITY_CERTIFIED_WITH_DEPENDENCIES",
                        "finiteHeightCertificateValid": status == "FINITE_HEIGHT_ZERO_CERTIFIED_WITH_DEPENDENCIES",
                        "refinedLeadingTermIdentityProved": False, "globalRHProved": False,
                        "universalBSDProved": False, "formalLeanProofIssued": False,
                        "serializedReceiptAuthenticatesNewComputation": False},
              "sourceSha256": {path.name: sha256(path.read_bytes()).hexdigest()
                               for path in sorted(Path(__file__).parent.glob("*.py"))}}
    return _seal(result)


def replay_result_claim(record):
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise ValueError("Unsupported typed-result certificate")
    fresh = evaluate_result_claim(record.get("request"))
    if _canonical(fresh) != _canonical(record):
        raise ValueError("Fresh mathematical computations and scope checks differ from the supplied typed result")
    return {"status": "MATCH", "freshComputationMatches": True,
            "resultType": fresh["resultType"], "computationSha256": fresh["computationSha256"]}
