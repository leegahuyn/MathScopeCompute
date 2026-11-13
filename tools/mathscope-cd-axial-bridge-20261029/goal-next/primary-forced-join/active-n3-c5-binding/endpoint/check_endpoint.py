"""Read the actual N3 mode-two endpoint and cylindrical curl from the native graph."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


WITNESS = '246a425524981185734cd741a2ef9eb3ed297adf6f3dcbcd83db2abfd68f718a'
ACTIVE = 'aeabbb992ccce5ed43f9cb5e34c07d86c4a81e9ce07ee02681c365e74e4ce003'
CHECKER = '6ecffe610f01b2f4a60922efc644d50bf2203619b98379e968ad7280c827b4f1'
INVERSE = '09b98add880b6a7dbc13a6854f1234f79c7a26f38ce89b6080219b7d446d90fa'
SAME_WITNESS = 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9'
SAME_JOIN = '160c99aaada4417e87993b8ff906288661960be9642485824b9ef1ec98798ddf'
SAME_PRIMARY = 'ebd5da297d06da881e0d38bd6d04507595b50a980b2bb2399ac7df42725323ad'
PARTS = ('real', 'imaginary')


def need(condition, message):
    if not condition:
        raise ValueError(message)


def pinned(path, digest):
    raw = path.read_bytes()
    need(sha256(raw).hexdigest() == digest, f'wrong SHA256 for {path}')
    return raw


def load_checker(path):
    pinned(path, CHECKER)
    spec = importlib.util.spec_from_file_location('active_n3_operand_checker', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def native_key(value):
    return tuple(map(native_key, value)) if isinstance(value, (tuple, list)) else value


def bind_same_family(witness, join, primary, inverse):
    need(join['status'] == 'VERIFIED_SAME_LIVE_N3_PRIMARY_C5_AND_SELECTED_FORCED_INPUTS' and join['prefix'] == 3,
         'same-run private C5 binding status')
    need(primary['status'] == 'VERIFIED_ORIGINAL_NATIVE_N3_PRIMARY_C5_CLASS' and
         primary['scope']['actualFiniteDerivativeOrder'] == 5 and primary['source']['allConstantsFromSamePrivateFamily'],
         'same-run private Primary C5')
    norm = join['normRoots']
    need(norm['namespace'] == 'norm' and norm['K'] == primary['normRoot'] == inverse['sourceK'] and
         norm['classRows'] == primary['classRows'], 'same-run norm namespace, root and class rows')
    for actual, native in zip(join['rows'], witness['rows'], strict=True):
        need((actual['key'], actual['system'], actual['harmonic'], actual['H_w'], actual['projected']) ==
             (native['key'], native['system'], native['m'], native['path']['Hw'], native['projectedSource']),
             'same private mode and projected source after H_w')
        for component in native['components']:
            j, part = component['j'], component['part']
            need((actual['raw'][j][part], actual['supported'][j][part], actual['originalSource'][j][part]) ==
                 (component['raw'], component['supported'], component['mapped']), 'same original initialized and pulled source bodies')
    return {'joinSHA256': SAME_JOIN, 'primarySHA256': SAME_PRIMARY, 'normK': norm['K'], 'activeFrameBoundChecked': False}


def geometry_and_transport(old, graph, a, row):
    path, lift = row['path'], row['lift']
    geometry, original = lift['geometry'], lift['original']
    Y, w, pulse = path['Y'], path['w'], path['pulse']
    need(lift['v'] == pulse == row['mappedEndpoint']['pulseValue'] and w == row['mappedEndpoint']['variable'],
         'literal endpoint variable and mapped source pulse')
    need(Y == geometry['Y'], 'same original common torus formals')
    radicals = []
    for root in graph.reach(path['vt']):
        op, args = graph.node(root)
        if op == 'sqrt_positive' and graph.node(args[0])[0] == 'rational' and old.q(graph, args[0]) == 2:
            radicals.append(root)
    need(len(radicals) == 1, 'literal positive sqrt two')
    radical, = radicals

    def equal(x, y):
        difference = a.sub(x, y)
        if not a.reduce_sqrt_two(difference, radical):
            return True
        # This comparison also needs the actual geometric denominator and
        # normal/carrier inverses. Clear compound factors only when none is
        # the zero polynomial in the literal quadratic source field.
        factors = {atom: dict(key) for key, atom in a.inverse_atoms.items()}
        pending = {atom for term in difference for atom, _ in term if atom < 0}
        checked = set()
        while pending:
            atom = pending.pop()
            if atom in checked:
                continue
            den = factors[atom]
            need(bool(a.reduce_sqrt_two(a.clear_compound_denominators(den), radical)), 'nonzero compound source inverse factor')
            checked.add(atom)
            pending.update(i for term in den for i, _ in term if i < 0)
        return not a.reduce_sqrt_two(a.clear_compound_denominators(difference), radical)

    vr, vt = [list(map(a.of, geometry[field])) for field in ('vr', 'vt')]
    J = [list(map(a.of, roots)) for roots in lift['matrix']['value']]
    column = [[J[i][j] for i in range(2)] for j in range(2)]
    geom = a.of(original['Dgeom'])
    need(equal(geom, a.sub(a.scalar(4), a.mul(a.scalar(2), a.of(radical)))), 'literal original geometric denominator')
    ci = a.of(original['ci'])
    r0 = a.of(original['r0'])
    local = [a.sub(a.sub(a.dot(r, list(map(a.of, Y))), a.of(c)), a.of(copy))
             for r, c, copy in zip(J, lift['center'], lift['copy'], strict=True)]
    xi, v = a.of(lift['xi']), a.of(pulse)
    need(equal(xi, a.mul(a.dot(vr, local), a.inv(geom))) and
         equal(v, a.mul(a.add(a.mul(a.dot(vt, local), a.inv(geom)), r0), a.inv(ci))),
         'exact original xi and v fixed-lift formulas')
    need(not graph.reach([lift['xi'], pulse]).intersection(geometry[x] for x in ('R', 'Z', 'T', 'theta')),
         'fixed copy/center, no ordinary slow or angular endpoint motion')
    a.verify_affine_atoms(xi, Y)
    a.verify_affine_atoms(v, Y)
    gradients = [[a.sub(a.affine_at(expr, {y: a.add(a.of(y), a.one)}), expr) for y in Y] for expr in (xi, v)]
    xi_formula = [a.mul(a.dot(vr, col), a.inv(geom)) for col in column]
    v_formula = [a.mul(a.dot(vt, col), a.inv(geom), a.inv(ci)) for col in column]
    need(all(equal(x, y) for x, y in zip(gradients[0], xi_formula, strict=True)) and
         all(equal(x, y) for x, y in zip(gradients[1], v_formula, strict=True)), 'all four exact endpoint Jacobian slots')
    dx, dv = gradients
    radial = a.of(geometry['radialFast'])
    time = a.of(geometry['ci'])
    need(equal(a.mul(radial, a.dot(vr, dx)), a.of(original['radialFast'])) and
         equal(a.mul(radial, a.dot(vr, dv)), a.zero), 'radial endpoint cancellation and original xi scale')
    need(equal(a.mul(time, a.dot(vt, dx)), a.zero) and
         equal(a.mul(time, a.dot(vt, dv)), a.one), 'time endpoint chain and transverse invariance')
    need(equal(ci, a.mul(a.scalar(2), r0, a.inv(a.of(row['length'])))), 'ci_label*Ls=2*r0')
    return equal, {'literalSqrtTwo': radical, 'xi': lift['xi'], 'v': pulse, 'w': w, 'Y': Y,
                   'matrix': lift['matrix']['value'], 'center': lift['center'], 'nearestCopy': lift['copy'],
                   'r0': original['r0'], 'Ls': row['length'], 'ciLabel': original['ci'],
                   'normalizedDirections': {'DrXi': original['radialFast'], 'DrV': '0', 'DzXi': '0', 'DzV': '0',
                                            'TimeXi': '0', 'TimeV': '1'}}


def mapped_native_pressure(graph, a, row, system, equal):
    w, pulse = row['path']['w'], row['path']['pulse']
    roots = graph.reach(row['mappedPressure'].values())
    indexed = {native_key(graph.node(root)): root for root in roots
               if graph.node(root)[0] in {'m3_forced_pulse_partial', 'm3_coupled_expression_partial'}}
    applied = set()

    @cache
    def at_endpoint(root):
        if root == w:
            return a.of(pulse)
        op, args = graph.node(root)
        if op == 'add':
            return a.add(*(at_endpoint(i) for i in args))
        if op == 'multiply':
            return a.mul(*(at_endpoint(i) for i in args))
        if op == 'inverse':
            return a.inv(at_endpoint(args[0]))
        if op == 'integer_power':
            return a.pow(at_endpoint(args[0]), args[1])
        if op == 'm3_forced_pulse_partial' and args[0] == system['id']:
            need(args[3] == w and args[4] == system['parameters'] and w not in args[4], 'original forced pressure time slot')
            target = [*args[:3], pulse, *args[4:]]
        elif op == 'm3_coupled_expression_partial' and w in args[1]:
            need(args[1] == [w, *system['parameters']], 'full pressure source formal tuple before endpoint')
            target = [args[0], [pulse, *system['parameters']], args[2]]
        else:
            need(w not in graph.reach([root]), f'unhandled original dependence on the pulse {root}')
            return a.of(root)
        mapped = indexed.get(native_key((op, target)))
        need(mapped is not None, 'complete forced pressure endpoint application')
        applied.add((root, mapped))
        return a.of(mapped)

    psi = a.of(row['mappedCutoff']['psi'])
    for part in PARTS:
        need(equal(a.of(row['mappedPressure'][part]), a.mul(psi, at_endpoint(row['pressure'][part]))),
             f'actual full cutoff pressure after w→v, {part}')
    need(applied and w not in roots, 'native path coordinate eliminated from pressure')
    return sorted(applied)


def mapped_curl(graph, registry, a, row, equal):
    geometry, potential = row['lift']['geometry'], row['mappedPotential']
    R, Z, Y = geometry['R'], geometry['Z'], geometry['Y']
    epsilon, radial_fast = a.of(geometry['epsilon']), a.of(geometry['radialFast'])
    n = list(map(a.of, row['liftNormal']))
    k = a.mul(a.scalar(2), a.of(row['k']))
    available = {native_key(graph.node(root)): root for root in graph.reach(
        z[part] for z in row['mappedVelocity'] for part in PARTS)
        if graph.node(root)[0] == 'm3_coupled_expression_partial'}
    orders_seen = []

    def derivative(root, direction):
        definition, actual = registry.expression(graph, root)
        if direction not in actual:
            return a.zero
        orders = [int(x == direction) for x in actual]
        native = available.get(native_key(('m3_coupled_expression_partial', [definition['id'], actual, orders])))
        need(native is not None, 'mapped physical curl is missing a native endpoint-body partial')
        orders_seen.append((root, direction, native))
        return a.of(native)

    terms = {}
    for part in PARTS:
        X = potential['shared'][part]
        raw = potential['raw'][part]
        for root, body in zip(X, raw, strict=True):
            definition, actual = registry.expression(graph, root)
            need(definition['body'] == body and actual == row['mappedEndpoint']['parameters'], 'complete endpoint potential body')
            need(row['path']['w'] not in graph.reach([body]), 'path variable eliminated before differentiating endpoint potential')
        Dr = [a.add(derivative(x, R), a.mul(radial_fast, a.dot(list(map(a.of, geometry['vr'])),
              [derivative(x, y) for y in Y]))) for x in (X[1], X[2])]
        Dz = [a.mul(epsilon, derivative(x, Z)) for x in (X[0], X[1])]
        evaluated = list(map(a.of, X))
        cross = [a.sub(a.mul(n[(j + 1) % 3], evaluated[(j + 2) % 3]),
                       a.mul(n[(j + 2) % 3], evaluated[(j + 1) % 3])) for j in range(3)]
        leading = [a.neg(a.mul(k, x)) for x in cross]
        connection = a.mul(evaluated[1], a.inv(a.of(R)))
        remainder = [a.neg(Dz[1]), a.sub(Dz[0], Dr[1]), a.add(Dr[0], connection)]
        terms[part] = (leading, remainder, connection)
    for j in range(3):
        physical = potential['physicalComplex'][j]
        need(equal(a.of(physical['real']), a.neg(a.of(potential['raw']['imaginary'][j]))) and
             equal(a.of(physical['imaginary']), a.of(potential['raw']['real'][j])), 'original i times the complete endpoint gauge')
        expected = {'real': a.sub(terms['real'][0][j], terms['imaginary'][1][j]),
                    'imaginary': a.add(terms['imaginary'][0][j], terms['real'][1][j])}
        for part in PARTS:
            need(equal(a.of(row['mappedVelocity'][j][part]), expected[part]), f'full physical cylindrical curl {j}.{part}')
    missing = a.sub(a.of(row['mappedVelocity'][2]['imaginary']), terms['real'][2])
    need(not equal(a.of(row['mappedVelocity'][2]['imaginary']), missing), 'omitted cylindrical connection must be rejected')
    return orders_seen


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('--bundle', type=Path, required=True)
    p.add_argument('--active-readback', type=Path)
    p.add_argument('--same-family-join', type=Path)
    p.add_argument('--same-family-primary', type=Path)
    p.add_argument('--checker', type=Path, required=True)
    p.add_argument('--previous-checker', type=Path, required=True)
    p.add_argument('--inverse-receipt', type=Path, required=True)
    p.add_argument('--out', type=Path, required=True)
    args = p.parse_args()
    inverse = json.loads(pinned(args.inverse_receipt, INVERSE))
    same = args.same_family_join is not None
    need(same == (args.same_family_primary is not None), 'supply both same-family receipts')
    need(same != (args.active_readback is not None), 'choose original or same-family hosted source')
    source_sha = SAME_WITNESS if same else WITNESS
    witness = json.loads(pinned(args.bundle / 'original-active-mode-two-witness.json', source_sha))
    need(inverse['scope']['liveFrameBoundChecked'] is False and witness['order'] == 3, 'retain separate conditional inverse estimate')
    manifest = witness['snapshot']
    if same:
        same_readback = bind_same_family(witness, json.loads(pinned(args.same_family_join, SAME_JOIN)),
                                        json.loads(pinned(args.same_family_primary, SAME_PRIMARY)), inverse)
    else:
        active = json.loads(pinned(args.active_readback, ACTIVE))
        need(active['inputReceiptSHA256'] == WITNESS and active['graphSHA256'] == manifest['node_stream_sha256'], 'same active native graph')
    if hasattr(sys, 'set_int_max_str_digits'):
        sys.set_int_max_str_digits(0)  # Read only the pinned graph with exact integer JSON operands.
    checker = load_checker(args.checker)
    old = checker.previous_checker(args.previous_checker)
    registry = old.Registry(args.bundle / 'original-source-functions.json', manifest)
    rows = []
    with TemporaryFile() as backing:
        graph, edges = checker.read_graph(old, args.bundle / 'original-source-nodes.jsonl.gz', backing, manifest)
        for row in witness['rows']:
            print(f'Checking original fixed lift and endpoint {row["key"]}', flush=True)
            a = old.Exact(graph)
            equal, geometry = geometry_and_transport(old, graph, a, row)
            native = registry.pulses[row['system']]
            pressure = mapped_native_pressure(graph, a, row, native, equal)
            partials = mapped_curl(graph, registry, a, row, equal)
            rows.append({'key': row['key'], 'system': row['system'], 'geometry': geometry,
                         'pressureEndpointApplications': pressure, 'mappedCurlPartials': partials,
                         'velocity': row['mappedVelocity'], 'pressure': row['mappedPressure']})
            old.Exact.of.cache_clear()
            graph.node.cache_clear()
    result = {'schema': 'MathScope.ActiveN3ModeTwoExactEndpoint/1', 'status': 'VERIFIED_ACTIVE_ORIGINAL_ENDPOINT_AND_CYLINDRICAL_CURL',
              'sourceWitnessSHA256': source_sha, 'originalReadbackSHA256': None if same else ACTIVE, 'conditionalInverseSHA256': INVERSE,
              'graphSHA256': manifest['node_stream_sha256'], 'priorEdges': edges, 'rows': rows,
              'controls': ['omitting the cylindrical connection gives a nonzero exact residual'],
              'sameLiveNormFamily': same, 'completeForcedSeal': False, 'finalJets': '0/67', 'release': 'HOLD'}
    if same:
        result['sameFamily'] = same_readback
    with args.out.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'edges': edges, 'SHA256': sha256(args.out.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
