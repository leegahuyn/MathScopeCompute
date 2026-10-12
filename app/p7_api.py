"""Bounded HTTP transport for the source-bound P7 CLI (Linux runtime)."""
from __future__ import annotations

import asyncio
import importlib.util
from pathlib import Path
import sys
import threading
import tempfile

from fastapi import APIRouter, HTTPException, Request

ROOT = Path(__file__).resolve().parents[1] / "research-ide" / "mathscope-m3"
MAX_BODY_BYTES = 32 * 1024 * 1024
MAX_RUN_BYTES = 64 * 1024
MAX_SECONDS = 90
MEMORY_MIB = 384
router = APIRouter(prefix="/v1/p7", tags=["M3 P7"])
_admission = threading.Lock()
_load_lock = threading.Lock()
_cli = None


def runtime():
    global _cli
    if sys.platform == "win32":
        raise HTTPException(503, "The P7 isolated backend requires Linux resource limits")
    with _load_lock:
        if _cli is None:
            if str(ROOT) not in sys.path:
                sys.path.insert(0, str(ROOT))
            spec = importlib.util.spec_from_file_location("mathscope_p7_cli", ROOT / "cli.py")
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            _cli = module
    return _cli


@router.get("/capabilities")
def capabilities():
    cli = runtime()
    examples = []
    titles = {"zeta-2": "ζ(2)", "zeta-critical-jet": "ζ critical jet", "gamma-half": "Γ(1/2)",
              "xi-critical": "ξ critical point", "xi-removable-one": "ξ(1)",
              "zeros-to-20": "Zeros to T=20", "zeros-to-30": "Zeros to T=30",
              "elliptic-11a1": "11a1 local arithmetic", "elliptic-37a1": "37a1 local arithmetic"}
    for name, title in titles.items():
        examples.append({"id": name, "title": title, "request": cli.read_json_file(ROOT / "examples" / (name + ".json"))})
    for model in ("11a1", "37a1"):
        examples.append({"id": "modular-symbol-" + model, "title": model + " exact central modular symbol, independent of parity",
                         "request": {"kind": "p7.modular_symbols", "input": {"model": model}}})
        examples.append({"id": "complex-" + model, "title": model + " complex L and completed Lambda at 1+3i",
                         "request": {"kind": "p7.elliptic_complex", "input": {"model": model,
                         "s": {"real": "1", "imag": "3"}, "precisionBits": 192,
                         "coefficientLimit": 128, "tolerance": "1e-25"}}})
        examples.append({"id": "arithmetic-" + model, "title": model + " exact descent, heights and saturation",
                         "request": {"kind": "p7.elliptic_arithmetic", "input": {"model": model,
                         "precisionBits": 192, "coefficientLimit": 64, "heightIterations": 7}}})
        examples.append({"id": "central-" + model, "title": model + " analytic central values",
                         "request": {"kind": "p7.elliptic_analytic", "input": {"model": model,
                         "precisionBits": 192, "coefficientLimit": 128, "tolerance": "1e-40"}}})
    examples.extend([
        {"id": "zeta-em-critical", "title": "ζ(1/2+14i): rounding, finite-series error and infinite tail",
         "request": {"kind": "p7.zeta_em", "input": {"s": {"real": "1/2", "imag": "14"},
         "precisionBits": 192, "sumCutoff": 32, "bernoulliOrder": 16, "integralEnd": 64,
         "integralSeriesTerms": 16, "tolerance": "1e-25"}}},
        {"id": "euler-zeta-2", "title": "Finite Euler product at s=2, with omitted-prime ledger",
         "request": {"kind": "p7.euler_product", "input": {"function": "zeta", "s": {"real": "2", "imag": "0"},
         "primes": [2, 3, 5, 7, 11, 13], "precisionBits": 192}}},
        {"id": "complex-additive", "title": "Additive reduction: y²=x³−x, complex L(1+2i)",
         "request": {"kind": "p7.elliptic_complex", "input": {"model": [0, 0, 0, -1, 0],
         "s": {"real": "1", "imag": "2"}, "precisionBits": 192, "coefficientLimit": 128, "tolerance": "1e-25"}}},
    ])
    examples.append({"id": "explicit-psi", "title": "ψ(10.5): integrated explicit formula",
                     "request": {"kind": "p7.explicit_formula", "input": {"x": "21/2", "height": "30",
                     "precisionBits": 192, "tolerance": "16", "zeroTolerance": "1e-20"}}})
    examples.append({"id": "taylor-zeta", "title": "ζ(2+0.01): Taylor polynomial and rigorous remainder",
                     "request": {"kind": "p7.taylor_remainder", "input": {"operation": "zeta",
                     "center": {"real": "2", "imag": "0"}, "displacement": {"real": "1/100", "imag": "0"},
                     "radius": "1/4", "displacementRadius": "1/100", "order": 10,
                     "precisionBits": 192, "tolerance": "1e-12"}}})
    examples.append({"id": "operator-reference", "title": "Operator reference and falsification controls",
                     "request": {"kind": "p7.operator_audit", "input": {"candidate": "diagonal-integers",
                     "dimension": 8, "precisionBits": 192, "tolerance": "1e-35"}}})
    from p7.operator_candidates import reference_registration
    examples.append({"id": "operator-registered", "title": "User operator, domain, hypotheses and exact finite truncations",
                     "request": {"kind": "p7.operator_audit", "input": {"candidate": "registered",
                     "registration": reference_registration(), "precisionBits": 192}}})
    claim_titles = {
        "finite-zero-20": "Typed result: finite-height zero certificate to T=20",
        "specific-rank-37a1": "Typed result: specific-curve rank equality for 37a1",
        "refined-37a1-conditional": "Typed result: conditional leading-term comparison for 37a1",
        "universal-bsd-research": "Typed research export: universal BSD remains open",
        "reject-finite-field-rh-copy": "Negative control: reject finite-field to classical RH promotion",
        "reject-omitted-coefficient-and-prime": "Negative control: missing coefficient 17 and prime 37",
        "reject-omitted-zero": "Negative control: missing the certified positive zero below T=20",
    }
    for name, title in claim_titles.items():
        examples.append({"id": name, "title": title,
                         "request": cli.read_json_file(ROOT / "p7" / "examples" / (name + ".json"))})
    from p7.pari_backend import backend_fingerprint, PariBackendUnavailable
    try:
        arithmetic_backend = {"status": "AVAILABLE", "fingerprint": backend_fingerprint()}
    except PariBackendUnavailable as exc:
        arithmetic_backend = {"status": "UNAVAILABLE", "code": exc.code, "detail": str(exc)}
    return {"schema": "MathScope.M3.P7Capabilities/1", "status": "IN_PROGRESS", "kinds": sorted(cli.KINDS),
            "examples": examples, "sourceBinding": cli.source_binding(), "predecessor": cli.predecessor(),
            "arithmeticBackend": arithmetic_backend,
            "progress": cli.read_json_file(ROOT / "P7_PROGRESS.json"),
            "limits": {"maxSeconds": MAX_SECONDS, "memoryMiB": MEMORY_MIB, "maxConcurrent": 1,
                       "maxRunBytes": MAX_RUN_BYTES, "maxReplayBytes": MAX_BODY_BYTES,
                       "singleWebWorkerRequired": True},
            "wholeP7Complete": False, "wholeM3Complete": False,
            "universalRHProved": False, "universalBSDProved": False}


async def _body(request, limit):
    data = bytearray()
    async for part in request.stream():
        if len(data) + len(part) > limit:
            raise HTTPException(413, "P7 request exceeds the declared byte limit")
        data.extend(part)
    try:
        cli = runtime()
        value = cli.parse_json(bytes(data))
        # JSON exponents can overflow to infinity, and escaped lone surrogates
        # can parse successfully but fail UTF-8 encoding. Reject either before
        # dispatching a worker or acquiring the calculation admission lease.
        cli.canonical(value)
        return value
    except (ValueError, UnicodeDecodeError, RecursionError) as exc:
        detail = str(exc).encode("utf-8", errors="backslashreplace").decode("utf-8")
        raise HTTPException(400, detail) from exc


def _execute(value, replay):
    # Admission is held by this thread until the subprocess actually exits,
    # even if the HTTP client disconnects or cancels its coroutine.
    if not _admission.acquire(blocking=False):
        raise HTTPException(429, "A P7 calculation is running; retry after it finishes")
    lease = None
    try:
        # The file lock enforces the same limit across Uvicorn processes on
        # this single Render instance, independently of WEB_CONCURRENCY.
        import fcntl
        lease = open(Path(tempfile.gettempdir()) / "mathscope-p7-admission.lock", "a")
        try:
            fcntl.flock(lease.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise HTTPException(429, "A P7 calculation is running; retry after it finishes")
        cli = runtime()
        result = (cli.replay if replay else cli.execute)(value, max_seconds=MAX_SECONDS, memory_mib=MEMORY_MIB)
        if len(cli.canonical(result)) > MAX_BODY_BYTES:
            raise HTTPException(507, "Result exceeds the replay transport budget; request a smaller calculation")
        return result
    except (ValueError, TypeError, KeyError) as exc:
        raise HTTPException(422, str(exc)) from exc
    except RuntimeError as exc:
        if getattr(exc, "code", None) == "PARI_BACKEND_UNAVAILABLE":
            raise HTTPException(503, {"code": exc.code, "detail": str(exc)}) from exc
        raise
    finally:
        if lease is not None:
            lease.close()
        _admission.release()


@router.post("/run")
async def run(request: Request):
    value = await _body(request, MAX_RUN_BYTES)
    return await asyncio.to_thread(_execute, value, False)


@router.post("/replay")
async def replay(request: Request):
    value = await _body(request, MAX_BODY_BYTES)
    return await asyncio.to_thread(_execute, value, True)
