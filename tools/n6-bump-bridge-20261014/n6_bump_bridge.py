#!/usr/bin/env python3
"""Source-bound radial bump lemma; never changes the original N6 frontier.

The analytic induction is in PROOF_KO.md. Exact execution checks the native
source binding and finite polynomial regression; it is not a Lean proof.
Inputs are extracted GitHub Actions artifacts, not substituted sample fields.
"""
from __future__ import annotations
import argparse
from copy import deepcopy
from fractions import Fraction as Q
import hashlib
import json
from math import factorial
from pathlib import Path

CHECKPOINT_SHA = 'ba1fd222b9b50236dcbe8eff144a43ac6d4a5b724f2352fc0f67afad83f34ef2'
FRONTIER_SHA = '98275fe97be5933ef51a0facb633eaf11b5f1a90b7d6d42735e9e1473e3f825e'
SCALAR_SHA = 'aa2da2a3ee1a12ffd9fc24d471271fc62f6b8723d75813a91eabb68713adc0a8'
PROFILE_AST_SHA = 'a5966ffed2627ea4dc686fb46cc8b5603969b22c0b2a8220f67cbc42353349c2'
DB_SHA = 'ffd82b62c8aaeeb0d076a614f7af0b9782804abab9337743c2951275bb9d9003'
PARENT_SHA = '7c36afa44610b9786362dc228766c3d895491bb116103eca58a79d80a6b7609f'
TARGET_NUMBERS = (25, 38, 40, 41, 68, 76, 84, 92)

def digest_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()

def digest(value: object) -> str:
    return digest_bytes(json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode())

def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError(message)

def read_locked(path: Path, expected: str) -> object:
    raw = path.read_bytes()
    require(digest_bytes(raw) == expected, 'Source bytes changed: ' + str(path))
    return json.loads(raw)

def parameters(cp: dict) -> dict:
    profiles = [b['definition']['source'] for b in cp['definitionBindings']
                if isinstance(b.get('definition'), dict)
                and isinstance(b['definition'].get('source'), dict)
                and 'parametersExactExpressions' in b['definition']['source']]
    require(bool(profiles), 'Missing native source profile')
    first = profiles[0]['parametersExactExpressions']
    require(all(p['parametersExactExpressions'] == first for p in profiles), 'Inconsistent native profiles')
    return first

def verify_binding(program: list, params: dict, frontier: dict) -> list:
    require(digest(program) == SCALAR_SHA, 'Native scalar program changed')
    require(digest(params) == PROFILE_AST_SHA, 'Native exact parameter AST changed')
    require(len(frontier['remainingJetIDs']) == 230, 'Jet frontier changed; reconcile before use')
    require(len(set(frontier['remainingJetIDs'])) == 230, 'Duplicated Jet IDs')
    remaining = set(frontier['remainingGlobalGuardIDs'])
    require(len(remaining) == 38, 'Guard frontier changed; reconcile before use')
    rows = frontier['cumulativeGlobalGuardRows']
    require(len(rows) == 94, 'Original guard inventory changed')
    selected = []
    for number in TARGET_NUMBERS:
        candidates = [r for r in rows if r['id'].startswith(f'N6-C-{number:03d}-')]
        require(len(candidates) == 1, 'Target ID missing or duplicated')
        r = candidates[0]
        require(r['id'] in remaining and r['status'] == 'OPEN', 'Target is no longer this OPEN baseline')
        require(r['id'] == f'N6-C-{number:03d}-{digest(r["originalGuard"])[:12]}', 'Guard identity changed')
        require(r['originalScalarProgramSHA256'] == SCALAR_SHA, 'Guard program binding changed')
        require(r['originalSourceParentSHA256'] == PARENT_SHA, 'Guard parent binding changed')
        selected.append(r)
    require(program[230] == {'op': 'definite_integral', 'args': [130, 119, 132, 229]}, 'Mass binder/endpoints changed')
    require(program[129] == {'op': 'smooth_piecewise', 'args': [122, 0, 1, 0, 128, 0]}, 'First flat join changed')
    require(program[242] == {'op': 'smooth_piecewise', 'args': [235, 0, 1, 0, 241, 0]}, 'Second flat join changed')
    require(program[114] == {'op': 'actual_opaque_value', 'args': [622820, 'actual_monotone_root']}, 'Source slow root changed')
    return selected

# Integer polynomials, coefficients in ascending degree. No floating arithmetic.
def trim(p: list[int]) -> list[int]:
    p = list(p)
    while len(p) > 1 and p[-1] == 0:
        p.pop()
    return p

def add(*ps: list[int]) -> list[int]:
    out = [0] * max(map(len, ps))
    for p in ps:
        for i, x in enumerate(p):
            out[i] += x
    return trim(out)

def mul(p: list[int], q: list[int]) -> list[int]:
    out = [0] * (len(p) + len(q) - 1)
    for i, x in enumerate(p):
        for j, y in enumerate(q):
            out[i+j] += x*y
    return trim(out)

def scale(c: int, p: list[int]) -> list[int]:
    return trim([c*x for x in p])

def derivative(p: list[int]) -> list[int]:
    return trim([i*p[i] for i in range(1, len(p))] or [0])

def polynomials(max_order: int = 12) -> list[dict]:
    require(type(max_order) is int and 0 <= max_order <= 64, 'Finite regression order must lie in [0,64]')
    u, du, p, bound = [0, 1, -1], [1, -2], [1], 1
    rows = []
    for n in range(max_order + 1):
        require(len(p)-1 <= 3*n and sum(map(abs, p)) <= bound, 'Polynomial bound regression failed')
        rows.append({'order': n, 'P_ascending': p, 'coefficient_l1': sum(map(abs, p)),
                     'B': bound, 'uniform_derivative_bound': bound*factorial(2*n)})
        p = add(mul(mul(u, u), derivative(p)), scale(-2*n, mul(mul(u, du), p)), mul(du, p))
        bound *= 24*n + 3
    return rows

def log_scale_coefficients(m: int, n: int, k: int = 10) -> list[int]:
    require(all(type(x) is int and x >= 0 for x in (m, n)) and k > 0, 'Invalid derivative orders')
    c = [1]
    for _ in range(m):
        out = [0] * (len(c)+1)
        for j, v in enumerate(c):
            out[j] -= (n+1+j)*v
            out[j+1] -= k*v
        c = out
    return c

def support_regime(a: Q, left: Q, right: Q, k: Q = Q(10)) -> str:
    """Exact theorem classification, not numerical evaluation of the integral."""
    require(a > 0 and k > 0 and 0 < left < right, 'Invalid radial interval/scale')
    end = a*(1+1/k)
    if end <= left or a >= right:
        return 'ZERO_MASS'
    if left <= a and end <= right:
        return 'FULL_MASS_CONSTANT'
    return 'POSITIVE_PARTIAL_MASS'

def finite_margins() -> dict:
    # See the written proof for exp/step-integral inequalities, valid symbolically.
    require(Q(27,8192) < 1 and Q(8002) > 1, 'Clock ratio margins failed')
    require(Q(110) > 4 and Q(8) - Q(363,50) == Q(37,50), 'Support margins failed')
    require(Q(1,20*3**6) == Q(1,14580), 'Mass lower-bound arithmetic failed')
    return {'A_strict_lower': '8002', 'B_strict_upper': '27/8192',
            'X0_strict_lower': '110', 'Xa_strict_upper': '4',
            'Xb_over_X0_strict_lower': 'exp(13)',
            'collar_s_interval': ['1/4','3'],
            'squared_outer_support_margin_lower': '(37/50)*exp(1)*X0',
            'mass_strict_lower': '1/14580', 'mass_strict_upper': '1/160',
            'inverse_mass_strict_upper': '14580'}

def run(prepared: Path, frontier_path: Path, out: Path) -> dict:
    cp = read_locked(prepared/'cartesian/checkpoints/cartesian-source-checkpoint.json', CHECKPOINT_SHA)
    frontier = read_locked(frontier_path, FRONTIER_SHA)
    db = prepared/'inputs/mean-proof-inputs-38500114302/dag/source-dag-checkpoint.sqlite'
    require(digest_bytes(db.read_bytes()) == DB_SHA, 'Native SQLite source changed')
    program, params = cp['cartesian']['scalarProgram'], parameters(cp)
    selected = verify_binding(program, params, frontier)
    terms = [json.loads((prepared/f'cartesian/rational/pde_component_{i}.json').read_text()) for i in range(3)]
    require([len(x['reducedNumeratorTerms']) for x in terms] == [169,197,654], 'PDE inventory changed')
    result = {'schema': 'MathScope.N6.SourceBumpBridge/1',
        'source': {'checkpointSHA256': CHECKPOINT_SHA, 'scalarProgramSHA256': SCALAR_SHA,
                   'profileExtractCanonicalSHA256': PROFILE_AST_SHA,
                   'profileOriginalDeclaredSHA256': 'e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152',
                   'profileHashConventionsAreNotAssertedIdentical': True,
                   'sqliteSHA256': DB_SHA, 'originalParentSHA256': PARENT_SHA,
                   'baselineFrontierSHA256': FRONTIER_SHA},
        'mathematicalEvidence': 'WRITTEN_ALL_ORDER_ANALYTIC_PROOF_PLUS_EXACT_SOURCE_BINDING_AND_FINITE_REGRESSION_NOT_LEAN',
        'primitiveScope': 'Native radial bump and mass on 1/4<=s<=3; no full-source domain transport inferred',
        'constantMass': '(1/10)*integral_0^1 exp(-1/(t*(1-t))) dt',
        'normalizerSlowDerivatives': 'Every positive order is exactly zero on the certified collar',
        'exactMargins': finite_margins(), 'polynomialRegression': polynomials(),
        'mixedLogScaleRegression': [{'m':m,'n':n,'coefficients':log_scale_coefficients(m,n)} for m in range(5) for n in range(3)],
        'targetRows': [{'id':r['id'], 'originalGuard':r['originalGuard'],
                        'newPrimitiveEvidence':'PROVED_ON_EXPLICIT_SOURCE_COLLAR',
                        'originalGlobalGuardStatus':'OPEN',
                        'missingForGlobalDischarge':'Transport every native j0 band/label/copy evaluation into the certified source domain'} for r in selected],
        'frontierBefore':{'CartesianJet':230,'GlobalGuard':38,'PDE':1020,'total':1288},
        'frontierAfter':{'CartesianJet':230,'GlobalGuard':38,'PDE':1020,'total':1288},
        'newOriginalObligationsDischarged':0, 'globalSourceImageProved':False,
        'originalN601Complete':False,'originalN602Complete':False,'M3Completed':56,'M3Total':64,
        'progressFilesModified':False,'originalProducerModified':False,
        'separatePicardWorkModified':False, 'sampledValuesUsedAsProof':False}
    out.mkdir(parents=True,exist_ok=True)
    (out/'bump-bridge-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    roots = list(range(108,245))
    witness = {'sourceScalarProgramSHA256':SCALAR_SHA,
               'selectedScalarNodes': [{'id':i,'node':program[i],'nodeSHA256':digest(program[i])} for i in roots],
               'parametersExactExpressions':params,
               'scope':'Review excerpt; run against the full locked checkpoint to authenticate it'}
    (out/'bump-source-witness.json').write_text(json.dumps(witness,ensure_ascii=False,indent=2)+'\n')
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepared',type=Path,required=True)
    parser.add_argument('--frontier',type=Path,required=True)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    try:
        r=run(args.prepared,args.frontier,args.out)
    except (OSError,ValueError,KeyError) as error:
        parser.exit(2,str(error)+'\n')
    print(json.dumps({'execution':'PASS','originalObligationsDischarged':r['newOriginalObligationsDischarged'],
                      'sourceBoundPrimitiveTargets':len(r['targetRows']),'remaining':r['frontierAfter']}))
