"""Replay the surviving actual post-Five mean increments in the pinned compact N3 graph."""
from argparse import ArgumentParser
from collections import Counter
from hashlib import sha256
from pathlib import Path
import json
import subprocess


REF = '74a686bc95f4c094f1de834062b8b402aa5b861940fa3e109aa0f1913d52d529'
COMPACT = '51057fc92e13cd7fc9a875e71c2926c6769cc3536ee1a13f2bea7ddd630cd94a'
SOURCE = 'f8cb4034e86d7b669d52a6f2248aebba156b51b5'
NATIVE = 'm3_coupled_expression_partial'
ANCHORS = {
    'navier/source-temporal-potential.mjs': [
        'deltaV=G.neg(G.div(inverseTheta,ci))',
        'beta=G.neg(Dz(psi)),gamma=De(psi,1)'],
    'post-signed-20261023/source-signed-actual-temporal-inverse.mjs': [
        'updatedVelocity=Object.fromEntries(keys.map(k=>[k,G.add(previous[k],potential.velocity[k])]))'],
    'post-signed-20261023/source-signed-actual-five-map.mjs': [
        'increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired}',
        'updated=Object.fromEntries(names.map(n=>[n,G.add(previous[n],increment[n])]))'],
    'post-signed-20261023/source-postfive-full-3d-residual.mjs': [
        'const meanIncrements=names.map(n=>G.sub(latestMean[n],baseline[n]));',
        'const velocity=old.fullVelocity.map((rootId,j)=>G.add(rootId,meanIncrements[j]));'],
}


def metadata(path, pin):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == pin, path.name
    return json.loads(data)


def verify(repo, compact, reference):
    pins = {}
    for relative, anchors in ANCHORS.items():
        path = 'research-ide/mathscope-m3/' + relative
        raw = subprocess.check_output(['git', '-c', 'safe.directory=' + repo.as_posix(),
                                       '-C', str(repo), 'show', f'{SOURCE}:{path}'])
        assert all(row.encode() in raw for row in anchors), path
        pins[path] = sha256(raw).hexdigest()
    nodes = {item['originalId']: item['record'] for item in compact['records']}
    assert len(nodes) == 1663 and compact['sourceGraphNodes'] == reference['split']['nodeCount'] == 22153782
    stages = reference['stages']
    signed, temporal, five, pde = stages[1], stages[3], stages[4], stages[5]
    assert signed['name'] == 'original-signed-162-successor'
    assert temporal['name'] == 'original-post-signed-exact-temporal'
    assert five['name'] == 'original-post-signed-five-map'
    assert pde['name'] == 'original-post-five-physical-residual'
    assert pde['velocity'] == compact['physicalVelocity']

    def operation(root, expected):
        assert nodes[root]['op'] == expected, (root, expected)
        return nodes[root]['args']

    minus = [root for root, row in nodes.items() if row == {'op':'rational', 'args':['-1','1']}]
    assert len(minus) == 1
    negative = minus[0]

    def negative_child(root):
        factors = operation(root, 'multiply')
        assert len(factors) == 2 and negative in factors, root
        return next(i for i in factors if i != negative)

    def expand(root, sign=1):
        node = nodes[root]
        terms = Counter()
        if node['op'] == 'add':
            for argument in node['args']:
                terms.update(expand(argument, sign))
        elif node['op'] == 'multiply' and len(node['args']) == 2 and negative in node['args']:
            terms.update(expand(negative_child(root), -sign))
        else:
            return Counter({root: sign})
        return terms

    def sorted_pairs(terms):
        return [[key, value] for key, value in sorted(terms.items()) if value]

    result = []
    for name, latest, old in zip(('r','theta','z'), pde['velocity'], signed['roots']['velocity'], strict=True):
        pair = operation(latest, 'add')
        assert len(pair) == 2 and old in pair
        delta = next(root for root in pair if root != old)
        positive, negative_baseline = operation(delta, 'add')
        baseline = negative_child(negative_baseline)
        past, fresh = operation(positive, 'add')
        assert temporal['nodeCount'] <= fresh < five['nodeCount']
        system, coordinates, orders = operation(fresh,NATIVE)
        assert not any(orders) and len(coordinates) == 4 and system.startswith('coupled-expression:')
        old_terms = expand(baseline)
        plus = expand(past)
        plus.subtract(old_terms)
        after_split = plus.copy()
        after_split[fresh] += 1
        subtract_mutation = sorted_pairs(expand(positive)) != sorted_pairs(after_split)
        assert subtract_mutation and sorted_pairs(after_split) == sorted_pairs(expand(delta))
        result.append({'component':name, 'postFiveRoot':latest, 'signedFullVelocity':old,
            'retainedMeanIncrement':delta, 'sameBaselineRoot':baseline, 'cancelledBaselineTerms':sorted_pairs(old_terms),
            'temporalTerms':sorted_pairs(plus), 'latestFiveIncrement':fresh, 'latestFiveNativeSlot':system,
            'sourceArguments':coordinates, 'omitBaselineSubtractionDetected':subtract_mutation})

    coords = result[0]['sourceArguments']
    assert all(row['sourceArguments'] == coords for row in result)
    assert len(set(row['latestFiveNativeSlot'] for row in result)) == 3
    ell,R,Z,T = coords
    axis = temporal['inverses'][0]
    axis_def, axis_args, axis_orders = operation(axis,'m3_coupled_inverse_partial')
    assert axis_args[:4] == [R,Z,T,ell] and not any(axis_orders)
    Y = axis_args[4:]
    assert len(Y) == 2

    radial = result[0]['temporalTerms']
    azimuthal = result[1]['temporalTerms']
    axial = result[2]['temporalTerms']
    assert len(radial) == len(azimuthal) == 1 and len(axial) == 3
    assert radial[0][1] == azimuthal[0][1] == -1 and all(value == 1 for _,value in axial)
    eps, psi_z = operation(radial[0][0], 'multiply')
    assert nodes[eps]['op'] == 'exp'
    psi_id, actual, derivative = operation(psi_z,NATIVE)
    assert actual == [ell,R,Z,T,*Y] and derivative == [0,0,1,0,0,0]

    factor, inverse = operation(azimuthal[0][0], 'multiply')
    if factor == axis:
        factor, inverse = inverse,factor
    assert inverse == axis
    ci, = operation(factor,'inverse')

    direct = next(root for root,_ in axial if nodes[root]['op'] == NATIVE)
    assert operation(direct,NATIVE) == [psi_id,actual,[0,1,0,0,0,0]]
    components = [root for root,_ in axial if root != direct]
    pairs = [operation(root,'multiply') for root in components]
    connection = next(pair for pair in pairs if any(nodes[id] == {'op':'inverse','args':[R]} for id in pair))
    value = next(id for id in connection if nodes[id]['op'] == NATIVE)
    assert operation(value,NATIVE) == [psi_id,actual,[0]*6]
    other = next(pair for pair in pairs if pair != connection)
    radial_fast, angular = other
    y0, scale_y1 = operation(angular, 'add')
    vr1,y1 = operation(scale_y1,'multiply')
    assert operation(y0,NATIVE) == [psi_id,actual,[0,0,0,0,1,0]]
    assert operation(y1,NATIVE) == [psi_id,actual,[0,0,0,0,0,1]]
    assert radial_fast != eps and vr1 != eps

    return {
        'schema':'MathScope.N7.OriginalN3CompactMeanIncrementNativeSlots/1',
        'status':'VERIFIED_ACTUAL_ERASURE_OF_DUPLICATE_MEAN_BASELINE_AND_TEMPORAL_NATIVE_APPS',
        'compactSHA256':COMPACT, 'sourceReferenceReceiptSHA256':REF, 'sourceCommit':SOURCE,
        'sourceFileSHA256':pins, 'sourceGraphNodes':22153782, 'compactRecords':1663,
        'componentRows':result, 'sharedTemporalPotentialSlot':psi_id, 'temporalDirections':actual,
        'verifiedPsiApplicationIDs':[value,psi_z,direct,y0,y1],
        'physicalFactors':{'epsilon':eps,'ci':ci,'radialFast':radial_fast,'vr1':vr1,'R':R},
        'originalTemporalInverseTheta':axis, 'originalTemporalInverseDefinition':axis_def,
        'scope':{'duplicateMeanBaselineCancellation':True,'temporalCurlStencil':'VERIFIED',
                 'nativeRegistryDefinitionBodiesRead':False,'freshFiveMapNativeFTCBodies':'OPEN',
                 'fullInitializedSubtractionAndGauge':'OPEN','actualUniformStageCaps':'OPEN',
                 'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'},
    }


def main():
    assert __debug__
    parser = ArgumentParser(description=__doc__)
    for name in ('repo', 'compact', 'first-cycle', 'out'):
        parser.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    result = verify(args.repo.resolve(),metadata(args.compact,COMPACT),metadata(args.first_cycle,REF))
    with args.out.open('x',encoding='utf8',newline='\n') as handle:
        json.dump(result,handle,indent=2)
        handle.write('\n')
    print('PASS three baseline cancellations and five identical native Temporal potential applications')


if __name__ == '__main__':
    main()
