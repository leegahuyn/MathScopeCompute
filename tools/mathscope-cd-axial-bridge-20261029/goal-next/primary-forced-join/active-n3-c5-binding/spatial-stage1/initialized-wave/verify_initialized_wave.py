"""Exact archived matching of the initialized Fourier wave inside Forced."""

import argparse
from collections import defaultdict
from fractions import Fraction
from hashlib import sha256
import json
from pathlib import Path
import sys


def need(condition, detail):
    if not condition:
        raise ValueError(detail)


def only(items, detail):
    items = list(items)
    need(len(items) == 1, f'{detail}: {len(items)} matches')
    return items[0]


def node(graph, i):
    row = graph.record(i)
    return row['op'], row['args']


def guards(graph, body, level=None, delta=None):
    matched = []
    while node(graph, body)[0] == 'smooth_piecewise':
        selector, lo, hi, left, inside, right = graph.args(body, 'smooth_piecewise')
        if selector == level:
            need(left == right, 'identical exterior arms of level selector')
            values = graph.rational(lo), graph.rational(hi)
            body = inside if values[0] < delta < values[1] else left
        else:
            need(left == right == 0, 'zero original source exterior arms')
            matched.append((selector, lo, hi))
            body = inside
    need(len(matched) == 7, 'same five slow/shell and two rectangle guards')
    return body, matched


def poly_lin(graph, i, scale=Fraction(1)):
    op, args = node(graph, i)
    if op == 'add':
        for operand in args:
            yield from poly_lin(graph, operand, scale)
    elif op == 'multiply' and any(node(graph, j)[0] == 'rational' for j in args):
        rational = only((j for j in args if node(graph, j)[0] == 'rational'), 'linear rational factor')
        other = only((j for j in args if j != rational), 'single linear operand')
        yield from poly_lin(graph, other, scale * graph.rational(rational))
    elif i != 0:
        yield i, scale


def harmonic(graph, body):
    for root, sign in poly_lin(graph, body):
        factors = graph.args(root, 'multiply')
        trig = only((i for i in factors if node(graph, i)[0] in ('cosine', 'sine')), 'one harmonic phase')
        kind, [angle] = node(graph, trig)
        amplitude = only((i for i in factors if i != trig), 'one harmonic amplitude')
        for atom, coefficient in poly_lin(graph, amplitude, sign):
            yield kind, angle, atom, coefficient


def angle_sign(graph, root, phase, carrier):
    coefficient = Fraction(1)
    args = []

    def visit(i):
        nonlocal coefficient
        op, children = node(graph, i)
        if i in (phase, carrier):
            args.append(i)
        elif op == 'rational':
            coefficient *= graph.rational(i)
        elif op == 'multiply':
            for child in children:
                visit(child)
        else:
            args.append(i)

    visit(root)
    return coefficient if sorted(args) == sorted((phase, carrier)) else 0


def expression_key(graph, substitutions=(), branch=None, delta=None, seen=None):
    """Compare source trees after simultaneous node substitution and guard reduction."""
    mapped = dict(substitutions)
    base = {}
    changed = {}
    constants = {}

    def enc(op, *args):
        return sha256(repr((op, args)).encode()).digest()

    def number(value):
        key = enc('rational', value.numerator, value.denominator)
        constants[key] = value
        return key

    def fold(op, seq):
        result = []
        coefficient = Fraction(0 if op == 'add' else 1)
        for item in seq:
            if item in constants:
                if op == 'add':
                    coefficient += constants[item]
                else:
                    coefficient *= constants[item]
            else:
                result.append(item)
        if op == 'multiply' and not coefficient:
            return number(coefficient)
        if coefficient != (0 if op == 'add' else 1) or not result:
            result.append(number(coefficient))
        return result[0] if len(result) == 1 else enc(op, *sorted(result))

    def visit(i, apply):
        cache = changed if apply else base
        if i in cache:
            return cache[i]
        if apply and i in mapped:
            value = visit(mapped[i], False)
        elif i == branch:
            value = number(Fraction(delta))
        else:
            op, args = node(graph, i)
            if seen is not None:
                seen.add(op)
            if op == 'rational':
                value = number(graph.rational(i))
            elif op in ('coordinate', 'source_parameter'):
                value = enc(op, i)
            elif op in ('add', 'multiply'):
                value = fold(op, (visit(j, apply) for j in args))
            elif op in ('integer_power', 'source_step_derivative'):
                value = enc(op, visit(args[0], apply), args[1])
            elif op == 'smooth_piecewise':
                controls = [visit(j, apply) for j in args[:3]]
                if all(j in constants for j in controls):
                    test, lo, hi = (constants[j] for j in controls)
                    value = visit(args[3 if test <= lo else 5 if test >= hi else 4], apply)
                else:
                    value = enc(op, *controls, *(visit(j, apply) for j in args[3:]))
            elif op in ('actual_expression_partial', 'm3_aux_expression_partial', 'm3_coupled_expression_partial'):
                value = enc(op, args[0], tuple(visit(j, apply) for j in args[1]), tuple(args[2]))
            elif op == 'actual_monotone_root':
                value = enc(op, args[0], *(visit(j, apply) for j in args[1:]))
            elif op == 'definite_integral':
                body, binder, lo, hi = args
                need(binder not in mapped, 'fresh source integral binder')
                value = enc(op, visit(body, apply), binder, visit(lo, apply), visit(hi, apply))
            elif op in ('ceiling', 'exp', 'inverse', 'log_positive', 'maximum', 'sqrt_positive'):
                value = enc(op, *(visit(j, apply) for j in args))
            else:
                raise ValueError(f'unsupported exact substitution opcode {op} at {i}: {args}')
        cache[i] = value
        return value

    return lambda i: visit(i, True)


def chart_checks(graph, native, aux, archived, seen):
    coupled = {x['name']: x for x in native.expressions}
    byid = {x['id']: x for x in native.expressions}
    original = {x['name']: x for x in aux}
    results, adapters = [], {}
    for branch in archived['signedPositiveModes']:
        delta, side = map(int, branch['key'].split(':'))
        sign_index = {1: 0, -1: 1}[side]
        detail = []
        for component in range(3):
            left = original[f'OriginalInitialAngular_{side}_velocity_{component}']
            right = coupled[f'ActualForcedCurrent_velocity_{component}_own_{sign_index}']
            body0, guards0 = guards(graph, left['body'])
            body1, guards1 = guards(graph, right['body'], right['parameters'][-1], delta)
            need(guards0[:5] == guards1[:5], f'same slow/shell guards for {branch["key"]}')
            xi, pulse = left['parameters'][7:9]
            mapped_guards = guards1[-2][0], guards1[-1][0]
            need((guards0[-2][0], guards0[-1][0]) == (xi, pulse)
                 and [g[1:] for g in guards0[-2:]] == [g[1:] for g in guards1[-2:]],
                 f'same local rectangle support for {branch["key"]}')
            if component == 0:
                adapters[(side, delta)] = (right['parameters'], mapped_guards)
            else:
                need(adapters[(side, delta)] == (right['parameters'], mapped_guards),
                     'same lift in all three wave components')
            old = expression_key(graph, zip((xi, pulse), mapped_guards), seen=seen)
            exact = expression_key(graph, seen=seen)
            wanted = defaultdict(Fraction)
            available = defaultdict(Fraction)
            for kind, angle, coeff, weight in harmonic(graph, body0):
                wanted[(kind, old(angle), old(coeff))] += weight
            terms = []
            pending_terms = []
            for kind, angle, coeff, weight in harmonic(graph, body1):
                op, args = node(graph, coeff)
                matches = op == 'm3_coupled_expression_partial' and byid[args[0]]['name'].startswith('InitializedOriginalWave_')
                target = terms if matches else pending_terms
                target.append((kind, angle, coeff, weight))
            if not terms:
                need(not wanted, f'active initialized terms absent in {branch["key"]} {component}')
            for kind, angle, coeff, weight in terms:
                defn, actual, orders = native.application(graph, coeff)
                pieces = defn['name'].split('_')
                need(pieces[:1] == ['InitializedOriginalWave']
                     and list(map(int, pieces[1:4])) == [delta, side, component]
                     and defn['parameters'] == actual and not any(orders), 'same forced embedded initialized coefficient')
                for atom, own_weight in poly_lin(graph, defn['body'], weight):
                    available[(kind, exact(angle), exact(atom))] += own_weight
            wanted = {k: z for k, z in wanted.items() if z}
            available = {k: z for k, z in available.items() if z}
            need(wanted == available,
                 f'initialized terms differ at branch {branch["key"]} component {component}, old {list(wanted.values())}, forced {list(available.values())}')
            phase = branch['phase']
            carrier = branch['waveNumber']
            fundamental = only({angle for _, angle, _, _ in terms
                                if angle_sign(graph, angle, phase, carrier) == 1},
                               f'positive fundamental for {branch["key"]} component {component}')
            for _, angle, _, _ in terms:
                need(angle_sign(graph, angle, phase, carrier) in (1, -1), 'initialized fundamental phase')
            detail.append({'component': component, 'auxBody': body0, 'forcedBody': body1,
                           'initializedTerms': len(terms), 'otherForcedTerms': len(pending_terms),
                           'positivePhaseRoot': fundamental})
        results.append({'label': branch['key'], 'literalLift': list(adapters[(side, delta)][1]),
                        'components': detail})
    need(len(results) == 10, 'complete ten initialized branches')
    return results, adapters


def row_checks(graph, native, adapters, seen):
    from bind_initialized_metadata import find_field

    initial = find_field(native.aux_fields, 'OriginalAll81InitialAngular_velocity_0')
    forced = find_field(native.fields, 'ActualForcedCurrent_velocity_0')
    count = 0
    for lhs, rhs in zip(initial['rows'], forced['rows'], strict=True):
        side = rhs['label']['sign']
        tag = rhs['label']['fixedDifference']
        for delta in range(5):
            parameters, coordinates = adapters[(side, delta)]
            substitute = expression_key(graph, zip(parameters, rhs['values']), tag, delta, seen)
            actual = expression_key(graph, branch=tag, delta=delta, seen=seen)
            for old, new in zip(lhs['values'][7:9], coordinates, strict=True):
                need(substitute(new) == actual(old),
                     f'old and new xi/v trees differ: {rhs["label"]["key"]} {side} {delta}, {old} {new}')
                count += 1
    need(count == 162 * 5 * 2, 'all actual rows and possible fixed differences')
    return count


def negative_controls(graph, native, adapters, aux, archive, seen):
    from copy import deepcopy
    from bind_initialized_metadata import find_field

    initial = find_field(native.aux_fields, 'OriginalAll81InitialAngular_velocity_0')
    forced = find_field(native.fields, 'ActualForcedCurrent_velocity_0')
    left, right = initial['rows'][0], forced['rows'][0]
    tag = right['label']['fixedDifference']
    parameters, (xi, pulse) = adapters[(right['label']['sign'], 0)]
    actual = expression_key(graph, branch=tag, delta=0)
    correct = expression_key(graph, zip(parameters, right['values']), tag, 0)
    values = right['values'][:]
    values[12], values[13] = values[13], values[12]
    wrong = expression_key(graph, zip(parameters, values), tag, 0)
    need(correct(xi) == actual(left['values'][7]) and correct(pulse) == actual(left['values'][8]),
         'control must retain the same original row')
    need(wrong(xi) != actual(left['values'][7]) and wrong(pulse) != actual(left['values'][8]),
         'swapped frozen copies change both source operands')
    # Retain the original field bodies but request a distinct source phase.
    swapped = deepcopy(archive)
    rows = swapped['signedPositiveModes']
    rows[0]['phase'], rows[1]['phase'] = rows[1]['phase'], rows[0]['phase']
    try:
        chart_checks(graph, native, aux, swapped, seen)
    except ValueError as error:
        need('positive fundamental' in str(error), 'phase mutation rejected at its intended check')
    else:
        raise ValueError('wrong original phase used without detection')
    return ['swappedOriginalCopySlots', 'borrowedDistinctBranchPhase']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ('reader', 'prior-reader', 'source', 'archive-gauge', 'scratch', 'out'):
        parser.add_argument('--' + field, type=Path, required=True)
    args = parser.parse_args()
    sys.path[:0] = [str(args.reader), str(args.prior_reader)]
    from source_stream import SourceStream, Native, MANIFEST
    from bind_initialized_metadata import ARCHIVE_GAUGE_SHA, ARCHIVE_MANIFEST_SHA, load_metadata

    manifest, _ = load_metadata(args.source / MANIFEST, ARCHIVE_MANIFEST_SHA)
    archived, _ = load_metadata(args.archive_gauge, ARCHIVE_GAUGE_SHA)
    native = Native(args.source, manifest)
    aux = json.loads(native.base_snapshot['expressionDefinitions'])
    seen = set()
    with SourceStream(args.source, manifest, manifest['node_count'], args.scratch) as graph:
        rows, adapters = chart_checks(graph, native, aux, archived, seen)
        print('PASS ten archived initialized harmonic branch correspondences', flush=True)
        count = row_checks(graph, native, adapters, seen)
        print(f'PASS {count} exact archived xi and v branch transports', flush=True)
        controls = negative_controls(graph, native, adapters, aux, archived, seen)
    receipt = {'schema': 'MathScope.N7.ArchivedInitializedWaveForcedMatch/1', 'scope': 'ARCHIVED_N1',
               'sourceSHA256': graph.verify['sha256'], 'sourceNodes': graph.count,
               'rows': rows, 'xiVBranchCorrespondences': count, 'visitedOpcodes': sorted(seen),
               'negativeControls': controls,
               'liveN3GaugeDifferences': 'OPEN', 'release': 'HOLD'}
    with args.out.open('xb') as out:
        out.write((json.dumps(receipt, indent=2) + '\n').encode())


if __name__ == '__main__':
    main()
