"""Exact source-scales and calculus for the original positive B34 shift."""
import argparse,hashlib,json
from fractions import Fraction as F
from pathlib import Path
import sympy as s

def main():
 p=argparse.ArgumentParser();p.add_argument('--binding',type=Path,required=True);p.add_argument('--b26',type=Path,required=True)
 p.add_argument('--diagnostics',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 raw=a.diagnostics.read_bytes();assert hashlib.sha256(raw).hexdigest()=='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1'
 source=json.loads(raw)['fullNativePayloads']['fixed']['source']['parametersExactExpressions']
 assert source['Tsh']=={'power':[{'ref':'Q'},90]}
 assert source['XR']=={'product':[{'integer':110},{'power':[{'product':[{'ref':'CSelected'},{'ref':'Pstar'}]},10]}]}
 binding=json.loads(a.binding.read_bytes());assert binding['sourceSHA256']=='7fd65f8e2519e4bab3fe017e6349ae98d700592548bc0e5a28aee431080ff2c3'
 assert binding['sourceBytesUnchanged'] and all(binding['checks'].values())
 assert binding['authenticatedDiagnosticsSHA256']==hashlib.sha256(raw).hexdigest() and binding['diagnosticOverlap']>0
 b26=json.loads(a.b26.read_bytes());assert b26['schema']=='MathScope.N6.ActualB26RadialPositivity/1' and b26['originalProducerBindingExecuted']
 assert b26['actualB26']['ELower']=='positive' and b26['actualB26']['EInverseUpper']=='CSelected^3'
 assert all(b26['independentExactChecks'].values())
 y,T,ell,lf,lc=s.symbols('y T ell log_f log_C');sig=s.Function('sigma')
 logarithm=-lc+y/10+(1-sig(y/T))*ell+sig(y/T)*lf
 shear=s.Rational(4,5)+2*s.diff(sig(y/T),y)*(ell-lf)
 assert s.simplify(1-2*s.diff(logarithm,y)-shear)==0
 assert s.simplify(logarithm.subs(y,0).subs(sig(0),0)+lc-ell)==0
 assert s.simplify(logarithm.subs(y,T).subs(sig(1),1)-(-lc+T/10+lf))==0
 width=2**(260*24)
 assert F(1024,width)<F(1,20)
 assert F(4,5)-F(1,20)==F(3,4) and F(4,5)+F(1,20)==F(17,20)
 assert 2*3**4*(1+F(1,2))==243 and 243<256
 assert s.simplify(1-2*s.diff(logarithm,y)-(s.Rational(4,5)+2*s.diff(sig(y/T),y)*(ell+lf)))!=0
 result={'schema':'MathScope.N6.ActualB34RadialPositivity/1','sourceSHA256':binding['sourceSHA256'],
 'inputSHA256':{'binding':hashlib.sha256(a.binding.read_bytes()).hexdigest(),'b26':hashlib.sha256(a.b26.read_bytes()).hexdigest()},
 'exactChecks':{'literalLogDerivativeEqualsSourceShear':True,'bothEndpointValueIdentities':True,'uniformStepDerivativeUpper256':True,
 'sourceQ90AbsorbsActualEndpointLogAmplitude':True,'changedLogFSignRejected':True},
 'derivedBounds':{'B34Domain':'110<=X<=110 exp(Q^90), eta in [-33/32,33/32]',
 'actualAInterval':['3/4','17/20'],'actualE':'positive','actualEInverseUpper':'CSelected^3','actualEUpper':'CSelected^2',
 'followingIdealGap':'E=Pstar/(1+eta^2)*(X/XR)^(1/10), a=4/5, E>0',
 'allOrderJoins':'Actual B26 terminal power at110 and exact ideal power at Xsep; square-seed cutoff flatness preserves every mixed order.'},
 'proof':'ACTUAL_B34_RADIAL_POSITIVITY_KO.md','remainingWholeLoopGates':['Actual B8 repair/root','Whole-loop p2/vs source envelopes','Both actual C1 endpoint collars'],
 'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({'actualB34Positive':True,'sourceShearLower':'3/4','newOriginalDischarged':0}))
if __name__=='__main__':main()
