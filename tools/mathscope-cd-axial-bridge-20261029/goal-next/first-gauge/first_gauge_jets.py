"""Exact Cartesian derivatives of the first correction on a positive polar chart."""
from collections import Counter
from functools import cache
from hashlib import sha256
from pathlib import Path
import json
import sys

import sympy as sp

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'first-force-repair'))
from verify_repaired_first_force import BASE, git_blob

REQUEST = ('research-ide/mathscope-m3/evidence/work-recovery-20261018T072604Z_b479c2d1/'
           'work/prune_recovery/energy/evidence/MISSING_ACTUAL_JET_REQUEST.json')
REQUEST_SHA = '93e87aaf51e5c2a9cd87d04e32af3d281c081446a7e42fd3d4bce448ee335c0c'
ORIGINAL_FIELDS = {'A0': 'A_x', 'A1': 'A_y', 'A2': 'A_z', 'b': 'b', 'p': 'pressure_increment'}

S = sp.Symbol('s', positive=True)
Z, TAU, THETA = sp.symbols('z tau theta', real=True)
POLAR = (S, Z, TAU, THETA)
X, Y = sp.symbols('x y', real=True)
CART = (X, Y, Z, TAU)
F = sp.Function('source_field')(*POLAR)


def derivative(expr, direction):
    if direction == 0:
        return 2 * sp.sqrt(S) * sp.cos(THETA) * sp.diff(expr, S) - (
            sp.sin(THETA) / sp.sqrt(S)) * sp.diff(expr, THETA)
    if direction == 1:
        return 2 * sp.sqrt(S) * sp.sin(THETA) * sp.diff(expr, S) + (
            sp.cos(THETA) / sp.sqrt(S)) * sp.diff(expr, THETA)
    return sp.diff(expr, CART[direction])


@cache
def chart_expression(order):
    value = F
    for direction, count in enumerate(order):
        for _ in range(count):
            value = sp.expand(derivative(value, direction))
    return value


def coefficients(expr, graph, inputs, system):
    @cache
    def at(value):
        if value in POLAR:
            return inputs[POLAR.index(value)]
        if value.is_Rational:
            return graph.rat(str(value))
        if value == F or value.is_Derivative:
            if value == F:
                orders = (0, 0, 0, 0)
            else:
                assert value.expr == F
                counts = dict(value.variable_count)
                orders = tuple(int(counts.get(variable, 0)) for variable in POLAR)
            return graph.apply(system, inputs, orders)
        if value.is_Add:
            return graph.add(*(at(child) for child in value.args))
        if value.is_Mul:
            return graph.mul(*(at(child) for child in value.args))
        if value.func in (sp.cos, sp.sin):
            return graph.emit('cosine' if value.func == sp.cos else 'sine', at(value.args[0]))
        if value.is_Pow:
            base, exponent = value.args
            n, d = exponent.as_numer_denom()
            assert exponent.is_Rational and (d == 1 or (d == 2 and base == S)), value
            root = at(base) if d == 1 else graph.emit('sqrt_positive', at(base))
            power = root if abs(n) == 1 else graph.emit('integer_power', root, int(abs(n)))
            return power if n > 0 else graph.inv(power)
        raise ValueError(f'Unsupported polar derivative atom {value}')

    return at(expr)


def verify_chain_rules(cartesian_orders, radial_orders):
    # Cartesian polynomials here test the chart identities only.
    field = X**4 * Y**2 * Z**2 * TAU**2 + X**3 * Y * Z * TAU + X * Y**4 * Z**2 + Y * Z + TAU + 1
    polar = field.subs({X: sp.sqrt(S)*sp.cos(THETA), Y: sp.sqrt(S)*sp.sin(THETA)}, simultaneous=True)
    radial = S**3 * Z**2 * TAU**2 + S*Z*TAU + 1
    points = ((1, sp.Rational(3, 5), sp.Rational(4, 5)), (2, sp.Rational(-5, 13), sp.Rational(12, 13)))
    for radius, cos, sin in points:
        cart = dict(zip(CART, (radius*cos, radius*sin, sp.Rational(3, 7), sp.Rational(2, 11)), strict=True))
        where = {S: radius**2, sp.cos(THETA): cos, sp.sin(THETA): sin, Z: cart[Z], TAU: cart[TAU]}
        for order in cartesian_orders:
            symbolic = chart_expression(order)
            polar_jets = {term: sp.diff(polar, *term.variable_count) for term in symbolic.atoms(sp.Derivative)}
            lhs = symbolic.xreplace({F: polar, **polar_jets}).subs(where).expand()
            rhs = sp.diff(field, *zip(CART, order, strict=True)).subs(cart).expand()
            assert lhs == rhs, order
        for order in radial_orders:
            radial_derivative = sp.diff(radial, *zip(POLAR[:3], order, strict=True))
            original = radial.subs(S, X*X+Y*Y)
            # The s variable of b is independent of physical x and y.
            assert radial_derivative.subs(where) == (
                sp.diff(original.subs({Y: 0, X: sp.sqrt(S)}, simultaneous=True),
                        *zip(POLAR[:3], order, strict=True)).subs(where))
    wrong_x = 2*sp.sqrt(S)*sp.cos(THETA)*sp.diff(sp.sqrt(S)*sp.sin(THETA), S) + (
        sp.sin(THETA)/sp.sqrt(S))*sp.diff(sp.sqrt(S)*sp.sin(THETA), THETA)
    assert sp.simplify(wrong_x.subs({sp.sin(THETA): sp.Rational(4, 5),
                                   sp.cos(THETA): sp.Rational(3, 5)})) == sp.Rational(24, 25)
    return {'exactPolarCartesianControlPoints': len(points), 'controlRadii': [r for r, _, _ in points],
            'cartesianMultiindices': len(cartesian_orders),
            'radialMultiindices': len(radial_orders), 'reversedAngularSignRejected': True}


def materialize_requested_jets(graph, physical, inputs, repo):
    raw = git_blob(repo, BASE, REQUEST)
    assert sha256(raw).hexdigest() == REQUEST_SHA
    request = json.loads(raw)
    assert request['coordinates'] == {'A_and_p': ['x', 'y', 'z', 'tau'],
                                      'b_and_C': ['s', 'z', 'tau'],
                                      'physical_time_derivative': '-partial_tau'}
    targets = request['requested_field_jets']
    assert len(set(targets)) == len(targets) == 67
    output, functions = {}, {}
    cart_orders, radial_orders = set(), set()
    for source_name, name in ORIGINAL_FIELDS.items():
        op, (r2, _, _, left, body, right) = graph.node(physical[name])
        assert op == 'smooth_piecewise' and r2 == inputs[0] and left == right == 0
        params = inputs[:3] if source_name == 'b' else inputs
        functions[source_name] = graph.define(f'FirstCorrectionInterior_{name}', body, params)
    for target in targets:
        name, text = target.split('@')
        order = tuple(int(n) for n in text.split(','))
        assert min(order) >= 0 and sum(order) <= 3
        if name == 'b':
            assert len(order) == 3
            radial_orders.add(order)
            root = graph.apply(functions[name], inputs[:3], order)
        else:
            assert len(order) == 4
            cart_orders.add(order)
            root = coefficients(chart_expression(order), graph, inputs, functions[name])
        output[target] = root
    counts = Counter(target.split('@')[0] for target in output)
    assert counts == {'A0': 19, 'A1': 19, 'A2': 19, 'b': 6, 'p': 4}
    controls = verify_chain_rules(cart_orders, radial_orders)
    return {'originalRequestSHA256': REQUEST_SHA, 'originalTargetCounts': dict(counts),
            'sourceInteriorFunctionSystems': functions, 'interiorRoots': output,
            'strictExteriorAndAxisJetValue': 0, 'twoEnvelopeSeamsOfPositiveOrder': 'OPEN',
            'cartesianChainRuleControls': controls, 'actualFinalClosedCellJetIntervals': 0}
