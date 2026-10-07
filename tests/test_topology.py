import math

from app.adapters.topology_gudhi import GUDHITopologyAdapter
from app.adapters.topology_ripser import RipserTopologyAdapter


def _betti(rep):
    return {row["dimension"]: row["value"] for row in rep["bettiNumbers"]}


def test_gudhi_explicit_square_cycle_has_h1():
    result = GUDHITopologyAdapter().run(
        {
            "complexKind": "simplex",
            "coefficientField": 2,
            "maxHomologyDimension": 1,
            "minPersistence": -1.0,
            "simplices": [
                {"vertices": [0], "filtration": 0.0},
                {"vertices": [1], "filtration": 0.0},
                {"vertices": [2], "filtration": 0.0},
                {"vertices": [3], "filtration": 0.0},
                {"vertices": [0, 1], "filtration": 0.0},
                {"vertices": [1, 2], "filtration": 0.0},
                {"vertices": [2, 3], "filtration": 0.0},
                {"vertices": [3, 0], "filtration": 0.0},
            ],
        },
        {"test": True},
    )
    rep = result.outputRepresentations[0]
    assert _betti(rep)[0] == 1
    assert _betti(rep)[1] == 1
    assert rep["topologyEquivalenceStatus"] == "NOT ESTABLISHED"


def test_gudhi_rips_square_loop_has_h1():
    result = GUDHITopologyAdapter().run(
        {
            "complexKind": "rips",
            "points": [[0, 0], [1, 0], [1, 1], [0, 1]],
            "coefficientField": 2,
            "maxHomologyDimension": 1,
            "maxEdgeLength": 1.1,
        },
        {"test": True},
    )
    rep = result.outputRepresentations[0]
    assert _betti(rep)[0] == 1
    assert _betti(rep)[1] == 1
    assert rep["complexKind"] == "rips"


def test_gudhi_cubical_lower_star_runs_and_records_intervals():
    vertices = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 10, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ]
    result = GUDHITopologyAdapter().run(
        {
            "complexKind": "cubical",
            "vertices": vertices,
            "coefficientField": 2,
            "maxHomologyDimension": 2,
            "minPersistence": -1.0,
        },
        {"test": True},
    )
    rep = result.outputRepresentations[0]
    assert rep["complexKind"] == "cubical"
    assert "H0" in rep["persistenceIntervals"]
    assert "H1" in rep["persistenceIntervals"]
    assert rep["approximationMetadata"]["shape"] == [5, 5]


def test_ripser_fast_square_loop_has_essential_h1():
    result = RipserTopologyAdapter().run(
        {
            "points": [[0, 0], [1, 0], [1, 1], [0, 1]],
            "coefficientField": 2,
            "maxHomologyDimension": 1,
            "maxEdgeLength": 1.1,
        },
        {"test": True},
    )
    rep = result.outputRepresentations[0]
    assert _betti(rep)[0] == 1
    assert _betti(rep)[1] == 1
    assert rep["approximationMetadata"]["fastPath"] is True


def test_gudhi_compare_never_promotes_equivalence():
    result = GUDHITopologyAdapter().run(
        {
            "operation": "compareRipsPointClouds",
            "pointsA": [[0, 0], [1, 0], [1, 1], [0, 1]],
            "pointsB": [[0, 0], [1.1, 0], [1.1, 1.1], [0, 1.1]],
            "coefficientField": 2,
            "maxHomologyDimension": 1,
            "maxEdgeLength": 1.2,
        },
        {"test": True},
    )
    rep = result.outputRepresentations[0]
    assert rep["type"] == "TopologyComparisonSpec"
    assert rep["topologyEquivalenceStatus"] == "NOT ESTABLISHED"
    assert len(rep["bottleneckDistanceByDimension"]) == 2
    assert all(math.isfinite(row["bottleneckDistance"]) for row in rep["bottleneckDistanceByDimension"])
