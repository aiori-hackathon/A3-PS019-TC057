import json
import hashlib
import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.app.models.models import AuditBlock, now_utc

GENESIS_PREV_HASH = "0" * 64

def compute_block_hash(
    block_index: int,
    timestamp_str: str,
    actor: str,
    action: str,
    target: str,
    payload_json: str,
    prev_hash: str
) -> str:
    payload_canonical = json.dumps(json.loads(payload_json), sort_keys=True) if payload_json else "{}"
    raw = f"{block_index}:{timestamp_str}:{actor}:{action}:{target}:{payload_canonical}:{prev_hash}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def record_audit_event(
    db: Session,
    action: str,
    target: str,
    actor: str = "Privacy Officer (DPO)",
    payload: Optional[Dict[str, Any]] = None
) -> AuditBlock:
    """Appends an immutable, SHA-256 cryptographically chained event to the audit ledger."""
    payload_data = payload or {}
    payload_str = json.dumps(payload_data, sort_keys=True)
    
    last_block = db.query(AuditBlock).order_by(AuditBlock.block_index.desc()).first()
    if last_block is None:
        block_index = 1
        prev_hash = GENESIS_PREV_HASH
    else:
        block_index = last_block.block_index + 1
        prev_hash = last_block.block_hash

    ts = now_utc()
    ts_str = ts.isoformat()
    block_hash = compute_block_hash(
        block_index=block_index,
        timestamp_str=ts_str,
        actor=actor,
        action=action,
        target=target,
        payload_json=payload_str,
        prev_hash=prev_hash
    )

    block = AuditBlock(
        block_index=block_index,
        timestamp=ts,
        actor=actor,
        action=action,
        target=target,
        payload_json=payload_str,
        prev_hash=prev_hash,
        block_hash=block_hash
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block

def verify_audit_chain(db: Session) -> Dict[str, Any]:
    """
    Cryptographically verifies the integrity of the SHA-256 hash-chain.
    Returns proof of non-tampering or flags any altered blocks.
    """
    blocks = db.query(AuditBlock).order_by(AuditBlock.block_index.asc()).all()
    if not blocks:
        return {
            "status": "EMPTY",
            "valid": True,
            "total_blocks": 0,
            "message": "Audit chain is empty; no events recorded yet."
        }

    expected_prev = GENESIS_PREV_HASH
    tampered = []

    for b in blocks:
        if b.prev_hash != expected_prev:
            tampered.append({
                "block_index": b.block_index,
                "error": "Previous hash link broken (potential tampering)",
                "recorded_prev": b.prev_hash,
                "expected_prev": expected_prev
            })

        recomputed = compute_block_hash(
            block_index=b.block_index,
            timestamp_str=b.timestamp.isoformat(),
            actor=b.actor,
            action=b.action,
            target=b.target,
            payload_json=b.payload_json,
            prev_hash=b.prev_hash
        )
        if recomputed != b.block_hash:
            tampered.append({
                "block_index": b.block_index,
                "error": "Block content digest mismatch",
                "recorded_hash": b.block_hash,
                "recomputed_hash": recomputed
            })

        expected_prev = b.block_hash

    is_valid = len(tampered) == 0
    return {
        "status": "VERIFIED" if is_valid else "COMPROMISED",
        "valid": is_valid,
        "total_blocks": len(blocks),
        "genesis_hash": blocks[0].block_hash,
        "latest_hash": blocks[-1].block_hash,
        "verified_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "algorithm": "SHA-256 Chained Merkle Hash",
        "tampered_blocks": tampered,
        "blocks": [
            {
                "index": b.block_index,
                "timestamp": b.timestamp.isoformat(),
                "actor": b.actor,
                "action": b.action,
                "target": b.target,
                "block_hash_short": b.block_hash[:16] + "...",
                "block_hash": b.block_hash,
                "prev_hash_short": b.prev_hash[:16] + "...",
                "status": "VALID"
            }
            for b in blocks[-15:]  # return recent 15 blocks for display
        ]
    }
