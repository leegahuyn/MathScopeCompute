"""Bind the original Temporal ci^-1 and radial scalar for the highest allocation."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json

from verify_wrz_anisotropic import source_paths


PINS = {
    'slab':'8152230d5531fd00bb0685fbcb380ad1b7a116d8833ee871d92803663aee19e9',
    'pressure':'fd93001ad4bbc002d329cba54d1c884cc5e7bfd93444b1d72bd9c331a67b966d',
    'nativeSlab':'b63588358fd2ee676ffdbba6104d5f0c644828cdecff4215e0d87f09037f6f2c',
    'anisotropic':'f549235f4f126ffc2141f4d1a3b3280d25206402a8ba332a961121da0295e013',
    'radial':'609040736c97e77747f2bb5d191f5dcf6c8fabb7a939e133246a03185d16a4aa',
    'radialCode':'aed51507ecc671d0dfd726996a73c3f214706d08d65ac4b918318387a0f6f24b',
    'prehaar':'a749056e325accfb2582b6814c1e335cfbcdd46ec1bc8fb911c24e4741ae8ccc',
}


def main():
    parser=ArgumentParser(description=__doc__)
    parser.add_argument('workspace',type=Path)
    parser.add_argument('out',type=Path)
    args=parser.parse_args()
    local=args.workspace/'work/goal-next'
    src=source_paths(args.workspace)
    scalar_root=local/'continuation75/radial-time-cost'
    paths={
        'slab':src['slab'],'prehaar':src['prehaar'],
        'pressure':src['band.mjs'].with_name('source-global-pressure.mjs'),
        'nativeSlab':local/'continuation74/time-inverse/source-native-final.json',
        'anisotropic':Path(__file__).resolve().parent/'anisotropic-final.json',
        'radial':scalar_root/'radial-length-cost.json',
        'radialCode':scalar_root/'evaluate_radial_length_cost.mjs',
    }
    raw={name:path.read_bytes() for name,path in paths.items()}
    for name,data in raw.items():
        assert sha256(data).hexdigest()==PINS[name],name
    source=raw['pressure'].decode('utf8')
    for stmt in ('baseEll=G.sub(ell,q(2)),baseIndex=paletteIndex(baseEll)',
                 'paletteIndex=x=>floor(G.div(G.sub(G.mul(G.add(G.one,h),x,G.log(q(2))),G.mul(q(2),G.log(x))),G.log(Tg)))',
                 'ci=G.mul(power(Tg,baseIndex),power(band.geometry.Q,G.add(G.one,h)))',
                 'fixed-reference-time-coefficient'):
        assert stmt in source
    n=json.loads(raw['slab'])['nodes']
    native=json.loads(raw['nativeSlab'])['nodes']
    for i,op,a in [
        (17745432,'add',[190,17732737]), (17745433,'multiply',[156007,17745432]),
        (17745434,'multiply',[127,17745433]), (17745435,'log_positive',[17745432]),
        (17745436,'multiply',[24,17745435]), (17745437,'multiply',[20,17745436]),
        (17745438,'add',[17745434,17745437]), (17745439,'multiply',[17733018,17745438]),
        (17745440,'multiply',[20,17745439]), (17745441,'ceiling',[17745440]),
        (17745442,'multiply',[20,17745441]), (17733018,'inverse',[17733017]),
        (17745447,'multiply',[17733017,17745442]), (17745448,'exp',[17745447]),
        (17733025,'multiply',[156007,17732742]), (17733026,'exp',[17733025]),
        (17745449,'multiply',[17733026,17745448]), (17743734,'source_step_derivative',[17743701,0]),
    ]:
        assert n[str(i)]==[op,a],i
    assert native['19570770']==['inverse',[17745449]]
    assert native['19570810']==['multiply',[19570770,19570809]]
    assert native['19570813']==['definite_integral',[19570812,19570776,17743711,17732748]]
    assert native['19570814']==['definite_integral',[19570812,19570776,17743711,17743713]]
    radial=json.loads(raw['radial'])
    assert radial['comparison']==-1 and radial['logTwoLessThanHOverTwoPow128']
    assert radial['safeScalar']=='4*b^3/a=32*Xb^(3/2)/sqrt(Xa)'
    assert '2n**120n' in raw['radialCode'].decode('utf8')
    assert 'exp[(-1+2^-113+6/L)H]' in json.loads(raw['anisotropic'])['conditionalArithmetic']['pointwiseDirected']
    assert '3H/L' in json.loads(raw['prehaar'])['conditionalWeightedTransport']['epsilonRefLogUpper']
    assert 2*(1+Q(1,64))<3 and Q(2)**2>2 and 2**3*6==48<2**6
    total=Q(1,2**113)+Q(1,2**120)+Q(8+15,2**128)
    assert total<Q(1,2**112)
    result={
        'status':'VERIFIED_TEMPORAL_CI_SOURCE_CONDITIONAL_RADIAL_HIGHEST_ALLOCATION',
        'pins':PINS,
        'activeIDs':{'frozenBaseEllMinusTwo':17745432,'paletteIndex':17745442,
                     'ci':17745449,'T1InverseCi':19570770,'shiftedAxialInverse':19570809,
                     'T1Left':19570813,'T1Whole':19570814,'originalChi':17743734,'a':17743711,'b':17743713},
        'ciProof':'floor(x)>x-1 yields ci>2^(-2(1+h))/(Tg*(ell_ref-2)^2)>1/(48*S_ref) on the original chart. ci depends on frozen ell_ref.',
        'ciDirected':'log(ci^-1)<7H/2^128 for ell_ref<=2L, since log(48)<6log(2) and log(S_ref)<H/2^128.',
        'originalRadialLength':'log(4*b^3/a)<H/2^120 from directed original Xa/Xb endpoints.',
        'highestAllocation':'-epsilon_ref^3 ci^-1 T1 N^-1 P_perp T0(partial_Z^6 partial_T Wrz) in partial_Z^2 partial_T(beta_Z).',
        'conditionalDirected':'norm(highest allocation) <= sup_binder(sqrt(zeta))*exp[(-4+2^-112)H]. Strict for positive supremum.',
        'logReserve':'2^-113 + 2^-120 + 8*2^-128 + 15/L < 2^-112, using L>=2^128 and log(2)<H/2^128.',
        'remaining':['each shifted radial binder and its actual original domain/source-role association',
                     'lower cutoff derivative allocations, other Temporal factors and integration of the genuine product'],
        'finalJets':'0/67','release':'HOLD',
    }
    with args.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
