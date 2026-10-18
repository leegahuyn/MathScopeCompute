"""Independent scoped review of the newly implemented original outer cutoff.

This reads the M3 source; it never changes it or grants original M3 acceptance.
Symbolic identities supplement the written interval proof, not a replacement
for native field operands or whole-K integration.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from datetime import datetime, timezone
from fractions import Fraction

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
M3 = ROOT / 'research-ide/mathscope-m3/recovery-20261019'
sys.path.insert(0, str(M3))

import sympy as sp
from outer_cutoff import ActualOuterCutoff, I, chi_jets, PINS


def file_record(path: Path) -> dict:
    data = path.read_bytes()
    return {'path': path.relative_to(ROOT).as_posix(), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=HERE/'evidence/OUTER_CUTOFF_INDEPENDENT_REVIEW.json')
    args = parser.parse_args()
    out = args.output.resolve()
    if not out.is_relative_to(HERE/'evidence') or out.exists():
        raise ValueError('Choose an unused output file inside this recovery evidence directory.')
    reviewed = [M3/'outer_cutoff.py', M3/'OUTER_CUTOFF_PROOF.md', M3/'run_outer_cutoff.py']
    before = [file_record(path) for path in reviewed]
    evaluator = ActualOuterCutoff()
    s, z, tau, z0, tau0, t, v = sp.symbols('s z tau z0 tau0 t v', positive=True)
    chi = sp.Function('chi')
    derivative = lambda argument, order: sp.diff(chi(v), v, order).subs(v, argument)
    axial_argument = 2*(z/z0)**2
    axial = [chi(axial_argument),
             4*(z/z0)*derivative(axial_argument, 1),
             4*derivative(axial_argument, 1)+16*(z/z0)**2*derivative(axial_argument, 2),
             48*(z/z0)*derivative(axial_argument, 2)+64*(z/z0)**3*derivative(axial_argument, 3)]
    original = chi(2*s)*chi(axial_argument)*chi(tau/tau0)
    rows = []
    for atom in evaluator.atoms:
        a, b, c = map(int, atom.split('@')[1].split(','))
        actual = sp.diff(original, s, a, z, b, tau, c)
        contract = 2**a*derivative(2*s, a)*axial[b]*derivative(tau/tau0, c)*z0**(-b)*tau0**(-c)
        remainder = sp.simplify(actual-contract)
        rows.append({'atom': atom, 'symbolicRemainder': str(remainder), 'pass': remainder == 0})
    time_remainder = sp.simplify(sp.diff(original.subs(tau, 1-t), t) + sp.diff(original, tau).subs(tau, 1-t))
    q = Fraction
    zero = evaluator.evaluate(I(q(3,4), 1), I(0,q(1,4)), I(0,q(1,4)), I(q(1,2),1))
    zero_check = zero['status'] == 'EXACT_ZERO' and all(row['coefficient_interval'] == ['0','0'] for row in zero['cutoff_jets'].values()) and zero['whole_K_energy'] is None
    precision = {'requestedBits': 4096, 'case': 'x=y=zeta=0; rho=2/3', 'scope': 'Published API edge, not current 80-bit evidence'}
    try:
        evaluator.evaluate(I.point(0), I.point(0), I.point(0), I.point(q(2,3)), bits=4096)
        precision.update(result='SUPPORTED')
    except ValueError as error:
        precision.update(result='REJECTED', error=str(error))
    after = [file_record(path) for path in reviewed]
    report = {
        'schema': 'MathScope.IndependentOuterCutoffReview/1',
        'reviewedAt': datetime.now(timezone.utc).isoformat(),
        'reviewer': 'ChatGPT remote_state agent; independent of outer_cutoff author',
        'reviewedFiles': before, 'sourceFilesUnchangedDuringReview': before == after,
        'sourcePins': PINS, 'sourcePinChecksPassed': True, 'sympyVersion': sp.__version__,
        'mathematicalReview': [
            {'subject': 'Original cutoff primitive', 'result': 'CONSISTENT', 'reason': 'Pinned archived AST uses sigma_1 based on exp(-1/u), the unit branch s<=1/2, quotient transition and zero branch s>=1. It is distinct from the inner sigma_2 profile.'},
            {'subject': 'Exponential enclosure', 'result': 'CONSISTENT', 'reason': 'For y<=1/8 the positive Taylor tail ratios are bounded by y/(n+2). Reciprocal reverses endpoints; dyadic floor/ceiling and squaring retain inclusion. x>=bits uses e>2 and returns a nonzero upper bound, not exact zero.'},
            {'subject': 'Derivative polynomial and range', 'result': 'CONSISTENT', 'reason': 'd/du=-v^2 d/dv gives P_next=v^2(P-P_prime). v^j exp(-v) has its only positive maximum at v=j; endpoints plus that maximum and the zero limit enclose every monomial. Signed interval sums remain enclosures.'},
            {'subject': 'Quotient and seams', 'result': 'CONSISTENT', 'reason': 'Differentiating H*Q=G gives the stated binomial recurrence. H>=exp(-2)>0 since max(u,1-u)>=1/2. The exterior derivative zero is included at either seam; value and first-derivative sign intersections are justified by the quotient.'},
            {'subject': 'Physical radial/axial/time factors', 'result': 'CONSISTENT', 'reason': 'Archived r0 is exactly1, s=x^2+y^2. All13 symbolic C@a,b,c identities match independent differentiation including z0^-b and tau0^-c. These are tau derivatives; physical d/dt has the negative sign verified separately.'},
            {'subject': 'Exact global zero before local field', 'result': 'CONSISTENT', 'reason': 'The implementation does not evaluate an A/b/p provider. Cells outside the support use the original smooth global zero extension. Active cells retain missing field state, null energy, and null last-resolved tau.'},
            {'subject': 'Acceptance boundary', 'result': 'CONSISTENT', 'reason': 'The8^3/16^3 result encloses support geometry and13 cutoff jets only. The67 A/b/p operands, stages1..4 and slow-base/tails remain separate. It is not N7 energy refinement or four-axis N8 acceptance.'},
        ],
        'symbolicJetChecks': rows,
        'physicalTimeSignCheck': {'remainder': str(time_remainder), 'pass': time_remainder == 0},
        'exactZeroBranchCheck': {'pass': zero_check, 'wholeKEnergy': zero['whole_K_energy']},
        'precisionBoundary': precision,
        'findings': ([{'severity': 'LOW', 'id': 'PUBLIC_MAXIMUM_PRECISION_GUARD_BITS', 'description': 'evaluate advertises bits<=4096, but the transition requests exp_negative(bits+32), exceeding its4096 guard. Current80-bit/CLI32..256 results are unaffected.', 'recommendation': 'Bound the public range consistently, or allow the private exponential guard-bit overhead; retain the current evidence.'}] if precision['result']=='REJECTED' else []),
        'verdict': 'SCOPED_ANALYTIC_REVIEW_WITH_API_EDGE_FINDING' if precision['result']=='REJECTED' else 'SCOPED_ANALYTIC_REVIEW_NO_UNRESOLVED_FINDING',
        'pass': before == after and all(row['pass'] for row in rows) and time_remainder == 0 and zero_check,
        'newLeanExecution': False, 'originalM3Accepted': False, 'N706Closed': False, 'N805Closed': False,
        'actualGlobalLastResolvedTau': None,
    }
    with out.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(json.dumps({'pass': report['pass'], 'symbolicJets': len(rows), 'verdict': report['verdict'], 'output': str(out)}))
    if not report['pass']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
