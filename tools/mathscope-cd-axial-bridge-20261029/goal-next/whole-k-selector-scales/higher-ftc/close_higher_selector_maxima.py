"""Join actual FTC body equality and directed upper comparisons to b2/b3."""

from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from pathlib import Path
import json


KINDS={
    'velocityPhysical':'velocity-potential-physical',
    'pressureStressPhysical':'pressure-stress-physical',
    'normalizedPressure':'normalized-pressure',
    'weightedStressQuotient':'higher-stress-quotient-by-zeta',
    'weightedStressDirect':'higher-stress-direct-zeta'}
EXACT='3145057b41123be866d0a682feb1cee633c776d97a83d4dc1a2b7831be61442f'
UPPER='39413f57d23536e62382937b10f3fe34da44e9989e179cc5b9375aa8ccddf170'
HISTORY='af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'
FIRST='6873cf394c0d70cdef4a4a9a7e6b50780832be87d7c48ca7dcdc88938a3a5c97'
SOURCE='f8cb4034e86d7b669d52a6f2248aebba156b51b5'


def read(path,pin=None):
    raw=path.read_bytes();digest=sha256(raw).hexdigest()
    if pin:
        assert pin==digest
    return json.loads(raw),digest


def exponential_tower(endpoint):
    depth = 0
    while set(endpoint) == {"exp"}:
        endpoint = endpoint["exp"]
        depth += 1
    assert set(endpoint) == {"rational"}
    return depth, Fraction(endpoint["rational"])


def verify_strict_endpoint_order(upper, lower):
    upper_depth, upper_argument = exponential_tower(upper)
    lower_depth, lower_argument = exponential_tower(lower)
    assert 1 <= upper_depth < lower_depth and upper_argument < 2_000_000
    assert lower_argument > 1_000_000
    assert 1 + lower_argument + lower_argument**2/2 > 2_000_000
    # The extra positive exponential layer is already larger than the
    # entire upper argument. Cancel the remaining common layers by monotonicity.
    return {"upperExpDepth": upper_depth, "thresholdExpDepth": lower_depth}


def main():
    parser=ArgumentParser(description=__doc__)
    for option in ('first','historical','exact','upper','n2','n3','out'):
        parser.add_argument('--'+option,type=Path,required=True)
    args=parser.parse_args()
    first,first_hash=read(args.first,FIRST)
    history,history_hash=read(args.historical,HISTORY)
    exact,exact_hash=read(args.exact,EXACT)
    upper,upper_hash=read(args.upper,UPPER)
    assert first['originalCommit']==history['sourceRevision']==exact['sourceCommit']==upper['sourceCommit']==SOURCE
    assert history['complete'] and len(history['rows'])==3
    assert all(r['againstCPlusKLog2']['10']=='STRICTLY_BELOW' for r in history['rows'])
    exact_rows={(r['order'],r['kind']):r for r in exact['matched']}
    assert set(exact_rows)=={(n,k) for n in (2,3) for k in KINDS.values()}
    assert len(exact['negativeControls'])==2
    assert first['archiveComparison']['strictBound']=='all other max operands < ellMinimum/2 < (ellMinimum+10)*log(2)'
    result_rows=[]
    receipt_hashes={}
    for n,path in ((2,args.n2),(3,args.n3)):
        ar,digest=read(path)
        receipt_hashes[f'n{n}']=digest
        assert ar['sourceCommit']==SOURCE and ar['sourceNormPacketSHA256']==UPPER
        assert ar['historicalInputSHA256']==history['inputSHA256'] and ar['complete']
        assert len(ar['rows'])==5
        limit=10
        for row in ar['rows']:
            name=row['name']
            assert name.endswith(f'N{n}') and name[:-2] in KINDS
            assert row['root']==upper['trace']['roots'][name]
            assert row['againstCPlusKLog2'][str(limit)]=='STRICTLY_BELOW',(n,name,limit,row['againstCPlusKLog2'])
            comparison = verify_strict_endpoint_order(row["interval"]["upper"], ar["thresholds"][str(limit)]["lower"])
            kind=KINDS[name[:-2]]
            actual=exact_rows[(n,kind)]
            result_rows.append({'order':n,'kind':kind,'originalBound':actual['bound'][0],
                                'originalRequiredLog':actual['requiredLog'][0],
                                'upperRequiredLog':row['root'],'strictThresholdOffset':limit,
                                'independentExactEndpointComparison':comparison})
    assert len({(r['order'],r['kind']) for r in result_rows})==10
    result={'schema':'MathScope.N7.ActualCommonSecondThirdSelectorExactMaxima/1',
            'sourceCommit':SOURCE,'receiptSHA256':{'first':first_hash,'historical':history_hash,'exactFTC':exact_hash,'upperOperands':upper_hash,**receipt_hashes},
            'strictOriginalClauseComparisons':result_rows,
            'winningOperands':{'n2':'log b1+log16','n3':'log b2+log2'},
            'exactRatios':{'b1*qBig':1,'b2*qBig':16,'b3*qBig':32},
            'physicalCutoffActivity':'First cutoff one on K. Second cutoff positive on K and one for q<=qBig/32. Third cutoff positive exactly on q<qBig/32. Fourth and higher cutoff jets are zero at physical K points.',
            'physicalPrefixPartition':'N0 and N1 fail the physical omitted-scale guard on all K. N2 meets it exactly for q>=qBig/32. N3 meets the physical guard on all K. A frozen representative is a separate simultaneous condition.',
            'scope':'Physical activity and original common selection scales. The lower representative case, wave fields, whole K and jets have separate evidence obligations.',
            'release':'HOLD'}
    data=(json.dumps(result,indent=2)+'\n').encode();args.out.write_bytes(data)
    print('PASS actual b2*qBig=16 and b3*qBig=32')
    print(sha256(data).hexdigest(),args.out.name)


if __name__=='__main__':
    main()
