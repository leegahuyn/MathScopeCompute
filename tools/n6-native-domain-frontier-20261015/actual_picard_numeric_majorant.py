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
 for k in ('source-db','stage3','header','compact','natural','natural-binding','leading-binding','payload','picard','repair'):p.add_argument('--'+k,type=Path)
 p.add_argument('--arithmetic-only',action='store_true');p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 result={'schema':'MathScope.N6.ActualPicardOriginalNumericMajorant/1',**arithmetic(),
  'proof':'ACTUAL_PICARD_ORIGINAL_NUMERIC_MAJORANT_KO.md','actualSourceAndAnalyticInputsComposed':False,
  'numericC1KCertifiedTailBoundsProvedHere':False,'actualBnormThresholdApplicationProved':False,
  'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.arithmetic_only:
  paths={k:getattr(a,k.replace('-','_')) for k in ('source-db','stage3','header','compact','natural','natural-binding','leading-binding','payload','picard','repair')}
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
  nb=json.loads(a.natural_binding.read_text(encoding='utf8'));lb=json.loads(a.leading_binding.read_text(encoding='utf8'));payload=json.loads(a.payload.read_text(encoding='utf8'))
  need(digest(a.payload)=='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1','Exact actual fixed/coefficient diagnostics')
  need(payload['fullNativePayloadSHA256']['fixed']==pc['actualFixedSHA256'] and payload['fullNativePayloads']['picard:0']==d,'Same actual native/function ASTs')
  for key,path in (('majorant',a.natural),('natural_binding',a.natural_binding),('leading_binding',a.leading_binding)):
   need(pc['inputBindings'][key]['sha256']==digest(path),'Same independently composed Picard source premise '+key)
  need(nb['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1' and nb['fixedDefinitionSHA256']==pc['actualFixedSHA256'],'Actual original natural kernel rebinding')
  for key in ('allActualCoreRootsEqual','fullActualPressureDefinitionEqual','fullActualOuterProgramEqual','fullActualSourceProfileEqual','sourceKernelBytesUnchanged'):need(nb[key],'Actual natural source equality '+key)
  need(nb['pressurePrimitiveAncestorCount']==natural['actualPressureASTVerification']['pressurePrimitiveAncestorCount']==287 and nb['pressurePrimitiveASTSHA256']==natural['actualPressureASTVerification']['pressurePrimitiveASTSHA256']=='19a9eec59702f233d4744083aaef545f0d600d5549177ee8e8b3a143535c8152','Same complete actual pressure input')
  need(lb['schema']=='MathScope.N6.ActualPicardLeadingConstructorBinding/1' and lb['sourceSHA256']=='3deb02f1f7c9dfd0d0fc7936050eead9514f0e11e44ecb5bd4053073c2518ad8','Actual unchanged inner coefficient constructor')
  need(all(lb['checks'].values()) and lb['sourceBytesUnchanged'] and lb['sourceLeading']==d['sourceLeading'],'Actual F/U/v/omega constructors and Xi-squared substitutions')
  par=payload['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
  parameter_constraints={
   'Q':{'quotient':[{'product':[{'integer':str(2**260)},{'ref':'K'}]},{'power':[{'ref':'sigmaStar'},2]}]},
   'Lambda':{'power':[{'ref':'Q'},64]},'rho':{'quotient':[{'power':[{'ref':'sigmaStar'},2]},{'integer':65536}]},
   'Xa':{'quotient':[{'integer':4},{'ref':'Lambda'}]},'t1':{'power':[{'ref':'CSelected'},-120]},
   'CSelected':{'exp':{'ref':'logCSelected'}},
   'logCSelected':{'sum':[{'product':[{'integer':10},{'log':{'sum':[{'integer':1},{'ref':'BRefUpper'}]}}]},{'power':[{'ref':'Q'},200]}]},
   'BRefUpper':{'power':[{'ref':'Q'},300]},'j0':{'power':[{'ref':'h'},4]},
   'sigmaStar':{'quotient':[{'ref':'j0'},{'integer':2000}]},'K':{'power':[{'ref':'Pstar'},2]},
   'Pstar':{'exp':{'ref':'logP'}},'logP':{'product':[{'integer':2},{'ref':'T'}]},
   'h':{'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'T':{'sum':[{'exp':{'ref':'Md'}},{'integer':10}]},'Md':{'integer':1048576}}
  for key,value in parameter_constraints.items():need(par[key]==value,'Original admissible source parameter expression '+key)
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
  need(S.simplify(at(d['solutionNorm']['naturalExtensionToY5'])-S.exp(45*C1*C1/(2*La*loss)))==0,'Original natural-extension solution norm')
  need(d['solutionNorm']['naturalExtensionNotUsedAsActualActivation'] is True,'Natural auxiliary bound cannot replace the actual B26 activation')
  # Bind B independently of the resulting C1 expression, rather than only
  # accepting an algebraically equal total sourceBound.
  b_nodes=[i for i in selected if at(int(i))==B]
  need(len(b_nodes)==1,'One retained literal original B formula in the C1 ancestry')
  Broot=int(b_nodes[0]);need(g(Broot)['op']=='multiply','Original B must be a retained product body')
  need(len(selected)<1000,'Small constant proof cone')
  result.update({'actualSourceAndAnalyticInputsComposed':True,'numericC1KCertifiedTailBoundsProvedHere':True,
   'sourceHeaderSHA256':HEADER,'originalPicardSHA256':PICARD,'sourceConstants':bindings,'actualEtaOrder':m,'actualBits':bits,
   'independentActualBFormula':{'root':Broot,'node':g(Broot),'exactFormula':'4096*Lambda^2*Q^3/t1','checkedSeparatelyFromC1':True},
   'bothOriginalSolutionNormFields':{'commonCollar':{'root':d['solutionNorm']['commonCollar'],'formula':'exp(9*C1^2*aSquared/(2*loss))','domain':'0<=xi<=a, distance(eta,I)<delta/8'},
    'naturalExtensionToY5':{'root':d['solutionNorm']['naturalExtensionToY5'],'formula':'exp(45*C1^2/(2*Lambda*loss))','domain':'Separate natural analytic six-profile operator: |Lambda*X|<=5, distance(eta,I)<delta/8','agreementWithActualPicard0':'Only on 0<=X<=Xa, by the same natural coefficients and zero-axis uniqueness','actualB26ActivationReplaced':False,'storedCommonCollarKNotAssertedAsY5TailIndex':True}},
   'actualParameterASTConstraints':parameter_constraints,
   'universalSourceScopedQuantifiers':{'source':'Only this authenticated Picard0, with every unchanged pinned source parameter expression',
    'realInputs':'Every real eta in I=[-33/32,33/32] and 0<=xi<=sqrt(Xa*exp(t1/16))',
    'commonValueTube':'distance(eta,I)<delta/8; C1 and coefficient bounds use the larger source tube delta/4',
    'fixedEtaDerivativeTube':'distance(eta,I)<=delta/16, including every real eta in I',
    'allK':'Every integer K>=ceil(72*(C1*a)^2/loss); this is the exact original Kcondition predicate',
    'allFixedM':'Every integer m>=0 has derivative tail m!*(16/delta)^m*4^(-K)/3 on the smaller tube',
    'precisionPredicate':'For each admissible original requested bits,m, K>=max(1,Kcondition,ceil((bits+m^2+4*m+2*m/delta)/2)) implies that actual m-tail<=2^(-bits)',
    'originalStoredKScope':'The concrete original stored K is checked for its own stored etaOrder/bits; it is not claimed to reach 2^(-bits) for every other m at that same K',
    'jointPatching':'The real eta derivative factorial bounds define compatible Taylor sums on overlapping discs; uniform ordinary-X derivatives of the same actual natural/B26 formulas and all-order matching at Xa make the extension jointly C-infinity in xi and holomorphic in eta'},
   'inputSHA256':{k:digest(v) for k,v in paths.items() if k!='source-db'},'originalConstantCone':selected,
   'sourceScope':'Only actual Picard0 common collar and original requested eta tail. No arbitrary/global leading jet or Bnorm bound is promoted.'})
 else:result['scope']='Exact finite arithmetic diagnostic only; original analytic/source inputs are not yet composed.'
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'actualOriginalNumericC1KComposed':result['numericC1KCertifiedTailBoundsProvedHere'],'BnormPromoted':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
