from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.agent_engine import ComplianceAgentEngine

client = TestClient(app)


def test_agent_direct_engine():
    engine = ComplianceAgentEngine()
    result = engine.run("Which tables have Aadhaar with no retention?")
    assert "thought_process" in result
    assert len(result["thought_process"]) > 0
    assert "answer_markdown" in result
    assert "statutory_citations" in result
    assert any("Section 8(7)" in c for c in result["statutory_citations"])
    assert result["agent_metadata"]["mode"] == "Autonomous Keyless ReAct Engine"


def test_agent_chat_endpoint_aadhaar():
    resp = client.post("/api/agent/chat", json={"message": "Which tables have Aadhaar with no retention?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "thought_process" in data
    assert "answer_markdown" in data
    assert "suggested_actions" in data
    assert len(data["suggested_actions"]) > 0


def test_agent_chat_endpoint_penalty():
    resp = client.post("/api/agent/chat", json={"message": "What is our Section 33 penalty exposure?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "Section 33" in data["answer_markdown"]
    assert any("Section 33" in c for c in data["statutory_citations"])


def test_agent_chat_empty_prompt():
    resp = client.post("/api/agent/chat", json={"message": ""})
    assert resp.status_code == 400


def test_agent_action_apply_notice():
    resp = client.post("/api/agent/action", json={
        "action": "apply_notice",
        "params": {
            "column_name": "test_py_col",
            "dataset_name": "enterprise.db",
            "purpose": "Unit testing lawful processing",
            "retention": "2 years"
        }
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "test_py_col" in data["message"]
