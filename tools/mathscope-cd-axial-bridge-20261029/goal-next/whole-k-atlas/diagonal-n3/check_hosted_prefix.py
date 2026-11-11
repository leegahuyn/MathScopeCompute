"""Independently verify hosted N3 and N4 selector and pressure exports."""
from argparse import ArgumentParser
from contextlib import ExitStack
from hashlib import sha256
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "diagonal-n2"))
from compare_selector_exports import Export, shared_registry_prefix


SOURCE = "f8cb4034e86d7b669d52a6f2248aebba156b51b5"
HOSTED = {
    3: ("31c8d2bdffa13f16907ab829ad1d17ce065c19fd", 43057719849, 130651562031),
    4: ("5c5fe160f964bd195b16ee231380550f73250927", 43055678022, 130644354040),
}


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--prefix", type=int, choices=HOSTED, default=3)
    args = parser.parse_args()
    prefix = args.prefix
    executing, run_id, job_id = HOSTED[prefix]
    scope_prefix = f"ORIGINAL_WHOLE_K_N{prefix}_"
    with ExitStack() as stack:
        current = Export(args.artifact, stack)
        receipt = current.receipt
        assert receipt["sourceCommit"] == SOURCE and receipt["executingCommit"] == executing
        assert receipt["requestedPrefix"] == prefix and receipt["selectorDiagonalOnly"] is True
        assert current.manifest["scope"] == scope_prefix+"CURRENT_PRESSURE_PREFIX_DIAGONAL_MATERIALIZATION"
        assert current.manifest["final_all_cycle_A_b_p"] is False
        assert all(0 <= i < len(current.offsets) for i in current.manifest["original_root_ids"])
        band = None
        prefix_count, definitions = None, None
        if prefix == 3:
            band = Export(args.artifact, stack, band=True)
            assert receipt == band.receipt
            assert band.manifest["scope"] == scope_prefix+"SELECTOR_BAND_DIAGONAL_MATERIALIZATION"
            assert band.manifest["final_all_cycle_A_b_p"] is False
            assert all(0 <= i < len(band.offsets) for i in band.manifest["original_root_ids"])
            prefix_count, definitions = shared_registry_prefix(band, current)
            assert prefix_count == band.manifest["node_count"]
        selector = receipt["selector"]
        rows = selector["rows"]
        assert [r["order"] for r in rows] == list(range(1, prefix+2))
        assert [len(r["constraints"]) for r in rows] == [8]+[5*(i+1) for i in range(2, prefix+2)]
        for index, row in enumerate(rows):
            assert row["previousLogScale"] == (rows[index-1]["logScale"] if index else 0)
            assert current.node(row["scale"]) == ("exp", [row["logScale"]])
        window = selector["window"]
        assert window["coefficientOrder"] == prefix and window["exactTail"]["firstOmitted"] == prefix+1
        assert window["nextSourceScale"] == rows[-1]["scale"]
        scope = receipt["scope"]
        assert scope["originalCurrentPressurePrivateSeals"] is True
        domain = scope["exactPrefixDomain"]
        assert domain["nextScale"] == window["nextSourceScale"] and domain["prefixOrder"] == prefix
        assert domain["prefixSharedByAllCoverLabels"] and domain["prefixSharedByWholeRadialIntegral"]
        assert domain["conditions"] == ["0<q<qGlobalStar", "b_(N+1)*q>=1"]
        roots = scope["roots"]
        assert roots["omittedScaleTimesTime"] == domain["nextScaleTimesQ"]
        assert roots["referenceTime"] == domain["q"]
        assert roots["selectorScales"] == [r["scale"] for r in rows]
        assert current.node(roots["omittedScaleTimesTime"])[0] == "multiply"
        assert set(current.node(roots["omittedScaleTimesTime"])[1]) == {domain["q"], domain["nextScale"]}
        assert [v for v in roots.values() if type(v) is int]+roots["selectorScales"] == current.manifest["original_root_ids"]
        assert scope["candidateBoxes"] == 81
        assert scope["instantiatedAllPhysicalCells"] is False
        assert scope["nativeReachableNaturalSeriesRangeAudited"] is False
        assert scope["completeAllCycleFinalField"] is False
        result = {
            "schema": f"MathScope.N7.IndependentHostedN{prefix}PrefixReadback/1",
            "status": f"VERIFIED_ORIGINAL_N{prefix}_PREFIX_EXPORT",
            "sourceCommit": SOURCE, "executingCommit": executing,
            "githubRun": run_id,
            "githubJob": job_id,
            "band": band.manifest if band else None, "currentPressure": current.manifest,
            "literalBandPrefixRecords": prefix_count, "sharedEarlyDefinitions": definitions,
            "diagonalClauses": [len(r["constraints"]) for r in rows],
            "sourcePrefixDomain": domain,
            "currentAndPressureRoots": roots,
            "candidateBoxes": scope["candidateBoxes"],
            "scope": "Current and pressure prefix, on the original q and omitted-scale domain. All source field, inverse image and final-cell coverage conditions remain separately enforced.",
            "finalJets": 0, "release": "HOLD",
        }
    raw = (json.dumps(result, indent=2)+"\n").encode()
    args.out.write_bytes(raw)
    print(f"PASS N{prefix} with {current.manifest['node_count']} current/pressure records")
    if prefix_count is not None:
        print(f"PASS {prefix_count} unchanged selector-band records")
    print(f"{sha256(raw).hexdigest()}  {args.out.name}")


if __name__ == "__main__":
    main()
