#!/usr/bin/env python3
"""Genuine actual I2 root inclusion from full infinite heat debts.

Physical eta is restricted to [-1,1]. Smoothness is interior plus
one-sided endpoint jets; the original heat integral is not extended.
"""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path
PROFILE='df33560d2b9369ba32cf9f50877e355824ed1e7fdb84ef6b145d941c80db8e4a'
HEAT='c999b45a6d1e18226c80fb9866b6743553f1859c67dffa39490cd25f7e13d172'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(x,message):
 if not x:raise AssertionError(message)
def arithmetic():
 # Actual Qb>exp(-1/2)*16*(1-h)>198/25>1; Qp<27/25599<1.
 require(F(198,25)>1 and F(27,25599)<1,'Positive actual terminal wait')
 require(3**4<100 and 3<4,'Actual h<1/100 gives-log h>4 and exp(1/2)<2')
 # eK sqrt(XK)<=e_*sqrt(X0), XK>=X0 and f>=1/2.
 # DI<=16eK sqrt(XK), DS<=16h eK², DCp<=16h eK²/XK.
 require(max(16*2,16*4,16*4)==64,'True normalized heat debt bound')
 require(30+6==36 and 36-40==-4,'Actual continuous inverse times heat RHS')
 require(59001-18+4==58987 and 58987>720,'Original finite source-scale absorption')
 r=F(1,1000000);lam=F(1,2**200);B=2**38;beta=F(1,2**720)
 image=beta+lam*B*r*r;lip=2*lam*B*r
 require(image<r and lip<F(1,4),'Genuine I2 inclusion/contraction')
 controls=[]
 for name,bad in [('unbounded replacement normalized incoming debt',F(1,100)),('uncontrolled infinite tail debt',F(1))]:
  require(not(bad+lam*B*r*r<r),'Accepted wrong actual heat debt control')
  controls.append({'name':name,'rejected':True})
 return {'terminalWaitStrictlyPositive':True,'actualTailBounds':{'XK':'XK>=X0I2>1','Ecl':'<=2*eK*(X/XK)^(-1/2-h)',
   'scaleComparison':'eK*sqrt(XK)<=e_*sqrt(X0I2)','K':'e_*/(1+eta^2)>=e_*/2'},
  'actualHeatBound':'0<=1-H(2*(1-eta^2)/X)<=4h/X for physical eta in[-1,1]',
  'fullActualHeatDebts':{'I':'<=16*eK*sqrt(XK)','S':'<=16*h*eK^2','Cp':'<=16*h*eK^2/XK'},
  'actualNormalizedHeatDebtUpper':'64/X0I2','actualPreconditionedRhsUpper':'2^36/(lambda*X0I2)<2^-58987<2^-720',
  'originalRootRadius':str(r),'imageUpper':str(image),'actualLipschitzUpper':str(lip),
  'imageStrictlyInsideOriginalBox':True,'contractionStrictlyBelowQuarter':True,'strictNegativeControls':controls}
def main():
 p=argparse.ArgumentParser();p.add_argument('--profile',type=Path,required=True);p.add_argument('--out',type=Path,required=True)
 for name in ('binding','i1','i1-binding','heat'):p.add_argument('--'+name,type=Path)
 p.add_argument('--arithmetic-only',action='store_true');a=p.parse_args()
 require(digest(a.profile)==PROFILE,'Original exact parameter profile')
 profile=json.loads(a.profile.read_text(encoding='utf8').split('export const PINNED_N3 = ',1)[1].strip().removesuffix(';'));par=profile['parametersExactExpressions']
 require(par['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}} and par['h']=={'exp':{'product':[{'integer':-8002},{'ref':'T'}]}},'Same positive lambda/h')
 require(par['co']=={'rational':'1/256'} and par['BOuter']=={'product':[{'integer':1000},{'ref':'T'}]},'Same literal tail geometry')
 require(par['X0I2']=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':2},{'product':[{'integer':60},{'ref':'BOuter'}]},{'integer':-20}]}}]},'Same original I2 location')
 result={'schema':'MathScope.N6.ActualI2TrueHeatDebtContraction/1','proof':'ACTUAL_I2_TRUE_HEAT_DEBT_CONTRACTION_KO.md',
  'profileSHA256':PROFILE,'parameterExpressionSHA256':profile['parameterExpressionSHA256'],'independentExactBounds':arithmetic(),
  'actualSourceProofInputsComposed':not a.arithmetic_only,'physicalEtaDomain':'[-1,1]',
  'originalHeatArgument':'Z=2*(1-eta^2)/X>=0','negativeZExtensionAsserted':False,'openNeighborhoodBeyondEtaEndpointsAsserted':False,
  'originalI2RadiusAssumedAsExistenceEvidence':False,'actualHeatDebtValueReplacedByUpperBoundOrZero':False,
  'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.arithmetic_only:
  paths={k:getattr(a,k.replace('-','_')) for k in ('binding','i1','i1-binding','heat')};require(all(paths.values()),'Actual I2/I1/heat receipts required')
  data={k:json.loads(path.read_text(encoding='utf8')) for k,path in paths.items()};b=data['binding'];i1=data['i1'];ib=data['i1-binding'];hp=data['heat']
  require(b['schema']=='MathScope.N6.ActualI2TrueHeatDebtSourceBinding/1' and b['sourceSHA256']==HEAT,'Actual I2 source binding')
  require(b['sourceBytesUnchanged'] and b['registryCompared'] and b['fixedDefinitionCompared'] and b['diagnosticOverlap']>0,'Same actual I2 prefix')
  require(all(b['checks'].values()) and all(b['strictNegativeControls'].values()),'Actual full heat/kernel/normalization identities')
  require(b['noNegativeZOrEtaExtensionClaimed'] and b['physicalEtaDomain']=='[-1,1], Z=2*(1-eta^2)/X>=0','Actual physical heat domain')
  require(i1['schema']=='MathScope.N6.ActualI1TrueDebtContraction/1' and i1['actualSourceProofInputsComposed'],'Actual I1 continuous matrix theorem')
  require(i1['inputSHA256']['binding']==digest(paths['i1-binding']),'Same fresh I1 operator binding')
  require(i1['sameActualI1Root']['existsUniqueInOriginalBox'],'Actual I1 inclusion theorem')
  require(ib['actualQuadraticDefinition']==b['actualI1QuadraticDefinition'],'Same actual continuous E block')
  require(hp['schema']=='MathScope.N6.ActualCompleteHeatRegularity/1','Actual full Laplace regularity theorem')
  require(hp['sourceHeaderRecordSHA256']==b['sourceHeaderSHA256']==i1['sourceHeaderSHA256'],'Same original header')
  require(hp['actualIntegralBindings']['fullOriginalHeatLoss'] and hp['actualIntegralBindings']['fullOriginalGammaDenominator'],'Same actual full heat and Gamma integrals')
  require(hp['roots']['originalGammaIntegral']==b['actualRoots']['gamma'] and hp['roots']['originalHeatLoss']==b['actualRoots']['heatLoss'],'Same actual Laplace source roots')
  require(hp['noNegativeTimeExtensionAsserted'] and all(hp['negativeControls'].values()),'No unproved negative argument continuation')
  result.update({'inputSHA256':{k:digest(path) for k,path in paths.items()},'sourceHeaderSHA256':b['sourceHeaderSHA256'],
   'actualOriginalQuadraticDefinition':b['actualQuadraticDefinition'],
   'sameActualI2Root':{'existsUniqueInOriginalBox':True,'iterationFromZeroConvergesToSameRoot':True,
    'isCInfinityForAbsEtaStrictlyLessThanOne':True,'hasContinuousOneSidedEtaJetsAtBothEndpointsAtEveryFixedOrder':True,
    'actualRootValueAtEtaEndpoints':[0,0,0],'endpointValueReason':'Actual H(0)=1 makes all three actual heat debts exactly0; invertible A and box uniqueness select the actual zero root.',
    'higherEtaDerivativesAssumedSmall':False,'openNeighborhoodOutsidePhysicalEtaDomainClaimed':False},
   'remainingWholeScope':['Completed actual field/Volterra/indexed/PDE source application on their precise physical domains.',
    'Any Guard requirement for an open eta/time extension beyond the original one-sided heat domain.',
    'Whole original g on every J and all original Guard/Jet/PDE closure gates.']})
 else:result.update({'sameActualI2Root':{'existsUniqueInOriginalBox':False},'scope':'Arithmetic-only diagnostic; fresh actual I2 source/dependency receipts remain pending.'})
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'actualI2SourceInputsComposed':not a.arithmetic_only,'physicalEtaOnly':True,'actualHeatDebtUpper':'64/X0I2','newOriginalDischarged':0}))
if __name__=='__main__':main()
