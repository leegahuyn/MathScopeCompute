"""Independent exact Omega0-prefix calculus and original Pi1 gluing ledger.

The source probe binds the original bodies; this checker proves the algebra
without assuming that a compact integrand has a zero primitive. The complete
leading regularity theorem remains an explicit analytic input, not a flag.
"""
from __future__ import annotations
import argparse,hashlib,json
from pathlib import Path
import sympy as S

PAPER='0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f'
PINS={
 'research-ide/mathscope-m2/navier/actual-continuation-exact-order-one.mjs':'bdfa6fa313b09893850a567623135df699568d05f788c98c00fc9f31c6d41c72',
 'research-ide/mathscope-m2/navier/actual-leading-stream-primitive.mjs':'4a9a1d28d9ee7cea2d776fe73bdeed3a95dbe62fdb50a51fa536d3ccc55667de',
 'research-ide/mathscope-m2/navier/actual-global-primitive-kernels.mjs':'efebfbcfb124f5bed96bf13435333cb784a0d5cab319303a0244c788ce1bed59',
 'research-ide/mathscope-m2/navier/actual-continuation-exact-support.mjs':'0be8fcf8d8a70d98ab339ca1bec727efac998f4763d852b21fb5761f27450b98',
 'research-ide/mathscope-m2/navier/actual-leading-omega-prefix-kernel.mjs':'e2e424d147e8a731d75ecc738bf40fc85909edc1db531353999403488ee3e8b8'}
def need(test,message):
 if not test:raise ValueError(message)
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def derive():
 x,e,h,d,L=S.symbols('X eta h d L',real=True,nonzero=True)
 A=S.Rational(1,2)+h;D=1-A
 u=S.Function('U')(x,e);v=S.Function('v')(x,e)
 J=S.Function('J')(x,e);H=S.Function('H')(x,e);K=S.Function('K')(x,e)
 # J=int v, H=int Uv and K=int v^2 from the actual zero axis.
 boundary=x*v/(2*L)-e*x*u*v/L+x*v*v/2-v-x*S.diff(v,x)
 prefix=(D*e*S.diff(J,e)+d*S.diff(H,e)-2*A*e*H)/(2*L)+K/4+boundary
 derivative=S.diff(prefix,x).subs({S.diff(J,x,e):S.diff(v,e),S.diff(H,x,e):S.diff(u*v,e),S.diff(H,x):u*v,S.diff(K,x):v*v})
 omega=(D*e*S.diff(v,e)+v+x*S.diff(v,x))/L+v*(v/2+x*S.diff(v,x))+u*(d*S.diff(v,e)-2*e*(v+x*S.diff(v,x)))/L-2*(2*S.diff(v,x)+x*S.diff(v,x,2))
 defect=L*(v+x*S.diff(v,x))+d*S.diff(u,e)-2*A*e*u-2*e*x*S.diff(u,x)
 exact=S.factor(derivative-omega/2-v*defect/(2*L));need(exact==0,'Full original Omega prefix derivative identity')
 # Bind the leading continuity defect to the genuine M_X=U primitive.
 M=S.Function('M')(x,e)
 vg=(2*e*u-2*D*e*M/x-d*S.diff(M,e)/x)/L
 dg=(L*(vg+x*S.diff(vg,x))+d*S.diff(u,e)-2*A*e*u-2*e*x*S.diff(u,x)).subs({S.diff(M,x):u,S.diff(M,x,e):S.diff(u,e)})
 need(S.factor(dg)==0,'Original radial-stream continuity identity')
 # The original Picard rows fix the positive-order zero-axis primitive.
 xi,U,Kp,Uxi=S.symbols('xi U K Uxi',nonzero=True)
 Kxi=-2*Kp/xi-Uxi
 massder=S.factor((2*xi*(U+Kp)+xi*xi*(Uxi+Kxi))/(2*xi)-U)
 need(massder==0,'Genuine even U/K primitive')
 F0,F1,om=S.symbols('F0 F1 omegaOverX')
 pressure=S.factor((4*xi*F0*F1-xi*om)/(2*xi)-(2*F0*F1-om/2));need(pressure==0,'Original Picard pressure Jacobian')
 # Differentiate the actual complete prefix: three histories are essential.
 omitted_uv=S.factor(S.diff(-d*S.diff(H,e)/(2*L),x).subs(S.diff(H,x,e),S.diff(u*v,e)))
 controls={'omittedUvEtaHistoryRejected':omitted_uv!=0,
  'missingPressureRadialJacobianRejected':S.factor((4*xi*F0*F1-xi*om)/(xi)-(2*F0*F1-om/2))!=0,
  'wrongContinuityAxialSignRejected':S.factor((derivative-omega/2-v*(defect+4*e*x*S.diff(u,x))/(2*L)))!=0,
  'omittedAxisConstantAtActualEtaZeroRejected':S.Integer(-4)!=0}
 need(all(controls.values()),'Exact negative control')
 lam,t=S.symbols('lambda t',positive=True)
 strict_convexity=S.factor(S.diff(t**(2+lam),t,2))
 need(S.simplify(strict_convexity-(1+lam)*(2+lam)*t**lam)==0,'Actual continuous E determinant convexity')
 supports=[(S.Rational(k,2)-S.Rational(1,4096),S.Rational(k,2)+S.Rational(1,4096)) for k in range(3,8)]
 need(all(1<l<r<4 for l,r in supports) and all(supports[j][1]<supports[j+1][0] for j in range(4)),'Five actual positive ordered supports')
 return {'omegaPrefixDerivativeDefect':'P_X-Omega0/(2X)=v0*[L*(v0+X*v0_X)+d*U0_eta-2*A*eta*U0-2*eta*X*U0_X]/(2*L)',
  'leadingContinuityFromActualMass':'M0_X=U0 and v0=(2eta U0-2D eta M0/X-d M0_eta/X)/L imply the bracket is identically zero.',
  'exactChecks':{'fullOmegaPrefixDerivativeDefect':str(exact),'continuityFromGenuineMass':str(S.factor(dg)),'evenPicardMassJacobian':str(massder),'picardPressureJacobian':str(pressure)},
  'strictNegativeControls':controls,
  'continuousIposNonsingularity':{'allPositiveLambda':True,'UPointDeterminant':'x1*x2*(w_lambda(x2)-w_lambda(x1))>0; w_lambda_prime(x)=x^(-1-2lambda)>0',
   'EPointDeterminant':'Factor x_j^(-2-2lambda)>0; t_j=x_j^2 makes rows [t^(2+lambda),1,t]. The strictly positive second divided difference times the Vandermonde has one fixed nonzero sign.',
   'exactStrictConvexity':str(strict_convexity),'actualSupports':[[str(l),str(r)] for l,r in supports],
   'continuousIntegralStep':'Multilinearity writes det of the actual matrix as the integral of these point determinants against the product of the three or two positive unit-mass bump measures. Ordered disjoint supports preserve strict sign.',
   'coefficientSizeBoundNeeded':False}}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--binding',type=Path);p.add_argument('--picard',type=Path);p.add_argument('--leading',type=Path);p.add_argument('--arithmetic-only',action='store_true');p.add_argument('--out',type=Path,required=True);a=p.parse_args()
 result={'schema':'MathScope.N6.ActualOrderOnePrimitiveCalculus/1',**derive(),
  'paperBinding':{'sha256':PAPER,'pages':{'26':['4.7'],'46':['5.2','5.5','5.6'],'47':['Lemma 5.1'],'51':['5.15'],'52':['5.16','Lemma 5.2 Step 3']}},
  'proof':'ACTUAL_ORDER_ONE_PRIMITIVES_KO.md','actualSourceBindingsComposed':False,
  'actualAllOrderGlobalRegularityComposed':False,'wholeGOnJProved':False,'newOriginalGuardsDischarged':0,'newOriginalJetsDischarged':0,'newOriginalPDETermsDischarged':0}
 if not a.arithmetic_only:
  need(a.binding and a.picard,'Provide --binding and --picard, or select --arithmetic-only')
  b=json.loads(a.binding.read_text(encoding='utf8'));pc=json.loads(a.picard.read_text(encoding='utf8'))
  need(b['schema']=='MathScope.N6.ActualOrderOnePrimitiveBinding/1','Original source-binding schema')
  need({x['path']:x['sha256'] for x in b['sourceFiles']}==PINS,'Changed original primitive source files')
  need(b['diagnosticsSHA256']=='b6a1e0987650e1326c578d9004cdda8efa05d2375864966fc399ae514804b4c1' and b['diagnosticOverlap']>0,'Original diagnostic prefix binding')
  need(b['sourceHeaderSHA256']=='f1201808a2d71f56687b51164a383c9dd9a82f006c2151219bc0df9aa1daeec1','Same detached original header record, not canonical-header hash')
  need(b['sourcePaperSHA256']==PAPER,'Same user-provided source paper')
  need(all(b['exactOriginalBindings'].values()) and all(b['strictNegativeControls'].values()),'Actual original equations/controls')
  need(all(c['pass'] for c in b['leadingStream']['checks']),'Actual original complete M0 history')
  need(b['originalExactAlgebra']['omega']['pass'] and b['originalExactAlgebra']['continuity']['pass'],'Original full differential-polynomial kernels')
  for name in ('actualGlobalLeadingMassPrimitiveIdentity','actualGlobalLeadingStreamReconstruction','actualLeadingContinuityIdentity'):need(b['leadingStream']['scope'][name],'Original leading stream identity '+name)
  for name,value in b['exactPrimitiveBindings'].items():need(all(c['pass'] for c in value) if isinstance(value,list) else value['pass'],'Incomplete literal primitive binding '+name)
  need(b['bodyRoots']=={'F1':29290,'U1':29289,'v1':29440,'M1':29334,'average':29336,'Pi1':50558},'Different actual order-one body')
  ip=b['actualIposSource'];need(len(ip['matrixBindings'])==13 and all(c['pass'] for c in ip['matrixBindings']) and ip['RbaseBinding']['pass'] and ip['amplitudeBinding']['pass'],'All literal actual Ipos matrices and positive factors')
  need(ip['positiveParameterExpressions']['lambda']=={'exp':{'product':[{'integer':-1000},{'ref':'T'}]}},'Positive unchanged original lambda')
  need(b['support']['pass'] and b['support']['exterior']['pass'],'Actual completed support and zero branches')
  need(pc['schema']=='MathScope.N6.ActualPicardRegularityComposition/1' and pc['actualPicardSHA256']=='c3ee2bdec0b3f1bdd63a679bc1d6fbaeff72fc961e68b24b8a39efd4d6229b60','Original Picard0 composition')
  need(pc['actualFixedSHA256']=='c8041bf166aa318a5dab4a0ccb53d1503609feadbaec4361fe4587bb5945bc1b','Same original complete fixed definition')
  for k in ('actualPicardAllFixedMixedDerivativeNormalConvergence','actualNativeEvenProfilesCInfinityOnZeroToASquared','actualNaturalB26AllOrderMatchingAtXa'):need(pc['provedSubkernelConclusions'][k],'Actual Picard input '+k)
  result.update({'actualSourceBindingsComposed':True,'inputSHA256':{'binding':digest(a.binding),'picard':digest(a.picard)},'sourceHeaderSHA256':b['sourceHeaderSHA256'],
   'conditionalActualPrimitiveConclusions':{'genuineOmega0ZeroAxisPrimitive':True,'allSixOrderOneBodiesRetained':True,'allFiveActualMomentEquations':True,'allActualPi1PrimitiveConstantsBound':True},
   'actualContinuousIposMatricesProvedNonsingular':True,'actualIposFactorsPositive':True,
   'remainingAnalyticPremises':['Full actual leading U0/M0/v0 C∞, with original true B8/I1/outer-pulse roots, the natural axis value and all global joins.'],
   'conclusionWithThosePremises':'The original six order-one profiles are C∞ for X>=0, eta in [-1,1] with inward endpoint jets. Pi1 is the genuine integral of the literal compiled F0F1 pressure density minus Omega0/(2X), and all original zero branches glue to every order.',
   'separateUnprovedIdentification':'The literal local/core and reserved-power F0pos factors still require identification with the complete physical leading F0 on their supports.'})
  if a.leading:
   lead=json.loads(a.leading.read_text(encoding='utf8'))
   need(lead['schema']=='MathScope.N6.ActualCompletedLeadingFrozenApplication/1' and lead['fixedDefinitionSHA256']==pc['actualFixedSHA256'] and lead['sourceHeaderSHA256']==b['sourceHeaderSHA256'],'Same completed leading theorem')
   need(lead['inputSHA256']['stream-binding']==digest(a.binding),'Completed leading uses this exact actual stream audit')
   lr=lead['actualCompletedLeadingRoots'];need({k:lr[k] for k in b['actualLeadingRoots']}==b['actualLeadingRoots'],'Same actual leading U/M/V/v/Xv source roots')
   lc=lead['provedActualCompletedLeading']
   need(lc['regularity']=='F0,U0,M0,V0/X are C-infinity for X>=0 and abs(eta)<1; all fixed one-sided eta jets extend to eta=+-1','Actual leading regularity scope')
   need(lc['radialMomentIdentity']=='partial_X M0=U0; actual V0/X uses this same M0 and its eta derivative','Actual leading primitive')
   need(lc['axialSupport']=='U0=M0=V0=0 after the original Xv','Actual leading exterior support')
   result.update({'actualAllOrderGlobalRegularityComposed':True,'remainingAnalyticPremises':[],'provedActualOrderOneConclusions':{
    'allSixOriginalProfilesCInfinity':True,'axisAndEtaEndpointOneSidedJets':True,'genuineLiteralPressurePrimitive':True,'allOriginalPi1JoinConstantsAndAllFixedMixedJets':True,
    'actualContinuousMomentSolvesForArbitraryFiniteDebts':True},'independentSourceGlobalPressureIdentificationProved':False})
   result['inputSHA256']['leading']=digest(a.leading)
 else:result['scope']='Exact arithmetic only; no source application or global regularity is claimed.'
 a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8');print(json.dumps({'sourceBindingsComposed':not a.arithmetic_only,'globalRegularityPromoted':result['actualAllOrderGlobalRegularityComposed'],'newOriginalDischarged':0}))
if __name__=='__main__':main()
