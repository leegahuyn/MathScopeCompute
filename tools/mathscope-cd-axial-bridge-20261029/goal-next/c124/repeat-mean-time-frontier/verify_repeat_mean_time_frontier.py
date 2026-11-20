"""Reproduce the original Repeat mean time donor frontier."""
import argparse
from collections import Counter
from functools import cache
from fractions import Fraction
import gzip
from hashlib import sha256
import json
from pathlib import Path

RUNTIME = "continuation66/stage2/runtime-exact/research-ide/mathscope-m3/"
ARCHIVE = "continuation71/stage2-delta/verified/"
PINS = {
    "protected": ("W", "continuation122/repeat-postfive-mean/protected-postfive-source.json",
                  "83e2ae7c57ee51633c23df4e58ea81ec77b72e214970d4cf93d484e3f4738831"),
    "harmonic": ("W", RUNTIME+"navier/source-harmonic-assembly.mjs",
                 "339c8cb4e5853ba4afe68f3b37933784241baaef3fcf655d5d88aa9f13708d20"),
    "repeat": ("W", RUNTIME+"post-signed-20261023/source-postfive-repeat-forced.mjs",
               "4a7fbdb9ac1b4afa2e8625bdc2c64f3f4632ed609d0d511aae653a0928236cd7"),
    "equations": ("W", RUNTIME+"navier/source-full-mean-equations.mjs",
                  "2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76"),
    "temporal": ("W", RUNTIME+"post-signed-20261023/source-signed-actual-temporal-inverse.mjs",
                 "5299e02c6d7b67c5fedb919be8d359a79678bd903183e27def736a65926bd628"),
    "reference": ("W", RUNTIME+"navier/source-initialized-angular.mjs",
                  "4396979719f97b7c27e77c9cc11782fcd0d3c363da42d25d9d1416280dcf313e"),
    "lateInventory": ("G", "c103/late-mean/late-mean-inventory.json",
                      "1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b"),
    "lateGrade": ("G", "c105/late-grade/late-grade.json",
                  "d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef"),
    "spatialJoin": ("G", "c108/first-k1-energy/k1-donor-join.json",
                    "8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59"),
    "physicalSigned": ("G", "c119/signed-mixed-native-time/signed-physical-time.json",
                       "2ad6fcd043b1be18b4482cd7b055bbd94a528621e57badd4c6860e487e76f9ff"),
    "mixedSigma": ("G", "c119/signed-mixed-native-time/signed-mixed-sigma-time.json",
                   "d43d7d90c831c82b13c9fb68be5e4ab3acd8212fb7a1bd894e4d061d26673014"),
    "preSignedCovariance": ("G", "c119/signed-time-covariance/mixed-signed-time-covariance.json",
                           "18b36ba6fceb10cc448f24361dd6c8e7a2a0e3f3c69dabee966102418f508f7f"),
    "archivedCandidate": ("W", ARCHIVE+"recovered-original/post-five-repeat-forced-candidate.json",
                          "43bd036eb4438343ed0060afd720568c42df9c500d48317eecbad810a035a0cf"),
    "archivedRegistry": ("W", ARCHIVE+"recovered-original/original-source-functions.json",
                         "5d8a751e5ad4b5d2bd4efa5a1f285dc465b0a5b19b3e0bbf8113f160bb582920"),
    "archivedNodes": ("W", ARCHIVE+"append-packet/repeat-appended-nodes.jsonl.gz",
                      "f0f90223c0230ab38f7316186d5a5e3a7df7e19aab78a97d6a172e9cdaf61719"),
}
MEAN_SLOTS = {
    f"coupled-expression:{1341+j}": f"PostFiveRepeatMeanVelocity_{j}" for j in range(3)
}
BASE = 4456994
SLOW = [17732737,17732748,17732749,17732750,17745430,17745431]


def load_inputs(work, goal):
    roots = {"W": work, "G": goal}
    pinned = {}
    for name, (root, path, digest) in PINS.items():
        payload = (roots[root]/path).read_bytes()
        assert sha256(payload).hexdigest() == digest, path
        pinned[name] = json.loads(payload) if path.endswith(".json") else payload
    return pinned


def archived_mean_footprints(p):
    candidate = p["archivedCandidate"]
    registry = {d["id"]:d for d in json.loads(p["archivedRegistry"]["definitions"])[0]}
    assert all(registry[k]["name"] == name for k, name in MEAN_SLOTS.items())
    assert all(registry[k]["parameters"] == [622802,622803,622804,622791,635044,635045]
               for k in MEAN_SLOTS)
    nodes = [json.loads(line) for line in gzip.decompress(p["archivedNodes"]).splitlines()]
    assert len(nodes) == 225012
    selector_kinds = Counter()
    census = Counter()
    representatives = {}

    @cache
    def scan(node):
        if node < BASE:
            return frozenset()
        record = nodes[node-BASE]
        op, args = record["op"], record["args"]
        if op == "m3_coupled_expression_partial":
            owner, actuals, orders = args
            if owner not in MEAN_SLOTS:
                return frozenset()
            assert len(actuals) == len(orders) == 6
            assert orders[3] == 0, (owner, orders)
            return frozenset(((owner, node, tuple(orders)),))
        assert op in ("add", "multiply"), (node, op)
        return frozenset(entry for child in args for entry in scan(child))

    for template in candidate["templates"]:
        for mode in template["rows"]:
            m = mode["m"]
            for component, pair in enumerate(mode["raw"]):
                for part, root in pair.items():
                    operands = sorted(scan(root))
                    assert bool(operands) == (m <= 2), (m, root, operands)
                    census[m] += 1
                    if operands:
                        selector_kinds.update((owner, order) for owner, _, order in operands)
                    if template["key"] == "0:1" and m <= 2 and component == 0:
                        representatives[f"m{m}-radial-{part}"] = {
                            "root":root, "meanPartials":operands,
                        }
    assert census == {m:60 for m in range(1,5)}
    observed = {order for _, order in selector_kinds}
    zero = (0,)*6
    spatial_orders = {zero} | {tuple(int(i == j) for i in range(6)) for j in (0,1,4,5)}
    assert observed == spatial_orders, observed
    return {"baseNodes":BASE,"appendNodes":len(nodes),"registryIds":MEAN_SLOTS,
            "argumentOrdering":["R","Z","T","frozen label","Y0","Y1"],
            "rawScopes":dict(sorted(census.items())),
            "valueOrDerivativeBySlot":[[slot, order, count]
                                       for (slot,order),count in sorted(selector_kinds.items())],
            "exampleRows":representatives}


def protected_and_source(p):
    protected = p["protected"]
    nodes = protected["nodes"]
    assert protected["sourceNodes"] == 22155584
    assert protected["sourceSHA256"] == p["lateInventory"]["source"]["graph"]["sha256"]
    temporal = protected["registry"]["afterActualSigned162_actual_meridional_potential"]
    assert temporal["id"] == "coupled-expression:1329" and temporal["parameters"] == SLOW
    assert nodes["22150943"]["args"] == [temporal["id"],SLOW,[0]*6]
    assert nodes["22151952"]["args"] == [17733137,22151950]
    assert nodes["22154876"]["args"] == [22150797,22151941]
    assert nodes["22151964"]["args"] == [22151019,22151963]
    assert nodes["22153217"]["args"] == [22151964,22153216]
    assert nodes["22153216"]["args"] == [20,21374946]
    assert nodes["22153219"]["args"] == [22151965,22153218]
    assert nodes["22153221"]["args"] == [22151966,22153220]
    assert p["lateInventory"]["source"]["sameSourceSignedCovarianceUnchangedByTemporal"]
    assert p["lateInventory"]["source"]["signedPressureZ"] == 22031648
    assert p["lateInventory"]["source"]["centeredSource"] == [22032006,22032008]
    snippets = {
        "repeat": ("G.expressionValue(system, initial.reference.values)",
                   "G.add(background[j], five.velocity[name])",
                   "exactAngularHarmonicPDE(G, { geometry, phase, k, rows: [mean, ...waves] })"),
        "harmonic": ("G.neg(G.mul(epsilon,G.derivative(x,T)))", "Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))",
                     "Dz=x=>G.mul(epsilon,G.derivative(x,Z))",
                     "phaseTime=D.time(phase)", "S.mul(x,y)", "Dz(row[2])"),
        "equations": ("G.neg(Dz(G.add(G.mul(b,gamma),G.mul(G0,beta),G.mul(beta,gamma),W.rz)))",
                      "W.thetaz"),
        "temporal": ("covariance:updated.updatedCovariance", "'ActualAfterSigned_'"),
        "reference": ("G.div(R,G.sqrt(ratio)),G.div(Z,power(ratio,D)),G.div(T,ratio),ellReference,...Y",),
    }
    for name,texts in snippets.items():
        src = p[name].decode()
        assert all(s in src for s in texts), name
    return {"activeSourceSHA256":protected["sourceSHA256"],
            "activeNativeRegistrySHA256":protected["nativeSHA256"],
            "protectedLateIncrement":[22153217,22153219,22153221],
            "potentials":[22150943,22151952],"directSwirl":22154876,
            "centeredTemporalRoots":[22032006,22032008],"pressureZ":22031648,
            "archiveSourceClosureIsNotAnActiveAppendReadback":True}


def difference_obstruction(p):
    late = p["lateGrade"]
    active = p["spatialJoin"]
    covariance = late["premise"]["componentDirections"]
    assert active["sourceInputs"]["covarianceInputs"] == len(covariance) == 127
    assert not any(d[2] for _,d in covariance)
    outputs = [(r["field"],r["RZTL"]) for r in late["rawMeanCoefficientRows"]]
    degree = {"A_T":2,"A_F":2,"B_sum":1}
    for field,cap in degree.items():
        got = {tuple(row) for f,row in outputs if f == field}
        expected = {(r,z,0,l) for r in range(cap+1) for z in range(cap+1)
                    for l in range(cap+1) if r+z+l <= cap and (field != "A_F" or l == 0)}
        assert got == expected
    assert p["mixedSigma"]["mixedRZT"] == [[1,0,1],[0,1,1]]
    assert p["physicalSigned"]["physicalSlowTerm"]["epsilon"] == "1"
    pre = {tuple(row["RZTL"]) for row in p["preSignedCovariance"]["covarianceRows"]}
    assert {(0,1,1,0),(0,3,1,0)} <= pre

    # Directions on the actual radial pressure density, axial pressure,
    # late potential output, late radial velocity output and separate swirl.
    pressure = [(0,0,1,0)]
    for dz in (1,1,1):
        r,z,t,l = pressure[-1]
        pressure.append((r,z+dz,t,l))
    assert pressure[-1] == (0,3,1,0)
    available_sigma = {(0,0,1),(1,0,1),(0,1,1)}
    axial_signed_zt = (1,1,1)
    angular_signed_zt = (0,2,1)
    assert {axial_signed_zt,angular_signed_zt}.isdisjoint(available_sigma)

    # Local exact cylindrical curl/Haar control. Let A_z=-(R-2)cos(theta)
    # and delta A_theta=(R-2)ZT cos(theta). At R=2,Z=T=0, the old
    # U_theta is cos(theta), delta U_z,ZT is cos(theta); each lower
    # time derivative of the perturbing potential listed in C119 is zero.
    # First mixed partial of U_theta*delta U_z averages cos(theta)^2.
    radius = Fraction(2)
    u_theta_coefficient = -Fraction(-1)
    signed_zzt_coefficient = 1 + (radius-2)/radius
    exact_control = u_theta_coefficient*signed_zzt_coefficient/2
    assert exact_control == Fraction(1,2)
    return {"availableLateDegreeRZLAtTZero":degree,"latePostSignedCovarianceRows":len(covariance),
            "conditionalFirstSpatialMeanDerivatives":True,
            "availableEarlySigmaTimeDirections":sorted(available_sigma),
            "firstEikonalMissing": {
                "ordinaryMean":"partial_T Delta at fixed native lift",
                "radialPotential":["ZT"],"axialPotential":["RT","LT","T"],"swirl":["T"],
                "referenceScale":"b^(-A-1)",
                "postSignedWrz":pressure[-1],"postSignedWrzForExistingFourierBound":[0,3,1,2],
                "postSignedWThetaZ":[0,1,1,0],"postSignedWThetaZForExistingFourierBound":[0,1,1,2],
                "sufficientExtraSigmaRZTForWThetaZ_ZTValue":[axial_signed_zt,angular_signed_zt],
             },
            "independentRawRadialCrossTerm":"epsilon * U_m,z * partial_Z Delta_r for m=1,2",
            "outerTOfThatRawCrossTermPostSignedWrz":[0,4,1,0],
            "guardControl":{"HaarMixedWThetaZ_ZT":str(exact_control),
                            "scope":"Local divergence-free cylindrical curl and exact angular Haar. Guards against generic cancellation only. The control is not an actual native covariance value."}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work",type=Path,required=True)
    ap.add_argument("--goal",type=Path,required=True)
    ap.add_argument("--out",type=Path,required=True)
    args = ap.parse_args()
    p = load_inputs(args.work,args.goal)
    report = {
        "schema":"MathScope.C124.ProtectedRepeatMeanTimeDonorFrontier/1",
        "status":"VERIFIED_PROTECTED_AND_ARCHIVE_DEPENDENCY_OPEN_NATIVE_TIME_NORM",
        "pins":PINS,"protected":protected_and_source(p),"archive":archived_mean_footprints(p),
        "donorFrontier":difference_obstruction(p),"finalJets":0,"release":"HOLD",
    }
    args.out.write_bytes((json.dumps(report,indent=2)+"\n").encode())
    print("PASS 240 archived raw rows, protected PostFive curl and pressure inputs, open post-Signed mixed-time norm")


if __name__ == "__main__":
    main()
