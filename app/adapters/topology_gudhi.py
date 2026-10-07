from __future__ import annotations

import math
from typing import Any

import gudhi
import numpy as np

from app.adapters.base import Adapter
from app.adapters.topology_common import (
    MAX_CUBICAL_VALUES,
    MAX_EXPLICIT_SIMPLICES,
    MAX_POINTS_GUDHI,
    common_topology_representation,
    interval_counts,
    interval_rows,
    pad_betti,
    rows_by_dimension,
    source_revision_refs,
    validate_distance_matrix,
    validate_max_dim,
    validate_points,
    validate_prime,
)
from app.models import AdapterResult, Diagnostic, EvidenceRecord
from app.provenance import environment_fingerprint, sha256_json, utc_now


class GUDHITopologyAdapter(Adapter):
    name = "topology.gudhi.v1"
    version = "0.1.0"

    def _simplex_result(
        self,
        input_spec: dict[str, Any],
        coeff: int,
        max_dim: int,
        min_persistence: float,
    ) -> tuple[dict[str, Any], dict[int, np.ndarray]]:
        simplices = input_spec.get("simplices")
        if not isinstance(simplices, list) or not simplices:
            raise ValueError("simplex mode requires non-empty simplices")
        if len(simplices) > MAX_EXPLICIT_SIMPLICES:
            raise ValueError(f"simplices exceeds adapter limit ({MAX_EXPLICIT_SIMPLICES})")

        st = gudhi.SimplexTree()
        for entry in simplices:
            if isinstance(entry, dict):
                vertices = entry.get("vertices")
                filtration = float(entry.get("filtration", 0.0))
            else:
                vertices = entry
                filtration = 0.0
            if not isinstance(vertices, list) or not vertices:
                raise ValueError("each simplex must provide a non-empty vertices list")
            st.insert([int(v) for v in vertices], filtration=filtration)
        st.make_filtration_non_decreasing()
        st.compute_persistence(
            homology_coeff_field=coeff,
            min_persistence=min_persistence,
            persistence_dim_max=True,
        )
        raw = {d: np.asarray(st.persistence_intervals_in_dimension(d), dtype=float) for d in range(max_dim + 1)}
        grouped = {f"H{d}": interval_rows(raw[d], d) for d in range(max_dim + 1)}
        persistent_betti = None
        query = input_spec.get("bettiQuery")
        if isinstance(query, dict):
            persistent_betti = [
                int(x)
                for x in st.persistent_betti_numbers(
                    float(query.get("from", 0.0)),
                    float(query.get("to", 0.0)),
                )[: max_dim + 1]
            ]
        rep = common_topology_representation(
            backend=f"GUDHI {getattr(gudhi, '__version__', 'unknown')}",
            complex_kind="simplex",
            coefficient_field=coeff,
            max_dim=max_dim,
            betti_numbers=pad_betti(st.betti_numbers(), max_dim),
            grouped_intervals=grouped,
            approximation_metadata={
                "filteredComplex": "SimplexTree",
                "filtrationAdjustedNonDecreasing": True,
                "inputSimplexCount": len(simplices),
            },
            source_refs=source_revision_refs(input_spec),
            diagnostics={
                "complexDimension": int(st.dimension()),
                "numSimplices": int(st.num_simplices()),
                "intervalCounts": interval_counts(grouped),
            },
            persistent_betti=persistent_betti,
        )
        return rep, raw

    def _cubical_result(
        self,
        input_spec: dict[str, Any],
        coeff: int,
        max_dim: int,
        min_persistence: float,
    ) -> tuple[dict[str, Any], dict[int, np.ndarray]]:
        vertices = input_spec.get("vertices")
        top_cells = input_spec.get("topDimensionalCells")
        if vertices is None and top_cells is None:
            raise ValueError("cubical mode requires vertices or topDimensionalCells")
        data = np.asarray(vertices if vertices is not None else top_cells, dtype=float)
        if data.ndim < 1 or data.ndim > 3:
            raise ValueError("cubical input must have dimension 1, 2, or 3")
        if data.size > MAX_CUBICAL_VALUES:
            raise ValueError(f"cubical input exceeds adapter limit ({MAX_CUBICAL_VALUES} values)")
        if not np.all(np.isfinite(data)):
            raise ValueError("cubical filtration values must be finite")

        if vertices is not None:
            complex_ = gudhi.CubicalComplex(vertices=data)
            construction = "vertices"
        else:
            complex_ = gudhi.CubicalComplex(top_dimensional_cells=data)
            construction = "topDimensionalCells"

        complex_.compute_persistence(homology_coeff_field=coeff, min_persistence=min_persistence)
        raw = {
            d: np.asarray(complex_.persistence_intervals_in_dimension(d), dtype=float)
            for d in range(max_dim + 1)
        }
        grouped = {f"H{d}": interval_rows(raw[d], d) for d in range(max_dim + 1)}
        persistent_betti = None
        query = input_spec.get("bettiQuery")
        if isinstance(query, dict):
            persistent_betti = [
                int(x)
                for x in complex_.persistent_betti_numbers(
                    float(query.get("from", 0.0)),
                    float(query.get("to", 0.0)),
                )[: max_dim + 1]
            ]
        rep = common_topology_representation(
            backend=f"GUDHI {getattr(gudhi, '__version__', 'unknown')}",
            complex_kind="cubical",
            coefficient_field=coeff,
            max_dim=max_dim,
            betti_numbers=pad_betti(complex_.betti_numbers(), max_dim),
            grouped_intervals=grouped,
            approximation_metadata={
                "construction": construction,
                "shape": list(data.shape),
                "filtration": "cubical sublevel filtration",
            },
            source_refs=source_revision_refs(input_spec),
            diagnostics={
                "complexDimension": int(complex_.dimension()),
                "numCells": int(complex_.num_simplices()),
                "intervalCounts": interval_counts(grouped),
                "bettiCaveat": "Final CubicalComplex Betti numbers describe the completed finite cubical domain; persistent intervals carry sublevel-set topology.",
            },
            persistent_betti=persistent_betti,
        )
        return rep, raw

    def _rips_result(
        self,
        input_spec: dict[str, Any],
        coeff: int,
        max_dim: int,
        min_persistence: float,
        *,
        points_key: str = "points",
        distance_key: str = "distanceMatrix",
    ) -> tuple[dict[str, Any], dict[int, np.ndarray]]:
        points_value = input_spec.get(points_key)
        distance_value = input_spec.get(distance_key)
        if points_value is None and distance_value is None:
            raise ValueError("rips mode requires points or distanceMatrix")

        max_edge = float(input_spec.get("maxEdgeLength", math.inf))
        if max_edge <= 0:
            raise ValueError("maxEdgeLength must be positive")
        sparse = input_spec.get("sparse")
        sparse_value = None if sparse is None else float(sparse)
        if sparse_value is not None and not (0.0 < sparse_value < 1.0):
            raise ValueError("sparse must be between 0 and 1 when provided")
        if sparse_value is not None and hasattr(gudhi, "set_seed"):
            gudhi.set_seed(int(input_spec.get("seed", 0)))

        if points_value is not None:
            points = validate_points(points_value, MAX_POINTS_GUDHI)
            rc = gudhi.RipsComplex(points=points, max_edge_length=max_edge, sparse=sparse_value)
            input_shape = list(points.shape)
            input_mode = "points"
        else:
            matrix = validate_distance_matrix(distance_value, MAX_POINTS_GUDHI)
            rc = gudhi.RipsComplex(distance_matrix=matrix, max_edge_length=max_edge, sparse=sparse_value)
            input_shape = list(matrix.shape)
            input_mode = "distanceMatrix"

        st = rc.create_simplex_tree(max_dimension=max_dim + 1)
        st.compute_persistence(
            homology_coeff_field=coeff,
            min_persistence=min_persistence,
            persistence_dim_max=True,
        )
        raw = {d: np.asarray(st.persistence_intervals_in_dimension(d), dtype=float) for d in range(max_dim + 1)}
        grouped = {f"H{d}": interval_rows(raw[d], d) for d in range(max_dim + 1)}
        persistent_betti = None
        query = input_spec.get("bettiQuery")
        if isinstance(query, dict):
            persistent_betti = [
                int(x)
                for x in st.persistent_betti_numbers(
                    float(query.get("from", 0.0)),
                    float(query.get("to", 0.0)),
                )[: max_dim + 1]
            ]
        rep = common_topology_representation(
            backend=f"GUDHI {getattr(gudhi, '__version__', 'unknown')}",
            complex_kind="rips",
            coefficient_field=coeff,
            max_dim=max_dim,
            betti_numbers=pad_betti(st.betti_numbers(), max_dim),
            grouped_intervals=grouped,
            approximation_metadata={
                "inputMode": input_mode,
                "inputShape": input_shape,
                "maxEdgeLength": max_edge if math.isfinite(max_edge) else None,
                "sparse": sparse_value,
                "seed": int(input_spec.get("seed", 0)) if sparse_value is not None else None,
                "simplexExpansionDimension": max_dim + 1,
            },
            source_refs=source_revision_refs(input_spec),
            diagnostics={
                "complexDimension": int(st.dimension()),
                "numSimplices": int(st.num_simplices()),
                "numVertices": int(st.num_vertices()),
                "intervalCounts": interval_counts(grouped),
            },
            persistent_betti=persistent_betti,
        )
        return rep, raw

    def _compare_rips(
        self,
        input_spec: dict[str, Any],
        coeff: int,
        max_dim: int,
        min_persistence: float,
    ) -> dict[str, Any]:
        points_a = validate_points(input_spec.get("pointsA"), MAX_POINTS_GUDHI)
        points_b = validate_points(input_spec.get("pointsB"), MAX_POINTS_GUDHI)
        common = {
            "maxEdgeLength": input_spec.get("maxEdgeLength", math.inf),
            "sparse": input_spec.get("sparse"),
            "seed": input_spec.get("seed", 0),
        }
        spec_a = {**common, "points": points_a.tolist(), "sourceRevisionRefs": input_spec.get("sourceRevisionRefsA", [])}
        spec_b = {**common, "points": points_b.tolist(), "sourceRevisionRefs": input_spec.get("sourceRevisionRefsB", [])}
        rep_a, raw_a = self._rips_result(spec_a, coeff, max_dim, min_persistence)
        rep_b, raw_b = self._rips_result(spec_b, coeff, max_dim, min_persistence)

        distances = []
        for d in range(max_dim + 1):
            a = raw_a[d].reshape((-1, 2)) if raw_a[d].size else np.empty((0, 2))
            b = raw_b[d].reshape((-1, 2)) if raw_b[d].size else np.empty((0, 2))
            distances.append(
                {
                    "dimension": d,
                    "bottleneckDistance": float(gudhi.bottleneck_distance(a, b)),
                }
            )
        betti_a = {x["dimension"]: x["value"] for x in rep_a["bettiNumbers"]}
        betti_b = {x["dimension"]: x["value"] for x in rep_b["bettiNumbers"]}
        return {
            "type": "TopologyComparisonSpec",
            "backend": f"GUDHI {getattr(gudhi, '__version__', 'unknown')}",
            "complexKind": "rips",
            "source": rep_a,
            "representation": rep_b,
            "bottleneckDistanceByDimension": distances,
            "bettiDelta": [
                {"dimension": d, "source": betti_a.get(d, 0), "representation": betti_b.get(d, 0), "delta": betti_b.get(d, 0) - betti_a.get(d, 0)}
                for d in range(max_dim + 1)
            ],
            "topologyEquivalenceStatus": "NOT ESTABLISHED",
            "interpretation": "Persistence-diagram similarity under the selected finite sampling, metric and filtration is evidence about these filtered complexes, not a homeomorphism or homotopy-equivalence proof.",
            "scope": "finite sampled pre/post representation comparison",
        }

    def run(self, input_spec: dict[str, Any], environment: dict[str, Any]) -> AdapterResult:
        coeff = validate_prime(input_spec.get("coefficientField", 2))
        max_dim = validate_max_dim(input_spec.get("maxHomologyDimension", 1))
        min_persistence = float(input_spec.get("minPersistence", 0.0))
        operation = str(input_spec.get("operation", "compute"))

        if operation == "compareRipsPointClouds":
            representation = self._compare_rips(input_spec, coeff, max_dim, min_persistence)
            complex_kind = "rips-comparison"
        else:
            complex_kind = str(input_spec.get("complexKind", "rips")).lower()
            if complex_kind == "rips":
                representation, _ = self._rips_result(input_spec, coeff, max_dim, min_persistence)
            elif complex_kind == "cubical":
                representation, _ = self._cubical_result(input_spec, coeff, max_dim, min_persistence)
            elif complex_kind == "simplex":
                representation, _ = self._simplex_result(input_spec, coeff, max_dim, min_persistence)
            else:
                raise ValueError("complexKind must be rips, cubical, or simplex")

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
            claimRef=str(input_spec.get("claimRef", "claim:finite-computational-topology")),
            method=f"GUDHI {getattr(gudhi, '__version__', 'unknown')} persistent homology",
            inputsHash=inputs_hash,
            environmentHash=env_hash,
            residuals={
                "operation": operation,
                "complexKind": complex_kind,
            },
            errorBounds=None,
            assumptions=[
                "finite filtered complex or sampled point cloud",
                "chosen coefficient field and filtration are part of the claim scope",
                "persistence similarity does not establish topological equivalence of the original mathematical objects",
            ],
            generatedAt=utc_now(),
            adapterVersion=self.version,
            upstreamRevisions=source_revision_refs(input_spec),
            stale=False,
            scope="finite computational topology / persistent homology only",
        )
        diagnostics = [
            Diagnostic(
                level="warning",
                code="TOPOLOGY_SCOPE_FINITE",
                message="Persistent homology is computed for the supplied finite filtered complex or sample; it does not by itself prove topology of an unsampled continuum object.",
            )
        ]
        return AdapterResult(
            adapter=self.name,
            adapterVersion=self.version,
            status="completed",
            outputRepresentations=[representation],
            evidenceRecords=[evidence],
            diagnostics=diagnostics,
            residuals={"operation": operation, "complexKind": complex_kind},
            errorBounds=None,
            provenanceEdges=[
                {"relation": "computedBy", "from": "TopologySpec", "to": self.name},
                {"relation": "supportsButDoesNotProveEquivalence", "from": "PersistenceResult", "to": "TopologyClaim"},
            ],
            reproducibilityHash=repro_hash,
            environment=env,
        )
