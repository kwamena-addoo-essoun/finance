"""
Finsight Audit Logger
=====================
Records security-relevant events to a structured log stream.
In production, configure the `finsight.audit` logger to ship to your
SIEM / log aggregator (e.g. CloudWatch, Datadog, Splunk).

The FTC Safeguards Rule (16 CFR Part 314) requires audit trails for
access to customer financial information.
"""
import json
import logging
from datetime import datetime, timezone
from typing import Any

audit_logger = logging.getLogger("finsight.audit")

# Ensure the audit log always reaches the handler even if root logger is quiet.
if not audit_logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(message)s"))
    audit_logger.addHandler(_handler)
    audit_logger.setLevel(logging.INFO)
    audit_logger.propagate = False


def audit_log(
    event: str,
    user_id: int | None = None,
    ip: str | None = None,
    **details: Any,
) -> None:
    """
    Emit a structured JSON audit record.

    Parameters
    ----------
    event   : short identifier, e.g. "user_login_success"
    user_id : authenticated user ID (None for unauthenticated events)
    ip      : client IP address
    details : any extra key/value pairs to include
    """
    record: dict[str, Any] = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "event": event,
        "user_id": user_id,
        "ip": ip,
    }
    record.update(details)
    audit_logger.info(json.dumps(record, default=str))
