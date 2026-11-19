"""Reduce the actual ordinary Temporal/FiveMap mean gauge with fixed native bounds."""
from argparse import ArgumentParser
from fractions import Fraction
from hashlib import sha256
from importlib.util import spec_from_file_location,module_from_spec
from pathlib import Path
import json
import sympy as S
if not __debug__:raise RuntimeError('Keep exact assertions enabled.')
SOURCE={
 'mathscope-m3/navier/source-temporal-potential.mjs':'c0754a9afc0c41e731488523c030a317e69407e3ec01d2fe9bed8eb2f414a6f8',
 'mathscope-m3/navier/source-pressure.mjs':'fcdbbcddc5e16649f771bb53e1b0889ee1641a62dec3440d18611488ce35c66f',
 'mathscope-m3/navier/source-full-mean-equations.mjs':'2f44315a940fc959f1c86c2a8fd5b1a252521cbb8e2565dc42fc07b139773d76',
 'mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs':'22976ece2c801beb9e51045820749cc077ddf2c198e364f2033a53789989466d',
 'mathscope-m3/post-signed-20261023/source-postfive-full-3d-residual.mjs':'d93195ac381c75860e5d450a77ad3160ade16ca4579f4988dc38948e504163de'}
def read(path,pin):
 b=path.read_bytes();assert sha256(b).hexdigest()==pin,path
 return json.loads(b)
def main():
 p=ArgumentParser(description=__doc__);p.add_argument('goal',type=Path);p.add_argument('work',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
 ep={
 'mean':('continuation75/live-spatial-followup/spatial-mean-same-live.json','214f2ec8534e9eb828add24aab542128b39ec4453da3396ee70203507b78f408'),
 'spatial':('continuation70/spatial-readback-44582875351.json','364debba33e15d7db387b9a67c4deb5cc43e59a96744ad046ac8b4ba146991b2'),
 'ingress':('continuation70/hosted-44582875351/first-correction-spatial-ingress.json','20550a640ec1cb9f00c5c0b1be61f27826ee7e756ea714dd6a13eed39edf841f')}
 d={key:read(a.work/path,pin) for key,(path,pin) in ep.items()}
 compactPath=a.goal/'primary-forced-join/active-n3-c5-binding/compact-mean-increment/compact-mean.json'
 compactPin='4034331b1ab4204a845d197b213e3566a7bc677aa4541f22936e2bc77b89435d'
 compact=read(compactPath,compactPin)
 binder=a.work/'continuation71/stage1-awaited/verify_live_mean_gauge.py'
 assert sha256(binder.read_bytes()).hexdigest()=='8a1fdff65f0582bd93f72ae60a6446eb989b34473f0bc6104ae631ee768a96d7'
 mean,spatial,ingress=d['mean'],d['spatial'],d['ingress']
 assert mean['status']=='VERIFIED_ACTUAL_NATIVE_FIVEMAP_BODY_AND_TEMPORAL_APPLICATION_BINDINGS'
 assert spatial['hostedRun']['id']==44582875351
 assert spatial['status']=='VERIFIED_ACTIVE_N3_SPATIAL_SOURCE_STREAM_AND_OPERAND_BINDINGS'
 assert ingress['gaugeDifferenceRootsForIndependentCheck']==spatial['typedSourceReadback']['gaugesStillUnreduced']
 actual=mean['actualMean'];inputs=ingress['input'];rows={r['component']:r for r in compact['componentRows']}
 assert [actual['temporalPsi'],actual['fivePsi']]==inputs['meanPotentials']
 assert actual['fiveGamma']==rows['z']['latestFiveIncrement']==22151945
 assert actual['fiveBeta']==rows['r']['latestFiveIncrement']==22151963
 assert actual['fiveSwirl']==rows['theta']['latestFiveIncrement']==inputs['azimuthalSwirls'][1]
 assert actual['sameRadialLimits']==[17743711,17732748]
 assert actual['wholeFixedRadialLimits']==[17743711,17743713]
 assert actual['sameBoundRadius']==22151946
 assert actual['ordinaryGammaWithBoundRadius']==22151948 and actual['axialGammaDerivativeWithBoundRadius']==22151957
 assert actual['compactCandidate']==inputs['fiveCompactCandidate']
 assert actual['wholeSharedIntegrand']==inputs['fiveWhole']
 geometry=spatial['typedSourceReadback']['resolvedGeometryRoots']
 assert compact['temporalDirections']==[17732737,geometry['R'],geometry['Z'],geometry['T'],*geometry['Y']]
 assert compact['physicalFactors']['R']==actual['sameRadialLimits'][1]
 # Immutable source access; no checkout modification or large native rescan.
 cp=a.goal/'first-scale-closure/check_first_scale_closure.py'
 assert sha256(cp.read_bytes()).hexdigest()=='9c035f488b57d4165f0db3f55906d42a628ce6d409fc75bf7dbd706045dee0ee'
 spec=spec_from_file_location('reader',cp);reader=module_from_spec(spec);spec.loader.exec_module(reader)
 src={}
 for path,pin in SOURCE.items():
  raw=reader.git_blob(a.goal.parents[2],'research-ide/'+path);assert sha256(raw).hexdigest()==pin,path;src[path]=raw.decode()
 def clauses(path,*items):
  for item in items:assert item in src[path],(path,item)
 clauses('mathscope-m3/navier/source-temporal-potential.mjs',
  'deltaV=G.neg(G.div(inverseTheta,ci)),gammaDesired=G.neg(G.div(inverseZ,ci))',
  'rawPsi=G.div(G.sub(integrals.left,G.mul(chi,integrals.whole)),R)',
  'beta=G.neg(Dz(psi)),gamma=De(psi,1)',
  'G.neg(G.mul(G.derivative(chi,R),integrals.whole))',
  'cutoffRemainderDeclaredZero:false')
 clauses('mathscope-m3/navier/source-pressure.mjs',
  'shift=G.sub(G.substitute(radialPrimitive,R,r),radialPrimitive)',
  'integrand=G.simultaneousSubstitute(body,[R,...Y],[r,...shiftedY])',
  'left=G.integral(integrand,r,innerRadius,R),whole=G.integral(integrand,r,innerRadius,outerRadius)',
  'fixed-band-radial-shift-independent-of-Z-T-Y',
  'pZ=G.sub(G.sub(slowZIntegrals.left,G.mul(G.derivative(chi,Z),integrals.whole))')
 clauses('mathscope-m3/navier/source-full-mean-equations.mjs',
  'Dr=x=>G.add(G.derivative(x,R),G.mul(a,L(x)))',
  'Dz=x=>G.mul(epsilon,G.derivative(x,Z))',
  'De=(x,e)=>G.add(Dr(x),G.div(G.mul(G.q(e),x),R))')
 clauses('mathscope-m3/post-signed-20261023/source-signed-actual-five-map.mjs',
  'integrand=G.substitute(G.mul(R,gammaDesired),R,r)',
  'psi=G.div(primitive,R),compactPsi=G.div(G.sub(primitive,G.mul(pressure.pressure.chi,whole)),R)',
  'rawDeltaBeta=G.neg(G.mul(epsilon,G.derivative(psi,Z)))',
  'increment={beta:deltaBeta,v:deltaV,gamma:gammaDesired}',
  'source-five-mean-bumps-independent-of-auxiliary-torus',
  'Y.every(y=>!G.freeCoordinates(x).has(y))')
 # Full normalized covariant calculus; no desired-axial substitution.
 R,Z,T,y0,y1,r=S.symbols('R Z T Y0 Y1 r',real=True)
 alpha,outer=S.symbols('alpha outer',positive=True)
 eps,v0,v1=S.symbols('epsilon v0 v1',real=True)
 radial=S.Function('a')(R)
 P=S.Function('psi_T')(R,Z,T,y0,y1)
 Gamma=S.Function('Gamma_F')
 gf=Gamma(R,Z,T);fpsi=S.Integral(r*Gamma(r,Z,T),(r,alpha,R))/R
 vrT,vrF=S.Function('v_T')(R,Z,T,y0,y1),S.Function('v_F')(R,Z,T)
 def L(x):return v0*S.diff(x,y0)+v1*S.diff(x,y1)
 def Dr(x):return S.diff(x,R)+radial*L(x)
 def Dz(x):return eps*S.diff(x,Z)
 def curl_meridional(x,swirl):return S.Matrix([-Dz(x),swirl,Dr(x)+x/R])
 betaF=-eps*S.Integral(r*S.diff(Gamma(r,Z,T),Z),(r,alpha,R))/R
 true=S.Matrix([-Dz(P)+betaF,vrT+vrF,Dr(P)+P/R+gf])
 candidate=curl_meridional(P+fpsi,vrT+vrF)
 residual=true-candidate
 assert all(S.simplify(x)==0 for x in residual)
 assert S.simplify(Dr(fpsi)+fpsi/R-gf)==0
 assert S.simplify(-Dz(fpsi)-betaF)==0 and L(fpsi)==0
 # Source shifted Temporal endpoint/phase/cutoff calculus.
 desired,chi,chiR,chiZ,I,J,IL,JL,IZ,JZ=S.symbols('g chi chi_R chi_Z I J I_L J_L I_Z J_Z')
 anum=S.Symbol('a')
 partialR=R*desired-anum*IL-chiR*J+chi*anum*JL
 Ln=IL-chi*JL
 gammaFTC=S.expand((partialR+anum*Ln)/R)
 assert S.simplify(gammaFTC-(desired-chiR*J/R))==0
 betaFTC=-eps*(IZ-chiZ*J-chi*JZ)/R
 assert S.simplify((-eps*(IZ-chi*JZ)/R)-betaFTC)==-eps*chiZ*J/R
 # Compact Five alternative, without assuming its whole integral vanishes.
 c=S.Function('chi')(R,Z,T);JF=S.Function('J_F')(Z,T)
 deltaPsi=-c*JF/R
 compactDifference=curl_meridional(deltaPsi,S.Integer(0))
 compactExpected=S.Matrix([eps*(S.diff(c,Z)*JF+c*S.diff(JF,Z))/R,0,-S.diff(c,R)*JF/R])
 assert all(S.simplify(x)==0 for x in compactDifference-compactExpected)
 # A distinct outer physical cutoff eta: retain both slow derivatives.
 eta=S.Function('eta')(R,Z,T);Psi=P+fpsi
 etaActual=eta*true
 etaCandidate=curl_meridional(eta*Psi,eta*(vrT+vrF))
 etaExpected=S.Matrix([eps*S.diff(eta,Z)*Psi,0,-S.diff(eta,R)*Psi])
 assert all(S.simplify(x)==0 for x in etaActual-etaCandidate-etaExpected)
 # Exact rational controls are calculus witnesses, not original-data counterexamples.
 toyPsi=(R**2-1)/(2*R)
 etaControl=S.simplify(toyPsi.subs(R,2));assert etaControl==S.Rational(3,4)
 wrongPsi=(R**2-1)/2
 wrongGamma=S.simplify(S.diff(wrongPsi,R)+wrongPsi/R)
 wrongBound=S.simplify((wrongGamma-R).subs(R,2));assert wrongBound==S.Rational(3,4)
 movingAlpha=1+Z
 movingPsi=(R**2-movingAlpha**2)/(2*R)
 movingCurl=-S.diff(movingPsi,Z)
 movingResidual=S.simplify((-movingCurl).subs({R:2,Z:0}));assert movingResidual==-S.Rational(1,2)
 # Generic moving-bound Leibniz terms; actual source bounds are fixed.
 f=S.Function('f');az=S.Function('alpha')(Z);bz=S.Function('outer')(Z)
 movingJ=S.Integral(f(r,Z),(r,az,bz))
 expectedJ=S.Integral(S.diff(f(r,Z),Z),(r,az,bz))+f(bz,Z)*S.diff(bz,Z)-f(az,Z)*S.diff(az,Z)
 assert S.simplify(S.diff(movingJ,Z)-expectedJ)==0
 result={'schema':'MathScope.C78.ActualN3OrdinaryMeanGaugeReduction/1',
  'status':'VERIFIED_SAME_LIVE_ORDINARY_MEAN_CURL_REDUCTION_CONDITIONAL_FTC_REGULARITY',
  'hostedRun':44582875351,'sourceCommit':'f8cb4034e86d7b669d52a6f2248aebba156b51b5','sourceSHA256':SOURCE,
  'inputSHA256':{k:pin for k,(_,pin) in ep.items()},'compactSHA256':compactPin,
  'meanBinderSHA256':sha256(binder.read_bytes()).hexdigest(),'actualMeanBindings':actual,
  'candidateRoots':{'azimuthalPotential':ingress['normalizedRoots']['A'][1],'directSwirl':inputs['directSwirl'],
   'uncutVelocityDifference':ingress['normalizedRoots']['U'],'wholeGaugeDifferencesStillSeparate':ingress['gaugeDifferenceRootsForIndependentCheck']},
  'ordinaryMeanResidual':{'orientation':'actual surviving mean increment minus candidate curl and direct swirl','components':['0','0','0'],
   'radial':'-epsilon*psiT_Z + betaF -[-epsilon*(psiT_Z+psiF_Z)]=0',
   'azimuthal':'vT+vF-directSwirl=0',
   'axial':'(partial_R+aL+1/R)psiT+GammaF-[(partial_R+aL+1/R)(psiT+psiF)]=0',
   'FiveMapFTC':'psiF=(1/R) integral_alpha^R r*GammaF(ell,r,Z,T)dr; psiF_R+psiF/R=GammaF; betaF=-epsilon*psiF_Z; LpsiF=0',
   'wholeFiveIntegralZeroUsed':False,'temporalDesiredGammaSubstituted':False},
  'temporalSourceCalculus':{'shift':'Y+(Phi(r)-Phi(R))*vr; a=Phi_R; fixed ell and vr',
   'fixedBoundDerivatives':'d_R I=R*g-a*I_L, d_R J=-a*J_L',
   'covariantAxial':'(partial_R+aL+1/R)psiT=g-chi_R*J/R',
   'radial':'betaT=-epsilon*(I_Z-chi_Z*J-chi*J_Z)/R',
   'droppedCutoffAxialResidual':'g-actualGammaT=+chi_R*J/R',
   'sourceZShiftDerivativeZero':'Original Phi is independent of Z,T,Y, with fixed band labels; no derivatives of frozen vr are taken.'},
  'compactFiveDifference':{'orientation':'candidate compact curl minus actual raw FiveMap curl',
   'components':['+epsilon*(chi_Z*J_F+chi*J_F,Z)/R','0','-chi_R*J_F/R'],'wholeIntegralCancellation':'Separate obligation; not needed for the ordinary raw gauge identity.'},
  'outerEta':{'orientation':'eta*actualMean minus curl(eta*(psiT+psiF)*e_theta) minus eta*directSwirl*e_theta',
   'components':['+epsilon*eta_Z*(psiT+psiF)','0','-eta_R*(psiT+psiF)'],
   'physicalScaling':'Normalized derivatives Dr=partial_R+aL, Dz=epsilon*partial_Z; original Q pullback factors retained by the C77 spatial evidence.',
   'allEtaDerivativesRetained':True},
  'movingBoundControl':{'formula':'J_Z=integral_alpha^outer f_Z+f(outer)*outer_Z-f(alpha)*alpha_Z',
   'actualBounds':'alpha=sqrt(Xa), outer=2sqrt(Xb); source parameters/frozen labels, so their R,Z,T,Y derivatives vanish.',
   'sameGammaBoundArgument':'Actual native Gamma uses ell,boundRadius,Z,T; native derivative uses [0,0,1,0].'},
  'controls':{'outerEtaRadialResidual':{'toy':'alpha=1,R=2,GammaF=1,epsilon=1,eta=Z at Z=0','value':'3/4','omittedOrWrongSignRejected':True},
   'wrongFormalActualRadius':{'toy':'GammaF(r)=r, alpha=1,R=2; wrongly keep GammaF(R) inside the integral','candidateMinusActualAxial':'3/4'},
   'movingLowerEndpoint':{'toy':'alpha(Z)=1+Z,GammaF=1,R=2,Z=0; omit endpoint derivative','nativeMinusCurlRadial':'-1/2'},
   'interpretation':'These are exact calculus controls, not counterexamples to the fixed original profile, its FiveMap moment equations or periodic inverse.'},
  'proofPremises':['Ordinary FTC and differentiation under the actual same smooth native radial branch, with its original admitted fixed segment and one-sided endpoint regularity.',
   'The source FiveMap mean bumps have no auxiliary torus dependence, as checked by the pinned source constructor; its actual registered family/application bindings are those in C77.',
   'Original fixed-band geometry and original cutoff source used at the same physical/auxiliary point. No derivative of nearest-integer/mesh labels or frozen representatives.',
   'The source inverse/periodicity/support assumptions remain attached when interpreting Temporal shifted integrals analytically.'],
  'scope':{'ordinaryMeanPartReduced':True,'ordinaryMeanDerivativeConsequences':'All derivatives of this local same-branch zero identity vanish under the stated regularity.',
   'sameActualNativeBindings':True,'wholeGaugeDifferenceRootsDeclaredZero':False,'wavePartReducedHere':False,
   'wholeFiveIntegralDeclaredZero':False,'actualUniformStageCapsClosed':False,'fullInitializedSubtractionIndependent':'The C77 compact duplicate-mean cancellation is used; remaining full initialized-wave/root comparison stays separate.',
   'N706':'OPEN','N805':'OPEN','finalJets':0,'release':'HOLD'}}
 a.output.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n')
 print('PASS same-live ordinary mean gauge residual0; Temporal cutoff/shift, raw Five FTC, eta and moving-bound controls retained')
if __name__=='__main__':main()
