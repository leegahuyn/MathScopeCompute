from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import sys
from tempfile import TemporaryFile


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


checker, previous, bundle, output = map(Path, sys.argv[1:])
new = load(checker, 'readback')
old = new.previous_checker(previous)
raw = (bundle / 'original-active-mode-two-witness.json').read_bytes()
print('receipt', sha256(raw).hexdigest(), flush=True)
j = json.loads(raw)
snapshot = j['snapshot']
registry = old.Registry(bundle / 'original-source-functions.json', snapshot)
with TemporaryFile() as backing:
    G, edges = new.read_graph(old, bundle / 'original-source-nodes.jsonl.gz', backing, snapshot)
    print('graph', len(G.offsets), 'edges', edges, flush=True)
    results = []
    for row in j['rows']:
        try:
            new.bind_row(old, G, registry, row, j['initializedNodeCount'])
        except ValueError as error:
            trace = error.__traceback__
            while trace and trace.tb_frame.f_code.co_name != 'bind_initialized':
                trace = trace.tb_next
            if trace is None or 'exact conservative own' not in str(error):
                raise
            local = trace.tb_frame.f_locals
            a, result, got = [local[key] for key in ('a', 'result', 'got')]
            print('mismatch', row['key'], 'component', local['j'], got, flush=True)
            s2 = []
            for root in G.reach(row['path']['vt']):
                op, args = G.node(root)
                if op == 'sqrt_positive' and G.node(args[0])[0] == 'rational' and old.q(G, args[0]) == 2:
                    s2.append(root)
            print('literal sqrt two roots', s2, 'normal', row['liftNormal'], flush=True)
            radical, = s2
            geometry = row['lift']['geometry']
            vr, vt = ([a.of(root) for root in roots] for roots in (geometry['vr'], row['path']['vt']))
            matrix = [[a.of(root) for root in line] for line in row['lift']['matrix']['value']]
            dot_matrix = a.dot(vt, [a.dot(line, vr) for line in matrix])
            assert dot_matrix == a.sub(a.scalar(2), a.pow(a.of(radical), 2))
            phase = a.of(row['phase'])
            a.verify_affine_atoms(phase, row['path']['Y'])
            slopes = [a.sub(a.affine_at(phase, {y: a.add(a.of(y), a.one)}), phase) for y in row['path']['Y']]
            radial_phase = a.mul(a.of(geometry['radialFast']), a.dot(vr, slopes))
            rr_real, rr_imaginary = local['rr']
            frequency = a.mul(a.scalar(2), a.of(row['k']))
            exact_residual = (a.mul(frequency, radial_phase, rr_imaginary),
                              a.neg(a.mul(frequency, radial_phase, rr_real)))
            parts = []
            for p, left, expected_defect in zip(new.PARTS, result, exact_residual, strict=True):
                delta = a.sub(left, a.of(got[p]))
                assert delta == expected_defect, f'{p}: not exactly the radial carrier defect'
                assert not a.reduce_sqrt_two(delta, radical)
                assert a.reduce_sqrt_two(a.add(delta, a.one), radical) == a.one
                parts.append({'part': p, 'actualQuadratic': got[p], 'polynomialTerms': len(delta), 'termsAfterLiteralSqrt': 0})
            results.append({'key': row['key'], 'component': local['j'], 'radical': radical,
                            'matrix': row['lift']['matrix']['value'], 'phase': row['phase'], 'radialFast': geometry['radialFast'],
                            'minimalDefect': 'v_t^T Jg v_r = 2 - (literal sqrt(2))^2',
                            'actualCoefficientDifference': '-i*2*k*radialFast*(v_r dot partial_Y phase)*(w_r*w_r)',
                            'unitPerturbationRejected': True, 'parts': parts})
        else:
            results.append({'key': row['key'], 'originalOpaqueRadicalCheckerAlreadyPassed': True})
    receipt = {'schema': 'MathScope.ActiveN3ModeTwoExactRadicalDefect/1', 'nodeCount': len(G.offsets), 'typedEdges': edges,
               'inputSHA256': sha256(raw).hexdigest(), 'rows': results}
    with output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'status': 'VERIFIED_LITERAL_RADICAL_DEFECT_ONLY', 'sha256': sha256(output.read_bytes()).hexdigest()}))
