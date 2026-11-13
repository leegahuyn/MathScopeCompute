"""Read the actual moving-frame and native Forced matrix from selected original slots."""

from argparse import ArgumentParser
from functools import cache
from hashlib import sha256
import importlib.util
import json
from pathlib import Path


SLOTS = '710b6373a53bd87b5a23fd5ae10c22425b22b5c59847f7c124ab495b1bf10397'
CHECKER = '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75'
FRAME = '7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26'


def pinned(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest
    return raw


class Slots:
    def __init__(self, rows):
        self.rows = rows

    def node(self, root):
        n = self.rows.get(str(root))
        return (n['op'], n['args']) if n else ('opaque_external_operand', [])


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('slots', type=Path)
    p.add_argument('previous_checker', type=Path)
    p.add_argument('original_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    raw = json.loads(pinned(args.slots, SLOTS))
    pinned(args.previous_checker, CHECKER)
    pinned(args.original_runtime / 'mathscope-m2/navier/actual-covariance-matrix.mjs', FRAME)
    spec = importlib.util.spec_from_file_location('independent_archived_frame_arithmetic', args.previous_checker)
    old = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old)
    graph = Slots(raw['nodes'])
    a = old.Exact(graph)
    of, add, sub, mul, dot, neg, inv, scalar = a.of, a.add, a.sub, a.mul, a.dot, a.neg, a.inv, a.scalar
    mm = lambda x, y: [[dot(row, col) for col in zip(*y, strict=True)] for row in x]

    def eq(x, y):
        return not a.clear_compound_denominators(sub(x, y))

    n = list(map(of, (17733136, 17733138, 17733142)))
    np = list(map(of, (17733143, 0, 17733145)))
    n2 = of(17733150)
    assert eq(n2, dot(n, n))
    nt = of(17733208)
    assert graph.node(17733208)[0] == 'sqrt_positive'
    assert eq(of(graph.node(17733208)[1][0]), add(mul(n[1], n[1]), mul(n[2], n[2])))
    Ka = [mul(n[1], inv(nt)), mul(n[2], inv(nt))]
    Na = [Ka[1], neg(Ka[0])]
    sa = mul(n[0], inv(nt))
    c = of(17733221)
    assert eq(c, mul(of(17733010), of(17733220)))
    U = [[a.one, a.zero], [neg(mul(sa, Ka[0])), Na[0]], [neg(mul(sa, Ka[1])), Na[1]]]
    J = [[a.one, a.one], [c, neg(c)]]
    Uleft = [[a.one, a.zero, a.zero], [a.zero, *Na]]
    Jinv = [[scalar('1/2'), mul(scalar('1/2'), inv(c))], [scalar('1/2'), neg(mul(scalar('1/2'), inv(c)))]]
    B, Bleft = mm(U, J), mm(Jinv, Uleft)
    basis_ids = [[1, 1], [17733231, 17733233], [17733235, 17733237]]
    left_ids = [[19, 17733285, 17733286], [19, 17733287, 17733288]]
    for result, roots in ((B, basis_ids), (Bleft, left_ids)):
        assert all(eq(result[i][j], of(root)) for i, row in enumerate(roots) for j, root in enumerate(row))

    def principal(normal, derivative, K):
        rho = [sub(dot(normal, col), derivative[j]) for j, col in enumerate(zip(*K, strict=True))]
        squared = dot(normal, normal)
        return [[add(neg(K[i][j]), mul(normal[i], rho[j], inv(squared))) for j in range(3)] for i in range(3)]

    K = [list(map(of, row)) for row in raw['rowInputs'][0]['K']]
    Aphi = principal(n, np, K)
    A_ids = [[17733164, 17733168, 17733170], [17733174, 17733176, 17733178], [17733182, 17733184, 17733186]]
    assert all(eq(Aphi[i][j], of(root)) for i, row in enumerate(A_ids) for j, root in enumerate(row))
    v = raw['homogeneous'][0]['variable']

    def D(root):
        if root == v:
            return a.one
        op, args = graph.node(root)
        if op == 'add':
            return add(*(D(x) for x in args))
        if op == 'multiply':
            assert len(args) == 2
            return add(mul(D(args[0]), of(args[1])), mul(of(args[0]), D(args[1])))
        if op == 'inverse':
            derivative = D(args[0])
            return mul(scalar(-1), derivative, a.pow(of(args[0]), -2)) if derivative else a.zero
        if op == 'integer_power':
            derivative = D(args[0])
            return mul(scalar(args[1]), a.pow(of(args[0]), args[1] - 1), derivative) if derivative else a.zero
        if op == 'sqrt_positive':
            derivative = D(args[0])
            return mul(derivative, inv(mul(scalar(2), of(root)))) if derivative else a.zero
        return a.zero

    derivative_ids = [[0, 0], [17733272, 17733276], [17733280, 17733284]]
    Bprime = [[D(root) for root in row] for row in basis_ids]
    assert all(eq(Bprime[i][j], of(root)) for i, row in enumerate(derivative_ids) for j, root in enumerate(row))
    AB = mm(Aphi, B)
    projected = mm(Bleft, [[sub(x, Bprime[i][j]) for j, x in enumerate(row)] for i, row in enumerate(AB)])
    projected_ids = [[17733325, 17733330], [17733334, 17733338]]
    assert all(eq(projected[i][j], of(root)) for i, row in enumerate(projected_ids) for j, root in enumerate(row))
    lam, dref, damping = map(of, (17733340, 17733343, 17733344))
    eps, k = [of(raw['rowInputs'][0][key]) for key in ('epsilon', 'k')]
    assert eq(damping, mul(eps, k, k, n2))
    rho = sub(lam, dref)
    homogeneous = raw['homogeneous'][0]
    assert homogeneous['initial'] == [1, 0] and homogeneous['left'] == 0
    assert all(eq(of(root), sub(projected[i][j], add(damping, rho)) if i == j else projected[i][j])
               for i, row in enumerate(homogeneous['matrix']) for j, root in enumerate(row))
    assert graph.node(17733391) == ('exp', [17733390])
    op, (body, variable, midpoint, endpoint) = graph.node(17733390)
    assert op == 'definite_integral' and endpoint == v and eq(of(midpoint), mul(scalar('1/2'), of(homogeneous['length'])))
    # Frozen reference integrand is exactly the normalized diagonal shift.
    # The literal square-root arguments use the same affine tilt with v replaced by the integral variable.
    old_s, new_s = 17733216, 17733364
    assert eq(of(old_s), mul(of(17727098), add(scalar('1/2'), mul(of(v), inv(of(homogeneous['length']))))))
    assert eq(of(new_s), mul(of(17727098), add(scalar('1/2'), mul(of(variable), inv(of(homogeneous['length']))))))
    assert graph.node(17733367) == ('sqrt_positive', [17733366]) and graph.node(17733220) == ('sqrt_positive', [17733219])
    for square, tilt in ((17733366, new_s), (17733219, old_s)):
        assert eq(of(square), add(a.one, mul(of(tilt), of(tilt))))
    assert eq(lam, mul(of(17733008), inv(of(17733220))))
    assert eq(dref, mul(of(17733008), of(17733219), inv(of(17733031))))
    assert eq(of(body), sub(mul(of(17733008), inv(of(17733367))), mul(of(17733008), of(17733366), inv(of(17733031)))))

    # AST congruence on the retained arithmetic skeleton. Unknown source
    # programs remain opaque, and any unmatched pairs are reported.
    formal = homogeneous['parameters'][3:6]
    actual = [raw['representative'][x] for x in ('X', 'eta', 's')]

    @cache
    def flatten(root, op):
        tag, children = graph.node(root)
        return [x for child in children for x in flatten(child, op)] if tag == op else [root]

    @cache
    def substitutions(a_root, b_root, pairs):
        mapping = dict(pairs)
        if a_root in mapping:
            return [] if mapping[a_root] == b_root else [(a_root, b_root)]
        if a_root == b_root:
            return []
        a_op, a_args = graph.node(a_root)
        b_op, b_args = graph.node(b_root)
        if a_op != b_op or a_op not in {'add', 'multiply', 'inverse', 'sqrt_positive', 'integer_power', 'ceiling', 'smooth_piecewise'}:
            return [(a_root, b_root)]
        if a_op == 'integer_power' and a_args[1] != b_args[1]:
            return [(a_root, b_root)]
        if a_op == 'integer_power':
            return substitutions(a_args[0], b_args[0], pairs)
        if a_op == 'multiply':
            import itertools
            old_flat, new_flat = flatten(a_root, a_op), flatten(b_root, b_op)
            if len(old_flat) == len(new_flat) and len(old_flat) <= 6:
                aligned = []
                for permutation in itertools.permutations(new_flat):
                    candidate = [pair for x, y in zip(old_flat, permutation, strict=True) for pair in substitutions(x, y, pairs)]
                    if not candidate:
                        return candidate
                    aligned.append(candidate)
                return min(aligned, key=len)
        if len(a_args) != len(b_args):
            return [(a_root, b_root)]
        direct = [pair for x, y in zip(a_args, b_args, strict=True) for pair in substitutions(x, y, pairs)]
        if direct and a_op in {'add', 'multiply'} and len(a_args) == 2:
            flipped = [pair for x, y in zip(a_args, reversed(b_args), strict=True) for pair in substitutions(x, y, pairs)]
            if len(flipped) < len(direct):
                return flipped
        return direct

    native = []
    for row, forced in zip(raw['rowInputs'], raw['forced'], strict=True):
        m = list(map(of, row['normal']['value']))
        derivative = list(map(of, row['normal']['derivative']))
        assert row['K'] == raw['rowInputs'][0]['K'] and row['length'] == homogeneous['length']
        matrix = principal(m, derivative, K)
        d = mul(of(row['epsilon']), of(row['k']), of(row['k']), dot(m, m))
        for i, roots in enumerate(forced['matrix']):
            for j, root in enumerate(roots):
                assert eq(of(root), sub(matrix[i][j], mul(scalar(4), d)) if i == j else matrix[i][j]), (row['key'], i, j, root)
        mapping = dict(zip(formal + [v], actual + [row['path']['w']], strict=True))
        gaps = [substitutions(original, current, tuple(mapping.items())) for original, current in
                zip([17733136, 17733138, 17733142, 17733143, 0, 17733145],
                    row['normal']['value'] + row['normal']['derivative'], strict=True)]
        native.append({'key': row['key'], 'matrix': forced['matrix'], 'normal': row['normal'], 'system': forced['id'],
                       'normalFrameFormalActual': mapping, 'pendingSubexpressionPairs': gaps})
    result = {'schema': 'MathScope.ActiveN3ArchivedOriginalFrameRows/1', 'status': 'VERIFIED_ARCHIVED_HOMOGENEOUS_AND_NATIVE_FORCED_FRAME_FORMULAS',
              'slotsSHA256': SLOTS, 'B': basis_ids, 'Bleft': left_ids, 'BPrime': derivative_ids, 'projected': projected_ids,
              'M1': homogeneous['matrix'], 'damping': 17733344, 'P': 17733391, 'rhoNativeIntegral': body,
              'native': native, 'open': 'Independently bind the original unfrozen normal/primitive parameters to each actual frozen Forced tuple; these archived formula checks alone do not verify that simultaneous substitution.',
              'finalJets': '0/67', 'release': 'HOLD'}
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': result['status'], 'SHA256': sha256(args.output.read_bytes()).hexdigest()}))


if __name__ == '__main__':
    main()
