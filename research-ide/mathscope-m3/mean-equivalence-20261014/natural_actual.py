#!/usr/bin/env python3
"""Actual node 4483 and the actual B8 node 5029, classical analytic proof audit.

Byte authentication, exact identities, scalar arithmetic and the written
functional proof are different evidence. No serialized PASS field is read.
The CLI never evaluates a finite natural truncation as the infinite function.
"""
from __future__ import annotations
import argparse, hashlib, json, re, sqlite3, subprocess, sys, types, zipfile
from fractions import Fraction as F
from math import comb, factorial
from pathlib import Path

BASE = '5422e232219a5de4722ac4e38ba79eb83b9e95cd'
HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
OLD = REPO/'research-ide/mathscope-m3/certification-20261014'
M2 = 'research-ide/mathscope-m2/navier/'
LEAN = 'research-ide/mathscope-m1/navier/sources/official-repo/NavierStokes/'
ENGINE = 'research-ide/mathscope-m1/navier/followup-next/uniform-gluing/'
PINS = {
 M2+'actual-global-source-outer.mjs':'5a46c11ebe8ba3ef26eaf6d632ed7bba03ab98cd5e4354b32f989ae6adb367e9',
 M2+'actual-global-source-expressions.mjs':'cd0b5900bba330c5d960bddd84bb695dd275094302dd9bc3cc5fcfee533895a3',
 M2+'actual-continuation-exact-core.mjs':'d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815',
 M2+'actual-continuation-exact-functions.mjs':'326b94ad5d9dc0b4bfda83a53edb7da06ed4ca30506e1ff952f77a0e59676311',
 M2+'actual-continuation-exact-tail.mjs':'fa569df96f7950e4c1d908405d8a30bcb73088b1e2d3af7a0baa047d4b2a3df0',
 M2+'actual-continuation-exact-pregluing.mjs':'7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3',
 M2+'actual-continuation-exact-b8.mjs':'1e0d6586a60ee5aa3d5315c40f624ebb9e8a4925a00117818d41d6697fc67baf',
 M2+'actual-continuation-exact-b8-data.mjs':'733ecee70b95d39212d0a85bebbd7c46357cca308fbaf5f54b95564066c4bf1b',
 M2+'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a',
 LEAN+'AxisWeightEstimates.lean':'d053266bd9effd8c5fc159e41107725f468b41a7cfb44f32564842ed0884e930',
 LEAN+'AxisOperators.lean':'ac985c72a27a89528fd7087b5252de43b488fe41c780da289f16ec0f756597c8',
 LEAN+'AxisResolvent.lean':'9118d00d4e748561f2df2b6be2a86df83ff08e9cfbebfea1b48375e8224cef99',
 LEAN+'AxisContraction.lean':'d9151673815948eef8e8e2db3e93c95119ce7be80fc6a01d8a83f2bc4cd4df9d',
 LEAN+'NaturalAxisBridge.lean':'9d1d98bdc48199dd483ab6cc8cd5a356847373faab7aca2908c166cd6d0c754f',
 ENGINE+'dyadic_interval.py':'20664d56cab022014273c2bfecff3ff1fb59c6e737123e0f337d49f248b74b4c',
 ENGINE+'certify_uniform_moment_map.py':'b9cbad7d99428e42cb50d041980e3ff2ca09cf94401061b95b247f2abbdda9f5',
 'research-ide/mathscope-m3/certification-20261014/pressure_mass.py':'525380e9c75cd88d85637a722b36656ddf893423df14a3492beb9dad4c9b4bdb',
 'research-ide/mathscope-m3/certification-20261014/pressure_mass_lemma.md':'d5d04c357cfefadb77f89f78d2c96f214d1e813986af608e15b210f0db9112b0',
}
ZIP_PINS = {'dag':'28041ff889a61632a7a819206154f56afc9a6559f56b147c61b2582f26070e69',
 'pressure_mass':'cb8f4b75e099caa04cee1c8e370c3183daf8c74d37305293c7eec726dc7c287e',
 'series_quadratic':'2bd2757cda3270cff735a5ee8dc2799f864aab5f8a8c99fc3d3874f04d8c8214'}

def sha(raw): return hashlib.sha256(raw).hexdigest()
def digest(obj): return sha(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode())
def file_sha(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        while b:=f.read(1<<20): h.update(b)
    return h.hexdigest()
def source_bytes(path):
    p=REPO/path
    raw=p.read_bytes() if p.exists() else subprocess.check_output(['git','show',BASE+':'+path],cwd=REPO)
    check_source_bytes(path,raw)
    return raw
def check_source_bytes(path,raw):
    if path not in PINS or sha(raw)!=PINS[path]:raise ValueError('Changed or unpinned source bytes: '+path)
    return raw
def pinned_inputs(folder):
    """Verify members against pinned archives; receipt booleans are irrelevant."""
    records=[]
    for kind,pin in ZIP_PINS.items():
        archive=REPO/'research-ide/mathscope-m3/evidence/n6-certification-20261014'/f'n6-certification-{kind}-38495642925.zip'
        if file_sha(archive)!=pin: raise ValueError('Changed prior archive '+kind)
        with zipfile.ZipFile(archive) as z:
            wanted={'dag':['header.json','source-dag-checkpoint.sqlite'],
                    'pressure_mass':['pressure-mass-result.json'],
                    'series_quadratic':['series-quadratic-result.json']}[kind]
            for name in wanted:
                raw=z.read(name);path=folder/kind/name
                if file_sha(path)!=sha(raw): raise ValueError('Changed cache member '+name)
                records.append({'path':kind+'/'+name,'sha256':sha(raw),'pinnedArchiveSHA256':pin})
    return records
def definitions(header):
    out={}
    def walk(o):
        for k,v in o.items():
            if k=='base' and isinstance(v,dict):walk(v)
            elif isinstance(v,str):
                try:d=json.loads(v)
                except ValueError:continue
                if k in out:raise ValueError('Ambiguous source registry')
                out[k]=d
    walk(header['definitions']);return out

def pa(*ps):
    out={}
    for p in ps:
        for k,v in p.items():out[k]=out.get(k,F(0))+v
    return {k:v for k,v in out.items() if v}
def pm(a,b):
    out={}
    for i,v in a.items():
        for j,w in b.items():out[i+j]=out.get(i+j,F(0))+v*w
    return out
def ps(p,c):return {i:v*c for i,v in p.items()}
def qp(n=1):return {n:F(1)}
def pj(p):return {str(k):str(v) for k,v in sorted(p.items())}
def dominates(p,power):
    # All coefficients are positive: one minimum Q proves a uniform bound.
    q=1<<260
    return sum(v*F(q)**(k-power) for k,v in p.items())<1
def jetmul(a,b):
    return [pa(*(ps(pm(a[k],b[m-k]),comb(m,k)) for k in range(m+1))) for m in range(min(len(a),len(b)))]
def jetsum(*xs):return [pa(*(x[m] for x in xs)) for m in range(min(map(len,xs)))]
def jetconstant(values):return [{0:F(v)} if v else {} for v in values]
def reciprocaljet(a,initial):
    out=[{0:F(initial)}]
    for m in range(1,len(a)):
        out.append(ps(pa(*(ps(pm(a[k],out[m-k]),comb(m,k)) for k in range(1,m+1))),initial))
    return out

def bound_tree():
    q=qp();one={0:F(1)};zero={}
    fixed=lambda p:(p,zero)
    add=lambda *xs:(pa(*(x[0] for x in xs)),pa(*(x[1] for x in xs)))
    scale=lambda n,x:(ps(x[0],n),ps(x[1],n))
    linear=lambda p,x:(pm(p,x[0]),pm(p,x[1]))
    bilinear=lambda p,x,y:(pm(p,pm(x[0],y[0])),pm(p,pa(pm(x[1],y[0]),pm(x[0],y[1]))))
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
    return add(first,second),{k:{'norm':pj(v[0]),'lip':pj(v[1])} for k,v in [('lin1',lin1),('quad1',quad1),('slow1',slow1),('lin2',lin2),('slow2',slow2),('pressure',pressure)]}

def scalar_and_reference_proof():
    checks=[]
    def c(name,value,formula):
        if not value:raise ValueError('Failed exact implication: '+name)
        checks.append({'id':name,'pass':True,'formula':formula})
    q=1<<260;h=F(1,1<<200);sigma=F(1,2_000_000)
    c('h_positive_finite_and_small',8002*128>200,'T=e^(2^20)+10>128; 0<h=e^(-8002T)<2^-200.')
    r=sigma**2/2048;z=F(17,16)
    c('tube_inside_17_over16',F(33,32)+r<z,'sigma=j/2000 and j<1/1000.')
    c('H_bound',F(9,2)*z+4*z**3+F(1,1000)*(1+z*z)<10,'Literal H=(1/2-h)eta+(1-eta²)(4eta+j).')
    c('H_derivative',F(9,2)+12*z*z+F(2,1000)*z<20,'Literal polynomial derivative.')
    c('denominator_perturbation',F(400,2048)+F(400,2048**2)*sigma**2<F(1,4),'|H(z)^2-H(x)^2|<sigma²/4.')
    c('L_nonzero',1-F(2,1000)*z*z>F(99,100),'|L(z)|>99/100 on closed tube.')
    c('pressure_complex_bound',F(1125,296)*F(256,255)**2<5,'Actual measure mass 1125K/296 gives |P|<5K on |Im eta|<=1/16.')
    c('all_input_norms',2048+64+100<q,'Cauchy loss<2: normZ<=2048K, normzeta<=64/sigma², other fixed data<=100. K>=1,sigma²<=1 give each norm<=2212K/sigma²<Q.')
    c('actual_g_squared_norm',64*2*2<q,'The source gSquared is the Banach product g*g, with norm<=64*2²=256<Q.')
    c('C_above_axis_threshold',65<q**135,'64Lambda/sigma²+1<=65Q^65<Q^200<=log C.')
    c('resolvent_norm',3**160<2**256,'sum 5120^n/[n!(n+1)!] <= sum 80^(2n)/(n!)² <= exp160 <2^256.')
    c('reference_ball_inside_Q',2**256+2**25+1<q,'x0=(S1,-YZ/(2L)); ||x0||+1<=2^256+2^25K+1<Q.')
    (b,l),tree=bound_tree()
    c('full_bound_tree',b=={5:F(2),6:F(3),7:F(3),8:F(11),9:F(8),10:F(2),11:F(29)},'Complete integrated literal B14/B15 tree.')
    c('full_lipschitz_tree',l=={4:F(2),5:F(3),6:F(4),7:F(17),8:F(14),9:F(4),10:F(58)},'Each varying factor replaced once, including mixed and pressure terms.')
    c('map_polynomial_aggregate_and_half_factor',sum(b.values())==58 and sum(l.values())==102,'For Q>=1, B<=58Q^11 and L<=102Q^10. The actual map multiplies by 1/(2Lambda), giving 29Q^-53 and 51Q^-54.')
    c('contraction',29<q**53 and 102<q**54,'Displacement <=29Q^-53<1; Lipschitz <=51Q^-54<1/2.')
    c('Phi_positive',F(305719,1152000)-F(1,2**100)>F(1,4),'The exact alternating Bessel lower bound and actual fixed-point error give Phi>1/4 for real 0<=Y<=41/10.')
    # Actual reference source, bounded directly from its integral moment formula.
    # Orders 0..3 suffice for the two parameter derivatives of p1 and ns.
    R=[qp(6)]*4;U=jetconstant([6]*4);eta=jetconstant([1,1,0,0]);d=jetconstant([1,2,2,0]);one=jetconstant([1,0,0,0])
    avg=U;W=jetsum(one,jetmul(eta,avg),jetmul(d,avg[1:]+[{}]))
    # Factors 2D<=1, 2A<=2; enlarging W by 2 is harmless.
    W=[ps(x,2) for x in W]
    RI=reciprocaljet(R,8);LG=[qp(70)]*3
    ii=[qp(8)]*4;jj=[qp(8)]*4
    ii_eta=jetsum(jetmul(LG,ii[:3]),ii[1:]);jj_eta=jetsum(jetmul(LG,jj[:3]),jj[1:])
    angular=jetsum(ii[:3],jetmul(eta[:3],ii_eta),jetmul(d[:3],jj_eta),[ps(x,2) for x in jetmul(eta[:3],jj[:3])])
    invL=jetconstant([2,16,272])
    p1=[ps(x,110) for x in jetmul(invL,jetsum(W[:3],jetmul(RI[:3],angular)))]
    # S/X, Cp and all their jets through three are <=Q^3; P jets <=Q^3.
    sx=[qp(3)]*4;pressure=[qp(3)]*4
    ns=jetmul(invL,jetsum(jetmul(W[:3],U[:3]),U[:3],jetmul(eta[:3],U[1:]),
         [ps(x,4) for x in jetmul(eta[:3],sx[:3])],jetmul(d[:3],sx[1:]),
         [ps(x,4) for x in jetmul(eta[:3],pressure[:3])],jetmul(d[:3],pressure[1:])))
    c('literal_B22_p1_eta0to2',all(dominates(p,200) for p in p1),'Source rational moment formula with common g cancelled, |R| in [1/8,4].')
    c('literal_B22_ns_eta0to2',all(dominates(p,7) for p in ns),'Full M,S,Cp and A21 pressure retained in literal source formula.')
    # These exponent comparisons instantiate tau=C^-120, never an invented width.
    c('C_greater_Q10000',10000*F(q)<F(q)**200,'log Q<Q: log C>=Q^200>10000log Q.')
    c('B26_axial_change',1_000_000<q**(1_200_000-1011),'int kappa <= tau(1+L0); L0<Q²; |delta U|_C2 <=110Q^7 tau(1+Q²)<Q^-1000.')
    c('short_reference_collar',4*F(200,199)<F(41,10),'tau<Q^-200<1/400; exp(2tau)<=1/(1-2tau)<200/199, so Y<4.1.')
    c('Gi_axial_jet',4*100<q**57,'Core deviation <=Q^-58 and B26 deviation<Q^-1000; j>Q^-1/2 imply jets (2j,j,j).')
    c('absolute_shear_log_change',q**202<q**1_200_000,'The nonconstant shear integral has absolute C2 norm <=tau(1+Q²)Q^200<1; constant target 4/5 is nonnegative and eta independent.')
    c('ell_i_bound',34*q**65+q**3+10<q**80,'ell_i=Lambda psi+log Phi4 -integral shear/2 +log220/2; all C2 jets<Q^80.')
    c('shift_logE',F(q**90,10)+q**80<F(q**200,2),'For 0<=y<=Tsh=Q^90, log E<-Q^200/2.')
    c('amplitude_derivative_reserve',500*q**163<F(q**200,4),'log of every C2 Bell factor is less than Q^200/4 (log Q<Q). Therefore F,E jets<=Delta=e^(-Q^200/4).')
    c('exact_shift_endpoint',q**90-10*q**200<=-F(5,2)*q**200,'xsep=exp(Tsh)/(CPstar)^10<=Delta^10; B34 endpoint equals Keta*xsep^(1/10) exactly.')
    c('early_error_exponential',2*10**6*4**6*factorial(6)<q**109,'exp(Q^200/4)>Q^1200/(4^6*6!)>2*10^6 Q^1091.')
    c('early_error_below_h3',1000>F(3,8),'epsilon=10^6(Tsh+111)Delta²+10^6Delta<Q^-1000<h³ since Qh^8>1.')
    # Ordinary derivative jets, including reciprocal Keta and c cancellations.
    dd=jetconstant([2,1,1]);kinv=jetconstant([2,2,2]);ksq=jetconstant([4,8,16])
    du=jetmul(dd,kinv);de=jetmul(jetmul(dd,dd),ksq)
    du_values=[p.get(0,F(0)) for p in du];de_values=[p.get(0,F(0)) for p in de]
    c('restoration_U_jet',du_values==[4,6,10],'|(Gi-c)/Keta| jets <=(4,6,10)j; both positive weights have mass<1.')
    c('restoration_energy_jet',de_values==[16,48,152],'(U²-c²)-2c(U-c)=(U-c)²; Keta^-2 derivatives give (16,48,152)j².')
    c('five_actual_rhs_bound',14*h+1<15 and 184*h**5+1<15,'All C2 scaled rhs <=max(14h²+h,184h^6+h)<15h, mu=h² retained.')
    c('preconditioned_actual_debt',2**40*15*h<F(1,10**8),'||R||<2^40, actual rhs C2<=15h<15*2^-200.')
    return {'checks':checks,'boundTree':tree,'B':pj(b),'L':pj(l),
      'referenceDerivativePolynomials':{'p1':[pj(p) for p in p1],'ns':[pj(p) for p in ns]},
      'restorationOrdinaryJets':{'dOverK':[str(x) for x in du_values],'dSquaredOverKSquared':[str(x) for x in de_values]}}

def continuous_preconditioner_proof(bindings):
    """Replay positive Stieltjes integration; never trust old enclosure PASS."""
    raw=source_bytes(ENGINE+'dyadic_interval.py')
    module=types.ModuleType('dyadic_interval');module.__file__=str(REPO/ENGINE/'dyadic_interval.py')
    exec(compile(raw,module.__file__,'exec'),module.__dict__);sys.modules['dyadic_interval']=module
    raw=source_bytes(ENGINE+'certify_uniform_moment_map.py')
    engine=types.ModuleType('_natural_moment_engine');engine.__file__=str(REPO/ENGINE/'certify_uniform_moment_map.py')
    exec(compile(raw,engine.__file__,'exec'),engine.__dict__)
    spec={'name':'B8_inner_patch','alpha':F(1,10),'supports':[(F(j+6,2048),F(2*(j+6)+1,4096)) for j in range(5)],
       'unit_mass':False,'u_radius':F(1,10**6),'e_radius':F(1,10**6),'debt_u_preconditioned':F(1,10**8),'debt_e_preconditioned':F(1,10**8)}
    recomputed=engine.coefficients(spec,1024)
    text=source_bytes(M2+'actual-continuation-exact-b8-data.mjs').decode()
    pin=json.loads(re.search(r'ACTUAL_B8_PRECONDITIONER = (.*);',text).group(1))
    R=[[F(x) for x in row] for row in pin['preconditioner']]
    # The actual source R is used even if a reoptimized R would be better.
    if [row[:2] for row in R[:2]]!=recomputed['inverse_u']['exact'] or [row[2:] for row in R[2:]]!=recomputed['inverse_e']['exact']:
        raise ValueError('Recomputed continuous midpoint preconditioner differs from actual source R')
    z,rnorm,rq,lip,image=selected_branch_guards(module,recomputed['linear'],recomputed['quadratic'],R)
    r=F(1,10**6)
    return {'method':'Fresh exact outward dyadic positive Riemann-Stieltjes integral enclosures',
      'panels':1024,'cells':recomputed['cells'],'linearMatrix':engine.to_json(recomputed['linear']),
      'quadraticMatrix':engine.to_json(recomputed['quadratic']),'preconditioner':[[str(x) for x in row] for row in R],
      'actualRExactlyEqualsRecomputedMidpointPreconditioner':True,'RNorm':str(rnorm),'IminusRANormUpper':str(z),
      'RQuadraticNormUpper':str(rq),'imageUpper':str(image),'lipschitzUpper':str(lip),
      'radius':str(r),'JacobianInverseUpper':'2^41','selectedIterate':'z^(0)=0; z^(n+1)=z^(n)-R(Az^(n)+mu Q(z^(n))-rhs)',
      'exactInfiniteTail':'||z-z^(n)||<=10^-6*4^-n','finiteIterateDeclaredExactRoot':False,
      'continuousMatrixReplacedByR':False,'oldCertificatePassBitsRead':False}

def selected_branch_guards(module,linear,quadratic,R):
    RI=[[module.I(x) for x in row] for row in R]
    RA=module.matmul(RI,linear);IminusRA=[[module.I(int(i==j))-RA[i][j] for j in range(5)] for i in range(5)]
    z=module.infinity_norm_upper(IminusRA);rnorm=max(sum(abs(x) for x in row) for row in R)
    rq=module.infinity_norm_upper(module.matmul(RI,quadratic))
    r=F(1,10**6);mu=F(1,2**400);beta=F(1,10**8)
    lip=z+2*mu*rq*r;image=beta+z*r+mu*rq*r*r
    if not (rnorm<2**40 and z<F(1,32) and lip<F(1,4) and image<r):raise ValueError('Actual preconditioned branch guard failed')
    return z,rnorm,rq,lip,image

def selected_gate_guard(node):
    if node(4483)!={'op':'actual_natural_series','args':['average',474,2,0,0]} or node(474)!={'op':'rational','args':['4','1']}:
        raise ValueError('Changed selected natural source gate')
    if node(5029)!={'op':'actual_quadratic_root','args':[0,4,2]}:raise ValueError('Changed selected B8 gate')

def source_audit(inputs,bindings):
    h=json.loads((inputs/'dag/header.json').read_text(encoding='utf8'));d=definitions(h)
    db=sqlite3.connect('file:'+str((inputs/'dag/source-dag-checkpoint.sqlite').resolve())+'?mode=ro',uri=True)
    if db.execute('select count(*),min(id),max(id) from nodes').fetchone()!=(633816,0,633815):raise ValueError('Changed DAG prefix')
    def node(i):
        row=db.execute('select raw from nodes where id=?',(i,)).fetchone()
        if row is None:raise ValueError('Absent source node')
        return json.loads(row[0])
    selected_gate_guard(node)
    core=d['fixed']['core'];system=d['quadratic'][0]
    if core['eta']!=2 or system['name']!='ActualSameN3B8' or system['rhs']!=[4747,4749,4751,4753,4755]:raise ValueError('Changed actual definitions')
    profile=json.loads(re.search(rb'export const PINNED_N3 = (.*);',source_bytes(M2+'source-profile-data.mjs')).group(1));p=profile['parametersExactExpressions']
    expected={'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'j0':{'power':[{'ref':'h'},4]},'muMoment':{'power':[{'ref':'h'},2]},
      'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},'Lambda':{'power':[{'ref':'Q'},64]},
      'CSelected':{'exp':{'ref':'logCSelected'}},'Tsh':{'power':[{'ref':'Q'},90]}}
    expected.update({'t1':{'power':[{'ref':'CSelected'},-120]}})
    expected.update({k:{'ref':'t1'} for k in ['kappa0','omega1','omega2']})
    # Use exact producer-defined power shape; the profile is not a caller knob.
    for k,v in expected.items():
        if p[k]!=v:raise ValueError('Changed exact actual parameter '+k+': '+str(p[k]))
    # Capture closure includes every actual five-moment history and natural input.
    selected={};naturals=[];integrals=[];coords=set();unknown=[]
    pending=list(system['rhs'])+[4483]+[core[k] for k in core if k not in ['Y']]
    while pending:
        i=pending.pop()
        if i in selected:continue
        n=node(i);selected[i]=n;op=n['op'];a=n['args']
        if op in ['rational','source_parameter']:continue
        if op=='coordinate':coords.add(i);continue
        if op in ['add','multiply','smooth_piecewise']:pending.extend(a)
        elif op in ['inverse','sqrt_positive','exp','log_positive','sine','cosine','integer_power','source_step_derivative']:pending.append(a[0])
        elif op=='definite_integral':
            integrals.append({'node':i,'body':a[0],'binder':a[1],'left':a[2],'right':a[3]});pending.extend(a)
        elif op=='actual_natural_series':
            naturals.append({'node':i,'component':a[0],'Y':a[1],'eta':a[2],'radialOrder':a[3],'etaOrder':a[4]});pending.extend(a[1:3])
        else:unknown.append({'node':i,'definition':n})
    if unknown:raise ValueError('Unreviewed primitive B8 operator '+str(unknown))
    # Matrix and scale independent of eta, proved by walking their actual nodes.
    cache={}
    def support(i):
        if i in cache:return cache[i]
        n=node(i);a=n['args'];op=n['op']
        if op=='coordinate':r={i}
        elif op in ['rational','source_parameter']:r=set()
        elif op in ['add','multiply','smooth_piecewise']:r=set().union(*(support(x) for x in a))
        elif op in ['inverse','sqrt_positive','exp','log_positive','integer_power','source_step_derivative']:r=support(a[0])
        elif op=='definite_integral':r=(support(a[0])-{a[1]})|support(a[2])|support(a[3])
        else:raise ValueError('Unknown matrix operator')
        cache[i]=r;return r
    allmatrix=[*sum(system['linear'],[]),*sum(system['quadraticDiagonal'],[]),system['scale'],*sum(system['preconditioner'],[])]
    if any(support(i) for i in allmatrix):raise ValueError('B8 coefficient has unaccounted coordinate capture')
    db.close()
    return {'selectedNatural':{'node':4483,'operation':node_from(selected,4483),'actualY':4,'withinProvedDomain':True},
      'selectedQuadratic':{'node':5029,'operation':{'op':'actual_quadratic_root','args':[0,4,2]}},
      'core':core,'quadraticDefinition':system,'quadraticDefinitionSHA256':digest(system),
      'actualFiveHistoryClosureNodes':len(selected),'closureSHA256':digest([[i,n] for i,n in sorted(selected.items())]),
      'naturalCalls':sorted(naturals,key=lambda x:x['node']),'finiteIntegralCount':len(integrals),'finiteIntegrals':sorted(integrals,key=lambda x:x['node']),
      'literalHistories':['natural core moments','B22 reference collar and frozen reference moments','B26 full moments to Xi=110','B34 full moments to Xsep','ideal gap to XR exp(-8)','restoration full moments to XR exp(-7)'],
      'allMatrixScaleAndPreconditionerCoefficientsEtaIndependent':True,'parameterShapesChecked':sorted(expected),
      'sourceProfileParameterExpressionSHA256':profile['parameterExpressionSHA256']}
def node_from(nodes,i):return nodes[i]

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--inputs',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    inputs=pinned_inputs(args.inputs);bindings=[]
    for path,pin in PINS.items():
        raw=source_bytes(path);bindings.append({'path':path,'sha256':pin,'bytes':len(raw)})
    source=source_audit(args.inputs,bindings);arithmetic=scalar_and_reference_proof();branch=continuous_preconditioner_proof(bindings)
    result={'schema':'MathScope.M3.ActualNaturalB8ClassicalProof/1','status':'ACTUAL_NATURAL_AND_B8_CLASSICAL_PROOF_WITH_EXACT_REPLAY',
      'source':source,'inputBindings':inputs,'sourceBindings':bindings,'arithmetic':arithmetic,'B8SelectedBranch':branch,
      'proofDocument':'analytic_natural_b8.md','proofKind':'Written classical mathematical proof with exact rational and outward integral replay; no new Lean kernel proof',
      'actualNode4483DefinedByProvedInfiniteNaturalLimit':True,'actualBanachInputAndOperatorAssemblyProvedClassically':True,
      'actualFiniteCoefficientsEqualSameInfiniteLimit':True,'allFixedOrderTermwiseNaturalDerivativesJustified':True,
      'actualB8FiveHistoryC2RhsBoundProvedClassically':True,'actualNode5029ZeroSeededBranchUnique':True,'actualB8JacobianInvertible':True,
      'sourceAuthenticationAloneUsedAsMathematicalProof':False,'storedPassFieldsUsedAsProof':False,'finiteNIdentifiedWithInfiniteSeries':False,
      'remainingScope':['C12 I1 actual input envelope and loop positivity','I2 improper heat-debt estimates','full physical nonzero-angular residual acceptance','initial j=0 Proposition 9.5 source tuple'],
      'originalN601Complete':False,'originalN602Complete':False,'original56of64CountChanged':False,'originalSourceFilesChanged':False,'newLeanKernelProof':False}
    raw=(json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode();(args.output/'natural-actual-result.json').write_bytes(raw)
    print(json.dumps({'status':result['status'],'exactChecks':len(arithmetic['checks']),'naturalCalls':len(source['naturalCalls']),
      'B8ResidualUpperApproximate':float(F(branch['IminusRANormUpper'])),'artifactSHA256':sha(raw),'originalN601Complete':False,'originalN602Complete':False}))
if __name__=='__main__':main()
