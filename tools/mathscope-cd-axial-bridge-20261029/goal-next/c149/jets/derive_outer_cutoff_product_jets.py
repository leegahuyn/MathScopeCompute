"""List every original jet operand used when the requested outer cutoff is applied."""
import argparse
from collections import defaultdict
from hashlib import sha256
from itertools import product
import json
from math import comb, prod
from pathlib import Path

REQUEST_SHA = "93e87aaf51e5c2a9cd87d04e32af3d281c081446a7e42fd3d4bce448ee335c0c"


def parse(label):
    name, indexes = label.split("@")
    return name, tuple(map(int,indexes.split(",")))


def label(field, alpha):
    return field+"@"+",".join(map(str, alpha))


def cutoff_cartesian(alpha):
    """Exact differentiation of C(x^2+y^2,z,tau), indexed by powers x,y and C orders."""
    poly = {((0,0), (0,0,0)):1}
    for axis, count in enumerate(alpha):
        for _ in range(count):
            out = defaultdict(int)
            for (powers, orders), weight in poly.items():
                if axis < 2:
                    if powers[axis]:
                        lower = list(powers)
                        lower[axis] -= 1
                        out[tuple(lower),orders] += weight*powers[axis]
                    higher = list(powers)
                    higher[axis] += 1
                    other = (orders[0]+1, *orders[1:])
                    out[tuple(higher),other] += 2*weight
                else:
                    other = list(orders)
                    other[axis-1] += 1
                    out[powers,tuple(other)] += weight
            poly = out
    return poly


def build(request):
    assert request["coordinates"]["A_and_p"] == ["x","y","z","tau"]
    assert request["coordinates"]["b_and_C"] == ["s","z","tau"]
    names = set(request["requested_field_jets"])
    allowed_cutoffs = set(request["requested_cutoff_jets"])
    assert cutoff_cartesian((2,0,0,0)) == {((0,0),(1,0,0)):2, ((2,0),(2,0,0)):4}
    assert cutoff_cartesian((2,1,0,0)) == {((0,1),(2,0,0)):4, ((2,1),(3,0,0)):8}
    rows = []
    for target in request["requested_field_jets"]:
        field, alpha = parse(target)
        terms = []
        for beta in product(*(range(i+1) for i in alpha)):
            remain = tuple(a-b for a,b in zip(alpha,beta))
            weight = prod(comb(a,b) for a,b in zip(alpha,beta))
            cutoff = cutoff_cartesian(beta) if field != "b" else {((0,0),beta):1}
            original = label(field,remain)
            assert original in names, original
            for (powers, indexes), coefficient in sorted(cutoff.items()):
                cutoff_label = label("C",indexes)
                assert cutoff_label in allowed_cutoffs, cutoff_label
                terms.append({"integer":weight*coefficient,"xPower":powers[0],"yPower":powers[1],
                              "cutoffOperand":cutoff_label,"originalFieldOperand":original})
        rows.append({"target":target,"termsForCutoffTimesField":terms})
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("request",type=Path)
    parser.add_argument("output",type=Path)
    args=parser.parse_args()
    raw=args.request.read_bytes()
    assert sha256(raw).hexdigest()==REQUEST_SHA
    req=json.loads(raw)
    rows=build(req)
    result={
        "requestSHA256":REQUEST_SHA,
        "outerCutoffFormula":req["outer_cutoff"]["formula"],
        "scope":"Exact Leibniz operands of the original outer cutoff C on the original A,b,p jets. Any frozen stage cutoff inside A,b,p belongs to their separate original source construction.",
        "closedCellEnclosuresProduced":0,
        "jetCount":len(rows),
        "cutoffJetCountUsed":len({term["cutoffOperand"] for row in rows for term in row["termsForCutoffTimesField"]}),
        "rows":rows,
    }
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    count=sum(len(row["termsForCutoffTimesField"]) for row in rows)
    print(f"All {len(rows)} original fields jets are Leibniz-closed against the original requested cutoff operand list. "
          f"{result['cutoffJetCountUsed']} cutoff labels, {count} exact terms.")


if __name__ == "__main__":
    main()
