from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_api_datasets_list():
    response = client.get("/api/datasets")
    assert response.status_code == 200
    datasets = response.json()
    assert isinstance(datasets, list)

def test_api_dashboard_metrics():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_datasets" in data
    assert "class_counts" in data
    assert "confidence_distribution" in data

def test_api_scan_and_inventory_flow():
    # Fetch existing datasets
    ds_resp = client.get("/api/datasets")
    assert ds_resp.status_code == 200
    datasets = ds_resp.json()
    assert len(datasets) > 0

    target_ds = datasets[0]
    # Trigger scan
    scan_resp = client.post("/api/scans", json={"dataset_id": target_ds["id"]})
    assert scan_resp.status_code == 200
    scan_data = scan_resp.json()
    assert scan_data["status"] == "COMPLETED"

    # Check inventory
    inv_resp = client.get("/api/inventory")
    assert inv_resp.status_code == 200
    inv = inv_resp.json()
    assert len(inv) > 0

    # Test review update
    record_id = inv[0]["id"]
    patch_resp = client.patch(
        f"/api/inventory/{record_id}/review",
        json={"review_status": "CONFIRMED", "reviewer_notes": "Verified by security lead"}
    )
    assert patch_resp.status_code == 200
    updated_rec = patch_resp.json()
    assert updated_rec["review_status"] == "CONFIRMED"
    assert updated_rec["reviewer_notes"] == "Verified by security lead"

def test_api_reports_csv_and_pdf():
    # Test CSV inventory download
    csv_resp = client.get("/api/reports/inventory.csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "candidate_class" in csv_resp.text

    # Test CSV gaps download
    gaps_resp = client.get("/api/reports/gaps.csv")
    assert gaps_resp.status_code == 200
    assert "text/csv" in gaps_resp.headers["content-type"]

    # Test PDF download
    pdf_resp = client.get("/api/reports/inventory.pdf")
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers["content-type"]
    assert pdf_resp.content.startswith(b"%PDF")

    # Test DPDP PDF download
    dpdp_pdf_resp = client.get("/api/reports/dpdp.pdf")
    assert dpdp_pdf_resp.status_code == 200
    assert "application/pdf" in dpdp_pdf_resp.headers["content-type"]
    assert dpdp_pdf_resp.content.startswith(b"%PDF")

def test_api_scan_all_and_batch_review():
    # 1. Test 1-click scan all
    resp = client.post("/api/scans/scan-all")
    assert resp.status_code == 200
    data = resp.json()
    assert "scans_completed" in data
    assert data["scans_completed"] >= 1
    assert "total_candidates_found" in data

    # 2. Test batch review
    batch_resp = client.post("/api/inventory/batch-review", json={
        "min_confidence": 0.85,
        "target_status": "CONFIRMED",
        "reviewer_notes": "High confidence batch confirmation"
    })
    assert batch_resp.status_code == 200
    b_data = batch_resp.json()
    assert "updated_count" in b_data
    assert b_data["target_status"] == "CONFIRMED"

def test_api_demo_reset():
    resp = client.post("/api/demo/reset")
    assert resp.status_code == 200
    assert "successfully" in resp.json()["message"]
