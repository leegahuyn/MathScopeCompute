"""Independent exact-coordinate and high-precision scale replay of accepted core data."""
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
from pathlib import Path
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[3]
data = json.load(sys.stdin)
checks = []

def check(name, value):
    checks.append({'id': name, 'pass': bool(value)})
    if not value:
        raise AssertionError(name)

def dec(x):
    r = F(x)
    return D(r.numerator)/D(r.denominator)

for observation in data['observations']:
    provenance = observation['provenance']
    assembly_path = ROOT/provenance['assembly']['path']
    assembly = json.loads(assembly_path.read_text())
    core_path = ROOT/provenance['acceptedCore']['path']
    core = json.loads(core_path.read_text())
    check('assembly-and-accepted-core-sha', hashlib.sha256(assembly_path.read_bytes()).hexdigest() == provenance['assembly']['sha256'] and hashlib.sha256(core_path.read_bytes()).hexdigest() == provenance['acceptedCore']['sha256'] and assembly['acceptedEvidence']['core']['sha256'] == provenance['acceptedCore']['sha256'])
    for sample in observation['samples']:
        source = core['evaluations'][sample['sourceIndex']]
        Y = F(source['Y']); q = F(sample['physicalPoint']['qExact'])
        check('original-core-source-membership', source['quantity'] == sample['quantity'] and source['Y'] == sample['sourceY'] and source['eta'] == sample['etaExact'] == '0' and source['sameInfiniteCoreInterval'] == sample['sourcePhiInterval'])
        check('physical-r-and-q', F(sample['physicalPoint']['lambdaR2Exact']) == 2*q*Y)
        restored = []
        for chart in sample['chartPair']:
            Q = F(1,2**chart['ell']); T = F(chart['TExact']); LR2 = F(chart['lambdaR2Exact'])
            # Independent inverse maps; the stored restoredY/restoredQ fields are not inputs.
            check('independent-inverse-Q-T-Y', F(chart['QExact']) == Q and Q*T == q and LR2/(2*T) == Y and Q*LR2 == 2*q*Y)
            ledger = chart['physicalScale']
            q_exp = [F(x) for x in ledger['QVelocityExponent']]
            t_exp = [F(x)+F(y) for x,y in zip(ledger['TRadiusExponent'],ledger['TChartVelocityExponent'])]
            check('independent-physical-exponent-algebra', q_exp == [F(-1,2),F(-1)] and t_exp == q_exp and all(F(x)+F(y)==0 for x,y in zip(ledger['TChartVelocityExponent'],ledger['restoreNormalizedExponent'])))
            with localcontext() as ctx:
                ctx.prec = 400
                h_hi = D(2)**(-1000)
                endpoints = []
                for h in (D(0),h_hi):
                    scale = (-(1+h)*dec(T).ln()).exp()
                    endpoints.extend(scale*dec(source['sameInfiniteCoreInterval'][key]) for key in ('lower','upper'))
                lo, hi = chart['chartNormalizedVelocityInterval']
                check('independent-400-digit-field-scale', D.from_float(lo) <= min(endpoints) and D.from_float(hi) >= max(endpoints))
                # Apply this chart's inverse factor to its independently recomputed forward value.
                inverse = ((1+h_hi)*dec(T).ln()).exp()
                restored.append((endpoints[-2]*inverse,endpoints[-1]*inverse))
                rlo,rhi=chart['restoredNormalizedInterval']
                check('independent-400-digit-inverse-field', D.from_float(rlo)<=restored[-1][0] and D.from_float(rhi)>=restored[-1][1])
        check('two-chart-physical-field-equality', all(abs(x-y)<D('1e-395') for x,y in zip(restored[0],restored[1])))

print(json.dumps({'schema':'MathScope.IndependentSourceCoreOverlap/1','arithmetic':'Python Fraction coordinates and exponents; 400-digit Decimal transcendental reference; original source byte hashes','checks':checks,'total':len(checks),'pass':all(x['pass'] for x in checks)},separators=(',',':')))
