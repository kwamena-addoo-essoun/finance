from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request as _Request


def _get_real_ip(request: _Request) -> str:
    """
    Extract the real client IP from X-Forwarded-For when running behind
    the Caddy reverse proxy.  Caddy unconditionally overwrites this header,
    so the leftmost value is trustworthy.
    """
    xff = request.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


# Single shared limiter instance — imported by main.py and route modules.
limiter = Limiter(key_func=_get_real_ip)
