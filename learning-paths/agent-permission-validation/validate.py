"""A deterministic permission simulator. No requested operation is executed."""
import json
import sys
from pathlib import Path


def decide(request):
    # Exact resource identity: no glob, prefix, normalization, or caller-supplied policy.
    return "allow" if request.get("operation") == "read" and request.get("resource") == "reports/summary.txt" else "deny"


def simulate(requests):
    return [{"request_id": r["id"], "decision": decide(r), "policy_version": "1.0", "operation_executed": False} for r in requests]


def verify(requests, events):
    ids = [r["id"] for r in requests]
    if len(ids) != len(set(ids)) or [e.get("request_id") for e in events] != ids:
        raise ValueError("Incomplete, duplicate, or out-of-order audit events")
    for request, event in zip(requests, events):
        if event.get("decision") != request["expected"] or event.get("policy_version") != "1.0" or event.get("operation_executed") is not False:
            raise ValueError("Permission or observation boundary mismatch")


if __name__ == "__main__":
    requests = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    events = simulate(requests)
    verify(requests, events)
    negative_checks = 0
    for bad in [events[:-1], [dict(e, decision="allow") for e in events]]:
        try:
            verify(requests, bad)
        except ValueError:
            negative_checks += 1
        else:
            raise AssertionError("Negative control was accepted")
    print(json.dumps({"allowed_ids": [e["request_id"] for e in events if e["decision"] == "allow"], "denied": sum(e["decision"] == "deny" for e in events), "events_observed": len(events), "negative_controls_rejected": negative_checks}, sort_keys=True))
    if "--events" in sys.argv:
        print(json.dumps(events, indent=2))
