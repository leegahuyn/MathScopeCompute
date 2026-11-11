"""Join original fixed paths to the exact mode-independent inverse frame."""
from argparse import ArgumentParser
from hashlib import sha256
import json
from pathlib import Path


def main():
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    base = Path(__file__).resolve().parent.parent
    paths = {
        "frame": "next-inverse/fixed-frame.json",
        "paths": "flat/next-pulse-paths.json",
        "phaseCases": "flat/principal-flat-subtraction.json",
        "reconciliation": "f1-mean/archived-cutoff-reconciliation.json",
    }
    data = {name: (base / path).read_bytes() for name, path in paths.items()}
    frame, path, cases, reconciliation = map(json.loads, data.values())
    assert frame["graphSHA256"] == path["originalGraphSHA256"] == reconciliation["graphSHA256"]
    assert frame["registrySHA256"] == reconciliation["registrySHA256"]
    assert frame["projectionSHA256"] == path["harmonicProjectionSHA256"]
    assert sha256(data["phaseCases"]).hexdigest() == path["principalSubtractionSHA256"]
    assert sha256(data["phaseCases"]).hexdigest() == reconciliation["receiptsSHA256"]["supersededFormalComposition"]
    assert len(frame["cases"]) == len(cases["cases"]) == 10
    frames = {(c["difference"], c["sign"]): c["oldModeChecks"] for c in frame["cases"]}
    results = []
    for slot in path["positiveSlots"]:
        case = cases["cases"][slot["caseIndex"]]
        d, sign, mode = case["difference"], case["sign"], slot["mode"]
        route = slot["path"]
        m1, m2 = frames[d, sign]
        assert [m1["mode"], m2["mode"]] == [1, 2]
        assert case["phase"] == slot["phase"] and d == route["fixedDifference"]
        assert route["range"] == [0, m1["length"]]
        assert case["ownGuards"][-1] == [route["originalPulseValue"], *route["range"]]
        assert case["ownGuards"][-2][0] == route["originalTransverseCoordinate"]
        own = case["ownParameters"]
        # Physical angle is absent from a harmonic coefficient, and the
        # integer selector is already fixed in this case.
        assert len(own) == len(set(own)) == 16 and own[14:] == [622806, 3675258]
        coefficients = own[:14]
        assert set(m1["parameters"] + m2["parameters"]) <= set(coefficients)
        assert m1["directions"] == m2["directions"] == [*own[:3], *own[8:10]]
        assert set(map(int, route["parameterSubstitution"])) == set(own[8:10])
        for field in ("Aphi", "projection", "normal", "normalDerivative", "normalSquared",
                      "K", "damping", "carrier", "length", "variable"):
            assert m1[field] == m2[field]
        assert mode in (1, 2, 3, 4)
        results.append({
            "fixedCase": [d, sign], "phase": case["phase"], "mode": mode,
            "formalCoefficientParameters": coefficients,
            "physicalDerivativeDirections": m1["directions"],
            "path": route, "archivedFrameVariable": m1["variable"],
            "matrix": {"frameRootIds": m1["Aphi"], "diagonalDampingRoot": m1["damping"],
                "dampingMultiplier": mode ** 2, "shiftFromModeOne": mode ** 2 - 1},
            "source": {"projectionRootIds": m1["projection"], "multiplier": -1,
                "formalCoefficientSlot": "futureCorrectedSupportedSource",
                "coefficientValueRoot": None},
            "pressure": {"normalRootIds": m1["normal"], "normalDerivativeRootIds": m1["normalDerivative"],
                "baseKRootIds": m1["K"], "normalSquareRoot": m1["normalSquared"],
                "carrierRoot": m1["carrier"], "signedMode": mode},
            "oldArchivedModeOneSystem": m1["system"], "zeroInitialVector": [0, 0, 0],
            "negativeMode": -mode, "negativeModeRule": "same path and complex conjugate",
        })
    assert len(results) == 40
    assert len({(*row["fixedCase"], row["mode"]) for row in results}) == len(results)
    output = {
        "schema": "MathScope.M3.ConditionalSecondPulseModeInterfaces/1",
        "graphSHA256": frame["graphSHA256"], "registrySHA256": frame["registrySHA256"],
        "inputSHA256": {key: sha256(value).hexdigest() for key, value in data.items()},
        "verifiedPathAndOperatorBindings": len(results),
        "requirements": ["corrected supported source on fixed chart", "native source domains and smooth zero joins",
            "uniform coefficient bounds for the required derivative order"],
        "exactOperator": "t'(w) = [Aphi(w)-m^2*d(w)*I]t(w) - P(w)f_m(H_w(Y))",
        "exactPressure": "pi=i*((n^T*K-(n')^T)*t+n dot f)/(k*m*n^2)",
        "propagatorRelation": "U_m(v,s)=exp(-(m^2-1)*integral_s^v d(w)dw)*U_1(v,s)",
        "endpoint": "v=v(Y), original cutoff on potential and pressure, complete curl with all derivatives",
        "actualSecondInverseExecuted": False,
        "slots": results,
    }
    args.out.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"Bound {len(results)} path and frame interfaces with uninstantiated forcing")


if __name__ == "__main__":
    main()
