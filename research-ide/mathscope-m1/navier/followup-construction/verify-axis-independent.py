#!/usr/bin/env python3
"""Independent exact-rational audit of the new infinite-axis bound certificate.

Uses Fraction arithmetic, positive series without fixed-point rounding, and
Bernstein polynomial positivity on a finite cover (rather than JS interval
arithmetic). This verifies the generated numeric bounds; it is not a claim that
the complete analytic premise bundle has been kernel formalized.
"""
from fractions import Fraction as F
from pathlib import Path
import hashlib,json,math,subprocess,datetime

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
JS="""import {certifyAxis,axisExampleInput} from './mathscope-m1/navier/followup-construction/axis-certificates.mjs';
const input=axisExampleInput(); console.log(JSON.stringify({input,result:certifyAxis(input)}));"""
run=subprocess.run(['node','--input-type=module','-e',JS],cwd=ROOT,text=True,capture_output=True,check=True)
bundle=json.loads(run.stdout); c=bundle['result']; checks=[]
def check(name,ok,detail=None):
    checks.append({'name':name,'pass':bool(ok),**({'detail':detail} if detail is not None else {})})
    if not ok: raise AssertionError(name)
def trim(p):
    while len(p)>1 and not p[-1]:p.pop()
    return p
def add(p,q):return trim([(p[i] if i<len(p) else F(0))+(q[i] if i<len(q) else F(0)) for i in range(max(len(p),len(q)))])
def sc(p,a):return trim([x*a for x in p])
def sub(p,q):return add(p,sc(q,-1))
def mul(p,q):
    r=[F(0)]*(len(p)+len(q)-1)
    for i,a in enumerate(p):
        for j,b in enumerate(q):r[i+j]+=a*b
    return trim(r)
def ppow(p,n):
    r=[F(1)]
    for _ in range(n):r=mul(r,p)
    return r
def bernstein(p,a,b):
    degree=len(p)-1
    shifted=[sum((p[j]*math.comb(j,k)*a**(j-k)*(b-a)**k for j in range(k,degree+1)),F(0)) for k in range(degree+1)]
    return [sum((shifted[k]*F(math.comb(i,k),math.comb(degree,k)) for k in range(i+1)),F(0)) for i in range(degree+1)]
def proves_nonnegative(p,a,b,strict=False,depth=0):
    lo=min(bernstein(p,a,b))
    if (lo>0 if strict else lo>=0):return True
    if depth>=14:return False
    mid=(a+b)/2
    return proves_nonnegative(p,a,mid,strict,depth+1) and proves_nonnegative(p,mid,b,strict,depth+1)

check('engine returned a local certificate',c['status']=='VERIFIED_LOCAL_BOUND_CERTIFICATE')
h=F(c['inputModel']['h']);j=F(c['inputModel']['j0']);K=F(c['inputModel']['pressure']['K'])
check('pressure sign and small real input hypotheses',0<h<=F(1,100) and 0<j<=F(1,20) and K>=4)
e=[F(0),F(1)];one=[F(1)];d=sub(one,ppow(e,2));U=add(sc(e,4),[j]);H=add(sc(e,F(1,2)-h),mul(d,U));den=add(one,ppow(e,2));Zden=ppow(den,3);A=F(1,2)+h
Znum=sub(sub(mul(sub(sc(mul(sub(one,sc(mul(e,U),2)),U),-A),sc(H,4)),Zden),sc(mul(e,d),4*K)),sc(mul(e,den),4*A*K))
cells=sorted(c['cutoff']['cells'],key=lambda q:F(q['eta']['lower']));delta=F(c['cutoff']['delta']);margin=F(c['cutoff']['positiveH2Margin']);sigma=F(c['cutoff']['sigma'])
check('cover begins and ends at the real parameter endpoints',F(cells[0]['eta']['lower'])==-1 and F(cells[-1]['eta']['upper'])==1)
check('cover has no gap or overlap',all(F(a['eta']['upper'])==F(b['eta']['lower']) for a,b in zip(cells,cells[1:])))
for i,v in enumerate(cells):
    lo=F(v['eta']['lower']);hi=F(v['eta']['upper'])
    if v['reason']=='abs(Z)>delta':
        sign=1 if F(v['Z']['lower'])>delta else -1
        valid=proves_nonnegative(sub(sc(Znum,sign),sc(Zden,delta)),lo,hi,strict=True)
    else:valid=proves_nonnegative(sub(ppow(H,2),[margin]),lo,hi)
    check(f'Bernstein proof of full cell {i+1}',valid)
check('strict sigma/chi selection',sigma>0 and sigma*sigma<=margin/400 and F(400,401)>F(99,100))

cc=c['complexInput'];r=F(cc['cauchyRadius']);t=F(cc['outerTubeRadius']);eps=F(cc['coefficientRadius']);W=F(11,10)
check('nested convex tube and Cauchy radii',t==2*r and 0<eps<r)
# Taylor displacement, obtained independently from the actual polynomial coefficients.
Hreal=sum(abs(v)*W**n for n,v in enumerate(H))
Hd=sum(abs(v)*sum(F(math.comb(n,k))*W**(n-k)*t**k for k in range(1,n+1)) for n,v in enumerate(H))
qdev=Hd*(2*Hreal+Hd);qlo=sigma*sigma-qdev;flo=1-2*W*t-t*t;Llo=1-2*h*(W+t)**2
check('complex polynomial displacement matches coefficient expansion',F(cc['denominatorPerturbation'])==qdev)
check('complex denominators separated on every point of the tube',qlo>0 and flo>0 and Llo>0 and qdev<=sigma*sigma/4)
check('reported denominator lower bounds',F(cc['denominatorLowerBounds']['H(z)^2+sigma^2'])==qlo and F(cc['denominatorLowerBounds']['1+z^2'])==flo and F(cc['denominatorLowerBounds']['L(z)'])==Llo)
loss=(1+eps/r)/(1-eps/r)**3
check('exact all-derivative Cauchy radius loss',F(cc['radiusLoss'])==loss)
for key,sup in cc['complexSuprema'].items():check(f'coefficient norm upper: {key}',F(cc['coefficientNormUpper'][key])>=F(sup)*loss)
check('chi multiplier norm upper',F(cc['chiNormUpper'])>=F(cc['chiComplexSupremum'])*loss)

def check_series(name,record):
    K0=F(record['K']);N=record['termsThrough'];scale=int(record['scale']);weighted=record['weightedBy']!='1'
    terms=[K0**n/F(math.factorial(n)*math.factorial(n+1)) for n in range(N+2)]
    if weighted:terms=[v*(n+1)**2 for n,v in enumerate(terms)]
    exact=sum(terms[:N+1],F(0));ratio=(K0*F(N+3,(N+2)**3) if weighted else K0/F((N+2)*(N+3)))
    tail=terms[N+1]/(1-ratio)
    check(name+' exact prefix enclosed by integer rounding',F(record['partialSumLowerScaled'])/scale<=exact<=F(record['partialSumUpperScaled'])/scale)
    check(name+' infinite tail by monotone next-term ratio',0<=ratio<1 and F(record['tailRatioUpper'])==ratio and F(record['tailUpperScaled'])/scale>=tail)
    check(name+' total integer norm upper',F(record['integerUpper'])>=exact+tail)
check_series('resolvent',c['resolvent']);check_series('reference solution',c['reference']['phiSeriesNormMajorant'])
check('factorial resolvent uses the official 2560 multiplier',F(c['resolvent']['K'])==2560*F(cc['chiNormUpper']))
check('reference Phi norm uses its all-alpha majorant',F(c['reference']['phiNormUpper'])>=loss*F(c['reference']['phiSeriesNormMajorant']['integerUpper']))

# Independent univariate polynomial majorant: all two-variable monomials are
# bounded on ||(Phi,u)||<=R by powers of R. Its derivative is a Lipschitz bound.
O={k:F(v) for k,v in c['controlled']['operatorNormUpper'].items()};D={k:[F(v)] for k,v in cc['coefficientNormUpper'].items()}
P=[F(0),F(1)];V=P;avg=sc(V,O['average'])
def product(x,y):return sc(mul(x,y),O['product'])
def op(name,x):return sc(x,O[name])
def bop(name,x,y):return sc(mul(x,y),O[name])
def scalar(q,x):return sc(x,math.ceil(abs(q)))
ac=add(add(D['wStar'],scalar(h,D['one'])),scalar(2*h,product(D['eta'],D['uStar'])))
aq=product(D['d'],D['normalizedGradient']);av=scalar(1-2*h,D['eta']);slow=scalar(2*h,D['eta'])
ax=add(add(scalar(A,D['one']),scalar(4*A,product(D['eta'],D['uStar']))),product(D['d'],D['uStarEta']));axq=scalar(2*A,D['eta'])
lin1=add(add(op('j2',product(ac,P)),bop('dot2',D['wStar'],P)),bop('param2',P,D['hStar']))
quad1=op('j2',product(product(aq,V),P))
slow1=add(add(add(add(op('j2',product(add(product(av,avg),product(slow,V)),P)),bop('param2',avg,product(D['d'],P))),bop('dot2',product(av,avg),P)),product(D['d'],bop('mixed2',avg,P))),bop('param2',P,product(D['d'],V)))
lin2=add(add(op('j1',product(ax,V)),bop('dot1',D['wStar'],V)),bop('param1',V,D['hStar']))
slow2=add(add(add(op('j1',product(axq,product(V,V))),bop('dot1',product(av,avg),V)),product(D['d'],bop('mixed1',avg,V))),bop('param1',V,product(D['d'],V)))
amp=[F(math.ceil(loss))];source=product(product(amp,amp),product(P,P))
pressure=op('j1',add(add(product(scalar(4*A,D['eta']),op('primitive',source)),product(D['d'],op('parameterPrimitive',source))),product(scalar(2,D['eta']),op('mulY',source))))
first=sc(product(D['inverseL'],add(add(lin1,quad1),slow1)),F(c['resolvent']['integerUpper']));second=product(D['inverseL'],add(add(lin2,slow2),pressure));poly=add(first,second)
R=F(c['controlled']['argumentNormUpper']);B=sum(v*R**n for n,v in enumerate(poly));L=sum(n*v*R**(n-1) for n,v in enumerate(poly) if n)
check('independent polynomial evaluation equals Controlled bound',B==F(c['controlled']['remainderBound']))
check('polynomial derivative equals Controlled Lipschitz bound',L==F(c['controlled']['remainderLipschitz']))
lam=F(c['selectedParameters']['Lambda']);nerr=B/(2*lam)
check('actual scalar Banach hypotheses',lam>=1+B+L and nerr<=1 and L/(2*lam)<=F(1,2))
check('computed C satisfies the complex exponential normalization',F(c['selectedParameters']['logC'])>=lam*F(cc['phaseRealPartUpper'])+1)
check('uniform phi error includes evaluation norm',F(c['bounds']['uniformPhiError']['exact'])==nerr/(1-F(41,200)))
cubic=[F(1),-F(1,4),F(1,48),-F(1,1152)];lower=F(305719,1152000)
check('whole-interval cubic lower bound via Bernstein proof',proves_nonnegative(sub(cubic,[lower]),F(0),F(41,10)))
check('global derivative upper is negative',-F(1,4)+F(41,10)/24==-F(19,240)<0 and F(41,60)<1)
check('uniform positivity is stronger than 1/4',F(c['bounds']['uniformPhiPositiveLower']['exact'])==lower-F(c['bounds']['uniformPhiError']['exact'])>F(1,4))

M=F(c['tails']['solutionNormUpper']);N=c['tails']['degree'];sample_eta=F(c['inputModel']['sampleEta'])
Heta=sum(v*sample_eta**n for n,v in enumerate(H));chi=Heta**2/(Heta**2+sigma**2)
for i,row in enumerate(c['tails']['rows']):
    Y=F(row['Y']);check(f'exact original radius retained {i}',F(row['X'])==Y/lam)
    if not Y:check('axis zero tails',F(row['phiTailUpper'])==0 and F(row['mixedDerivative']['upper'])==0);continue
    for k,m,key in [(0,0,'phi'),(row['mixedDerivative']['radial'],row['mixedDerivative']['eta'],'mixed')]:
        def term(n):return M*math.factorial(m)*eps**(-m)*math.comb(n+m,m)*F(math.factorial(n),math.factorial(n-k))*Y**(n-k)/(20**n*(n+1)**2*(m+1)**2)
        exact_prefix=sum((term(n) for n in range(N+1,N+41)),F(0));q=(Y/20)*F(N+2+m,N+2-k);analytic=term(N+1)/(1-q)
        supplied=F(row['phiTailUpper'] if key=='phi' else row['mixedDerivative']['upper'])
        check(f'{key} derivative infinite-tail formula {i}',q<1 and supplied==analytic and supplied>=exact_prefix)
    x=Y*chi;f0=sum(((-x/2)**n/F(math.factorial(n)*math.factorial(n+1)) for n in range(80)),F(0))
    fbox=row['comparisonEnclosure'];pbox=row['normalizedProfileEnclosure'];err=nerr/(1-Y/20)
    check(f'independent f0 series enclosed {i}',F(fbox['lower'])<f0<F(fbox['upper']))
    check(f'nonlinear interval includes bound at radius {i}',F(pbox['lower'])==F(fbox['lower'])-err and F(pbox['upper'])==F(fbox['upper'])+err)

check('no promotion to old jet or full witness',all(c['gates'][k] is False for k in ['existingFiniteJetLinked','completedOuterPressureLinked','globalWitness','fullProfileCertified','fullCertificateKernelChecked']))
payload={'schema':'MathScope.Navier.AxisIndependentAudit/1','checkedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Python Fraction arithmetic, exact polynomial Bernstein positivity, unrounded positive series and independent polynomial/Lipschitz expansion','checks':checks,'pass':sum(x['pass'] for x in checks),'total':len(checks),'source':{'file':'axis-certificates.mjs','sha256':hashlib.sha256((HERE/'axis-certificates.mjs').read_bytes()).hexdigest()},'scope':'Generated exact local bound certificate; no complete Lean analytic-premise proof or global witness claim.'}
(HERE/'axis-default-certificate.json').write_text(json.dumps(bundle,ensure_ascii=False,indent=2)+'\n')
(HERE/'axis-independent-validation.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pass':payload['pass'],'total':payload['total'],'status':'PASS','output':str(HERE/'axis-independent-validation.json')},indent=2))
