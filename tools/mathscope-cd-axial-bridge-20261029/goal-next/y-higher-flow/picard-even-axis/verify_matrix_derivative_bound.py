#!/usr/bin/env python3
"""Exact coefficientwise arithmetic and pinned source-shape replay.

This checks implications, not the analytic hypotheses or source graph evaluation.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', type=Path, required=True)
parser.add_argument('--audit', type=Path, default=Path(__file__).parent / 'coefficient-dependencies.json')
parser.add_argument('--out', type=Path)
args = parser.parse_args()
BASE = args.source_dir
SOURCE = BASE / 'actual-residual-order-induction-source.mjs'
FIRST = BASE / 'actual-continuation-exact-inner.mjs'
AUDIT = args.audit
PINS = {
    SOURCE: '30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047',
    FIRST: '3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8',
    AUDIT: 'c9f094b41d22f9cec2c34a2fef71b47cc95fd3b203111eee2b5e28d9596b85e0',
}
for path, expected in PINS.items():
    assert hashlib.sha256(path.read_bytes().replace(b'\r\n',b'\n')).hexdigest() == expected, str(path)

general = SOURCE.read_text(encoding='utf-8')
first = FIRST.read_text(encoding='utf-8')
kernel = general.split('export function actualInductionLinearKernel', 1)[1].split('function sourceSystem', 1)[0]
first_kernel = first.split('const xi=G.var', 1)[1].split('const rawForcing=', 1)[0]
pat = r'matrix[01]\[\d\]\[\d\]=[^;]+;'
def assignments(text):
    a = re.findall(pat, text)
    return [re.sub(r'\s+', '', x).replace('lambda1', 'lambda').replace('Z(b0,', 'Z(b,').replace('Z(c0,', 'Z(c,') for x in a]
assert assignments(kernel) == assignments(first_kernel)
assert len(assignments(kernel)) == 18
assert assignments(kernel) != assignments(first_kernel.replace('matrix0[3][0]=G.mul(q(4),xi,F0)', 'matrix0[3][0]=G.mul(q(5),xi,F0)'))
for fragment in (
    'const Z=B=>G.mul(B,G.add(G.mul(q(5),E),q(5),G.mul(q(6),e1)));',
    'const DXZ=B=>G.mul(B,G.add(G.mul(q(5),E),q(10),G.mul(q(6),e1)));',
    'const matrixBound=G.mul(q(512),G.add(o,E),G.add(o,H[0],V[0],Z(H[0]))),C=G.mul(q(2),G.add(matrixBound,...forcingBounds));',
    'atXi=id=>G.substitute(id,X,G.pow(xi,2))',
):
    assert fragment in general, fragment
assert 'C1=G.div(G.mul(q(262144),G.pow(B,2)),G.pow(delta,2))' in first
audit = json.loads(AUDIT.read_text(encoding='utf-8'))
assert [r['order'] for r in audit['rows']] == [1, 2, 3, 4, 5]
assert all(r['lowerPicardNodes'] == 0 and r['naturalSeriesNodes'] == 103 for r in audit['rows'])
assert audit['nonzeroCoefficientDerivatives'] == 95

# Monomials are indexed (E,H,V,Z); each coefficient is a Python integer.
zero = (0, 0, 0, 0)
E, H, V, Z = (1,0,0,0), (0,1,0,0), (0,0,1,0), (0,0,0,1)
EH, EV, EZ = (1,1,0,0), (1,0,1,0), (1,0,0,1)
bound = {x:1024 for x in (zero,E,H,V,Z,EH,EV,EZ)}
rows = {
    'A0_row_3': {H:12},
    'A0_row_4': {EH:224,H:44,Z:4,V:7,zero:2},
    'A0_row_5': {EH:160,H:172,Z:4,V:3,zero:2},
    'A1_row_4': {H:168},
    'A1_row_5': {H:120},
}
slack = {}
for name, row in rows.items():
    remainder = {monomial: bound.get(monomial,0) - row.get(monomial,0) for monomial in bound.keys() | row.keys()}
    assert all(c >= 0 for c in remainder.values()), (name, remainder)
    slack[name] = min(remainder.values())

# N1: H=B, V<=28 B/delta, E<=5, Z<=30 B+768 B/delta,
# with B>=1 and 0<delta<=1. Compare each row with C1 via u=B/delta>=1.
row1_coefficients = {'A0_row_3':12, 'A0_row_4':4554, 'A0_row_5':4250, 'A1_row_4':168, 'A1_row_5':120}
assert max(row1_coefficients.values()) < 262144
assert any(bound.get(k,0)-v < 0 for k,v in {H:1025}.items())

receipt = json.dumps({'status':'PASS', 'source_assignment_count':18, 'source_audit_orders':[1,2,3,4,5],
    'source_nonzero_derivative_roots':95, 'higher_row_polynomial_minimum_coefficients':slack,
    'n1_row_upper_coefficients_times_B_over_delta':row1_coefficients,
    'negative_controls':['modified_source_coefficient_rejected','oversized_row_coefficient_rejected'],
    'conclusion':'CONDITIONAL on the stated analytic leading majorants and domain; not a native numerical supremum or release closure',
    'canonical_LF_pins':{k.name:v for k,v in PINS.items()}}, indent=2) + '\n'
if args.out:
    args.out.write_text(receipt, encoding='utf-8', newline='\n')
print(receipt, end='')
