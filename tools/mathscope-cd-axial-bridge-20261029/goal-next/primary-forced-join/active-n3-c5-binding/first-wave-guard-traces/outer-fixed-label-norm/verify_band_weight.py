"""Attach the fixed-band weight inequality to the live N3 source and cap ledger."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys

from verify_outer_frame_input import ACTIVE, BAND, C88, PINS, ELL, flatten, pinned


ROOT = 'final67/active-n3-cap-transport/source-cap/'
INPUTS = {
    'sameLiveBackground':'0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc',
    'matrix':'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    'c88Scale':'71b6c139f15491aa0c625a25c91c32987a4f58038ccd97fdce9ea888a6e892aa',
    'sourceGain':'387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955',
}


def read(path, name):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==INPUTS[name],path
    return json.loads(raw)


def verify_live_label(goal, artifact, cache):
    sys.path[:0]=[str(goal/ACTIVE/'spatial-readback'), str(goal/ACTIVE/'live-wave-gauge/signed'),
                  str(goal/'first-force-repair'), str(goal/BAND/'weighted-haar-shell/gaussian')]
    import source_stream
    import source_cache
    from check_gaussian_shell import Graph
    from verify_repaired_first_force import Exact

    folder=artifact/'first-correction-spatial-source'
    manifest=json.loads(pinned(folder/source_stream.MANIFEST,'manifest'))
    stream=source_cache.load(source_stream,folder,manifest,22153782,cache)
    try:
        assert stream.verify['sha256']==PINS['stream'] and stream.count==22155584
        g=Graph(stream)
        e=Exact(g)
        assert g.args(17732744,'exp')==[17732743]
        assert g.args(17732742,'log_positive')==[17732740]
        assert g.args(17732740,'exp')==[17732739]
        assert g.args(17732741,'integer_power')==[ELL,2]
        assert g.args(9,'source_parameter')==['h'] and g.args(127,'log_positive')==[24]
        assert e.of(17732743)==e.mul(e.of(9),e.of(17732742))
        assert e.of(17732739)==e.neg(e.mul(e.of(ELL),e.of(127)))
        assert g.args(17732731,'maximum')==[17727240,17732730]
        assert g.args(17727240,'add')==[117105,17727239]
        assert g.args(117105,'rational')==['6','1']
        assert g.args(17727239,'ceiling')==[17727238]
        assert 17727237 in g.args(17727238,'maximum')
        assert 17727235 in g.args(17727237,'maximum')
        assert g.args(17727235,'integer_power')==[14220485,512]
        assert g.args(14220478,'integer_power')==[2128530,4096]
        cap_terms=flatten(g,14220485,'add')
        assert 14220478 in cap_terms
        literal=2**128
        floor=[i for i in cap_terms if g.node(i)==('rational',[str(literal),'1'])]
        assert len(floor)==1
        source={'epsilon':17732744,'Q':17732740,'S':17732741,'ell':ELL,'h':9,
                'windowLower':17732731,'ell0':17727240,'ellMinimum':17727239,
                'bandScaleFloor':17727235,'Bnorm':14220485,
                'BnormFloorTwoTo128':floor[0],'BnormRadiusFactor':14220478}
    finally:
        stream.__exit__()
    return source


def verify(args):
    background=read(args.background,'sameLiveBackground')
    matrix=read(args.matrix,'matrix')
    outer=read(args.goal/C88/'outer-scale.json','c88Scale')
    gain=read(args.goal/(ROOT+'cap-transport.json'),'sourceGain')
    actual=verify_live_label(args.goal,args.artifact,args.cache)
    source_gain=gain['propagatorToOriginalPhysicalGain']
    assert source_gain['sameExactParameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
    assert source_gain['nativeNormNamespaceRoots']['Bnorm']==actual['Bnorm']
    assert source_gain['nativeNormNamespaceRoots']['h']==actual['h']
    assert any('>8002*T_parameter=log(h^-1)' in row for row in source_gain['sourceInequalities'])
    assert 'Bnorm>=max(2^128,C12EnvelopeR^4096)' in source_gain['sourceInequalities']
    assert background['scope']['nativeOperandTransport'] and background['scope']['derivativeOrder']==10
    fields=matrix['sameLiveMatrixBinding']['physicalFieldBindings']
    for field in background['actualBackground']['fields']:
        assert fields[field['field']]['sourceRootAndFirstRZTJets'][0]==field['nativeRoot']
        assert fields[field['field']]['nativeSlot']==field['physicalSlot']
    rows=matrix['sharpBandDegreeAudit']['sourceTargetBandTransfer']
    assert matrix['sharpBandDegreeAudit']['distinctMixedMultiIndicesAudited']==165
    derivative_ledgers=matrix['sharpBandDegreeAudit']['exactDerivativeLedgers']
    for term in ('movingBasisInfinityNorm','normalizedMode1And2MatrixInfinityNorm'):
        assert [row[2] for row in derivative_ledgers[term]]==list(range(9))
    ledger=[]
    for j, rho in enumerate(outer['scaleRows']):
        assert rho['order']==j
        if j>0:
            row=rows[j-1]
            assert row['order']==j and row['tangentOverPBandPower']==2*j
        factors={name:str(Q(rho[name])) for name in ('H','regularWeightW','sqrtW','sqrtWOverFourthRootS')}
        assert Q(factors['H'])==2*j-Q(1,2) and Q(factors['sqrtW'])==2*j+Q(1,4)
        assert all(Q(p)<=64 for p in factors.values())
        ledger.append({'order':j,'slowBackgroundOrderRequired':j+1,'boundFieldOrderAvailable':10,
                       'tangentOverGaussianPower':2*j,'covarianceAndAmplitudePowers':factors})
    loss=Q(1,2**20)
    minimum_rhs=loss * Q(1,2) * (2**128)**255
    assert minimum_rhs==2**32619
    assert minimum_rhs>4*64
    # A small label and comparable fixed exponent fail the source guard.
    assert loss * Q(1,2) * 4 < 4
    return {'status':'VERIFIED_SOURCE_BAND_WEIGHT_JOIN_CONDITIONAL_ORIGINAL_CONE',
            'inputPins':INPUTS,'actualLabel':actual,'scaleTransfer':ledger,
            'lemmaApplication':{'rho':str(loss),'rangeOfPolynomialDegree':['0','64'],
                                'assumptions':['ell >= ell0 >= ellMinimum >= Bnorm^512',
                                               'Bnorm >= 2^128 and Bnorm > 1/h',
                                               'h > 0, log(2) > 1/2 on the original dyadic scale'],
                                'guardProof':'rho*h*log(2)*sqrt(ell) > 2^(-21)*Bnorm^255 >= 2^32619 > 4*64',
                                'identity':'S^k * epsilon^gamma <= epsilon^(gamma-rho), rate=h*log(2)',
                                'negativePower':'For negative k, S^k<=1 since S>=1.',
                                'unadmittedSmallLabelControlRejected':True},
            'scope':{'actualLiveBackgroundSupplied':True,'actualTangentAndMassOperandsSupplied':True,
                     'sourceConeAndPulsePropagatorPremisesRetained':True,
                     'ordinaryVariationAndFixedLimitIntegralsRetained':True,
                     'allAdmittedSlowAndFrozenBoundaryNumericalConstants':False,
                     'fullProjectedForcingAndPressure':False,'finalEnergyAndConvergence':False},
            'finalJets':0,'release':'HOLD'}


if __name__=='__main__':
    parser=ArgumentParser(description=__doc__)
    for field in ('goal','artifact','cache','background','matrix','out'):
        parser.add_argument('--'+field,type=Path,required=True)
    args=parser.parse_args()
    if not __debug__:
        parser.error('Python assertions are required')
    result=verify(args)
    with args.out.open('x',encoding='utf-8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])
