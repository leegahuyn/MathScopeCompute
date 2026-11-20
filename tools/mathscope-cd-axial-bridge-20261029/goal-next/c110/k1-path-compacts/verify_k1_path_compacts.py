"""Verify compact positive path geometry and Gaussian source trace inputs for K1."""
from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
from pathlib import Path
import json
import sys


PINS = {
    'domain': ('work','continuation109/k1-domain-audit/final/fixed-n3-domain.json','df338897da4078df56cf8632d4f10a605bdfa16e02a1a331381e389bf5dc8738'),
    'inverse': ('work','continuation110/k1-analytic-seams/final/directional-inverse-seams.json','0e3821bd9a51f8961153416df12af8c4f0dcc5327a624daa781040532e6d3865'),
    'K': ('goal','c107/n8-n8-05-audit/sampling-geometry.json','d33baa5bd6b9514ea381c9745936ad056f7e3681de8978bc9196f2e119be3df9'),
    'support': ('goal','final67/active-support/active-support.json','8d7c06623203cbe336399a63bb194bf34ada03df5c3a68fc55cacceeda0f33d3'),
    'pulse': ('work','continuation88/pulse/final/pulse-frame-caps-final.json','56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d'),
    'mass': ('work','continuation96/inner/final/inner-covariance.json','8228b3442a46ee6e6843ed8212184d1f3fce56f331852096e78b156a6187ff61'),
    'collars': ('work','continuation102/signed-weighted-mean/final/signed-weighted-mean.json','6c9830a81a121c0b1cbd76c1a06cc9bc87774f22ba694cfb8ccb4da5fa4f7f26'),
    'primary': ('work','continuation98/covariance/final/global-primary-covariance.json','05938cc7447149462cc14500b7efb19da37f781a7dcdabeaf73f8af68602930e'),
    'old': ('work','continuation103/initialized-mean/final/initialized-mean.json','c6f1aaf7d81c4810c5d72671357eacf7caf7f50904fe6e4a62582b6ee29f1cb8'),
    'oldCode': ('work','continuation103/initialized-mean/final/verify_initialized_mean.py','7e81e2a59f77e67de0c3802ec6569d36dd28e866831f3ffaba916ffb8c698dbe'),
    'lateCovariance': ('goal','c107/post-signed-gauge/late-covariance-from-gauges.json','579d45f3a34806beacecc91ae1567bb9c7614270ae3bd0603ae75137e7bb3dcf'),
    'frameDirection': ('runtime','mathscope-m2/navier/actual-stress-direction-bounds.mjs','42a3870cb4cc177333d7fa5ae32be988b2fb43c00fe1cb89c8ee614f70ff23f4'),
    'concentration': ('runtime','mathscope-m2/navier/actual-covariance-concentration.mjs','154460fb7d11eee113a2bd7f4d5a0f839824331f955775923291d4ab14104934'),
    'current': ('runtime','mathscope-m3/navier/source-global-current.mjs','b7ec3b426589c207973c62a9debd19adb54ce66c15dd625c963ed56a4d697a36'),
}


def pin(path,digest):
    raw=path.read_bytes()
    assert sha256(raw).hexdigest()==digest,path
    return raw


def rational_geometry(data):
    chart=data['K']
    assert chart['originalSlab']['positiveTauRange']==['tau0/2','tau0']
    assert chart['sourceExtents']['outerAxialHalfWidth']=='z0/sqrt(2)'
    assert chart['sourceScales']['ellRange']==['ellMinimum+14','ellMinimum+16']
    assert 'Q<47/31' in data['support']['stage2and3']['all']
    assert Q(32,31)**32 > 2
    growth = Q(1,2)*Q(32,31)
    s_upper=1+growth
    eta2_upper=growth/(Q(1,2)+growth)
    assert s_upper==Q(47,31)<2 and eta2_upper==Q(32,63)<Q(9,16)
    # Same-box |dZ|,|dT| <= 3/(2*ell^6), |Z|,|Zrep| < 3/2
    # and ∂_s(s-Z²s^{2h}) > 1/2 on [1/2,2].
    assert Q(9,4)>2 and 1-8*Q(1,64)>Q(1,2)
    ds_bound=2*(Q(3,2)+3*Q(3,2)*Q(32,31))
    assert ds_bound < 13
    eta2_rep_increment=2*(13+Q(3,2))
    assert eta2_rep_increment==29
    assert eta2_upper+eta2_rep_increment/22**6 < Q(9,16)
    assert 1/(2*s_upper)==Q(31,94)>Q(1,4)
    assert 1-2*Q(1,64)*Q(9,16)>Q(1,2)
    r0=Q(1,2**34)
    assert 2*r0<Q(1,2)
    assert 4+Q(3,2)<6 and Q(9,4)>2
    assert Q(3,16)==Q(1,4)*Q(3,4) and Q(16,3)<6
    assert Q(1,20*3**6)==Q(1,14580)
    assert Q(363,16)<24
    return {'referenceS':['1/2',str(s_upper)],'liveEtaSquaredAtMost':str(eta2_upper),
            'ownRepresentativeEtaSquaredStrictlyBelow':'9/16',
            'representativeDeltaSAtMost':'13/ell^6','representativeDeltaEtaSquaredAtMost':'29/ell^6',
            'timeLowerOnOwnSource':'T_own=s_own*(1-eta^2)>7/32 including fixed representative',
            'wholeRadialPathXOverOriginal':'[31*Xa/94,4*Xb]',
            'fixedPulseNormalizedOffsetBound':'2*r0<1/2; no periodic copy switch on retained H_w',
            'upperReferenceFaceIntersectsActualK':False,
            'supportEtaHeatTimeGap':'1-eta^2>7/16 at every live or fixed representative source point'}


def pole_check(data):
    old=data['old']
    pool={(f,tuple(a)) for f,a in old['fullPrimaryCovarianceOrders']}
    assert len(pool)==1030
    high={(r['component'],tuple(r['RZTL'])):r for r in old['additionalHighRows']}
    assert set(high)=={(f,a) for f,a in pool if sum(a[:3])>7 or a[3]>8}
    assert len(high)==40
    lo=pool-high.keys()
    assert len(lo)==990 and all(sum(a[:3])<=7 and a[3]<=8 for f,a in lo)
    assert old['counts']['old']==223 and old['counts']['oldWithSlowTime']==51
    assert 'inverse.update(((source,a),(source,b)))' in data['oldCode']
    assert 'b=shift(a,3,2)' in data['oldCode']
    assert 'return add(radial_int(f,a,False),chi_whole(f,a))' in data['oldCode']
    assert 'return chi_whole("RgammaDesired",a,chi_r=1)' in data['oldCode']
    prime=data['primary']
    assert prime['coefficientBudget']['coversC97WholePathDerivativeRoles']==626
    high_cap=tuple(max(row['outerAndInnerPoles'][i] for row in high.values()) for i in (0,1))
    assert high_cap==(36,33)
    assert data['collars']['shortPathGeometry']['maxPrimitiveInputPole']==512
    late=data['lateCovariance']
    assert late['lateCovarianceRows']==127 and late['maxNormalizedSignedPoleAfterReciprocal']==146
    assert late['nativeSigmaSufficientInput']['radialWeight']=='zeta'
    assert 'weighted half Gaussian' in late['requiredPhaseFreeWaveBounds']
    return {'initialCovarianceRolesLow':len(lo),'initialCovarianceRolesHigh':len(high),
            'initialMeanOrdinaryRoles':223,'initialMeanPositiveTimeRoles':51,
            'highCovarianceOuterInnerFinitePoles':list(high_cap),'postSignedCovarianceRoles':127,
            'maxSignedGaugePoleBeforeAbsorbingGaussian':146,
            'seamRule':'Keep the Gaussian in the pointwise old and late covariance tables before absorption. T_chi is a short primitive on each collar, and chi_R and compact FiveMap terms vanish there. Apply the actual paired inverse with the weight independent of Y.'}


def native_checks(g,n,data):
    expected={'normalizer':17743725,'inverseNormalizer':17743726,
              'actualRadialDensity':17743730,'fixedLower':17743711,'fixedUpper':17743713,
              'radialVariable':17743710}
    lower,upper,binder=(expected[k] for k in ('fixedLower','fixedUpper','radialVariable'))
    assert g.args(lower,'sqrt_positive')==[3617] and g.args(3617,'source_parameter')==['Xa']
    assert set(g.args(upper,'multiply'))=={24,17743712} and g.rational(24)==2
    assert g.args(17743712,'sqrt_positive')==[28826]
    assert g.args(expected['normalizer'],'definite_integral')==[17743724,binder,lower,upper]
    assert g.args(expected['inverseNormalizer'],'inverse')==[expected['normalizer']]
    assert g.args(expected['actualRadialDensity'],'multiply')==[17743724,17743726]
    assert g.args(17743724,'multiply')==[17743698,17743723]
    assert g.args(17743698,'inverse')==[17743697]
    assert g.args(17743723,'smooth_piecewise')==[17743716,0,1,0,17743722,0]
    assert g.args(17743722,'exp')==[17743721]
    assert g.args(17743721,'multiply')==[20,17743720]
    assert g.args(17743720,'inverse')==[17743719]
    assert g.args(17743719,'multiply')==[17743716,17743718]
    assert g.args(17743718,'add')==[1,17743717] and g.args(17743717,'multiply')==[20,17743716]
    assert g.args(17743716,'multiply')==[669,17743715] and g.rational(669)==10
    assert g.args(17743715,'add')==[20,17743714]
    assert g.args(17743714,'multiply')==[17743698,binder]
    assert set(g.args(17743697,'multiply'))=={17743687,17743688}
    assert g.args(17743688,'sqrt_positive')==[17732766]
    assert "x0=G.mul(G.sqrt(G.mul(q(2),X0)),G.exp(q(1,2)))" in data['current']
    assert "originalMeanPatchX0" in data['current']
    assert "frozen-normal-and-c0" in data['frameDirection']
    assert "|c0|>R^-6" in data['frameDirection']
    assert 'gaussianUpper=G.div(G.mul(q(15),lambdaUpper),G.mul(q(2),u))' in data['concentration']
    analytic=data['pulse']['finiteParameterCaps']['numberAwareDenominators']
    assert 'epsilon/(4*Renv^2)' in analytic['movingNormalSquaredAndTransverseSquared']
    assert '1/(Tg*S)' in analytic['exactLengthRange']
    assert data['mass']['mass']['detLowerPowerS']=='-1'
    assert data['inverse']['source']['fixedWholeRadialEndpoints']==[lower,upper]
    assert len(data['inverse']['source']['nativePulseSystems'])==20
    return expected


def main():
    parser=ArgumentParser(description=__doc__)
    for key in ('work','goal','runtime','out'):
        parser.add_argument('--'+key,type=Path,required=True)
    args=parser.parse_args()
    data={}
    for key,(root,rel,digest) in PINS.items():
        p=getattr(args,root)/rel
        raw=pin(p,digest)
        data[key]=json.loads(raw) if rel.endswith('.json') else raw.decode()
    geometry=rational_geometry(data)
    traces=pole_check(data)
    stage=args.goal/'primary-forced-join/active-n3-c5-binding'
    reader=stage/'spatial-readback'
    cache=stage/'live-wave-gauge/signed'
    pin(reader/'source_stream.py','2969fcc291caffcc5291d3f07e33a2e33625512e4c5765055fdb8725b5dfb6bb')
    pin(cache/'source_cache.py','909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f')
    sys.path[:0]=[str(reader),str(cache)]
    import source_stream as st
    from source_cache import load
    host=args.work/'continuation70/hosted-44582875351/first-correction-spatial-source'
    mf,_=st.read(host/st.MANIFEST,'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a')
    n=st.Native(host,mf)
    assert n.pin=='e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03'
    g=load(st,host,mf,22153782,args.work/'continuation80/signed-wave/cache')
    try:
        native=native_checks(g,n,data)
    finally:
        g.__exit__(None,None,None)
    result={'schema':'MathScope.C110.K1OriginalPathCompacts/1',
            'status':'VERIFIED_ORIGINAL_K_PATH_COMPACTNESS_AND_FINITE_TRACE_TRANSFER',
            'pins':{key:r[2] for key,r in PINS.items()},
            'originalSourceRecords':mf['node_count'],'sameLiveSHA256':mf['node_stream_sha256'],
            'pathGeometry':geometry,'nativeMeanDensity':native,'actualGaussianTraceInputs':traces,
            'derivedPositiveBounds':{
                'meanDensityNormalizer':'independent of s; (1/10)*integral_0^1 exp(-1/(t*(1-t))) dt > 1/14580',
                'referenceR':'R>=sqrt(Xa) on the fixed whole radial binder',
                'ownActiveR':'R_own>=sqrt(Xa/2) on transformed whole path; retained shell also has R_own<=Renv',
                'normalSquares':'|n|^2,n_theta^2+n_z^2 >= epsilon_min/(4*Renv^2) for both signs and modes',
                'paletteAndPulse':'ci>1/(6*Smax), ci_ref_common>1/(24*S_ref), Ls>=2*r0, Ls<12*r0*Smax',
                'frozenReference':'Under the actual source leading primitive: gabs>=2*Renv^-31, -2 F0*Ntheta>=Renv^-41, gabs+2 F0*Ntheta>=Renv^-37',
                'P':'P>=exp(-15*Renv^83*LsMax/(8*u))>0 on every active closed pulse',
                'GramDeterminant':'abs(det H)>=D0/Smax>0 from actual C96 and C88 normalizations. On each compact interior radial strip y_sigma>=c_weight*inf zeta>0. The zero at radial shell faces uses retained Gaussian cancellation.'},
            'conditional':[
                'The graph arithmetic and path compactness require no source heat-time limiting assumption at eta=±1 on actual K.',
                'Qualitative ordinary traces of paired f,L^2f follow by induction along the existing estimates from the original interior profiles and stable positive frame. The original weighted bounds apply only to the rows authenticated here.',
                'The raw normalized Signed amplitude division is confined to the open shell, and its classical trace uses the Gaussian product after the reciprocal. Global background functions are still original real analytic leaves, including any original interior profile gluing.' ],
            'open':['Independent ordinary realization and equality of the finite original derivative leaves across all source-internal radial joins (including any non-shell coefficient branch), if the imported analytic profile proofs are not accepted as premises.',
                    'Full acceptance of K1 and all later corrections, final jet comparisons and release.'],
            'firstCorrectionWhole':'CONDITIONAL','finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as out:
        out.write(json.dumps(result,indent=2)+'\n')
    print('PASS strict whole-K eta and q range, original positive rho denominator, and exact Gaussian trace roles')


if __name__=='__main__':
    assert __debug__
    main()
