from __future__ import annotations

import math
from typing import Any

import numpy as np
import ripser as ripser_package

from app.adapters.base import Adapter
from app.adapters.topology_common import (
    MAX_POINTS_RIPSER,
    common_topology_representation,
    essential_betti,
    interval_counts,
    rows_by_dimension,
    source_revision_refs,
    validate_distance_matrix,
    validate_max_dim,
    validate_points,
    validate_prime,
)
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class RipserTopologyAdapter(Adapter):
    name = "topology.ripser.v1"
    version = "0.1.0"

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        coeff = validate_prime(input_spec.get("coefficientField", 2))
        max_dim = validate_max_dim(input_spec.get("maxHomologyDimension", 1))
        threshold = float(input_spec.get("maxEdgeLength", math.inf))
        if threshold <= 0:
            raise ValueError("maxEdgeLength must be positive")
        do_cocycles = bool(input_spec.get("doCocycles", False))
        metric = str(input_spec.get("metric", "euclidean"))
        n_perm_raw = input_spec.get("nPerm")
        n_perm = None if n_perm_raw is None else int(n_perm_raw)
        if n_perm is not None and n_perm <= 0:
            raise ValueError("nPerm must be positive when provided")

        points_value = input_spec.get("points")
        distance_value = input_spec.get("distanceMatrix")
        if points_value is None and distance_value is None:
            raise ValueError("Ripser requires points or distanceMatrix")
        if points_value is not None and distance_value is not None:
            raise ValueError("provide either points or distanceMatrix, not both")

        distance_matrix = distance_value is not None
        if distance_matrix:
            if n_perm is not None:
                raise ValueError("nPerm is not supported with distanceMatrix mode")
            data = validate_distance_matrix(distance_value, MAX_POINTS_RIPSER)
        else:
            data = validate_points(points_value, MAX_POINTS_RIPSER)
            if n_perm is not None and n_perm > data.shape[0]:
                raise ValueError("nPerm cannot exceed the number of points")

        result = ripser_package.ripser(
            data,
            maxdim=max_dim,
            thresh=threshold,
            coeff=coeff,
            distance_matrix=distance_matrix,
            do_cocycles=do_cocycles,
            metric=metric,
            n_perm=n_perm,
        )
        grouped = rows_by_dimension(result.get("dgms", []), max_dim)
        betti = essential_betti(grouped, max_dim)
        approximation = {
            "inputMode": "distanceMatrix" if distance_matrix else "points",
            "inputShape": list(data.shape),
            "maxEdgeLength": threshold if math.isfinite(threshold) else None,
            "metric": metric,
            "nPerm": n_perm,
            "rCover": float(result.get("r_cover", 0.0)),
            "idxPerm": [int(x) for x in np.asarray(result.get("idx_perm", []), dtype=int).tolist()],
            "numEdges": int(result.get("num_edges", 0)),
            "fastPath": True,
        }
        representation = common_topology_representation(
            backend=f"Ripser.py {getattr(ripser_package, '__version__', 'unknown')}",
            complex_kind="rips",
            coefficient_field=coeff,
            max_dim=max_dim,
            betti_numbers=betti,
            grouped_intervals=grouped,
            approximation_metadata=approximation,
            source_refs=source_revision_refs(input_spec),
            diagnostics={
                "intervalCounts": interval_counts(grouped),
                "terminalBettiInterpretation": "Essential bars at the chosen filtration end / threshold",
            },
            persistent_betti=None,
        )
        if do_cocycles:
            cocycles = result.get("cocycles", [])
            representation["representativeCocycles"] = [
                [np.asarray(c, dtype=float).tolist() for c in dim_cycles[:64]]
                for dim_cycles in cocycles[: max_dim + 1]
            ]

        env = environment_fingerprint(environment)
        inputs_hash = sha256_json({"adapter": self.name, "inputSpec": input_spec})
        env_hash = sha256_json(env)
        repro_hash = sha256_json(
            {
                "adapter": self.name,
                "version": self.version,
                "inputsHash": inputs_hash,
                "environmentHash": env_hash,
                "representation": representation,
            }
        )
        evidence = EvidenceRecord(
            id=f"ev-{self.name}-{inputs_hash[:12]}",
            grade="NUMERICAL INDICATOR",
            claimRef=str(input_spec.get("claimRef", "claim:finite-rips-persistence")),
            method=f"Ripser.py {getattr(ripser_package, '__version__', 'unknown')} Vietoris-Rips persistence",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={
                "numEdges": int(result.get("num_edges", 0)),
                "rCover": float(result.get("r_cover", 0.0)),
            },
            errorBounds=None,
            assumptions=[
                "finite point cloud or finite distance matrix",
                "chosen metric, threshold and coefficient field are part of the result scope",
                "fast persistence output does not establish topological equivalence of the original continuum objects",
            ],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=source_revision_refs(input_spec),
            stale=False,
            scope="finite Vietoris-Rips persistent homology only",
        )
        diagnostics = [
            Diagnostic(
                level="warning",
                code="RIPS_SCOPE_FINITE",
                message="Ripser computes persistence of the finite metric sample and selected filtration, not a theorem about the original unsampled space.",
            )
        ]
        if n_perm is not None:
            diagnostics.append(
                Diagnostic(
                    level="warning",
                    code="RIPS_SUBSAMPLED",
                    message="Greedy-permutation subsampling is active; rCover is recorded in approximation metadata.",
                )
            )
        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=diagnostics,
            residuals={
                "numEdges": int(result.get("num_edges", 0)),
                "rCover": float(result.get("r_cover", 0.0)),
            },
            errorBounds=None,
            provenanceEdges=[
                {"relation": "computedBy", "from": "TopologySpec", "to": self.name},
                {"relation": "fastPathFor", "from": self.name, "to": "topology.gudhi.v1"},
            ],
            reproducibilityHash=repro_hash,
            environment=env,
        )
