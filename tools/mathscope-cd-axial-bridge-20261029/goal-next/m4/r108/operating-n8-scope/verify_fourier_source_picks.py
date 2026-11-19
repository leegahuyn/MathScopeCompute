"""Independently recover the live finite comparator's picked vectors and curl."""

import argparse
from fractions import Fraction
from hashlib import sha1, sha256
from itertools import product
import json
from pathlib import Path
import re


BLOB = "c572d2ed4399524bdbc665305c6acb9e7d38ee3d"
FULL_SHA256 = "0e7168cf3c5c7d44bac56560fe293d16461c698899b8698c1e0f1f0dfddf8e6a"
RUN = "8bdf584da5121931d1fb7d79416d568c698f5a8211c22d7d600648ea23015b6f"
LIVE_SHA256 = "a945831236caa965dd96f986fb3f8311d6a236afed8235c0a69e135f51febe48"
PICK_PATTERN = r"좌표 ([^|]+) \| 속도 ([^|]+) \| t=([0-9.]+)"
CURL_PATTERN = r"실제 FFT ω\(x,t=0\.5\)=\(([^)]+)\)"


def cross(k, u):
    return (k[1] * u[2] - k[2] * u[1], k[2] * u[0] - k[0] * u[2], k[0] * u[1] - k[1] * u[0])


def norm_squared(values):
    return sum(x * x for x in values)


def rational_pi_bounds():
    def arctan_bounds(n, terms):
        x = Fraction(1, n)
        partial = sum((-1) ** i * x ** (2 * i + 1) / (2 * i + 1) for i in range(terms))
        alternate = partial + (-1) ** terms * x ** (2 * terms + 1) / (2 * terms + 1)
        return min(partial, alternate), max(partial, alternate)

    # Machin's identity and the alternating series remainder.
    a, b = arctan_bounds(5, 26)
    c, d = arctan_bounds(239, 11)
    return 16 * a - 4 * d, 16 * b - 4 * c


def rounding_interval(value):
    mantissa, exponent = value.strip().split("e")
    assert len(mantissa.split(".")[1]) == 4
    exact = Fraction(value.strip())
    half_step = Fraction(1, 2) * Fraction(10) ** (int(exponent) - 4)
    return exact - half_step, exact + half_step


def contains_display(text, expected, error):
    values = text.split(",")
    assert len(values) == len(expected)
    for shown, center, radius in zip(values, expected, error, strict=True):
        lo, hi = rounding_interval(shown)
        assert lo <= center - radius <= center + radius <= hi, (shown, center, radius)
        if center == 0 and radius == 0:
            assert Fraction(shown.strip()) == 0


def actual_fourier(original):
    data = json.loads(original, parse_float=Fraction)
    assert data["runHash"] == RUN
    assert data["schema"] == "MathScope.NavierM3.Result/1"
    assert data["observations"]["contract"]["paperReconstruction"] is False
    assert data["input"]["parameters"]["cutoff"] == 2
    modes = list(product(range(-2, 3), repeat=3))
    coefficients = data["results"]["final"]
    assert len(coefficients) == 6 * len(modes) == 750
    supported = {}
    energy = viscosity = vorticity_norm = Fraction(0)
    for j, k in enumerate(modes):
        row = coefficients[j * 6:j * 6 + 6]
        re_u, im_u = row[::2], row[1::2]
        if any(row):
            supported[k] = (re_u, im_u)
        assert not any(row) or k[2] == 0
        assert re_u[2] == im_u[2] == 0
        assert sum(a * b for a, b in zip(k, re_u, strict=True)) == 0
        assert sum(a * b for a, b in zip(k, im_u, strict=True)) == 0
        power = norm_squared(row)
        energy += Fraction(power) / 2
        viscosity += norm_squared(k) * power
        vorticity_norm += norm_squared(cross(k, re_u)) + norm_squared(cross(k, im_u))
    assert set(supported) == set(product((-1, 1), (-1, 1), (0,)))
    for k, (re_u, im_u) in supported.items():
        re_partner, im_partner = supported[tuple(-coordinate for coordinate in k)]
        assert re_u == re_partner and im_u == [-x for x in im_partner]
    final_frame = data["observations"]["curves"][-1]
    assert len(data["observations"]["curves"]) == 32 and final_frame["time"] == Fraction(1, 2)
    assert abs(energy - final_frame["energy"]) <= Fraction(1, 10 ** 15)
    assert abs(viscosity - final_frame["gradientSquared"]) <= Fraction(1, 10 ** 15)
    assert viscosity == vorticity_norm

    # At the intended x=y=π/4 the four nonzero Fourier phases are
    # -π/2, 0 and +π/2. The verified kz=0 removes every z dependence.
    exact_velocity = [Fraction(0)] * 3
    exact_curl = [Fraction(0)] * 3
    sum_curl_absolute = [Fraction(0)] * 3
    for k, (re_u, im_u) in supported.items():
        cosine, sine = {-2: (0, -1), 0: (1, 0), 2: (0, 1)}[k[0] + k[1]]
        real_curl, imag_curl = tuple(-x for x in cross(k, im_u)), cross(k, re_u)
        for i in range(3):
            exact_velocity[i] += re_u[i] * cosine - im_u[i] * sine
            exact_curl[i] += real_curl[i] * cosine - imag_curl[i] * sine
            sum_curl_absolute[i] += abs(real_curl[i]) + abs(imag_curl[i])

    xy = Fraction("0.7853981633974483")
    saved = [x for x in data["observations"]["samples"] if x["position"] == [xy, xy, 0]]
    assert len(data["observations"]["samples"]) == 81
    assert len(saved) == 1 and saved[0]["velocity"] == exact_velocity
    lower_pi, upper_pi = rational_pi_bounds()
    xy_error = max(abs(xy - lower_pi / 4), abs(xy - upper_pi / 4))
    assert xy_error < Fraction(1, 10 ** 16)
    # Both explicit |kx| and |ky| are 1. The first derivatives of cos/sin
    # have norm <=1, giving the phase perturbation bound term by term.
    curl_error = [2 * xy_error * upper for upper in sum_curl_absolute]
    assert exact_curl[2] > 0 and all(x < Fraction(1, 10 ** 15) for x in curl_error)
    return exact_velocity, exact_curl, curl_error, energy, viscosity


def inspect(args):
    original = args.source.read_bytes()
    assert sha1(f"blob {len(original)}\0".encode() + original).hexdigest() == BLOB
    assert sha256(original).hexdigest() == FULL_SHA256
    velocity, curl, curl_error, energy, viscosity = actual_fourier(original)

    live_bytes = args.live.read_bytes()
    live = json.loads(live_bytes)
    assert live["gitBlobSHA1"] == BLOB and live["runHash"] == RUN
    assert live["immutableGitBytes"] == len(original) and live["immutableGitSHA256"] == FULL_SHA256
    assert live["globalRelease"] == "HOLD" and live["operatingR108"] == "OPEN"
    assert [item["viewport"] for item in live["observations"]] == [
        {"width": 1280, "height": 900}, {"width": 390, "height": 844}
    ]
    tested = []
    for run in live["observations"]:
        assert run["http"] == 200 and run["httpBytes"] == 30707818 and run["httpSHA256"] == LIVE_SHA256
        native_scope = run["scopePanel"]
        assert BLOB in native_scope and "RELEASE HOLD" in native_scope
        checks = run["supportedInteractions"]
        assert checks["earlyFrameNoStoredCoefficients"] and checks["analyticCoreSeparate"]
        assert checks["finalFrame"] == 31 and checks["scene"] == "vorticity"
        export = checks["output"]
        assert (export["bytes"], export["sha256"], export["gitBlobSHA1"]) == (len(original), FULL_SHA256, BLOB)
        screenshot = args.live.parent / run["screenshot"]["path"]
        assert sha256(screenshot.read_bytes()).hexdigest() == run["screenshot"]["sha256"]
        assert len(checks["picks"]) == 3
        for sample, recorded_z in zip(checks["picks"], ("0.0000e+0", "3.1416e+0", "6.2832e+0"), strict=True):
            assert sample["actualTarget"] == "msn8-scene"
            pointer_text = sample["pickedText"]
            coords, reported_velocity, time = re.search(PICK_PATTERN, pointer_text).groups()
            assert coords.split(",")[-1].strip() == recorded_z
            assert Fraction(time) == Fraction(1, 2)
            assert BLOB in pointer_text and RUN in pointer_text and "C,D FINAL OPEN" in pointer_text
            reported_curl, = re.search(CURL_PATTERN, pointer_text).groups()
            contains_display(reported_velocity, velocity, [0, 0, 0])
            contains_display(reported_curl, curl, curl_error)
        tested.append({"viewport": run["viewport"], "picks": 3, "immutableDownload": True,
                       "consolePageErrorsObserved": len(run["pageErrors"])})

    return {
        "schema": "MathScope.R1-03.C88.IndependentFourierRecalculation/1",
        "status": "VERIFIED_ACTUAL_FINITE_NS_SOURCE_TO_OPERATING_PICKS",
        "operatingHTTPSReceiptSHA256": sha256(live_bytes).hexdigest(),
        "sourceGitBlob": BLOB, "sourceSHA256": FULL_SHA256, "runHash": RUN,
        "exactRationalSourceChecks": {"complexModes": 125, "scalars": 750, "nonzeroModes": 4,
            "kzNonzeroCoefficientsZero": True, "uzZero": True, "divergenceZero": True,
            "conjugateSymmetry": True, "kineticEnergyMean": str(energy),
            "viscousGradientMeanSquared": str(viscosity), "curlParsevalExact": True},
        "chosenSourcePoint": {"planeXY": "π/4, π/4", "sameFieldOnSlices": ["0", "π", "2π"],
            "velocityAtIntendedGridPoint": list(map(str, velocity)),
            "curlAtIntendedGridPoint": list(map(str, curl)),
            "absoluteCurlPerturbationPerComponentBelow": "1e-15",
            "exactExportedBytesOnBothViewports": True},
        "views": tested, "criteriaScope": "Live NS finite comparator trace within R1-03 only",
        "crossChecksRemaining": ["prism comparison map", "Delta state generator",
                                  "independent pointwise C/D final-field error"],
        "sourcePromotion": False, "finalJets": 0, "operatingR108": "OPEN", "release": "HOLD",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "live", "out"):
        parser.add_argument("--" + name, required=True, type=Path)
    args = parser.parse_args()
    if not __debug__:
        parser.error("retain Python assertions")
    result = inspect(args)
    with args.out.open("x", encoding="utf-8", newline="\n") as output:
        json.dump(result, output, indent=2, ensure_ascii=False)
        output.write("\n")
    print(result["status"])
