from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_unknown_adapter_is_404():
    response = client.post(
        "/v1/run",
        json={"adapter": "missing.v1", "inputSpec": {}, "environment": {}},
    )
    assert response.status_code == 404


def test_run_returns_job_metadata():
    response = client.post(
        "/v1/run",
        json={
            "adapter": "ode.ivp.v1",
            "inputSpec": {"model": "linear_scalar", "t0": 0, "t1": 0.2, "y0": 1.0, "samples": 20},
            "environment": {"test": True},
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["jobId"]
    assert data["startedAt"]
    assert data["completedAt"]
    assert data["elapsedMs"] is not None
    assert data["logs"]
