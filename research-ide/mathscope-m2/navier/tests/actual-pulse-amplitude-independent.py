"""Independent rational projected-ODE identities and high-precision transfer audit.

Python uses neither JavaScript's interval implementation nor its phase compiler.
Finite diagnostic parameters verify algebra; they do not certify a different N3.
The actual row receipts remain linked to the unchanged positive source expressions.
"""
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
from pathlib import Path
import hashlib
import json

HERE=Path(__file__).resolve().parent
receipt=json.loads((HERE/'actual-pulse-amplitude-independent.json').read_text())
checks=0
def check(value,message):
    global checks
    assert value,message
    checks+=1
def dot(a,b):return sum((x*y for x,y in zip(a,b)),F(0))
def mv(a,b):return [dot(row,b) for row in a]
def tr(a):return list(map(list,zip(*a)))
def mm(a,b):return [[dot(row,col) for col in tr(b)] for row in a]
def add(a,b):return [x+y for x,y in zip(a,b)]
def scale(a,b):return [x*b for x in a]
def dec(f):return D(f.numerator)/D(f.denominator)
def encloses(interval,value):return D.from_float(interval[0])<=value<=D.from_float(interval[1])

for key,name in [('phase','actual-pulse-amplitude-phase.mjs'),('integrator','actual-pulse-amplitude-integrator.mjs')]:
    check(hashlib.sha256((HERE.parent/name).read_bytes()).hexdigest()==receipt['runtimeSHA256'][key],'runtime hash '+key)
check(receipt['sourceProfile']=='same-profile-2026-10-10.3','same source id')
check(receipt['sourceAssemblySHA256']=='184152e17553d825f1f590b611b575f646d182e3d891aa010e6a3f5cbb201afd','same accepted assembly')
check(all(x['pass'] for x in receipt['sourceChecks']),'executed source bounds')

# Pythagorean u and q keep every projected identity rational. The damping
# definition is the original Bs calibration; no damping term is discarded.
for sign in [-1,1]:
  for u,root1pu2 in [(F(4,3),F(5,3)),(F(15,8),F(17,8)),(F(24,7),F(25,7))]:
    for a in [F(1,2),F(3,4),F(1),F(5,4),F(3,2)]:
      F0=F(7,5);sl=F(2,5);lam=sl*sl;Ls=F(5,2);q=sign*F(3,4);t=F(5,4);Bs=F(3,2)
      alpha=2*(1+lam)*F0;beta=alpha*Ls*q/(sign*u)
      at=F(1,2)+beta*(a-F(1,2));delta=1/u;Dv=at*at+(t/u)**2;Da=2*beta*at
      Hd=(root1pu2/u)**3;lambda0=2*F0*sl;G=lambda0*Ls/u
      n=scale([sign*u*at,q,F(-1)],Bs);np=[Bs*sign*u*beta/Ls,F(0),F(0)]
      Ka=[q/t,-1/t];Na=[-1/t,-q/t];sa=sign*u*at/t
      e=[F(1),-sa*Ka[0],-sa*Ka[1]];N=[F(0),*Na];U=tr([e,N])
      x=F(7,9);yb=F(11,13);y=-sl*u*yb;tv=add(scale(e,x),scale(N,y))
      K=[[F(0),-2*F0,F(0)],[-2*lam*F0,F(0),F(0)],[F(0),F(0),F(0)]]
      nK=[dot(n,c) for c in tr(K)];n2=dot(n,n)
      A=[[-K[i][j]+n[i]*(nK[j]-np[j])/n2 for j in range(3)] for i in range(3)]
      d=lambda0*n2/(Bs*Bs*root1pu2**3)
      tp=add(mv(A,tv),scale(tv,-d))
      actualX=Ls*tp[0];actualYb=-Ls*dot(N,tp)/(sl*u)
      expectedX=-Da*x/Dv+G*t*yb/Dv-G*Dv*x/Hd
      expectedYb=G*x/t-G*Dv*yb/Hd
      check(actualX==expectedX,'3D projected radial equals exact reduced equation')
      check(actualYb==expectedYb,'3D projected tangent equals exact reduced equation')
      check(dot(n,tv)==0,'actual t tangent')
      check(dot(np,tv)+dot(n,tp)==0,'differentiated tangency with moving normal')
      Awrong=[[-K[i][j]+n[i]*nK[j]/n2 for j in range(3)] for i in range(3)]
      wrong=add(mv(Awrong,tv),scale(tv,-d))
      check(dot(np,tv)+dot(n,wrong)!=0,'negative: omitted moving normal fails')
      check(2*dot(tv,tp)==-2*dot(tv,mv(K,tv))-2*d*dot(tv,tv),'source 7.22 energy exact')
      energy=dot(tv,tv)/(u*u);Theta=tv[1]/(sl*u)
      check(2*Ls*dot(tv,tp)/(G*u*u)==2*((1+lam)*x*Theta-Dv*energy/Hd),'normalized energy exact')
      # J uses an arbitrary nonzero column coefficient; the matrix identities
      # therefore hold at the actual c0*sqrt(1+sref^2) as well.
      j=F(-7,9);J=[[F(1),F(1)],[j,-j]];Ji=[[F(1,2),1/(2*j)],[F(1,2),-1/(2*j)]]
      B=mm(U,J);left=mm(Ji,[[F(1),F(0),F(0)],N])
      check(mm([n],B)==[[0,0]],'n dot B exact')
      check(mm(left,B)==[[1,0],[0,1]],'left inverse exact')
      gram=mm(tr(B),B);det=gram[0][0]*gram[1][1]-gram[0][1]*gram[1][0]
      check(det==4*j*j*(1+sa*sa)>0,'Gram determinant exact')
      H1=(2*beta*beta)/4-Da*Da/(16*Dv)
      H2=beta*beta/F(4)*(1+(t/u)**2/Dv)
      check(H1==H2>0,'Liouville potential exact')

with localcontext() as ctx:
  ctx.prec=80
  for row in receipt['actual']['rows']:
    a=D.from_float(row['a']);x=(D('.5')/a)**D('1.5');yb=D('.5')**D('1.5')/a.sqrt();energy=D('.125')/a
    for key,value in [('radial',x),('movingN',yb),('theta',yb),('z',a*x),('energy',energy),('energyDerivative',2*(x*yb-a*a*energy))]:
      check(encloses(row[key],value),'actual receipt encloses independent limit probe '+key)
    f=a.ln()-(a*a*a-1)/3
    check(encloses(row['referenceLog'],f),'independent reference primitive')
    check(row['radial'][0]>0 and row['energy'][0]>0,'actual solution positivity')
  check(receipt['actual']['initial']['midpointUnitSeedUsed'] is False,'left datum unchanged')
  midpoint=receipt['actual']['rows'][16]
  check(not encloses(midpoint['radial'],D(1)),'negative: P is not the actual radial amplitude')
  check(receipt['actual']['scope']['fullPhysicalResidualEvaluated'] is False,'slow residual not fabricated')
  check(receipt['actual']['scope']['actualT0CovarianceMatched'] is False,'actual stress not fabricated')

  # Independently integrate the *scaled* cooperative system, with Decimal RK4
  # refinements. This verifies the finite-G transfer implementation. The source
  # enclosure's rigor comes from cellwise positive comparison, not RK4 accuracy.
  def integrate(G,L,count):
    G=D(G);L=D.from_float(L);h=L/count;W=D(1);Z=D('.8')
    def rhs(t,w,z):
      H=D('.25')+t/5
      return (G*(z-w),G*(w-z)+H/G*w)
    for i in range(count):
      time=i*h
      a=rhs(time,W,Z);b=rhs(time+h/2,W+h*a[0]/2,Z+h*a[1]/2)
      c=rhs(time+h/2,W+h*b[0]/2,Z+h*b[1]/2);d=rhs(time+h,W+h*c[0],Z+h*c[1])
      W+=h*(a[0]+2*b[0]+2*c[0]+d[0])/6;Z+=h*(a[1]+2*b[1]+2*c[1]+d[1])/6
    return [W,Z]
  diagnostics=[]
  for case in receipt['finiteOperatorDiagnostics']:
    coarse=integrate(case['G'],case['L'],512);fine=integrate(case['G'],case['L'],1024);finer=integrate(case['G'],case['L'],2048)
    for index in range(2):
      check(encloses(case['finalScaledState'][index],finer[index]),'independent variable-potential solution is enclosed')
      e1=abs(coarse[index]-fine[index]);e2=abs(fine[index]-finer[index]);check(e1/e2>D(15),'RK4 refinement at finite diagnostic G')
    check(case['sourceInstanceCertified'] is False,'finite transfer diagnostic is not another source certificate')
    diagnostics.append({'G':case['G'],'finalScaledState':[str(x) for x in finer],'refinementDifference':str(max(abs(x-y) for x,y in zip(finer,fine)))})

print(json.dumps({'checks':checks,'pass':True,'exactRationalCases':30,'decimalPrecision':80,'finiteOperatorDiagnostics':diagnostics,'actualSourceParametersChanged':False},indent=2))
