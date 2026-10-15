"""Recover the unchanged actual Picard0 B/C1/norm/K constants.

No source constant changes. Complex eta is used only on the actual common
natural/B26 collar; the activation is differentiated in real X.
"""
from __future__ import annotations
import argparse,hashlib,importlib.util,json,math,os
from fractions import Fraction as F
from functools import lru_cache
from pathlib import Path
import sympy as S
HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
PICARD='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60'
def need(v,m):
 if not v:raise ValueError(m)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def canon(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def arithmetic():
 # All entries multiply the single retained B or B^2 and delta costs.
 rows={
  'B26LogFDerivativeOverLambdaQ':F(8,5),
  'B26LogFSecondDerivativeOverLambdaSquaredQSquared':F(8,25)+F(64,25),
  'B26FxxOverLambdaSquaredQcubedOverT1':6*(4+16+3),
  'B26UxxOverLambdaQOverT1':F(8,5)+F(1,25),
  'vOverBDelta':2*(4+4+6),
  'vEtaOverBDeltaSquared':4*28,
  'omegaOverB2DeltaSquared':2*(2*112+56)+28*(14+28)+2*(3*112+4*56)+2*(2*28+28),
  'firstZOverBDelta':2*(8+4+6),
  'firstZXOverBDelta':2*(8+4+4+6),
  'secondZOverBDeltaSquared':2*(12*36+3*144+4*44),
  'forcingOverB2DeltaSquared':2*4096+8*4096,
  'A0row4OverBDelta':76+104+32+38,
  'A0row5OverBDelta':32+108+16+16+38,
  'A1row4OverBDelta':20+24+24,
  'A1row5OverBDelta':32+12+12}
 need(rows['B26FxxOverLambdaSquaredQcubedOverT1']<2048,'Original Fxx allowance')
 need(rows['B26UxxOverLambdaQOverT1']<2,'Original Uxx allowance')
 need(rows['omegaOverB2DeltaSquared']<4096 and rows['secondZOverBDeltaSquared']<4096,'Original Omega/Z allowances')
 need(rows['forcingOverB2DeltaSquared']<65536,'Original forcing allowance')
 need(max(v for k,v in rows.items() if k.startswith(('A0','A1')))<512,'Original matrix allowance')
 need(2*512<262144 and 2*65536<262144,'Original C1 absorbs all words and forcing')
 # Universal original K condition; exact rational positive/negative controls.
 controls={'changedKconstantToOneRejected':F(9,1)/(2*F(1,16)*(16+1))>F(1,16),
  'original72ConditionPasses':F(9,1)/(2*F(1,16)*(1152+1))<F(1,16),
  'omittedActualRadialFactorRejected':F(4,1)!=F(2,1),
  'replacingStep32ByUncheckedNineNotUsed':rows['B26UxxOverLambdaQOverT1']==F(41,25)}
 need(all(controls.values()),'Universal original-constant controls')
 return {'exactRationalLedger':{k:str(v) for k,v in rows.items()},'strictNegativeControls':controls,
  'sameOriginalConstants':{'B':'4096*Lambda^2*Q^3/t1','C1':'262144*B^2/delta^2','loss':'delta/8','aSquared':'(4/Lambda)*exp(t1/16)',
   'solutionNorm':'exp(9*C1^2*aSquared/(2*loss))','Kcondition':'ceil(72*C1^2*aSquared/loss)'},
  'provedValueSeriesMajorant':'sum_(k>=0)||T^k G f|| <= (1+A)*exp(A^2/loss) <= exp(2*A^2/loss) <= original exp(9*A^2/(2*loss)), A=C1*a>=1',
  'provedOriginalTail':'For K>=ceil(72*A^2/loss), sum_(k>=K)||T^k Gf||<=4^(-K)/3.',
  'etaCauchyTail':'Each fixed m derivative has original factor m!*(16/delta)^m; the literal source Kprecision guarantees the original target 2^(-bits).'}
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('source-db','stage3','header','compact','natural','picard','repair'):p.add_argument('--'+k,type=Path)
 p.add_argument('--arithmetic-only',action='store_true');p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 result={'schema':'MathScope.N6.ActualPicardOriginalNumericMajorant/1',**arithmetic(),
  'proof':'ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT_KO.md','actualSourceAndAnalyticInputsComposed':False,
  'numericC1KCertifiedTailBoundsProvedHere':False,'actualBnormThresholdApplicationProved':False,
  'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.arithmetic_only:
  paths={k:getattr(a,k.replace('-','_')) for k in ('source-db','stage3','header','compact','natural','picard','repair')}
  need(all(paths.values()),'Provide every original source/analytic input or --arithmetic-only')
  need(digest(a.stage3)=='388a8c7adec5a221a789123bf06a2e087032ba7ce49cdd34d832132361a6a36f' and digest(a.header)==HEADER,'Same original fresh cache/header')
  spec=importlib.util.spec_from_file_location('numeric_picard_original_v3',a.stage3);v3=importlib.util.module_from_spec(spec);spec.loader.exec_module(v3)
  g=v3.Source(a.source_db);reg=v3.registries(json.loads(a.header.read_text(encoding='utf8')))
  C=json.loads(a.compact.read_text(encoding='utf8'));d=reg['picard'][0]
  need(d==C['definitions']['picard:0']['fullDefinition'] and hashlib.sha256(canon(d)).hexdigest()==PICARD,'Original Picard0 full definition')
  natural=json.loads(a.natural.read_text(encoding='utf8'));pc=json.loads(a.picard.read_text(encoding='utf8'));repair=json.loads(a.repair.read_text(encoding='utf8'))
  need(digest(a.natural)=='4b94c652630c250f883622601d1d9d4998c412927fe3bc4352ba5e8c70e2fe3d','Actual independent natural Banach proof')
  need(pc['actualPicardSHA256']==PICARD and pc['actualFixedSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b','Actual common collar and source')
  for key in ('actualCoefficientCInfinityXiAndCommonEtaHolomorphy','actualNaturalB26AllOrderMatchingAtXa','actualPicardAllFixedMixedDerivativeNormalConvergence'):need(pc['provedSubkernelConclusions'][key],'Actual Picard analytic premise '+key)
  need(repair['sourceHeaderSHA256']==HEADER and repair['actualSourceFormulaBindingsComplete'],'Same original activation step')
  need(repair['independentRationalPreservationCertificate']['universalStepFirstDerivativeUpper']==32,'Independent actual squared-Gaussian derivative bound')
  selected={};symbols={}
  def sym(name):
   if name not in symbols:symbols[name]=S.Symbol(name,positive=True)
   return symbols[name]
  @lru_cache(None)
  def at(i):
   n=g(i);selected[str(i)]=n;op=n['op'];aa=n['args']
   if op=='rational':return S.Rational(*map(int,aa))
   if op=='source_parameter':return sym(aa[0])
   if op=='add':return S.Add(*(at(x) for x in aa))
   if op=='multiply':return S.Mul(*(at(x) for x in aa))
   if op=='inverse':return 1/at(aa[0])
   if op=='integer_power':return at(aa[0])**aa[1]
   if op=='sqrt_positive':return S.sqrt(at(aa[0]))
   if op=='exp':return S.exp(at(aa[0]))
   if op=='log_positive':return S.log(at(aa[0]))
   if op=='ceiling':return S.ceiling(at(aa[0]))
   if op=='maximum':return S.Max(*(at(x) for x in aa))
   raise ValueError('Unexpected nonprimitive original Picard constant '+str(i)+' '+op)
  Q,La,t1,rho,Xa=[sym(k) for k in ('Q','Lambda','t1','rho','Xa')]
  delta=rho/(1024*Q);B=4096*La**2*Q**3/t1;C1=262144*B**2/delta**2;aa=Xa*S.exp(t1/16);loss=delta/8
  target=g(d['tail']['target']);need(target['op']=='rational' and target['args'][0]=='1','Original positive dyadic target')
  den=int(target['args'][1]);need(den>0 and den&(den-1)==0,'Original target power of two');bits=den.bit_length()-1;m=d['tail']['etaOrder']
  Kcond=S.ceiling(72*C1*C1*aa/loss);Kprecision=S.ceiling(S.Rational(1,2)*(bits+m*m+4*m+2*m/delta));K=S.Max(1,Kcond,Kprecision)
  expected={'sourceBound':C1,'sourceStrip':delta/4,'solutionStrip':delta/8,'loss':loss,'Kcondition':Kcond,'Kprecision':Kprecision,'K':K,
   'error':S.Rational(math.factorial(m),3)*(16/delta)**m*S.exp(-K*S.log(4))}
  bindings={}
  for name,value in expected.items():
   actual=at(d['tail'][name]);need(S.simplify(actual-value)==0,'Changed original Picard constant '+name);bindings[name]={'root':d['tail'][name],'exactSourceExpressionChecked':True}
  need(S.simplify(at(d['radialDomain'][1])**2-aa)==0,'Original common a^2')
  need(S.simplify(at(d['solutionNorm']['commonCollar'])-S.exp(9*C1*C1*aa/(2*loss)))==0,'Original displayed solution norm')
  need(len(selected)<1000,'Small constant proof cone')
  result.update({'actualSourceAndAnalyticInputsComposed':True,'numericC1KCertifiedTailBoundsProvedHere':True,
   'sourceHeaderSHA256':HEADER,'originalPicardSHA256':PICARD,'sourceConstants':bindings,'actualEtaOrder':m,'actualBits':bits,
   'inputSHA256':{k:digest(v) for k,v in paths.items() if k!='source-db'},'originalConstantCone':selected,
   'sourceScope':'Only actual Picard0 common collar and original requested eta tail. No arbitrary/global leading jet or Bnorm bound is promoted.'})
 else:result['scope']='Exact finite arithmetic diagnostic only; original analytic/source inputs are not yet composed.'
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'actualOriginalNumericC1KComposed':result['numericC1KCertifiedTailBoundsProvedHere'],'BnormPromoted':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
