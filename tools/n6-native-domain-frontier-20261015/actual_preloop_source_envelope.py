"""Compose actual profile proofs with the explicit C-exponent budget.

The analytic inequalities, including all branch and derivative bounds, are in
ACTUAL_PRELOOP_SOURCE_ENVELOPE_KO.md. This checks their actual source inputs and
finite exponent arithmetic; it does not replace those inequalities by flags.
"""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path

def require(v,message):
 if not v:raise AssertionError(message)

def verify_budget(b):
 require(b['referenceMomentsEta0To2']+b['referenceFieldsEta0To2']+2+2*b['referenceInverseF']+1<b['referenceSourceFirstEta'],'Reference differentiated quotient budget')
 require(b['actualB26EEta']+3<=b['actualEllIEta'],'Actual endpoint logarithm budget')
 require(b['actualB34EEta']+b['loopXUpper']+12+2+2<b['incomingMomentEta'],'Incoming eta integral budget')
 require(b['actualB8RhsEta']+2<=b['actualB8RootEta'],'Actual IFT derivative budget')
 require(1+1+b['actualB8RootEta']+1<=b['actualB8CorrectionEta'],'Actual B8 eta correction budget')
 require(b['wholeLoopFieldEta']+b['loopXUpper']+12+2+4<b['wholeLoopMomentEta'],'Actual cumulative eta integral budget')
 require(1+b['loopXUpper']+b['actualUX']+b['actualInverseE']<b['actualBs'],'Actual bs budget')
 require(2*b['actualBs']+b['actualInverseA']+1<b['actualVs'],'Actual vs budget')
 require(1+b['loopXUpper']+b['actualNs']+b['actualInverseE']<b['actualP2'],'Actual p2 budget includes original inverse L')
 require(max(b['actualInverseA'],b['actualVs'],b['actualP2'])<300<b['sourceS'],'Original S must dominate every input')

def budget():
 # A finite sum of fewer than C terms costs one extra exponent.
 b={
  'referenceFieldsEta0To2':4,'referenceInverseF':3,'referenceMomentsEta0To2':20,
  'referenceSourceFirstEta':50,'actualB26AEta':51,'actualB26LogFEta':54,
  'actualB26FEta':57,'actualB26EEta':59,'actualB26UEta':52,
  'actualEllIEta':62,'actualB34EEta':65,'actualRestoredUEta':55,
  'incomingMomentEta':110,'actualB8RhsEta':115,'actualB8RootEta':117,
  'actualB8CorrectionEta':120,'wholeLoopFieldEta':122,
  'loopXUpper':24,'loopInverseX':1,'actualEUpper':2,'actualInverseE':4,
  'actualUUpper':2,'actualUX':4,'actualAUpper':2,'actualInverseA':122,
  'wholeLoopMomentEta':180,'actualNs':190,'actualBs':34,'actualVs':192,
  'actualP2':220,'sourceS':100000}
 verify_budget(b)
 return b

def main():
 p=argparse.ArgumentParser()
 for n in ['natural','natural-radial','b26','b34','b8','loop-binding','diagnostics','out']:p.add_argument('--'+n,type=Path,required=True)
 a=p.parse_args();paths={n:getattr(a,n.replace('-','_')) for n in ['natural','natural-radial','b26','b34','b8','loop-binding','diagnostics']}
 raw={n:path.read_bytes() for n,path in paths.items()};data={n:json.loads(v) for n,v in raw.items()}
 require(hashlib.sha256(raw['diagnostics']).hexdigest()=='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1','Original full diagnostic pin')
 source=data['diagnostics']['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
 require(source['sourceEnvelopeS']=={'power':[{'ref':'CSelected'},100000]},'Original S exponent')
 require(source['Lambda']=={'power':[{'ref':'Q'},64]},'Original radial scaling')
 require(source['loopIRight']=={'product':[{'ref':'XR'},{'exp':{'sum':[{'ref':'T'},{'integer':3}]}}]},'Original right loop endpoint')
 require(data['natural']['schema']=='MathScope.N6.ActualNaturalIndependentBanachMajorant/1','Same actual natural theorem')
 require(data['natural-radial']['fixedDefinitionSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b','Same fixed source')
 b26=data['b26'];require(b26['originalProducerBindingExecuted'],'Actual B26 source replay')
 require(b26['actualB26']['aInverseUpper']=='CSelected^122<S','Actual B26 inverse shear bound')
 require(b26['actualB26']['EInverseUpper']=='CSelected^3','Actual B26 inverse E bound')
 b34=data['b34'];require(b34['derivedBounds']['actualAInterval']==['3/4','17/20'],'Actual B34 shear bound')
 require(b34['inputSHA256']['b26']==hashlib.sha256(raw['b26']).hexdigest(),'Same actual B26-to-B34 proof')
 b8=data['b8'];require(b8['sameActualRoot']['existsUnique'] and b8['sameActualRoot']['isCInfinityOnOpenEtaNeighborhood'],'Actual continuous B8 root theorem')
 require(b8['actualB8EAndA']['aLower']=='3/4','Actual B8 shear lower bound')
 for n in ['natural','natural-radial','b26','b34']:
  require(b8['inputSHA256'][n]==hashlib.sha256(raw[n]).hexdigest(),'Same actual B8 dependency '+n)
 loop=data['loop-binding'];require(loop['fixedDefinitionCompared'] and loop['diagnosticOverlap']>0 and loop['registryCompared'],'Actual loop source graph application')
 require(loop['checks']['literalActualStateSourceP1P2AndShears'],'Literal actual Ns/p2 and shear identities')
 require(all(loop['checks'].values()),'Actual loop constructor comparison')
 b=budget();require(F(4,5)+F(1,100)+F(2,100)<1-F(1,100),'B8 upper shear bound')
 # These deliberate budget errors must be refused independently.
 controls=[]
 for name,key,value in [('lost actual inverse-a cost','actualInverseA',200),('undersized replacement S','sourceS',100),('p2 identified with E_eta','actualP2',122)]:
  changed={**b,key:value}
  try:verify_budget(changed)
  except AssertionError:controls.append({'name':name,'rejected':True})
  else:raise AssertionError('Accepted changed envelope '+name)
 result={'schema':'MathScope.N6.ActualPreloopSourceEnvelope/1','proof':'ACTUAL_PRELOOP_SOURCE_ENVELOPE_KO.md',
  'inputSHA256':{n:hashlib.sha256(v).hexdigest() for n,v in raw.items()},'explicitCExponentBudget':b,
  'actualSourceBounds':{'E':'0<E<CSelected^2','inverseE':'<CSelected^4','a':'0<a<CSelected^2',
   'inverseA':'<CSelected^122<sourceEnvelopeS','vs':'<CSelected^192<sourceEnvelopeS','absP2':'<CSelected^220<sourceEnvelopeS'},
  'domain':'Original loop rectangle [loopILeft,loopIRight] and eta in [-33/32,33/32].',
  'actualCumulativeMomentsUsed':True,'referenceSubstitutedForActualMoments':False,'p2IdentifiedWithEEta':False,
  'strictNegativeControls':controls,'bothEndpointCollarsProvedHere':False,'wholeGOnJProved':False,
  'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'actualSBoundsComposed':True,'bothEndpointCollarsSeparate':True,'newOriginalDischarged':0}))

if __name__=='__main__':main()
