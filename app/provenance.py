from __future__ import annotations

import hashlib
import json
import platform
from datetime import datetime, timezone
import sys
from typing import Any

import numpy as np
import scipy
import mpmath

APP_VERSION = "0.3.1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_json(value: Any) -> str:
    return hashlib.sha256(canonical_json(value).encode("utf-8")).hexdigest()


def environment_fingerprint(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    env = {
        "app": "MathScopeCompute",
        "appVersion": APP_VERSION,
        "python": sys.version.split()[0],
        "platform": platform.platform(),
        "numpy": np.__version__,
        "scipy": scipy.__version__,
        "mpmath": mpmath.__version__,
    }
    try:
        import gudhi

        env["gudhi"] = getattr(gudhi, "__version__", "unknown")
    except Exception:
        env["gudhi"] = None
    try:
        import ripser as ripser_package

        env["ripser"] = getattr(ripser_package, "__version__", "unknown")
    except Exception:
        env["ripser"] = None
    if extra:
        env["requestEnvironment"] = extra
    return env
