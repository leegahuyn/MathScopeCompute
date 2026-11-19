"""Bind, grade, and bound every raw first Forced geometry coefficient."""

from argparse import ArgumentParser
from collections import Counter
from fractions import Fraction as Q
from hashlib import sha256
from math import factorial
from pathlib import Path
import json
import sys


R,Z,T,V,ELL=17732748,17732749,17732750,17732751,17732737
EPS,K,CI,LS,TG,LAMBDA,DR,A_RAD=17732744,17732747,17733027,17733029,14220487,17734041,17734049,17735155
Y0,Y1,VR,VT=17745430,17745431,17733068,17733069
SQRT2=3622
STREAM='faa23696dd592dd83487e842d775e41072159e6d8377a69f2b93650e5839ee96'
PINS={
    'native':'e1e692f0b684199d7d7c1ab9e4e434aba9472329152b5d7533067313ef507f03',
    'manifest':'8468c8e0e357d60130e9a467fd709b37c5e689a44aeebe7e3c3e91741aa6aa9a',
    'factor':'dc39e6b516bb4f6dd5ee8b639c8f78c1c034684a5ab58cfa03144eca97bc894d',
    'raw':'66ed506c4bbbc1e2108d1aa23d07682e3744a34e1dc9f4e6fe761c009c4fe9c2',
    'frame':'56cc1d9685f00a5aba808675023453b3808fd916bd697f4ab9a242512ebee32d',
    'frameCheck':'38fdd2226e02fd4868f3c0eb48617bdf714fb80971a7001888daacf74d3d6fb9',
    'primary':'a72f12c82dd35106862cf6a874be1af79502a99d6de0e37e06db8794b66e5244',
    'mean':'2d172188703c2ddb81925eae70fd91252f8df9a743b8ff96ba325a6ac7f9bd1a',
    'matrix':'e808bd89285aa55ec0f1bf1c66cf7875ca26f706724ebc575e43c0466d2cdc36',
    'variation':'c3ec1fb8ea1bf30ec18c09111440099e921a26c3417d5a47e083e5aa6e85dc37',
    'weight':'4e334a10ed93839437baa8b2caefe36d32291bfc6c3d67d3b8b04c41fa797ba0',
    'background':'0b7c13076805acc97cd45e3e4e70e6f7620950744dc493dbff26d0644ff977cc',
    'gain':'387863daedfc9fd37f7c1d43db430235238f94d23b767424baffa5d2f3348955',
    'cache':'909a6dcab87a9537eac5b40738023a2e517c07f99754ae924295a4f47628349f',
    'reader':'6ff4c5dae80a07d1d8bb757b1886b556329c660e9438f3ee6713e802036fda48',
    'exact':'260017f8285e45e570bfde6865cc0483e1cb39379a45349ab3c7e1b33d012e75',
}


def read(path,key):
    raw=path.read_bytes()
    if path.suffix=='.py':
        raw=raw.replace(b'\r\n',b'\n')
    assert sha256(raw).hexdigest()==PINS[key],key
    return raw


def equal(form, Exact):
    e=form.a
    ((sqrt,),_)=next(iter(form.val(SQRT2,False).items()))
    sqrt_index,power=sqrt
    assert power==1
    def check(a,b):
        different=Exact.reduce_sqrt_two(e.sub(a,b),sqrt_index)
        return not different or not Exact.reduce_sqrt_two(e.clear_compound_denominators(different),sqrt_index)
    return check


def verify_ratio(g,form):
    e=form.a
    at=lambda i:form.val(i,False)
    ratio, reference=21435324,21435315
    [power]=g.args(ratio,'exp')
    assert at(power)==e.mul(at(127),e.sub(at(ELL),at(reference)))
    assert g.args(127,'log_positive')==[24]
    assert g.args(21435326,'inverse')==[21435325] and g.args(21435325,'sqrt_positive')==[ratio]
    [ax_scale]=g.args(21435331,'inverse')
    [ax_exp]=g.args(ax_scale,'exp')
    [amp_exp]=g.args(21435340,'exp')
    assert g.args(21435328,'log_positive')==[ratio]
    half=at(19)
    h=at(9)
    assert at(ax_exp)==e.mul(e.sub(half,h),at(21435328))
    assert at(amp_exp)==e.neg(e.mul(e.add(half,h),at(21435328)))
    return {'referenceToOwnRatio':ratio,'referenceEll':reference,'inverseSqrt':21435326,
            'inverseAxialScale':21435331,'inverseVelocityScale':21435340}


def choices(g, frame, Exact, c88, chart):
    sign=chart['sign']
    depth=int(chart['chart'].split(':')[0])
    v=chart['unpulledPulseEndpoint']
    old=c88['verifiedOriginalFrames'][str(sign)]
    replacements=dict(zip((*frame.FORMALS,V),(*frame.ACTUALS,v),strict=True))
    form=frame.Forms(g,Exact,replacements)
    equal_to=equal(form,Exact)
    e=form.a
    at=lambda i:form.val(i,False)
    orig=lambda i:form.val(i,True)
    delta=lambda n:e.scalar(n)
    p,pz=orig(old['p']),orig(old['pz'])
    k,eps,ci,tg,lam,r,vr,vt=map(at,(K,EPS,CI,TG,LAMBDA,R,VR,VT))
    ir=e.inv(r)
    ci_local=e.mul(ci,e.pow(tg,-depth))
    a=e.mul(at(A_RAD),e.pow(lam,-depth))
    a_r=e.mul(a,e.sub(at(DR),e.one),ir)
    geom=e.sub(e.scalar(4),e.mul(e.scalar(2),at(SQRT2)))
    dy=e.mul(e.inv(ci_local),e.inv(geom))
    dv_y=[e.mul(vt,dy),dy]
    n=list(map(orig,old['n']))
    ray=at(v)

    def native(slot, x):
        return form.atom(('actual_expression_partial',slot,
                          tuple(form.freeze(at(i)) for i in (R,Z,T,ELL)),tuple(x)+(0,)))

    def phase(alpha):
        return e.add(e.mul(p,native(32027,alpha)),e.mul(pz,native(32028,alpha)))

    hr=phase((1,0,0))
    hz=phase((0,1,0))
    assert equal_to(orig(old['HR']),hr) and equal_to(orig(old['HZ']),hz)
    h0,ht=phase((0,0,0)),phase((0,0,1))
    hrr,hzz=phase((2,0,0)),phase((0,2,0))
    nr_r=e.neg(e.mul(ray,hrr))
    nz_z=e.neg(e.mul(eps,ray,hzz))
    physical_time=e.sub(e.mul(eps,ray,ht),h0)
    ratio=verify_ratio(g,form)

    # Each descriptor is coefficient-free in the frozen labels except for
    # explicitly displayed S, epsilon, k and source-only prefactors.
    table={}
    def add(name,val):
        assert not any(equal_to(val,x) for x in table.values()),name
        table[name]=val

    for tag,value in [('epsilon',eps),('timeFast',ci_local),('vr1',vr),('vt0',vt),
                      ('invR',ir),('radialFast',a),('invR2',e.pow(ir,2)),
                      ('radialFastR',a_r),('twiceInvR2',e.mul(delta(2),e.pow(ir,2))),
                      ('twiceKNormalTheta',e.mul(delta(2),k,n[1])),('KCarrierP',e.mul(k,p)),
                      ('KNormalTheta',e.mul(k,n[1])),('meanReferenceInvSqrt',at(ratio['inverseSqrt'])),
                      ('meanReferenceInvAxial',at(ratio['inverseAxialScale'])),
                      ('meanReferenceVelocityFactor',at(ratio['inverseVelocityScale'])),
                      ('KNormalR',e.mul(k,n[0])),('KNormalRRadial',e.mul(k,nr_r)),
                      ('KNormalRY0',e.neg(e.mul(k,dv_y[0],hr))),('KNormalRY1',e.neg(e.mul(k,dv_y[1],hr))),
                      ('KNormalZ',e.mul(k,n[2])),('KNormalZAxial',e.mul(k,nz_z)),('KPhaseTime',e.mul(k,physical_time)),
                      ('twiceKNormalR',e.mul(delta(2),k,n[0])),('twiceKNormalZ',e.mul(delta(2),k,n[2]))]:
        add(tag,value)
    return form,table,ratio


def verify_geometry(graph, Exact, frame, blocks):
    source=blocks['factor']
    inventory=set()
    cases=[]
    all_tags={}
    formulas={}
    for case in source['cases']:
        key,m=case['chart'],case['mode']
        chart=source['normalizedPrimaryByChart'][key]
        if key not in formulas:
            form,expected,ratio=choices(graph,frame,Exact,blocks['frame'],chart)
            formulas[key]=form,expected,ratio
        form,expected,ratio=formulas[key]
        equal_to=equal(form,Exact)
        fields={r['root'] for r in case['rawJetAtoms']}
        coefficient_nodes={i for part in case['scalars'] for _,monomial in part['termsAfterFactoringPToMode']
                           for i,power in monomial if i not in fields}
        classified={}
        for i in sorted(coefficient_nodes):
            val=form.val(i,False)
            matches=[tag for tag,p in expected.items() if equal_to(val,p)]
            assert len(matches)==1,(key,m,i,matches)
            tag,=matches
            assert i not in all_tags or all_tags[i]==tag
            all_tags[i]=tag
            classified[str(i)]=tag
        assert len(classified)==(22 if m==1 else 7)
        inventory.update(coefficient_nodes)
        cases.append({'chart':key,'mode':m,'sourceSystem':case['system'],'fixedEndpoint':case['nativePulseVariable'],
                      'matchedOpaqueFactors':classified,'referenceScales':ratio,
                      'torusDirectionLDoesNotDifferentiateCollapsedCoefficients':True})
    assert len(inventory)==121 and len(cases)==20
    return cases,all_tags


def eikonal(graph, Exact, frame, blocks, charts):
    """Exact decomposition of the raw carrier-time and mean carrier products."""
    original=frame.Forms(graph,Exact,{})
    e=original.a
    a=lambda i:original.val(i,False)
    ratio=verify_ratio(graph,original)
    mean=blocks['mean']['sameLiveOperands']
    ref=mean['allMeanCallsOwnChart']
    assert ref['scaleRatio']==ratio['referenceToOwnRatio'] and ref['outsideVelocityScale']==ratio['inverseVelocityScale']
    assert ref['physicalXEtaQPreservedOnAdmittedCharts']
    ref_args=ref['referenceArguments']
    assert ref_args[-3:]==[ratio['referenceEll'],Y0,Y1]
    for operand,coord,scale in zip(ref_args[:3],(R,Z,T),(ratio['inverseSqrt'],ratio['inverseAxialScale'],None),strict=True):
        want=e.mul(a(coord),a(scale) if scale else e.inv(a(ratio['referenceToOwnRatio'])))
        assert original.eq(a(operand),want)

    names=json.loads(blocks['native']['definitions'])[0]
    by_id={x['id']:x for x in names}
    for j,row in enumerate(mean['mean']):
        assert row['component']==j
        d=by_id[row['definition']]
        assert d['name']==f'ActualInitializedMeanVelocity_{j}' and d['body']==row['body']
        expect=e.add(*(a(row[name]) for name in ('background','temporal','fiveMap')))
        assert original.eq(a(d['body']),expect)
    assert [x['background'] for x in mean['mean']]==[17732936,17744974,17732935]
    assert original.eq(a(17744974),e.mul(a(R),a(17732934)))
    assert blocks['mean']['scope']['fullBackgroundRetained']==['b','R*F','G']
    assert blocks['mean']['scope']['sameLiveBackgroundBOverEpsilonC5BoundAttachedOnOriginalSlab']
    mean_min={}
    for field,rows in blocks['mean']['rows'].items():
        mean_min[field]=min(Q(t[1],100000) for row in rows for t in row['terms'])
    assert min(mean_min.values())==1-Q(1,100000)

    charts={r['chart']:r for r in charts if r['mode']==1}
    reports=[]
    roles=('KNormalR','KNormalTheta','KNormalZ')
    for case in blocks['factor']['cases']:
        if case['mode']!=1:
            continue
        key=case['chart']
        classifications={int(i):tag for i,tag in charts[key]['matchedOpaqueFactors'].items()}
        forms,coefs,_=choices(graph,frame,Exact,blocks['frame'],blocks['factor']['normalizedPrimaryByChart'][key])
        algebra=forms.a
        require_equal=equal(forms,Exact)
        root_count=graph.count
        symbols={}
        def atom(name):
            i=symbols.setdefault(name,root_count+1+len(symbols))
            return {((i,1),):Q(1)}

        atoms={x['root']:x for x in case['rawJetAtoms']}
        for component in case['scalars']:
            j,part=component['coordinate'],component['part']
            opposite='imaginary' if part=='real' else 'real'
            sign=-1 if part=='real' else 1
            wave=f'InitializedOriginalWave_{key.replace(":","_")}_'
            expected_velocity=[atom(wave+str(i)+'_'+opposite) for i in range(3)]
            expected_mean=[atom(f'ActualInitializedMeanVelocity_{i}') for i in range(3)]
            scale=forms.val(ratio['inverseVelocityScale'],False)
            expected=algebra.mul(algebra.scalar(sign),algebra.add(
                algebra.mul(coefs['KPhaseTime'],expected_velocity[j]),
                algebra.mul(scale,algebra.add(*(algebra.mul(coefs[kind],algebra.add(
                    algebra.mul(expected_mean[i],expected_velocity[j]),
                    algebra.mul(expected_mean[j],expected_velocity[i]))) for i,kind in enumerate(roles))))))
            selected=[]
            for scalar,mono in component['termsAfterFactoringPToMode']:
                factor_atoms=[(i,n) for i,n in mono if i in classifications]
                field_atoms=[(i,n) for i,n in mono if i in atoms]
                kinds={classifications[i] for i,_ in factor_atoms}
                with_mean=any(atoms[i]['role']=='mean' for i,_ in field_atoms)
                if not ('KPhaseTime' in kinds or (with_mean and bool(kinds&set(roles)))):
                    continue
                assert all(not any(atoms[i]['orders']) for i,_ in field_atoms)
                operands=[algebra.pow(forms.val(i,False),n) for i,n in factor_atoms]
                for i,n in field_atoms:
                    field=atoms[i]
                    d=by_id[field['nativeDefinition']]
                    if field['role']=='mean':
                        assert field['arguments']==ref_args
                    else:
                        assert field['role']=='u' and d['name'].endswith('_'+opposite)
                    operands.append(algebra.pow(atom(d['name']),n))
                selected.append(algebra.mul(algebra.scalar(Q(scalar)),*operands))
            assert require_equal(algebra.add(*selected),expected),(key,j,part,len(selected))
        reports.append({'chart':key,'carrierMixedSourceComponents':6,
                        'identity':'i*k*((D_t(phi)+n dot scaledMean)U+(n dot U)scaledMean)'})
    assert len(reports)==10
    # Check chart scaling exponents as affine polynomials in h.
    one=(Q(1),Q(0))
    half=(Q(1,2),Q(0))
    A=(Q(1,2),Q(1))
    D=(Q(1,2),Q(-1))
    h=(Q(0),Q(1))
    add=lambda *v:tuple(sum(row[i] for row in v) for i in range(2))
    neg=lambda x:tuple(-n for n in x)
    assert add(D,h)==half
    assert add(neg(A),neg(half),A,half)==(0,0)  # R_ref * F_ref
    assert add(neg(A),h,half)==(0,0)          # b_ref
    assert add(neg(A),A)==(0,0)               # G_ref
    return {'exactSourceChecks':reports,'meanReferenceRoots':ref_args,
            'samePhysicalBackgroundTransport':[
             'ratio=Qref/Qown and s_ref=s_own/ratio satisfy identical original monotone chart equations. Both s are in the admitted positive interval.',
             'Then X, eta and physical q agree. Actual time cutoffs and all positive coefficient weights are evaluated at that same physical q.',
             'Multiplication by ratio^(-A) takes (b_ref,R_ref F_ref,G_ref) to the own-chart (b,R F,G); exact h powers cancel.'],
            'eikonalAfterOwnChartTransport':'Let omega=pF+pzG and mean=(b,RF,G)+Delta. D_t(phi)+n dot mean=b*n_r+epsilon*w*(omega_T-G*omega_Z)+n dot Delta.',
            'meanIncrementMinimumEpsilonByComponent':{k:str(v) for k,v in mean_min.items()},
            'epsilonAccounting':'The transported b includes one epsilon and the other background remainder has explicit epsilon*w. Every weighted Delta term has epsilon >= 1-1/100000 before accounting for k. Combining k<=2 epsilon^(-1/2) and the Primary sqrt(epsilon) preserves epsilon^(1-1/100000) on this eikonal term, with each actual S/pole/mean multiplier separately retained.',
            'retainedConservativeTerm':'i*k*(n dot U)*mean remains in the raw conservative factor. The real part of normalized U has exact tangency from C91 and the imaginary part retains k^(-1). No mean incompressibility or unsupported cancellation is needed for this bound.'}


def bounds(blocks,tags):
    """Separate exact label factors from a directed source-only log budget."""
    assert blocks['primary']['exactSameBody']['fixedGeometry']['radialSourcePowerIdentity']==\
        'Lambda^i*Q^(d_r/2)=ci^rho_g*epsilon^(-1/100000)'
    assert blocks['primary']['weightedQuotientLedger']['cutoffDerivativeConstants']['maximumOrdinaryOrder']==9
    assert blocks['background']['pointwiseInputCap']['originalStrictBudgetComparisonOnLiveSlab']==-1
    assert blocks['weight']['actualLabel']['Bnorm']==14220485
    gain=blocks['gain']['propagatorToOriginalPhysicalGain']
    assert gain['nativeNormNamespaceRoots']['Bnorm']==14220485 and gain['nativeNormNamespaceRoots']['h']==9
    inequalities=gain['sourceInequalities']
    assert 'Bnorm>=max(2^128,C12EnvelopeR^4096)' in inequalities
    assert 'h*Bnorm^256>1; 36<64' in inequalities
    assert any('=log(h^-1)' in x for x in inequalities)
    assert gain['result']=='log(W_prop)/H_gain <2^-27'
    assert blocks['mean']['scope']['actualMeanExtrapolationOutOfOriginalSlabForbidden']

    desc={
        'epsilon':'epsilon',
        'timeFast':'ci / Tg^delta',
        'vr1':'1 - sqrt(2)',
        'vt0':'sqrt(2) - 1',
        'invR':'1/R',
        'invR2':'1/R^2',
        'twiceInvR2':'2/R^2',
        'radialFast':'a / Lambda^delta',
        'radialFastR':'(dr-1)*a / (R*Lambda^delta)',
        'KCarrierP':'k*p',
        'KNormalR':'k*n_r',
        'twiceKNormalR':'2*k*n_r',
        'KNormalTheta':'k*p/R',
        'twiceKNormalTheta':'2*k*p/R',
        'KNormalZ':'k*n_z',
        'twiceKNormalZ':'2*k*n_z',
        'KNormalRRadial':'-k*w*omega_RR',
        'KNormalRY0':'-k*v_Y0*omega_R; v_Y0=vt0*Tg^delta/(ci*Dgeom)',
        'KNormalRY1':'-k*v_Y1*omega_R; v_Y1=Tg^delta/(ci*Dgeom)',
        'KNormalZAxial':'-k*epsilon*w*omega_ZZ',
        'KPhaseTime':'k*(-omega+epsilon*w*omega_T)',
        'meanReferenceInvSqrt':'ratio^(-1/2)',
        'meanReferenceInvAxial':'ratio^(-D)',
        'meanReferenceVelocityFactor':'ratio^(-A)',
        'normalizedPulseRate':'lambda-dref',
    }
    assert set(tags.values())==set(desc)-{'normalizedPulseRate'}
    fixed={
        'epsilon':(0,1,0,0),'timeFast':(-1,0,0,0),
        'vr1':(0,0,0,0),'vt0':(0,0,0,0),
        'meanReferenceInvSqrt':(0,0,0,0),'meanReferenceInvAxial':(0,0,0,0),
        'meanReferenceVelocityFactor':(0,0,0,0),'KCarrierP':(0,0,1,0),
        'normalizedPulseRate':(0,0,0,0),
    }
    ordinary={
        'invR':(0,0,0,0),'invR2':(0,0,0,0),'twiceInvR2':(0,0,0,0),
        'radialFast':(0,Q(-1,100000),0,1),'radialFastR':(0,Q(-1,100000),0,1),
        'KNormalTheta':(0,0,1,0),'twiceKNormalTheta':(0,0,1,0),
        'KNormalRRadial':(1,0,1,0),'KNormalRY0':(1,0,1,0),'KNormalRY1':(1,0,1,0),
        'KNormalZAxial':(1,1,1,0),
    }
    table={}
    for tag,formula in desc.items():
        rows=[]
        for j in range(5):
            if tag in fixed:
                profiles=[fixed[tag]] if j==0 else []
            elif tag in ordinary:
                profiles=[ordinary[tag]]
            elif tag in ('KNormalR','twiceKNormalR'):
                profiles=[(min(j,1),0,1,0)]
            elif tag in ('KNormalZ','twiceKNormalZ'):
                profiles=[(min(j,1),min(j,1),1,0)]
            else:
                assert tag=='KPhaseTime'
                profiles=[(0,0,1,0),(1,1,1,0)]
            rows.append([[str(Q(z)) for z in p] for p in profiles])
        table[tag]={'formula':formula,'envelopesBySlowOrder':rows,
                    'everyPositiveLDerivativeAtFixedEndpointIsZero':True}

    # All integer coefficient proofs use upper bounds for log B <= B and
    # log 2 < 1. The variable source multiplier C is excluded from these.
    assert factorial(5)*(2**2)*(3**6)<2**20           # R and radial powers
    assert 2*6**5<2**20                             # two carriers and v_Y
    assert 4*factorial(5)<2**20                      # doubled angular
    Bmin=2**128
    lower_h_over_b=Q(Bmin**510,2)
    assert 2**128*(20+12)<lower_h_over_b              # log(2^20 B^12) < H/2^128
    raw=blocks['raw']['firstAndSecondModeCoefficientGroups']
    product_max={m:max(x['otherCoefficientFactorCount'] for x in rows) for m,rows in raw.items()}
    assert product_max=={'1':4,'2':2}
    weights_max=max(sum(Q(x['maximumMultinomialCoefficientSumThroughOrderFour'][j]) for x in rows)
                    for rows in raw.values() for j in range(5))
    weights_log_ceiling=weights_max.numerator.bit_length()
    assert 2**128*weights_log_ceiling<lower_h_over_b and (2*max(product_max.values())+1)<2**4

    previous=blocks['matrix']['sharpBandDegreeAudit']['exactDerivativeLedgers']
    keys=('BLeft','projector','movingBasisInfinityNorm','normalizedMode1And2MatrixInfinityNorm')
    matrix_max=max(Q(row[0])*(3 if k in ('BLeft','projector') else 1) for k in keys for row in previous[k][:5])
    exponent_max=max(row[1] for key in keys for row in previous[key][:5])
    assert exponent_max==31 and matrix_max<2**32
    matrix_single_nuisance=32+exponent_max*6
    assert 2**128*matrix_single_nuisance<lower_h_over_b and exponent_max+1==32
    variation=[item for row in blocks['variation']['rows'] for item in row['physicalOverPPolynomial']]
    degree_matrix=max(item['maxSourceConstantPower'] for item in variation)
    constant_matrix=max(sum(Q(item['coefficient']) for item in row['physicalOverPPolynomial'])
                        for row in blocks['variation']['rows'])
    log_ceiling_matrix=constant_matrix.numerator.bit_length()
    max_prop=max(item['propagatorPower'] for item in variation)
    assert degree_matrix==73 and max_prop==5
    assert 2**128*(log_ceiling_matrix+6*degree_matrix)<lower_h_over_b and degree_matrix+1<2**7
    assert max_prop+Q(1,2**94)<8

    return {'sourceOnlyCapPerGeometryFactor':'Cgeo=2^20*Bnorm^12*C_FG, C_FG=max(1, admitted whole F/G C10 value on original directed slab)',
            'profileInterpretation':'Each [s,e,a,b] means Cgeo * S^(s-b*rho_g) * epsilon^e * k^a. Add profile terms. These are scalar absolute derivative caps, with no phase sign imposed.',
            'derivativeArithmetic':{
             'slowOrderRange':[0,4],'largestOriginalBackgroundOrderForGeometry':6,
             'normalValueUsesSameOriginalCone':'At j=0, n has |n|<=Bnorm^4. Positive n_r,n_z derivatives carry w<=Lmax*S; n_z derivatives also carry epsilon.',
             'radius':'Rmax<=2*Renv and 1/Rmin<=Renv. Through order four, R^-1/R^-2 coefficients are bounded by 5!*Rmin^(-6) with an extra doubling when needed.',
             'radialFast':'The actual dr lies in (1,3), so falling coefficients through order five are bounded by 3^6 times the indicated fixed radius factors. The remaining palette factor is ci^rho_g*epsilon^(-1/100000), and ci<=S^-1.',
             'fixedTorUsSlopes':'At delta in 0..4, |v_Yi|<=6^5*S using 1/ci<Tg*S and Dgeom>=1.',
             'phaseGenealogy':'Each derivative of omega=pF+pzG costs at most 2*Bnorm^5*C_FG. Fixed phase normal theta is p/R. dt(phi) is retained as two terms so that cancellation can remove omega.',
             'referenceCharts':'If both s_own,s_ref lie in [1/2,2] for the same physical q, Qref/Qown lies in [1/4,4], and its three frozen inverse factors are <=4.',
             'carrier':'Keep k explicit or apply k<=2*epsilon^(-1/2).'},
            'actualCoefficientProfiles':table,
            'originalSlabLogBudget':{
             'domain':'Original directed C10 slab qBig/64<=q<qBig/16 with the original cone, representatives and same admitted positive radius cutoffs; endpoint traces use the inherited ordinary interpretation.',
             'threshold':'H=-h*log(tau0) > h*Bnorm^512/2 > Bnorm^511/2.',
             'background':'log(C_FG)<=H/2^128 from the prior original C10 strict comparison on this slab.',
             'eachGeometryFactor':'log(Cgeo)<H/2^127.',
             'rawGeometryProductsWithLeibniz':{
                'maxFactorsByMode':product_max,'logRationalCeiling':weights_log_ceiling,
                'logBound':'H/2^124'},
             'oneMatrixFactor':'Using A=2*Bnorm^5*C_FG in the original C89 ledgers, log(max scalar matrix/basis/projection cap through order four with its S power removed)<H/2^123.',
             'orderedMatrixGeometryPrefactors':{'maxAPower':degree_matrix,'maxPropagatorPower':max_prop,
                 'logBoundWithoutC0orMassOrS':'H/2^121','logBoundIncludingC0BeforeMassAndS':'H/2^24'},
             'excludedFromGeometryLogBudget':['field coefficient norms for all complete forcing and mean components','outer Gaussian weight and S, epsilon, k factors','length and Gaussian mass prefactors for the final integration','N7 energy and N8 convergence tests'],
             'strictSlabBudgetExtendsToEntireN3Window':False}}


def main():
    assert __debug__
    p=ArgumentParser(description=__doc__)
    for key in ('goal','artifact','cache','primary','out'):
        p.add_argument('--'+key,type=Path,required=True)
    a=p.parse_args()
    active=a.goal/'primary-forced-join/active-n3-c5-binding'
    band=active/'first-wave-guard-traces'
    host=a.artifact/'first-correction-spatial-source'
    frame=band/'outer-normalized-amplitude/pulse-frame'
    paths={'native':host/'original-source-functions.json','manifest':host/'original-source-export-manifest.json',
           'factor':band/'forced-normalized-variation/source/normalized-first-forced.json',
           'raw':band/'forced-normalized-variation/raw-forcing-majorant.json',
           'frame':frame/'pulse-frame-caps-final.json','frameCheck':frame/'verify_all_label_pulse.py',
           'background':band/'outer-fixed-label-norm/background-transport.json',
           'weight':band/'outer-fixed-label-norm/band-weight.json','primary':a.primary,
           'mean':band/'initial-mean-norm/initial-mean-caps.json',
           'matrix':band/'outer-fixed-label-norm/matrix/matrix-s-j.json',
           'variation':band/'forced-normalized-variation/weighted-variation.json',
           'gain':a.goal/'final67/active-n3-cap-transport/source-cap/cap-transport.json',
           'cache':active/'live-wave-gauge/signed/source_cache.py',
           'reader':active/'spatial-readback/verify_spatial_artifact.py',
           'exact':a.goal/'first-force-repair/verify_repaired_first_force.py'}
    values={key:read(path,key) for key,path in paths.items()}
    blocks={key:json.loads(values[key]) for key,path in paths.items() if path.suffix=='.json'}
    sys.path[:0]=[str(paths[k].parent) for k in ('cache','reader','exact','frameCheck')]
    import source_cache,verify_spatial_artifact
    import verify_all_label_pulse as pulse_frame
    from verify_repaired_first_force import Exact
    graph=source_cache.load(verify_spatial_artifact,host,blocks['manifest'],22153782,a.cache)
    try:
        assert graph.count==22155584 and graph.verify['sha256']==STREAM
        charts,tags=verify_geometry(graph,Exact,pulse_frame,blocks)
        carrier=eikonal(graph,Exact,pulse_frame,blocks,charts)
    finally:
        graph.__exit__(None,None,None)
    result={'status':'VERIFIED_ACTUAL_FORCED_COEFFICIENT_GEOMETRY','inputPins':PINS,
            'sourceStream':graph.verify,'chartRows':charts,'distinctGeometryNodes':len(tags),
            'tagTotals':dict(sorted(Counter(tags.values()).items())),'eikonalAndMeanTransport':carrier,
            'conditionalCoefficientCaps':bounds(blocks,tags),
            'finalJets':0,'release':'HOLD'}
    with a.out.open('x',encoding='utf8',newline='\n') as out:
        json.dump(result,out,indent=2)
        out.write('\n')
    print(result['status'])


if __name__=='__main__':
    main()
