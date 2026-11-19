"""Verify and package the mean cutoff, angular scope and endpoint transport."""

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation41 import PARENTS as EARLIER


PARENT = '6b312b9579548884cc949383d8c027cda2cd889d'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation41_Delta_20261119.zip':
           'af5320f900ed6e0232d48e5d954487c2a1dcd4436bbb1f8128858f69dfc596ed'}
ANGLE = 'final67/initial-fourier/'
MEAN = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/actual-mean-cutoff/'
FORCED = 'primary-forced-join/active-n3-c5-binding/endpoint/forced-parameter-transport/'
CI = 'ci-44533412267/'
Y = 'y-higher-flow/n4-physical-frame/'
LEAN_PATH = 'research-ide/mathscope-m3/p8/lean/MathScope/M3/CD/PulseCutoff.lean'
LEAN_SHA = 'fe5f7996b033a1d5036837c4c54d05f78e66cf1bca3386af589cd2e10b2c8e9b'
PINS = {
    ANGLE + 'initialized-angular-split.json': '0545658bf1dc4d5b373639c562ce537be1600a2210089faaa90aa6f77a8ed0b2',
    ANGLE + 'initialized-winding.json': '89c4b326bac653e1ab7df3d370d1b358925b43400b47cdfbb729491f1e8e27f4',
    MEAN + 'mean-cutoff-source-final.json': '36f30a23afbfdb254e392a351d322f4dfd8a4656bd1c935d25cf65994b30b6c3',
    MEAN + 'actual-mean-cutoff-final.json': 'b4eb1971ae9cd515175bddbb1fd229b485be0c8c71f3cf14f0d03990ec7351e1',
    FORCED + 'n3-full-propagator-parameter-transport.json': 'b966ae9d3c6c5e0c63aff4bf1ef635e524dcd188c34380707cbba44d4590b085',
    FORCED + 'n3-spatial-endpoint-chain.json': '47cc87e72c08290cc9fa5c299130230410aa90b5bd2dbcfdea299d993ff0ab20',
    Y + 'physical-flow.json': 'e2a30ba0678dbe201350865ef86d8066e0f3121a1891368695f8fdd8bce865e1',
    Y + 'no-physical-input.json': '4c0f1fc15cd982b4b721a22f11bb49be4b2f8462feafe9aea17955d6c4d41663',
    Y + 'no-guards.json': 'abc10329c87fd90cd2d7ce27506ed88703f631942d5c70a23a55726bfa69fdcc',
    Y + 'no-integrals.json': 'fcde6c197ad72c59bcdef455f8f5551197ff0c9fbe6e1460086a9b0c9d67d84e',
}


def verify_evidence(raw, source):
    for path, digest in PINS.items():
        assert entry(raw(path))['sha256'] == digest, path
    angular = source(ANGLE + 'initialized-angular-split.json')
    assert angular['nodeCount'] == 4456994
    assert angular['angleScopeCheckedNodes'] == 133635
    assert sum(row['signedRows'] for row in angular['fields']) == 648
    assert [row['total'] for row in angular['joins']] == [3859818, 3859819, 3859820, 3859821]
    winding = source(ANGLE + 'initialized-winding.json')
    assert winding['arithmeticRecords'] == 28 and len(winding['hostedInputs']) == 6
    assert winding['zeroTailForCutoffAtLeastCap'] and winding['sourceSHA256'] == angular['sourceSHA256']
    mean_source = source(MEAN + 'mean-cutoff-source-final.json')
    assert mean_source['sourceSHA256'] == angular['sourceSHA256']
    assert mean_source['sourceMean']['completeVelocity'] == [3614790, 3614791, 3614792]
    bulk = source(MEAN + 'actual-mean-cutoff-final.json')
    assert bulk['comparison'] == 1 and bulk['finalJets'] == 0
    assert {row['name'] for row in bulk['localizedVelocity']} == {'beta', 'v', 'gamma'}
    assert set(bulk['commutator']) == {'velocity', 'radial', 'axial', 'angularConnection'}
    shared = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/weighted-velocity/evaluate_mean_bulk_energy.mjs'
    assert entry(raw(shared))['sha256'] == bulk['sourcePins']['sharedEvaluatorSHA256']
    transport = source(FORCED + 'n3-full-propagator-parameter-transport.json')
    assert transport['systems'] == [1, 5]
    endpoint = source(FORCED + 'n3-spatial-endpoint-chain.json')
    assert [row['system'] for row in endpoint['rows']] == [1, 5]
    assert endpoint['universalJetBasisSize'] == 36
    physical = source(Y + 'physical-flow.json')
    assert physical['sourceNodes'] == 7358162 and physical['sourceProfileDescendants'] == 182
    assert len(physical['physicalApplications']) == 14 and physical['activeAncestorNodes'] == 208393
    assert not physical['failures'] and not physical['unresolvedNativeKinds']
    assert physical['nativeDefinitionFactsRebuiltFromActualParameters']
    for kind, failures in (('physical-input', 170), ('guards', 168), ('integrals', 182)):
        assert len(source(Y + f'no-{kind}.json')['failures']) == failures
    ci = source(CI + 'github-run.json')
    assert ci['databaseId'] == 44533412267 and ci['conclusion'] == 'success'
    assert ci['headSha'] == '20b741ce90ab3bd90a37375b081ad80ea96f717c'
    assert LEAN_SHA + '  MathScope/M3/CD/PulseCutoff.lean' in raw(CI + 'source-sha256.txt').decode()
    log = raw(CI + 'PulseCutoff.log').decode()
    assert 'sorryAx' not in log and ': error:' not in log
    for name in ('mean_radial_characteristic_primitive_bound', 'mean_cutoff_radial_derivative',
                 'mean_cutoff_axial_derivative', 'mean_cutoff_divergence'):
        assert f"'MathScope.M3.CD.{name}' depends on axioms: [propext, Classical.choice, Quot.sound]" in log
    return {'newGithubLeanTheorems': 4, 'indexedAngularRows': 648, 'windingArithmeticRecords': 28,
            'sourceMeanCutoffComponents': 3, 'selectedForcedSystems': [1, 5], 'actualN4Profiles': 182}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS, label='MathScope_Goal_Continuation42',
                   date='20261119', verify=verify_evidence, additional_pins={LEAN_PATH: LEAN_SHA})
