"""Bind all actual primary flat operands to the archived half-amplitude."""
from argparse import ArgumentParser
from collections import defaultdict
from functools import cache
from fractions import Fraction
from hashlib import sha256
import gzip
from itertools import islice
import json
from pathlib import Path
from tempfile import TemporaryFile

from verify_repaired_first_force import (BASE, REPAIR, Exact, Graph, Registry, git_blob,
                                         need, q, read, reject)


OLD = 'e5113446c4d4ede3decd6107e6ab3dd52dce1697'
INIT = ('research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/'
        'attempt382884203291/initialized-angular-construction.json')
INIT_HASH = 'ba60de00a1e41f9c448da3aabcbf791bc4649b5fcfd99cff7a71865463db8b14'
PREFIX_COUNT = 3654073
PREFIX_HASH = '70dca44fce43613ce627ed6962d999ecf0ad96500e977d8b36805eefe681bd59'
PRIMARY_PROOF = ('tools/mathscope-cd-axial-bridge-20261029/goal-next/'
                 'flat-homogeneous/homogeneous-principal-cutoffs.json')
XI, V, PSI = 623035, 622805, 623055


class FixedLift:
    """Exact operators with typed actual argument substitution."""
    def __init__(self, graph):
        self.graph = graph
        self.algebra = Exact(graph)
        self.atoms = {}
        self.integral_trace = None

    def atom(self, op, metadata, children):
        frozen = tuple(tuple(sorted(child.items())) for child in children)
        key = op, metadata, frozen
        ident = self.atoms.setdefault(key, len(self.atoms) + 1)
        return {((ident, 1),): Fraction(1)}

    @cache
    def form(self, root, arguments=(), bound=()):
        if root in bound:
            return self.atom('bound-coordinate', (tuple(reversed(bound)).index(root),), ())
        actual = dict(arguments).get(root)
        if actual is not None:
            need(not (set(bound) & self.graph.reach([actual])), 'replacement would capture a bound coordinate')
            return self.form(actual)
        op, args = self.graph.node(root)
        def each(ids):
            return [self.form(i, arguments, bound) for i in ids]
        if op == 'rational':
            return self.algebra.scalar(q(self.graph, root))
        if op == 'add':
            return self.algebra.add(*each(args))
        if op == 'multiply':
            return self.algebra.mul(*each(args))
        if op == 'inverse':
            return self.algebra.inv(*each(args))
        if op == 'integer_power':
            return self.algebra.pow(*each(args[:1]), args[1])
        if op in ('coordinate', 'source_parameter'):
            return self.atom(op, tuple(args), ())
        if op in ('exp', 'log_positive', 'sqrt_positive', 'sine', 'cosine', 'ceiling',
                  'maximum', 'smooth_piecewise'):
            return self.atom(op, (), each(args))
        if op == 'source_step_derivative':
            return self.atom(op, (args[1],), each(args[:1]))
        if op == 'definite_integral':
            body, binder, left, right = args
            local = tuple(pair for pair in arguments if pair[0] != binder)
            value = self.atom(op, (), [self.form(body, local, (*bound, binder)), *each([left, right])])
            if self.integral_trace is not None:
                (powers,) = value
                self.integral_trace[powers[0][0]].add((root, bound))
            return value
        if op.endswith('_partial') and len(args) == 3:
            system, actuals, orders = args
            return self.atom(op, (system, tuple(orders)), each(actuals))
        if op in ('actual_covariance_volterra', 'm3_global_pulse_jet'):
            system, component, time, actuals, *orders = args
            return self.atom(op, (system, component, *(tuple(a) for a in orders)), each([time, *actuals]))
        if op in ('actual_background_even_profile', 'actual_background_picard'):
            return self.atom(op, tuple(args[:2]), each(args[2:4]))
        if op == 'actual_quadratic_root':
            return self.atom(op, tuple(args[:2]), each(args[2:3]))
        if op == 'actual_monotone_root':
            return self.atom(op, (args[0],), each(args[1:]))
        if op == 'actual_natural_series':
            return self.atom(op, (args[0], *args[3:]), each(args[1:3]))
        raise ValueError(f'unhandled source operator {op} at {root}')

    def trace_weight(self, root, arguments=()):
        self.form.cache_clear()
        self.integral_trace = defaultdict(set)
        value = self.form(root, arguments)
        trace = dict(self.integral_trace)
        self.integral_trace = None
        return value, trace


def product_factors(graph, root, factor):
    if root == factor:
        return [factor]
    op, args = graph.node(root)
    if op == 'multiply':
        return [item for i in args for item in product_factors(graph, i, factor)]
    return [root]


def remove_product_factor(graph, root, factor):
    factors = product_factors(graph, root, factor)
    need(factors.count(factor) == 1, 'unambiguous outer multiplicative cutoff')
    factors.remove(factor)
    return factors


def fixed_xi(graph, definition, difference, pulse):
    level = definition['parameters'][-1]
    root, guards = definition['body'], []
    while graph.node(root)[0] == 'smooth_piecewise':
        test, lo, hi, left, inside, right = graph.args(root, 'smooth_piecewise')
        if test == level:
            root = inside if q(graph, lo) < difference < q(graph, hi) else left
        else:
            need(left == right == 0, 'original fixed-lift support guard')
            guards.append(test)
            root = inside
    need(len(guards) == 7 and guards[-1] == pulse, 'fixed-lift pulse/xi guards')
    return guards[-2]


def primary_proof(repo):
    init_blob = git_blob(repo, OLD, INIT)
    need(sha256(init_blob).hexdigest() == INIT_HASH, 'archived initial weighted amplitude receipt')
    templates = {r['key']: r['sourceFrame'] for r in json.loads(init_blob)['templates']}
    prior = git_blob(repo, REPAIR, PRIMARY_PROOF)
    recipe = json.loads(prior)
    rows = {(r['key'], r['component']): r['primary'] for r in recipe['bindings']}
    need(len(rows) == 30 and len(templates) == 10, 'complete archived primary recipes')
    path = 'research-ide/mathscope-m3/navier/source-global-current.mjs'
    current = git_blob(repo, BASE, path)
    for needle in (b'G.mul(G.sqrt(band.geometry.epsilon),a,band.cutoffs.chi,band.cutoffs.psi,x)',
                   b'weighted=amplitude.map(x=>G.mul(slowCutoff.body,x))',
                   b'rawPotential=cross(G,f.frame.n,weighted)',
                   b'G.sub(amplitude[j],G.div(G.mul(n[j],normalAmplitude),f.frame.nSquared))',
                   b'frameChecks.every(x=>x.pass)&&tripleChecks.every(x=>x.pass)'):
        need(needle in current, 'archived homogeneous current tangency bridge source')
    return templates, rows, recipe['uncutPotentialDefinitions'], sha256(prior).hexdigest(), sha256(current).hexdigest()


def weighted_operands(graph, potentials):
    found = {}
    for sign in (1, -1):
        used = []
        for j in range(3):
            record = potentials[f'GlobalOriginalPotential_{sign}_{j}']
            slow = record['scalarFactors']['slowCutoff']
            arms = graph.args(record['body'], 'multiply')
            numerators = [i for i in arms if graph.node(i)[0] == 'add']
            need(len(numerators) == 1, 'original potential cross-product numerator')
            summands = graph.args(numerators[0], 'add')
            need(len(summands) == 2, 'two original cross-product arms')
            candidates = set()
            for summand in summands:
                factors = graph.args(summand, 'multiply')
                if any(graph.node(i)[0] == 'rational' and q(graph, i) == -1 for i in factors):
                    summand = next(i for i in factors if graph.node(i)[0] != 'rational')
                    factors = graph.args(summand, 'multiply')
                weighted = [i for i in factors if graph.node(i)[0] == 'multiply' and
                            slow in graph.args(i, 'multiply')]
                need(len(weighted) == 1 and product_factors(graph, weighted[0], PSI).count(PSI) == 1,
                     'one original weighted amplitude in cross-product arm')
                candidates.add(weighted[0])
            need(len(candidates) == 2, 'distinct cross-product amplitude components')
            used.append(candidates)
        for j in range(3):
            alternate = [used[i] for i in range(3) if i != j]
            match = alternate[0] & alternate[1]
            need(len(match) == 1 and not (match & used[j]), 'unique original cross-product amplitude component')
            found[sign, j] = match.pop()
    return found


def bind(graph, registry, report, templates, previous, potentials):
    results, negative, weights = [], [], {}
    weighted = weighted_operands(graph, potentials)
    for row in report['rows']:
        if row['m'] != 1:
            continue
        key = row['key']
        difference, sign = map(int, key.split(':'))
        suffix = 0 if sign == 1 else 1
        pulse, dpsi = row['path']['pulse'], row['mappedCutoff']['dpsi']
        lift = FixedLift(graph)
        for item in row['components']:
            if item['part'] != 'real':
                continue
            j = item['j']
            owner = registry.names[f'ActualInitializedAngularOwnLabel_{suffix}_{j}']
            xi = fixed_xi(graph, owner, difference, pulse)
            expected_root = weighted[sign, j]
            definition, actual = registry.expression(graph, item['primary'])
            body = definition['body']
            expected_factors = remove_product_factor(graph, expected_root, PSI)
            observed_factors = remove_product_factor(graph, body, dpsi)
            record = previous[key, j]
            hits = record['mappedPotentialCalls']
            need(len(hits) == 2 and record['uncutHalfLeading'][:2] == ['multiply', ['source', 19]],
                 f'{key} component {j} earlier leading-curl normalization')
            mapped_formals = [potentials[hit['potential']]['parameters'] for hit in hits]
            need(mapped_formals[0] == mapped_formals[1] and mapped_formals[0][3:5] == [XI, V] and
                 hits[0]['actualArguments'] == hits[1]['actualArguments'], 'consistent earlier potential input tuples')
            formal = mapped_formals[0]
            pinned = hits[0]['actualArguments']
            need(pinned[5:8] == [623950, 623955, 623935], 'active archived fixed representative')
            substitutions = ((XI, xi), (V, pulse),
                             *tuple(zip(formal[5:8], pinned[5:8], strict=True)))
            weight_formal = [potentials[hit['potential']]['scalarFactors']['fixedWeight'] for hit in hits]
            need(weight_formal[0] == weight_formal[1] and weight_formal[0] in expected_factors,
                 'one common formal positive target weight per sign')
            weight_formal = weight_formal[0]
            need(graph.node(weight_formal)[0] == 'sqrt_positive', 'formal positive target weight')
            mapped_weight = lift.form(weight_formal, substitutions)
            weight_actual = [root for root in observed_factors if graph.node(root)[0] == 'sqrt_positive'
                             and lift.form(root) == mapped_weight]
            need(len(weight_actual) == 1, f'{key} component {j} actual positive target weight')
            weight_actual = weight_actual[0]
            weight_pair = (weight_formal, weight_actual, substitutions[2:])
            need(weights.setdefault(sign, weight_pair) == weight_pair, 'same exact target weight across fixed bands')
            expected = lift.algebra.mul(*(lift.form(i, substitutions) for i in expected_factors))
            expected_half = lift.algebra.mul(lift.algebra.scalar(Fraction(1, 2)), expected)
            observed = lift.algebra.mul(*(lift.form(i) for i in observed_factors))
            need(observed == expected_half, f'{key} component {j} wrong exact half-amplitude')
            results.append({'key': key, 'component': j, 'primaryCall': item['primary'], 'primaryBody': body,
                            'formalCutWeightedAmplitude': expected_root, 'fixedXi': xi, 'fixedV': pulse,
                            'removedFormalPsi': PSI, 'removedActualDPsi': dpsi,
                            'priorLeadingBody': record['body'], 'nativeParameters': actual,
                            'archivedPotentialCalls': [h['call'] for h in hits],
                            'originalIntermediateRepresentativeAnchor': templates[key]['actualPrimaryAmplitude'][j],
                            'fixedRepresentativeFormalActual': substitutions[2:],
                            'formalPositiveTargetWeight': weight_formal,
                            'actualPositiveTargetWeight': weight_actual,
                            'exactHalfAmplitude': True})
            if not negative:
                negative.append(reject(lambda: need(observed == expected, 'incorrect missing half'),
                                       'missingHalfAmplitude'))
                wrong_map = ((XI, pulse), (V, xi), *substitutions[2:])
                wrong = lift.algebra.mul(*(lift.form(i, wrong_map) for i in expected_factors))
                negative.append(reject(lambda: need(observed ==
                    lift.algebra.mul(lift.algebra.scalar(Fraction(1, 2)), wrong), 'incorrect xi/v swap'),
                    'wrongFixedLiftCoordinates'))
                missing_inner_psi = lift.form(weight_formal, (*substitutions, (PSI, 1)))
                negative.append(reject(lambda: need(missing_inner_psi == mapped_weight,
                                                     'whole-integral cutoff cannot be removed'),
                                       'removePsiInsidePositiveWeightWholeIntegrals'))
        FixedLift.form.cache_clear()
    need(len(results) == 30, 'all thirty original primary half-amplitudes')
    need(len(weights) == 2, 'both signs original positive target weights')
    positive = []
    for sign, (formal, actual, representative) in sorted(weights.items()):
        lift = FixedLift(graph)
        formal_value, formal_trace = lift.trace_weight(formal, representative)
        actual_value, actual_trace = lift.trace_weight(actual)
        need(formal_value == actual_value and set(formal_trace) == set(actual_trace),
             'retained original weight whole integral alpha mapping')
        def describe(entries):
            return [{'root': i, 'outerBinders': outer,
                     'body': args[0], 'binder': args[1], 'bounds': args[2:]}
                    for i, outer in sorted(entries)
                    for args in [graph.args(i, 'definite_integral')]]
        mappings = [{'formal': describe(formal_trace[i]), 'actual': describe(actual_trace[i])}
                    for i in sorted(formal_trace)]
        need(mappings and PSI in graph.reach([formal]), 'whole integral pulse cutoff retained')
        positive.append({'sign': sign, 'formal': formal, 'actual': actual,
                         'formalToActualRepresentative': representative,
                         'alphaEquivalentWholeIntegralMappings': mappings})
    return results, negative, positive


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('repo', 'artifact', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    directory = next(args.artifact.rglob('corrected-first-force.json')).parent
    stream = directory / 'original-source-nodes.jsonl.gz'
    digest = sha256()
    with gzip.open(stream, 'rb') as raw:
        next(raw)
        for record in islice(raw, PREFIX_COUNT):
            digest.update(record)
    need(digest.hexdigest() == PREFIX_HASH, 'byte-identical old/new prefix including the full original weighted amplitudes')
    report = read(directory / 'corrected-first-force.json')
    manifest = read(directory / 'original-source-export-manifest.json')
    need(report['commit'] == REPAIR and report['snapshot'] == manifest, 'pinned repaired source receipt')
    registry = Registry(directory / 'original-source-functions.json', manifest)
    templates, old_recipes, potentials, recipe_sha, bridge_sha = primary_proof(args.repo)
    with TemporaryFile() as backing:
        graph = Graph(stream, backing, manifest)
        rows, negative, weights = bind(graph, registry, report, templates, old_recipes, potentials)
    output = {'schema': 'MathScope.N6.IndependentRepairedPrimaryHalfAmplitude/1',
              'producerCommit': REPAIR, 'graphSHA256': manifest['node_stream_sha256'],
              'archivedPrefixRecords': PREFIX_COUNT, 'oldAndRepairedPrefixSHA256': PREFIX_HASH,
              'archivedWeightedAmplitudeReceiptSHA256': INIT_HASH, 'priorUncutLeadingRecipeSHA256': recipe_sha,
              'originalTangencyBridgeSourceSHA256': bridge_sha,
              'actualHalfAmplitudeBindings': rows, 'positiveTargetWeights': weights,
              'rejectedControls': negative,
              'scope': ('Exact direct archived weighted-amplitude comparison after structural cutoff removal. '
                        'Only the outer pulse cutoff factor is removed. All cutoff factors inside the original '
                        'target-weight whole integrals are retained. '
                        'The identification with the archived potential-based leading curl uses its '
                        'retained moving-frame tangency and vector-triple-product theorem.')}
    raw = (json.dumps(output, indent=2) + '\n').encode()
    args.out.write_bytes(raw)
    print(json.dumps({'bindings': len(rows), 'sha256': sha256(raw).hexdigest(), 'rejectedControls': negative}))


if __name__ == '__main__':
    main()
