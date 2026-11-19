"""Independent exact cutoff integers, chart admission and endpoint-seam audit."""
from argparse import ArgumentParser
from fractions import Fraction as F
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
from math import comb,factorial
from pathlib import Path
import json
if not __debug__:raise RuntimeError('Exact assertions must remain enabled.')
PINS={
 'mathscope-m3/navier/source-global-class.mjs':'f07341f299b2b9cd24844c4d738b5c6605816bdaf4eeca317b80618b27ed7095',
 'mathscope-m2/navier/actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
 'mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs':'aa100d47e54442be8c24f167a160816d31c883ddfdc4f0a3274b496c9b3c7a53',
 'mathscope-m2/navier/actual-physical-full-curl.mjs':'539753a76375338653ff7420752270b600dc8c78893212ce541c47484b2f6454',
 'mathscope-m2/navier/actual-covariance-global-assembly.mjs':'bd0f09f78a2f93cad9fdb679ba25509ecb2891ba86eee1bc3e57df6da74e37cc',
 'mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs':'384daafdcb5cad2e57b4bbb0440bc4b2e4a5912b4835e2d7510c21301a44ff15',
 'mathscope-m2/navier/source-radial-phase-exponent.mjs':'09ffa7aca344391d39de50f38a9a4c67f175d6d500e4514ac6a86e591768ab7c'}
def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal',type=Path);p.add_argument('directory',type=Path);a=p.parse_args()
 path=a.goal/'first-scale-closure/check_first_scale_closure.py'
 assert sha256(path.read_bytes()).hexdigest()=='9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'
 s=spec_from_file_location('reader',path);reader=module_from_spec(s);s.loader.exec_module(reader)
 src={}
 for name,pin in PINS.items():
  b=reader.git_blob(a.goal.parents[2],'research-ide/'+name);assert sha256(b).hexdigest()==pin,name;src[name]=b.decode()
 def clauses(name,*items):
  for item in items:assert item in src[name],(name,item)
 clauses('mathscope-m3/navier/source-global-class.mjs',
  'n=order+2','derivativeLimits:[n+2]','partitionRows=Array.from({length:n+1}',
  'time=originalPulseTimeCutoffBounds(G,{order:n})',
  'lower:[q(1,2),G.div(c.Xa,q(2)),q(-1)],upper:[q(2),G.mul(q(2),c.Xb),G.one]',
  'same(t.profileOrders,[1,0,0])','G.div(norm(t.coefficient),G.log(q(2)))',
  'G.pow(partitionMax,n+4),G.pow(logChartMax,n+4)',
  'Rlower=G.sqrt(G.div(c.Xa,q(2))),Rupper=G.sqrt(G.mul(q(8),c.Xb))')
 clauses('mathscope-m2/navier/actual-gaussian-flat-tail-kernel.mjs',
  'j<=order+2','j<=order+1','sigmaJets[j+1]','stepBounds[j],stepBounds[m-j]',
  'sigma^(j)(0)=0')
 clauses('mathscope-m2/navier/actual-physical-full-curl.mjs',
  'relativeIndices=[-1,0,1]','denominator=G.add(...bumps.map(x=>G.pow(x,2)))',
  'G.choose(offset,q(-3,4),q(3,4),G.zero,quotient,G.zero)')
 clauses('mathscope-m2/navier/actual-covariance-global-assembly.mjs',
  'G.step(G.sub(G.q(3,2),G.mul(G.q(2),abs)))')
 clauses('mathscope-m2/navier/actual-all-band-background-norm-kernel.mjs',
  'D=G.sub(q(1,2),h)','physicalCoordinates=[R,G.mul(sD,eta),G.mul(s,d)]',
  'includesCoefficientDerivatives:true')
 clauses('mathscope-m2/navier/source-radial-phase-exponent.mjs',
  'O.mul(O.q(2),O.sub(O.mul(O.add(O.one,h),rho),O.mul(h,kappa)))')
 raw=(a.directory/'primary-cutoff-orders.json').read_bytes();r=json.loads(raw)
 assert r['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152'
 assert not r['scope']['nativeOrder8Or9GraphMaterialized'] and not r['scope']['actualClassSealCreated']
 assert r['simpleCommonUpper']['formula']=='2^4096*Rstar^26'
 assert r['simpleCommonUpper']['belowExistingN6DirectedUpper'] is True
 # Independent integer smooth-step recurrence, p=1.
 poly={0:1};seed=[]
 for k in range(12):
  seed.append(sum(abs(c)*max(1,j)**max(1,j) for j,c in poly.items()))
  nxt={}
  for j,c in poly.items():
   nxt[j+2]=nxt.get(j+2,0)+c
   if j:nxt[j+1]=nxt.get(j+1,0)-j*c
  poly={j:c for j,c in nxt.items() if c}
 rec=[16];sigma=[1]
 for m in range(1,12):
  rec.append(16*sum(comb(m,k)*2*seed[k]*rec[m-k] for k in range(1,m+1)))
  sigma.append(sum(comb(m,k)*seed[k]*rec[m-k] for k in range(m+1)))
 assert sigma==list(map(int,r['originalStepOrdinaryBounds']))
 bump=[v*2**j for j,v in enumerate(sigma)]
 conv=lambda x,y,n:sum(comb(n,j)*x[j]*y[n-j] for j in range(n+1))
 den=[3*conv(bump,bump,j) for j in range(11)]
 bell=[[0]*11 for _ in range(11)];bell[0][0]=1
 for m in range(1,11):
  for k in range(1,m+1):
   bell[m][k]=sum(comb(m-1,j-1)*den[j]*bell[m-j][k-1] for j in range(1,m-k+2))
 inv=[sum(2*4**k*factorial(k)*bell[m][k] for k in range(m+1)) for m in range(11)]
 quotient=[conv(bump,inv,j) for j in range(11)]
 assert quotient==list(map(int,r['partitionQuotientOrdinaryBounds']))
 partition=[3*(1+max(quotient[j:j+2])) for j in range(10)]
 step=[1]+[1+sigma[j+1]**2 for j in range(1,11)]
 # Uniform analytic chart admission, normalized around real s0,eta0.
 # x=theta+zeta^2*x^(2h); |x-1|<=1/4, |dtheta|,|dzeta|<=1/32.
 rad=F(1,4);dz=F(1,32);zmax=1+dz;derivative=F(1,32)*F(4,3)
 contraction=zmax*zmax*derivative
 selfmap=dz+dz*(2+dz)+zmax*zmax*derivative*rad
 assert derivative==F(1,24) and contraction<F(1,16) and selfmap<rad
 # Principal |log x| <= r/(1-r), |log s0|<1; hence |log s|<4.
 assert 1+rad/(1-rad)<4
 # Profile complex disk radius1/4096: |s|>=1/3,<=9/4; |eta|<=4/3.
 # |s^D|<=3/2, |D*s^(D-1)*eta|<=3, and |d_eta Z|<=2.
 assert F(1,2)-F(1,4096)>F(1,3) and 2+F(1,4096)<F(9,4)
 assert 1+F(1,4096)<F(4,3)
 assert F(1,2)*F(3,2)*3*F(4,3)==3
 # T_s<=3, T_eta<=6, so perturbations <=5/4096 and9/4096.
 assert 1+F(4,3)**2<3 and 2*F(9,4)*F(4,3)==6
 assert F(5,4096)+F(1,256)<F(1,64)
 assert F(9,4096)+F(1,256)<F(1,64)
 # All eight FTC face volumes and log2 normalization.
 assert F(5,2)*3*F(3,2)<12
 log2lower=F(2,3)+F(2,81)+F(2,1215);assert log2lower>F(1,2)
 # Original source radial phase and source geometry.
 assert 2*(F(65,64)+F(1,64*100000))<3
 assert 1+3**2<4**2
 assert 3+4<=7
 checks=[]
 for row in r['rows']:
  n=row['sourceCoefficientOrder'];assert n in (8,9)
  assert list(map(int,row['partitionFTC']))==partition[:n+1]
  assert row['sourceStepDerivativeRequired']==n+2 and row['partitionDerivativeRequired']==n+1
  Qn=4*factorial(n)*256**n*4096**2
  assert int(row['logChartDerivativeBoundInteger'])==Qn
  slow=4**n*factorial(n)*max(partition[:n+1])**(n+4)*(24*(1+Qn))**(n+4)
  times=[20**j*conv(step,step,j) for j in range(n+2)]
  transverse=[2**(35*j)*step[j] for j in range(n+1)]
  radii=[v for j in range(n+1) for v in (factorial(j)*7**(j+1),(j+5)**(j+1)*7**(j+5))]
  C=max(2,max(step[:n+2]),slow,*times,*transverse,*radii,factorial(n)*2**(n+4))
  assert int(row['commonInteger'])==C and C.bit_length()==row['commonIntegerBits']
  assert C<2**4096 and row['RstarPower']==2*n+8<=26
  assert row['belowExistingN6DirectedUpper']
  e=row['enclosure']['upper']
  for _ in range(4):assert set(e)=={'exp'};e=e['exp']
  assert 0<F(e['rational'])<2**21
  checks.append({'cutoffMapOrder':n,'logChartNonzeroRows':(n+1)*(n+2)//2-1,
   'commonIntegerBits':C.bit_length(),'RstarPower':2*n+8,'stepDerivativeOrder':n+2,
   'partitionDerivativeOrder':n+1,'directedUpperExpDepth':4})
 result={'schema':'MathScope.OriginalCutoffMapHighOrdersIndependentAudit/1',
  'status':'PASS_INTEGER_RECURRENCES_UNIFORM_CHART_ADMISSION_AND_SEAMS','fixedOriginalCommit':'f8cb4034e86d7b669d52a6f2248aebba156b51b5',
  'sourceSHA256':PINS,'receiptSHA256':sha256(raw).hexdigest(),
  'contraction':{'xRadius':'1/4','physicalRadius':'1/64','normalizedPerturbation':'1/32','lipschitzUpper':str(contraction),'selfMapDeviationUpper':str(selfmap),'logMagnitudeUpper':4,
   'profileRadius':'1/4096','physicalDerivativeRadius':'1/256','profilePhysicalMoves':{'Z':'5/4096','T':'9/4096'}},
  'orders':checks,'commonSimpleUpper':'2^4096*Rstar^26','bothBelowExistingDirectedTargetN6Upper':True,
  'tailAndCollarAudit':'Cutoff step is flat outside [0,1]; partition guarded quotient has denominator>=1/4 on numerator support and all boundary jets vanish. Pure log-chart holomorphic admission includes eta=+-1 and depends on no X/R or heat. Radius/carrier powers are smooth on the source positive radial envelope. This is sufficient inside the declared original norm box including both radial collars; representative/pulse path admission into that box remains a separate source-family premise.',
  'noHeatNegativeTimeExtension':True,'sourceDomainAdmissionStillRequired':True,
  'scope':'Written analytic contraction/Cauchy argument plus independently exact integer/rational and pinned-source checks. External original coefficient maximum bound; no native order8/9 graph, private class seal, full background derivative proof or final jet promoted.'}
 (a.directory/'cutoff-orders-audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('PASS cutoff/map8/9 integers; independent holomorphic chart admission; flat endpoint seams; common upper2^4096*Rstar^26')
if __name__=='__main__':main()
