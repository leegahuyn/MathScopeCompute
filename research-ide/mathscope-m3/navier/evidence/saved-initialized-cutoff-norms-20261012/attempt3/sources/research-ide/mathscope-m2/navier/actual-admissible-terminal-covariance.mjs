/** A genuine small-q source family on the common zero exterior of every
 * positive-order coefficient. The selected dyadic integer is an exact
 * source expression. No astronomical active prefix is truncated: on this
 * declared open annulus the complete locally finite source equals its
 * leading field for every q, by the original common-support construction.
 *
 * This is an additive source-bound written analytic certificate. It does
 * not decide the paper's unspecified qbig/ell0, the full global G-POS gate,
 * a numerical whole-H enclosure, or a new analytic Lean theorem.
 */
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {attachActualCovarianceTarget} from './actual-covariance-source-target.mjs';
import {certifyActualCovarianceOperatorBounds} from './actual-covariance-operator-bounds.mjs';
import {ActualCovarianceExpressions} from './actual-covariance-volterra.mjs';
import {actualMovingPulseFrame,covarianceMatrixAlgebra} from './actual-covariance-matrix.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {assertActualCompletedBackgroundC2} from './actual-residual-order-induction-background.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const metadata=program=>{const {nodes,...rest}=program;return canonicalStringify(rest);};
const publicBinding=p=>canonicalStringify({request:p.request,coordinates:p.coordinates,chart:p.chart,fields:p.fields,frozen:p.frozen,geometry:p.geometry,
  constants:p.constants,cutoffs:p.cutoffs,families:p.families,target:p.target,roots:p.roots,support:p.support,selection:p.selection,
  quantitative:p.quantitative,sourceBinding:p.sourceBinding,proof:p.proof,decision:p.decision,checks:p.checks,arithmetic:p.arithmetic});
function requestOf(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='sourceProfile'))
    fail('INVALID_INPUT','Only the pinned source profile is accepted. A band, field, positivity flag, norm or qbig is never caller supplied.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);return {sourceProfile};
}

/** A deliberately small conditional support reducer. Arbitrary coefficient
 * bodies inside a certified radial cutoff are opaque. A compact integrand
 * alone never makes its primitive zero. This utility does NOT authenticate
 * an actual source or establish any ordering of the supplied endpoints. */
export function commonExteriorZeroAudit(G,{X,eta,endpoints,roots}){
  if(!G||!Array.isArray(G.nodes)||G.nodes[X]?.op!=='coordinate'||G.nodes[eta]?.op!=='coordinate'||!Array.isArray(endpoints)||!Array.isArray(roots)||[...endpoints,...roots].some(x=>!G.nodes[x]))
    fail('INVALID_INPUT','Supply explicit source-coordinate expressions and a separately justified common exterior endpoint set.');
  const allowed=new Set(endpoints),cache=new Map(),trace=[];let visited=0;
  const zero=id=>{
    if(id===G.zero)return true;if(cache.has(id))return cache.get(id);if(++visited>500000)fail('RESOURCE_LIMIT','The finite exterior-support audit exhausted its node budget.');
    const {op,args}=G.nodes[id];let value=false;
    if(op==='add')value=zero(args[0])&&zero(args[1]);
    else if(op==='multiply')value=zero(args[0])||zero(args[1]);
    else if(op==='integer_power'&&args[1]>0||op==='sqrt_positive')value=zero(args[0]);
    else if(op==='smooth_piecewise'&&args[0]===X&&allowed.has(args[2])){
      value=zero(args[5]);if(value)trace.push({node:id,afterEndpoint:args[2],afterBody:args[5],rule:'the exact smooth after-branch'});
    }else if(op==='actual_expression_partial'){
      const s=G.expressionSystems?.[args[0]];
      if(s&&s.parameters.every((p,j)=>args[1][j]===p)&&s.parameters.every(p=>p===X||p===eta)){
        value=zero(s.body);if(value)trace.push({node:id,system:args[0],body:s.body,orders:args[2],rule:'every finite partial of this same smooth zero exterior'});
      }
    }else if(op==='definite_integral')value=args[0]===G.zero||args[2]===args[3];
    cache.set(id,value);return value;
  };
  const rows=roots.map((root,index)=>({index,root,zero:zero(root)}));
  return {schema:'MathScope.CommonExteriorZeroAudit/1',rows,trace,visitedNodes:visited,pass:rows.every(r=>r.zero),
    endpointOrderProvedHere:false,actualSourceAuthenticated:false,compactPrimitiveSetToZero:false};
}

/** Parameterized completion grammar, valid for arbitrary inner coefficient
 * bodies, moment debts, and order n. The after-branches make the induction
 * step independent of how large n or c_n is. Actual-source matching is a
 * separate operation below; this algebra-only result is not an M2 gate. */
export function commonCompletionSupportKernel(G){
  const X=G.fresh('support_kernel_X'),eta=G.fresh('support_kernel_eta'),q=(n,d=1)=>G.q(n,d),z=G.zero,
    Xkeep=G.fresh('support_kernel_keep'),Xcut=G.fresh('support_kernel_cut'),X0=G.fresh('support_kernel_Ipos_left'),Iright=G.fresh('support_kernel_Ipos_right'),lastU=G.fresh('support_kernel_last_U'),Xplus=G.fresh('support_kernel_plus');
  const slot=name=>G.fresh('arbitrary_'+name),local=name=>G.choose(X,Xkeep,Xcut,slot(name+'_inner'),slot(name+'_collar'),z),repair=name=>G.choose(X,X0,Iright,z,slot(name+'_repair'),z),
    F=G.add(local('F'),repair('F')),U=G.add(local('U'),repair('U')),
    M=G.choose(X,Xkeep,lastU,slot('M_inner'),slot('M_middle'),z),average=G.choose(X,Xkeep,lastU,slot('average_inner'),slot('average_middle'),z),
    averageEta=G.choose(X,Xkeep,lastU,slot('average_eta_inner'),slot('average_eta_middle'),z),
    Pi=G.choose(X,Xkeep,Xplus,slot('Pi_inner'),slot('Pi_middle'),z),n=slot('integer_order'),h=G.parameter('h'),D=G.sub(q(1,2),h),
    v=G.div(G.sub(G.sub(G.mul(q(2),eta,U),G.mul(q(2),eta,G.add(D,G.mul(q(2),n,h)),average)),G.mul(G.sub(G.one,G.pow(eta,2)),averageEta)),G.sub(G.one,G.mul(q(2),h,G.pow(eta,2)))),
    result=commonExteriorZeroAudit(G,{X,eta,endpoints:[Xcut,Iright,lastU,Xplus],roots:[F,U,M,average,averageEta,Pi,v]});
  const t=G.fresh('nonzero_primitive_variable'),bare=G.integral(G.substitute(local('nonzero_integrand'),X,t),t,z,Xcut),negative=commonExteriorZeroAudit(G,{X,eta,endpoints:[Xcut,Iright,lastU,Xplus],roots:[bare,G.add(F,G.one)]});
  return {...result,schema:'MathScope.CommonCompletionSupportKernel/1',negativeControls:negative.rows.map(r=>({root:r.root,correctlyRejected:!r.zero})),
    pass:result.pass&&negative.rows.every(r=>!r.zero),arbitraryOrderAndInteriorBodies:true,averageEtaMeaning:'Since every support endpoint is eta independent, the eta derivative has the same identically-zero exterior.',
    actualSourceAuthenticated:false,originalCoefficientOrMomentEquationAltered:false};
}

export function selectedAdmissibleBandArithmetic(){
  const rows=[
    {id:'strict-positive-integer-buffer',pass:8n>0n},
    {id:'whole-physical-band-qstar-ratio',pass:8n-4n-1n===3n&&(1n<<3n)===8n},
    {id:'palette-lower-and-upper-ratio',pass:4n>0n&&2n>0n},
    {id:'source-frequency-log-budget',pass:64n/4n-4n===12n},
    {id:'strictly-positive-normalized-weight-lower',pass:1n>0n&&64n>0n},
    {id:'terminal-point-before-flat-edge',pass:1n>0n&&1n<4n*3n},
    {id:'terminal-start-after-common-correction-support',pass:128n>1n},
  ];
  return {schema:'MathScope.SelectedAdmissibleBandArithmetic/1',rows,pass:rows.every(r=>r.pass),exactIntegerArithmetic:true,
    hugeDyadicIntegerMaterialized:false,actualSourceAuthenticated:false};
}

function bindCommonSupport(operator,G){
  const background=operator.background;assertActualCompletedBackgroundC2(background);
  const prepared=background.prepared,{bootstrap,records}=prepared,{X,eta}=bootstrap.constants,r=bootstrap.orderOne,
    sourceOrder=actualSupportOrderProof(bootstrap.completedOrderOne),q=(n,d=1)=>G.q(n,d),lastU=G.mul(r.X0,G.pow(r.supports[1][1],2)),
    endpoints=[r.Xminus,r.Xkeep,r.Xcut,bootstrap.inner.aSquared,r.X0,r.IposRight,lastU,bootstrap.constants.Xv,r.Xplus];
  for(const pair of r.supports)for(const b of pair)endpoints.push(G.mul(r.X0,G.pow(b,2)));
  const fields=['F','U','M','Pi','v'],rows=records.slice(1).map(record=>({order:record.order,
    fields:Object.fromEntries(fields.map(name=>[name,record.global[name]])),
    exterior:commonExteriorZeroAudit(G,{X,eta,endpoints,roots:fields.map(name=>record.global[name])}),
    moments:record.global.actualMomentChecks.map(c=>c.pass),
    actualPositiveOrderStep:record.order===1?'the authenticated completed first-order source':'the same completeOrder function, using the fixed bootstrap support endpoints'}));
  const kernel=commonCompletionSupportKernel(G),induction=background.induction;
  const checks=[
    {id:'private-all-order-background',pass:true},
    {id:'actual-common-support-order',pass:sourceOrder.pass&&sourceOrder.endpoints.Xplus===r.Xplus&&sourceOrder.endpoints.Xb===r.Xb},
    {id:'all-observed-coefficients-have-exact-zero-exterior',pass:rows.every(row=>row.exterior.pass&&row.moments.every(Boolean))},
    {id:'arbitrary-order-support-grammar',pass:kernel.pass&&kernel.arbitraryOrderAndInteriorBodies},
    {id:'source-same-well-founded-recipe-and-full-moments',pass:induction.allIntegerOrdersBySameWellFoundedRecipe&&induction.coefficientStep.everyPreviousMomentGateExecuted&&induction.coefficientStep.actualMomentCorrectionUsesFullSupport&&induction.sourceDefinitionChanged===false},
    {id:'cutoff-local-finiteness-is-exact',pass:background.cutoffs.program.definition.prefixIndependent&&induction.cutoffStep.canonical},
    {id:'terminal-stage-follows-positive-post-pulse-length',pass:G.outer.stages.find(s=>s.id==='interpolation')?.length===G.parameter('Tf')&&same(G.source.parametersExactExpressions.Tf,{integer:128})&&G.outer.stages.at(-1)?.id==='terminal'},
  ];
  if(!checks.every(row=>row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual arbitrary-order terminal support binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  return {schema:'MathScope.ActualAllOrderCommonTerminalSupport/1',coordinates:{X,eta},endpoints:{Xplus:r.Xplus,Xb:r.Xb,lastU,Xcut:r.Xcut,IposRight:r.IposRight},
    ordering:sourceOrder,observedOrders:rows,universalGrammar:kernel,checks,pass:true,
    universalDerivation:{base:'The actual n=1 moment-completed profiles have the checked zero after-branches. The actual source support-order proof puts every repair endpoint before Xplus.',
      step:'For every integer n>=2, completeOrder uses the same bootstrap endpoints: local F/U vanish after Xcut, dF/dU after IposRight, M and average after lastU, and Pi after Xplus. The formula for v uses U, average and its eta derivative. These statements hold for arbitrary inner bodies and moment debts; no bound on n or generated-prefix extrapolation is used.',
      smoothJets:'All endpoints are eta independent and the fields are the original smooth moment-completed fields. An identically-zero open exterior therefore has every finite X/eta derivative zero.',
      completeSeries:'For every q>0, local finiteness follows from c_n>=2^n. Each positive-order summand and its cutoff/extra-stream derivatives is exactly zero on X>Xplus. Hence the complete source and every finite q/X/eta jet equal the leading source on this open annulus.',
      scope:'This equality is restricted to X>Xplus. It does not discard possibly active coefficients on X<=Xplus or certify the stress/residual estimates.'},
    allPositiveOrdersCertifiedByCommonSupport:true,finiteObservedOrderCount:rows.length,finitePrefixExtrapolated:false,allActiveCutoffsClaimedOff:false};
}

function cutoffsFor(G,v,Ls,r0){
  const q=(n,d=1)=>G.q(n,d),xi=G.fresh('admissible_terminal_transverse_xi'),a=G.sqrt(G.pow(G.div(xi,r0),2)),
    chi=G.choose(a,q(1,4),q(3,4),G.one,G.step(G.sub(q(3,2),G.mul(q(2),a))),G.zero),
    transverseMass=G.integral(G.pow(chi,2),xi,G.neg(r0),r0),psi=G.mul(G.step(G.sub(G.div(G.mul(q(20),v),Ls),q(4))),G.step(G.sub(q(16),G.div(G.mul(q(20),v),Ls))));
  return {xi,chi,transverseMass,psi,transverseMassLower:G.div(r0,q(2)),transverseMassUpper:G.mul(q(2),r0),
    longitudinalPlateau:['Ls/4','3Ls/4'],transverseMassNormalizedToOne:false};
}

/** One private actual source run supplies the fixed background norms,
 * leading fields and target. A copied graph adds a DIFFERENT, proved-small
 * dyadic band and its actual two pulse systems. The original source run
 * is not reclassified as an admissible ell=1 member. */
export function prepareActualAdmissibleTerminalCovariance(input={},context={}){
  const request=requestOf(input),operator=prepareActualCovarianceOperator({sourceProfile:request.sourceProfile,ellExact:'1'},context);
  return attachActualAdmissibleTerminalCovariance(operator,context);
}

export function attachActualAdmissibleTerminalCovariance(operator,context={}){
  assertActualCovarianceOperator(operator);context.checkCancelled?.();
  if(operator.program.band.ellExact!=='1')fail('UNSUPPORTED','This fixed source/norm producer is the actual ell=1 graph; the new small-q pulse is constructed separately.');
  const request=requestOf({sourceProfile:operator.sourceProfile}),sourceTarget=attachActualCovarianceTarget(operator,context),bounds=certifyActualCovarianceOperatorBounds(operator),
    sourceNodeCount=operator.G.nodes.length,G=new ActualCovarianceExpressions(operator.G,{maxNodes:3000000,checkCancelled:context.checkCancelled}),q=(n,d=1)=>G.q(n,d),powReal=(x,a)=>G.exp(G.mul(a,G.log(x))),
    support=bindCommonSupport(operator,G),arithmetic=selectedAdmissibleBandArithmetic(),c=operator.constants,f=structuredClone(operator.frozen),oc=structuredClone(operator.coordinates),
    {R,Z,T,theta,v,Xrep,etaRep,sRep}=oc,logTwo=G.log(q(2)),ell=G.add(bounds.selection.ellMinimum,q(8)),S=G.pow(ell,2),Q=G.exp(G.neg(G.mul(ell,logTwo))),
    epsilon=powReal(Q,c.h),k=G.ceiling(G.inv(G.sqrt(epsilon))),Tg=G.add(q(4),G.sqrt(q(2))),r0=q(1,1n<<34n),
    paletteQuotient=G.div(G.sub(G.mul(G.add(G.one,c.h),ell,logTwo),G.mul(q(2),G.log(ell))),G.log(Tg)),paletteIndex=G.neg(G.ceiling(G.neg(paletteQuotient))),
    ci=G.mul(powReal(Tg,paletteIndex),powReal(Q,G.add(G.one,c.h))),Ls=G.div(G.mul(q(2),r0),ci),
    Bs=G.sqrt(G.div(f.lambda0,G.mul(epsilon,G.pow(k,2),G.pow(G.sqrt(G.add(G.one,G.pow(c.u,2))),3)))),
    cutoffs=cutoffsFor(G,v,Ls,r0),Dgeom=G.sub(q(4),G.mul(q(2),G.sqrt(q(2)))),haarFactor=G.mul(q(1,2),Dgeom,ci,cutoffs.transverseMass),
    matrixNorm=G.mul(G.pow(c.Bnorm,256),G.pow(G.add(G.one,k),8),G.pow(G.add(G.one,Ls),8)),fields=structuredClone(operator.leadingFields),
    geometry={ell,S,Q,epsilon,k,Tg,r0,paletteQuotient,paletteIndex,ci,Ls,Bs,Dgeom,haarFactor,lengthRatioBounds:[G.mul(q(2),r0),G.mul(q(2),r0,Tg)]},
    constants={h:c.h,A:c.A,D:c.D,Renv:c.Renv,kappa:c.kappa,u:c.u,Bnorm:c.Bnorm,matrixNorm},parameters=[R,Z,T,Xrep,etaRep,sRep],{dot,mul}=covarianceMatrixAlgebra(G),families=[];
  for(const sign of [1,-1]){
    context.checkCancelled?.();
    const beta=f.K.map((x,j)=>G.mul(Bs,G.sub(x,G.div(G.mul(q(sign),c.u,f.N[j]),G.mul(Ls,f.gabs))))),pTilde=G.mul(f.Rrep,beta[0]),pz=beta[1],scaledP=G.mul(k,pTilde),
      rounded=G.neg(G.ceiling(G.neg(G.add(scaledP,q(1,2))))),fallback=G.choose(scaledP,G.zero,G.zero,q(-1),G.one,G.one),nonzero=G.choose(rounded,q(-1,2),q(1,2),rounded,fallback,rounded),
      p=G.div(nonzero,k),x0=G.mul(q(sign,2),Bs,c.u),phaseSpeed=G.add(G.mul(p,fields.F),G.mul(pz,fields.G)),HR=G.derivative(phaseSpeed,R),HZ=G.derivative(phaseSpeed,Z),HT=G.derivative(phaseSpeed,T),
      frame=actualMovingPulseFrame(G,{F:fields.F,FR:G.derivative(fields.F,R),GR:G.derivative(fields.G,R),R,epsilon,k,p,pz,x0,v,Ls,u:c.u,c0:f.c0,lambda0:f.lambda0,HR,HZ,sign}),
      time=G.fresh('admissible_terminal_log_P'),logP=G.integral(G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,time),time,G.div(Ls,q(2)),v),P=G.exp(logP),
      system=G.defineCovarianceVolterra({name:'ActualAdmissibleTerminalPulse_'+(sign===1?'plus':'minus'),variable:v,parameters,matrix:frame.wMatrix,normUpper:matrixNorm,length:Ls}),
      w=[0,1].map(j=>G.covarianceValue(system,j,v,parameters)),z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x])).map(row=>row[0]),
      Htheta=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[1]),v,G.zero,Ls)),Hz=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),t[0],t[2]),v,G.zero,Ls)),
      mass=G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(t[0],2)),v,G.zero,Ls)),Ac=G.mul(G.neg(f.c0),G.sqrt(G.add(G.one,G.pow(c.u,2))));
    families.push({sign,carrier:{pTilde,p,pz,x0,roundedInteger:nonzero,roundingErrorUpper:G.inv(k)},
      phaseSpeed,phaseDerivatives:{R:HR,Z:HZ,T:HT},phase:G.sub(G.add(G.mul(p,theta),G.div(G.mul(pz,Z),epsilon),G.mul(x0,R)),G.mul(v,phaseSpeed)),
      frame,system,w,z,t,logP,P,covariance:{theta:Htheta,z:Hz,mass,normalizedRows:[G.neg(G.div(G.add(G.mul(f.N[0],Htheta),G.mul(f.N[1],Hz)),G.mul(Ac,mass))),G.div(G.add(G.mul(f.K[0],Htheta),G.mul(f.K[1],Hz)),G.mul(c.u,mass))]},
      initial:{w:[G.one,G.zero],z:[G.substitute(P,v,G.zero),G.zero],finitePartialSumUsed:false}});
  }
  const components=structuredClone(sourceTarget.targetChart.components),H=[families.map(x=>x.covariance.theta),families.map(x=>x.covariance.z)],
    determinant=G.sub(G.mul(H[0][0],H[1][1]),G.mul(H[0][1],H[1][0])),adjugate=[[H[1][1],G.neg(H[0][1])],[G.neg(H[1][0]),H[0][0]]],
    weights=adjugate.map(row=>G.div(dot(row,components),determinant)),Hy=H.map(row=>dot(row,weights)),inverseChecks=Hy.map((root,i)=>sourceGraphRationalIdentity(G,G.sub(root,components[i]),{atomicNodes:[...H.flat(),...components]})),
    Ac=G.mul(G.neg(f.c0),G.sqrt(G.add(G.one,G.pow(c.u,2)))),targetN=dot(f.N,components),targetK=dot(f.K,components),targetScale=G.neg(G.div(targetN,Ac)),
    C=[families.map(x=>x.covariance.normalizedRows[0]),families.map(x=>x.covariance.normalizedRows[1])],detC=G.sub(G.mul(C[0][0],C[1][1]),G.mul(C[0][1],C[1][0])),
    normalizedWeights=weights.map((y,i)=>G.div(G.mul(families[i].covariance.mass,y),targetScale)),
    massLower=G.mul(haarFactor,bounds.recipe.mass.massLowerCoefficient,G.sqrt(Ls)),
    massUpper=G.mul(haarFactor,G.pow(bounds.recipe.cone.amplitudeUpper,2),Ls),
    absoluteDeterminantLower=G.mul(q(15,8),Ac,c.u,...families.map(x=>x.covariance.mass)),
    uniformAbsoluteDeterminantLower=G.mul(q(15,8),Ac,c.u,G.pow(massLower,2)),
    weightLower=families.map(x=>G.div(G.mul(c.kappa,targetScale),G.mul(q(64),x.covariance.mass))),weightUpper=families.map(x=>G.div(G.mul(q(2),targetScale),x.covariance.mass)),
    weightLowerWithoutH=G.div(G.mul(c.kappa,targetScale),G.mul(q(64),massUpper)),weightUpperWithoutH=G.div(G.mul(q(2),targetScale),massLower),
    target={raw:structuredClone(sourceTarget.raw),factor:sourceTarget.targetChart.factor,components,H,determinant,adjugate,weights,squareRootWeights:weights.map(y=>G.sqrt(y)),Hy,inverseChecks,
      targetScale,targetDirectionRatio:G.div(G.mul(Ac,targetK),G.mul(c.u,G.neg(targetN))),normalizedWeights},
    selection={...structuredClone(bounds.selection),selectedEll:ell,selectedQ:Q,physicalBand:[G.div(Q,q(2)),G.mul(q(2),Q)],physicalBandQStarRatioUpper:q(1,8),
      selectedCertifiedDomainMember:true,selectedIntegerMaterialized:false,unknownPaperQbigAndEll0Evaluated:false},
    quantitative={Ac,C,detC,normalizedDeterminantLower:q(15,8),normalizedDeterminantUpper:q(17,8),maximumColumnError:G.div(c.kappa,q(128)),
      normalizedWeightLower:G.div(c.kappa,q(64)),normalizedWeightUpper:q(2),massLower,massUpper,absoluteDeterminantLower,uniformAbsoluteDeterminantLower,signedDeterminantUpper:G.neg(absoluteDeterminantLower),
      weightLower,weightUpper,weightLowerWithoutH,weightUpperWithoutH,squareRootWeightLower:weightLower.map(x=>G.sqrt(x)),squareRootWeightUpper:weightUpper.map(x=>G.sqrt(x)),
      squareRootWeightLowerWithoutH:G.sqrt(weightLowerWithoutH),squareRootWeightUpperWithoutH:G.sqrt(weightUpperWithoutH),
      positivityDomain:'The selected fixed band; Xplus<X_rep<Xb and Xplus<X<Xb, eta_rep,eta in[-1,1], s_rep,s in[1/2,2], same slow box distance<=4/S^3. Representatives and rounded labels are frozen for slow differentiation.',
      numericalValuesEnclosed:false,lowerBoundMayBeExtremelySmall:true},
    heat=operator.background.prepared.bootstrap.actualHeat.heat,witnessX=G.mul(heat.Xb,G.exp(q(-1,4))),witnessR=G.sqrt(G.mul(q(2),witnessX)),
    at=body=>G.simultaneousSubstitute(body,parameters,[witnessR,G.zero,G.one,witnessX,G.zero,G.one]),
    witness={X:witnessX,R:witnessR,Z:G.zero,T:G.one,Xrep:witnessX,etaRep:G.zero,sRep:G.one,q:Q,
      H:H.map(row=>row.map(at)),determinant:at(determinant),weights:weights.map(at),squareRootWeights:target.squareRootWeights.map(at),target:components.map(at),
      massLower:at(massLower),absoluteDeterminantLower:at(uniformAbsoluteDeterminantLower),weightLowerWithoutH:at(weightLowerWithoutH),weightUpperWithoutH:at(weightUpperWithoutH)};
  const familyChecks=families.flatMap(family=>{
    const system=G.covarianceSystems[family.system],n=[G.sub(family.carrier.x0,G.mul(v,family.phaseDerivatives.R)),G.div(family.carrier.p,R),G.sub(family.carrier.pz,G.mul(epsilon,v,family.phaseDerivatives.Z))],nPrime=[G.neg(family.phaseDerivatives.R),G.zero,G.neg(G.mul(epsilon,family.phaseDerivatives.Z))],
      K=[[G.zero,G.neg(G.mul(q(2),fields.F)),G.zero],[G.add(G.mul(q(2),fields.F),G.mul(R,G.derivative(fields.F,R))),G.zero,G.zero],[G.derivative(fields.G,R),G.zero,G.zero]],
      pressure=[0,1,2].map(j=>G.sub(G.add(...K.map((row,i)=>G.mul(n[i],row[j]))),nPrime[j])),Aphi=K.map((row,i)=>row.map((x,j)=>G.add(G.neg(x),G.div(G.mul(n[i],pressure[j]),dot(n,n)))));
    return [
      {id:'actual-new-band-pressure-and-moving-normal-'+family.sign,pass:same(family.frame.n,n)&&same(family.frame.nPrime,nPrime)&&same(family.frame.principalK,K)&&same(family.frame.Aphi,Aphi)},
      {id:'actual-new-band-Volterra-body-and-initial-'+family.sign,pass:family.system>=operator.G.covarianceSystems.length&&same(system.matrix,family.frame.wMatrix)&&same(system.initial,[G.one,G.zero])&&system.length===Ls&&system.normUpper===matrixNorm},
      {id:'actual-new-band-H-and-mass-integrands-'+family.sign,pass:family.covariance.theta===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),family.t[0],family.t[1]),v,G.zero,Ls))&&family.covariance.mass===G.mul(haarFactor,G.integral(G.mul(G.pow(cutoffs.psi,2),G.pow(family.t[0],2)),v,G.zero,Ls))},
      {id:'rounded-carrier-is-frozen-in-slow-coordinates-'+family.sign,pass:[family.carrier.p,family.carrier.pz,family.carrier.x0].every(root=>[R,Z,T,v].every(variable=>!G.freeCoordinates(root).has(variable)))}
    ];
  });
  const checks=[
    {id:'private-original-operator-and-target',pass:true},...support.checks,
    {id:'source-positive-h-retained',pass:sourceExponentContract().positive&&sourceExponentContract().notNumericallyReplaced&&c.h===G.parameter('h')},
    {id:'new-graph-preserves-source-node-prefix',pass:same(G.nodes.slice(0,sourceNodeCount),operator.G.nodes.slice(0,sourceNodeCount))},
    {id:'selected-ell-is-source-threshold-plus-eight',pass:ell===G.add(bounds.selection.ellMinimum,q(8))&&Q===G.exp(G.neg(G.mul(ell,logTwo)))&&ell!==operator.geometry.ell},
    {id:'selected-threshold-is-original-source-maximum',pass:bounds.selection.ellMinimum===G.ceiling(G.maximum(q(8),G.maximum(...bounds.selection.conditions.map(x=>x.lower)),G.pow(G.div(q(64),c.h),2)))},
    {id:'source-norm-and-selector-are-independent-of-band-and-coordinates',pass:G.freeCoordinates(c.Bnorm).size===0&&G.freeCoordinates(ell).size===0&&bounds.selection.displayAnchorChangesThreshold===false},
    {id:'source-Bnorm-has-the-fixed-all-band-definition',pass:c.Bnorm===G.add(q(1n<<128n),G.pow(c.Renv,4096),...['FGErrorConstant','bTotalConstant','FTotalConstant','GTotalConstant'].map(name=>operator.background.roots[name]),operator.background.chart.operatorA,operator.background.chart.operatorB)&&Object.values(bounds.operatorConstants).every(x=>x===G.pow(c.Bnorm,256))},
    {id:'original-palette-length-ratio-constants-retained',pass:same(geometry.lengthRatioBounds,operator.geometry.lengthRatioBounds)&&same(geometry.lengthRatioBounds,[bounds.recipe.input.lengthRatioLower,bounds.recipe.input.lengthRatioUpper])},
    {id:'actual-leading-fields-and-full-target-retained',pass:same(fields,operator.leadingFields)&&same(target.components,sourceTarget.targetChart.components)&&target.raw.F===operator.background.prepared.records[0].global.F&&target.raw.M===operator.background.prepared.bootstrap.finalM},
    {id:'actual-source-frame-and-concentration-premises-consumed',pass:bounds.pass&&bounds.audit.pass&&bounds.scalar.pass&&bounds.cone.pass&&Object.values(bounds.checks).every(Boolean)},
    {id:'exact-two-row-inverse-identities',pass:inverseChecks.every(x=>x.pass)},
    {id:'exact-integer-margin-checks',pass:arithmetic.pass},
    {id:'all-witness-slow-and-representative-coordinates-substituted',pass:[...witness.H.flat(),witness.determinant,...witness.weights,...witness.target,witness.massLower,witness.absoluteDeterminantLower,witness.weightLowerWithoutH,witness.weightUpperWithoutH].every(root=>G.freeCoordinates(root).size===0)},
    ...familyChecks
  ];
  if(!checks.every(row=>row.pass))fail('INVALID_SOURCE_CONSTRUCTION','The actual selected terminal covariance binding failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const sourceBinding={sourceProfile:operator.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,
    originalPDFSHA256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',equations:['5.18','5.20','5.23','6.8','7.1','7.2','7.27','7.29'],
    normProducer:'The private actual ell=1 run supplies the fixed source background/leading-field/norm definitions only. Its pulse is not reused or declared admissible.',
    newOperator:'New original-form geometry, both rounded frozen carriers, moving-normal pressure, moving basis, full Volterra solution and covariance integrals at ell=ellMinimum+8.',
    supportProducer:'Actual completed all-order background and original common-support/moment recipe; all positive-order fields vanish on the declared terminal annulus for every q.',
    targetProducer:'The actual full heat/B8/C12/I1/I2 leading stress and both viscous shear terms. No target values or bounds are supplied by a caller.'};
  const proof={kind:'SOURCE_BOUND_WRITTEN_ANALYTIC_POSITIVITY_WITH_EXECUTED_ACTUAL_SMALL_Q_OPERATOR',
    commonSupport:support.universalDerivation,
    selectedBand:{definition:'ell*=ellMinimum+8, Q*=2^(-ell*), S*=ell*^2, q=Q* s with 1/2<=s<=2.',
      membership:'ellMinimum=ceil(max(8,Sminimum,(64/h)^2)) is a positive integer. Thus ell*>ellMinimum and S*>=Sminimum. All actual frame/concentration/source-direction conditions are met.',
      frequency:'The original log estimate gives S*^2*(epsilon+epsilon^2+1/k)<1; all source h, epsilon and the integer ceiling k remain exact.',
      qStar:'2Q*=2^(-ellMinimum-7)=qStar/8, so the whole selected physical band lies strictly below the source-certified qStar.',
      palette:'For a=((1+h)ell* log2-2logell*)/logTg and m=floor(a), 0<=a-m<1 gives 1/(Tg*S*)<ci<=1/S*. Therefore 2r0<=Ls/S*<2r0*Tg. No floating logarithm or ceiling is evaluated.'},
    sourceTransfer:{completedField:'On both the representative and slow-point terminal neighborhoods the full original completed F/G and all finite slow derivatives equal the retained leading functions. The fixed source C2 constants therefore still bound the actual new coefficients, with completed-leading error exactly zero there.',
      originalBounds:structuredClone(bounds.primitiveDerivation),
      retainedFeatures:'The new frame uses the original nonzero nearest-integer carrier, the n-prime pressure term and B-prime term. Its reference constants N,K,c0,lambda0 are the original leading ones.',
      exactSolutions:'The two new Volterra systems are defined by their actual coefficient bodies and original source matrix bound. No finite display sum is identified with their limit.'},
    positivity:{radialAndMass:'The Riccati invariant cone gives z_plus>0 and |z_minus/z_plus|<=coneK/S*<=1/2. Hence x=t_r>0. The original psi plateau and Haar/transverse factors give mass>=haarFactor*massLowerCoefficient*sqrt(Ls)>0.',
      massUpper:'Since P<=1, psi<=1 and x<=amplitudeUpper*P, mass<=haarFactor*amplitudeUpper^2*Ls. This finite bound does not require a numerical H integral.',
      columns:'Actual frame and Gaussian absolute-moment estimates imply |C-Cideal|_max<=kappa/128 with Cideal=[[1,1],[-1,1]]. All recipe constants and the stronger source selector are bound above.',
      determinant:'The exact Bernstein audit gives 15/8<det(C)<17/8. Since det([-N/Ac;K/u])=-1/(Ac*u), det(H)=-Ac*u*mass_plus*mass_minus*det(C)<0.',
      weights:'On the open stress shell targetScale=-(N dot T)/Ac>0, and the actual target cone plus same-box modulus gives kappa/64<=mass_sign*y_sign/targetScale<=2. Thus each actual inverse weight is strictly positive with the displayed lower and upper roots.',
      squareRoots:'At a fixed label and frozen representative, the source, Volterra solution, H and target are smooth in the open slow chart. Nonzero determinant and strictly positive weights make their positive square roots smooth there. The quantitative square-root bounds follow from monotonicity; no flat-edge or cross-label derivative claim is made.'},
    witness:{profile:'X=Xrep=Xb*exp(-1/4), eta=etaRep=0, s=sRep=1',slow:'R=sqrt(2X), Z=0, T=1; distance to representative is exactly zero.',
      terminalMembership:'Xtail=Xb*exp(-3), hence log(X/Xtail)=11/4. Xplus=Xv*exp(1)<Xtail because the post-pulse interpolation alone has length128. Therefore Xplus<X<Xb.',
      grid:'Choose a slow lattice box containing this point and use the point as its representative. The original representative choice is permitted anywhere in the intersecting box; no lattice-center restriction is introduced.'},
    boundaries:{paperGamma:'The paper leaves its final ell0 and qbig choices unspecified. The new actual member is in the separately source-proved covariance sufficient domain. This does not assert membership in an unspecified final Gamma or completion of its additional physical-residual conditions.',
      local:'Only X>Xplus is reduced. Other source boxes and the flat endpoints are not covered by this certificate.',
      numerical:'All tiny source parameters, full heat and huge integer-band expressions are retained. No numerical whole-H, determinant or inverse-weight interval is claimed.',
      formal:'Written analytic derivation plus actual AST/identity/arithmetic checks; no new analytic Lean kernel proof.',
      progression:'Whole G-POS, whole M2 and M3 prerequisites remain separate and unclosed.'}};
  const decision={selectedSourceCovarianceDomainMember:true,wholeSelectedPhysicalBandBelowSourceQStar:true,actualNewSmallQOperatorConstructed:true,
    actualTerminalCompletedSourceEqualityProved:true,allPositiveOrdersDiscardedOutsideTheirSupportOnly:true,
    actualDeterminantSign:'NEGATIVE',actualDeterminantNonzeroOnDeclaredTerminalDomain:true,actualInverseWeightSigns:['POSITIVE','POSITIVE'],
    actualPositiveWeightsOnDeclaredTerminalDomain:true,actualSmoothPositiveSquareRootWeightsOnOpenFixedLabelDomain:true,
    sourceBoundDeterminantAndWeightBounds:true,rigorousWholeHNumericalEnclosure:false,unknownPaperGammaMembership:'NOT_EVALUATED',
    arbitraryOriginalQbigAndEll0Evaluated:false,allSourceBoxesCovered:false,flatEndpointExtensionCertifiedHere:false,
    wholeGPOSComplete:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,m3MayStart:false};
  const roots={...geometry,sourceEllMinimum:bounds.selection.ellMinimum,sourceQStar:bounds.selection.qStar,sourceNorm:c.Bnorm,
    terminalXplus:support.endpoints.Xplus,terminalXb:support.endpoints.Xb,...Object.fromEntries(families.flatMap(family=>[['Htheta_'+family.sign,family.covariance.theta],['Hz_'+family.sign,family.covariance.z],['mass_'+family.sign,family.covariance.mass]])),
    H,determinant,weights,squareRootWeights:target.squareRootWeights,
    quantitative:Object.fromEntries(Object.entries(quantitative).filter(([,value])=>typeof value==='number'||Array.isArray(value))),witness};
  const chart={...structuredClone(operator.chart),qActual:G.mul(Q,operator.chart.s),restriction:'Xplus<X<Xb and Xplus<Xrep<Xb, same source slow box. Exact equality with the full completed background holds throughout the open terminal neighborhood.'},
    result={G,operator,request,coordinates:oc,chart,fields,frozen:f,geometry,constants,cutoffs,families,target,roots,support,selection,quantitative,sourceBinding,proof,decision,checks,arithmetic};
  const packed=G.pack(roots,{schema:'MathScope.ActualAdmissibleTerminalCovarianceProgram/1',compiler:'actual-admissible-terminal-covariance.mjs:prepareActualAdmissibleTerminalCovariance',compilerInput:request,
    coordinates:oc,chart,fields,frozen:f,geometry,constants,cutoffs,families,target,support,selection,quantitative,sourceBinding,proof,decision,checks,arithmetic}),
    {nodes:liveNodes,...rest}=packed,program={...structuredClone(rest),nodes:liveNodes.slice()};result.program=program;
  seals.set(result,{G,operator,sourceNodeCount,program,programNodes:program.nodes,metadata:metadata(program),serialized:canonicalStringify(program),
    count:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),covarianceCount:G.covarianceSystems.length,covariance:JSON.stringify(G.covarianceSystems),binding:publicBinding(result)});
  return result;
}

export function assertActualAdmissibleTerminalCovariance(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.operator!==s.operator||publicBinding(p)!==s.binding||p.program!==s.program||p.program.nodes!==s.programNodes||metadata(p.program)!==s.metadata||JSON.stringify(p.program.nodes)!==s.nodes||
    JSON.stringify(s.G.nodes.slice(0,s.count))!==s.nodes||!s.G.functionDefinitionsUnchanged(s.definitions)||JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged private actual selected terminal covariance program; copied conclusions and modified function/Volterra bodies are not certificates.');
  assertActualCovarianceOperator(s.operator);return true;
}

export async function actualAdmissibleTerminalCovarianceCertificateFromProgram(p,context={}){
  assertActualAdmissibleTerminalCovariance(p);const s=seals.get(p),graphSHA256=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualAdmissibleTerminalCovarianceCertificate/1',request:p.request,sourceBinding:p.sourceBinding,
    graph:{sha256:graphSHA256,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:p.program.compiler,compilerInput:p.request,roots:p.roots,
      graphIncluded:false,fixedCompilerPrefix:true,laterGraphAppendsExcluded:true,sourcePrefixCopiedAndUnchanged:true},
    decision:p.decision,selection:p.selection,quantitative:p.quantitative,proof:p.proof,checks:p.checks,arithmetic:p.arithmetic,
    support:{pass:p.support.pass,endpoints:p.support.endpoints,observedOrders:p.support.observedOrders.map(x=>x.order),universalDerivation:p.support.universalDerivation,
      allPositiveOrdersCertifiedByCommonSupport:true,finitePrefixExtrapolated:false},
    actualInverseChecks:p.target.inverseChecks,pass:true,
    scope:'Actual new small-q terminal source operator with source-bound written analytic det(H)<0 and two positive smooth square-root weights on its declared open fixed-label domain. Original unspecified Gamma, all boxes, flat endpoints, numeric whole-H, analytic Lean and M3 remain unclosed.'};
}

export async function actualAdmissibleTerminalCovarianceCertificate(input={},context={}){
  return actualAdmissibleTerminalCovarianceCertificateFromProgram(prepareActualAdmissibleTerminalCovariance(input,context),context);
}
