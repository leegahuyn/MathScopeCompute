from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import json
from mmap import ACCESS_READ, mmap
from pathlib import Path
from struct import unpack_from


NODE_COUNT = 22155584
THETA = 17732752
SOURCE_STREAM_SHA = "faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96"
OFFSET_SHA = "d23985c9d730f9b6c88af8eafcc0cdd4d4f899646105b2cf12e01a77c3247225"
EXPORT_SHA = "8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a"
REGISTRY_SHA = "e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03"
CYCLE_SHA = "42885290951e7d4b9fa689c7f67e0d390b39d101cc80d2af08c14188f25baef3"
ANGULAR_LEAVES = {21998149: 12, 22030910: 19}
ZERO_ANGLE_LEAVES = {17732937, 21728713, 21728869, 22031464, 22031620,
                     22031662, 22152412, 22152568, 22153225}
INITIAL_SHA = "0545658bf1dc4d5b373639c562ce537be1600a2210089faaa90aa6f77a8ed0b2"
SPARSE_SHA = "6adaa1e90071139163ee59913f3bff1e3c9f0fca5e6c159cadb19350954c517c"
SUMMATION_SHA = "67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450"


def pinned_json(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return json.loads(raw)


def mapped_digest(mapped, header=b""):
    digest = sha256(header)
    for start in range(0, len(mapped), 8 * 1024 * 1024):
        digest.update(mapped[start:start + 8 * 1024 * 1024])
    return digest.hexdigest()


def run(artifact, spool):
    capture = artifact / "first-correction-spatial-source"
    manifest = pinned_json(capture / "original-source-export-manifest.json", EXPORT_SHA)
    original = pinned_json(capture / "original-source-functions.json", REGISTRY_SHA)
    cycle = pinned_json(artifact / "first-cycle.json", CYCLE_SHA)
    pressure_root = cycle["stages"][-1]["pressure"]
    assert pressure_root == 22153227 and manifest["node_count"] == NODE_COUNT
    assert manifest["node_stream_sha256"] == SOURCE_STREAM_SHA
    expressions, fields, inverses, pulse, _ = json.loads(original["definitions"])
    native = json.loads(original["base"]["base"]["expression"])
    aux = json.loads(original["base"]["expressionDefinitions"])
    aux_inverse = json.loads(original["base"]["inverseDefinitions"])
    aux_indexed = json.loads(original["base"]["fieldDefinitions"])

    with (spool / "records.jsonl").open("rb") as records_file, (spool / "offsets.bin").open("rb") as offsets_file:
        with mmap(records_file.fileno(), 0, access=ACCESS_READ) as records, mmap(offsets_file.fileno(), 0, access=ACCESS_READ) as offsets:
            header = b'{"schema":"MathScope.M3.FullNodesJSONL/1","node_count":22155584}\n'
            assert len(records) + len(header) == manifest["node_stream_uncompressed_bytes"]
            assert len(offsets) == 8 * NODE_COUNT
            assert mapped_digest(records, header) == SOURCE_STREAM_SHA and mapped_digest(offsets) == OFFSET_SHA
            return inspect(records, offsets, pressure_root, expressions, fields, inverses, pulse, native,
                           aux, aux_inverse, aux_indexed)


def inspect(records, offsets, pressure_root, expressions, fields, inverses, pulse, native,
            aux, aux_inverse, aux_indexed):
    def offset(node):
        return unpack_from("<Q", offsets, 8 * node)[0]

    @cache
    def record(node):
        assert type(node) is int and 0 <= node < NODE_COUNT
        start = offset(node)
        end = offset(node + 1) if node + 1 < NODE_COUNT else len(records)
        row = json.loads(records[start:end])
        return row["op"], row["args"]

    assert record(THETA) == ("coordinate", ["m3_global_band_angle$1207477"])

    @cache
    def theta_free(node):
        if node <= THETA:
            return node != THETA
        op, args = record(node)
        if op in ("coordinate", "rational", "source_parameter"):
            return True
        if op in ("add", "multiply", "smooth_piecewise", "maximum"):
            children = args
        elif op in ("inverse", "sqrt_positive", "log_positive", "exp", "ceiling", "sine", "cosine",
                    "integer_power", "source_step_derivative"):
            children = args[:1]
        elif op == "definite_integral":
            assert args[1] != THETA
            children = [args[0], args[2], args[3]]
        elif op in ("m3_coupled_expression_partial", "m3_aux_expression_partial", "actual_expression_partial",
                    "m3_aux_inverse_partial", "m3_coupled_inverse_partial", "m3_aux_indexed_partial",
                    "m3_coupled_indexed_partial"):
            system, children, orders = args
            if "indexed" in op:
                definition = fields[int(system.split(":")[1])] if isinstance(system, str) else aux_indexed[system]
            elif "inverse" in op:
                definition = inverses[int(system.split(":")[1])] if isinstance(system, str) else aux_inverse[system]
            else:
                definition = expressions[int(system.split(":")[1])] if isinstance(system, str) else (
                    aux[-1 - system] if system < 0 else native[system])
            assert len(children) == len(definition["parameters"]), (node, op, system)
            assert len(orders) == len(definition.get("directions", definition["parameters"])), (node, op)
        elif op == "m3_forced_pulse_partial":
            system, _, _, v, values, _ = args
            assert len(values) == len(pulse[system]["parameters"])
            children = [v, *values]
        elif op == "actual_monotone_root":
            children = args[1] if isinstance(args[1], list) else args[1:]
        elif op in ("actual_covariance_volterra", "m3_global_pulse_jet"):
            children = [args[2], *args[3]]
        else:
            raise AssertionError((node, op))
        assert all(type(child) is int and child < node for child in children)
        return all(theta_free(child) for child in children)

    @cache
    def trig_arguments(node):
        if theta_free(node):
            return frozenset()
        op, args = record(node)
        if op in ("cosine", "sine"):
            return frozenset(args[:1])
        if op == "smooth_piecewise":
            assert all(theta_free(x) for x in args[:3]), (node, op)
            return frozenset().union(*(trig_arguments(x) for x in args[3:]))
        if op == "add":
            return frozenset().union(*(trig_arguments(x) for x in args))
        if op == "multiply":
            active = [x for x in args if not theta_free(x)]
            assert len(active) == 1, (node, op, args)
            return trig_arguments(active[0])
        if op == "m3_coupled_expression_partial":
            system, values, orders = args
            assert not any(orders)
            definition = expressions[int(system.split(":")[1])]
            assert len(values) == len(definition["parameters"])
            used = [(formal, value) for formal, value in zip(definition["parameters"], values, strict=True)
                    if not theta_free(value)]
            assert used == [(THETA, THETA)], (node, op, used)
            return trig_arguments(definition["body"])
        raise AssertionError((node, op, args[:3]))

    pending, leaves = [pressure_root], set()
    while pending:
        root = pending.pop()
        op, args = record(root)
        if op == "add":
            pending.extend(args)
        else:
            leaves.add(root)
    assert leaves == ANGULAR_LEAVES.keys() | ZERO_ANGLE_LEAVES
    assert all(theta_free(leaf) for leaf in ZERO_ANGLE_LEAVES)

    result = []
    for leaf, pressure_field in ANGULAR_LEAVES.items():
        op, args = record(leaf)
        assert op == "m3_coupled_indexed_partial" and args[0] == f"coupled-field:{pressure_field}"
        assert not any(args[2])
        pressure = fields[pressure_field]
        # The three velocity components immediately precede pressure in each
        # actual registered Forced/Signed block, preserving the same maps.
        velocity = fields[pressure_field - 3:pressure_field]
        assert len(pressure["rows"]) == 162 and all(len(field["rows"]) == 162 for field in velocity)
        assert all("velocity" in field["name"] for field in velocity)
        all_pressure, extra, controls = set(), set(), 0
        for i, row in enumerate(pressure["rows"]):
            donor_rows = [field["rows"][i] for field in velocity]
            for donor in donor_rows:
                for key in ("values", "label", "derivativeMaps", "guards", "coefficient", "localParameters"):
                    assert donor[key] == row[key], (pressure_field, i, key)
            atoms = trig_arguments(row["localBody"])
            velocity_atoms = frozenset().union(*(trig_arguments(a["localBody"]) for a in donor_rows))
            all_pressure.update(atoms)
            extra.update(atoms - velocity_atoms)
            controls += int(bool(atoms))
        assert not extra, (pressure_field, sorted(extra))
        assert all_pressure
        result.append({"name": pressure["name"], "pressureRoot": leaf, "sameVelocityRows": 162,
                       "nonzeroAngularRows": controls, "samePhaseArguments": sorted(all_pressure)})
    return {"pressureRoot": pressure_root, "angleFreePressureLeaves": sorted(ZERO_ANGLE_LEAVES),
            "physicalPressureAngularFields": result, "recordsRead": record.cache_info().currsize,
            "thetaFreeChecks": theta_free.cache_info().currsize}


def common_bound(goal):
    initial = pinned_json(goal / "final67/initial-fourier/initialized-angular-split.json", INITIAL_SHA)
    pressure = [record for record in initial["fields"] if record["name"] == "pressure"]
    assert len(pressure) == 1 and pressure[0]["signedRows"] == 162
    assert all({row["harmonicSign"] for row in body["terms"]} == {-1, 1}
               for body in pressure[0]["local"].values())
    sparse = pinned_json(goal / "c114/first-cycle-angular-support/first-cycle-angular-support.json", SPARSE_SHA)
    counts = sparse["counts"]
    assert (counts["cylindricalVelocitySupportAtMost"],
            counts["cylindricalNonPressureForceSupportAtMost"],
            counts["horizontalCartesianNonPressureForceSupportAtMost"]) == (193, 18497, 36994)
    summation = (goal / "final67/correction-jet-composition/pinned-source/source-final-summation.mjs").read_bytes()
    assert sha256(summation).hexdigest() == SUMMATION_SHA
    text = summation.decode()
    assert "pressure=G.mul(c,row.p)" in text and "G.add(base.p,...stages.map(row=>row.cutoffPressure))" in text
    return {
        "pressureCandidateSupportAtMost": counts["cylindricalVelocitySupportAtMost"],
        "originalSummationSHA256": SUMMATION_SHA,
        "cylindricalCompleteForceCandidateSupportAtMost": counts["cylindricalNonPressureForceSupportAtMost"],
        "horizontalCartesianCompleteForceCandidateSupportAtMost": counts["horizontalCartesianNonPressureForceSupportAtMost"],
        "scope": "Initialized plus only the first correction after original shrinking and outer cutoffs",
        "conditions": [
            "Original ordinary native profiles, fixed angular-independent labels and flat seams",
            "Complete original pressure through the first correction, with physical time and Cartesian frame derivatives",
        ],
        "forceSupportReason": "The pressure derivative stays in the common linear set S. Because 0 belongs to S, pressure adds no entry beyond S+S before cylindrical frame rotation.",
        "appliedCutoffReason": "The original stage-one correction pressure is the difference between original post-Five and initialized pressures multiplied by the q-dependent window. The outer cutoff is also independent of physical angle.",
        "allLaterModesAndSampleValues": "OPEN",
    }


if __name__ == "__main__":
    parser = ArgumentParser(description=__doc__)
    for field in ("artifact", "spool", "goal", "out"):
        parser.add_argument("--" + field, required=True, type=Path)
    args = parser.parse_args()
    result = run(args.artifact, args.spool)
    result.update(schema="MathScope.C115.OriginalFirstCyclePressureAngularModes/1", sourceStreamSHA256=SOURCE_STREAM_SHA,
                  authenticatedSourceRecords=NODE_COUNT, combinedFirstCycleBound=common_bound(args.goal),
                  N805="OPEN", finalJets=0, release="HOLD")
    with args.out.open("xb") as output:
        output.write((json.dumps(result, indent=2) + "\n").encode())
    print("PASS original pressure angular laws and the corresponding full-circle velocity phases")
