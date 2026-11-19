"""Independent rational differential algebra on ACTUAL n=1 source operands.

Native profile jets are formal atoms, never sampled or replaced by numbers in
the positive checks. Their analytic interpretation remains a stated premise.
"""
import argparse
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import sympy as s

assert __debug__, 'Exact source verification requires assertions.'
p = argparse.ArgumentParser()
p.add_argument('source_slice', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
raw = a.source_slice.read_bytes()
d = json.loads(raw)
assert d['schema'] == 'MathScope.OriginalN1AxialActualJetSlice/1'
assert d['originalPrefix'] == dict(count=117100, sha256='d125d121e115ea2e3c4b67a37c72a30c1dbcbca705007ca5c02412c1bf5c2116')
assert d['registrySHA256'] == 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
assert d['registryNamespaceControl']['sameFunctionIdIsDifferentFunction']
assert d['registryNamespaceControl']['N4_672']['name'] == 'ActualCompactSlowCoefficient_565'
assert d['registryNamespaceControl']['N4RegistrySHA256'] == '049b05929080b4c8a16a5e2c74a1d6f1ad51232fdfb90222d42ffb4f0bbb22ad'
nodes = dict(d['sourceNodes'])
X, eta, h = s.symbols('X eta h', real=True)
A, D = s.Rational(1, 2)+h, s.Rational(1, 2)-h
L, delta = 1-2*h*eta**2, 1-eta**2
jets = {}


def J(name, k=0, m=0):
    key = name, k, m
    if key not in jets:
        jets[key] = s.Symbol(f'{name}_X{k}_E{m}', real=True)
    return jets[key]


atoms = {}
alias_classes = {}
for row in d['aliases']:
    key = row['name'], row['x'], row['eta']
    value = J(*key)
    if row['node'] in atoms:
        assert atoms[row['node']] == value, row
    atoms[row['node']] = value
    alias_classes.setdefault(value.name, set()).add(row['node'])


@lru_cache(None)
def source(i):
    if i in atoms:
        return atoms[i]
    op, av = nodes[i]['op'], nodes[i]['args']
    if i == 4756:
        return X
    if i == 2:
        return eta
    if op == 'rational':
        return s.Rational(*map(int, av))
    if op == 'source_parameter' and av == ['h']:
        return h
    if op == 'add':
        return sum(map(source, av))
    if op == 'multiply':
        return s.prod(map(source, av))
    if op == 'inverse':
        return 1/source(av[0])
    if op == 'integer_power':
        return source(av[0])**av[1]
    raise AssertionError(('unbound source non-rational operand', i, op, av))


def deriv(expr, coordinate):
    # Differentiate the free jet algebra, keeping h constant. The derivative
    # of a jet is another jet; mixed paths use ordinary smooth commutation.
    result = s.diff(expr, X if coordinate == 'X' else eta)
    for (name, k, m), variable in list(jets.items()):
        if variable in expr.free_symbols:
            result += s.diff(expr, variable)*J(name, k+(coordinate == 'X'), m+(coordinate == 'E'))
    return result


def DX(f):
    return deriv(f, 'X')


def DE(f):
    return deriv(f, 'E')


def T(exponent, f):
    return (-exponent*f+X*DX(f)+D*eta*DE(f))/L


def Z(exponent, f):
    return (2*eta*(exponent*f-X*DX(f))+delta*DE(f))/L


def Tbar(exponent, f):
    return (-exponent*f+D*eta*DE(f))/L


def Zbar(exponent, f):
    return (2*exponent*eta*f+delta*DE(f))/L


checks = {}


def verify(name, left, right):
    numerator, denominator = s.fraction(s.cancel(left-right))
    assert numerator == 0, (name, s.factor(numerator))
    checks[name] = {'pass': True, 'zeroNumerator': True,
                    'denominator': s.factor(denominator).__str__()}


U0, U1, v0, v1, Pi = (J(name) for name in ('U0','U1','v0','v1','Pi'))
c, nu, mu = -A, 2*h, s.S.Zero
current_exp, pressure_exp = c+nu, -2*A+nu
lower = Z(c-D, Z(c, U0))
expected = T(current_exp,U1) + X*v0*DX(U1) + U0*Z(current_exp,U1) \
    + X*v1*DX(U0) + U1*Z(c,U0) + Z(pressure_exp,Pi) \
    - 2*(X*DX(DX(U1))+DX(U1)) - lower
actual = source(d['raw'])
verify('actual_117045_equals_full_original_n1_nonconservative_coefficient', actual, expected)
actual_eta = source(d['rawEta'])
verify('actual_raw_eta_AD_keeps_all_coefficient_and_primitive_jet_terms', actual_eta, DE(expected))

H, Q = v0*U1+v1*U0, 2*U0*U1
C0 = DX(X*v0)+Z(c,U0)
C1 = DX(X*v1)+Z(current_exp,U1)
continuity_defect = U1*C0+U0*C1
conservative = T(current_exp,U1)+DX(X*H)+Z(pressure_exp,Q+Pi) \
    -2*(X*DX(DX(U1))+DX(U1))-lower
verify('actual_raw_to_conservative_keeps_both_ordered_continuity_defects',
       actual, conservative-continuity_defect)

moment_density = Tbar(D+nu,U1)+Zbar(mu,Q-X*DX(Pi)) \
    -Zbar(mu,Zbar(D,U0))
boundary_terms = [X*U1/L, X*H, -2*eta*X*(Q+Pi)/L,
                  Zbar(mu,X*Pi), -2*X*DX(U1),
                  2*eta*X*Z(c,U0)/L, Zbar(mu,2*eta*X*U0/L)]
boundary = sum(boundary_terms)
verify('actual_raw_equals_Step4_density_plus_all_seven_boundaries_minus_defects',
       actual, moment_density+DX(boundary)-continuity_defect)
verify('actual_raw_eta_equals_ordinary_eta_derivative_of_complete_Step4_identity',
       actual_eta, DE(moment_density+DX(boundary)-continuity_defect))

# The actual source density and native eta materialization use the same fixed
# endpoints; this is a structural identity, not an integral-value assertion.
assert nodes[117047] == dict(op='smooth_piecewise',args=[4756,28814,28824,0,117045,0])
assert nodes[d['densityEta']] == dict(op='smooth_piecewise',args=[4756,28814,28824,0,d['rawEta'],0])
assert d['nativeDensityEta'] == d['densityEta']
for integral, integrand, binder, left, right in (
    (117057,117056,117055,28814,4756),
    (117066,117065,117064,4756,28824),
    (117075,117074,117073,28814,28824),
):
    assert nodes[integral] == dict(op='definite_integral',args=[integrand,binder,left,right])
    assert nodes[integrand] == dict(op='actual_expression_partial',args=[1,[binder,2],[0,0]])
    assert nodes[binder]['op'] == 'coordinate'


@lru_cache(None)
def free_eta(i):
    node, av = nodes[i], nodes[i]['args']
    if node['op'] == 'coordinate':
        return i == 2
    if node['op'] in ('rational','source_parameter'):
        return False
    children = av[:1] if node['op'] in ('integer_power','source_step_derivative') else av
    return any(free_eta(j) for j in children)


assert not free_eta(28814) and not free_eta(28824)
checks['supported_density_eta_and_all_three_actual_integral_frames'] = {'pass': True}

# Negative controls: these are free-jet countermodels, not substituted source
# values. The positive checks above retain every original profile jet symbol.
inner = Z(c,U0)
frozen_inner_eta = (2*eta*(c*DE(U0)-X*DE(DX(U0)))+delta*DE(DE(U0)))/L
frozen_lower = (2*eta*((c-D)*inner-X*DX(inner))+delta*frozen_inner_eta)/L
differences = {
    'frozen_eta_coefficients_in_previous_viscosity': lower-frozen_lower,
    'missing_outer_axial_exponent_shift': lower-Z(c,Z(c,U0)),
    'missing_positive_pressure_boundary': DX(boundary_terms[3]),
}
controls = {}
for name, difference in differences.items():
    numerator, denominator = s.fraction(s.cancel(difference))
    assert numerator != 0, name
    point = {X:1,eta:s.Rational(1,2),h:s.Rational(1,32)}
    point.update({variable:0 for variable in jets.values()})
    point[U0 if name != 'missing_positive_pressure_boundary' else J('Pi',0,1)] = 1
    value = s.cancel(difference.subs(point))
    assert value != 0, (name, value)
    controls[name] = dict(rejected=True, freeJetWitness=str(value),
                          witnessMeaning='Algebra sensitivity only; no claim these are actual native source field values.')

out = dict(schema='MathScope.OriginalN1AxialSourceConservativeIdentity/1',
           status='PASS_ACTUAL_N1_SOURCE_RAW_AND_ETA_DIFFERENTIAL_IDENTITIES',
           sourceSliceSHA256=hashlib.sha256(raw).hexdigest(),
           originalPrefix=d['originalPrefix'],registrySHA256=d['registrySHA256'],
           originalOrderOneFunction=672,originalOrderOneBody=117069,
           sourceDensity=117047,sourceRaw=117045,sourceRawEta=d['rawEta'],
           sourceSupportedEta=d['densityEta'],sliceNodes=len(nodes),
           exactActualJetAliases=len(d['aliases']),jetClasses=len(alias_classes),
           registryNamespaceControl=d['registryNamespaceControl'],
           mixedPathsAliased={k:sorted(v) for k,v in alias_classes.items() if len(v)>1},
           method=f'SymPy {s.__version__}, exact rational differential-polynomial normalization; no numerical equality',
           nonzeroDenominatorRequired='L=1-2*h*eta^2; original 0<h<1/16 and |eta|<=1 give L>7/8.',
           checks=checks,negativeControls=controls,
           minimalRemainingObligations=[
               'Ordinary derivatives/mixed commutation of each actual primitive jet used in the finite source graph.',
               'Both actual continuity defects C0,C1 vanish by the same source stream identities.',
               'All seven actual boundary terms vanish at the axis and Xplus; exterior raw cutoff replacement uses actual inner/exterior PDE/support.',
               'Fixed compact eta differentiation under the actual source-native integral and zero current/previous full moments.',
               'At n=1 previous axial moment is the separate leading U0/M0 identity; positive-order induction alone does not supply it.',
               'For general n>=1 construct the actual order-n tuples and every ordered pair; this finite source proof is n=1 only.'
           ],release='HOLD')
a.output.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(dict(status=out['status'],checks=len(checks),controls=len(controls),
                     sourceRawEta=d['rawEta'],sliceNodes=len(nodes),jetAliases=len(d['aliases']))))
