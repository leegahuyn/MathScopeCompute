from __future__ import annotations

import math
from typing import Any, Iterable

import numpy as np

SUPPORTED_MAX_HOMOLOGY_DIM = 2
MAX_POINTS_GUDHI = 320
MAX_POINTS_RIPSER = 2500
MAX_CUBICAL_VALUES = 200_000
MAX_EXPLICIT_SIMPLICES = 50_000


def validate_prime(value: Any) -> int:
    p = int(value if value is not None else 2)
    if p < 2 or p > 46337:
        raise ValueError("coefficientField must be a prime integer between 2 and 46337")
    if any(p % q == 0 for q in range(2, int(math.sqrt(p)) + 1)):
        raise ValueError("coefficientField must be prime")
    return p


def validate_max_dim(value: Any) -> int:
    d = int(value if value is not None else 1)
    if d < 0 or d > SUPPORTED_MAX_HOMOLOGY_DIM:
        raise ValueError(f"maxHomologyDimension must be between 0 and {SUPPORTED_MAX_HOMOLOGY_DIM}")
    return d


def finite_number_or_none(value: Any) -> float | None:
    x = float(value)
    return x if math.isfinite(x) else None


def interval_rows(array: Any, dimension: int) -> list[dict[str, Any]]:
    a = np.asarray(array, dtype=float)
    if a.size == 0:
        return []
    a = a.reshape((-1, 2))
    out = []
    for birth, death in a:
        finite_death = math.isfinite(float(death))
        out.append(
            {
                "dimension": int(dimension),
                "birth": float(birth),
                "death": float(death) if finite_death else None,
                "essential": not finite_death,
                "persistence": float(death - birth) if finite_death else None,
            }
        )
    return out


def rows_by_dimension(diagrams: Iterable[Any], max_dim: int) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    diagrams_list = list(diagrams)
    for dim in range(max_dim + 1):
        arr = diagrams_list[dim] if dim < len(diagrams_list) else np.empty((0, 2))
        result[f"H{dim}"] = interval_rows(arr, dim)
    return result


def flatten_rows(grouped: dict[str, list[dict[str, Any]]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for key in sorted(grouped):
        out.extend(grouped[key])
    return out


def pad_betti(values: Iterable[Any], max_dim: int) -> list[dict[str, int]]:
    raw = [int(v) for v in values]
    return [{"dimension": d, "value": raw[d] if d < len(raw) else 0} for d in range(max_dim + 1)]


def essential_betti(grouped: dict[str, list[dict[str, Any]]], max_dim: int) -> list[dict[str, int]]:
    return [
        {
            "dimension": d,
            "value": sum(1 for row in grouped.get(f"H{d}", []) if row["essential"]),
        }
        for d in range(max_dim + 1)
    ]


def validate_points(value: Any, max_points: int) -> np.ndarray:
    points = np.asarray(value, dtype=float)
    if points.ndim != 2 or points.shape[0] < 2 or points.shape[1] < 1:
        raise ValueError("points must be a 2D array with at least two points")
    if points.shape[0] > max_points:
        raise ValueError(f"points exceeds adapter limit ({max_points})")
    if not np.all(np.isfinite(points)):
        raise ValueError("points must contain only finite numbers")
    return points


def validate_distance_matrix(value: Any, max_points: int) -> np.ndarray:
    matrix = np.asarray(value, dtype=float)
    if matrix.ndim != 2 or matrix.shape[0] != matrix.shape[1] or matrix.shape[0] < 2:
        raise ValueError("distanceMatrix must be a square matrix")
    if matrix.shape[0] > max_points:
        raise ValueError(f"distanceMatrix exceeds adapter limit ({max_points})")
    if not np.all(np.isfinite(matrix)):
        raise ValueError("distanceMatrix must contain only finite numbers")
    if np.max(np.abs(matrix - matrix.T)) > 1e-8:
        raise ValueError("distanceMatrix must be symmetric")
    if np.min(matrix) < -1e-12:
        raise ValueError("distanceMatrix must be nonnegative")
    return matrix


def source_revision_refs(input_spec: dict[str, Any]) -> list[str]:
    refs = input_spec.get("sourceRevisionRefs", input_spec.get("upstreamRevisions", []))
    return [str(x) for x in refs] if isinstance(refs, list) else []


def interval_counts(grouped: dict[str, list[dict[str, Any]]]) -> dict[str, int]:
    return {k: len(v) for k, v in grouped.items()}


def common_topology_representation(
    *,
    backend: str,
    complex_kind: str,
    coefficient_field: int,
    max_dim: int,
    betti_numbers: list[dict[str, int]],
    grouped_intervals: dict[str, list[dict[str, Any]]],
    approximation_metadata: dict[str, Any],
    source_refs: list[str],
    diagnostics: dict[str, Any],
    persistent_betti: list[int] | None = None,
) -> dict[str, Any]:
    flat = flatten_rows(grouped_intervals)
    return {
        "type": "TopologySpec",
        "backend": backend,
        "complexKind": complex_kind,
        "coefficientField": f"Z/{coefficient_field}Z",
        "maxHomologyDimension": max_dim,
        "bettiNumbers": betti_numbers,
        "persistentBettiNumbers": persistent_betti,
        "persistenceIntervals": grouped_intervals,
        "barcode": flat,
        "persistenceDiagram": flat,
        "approximationMetadata": approximation_metadata,
        "sourceRevisionRefs": source_refs,
        "diagnostics": diagnostics,
        "topologyEquivalenceStatus": "NOT ESTABLISHED",
        "scope": "finite filtered complex / sampled computational topology",
    }
