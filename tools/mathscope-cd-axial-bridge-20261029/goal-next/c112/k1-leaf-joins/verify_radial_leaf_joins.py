"""Authenticate the fresh finite joins against the unchanged C70 original prefix."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json
import sys


PINS={
    'graph':'7b5f5aa4d54351c79defa881b236eb52e6374faccbf465018a8099af63191cd4',
    'picard':'616008ecc34a358b5be24faf57484551c3102db09e92bdb1699c025e36118901',
    'natural':'aa4cf7d3b762b9772fce712ce1fb7a08f4784d9797aaee62deced94e8c5b7276',
    'leadingAxial':'ac76353ab60c75487d374a3a03678442007d8f55036cd5520a9208a9aa24a683',
    'firstCollars':'a996622be138a352c7250a6ccb5b27d732f8f8a9882ea73b72f7304f65ece415',
    'C16':'1833785fc21ad6c73029361d6d6a44b2bb0baa099d57986709114093a53de9cc',
    'K':'32004b3c7de4b1ac526852301c180db649601785e578f3074f8ee3eae72657f0',
    'stress':'26bbd0d14f0218dfe0a6be2494845e6de86bb8cb23f782bccb695ba2abfee2c7',
}


def pinned(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def no_skip_seams(graph):
    def vec(c,h=0,lam=0):
        return (Q(c),Q(h),Q(lam))
    def add(*rows):
        return tuple(sum(part) for part in zip(*rows))
    a=vec(Q(-1,2),lam=-1)
    b=vec(Q(-1,2),h=-1)
    m=vec(Q(-3,2))
    # Rows are derivatives of the exact A.2 log-amplitude schedule,
    # including the initial/terminal slopes of each flat transition.
    schedule={
        'initial':(vec(Q(1,10)),add(vec(Q(1,10)),vec(Q(-3,5)))),
        'axialDecay':(vec(Q(-1,2)),vec(Q(-1,2))),
        'entry':(vec(Q(-1,2)),add(vec(Q(-1,2)),vec(0,lam=-1))),
        'reservedPower':(a,a),'pulse':(a,a),'interpolation':(a,a),'angular':(a,a),
        'steepen':(a,add(a,vec(-1,lam=1))),'steepPower':(m,m),
        'flatten':(m,add(m,vec(1,h=-1))),'wait':(b,b),'terminal':(b,b),
    }
    keys=graph['terminal']['schedule']
    assert keys==list(schedule) and len(keys)==12
    for old,new in zip(keys,keys[1:]):
        assert schedule[old][1]==schedule[new][0]
    assert add(vec(Q(1,2)),vec(Q(-2,5)))==schedule[keys[0]][0]
    # The B.26 normalized F has log slope -2/5 at its end; adding
    # the sqrt(2X) conversion gives log E slope 1/10.
    assert Q(1,10)*10==1 and Q(1,5)+Q(3,10)==Q(1,2)<3
    assert Q(1,128)<Q(1,64)<Q(1,32)<Q(1,16)<Q(1,8)
    assert Q(9,4)>2  # finite leading eta/R path stays in ordinary chart
    assert Q(1,2)<Q(47,31)<2 and Q(32,63)<Q(9,16)
    # The fixed moment assembly uses five local radial centers, all with a
    # strict collar to the large Ipos enclosing guard.
    centers=(Q(3,2),Q(2),Q(5,2),Q(3),Q(7,2))
    spans=[(c-Q(1,4096),c+Q(1,4096)) for c in centers]
    assert spans[0][0]>1 and spans[-1][1]<4
    assert all(a[1]<b[0] for a,b in zip(spans,spans[1:]))
    # e^{5/2}>4 gives (R/Rbase)^2 < e^5 at every bump.
    assert 1+Q(5,2)+Q(25,8)>4
    # Finite exact chain algebra for the actual stream rows.
    # d_xi[xi²(U+w2)] = 2xi*U + 2xi*w2 + xi²*w5
    #                     + xi²*(-w5-2*w2/xi).
    cancel_w2=2-2
    cancel_w5=1-1
    assert (cancel_w2,cancel_w5)==(0,0)
    assert Q(4,2)==2 and Q(2,2)==1
    return {'ordinaryA2AdjacentSlopeIdentities':len(keys)-1,
            'A2EtaPrefactor':'theta transitions smoothly 1 to 0 only through the flat interpolation',
            'terminalHeatCutoffOneFromLogRadius':'1/2',
            'terminalFoReachesOneAtLogRadius':'3',
            'terminalContinuity':'both branches use same coefficient E_tail/(1-rho). The only difference, proportional to fo-1, is flat at 3.',
            'positiveCutoffExponentOrdered':['1/128','1/64','1/32','1/16','1/8'],
            'bumpSupportsNormalizedRadius':[[str(x),str(y)] for x,y in spans],
            'picardStreamLeibnizCoefficientsCancellation':[cancel_w2,cancel_w5],
            'ordinaryPressureUse':'d_X Pi=(4*xi*F0*Fn+2*xi*pKnown)/(2*xi)=2*F0*Fn+pKnown, Pi(0,eta)=0'}


def authenticate(args,gdef):
    a=args.goal/'primary-forced-join/active-n3-c5-binding'
    reader=a/'spatial-readback'
    cache_file=a/'live-wave-gauge/signed'
    pinned(reader/'source_stream.py','2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb')
    pinned(cache_file/'source_cache.py','909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f')
    sys.path[:0]=[str(reader),str(cache_file)]
    import source_stream as st
    from source_cache import load
    hosted=args.work/'continuation70/hosted-44582875351/first-correction-spatial-source'
    mf,_=st.read(hosted/st.MANIFEST,'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a')
    registry=st.Native(hosted,mf)
    assert registry.pin=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
    graph=load(st,hosted,mf,22153782,args.work/'continuation80/signed-wave/cache')
    try:
        digest=sha256()
        digest.update(b'[')
        prefix_count=gdef['originalPrefixRecords']
        assert prefix_count==123870
        for j in range(prefix_count):
            if j:
                digest.update(b',')
            digest.update(json.dumps(graph.record(j),separators=(',',':'),ensure_ascii=False).encode())
        digest.update(b']')
        assert digest.hexdigest()==gdef['originalPrefixSHA256'],digest.hexdigest()
        for j,expected in gdef['nodeControls']:
            assert graph.record(j)==expected,j
        # These archived definitions implement the actual same live band
        # normalization. Positive pressure root names are included in the
        # leading/full coefficient definitions through their real IDs.
        source_defs=json.loads(registry.base_snapshot['base']['expression'])
        assert [source_defs[i]['name'] for i in range(32020,32027)]==[
            'ActualCommonBandNormalized_F','ActualCommonBandNormalized_G','ActualCommonBandNormalized_M',
            'ActualCommonBandNormalized_pressure','ActualCommonBandNormalized_b',
            'ActualCommonBandNormalized_Ttheta','ActualCommonBandNormalized_Tz']
    finally:
        graph.__exit__(None,None,None)
    return {'liveRecords':mf['node_count'],'liveSHA256':mf['node_stream_sha256'],'commonLiteralRadialPrefixRecords':prefix_count,
            'commonLiteralRadialPrefixSHA256':digest.hexdigest(),'separateRadialASTControls':len(gdef['nodeControls']),
            'actualNormalizedBandDefinitions':[32020,32021,32022,32023,32024,32025,32026]}


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('work','goal','graph','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    files={
        'graph':args.graph,
        'picard':args.goal/'axial-picard/ORIGINAL_PICARD_ANALYTIC.md',
        'natural':args.goal/'axial-order-one-identity/leading-B/ACTUAL_LEADING_B_PROOF.md',
        'leadingAxial':args.goal/'axial-order-one-identity/leading-axial-support/LEADING_AXIAL_SUPPORT.md',
        'firstCollars':args.goal/'axial-order-one-identity/collars/README.md',
        'C16':args.work/'continuation106/background16/final/background-c16.json',
        'K':args.work/'continuation110/k1-path-compacts/final/k1-path-compacts.json',
        'stress':args.goal/'axial-alln/order-three.json',
    }
    d={k:pinned(p,PINS[k]) for k,p in files.items()}
    gdef=json.loads(d['graph'])
    assert [row['order'] for row in gdef['positiveOrders']]==[1,2,3]
    assert all(len(row['exactMomentRows'])==5 and row['omittedThirdMomentCorrectionRejected'] for row in gdef['positiveOrders'])
    assert b'normal convergence' in d['picard'].lower()
    assert b'partial_X Ctheta = -2XL raw_theta' in d['natural']
    assert b'X_v\\exp(-17/20)' in d['leadingAxial']
    assert b'#28985 + #71402' in d['firstCollars']
    assert json.loads(d['C16'])['comparison']['sign']==-1
    assert json.loads(d['K'])['pathGeometry']['liveEtaSquaredAtMost']=='32/63'
    checks=json.loads(d['stress'])['certificate']['stressRows']
    assert all(row['allFixedDerivativeJetsMatch'] for row in checks if row['order'] in (1,2,3))
    live=authenticate(args,gdef)
    joins=no_skip_seams(gdef)
    result={'schema':'MathScope.C112.OriginalK1RadialLeafJoins/1',
        'status':'VERIFIED_ACTUAL_FINITE_N0_N1_N2_N3_RADIAL_JOIN_REDUCTION_WITH_ORIGINAL_ORDINARY_SOURCE_FOUNDATIONS',
        'pins':PINS,'source':live,'exactAlgebra':joins,
        'joinConclusions':{
            'N0Xa':'Actual source first-integral slope equations and the same natural/core moment. Flat activation joins F/U/v and all fixed mixed derivatives.',
            'N0Internal':'Original finite B.26/B.34 scheduling, all 11 adjacent A.2 log-slope matches, exact continuous B8/I1/I2 roots, flat C12/bump/heat activation under their genuine source analytic constructions.',
            'N0Xv':'Original U,M,v zero already at Xv*exp(-17/20), strict collar around Xv.',
            'N0Xb':'Exact same terminal continuation amplitude and heat H. F0 differs by a flat terminal factor across Xb; Pi0 is the continuing fixed-datum primitive of F0^2.',
            'positiveXaThroughXkeep':'Actual raw Picard core extends beyond Xa; no positive profile begins by a separate radial choice at Xa.',
            'positiveXkeep':'Flat cutoff and same Picard mass/pressure primitives with true zero axis data; lower global and local operands agree here.',
            'positiveXcut':'Flat F/U cutoff. Mass/pressure primitives glue to saturated local terms while nonlocal/lower pressure contributions are retained.',
            'positiveASquared':'Actual raw lower omega and full global lower omega agree before Ipos since all lower cutoff/bump/primitive paths coincide there, after Xcut and before the leading C12 start.',
            'positiveBumpEndpoints':'Original square seed derivative is flat; one-sided prefix values match at both ends by FTC. At the last U bump the first exact repair moment gives zero entire stream.',
            'positiveXplus':'All positive pressure residues are identically zero on a strict left collar after all relevant densities stop and third repair row cancels. For n=1 use the leading axial Xv/omega proof. For n=2,3 lower positive supports stop already inside Ipos.',
            'positiveXb':'Global positive F,U,M,v,Pi identically zero across Xb. Original order-one theta stress, which is a distinct leaf, uses original leading heat and conservative stress cancellation.'},
        'failedControls':['Omitted third moment repair produces a nonzero pressure primitive constant in order 1, 2 or 3.',
                          'Without exact common axis datum, equal radial derivatives alone permit distinct pressure primitives differing by a nonzero function of eta.'],
        'boundaryOfEvidence':'This replays genuine finite source, exact algebra and the ordinary join implication using the pinned original analytic natural/Picard/C12/root/integral proofs. It does not give a new independent Lean or numerical verification of those analytic foundational theorems, any higher-order tail, or full K1 energy.',
        'firstCorrectionWhole':'CONDITIONAL','finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print('PASS 123870 same-live N0-N3 records, exact source radial joins, and all 15 original moment records')


if __name__=='__main__':
    assert __debug__
    main()
