"""Independent NumPy/SciPy review of stored complete time-slice observations.

No MathScope JS numerical function is imported or executed. This verifies the
postprocessing of actual saved configurations; it does not rerun the Markov chains
or turn approximate sampling intervals into certified bounds.
"""
from __future__ import annotations
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import scipy
from scipy.optimize import minimize_scalar

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "evidence" / "scale-expansion"
JOBS = ["production-a-coarse-attempt2", "production-a-base-attempt1",
        "production-a-fine-attempt1", "production-L8-attempt1",
        "production-T24-attempt1", "validation-delta090-attempt1",
        "validation-delta100-attempt1"]


class IndexRng:
    """Independent implementation of the declared FNV1a/xorshift32 index stream."""
    def __init__(self, seed):
        self.h = 2166136261
        raw = seed.encode("utf-16-le")
        for i in range(0, len(raw), 2):
            self.h = ((self.h ^ int.from_bytes(raw[i:i+2], "little")) * 16777619) & 0xffffffff
        self.h = self.h or 0x9e3779b9

    def integer(self, n):
        cap = (2**32 // n) * n
        while True:
            h = self.h
            h ^= (h << 13) & 0xffffffff
            h ^= h >> 17
            h ^= (h << 5) & 0xffffffff
            self.h = h & 0xffffffff
            if self.h < cap:
                return self.h % n

    def blocks(self, n, block):
        out = []
        while len(out) < n:
            start = self.integer(n)
            out.extend((start+j) % n for j in range(min(block, n-len(out))))
        return np.asarray(out)


def crossing(times, energy):
    indices = np.flatnonzero((energy[:-1] < .1) & (energy[1:] >= .1))
    if len(indices) != 1:
        return None
    i = int(indices[0])
    return float(times[i] + (.1-energy[i]) * (times[i+1]-times[i]) / (energy[i+1]-energy[i]))


def fit_mass(data, errors, nt, window):
    times = np.arange(window[0], window[1]+1)
    y, sigma = data[times], errors[times]
    if len(times) < 3 or np.any(y <= 0) or np.any(sigma <= 0):
        return None, "INVALID"
    weights = sigma**-2
    def objective(log_mass):
        mass = np.exp(log_mass)
        shape = np.exp(-mass*times)+np.exp(-mass*(nt-times))
        amplitude = np.sum(weights*y*shape)/np.sum(weights*shape*shape)
        return float(np.sum(weights*(y-amplitude*shape)**2))
    fit = minimize_scalar(objective, method="bounded", bounds=(math.log(.02), math.log(6)),
                          options={"xatol": 1e-12})
    mass = math.exp(float(fit.x))
    if mass <= .0202 or mass >= 5.94:
        return None, "BOUNDARY"
    return mass, "ACCEPTABLE" if fit.fun/(len(times)-2) <= 3 else "RESIDUAL"


def max_error(a, b):
    return float(np.max(np.abs(np.asarray(a)-np.asarray(b))))


checks, records, scale_cache = [], {}, {}
for job in JOBS:
    path = DATA / job / "result.json"
    record = json.loads(path.read_text())
    records[job] = record
    row = record["result"]["rows"][0]
    channel = row["channel"]
    nt, d = row["Nt"], len(channel["means"])
    arrays = [np.asarray([s["operators"] for s in r["samples"]]) for r in row["replicas"]]
    values = np.concatenate(arrays)
    means = values.mean(axis=(0, 1))
    raw = np.asarray([np.einsum("nti,ntj->ij", np.roll(values, -t, axis=1), values)/(len(values)*nt)
                      for t in range(nt)])
    raw = (raw + raw.transpose(0, 2, 1))/2
    connected = raw - np.outer(means, means)
    derivative = np.roll(raw, 1, axis=0) + np.roll(raw, -1, axis=0) - 2*raw
    selected = channel["selectedOperator"]
    errs = {
        "means": max_error(means, channel["means"]),
        "rawC": max_error(raw, channel["rawCorrelatorMatrices"]),
        "connectedC": max_error(connected, channel["connectedCorrelatorMatrices"]),
        "wholeZeroBlockDifference": max_error(derivative[:, selected, selected],
                                               channel["vacuumDifference"]["selectedSeries"]),
    }
    assert max(errs.values()) < 2e-12, (job, errs)

    # Independent whole-configuration block resampling of the selected channel.
    settings = record["result"]["studyRequest"]
    bs, block = settings["bootstrap"]["replicates"], settings["bootstrap"]["channelBlock"]
    rng = IndexRng(settings["seed"]+"|channel:"+row["id"]+"|bootstrap")
    scalar = [a[:, :, selected] for a in arrays]
    per_mean = [a.mean(axis=1) for a in scalar]
    per_corr = [np.asarray([(np.roll(a, -t, axis=1)*a).mean(axis=1) for t in range(nt)]).T
                for a in scalar]
    draws = []
    for _ in range(bs):
        ix = [rng.blocks(len(a), block) for a in arrays]
        mu = np.concatenate([a[i] for a, i in zip(per_mean, ix)]).mean()
        corr = np.concatenate([a[i] for a, i in zip(per_corr, ix)]).mean(axis=0)
        draws.append(corr-mu*mu)
    draws = np.asarray(draws)
    standard_errors = draws.std(axis=0, ddof=1)
    stored_errors = np.asarray([p["uncertainty"]["standardError"] for p in channel["operatorChannels"][selected]["correlator"]])
    errs["selectedCorrelatorBootstrapSE"] = max_error(standard_errors, stored_errors)
    assert errs["selectedCorrelatorBootstrapSE"] < 2e-12
    window = channel["primaryFit"]["window"]
    mass, status = fit_mass(connected[:, selected, selected], standard_errors, nt, window)
    assert status == "ACCEPTABLE" and mass is not None
    errs["primaryFitMass"] = abs(mass-channel["primaryFit"]["mass"])
    assert errs["primaryFitMass"] < 2e-5, (job, errs)
    fitted = [fit_mass(draw, standard_errors, nt, window) for draw in draws]
    good = [m if status == "ACCEPTABLE" else None for m, status in fitted]
    stored = channel["primaryFit"]["bootstrapMasses"]
    assert [m is None for m in good] == [m is None for m in stored], job
    errs["bootstrapFitMassMaximum"] = max(abs(a-b) for a, b in zip(good, stored) if a is not None)
    assert errs["bootstrapFitMassMaximum"] < 3e-5, (job, errs)

    # Scale samples and resampling are independent of the channel and its target.
    ref = record["result"]["scaleStudy"]["references"][0]
    if ref["sourceHash"] not in scale_cache:
        replica_curves = [np.asarray([[p["t2E"] for p in s["curve"]] for s in r["samples"]])
                          for r in ref["replicas"]]
        times = np.asarray([p["t"] for p in ref["replicas"][0]["samples"][0]["curve"]])
        average = np.concatenate(replica_curves).mean(axis=0)
        scale_seed = ref["replicas"][0]["seed"].split("|scale:")[0]
        scale_rng = IndexRng(scale_seed+"|scale:"+ref["id"]+"|bootstrap")
        block_scale = ref["analysis"]["diagnostics"]["blockSize"]
        scale_draws = []
        for _ in range(len(ref["analysis"]["bootstrapT0OverA2"])):
            chosen = [a[scale_rng.blocks(len(a), block_scale)] for a in replica_curves]
            scale_draws.append(crossing(times, np.concatenate(chosen).mean(axis=0)))
        t0 = crossing(times, average)
        assert t0 is not None and abs(t0-ref["analysis"]["t0OverA2"]) < 2e-14
        assert max_error(scale_draws, ref["analysis"]["bootstrapT0OverA2"]) < 2e-14
        scale_cache[ref["sourceHash"]] = {"t0": t0, "bootstrap": scale_draws,
            "samples": sum(map(len, replica_curves)), "targetExcludedFromSeed": "|d=" not in scale_seed}
    scale = scale_cache[ref["sourceHash"]]
    errs["massReferenceUnitConversion"] = abs(mass*math.sqrt(scale["t0"])-channel["referenceMass"]["value"])
    joint = np.asarray([m*math.sqrt(s) for m, s in zip(good, scale["bootstrap"]) if m is not None and s is not None])
    ci = channel["referenceMass"]["uncertainty"]
    assert len(joint) == ci["valid"]
    errs["jointBootstrapInterval"] = max_error(np.quantile(joint, [.025, .975]), [ci["lower"], ci["upper"]])
    assert errs["massReferenceUnitConversion"] < 2e-5 and errs["jointBootstrapInterval"] < 3e-5
    checks.append({"jobId": job, "rowId": row["id"], "status": "PASS", "rawFileSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "configurations": len(values), "temporalSlicesPerConfiguration": nt,
        "allOperatorChannels": d, "bootstrapReplicates": bs, "maximumAbsoluteDifferences": errs,
        "nonpositiveConnectedMeasurementsRetained": int((connected[:, selected, selected] <= 0).sum()),
        "nonpositiveDifferenceMeasurementsRetained": int((derivative[:, selected, selected] <= 0).sum())})

old = json.loads((DATA/"production-a-coarse-attempt1"/"result.json").read_text())["result"]["rows"][0]
extended = records["production-a-coarse-attempt2"]["result"]["rows"][0]
prefix = all([s["sourceHash"] for s in a["samples"]] ==
             [s["sourceHash"] for s in b["samples"][:len(a["samples"])]]
             for a, b in zip(old["replicas"], extended["replicas"]))
assert prefix
source_sets = {job: {s["sourceHash"] for r in rec["result"]["rows"][0]["replicas"] for s in r["samples"]}
               for job, rec in records.items()}
heldout = all(source_sets[v].isdisjoint(source_sets[p]) for v in JOBS if v.startswith("validation-")
              for p in JOBS if p.startswith("production-"))
assert heldout
output = {"schema": "MathScope.M3.IndependentStudyNumericalReview/1", "status": "PASS",
          "language": "Python", "numpyVersion": np.__version__, "scipyVersion": scipy.__version__,
          "verifierSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          "scope": "Recompute raw/connected/whole-zero-block C, bootstrap errors and fits, independent t0 and propagated mass from all stored configurations. No Markov-chain rerun and no certified confidence statement.",
          "checks": checks, "distinctIndependentReferences": len(scale_cache),
          "coarseAttempt2IsDeclaredExtensionWithSamePrefix": prefix,
          "heldOutSourceConfigurationsDisjointFromProduction": heldout,
          "continuumGapClaim": False}
destination = Path(sys.argv[1]) if len(sys.argv)>1 else DATA/"independent-numerical-review-attempt1.json"
with destination.open("x") as f:
    json.dump(output, f, indent=2)
    f.write("\n")
print(json.dumps({"status": "PASS", "rows": len(checks), "references": len(scale_cache), "output": str(destination)}))
