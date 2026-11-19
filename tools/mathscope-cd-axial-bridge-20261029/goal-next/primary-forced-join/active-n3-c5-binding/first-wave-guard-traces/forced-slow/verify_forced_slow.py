"""Replay the four original slow cutoff factors through the actual first Forced source."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from functools import cache
from hashlib import sha256
import json
from pathlib import Path
import sys


MANIFEST = '8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a'
SOURCE = '6bf1e8c538e67bec6ea52e5960fd5cb23a556442d413d120025c49f30f117c27'
SLOW = (17732737, 17732748, 17732749, 17732750, 17733856, 17733857, 17733858)
Y = (17745430, 17745431)
AXES = {'band': (17735160,17735193), 'R': (17735196,17735228),
        'Z': (17735231,17735263), 'T': (17735266,17735298)}
PREFIXES = ('InitializedOriginalWave_', 'InitializedOriginalPrimaryPressure_', 'OriginalPrimaryPrincipalFlat_')
COMPONENTS = ('real', 'imaginary')
RECURRENCE = ('u_0(v)=integral_0^v forcing(w) dw; '
              'u_(j+1)(v)=integral_0^v matrix(w)*u_j(w) dw; t=sum_(j>=0) u_j.')


def read(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path
    return json.loads(data)


class Nodes:
    def __init__(self, graph):
        self.graph = graph

    def node(self, i):
        row = self.graph.record(i)
        return row['op'], row['args']

    def args(self, i, expected):
        name, operands = self.node(i)
        assert name == expected, (i,name,expected)
        return operands


def flat_cutoff(graph, exact, offset, factor):
    x, lo, hi, left, inside, right = graph.args(factor, 'smooth_piecewise')
    assert (x,left,right) == (offset,0,0)
    assert (exact.of(lo),exact.of(hi)) == (exact.scalar(Q(-3,4)),exact.scalar(Q(3,4)))
    central, inverse = graph.args(inside, 'multiply')
    denominator, = graph.args(inverse, 'inverse')
    total, = graph.args(denominator, 'sqrt_positive')
    third, other = graph.args(total, 'add')
    first, second = graph.args(other, 'add')
    bumps = {}
    for root in [first, second, third]:
        bump,power = graph.args(root,'integer_power')
        absval, inner_lo, inner_hi, one, transition, zero = graph.args(bump,'smooth_piecewise')
        assert (one,zero) == (1,0)
        assert (exact.of(inner_lo),exact.of(inner_hi)) == (exact.scalar(Q(1,4)),exact.scalar(Q(3,4)))
        square, = graph.args(absval,'sqrt_positive')
        displacement,two = graph.args(square,'integer_power')
        assert (power,two) == (2,2)
        value = exact.sub(exact.of(offset),exact.of(displacement))
        [shift] = [p for p in (-1,0,1) if value == exact.scalar(p)]
        arg,order = graph.args(transition,'source_step_derivative')
        assert order == 0
        assert exact.of(arg) == exact.sub(exact.scalar(Q(3,2)),exact.mul(exact.scalar(2),exact.of(absval)))
        bumps[shift] = bump
    assert set(bumps)=={-1,0,1} and bumps[0]==central
    for face, neighbor in [(Q(-3,4),-1),(Q(3,4),1)]:
        assert abs(face-neighbor)==Q(1,4) and abs(face+neighbor)>Q(3,4)
        assert Q(3,2)-2*abs(face)==0
    return {'offset':offset,'factor':factor,'normalizedDenominator':denominator,
            'bumps':bumps,'denominatorAtBothFaces':1,'cutoffAllFiniteDerivativesAtBothFaces':0}


def ideal(graph, generators, *, calls=lambda i,op,args:False):
    @cache
    def visit(i):
        if i == 0 or i in generators:
            return True
        op,args = graph.node(i)
        if op == 'add':
            return all([visit(j) for j in args])
        if op == 'multiply':
            return any([visit(j) for j in args])
        if op == 'integer_power':
            return args[1]>0 and visit(args[0])
        if op == 'smooth_piecewise':
            return all([visit(j) for j in args[3:]])
        return calls(i,op,args)
    return visit


def replay(graph, native, data, Exact):
    exact = Exact(graph)
    axes = {k:flat_cutoff(graph,exact,*v) for k,v in AXES.items()}
    base = json.loads(native.base_snapshot['base']['expression'])
    auxiliary = json.loads(native.base_snapshot['expressionDefinitions'])
    definitions = {r['id']:r for r in native.expressions}
    tables = {'actual_expression_partial':dict(enumerate(base)),
              'm3_aux_expression_partial':{-i-1:r for i,r in enumerate(auxiliary)},
              'm3_coupled_expression_partial':definitions}
    potential = {i:r for i,r in enumerate(base) if i in (32033,32034,32035,32042,32043,32044)}
    assert len(potential)==6 and all(r['name'].startswith('GlobalOriginalPotential_') for r in potential.values())
    seeds = {r['id']:r for r in definitions.values() if r['name'].startswith(PREFIXES)}
    assert len(seeds)==100
    admissible_seed_derivatives = {}
    for axis,row in axes.items():
        factor = row['factor']
        derivatives = set()

        def native_factor(root, op, args):
            if op not in tables or args[0] not in tables[op]:
                return False
            system,actual,orders = args
            definition = tables[op][system]
            parameters = definition['parameters']
            assert len(parameters)==len(actual)==len(orders)
            # A changed slow input would move the flat face. Derivatives here are
            # source derivatives before evaluation, with the indicated formals fixed.
            if any(old not in parameters or actual[parameters.index(old)]!=old for old in SLOW):
                return False
            result = vanish(definition['body'])
            if result:
                derivatives.add((root,definition['name'],tuple(orders)))
            return result

        vanish = ideal(graph, {factor}, calls=native_factor)
        for r in list(potential.values())+list(seeds.values()):
            assert vanish(r['body']), (axis,r['name'],r['body'])
        admissible_seed_derivatives[axis] = max((sum(r[2]) for r in derivatives),default=0)

    max_orders = {k:0 for k in PREFIXES}
    counts = {'raw':0,'supported':0,'principal':0,'pulledBack':0,'projected':0}
    cases = []
    wrappers={(r['name'],r['body'],tuple(r['parameters'])):r for r in definitions.values()
              if r['name'].startswith('CoupledForced_source_')}
    for row in data['full']['rows']:
        delta,sign = row['key'].split(':')
        mode = row['harmonic']
        own = {k:v for k,v in seeds.items() if v['name'].startswith(tuple(f'{p}{delta}_{sign}_' for p in PREFIXES))}
        assert len(own)==10
        used = set()

        def seed_leaf(i,op,args):
            if op != 'm3_coupled_expression_partial' or args[0] not in own:
                return False
            system,actual,orders = args
            assert actual==own[system]['parameters'] and len(actual)==len(orders)
            used.add(i)
            [kind] = [p for p in PREFIXES if own[system]['name'].startswith(p)]
            max_orders[kind] = max(max_orders[kind],sum(orders))
            return True

        within = ideal(graph, set(), calls=seed_leaf)
        pulse_id = row['system']
        pulse = native.pulses[pulse_id]
        assert pulse['id']==pulse_id
        assert pulse['left']==0 and pulse['initial']==[dict.fromkeys(COMPONENTS,0)]*3
        assert pulse['forcing']==row['projected'] and not pulse['finitePartialSumIsExactSolution']
        assert not pulse['homogeneousPulseSubstitutedForForcedSolution']
        assert pulse['length']==17733029 and pulse['orderedTermRecurrence']==RECURRENCE
        assert pulse['directions']==[17732748,17732749,17732750,*Y]
        params = [pulse['variable'],*pulse['parameters']]
        expected_wrappers = {part:set() for part in COMPONENTS}
        assert (row['principal'] is None)==(mode==2)
        for j in range(3):
            for part in COMPONENTS:
                roots = [row[k][j][part] if row[k] is not None else 0
                         for k in ('raw','supported','principal')]
                raw,supported,principal = map(exact.of, roots)
                assert raw==exact.add(supported,principal), (row['key'],mode,j,part,'subtraction')
                for category,root in zip(('raw','supported','principal'),roots):
                    assert within(root),(row['key'],mode,category,j,part,root)
                    if category=='principal' and mode==2:
                        continue
                    counts[category] += 1
                system,actual,orders = graph.args(row['originalSource'][j][part],'m3_coupled_expression_partial')
                declaration = definitions[system]
                assert declaration['name']==f"ActualWholeNonzeroSource_{row['key']}_{mode}_{j}_{part}"
                assert declaration['body']==roots[1] and not any(orders)
                assert actual==[row['H_w'][Y.index(p)] if p in Y else p for p in declaration['parameters']]
                assert all(p in declaration['parameters'] for p in SLOW)
                wrapper = wrappers[f'CoupledForced_source_{j}_{part}',row['originalSource'][j][part],tuple(params)]
                expected_wrappers[part].add(wrapper['id'])
                counts['pulledBack'] += 1

        def projection_leaf(i,op,args,part):
            if op != 'm3_coupled_expression_partial' or args[0] not in expected_wrappers[part]:
                return False
            assert args[1]==params and args[2]==[0]*len(params)
            return True

        for part in COMPONENTS:
            projected = ideal(graph,set(),calls=lambda i,op,a:projection_leaf(i,op,a,part))
            for component in pulse['forcing']:
                assert projected(component[part]),(row['key'],mode,part,component[part])
                counts['projected']+=1
        assert used
        cases.append({'key':row['key'],'mode':mode,'system':pulse_id,'seedApplications':len(used)})
    assert len(cases)==20 and all(n==(60 if k=='principal' else 120) for k,n in counts.items())
    assert list(max_orders.values())==[2,1,0]
    return {'axisFactors':axes,'potentialBodies':[r['body'] for r in potential.values()],
            'seedDefinitions':len(seeds),'seedsAcrossFourAxes':4*len(seeds),
            'highestNativeDerivativeInSeedDefinitions':admissible_seed_derivatives,
            'highestForcingSeedDerivative':max_orders,'scalarChecks':counts,
            'literalZeroInitialOrderedPulseRecurrences':len(cases),'cases':cases}


def main():
    parser = ArgumentParser(description=__doc__)
    for name in ('artifact','reader','cache-module','cache','goal','out'):
        parser.add_argument('--'+name,required=True,type=Path)
    a = parser.parse_args()
    sys.path[:0] = [str(a.reader),str(a.cache_module),str(a.goal/'first-force-repair')]
    import source_cache, source_stream
    from verify_repaired_first_force import Exact
    folder = a.artifact/'first-correction-spatial-source'
    manifest = read(folder/source_stream.MANIFEST,MANIFEST)
    same = read(a.artifact/'same-family-mode-two.json',SOURCE)
    original = source_cache.load(source_stream,folder,manifest,22153782,a.cache)
    try:
        native = source_stream.Native(folder,manifest)
        out = replay(Nodes(original),native,same,Exact)
    finally:
        original.__exit__()
    out.update(status='VERIFIED_ORIGINAL_FOUR_SLOW_FACTORS_AND_FORCED_SOURCE_IDEALS_CONDITIONAL_FINITE_TRACE',
               nodeCount=manifest['node_count'],manifestSHA256=MANIFEST,firstSourceSHA256=SOURCE,
               originalStreamSHA256=manifest['node_stream_sha256'],
               traceConditions=['Fixed chart with all other guards strict and smooth parameterization of the chosen face.',
                   'Every retained cofactor, projected normal inverse and native coefficient extends smoothly with finite derivatives on an admitted neighborhood of the face for the entire closed pulse.',
                   'The finite variational equations for the native propagator agree with derivatives of the actual endpoint solution.'],
               open=['Uniform near-shell inverse/regularity bounds and simultaneous seams.',
                   'Later recursive corrections, actual energy residual values, and final jets.'],
               finalJets=0,release='HOLD')
    a.out.write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(out['status'],out['scalarChecks'],out['highestForcingSeedDerivative'])


if __name__ == '__main__':
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    main()
