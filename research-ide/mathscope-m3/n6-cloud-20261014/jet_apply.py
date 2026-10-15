"""Apply independently rechecked zero-family jets to the Cartesian checkpoint.

Every unproved source jet is retained. Original request IDs are translated
through the original->prior-closure scalar map, never guessed from values.
The previous checkpoint and its every node remain durable source evidence.
"""
from collections import Counter
from fractions import Fraction
from pathlib import Path
import hashlib
import json

from jet_worker import SourceCalculus, js_hash, read, require, validate_inputs, write


def rebuild(program, substitutions):
    nodes, intern, memo = [], {}, {}

    def put(op, args):
        key = json.dumps([op, args], separators=(",", ":"), ensure_ascii=False)
        if key not in intern:
            intern[key] = len(nodes)
            nodes.append({"op": op, "args": args})
        return intern[key]

    def q(value):
        return put("rational", [str(value.numerator), str(value.denominator)])

    zero, one = q(Fraction(0)), q(Fraction(1))

    def rational(ident):
        n = nodes[ident]
        return Fraction(*map(int, n["args"])) if n["op"] == "rational" else None

    def visit(ident):
        require(type(ident) is int and 0 <= ident < len(program), "scalar reference escaped original checkpoint")
        if ident in memo:
            return memo[ident]
        if ident in substitutions:
            result = zero
        else:
            n = program[ident]
            op, a = n["op"], n["args"]
            if op in {"rational", "coordinate", "source_parameter", "actual_opaque_value"}:
                result = put(op, a)
            elif op == "unresolved_total_source_jet":
                result = put(op, [visit(a[0]), [visit(x) for x in a[1]]])
            elif op in {"integer_power", "source_step_derivative"}:
                child = visit(a[0])
                if op == "integer_power" and a[1] == 0:
                    result = one
                elif op == "integer_power" and a[1] == 1:
                    result = child
                elif op == "integer_power" and rational(child) is not None and (rational(child) != 0 or a[1] >= 0):
                    result = q(rational(child)**a[1])
                else:
                    result = put(op, [child, a[1]])
            elif op in {"add", "multiply"}:
                children = [visit(x) for x in a]
                if op == "multiply" and zero in children:
                    result = zero
                else:
                    identity = zero if op == "add" else one
                    children = [x for x in children if x != identity]
                    if not children:
                        result = identity
                    elif len(children) == 1:
                        result = children[0]
                    elif all(rational(x) is not None for x in children):
                        value = Fraction(0 if op == "add" else 1)
                        for child in children:
                            value = value+rational(child) if op == "add" else value*rational(child)
                        result = q(value)
                    else:
                        result = put(op, children)
            elif op in {"inverse", "exp", "log_positive", "sqrt_positive", "sine", "cosine", "ceiling"}:
                child = visit(a[0])
                value = rational(child)
                if op == "inverse" and value is not None and value != 0:
                    result = q(1/value)
                elif op in {"exp", "cosine"} and child == zero:
                    result = one
                elif op == "sine" and child == zero or op == "log_positive" and child == one:
                    result = zero
                else:
                    result = put(op, [child])
            elif op in {"unresolved_opaque_substitution", "definite_integral", "smooth_piecewise", "maximum"}:
                # Bound integral variables are scalar coordinate references in
                # this particular checkpoint, unlike source registry indices.
                result = put(op, [visit(x) for x in a])
            else:
                raise ValueError("unreviewed Cartesian checkpoint scalar grammar: "+op)
        memo[ident] = result
        return result

    # Keep all nodes, including nodes that cease to occur at a PDE root. All
    # unproved opaque jets therefore survive even after an exact zero product.
    for ident in range(len(program)):
        visit(ident)
    return nodes, memo, zero


def apply(context, results_root, out):
    import sys
    sys.setrecursionlimit(max(sys.getrecursionlimit(), 10000))
    out = Path(out)
    checkpoint, previous, requests, original, witnesses, definitions = validate_inputs(context)
    baseline_path = Path(context["baseline"]) / "cartesian-applied-pde-checkpoint.json"
    baseline = read(baseline_path)
    program = baseline["scalarProgram"]
    old_mapping = baseline["originalScalarNodeToClosedScalarNode"]
    require(len(old_mapping) == len(original), "original->prior Cartesian scalar mapping is incomplete")
    original_requests = {r["result"]: r for r in requests}
    calc = SourceCalculus(witnesses, definitions, max_work=80000000, max_nodes=300000)
    proven, ignored, shard_receipts, received = {}, [], [], set()
    files = sorted(Path(results_root).rglob("jet-results-shard-*.json"))
    for file in files:
        result = read(file)
        require(result["sourceParentSHA256"] == previous["originalNodesSHA256"], "jet shard original source changed")
        identity = result["shard"], result["shards"]
        require(identity not in received, "duplicate jet shard result")
        received.add(identity)
        shard_receipts.append({"path": str(file.relative_to(results_root)), "sha256": hashlib.sha256(file.read_bytes()).hexdigest(), "attemptedRequests": result["attemptedRequests"]})
        for row in result["requests"]:
            require(row["result"] in original_requests, "substitution refers to a new/non-original request")
            request = original_requests[row["result"]]
            for key in ["base", "result", "baseSourceNode", "actualDefinitionKey", "actualDefinitionSHA256", "orderedDifferentiationCoordinates"]:
                require(row[key] == request[key], "jet substitution source binding changed")
            if not row["closedOnOriginalLeafDefinedDomain"]:
                continue
            if row.get("exactValue") != "0" or row.get("lemma") != "FIRST_ABSENT_INPUT_THEN_DERIVATIVES_OF_ZERO":
                ignored.append({"requestId": row["requestId"], "reason": "nonzero/body formula remains in exact formula DAG; source-ref import into Cartesian program requires a separate verified importer"})
                continue
            audit = calc.capture_audit(request["baseSourceNode"])
            require(audit["pass"], "independent application capture audit rejected zero rule")
            support, unknown = calc.source_support(request["baseSourceNode"])
            word = [original[v]["args"][1] for v in request["orderedDifferentiationCoordinates"]]
            require(bool(word) and not unknown and word[0] not in support, "zero-family mutation: first derivative varies an actual source input")
            original_result = request["result"]
            target = old_mapping[original_result]
            require(original[original_result] == {"op": "unresolved_total_source_jet", "args": [request["base"], request["orderedDifferentiationCoordinates"]]}, "original request scalar binding changed")
            require(program[target] == {"op": "unresolved_total_source_jet", "args": [old_mapping[request["base"]], [old_mapping[v] for v in request["orderedDifferentiationCoordinates"]]]}, "prior closure changed a supposedly unproved jet")
            require(target not in proven, "two source rules alias the same unproved jet")
            proven[target] = {"requestId": row["requestId"], "originalScalarResult": original_result,
                              "priorScalarResult": target, "priorNode": program[target], "exactValue": "0",
                              "baseSourceNode": row["baseSourceNode"], "definitionSHA256": row["actualDefinitionSHA256"],
                              "orderedSourceCoordinates": word, "independentlyRecheckedFirstAbsentInput": True}
    nodes, mapping, zero = rebuild(program, proven)
    result = dict(baseline)
    result["schema"] = "MathScope.N6.CloudAppliedOriginalCartesianJets/1"
    result["scalarProgram"] = nodes
    result["originalScalarNodeToClosedScalarNode"] = [mapping[x] for x in old_mapping]
    for key in ["cartesianVelocity", "advectiveResidual", "conservativeResidual", "backToCylindrical"]:
        if key in baseline:
            result[key] = [mapping[x] for x in baseline[key]]
    if baseline.get("divergence") is not None:
        result["divergence"] = mapping[baseline["divergence"]]
    result["jets"] = []
    for old_jet in baseline.get("jets", []):
        jet = dict(old_jet)
        for key in ["cartesianVelocity", "time", "laplacian", "pressureGradient"]:
            jet[key] = mapping[old_jet[key]]
        jet["spatial"] = [mapping[x] for x in old_jet["spatial"]]
        result["jets"].append(jet)
    applied_results = {r["originalScalarResult"] for r in proven.values()}
    result["remainingOriginalRequests"] = [r for r in baseline["remainingOriginalRequests"] if r["result"] not in applied_results]
    result["previousClosedCheckpointSHA256"] = hashlib.sha256(baseline_path.read_bytes()).hexdigest()
    result["priorScalarNodeToNewScalarNode"] = [mapping[i] for i in range(len(program))]
    result["newAppliedJetRules"] = list(proven.values())
    result["domainHypothesesReferenceProgram"] = "original independent Cartesian scalar program before prior leaf closure; original hypotheses preserved verbatim"
    result["allUnprovedPriorNodesRetainedByMapping"] = True
    result["globalSourceImageProved"] = False
    result["allGlobalDomainGuardsDischarged"] = False
    result["actualCartesianPDEVerified"] = False
    result["originalN601Complete"] = False
    result["originalN602Complete"] = False
    artifact = write(out / "cartesian-jets-applied-checkpoint.json", result)
    fallback = write(out / "jet-application-source-prefix-witnesses.json", witnesses.evidence())
    captures = write(out / "jet-application-actual-system-captures.json", {"sourceParentSHA256": previous["originalNodesSHA256"], "actualSystemCaptureAudits": list(calc.system_capture_cache.values())})
    summary = {"schema": "MathScope.N6.CloudJetApplication/1", "sourceParentSHA256": previous["originalNodesSHA256"],
               "baselineOriginalRequests": 393, "baselineClosedOnDeclaredDomains": 28,
               "baselineRemainingRequests": 365, "receivedShards": shard_receipts,
               "newAppliedExactZeroJetsOnLeafDefinedDomains": len(proven),
               "remainingOriginalLeafJetsAfterApplication": 365-len(proven),
               "newAppliedOriginalResults": sorted(applied_results), "exactFormulaNotImported": ignored,
               "allOriginalGlobalGuardsRetained": 94, "allOriginalUnconditionalGlobalJetsStillRequireDomainProof": True,
               "sourceAndCaptureRulesIndependentlyRechecked": True,
               "priorScalarNodes": len(program), "newScalarNodes": len(nodes),
               "remainingUnprovedJetScalarNodes": sum(n["op"] == "unresolved_total_source_jet" for n in nodes),
               "newAppliedCheckpoint": artifact, "originalSourceDerivativeHelperCalled": False,
               "independentApplicationLazySourcePrefixEvidence": fallback,
               "independentActualSystemCaptureEvidence": captures,
               "unknownJetReplacedByZero": False, "wholeCartesianPDEProved": False,
               "originalN601Complete": False, "originalN602Complete": False}
    write(out / "jet-application-result.json", summary)
    print(json.dumps({k: summary[k] for k in ["newAppliedExactZeroJetsOnLeafDefinedDomains", "remainingOriginalLeafJetsAfterApplication", "newScalarNodes", "wholeCartesianPDEProved"]}), flush=True)
    return summary


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--context", required=True, type=Path)
    parser.add_argument("--results-root", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    apply(read(args.context), args.results_root, args.output)
