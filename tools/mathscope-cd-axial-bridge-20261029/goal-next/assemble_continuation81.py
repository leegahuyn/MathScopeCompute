"""Package the original FiveMap/first-Forced angular energy cross calculation."""
from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation80 import PARENTS as EARLIER

PARENT = 'cbc12a07eed2b09f3014f78035dda1bf28f1923f'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation80_Delta_20261120.zip':
           '10e0f7b096076b9eaf822f8cc6cbff58a796e16e7d5f270aeb3a0e6103ca0a1c'}
DIR = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-angular-cross/'
PINS = {
    'angular-cross-final.json':'f2ce47b2822ee0ae07fb907fa62479d96e310ea10048f6ac449785732b479c02',
    'wave-join-parent.json':'30c381af72215313fcceb4dd8cb150681a7b4a6469798f9fbc62c2513f282cc8',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(DIR+path))['sha256']==pin, path
    cross = source(DIR+'angular-cross-final.json')
    assert cross['pins']['join']==PINS['wave-join-parent.json']
    assert cross['status']=='VERIFIED_SAME_LIVE_FIVEMAP_FIRST_FORCED_ANGULAR_CROSS_SOURCE_CONDITIONAL_SMOOTH_GUARDS'
    actual = cross['source']
    assert (actual['nodeCount'],actual['angleDependencyWindowRows']) == (22155584,4421980)
    assert actual['thetaIndependentRetainedOperands']==739
    phases = actual['literalPhaseRoots']
    assert len(phases)==10 and {x['thetaSlope'] for x in phases.values()} == {17735984,17739402}
    carrier = actual['nonzeroIntegerCarrierNodes']
    assert {x['omega'] for x in carrier.values()} == {17735983,17739401}
    assert 'H_theta' in cross['exactCross']['angularEnergyCross']
    assert 'H_theta' in cross['exactCross']['angularGradientCross']
    assert 'multiple of N' in cross['exactCross']['discreteCondition']
    assert cross['n8ComparisonsCompleted']==cross['finalJets']==0 and cross['release']=='HOLD'
    assert b'VERIFIED_SAME_LIVE_FIVEMAP_FIRST_FORCED_ANGULAR_CROSS' in raw(DIR+'replay.log')
    return {'phaseCharts':10,'angularDependencyRows':4421980,'originalAngleIndependentOperands':739,
            'isolatedFullCircleCrossAveragesZero':2,'finalN8Comparisons':0,'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation81', date='20261120', verify=verify_evidence)
