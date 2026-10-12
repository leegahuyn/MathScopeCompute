"""Derive a readable finite-scope summary from checked, already executed records."""
from datetime import datetime, timezone
from decimal import Decimal, localcontext
from fractions import Fraction
import hashlib
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import cli


def reference(path):
    data = path.read_bytes()
    return {"path": path.relative_to(ROOT).as_posix(), "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def dyadic(value):
    mantissa, exponent = int(value["mantissa"]), int(value["exponent"])
    return Fraction(mantissa * 2**exponent) if exponent >= 0 else Fraction(mantissa, 2**(-exponent))


def decimal_display(value):
    with localcontext() as context:
        context.prec = 42
        return str(Decimal(value.numerator) / Decimal(value.denominator))


def component_display(component):
    lower, upper = dyadic(component["lower"]), dyadic(component["upper"])
    if upper - lower != dyadic(component["width"]):
        raise ValueError("serialized component width does not match its endpoints")
    return {"midpointDisplay": decimal_display((lower + upper) / 2),
            "fullWidthDisplay": decimal_display(upper - lower),
            "exactLowerDyadic": component["lower"], "exactUpperDyadic": component["upper"],
            "exactFullWidthDyadic": component["width"]}


def main():
    base = ROOT / "evidence/p7-release-20261011/attempt3"
    receipt_path = base / "release-examples.json"
    receipt = cli.read_json_file(receipt_path)
    if not receipt["success"] or not receipt["sourceBytesUnchanged"]:
        raise ValueError("a successful frozen source release run is required")
    examples, verified, saved_runs = [], [], {}
    for row in receipt["runs"]:
        if not row["success"] or row["observedExitCode"] != 0 or row["timedOut"]:
            raise ValueError("release run did not succeed")
        for key in ("input", "log", "output"):
            actual = reference(ROOT / row[key]["path"])
            if actual != row[key]:
                raise ValueError(f"post-execution file integrity failure: {actual['path']}")
            verified.append(actual)
        saved = cli.read_json_file(ROOT / row["output"]["path"])
        if row["action"] == "replay":
            cli.validate_record(saved["fresh"])
            previous = saved_runs[row["name"]]
            if (saved["status"] != "MATCH" or saved["importedProofStatusAdopted"] is not False
                    or saved["previousRecordSHA256"] != previous["recordSHA256"]
                    or saved["fresh"]["mathematicalSHA256"] != previous["mathematicalSHA256"]):
                raise ValueError("fresh replay did not bind to this selected original record")
            continue
        cli.validate_record(saved)
        saved_runs[row["name"]] = saved
        request, value = saved["request"], saved["result"]
        item = {"name": row["name"], "kind": request["kind"], "request": request["input"],
                "executionStatus": saved["execution"]["status"], "artifact": row["output"],
                "mathematicalSHA256": saved["mathematicalSHA256"]}
        if request["kind"] == "p7.special_function":
            item.update(resultStatus=value["status"], toleranceMet=value["toleranceMet"], derivatives=[])
            for derivative in value["derivatives"]:
                ball = derivative["ball"]
                item["derivatives"].append({"order": derivative["order"],
                    "real": component_display(ball["real"]), "imag": component_display(ball["imag"]),
                    "toleranceMet": ball["toleranceMet"]})
        elif request["kind"] == "p7.zeta_zeros":
            item.update(resultStatus=value["status"], positiveZeroCount=value["positiveZeroCount"],
                        windingInteger=value["contour"]["windingInteger"],
                        wholeContourCells=value["statistics"]["acceptedContourCells"],
                        evaluationRequests=value["statistics"]["evaluationRequests"], roots=[])
            for root in value["hardyRoots"]:
                lower, upper = Fraction(root["lower"]), Fraction(root["upper"])
                item["roots"].append({"lower": root["lower"], "upper": root["upper"],
                    "midpointDisplay": decimal_display((lower + upper) / 2),
                    "exactBracketWidth": str(upper - lower), "bracketWidthDisplay": decimal_display(upper - lower),
                    "oppositeHardySigns": root["oppositeSigns"], "uniqueAndSimpleByTotalCount": root["uniqueAndSimpleByTotalCount"]})
        else:
            item.update(model=value["model"], discriminant=value["invariants"]["Delta"],
                        conductor=value["global"]["conductor"], rootNumber=value["global"]["globalRootNumber"],
                        badPrimes=value["global"]["badPrimeRows"], torsion=value["rationalTorsion"],
                        rankBounds=value["arithmeticRank"], coefficients=value["dirichletCoefficients"]["coefficients"])
        examples.append(item)
    tests = [
        ("specialFunctions", 16, "evidence/p7-ball-backend-20261011/ball-backend-validation-attempt3.json"),
        ("finiteZeroCertificate", 12, "evidence/p7-zero-certificate-20261011/zero-certificate-validation-attempt2.json"),
        ("exactEllipticLocalArithmetic", 24, "evidence/p7-elliptic-local-20261011/elliptic-local-unittest-attempt2.json"),
        ("CLIReplayAndInputBoundaries", 13, "evidence/p7-cli-20261011/cli-validation-attempt1.json"),
    ]
    record = {"schema": "MathScope.M3.P7.InitialExecutedRelease/1",
              "status": "IMPLEMENTED_AND_EXECUTED_INITIAL_P7_SCOPE",
              "observedAt": datetime.now(timezone.utc).isoformat(), "sourceBinding": cli.source_binding(),
              "M2Predecessor": cli.predecessor(), "selectedExecutionReceipt": reference(receipt_path),
              "selectedExamples": len(examples), "selectedFreshCLIReplays": 3,
              "allSelectedFilesMatchExecutionHashes": True,
              "verifiedFiles": sorted({r["path"]: r for r in verified}.values(), key=lambda r: r["path"]),
              "tests": [{"area": name, "testsPassed": count, "receipt": reference(ROOT / path)} for name, count, path in tests],
              "examples": examples,
              "decimalDisplaysAreCertifiedEndpoints": False,
              "certifiedNumericRepresentation": "exact dyadic or rational endpoints in the linked records",
              "firstReleaseAttemptIntegrityObservation": reference(ROOT / "evidence/p7-release-20261011/attempt1/post-execution-integrity-observation.json"),
              "secondReleaseAttemptIntegrityObservation": reference(ROOT / "evidence/p7-release-20261011/attempt2/post-execution-integrity-observation.json"),
              "scope": {"arbitraryHeightZeroCertificate": False, "allEllipticCurvesTateReduction": False,
                        "ellipticAnalyticLFunctionEvaluated": False, "internalFLINTRoundTruncErrorSplit": False,
                        "finiteDisplacementTaylorRemainder": False, "formalLeanProofIssued": False,
                        "wholeP7Complete": False, "wholeM3Complete": False,
                        "universalRiemannHypothesisProved": False, "universalBSDProved": False,
                        "browserP7RuntimePublished": False},
              "authority": "execution evidence with explicit mathematical dependencies; replay executes again"}
    cli.write_new(ROOT / "P7_EXECUTED_RELEASE.json", record)
    print({"examples": len(examples), "freshReplays": 3, "verifiedFiles": len(record["verifiedFiles"]),
           "sourceBinding": record["sourceBinding"], "output": "P7_EXECUTED_RELEASE.json"})


if __name__ == "__main__":
    main()
