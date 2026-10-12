"""Pinned PARI/GP execution for exact elliptic arithmetic and 2-descent.

This boundary runs a fresh process from numeric input, preserves its exact
transcript, and independently checks the exported rational cover maps. The
completeness of PARI's local solubility/Selmer algorithm is an explicit trusted
CAS dependency, not a Lean theorem or a database lookup.
"""
from __future__ import annotations

from fractions import Fraction
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import subprocess

from .elliptic_local import as_curve, point_multiply, _rational_text

PARI_VERSION = "2.19.0"
PARI_SOURCE_SHA256 = "f317b9722eb5d9094a60303774f066f3a83e3ec1f170be8546c44d7583f30b6d"
PROVENANCE_NAME = "mathscope-pari-build.json"
MAX_SECONDS = 60
MAX_OUTPUT_BYTES = 4_000_000
_MARKER = "MATHSCOPE_P7_EXACT_V1="
_RATIONAL = re.compile(r"^-?[0-9]+(?:/[1-9][0-9]*)?$")


class PariBackendUnavailable(RuntimeError):
    code = "PARI_BACKEND_UNAVAILABLE"


class PariExecutionError(RuntimeError):
    code = "PARI_EXECUTION_FAILED"


def _canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def _executable():
    configured = os.environ.get("MATHSCOPE_PARI_GP")
    if configured:
        path = Path(configured).expanduser().resolve()
    else:
        try:
            import mathscope_p7_pari
            path = Path(mathscope_p7_pari.binary_path()).resolve()
        except (ImportError, FileNotFoundError) as exc:
            raise PariBackendUnavailable("Install the pinned local mathscope-p7-pari requirement, or configure MATHSCOPE_PARI_GP with its build sidecar") from exc
    if not path.is_file() or not os.access(path, os.X_OK):
        raise PariBackendUnavailable("The configured PARI executable is missing or is not executable")
    return path


def _fingerprint(path):
    sidecar = path.with_name(PROVENANCE_NAME)
    try:
        provenance_bytes = sidecar.read_bytes()
        if len(provenance_bytes) > 100_000:
            raise ValueError("oversized provenance")
        provenance = json.loads(provenance_bytes)
        binary_sha = sha256(path.read_bytes()).hexdigest()
        if (provenance.get("schema") != "MathScope.P7.PARI.Build/1"
                or provenance.get("pariVersion") != PARI_VERSION
                or provenance.get("source", {}).get("sha256") != PARI_SOURCE_SHA256
                or provenance["source"].get("sha256VerifiedBeforeExtraction") is not True
                or provenance.get("binary", {}).get("sha256") != binary_sha
                or provenance["binary"].get("bytes") != path.stat().st_size
                or provenance.get("recipe", {}).get("databasesDownloaded") is not False):
            raise ValueError("source or executable pin mismatch")
        version_run = subprocess.run([str(path), "--version"], stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE, timeout=10, check=False)
        version = (version_run.stdout + version_run.stderr).decode("utf-8", errors="strict")
        if (version_run.returncode != 0 or version != provenance["binary"]["versionOutput"]
                or "GP/PARI CALCULATOR Version " + PARI_VERSION + " (released)" not in version):
            raise ValueError("observed version mismatch")
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError) as exc:
        raise PariBackendUnavailable("The PARI executable lacks matching pinned build provenance and observed version") from exc
    return {
        "name": "PARI/GP", "version": PARI_VERSION,
        "sourceArchiveSHA256": PARI_SOURCE_SHA256,
        "binarySHA256": binary_sha, "binaryBytes": path.stat().st_size,
        "buildProvenanceSHA256": sha256(provenance_bytes).hexdigest(),
        "versionOutput": version, "observedVersionMatchesBuild": True,
        "sourceVerifiedBeforeBuild": True, "databasesUsed": False,
        "trustBoundary": "pinned compiled PARI algorithms; exact exported witnesses are checked separately; no formal Lean proof",
    }


def backend_fingerprint():
    return _fingerprint(_executable())


def _numeric_gp(value):
    if isinstance(value, (list, tuple)):
        return "[" + ",".join(_numeric_gp(entry) for entry in value) + "]"
    value = Fraction(value)
    return "(" + _rational_text(value) + ")"


_HELPERS = r'''J(v)={my(t=type(v));if(t=="t_VEC"||t=="t_COL",return(Str("[",strjoin(vector(#v,i,J(v[i])),","),"]")));if(t=="t_INT"||t=="t_FRAC",return(Str("\"",v,"\"")));error("unsupported_json_type");};
B(N)={my(d=if(N==0,0,poldegree(N,x)));if(d>64,error("map_degree_budget"));vector(d+1,i,my(c=polcoef(N,i-1,x),e=if(c==0,0,poldegree(c,y)));if(e>64,error("map_degree_budget"));vector(e+1,j,polcoef(c,j-1,y)));};
M(P)={my(D=1);for(i=0,poldegree(P,x),D=lcm(D,denominator(polcoef(P,i,x))));[B(P*D),B(D)];};
'''


def _script(curve, points, coefficient_limit, perform_descent=True):
    # Function definitions must end on their own GP input lines. Otherwise GP
    # may consume the remaining input into a function body and exit 0 silently.
    code = (
        "default(realprecision,80);setrand(1);"
        "A=" + _numeric_gp(curve.ainvs) + ";E0=ellinit(A);v=0;E=ellminimalmodel(E0,&v);"
        "Q0=" + _numeric_gp(points) + ";Q=vector(#Q0,i,ellchangepoint(Q0[i],v));"
        "G=ellglobalred(E);F=factor(abs(E.disc));"
        "L=vector(matsize(F)[1],i,my(p=F[i,1]);[p,F[i,2],elllocalred(E,p),ellrootno(E,p),ellap(E,p)]);"
        + ("R=ellrank(E,0,Q);C=ell2cover(E);T=elltors(E);"
           "D=vector(#C,i,[vector(5,j,polcoef(C[i][1],j-1,x)),M(C[i][2][1]),M(C[i][2][2]),ellisoncurve(E,Mod(C[i][2],y^2-C[i][1]))]);"
           if perform_descent else "R=[];D=[];T=[];") +
        # Observed PARI 2.19.0 boundary defect: ellan(E,1) raises a floating
        # point exception. Compute at least two coefficients and export the
        # exact requested prefix. The analytic cutoff remains K, not 2.
        "AN=ellan(E," + str(max(2, coefficient_limit)) + ");"
        "OUT=[version(),A,[E.a1,E.a2,E.a3,E.a4,E.a6],v,[G[1],G[3],ellrootno(E)],L,"
        "vector(" + str(coefficient_limit) + ",i,AN[i]),R,D,T,Q];"
        "print(\"" + _MARKER + "\",J(OUT));"
    )
    return _HELPERS + "iferr({" + code + "},err,print(\"MATHSCOPE_P7_ERROR\");quit(1));quit(0);\n"


def _check_exact_tree(value, depth=0):
    if depth > 10:
        raise PariExecutionError("The exact GP result exceeds its nesting budget")
    if isinstance(value, list):
        if len(value) > 4096:
            raise PariExecutionError("The exact GP result exceeds its vector budget")
        for entry in value:
            _check_exact_tree(entry, depth+1)
    elif not isinstance(value, str) or len(value) > 20_000 or not _RATIONAL.fullmatch(value):
        raise PariExecutionError("GP returned a value outside the exact rational protocol")


def _polynomial(matrix):
    if not isinstance(matrix, list) or not 1 <= len(matrix) <= 65:
        raise PariExecutionError("Invalid bivariate polynomial coefficient shape")
    result = {}
    for i, row in enumerate(matrix):
        if not isinstance(row, list) or not 1 <= len(row) <= 65:
            raise PariExecutionError("Invalid bivariate polynomial row")
        for j, value in enumerate(row):
            coefficient = Fraction(value)
            if coefficient:
                result[i, j] = coefficient
    return result


def _add(*parts):
    result = {}
    for part in parts:
        for key, value in part.items():
            result[key] = result.get(key, Fraction(0)) + value
    return {key: value for key, value in result.items() if value}


def _scale(polynomial, coefficient):
    return {key: value*coefficient for key, value in polynomial.items() if value*coefficient}


def _mul(a, b):
    result = {}
    for (i, j), x in a.items():
        for (k, l), y in b.items():
            key = (i+k, j+l)
            result[key] = result.get(key, Fraction(0)) + x*y
    if len(result) > 20_000:
        raise PariExecutionError("The rational cover identity exceeds its polynomial budget")
    return {key: value for key, value in result.items() if value}


def _power(a, exponent):
    out = {(0, 0): Fraction(1)}
    for _ in range(exponent):
        out = _mul(out, a)
    return out


def _reduce_cover(polynomial, quartic):
    r = {(i, 0): Fraction(value) for i, value in enumerate(quartic) if Fraction(value)}
    result = {}
    for (i, j), value in polynomial.items():
        term = _mul({(i, j % 2): value}, _power(r, j//2))
        result = _add(result, term)
    return result


def verify_cover_map(model, cover):
    """Check the full rational-map equation over Q[x,y]/(y²-R(x))."""
    if not isinstance(cover, list) or len(cover) != 4 or len(cover[0]) != 5 or cover[3] != "1":
        raise PariExecutionError("Invalid exact 2-cover receipt")
    quartic, x_map, y_map, _ = cover
    if not any(Fraction(value) for value in quartic[3:]):
        raise PariExecutionError("The exported cover must have degree three or four")
    if any(not isinstance(item, list) or len(item) != 2 for item in (x_map, y_map)):
        raise PariExecutionError("Invalid rational map numerator/denominator")
    nx, dx = map(_polynomial, x_map)
    ny, dy = map(_polynomial, y_map)
    if not _reduce_cover(dx, quartic) or not _reduce_cover(dy, quartic):
        raise PariExecutionError("The exported cover map has a zero denominator")
    a1, a2, a3, a4, a6 = as_curve(model).ainvs
    dx2, dx3, dy2 = _power(dx, 2), _power(dx, 3), _power(dy, 2)
    identity = _add(
        _mul(_power(ny, 2), dx3),
        _scale(_mul(_mul(nx, ny), _mul(dx2, dy)), a1),
        _scale(_mul(_mul(ny, dx3), dy), a3),
        _scale(_mul(_power(nx, 3), dy2), -1),
        _scale(_mul(_mul(_power(nx, 2), dx), dy2), -a2),
        _scale(_mul(_mul(nx, dx2), dy2), -a4),
        _scale(_mul(dx3, dy2), -a6),
    )
    if _reduce_cover(identity, quartic):
        raise PariExecutionError("The exported 2-cover map fails the exact Weierstrass equation")
    return {"exactRationalMapIdentityChecked": True,
            "quotientRing": "Q[x,y]/(y^2-R(x))", "quarticCoefficientOrder": "ascending powers of x",
            "mapCoefficientOrder": "outer index is x degree; inner index is y degree",
            "localSolubilityAndBasisCompleteness": "trusted pinned PARI ell2cover algorithm, recomputed in the same fresh process",
            "coverSHA256": sha256(_canonical(cover)).hexdigest()}


def run_elliptic_arithmetic(model, *, known_points=(), coefficient_limit=64, perform_descent=True):
    curve = as_curve(model)
    if any(max(abs(value.numerator).bit_length(), value.denominator.bit_length()) > 128 for value in curve.ainvs):
        raise ValueError("PARI arithmetic input coefficients exceed the 128-bit request budget")
    if type(coefficient_limit) is not int or not 1 <= coefficient_limit <= 256:
        raise ValueError("coefficientLimit must be an integer in [1,256]")
    if type(perform_descent) is not bool:
        raise ValueError("perform_descent must be an explicit boolean")
    if not isinstance(known_points, (list, tuple)) or len(known_points) > 8:
        raise ValueError("knownPoints must contain at most eight exact rational points")
    checked = [point_multiply(curve, 1, point) for point in known_points]
    if any(point is None for point in checked):
        raise ValueError("knownPoints must be affine rational points")
    path = _executable()
    fingerprint = _fingerprint(path)
    script = _script(curve, checked, coefficient_limit, perform_descent)
    try:
        # Deliberately inherit the enclosing CLI lease's process group.
        process = subprocess.run([str(path), "-q", "-f", "-s64000000"], input=script.encode("ascii"),
                                 stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                 timeout=MAX_SECONDS, check=False)
    except (OSError, subprocess.SubprocessError) as exc:
        raise PariExecutionError("The bounded PARI arithmetic subprocess failed or timed out") from exc
    if len(process.stdout) + len(process.stderr) > MAX_OUTPUT_BYTES:
        raise PariExecutionError("The PARI transcript exceeds its byte budget")
    try:
        stdout, stderr = process.stdout.decode("utf-8", "strict"), process.stderr.decode("utf-8", "strict")
        lines = stdout.splitlines()
        if (process.returncode != 0 or stderr or len(lines) != 1
                or not lines[0].startswith(_MARKER) or lines[0].count(_MARKER) != 1):
            raise ValueError("not one clean successful exact result")
        values = json.loads(lines[0][len(_MARKER):])
        _check_exact_tree(values)
        if (not isinstance(values, list) or len(values) != 11
                or values[0] != ["2", "19", "0"]
                or values[1] != [_rational_text(x) for x in curve.ainvs]):
            raise ValueError("protocol/version/input mismatch")
    except (ValueError, UnicodeError, TypeError) as exc:
        raise PariExecutionError("PARI did not emit a valid source-bound exact arithmetic transcript") from exc
    min_model = as_curve(values[2])
    if (not min_model.integral or len(values[3]) != 4 or len(values[4]) != 3
            or len(values[7]) != (4 if perform_descent else 0)
            or (not perform_descent and (values[8] or values[9]))):
        raise PariExecutionError("PARI returned malformed minimal-model or rank data")
    cover_checks = [verify_cover_map(min_model, cover) for cover in values[8]]
    result = {
        "schema": "MathScope.P7.PARI.ExactArithmetic/1", "backend": fingerprint,
        "inputModel": values[1], "minimalModel": values[2], "coordinateChange": values[3],
        "global": {"conductor": values[4][0], "tamagawaProduct": values[4][1], "rootNumber": values[4][2]},
        "localRows": values[5], "dirichletCoefficients": values[6],
        "rankTuple": values[7] if perform_descent else None,
        "twoCovers": values[8] if perform_descent else None, "coverMapChecks": cover_checks,
        "torsionTuple": values[9] if perform_descent else None, "knownPointsOnMinimalModel": values[10],
        "executionScope": "COMPLETE_LOCAL_FACTORS_AND_DESCENT" if perform_descent else "COMPLETE_LOCAL_FACTORS_ONLY",
        "execution": {"commandOptions": ["-q", "-f", "-s64000000"],
                      "stackBytes": 64_000_000, "timeoutSeconds": MAX_SECONDS,
                      "seed": 1, "effort": 0, "exitCode": process.returncode,
                      "script": script, "scriptSHA256": sha256(script.encode("ascii")).hexdigest(),
                      "stdout": stdout, "stdoutSHA256": sha256(process.stdout).hexdigest(),
                      "stderr": stderr, "stderrSHA256": sha256(process.stderr).hexdigest(),
                      "freshProcessExecuted": True},
        "algorithmDependencies": {
            "rankUpper": "ellrank: unconditional 2-descent and the 2-part of the Cassels pairing; r2=C-T-s" if perform_descent else "NOT_EXECUTED",
            "twoCovers": "ell2cover: basis of everywhere locally soluble 2-covers" if perform_descent else "NOT_EXECUTED",
            "reference": "https://pari.math.u-bordeaux.fr/dochtml/html-stable/Elliptic_curves.html#ellrank",
            "databaseRankLookupUsed": False, "analyticRankUsedForArithmeticBound": False,
            "formalLeanProofIssued": False,
        },
        "sourceSha256": sha256(Path(__file__).read_bytes()).hexdigest(),
    }
    result["computationSha256"] = sha256(_canonical(result)).hexdigest()
    return result
