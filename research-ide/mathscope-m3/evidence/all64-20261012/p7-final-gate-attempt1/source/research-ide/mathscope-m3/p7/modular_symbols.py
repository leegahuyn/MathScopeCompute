"""Exact central modular-symbol zero/nonzero evidence for 11a1 and 37a1.

This uses a rational generator of the plus new cuspidal Hecke eigenspace,
NOT a symbol normalized by an elliptic curve's Neron period.  Multiplication
by a nonzero period preserves zero/nonzero, which is all the analytic bridge
claims.  No Manin constant, BSD formula, period value, or rank table is used.

The complete modular-symbol space and path evaluation are trusted pinned
PARI algorithms.  Python Fraction separately checks the exported subspace
invariance, joint eigenspace nullity, vector normalization, path functional,
and coefficients computed independently by finite point counting.  Fresh
replay is required to authenticate an imported transcript; a hash or the
arithmetic consistency checker alone does not establish its provenance.
"""
from __future__ import annotations

from copy import deepcopy
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import subprocess

from .elliptic_local import as_curve, dirichlet_coefficients, semistable_minimal_certificate, _rational_text
from .pari_backend import (_canonical, _check_exact_tree, _executable, _fingerprint,
                           _numeric_gp, PariExecutionError, MAX_OUTPUT_BYTES, MAX_SECONDS)


SCHEMA = "MathScope.M3.P7.ModularSymbolCertificate/1"
SUPPORTED_MODELS = ("11a1", "37a1")
Q_EXPANSION_LENGTH = 12
_MARKER = "MATHSCOPE_P7_MODULAR_SYMBOLS_V1="
_SOURCE_FILES = ("modular_symbols.py", "pari_backend.py", "elliptic_local.py")
_WITNESS_FIELDS = (
    "inputAinvs", "spaceParameters", "newSubspaceBasisRows", "eigenSubspaceCoordinatesRows",
    "normalizedAmbientSymbol", "firstNonzeroCoordinateOneBased", "normalizationDivisor",
    "centralFunctional", "pathValues", "pariIsSymbol", "heckeRows", "normalizedQCoefficients",
    "starMatrixRows", "generatorValues", "pariGeneratorRelationsPass", "scaledPathValues",
    "weightTwoManinRelationRows",
)
_GP_HELPERS = r'''J(v)={my(t=type(v));if(t=="t_VEC"||t=="t_COL",return(Str("[",strjoin(vector(#v,i,J(v[i])),","),"]")));if(t=="t_INT"||t=="t_FRAC",return(Str("\"",v,"\"")));error("unsupported_json_type");};
Rows(A)=vector(matsize(A)[1],i,vector(matsize(A)[2],j,A[i,j]));
Aug(v)={if(type(v)=="t_INT",return(v));if(type(v)=="t_MAT",return(sum(k=1,matsize(v)[1],v[k,2])));error("unsupported_relation_coefficient");};
'''

THEOREM_DEPENDENCIES = {
    "semistable-modularity": {
        "url": "https://annals.math.princeton.edu/1995/141-3/p01",
        "source": "Wiles (1995), Theorem 0.4",
        "use": "The supported semistable E/Q has the normalized weight-two newform with its complete Euler coefficients.",
        "proofExecuted": False,
    },
    "rational-modular-symbol-period-bridge": {
        "url": "https://wstein.org/books/modform/modform/periods.html",
        "source": "W. Stein, Modular Forms: A Computational Approach, Periods of Modular Forms",
        "use": "For the identified normalized rational newform, its plus period symbol is a nonzero real scalar times this rational eigensymbol. Its value on [0]-[infinity] is L(E,1). Only vanishing/nonvanishing is transferred.",
        "proofExecuted": False,
    },
    "sturm-identity-bound": {
        "url": "https://wstein.org/books/modform/modform/newforms.html#sturm-s-theorem",
        "source": "Sturm bound, weight k and Gamma0(N) index m; Stein, Theorem 9.18 and Corollary 9.20",
        "use": "Agreement of normalized q-expansions through ceil(k*m/12), including zero constant terms, identifies the weight-two forms. The implemented 12 coefficients exceed both required bounds.",
        "proofExecuted": False,
    },
    "exact-pari-modular-symbol-algorithms": {
        "url": "https://pari.math.u-bordeaux.fr/dochtml/html-stable/Modular_symbols.html",
        "source": "PARI/GP 2.19.0: msinit, msnew, msfromhecke, mshecke, mseval, msissymbol, msqexpansion, msstar",
        "use": "Complete rational new cuspidal plus space, its Hecke action and central path functional. The exported finite linear algebra is checked separately.",
        "proofExecuted": False,
    },
}


class ModularSymbolError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code

    def as_dict(self):
        return {"code": self.code, "message": str(self)}


def _fail(message):
    raise ModularSymbolError("INVALID_MODULAR_SYMBOL_WITNESS", message)


def _source_manifest():
    here = Path(__file__).resolve().parent
    return {name: sha256((here / name).read_bytes()).hexdigest() for name in _SOURCE_FILES}


def _prepare(model):
    curve = as_curve(model)
    if curve.label not in SUPPORTED_MODELS:
        raise ModularSymbolError("UNSUPPORTED_MODULAR_SYMBOL_MODEL", "Only the exact coefficient models 11a1 and 37a1 are supported")
    local = semistable_minimal_certificate(curve)
    if not (local["minimalAtEveryPrime"] and local["allBadFactorsCertified"]):
        raise ModularSymbolError("UNCERTIFIED_LOCAL_DATA", "The complete minimal semistable conductor is required")
    level = local["conductor"]
    # These two prime conductors have Gamma0 index N+1.  This assertion guards
    # scope; it never substitutes a precomputed symbol, central value or rank.
    if level not in (11, 37):
        raise ModularSymbolError("UNSUPPORTED_MODULAR_SYMBOL_LEVEL", "The supported prime conductor scope has changed")
    coefficients = dirichlet_coefficients(curve, max(level, Q_EXPANSION_LENGTH))
    if coefficients["omittedPrimes"] or not coefficients["completeBadFactorsIncluded"]:
        raise ModularSymbolError("INCOMPLETE_EULER_DATA", "Complete good and bad Euler data are required")
    return curve, local, coefficients


def _script(curve):
    # Keep function definitions on their own GP input lines.  There are no
    # caller-supplied expressions, ellrootno branches, numerical L-values,
    # msfromell period normalization, or database labels in this script.
    code = (
        "setrand(1);A=" + _numeric_gp(curve.ainvs) + ";E=ellinit(A);N=ellglobalred(E)[1];"
        "M=msinit(N,2,1);H=msnew(M);P=[2,3,5,7,N];AP=vector(#P,i,ellap(E,P[i]));"
        "S=msfromhecke(M,vector(#P,i,[P[i],AP[i]]),H);"
        "if(matsize(S)[2]!=1,error(\"eigenspace_not_one_dimensional\"));"
        # msfromhecke(...,H) returns coordinates in the H basis.  Omitting
        # H[1] here is incorrect for the signed ambient space.
        "s=H[1]*S[,1];pivot=0;for(i=1,#s,if(s[i]!=0,pivot=i;break));"
        "if(pivot==0,error(\"zero_symbol\"));divisor=s[pivot];s=s/divisor;"
        "F=vector(msdim(M),i,mseval(M,matid(msdim(M))[,i],[oo,0]));"
        # The 2.19.0 mseval(M,s) shortcut omits forced-zero torsion generators
        # at level 37.  Evaluate every mspathgens path explicitly so the full
        # relation checker receives all nine entries, including their zeros.
        "PG=mspathgens(M);G=PG[1];REL=PG[2];V=vector(#G,i,mseval(M,s,G[i]));"
        # Weight two has the trivial V_2=Q coefficient action: a group-ring
        # relation acts by the sum of its coefficients (augmentation).
        "RB=matrix(#REL,#G);for(i=1,#REL,for(j=1,#REL[i],term=REL[i][j];RB[i,term[2]]+=Aug(term[1])));"
        "OUT=[version(),A,[msgetlevel(M),msgetweight(M),msgetsign(M),msdim(M),msdim(H),matsize(S)[2]],"
        "Rows(H[1]),Rows(S),s,pivot,divisor,F,"
        "[mseval(M,s,[oo,0]),mseval(M,s,[0,oo]),mseval(M,s,[0,0])],"
        "msissymbol(M,s),vector(#P,i,[P[i],AP[i],Rows(mshecke(M,P[i])),Rows(mshecke(M,P[i],H))]),"
        "msqexpansion(M,s," + str(Q_EXPANSION_LENGTH) + "),Rows(msstar(M)),V,msissymbol(M,V),"
        "[mseval(M,2*s,[oo,0]),mseval(M,-s,[oo,0])],Rows(RB)];"
        "print(\"" + _MARKER + "\",J(OUT));"
    )
    return _GP_HELPERS + "iferr({" + code + "},err,print(\"MATHSCOPE_P7_MODULAR_SYMBOL_ERROR\");quit(1));quit(0);\n"


def _q(value):
    # The inherited parser enforces exact rational strings and bounded sizes.
    _check_exact_tree(value)
    if not isinstance(value, str):
        _fail("An exact scalar must be a rational string")
    result = Fraction(value)
    if _rational_text(result) != value:
        _fail("Exact scalar strings must be in canonical reduced form")
    return result


def _integer(value, low, high):
    number = _q(value)
    if number.denominator != 1 or not low <= number <= high:
        _fail("An exact integer lies outside its required range")
    return int(number)


def _vector(value, length):
    if not isinstance(value, list) or len(value) != length:
        _fail("The exact vector has a wrong dimension")
    return [_q(item) for item in value]


def _matrix(value, rows, columns):
    if not isinstance(value, list) or len(value) != rows:
        _fail("The exact matrix has a wrong row count")
    return [_vector(row, columns) for row in value]


def _matvec(matrix, vector):
    return [sum((a*b for a, b in zip(row, vector)), Fraction(0)) for row in matrix]


def _matmul(a, b):
    return [[sum((a[i][k]*b[k][j] for k in range(len(b))), Fraction(0))
             for j in range(len(b[0]))] for i in range(len(a))]


def _rank(matrix):
    """Independent rational Gaussian elimination, not a PARI rank flag."""
    a = [row[:] for row in matrix]
    rows, columns, pivot_row = len(a), len(a[0]), 0
    for column in range(columns):
        found = next((i for i in range(pivot_row, rows) if a[i][column]), None)
        if found is None:
            continue
        a[pivot_row], a[found] = a[found], a[pivot_row]
        divisor = a[pivot_row][column]
        a[pivot_row] = [entry/divisor for entry in a[pivot_row]]
        for i in range(pivot_row + 1, rows):
            factor = a[i][column]
            if factor:
                a[i] = [left-factor*right for left, right in zip(a[i], a[pivot_row])]
        pivot_row += 1
        if pivot_row == rows:
            break
    return pivot_row


def _decode(raw):
    _check_exact_tree(raw)
    if not isinstance(raw, list) or len(raw) != len(_WITNESS_FIELDS)+1 or raw[0] != ["2", "19", "0"]:
        _fail("The modular-symbol protocol or observed PARI version is invalid")
    if not isinstance(raw[2], list) or len(raw[2]) != 6:
        _fail("The modular-symbol space parameters are invalid")
    return dict(zip(_WITNESS_FIELDS, raw[1:]))


def _check_witness(curve, local, coefficients, witness):
    if not isinstance(witness, dict) or set(witness) != set(_WITNESS_FIELDS):
        _fail("The modular-symbol witness fields are missing or unexpected")
    if witness["inputAinvs"] != [_rational_text(a) for a in curve.ainvs]:
        _fail("The modular-symbol witness is bound to a different coefficient model")
    params = witness["spaceParameters"]
    if not isinstance(params, list) or len(params) != 6:
        _fail("Six exact modular-symbol space parameters are required")
    level = _integer(params[0], 1, 37)
    if level != local["conductor"] or params[1:3] != ["2", "1"]:
        _fail("The level, weight or plus sign does not match the requested curve")
    ambient_dim, new_dim, eigendim = (_integer(v, 1, 16) for v in params[3:])
    if eigendim != 1 or new_dim > ambient_dim:
        _fail("A nonzero one-dimensional new eigenspace is required")
    basis = _matrix(witness["newSubspaceBasisRows"], ambient_dim, new_dim)
    eigenspace = _matrix(witness["eigenSubspaceCoordinatesRows"], new_dim, eigendim)
    if _rank(basis) != new_dim or _rank(eigenspace) != 1:
        _fail("The new or eigen subspace basis has deficient rank")
    eigenvector = [row[0] for row in eigenspace]
    lifted = _matvec(basis, eigenvector)
    pivot = _integer(witness["firstNonzeroCoordinateOneBased"], 1, ambient_dim) - 1
    divisor = _q(witness["normalizationDivisor"])
    if not divisor or any(lifted[:pivot]) or lifted[pivot] != divisor:
        _fail("The recorded first nonzero normalization divisor is not valid")
    symbol = _vector(witness["normalizedAmbientSymbol"], ambient_dim)
    if symbol != [value/divisor for value in lifted] or symbol[pivot] != 1:
        _fail("The normalized nonzero ambient symbol is not the lifted eigensymbol")
    star = _matrix(witness["starMatrixRows"], ambient_dim, ambient_dim)
    if _matvec(star, symbol) != symbol:
        _fail("The symbol is not in the plus eigenspace")
    rows = witness["heckeRows"]
    primes = [2, 3, 5, 7, level]
    if not isinstance(rows, list) or len(rows) != len(primes):
        _fail("Every required Hecke prime, including the bad prime, must be present")
    equations, hecke_checks = [], []
    for row, prime in zip(rows, primes):
        if not isinstance(row, list) or len(row) != 4 or row[0] != str(prime):
            _fail("The Hecke prime ordering or shape is invalid")
        ap = _q(row[1])
        expected_ap = Fraction(coefficients["coefficients"][prime-1])
        if ap != expected_ap:
            _fail("A Hecke eigenvalue disagrees with independent point-count/Euler data")
        ambient = _matrix(row[2], ambient_dim, ambient_dim)
        restricted = _matrix(row[3], new_dim, new_dim)
        if _matmul(ambient, basis) != _matmul(basis, restricted):
            _fail("The exported new subspace is not invariant under a recorded Hecke operator")
        if _matvec(ambient, symbol) != [ap*x for x in symbol]:
            _fail("The ambient Hecke eigenvector identity is false")
        if _matvec(restricted, eigenvector) != [ap*x for x in eigenvector]:
            _fail("The restricted Hecke eigenvector identity is false")
        equations.extend([[value - (ap if i == j else 0) for j, value in enumerate(line)]
                          for i, line in enumerate(restricted)])
        hecke_checks.append({"prime": prime, "operator": "U_p" if prime == level else "T_p",
                             "eigenvalue": _rational_text(ap), "exactAmbientIdentity": True,
                             "exactSubspaceInvariance": True, "exactRestrictedIdentity": True})
    joint_nullity = new_dim - _rank(equations)
    if joint_nullity != 1:
        _fail("The independently computed joint Hecke kernel is not one-dimensional")
    qcoefficients = _vector(witness["normalizedQCoefficients"], Q_EXPANSION_LENGTH)
    expected_q = list(map(Fraction, coefficients["coefficients"][:Q_EXPANSION_LENGTH]))
    if qcoefficients != expected_q or qcoefficients[0] != 1:
        _fail("The normalized modular-form coefficients disagree with independent Euler coefficients")
    index = level + 1
    sturm_bound = (2*index + 11)//12
    if Q_EXPANSION_LENGTH < sturm_bound:
        _fail("The q-expansion does not reach the conservative Sturm identity bound")
    functional = _vector(witness["centralFunctional"], ambient_dim)
    path = _vector(witness["pathValues"], 3)
    central = sum((a*b for a, b in zip(functional, symbol)), Fraction(0))
    if path != [central, -central, Fraction(0)]:
        _fail("The central path value or exact reversed/zero-path identities are false")
    if _vector(witness["scaledPathValues"], 2) != [2*central, -central]:
        _fail("The nonzero rescaling controls disagree with linear path evaluation")
    generator_values = witness["generatorValues"]
    if (not isinstance(generator_values, list) or not 1 <= len(generator_values) <= 128
            or not any(_q(value) for value in generator_values)):
        _fail("The exported generator-value symbol must be nonzero")
    if witness["pariIsSymbol"] != "1" or witness["pariGeneratorRelationsPass"] != "1":
        _fail("PARI rejected a symbol or its generator relations")
    relation_rows = witness["weightTwoManinRelationRows"]
    if not isinstance(relation_rows, list) or not 1 <= len(relation_rows) <= 128:
        _fail("The full weight-two Manin relations are missing")
    relations = _matrix(relation_rows, len(relation_rows), len(generator_values))
    if any(_matvec(relations, [_q(value) for value in generator_values])):
        _fail("The exact weight-two generator values violate a Manin relation")
    return {
        "status": "EXACT_RATIONAL_WITNESS_CHECKED",
        "arithmetic": "Python fractions.Fraction; no floating-point comparison or zero threshold",
        "ambientDimension": ambient_dim, "newCuspidalPlusDimension": new_dim,
        "jointHeckeKernelDimension": joint_nullity, "independentGaussianEliminationExecuted": True,
        "nonzeroNormalizedSymbol": True, "newSubspaceFullColumnRank": True,
        "liftAndNormalizationIdentity": True, "plusStarIdentity": True,
        "heckeChecks": hecke_checks,
        "qExpansionIdentity": {"coefficientsChecked": Q_EXPANSION_LENGTH,
                               "coefficientIndices": [1, Q_EXPANSION_LENGTH],
                               "constantTerms": ["0", "0"], "weight": 2,
                               "gamma0Index": index, "conservativeSturmBound": sturm_bound,
                               "independentPointCountEulerMatch": True,
                               "completeBadFactorsIncluded": True},
        "centralFunctionalDotSymbol": _rational_text(central),
        "reversePathAndZeroPathIdentities": True, "nonzeroRescalingControls": True,
        "pariGeneratorRelationsRecomputed": True,
        "fullGeneratorValuesCount": len(generator_values),
        "weightTwoManinRelationsChecked": len(relations),
        "allWeightTwoRelationResidualsExactZero": True,
        "trustedCASObligation": "The complete modular-symbol/new subspace, matrices, generator relations and path functional come from the pinned PARI algorithm. These finite identities alone do not reconstruct that algorithm.",
        "transcriptProvenanceAuthenticatedByThisChecker": False,
    }


def check_modular_symbol_witness(model, witness):
    """Check finite rational identities, not the authenticity of a transcript."""
    curve, local, coefficients = _prepare(model)
    return _check_witness(curve, local, coefficients, witness)


def modular_symbol_certificate(model):
    """Run pinned PARI afresh and record exact central zero/nonzero evidence."""
    curve, local, coefficients = _prepare(model)
    executable = _executable()
    backend = _fingerprint(executable)
    script = _script(curve)
    try:
        process = subprocess.run([str(executable), "-q", "-f", "-s64000000"],
                                 input=script.encode("ascii"), stdout=subprocess.PIPE,
                                 stderr=subprocess.PIPE, timeout=MAX_SECONDS, check=False)
    except (OSError, subprocess.SubprocessError) as exc:
        raise PariExecutionError("The bounded PARI modular-symbol process failed or timed out") from exc
    if len(process.stdout) + len(process.stderr) > MAX_OUTPUT_BYTES:
        raise PariExecutionError("The PARI modular-symbol transcript exceeds its byte budget")
    try:
        stdout = process.stdout.decode("utf-8", "strict")
        stderr = process.stderr.decode("utf-8", "strict")
        lines = stdout.splitlines()
        if (process.returncode != 0 or stderr or len(lines) != 1
                or not lines[0].startswith(_MARKER) or lines[0].count(_MARKER) != 1):
            raise ValueError("not one clean successful exact modular-symbol result")
        witness = _decode(json.loads(lines[0][len(_MARKER):]))
        checks = _check_witness(curve, local, coefficients, witness)
    except (ValueError, UnicodeError, TypeError, KeyError, IndexError) as exc:
        raise PariExecutionError("PARI did not emit a valid exact modular-symbol witness") from exc
    zero = checks["centralFunctionalDotSymbol"] == "0"
    record = {
        "schema": SCHEMA, "request": {"model": curve.label},
        "model": {"label": curve.label, "ainvs": [_rational_text(a) for a in curve.ainvs], "hash": curve.model_hash},
        "status": "EXACT_MODULAR_SYMBOL_ZERO" if zero else "EXACT_MODULAR_SYMBOL_NONZERO",
        "exactCentralSymbol": {
            "value": checks["centralFunctionalDotSymbol"], "exactZero": zero,
            "exactNonzero": not zero, "path": ["infinity", "0"], "divisor": "[0]-[infinity]",
            "normalization": "First nonzero ambient Q-coordinate equals 1; arbitrary nonzero rational eigensymbol scale",
            "neronPeriodRatioComputed": False, "maninConstantAssumed": False,
            "computedFromRootNumber": False, "numericalZeroToleranceUsed": False,
        },
        "analyticConclusion": {
            "status": "CERTIFIED_WITH_THEOREM_AND_CAS_DEPENDENCIES",
            "LAtOneExactZero": zero, "LAtOneExactNonzero": not zero,
            "exactAnalyticRank": None if zero else 0, "analyticRankLowerBound": 1 if zero else 0,
            "firstDerivativeComputed": False, "exactRankOneClaimed": False,
            "reason": ("The nonzero rational eigensymbol vanishes on the central path. This proves central vanishing under the period bridge, but exact rank one still needs a rigorous nonzero first derivative."
                       if zero else "The rational eigensymbol has a nonzero central path value. Multiplication by the nonzero period scale preserves nonvanishing, so the analytic order at s=1 is zero."),
            "arithmeticRankInferred": False, "bsdUsed": False,
        },
        "proofChannels": {
            "exactModularSymbol": {"executed": True, "centralValueExactZero": zero,
                                   "centralValueExactNonzero": not zero},
            "functionalEquationParity": {"executedHere": False,
                                           "localRootNumberForIndependentComparison": local["globalRootNumber"],
                                           "source": "Separate elliptic_analytic.py channel: Lambda(s)=w*Lambda(2-s)"},
            "rigorousDerivativeBall": {"executedHere": False,
                                       "requiredForRankOne": True, "source": "Separate elliptic_analytic.py channel; LambdaPrime must exclude zero"},
        },
        "witness": witness, "exactChecks": checks,
        "localCertificate": local,
        "independentCoefficientData": coefficients,
        "independentCoefficientDataSHA256": sha256(_canonical(coefficients)).hexdigest(),
        "backend": backend,
        "execution": {"commandOptions": ["-q", "-f", "-s64000000"],
                      "stackBytes": 64_000_000, "timeoutSeconds": MAX_SECONDS, "seed": 1,
                      "exitCode": process.returncode, "freshProcessExecuted": True,
                      "script": script, "scriptSHA256": sha256(script.encode("ascii")).hexdigest(),
                      "stdout": stdout, "stdoutSHA256": sha256(process.stdout).hexdigest(),
                      "stderr": stderr, "stderrSHA256": sha256(process.stderr).hexdigest()},
        "theoremDependencies": deepcopy(THEOREM_DEPENDENCIES),
        "scope": {"modularSymbolsExecuted": True, "qExpansionComparedPastSturmBound": True,
                  "databaseRankLookupUsed": False, "periodNormalizationComputed": False,
                  "maninConstantAssumed": False, "formalLeanProofIssued": False,
                  "arithmeticRankEqualityClaimed": False, "bsdLeadingTermClaimed": False,
                  "universalBSDClaimed": False,
                  "infiniteFamilyClaimed": False},
        "sourceManifest": _source_manifest(),
    }
    record["computationSha256"] = sha256(_canonical(record)).hexdigest()
    return record


def replay_modular_symbol_certificate(record):
    """Recompute in a fresh pinned process; resealing an edited result fails."""
    if not isinstance(record, dict) or record.get("schema") != SCHEMA:
        raise ModularSymbolError("INVALID_MODULAR_SYMBOL_CERTIFICATE", "The modular-symbol certificate schema is invalid")
    body = {key: value for key, value in record.items() if key != "computationSha256"}
    if sha256(_canonical(body)).hexdigest() != record.get("computationSha256"):
        raise ModularSymbolError("MODULAR_SYMBOL_HASH_MISMATCH", "The modular-symbol certificate hash is invalid")
    if record.get("sourceManifest") != _source_manifest():
        raise ModularSymbolError("MODULAR_SYMBOL_SOURCE_CHANGED", "The modular-symbol source has changed; the imported record needs a new computation")
    request = record.get("request")
    if not isinstance(request, dict) or set(request) != {"model"}:
        raise ModularSymbolError("INVALID_MODULAR_SYMBOL_REQUEST", "The replay request fields are invalid")
    fresh = modular_symbol_certificate(request["model"])
    if fresh != record:
        raise ModularSymbolError("MODULAR_SYMBOL_REPLAY_MISMATCH", "Fresh pinned modular-symbol computation disagrees with the imported record")
    return {"schema": "MathScope.M3.P7.ModularSymbolReplay/1", "status": "MATCH",
            "freshProcessExecuted": True, "independentRationalChecksReexecuted": True,
            "computationSha256": fresh["computationSha256"],
            "result": fresh}


def evaluate_modular_symbols(request):
    """Closed request adapter for a service or CLI route owned by the caller."""
    if not isinstance(request, dict) or set(request) != {"model"}:
        raise ModularSymbolError("INVALID_MODULAR_SYMBOL_REQUEST", "Use exactly one model field for the modular-symbol request")
    return modular_symbol_certificate(request["model"])
