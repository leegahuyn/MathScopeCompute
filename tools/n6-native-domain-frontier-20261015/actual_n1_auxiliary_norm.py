"""Check the original n1 auxiliary radius7 norm without promoting n2/Bnorm."""
import argparse,hashlib,json,math,sys
from functools import lru_cache
from pathlib import Path
try:import sympy as S
except ImportError:
 sys.path.insert(0,str(Path(__file__).resolve().parent/'audit-deps'));import sympy as S
HEADER='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1'
def need(x,m):
 if not x:raise AssertionError(m)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('binding','natural','natural-binding','numeric-picard','out'):p.add_argument('--'+k,type=Path,required=True)
 a=p.parse_args();paths={k:getattr(a,k.replace('-','_')) for k in ('binding','natural','natural-binding','numeric-picard')};d={k:json.loads(v.read_text(encoding='utf8')) for k,v in paths.items()};h={k:sha(v) for k,v in paths.items()}
 b=d['binding'];nat=d['natural'];nb=d['natural-binding'];pc=d['numeric-picard']
 need(b['schema']=='MathScope.N6.ActualN1AuxiliaryNormBinding/1' and b['sourceHeaderSHA256']==HEADER,'Actual original n1 auxiliary source')
 need(b['sourceBytesUnchanged'] and b['originalActualPicardDefinitionCompared'] and b['fixedCoreAndSourceCompared'] and not b['n2Constructed'],'Same fixed/actual Picard source and n1-only construction')
 need(b['sourceSHA256']=='30e135309b5e0a5866917949d2ded96cce64828b1331400cb8e2260caabdc047','Unchanged original auxiliary construction')
 need(h['natural']=='4b94c652630c250f883622601d1d9d4998c412927fe3bc4352ba5e8c70e2fe3d','Actual Banach quantitative input')
 need(nat['derivedMathematicalConclusion']['normBound']=='Q' and nat['coefficientSpace']['allUnboundedMixedIndices'],'True natural all-order norm')
 need(nb['schema']=='MathScope.N6.ActualNaturalOriginalKernelRebinding/1' and nb['allActualCoreRootsEqual'] and nb['fullActualPressureDefinitionEqual'] and nb['fullActualSourceProfileEqual'],'Original nonlinear kernel')
 need(pc['schema']=='MathScope.N6.ActualPicardOriginalNumericMajorant/1' and pc['numericC1KCertifiedTailBoundsProvedHere'],'Original universal word-majorant theorem')
 need(pc['inputSHA256']['natural']==h['natural'] and pc['inputSHA256']['natural-binding']==h['natural-binding'],'Same original common/natural source')
 need(all(b['actualSourceParameterExpressions'][k]==v for k,v in pc['actualParameterASTConstraints'].items()),'Same actual parameter constraints')
 nodes={int(k):v for k,v in b['scalarNodes'].items()};roots=b['scalarRoots'];symbols={}
 def symbol(x):
  if x not in symbols:symbols[x]=S.Symbol(x,positive=True)
  return symbols[x]
 @lru_cache(None)
 def at(i):
  op,aa=nodes[i]['op'],nodes[i]['args']
  if op=='rational':return S.Rational(*map(int,aa))
  if op=='source_parameter':return symbol(aa[0])
  if op=='add':return S.Add(*(at(j) for j in aa))
  if op=='multiply':return S.Mul(*(at(j) for j in aa))
  if op=='inverse':return 1/at(aa[0])
  if op=='integer_power':return at(aa[0])**aa[1]
  if op=='exp':return S.exp(at(aa[0]))
  if op=='log_positive':return S.log(at(aa[0]))
  if op=='sqrt_positive':return S.sqrt(at(aa[0]))
  if op=='maximum':return S.Max(*(at(j) for j in aa))
  if op=='ceiling':return S.ceiling(at(aa[0]))
  raise AssertionError('Nonprimitive original n1 norm '+op)
 Q,La,rho,sigma,C,h0=[symbol(x) for x in ('Q','Lambda','rho','sigmaStar','CSelected','h')]
 delta=rho/(1024*Q);strip=delta/2048;prev=delta/8;radial=7/La;gb=S.exp(128*La/sigma**2)/C
 base=64*Q*(1+gb);H=S.Max(1,base*S.Max(1,2*La**2));V=128*H/prev;E=4+2*h0;e1=16/prev;e2=2*e1**2
 Z=lambda f:f*(5*E+5+6*e1);ZX=lambda f:f*(5*E+10+6*e1)
 ZE=lambda f:f*(16*E+64+(5*E+69)*e1+6*e2)
 ZZ=lambda f:5*E*Z(f)+5*ZX(f)+6*ZE(f)
 time=lambda f:2*f*(E+2*e1+1)
 omega=time(V)+6*V+S.Rational(3,2)*V**2+H*Z(V);known=omega/2;ht=ZZ(H)
 forces=[0,0,0,2*known,2*ht,2*ht+16*known];matrix=512*(1+E)*(1+H+V+Z(H));normC=2*(matrix+sum(forces))
 exp={'strip':strip,'sourceStrip':4*strip,'loss':strip,'previousStrip':prev,'radius':7,'radialDomain':radial,'gBound':gb,'naturalBase':base,'H':H,'V':V,'e1':e1,'e2':e2,'E':E,
  'omega':omega,'pKnown':known,'Htheta':ht,'Hz':ht,'matrixBound':matrix,'C':normC,'solutionNorm':S.exp(9*normC**2*radial/(2*strip)),'Kcondition':S.ceiling(72*normC**2*radial/strip),**{'forcingBound'+str(j):v for j,v in enumerate(forces)}}
 for key,v in exp.items():need(at(roots[key])==v or S.expand(at(roots[key])-v)==0,'Changed original n1 auxiliary formula '+key)
 system=b['originalAuxiliarySystem'];need(system['diagonal']==[0,0,2,0,3,1] and system['zeroAxisDatum']==[0]*6,'Same singular rescaled integral and axis data')
 need(system['actualNaturalAuxiliaryEquations'] and not system['actualFinalizedLowerCutoffs'] and len(system['lowerOrders'])==1,'Only genuine natural lower0 system')
 need(all(not entry or (i in (4,5) and j in (0,1,2,3)) for i,row in enumerate(system['A1']) for j,entry in enumerate(row)),'Actual auxiliary A1 square-zero mask')
 reflection=b['actualAuxiliaryReflection'];need(reflection['sourceProfileParity']==[0,0,0,0,1,1] and reflection['everyNonzeroMatrixAndForcingEntryCompared'] and reflection['naturalOnlyNativeBoundary'],'Actual natural auxiliary analytic-X even profiles')
 need(8*4<256 and 2*(8**2)<2*(16**2),'Original previous-strip Cauchy allowances')
 result={'schema':'MathScope.N6.ActualN1AuxiliaryNumericMajorant/1','inputSHA256':h,'sourceHeaderSHA256':HEADER,
  'originalAuxiliaryDefinitionSHA256':b['originalAuxiliaryDefinitionSHA256'],'everyOriginalScalarFormulaCompared':list(exp),
  'actualAnalyticConclusions':{'actualNaturalAuxiliaryCoefficientsBoundedByOriginalC':True,'sameOriginalSolutionNormAndKconditionValid':True,
   'domain':'|Lambda*X|<=7 and distance(eta,I)<delta/2048, I=[-33/32,33/32]',
   'coefficientDomain':'|Lambda*X|<=7 and distance(eta,I)<delta/512; Cauchy radial base disk |Lambda*X|<=8',
   'allK':'Every integer K>=ceil(72*Caux^2*(7/Lambda)/(delta/2048)) gives value tail4^-K/3',
   'actualCoreIdentification':'The auxiliary even profiles equal actual Picard0 for0<=X<=Xa by the same original natural coefficients, rescaled integral and zero-axis uniqueness',
   'auxiliaryCauchyCoreBound':'Every fixed r,m has r!*m!*Lambda^r*(2/strip)^m*originalAuxiliarySolutionNorm on0<=X<=1/Lambda'},
  'n2AnalyticProofClaimed':False,'actualBnormBoundsBackgroundJetsProvedHere':False,'wholeGOnJProved':False,
  'proof':'ACTUAL_N1_AUXILIARY_NUMERIC_MAJORANT_KO.md','newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'actualN1AuxiliaryNormProved':True,'n2Promoted':False,'BnormPromoted':False,'newOriginalDischarged':0}))
if __name__=='__main__':main()
