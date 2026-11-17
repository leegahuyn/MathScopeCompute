#!/usr/bin/env python3
"""Verify both actual source matrices and a damping-aware variational bound."""
import hashlib,itertools,json,math
from fractions import Fraction
from pathlib import Path
import sympy as s
D=Path('work/goal-next/continuation44/forced');path=D/'two-pulse-source-windows.json';raw=path.read_bytes();X=json.loads(raw);assert X['status']=='PASS_NATIVE_TWO_PULSE_MATRIX_WINDOWS'
P=Path('work/goal-next/second-live/node-fixture/research-ide/mathscope-m3/navier/source-forced-pulse.mjs');source=P.read_bytes();blob=hashlib.sha1(b'blob '+str(len(source)).encode()+b'\0'+source).hexdigest();assert blob=='bf44357f7038ebe07d78ffc208cf5bd357df928a'
for fragment in (b'Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],normalRow[j]),nSquared))))',b'damping=G.mul(epsilon,G.pow(k,2),nSquared)',b'G.mul(G.q(m*m),damping)',b"orderedTermRecurrence:'u_0(v)=integral_0^v forcing(w) dw"):
 assert fragment in source,fragment
nodes={int(k):v for k,v in X['nodes'].items()};assert nodes[20]=={'op':'rational','args':['-1','1']} and nodes[474]=={'op':'rational','args':['4','1']}
Wpath=Path('work/goal-next/continuation36/hosted-43363985266/mathscope-original-n3-primary-c5/witness/original-active-mode-two-witness.json');W=json.loads(Wpath.read_bytes())
assert W['snapshot']['node_stream_sha256']==X['witnessGraphSHA256'] and W['snapshot']['definitions_sha256']==X['witnessRegistrySHA256']
Wrows={r['key']:r for r in W['rows']}
samepath=Wpath.parent.parent/'same-family-mode-two.json';same=json.loads(samepath.read_bytes())
assert same['status']=='VERIFIED_SAME_LIVE_N3_PRIMARY_C5_AND_SELECTED_FORCED_INPUTS' and same['prefix']==3 and not same['completeForcedSeal']
for v in same['rows']:
 w=Wrows[v['key']];assert v['harmonic']==w['m']==2 and v['system']==w['system'] and v['projected']==w['projectedSource'] and v['H_w']==w['path']['Hw']
def op(i,name):
 n=nodes[i];assert n['op']==name,(i,n);return n['args']
def parse(i,atoms,cache):
 if i in atoms:return atoms[i]
 if i in cache:return cache[i]
 n=nodes.get(i)
 if n is None:return s.Symbol(f'unavailable_{i}')
 a=n['args'];kind=n['op']
 if kind=='rational':out=s.Rational(int(a[0]),int(a[1]))
 elif kind=='add':out=sum((parse(j,atoms,cache) for j in a),s.Integer(0))
 elif kind=='multiply':out=s.prod(parse(j,atoms,cache) for j in a)
 elif kind=='inverse':out=1/parse(a[0],atoms,cache)
 elif kind=='integer_power':out=parse(a[0],atoms,cache)**a[1]
 else:out=s.Symbol(f'opaque_{i}')
 cache[i]=out;return out
checks=[]
for row in X['rows']:
 n=row['normal']['value'];np=row['normal']['derivative'];n2=row['normal']['squared'];k=row['k'];eps=row['epsilon'];w=row['variable'];M=row['matrix'];K=row['K'] if 'K' in row else None
 # The three diagonals all contain exactly the same *negative* scalar term.
 ds=[op(M[j][j],'add') for j in range(3)];common=set(ds[0])&set(ds[1])&set(ds[2]);assert len(common)==1
 [negative]=common;factor=op(negative,'multiply');assert factor[0]==20;positive=factor[1];q=op(positive,'multiply');assert q[0]==474;damp=q[1]
 epsk2,normsq=op(damp,'multiply');assert normsq==n2 and op(epsk2,'multiply')[0]==eps
 k2=op(epsk2,'multiply')[1];assert op(k2,'integer_power')==[k,2]
 # Actual n(w)=(x0-HR*w,p/R,pz-epsilon*HZ*w), same literal derivatives.
 assert n[1]<w and np[1]==0
 x0,neg_rad=op(n[0],'add');assert op(neg_rad,'multiply')[0]==20
 HR,w0=op(op(neg_rad,'multiply')[1],'multiply');assert w0==w and op(np[0],'multiply')==[20,HR]
 pz,neg_ax=op(n[2],'add');assert op(neg_ax,'multiply')[0]==20
 HZ,epsw=op(op(neg_ax,'multiply')[1],'multiply');assert op(epsw,'multiply')==[eps,w] and op(np[2],'multiply')[0]==20
 assert op(op(np[2],'multiply')[1],'multiply')==[eps,HZ]
 # Norm-squared is literally the three real normal components squared.
 syms={z:s.Symbol(f'n{j}') for j,z in enumerate(n)};actual=parse(n2,syms,{})
 assert s.expand(actual-sum((z*z for z in syms.values()),s.Integer(0)))==0
 A=[]
 for i in range(3):
  line=[]
  for j in range(3):
   line.append(next(z for z in ds[i] if z!=negative) if i==j else M[i][j])
  A.append(line)
 # Prove all nine undamped entries from the actual matrix roots and the
 # original frame operands, retaining unspecified source operands as atoms.
 wk=Wrows[row['key']];assert wk['system']==row['system'] and wk['normal']==row['normal']
 kroot=wk['K'];ids=set(n+np+[n2]+[v for line in kroot for v in line]);ids.discard(0)
 atoms={i:s.Symbol(f'atom_{i}') for i in ids}
 def atom(i):return s.Integer(0) if i==0 else atoms[i]
 for i in range(3):
  for j in range(3):
   normalrow=sum((atom(n[k])*atom(kroot[k][j]) for k in range(3)),s.Integer(0))-atom(np[j])
   expected=-atom(kroot[i][j])+atom(n[i])*normalrow/atom(n2)
   difference=s.factor(parse(A[i][j],atoms,{})-expected)
   assert difference==0,(row['key'],i,j,str(difference))
 checks.append({'key':row['key'],'system':row['system'],'matrix':M,'undampedAphi':A,'negativeScalarRoot':negative,'dampingRoot':damp,'normalSquared':n2,'epsilon':eps,'k':k,'pulseVariable':w,'n0':[x0,n[1],pz],'normalSlope':np,'forcing':row['forcing']})

# Symbolic exact cubic integral of the actual affine normal; no floating point.
av=s.symbols('a0:3',real=True);bv=s.symbols('b0:3',real=True);left,right=s.symbols('left right',real=True);w=s.symbols('w',real=True);Dlt=right-left
norm=sum((av[i]+bv[i]*w)**2 for i in range(3))
formula=Dlt*sum((av[i]+bv[i]*left)**2 for i in range(3))+Dlt**2*sum((av[i]+bv[i]*left)*bv[i] for i in range(3))+Dlt**3*sum(bv[i]**2 for i in range(3))/3
assert s.expand(s.integrate(norm,(w,left,right))-formula)==0
# 5-parameter multi-index Leibniz weights, 1 <= |beta| <= |alpha|.
counts={}
for alpha in itertools.product(range(5),repeat=5):
 r=sum(alpha)
 if r>4:continue
 count=sum(math.prod(math.comb(a,b) for a,b in zip(alpha,beta)) for beta in itertools.product(*(range(a+1) for a in alpha)) if any(beta))
 assert count==2**r-1;counts[str(r)]=counts.get(str(r),0)+1
assert counts=={'0':1,'1':5,'2':15,'3':35,'4':70}
coeff=[Fraction(15**j,math.factorial(j+1)) for j in range(5)]
# Scalar damping may commute; a nonscalar diagonal damping cannot be moved
# across the full propagator. Show the generic second-order defect exactly.
A=s.Matrix([[0,1],[0,0]]);Dscalar=s.eye(2);Dmatrix=s.diag(1,2)
assert A*Dscalar-Dscalar*A==s.zeros(2) and A*Dmatrix-Dmatrix*A!=s.zeros(2)
# Ignoring parameter derivatives of damping would lose du/dtheta at zero:
# integral_0^1 exp(-4 theta (1-s)) ds has derivative -2 at theta=0.
tau=s.symbols('tau',real=True);assert s.integrate(-4*(1-tau),(tau,0,1))==-2
out={'status':'CONDITIONAL_ACTUAL_TWO_MODE_SCALAR_DAMPING_TRANSPORT','rows':checks,'uncompressedSourceGraphSHA256':X['witnessGraphSHA256'],'registrySHA256':X['witnessRegistrySHA256'],'sameLiveCheckpointSHA256':hashlib.sha256(samepath.read_bytes()).hexdigest(),'sourceKernelGitBlob':blob,
 'exactFactorization':'M(w)=Aphi(w)-4*d(w)*I, d(w)=epsilon*k^2*|n(w)|^2>=0; U_M(t,s)=exp(-4*integral_s^t d(w)dw)*U_Aphi(t,s).',
 'all18UndampedMatrixEntries':'Each checked exactly against Aphi_ij=-K_ij+n_i*(sum_k(n_k*K_kj)-nprime_j)/|n|^2; all other original source operands remain symbolic.',
 'actualNormal':'n(w)=n(0)+w*nprime, with the three literal original source components and derivatives recorded above.',
 'exactIntegratedNormal':'integral_s^t |n(w)|^2 dw = (t-s)|n(s)|^2+(t-s)^2 n(s) dot nprime+(t-s)^3 |nprime|^2/3.',
 'valueBound':'||u(t)||_infinity <= F*t*exp(A*t), where F bounds the actual projected complex forcing and A bounds the matrix row norm of actual Aphi.',
 'fixedPulseC4Bound':'max_|alpha|<=4 ||D^alpha u(t)||_infinity <= F*t*exp(A*t)*sum_{j=0}^4 (15*B*t)^j/(j+1)!, at fixed t.',
 'polynomialCoefficients':[str(x) for x in coeff], 'directions':['R','Z','T','Y1','Y2'],'multiIndexCounts':counts,
 'boundDefinitions':'F bounds all actual forcing derivatives through 4; A bounds ||Aphi||_infinity; B bounds ||D^beta M||_infinity for 1<=|beta|<=4, throughout 0<=w<=Ls and the original fixed-label parameter domain.',
 'proof':'Use the positive scalar integrating factor and the source ordered zero-data Volterra equation. Each parameter derivative satisfies the exact binomial triangular system. Its off-diagonal coupling strictly lowers derivative order, so an ordered expansion uses at most four couplings. The binomial row sum is <=15, and the j-fold ordered integral has volume t^(j+1)/(j+1)!. Products of the undamped Aphi propagators contribute exp(A*t), while scalar damping factors are <=1. No matrix commutativity is assumed.',
 'negativeControls':['a nonscalar diagonal damping matrix fails the asserted factorization for a noncommuting A','omitting a parameter derivative of damping fails: the scalar zero-data example has derivative -2 at theta=0'],
 'scope':'Actual selected witness systems and their exact source matrices; F,A,B and the admitted-domain analyticity, positivity and same-private-family input remain premises. Bound is at fixed pulse time, before endpoint/time chain rules, pressure, mapped full curl, output class, numerical final jets or any gate conclusion. No ε-uniformity is inferred.','release':'HOLD'}
(D/'n3-two-actual-pulse-damping-transport.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf8');print('PASS 2 actual matrices, exact normal cubic, 126 multi-indices and damping-aware C4 transport')
