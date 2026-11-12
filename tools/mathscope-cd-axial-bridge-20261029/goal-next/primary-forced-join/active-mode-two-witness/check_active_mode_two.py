"""Exact independent readback of an original active Forced mode-two checkpoint."""

import argparse
from array import array
from collections import Counter
from functools import cache
import gzip
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
from tempfile import TemporaryFile


CHECKER = '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75'
SUPPORT = 'e2568961ead64b62898c5f2052c08b85e144b39f4a85db0f2921089cf0fb4338'
FORCED = '492c97715d7fae56929e9bbe6991450db20186da00d4e6de2aa17c4a25959827'
HISTORICAL = 'c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835'
PARTS = ('real', 'imaginary')
KEYS = ('0:1', '1:1')
ZERO = {'real': 0, 'imaginary': 0}


def need(ok, message):
    if not ok:
        raise ValueError(message)


def pinned(path, digest):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == digest, f'wrong SHA256 for {path}')
    return raw


def previous_checker(path):
    pinned(path, CHECKER)
    spec = importlib.util.spec_from_file_location('independent_n1_forced_algebra', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def references(op, a):
    if op in {'rational', 'coordinate', 'source_parameter'}:
        return ()
    if op in {'add', 'multiply', 'maximum', 'smooth_piecewise', 'definite_integral'}:
        return a
    if op in {'integer_power', 'inverse', 'exp', 'sqrt_positive', 'sine', 'cosine', 'ceiling',
              'log_positive', 'source_step_derivative'}:
        return a[:1]
    if op in {'actual_background_picard', 'actual_background_even_profile', 'actual_quadratic_root'}:
        return a[2:3] if op == 'actual_quadratic_root' else a[2:4]
    if op == 'actual_natural_series':
        return a[1:3]
    if op == 'actual_monotone_root':
        return a[1:]
    if op in {'actual_covariance_volterra', 'm3_global_pulse_jet'}:
        return [a[2], *a[3]]
    if op == 'm3_forced_pulse_partial':
        return [a[3], *a[4]]
    if op.startswith(('actual_', 'm3_')) and op.endswith('_partial') and len(a) == 3:
        return a[1]
    raise ValueError(f'unsupported native node type {op}')


def read_graph(checker, path, backing, manifest):
    graph = checker.Graph.__new__(checker.Graph)
    graph.backing, graph.offsets = backing, array('Q')
    digest, histogram, size, edges = sha256(), Counter(), 0, 0
    with gzip.open(path, 'rb') as stream:
        header = stream.readline()
        need(json.loads(header) == {'schema': 'MathScope.M3.FullNodesJSONL/1',
                                   'node_count': manifest['node_count']}, 'graph header')
        digest.update(header)
        size += len(header)
        for i, line in enumerate(stream):
            node = json.loads(line)
            need(set(node) == {'op', 'args'}, f'node record {i}')
            op, a = node['op'], node['args']
            linked = references(op, a)
            need(all(type(root) is int and 0 <= root < i for root in linked), f'node {i}: not a prior AST edge')
            if op == 'rational':
                need(len(a) == 2 and all(type(x) is str and str(int(x)) == x for x in a) and int(a[1]) > 0,
                     f'node {i}: noncanonical rational')
            edges += len(linked)
            histogram[op] += 1
            digest.update(line)
            size += len(line)
            graph.offsets.append(backing.tell())
            backing.write(line)
    need(len(graph.offsets) == manifest['node_count'] and digest.hexdigest() == manifest['node_stream_sha256']
         and size == manifest['node_stream_uncompressed_bytes'] and dict(histogram) == manifest['operation_histogram'],
         'graph manifest byte/count/operation binding')
    return graph, edges


def bind_row(checker, graph, registry, row, initialized_count=None):
    key, sid = row['key'], row['system']
    need(key in KEYS and row['m'] == 2 and row['changed'] == 0, 'positive mode-two route')
    system = registry.pulses[sid]
    need(system['id'] == sid and system['name'] == f'ActualOriginalForced_{key}_m2' and
         system['initial'] == [ZERO] * 3 and system['left'] == 0 and system['length'] == row['length'] and
         system['finitePartialSumIsExactSolution'] is False, 'actual native exact zero-data inverse')
    algebra = checker.Exact(graph)
    path = checker.bind_path(graph, algebra, row['path'], system, key)
    formal = [dict(ZERO) for _ in range(3)]
    params = [system['variable'], *system['parameters']]
    need([(x['j'], x['part']) for x in row['components']] == [(j, part) for j in range(3) for part in PARTS],
         'six complete complex source slots')
    for c in row['components']:
        j, part, body, mapped, wrap = (c[x] for x in ('j', 'part', 'supported', 'mapped', 'formalPathSource'))
        need(c['raw'] == body and c['primary'] == 0, 'mode-two raw source must be unchanged by primary exclusion')
        formal[j][part] = wrap
        if body == 0:
            need(mapped == wrap == 0 and c['system'] is None, 'exact-zero component changed')
            continue
        source, actual = registry.expression(graph, mapped)
        wrapper, wrapper_actual = registry.expression(graph, wrap)
        need(source['id'] == c['system'] and source['body'] == body and
             source['name'] == f'ActualWholeNonzeroSource_{key}_2_{j}_{part}', 'whole actual mode-two defining body')
        need(actual == [path.get(f, f) for f in source['parameters']], 'exact simultaneous H_w actual tuple')
        need(wrapper['name'] == f'CoupledForced_source_{j}_{part}' and wrapper['body'] == mapped and
             wrapper_actual == wrapper['parameters'] == params, 'actual inverse formal/actual wrapper')
        if initialized_count is not None:
            definition, call = registry.expression(graph, c['sourceCall'])
            need(definition == source and call == c['sourceFormals'] == source['parameters'] and
                 body < initialized_count <= mapped, 'initialized graph boundary and source identity call')
    forcing = checker.bind_inverse(graph, algebra, row, system, formal)
    cutoff = checker.cutoff(graph, algebra, registry, row, system, formal)
    if initialized_count is not None:
        bind_initialized(checker, graph, registry, algebra, row, initialized_count)
        bind_mapped_potential(graph, registry, algebra, row)
    checker.Exact.of.cache_clear()
    graph.node.cache_clear()
    return {'key': key, 'system': sid, 'sourceComponents': row['components'], 'path': row['path'],
            'projectedSource': forcing, 'velocity': row['output'], 'pressure': row['pressure'], 'cutoff': cutoff}


def bind_initialized(checker, graph, registry, a, row, boundary):
    need(row['rawModeInventory'] == [-2, -1, 0, 1, 2] and sorted(row['primaryModeInventory']) == [-1, 1] and
         row['supportedModeInventory'] == [-2, -1, 1, 2], 'actual initialized inventory')
    need([a.of(c['supported']) for c in row['components']] == [a.of(z[p]) for z in row['quadratic'] for p in PARTS],
         'actual mode-two residual equals own positive-pair quadratic')
    wave, original = row['wave'], row['unsharedWave']
    need(wave['m'] == original['m'] == 1, 'positive initialized fundamental')
    for j, (pair, raw) in enumerate(zip([*wave['velocity'], wave['pressure']],
                                        [*original['velocity'], original['pressure']], strict=True)):
        for part in PARTS:
            root = pair[part]
            need(root < boundary and raw[part] < boundary, 'actual initialized source preceding the inverse')
            if root == raw[part]:
                need(root == 0, 'expected native initialized wave wrapper or literal zero')
                continue
            name = (f'InitializedOriginalWave_{row["key"].replace(":", "_")}_{j}' if j < 3 else
                    f'InitializedOriginalPrimaryPressure_{row["key"].replace(":", "_")}')
            definition, actual = registry.expression(graph, root)
            need(definition['name'] == f'{name}_{part}' and definition['body'] == raw[part] and
                 actual == definition['parameters'], 'actual representative/lift initialized wave wrapper')
    geometry = row['lift']['geometry']
    need(geometry['Y'] == row['path']['Y'] and geometry['epsilon'] == row['epsilon'], 'same lift geometry')
    need(row['lift']['v'] == row['path']['pulse'], 'same initialized and Forced pulse endpoint')
    roots = graph.reach(c['supported'] for c in row['components'])
    candidates = {}
    for root in roots:
        op, args = graph.node(root)
        if op == 'm3_coupled_expression_partial':
            candidates[args[0], tuple(args[1]), tuple(args[2])] = root

    def d(root, variable):
        if root == 0:
            return a.zero
        definition, actual = registry.expression(graph, root)
        if variable not in actual:
            return a.zero
        orders = tuple(int(x == variable) for x in actual)
        candidate = candidates.get((definition['id'], tuple(actual), orders))
        need(candidate is not None, 'initialized quadratic missing required native wave derivative')
        return a.of(candidate)

    def add(*terms):
        return tuple(a.add(*(term[i] for term in terms)) for i in range(2))

    def scale(scalar, term):
        return tuple(a.mul(scalar, x) for x in term)

    def mul(x, y):
        return (a.sub(a.mul(x[0], y[0]), a.mul(x[1], y[1])),
                a.add(a.mul(x[0], y[1]), a.mul(x[1], y[0])))

    coeff = [tuple(a.of(pair[part]) for part in PARTS) for pair in wave['velocity']]
    inverse_r = a.inv(a.of(geometry['R']))
    def coeff_derivative(variable):
        return [tuple(d(pair[part], variable) for part in PARTS) for pair in wave['velocity']]

    dr = coeff_derivative(geometry['R'])
    for variable, direction in zip(geometry['Y'], geometry['vr'], strict=True):
        radial = a.mul(a.of(direction), a.of(geometry['radialFast']))
        dr = [add(x, scale(radial, y)) for x, y in zip(dr, coeff_derivative(variable), strict=True)]
    dz = [scale(a.of(row['epsilon']), x) for x in coeff_derivative(geometry['Z'])]
    mapped = row['mappedEndpoint']
    need(mapped['variable'] == row['path']['w'] and mapped['pulseValue'] == row['path']['pulse'], 'exact mapped endpoint')
    n = row['liftNormal']
    carriers = [a.mul(a.scalar(2), a.of(row['k']), a.of(x)) for x in n]
    def carrier(term, j):
        return scale(carriers[j], (a.neg(term[1]), term[0]))

    for j, got in enumerate(row['quadratic']):
        rr, tt, zz = [mul(coeff[j], coeff[k]) for k in range(3)]
        result = add(mul(dr[j], coeff[0]), mul(coeff[j], dr[0]), carrier(rr, 0), scale(inverse_r, rr),
                     carrier(tt, 1), mul(dz[j], coeff[2]), mul(coeff[j], dz[2]), carrier(zz, 2))
        if j == 0:
            result = add(result, scale(a.neg(inverse_r), mul(coeff[1], coeff[1])))
        if j == 1:
            result = add(result, scale(inverse_r, mul(coeff[0], coeff[1])))
        need(result == tuple(a.of(got[p]) for p in PARTS), f'exact conservative own positive-pair quadratic {j}')


def bind_mapped_potential(graph, registry, a, row):
    potential = row['mappedPotential']
    normal = row['liftNormal']
    n = list(map(a.of, normal))
    denom = a.inv(a.mul(a.scalar(2), a.of(row['k']), a.dot(n, n)))
    need(row['mappedPressure'] == row['mappedCutoff']['pressure'], 'full complex cutoff pressure retained')
    for part in PARTS:
        v = [a.of(z[part]) for z in row['mappedCutoff']['velocity']]
        for j in range(3):
            k, l = (j + 1) % 3, (j + 2) % 3
            want = a.mul(denom, a.sub(a.mul(n[k], v[l]), a.mul(n[l], v[k])))
            root = potential['raw'][part][j]
            need(a.of(root) == want, 'mapped complete cross-product potential')
            definition, actual = registry.expression(graph, potential['shared'][part][j])
            need(definition['body'] == root and actual == definition['parameters'], 'mapped potential exact shared body')


def verify_cover(checker, graph, receipt, support):
    order, cover = receipt['order'], receipt['nativeCover']
    need(type(order) is int and order in (3, 4), 'active native prefix must be N3 or N4')
    need(receipt['source']['originalForcedSHA256'] == FORCED and
         receipt['physical']['supportReceiptSHA256'] == SUPPORT and
         receipt['physical']['originalSupportGraphSHA256'] == support['originalGraphSHA256'] and
         receipt['physical']['chart'] == support['chart'], 'original physical support binding')
    need(cover['key'] == support['chart']['sameNearestCover'] == '0:0:0:0' and
         cover['relativeBand'] == 0 and cover['sign'] == support['chart']['sign'] == 1 and cover['sourceLocalRow'] == 0,
         'own original central cover and sign')
    need(len(cover['guards']) == 5 and cover['labelValues'][3:7] == [cover['labelEll'], *cover['grid']],
         'exact cover label arguments')
    a = checker.Exact(graph)
    need(a.of(cover['delta']) == a.sub(a.of(cover['paletteIndex']), a.of(cover['referenceCommonIndex'])),
         'cover actual palette difference')
    need(a.of(cover['nextScaleTimesQ']) == a.mul(a.of(cover['nextScale']), a.of(cover['q'])),
         'original exact-prefix scale argument')
    palette = cover['paletteOperands']
    need(a.of(palette['baseEll']) == a.sub(a.of(palette['ellReference']), a.scalar(2)), 'original common reference ell−2')
    for key, ell in [('paletteIndex', cover['labelEll']), ('referenceCommonIndex', palette['baseEll'])]:
        all_roots = graph.reach([cover[key]])
        ceiling = [root for root in all_roots if graph.node(root)[0] == 'ceiling' and
                   a.of(cover[key]) == a.neg(a.of(root))]
        need(len(ceiling) == 1, 'source palette negative-ceiling floor')
        argument, = graph.args(ceiling[0], 'ceiling')
        def log(value):
            candidates = [root for root in all_roots if graph.node(root)[0] == 'log_positive' and
                          a.of(graph.node(root)[1][0]) == value]
            need(len(candidates) == 1, 'exact source palette logarithm')
            return a.of(candidates[0])

        e = a.of(ell)
        numerator = a.sub(a.mul(a.add(a.one, a.of(palette['h'])), e, log(a.scalar(2))), a.mul(a.scalar(2), log(e)))
        need(a.of(argument) == a.neg(a.mul(numerator, a.inv(log(a.of(palette['Tg']))))), 'original f(ell) operand')
    need(5 ** 8 > 2 ** 17 and 2 * 16 < 21 * 8, 'strict palette increment arithmetic')
    matrix = [[1, 0], [0, 1]]
    jacobian = [[3, 1], [1, 5]]
    def choose(root, difference):
        while graph.node(root)[0] == 'smooth_piecewise':
            test, lo, hi, left, middle, right = graph.args(root, 'smooth_piecewise')
            need(test == cover['delta'], 'actual torus matrix selects on the same palette AST')
            root = left if difference <= checker.q(graph, lo) else right if difference >= checker.q(graph, hi) else middle
        return checker.q(graph, root)

    for difference in range(5):
        need([[choose(root, difference) for root in row] for row in cover['matrix']] == matrix,
             'actual common cover integer matrix power')
        matrix = [[sum(row[k] * jacobian[k][j] for k in range(2)) for j in range(2)] for row in matrix]
    checker.Exact.of.cache_clear()
    return cover


def bind_application(checker, graph, registry, cover, rows):
    a = checker.Exact(graph)
    geometry = rows[0]['lift']['geometry']
    theta = geometry['theta']
    expected = [geometry[x] for x in ('R', 'Z', 'T')] + [cover['labelEll'], *cover['grid'],
                cover['paletteOperands']['ellReference'], *geometry['Y'], *cover['rectangle']['center'],
                *cover['rectangle']['copy'], theta, cover['delta']]
    for row, matrix in zip(rows, ([[1, 0], [0, 1]], [[3, 1], [1, 5]]), strict=True):
        need([[checker.q(graph, root) for root in vector] for vector in row['lift']['matrix']['value']] == matrix,
             'local fixed lift equals its actual common-cover matrix case')
    need(len(cover['application']) == 3, 'all initialized residual components')
    for j, app in enumerate(cover['application']):
        kind, index = app['field'].split(':')
        need(kind == 'coupled-field', 'actual coupled indexed field')
        field = registry.fields[int(index)]
        need(field['id'] == app['field'] and field['name'] == f'ActualAll162InitializedAngularResidual_{j}' and
             len(field['rows']) == 162, 'actual initialized all-label field')
        need(graph.args(app['root'], 'm3_coupled_indexed_partial') ==
             [field['id'], [*cover['coverParameters'], theta], [0] * len(field['directions'])], 'actual initialized global call')
        fixed = field['rows'][app['rowIndex']]
        label = {'key': cover['key'], 'ell': cover['labelEll'], 'grid': cover['grid'], 'sign': cover['sign'],
                 'fixedDifference': cover['delta'], 'countBoxOnce': True}
        need(fixed['label'] == label and fixed['guards'] == cover['guards'] and
             fixed['values'] == app['values'] == expected and fixed['localSystem'] == app['system'],
             'actual central original indexed body and complete argument tuple')
        reference, own = [registry.definition(app[key]) for key in ('system', 'ownSystem')]
        need(reference['name'] == f'ActualInitializedAngularReferenceChart_0_{j}' and
             own['name'] == f'ActualInitializedAngularOwnLabel_0_{j}' and reference['body'] == fixed['localBody'] and
             reference['parameters'] == fixed['localParameters'] == own['parameters'], 'actual reference and own native bodies')
        want = ('m3_coupled_expression_partial', [own['id'], app['referenceValues'], [0] * len(own['parameters'])])
        calls = [root for root in graph.reach([reference['body']]) if graph.node(root) == want]
        need(len(calls) == 1 and app['referenceValues'][3:] == own['parameters'][3:],
             'own call preserves fixed label, torus, nearest copy, angle and palette formals')
        for row in rows:
            delta = row['path']['levelDifference']
            body = checker.own_case(graph, own, delta, row['path']['pulse'], row['length'])
            carrier = a.mul(a.scalar(2), a.of(row['k']), a.of(row['phase']))
            terms = [(kind, coefficient, sign) for kind, angle, coefficient, sign in checker.harmonic_terms(graph, body)
                     if a.of(angle) == carrier]
            for part, kind, sign in [('real', 'cosine', 1), ('imaginary', 'sine', -1)]:
                root = next(c['raw'] for c in row['components'] if c['j'] == j and c['part'] == part)
                need([(c, s) for k, c, s in terms if k == kind] == ([(root, sign)] if root else []),
                     'own phase mode two is the exact indexed raw source component')
    checker.Exact.of.cache_clear()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--checker', type=Path, required=True)
    parser.add_argument('--support', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--witness-sha', help='independently recorded SHA256 of the hosted active witness receipt')
    parser.add_argument('--historical-n1-control', action='store_true')
    args = parser.parse_args()
    checker = previous_checker(args.checker)
    support = json.loads(pinned(args.support, SUPPORT))
    if args.historical_n1_control:
        need(args.witness_sha is None, 'historical control uses its pinned archived receipt')
        raw = pinned(args.bundle / 'corrected-first-force.json', HISTORICAL)
    else:
        need(args.witness_sha is not None, 'provide independently recorded --witness-sha')
        raw = pinned(args.bundle / 'original-active-mode-two-witness.json', args.witness_sha)
    receipt = json.loads(raw)
    manifest = receipt['snapshot']
    registry = checker.Registry(args.bundle / 'original-source-functions.json', manifest)
    with TemporaryFile() as backing:
        graph, edges = read_graph(checker, args.bundle / 'original-source-nodes.jsonl.gz', backing, manifest)
        if args.historical_n1_control:
            cover, boundary = None, None
            rows = [r for r in receipt['rows'] if r['key'] in KEYS and r['m'] == 2]
        else:
            need(receipt['schema'] == 'MathScope.OriginalActiveModeTwoSourceWitness/1', 'witness schema')
            cover = verify_cover(checker, graph, receipt, support)
            boundary, rows = receipt['initializedNodeCount'], receipt['rows']
            need(type(boundary) is int and 0 < boundary < len(graph.offsets), 'authentic initialized boundary')
        need([r['key'] for r in rows] == list(KEYS), 'same original active physical palette cases')
        result = [bind_row(checker, graph, registry, row, boundary) for row in rows]
        if cover is not None:
            bind_application(checker, graph, registry, cover, rows)
        wrong = dict(rows[0], path=dict(rows[0]['path'], Hw=rows[0]['path']['Hw'][::-1]))
        try:
            bind_row(checker, graph, registry, wrong, boundary)
        except ValueError as ex:
            need('wrong actual H_w component' in str(ex), 'wrong negative control exception')
        else:
            raise ValueError('swapped H_w arguments were accepted')
    output = {'schema': 'MathScope.OriginalActiveModeTwoPythonReadback/1',
              'status': ('HISTORICAL_N1_CONTROL_ONLY' if args.historical_n1_control else
                         'ACTIVE_SOURCE_MODE_TWO_OPERAND_READBACK'),
              'inputReceiptSHA256': sha256(raw).hexdigest(), 'graphSHA256': manifest['node_stream_sha256'],
              'registrySHA256': manifest['definitions_sha256'], 'priorEdges': edges, 'cover': cover, 'rows': result,
              'negativeControl': 'swapped H_w rejected', 'completeForcedSeal': False, 'classBounds': False}
    with args.out.open('x', encoding='utf8', newline='\n') as out:
        out.write(json.dumps(output, indent=2) + '\n')
    print(json.dumps({'status': output['status'], 'priorEdges': edges, 'keys': list(KEYS), 'output': str(args.out)}))


if __name__ == '__main__':
    main()
