"""Check that the actual initialized mean Y derivatives form a pure L direction."""
from argparse import ArgumentParser
from collections import Counter, defaultdict
from functools import cache
from fractions import Fraction
import json
from pathlib import Path
import sys

from verify_outer_covariance_poles import L, PINS, R, STREAM, Z, ZERO, add, demands, pinned


def ratio_table(graph, exact, previous, rows, registry):
    view = previous.NodeView(graph)
    E = exact(view)
    definitions = {d['id']: d for d in json.loads(registry['definitions'])[0]}
    VR1 = previous.VR1
    SQRT2 = previous.SQRT2
    checks = Counter()
    tested_negative = False

    def mean_atom(atom):
        op, args = view.node(atom)
        if op == 'm3_coupled_expression_partial':
            definition = definitions[args[0]]
            if definition['name'].startswith('ActualInitializedMeanVelocity_'):
                return definition, args[1], args[2]
        return None

    for row in rows:
        if row['harmonic'] != 1:
            continue

        @cache
        def contains_mean(i):
            op, args = view.node(i)
            if op == 'm3_coupled_expression_partial':
                name = definitions[args[0]]['name']
                return name.startswith(('ActualInitializedMeanVelocity_', 'InitializedOriginalWave_'))
            if op in ('add','multiply'):
                return any(contains_mean(j) for j in args)
            if op == 'integer_power':
                return contains_mean(args[0])
            return False

        @cache
        def expand(i):
            op, args = view.node(i)
            if op == 'rational':
                return E.scalar(Fraction(*map(int,args)))
            if not contains_mean(i) or op == 'm3_coupled_expression_partial':
                return {((i,1),): Fraction(1)}
            if op == 'add':
                return E.add(*(expand(j) for j in args))
            if op == 'multiply':
                return E.mul(*(expand(j) for j in args))
            assert op == 'integer_power' and args[1] >= 0
            return E.pow(expand(args[0]), args[1])

        for i, component in enumerate(row['supported']):
            for part, raw in sorted(component.items()):
                groups = defaultdict(lambda: [{}, {}])
                for mono, c in expand(raw).items():
                    means = [(key, exponent, native) for key, exponent in mono if (native := mean_atom(key))]
                    if not means:
                        continue
                    assert len(means) == 1
                    key, exponent, (definition, values, derivative) = means[0]
                    assert exponent == 1
                    assert sum(derivative) <= 1
                    partials = [j for j, order in enumerate(derivative) if order]
                    if partials not in ([4], [5]):
                        continue
                    assert sum(derivative) == 1
                    assert definition['parameters'][-2:] == [previous.Y0, previous.Y1]
                    # Leave the one actual Primary wave factor opaque. Read
                    # the remaining scalar coefficient by exact rational normal form.
                    wave = [(atom, order) for atom, order in mono if atom != key and
                            view.node(atom)[0] == 'm3_coupled_expression_partial']
                    assert len(wave) == 1 and wave[0][1] == 1
                    wave_root = wave[0][0]
                    wd = definitions[view.node(wave_root)[1][0]]
                    assert wd['name'].startswith('InitializedOriginalWave_')
                    coefficient = E.mul(E.scalar(c), *(E.pow(E.of(atom), n) for atom, n in mono
                                                       if atom not in (key, wave_root)))
                    owner = (definition['name'], tuple(values), wave_root)
                    slot = partials[0] - 4
                    groups[owner][slot] = E.add(groups[owner][slot], coefficient)

                for owner, (c0,c1) in groups.items():
                    delta = E.sub(c1, E.mul(E.of(VR1), c0))
                    assert not E.reduce_sqrt_two(delta,SQRT2) or not E.reduce_sqrt_two(E.clear_compound_denominators(delta),SQRT2), (row['key'],i,part,owner)
                    if c0 and not tested_negative:
                        independent = E.reduce_sqrt_two(E.sub(c1,c0),SQRT2)
                        tested_negative = bool(independent)
                    checks[row['key']] += 1
    assert len(checks) == 10 and tested_negative
    return dict(sorted(checks.items()))


def main():
    parser = ArgumentParser(description=__doc__)
    for opt in ('goal','artifact','cache','out'):
        parser.add_argument('--'+opt,type=Path,required=True)
    args = parser.parse_args()
    assert __debug__
    active = args.goal / 'primary-forced-join/active-n3-c5-binding'
    source = args.artifact / 'first-correction-spatial-source'
    paths = {'forcedCheck': active / 'first-wave-guard-traces/angular-order-one-shell/forced/verify_forced_shell.py',
             'first': args.artifact / 'same-family-mode-two.json', 'manifest': source/'original-source-export-manifest.json',
             'registry':source/'original-source-functions.json', 'cache':active/'live-wave-gauge/signed/source_cache.py',
             'reader':active/'spatial-readback/verify_spatial_artifact.py', 'exact':args.goal/'first-force-repair/verify_repaired_first_force.py'}
    data = {name:pinned(path,name) for name,path in paths.items()}
    sys.path[:0] = [str(paths[k].parent) for k in ('forcedCheck','cache','reader','exact')]
    import verify_forced_shell as previous
    import source_cache
    import verify_spatial_artifact
    from verify_repaired_first_force import Exact
    first, manifest, registry = (json.loads(data[k]) for k in ('first','manifest','registry'))
    graph = source_cache.load(verify_spatial_artifact, source, manifest, 22153782,args.cache)
    try:
        assert graph.verify['sha256'] == STREAM
        rows = ratio_table(graph,Exact,previous,first['full']['rows'],registry)
    finally:
        graph.__exit__(None,None,None)
    directions = demands(2)['forcingAndMatrixDirections']
    mean_orders = sorted({add(a,b) for a in directions for b in (ZERO,R,Z,L)})
    assert max(map(sum,mean_orders)) == 5
    assert (1,4,0) in mean_orders and (0,5,0) not in mean_orders
    result = {
        'status':'VERIFIED_ACTUAL_MEAN_DERIVATIVE_COEFFICIENTS_PURE_L',
        'sourceStream':graph.verify, 'pins':{key:PINS[key] for key in paths},
        'canonicalDirection':'L=partial_Y0+vr1*partial_Y1',
        'vr1ActualRoot':previous.VR1, 'testedRawModeOneGroupsByChart':rows,
        'coefficientIdentity':'coefficient(Y1) - vr1*coefficient(Y0) = 0',
        'negativeControl':'Substituting coefficient(Y1)=coefficient(Y0) fails for an actual group.',
        'meanNativeSourceDemand': {
            'directions':['partial_R','partial_Z','L'],
            'commonOrdersForBetaVAndGamma':mean_orders,
            'topDegreeOrders':[a for a in mean_orders if sum(a) == 5],
            'highestZOrder':max(a[1] for a in mean_orders),
            'highestLOrder':max(a[2] for a in mean_orders),
        },
        'scope':'Raw positive m1 mean-reference derivatives at the source amplitude. Affine H_w and the regular native path projection preserve the same directional closure.',
        'finalJets':0, 'release':'HOLD',
    }
    with args.out.open('x',encoding='utf-8',newline='\n') as file:
        json.dump(result,file,indent=2)
        file.write('\n')
    print(result['status'],sum(rows.values()))


if __name__ == '__main__':
    main()
