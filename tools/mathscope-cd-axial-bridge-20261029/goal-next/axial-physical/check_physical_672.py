"""Classify serialized #672 descriptors and certify the physically reached face binders."""
import argparse
from collections import Counter
from fractions import Fraction
import gzip
import hashlib
import json
from pathlib import Path
import sys


REACHED = "5ee0e602a74cbcf766f574ca94f829b7e9e23f5d64d66b6a8197400166ece459"
GRAPH = "a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269"
REGISTRY = "bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e"
INGRESS = "9d77464dd47ce7335c122a2c1e06fb47a8acc7bdf10e70be69012e50dd1ebe9e"
SCOPE_HELPER = "37644881ef36dc404e9cf417a0926aaae15b68bbb892f389a4e1e7915a40b758"
AXIAL_GEOMETRY = "1a075e3e27cae76c10aafb14388a2d2ab09625112a1857344620ff8a52113e9d"
ROOTS = [4419697,4419698,4419699,4419702,4419723,4420035,4420037,4420039,4420249,4420251,4420253]
X, ETA, LEFT, RIGHT, XB, FINITE_X = 4756, 2, 28814, 28824, 28826, 612757
LITERAL_ETA_MINUS_ONE = 20
LITERAL_ETA_PLUS_ONE = 1
REACHED_EXPECTED = {
    614167,614274,614276,614309,614418,614420,614739,614842,614844,
    614877,614986,614988,615877,615984,615986,616017,616126,616128,
}


def pinned(path, sha):
    data = path.read_bytes()
    assert hashlib.sha256(data).hexdigest() == sha, path
    return data


def census(graph):
    direct, count, h = {}, 0, hashlib.sha256()
    with gzip.open(graph, "rb") as stream:
        header = stream.readline()
        h.update(header)
        for i, line in enumerate(stream):
            h.update(line)
            if b'"actual_expression_partial"' in line and b'[672,' in line:
                obj = json.loads(line)
                if obj["op"] == "actual_expression_partial" and obj["args"][0] == 672:
                    direct[i] = obj
            count += 1
    assert h.hexdigest() == GRAPH and count == json.loads(header)["node_count"] == 4420257
    assert len(direct) == 157
    wanted = {operand for node in direct.values() for operand in node["args"][1]}
    max_argument = max(wanted)
    arguments = {}
    with gzip.open(graph, "rb") as stream:
        stream.readline()
        for i, line in enumerate(stream):
            if i in wanted:
                arguments[i] = json.loads(line)
            if i == max_argument:
                break
    assert wanted == arguments.keys()
    return direct, arguments


def descriptor_role(i, axis, node):
    if (axis == "X" and i in (LEFT,RIGHT)) or (axis == "eta" and i in (1,20)):
        return "literal_physical_endpoint"
    if i == (X if axis == "X" else ETA):
        return "original_profile_formal"
    if node["op"] == "coordinate":
        name = node["args"][0]
        if name.startswith("capture_free_argument$"):
            return "capture_free_temporary"
        if name.startswith("physical_norm_face_"):
            return "finite_face_lexical_coordinate"
        return "other_coordinate"
    return "computed_argument"


def face_bounds(nodes, geometry):
    def expect(i, op, args):
        assert nodes[i] == {"op":op, "args":args}, i
    expect(FINITE_X, "multiply", [XB,612756])
    expect(612756, "exp", [612755])
    expect(612755, "rational", ["-1","4"])
    expect(1, "rational", ["1","1"])
    expect(20, "rational", ["-1","1"])
    e = geometry["endpoints"]
    assert geometry["pass"] and (e["Xminus"],e["Xplus"],e["Xb"]) == (LEFT,RIGHT,XB)
    assert geometry["expressionChecks"]["allEndpointsIndependentOfEta"]
    assert geometry["expressionChecks"]["interpolationStartsAfterPulse"]
    assert 4 * 128 - 1 > 4
    return {
        "X":[LEFT,FINITE_X], "eta":[20,1],
        "radialIdentity":"X#612757=Xb#28826*exp(-1/4)",
        "radialOrdering":"0<Xa<Xminus<Xplus<Xv*exp(128-1/4)<Xb*exp(-1/4)<Xb",
        "radialHullInsidePositiveX": True,
        "leftLogLower":"t1/128>0", "rightLogLower":"1/4",
        "etaEndpointConvention":"ordinary inward limits",
    }


def lexical(nodes, body_edges, direct, actual_children, drop=None):
    bits = {i:1 << j for j,i in enumerate(sorted(REACHED_EXPECTED))}
    reached_masks, open_by_node = {}, {}
    discharged = {}
    native_boundary_debts = []
    for i, n in nodes.items():
        a, op = n["args"], n["op"]
        child = actual_children(n)
        native = body_edges.get(i, ())
        assert all(j < i for j in (*child,*native))
        mask = bits.get(i,0)
        open_here = {}
        if mask:
            for axis, x in zip(("X","eta"), direct[i]["args"][1]):
                if descriptor_role(x,axis,nodes[x]) == "finite_face_lexical_coordinate":
                    open_here[x] = mask
                else:
                    assert descriptor_role(x,axis,nodes[x]) == "literal_physical_endpoint"

        operands = [(j,"operand") for j in child]
        if op == "definite_integral":
            assert child == [a[0],a[2],a[3]]
            operands[0] = (a[0],"binder-body")
        for j,role in operands + [(j,"native-definition") for j in native]:
            mask |= reached_masks[j]
            debts = open_by_node.get(j,{})
            if role == "native-definition" and debts:
                native_boundary_debts.append((i,j,sorted(debts)))
            for variable, sites in debts.items():
                if role == "binder-body" and variable == a[1] and i != drop:
                    coordinate = nodes[variable]["args"][0]
                    expected = [20,1] if coordinate.startswith("physical_norm_face_2_1") \
                        or coordinate.startswith("physical_norm_face_3_1") else [LEFT,FINITE_X]
                    assert a[2:] == expected, (i,variable,a[2:])
                    assert variable not in a[2:]
                    discharged[(i,variable)] = discharged.get((i,variable),0) | sites
                else:
                    open_here[variable] = open_here.get(variable,0) | sites
        reached_masks[i] = mask
        if open_here:
            open_by_node[i] = open_here
    return reached_masks, open_by_node, discharged, native_boundary_debts


def guarded_edges_and_masks(nodes, body_edges, registry, scope, ids, actual_children):
    globals_ = json.loads(registry["base"]["base"]["m3GlobalFields"])
    auxiliary = json.loads(registry["base"]["fieldDefinitions"])
    coupled = json.loads(registry["definitions"])[1]
    rows = set()
    for entry in scope["reboundNativeIndexedRows"]:
        i = entry["call"]
        op, index = nodes[i]["op"], nodes[i]["args"][0]
        if op == "m3_global_indexed_partial":
            definition = globals_[index]
        elif isinstance(index,str):
            assert index.startswith("coupled-field:")
            definition = coupled[int(index.split(":")[1])]
        else:
            definition = auxiliary[index]
        row = definition["rows"][entry["row"]]
        child = row["localBody"]
        assert child in body_edges[i]
        assert row["guards"] == entry["guards"]
        rows.add((i,child))
    unindexed, indexed = {}, {}
    bits = {i:1<<j for j,i in enumerate(ids)}
    for i,n in nodes.items():
        direct = bits.get(i,0)
        no_row, with_row = direct, 0
        for j in actual_children(n):
            no_row |= unindexed[j]
            with_row |= indexed[j]
        for j in body_edges.get(i,()):
            if (i,j) in rows:
                with_row |= indexed[j] | unindexed[j]
            else:
                no_row |= unindexed[j]
                with_row |= indexed[j]
        unindexed[i],indexed[i] = no_row,with_row
    return unindexed,indexed,len(rows)


def axial_face_integrability(nodes, direct, discharged):
    """Check the exact 672 face integrands using the proved closed hulls."""
    xa, inv_xa = 3617, 3679
    assert nodes[inv_xa] == {"op":"inverse","args":[xa]}
    assert nodes[3612] == {"op":"source_parameter","args":["t1"]}
    fixed = {xa,3612,LEFT,RIGHT,XB,FINITE_X}
    face_ids = {i for i,_ in discharged}
    nested = {nodes[i]["args"][0] for i in face_ids} & face_ids
    visited, positive_logs, divisions, square_roots, integrals, stress_calls = (
        set(),set(),set(),set(),set(),set())

    def radial_point(i, environment):
        return i == LEFT or environment.get(i) == "X"

    def sign(i, environment):
        # 2 means strictly positive, 1 nonnegative, 0 undetermined.
        visited.add(i)
        if i in fixed or environment.get(i) == "X":
            return 2
        if environment.get(i) == "eta":
            return 0
        op, a = nodes[i]["op"],nodes[i]["args"]
        if op == "rational":
            value = Fraction(*map(int,a))
            return 2 if value > 0 else -2 if value < 0 else 1
        if op == "actual_expression_partial":
            assert i in direct and i in REACHED_EXPECTED and a[0] == 672
            x,eta = a[1]
            assert radial_point(x,environment) and (eta == 20 or environment.get(eta) == "eta")
            stress_calls.add(i)
            return 0
        if op == "definite_integral":
            body,binder,lo,hi = a
            assert i in face_ids
            assert [lo,hi] in ([LEFT,FINITE_X],[20,1])
            integrals.add(i)
            sign(lo,environment)
            sign(hi,environment)
            sign(body,{**environment,binder:"X" if lo == LEFT else "eta"})
            return 0
        if op == "log_positive":
            prod = nodes[a[0]]
            assert prod["op"] == "multiply"
            p,q = prod["args"]
            if p == inv_xa:
                assert radial_point(q,environment)
            else:
                assert p == XB and nodes[q]["op"] == "inverse"
                assert radial_point(nodes[q]["args"][0],environment)
            assert sign(a[0],environment) == 2
            positive_logs.add(i)
            return 2
        if op == "inverse":
            out = sign(a[0],environment)
            assert abs(out) == 2, (i,a)
            divisions.add(i)
            return out
        if op == "integer_power":
            assert a[1] > 0
            out = sign(a[0],environment)
            return (2 if abs(out) == 2 else 1) if a[1] % 2 == 0 else out
        if op in ("sqrt_positive","exp"):
            out = sign(a[0],environment)
            if op == "exp":
                return 2
            assert out == 2, (i,a)
            square_roots.add(i)
            return 2
        assert op in ("add","multiply"), (i,op)
        p,q = (sign(j,environment) for j in a)
        if op == "multiply":
            if abs(p) == abs(q) == 2:
                return 2 if p == q else -2
            return 1 if p > 0 and q > 0 else 0
        return max(p,q) if p > 0 and q > 0 else 0

    for i in sorted(face_ids - nested):
        sign(i,{})
    assert integrals == face_ids and len(stress_calls) == 15
    return {"allAxialFaceIntegrandsContinuousOnTheirClosedHulls":True,
            "outerFaceIntegralRoots":sorted(face_ids-nested),
            "allFaceIntegrals":sorted(integrals),"coveredNonliteral672Calls":sorted(stress_calls),
            "structurallyCheckedScalarNodes":len(visited),"strictPositiveLogs":sorted(positive_logs),
            "checkedNonzeroDivisions":sorted(divisions),"strictPositiveSquareRoots":sorted(square_roots),
            "scope":"Finite real integrability of these original axial normalization face terms, from established fixed stress jets and the pinned positive radial hulls."}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--graph",type=Path,required=True)
    ap.add_argument("--reached",type=Path,required=True)
    ap.add_argument("--ingress",type=Path,required=True)
    ap.add_argument("--geometry",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    args = ap.parse_args()
    assert __debug__
    helper = args.ingress.parent / "native_reference_scopes.py"
    pinned(helper,SCOPE_HELPER)
    sys.path.insert(0,str(helper.parent))
    from native_reference_scopes import actual_children, guarded_row_checks, native_scope_checks

    data = json.loads(pinned(args.reached,REACHED))
    ingress = json.loads(pinned(args.ingress,INGRESS))
    geometry = json.loads(pinned(args.geometry,AXIAL_GEOMETRY))["geometry"]
    registry = json.loads(pinned(args.graph/"original-source-functions.json",REGISTRY))
    nodes, body_edges = dict(data["nodes"]),dict(data["sourceBodies"])
    assert data["roots"] == ROOTS and len(nodes) == 159655
    assert ingress["rootExistenceOnExactBoundReferenceImage"]
    assert ingress["prefixOrder"] == 1 and ingress["nativeRows"]["nativeFrameScopeFailures"] == []
    direct, arguments = census(args.graph/"original-source-nodes.jsonl.gz")
    ids = sorted(REACHED_EXPECTED)
    assert set(direct)&nodes.keys() == REACHED_EXPECTED
    assert all(nodes[i] == direct[i] for i in ids)
    geometry_receipt = face_bounds(nodes,geometry)
    actual_domains, debts, discharged, native_debts = lexical(nodes,body_edges,direct,actual_children)
    assert not native_debts and all(root not in debts for root in ROOTS)
    assert len(discharged) == 12
    axial_faces = axial_face_integrability(nodes,direct,discharged)
    dropped = min(i for i,_ in discharged)
    _, negative, _, _ = lexical(nodes,body_edges,direct,actual_children,drop=dropped)
    negative_roots = [i for i in ROOTS if i in negative]
    assert negative_roots
    scope = native_scope_checks(data,registry,set(ids),{3675253,622807,622808,622809,623855,623856,623857})
    guards = guarded_row_checks(data,registry,scope,set(ids),set())
    assert guards["guardedRelativeRowRecords"] == ingress["nativeRows"]["guardedRelativeRowRecords"] == 29484
    assert not guards["nativeFrameScopeFailures"]
    unindexed,indexed,row_edges = guarded_edges_and_masks(nodes,body_edges,registry,scope,ids,actual_children)
    assert all(unindexed[r]|indexed[r] == actual_domains[r] for r in ROOTS)
    descriptor_rows = []
    counts = Counter()
    for i,node in direct.items():
        x,eta = node["args"][1]
        roles = [descriptor_role(x,"X",arguments[x]),descriptor_role(eta,"eta",arguments[eta])]
        reached = i in REACHED_EXPECTED
        counts[(reached,*roles)] += 1
        row = {"id":i,"actual":[x,eta],"derivatives":node["args"][2],"roles":roles,
               "inOriginalPhysicalRootSemanticClosure":reached}
        if reached:
            bit = 1 << ids.index(i)
            row["roots"] = [r for r in ROOTS if actual_domains[r]&bit]
            row["rootsViaAuthenticatedIndexedBody"] = [r for r in ROOTS if indexed[r]&bit]
            row["rootsViaPathWithoutIndexedBody"] = [r for r in ROOTS if unindexed[r]&bit]
            row["binders"] = [{"integral":j,"variable":var,"endpoints":nodes[j]["args"][2:]}
                for (j,var), uses in discharged.items() if uses&bit]
            assert len(row["binders"]) == roles.count("finite_face_lexical_coordinate")
        descriptor_rows.append(row)
    result = {
        "schema":"MathScope.OriginalN1PhysicalAxial672Domains/1",
        "graphSha256":GRAPH,"registrySha256":REGISTRY,"physicalReachSha256":REACHED,
        "explicitReferenceIngressSha256":INGRESS,"axialGeometryReceiptSha256":AXIAL_GEOMETRY,
        "physicalRoots":ROOTS,"reachedGraphNodes":len(nodes),"sourceAncestorNodes":scope["scopeAncestorCount"],
        "serializedDescriptorCount":len(direct),"physicallyReachedDescriptorCount":len(ids),
        "newPhysicallyReachedNonliteralDomains":15,"reachedLiteralCornerDomains":3,
        "serializedOutsidePhysicalSemanticClosure":len(direct)-len(ids),
        "countsByRole":[{"reached":k[0],"X":k[1],"eta":k[2],"count":v}
                        for k,v in sorted(counts.items())],
        "allDescriptors":descriptor_rows,
        "fixedFaceDomains":geometry_receipt,"matchedLiteralBinderCount":len(discharged),
        "axialFaceIntegrability":axial_faces,
        "nativeBoundaryDebts":native_debts,"openPhysicalRootDebts":[],
        "indexedGuardReplay":guards,"uniqueIndexedBodyEdges":row_edges,
        "negativeControl":{"omittedBinder":dropped,"rootDebtsReappear":negative_roots},
        "scope":"Original first-postfive N=1 physical semantic closure with explicit reference ingress and source guard semantics. #672 argument domains and finite-face binder hulls, with source smooth stress premise. No numerical full residual certificate.",
    }
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(f"PASS: {len(direct)} descriptors classified, {len(ids)} physically reached domains, 15 new nonliteral domains, {len(discharged)} finite face binders.")


if __name__ == "__main__":
    main()

