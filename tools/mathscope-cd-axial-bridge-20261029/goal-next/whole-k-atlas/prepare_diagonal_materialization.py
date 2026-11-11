"""Prepare the exact per-row derivative restriction in an isolated source checkout."""
from argparse import ArgumentParser
from hashlib import sha1, sha256
from pathlib import Path
import json

SOURCES = {
    "actual-velocity-all-order-tail.mjs": "195ccc9ae2e9c9ca3179f9f69d03a644d82ed1bc",
    "actual-pressure-stress-all-order-tail.mjs": "4897ca3be356eecf0c3632ee88a8626cad4ab758",
    "actual-common-admissible-family.mjs": "614c59419ec1a6d7e37a52084d10b6a3b4e5d30b",
}


def change(data, old, new):
    original, replacement = old.encode(), new.encode()
    if data.count(original) != 1 or replacement in data:
        raise ValueError(f"unexpected source anchor {old}")
    result = data.replace(original, replacement)
    if result.replace(replacement, original) != data:
        raise ValueError(f"non-reversible change {old}")
    return result


def narrow_rows(data, family):
    guard = "'maxProfileJets','maxJetRequests'].includes(k)))\n"
    export_name = (
        "export function attachActualVelocityPhysicalSeminorms" if family == "velocity"
        else "export function attachActualPressureStressPhysicalSeminorms"
    )
    before, sep, after = data.partition(export_name.encode())
    if not sep:
        raise ValueError(export_name)
    # The optional selector-only request is local to this exported entry point.
    if after.count(guard.encode()) != 1:
        # The velocity file also exposes a separate public diagonal selector.
        if family != "velocity" or after.count(guard.encode()) != 2:
            raise ValueError("unexpected request guards")
        index = after.index(b"\n/** Apply every")
        after, rest = after[:index], after[index:]
    else:
        rest = b""
    after = change(after, guard, "'maxProfileJets','maxJetRequests','selectorDiagonalOnly'].includes(k)))\n")
    after = change(
        after,
        "maxProfileJets=input.maxProfileJets??20000,maxJetRequests=input.maxJetRequests??200000;",
        "maxProfileJets=input.maxProfileJets??20000,maxJetRequests=input.maxJetRequests??200000,\n"
        "    selectorDiagonalOnly=input.selectorDiagonalOnly??false,requestedDerivativeOrder=m;\n"
        "  if(typeof selectorDiagonalOnly!=='boolean')fail('INVALID_INPUT','Invalid selector-only request flag.');",
    )
    after = change(
        after, "  for(let n=1;n<=throughOrder;n++){\n    context.checkCancelled?.();",
        "  for(let n=1;n<=throughOrder;n++){\n"
        "    const m=selectorDiagonalOnly?Math.min(n,requestedDerivativeOrder):requestedDerivativeOrder;\n"
        "    context.checkCancelled?.();",
    )
    after = change(
        after, "request:{throughOrder,derivativeOrder:m,maxProfileJets,maxJetRequests}",
        "request:{throughOrder,derivativeOrder:m,maxProfileJets,maxJetRequests,...(selectorDiagonalOnly?{selectorDiagonalOnly}: {})}",
    )
    after = change(
        after, "allRequestedOrdersExecuted:m,mathematicalDerivativeOrderCap:null,",
        "allRequestedOrdersExecuted:selectorDiagonalOnly?Math.min(1,m):m,\n"
        "      ...(selectorDiagonalOnly?{selectorDiagonalOnly,requestedDerivativeOrder:m,"
        "derivativeOrderByCoefficient:rows.map(row=>row.bounds.length-1)}:{}),mathematicalDerivativeOrderCap:null,",
    )
    if family == "pressure":
        after = change(
            after, "allFiniteOrderOneWeighted(positiveStress,orderOneSeed,m,maxJetRequests,receipt,context)",
            "allFiniteOrderOneWeighted(positiveStress,orderOneSeed,selectorDiagonalOnly?Math.min(1,m):m,"
            "maxJetRequests,receipt,context)",
        )
    return before + sep + after + rest


def run(root, out):
    records = {}
    for name, blob in SOURCES.items():
        path = root / "research-ide/mathscope-m2/navier" / name
        original = path.read_bytes()
        if sha1(f"blob {len(original)}\0".encode() + original).hexdigest() != blob:
            raise ValueError(f"wrong original blob for {name}")
        if "common-admissible-family" in name:
            updated = change(
                original,
                "maxJetRequests:request.maxJetRequests},\n    velocitySeminorms=attachActualVelocityPhysicalSeminorms",
                "maxJetRequests:request.maxJetRequests,...(context.selectorDiagonalOnly===true?{selectorDiagonalOnly:true}:{})},\n"
                "    velocitySeminorms=attachActualVelocityPhysicalSeminorms",
            )
        else:
            updated = narrow_rows(original, "velocity" if "velocity" in name else "pressure")
        records[name] = {
            "originalGitBlob": blob,
            "originalSHA256": sha256(original).hexdigest(),
            "patchedSHA256": sha256(updated).hexdigest(),
        }
        path.write_bytes(updated)
    out.write_text(json.dumps({
        "originalSourceCommit": "f8cb4034e86d7b669d52a6f2248aebba156b51b5",
        "files": records,
        "scope": "construct only m<=n norms used by the common selector, preserve full background C_m",
        "comparisonRequired": "fixed-order source arithmetic/typed DAG equality is a separate check",
    }, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("original", type=Path)
    parser.add_argument("receipt", type=Path)
    args = parser.parse_args()
    run(args.original, args.receipt)
