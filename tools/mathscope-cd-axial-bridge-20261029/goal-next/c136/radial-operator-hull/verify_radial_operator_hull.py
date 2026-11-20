"""Read active raw source orders and reduce the physical derivative footprint."""

import argparse
from collections import Counter
from hashlib import sha256
from itertools import product
import json
from pathlib import Path


def read(path, fingerprint):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == fingerprint, path
    return raw


ZERO = (0, 0, 0, 0, 0)
BASIS = [tuple(int(i == j) for j in range(5)) for i in range(5)]
R, Z, T, L, N = BASIS


def plus(left, right):
    return tuple(a+b for a, b in zip(left, right, strict=True))


def footprint(root, runtime):
    native_pin = "70d841c3686c7f3135592e04e170048cd5663cfaaf4e53ac5b12bae84bb5c8ba"
    native = json.loads(read(root / "c133/live-radial-trace/live-radial-trace.json", native_pin))
    harmonic_pin = "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"
    harmonic = read(runtime / "mathscope-m3/navier/source-harmonic-assembly.mjs", harmonic_pin).decode()
    for literal in (
        "L=x=>G.add(...Y.map((y,j)=>G.mul(vr[j],G.derivative(x,y))))",
        "N=x=>G.add(...Y.map((y,j)=>G.mul(vt[j],G.derivative(x,y))))",
        "Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))",
        "time=x=>G.add(G.neg(G.mul(epsilon,G.derivative(x,T))),G.mul(ci,N(x)))",
        "Dz=x=>G.mul(epsilon,G.derivative(x,Z))",
        "Dr(Dr(M))",
        "Dz(Dz(M))",
        "gradient=P=>[Dr(P),angular(P),Dz(P)]",
        "S.add(time(x),S.neg(S.scale(epsilon,L[j])),grad[j])",
    ):
        assert literal in harmonic, literal
    first_radial = {R, L}
    second_radial = {plus(a, b) for a, b in product(first_radial, repeat=2)} | {L}
    assert second_radial == {plus(R,R), plus(R,L), plus(L,L), L}
    spatial = {ZERO, Z, plus(Z,Z), *first_radial, *second_radial}
    waves = spatial | {T, N}
    pressures = {ZERO, R, Z, L}
    reconstructed_coordinate_waves = {
        ZERO, R, Z, T, L, N, plus(R,R), plus(Z,Z),
        plus(R,L), plus(R,N), plus(L,L), plus(L,N), plus(N,N),
    }
    reconstructed_coordinate_pressures = {ZERO, R, Z, L, N}
    assert len(native["tenCharts"]) == 10
    assert sum(x["typedNativePressureCases"] for modes in native["tenCharts"].values()
               for x in modes.values()) == 200
    for modes in native["tenCharts"].values():
        assert set(modes) == {"1", "2"}
        for mode, row in modes.items():
            # For this comparison slots 3 and 4 are the two Y coordinates.
            assert {tuple(a) for a in row["velocityOrders"]} == reconstructed_coordinate_waves
            assert {tuple(a) for a in row["pressureOrders"]} == reconstructed_coordinate_pressures
            assert row["typedNativeVelocityCases"] == 78
    d_waves = {plus(seed, axis) for seed, axis in product(waves, BASIS)}
    d_pressures = {plus(seed, axis) for seed, axis in product(pressures, BASIS)}
    per_n = Counter(a[4] for a in d_waves)
    assert set(per_n) == {0,1,2}
    assert {a for a in d_waves if a[4] == 2} == {plus(N,N)}
    assert {a for a in d_waves if a[4] == 1 and a[2]} == {plus(T,N)}
    assert {a for a in d_waves if a[2] == 2} == {plus(T,T)}
    assert d_pressures & {plus(T,T),plus(N,N),plus(T,N)} == set()
    assert {a for a in d_pressures if a[4]} == {plus(seed,N) for seed in pressures}
    return {
        "status": "VERIFIED_FINITE_PHYSICAL_RADIAL_DERIVATIVE_FOOTPRINT",
        "pins": {"actualSourceCensus": native_pin, "originalHarmonicAssembly": harmonic_pin},
        "basis": ["R", "Z", "T", "L", "N"], "charts": len(native["tenCharts"]),
        "exactRadialOperator": "D_r²=R²+2*a*R*L+a_R*L+a²*L²",
        "waveSeeds": sorted(waves), "pressureSeeds": sorted(pressures),
        "waveFirstDerivativeHull": sorted(d_waves), "pressureFirstDerivativeHull": sorted(d_pressures),
        "waveDerivativesByN": dict(sorted(per_n.items())),
        "secondPulse": [list(plus(N,N))], "timePulse": [list(plus(T,N))],
        "secondTime": [list(plus(T,T))],
        "pressurePulseDirections": sorted(a for a in d_pressures if a[4]),
        "scope": "Actual linear wave and pressure degree after one physical differentiation; nonzero derivatives on mean cofactors, geometry and subtractions have separate proofs",
        "wholeRadialC1": "OPEN", "finalJets": 0, "release": "HOLD",
    }


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("goal", "runtime", "out"):
        p.add_argument("--" + name, type=Path, required=True)
    a = p.parse_args()
    result = footprint(a.goal, a.runtime)
    a.out.write_bytes((json.dumps(result, indent=2, sort_keys=True) + "\n").encode())
    print(result["status"], result["waveDerivativesByN"])
