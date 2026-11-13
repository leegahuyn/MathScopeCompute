"""Independent frozen representative replay over the exact normal operands."""

from argparse import ArgumentParser
from fractions import Fraction
from functools import cache
from hashlib import sha256
import importlib.util
import json
from pathlib import Path


WITNESS = 'a35bd111ef2f60b0e779a85433571db8caa00061616da91372782a28a16859e9'
CHECKER = '260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75'
FRAME = '7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26'
INITIALIZED = '3e4f32a554e8e2ceccd3e003aa220c2f191c23b98cceb3b07f1f2d81e4bf2f1d'
FORCED = '492c97715d7fae56929e9bbe6991450db20186da00d4e6de2aa17c4a25959827'
MATRIX = '54604d663ca3dddbe8b0f7df95610bf4a187914cb5e6b10c0d5e6b96d90f9c98'
GRAPH = '831120617913e89c5bb60976fb26f58c6714decc301097a08f72ee23233e0a6a'


def read(path, digest):
    raw = path.read_bytes()
    assert sha256(raw).hexdigest() == digest, path
    return raw


class FrozenAlgebra:
    def __init__(self, old, nodes, replacements):
        self.nodes = nodes
        self.replacements = replacements
        self.symbols = {}
        self.algebra = old.Exact(None)

    def atom(self, identity):
        i = self.symbols.setdefault(identity, len(self.symbols) + 1)
        return {((i, 1),): Fraction(1)}

    @cache
    def evaluate(self, root, substituted):
        if substituted and root in self.replacements:
            return self.evaluate(self.replacements[root], False)
        node = self.nodes.get(str(root))
        if node is None:
            return self.atom(('raw-root', root))
        op, args = node['op'], node['args']
        a = self.algebra
        at = lambda arg: self.evaluate(arg, substituted)
        if op == 'rational':
            return a.scalar(Fraction(int(args[0]), int(args[1])))
        if op == 'add':
            return a.add(*(at(arg) for arg in args))
        if op == 'multiply':
            return a.mul(*(at(arg) for arg in args))
        if op == 'inverse':
            return a.inv(at(args[0]))
        if op == 'integer_power':
            exponent = args[1]
            if abs(exponent) <= 64:
                return a.pow(at(args[0]), exponent)
            return self.atom((op, self.freeze(at(args[0])), exponent))
        if op in {'sqrt_positive', 'exp', 'log_positive', 'ceiling', 'smooth_piecewise', 'maximum'}:
            return self.atom((op, tuple(self.freeze(at(arg)) for arg in args)))
        if op in {'actual_expression_partial', 'm3_aux_expression_partial'}:
            system, actual, orders = args
            return self.atom((op, system, tuple(self.freeze(at(arg)) for arg in actual), tuple(orders)))
        return self.atom(('raw-root', root))

    @staticmethod
    def freeze(expr):
        return tuple(sorted(expr.items()))

    def equal(self, original, current):
        a = self.algebra
        left = self.evaluate(original, True)
        right = self.evaluate(current, False)
        delta = a.sub(left, right)
        return not delta

    def differences(self, original, current):
        a = self.algebra
        left = self.evaluate(original, True)
        right = self.evaluate(current, False)
        delta = a.sub(left, right)
        return {'terms': len(delta), 'firstKeys': [list(powers) for powers in list(delta)[:8]]}


def main():
    p = ArgumentParser(description=__doc__)
    p.add_argument('slots', type=Path)
    p.add_argument('slots_sha256')
    p.add_argument('previous_checker', type=Path)
    p.add_argument('matrix_receipt', type=Path)
    p.add_argument('original_runtime', type=Path)
    p.add_argument('output', type=Path)
    args = p.parse_args()
    slots = json.loads(read(args.slots, args.slots_sha256))
    matrix = json.loads(read(args.matrix_receipt, MATRIX))
    assert slots['sourceWitnessSHA256'] == WITNESS and slots['sourceGraphSHA256'] == GRAPH
    read(args.previous_checker, CHECKER)
    read(args.original_runtime / 'mathscope-m2/navier/actual-covariance-matrix.mjs', FRAME)
    read(args.original_runtime / 'mathscope-m3/navier/source-initialized-angular.mjs', INITIALIZED)
    read(args.original_runtime / 'mathscope-m3/navier/source-global-forced-current.mjs', FORCED)
    spec = importlib.util.spec_from_file_location('archived_exact_rational_algebra', args.previous_checker)
    old = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old)
    roots = [17733136, 17733138, 17733142, 17733143, 0, 17733145]
    representative = slots['representative']
    result = []
    for row, archive in zip(slots['rows'], matrix['native'], strict=True):
        w = row['path']['w']
        assert row['key'] == archive['key'] and row['system'] == archive['system']
        replacements = dict(zip([17732753, 17732754, 17732755, 17732751],
                                [representative['X'], representative['eta'], representative['s'], w], strict=True))
        algebra = FrozenAlgebra(old, slots['nodes'], replacements)
        actual = row['normal']['value'] + row['normal']['derivative']
        checks = []
        for original, current in zip(roots, actual, strict=True):
            ok = algebra.equal(original, current)
            checks.append({'original': original, 'actual': current, 'pass': ok,
                           **({} if ok else algebra.differences(original, current))})
        wrong = FrozenAlgebra(old, slots['nodes'], {**replacements, 17732751: 17732751})
        assert not wrong.equal(roots[0], actual[0]), 'wrong pulse substitution must fail'
        wrong_rep = FrozenAlgebra(old, slots['nodes'], {**replacements, 17732753: representative['eta'],
                                                        17732754: representative['X']})
        assert any(not wrong_rep.equal(o, r) for o, r in zip(roots, actual, strict=True)), 'swapped representative coordinates must fail'
        result.append({'key': row['key'], 'actualForcedSystem': row['system'], 'replacements': replacements,
                       'normalAndDerivative': checks, 'identityPulseRejected': True, 'swappedRepresentativeRejected': True})
    passed = all(x['pass'] for row in result for x in row['normalAndDerivative'])
    receipt = {'schema': 'MathScope.ActiveN3FrozenNormalCongruence/1',
               'status': 'VERIFIED_FROZEN_NATIVE_NORMAL_AND_DERIVATIVE_CONGRUENCE' if passed else 'OPEN_ARCHIVED_NORMAL_CONGRUENCE',
               'graphSHA256': GRAPH, 'matrixReceiptSHA256': MATRIX, 'slotSHA256': args.slots_sha256,
               'rows': result, 'completeForcedSeal': False, 'numericJets': '0/67', 'release': 'HOLD'}
    assert passed, result
    with args.output.open('x', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'status': receipt['status'], 'SHA256': sha256(args.output.read_bytes()).hexdigest(),
                      'checks': [[x['pass'] for x in row['normalAndDerivative']] for row in result]}))


if __name__ == '__main__':
    main()
