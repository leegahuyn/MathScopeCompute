"""Independently replay every scalar rule of the unchanged 10x24 jet ledger.

The raw scalar DAG is read in CI. Only this checker's compact receipt need
be retrieved. Analytic application requires the existing actual receipts.
"""
from __future__ import annotations
import argparse,copy,hashlib,json,math
from collections import Counter
from fractions import Fraction as F
from pathlib import Path

HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
FIXED='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b'
PINS={
 'actual-leading-all-order-jets.mjs':'d3af156118671a3e582c19a82064aab884a09d6ce81f51a6b2d64d35444cd29d',
 'actual-leading-all-order-jets-arithmetic.mjs':'99c66508b58b46a3e22053bee1eb8f6963c46abde88bdcb54ada5a3f62ba4d7f',
 'actual-residual-order-induction-kernels.mjs':'97f8bbc5927ee2b2ac5b41851ba5bc2c800fd4cad6b85c7a1039095c066f7fef',
 'actual-continuation-exact-heat.mjs':'c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172',
 'source-profile-data.mjs':'df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'}
def need(x,m):
 if not x:raise AssertionError(m)
def canonical(v):return json.dumps(v,ensure_ascii=False,separators=(',',':'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def seed42():
 # exp(-z^2) P_k(z), z=1/t. Each monomial is bounded on every z>=0.
 poly={0:1};bounds=[]
 for k in range(43):
  bounds.append(sum(abs(c)*max(1,(j+1)//2)**max(1,(j+1)//2) for j,c in poly.items()))
  nxt={}
  for j,c in poly.items():
   nxt[j+3]=nxt.get(j+3,0)+2*c
   if j:nxt[j+1]=nxt.get(j+1,0)-j*c
  poly={j:c for j,c in nxt.items() if c}
 inv=[64];sigma=[1]
 for m in range(1,43):
  inv.append(64*sum(math.comb(m,k)*2*bounds[k]*inv[m-k] for k in range(1,m+1)))
  sigma.append(sum(math.comb(m,k)*bounds[k]*inv[m-k] for k in range(m+1)))
 need(11**4<64*4**4,'Global square-seed denominator floor')
 return sigma

class ExactDAG:
 """Independent reduced arithmetic builder; it may not append absent nodes."""
 def __init__(self,nodes):
  self.nodes=nodes;self.ids={canonical([n['op'],n['args']]):i for i,n in enumerate(nodes)}
  need(len(self.ids)==len(nodes),'Duplicate scalar norm nodes')
  self.z=self.q(0);self.o=self.q(1)
 def node(self,op,args):
  key=canonical([op,args]);need(key in self.ids,'Missing original norm arithmetic '+op)
  return self.ids[key]
 def q(self,n,d=1):
  f=F(n,d);return self.node('rational',[str(f.numerator),str(f.denominator)])
 def rat(self,i):
  n=self.nodes[i];return F(*map(int,n['args'])) if n['op']=='rational' else None
 def add(self,*xs):
  v=self.z
  for x in xs:
   if v==self.z:v=x;continue
   if x==self.z:continue
   a,b=self.rat(v),self.rat(x)
   v=self.q(a+b) if a is not None and b is not None else self.node('add',sorted([v,x]))
  return v
 def mul(self,*xs):
  v=self.o
  for x in xs:
   if v==self.z or x==self.z:return self.z
   if v==self.o:v=x;continue
   if x==self.o:continue
   a,b=self.rat(v),self.rat(x)
   v=self.q(a*b) if a is not None and b is not None else self.node('multiply',sorted([v,x]))
  return v
 def inv(self,x):
  v=self.rat(x);return self.q(1/v) if v is not None else self.node('inverse',[x])
 def div(self,x,y):return self.mul(x,self.inv(y)) if x!=self.z else self.z
 def pow(self,x,n):
  if n==0:return self.o
  if n==1:return x
  if n<0:return self.pow(self.inv(x),-n)
  v=self.rat(x)
  return self.q(v*v) if n==2 and v is not None else self.node('integer_power',[x,n])
 def sqrt(self,x):return self.node('sqrt_positive',[x])
 def exp(self,x):return self.o if x==self.z else self.node('exp',[x])
 def param(self,name):return self.node('source_parameter',[name])
 def geom(self,x,n,exponential=False):
  ans=self.o;p=self.o
  for j in range(1,n+1):
   p=self.mul(p,x);ans=self.add(ans,self.mul(self.q(1,math.factorial(j)),p) if exponential else p)
  return ans

def replay(binding):
 need(binding['schema']=='MathScope.N6.ActualLeading10x24SourceLedger/1','Fresh original finite-jet source projection')
 need(binding['sourceBytesUnchanged'] and binding['sourceHeaderSHA256']==HEADER,'Same original source context')
 need({Path(r['path']).name:r['sha256'] for r in binding['sourceRows']}==PINS,'Original finite-jet source pins')
 need(binding['requestedRectangle']=={'radialOrder':10,'etaOrder':24,'totalTaylorOrder':34,'primitiveDerivativeOrder':42},'Exact original demand rectangle')
 need(binding['parameterExpressionSHA256']=='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152','Same source parameter profile')
 need(all(r['pass'] for r in binding['originalChecks']),'Original source construction checks')
 program=binding['normProgram'];need(hashlib.sha256(canonical(program).encode()).hexdigest()==binding['normProgramSHA256'],'Complete unchanged norm DAG')
 g=ExactDAG(program['nodes']);sigma=list(map(int,binding['primitive']['ordinaryDerivativeBounds']));counts=Counter();labels=[]
 need(sigma==seed42() and binding['primitive']['seedPower']==2,'Every actual ordinary square-seed bound independently generated through42')
 physical=binding['physicalConversion'];poly=[1]
 for j in range(10):
  nxt=[0]*(len(poly)+1)
  for k,c in enumerate(poly):nxt[k]+=j*c;nxt[k+1]+=c
  poly=nxt
 need(physical['unsignedCoefficients']==list(map(str,poly)) and int(physical['ordinaryCoefficient'])==sum(c*math.factorial(k)*math.factorial(24) for k,c in enumerate(poly)),'Every original physical-X conversion term')
 rules={};unknown=[]
 for row in program['ledger']:
  k=row['order'];rule=row['rule'];xs=row['inputs'];q=g.q
  need(0<=k<=42,'Finite actual ledger order')
  if rule=='sum':v=g.add(*xs)
  elif rule=='submultiplicative total Taylor product':v=g.mul(*xs)
  elif rule=='finite reciprocal Taylor series at actual positive value':
   f,low=xs;v=g.mul(g.inv(low),g.geom(g.mul(g.inv(low),f),k))
  elif rule=='finite exponential Taylor series':
   f,value=xs;v=g.mul(value,g.geom(f,k,True))
  elif rule=='log value <= F+1/lower and its finite Taylor series':
   f,low=xs;v=g.add(f,g.inv(low));power=g.o
   for j in range(1,k+1):power=g.mul(power,g.mul(g.inv(low),f));v=g.add(v,g.mul(q(1,j),power))
  elif rule=='positive square-root Taylor, |binom(1/2,k)|<=1':
   f,low=xs;v=g.mul(g.sqrt(f),g.geom(g.div(f,low),k))
  elif rule=='total-degree Taylor composition':v=g.mul(xs[0],g.geom(xs[1],k))
  elif rule=='one ordinary derivative: (n+1)*higher total jet':
   need(row['requiredInputOrder']==k+1,'Retain every shifted derivative');v=g.mul(q(k+1),xs[0])
  elif rule=='parameter-independent endpoints; moving upper endpoint by FTC':v=g.mul(g.add(g.o,xs[1]),xs[0])
  elif rule=='actual root implicit Catalan recurrence':
   f,inv,z0=xs;dim=row['dimension'];a=g.mul(q(dim),f,inv);p=g.add(g.o,a);v=z0
   need(row['finiteCoefficientCount']==k*(k+1)//2 and row['actualLinearUnknownAlreadyInverted'],'Full finite implicit coefficients')
   for m in range(1,k+1):
    for j in range(1,m+1):
     c=(math.comb(2*j-2,j-1)//j)*math.comb(m-1,j-1)
     v=g.add(v,g.mul(q(c),g.pow(a,j),g.pow(p,j-1)))
  elif rule=='actual square-seed cutoff finite Taylor composition':
   arg,scale=xs;shift=row['sourceDerivativeShift'];v=g.z;power=g.o
   need(k+shift<=42,'Actual seed derivative cone is complete')
   for j in range(k+1):v=g.add(v,g.mul(q(sigma[j+shift],math.factorial(j)),power));power=g.mul(power,arg)
   v=g.mul(scale,v)
  elif rule=='B_rho positive differentiated geometric series on |Y|<=5':
   Q,rho,La=xs;v=g.z;coeff=row['coefficients'];need(len(coeff)==(k+1)*(k+2)//2,'Every natural mixed coefficient')
   stir=[[0]*(k+1) for _ in range(k+1)];stir[0][0]=1
   for rr in range(1,k+1):
    for j in range(rr+1):stir[rr][j]=j*stir[rr-1][j]+(stir[rr-1][j-1] if j else 0)
   for r in coeff:
    rr,mm=r['radialOrder'],r['etaOrder'];need(rr+mm<=k,'Natural total degree retained')
    if row['coordinate']=='physical X':a=g.mul(q(math.factorial(rr+mm)*2**(rr+mm+1),20**rr*math.factorial(rr)*math.factorial(mm)),g.pow(La,rr))
    else:
     a=g.z
     for j in range(rr+1):
      if stir[rr][j]:a=g.add(a,q(stir[rr][j]*math.factorial(mm+j)*2**(mm+j+1),4**j*math.factorial(rr)*math.factorial(mm)))
    need(a==r['coefficientRoot'],'Actual differentiated natural coefficient')
    v=g.add(v,g.mul(Q,g.pow(rho,-mm),a))
  elif rule=='Cauchy on the actual Omega tube; |g|<1 and radius >=rho':v=g.mul(q(2*(k+1)),g.pow(xs[0],-k))
  elif rule=='positive-measure representation, |P|<=5K on |Im eta|<=1/16':v=g.mul(q(5),xs[0],g.geom(q(32),k))
  elif rule=='actual physical-X prefix; eta integration and radial FTC':v=g.mul(q(4),xs[1],xs[0])
  elif rule=='regular original source integral X/L*integral s Rr(sX)/Rr(X) Sq':v=g.mul(xs[3],xs[2],xs[1],xs[0])
  elif rule=='regular original source integral L^-1*integral Sn':v=g.mul(xs[1],xs[0])
  elif rule=='literal decay and actual Amp/affine M,J pulse with exact zero exterior':v=g.add(q(8),xs[1],xs[0])
  elif rule=='all five actual histories plus the exact ideal endpoint primitives':v=g.add(*(g.add(xs[j],xs[j+5]) for j in range(5)))
  elif rule=='integral_0^1 (1-s) R_second(s*z) ds':
   need(row['requiredTiltOrder']==k+2 and not row['divisionByP2'],'No formal p2 divided difference');v=g.mul(q((k+1)*(k+2)),xs[0])
  elif rule=='Dy^r B(y,eta,N*y)=sum binom(r,j) N^j B_(y^(r-j),phase^j)':
   need(row['etaPhaseDerivative']==0 and row['sameN'],'Actual frozen eta phase');factor=g.pow(g.add(g.o,xs[1]),k)
   need(factor==row['factor'],'Every original N chain factor');v=g.div(g.mul(factor,xs[0]),xs[1])
  elif rule=='same-N actual density integral over fixed log-radius endpoints':
   need(row['allQuadraticCrossTermsRetained'],'Actual cross terms retained');v=g.mul(xs[1],xs[0])
  elif rule=='Gamma recurrence and finite composition; X*[L(2d/X)]_eta,k <= loss':
   h=xs[0];v=g.mul(q(4),h);ph=g.o;p1h=g.o
   need(row['radialDecayRetained']=='1/X' and row['improperTailIncluded'],'Full heat tail with radial decay')
   for j,r in enumerate(row['gammaMomentRows'],1):
    ph=g.mul(ph,g.add(h,q(j-1)));p1h=g.mul(p1h,g.add(h,q(j)));term=g.mul(q(6**j,math.factorial(j)),ph,p1h)
    need(r=={'order':j,'gammaRatioRoot':p1h,'fallingHeatRoot':ph,'term':term},'Actual Gamma factors')
    v=g.add(v,term)
   need(len(row['gammaMomentRows'])==k,'No heat derivative omitted')
  else:unknown.append(rule);continue
  need(v==row['root'],'Original ledger root changed: '+row['label']+' order '+str(k));counts[rule]+=1;labels.append(row['label']);rules.setdefault(rule,[]).append(k)
 need(not unknown,'Unreviewed actual scalar rules: '+str(unknown))
 need(len(labels)==len(program['ledger']) and len(labels)>100,'Every ledger row independently replayed')
 need({'actual pre-loop E on J','actual pre-loop a on J','removable Q at p2=0','same actual circle inverse lift','same nonnegative actual C1 mu root'}.issubset(labels),'Actual native denominator and implicit rules present')
 C,S=g.param('CSelected'),g.param('sourceEnvelopeS')
 floors={
  'actual pre-loop E on J':(1,g.pow(C,-3)),
  'actual pre-loop a on J':(1,g.pow(C,-122)),
  'same nonnegative actual C1 mu root':(1,g.exp(g.pow(S,14))),
  'same actual circle inverse lift':(1,g.mul(g.q(16),g.pow(S,2))),
  'actual outer positive Amp':(1,g.q(20,7)),
  'same actual B8 root at arbitrary finite eta order':(1,g.q(2)),
  'same actual continuous I1 root at arbitrary finite eta order':(1,g.q(2)),
  'same actual I2 heat compensating root at arbitrary eta order':(1,g.q(2))}
 for label,(slot,expected) in floors.items():
  rows=[r for r in program['ledger'] if r['label']==label];need(rows and all(r['inputs'][slot]==expected for r in rows),'Unchanged actual reciprocal/Jacobian floor '+label)
 qfloor=g.exp(g.mul(g.q(-1),g.pow(S,14)))
 need(all(r['actualValueLower']==qfloor for r in program['ledger'] if r['label']=='removable Q at p2=0'),'Unchanged actual variance floor')
 return {'sourceNormNodes':len(g.nodes),'everyActualLedgerRowReplayed':len(labels),'ruleCounts':dict(counts),
  'maximumActualLedgerOrder':max(r['order'] for r in program['ledger']),'originalNormRoots':program['roots'],
  'sameFullMixedImplicitCoefficients':True,'allNaturalStirlingAndPhysicalTermsRetained':True,
  'sameOriginalFiniteNChainFactors':True,'allHeatGammaFactorsAndOneOverXDecayRetained':True}

def compose(d,h):
 leading,c1,i1,i2,amp,env,b26,b34,loop=[d[k] for k in ('leading','c1','i1','i2','amplitude','envelope','b26','b34','loop-proof')]
 need(leading['schema']=='MathScope.N6.ActualCompletedLeadingFrozenApplication/1' and leading['fixedDefinitionSHA256']==FIXED and leading['sourceHeaderSHA256']==HEADER,'Actual completed leading source theorem')
 need(c1['schema']=='MathScope.N6.ActualC1C12RegularityComposition/1' and all(c1['provedActualConclusions'].values()),'Actual complete C1/C12 hypotheses')
 natural,nb=d['natural'],d['natural-binding']
 need(h['natural']==c1['inputSHA256']['natural']=='4b94c652630c250f883622601d1d9d4998c412927fe3bc4352ba5e8c70e2fe3d','Actual independent natural quantitative proof')
 need(natural['schema']=='MathScope.N6.ActualNaturalIndependentBanachMajorant/1' and natural['fixedDefinitionSHA256']==FIXED,'Actual natural Banach theorem')
 need(natural['derivedMathematicalConclusion']['normBound']=='Q' and natural['coefficientSpace']['allUnboundedMixedIndices'],'Actual all-order B_rho bound')
 need(natural['sourceInputs']['actualPressureRoot']==3451 and natural['sourceInputs']['actualPositiveGRoot']==3498 and natural['sourceInputs']['actualInfiniteTailRetained'],'Literal actual P0/g inputs')
 need(nb['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1' and nb['fixedDefinitionSHA256']==FIXED,'Actual original natural kernel replay')
 need(nb['sourceSHA256']==natural['originalKernel']['sha256']=='d657bc94665ccc6b373fe951d76998f60b52869c2e7e19d5713f8ba0ccb96815','Same original natural source kernel')
 for key in ('allActualCoreRootsEqual','fullActualPressureDefinitionEqual','fullActualOuterProgramEqual','fullActualSourceProfileEqual','sourceKernelBytesUnchanged','negativeControlPressureRootMutationRejected'):need(nb[key],'Actual original natural binding '+key)
 pa=natural['actualPressureASTVerification']
 need(nb['pressurePrimitiveAncestorCount']==pa['pressurePrimitiveAncestorCount']==287 and nb['pressurePrimitiveASTSHA256']==pa['pressurePrimitiveASTSHA256']=='19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152','Same complete 287-node actual pressure AST')
 for key in ('envelope','b26','b34','loop-proof'):need(c1['inputSHA256'][key]==h[key],'Same actual C1 quantitative input '+key)
 need(env['explicitCExponentBudget']['actualInverseA']==122 and env['explicitCExponentBudget']['sourceS']==100000,'Original a and S floors')
 need(b26['actualB26']['EInverseUpper']=='CSelected^3' and b34['derivedBounds']['actualEInverseUpper']=='CSelected^3','Actual stronger E floor on B26/B34')
 need(b34['inputSHA256']['b26']==h['b26'],'Same actual B34 incoming E floor')
 need(loop['schema']=='MathScope.N6.ActualC1NativeRegularityProof/1' and loop['originalProducerBindingExecuted'] and loop['actualScalarASTCheck']['actualMeanRatioAndSecondDerivativeIndependentlyCompared'],'Original variance/circle formula proof')
 need(i1['actualSourceProofInputsComposed'] and i1['sameActualI1Root']['existsUniqueInOriginalBox'] and i1['inputSHA256']['c1']==h['c1'],'Actual I1 Jacobian and correct finite-N input')
 need(i2['actualSourceProofInputsComposed'] and i2['sameActualI2Root']['existsUniqueInOriginalBox'] and i2['inputSHA256']['i1']==h['i1'],'Actual I2 Jacobian and full heat debts')
 need(leading['inputSHA256']['i1']==h['i1'] and leading['inputSHA256']['i2']==h['i2'],'Same completed leading repairs')
 need(amp['schema']=='MathScope.N6.ActualOuterAmplitudeQuantitative/1' and amp['fixedDefinitionSHA256']==FIXED,'Actual outer amplitude theorem')
 need(amp['inputSHA256']['outer']==leading['inputSHA256']['outer'],'Same actual complete outer source')
 ac=amp['provedActualUniformConclusions']
 need(ac['actualAmplitudeInsideOriginalBracket'] and ac['actualDerivativeStrictlyAboveOriginalFloor'] and ac['allPulsePolynomialAndAffineCoefficientsHolomorphic'],'Actual original amplitude branch')
 need(ac['actualAngularAndPulseCoefficientNormUpper']=='CSelected^32' and ac['actualAmplitudeAndCoefficientCauchyRadius']=='1/8','Same original complex coefficient constants')
 return {'actualEPositiveFloor':'CSelected^-3 on the actual full pre-loop rectangle',
  'actualNaturalBanachNormUpper':'Q','actualPressureHolomorphicValueUpper':'5*K on abs(Im eta)<=1/16, from actual positive-measure mass<4*K',
  'actualGHolomorphicValueUpper':'exp(-1)<1 on distance(eta,I)<sigmaStar^2/2048; every rho-radius circle is inside that tube',
  'actualAPositiveFloor':'CSelected^-122','actualVarianceQPositiveFloor':'exp(-sourceEnvelopeS^14)',
  'actualMuJacobianInverseUpper':'exp(sourceEnvelopeS^14)','actualCircleSlopeInverseUpper':'16*sourceEnvelopeS^2',
  'actualRootJacobianInverseUpper':{'B8':'2','I1':'2','I2':'2'},
  'actualOuterCoefficientUpper':'CSelected^32','actualOuterCauchyRadius':'1/8',
  'physicalEtaConvention':'abs(eta)<1, with every fixed one-sided jet at eta=+-1; no negative heat argument'}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--binding',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--source-only',action='store_true')
 for name in ('leading','c1','i1','i2','amplitude','envelope','b26','b34','loop-proof','natural','natural-binding'):p.add_argument('--'+name,type=Path)
 a=p.parse_args();b=json.loads(a.binding.read_text(encoding='utf8'));audit=replay(b)
 changed=copy.deepcopy(b);changed['normProgram']['ledger'][0]['root']=-1
 # Rehash the adverse fixture: rejection must come from the rule, not merely
 # the outer hash, which is also an explicit authenticated input check.
 changed['normProgramSHA256']=hashlib.sha256(canonical(changed['normProgram']).encode()).hexdigest()
 try:replay(changed)
 except AssertionError:pass
 else:raise AssertionError('Accepted changed actual scalar ledger root')
 result={'schema':'MathScope.N6.ActualLeading10x24Majorant/1','sourceHeaderSHA256':HEADER,'fixedDefinitionSHA256':FIXED,
  'bindingSHA256':sha(a.binding),'independentScalarReplay':audit,'actualAnalyticInputsComposed':False,
  'actualLeading10x24MajorantProved':False,'actualBnormBoundsBackgroundJetsProvedHere':False,
  'strictNegativeControls':{'changedActualScalarRootWithValidOuterHashRejected':True},
  'proof':'ACTUAL_LEADING_10X24_MAJORANT_KO.md','wholeGOnJProved':False,
  'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.source_only:
  paths={k:getattr(a,k.replace('-','_')) for k in ('leading','c1','i1','i2','amplitude','envelope','b26','b34','loop-proof','natural','natural-binding')}
  need(all(paths.values()),'All actual analytic inputs required or use --source-only')
  d={k:json.loads(v.read_text(encoding='utf8')) for k,v in paths.items()};h={k:sha(v) for k,v in paths.items()}
  result.update({'actualAnalyticInputsComposed':True,'actualLeading10x24MajorantProved':True,'inputSHA256':h,'actualFiniteDenominatorAndRootFloors':compose(d,h)})
 result['excluded']=['No derivative is replaced by zero, unknown formal symbols or an enlarged source constant.','The current n1 coefficient/Picard-auxiliary quantitative recurrence and the original Bnorm dominance/covariance application are separate obligations.','No open extension of the original Laplace kernel to negative arguments.']
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'everyOriginalScalarLedgerRuleReplayed':audit['everyActualLedgerRowReplayed'],'actualLeading10x24Majorant':result['actualLeading10x24MajorantProved'],'BnormPromoted':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
