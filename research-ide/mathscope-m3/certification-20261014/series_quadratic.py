#!/usr/bin/env python3
"""Source-bound quantitative natural-series/quadratic analytic attempt.

Standard library only. Exact rational implications are proved afresh; stored
PASS fields, approximate preconditioners and finite root iterates are never
proof inputs. Functional source estimates remain individually named until
their actual defining histories have been established. A successful process
means that this audit was produced, not that N6 was accepted.
"""
from pathlib import Path
from fractions import Fraction as F
from math import factorial
import argparse, hashlib, json, re, subprocess, time

CORE_NAMES=['h','Lambda','A','D','d','L','Ustar','Hstar','Wstar','Zstar','chi','zeta','gSquared']
PRODUCERS={
 'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
 'actual-continuation-exact-tail.mjs':'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
 'actual-continuation-exact-b8.mjs':'1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
 'actual-continuation-exact-global.mjs':'497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f',
 'actual-continuation-exact-heat.mjs':'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
}
def sha(raw):return hashlib.sha256(raw).hexdigest()
def digest(value):return sha(json.dumps(value,separators=(',',':'),ensure_ascii=False).encode())
def text(q):return str(q)
def read(root,name):
    p=root/name
    return p.read_bytes() if p.is_file() else subprocess.check_output(['git','show','HEAD:'+name],cwd=root)
def poly_add(*xs):
    out={}
    for p in xs:
        for k,v in p.items():out[k]=out.get(k,F(0))+v
    return {k:v for k,v in out.items() if v}
def poly_mul(a,b):
    out={}
    for i,v in a.items():
        for j,w in b.items():out[i+j]=out.get(i+j,F(0))+v*w
    return out
def poly_scale(a,n):return {k:v*n for k,v in a.items()}

def natural_bound_tree():
    """Nonnegative norm/Lipschitz propagation of all original remainder terms.
    Applying the tree requires the stated actual B_rho operator/input lemmas.
    """
    q={1:F(1)};one={0:F(1)};zero={}
    fixed=lambda p:(p,zero)
    add=lambda *xs:(poly_add(*(x[0] for x in xs)),poly_add(*(x[1] for x in xs)))
    scale=lambda n,x:(poly_scale(x[0],n),poly_scale(x[1],n))
    linear=lambda p,x:(poly_mul(p,x[0]),poly_mul(p,x[1]))
    bilinear=lambda p,x,y:(poly_mul(p,poly_mul(x[0],y[0])),poly_mul(p,poly_add(poly_mul(x[1],y[0]),poly_mul(x[0],y[1]))))
    mul=lambda x,y:bilinear(q,x,y)
    f={k:fixed(q) for k in ['one','eta','d','invL','U','Ueta','W','H','zeta','Z']}
    phi=(q,one);u=(q,one);avg=linear(q,u)
    al=add(f['W'],f['one'],scale(2,mul(f['eta'],f['U'])))
    aq=mul(f['d'],f['zeta']);av=scale(2,f['eta']);slow=scale(2,f['eta'])
    ul=add(f['one'],scale(4,mul(f['eta'],f['U'])),mul(f['d'],f['Ueta']))
    uq=scale(2,f['eta'])
    lin1=add(linear(q,mul(al,phi)),bilinear(q,f['W'],phi),bilinear(q,phi,f['H']))
    quad1=linear(q,mul(mul(aq,u),phi))
    slow1=add(linear(q,mul(add(mul(av,avg),mul(slow,u)),phi)),bilinear(q,avg,mul(f['d'],phi)),bilinear(q,mul(av,avg),phi),mul(f['d'],bilinear(q,avg,phi)),bilinear(q,phi,mul(f['d'],u)))
    lin2=add(linear(q,mul(ul,u)),bilinear(q,f['W'],u),bilinear(q,u,f['H']))
    slow2=add(linear(q,mul(uq,mul(u,u))),bilinear(q,mul(av,avg),u),mul(f['d'],bilinear(q,avg,u)),bilinear(q,u,mul(f['d'],u)))
    amplitude=fixed({0:F(2)});source=mul(mul(amplitude,amplitude),mul(phi,phi))
    pressure=linear(q,add(mul(scale(4,f['eta']),linear(q,source)),mul(f['d'],linear(q,source)),mul(scale(2,f['eta']),linear(q,source))))
    first=linear(q,mul(f['invL'],add(lin1,quad1,slow1)));second=mul(f['invL'],add(lin2,slow2,pressure))
    result=add(first,second)
    terms={k:{'bound':{str(d):text(c) for d,c in sorted(v[0].items())},'lipschitz':{str(d):text(c) for d,c in sorted(v[1].items())}} for k,v in [('lin1',lin1),('quad1',quad1),('slow1',slow1),('lin2',lin2),('slow2',slow2),('pressure',pressure),('first',first),('second',second)]}
    return result,terms

def arithmetic_attempt():
    checks=[]
    def check(name,value,formula):checks.append({'id':name,'pass':bool(value),'formula':formula})
    z=F(17,16);hmax=jmax=F(1,1000);smax=jmax/2000;Rmax=smax*smax/2048
    check('actual_exponent_guard_h_lt_2neg200',8002*128>200,'T>=128 and e>2 imply 0<h=e^(-8002T)<2^-200.')
    check('actual_T_lower_guard',2**20+11>128,'exp(2^20)>=1+2^20, hence T>2^20+11>128.')
    check('tube_inside_modulus_17_over16',F(33,32)+Rmax<z,'dist(z,[-33/32,33/32])<=sigma^2/2048 implies |z|<17/16.')
    Hsup=F(9,2)*z+4*z**3+jmax*(1+z*z);Hprime=F(9,2)+12*z*z+2*jmax*z
    check('H_complex_upper10',Hsup<10,'|H(z)|<=(9/2)|z|+4|z|^3+j(1+|z|^2)<10.')
    check('H_complex_derivative_upper20',Hprime<20,'|Hprime(z)|<=9/2+12|z|^2+2j|z|<20.')
    deviation=F(400,2048)+F(400,2048**2)*smax*smax
    check('complex_Hsquare_perturbation_lt_sigma2_over4',deviation<F(1,4),'|H(z)^2-H(x)^2|/sigma^2<=400/2048+400*sigma^2/2048^2<1/4.')
    check('L_complex_lower99_over100',1-2*hmax*z*z>F(99,100),'|L(z)|>=1-2h|z|^2>99/100.')
    check('pressure_complex5K_given_actual_mass4K',4*F(256,255)**2<5,'On |Im z|<=1/16, Re(1+z^2)>=255/256; actual measure mass<=4K yields |P(z)|<5K.')
    check('pressure_Cauchy_disk_fits',Rmax+F(1,32)<F(1,16),'Radius1/32 disks about the closed tube lie in the pressure strip.')
    check('Cauchy_weight_loss_lt2',F(17,16)*F(16,15)**3<2,'sum_(m>=0)(m+1)^2*(1/16)^m=4352/3375<2.')
    check('rho_inverse_belowQ',65536<2**260,'rho^-1=65536/sigma^2<=Q=2^260*K/sigma^2, K>=1.')
    check('all_original_operator_bounds_belowQ',5120*65536<2**260,'5120/rho<=Q and all smaller B_rho operator constants<=Q.')
    check('source_CSelected_ge_Caxis',65<2**(260*135),'sigma^-2<=Q; 64Q^65+1<=65Q^65<Q^200<=log(CSelected).')
    check('resolvent_upper_2pow256',3**160<2**256,'sum 80^(2n)/(n!)^2<=exp(160)<3^160<2^256.')
    check('reference_ball_insideQ',2**256+2**25+1<2**260,'||x0||<=2^256+2^25*K; radius1 ball lies in ||x||<=Q.')
    bound,tree=natural_bound_tree();b,l=bound
    check('full_remainder_coefficients',b=={5:F(2),6:F(3),7:F(3),8:F(11),9:F(8),10:F(2),11:F(29)},'Full B.14/B.15 operator norm tree; no pressure or mixed term omitted.')
    check('full_lipschitz_coefficients',l=={4:F(2),5:F(3),6:F(4),7:F(17),8:F(14),9:F(4),10:F(58)},'Lipschitz tree independently propagated by replacing each argument factor.')
    # Only the exact generated polynomial decides these uniform implications.
    check('natural_sharp_displacement',max(b)==11 and sum(b.values())==58,'B(Q)/(2Q^64)<=29Q^-53 for every Q>=1.')
    check('natural_sharp_contraction',max(l)==10 and sum(l.values())==102,'L(Q)/(2Q^64)<=51Q^-54 for every Q>=1.')
    check('natural_selfmap_and_contraction_strict',29<F(2**(260*53)) and 102<2**(260*54),'29Q^-53<1, 51Q^-54<1/2 for Q>=2^260.')
    check('natural_Phi_positive_given_operator_lemma',F(305719,1152000)-F(1,2**100)>F(1,4),'Phi>=f0(Ychi)-2^-100>1/4 on 0<=Y<=41/10.')
    # Independent source-step bound; no stored sigma-prime PASS or 9 bound.
    check('step_derivative_bound_from_elementary_exponential',8*3**4==648 and 648<2**10,'fprime(t)=2t^-3 exp(-t^-2)<=4 by exp(u^2)>=u^4/2; f(t)+f(1-t)>=exp(-4)>3^-4; 0<=sigma-prime<=648.')
    w=F(1,4096);detU=F(3,5)*w**3;detE=F(21,25)*w**6
    betaU=F(20,3)/w**2;betaE=F(393216)*w*w/detE;beta=max(betaU,betaE)
    check('B8_U_exact_support_determinant',detU>0,'U point-weight f(x)=sqrt2*x^(3/5) has fprime>=3/5; source support gap>=w and both masses=w: |det A_U|>=(3/5)w^3.')
    check('B8_E_exact_support_determinant',detE>0,'Factor x^-9/10 from every point column; f(x)=x^(7/5) has fsecond>=14/25. Divided difference>=7/25, gaps w,w,3w, three masses=w: |det A_E|>=(21/25)w^6.')
    check('B8_full_inverse_below2pow68',beta<2**68,'Each E cofactor<=2*(256w)^2, row sum<=393216w^2; block inverse infinity norm<2^68.')
    kappa0=max(5*648*w,3*128*648*w)
    check('B8_quadratic_norm_below64',kappa0<64,'int bump^2<=648*w; row3<=5*648*w, row4<=3*128*648*w<64.')
    d0=F(15,2**200);guard=8*(2**68)**2*F(64,2**400)*d0;radius=2*(2**68)*d0
    check('B8_A2_guard_given_actual_rhs_bound',guard<1,'If actual d0<=15h and mu=h^2, then 8 beta0^2 kappa0_eff d0<=120*2^-458<1.')
    check('B8_branch_radius_inside_original_source_box_given_rhs',radius<F(1,1000000),'2beta0*d0<=30*2^-132<10^-6.')
    check('B8_jacobian_Neumann_guard_given_rhs',2*(2**68)*F(64,2**400)*radius<F(1,2),'At the selected branch ||A^-1(J-A)||<=60*2^-458<1/2; ||J^-1||<2^69.')
    check('B8_rhs_reduction_given_continuation18',14*F(1,2**200)+1<15 and 184*F(1,2**(200*5))+1<15,'Actual normalized full-history bounds (18), divided by mu=h^2, imply max_{m<=2}||rhs_eta^m||<=15h.')
    # Continuous C.2 matrix bounds also derived from its original supports.
    detC2E=F(3,8*14**6);inverseC2E=48/detC2E
    check('C2_U_inverse_bound',2**100>14 and 6*56<2**30,'lambda<=1/100 gives14^lambda<=2; -w_lambda-prime=x^(-1-lambda)>=1/28, source support gap>=1/2; det>=1/56 and inverse<=336.')
    check('C2_E_inverse_bound',inverseC2E<2**30,'Factor x^(-3/2-lambda); sqrt2*x^(2+lambda) divided difference>=1, gaps1/2,1/2,3/2; det>=3/(8*14^6), adjugate row<=48, inverse<2^30.')
    kappaC2=5*(2*648)
    check('C2_quadratic_bound_below2pow13',kappaC2<2**13,'Unit-mass bumps width1/2 satisfy maxb<=1296, integralb²<=1296; all5 rows <=6480<8192.')
    check('I1_rhs_quantitative_reduction_given_actual_R_envelope',13*37==481,'If all actual C.12 inputs satisfy their R-envelope and R>=8192=2^13,N>=R^50: ||rhs||<=R^13/N<=2^-481.')
    check('I1_A2_guard_given_actual_R_envelope',8*F(2**60)*F(2**13,2**200)*F(1,2**481)<1,'8beta0²*kappa_eff*d0<=2^-605<1.')
    heat_exp=59001*128-18+24
    check('I2_actual_heat_scalar_reduction_given_H5H9',heat_exp==7552134,'Actual normalized rhs<=2^16/(lambda*X0I2); XR>=2^40 and X0I2=XR*exp(60001T-18) imply rhs<2^-7552134 using e>2,T>=128.')
    check('I2_A2_guard_given_actual_heat_estimate',3+60+13-200-heat_exp<0,'8beta0²*kappa_eff*d0<2^-7552258<1.')
    return {'checks':checks,'allExactImplicationChecksPassed':all(c['pass'] for c in checks),'naturalBoundTree':tree,
      'provedClassicalLemmas':[
        {'id':'LITERAL_SOURCE_STEP_MASS_AND_DERIVATIVE','status':'PROVED','proofMethod':'WRITTEN_CLASSICAL','statement':'The literal flat step is real smooth, has sigma(0)=0,sigma(1)=1,0<=sigma-prime<648. Thus every source bump has its exact stated positive mass.','proofDocument':'series_quadratic_lemmas.md section3'},
        {'id':'LITERAL_SOURCE_B8_C2_CONTINUOUS_MATRICES','status':'PROVED','proofMethod':'WRITTEN_CLASSICAL','statement':'The literal B8 continuous block matrix is invertible with norm<2^68; the literal C2 continuous block matrix is invertible with norm<2^30. The stated Qdiag bounds are64 and2^13 respectively.','proofDocument':'series_quadratic_lemmas.md sections3-4','doesNotProveActualIncomingDebt':True},
        {'id':'ACTUAL_FIXED_CORE_POLYNOMIAL_DENOMINATORS','status':'PROVED','proofMethod':'WRITTEN_CLASSICAL','statement':'For the exact h,j,sigma parameter expressions and the specified Omega tube, |L|>99/100 and |H^2+sigma^2|>=H(real)^2+3sigma^2/4>0.','proofDocument':'series_quadratic_lemmas.md section1','doesNotProveWholeSourceBanachMembership':True},
      ],
      'naturalDomain':{'etaWindow':['-33/32','33/32'],'complexTubeRadius':'sigmaStar^2/2048','coefficientRadius':'rho=sigmaStar^2/65536','evaluationNeighborhood':'|Y|<=5 and dist(eta,I)<rho/4','sourceAmplitude':'CSelected=(1+Q^300)^10*exp(Q^200)','conditionalNorm':'||(Phi,u)||_B_rho<=Q','conditionalContraction':'51*Q^-54'},
      'B8IndependentContinuousMatrixBounds':{'w':text(w),'detULower':text(detU),'detELower':text(detE),'inverseInfinityUpper':'2^68','quadraticInfinityUpper':'64','selectedRootRadiusGivenActualDebt':'30*2^-132','JacobianInverseGivenActualDebt':'2^69'},
      'C2IndependentContinuousMatrixBounds':{'detELower':text(detC2E),'inverseInfinityUpper':'2^30','quadraticInfinityUpper':'2^13'},
      'guardsAreImplicationsNotProofsOfActualFunctionalInputs':True,'originalN601Complete':False,'originalN602Complete':False}

def source_attempt(repo):
    from source_dag import verify_capture,open_header,definitions,stream_snapshot
    capture=verify_capture(repo);registry=definitions(open_header(repo));core=registry['fixed']['core'];systems=registry['quadratic']
    if len(systems)!=3 or [s['name'] for s in systems]!=['ActualSameN3B8','ActualSameN3C2I1','ActualSameN3C2I2Heat']:raise ValueError('Changed actual quadratic definitions')
    bindings=[]
    for name,expected in PRODUCERS.items():
        path='research-ide/mathscope-m2/navier/'+name;raw=read(repo,path)
        if sha(raw)!=expected:raise ValueError('Changed actual producer '+path)
        bindings.append({'path':path,'sha256':expected,'bytes':len(raw)})
    profile_raw=read(repo,'research-ide/mathscope-m2/navier/source-profile-data.mjs');profile=json.loads(re.search(rb'export const PINNED_N3 = (.*);',profile_raw).group(1));p=profile['parametersExactExpressions']
    expected={
      'Md':{'integer':1048576},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},'logP':{'product':[{'integer':2},{'ref':'T'}]},'Pstar':{'exp':{'ref':'logP'}},'K':{'power':[{'ref':'Pstar'},2]},
      'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'j0':{'power':[{'ref':'h'},4]},'muMoment':{'power':[{'ref':'h'},2]},
      'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},'rho':{'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},'Lambda':{'power':[{'ref':'Q'},64]},'BRefUpper':{'power':[{'ref':'Q'},300]},
      'logCSelected':{'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]},'CSelected':{'exp':{'ref':'logCSelected'}},
      'XR':{'product':[{'integer':110},{'power':[{'product':[{'ref':'CSelected'},{'ref':'Pstar'}]},10]}]},'sourceEnvelopeS':{'power':[{'ref':'CSelected'},100000]},'C12EnvelopeR':{'exp':{'power':[{'ref':'sourceEnvelopeS'},256]}},
      'radialFrequencyN':{'sum':[{'integer':1},{'ceil':{'power':[{'ref':'C12EnvelopeR'},50]}}]},'X0I2':{'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':-20}]}}]},'BOuter':{'product':[{'integer':1000},{'ref':'T'}]},
    }
    if any(p[k]!=v for k,v in expected.items()) or int(p['Q']['quotient'][0]['product'][0]['integer'])!=2**260:raise ValueError('Changed exact parameter tree')
    targets={2,474,4483,5029,*[core[k] for k in ['eta',*CORE_NAMES]]}
    for d in systems:
        targets.update(sum(d['linear'],[]));targets.update(sum(d['quadraticDiagonal'],[]));targets.update(d['rhs']);targets.add(d['scale'])
    cutoff=max(targets);nodes={}
    for ident,node in stream_snapshot(repo):
        if ident<=cutoff:nodes[ident]=node
    if verify_capture(repo)!=capture:raise ValueError('Original producer capture changed during source stream')
    if nodes[4483]!={'op':'actual_natural_series','args':['average',474,2,0,0]} or nodes[5029]!={'op':'actual_quadratic_root','args':[0,4,2]}:raise ValueError('Changed actual source gates')
    selected={};unknown={};cache={};active=set()
    def support(ident):
        if ident in cache:return cache[ident]
        if ident in active:raise ValueError('Cyclic source input')
        active.add(ident);n=nodes[ident];selected[ident]=n;a=n['args'];op=n['op'];out=set()
        if op=='coordinate':out.add(ident)
        elif op in ['rational','source_parameter']:pass
        elif op in ['add','multiply','smooth_piecewise']:
            for x in a:out.update(support(x))
        elif op in ['inverse','sqrt_positive','exp','log_positive','sine','cosine','integer_power','source_step_derivative']:out.update(support(a[0]))
        elif op=='definite_integral':out.update(support(a[0]));out.discard(a[1]);out.update(support(a[2]));out.update(support(a[3]))
        else:unknown[ident]=n;out.add('unproved:'+str(ident))
        active.remove(ident);cache[ident]=out;return out
    core_support={k:sorted(support(core[k]),key=str) for k in CORE_NAMES}
    core_only_eta=all(all(c==core['eta'] for c in coordinates) for coordinates in core_support.values())
    matrix_support=[];rhs_support=[]
    for j,d in enumerate(systems):
        ids=[*sum(d['linear'],[]),*sum(d['quadraticDiagonal'],[]),d['scale']]
        sup=set()
        for ident in ids:sup.update(support(ident))
        matrix_support.append({'system':j,'capturedCoordinates':sorted(sup,key=str),'coefficientsEtaIndependent':not sup})
        rhs_coordinates=set()
        for ident in d['rhs']:rhs_coordinates.update(support(ident))
        rhs_support.append({'system':j,'actualRhsRoots':d['rhs'],'primitiveCapturedCoordinatesAndUnprovedOperators':sorted(rhs_coordinates,key=str),'primitiveOnlyBodyClosureProved':all(isinstance(c,int) for c in rhs_coordinates),'capturesOnlyOriginalEtaProved':all(c==core['eta'] for c in rhs_coordinates),'unknownLimitOperatorsNeverReplacedByZero':True})
    y_node=nodes[474];exact_y=F(*map(int,y_node['args'])) if y_node['op']=='rational' else None
    return {'sourceCapture':capture,'sourceCaptureReverifiedAfterStream':True,'fullParentStreamVerified':True,'sourceProducerBindings':bindings,'sourceProfileDataSHA256':sha(profile_raw),
      'parameterExpressionSHA256':profile['parameterExpressionSHA256'],'exactParameterShapesChecked':sorted(expected),
      'actualGates':[{'sourceNode':i,'node':nodes[i],'sha256':digest(nodes[i])} for i in [4483,5029]],'actualNaturalYArgument':{'sourceNode':474,'node':y_node,'exactRationalValue':str(exact_y) if exact_y is not None else None,'withinWrittenNaturalRectangleVerified':exact_y is not None and 0<=exact_y<=F(41,10),'etaArgumentIsOriginalFormalEta':nodes[4483]['args'][2]==core['eta'],'domainClassStillRequiresActualBanachLemma':True},
      'originalFixedCore':{k:core[k] for k in ['eta',*CORE_NAMES]},'primitiveCoreCoordinateSupport':core_support,'corePrimitiveCaptureClosureVerified':core_only_eta,
      'naturalExternalArgumentsOnly':['Y','eta'],'naturalFormalEtaAndCoefficientFieldsAreLocalTable':True,
      'quadraticDefinitionBindings':[{'index':j,'definition':d,'sha256':digest(d)} for j,d in enumerate(systems)],'actualMatrixCoefficientCaptureAudit':matrix_support,'actualRhsCaptureAudit':rhs_support,
      'unreviewedInputOperators':[{'sourceNode':i,'node':n} for i,n in sorted(unknown.items())],
      'retainedPrefixNodes':len(nodes),'selectedPrimitiveInputNodes':len(selected),'selectedPrimitiveInputSHA256':digest([[i,n] for i,n in sorted(selected.items())])}

def missing_source_lemmas():
    return [
      {'id':'NS-BRHO-ACTUAL-OPERATOR','actualNodes':[4483],'domain':'eta in I=[-33/32,33/32], |Y|<=5; complex tube radius sigmaStar²/2048; evaluation radius rho/4',
       'statement':'The complete source A.21 measure has mass<=4K, all exact fixed core fields belong to B_rho with the displayed norms, and integrating the literal B.14/B.15 recurrence gives the original naturalRemainder operator on the complete radius-one ball. Then the newly recomputed bound tree supplies a unique limit with norm<=Q.',
       'smallestNextVerification':'Attach source-stage A.21 positive-measure mass bounds and exact B_rho operator/source recurrence identification; scalar checks alone do not establish this functional statement.','provedByThisAttempt':False},
      {'id':'B8-ACTUAL-FIVE-HISTORY-DEBT','actualNodes':[5029],'domain':'eta in [-1,1], source mu=h²,j=h⁴, selected CSelected and original B22/B26/B34/restoration history',
       'statement':'For every m=0,1,2, the actual five stored rhs derivatives obey ||partial_eta^m rhs||_infinity<=15h. The concrete source normalization is minus (dM/(XR*Keta), (dJ-4eta*dI)/(XR^(3/2)*Keta²), dI/(XR^(3/2)*Keta), (dS-8eta*dM)/(XR*Keta²), dCp/Keta²)/h².',
       'smallestNextVerification':'Prove the complete early error <=h³ and restored U discrepancy bounds (Gi-4eta)=(2h⁴,h⁴,h⁴) including every actual natural/finite integral endpoint; the new independent matrix and A.2 constants then remove branch/Jacobian uncertainty.','provedByThisAttempt':False},
      {'id':'I1-ACTUAL-C12-INPUT-ENVELOPE','domain':'Actual preserved J and loop interval, eta in [-1,1], phase in R modulo its smooth lifted inverse',
       'statement':'All actual profiles, reciprocals, moments, periodic primitives and cone gaps satisfy the C12_FREQUENCY_CONTRACT R-envelope for the exact R=exp(sourceEnvelopeS^256), N=1+ceil(R^50); this yields actual rhs<=R^13/N.',
       'smallestNextVerification':'Instantiate the upstream loop root/positive density estimates for the actual E,U,p1,p2 and complete forward moments; an assigned R parameter alone proves no envelope.','provedByThisAttempt':False},
      {'id':'I2-ACTUAL-IMPROPER-HEAT-DEBT','domain':'X>=Xtail*exp(1/5), eta in [-1,1] with original one-sided endpoint derivatives',
       'statement':'The complete original H5-H9 heat moment integrals and parameter derivatives converge under their source majorants and normalized rhs<=2^16/(lambda*X0I2).',
       'smallestNextVerification':'Verify the actual compactified integrands, endpoint improper majorants and normalization; a heat debt label or finite sample cannot prove this integral inequality.','provedByThisAttempt':False},
    ]

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--scalar-only',action='store_true');args=parser.parse_args()
    repo=Path(__file__).resolve().parents[3];out=Path(args.output);out.mkdir(parents=True,exist_ok=True);started=time.time();arithmetic=arithmetic_attempt()
    if not arithmetic['allExactImplicationChecksPassed']:raise ValueError('Independent exact scalar implication failed: '+str([x for x in arithmetic['checks'] if not x['pass']]))
    source=None if args.scalar_only else source_attempt(repo)
    result={'schema':'MathScope.N6.SeriesQuadraticAnalyticAttempt/1','status':'EXACT_SOURCE_SCALAR_IMPLICATIONS_ACTUAL_FUNCTIONAL_LEMMAS_OPEN','source':source,'arithmetic':arithmetic,'missingActualSourceLemmas':missing_source_lemmas(),
      'actualFunctionalInputEstimatesCertified':False,'sourceBanachNeighborhoodCertified':False,'actualUniqueZeroSeededBranchesCertified':False,'actualJacobianNonzeroCertified':False,'scalarOnly':args.scalar_only,
      'originalSourceFilesChanged':False,'serializedPassBitsUsedAsProof':False,'finiteIterateUsedAsRoot':False,'newLeanKernelProof':False,'originalN601Complete':False,'originalN602Complete':False,'original56of64CountChanged':False,'elapsedSeconds':time.time()-started}
    raw=(json.dumps(result,indent=2,ensure_ascii=False)+'\n').encode();(out/'series-quadratic-result.json').write_bytes(raw)
    print(json.dumps({'status':result['status'],'exactChecks':len(arithmetic['checks']),'allExactImplicationChecksPassed':True,'actualFunctionalInputEstimatesCertified':False,'artifact':'series-quadratic-result.json','artifactSHA256':sha(raw),'elapsedSeconds':result['elapsedSeconds']}))
if __name__=='__main__':main()
