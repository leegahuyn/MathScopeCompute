"""Verify the complete n=2 normalized-pressure comparison checkpoint."""

from argparse import ArgumentParser
from hashlib import sha256
from pathlib import Path
import json


def load(path,pin):
    data=path.read_bytes()
    assert sha256(data).hexdigest()==pin
    return json.loads(data)


def main():
    parser=ArgumentParser(description=__doc__)
    for option in ('binding','arithmetic','out'):
        parser.add_argument('--'+option,type=Path,required=True)
    args=parser.parse_args()
    binding_hash='feac0e87f567af51ebc96852b6eda6f5d9aa1727bf719c6a2752ead2215d8c07'
    arithmetic_hash='4952ec974ef94a4d9642ab15af9c1575cb73f07a2b5ace48c0c80670e83b8dcd'
    binding=load(args.binding,binding_hash)
    arithmetic=load(args.arithmetic,arithmetic_hash)
    assert binding['sourceCommit']==arithmetic['sourceCommit']
    assert binding['sourceNormPacketSHA256']==arithmetic['sourceNormPacketSHA256']
    assert not arithmetic['complete']
    [n2]=[r for r in binding['rows'] if r['n']==2]
    [directed]=arithmetic['rows']
    assert (n2['originalBound'],n2['originalRequiredLog'])==(1208168,1446511)
    assert directed['name']=='normalizedPressureN2' and n2['upperRequiredLog']==directed['root']
    assert n2['actualUniqueFaces']==24 and n2['exactWeightedTermMatches']==10 and n2['allLowerDerivativeMaximaSubsets']
    assert directed['againstCPlusKLog2']['10']=='STRICTLY_BELOW'
    result={'schema':'MathScope.N7.ActualN2NormalizedPressureUpperComparison/1',
            'sourceCommit':binding['sourceCommit'],'actualGraphSHA256':binding['actualGraphSHA256'],
            'nativeSourceBindingSHA256':binding_hash,'directedArithmeticCheckpointSHA256':arithmetic_hash,
            'originalRequiredLog':n2['originalRequiredLog'],'upperRequiredLog':directed['root'],
            'result':'Actual n=2 normalized-pressure original required log is strictly below (ellMinimum+10)*log(2).',
            'scope':'One of five second-order competing FTC clause families. The shared numerical process continued with the next order.'}
    data=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(data)
    print(sha256(data).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
