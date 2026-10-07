from __future__ import annotations

import hashlib
import json
import platform
import sys
from typing import Any

import numpy as np
import scipy

APP_VERSION = "0.1.0"


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
    }
    if extra:
        env["requestEnvironment"] = extra
    return env
