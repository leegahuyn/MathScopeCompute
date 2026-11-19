"""Compose the source spatial cutoff with the first correction's exact angular Gram."""

from argparse import ArgumentParser
from fractions import Fraction as Q
from hashlib import sha256
import json
from pathlib import Path
import sys


GAUGE = 'primary-forced-join/active-n3-c5-binding'
ENERGY = 'final67/energy-1013-sharp/correction-budget/spatial-gauge/active-n3-angular-gram'
SPATIAL = GAUGE+'/hosted-44582875351/spatial'
PINS = {
    'ingress':(SPATIAL+'/first-correction-spatial-ingress.json','20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f'),
    'spatial':(SPATIAL+'/spatial-cutoff-same-live.json','2a1fc82ce005e5fced9e28ad9f8e1c2fcffa4ee5e6dc8f7768c41a0b66f35a89'),
    'gauge':(GAUGE+'/live-wave-gauge/admitted-uncut-gauge.json','e02d4c200e6c0950a3fa65fbee063b9f838ecbb34613edbfea536b09f6024263'),
    'gram':(ENERGY+'/first-correction-gram.json','9dd999693a6d3f142c0709f67412ab3bbd716eebee69f3642bd680bb12f5f448'),
    'tail':('final67/cut-correction-tail.json','7f1b591721b768ea0c73cfed346d102d7a92752ab9f2c21487fed33b180ef18b'),
    'scale':('final67/first-scale-selector.json','0f2ef1dff821d7d936a9c254a5e846f6557445e2d3ccf97f3201915a6a949298'),
    'geometry':('whole-k-core-force/annular-slow-force-energy.json','c4f86049b4f20a63443bd610b76313926717576abca9288ae1f9277b3ae4aa37'),
    'polynomial':('final67/spatial-cutoff-24/verify_spatial_cutoff_caps.py','938fac2a33c130128749ca1f8eddd7f2eaff460e3a1e55ddfc6de47e74d4a226'),
    'complexRational':(ENERGY+'/check_first_correction_gram.py','a30af8425d7e063309ff4c2e4715091955e4e64c4ba3d4470246aa460fc24de9'),
}
AXES = ('r','theta','z')
WAVE = [22154865,22154866,22154867]
TID = 'f_3b700fc1d0d2c77582a0399d'
ACTUAL_MODES_PIN = 'dfc5401fc6561138e3a17fc05d2e38626b2694d96a1848e0008c9e821b958b40'


def read_pinned(path, pin, text_code=False):
    raw = path.read_bytes()
    if text_code:
        raw = raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==pin, path
    return raw


def read_original_rows(goal, actual_path):
    docs = {}
    for name,(rel,pin) in PINS.items():
        raw = read_pinned(goal/rel,pin,rel.endswith('.py'))
        if rel.endswith('.json'):
            docs[name] = json.loads(raw)
    source,cut,gauge,gram,tail,scale,geometry = (docs[k] for k in
                                                ('ingress','spatial','gauge','gram','tail','scale','geometry'))
    assert cut['stage']==cut['liveRootBinding']['stage']==1
    assert cut['liveRootBinding']['ingressSHA256']==PINS['ingress'][1]
    assert cut['liveRootBinding']['hostedRun']['id']==gauge['run']==44582875351
    assert gauge['uncutDifferencesOnOpenBranches']==[0,0,0]
    assert source['gaugeDifferenceRootsForIndependentCheck']==gauge['nativeGaugeDifferenceRoots']==cut['liveRootBinding']['gaugeDifferenceRoots']
    assert [row['root'] for row in source['wave']['indexed']]==WAVE
    assert [row['gaugeField'] for row in gram['sourceBindings']['actualFirstCorrection']]==WAVE
    assert [row['U'] for row in gram['sourceBindings']['actualFirstCorrection']]==source['normalizedRoots']['U']
    assert gram['sourceBindings']['actualNetMeanZeroMode']==[22153217,22153219,22153221]
    assert source['input']['meanPotentials']==[22150943,22151952]
    assert source['normalizedRoots']['A']==[WAVE[0],22154869,WAVE[2]]
    slots = cut['sourceSlots']
    for row in slots.values():
        root = source['normalizedRoots'][row['group']]
        for i in row['indices']:
            root = root[i]
        assert root==row['rootID'] and row['physicalMultiplier']==source['physicalMultipliers'][row['group']]
    assert len(slots)==24
    assert scale['firstActualScaleID']==tail['rows'][0]['stageScale']==TID
    assert tail['rows'][0]['sourcePotential']=='f_ac81b63855489a21bb407b2d'
    radial = tail['stageSupport']['radialPlateauProof']
    assert 'On correction support X<=Xb' in radial and 'r<1/2=r0/2' in radial
    geometry = geometry['geometry']
    assert 'all theta' in geometry['coordinateDomain'] and 'radial cutoff flat' in geometry['outerCutoffSpatialDerivatives']
    assert all('theta' not in expr for expr in geometry['sliceMap'].values())
    assert 'theta' not in geometry['volumeDensity']
    actual = json.loads(read_pinned(actual_path,ACTUAL_MODES_PIN))
    assert actual['status']=='VERIFIED_ACTUAL_FIRST_CORRECTION_ANGULAR_A_U_AND_ORIGINAL_SCALAR_GATES'
    assert actual['pins']['gram']==PINS['gram'][1]
    live = actual['liveOperands']
    assert live['source']['sha256']==gauge['sourceStreamSHA256']
    assert all(live[k]==source['normalizedRoots'][k] for k in ('A','U','G_A','G_U'))
    assert len(live['verifiedAngularCases'])==30
    assert sum(r['retainedTerms'] for r in live['verifiedAngularCases'])==150
    assert live['sameOuterRowsPerComponent']==162 and live['qActual']==17732776
    outer = actual['originalLocalization']['originalArchivedLocalizationRoots']['cutoff']
    assert outer=={'compactId':29023,'originalArchivedId':622958}
    return {'run':gauge['run'],'sourceSHA256':gauge['sourceStreamSHA256'],'slotCount':len(slots),
            'normalizedRoots':source['normalizedRoots'],'physicalMultipliers':source['physicalMultipliers'],
            'wavePotentialRoots':WAVE,'meanPotentialRoots':source['input']['meanPotentials'],
            'originalFixedStageScale':TID,'plateauProof':radial,'physicalMeasure':geometry['volumeDensity'],
            'gaugeDifferenceRoots':gauge['nativeGaugeDifferenceRoots'],
            'actualModeReceiptSHA256':ACTUAL_MODES_PIN,'actualWavePotentialCases':30,
            'actualWavePotentialTerms':150,'actualOuterRowsPerComponent':162,'actualOuterCutoff':outer}


def check_polynomials(poly):
    plus, mul, scale, var = poly.plus,poly.mul,poly.scale,poly.var
    # Each input is an exact formal complex coefficient, with in encoded
    # as a single commuting indeterminate. The real factors are independent.
    U = [var('U_'+i) for i in AXES]
    A = [var('A_'+i) for i in AXES]
    Tr,Tz,Trr,Trz,Tzz,T,ir,ii = map(var,('T_r','T_z','T_rr','T_rz','T_zz','T','inverse_r','i*n'))
    g = [Tr,{},Tz]

    def cross(v,w):
        return [plus(mul(v[j],w[k]),scale(-1,mul(v[k],w[j])))
                for j,k in ((1,2),(2,0),(0,1))]

    def grad_theta(v):
        return [mul(ir,plus(mul(ii,x),j)) for x,j in zip(v,poly.cross_ez(v),strict=True)]

    def spatial_column(name,k):
        return [var(f'{name}_{i}_{k}') for i in AXES]

    v = [plus(mul(T,u),a) for u,a in zip(U,cross(g,A),strict=True)]
    use = []
    for axis,gk,dT in zip(AXES,([Trr,{},Trz],[{},mul(ir,Tr),{}],[Trz,{},Tzz]),(Tr,{},Tz),strict=True):
        if axis=='theta':
            direct = grad_theta(v)
            du,da = grad_theta(U),grad_theta(A)
        else:
            du,da = spatial_column('U',axis),spatial_column('A',axis)
            rule = {f'U_{label}':u for label,u in zip(AXES,du,strict=True)}
            rule.update({f'A_{label}':a for label,a in zip(AXES,da,strict=True)})
            rule.update(dict(T=dT,T_r=gk[0],T_z=gk[2]))
            direct = [poly.derivative(c,rule) for c in v]
        wanted = [plus(mul(T,dui),mul(dT,ui),xa,xb) for dui,ui,xa,xb in
                  zip(du,U,cross(gk,A),cross(g,da),strict=True)]
        assert direct==wanted, (axis,'full cylindrical derivative')
        use.append(wanted)

    # The force needs two ordinary r/z derivatives and the physical time
    # derivative. The orthonormal cylindrical frame is fixed in these directions.
    for label,dT,dg,d2T,d2g in (
        ('r',Tr,[Trr,{},Trz],Trr,[var('T_rrr'),{},var('T_rrz')]),
        ('z',Tz,[Trz,{},Tzz],Tzz,[var('T_rzz'),{},var('T_zzz')]),
        ('tau',var('T_tau'),[var('T_rtau'),{},var('T_ztau')],None,None),
    ):
        du,da = spatial_column('U',label),spatial_column('A',label)
        rule = {f'U_{i}':u for i,u in zip(AXES,du,strict=True)}
        rule.update({f'A_{i}':a for i,a in zip(AXES,da,strict=True)})
        rule.update(dict(T=dT,T_r=dg[0],T_z=dg[2]))
        once = [poly.derivative(c,rule) for c in v]
        expected = [plus(mul(T,ui),mul(dT,u),x,y) for ui,u,x,y in
                    zip(du,U,cross(dg,A),cross(g,da),strict=True)]
        assert once==expected
        if label=='tau':
            continue
        ddu,dda = spatial_column('U',label+label),spatial_column('A',label+label)
        rule.update({f'U_{i}_{label}':u for i,u in zip(AXES,ddu,strict=True)})
        rule.update({f'A_{i}_{label}':a for i,a in zip(AXES,dda,strict=True)})
        for term,replacement in zip((dT,dg[0],dg[2]),(d2T,d2g[0],d2g[2]),strict=True):
            [(name,)] = term
            rule[name] = replacement
        twice = [poly.derivative(c,rule) for c in once]
        expected2 = [plus(mul(T,u2),scale(2,mul(dT,u1)),mul(d2T,u0),
                          x,scale(2,y),z) for u2,u1,u0,x,y,z in
                     zip(ddu,du,U,cross(d2g,A),cross(dg,da),cross(g,dda),strict=True)]
        assert twice==expected2

    # Independent reduction to the accepted axial-only target, on the exact
    # original radial unit plateau. Keep the full angular connection.
    def plateau(p):
        return {k:c for k,c in p.items() if not set(k)&{'T_r','T_rr','T_rz'}}

    assert [plateau(c) for c in v]==[plus(mul(T,x),mul(Tz,j)) for x,j in zip(U,poly.cross_ez(A),strict=True)]
    for k,axis in enumerate(AXES):
        du,da=(grad_theta(U),grad_theta(A)) if axis=='theta' else (spatial_column('U',axis),spatial_column('A',axis))
        expected = [plus(mul(T,x),mul(Tz,y),mul(Tz,u) if axis=='z' else {},
                         mul(Tzz,a) if axis=='z' else {})
                    for x,y,u,a in zip(du,poly.cross_ez(da),U,poly.cross_ez(A),strict=True)]
        assert [plateau(term) for term in use[k]]==expected
    assert any('T_r' in monomial for expression in use[1] for monomial in expression)
    assert any('T_zz' in monomial for expression in use[2] for monomial in expression)
    return {'verifiedVelocityComponents':3,'verifiedCovariantGradientEntries':9,
            'verifiedSecondSpatialAndTimeComponentsForForce':9,
            'annularPlateauComponentsCompared':12,'retainedRadialAngularHessian':'T_r/r',
            'retainedAxialTerms':['T_z e_z cross A','T_z U','T_zz e_z cross A']}


def exact_controls(gaussian):
    z = lambda a,b=0:(Q(a),Q(b))
    gram, grouped, zadd, zmul = gaussian.gram,gaussian.grouped,gaussian.zadd,gaussian.zmul
    u = grouped([(4,[z(1),z(2,-1),z(0)]),(-4,[z(2),z(0,1),z(1)])])
    a = grouped([(4,[z(3,-2),z(1),z(1)]),(-4,[z(1),z(2),z(0)])])
    u[0]=[z(1),z(2),z(3)]
    a[0]=[z(0),z(4),z(0)]
    tz,t = z(2),z(Q(1,3))
    coeff = {}
    without_commutator = {}
    for n,velocity in u.items():
        r,theta,_ = a[n]
        j = [z(-theta[0],-theta[1]),r,z(0)]
        without_commutator[n] = [zmul(t,x) for x in velocity]
        coeff[n] = [zadd(zmul(t,x),zmul(tz,y)) for x,y in zip(velocity,j,strict=True)]
    mean = {0:coeff[0]}
    wave = {n:x for n,x in coeff.items() if n}
    assert gram(mean,wave)==0 and gram(mean,wave,4)!=0 and gram(mean,wave,9)==0
    assert gram(coeff,coeff)==gram(mean,mean)+gram(wave,wave)
    assert gram(coeff,coeff)!=gram(without_commutator,without_commutator)
    # cos(theta) times an n=4 pair reaches n=3 and n=5. The
    # original scalar gates are angle independent, so this is a failure control.
    assert ({n+s for n in (-4,4) for s in (-1,1)}-{4,-4})=={-5,-3,3,5}
    return {'originalAngleIndependentCutoffConditionNegativeControl':'cos(theta) cutoff yields modes -5,-3,3,5',
            'localizationEnergy':str(gram(coeff,coeff)),
            'missedCutoffCurlEnergy':str(gram(without_commutator,without_commutator)),
            'meanWaveHaarCross':str(gram(mean,wave)),
            'meanWaveFourPointCross':str(gram(mean,wave,4)),
            'meanWaveNinePointCross':str(gram(mean,wave,9))}


def main():
    if not __debug__:
        raise RuntimeError('Run with Python assertions enabled.')
    cli = ArgumentParser(description=__doc__)
    cli.add_argument('goal',type=Path)
    cli.add_argument('out',type=Path)
    cli.add_argument('--actual',type=Path,
                     default=Path(__file__).parent/'actual/actual-mode-operands-final.json')
    args = cli.parse_args()
    original = read_original_rows(args.goal,args.actual)
    sys.path[:0] = [str(args.goal/Path(PINS[k][0]).parent) for k in ('polynomial','complexRational')]
    import verify_spatial_cutoff_caps as poly
    import check_first_correction_gram as gaussian
    result = {'status':'VERIFIED_LOCALIZATION_AND_MODAL_PAIRING_CONDITIONAL_SOURCE_DOMAIN',
              'sourceSHA256':{k:pin for k,(_,pin) in PINS.items()},'original':original,
              'exactPolynomialChecks':check_polynomials(poly),'rationalFailureControls':exact_controls(gaussian),
              'firstCorrectionPhysicalCoefficients':{
                  'cutoff':'T=C(r,z,tau)*chi(a1*q(z,tau)); a1 is the original fixed scalar.',
                  'gradient':'g=(T_r,0,T_z). On the pinned radial plateau T_r=0.',
                  'velocity':'v_n=T*u_n+g cross A_n; on the radial plateau g=T_z*e_z.',
                  'gradientColumns':'(D_k v)_n=T*(D_k u)_n+(D_k T)*u_n+(D_k g) cross A_n+g cross (D_k A)_n.',
                  'cylindricalAngleColumn':'D_theta v_n=(i*n*v_n+e_z cross v_n)/r; D_theta g=(0,T_r/r,0).',
                  'forceCutoffDerivatives':'In ordinary directions r,z use the full twice differentiated product rule for T*u and grad(T) cross A; in tau use the corresponding once differentiated product. The cutoff uses up to order three in space and order (one space, one time).',
                  'zeroAndNonzero':'C and chi carry frequency zero. Mean–wave cross vanishes. Sum equal signed carrier contributions before any squared norm.',
                  'energyDissipation':'Normalized Haar yields the sum of squared v_n and covariant gradient columns at each r,z,tau. For real fields, positive frequency squared terms have multiplicity two.',
                  'scalarMeasure':'Original volume density is independent of theta. Integration of the circle quantities against it needs radial, axial and temporal interval inputs.',
                  'discreteAliasing':'An N-node circle agrees for the quadratic scalar if N does not divide any nonzero frequency difference in the operand support. N>2*max|n| suffices in the cylindrical pairing.'},
              'conditions':['Original open admitted fixed chart and exact uncut gauge identity on that chart.',
                            'Original finite potential and velocity spectra, including all physical coefficient scales and the original global cover, are evaluated on the full circle.',
                            'Ordinary smooth localized derivatives and region measure apply on the integration domain.'],
              'open':['Source values and derivative intervals along the original radial/axial/time experiment paths.',
                      'Actual force cross-work, pressure and later correction stages, original seam uniform bounds and final comparisons.'],
              'finalN8Comparisons':0,'finalJets':0,'release':'HOLD'}
    with args.out.open('x',encoding='utf-8',newline='\n') as f:
        f.write(json.dumps(result,indent=2)+'\n')
    print(result['status'],result['exactPolynomialChecks'],flush=True)


if __name__=='__main__':
    main()
