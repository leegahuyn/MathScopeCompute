"""Package exact original N3 FiveMap weighted whole and shell support."""
import json

from assemble_continuation39 import assemble_delta, entry, read_arguments
from assemble_continuation78 import PARENTS as EARLIER


PARENT = '81c0a357fa4a4a61d44fd02557cf971eebd8a41d'
PARENTS = {**EARLIER, 'MathScope_Goal_Continuation78_Delta_20261120.zip':
           'f5d1489ddd5adf7edcad1b4400b1f4c2283eeca5c45f832d6f55cc76e28cdf0b'}
DIR = 'primary-forced-join/active-n3-c5-binding/whole-five-map-moment/'
PINS = {
    'five-whole-moment.json':'3e7be0b196440736e725849634700bbaf11620f1b6177fd3566c911cd493393c',
    'verify_five_whole_moment.py':'3ad15387c68f39bd196f12b650f2bf37e576416a5dd9755c15b4e12e8f3cbd95',
    'archived-shell-control.log':'e39d9174c2e7f9c80adab1e9b7788e8bd70210e5158178e3965dc88b2b43baff',
}


def verify_evidence(raw, source):
    for path, pin in PINS.items():
        assert entry(raw(DIR + path))['sha256'] == pin, path
    result = source(DIR + 'five-whole-moment.json')
    assert result['githubRun'] == 44582875351
    assert result['sourceStream']['sha256'] == 'faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
    assert result['sourceStream']['nodes'] == 22155584
    assert result['actualRoots']['whole'] == 22151951
    assert result['actualRoots']['coefficients'] == [22151921,22151923]
    assert result['actualRoots']['profileCopies'] == [17744839,17744867]
    assert result['actualRoots']['fixedLimits'] == [17743711,17743713]
    assert result['nativeInverseBracket'] == ['1/2','2']
    assert result['coefficientFreeSlots'] == ['ell','Z','T'] and result['wholeLimitFreeChartSlots'] == []
    assert result['exactOriginalShell']['terminalTreeNodesChecked'] == 62
    assert result['uniformOnAdmittedNativeInverseImage']
    assert result['wholeIntegralOnAdmittedSupports'] == 'c0*M0 + c1*M1 = 0'
    assert result['truncationControl']['signedWholeValue'] == '7/2000'
    assert result['wholeGauge'] == 'OPEN' and result['release'] == 'HOLD' and result['finalJets'] == 0

    control = json.loads(raw(DIR + 'archived-shell-control.log'))
    assert control == {'archivedDefaultShell':'PASS','center':633686,'terminalTreeNodesChecked':62}
    assert b'CONDITIONAL_ACTUAL_FIVE_MAP_WHOLE_MOMENT_CANCELLATION 7/2000' in raw(DIR + 'five-whole-moment-fixed.log')
    return {'hostedSourceRun':44582875351, 'wholeFiveMapIntegralRoot':22151951,
            'originalShellTreeChecks':62, 'wholeFiveMapMomentOnAdmittedChart':'0',
            'truncatedWindowControl':'7/2000', 'wholeGauge':'OPEN', 'finalJets':0}


if __name__ == '__main__':
    assemble_delta(read_arguments(__doc__), parent=PARENT, parents=PARENTS,
                   label='MathScope_Goal_Continuation79', date='20261120', verify=verify_evidence)
