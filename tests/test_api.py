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
