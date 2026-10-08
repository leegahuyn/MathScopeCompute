from app.adapters.spectrum_laplacian import LaplacianSpectrumAdapter
import numpy as np


def test_finite_spectrum_stays_finite():
    result = LaplacianSpectrumAdapter().run({"gridN": 8, "k": 4}, {"test": True})
    spec = result.outputRepresentations[0]

    assert result.status == "completed"
    assert spec["mode"] == "finiteApprox"
    assert spec["exactInfinite"] is False
    assert spec["truncationN"] == 64
    assert result.evidenceRecords[0].grade == "NUMERICAL INDICATOR"


def test_spectrum_replay_hash_and_eigenvalues_are_deterministic():
    adapter = LaplacianSpectrumAdapter()
    request = {"gridN": 8, "k": 4, "upstreamRevisions": ["operator:r7"]}
    results = [adapter.run(request, {"test": True}) for _ in range(3)]
    assert len({result.reproducibilityHash for result in results}) == 1
    values = [row["value"] for row in results[0].outputRepresentations[0]["pointSpectrum"]]
    # Independent analytic eigenvalues of the finite Dirichlet difference matrix.
    expected = sorted(4 * 9**2 * (np.sin(i*np.pi/18)**2 + np.sin(j*np.pi/18)**2)
                      for i in range(1, 9) for j in range(1, 9))[:4]
    assert np.allclose(values, expected, rtol=1e-12, atol=1e-12)
    assert results[0].evidenceRecords[0].upstreamRevisions == ["operator:r7"]
