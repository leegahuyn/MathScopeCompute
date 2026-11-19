"""Replay the original 67 requests and the separate shrinking-cutoff jets."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction
from hashlib import sha256
from importlib.util import module_from_spec, spec_from_file_location
from math import ceil, comb
from pathlib import Path
import json
import sys

import sympy as sp


STENCIL = 'whole-k-annular-initial/localized-force/original-67plus13-polynomials.json'
TAIL = 'final67/cut-correction-tail.json'
PINS = {
    STENCIL: '1f02933c4a09f96efca99188fba2731526df81459deb1deb3c249433b73295f7',
    TAIL: '7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b',
    'summation': '67c2f0a63d4b1a5fdf86a4c25f776ed0fdf0a6cd379d08aaf858231621c04450',
    'cutoff': '535e1126c6450627bd61cf0e5a94c33938b12e71886a995175493dddfe6b8ced',
}


def pinned(path, key):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == PINS[key], path
    return raw


def cutoff_composition(stencil):
    labels = [label for label in stencil['variables'] if '@' in label and not label.startswith('C@')]
    result = {}
    used = set()
    for label in labels:
        field, raw_orders = label.split('@')
        orders = tuple(map(int, raw_orders.split(',')))
        transverse, z_order, tau_order = orders[:-2], orders[-2], orders[-1]
        terms = []
        for z in range(z_order + 1):
            for tau in range(tau_order + 1):
                lower = (*transverse, z_order - z, tau_order - tau)
                operand = field + '@' + ','.join(map(str, lower))
                assert operand in labels, (label, operand)
                terms.append({'stageJet': operand, 'cutoffJet': [z, tau],
                              'coefficient': comb(z_order, z) * comb(tau_order, tau),
                              'tau0HPower': z})
                used.add((z, tau))
        result[label] = terms
    assert Counter(label.split('@')[0] for label in labels) == {'A0':19, 'A1':19, 'A2':19, 'b':6, 'p':4}
    assert used == {(0, 0), (0, 1), (1, 0), (1, 1), (2, 0), (3, 0)}
    return result, sorted(used)


def compare_direct_derivatives(rows):
    x, y, r2, z, tau = sp.symbols('x y r2 z tau')
    cutoff = 2 + z + 3*z**2 + 7*z**3 + 5*tau*z + 4*tau
    profile = (1+x)**3*(2+y)**3*(3+z)**3*(4+tau)**2
    fields = {'A0': profile, 'A1': 3*profile, 'A2': -2*profile, 'p': 5*profile,
              'b': (1+r2)**3*(2+z)**3*(3+tau)**2}
    point = {x:sp.Rational(1, 2), y:sp.Rational(1, 3), r2:sp.Rational(5, 12),
             z:sp.Rational(-1, 5), tau:sp.Rational(2, 3)}

    def orientations(label):
        field, orders = label.split('@')
        variables = (r2, z, tau) if field == 'b' else (x, y, z, tau)
        return field, tuple(zip(variables, map(int, orders.split(','))))

    values = {}
    for label, terms in rows.items():
        field, directions = orientations(label)
        actual = sp.diff(cutoff*fields[field], *directions).subs(point)
        terms_at_point = []
        for term in terms:
            _, lower = orientations(term['stageJet'])
            z_order, tau_order = term['cutoffJet']
            cutoff_value = sp.diff(cutoff, (z, z_order), (tau, tau_order)).subs(point)
            field_value = sp.diff(fields[field], *lower).subs(point)
            terms_at_point.append(term['coefficient']*cutoff_value*field_value)
        assert sum(terms_at_point) == actual, label
        values[label] = actual
    _, directions = orientations('A0@0,0,3,0')
    omitted = sp.diff(cutoff*profile, *directions) - cutoff*sp.diff(profile, *directions)
    assert omitted.subs(point) != 0
    assert -values['A0@0,0,1,1'] != values['A0@0,0,1,1']
    return {'exactComposedLabels': len(values), 'omittedCutoffDerivativesRejected': True,
            'wrongPhysicalTimeSignRejected': True}


def cutoff_bounds(module, cells, bits):
    coarse = [Fraction(0) for _ in range(4)]
    for cell in range(cells):
        lo = Fraction(1, 2) + Fraction(cell, 2*cells)
        hi = lo + Fraction(1, 2*cells)
        for order, interval in enumerate(module.chi_jets(lo, hi, bits)):
            coarse[order] = max(coarse[order], hi**order * max(abs(interval.lo), abs(interval.hi)))
    limits = [ceil(value) for value in coarse]

    eta, h = sp.symbols('eta h', real=True)
    L = 1-2*h*eta**2
    d = 1-eta**2
    D = sp.Rational(1, 2)-h
    t1 = 1/L
    z1 = 2*eta/L

    def Z(weight, f):
        return (2*eta*weight*f+d*sp.diff(f, eta))/L

    z2 = ((2+4*h*eta**2)/L**2 + 8*h*eta**2*d/L**3)
    assert sp.cancel(Z(1-D, z1)-z2) == 0
    ztau = 4*h*eta*d/L**3
    assert sp.cancel(Z(0, t1)-ztau) == 0
    assert sp.cancel(((1-D)*z1-D*eta*sp.diff(z1, eta))/L-ztau) == 0
    z3 = Z(1-2*D, z2)

    eta_max, h_max, L_min = Fraction(3, 4), Fraction(1, 64), Fraction(503, 512)
    z2_max = (2+4*h_max*eta_max**2)/L_min**2 + 8*h_max*eta_max**2/L_min**3
    z2_eta_max = (8*h_max*eta_max/L_min**2 +
                  (2+4*h_max*eta_max**2)*8*h_max*eta_max/L_min**3 +
                  16*h_max*eta_max/L_min**3 + 96*h_max**2*eta_max**3/L_min**4)
    assert 2*eta_max/L_min < 2 and z2_max < 3
    assert (4*h_max*eta_max*z2_max+z2_eta_max)/L_min < 1
    assert 4*h_max*eta_max/L_min**3 < Fraction(1, 16)
    _, m1, m2, m3 = limits
    unit_caps = {
        '0,0': 1, '0,1': ceil(2*m1/L_min),
        '1,0': 3*m1, '1,1': ceil(3*(2*m2/L_min+Fraction(m1, 16))),
        '2,0': 2*(4*m2+3*m1), '3,0': 3*(8*m3+18*m2+m1),
    }
    return {'transitionCells': cells, 'outwardBits': bits,
            'weightedSeedAbsUpper': [str(value) for value in coarse],
            'weightedSeedIntegerCaps': limits,
            'physicalDerivativesInTau0Units': unit_caps,
            'z3EtaFormula': str(sp.factor(z3)),
            'thirdSeedPositive': coarse[3] > 0}


def read_original_sum(path):
    program = ''.join(pinned(path, 'summation').decode().split())
    for equation in (
        'allowedQ=newSet([z,t])', 'allowedB=newSet([s,z,t])',
        'constb=G.substitute(rawB,s,G.add(G.pow(x,2),G.pow(y,2)))',
        'c=classification.plateau?G.one:originalFinalCutoffRoot(G,argument)',
        'potential=row.A.map(v=>G.mul(c,v)),directB=row.B.map(v=>G.mul(c,v))',
        'commutator=cross(G,dc,row.A)',
        'pressure=G.mul(c,row.p)', 'pressure=G.add(base.p,...stages.map(row=>row.cutoffPressure))',
        'finalPotential:A,finalDirectMean:B,velocity,pressure',
        'inside=G.div(right,G.add(left,right))',
        'returnG.choose(s,G.q(1,2),G.one,G.one,inside,G.zero);',
    ):
        assert equation in program, equation


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('goal', 'original-sum', 'original-cutoff', 'out'):
        parser.add_argument('--'+name, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise RuntimeError('Run the source verification with Python assertions enabled')
    stencil = json.loads(pinned(args.goal / STENCIL, STENCIL))
    tail = json.loads(pinned(args.goal / TAIL, TAIL))
    assert tail['schema'] == 'MathScope.N7.ActualCutCorrectionTail/1'
    read_original_sum(args.original_sum)
    pinned(args.original_cutoff, 'cutoff')
    spec = spec_from_file_location('mathscope_original_cutoff', args.original_cutoff)
    module = module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    rows, cutoff_jets = cutoff_composition(stencil)
    bounds = cutoff_bounds(module, cells=256, bits=80)
    assert set(bounds['physicalDerivativesInTau0Units']) == {f'{z},{tau}' for z, tau in cutoff_jets}
    payload = {'status':'VERIFIED_ORIGINAL_67_COMPOSITION_WITH_CONDITIONAL_CUTOFF_BOUNDS',
               'sourcePins': PINS, 'requiredFinalLabels': len(rows), 'cutoffJets': cutoff_jets,
               'termsPerStage': sum(map(len, rows.values())), 'rows': rows,
               'controls': compare_direct_derivatives(rows), 'bounds': bounds,
               'normalization': 'cutoff jet (z,tau) is bounded after multiplication by tau0^(z*D+tau); each normalized product retains (tau0^h)^z',
               'activeStages': [1, 2, 3, 4], 'actualStageJetIntervals': 'OPEN',
               'N706':'OPEN', 'N805':'OPEN', 'finalJets': 0, 'release':'HOLD'}
    with args.out.open('x', encoding='utf-8', newline='\n') as output:
        json.dump(payload, output, indent=2)
        output.write('\n')
    print(json.dumps({'status':payload['status'], 'termsPerStage':payload['termsPerStage'],
                      'weightedSeedIntegerCaps':bounds['weightedSeedIntegerCaps'],
                      'physicalDerivativeCaps':bounds['physicalDerivativesInTau0Units']}))


if __name__ == '__main__':
    main()
