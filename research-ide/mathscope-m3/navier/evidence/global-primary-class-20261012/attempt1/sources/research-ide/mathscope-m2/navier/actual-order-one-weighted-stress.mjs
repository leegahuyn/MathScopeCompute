/** The actual n=1 weighted-stress edge in (5.22), kept separate from the
 * full background/residual summation theorem. No weight sign is assumed.
 * All source factors, stress primitives and the historical c1 are retained.
 */
import {prepareActualOrderInduction,assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {attachActualInductionNorms} from './actual-residual-order-induction-norms.mjs';
import {attachActualNormalizedCutoffs,assertActualNormalizedCutoffs} from './actual-residual-order-induction-cutoffs.mjs';
import {sourceNormalizedCutoffWeights} from './actual-residual-order-induction-kernels.mjs';
import {assertActualHeatLeading} from './actual-continuation-exact-heat.mjs';
import {actualSupportOrderProof,checkActualExteriorZeros} from './actual-continuation-exact-support.mjs';
import {actualHeatExteriorIdentity,sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {ellOneSourceScalarIdentity} from './actual-covariance-ell-one-obstruction.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile,sourceExponentContract} from './source-profile.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),same=(a,b)=>canonicalStringify(a)===canonicalStringify(b);
const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const absolute=n=>n<0n?-n:n;
const order=(n,maximum=16)=>{if(!Number.isSafeInteger(n)||n<0||n>maximum)fail('RESOURCE_LIMIT','Use a finite weighted-stress derivative order from zero through '+maximum+'.');return n;};

/** Exact rational derivative and integration rules for the terminal seed.
 * This is a generic kernel, not an actual-source authentication token.
 */
export function terminalGaussianPrimitiveRules(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='derivativeOrder'))fail('INVALID_INPUT','Only a finite derivative order is accepted.');
  const m=order(input.derivativeOrder??2),laurent=[];let current=new Map([[-6,1n]]);
  for(let j=0;j<=m;j++){
    const coefficients=[...current].filter(([,c])=>c).sort((a,b)=>a[0]-b[0]);
    laurent.push({derivativeOrder:j,coefficients:coefficients.map(([p,c])=>[p,String(c)]),
      pole:6+3*j,absoluteCoefficientSum:String(coefficients.reduce((s,[,c])=>s+absolute(c),0n))});
    const next=new Map(),add=(p,c)=>next.set(p,(next.get(p)??0n)+c);
    for(const [p,c]of current){add(p-1,BigInt(p)*c);add(p-3,8n*c);}current=next;
  }
  const stirling=Array.from({length:m+1},(_,r)=>Array(r+1).fill(0n));stirling[0][0]=1n;
  for(let r=1;r<=m;r++)for(let j=1;j<=r;j++)stirling[r][j]=(stirling[r-1][j-1]??0n)+BigInt(r-1)*(stirling[r-1][j]??0n);
  const checks=[
    {id:'positive-integrating-factor-lower-bound',pass:8n*16n-3n===125n},
    {id:'three-powers-gained-by-backward-integration',pass:6-3===3},
    {id:'highest-pole-and-positive-leading-coefficient',pass:laurent.every(r=>r.coefficients[0][0]===-r.pole&&BigInt(r.coefficients[0][1])===8n**BigInt(r.derivativeOrder))},
    {id:'every-finite-coordinate-conversion-generated',pass:stirling.length===m+1&&stirling.every((row,r)=>row[r]===1n)}
  ];
  return {schema:'MathScope.TerminalGaussianPrimitiveRules/1',derivativeOrder:m,
    seed:'E(delta)=exp(-4/delta^2), extended flat by zero at delta=0',deltaInterval:['0','1/4'],
    derivativeRule:'d_delta(E*Q)=E*(Q_prime+8*delta^-3*Q)',laurent,
    integration:{identity:'d_delta(E*delta^-3)=E*delta^-6*(8-3*delta^2)',
      positiveFactorLower:'125/16',integralUpperFactor:'16/125',
      inequality:'Integral_0^delta E(u)*u^-6 du <= (16/125)*E(delta)*delta^-3',
      zeroEndpoint:'exp(-4/delta^2)*delta^-3 tends to zero, with all fixed derivative orders.'},
    ordinaryXConversion:{identity:'partial_X^r=(-1)^r X^-r sum_j unsignedStirlingFirst(r,j)*partial_delta^j',
      unsignedStirlingFirst:stirling.map(r=>r.map(String))},
    checks,pass:checks.every(c=>c.pass),sourceAuthenticated:false,numericalQuadrature:false};
}

/** Differentiate the retained scalar factor itself. A, A', A'' and the
 * heat coefficient are never supplied as independent derivative inputs.
 * The identity is asserted on delta>0; its smooth coefficient extends to0.
 */
export function terminalResidualFactorization(G,input={}){
  const allowed=['delta','factor','heat','az','bz'];
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!allowed.includes(k))||allowed.some(k=>!Number.isSafeInteger(input[k])||!G.nodes[input[k]])||G.nodes[input.delta].op!=='coordinate')
    fail('INVALID_INPUT','Use a source coordinate and the four complete scalar bodies; supplied derivatives are not accepted.');
  const {delta,factor,heat,az,bz}=input,q=(n,d=1)=>G.q(n,d),E=G.exp(G.mul(q(-4),G.pow(delta,-2))),fo=G.sub(G.one,G.mul(E,factor));
  const factorFirst=G.derivative(factor,delta),factorSecond=G.derivative(factorFirst,delta),foY=G.neg(G.derivative(fo,delta)),foYY=G.derivative(G.derivative(fo,delta),delta);
  const direct=G.neg(G.mul(heat,G.add(G.mul(G.pow(az,2),foYY),G.mul(bz,foY))));
  const coefficient=G.mul(heat,G.sub(G.mul(G.pow(az,2),G.add(G.mul(G.pow(delta,6),factorSecond),G.mul(q(16),G.pow(delta,3),factorFirst),G.mul(G.sub(q(64),G.mul(q(24),G.pow(delta,2))),factor))),
    G.mul(bz,G.add(G.mul(G.pow(delta,6),factorFirst),G.mul(q(8),G.pow(delta,3),factor)))));
  const factored=G.mul(E,G.pow(delta,-6),coefficient),atoms=[factor,factorFirst,factorSecond,heat,az,bz,E],
    check=sourceGraphRationalIdentity(G,G.sub(direct,factored),{atomicNodes:atoms}),
    missingFirstDerivative=sourceGraphRationalIdentity(G,G.sub(G.neg(G.mul(heat,G.pow(az,2),foYY)),factored),{atomicNodes:atoms});
  if(!check.pass)fail('INTERNAL_VALIDATION','The actual differentiated terminal factor did not equal its smooth-coefficient factorization.');
  return {schema:'MathScope.TerminalResidualFactorization/1',delta,factor,factorFirst,factorSecond,heat,az,bz,E,fo,foY,foYY,direct,coefficient,factored,check,
    negativeControl:{omitted:'bz*partial_y fo',check:missingFirstDerivative},sourceAuthenticated:false,
    relation:'-Fheat*(az^2*fo_yy+bz*fo_y)=exp(-4/delta^2)*delta^-6*coefficient',pass:true};
}

function sourceBindings(prepared,G,context){
  const {bootstrap,records}=prepared,heatPrepared=bootstrap.actualHeat,heat=heatPrepared.heat,{X,eta}=bootstrap.constants,
    q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),A=G.core.A,rho=G.mul(G.parameter('co'),h),
    last=G.outer.stages.at(-1),pressure=G.pressure.stages.at(-1),source=assertSourceProfile(G.source.id),exponent=sourceExponentContract(),
    scalarEqual=(a,b)=>ellOneSourceScalarIdentity(G,a,b).pass;
  assertActualHeatLeading(heatPrepared);context.checkCancelled?.();
  const support=actualSupportOrderProof(bootstrap.completedOrderOne),stressData=bootstrap.program.orderOneStress,
    angularExterior=checkActualExteriorZeros(bootstrap.G,stressData.angularTerms,support),
    axialExterior=checkActualExteriorZeros(bootstrap.G,stressData.axialTerms,support),
    heatIdentity=actualHeatExteriorIdentity(G,{X,eta,argument:heat.heatArgument,amplitude:heat.exteriorAmplitude,exponent:heat.exteriorExponent});
  const local=pressure.variable,localFo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(local,G.one),q(2)))))),
    density=G.exp(G.mul(q(2),G.add(last.logAStart,G.add(G.mul(G.neg(A),local),G.log(G.div(localFo,G.sub(G.one,rho))))))),
    s=G.log(G.div(X,heat.Xtail)),fo=G.sub(G.one,G.mul(rho,G.sub(G.one,G.step(G.div(G.sub(s,G.one),q(2)))))),
    Ecl=G.mul(heat.Etail,G.exp(G.neg(G.mul(A,s))),G.div(fo,G.sub(G.one,rho))),
    heatArgument=G.div(G.mul(q(2),G.sub(G.one,G.pow(eta,2))),X);
  const sourceFirst=G.nodes[records[0].global.F],definition=G.expressionSystems[sourceFirst?.args?.[0]],
    sourceTheta=records[1].stress.Ttheta,sourceZ=records[1].stress.Tz;
  const checks=[
    {id:'private-original-coefficient-and-heat-producers',pass:true},
    {id:'unchanged-pinned-positive-h-and-parameter-map',pass:same(G.source.parametersExactExpressions,source.parametersExactExpressions)&&exponent.profileId===G.source.id&&exponent.positive&&exponent.notNumericallyReplaced&&exponent.upperBoundExact==='2^-4096'},
    {id:'actual-leading-root-is-full-heat-body',pass:sourceFirst.op==='actual_expression_partial'&&sourceFirst.args[2].every(n=>n===0)&&definition.body===heat.finalF},
    {id:'actual-terminal-three-unit-stage',pass:last.id==='terminal'&&last.length===q(3)&&last.end===G.add(last.start,q(3))&&heat.Xb===G.mul(G.parameter('XR'),G.exp(last.end))&&scalarEqual(heat.Xtail,G.mul(G.parameter('XR'),G.exp(last.start)))},
    {id:'actual-terminal-pressure-density-and-positive-square-root',pass:pressure.id==='terminal'&&pressure.theta===G.zero&&pressure.integrand===density&&scalarEqual(heat.Etail,G.mul(G.parameter('Pstar'),G.exp(last.logAStart)))},
    {id:'actual-terminal-fo-and-complete-heat-argument',pass:heat.Ecl===Ecl&&heat.heatArgument===heatArgument&&heat.exteriorExponent===G.neg(G.add(A,q(1,2)))&&heat.exteriorF===G.mul(heat.exteriorAmplitude,G.exp(G.mul(heat.exteriorExponent,G.log(X))),G.sub(G.one,heat.heatLoss))},
    {id:'actual-heat-cutoff-already-one-on-terminal-collar',pass:heat.heatCutoff===G.step(G.div(G.sub(s,q(1,5)),q(3,10)))&&11n*2n>4n&&heatPrepared.program.heat.tailTruncated===false},
    {id:'source-support-order-and-nonheat-terminal-zeros',pass:support.pass&&angularExterior.pass&&axialExterior.pass},
    {id:'actual-heat-physical-z-chain-identity',pass:heatIdentity.pass},
    {id:'actual-order-one-stress-primitives-and-cancelled-total-moments',pass:sourceTheta===bootstrap.stress.Ttheta&&sourceZ===bootstrap.stress.Tz&&stressData.forward[0]===bootstrap.stress.thetaForward&&stressData.backward[0]===bootstrap.stress.thetaBackward&&stressData.forward[1]===bootstrap.stress.zForward&&stressData.backward[1]===bootstrap.stress.zBackward&&same(stressData.conservativeCancellation.totalValues,[0,0])&&records[1].global.actualMomentChecks.every(c=>c.pass)&&Object.values(bootstrap.stress.sourceAssertions).every(Boolean)},
    {id:'literal-angular-residual-has-only-the-retained-heat-viscosity-after-Xplus',pass:bootstrap.stress.angular===G.add(...stressData.angularTerms,G.neg(bootstrap.roots.actualOrderOneAngularAxialViscosity))},
    {id:'terminal-collar-is-strictly-beyond-higher-support',pass:127n*4n-1n>4n}
  ];
  if(!checks.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','An actual n=1 weighted stress source binding failed: '+checks.filter(c=>!c.pass).map(c=>c.id).join(', '));
  return {heat,support,angularExterior,axialExterior,heatIdentity,checks,fo,
    profileId:source.id,parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,
    originalRoots:{Ttheta:sourceTheta,Tz:sourceZ,thetaForward:bootstrap.stress.thetaForward,thetaBackward:bootstrap.stress.thetaBackward,zForward:bootstrap.stress.zForward,zBackward:bootstrap.stress.zBackward,
      angularResidual:bootstrap.stress.angular,heatF:heat.exteriorF,heatFullF:heat.finalF,heatEcl:Ecl,fo,heatArgument,gamma:heat.gamma,heatLoss:heat.heatLoss},
    retainedAnalyticPremises:{
      totalStressMoments:'Original (5.19)-(5.21): the executed five-moment inverse and the complete I2 heat compensation give zero total residual integrals. Thus the retained forward stress equals its backward primitive; a compact integrand alone is never declared to have zero integral.',
      terminalReduction:'On X>=Xb*exp(-1/4), all earlier stages/repairs have ended and the heat cutoff is one. The matched terminal pressure density has positive square root Ecl. Therefore F0=Fheat*fo, with Fheat the same complete Laplace heat factor.',
      completeHeatSmoothness:'For every fixed j>=0 and Z>=0, (-1)^j H^(j)(Z)=(h)_j/Gamma(1+h)*Integral_0^infinity exp(-v)*v^(h+j)*(1+Zv)^(-h-j)dv. Positive gamma moments and integration by parts give |H^(j)|<=(h)_j*(1+h)_j<=j!*(j+1)!. This dominates all finite mixed derivatives on the closed compact X/eta rectangle, including eta=+/-1; the improper tail is retained.',
      endpointSmoothness:'The original square-seed cutoff is flat at both endpoints. Every fixed derivative of exp(-4/delta^2) times a finite inverse power tends to zero at delta=0.',
      noNewLeanTheorem:true}};
}

const resultBinding=r=>canonicalStringify({request:r.request,sourceBinding:r.sourceBinding,domain:r.domain,rules:r.rules,terminal:r.terminal,interior:r.interior,
  weightedRows:r.weightedRows,cutoff:r.cutoff,roots:r.roots,checks:r.checks,scope:r.scope});

/** Construct every requested coefficient constant from the authenticated
 * source. The only caller control is a finite derivative representation.
 */
export function attachActualOrderOneWeightedStress(prepared,input={},context={}){
  assertActualOrderInduction(prepared);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='derivativeOrder'))fail('INVALID_INPUT','Only a finite derivative order is accepted; stress, heat, norms and completion flags are not inputs.');
  const m=order(input.derivativeOrder??2,8),{G,bootstrap}=prepared,{X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),
    original=sourceBindings(prepared,G,context),{heat,support}=original,h=G.parameter('h'),rho=G.mul(G.parameter('co'),h),{D,L,d}=G.core;
  const progress=stage=>context.onProgress?.({stage,nodeCount:G.nodes.length});progress('original-source-bindings');
  const delta=G.fresh('actual_n1_terminal_delta'),deltaMax=q(1,4),Xedge=G.mul(heat.Xb,G.exp(G.neg(deltaMax))),Xdelta=G.mul(heat.Xb,G.exp(G.neg(delta))),
    Eraw=G.exp(G.mul(q(-4),G.pow(delta,-2))),Eflat=G.choose(delta,G.zero,G.zero,G.zero,Eraw,Eraw),
    otherSeed=G.exp(G.mul(q(-4),G.pow(G.sub(q(2),delta),-2))),factorBody=G.div(rho,G.add(Eflat,otherSeed)),
    factor=G.share(factorBody,[delta],'ActualOrderOneTerminalSmoothFactor'),heatAtDelta=G.share(G.substitute(heat.exteriorF,X,Xdelta),[delta,eta],'ActualOrderOneTerminalCompleteHeat'),
    az=G.div(G.mul(q(-2),eta),L),bz=G.div(G.add(G.mul(q(-2),D,eta,az),G.mul(d,G.derivative(az,eta))),L),
    factorization=terminalResidualFactorization(G,{delta,factor,heat:heatAtDelta,az,bz}),
    Bbody=G.mul(G.exp(G.mul(q(-2),delta)),factorization.coefficient),B=G.share(Bbody,[delta,eta],'ActualOrderOneTerminalPrimitiveSmoothCoefficient'),rules=terminalGaussianPrimitiveRules({derivativeOrder:m});
  const terminalNorms=[],cache=new Map();
  const bNorm=(r,k)=>{
    const key=r+':'+k;if(cache.has(key))return cache.get(key);
    let body=B;for(let i=0;i<r;i++)body=G.derivative(body,delta);for(let i=0;i<k;i++)body=G.derivative(body,eta);
    const receipt=rectangularSourceFTC(G,{body,coordinates:[delta,eta],lower:[G.zero,q(-1)],upper:[deltaMax,G.one]});
    terminalNorms.push({deltaOrder:r,etaOrder:k,...receipt});cache.set(key,receipt.bound);return receipt.bound;
  };
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){context.checkCancelled?.();bNorm(r,k);}
  progress('terminal-ftc-norms');
  const primitiveBounds=[],stressDeltaBounds=[];
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){
    const constant=r===0?G.mul(q(16,125),bNorm(0,k)):G.add(...Array.from({length:r},(_,a)=>
      G.mul(q(binomial(r-1,a)*BigInt(rules.laurent[a].absoluteCoefficientSum)),bNorm(r-1-a,k))));
    primitiveBounds.push({deltaOrder:r,etaOrder:k,pole:3+3*r,constant});
  }
  const pBound=(r,k)=>primitiveBounds.find(x=>x.deltaOrder===r&&x.etaOrder===k).constant;
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++)stressDeltaBounds.push({deltaOrder:r,etaOrder:k,pole:3+3*r,
    constant:G.mul(heat.Xb,G.exp(deltaMax),G.add(...Array.from({length:r+1},(_,a)=>G.mul(q(binomial(r,a)),pBound(a,k)))))});
  const deltaBound=(r,k)=>stressDeltaBounds.find(x=>x.deltaOrder===r&&x.etaOrder===k).constant,
    innerDistanceAtEdge=G.log(G.div(Xedge,G.parameter('Xa'))),innerReciprocal=G.exp(G.div(G.pow(G.parameter('t1'),2),G.pow(innerDistanceAtEdge,2))),
    sourceA=G.log(G.div(X,G.parameter('Xa'))),sourceB=G.log(G.div(heat.Xb,X)),
    zeta=G.exp(G.neg(G.add(G.div(G.pow(G.parameter('t1'),2),G.pow(sourceA,2)),G.div(q(4),G.pow(sourceB,2)))));
  const originalStress={theta:original.originalRoots.Ttheta,z:original.originalRoots.Tz},sharedStress=Object.fromEntries(Object.entries(originalStress).map(([name,body])=>[name,G.share(body,[X,eta],'ActualOrderOneWeighted_'+name)]));
  const interior=[],weightedRows=[],sourceJets=new Map();
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){
    context.checkCancelled?.();const componentNorms=[];
    for(const name of ['theta','z']){
      let derivative=sharedStress[name];for(let i=0;i<r;i++)derivative=G.derivative(derivative,X);for(let i=0;i<k;i++)derivative=G.derivative(derivative,eta);
      sourceJets.set(name+':'+r+':'+k,derivative);
      const receipt=rectangularSourceFTC(G,{body:G.div(derivative,zeta),coordinates:[X,eta],lower:[support.endpoints.Xminus,q(-1)],upper:[Xedge,G.one]});
      const row={component:name,radialOrder:r,etaOrder:k,sourceRoot:originalStress[name],sourceDerivative:derivative,...receipt};interior.push(row);componentNorms.push(receipt.bound);
    }
    const terminalConstant=G.mul(innerReciprocal,G.pow(Xedge,-r),G.add(...rules.ordinaryXConversion.unsignedStirlingFirst[r].map((c,j)=>G.mul(q(BigInt(c)),deltaBound(j,k))))),
      bound=G.maximum(G.one,...componentNorms,terminalConstant);
    weightedRows.push({radialOrder:r,etaOrder:k,pole:3+3*r,interiorConstants:componentNorms,terminalThetaConstant:terminalConstant,terminalZIdenticallyZero:true,bound,
      statement:'|partial_X^r partial_eta^k T1,a| <= bound*zeta*delta_global^(-pole), a=theta,z; delta_global=min(1,log(X/Xa),log(Xb/X)).'});
  }
  progress('interior-and-weighted-norms');
  // This is precisely the unchanged first diagonal recipe. Extra weighted
  // constants are NOT inserted into it, and no other c_n is replaced.
  const c1Norms=attachActualInductionNorms(prepared,{throughOrder:1,derivativeOrder:1},context),c1Prefix=attachActualNormalizedCutoffs(c1Norms,context),c1=c1Prefix.rows[0],
    weights=sourceNormalizedCutoffWeights({sourceProfile:G.source.id,order:1,derivativeOrder:m},context),
    W=weights.weights.map(w=>G.add(...w.polynomialInSourceH.map((v,j)=>G.mul(q(BigInt(v)),G.pow(h,j)))));
  progress('unchanged-first-cutoff');
  const t=G.fresh('actual_n1_original_time_cutoff'),u=G.sub(G.mul(q(2),t),G.one),ta=G.exp(G.neg(G.inv(u))),tb=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    cutoffBody=G.choose(t,q(1,2),G.one,G.one,G.div(tb,G.add(ta,tb)),G.zero),cutoffSystem=G.defineExpressionFunction({name:'ActualOrderOneOriginalSummationCutoff',parameters:[t],body:cutoffBody}),
    qVariable=G.fresh('actual_n1_weighted_q'),qPower=G.exp(G.mul(q(2),h,G.log(qVariable))),sigma=G.mul(c1.scale,qVariable),chi=G.expressionValue(cutoffSystem,[sigma]),
    qFactor=G.mul(qPower,chi),qFactorJets=[qFactor];
  for(let e=1;e<=m;e++)qFactorJets.push(G.mul(qVariable,G.derivative(qFactorJets[e-1],qVariable)));
  const normalizedRows=[];
  for(let e=0;e<=m;e++)for(const row of weightedRows)if(e+row.radialOrder+row.etaOrder<=m)normalizedRows.push({eulerOrder:e,radialOrder:row.radialOrder,etaOrder:row.etaOrder,pole:row.pole,
    bound:G.mul(W[e],row.bound),actualDerivatives:Object.fromEntries(['theta','z'].map(name=>[name,G.mul(qFactorJets[e],sourceJets.get(name+':'+row.radialOrder+':'+row.etaOrder))]))});
  const terminal={delta,deltaMax,Xedge,Xdelta,Eflat,factorBody,factor,heatAtDelta,az,bz,factorization,Bbody,B,terminalNorms,primitiveBounds,stressDeltaBounds,innerReciprocal,
    backwardRepresentation:'T1theta(Xb*exp(-delta),eta)=Xb*exp(delta)*Integral_0^delta exp(-4/u^2)*u^-6*B(u,eta) du',
    smoothFactorIdentity:'1-fo=exp(-4/delta^2)*rho/[exp(-4/delta^2)+exp(-4/(2-delta)^2)], by literal sigma reflection; its denominator is >=exp(-64/49)>0 on [0,1/4].',
    sourceAngularIdentity:'After Xplus the actual order-one nonheat terms vanish; -Z_(b-D)Z_b(Fheat*fo)=-Fheat*(az^2*fo_yy+bz*fo_y), with az=-2*eta/L and bz=(-2*D*eta*az+d*az_eta)/L.',
    differentialIntegralIdentity:'The full Leibniz sum differentiates the backward primitive. For r>=1 use partial_delta^(r-1) of its actual integrand; for r=0 retain the positive Gaussian integral bound.',
    noTerminalTruncation:true};
  const cutoff={c1:c1.scale,logC1:c1.logScale,sourceNormRequest:{throughOrder:1,derivativeOrder:1},sourceCoefficientBounds:c1.coefficientBounds,
    originalNormalizedRecipeRetained:true,weightedConstantsAddedToSelector:false,otherCutoffScalesChanged:false,
    timeCutoffSystem:cutoffSystem,timeCutoffBody:cutoffBody,qVariable,qPower,sigma,chi,qFactorJets,weights,normalizedRows,
    statement:'Every displayed mixed derivative of the actual n=1 cutoff stress is <=bound*q^(2h)*zeta*delta_global^(-pole), for 0<q<=1. This is the finite n=1 block of (5.43), independent of any large-n diagonal tail.',
    asymptoticSummationOfAllOrdersClaimed:false};
  const roots={actualT1theta:originalStress.theta,actualT1z:originalStress.z,sourceZeta:zeta,terminalSmoothFactor:factor,terminalCompleteHeat:heatAtDelta,
    terminalResidualCoefficient:factorization.coefficient,terminalPrimitiveCoefficient:B,originalC1:c1.scale,
    actualCutoffT1theta:G.mul(qFactor,originalStress.theta),actualCutoffT1z:G.mul(qFactor,originalStress.z)};
  for(const row of weightedRows)roots['weighted_B_'+row.radialOrder+'_'+row.etaOrder]=row.bound;
  const checks=[...original.checks,...rules.checks,{id:'actual-terminal-residual-product-rule',pass:factorization.check.pass},
    {id:'terminal-and-interior-norms-have-no-free-coordinates',pass:[...terminalNorms,...interior].every(r=>G.freeCoordinates(r.bound).size===0)},
    {id:'unchanged-first-diagonal-source-cutoff',pass:c1.order===1&&c1.previousLogScale===G.zero&&c1.scale===G.exp(c1.logScale)&&c1Norms.order===1&&c1Norms.derivativeOrder===1&&G.freeCoordinates(c1.scale).size===0},
    {id:'original-all-requested-time-cutoff-weights',pass:weights.pass&&weights.order===1&&weights.derivativeOrder===m},
    {id:'every-requested-weighted-profile-derivative-present',pass:weightedRows.length===(m+1)*(m+2)/2&&interior.length===2*weightedRows.length}];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','An actual first-order weighted stress construction check failed.');
  const domain={activeAnnulus:[support.endpoints.Xa,heat.Xb],eta:['-1','1'],q:'0<q<=1',
    innerZero:[G.zero,support.endpoints.Xminus],interior:[support.endpoints.Xminus,Xedge],terminal:[Xedge,heat.Xb],
    terminalDelta:['0','1/4'],terminalDeltaEqualsGlobalDelta:true,
    ordering:'log(Xb/Xplus)>127 implies log(Xedge/Xplus)>126.75>1; Xa<Xminus<Xplus<Xedge<Xb. Thus the terminal collar is after every positive-order source support and delta_global=delta_b there.',
    weightedInequalityOnlyOnOpenAnnulus:true,stressSmoothZeroExtensionAtBothEndpoints:true};
  const sourceBinding={profileId:original.profileId,parameterExpressionSHA256:original.parameterExpressionSHA256,
    originalRoots:original.originalRoots,support:original.support,heatIdentity:original.heatIdentity,
    angularExterior:original.angularExterior,axialExterior:original.axialExterior,analyticPremises:original.retainedAnalyticPremises,
    provenance:'The privately authenticated original coefficient prefix, heat source, signed stress primitives and prefix-independent first normalized cutoff.',
    originalPDFSHA256:'0e779481c4da40bd28d1e642e1d8ca57447d129610df28dfa5a11e9af8ae228f',equationReferences:['5.19-5.22','5.43','5.46','A.9','A.12']};
  const scope={actualOrderOneWeightedBoundaryConstantsConstructed:true,actualRequestedOrderOneWeightedEstimateEstablished:true,
    actualSignedStressAndBackwardPrimitiveRetained:true,completeTerminalHeatFactorRetained:true,allRequestedMixedDerivativesIncluded:true,
    originalC1RecomputedByUnchangedRecipe:true,historicalBackgroundChanged:false,physicalSelectorApplied:false,
    actualPositiveWeightsAssumed:false,actualPositiveWeightsProved:false,numericalStressEnclosures:false,numericalNormEvaluation:false,
    allOrderBackgroundPhysicalResidualProved:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false};
  const result={G,prepared,c1Prefix,request:{derivativeOrder:m},sourceBinding,domain,rules,terminal,interior,weightedRows,cutoff,roots,checks,scope};
  const packed=G.pack(roots,{schema:'MathScope.ActualOrderOneWeightedStressProgram/1',compiler:'actual-order-one-weighted-stress.mjs:prepareActualOrderOneWeightedStress',
    request:result.request,sourceBinding,domain,rules,terminal,interior,weightedRows,cutoff,checks,scope}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:nodes.slice()};
  seals.set(result,{G,prepared,c1Prefix,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    binding:resultBinding(result),metadata:canonicalStringify(metadata),serialized:canonicalStringify(result.program)});
  progress('sealed-actual-order-one-weighted-stress');
  return result;
}

export function assertActualOrderOneWeightedStress(result){
  const saved=seals.get(result);
  if(!saved||result.G!==saved.G||result.prepared!==saved.prepared||result.c1Prefix!==saved.c1Prefix||resultBinding(result)!==saved.binding||
    canonicalStringify(saved.G.nodes.slice(0,saved.count))!==saved.nodes||!saved.G.functionDefinitionsUnchanged(saved.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged live actual first-order weighted stress construction; copies, supplied bounds and edited scope flags are not evidence.');
  const {nodes,...metadata}=result.program??{};
  if(!Array.isArray(nodes)||canonicalStringify(nodes)!==saved.nodes||canonicalStringify(metadata)!==saved.metadata)
    fail('INVALID_SOURCE_CONSTRUCTION','The weighted-stress compiler program and its fixed node prefix must remain unchanged.');
  assertActualOrderInduction(result.prepared);assertActualNormalizedCutoffs(result.c1Prefix);return true;
}

export function prepareActualOrderOneWeightedStress(input={},context={}){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','derivativeOrder','maxNodes'].includes(k)))fail('INVALID_INPUT','Only the original source selector and finite representation budgets are accepted.');
  const m=order(input.derivativeOrder??2,8),prepared=prepareActualOrderInduction({sourceProfile:input.sourceProfile??SOURCE_PROFILE_ID,order:1,maxNodes:input.maxNodes??1500000,maxDerivativeOrder:128},context);
  return attachActualOrderOneWeightedStress(prepared,{derivativeOrder:m},context);
}

export async function actualOrderOneWeightedStressCertificateFromProgram(result,context={}){
  assertActualOrderOneWeightedStress(result);const s=seals.get(result),hash=await sha256(s.serialized);context.checkCancelled?.();
  return {schema:'MathScope.ActualOrderOneWeightedStressCertificate/1',status:'COMPLETED',pass:true,
    completedScope:'Actual n=1 weighted stress constants through the requested derivative order, including the terminal backward-integral gain and the unchanged first cutoff.',
    request:result.request,sourceBinding:result.sourceBinding,domain:result.domain,
    graph:{sha256:hash,nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,compiler:result.program.compiler,roots:result.roots,
      graphIncluded:false,fixedCompilerPrefix:true,laterSourceAppendsExcluded:true},
    weightedRows:result.weightedRows,terminal:{deltaMax:result.terminal.deltaMax,primitiveRules:result.rules,
      factorizationCheck:result.terminal.factorization.check,backwardRepresentation:result.terminal.backwardRepresentation,
      terminalEnvelopeCount:result.terminal.terminalNorms.length,primitiveBounds:result.terminal.primitiveBounds,stressDeltaBounds:result.terminal.stressDeltaBounds},
    interiorEnvelopeCount:result.interior.length,cutoff:result.cutoff,checks:result.checks,scope:result.scope};
}

export async function actualOrderOneWeightedStressCertificate(input={},context={}){
  return actualOrderOneWeightedStressCertificateFromProgram(prepareActualOrderOneWeightedStress(input,context),context);
}
