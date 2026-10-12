"""Independent 80-digit decimal/NumPy oracles; no JavaScript numerical imports."""
from decimal import Decimal as D, getcontext
from pathlib import Path
import json, math, itertools
import numpy as np
getcontext().prec = 80
ROOT = Path(__file__).resolve().parent.parent / 'evidence'
data = json.loads((ROOT/'certification-fixtures.json').read_text())
records=[]
def d(v):
    if isinstance(v,str) and '/' in v:
        a,b=v.split('/');return D(a)/D(b)
    return D(v)
def interval_has(interval,value):
    return d(interval['lower']) <= value <= d(interval['upper'])
def record(name,ok,**extra):
    records.append(dict(name=name,passed=bool(ok),**extra))
    assert ok, (name,extra)
def atan(x):
    sign=1
    if x<0:sign=-1;x=-x
    doubling=0
    while x>D('.1'):
        x=x/(1+(1+x*x).sqrt());doubling+=1
    term=x;out=x
    for k in range(1,400):
        term=-term*x*x;delta=term/D(2*k+1);out+=delta
        if abs(delta)<D('1e-75'):break
    return sign*(D(2)**doubling)*out
PI=16*atan(D(1)/5)-4*atan(D(1)/239)
def sincos(x):
    x=x-(x/(2*PI)).to_integral_value()*(2*PI)
    sine=x;cosine=D(1);st=x;ct=D(1)
    for k in range(1,200):
        st=-st*x*x/D((2*k)*(2*k+1));ct=-ct*x*x/D((2*k-1)*(2*k));sine+=st;cosine+=ct
        if abs(st)+abs(ct)<D('1e-75'):break
    return sine,cosine
def bessel(n,x):
    x=d(x)
    if x==0:return D(1) if n==0 else D(0)
    term=(x/2)**n/D(math.factorial(n));out=term
    for k in range(1,1000):
        term*=x*x/(4*D(k)*D(n+k));out+=term
        if abs(term)<D('1e-70')*max(abs(out),D('1e-200')):break
    return out
def cmul(a,b):return (a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0])
ZERO=(D(0),D(0))
def ident(n):return [[(D(i==j),D(0)) for j in range(n)] for i in range(n)]
def zeros(n):return [[ZERO for j in range(n)] for i in range(n)]
def mdecode(a):return [[(d(a['re'][i*a['n']+j]),d(a['im'][i*a['n']+j])) for j in range(a['n'])] for i in range(a['n'])]
def scale(A,c):return [[(z[0]*c,z[1]*c) for z in row] for row in A]
def madd(A,B):return [[(z[0]+w[0],z[1]+w[1]) for z,w in zip(r,s)] for r,s in zip(A,B)]
def mmul(A,B):
    n=len(A);out=zeros(n)
    for i in range(n):
        for k in range(n):
            if A[i][k]==ZERO:continue
            for j in range(n):
                if B[k][j]==ZERO:continue
                z=cmul(A[i][k],B[k][j]);p=out[i][j];out[i][j]=(p[0]+z[0],p[1]+z[1])
    return out
def frob(A):return sum((z[0]**2+z[1]**2 for row in A for z in row),D(0)).sqrt()
def distance(A,B):return frob(madd(A,scale(B,D(-1))))
def matrix_exp(H):
    n=len(H);norm=max(sum(abs(r)+abs(i) for r,i in row) for row in H);s=0
    while norm>D('.5'):norm/=2;s+=1
    A=scale(H,D(2)**(-s));term=ident(n);out=ident(n)
    for k in range(1,240):
        term=scale(mmul(term,A),D(1)/k);out=madd(out,term)
        if frob(term)<D('1e-70'):break
    for k in range(s):out=mmul(out,out)
    return out
def eta(a,mu,nu):
    if mu==nu:return 0
    if nu==3:return int(a==mu)
    if mu==3:return -int(a==nu)
    if len({a,mu,nu})<3:return 0
    return 1 if (a-mu)*(mu-nu)*(a-nu)<0 else -1
def sparse(a):
    A=zeros(a['n'])
    for i,j,re,im in a['entries']:A[i][j]=(d(re),d(im))
    return A
for case in data['expCases']:record('decimal exp '+str(case['x']),interval_has(case['enclosure'],d(case['x']).exp()))
for case in data['besselCases']:record('decimal I_%s(%s)'%(case['n'],case['x']),interval_has(case['enclosure'],bessel(case['n'],case['x'])))
for case in data['su2Cases']:
    b=d(case['beta']);Z=D(1) if b==0 else (-b).exp()*2*bessel(1,b)/b;mean=D(0) if b==0 else bessel(2,b)/bessel(1,b);second=D('.25') if b==0 else 1-3*mean/b
    record('decimal SU2 moments '+str(b),interval_has(case['partition'],Z) and interval_has(case['meanTrace'],mean) and interval_has(case['secondMoment'],second))
max_exp=0
for case in data['exponentials']:
    target=matrix_exp(mdecode(case['input']));actual=mdecode(case['output']);error=distance(actual,target);max_exp=max(max_exp,float(error));record('decimal matrix exp '+case['group'],error<=d(case['certificate']['errorUpper']),error=float(error),bound=case['certificate']['errorUpper'])
    wrong=[r[:] for r in actual];wrong[0][0]=(wrong[0][0][0]+D('.01'),wrong[0][0][1]);record('mutated exp rejected '+case['group'],distance(wrong,target)>d(case['certificate']['errorUpper']))
transport_errors={}
for case in data['transports']:
    s=case['field'];x=list(map(d,case['x']));y=list(map(d,case['y']));center=list(map(d,s['center']));mu=next(i for i in range(4) if x[i]!=y[i]);z=[x[i]-center[i] for i in range(4)];C=d(s['rho'])**2+sum(z[i]**2 for i in range(4) if i!=mu);root=C.sqrt();integral=(atan((y[mu]-center[mu])/root)-atan(z[mu]/root))/root;N=zeros(case['output']['n'])
    for a,T in enumerate(case['sourceGenerators']):N=madd(N,scale(sparse(T),2*sum(D(eta(a,mu,j))*z[j] for j in range(4))))
    target=matrix_exp(scale(N,integral));actual=mdecode(case['output']);error=distance(actual,target);key='%s/%s/%s'%(case['group'],case['embedding'],case['steps']);transport_errors[key]=float(error);record('exact BPST commuting-link integral '+key,error<=d(case['certificate']['errorUpper']),error=float(error),bound=case['certificate']['errorUpper'])
    wrong=[r[:] for r in actual];wrong[0][0]=(wrong[0][0][0]+D('.1'),wrong[0][0][1]);record('mutated transport rejected '+key,distance(wrong,target)>d(case['certificate']['errorUpper']))
record('midpoint integration independent observed second order',transport_errors['SU2/canonical-su2/4']/transport_errors['SU2/canonical-su2/8']>3.9,ratio=transport_errors['SU2/canonical-su2/4']/transport_errors['SU2/canonical-su2/8'])
for case in data['fieldEnclosures']:
    s=case['field'];z=[d(x)-d(c) for x,c in zip(case['x'],s['center'])];n=case['basis'][0]['n'];p=s['perturbation'];y=[x/d(p['length']) for x in z];scalar=[]
    for mode in p['modes']:
        if p['kind']=='GAUSSIAN_POLYNOMIAL':
            v=(-sum(a*a for a in y)/2).exp()
            for a,power in zip(y,mode):v*=a**power
        else:
            phase=d(mode['phase'])+sum(d(w)*x/d(p['length']) for w,x in zip(mode['wave'],z));trig=sincos(phase);v=trig[0 if mode['parity']=='SIN' else 1]
        scalar.append(v)
    for mu in range(4):
        A=zeros(n)
        if s['kind']!='FULL_BASIS_TRIAL':
            den=d(s['rho'])**2+sum(a*a for a in z)
            for a,T in enumerate(case['embedding']):A=madd(A,scale(sparse(T),2*sum(D(eta(a,mu,j))*z[j] for j in range(4))/den))
        for a,T in enumerate(case['basis']):A=madd(A,scale(sparse(T),d(p['amplitude'])/d(p['length'])*sum(d(c)*v for c,v in zip(p['coefficients'][mu][a],scalar))))
        e=case['enclosures'][mu];ok=all(interval_has(e['re'][i*n+j],A[i][j][0]) and interval_has(e['im'][i*n+j],A[i][j][1]) for i in range(n) for j in range(n));record('exact source interval %s/%s/mu%d'%(s['kind'],p['kind'],mu),ok)
transfer=data['transfer'];weights=np.array([float(row['weight']) for row in transfer['rows']]);phis=np.array([row['basisValues'] for row in transfer['rows']]);gram=np.einsum('s,si,sj->ij',weights,phis,phis)/len(weights);beta=d(transfer['model']['action']['temporalCoefficient']);half=bessel(2,beta)/bessel(1,beta);lam=np.array([1]+[float(half**4)]*6);matrix=gram*np.sqrt(lam[:,None]*lam[None,:]);actual=np.array(transfer['operator']['finiteMatrix']);eig=np.linalg.eigvalsh(matrix)[::-1]
record('independent NumPy Gram and spectrum',np.max(np.abs(matrix-actual))<1e-12 and np.max(np.abs(eig-np.array(transfer['operator']['eigenvalues'])))<1e-12,matrixResidual=float(np.max(np.abs(matrix-actual))),eigenResidual=float(np.max(np.abs(eig-np.array(transfer['operator']['eigenvalues'])))))
record('positive Gram is not Euclidean unitary',np.min(eig)>0 and np.linalg.norm(actual.T@actual-np.eye(7))>1)
edges=transfer['cutoff']['spatialEdges'];vertices=sorted(set(e['site'] for e in edges)|set(e['end'] for e in edges));valid=[]
for total in range(6):
    for labels in itertools.combinations_with_replacement(range(12),total):
        js=[labels.count(i) for i in range(12)];ok=True
        for v in vertices:
            w=[js[i] for i,e in enumerate(edges) if v in [e['site'],e['end']]]
            if sum(w)%2 or 2*max(w)>sum(w):ok=False;break
        if ok:valid.append(js)
record('independent Gauss enumeration of complete cutoff',sorted(valid)==sorted(transfer['cutoff']['admissibleAssignments']) and len(valid)==7)
record('omitted face negative control',len(valid)!=len(transfer['cutoff']['basis'][:-1]))
q=min(D(1),beta/4*(beta*beta/12).exp());record('decimal cutoff majorant',q**6<=d(transfer['error']['operatorNorm']['deterministicCutoffUpper']))
for case in data['refinements']:
    s=case['model']['field'];z=[d(x)-d(c) for x,c in zip(case['model']['origin'],s['center'])];den=d(s['rho'])**2+sum(a*a for a in z);q4=6*d(s['rho'])**4/(PI*PI*den**4);energy=8*PI*PI*q4/(d(s['coupling']['g'])**2)
    for row in case['levels']:
        record('decimal BPST density comparison %s/%d'%(case['id'],row['level']),abs(d(row['energyDensity'])-energy)<=d(row['certificate']['energyUpper']) and abs(d(row['topologicalDensity'])-q4)<=d(row['certificate']['topologyDensityUpper']))
def qmatrix(q):
    a,b,c,d0=q;return np.array([[a+1j*d0,c+1j*b],[-c+1j*b,a-1j*d0]])
ref=data['reference'];beta=ref['model']['action']['beta']
for row,configuration in zip(ref['rows'],ref['configurations']):
    links=configuration['positiveLinks'];S=0;traces=[]
    for site in range(16):
        coords=[(site>>j)&1 for j in range(4)]
        for mu in range(4):
            for nu in range(mu+1,4):
                if coords[mu] or coords[nu]:continue
                U=qmatrix(links[4*site+mu])@qmatrix(links[4*(site+(1<<mu))+nu])@qmatrix(links[4*(site+(1<<nu))+mu]).conj().T@qmatrix(links[4*site+nu]).conj().T;t=np.trace(U).real/2;traces.append(t);S+=beta*(1-t)
    record('independent 4D matrix reference sample '+str(row['sample']),abs(S-row['action'])<1e-12 and abs(np.mean(traces)-row['meanPlaquette'])<1e-12 and len(traces)==24)
volume=data['volume'];spec=volume['model']['field'];lengths=np.array(volume['model']['lengths']);origin=np.array(volume['model']['origin']);center=np.array(spec['center']);rho=spec['rho'];coupling=spec['coupling']['g']
def closed_volume_gauss(panels):
    nodes,weights=np.polynomial.legendre.leggauss(panels)
    grids=np.meshgrid(*[origin[j]+(nodes+1)*lengths[j]/2-center[j] for j in range(4)],indexing='ij')
    den=rho*rho+sum(x*x for x in grids);density=6*rho**4/(math.pi**2*den**4)
    return np.einsum('i,j,k,l,ijkl->',weights,weights,weights,weights,density)*np.prod(lengths/2)
gauss16=closed_volume_gauss(16);gauss24=closed_volume_gauss(24)
record('independent fixed-volume Gauss-Legendre quadrature convergence',abs(gauss16-gauss24)<1e-13,coarse=gauss16,fine=gauss24)
record('independent continuous real charge lies in midpoint derivative enclosure',interval_has(volume['reference']['charge'],d(float(gauss24))),independentIntegral=gauss24)
record('independent continuous energy lies in midpoint derivative enclosure',interval_has(volume['reference']['energy'],d(float(gauss24*8*math.pi**2/coupling**2))))
def complex_matrix(a):return np.array(a['re']).reshape(a['n'],a['n'])+1j*np.array(a['im']).reshape(a['n'],a['n'])
for row in volume['levels']:
    n=row['cellsPerCoordinate'];N=n+1;steps=[1,N,N*N,N**3];spacing=[row['spatialSpacing']]*3+[row['temporalSpacing']];links=[complex_matrix(u) if u else None for u in row['source']['links']];qsum=0;esum=0;maxq=0;maxe=0
    for cell in row['source']['cells']:
        site=cell['site'];F={}
        for mu in range(4):
            for nu in range(mu+1,4):
                U=links[4*site+mu]@links[4*(site+steps[mu])+nu]@links[4*(site+steps[nu])+mu].conj().T@links[4*site+nu].conj().T
                A=(U-U.conj().T)/(2*spacing[mu]*spacing[nu]);F[mu,nu]=A-np.trace(A)*np.eye(2)/2
        # For the canonical SU(2) representation B(X,Y)=-ReTr(XY).
        inner=lambda A,B:-np.trace(A@B).real
        energy=sum(inner(A,A) for A in F.values())/coupling**2
        charge=(inner(F[0,1],F[2,3])-inner(F[0,2],F[1,3])+inner(F[0,3],F[1,2]))/(4*math.pi**2)
        qsum+=charge;esum+=energy;maxq=max(maxq,abs(charge-cell['topologicalDensity']));maxe=max(maxe,abs(energy-cell['energyDensity']))
    cellvol=float(np.prod(lengths)/n**4);Q=qsum*cellvol;E=esum*cellvol
    record('independent full raw cell energy and charge n='+str(n),maxq<1e-12 and maxe<1e-11 and abs(Q-row['realCharge'])<1e-12 and abs(E-row['energyIntegral'])<1e-11,maxCellChargeResidual=maxq,maxCellEnergyResidual=maxe)
    record('independent same physical volume and source completeness n='+str(n),len(row['source']['cells'])==n**4 and sum(u is not None for u in links)==4*n*(n+1)**3 and abs(cellvol*n**4-float(np.prod(lengths)))<1e-15)
    record('independent actual integral errors in declared intervals n='+str(n),interval_has(row['chargeError'],d(float(abs(Q-gauss24)))) and interval_has(row['energyError'],d(float(abs(E-gauss24*8*math.pi**2/coupling**2)))))
    record('wrong volume element negative control n='+str(n),not interval_has(row['chargeError'],d(float(abs(2*Q-gauss24)))))
summary={'schema':'MathScope.M2.GaugeIndependentCertificationValidation/1','arithmetic':'Python decimal with 80 decimal digits; independent rational BPST primitive, Bessel/exp series, exact source modes; NumPy matrix/Gram checks and a separate fixed-volume Gauss-Legendre quadrature','passed':all(r['passed'] for r in records),'count':len(records),'maxMatrixExponentialError':max_exp,'negativeControls':[r['name'] for r in records if 'mutated' in r['name'] or 'negative control' in r['name']],'records':records,'scope':'Finite declared sources, groups, graph, cutoff and statistical model. No new Lean kernel execution, continuum QFT construction, or topological-sector mixing theorem.'}
(ROOT/'certification-independent-validation.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='records'}))
