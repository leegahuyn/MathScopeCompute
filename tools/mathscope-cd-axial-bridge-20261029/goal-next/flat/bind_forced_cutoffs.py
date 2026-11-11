"""Recover and check the actual first Forced principal-cutoff terms."""
from argparse import ArgumentParser
from array import array
from collections import Counter
from fractions import Fraction
from functools import cache
import gzip
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import subprocess
from tempfile import TemporaryFile

GRAPH_SHA = 'a6d99fd02036780f9c994268651f6d99d3d6f8702d5476a219c212156e0ca269'
REGISTRY_SHA = 'bc0587085298da014c10a61a15e09f436c7f62cce1879eeb44c63dbfeadabb6e'
PROJECTION_SHA = '6a99e63be8e1ba2445e93a240005aaa4345c556f4e4d14ba6bcf813297b2b656'
CHECKPOINT_SHA = '42ac47a05160f9bd0aebd8cf54b72501007a0c46a351039c8c84b5bc1e6832e3'
CHECKPOINT_COMMIT = 'e5113446c4d4ede3decd6107e6ab3dd52dce1697'
PRODUCER_COMMIT = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
CHECKPOINT = ('research-ide/mathscope-m3/navier/evidence/global-forced-current-20261012/'
              'attempt382884203291/checkpoints/actual-forced-inverses-and-refreshed-pressure/')
NODE_COUNT = 4420257
NAVIER = 'research-ide/mathscope-m3/navier/'


def digest(raw):
    return sha256(raw).hexdigest()


def pinned_json(path, expected):
    raw = path.read_bytes()
    assert digest(raw) == expected, path
    return json.loads(raw)


def git_blob(repo, commit, path):
    cmd = ['git', '-c', 'core.longpaths=true', '-C', str(repo)]
    oid = subprocess.check_output([*cmd, 'rev-parse', f'{commit}:{path}']).strip().decode()
    return subprocess.check_output([*cmd, 'cat-file', 'blob', oid])


def checkpoint_record(repo):
    def read(name):
        return git_blob(repo, CHECKPOINT_COMMIT, CHECKPOINT + name)

    manifest = json.loads(read('manifest.json'))
    payload = BytesIO()
    for index, part in enumerate(manifest['parts']):
        assert part['index'] == index
        raw = read(part['path'])
        assert len(raw) == part['bytes'] and digest(raw) == part['sha256']
        payload.write(raw)
    assert digest(payload.getbuffer()) == manifest['gzipSHA256'] == CHECKPOINT_SHA
    payload.seek(0)
    with gzip.GzipFile(fileobj=payload) as archive:
        header = json.loads(archive.readline())
    assert header['schema'] == 'MathScope.N6.ExactSourceStageGraphNDJSON/1'
    assert header['nodeCount'] == manifest['nodeCount'] == 3892594
    assert header['kind'] == manifest['kind'] == 'actual-forced-inverses-and-refreshed-pressure'
    return header['record']


def source_pins(repo):
    required = {
        'source-global-band.mjs': [
            b'G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4)))',
            b'G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls)))',
        ],
        'source-global-forced-current.mjs': [
            b'forcing,m}),inverse=bound.inverse',
            b'pulseValue:old.lift.v,psiPath',
        ],
        'source-coupled-expressions.mjs': [
            b'const parameters=[input.variable,...input.parameters]',
            b"wrap(z.real,'source_'+j+'_real')",
        ],
        'source-forced-pulse.mjs': [
            b'forcing:projectedSource',
            b'const dpsi=G.derivative(psi,result.input.variable)',
            b'cscale(G,G.sub(G.one,psi),z),cscale(G,dpsi,result.velocity[j])',
        ],
        'source-mapped-forced-curl.mjs': [
            b'remainingSource:inverse.source.map',
            b'derivativeSource:inverse.velocity.map',
        ],
    }
    pins = {}
    for name, pieces in required.items():
        path = NAVIER + name
        raw = git_blob(repo, PRODUCER_COMMIT, path)
        assert all(piece in raw for piece in pieces), name
        pins[path] = digest(raw)
    return pins


class Archive:
    def __init__(self, path, backing):
        self.backing = backing
        self.offsets = array('Q')
        graph_hash = sha256()
        with gzip.open(path, 'rb') as stream:
            header = stream.readline()
            assert json.loads(header)['node_count'] == NODE_COUNT
            graph_hash.update(header)
            for line in stream:
                self.offsets.append(backing.tell())
                graph_hash.update(line)
                backing.write(line)
        assert len(self.offsets) == NODE_COUNT and graph_hash.hexdigest() == GRAPH_SHA

    @cache
    def node(self, index):
        assert type(index) is int and 0 <= index < NODE_COUNT
        self.backing.seek(self.offsets[index])
        result = json.loads(self.backing.readline())
        return result['op'], result['args']

    def op(self, index, kind):
        tag, args = self.node(index)
        assert tag == kind, (index, kind, tag, args)
        return args

    def factors(self, *terms):
        scalar = Fraction(1)
        factors = Counter()

        def collect(index, exponent):
            nonlocal scalar
            op, args = self.node(index)
            if op == 'multiply':
                for child in args:
                    collect(child, exponent)
            elif op == 'rational':
                scalar *= Fraction(int(args[0]), int(args[1])) ** exponent
            elif op == 'inverse':
                collect(args[0], -exponent)
            else:
                factors[index] += exponent

        for index, exponent in terms:
            collect(index, exponent)
        return scalar, {key: power for key, power in factors.items() if power}

    def explicit_reach(self, roots):
        pending = list(roots)
        visited = set()
        while pending:
            index = pending.pop()
            if index in visited:
                continue
            visited.add(index)
            op, args = self.node(index)
            if op in ('add', 'multiply', 'maximum', 'smooth_piecewise'):
                pending.extend(args)
            elif op in ('inverse', 'exp', 'sqrt_positive', 'log_positive',
                        'integer_power', 'source_step_derivative', 'sine', 'cosine'):
                pending.append(args[0])
        return visited


def exactly_one(items, predicate):
    selected = [item for item in items if predicate(item)]
    assert len(selected) == 1, (items, selected)
    return selected[0]


def check_cutoff(graph, psi, dpsi, length, time):
    factors = graph.op(psi, 'multiply')
    transitions = {}
    time_scalar, time_factors = graph.factors((time, 1))
    for step in factors:
        arg, order = graph.op(step, 'source_step_derivative')
        assert order == 0
        pieces = graph.op(arg, 'add')
        const = exactly_one(pieces, lambda p: graph.node(p)[0] == 'rational')
        literal = Fraction(*map(int, graph.op(const, 'rational')))
        assert literal in (-4, 16)
        sign = 1 if literal == -4 else -1
        term = next(p for p in pieces if p != const)
        assert graph.factors((term, 1), (length, 1)) == (sign * 20 * time_scalar, time_factors)
        transitions[step] = (arg, sign)
    assert {entry[1] for entry in transitions.values()} == {1, -1}
    differentials = set()
    for term in graph.op(dpsi, 'add'):
        pieces = graph.op(term, 'multiply')
        intact = exactly_one(pieces, lambda index: index in factors)
        coefficient = next(index for index in pieces if index != intact)
        differentiated = next(index for index in factors if index != intact)
        argument, sign = transitions[differentiated]
        value, remaining = graph.factors((coefficient, 1), (length, 1))
        assert value == sign * 20 and len(remaining) == 1
        derivative, power = next(iter(remaining.items()))
        assert power == 1 and graph.op(derivative, 'source_step_derivative') == [argument, 1]
        differentials.add(differentiated)
    assert differentials == set(factors)
    return [{'argument': arg, 'derivativeTimesPulseLength': sign * 20}
            for arg, sign in transitions.values()]


def check_component(graph, registry, system, projected, expected, remaining, derivative, j, part):
    assert sorted(graph.op(expected, 'add')) == sorted([derivative, remaining])
    terms = graph.op(derivative, 'multiply')
    state = exactly_one(terms, lambda index: graph.node(index)[0] == 'm3_forced_pulse_partial')
    dpsi = next(index for index in terms if index != state)
    native = graph.op(state, 'm3_forced_pulse_partial')
    assert native[:3] == [system['id'], part, j]
    assert native[4] == system['parameters'] and native[5] == [0] * len(system['directions'])
    time = native[3]

    terms = graph.op(remaining, 'multiply')
    source = exactly_one(terms, lambda index: graph.node(index)[0] == 'm3_coupled_expression_partial')
    complement = next(index for index in terms if index != source)
    terms = graph.op(complement, 'add')
    assert 1 in terms
    minus = graph.op(next(index for index in terms if index != 1), 'multiply')
    assert 20 in minus
    psi = next(index for index in minus if index != 20)
    name, actual, orders = graph.op(source, 'm3_coupled_expression_partial')
    assert name.startswith('coupled-expression:')
    path_args = [system['variable'], *system['parameters']]
    definition = registry[int(name.split(':')[1])]
    assert definition['id'] == name and definition['name'] == f'CoupledForced_source_{j}_{part}'
    assert definition['parameters'] == path_args
    assert actual == [time, *system['parameters']] and orders == [0] * len(path_args)
    path_source = exactly_one(projected, lambda i: graph.node(i) ==
                             ('m3_coupled_expression_partial', [name, path_args, orders]))
    return (time, psi, dpsi), {
        'expected': expected, 'remainingSource': remaining, 'derivativeSource': derivative,
        'mappedState': state, 'mappedSource': source, 'formalPathSource': path_source,
        'sourceSystem': name, 'sourceBody': definition['body'],
    }


def bind(graph, record, registry, projection):
    expressions, _, _, systems, _ = json.loads(registry['definitions'])
    phases = {(row['difference'], row['sign']): row['ownPhase']
              for row in projection['forcingChart']['phaseCases']}
    assert len(phases) == 10 and len(record['templates']) == 10
    results = []
    for template in record['templates']:
        assert [f['m'] for f in template['forced']] == [1, 2]
        for forced in template['forced']:
            system = systems[forced['inverse']['system']]
            m = forced['m']
            assert system['name'] == f"ActualOriginalForced_{template['key']}_m{m}"
            assert system['length'] == forced['inverse']['input']['length']
            assert system['left'] == 0 and system['initial'] == [{'imaginary': 0, 'real': 0}] * 3
            cutoff = forced['mapped']['cutoff']['mapped']
            shift_hint = forced['inverse']['input']['variable'] - system['variable']
            projected = graph.explicit_reach(root for z in system['forcing'] for root in z.values())
            anchors, rows = set(), []
            for component in range(3):
                pair = {}
                for part in ('real', 'imaginary'):
                    roots = [cutoff[name][component][part] - shift_hint for name in
                             ('expected', 'remainingSource', 'derivativeSource')]
                    anchor, pair[part] = check_component(
                        graph, expressions, system, projected, *roots, component, part)
                    anchors.add(anchor)
                rows.append(pair)
            assert len(anchors) == 1
            time, psi, dpsi = anchors.pop()
            difference, sign = template['levelDifference'], template['sign']
            phase = phases[difference, sign]
            assert time in graph.explicit_reach([phase])
            transitions = check_cutoff(graph, psi, dpsi, system['length'], time)
            results.append({
                'key': template['key'], 'sign': sign, 'difference': difference,
                'mode': m, 'phase': phase, 'waveNumber': template['k'], 'system': system['id'],
                'pulseValue': time, 'length': system['length'],
                'cutoff': psi, 'cutoffDerivative': dpsi,
                'transitionArguments': transitions, 'components': rows,
            })
    assert len(results) == 20
    assert {row['system'] for row in results} == set(range(20))
    return results



def rational(graph, index):
    return Fraction(*map(int, graph.op(index, 'rational')))


def own_phase_guards(graph, definition, difference, level, phase, time, length):
    root = definition['body']
    guards = []
    while graph.node(root)[0] == 'smooth_piecewise':
        test, left, right, before, inside, after = graph.op(root, 'smooth_piecewise')
        if test == level:
            lo, hi = rational(graph, left), rational(graph, right)
            assert difference not in (lo, hi)
            root = before if difference < lo else after if hi < difference else inside
        else:
            assert before == after == 0
            guards.append([test, left, right])
            root = inside
    assert len(guards) == 7
    assert guards[-1] == [time, 0, length]
    assert phase in graph.explicit_reach([root])
    return guards


def subtract_program(graph, registry, projection, bindings):
    definitions = {row['name']:row for row in json.loads(registry['definitions'])[0]
                   if row['name'].startswith('ActualForcedCurrent_angular_residual_')}
    assert len(definitions) == 12
    level = projection['forcingChart']['levelDifferenceCoordinate']
    cases = {(row['difference'],row['sign'],row['mode']):row for row in bindings}
    case_programs = []
    for difference, sign in sorted({(r['difference'],r['sign']) for r in bindings}):
        key = (difference,sign)
        mode1, mode2 = cases[(*key,1)], cases[(*key,2)]
        for name in ('phase','pulseValue','length','cutoff','cutoffDerivative'):
            assert mode1[name] == mode2[name]
        suffix = '0' if sign == 1 else '1'
        local = [definitions[f'ActualForcedCurrent_angular_residual_{j}_own_{suffix}'] for j in range(3)]
        assert all(x['parameters'] == local[0]['parameters'] for x in local)
        phase = mode1['phase']
        guards = [own_phase_guards(graph,x,difference,level,phase,
                                  mode1['pulseValue'],mode1['length']) for x in local]
        assert guards == [guards[0]] * 3
        corrections = {}
        for harmonic in (-4,-3,-2,-1,1,2,3,4):
            entry = cases.get((*key,abs(harmonic)))
            for j, component in enumerate(projection['residual']):
                recipe = component['rawSameRowOwnPhaseNonzeroModes'][str(harmonic)]
                flat = None
                if entry is not None:
                    source = entry['components'][j]
                    flat = {'real':source['real']['expected'], 'imaginary':source['imaginary']['expected'],
                            'imaginaryMultiplier':1 if harmonic > 0 else -1}
                corrections.setdefault(str(harmonic), []).append({
                    'projectionRecipe':recipe, 'subtractFirstForced':flat,
                })
        case_programs.append({
            'difference': difference, 'sign': sign, 'phase': phase,
            'ownParameters':local[0]['parameters'], 'ownGuards':guards[0], 'coefficients':corrections,
        })
    rows = []
    for row in projection['rows']:
        label = row['label']
        sign = label['sign']
        actual = row['values']
        assert len(actual) == len(case_programs[0]['ownParameters'])
        assert row['coefficient'] == 1 and actual[-1] == label['fixedDifference']
        assert all(len(x) == 3 for x in row['guards'])
        rows.append({'label': label, 'differenceNode': actual[-1],
                     'rowGuards': row['guards'], 'rowActualValues': actual,
                     'caseIndices': [i for i,c in enumerate(case_programs) if c['sign'] == sign]})
    assert len(rows) == 162
    return {'rows': rows, 'cases': case_programs, 'selectorFormal': level,
            'caseRule': 'The original half-integer cutoff selects the case strictly between d-1/2 and d+1/2; preserve the stored actual selector.'}


def controls(graph, registry, bindings):
    first, second = bindings[:2]
    f = first['components'][0]['real']
    expressions, _, _, systems, _ = json.loads(registry['definitions'])
    system = systems[0]
    projected = graph.explicit_reach(root for z in system['forcing'] for root in z.values())
    wrong_source = second['components'][0]['real']['remainingSource']
    wrong_time = system['variable']

    def rejects(call):
        try:
            call()
        except AssertionError:
            return True
        return False

    tests = {
        'mapped_time_replaced_with_formal_time': rejects(lambda: check_cutoff(
            graph, first['cutoff'], first['cutoffDerivative'], first['length'], wrong_time)),
        'different_forced_system_source': rejects(lambda: check_component(
            graph, expressions, system, projected, f['expected'], wrong_source,
            f['derivativeSource'], 0, 'real')),
        'imaginary_component_substituted_for_real': rejects(lambda: check_component(
            graph, expressions, system, projected, f['expected'], f['remainingSource'],
            f['derivativeSource'], 0, 'imaginary')),
    }
    assert all(tests.values()), tests
    return tests


def main():
    parser = ArgumentParser(description=__doc__)
    for key in ('repo', 'graph', 'projection', 'out'):
        parser.add_argument('--' + key, type=Path, required=True)
    args = parser.parse_args()
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled')
    pins = source_pins(args.repo)
    record = checkpoint_record(args.repo)
    projection = pinned_json(args.projection, PROJECTION_SHA)
    registry = pinned_json(args.graph / 'original-source-functions.json', REGISTRY_SHA)
    with TemporaryFile() as backing:
        graph = Archive(args.graph / 'original-source-nodes.jsonl.gz', backing)
        bindings = bind(graph, record, registry, projection)
        negative = controls(graph, registry, bindings)
        rows = subtract_program(graph, registry, projection, bindings)
    result = {
        'schema': 'MathScope.M3.FirstForcedFlatCutoffBinding/1',
        'verdict': 'VERIFIED_ACTUAL_FIRST_FORCED_PRINCIPAL_CUTOFF_TERMS',
        'checkpointCommit': CHECKPOINT_COMMIT, 'checkpointGzipSHA256': CHECKPOINT_SHA,
        'producerCommit': PRODUCER_COMMIT, 'producerSourceSHA256': pins,
        'firstPostFiveGraphSHA256': GRAPH_SHA, 'nativeRegistrySHA256': REGISTRY_SHA,
        'fullResidualProjectionSHA256': PROJECTION_SHA, 'checkedGraphNodes': NODE_COUNT,
        'actualPositiveSystems': len(bindings), 'exactRealComponentBindings': len(bindings) * 6,
        'bindings': bindings,
        'negativeControls': negative,
        'firstForcedSubtractedFromSameRowProgram': rows,
        'crossRowTerms': 'Retain unchanged from the referenced full residual projection.',
        'normalization': 'Use the own chart of the referenced projection; the subtracted roots are already in that chart.',
        'operation': 'For each selected guarded row, subtract the complex root pair from the named projection recipe.',
        'outstanding': ['Primary homogeneous cutoff', 'Signed homogeneous cutoff',
                        'Exhaustive flat remainder and support/flat-join proof',
                        'Live original second forcing inverse'],
        'formula': '(1-psi(v))*f(v) + psi_prime(v)*t(v), original normalized own phase',
        'negativeMode': 'Complex conjugate of the positive coefficient for the same fixed case.',
        'completeFirstCycleFlatResidual': False,
        'completeSecondForcingInput': False,
    }
    args.out.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(f'{len(bindings)} actual positive systems, {len(bindings)*6} exact component bindings')


if __name__ == '__main__':
    main()
