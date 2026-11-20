"""Cross-check the three control outcomes and certify the exact scope."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path


def main(packet, out):
    def read(name):
        return json.loads((packet/name).read_bytes())

    reach = read('active-y-reach.json')
    expanded = read('expanded.json')
    nominal = read('transport-live.json')
    no_bracket = read('transport-no-bracket.json')
    no_loop = read('transport-no-loop.json')
    expected = [4758,4784,5177,5299]
    assert reach['graphNodes'] == 22380596
    assert reach['before']['nodes'] == 337054 and reach['after']['nodes'] == 379603
    assert reach['after']['roots'] == 1444 and reach['distinctYArgumentRoots'] == 61
    assert not reach['before']['unresolved'] and not reach['after']['unresolved']
    assert reach['before']['naturalCalls'] == reach['after']['naturalCalls'] == 567
    assert reach['exactTypedDescriptorMatchesInRawOnlyN3'] == 567
    assert not reach['appendedNaturalCalls'] and not reach['newToRootReach']
    assert nominal['priorCount'] == nominal['openRangeCount'] == 0
    assert nominal['certifiedRangeCount'] == 567
    assert nominal['newly'] == reach['calls'] == expanded['calls']
    assert nominal['allowsPositiveBracketAtDefinedRoot2'] and nominal['usedRoot2Brackets'] == [17732766]
    assert not nominal['nativeRootExistenceCertified']
    assert not nominal['unresolved'] and not nominal['unsupported']
    assert len(nominal['transported']) == 1694
    assert no_bracket['certifiedRangeCount'] == 563 and no_bracket['openRangeCount'] == 4
    assert sorted(x['id'] for x in no_bracket['openCalls']) == expected
    assert no_loop['certifiedRangeCount'] == 409 and no_loop['openRangeCount'] == 158
    assert {x['id'] for x in no_loop['openCalls']} <= {x['id'] for x in nominal['newly']}
    original = dict(expanded['nodes'])
    assert original[17732766] == {'op':'actual_monotone_root','args':[2,17732749,17732750]}
    owner_ops = dict(sorted(Counter(original[row[0]]['op'] for row in nominal['transported']).items()))
    assert sum(owner_ops.values()) == 1694
    files = ('collect_y_active.mjs','transport_live_y.py','active-y-reach.json','transport-live.json',
             'transport-no-bracket.json','transport-no-loop.json')
    report = {
        'schema':'MathScope.Y.ActiveN3.ConditionalLiteralRangeCrossCheck/1',
        'status':'CONDITIONAL_RANGE_567_OF_567_ON_ACTUAL_LIVE_REPEAT_EXPORT_DEFINED_CHART',
        'streamSHA256':expanded['graphSHA256'],'registrySHA256':expanded['registrySHA256'],
        'exactNumericalCondition':'0<=Y<=4*exp(2*t1)<256/63<5 on defined original real native branches',
        'structuralReach':{'roots':1444,'afterNodes':379603,'beforeNodes':337054,'distinctYRoots':61,
                           'afterLiteralCalls':567,'newLiteralCalls':0,'unknownNativeOwners':0},
        'actualTransportCount':1694,'transportedByOriginalOperation':owner_ops,
        'definedPositiveRoot':17732766,'withoutPositiveRootOpenIds':expected,
        'withoutPositiveLoopLeftOpenCount':158,
        'open':['general positive N and newly generated derivative or Picard natural calls',
                'all physical original reference and representative bindings',
                'native derivative and infinite numerical realizations'],
        'files':{f:hashlib.sha256((packet/f).read_bytes()).hexdigest() for f in files},
        'finalJets':0,'release':'HOLD',
    }
    out.write_bytes((json.dumps(report,sort_keys=True,indent=2)+'\n').encode())


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('packet',type=Path)
    p.add_argument('out',type=Path)
    a=p.parse_args()
    main(a.packet,a.out)
