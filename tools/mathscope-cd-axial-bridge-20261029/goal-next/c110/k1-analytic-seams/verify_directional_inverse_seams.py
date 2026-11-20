"""Bind the first-correction native inverse/pulse and replay the directional Fourier tail."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from itertools import product
from pathlib import Path
import json
import sys


FILES = {
    'domain': ('work','continuation109/k1-domain-audit/final/fixed-n3-domain.json','df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738'),
    'early': ('work','continuation97/middle-covariance/premean/final/premean-whole-path.json','1eb1c9d1dbf1fcff611140309a663fc74d106ee05e27f3ac7d0d9e13e36893d5'),
    'late': ('goal','c105/late-grade/late-grade.json','d631c9776b543c2033e2c161d8deca2b5e59da886b87989486eb47c8af590bef'),

    'lateInventory': ('work','continuation103/late-mean/final/late-mean-inventory.json','1e6bea833b88a440caefeccb59ad58466e06b8f9ae95d0d699e7f44172c09e5b'),
    'oldMean': ('work','continuation103/initialized-mean/final/initialized-mean.json','c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8'),
    'compactOld': ('work','continuation102/mode-one-attachment/final/mode-one-attachment.json','84e3cb8cf77b09e2d91a42e85e8f8d8874c778907bc2341b392714bb7d7af46e'),
    'lateCode': ('goal','c105/late-grade/verify_late_grade.py','b7df296fa485ae391e0d53762e58c6a9eb469f53842083acb5189e220d81c4cc'),
    'transfer': ('goal','c107/post-signed-gauge/late-covariance-from-gauges.json','579d45f3a34806beacecc91ae1567bb9c7614270ae3bd0603ae75137e7bb3dcf'),
    'signedCutoff': ('goal','c107/post-signed-gauge/signed-gauge-cutoffs.json','449ced00be741aa9ed095a490a993ad728564776e62393ba75af49fbacfbca2a'),
    'covariance': ('work','continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
    'sigma': ('work','continuation108/early-sigma-c6/final/early-sigma-c6.json','d4f747ebfc8dcb89066c5d69d2063dc7a2227bda8002ee8a87ee29058004ab5f'),
    'join': ('work','continuation108/first-k1-energy/k1-donor-join.json','8684f3f27a56f46d4b70feaaf738104c091b2ca35f31ba014c7a0c55005aee59'),
    'forced': ('work','continuation82/forced-seams/forced-seams-final.json','888b8575fb5f02c9fac90e37cc757261b2bb7eaf8fea62d1a6ca6b4c544532b1'),
    'pressureCode': ('runtime','source-pressure.mjs','fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f'),
    'forcedCode': ('runtime','source-forced-pulse.mjs','866d8ec69758b9f036b73e6e8f04fb88cfb248e7a01d32e7b048df535c1020f9'),
    'fourierCode': ('runtime','source-auxiliary-fourier.mjs','59e1d8f7fd72b880de030a2a56bee9be65b5e02203cffa73157ce8dae420ad2e'),
}


def pin(path, digest):
    data = path.read_bytes()
    assert sha256(data).hexdigest() == digest, path
    return data


def factor_sign(a,b):
    """Exact sign of a+b*sqrt(2), including zero and opposite signs."""
    if a==0 or b==0 or (a>0)==(b>0):
        return int(a+b>0)-int(a+b<0)
    squared = a*a-2*b*b
    return (int(squared>0)-int(squared<0)) * (1 if a>0 else -1)


def add(a,b):
    return a[0]+b[0],a[1]+b[1]


def mul(a,b):
    return a[0]*b[0]+2*a[1]*b[1],a[0]*b[1]+a[1]*b[0]


def less(a,b):
    return factor_sign(a[0]-b[0],a[1]-b[1])<0


def abs_pair(a):
    return a if factor_sign(*a)>=0 else (-a[0],-a[1])


def directions_and_tail():
    # N=(sqrt(2)-1,1), L=(1,1-sqrt(2)).
    alpha=(-1,1)
    assert add(mul(alpha,(1,0)),mul((1,0),(1,-1)))==(0,0)
    scale=add((1,0),mul(alpha,alpha))
    assert scale==(4,-2) and less((1,0),scale)
    assert less((2,1),(4,0)) and less((1,0),(0,1))
    assert 4*sum((Q((-1)**j,2*j+1) for j in range(8)),Q())>3
    # For M<n<=2M, large |nu| yields factor <=16/M^4 and
    # spacing of lambda on the square yields <=16*4^2*(2M)^2.
    strong = 16*16*4**2*2**2
    assert strong==16384
    # In the other sector lambda^2>=3n^2/4. There are <=5M
    # fixed k1 rows, each with at most one k0 per unit nu strip.
    strip = 2+2*(1+Q(1,3))
    assert strip<5
    weak = 5*5*Q(4,3)
    assert weak<34
    strong_tail=Q(strong)*Q(4,3)
    weak_tail=34*2
    assert strong_tail==Q(65536,3) and weak_tail==68
    assert strong_tail+weak_tail < 36*25**2

    # Independent finite controls with exact quadratic-field comparisons.
    checked = 0
    for r,z in product(range(-32,33),repeat=2):
        if r==z==0:
            continue
        n=max(abs(r),abs(z))
        lam=(z-r,r)
        nu=(r+z,-z)
        norm=(z-r)**2-2*r**2
        assert norm!=0 and less((Q(1,4*n),0),abs_pair(lam))
        assert add(mul(lam,lam),mul(nu,nu))==mul(scale,(r*r+z*z,0))
        if less(abs_pair(nu),(Q(n,2),0)):
            assert less((Q(3*n*n,4),0),mul(lam,lam))
        checked+=1
    assert checked==4224
    return {'symbolL':'k0+(1-sqrt(2))*k1','symbolN':'(sqrt(2)-1)*k0+k1',
            'exactFiniteModeControls':checked,'omittedKernelSquareSumBound':'65536/(3*K^2)+68/K',
            'uniformPointwiseFourierTail':'<25*K^(-1/2)*(||f||_2+||L^2 f||_2/36)',
            'cutoff':'max(abs(k0),abs(k1))>K>=1'}


def demand_checks(data):
    assert data['domain']['fixedSlab']['admittedPhysicalQOverQBig']==['1/64','1/16']
    assert data['domain']['actualRows']['nativeRoot']==17732766
    assert data['early']['exactDerivativeRoles']['inverseForcing']==173
    assert data['early']['maxOriginalCovarianceLOrder']==8
    late=data['late']
    assert late['roleCounts']['postSignedW']==127 and late['roleCounts']['shiftedPrimitive']==90
    roles={(c,tuple(a)) for c,a in late['roleInventory']['centeredNonfast']}
    assert len(roles)==25 and all(a[2]==0 for _,a in roles)
    plus_two=lambda a: (*a[:3],a[3]+2)
    doubled={(c,a) for c,a in roles if (c,plus_two(a)) in roles}
    assert len(doubled)==13, sorted(doubled)
    assert 'nonfast(f,shift(a,3,2))' in data['lateCode']
    assert 'Q(85,216)' in data['lateCode']
    transfer=data['transfer']
    assert transfer['lateCovarianceRows']==127 and transfer['gaugeDirections']==79
    assert transfer['nativeSigmaSufficientInput']['radialWeight']=='zeta'
    assert transfer['maxNormalizedSignedPoleAfterReciprocal']==146
    assert Q(transfer['conditionalCovarianceGrade'])==Q(45999,50000)
    assert data['sigma']['commonBound']['retainedGaussian']=='zeta'
    assert data['join']['conditionalResult']['firstCorrectionRelativeEnergy']=='<2^-28'
    return {'earlyInverseForcingRoles':173,'lateNonfastForcingRoles':len(roles),
            'pairedLateDerivativeRows':[[c,list(a),list(plus_two(a))] for c,a in sorted(doubled)],
            'lateCovarianceInputRows':127,'lateShiftedPrimitiveRows':90,
            'lateNormConstantUnchanged':'Use existing 85/6 and 85/216 bound for the quantitative donor estimate. New 25 K^-1/2 bound is used for convergence.'}


def late_envelope(data):
    # Capture the return values of the pinned absolute calculation. This
    # calls its ordinary calculus unchanged and leaves its input files alone.
    program_name = 'c105_late_grade_readonly'
    module = {'__name__':program_name}
    exec(compile(data['lateCode'],program_name,'exec'),module)
    actual = {}

    def collect(frame,event,value):
        if (event=='return' and value is not None
                and frame.f_code.co_filename==program_name
                and frame.f_code.co_name=='nonfast'):
            key=(frame.f_locals['f'],frame.f_locals['a'])
            assert key not in actual or actual[key]==value
            actual[key]=value

    previous=sys.getprofile()
    try:
        sys.setprofile(collect)
        _,roles,_=module['calculus']({'late':data['lateInventory'],
                                      'old':data['oldMean'],'compact':data['compactOld']})
    finally:
        sys.setprofile(previous)
    assert set(actual)==roles['centeredNonfast']
    assert set(actual)=={(component,tuple(a)) for component,a in data['late']['roleInventory']['centeredNonfast']}
    rows = [{"component":component,"RZTL":a,**module['encode'](norm)}
            for (component,a),norm in sorted(actual.items())]
    max_charge=max(row["totalCoefficientChargeInHOver2Pow128"] for row in rows)
    max_band=max(Q(row["band"]) for row in rows)
    min_grade=min(Q(row["epsilon"]) for row in rows)
    assert max_charge < 2**18 and max_band<=59 and min_grade>=Q(89996,100000)
    return {"rows":rows,"minimumEpsilonGrade":str(min_grade),
            "maximumBand":str(max_band),"maximumCoefficientChargeInHOver2Pow128":max_charge,
            "scope":"Actual nonfast rows after the C103 fast-time identities, using the conditional same-body C105 W and initialized-mean inputs. The raw inverse also contains the separately treated old centered fast contributions."}


def native_checks(graph,native,data):
    assert graph.args(3622,'sqrt_positive')==[24] and graph.rational(24)==2
    assert graph.args(17733068,'add')==[1,17733067]
    assert set(graph.args(17733067,'multiply'))=={20,3622}
    assert graph.rational(1)==1 and graph.rational(20)==-1
    assert graph.args(17743711,'sqrt_positive')==[3617]
    assert graph.args(3617,'source_parameter')==['Xa']
    assert set(graph.args(17743713,'multiply'))=={24,17743712}
    assert graph.args(17743712,'sqrt_positive')==[28826]
    Y=[17745430,17745431]
    slow=[17732748,17732749,17732750]
    ell=17732737
    early=json.loads(native.base_snapshot['inverseDefinitions'])
    late=native.inverses
    names=['GlobalActualTemporal_theta','GlobalActualTemporal_z',
           'ActualAfterSigned_theta_OriginalFastTime','ActualAfterSigned_z_OriginalFastTime']
    expected=[17754253,17754268,22032006,22032008]
    assert [d['name'] for d in [*early,*late]]==names
    for body,d in zip(expected,[*early,*late],strict=True):
        assert d['operator']=='(sqrt(2)-1)*partial_y0+partial_y1'
        assert d['Y']==Y and d['body']==body
        assert d['parameters']==[*slow,ell,*Y] and d['directions']==[*slow,*Y]
        assert d['zeroMode']=='The exact normalized Haar mean is projected out.'
        assert not d['finiteSumDeclaredEqualToLimit']
        assert graph.record(body)['op']=='add'
    systems=[]
    for case in data['forced']['cases']:
        system=native.pulses[case['nativeSystem']]
        assert system['left']==0
        assert system['initial']==[{'imaginary':0,'real':0}]*3
        assert system['directions']==[*slow,*Y]
        assert not system['finitePartialSumIsExactSolution']
        assert system['variable']==case['w']
        assert all(graph.record(i)['op']=='add' for i in case['H_w'])
        systems.append(system['id'])
    assert len(set(systems))==20
    code=data['pressureCode']
    assert 'shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)' in code
    assert 'shiftedY=Y.map((y,j)=>G.add(y,G.mul(shift,vr[j])))' in code
    assert 'simultaneousSubstitute(body,[R,...Y],[r,...shiftedY])' in code
    assert 'fixedPhysicalZT:true' in code
    assert 'left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)' in code
    assert 'originalForcedPulsePath' in data['forcedCode']
    assert 'function auxiliaryInverseTail' in data['fourierCode']
    return {'originalInitialCenteredSources':expected[:2],'originalLateCenteredSources':expected[2:],
            'nativeInverseNames':names,'nativePulseSystems':sorted(systems),
            'commonTorusArguments':Y,'radialShiftDirectionSecondComponent':17733068,
            'radialDerivativeOfShift':17745446,'fixedWholeRadialEndpoints':[17743711,17743713]}


def main():
    parser=ArgumentParser(description=__doc__)
    for name in ('work','goal','runtime','out'):
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    data={}
    for name,(base,rel,digest) in FILES.items():
        raw=pin(getattr(args,base)/rel,digest)
        data[name]=json.loads(raw) if rel.endswith('.json') else raw.decode()
    a=args.goal/'primary-forced-join/active-n3-c5-binding'
    reader=a/'spatial-readback'
    cache_file=a/'live-wave-gauge/signed'
    pin(reader/'source_stream.py','2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb')
    pin(cache_file/'source_cache.py','909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f')
    sys.path[:0]=[str(reader),str(cache_file)]
    import source_stream as st
    from source_cache import load
    hosted=args.work/'continuation70/hosted-44582875351/first-correction-spatial-source'
    mf,_=st.read(hosted/st.MANIFEST,'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a')
    n=st.Native(hosted,mf)
    assert n.pin=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
    g=load(st,hosted,mf,22153782,args.work/'continuation80/signed-wave/cache')
    try:
        source=native_checks(g,n,data)
    finally:
        g.__exit__(None,None,None)
    demands=demand_checks(data)
    tail=directions_and_tail()
    demands['lateNonfastCoefficientEnvelope']=late_envelope(data)
    result={'schema':'MathScope.C110.OriginalFirstCorrectionDirectionalInverseSeams/1',
            'status':'VERIFIED_ACTUAL_NATIVE_BINDINGS_AND_DIRECTIONAL_LIMIT_TRANSFER',
            'pins':{name:row[2] for name,row in FILES.items()},
            'stream':{'nodes':mf['node_count'],'sha256':mf['node_stream_sha256'],'registrySHA256':n.pin},
            'source':source,'tail':tail,'actualDemand':demands,
            'spatialAndSpaceTimeEndpointMeasure':{
                'formula':'z^2=(2*tau0-tau)/(2*tau0)^(2h) at q=2*tau0',
                'fixedPhysicalTime':'At most two planes in R^3 for every tau, including tau=2*tau0.',
                'fullK':'The endpoint is spatially null at every time and spacetime null by Tonelli. Nonnegative slice energies, their time supremum, and spacetime dissipation are unchanged by deleting the endpoint face.',
                'pointwiseDerivativeTrace':'Separate. Use one-sided continuous source/jet extension if available. No equality with an unverified extension across q=2*tau0.'},
            'conditional':[
                'For each already required native row, the continuous Fourier limit and directional derivatives follow from uniform bounds and continuity in the actual f,L^2f graph norm. The sharper existing norm coefficients remain in the energy donor.',
                'Torus shift equivariance holds by the exact Fourier multiplier. Bounded continuous source jets and envelopes on the fixed complete paths justify Fubini, radial Leibniz and uniform parameterized Picard convergence.',
                'Finite polynomial poles times the already retained Gaussian give zero traces for those late/early covariance rows actually bounded before absorbing their Gaussian. Every other source leaf used in a trace still needs its same-body limit.',
                'C108 conditional K1 energy retains positive denominator, original finite ordinary boundary traces and source input assumptions that are not settled by these transfer arguments.'],
            'firstCorrectionWhole':'CONDITIONAL','finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as out:
        out.write(json.dumps(result,indent=2)+'\n')
    print('PASS original early/late inverse roots, 20 pulse systems, paired anisotropic tail and null energy endpoint')


if __name__=='__main__':
    assert __debug__
    main()
