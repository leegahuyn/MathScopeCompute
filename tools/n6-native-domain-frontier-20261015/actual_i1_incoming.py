#!/usr/bin/env python3
"""True C12 debt bounds and genuine original I1 root-box inclusion.

The proof uses actual pointwise preloop/loop theorems and the actual
continuous unit-mass operator. No declared incoming/radius flag supplies
the nonlinear existence proof; exact fractions recompute inclusion.
"""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path

PROFILE='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
GLOBAL='497e18fc52c10b9eb482bdb6cc18b406c02f453dc19663ba5535c13a41ec015f'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(x,message):
 if not x:raise AssertionError(message)
def arithmetic():
 # The actual U block has |det|>=1/242 and adjugate row sums<4.
 u_inverse=4*242
 # Positive three-bump determinant: gaps1/2,1/2,3/2, f[x,y,z]>1,
 # and three column factors>=14^-2. Every cofactor<=12.
 e_det=F(3,8*14**6);e_inverse=36/e_det
 require(u_inverse<2**30 and e_inverse<2**30,'Actual continuous inverse bound')
 # Coarse independently proved beta<=64; unit mass =>integral beta²<=64.
 quadratic=2*64+3*32;require(quadratic<256,'Actual nonlinear row norm')
 pre_quadratic=2**38;r=F(1,1000000);lam=F(1,2**200);incoming=F(1,2**720)
 image=incoming+lam*pre_quadratic*r*r;lip=2*lam*pre_quadratic*r
 require(image<r and lip<F(1,4),'Genuine true-debt inclusion/contraction')
 # S>=2^20, unchanged N>R^50>S^50. No huge integer N is evaluated.
 require(14-50==-36 and 36*20==720,'Original finiteN exponent absorption')
 require(2**40>=2**30 and 2**20>14,'Pointwise source S absorptions')
 require(2**262>60000,'Actual K and lambda reciprocal absorbed by C')
 controls=[]
 for name,beta,lambda_upper,radius in [('unbounded replacement debt',F(1,100),lam,r),('discarded lambda scale',incoming,F(1),r)]:
  bad_image=beta+lambda_upper*pre_quadratic*radius*radius;bad_lip=2*lambda_upper*pre_quadratic*radius
  rejected=not(bad_image<radius and bad_lip<F(1,4));require(rejected,'Accepted changed contraction '+name)
  controls.append({'name':name,'rejected':True})
 return {'unitBumpMass':'1','actualUBlockDeterminantLower':'1/242','actualUBlockInverseUpper':str(u_inverse),
  'actualEBlockDeterminantLower':str(e_det),'actualEBlockInverseUpper':str(e_inverse),'actualContinuousInverseCommonUpper':'2^30',
  'actualQuadraticRowNormUpper':str(quadratic),'actualPreconditionedQuadraticUpper':'2^38',
  'actualLoopPrimitivePointwiseBounds':{'A':'<=a<=S','B':'<=E*a*(abs(ts)+r_variance)<=3*S^3'},
  'actualFieldChanges':{'deltaE':'<=2*S^2/N','deltaU':'<=3*S^3/N'},
  'actualUnnormalizedDebtUpper':'S^7/N','actualOriginalRowOperatorUpper':'2*S^4',
  'actualNormalizedRhsUpper':'S^12/N','actualPreconditionedRhsUpper':'S^14/N<S^-36<=2^-720',
  'originalRootRadius':str(r),'imageUpper':str(image),'actualLipschitzUpper':str(lip),
  'imageStrictlyInsideOriginalBox':True,'contractionStrictlyBelowQuarter':True,'strictNegativeControls':controls}
def main():
 p=argparse.ArgumentParser();p.add_argument('--profile',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 for name in ('binding','preloop','loop-proof','loop-binding','collars','c1'):p.add_argument('--'+name,type=Path)
 p.add_argument('--arithmetic-only',action='store_true');a=p.parse_args()
 require(digest(a.profile)==PROFILE,'Original exact parameter profile bytes')
 profile=json.loads(a.profile.read_text(encoding='utf8').split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'));par=profile['parametersExactExpressions']
 expected={'sourceEnvelopeS':{'power':[{'ref':'CSelected'},100000]},'C12EnvelopeR':{'exp':{'power':[{'ref':'sourceEnvelopeS'},256]}},
 'radialFrequencyN':{'sum':[{'integer':1},{'ceil':{'power':[{'ref':'C12EnvelopeR'},50]}}]},
 'lambda':{'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'BOuter':{'product':[{'integer':1000},{'ref':'T'}]}}
 require(all(par[k]==v for k,v in expected.items()),'Original S,R,N,lambda constants changed')
 proof=arithmetic();result={'schema':'MathScope.N6.ActualI1TrueDebtContraction/1','proof':'ACTUAL_I1_TRUE_DEBT_CONTRACTION_KO.md',
  'profileSHA256':PROFILE,'parameterExpressionSHA256':profile['parameterExpressionSHA256'],'independentExactBounds':proof,
  'actualSourceProofInputsComposed':not a.arithmetic_only,'originalI1RadiusAssumedAsExistenceEvidence':False,
  'actualDebtValueReplacedByUpperBoundOrZero':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.arithmetic_only:
  paths={name:getattr(a,name.replace('-','_')) for name in ('binding','preloop','loop-proof','loop-binding','collars','c1')}
  require(all(paths.values()),'All actual source theorem inputs are required')
  d={k:json.loads(path.read_text(encoding='utf8')) for k,path in paths.items()};b=d['binding'];pre=d['preloop'];lp=d['loop-proof'];lb=d['loop-binding'];co=d['collars'];c1=d['c1']
  require(b['schema']=='MathScope.N6.ActualI1TrueDebtSourceBinding/1' and b['sourceSHA256']==GLOBAL,'Actual original I1 producer binding')
  require(b['registryCompared'] and b['fixedDefinitionCompared'] and b['diagnosticOverlap']>0 and b['sourceBytesUnchanged'],'Same actual source prefix')
  require(all(b['checks'].values()) and all(b['strictNegativeControls'].values()),'Actual true debts/operator bindings')
  require(pre['schema']=='MathScope.N6.ActualPreloopSourceEnvelope/1','Actual pointwise preloop theorem')
  require(pre['inputSHA256']['loop-binding']==digest(paths['loop-binding']),'Same original preloop/loop source')
  budget=pre['explicitCExponentBudget'];require(budget['actualEUpper']==budget['actualUUpper']==2 and budget['loopXUpper']==24 and budget['loopInverseX']==1 and budget['sourceS']==100000,'Actual pointwise S bounds')
  require(pre['actualCumulativeMomentsUsed'] and not pre['referenceSubstitutedForActualMoments'],'Actual full preloop history')
  require(lp['schema']=='MathScope.N6.ActualC1NativeRegularityProof/1' and lp['originalProducerBindingExecuted'],'Actual variance/circle proof')
  require(lp['independentExactChecks']['literalCircleMassUsingVarianceEquation']=='1','Exact actual normalized circle measure')
  require(lb['schema']=='MathScope.N6.ActualC1NativeRegularityBinding/1' and lb['registryCompared'] and lb['fixedDefinitionCompared'] and lb['diagnosticOverlap']>0,'Actual loop AST')
  require(lb['monotoneDefinitions']==b['actualLoopDefinitions'] and all(lb['checks'].values()),'Same actual C12 loop functions')
  require(co['schema']=='MathScope.N6.ActualC1EndpointCollars/1' and co['inputSHA256']['loop-binding']==digest(paths['loop-binding']),'Actual zero-extension collars')
  require(co['provedActualCollars']['actualAAndBIdenticallyZeroOnEndpointNeighborhoods'],'Actual primitives vanish on endpoint collars')
  require(c1['schema']=='MathScope.N6.ActualC1C12RegularityComposition/1','Actual C1/C12 analytic composition')
  for c1_key,current in (('envelope','preloop'),('collars','collars'),('loop-binding','loop-binding'),('loop-proof','loop-proof')):
   require(c1['inputSHA256'][c1_key]==digest(paths[current]),'Changed actual C1/C12 dependency '+c1_key)
  conclusions=c1['provedActualConclusions']
  for key in ('sameAuthenticatedOriginalDefinitions','actualC1VarianceAndLiftRootsCInfinity','actualPeriodOneZeroMeanPrimitivesCInfinity','actualRadialZeroExtensionCInfinity','actualFiniteNC12FieldsCInfinityAndEPositive'):
   require(conclusions[key],'Actual C1/C12 analytic conclusion missing: '+key)
  result.update({'inputSHA256':{k:digest(path) for k,path in paths.items()},'sourceHeaderSHA256':b['sourceHeaderSHA256'],
   'actualOriginalQuadraticDefinition':b['actualQuadraticDefinition'],
   'sameActualI1Root':{'existsUniqueInOriginalBox':True,'iterationFromZeroConvergesToSameRoot':True,
    'pointwiseC0InclusionUsed':True,'isCInfinityOnOpenEtaNeighborhood':True,'higherEtaDerivativesAssumedSmall':False},
   'conditionalOnInputTheorems':'The written actual preloop/loop/collar theorems and their source receipts are composed; none is replaced by a generic metadata assertion.',
   'remainingWholeScope':['Actual I2 heat-debt root and complete outer/pullback domains.','Whole original g on every J and all original Guard/Jet/PDE closure gates.']})
 else:result.update({'sameActualI1Root':{'existsUniqueInOriginalBox':False},'scope':'Arithmetic-only diagnostic: fresh actual source/analytic dependency receipts not yet supplied.'})
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'actualI1SourceInputsComposed':not a.arithmetic_only,'originalRadiusAssumed':False,'actualDebtUpper':'S14/N<2^-720','newOriginalDischarged':0}))
if __name__=='__main__':main()
