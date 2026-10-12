/** Executed source ordering and zero-exterior checks for Lemma 5.2.
 * No floating point value of Xv, Xplus or Xb is compared. Their ordering
 * follows from the retained A.2 stage expressions and exact inequalities.
 */
import {assertActualFirstOrderCompleted} from './actual-continuation-exact-order-one.mjs';
import {sourceGraphPolynomialIdentity} from './actual-continuation-exact-identities.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const certificates=new WeakMap();
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function actualSupportOrderProof(completed){
  const gate=assertActualFirstOrderCompleted(completed),{G,orderOne:r}=completed,{eta,Xv}=completed.constants,q=(n,d=1)=>G.q(n,d),o=G.one,z=G.zero,p=G.source.parametersExactExpressions;
  const XR=G.parameter('XR'),lambda=G.parameter('lambda'),t1=G.parameter('t1'),Xa=G.parameter('Xa'),stages=G.outer.stages,pulse=stages.find(s=>s.id==='pulse'),interpolation=stages.find(s=>s.id==='interpolation'),last=stages.at(-1);
  const parameterChecks={
    samePinnedSource:gate.parameterExpressionSHA256==='e44aab5d21cbe4205d0333d7d73b646444ebaa282d67b2034edfde1e4180f152',
    actualH:same(p.h,{exp:{product:[{integer:-8002},{ref:'T'}]}}),
    actualLambda:same(p.lambda,{exp:{product:[{integer:-1000},{ref:'T'}]}}),
    actualT:same(p.T,{sum:[{exp:{ref:'Md'}},{integer:10}]})&&same(p.Md,{integer:1048576}),
    actualTf:same(p.Tf,{integer:128}),actualCo:same(p.co,{rational:'1/256'}),
    actualXa:same(p.Xa,{quotient:[{integer:4},{ref:'Lambda'}]}),
    actualT1:same(p.t1,{power:[{ref:'CSelected'},-120]}),
    actualLambdaScale:same(p.Lambda,{power:[{ref:'Q'},64]}),
    actualXR:same(p.XR,{product:[{integer:110},{power:[{product:[{ref:'CSelected'},{ref:'Pstar'}]},10]}]}),
    actualIposLeft:same(p.X0Ipos,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-14}]}}]}),
    actualIposRight:same(p.IposRight,{product:[{ref:'X0Ipos'},{exp:{integer:5}}]})
  };
  const expressionChecks={
    pulseStart:sourceGraphPolynomialIdentity(G,G.sub(pulse.start,G.add(G.parameter('T'),q(2),G.mul(q(60),G.parameter('BOuter'))))).pass,
    pulseLength:pulse.length===G.div(q(13),lambda),
    axialEnd:Xv===G.mul(G.mul(XR,G.exp(pulse.start)),G.exp(pulse.length)),
    plus:r.Xplus===G.mul(Xv,G.exp(o)),
    terminal:r.Xb===G.mul(XR,G.exp(last.end)),
    interpolationStartsAfterPulse:interpolation.start===pulse.end&&interpolation.length===G.parameter('Tf'),
    cutoff:r.Xminus===G.mul(Xa,G.exp(G.div(t1,q(128))))&&r.Xkeep===G.mul(Xa,G.exp(G.div(t1,q(64))))&&r.Xcut===G.mul(Xa,G.exp(G.div(t1,q(32)))),
    commonInterval:completed.inner.aSquared===G.mul(Xa,G.exp(G.div(t1,q(16)))),
    stageOrder:same(stages.map(s=>s.id),['initial','axialDecay','entry','reservedPower','pulse','interpolation','angular','steepen','steepPower','flatten','wait','terminal']),
    consecutiveStages:stages.every((s,j)=>j===0?s.start===z:s.start===stages[j-1].end),
    allEndpointsIndependentOfEta:[r.Xminus,r.Xkeep,r.Xcut,completed.inner.aSquared,r.X0,r.IposRight,Xv,r.Xplus,r.Xb].every(x=>G.derivative(x,eta)===z)
  };
  // The only nontrivial positive stage length is the A.13 wait. With
  // 0<h<lambda<1 and T>128, log(1/h)>4096*log(2)>2048.
  // Qsteep>0, Qhold>(1-h)*4*2048, Qb>Qhold/3>1.
  // rho=h/256; integral_1^3 sigma'((s-1)/2) ds=2. Thus
  // Qp<=rho*e^3/(1-rho)<27*h/255<h<1, so wait>0.
  const arithmeticChecks={
    TLower:1048576n+11n>128n,
    hSmallerThanLambda:8002n>1000n,
    hDyadicSmall:8002n*128n>4096n,
    QbGreaterThanOne:4n*2048n>3n*2n,
    QpLessThanH:27n<255n,
    nextStageLongerThanOne:128n>1n,
    positivePulseLength:13n>0n,
    allIposBumpsBeforeRight:(7n*2048n+1n)**2n<16n*4096n**2n&&16n<2n**5n,
    cutoffBelowOne:12n<2n**16640n,
    IposStartsAfterXR:60000n*128n+128n-12n>0n
  };
  const pass=[parameterChecks,expressionChecks,arithmeticChecks].every(c=>Object.values(c).every(Boolean));
  if(!pass)fail('INVALID_SOURCE_CONSTRUCTION','The actual source endpoint or stage-order proof did not bind.');
  const lastU=G.mul(r.X0,G.pow(r.supports[1][1],2));
  const result={schema:'MathScope.ActualBackgroundSupportOrder/1',profileId:gate.profileId,parameterExpressionSHA256:gate.parameterExpressionSHA256,
    parameterChecks,expressionChecks,arithmeticChecks,
    endpoints:{Xa,Xminus:r.Xminus,Xkeep:r.Xkeep,Xcut:r.Xcut,aSquared:completed.inner.aSquared,IposLeft:r.X0,IposRight:r.IposRight,lastU,Xv,Xplus:r.Xplus,Xb:r.Xb},
    derivation:{inner:'0<t1<1; Xa=4/Lambda with Lambda>=2^16640. Hence Xa<Xminus<Xkeep<Xcut<a^2<1<XR<IposLeft.',
      bump:'Every normalized radial bump lies below 4. Its physical X endpoint is below 16*X0Ipos < exp(5)*X0Ipos.',
      middle:'IposRight/Xv=exp(-9-13/lambda)<1 and Xplus/Xv=exp(1).',
      wait:'lambda>h>0 makes Qsteep>0. Qb>(1/3)*(1/2)*4*2048>1, while 0<Qp<27*h/255<h<1. Thus log(Qb/Qp)/(1-h)>0.',
      final:'Immediately after the pulse lies an interval of length Tf=128, followed by positive stage lengths. Thus Xplus<Xv*exp(128)<Xb.',
      sourceStep:'sigma=exp(-1/s^2)/(exp(-1/s^2)+exp(-1/(1-s)^2)) on (0,1), with flat endpoint jets; integral sigma_prime=1.'},
    inequalities:['Xminus<Xkeep<Xcut<a^2<IposLeft<IposRight<Xv<Xplus<Xb','all five radial bump endpoints<IposRight','all endpoints are independent of eta'],
    numericalCoordinateComparisonUsed:false,pass};
  // Only this source-bound proof object authorizes the exterior reducer.
  const smaller=new Set([z,Xa,XR,r.Xminus,r.Xkeep,r.Xcut,completed.inner.aSquared,r.X0,r.IposRight,lastU,Xv,r.Xplus]);
  for(const pair of r.supports)for(const x of pair)smaller.add(G.mul(r.X0,G.pow(x,2)));
  const XX=completed.constants.X,decayEnd=G.mul(G.mul(XR,G.exp(o)),G.exp(G.parameter('T'))),patchRight=G.mul(XR,G.exp(q(-5))),loopRight=G.parameter('loopIRight'),I1Right=G.parameter('I1Right');
  const leadingParameterChecks={
    loopRight:same(p.loopIRight,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:3}]}}]}),
    I1Left:same(p.X0I1,{product:[{ref:'XR'},{exp:{sum:[{ref:'T'},{integer:2},{product:[{integer:60},{ref:'BOuter'}]},{integer:-25}]}}]}),
    I1Right:same(p.I1Right,{product:[{ref:'X0I1'},{exp:{integer:5}}]}),
    logGapsPositive:60000n*128n>15n&&-20n<-14n&&1n<2n+60000n*128n-14n
  };
  if(!Object.values(leadingParameterChecks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The actual leading exterior support parameters changed.');
  [decayEnd,patchRight,loopRight,I1Right].forEach(id=>smaller.add(id));
  const logTail=G.log(G.div(XX,G.outer.roots.Xp)),coordinateEnds=new Set([logTail+':'+pulse.length]);
  const stepAfter=new Set(Array.from({length:5},(_,j)=>G.div(G.sub(G.div(XX,G.parameter('X0I1')),q(j+9)),q(1,2))));
  result.leadingExterior={parameterChecks:leadingParameterChecks,physicalRightEnds:[patchRight,decayEnd,loopRight,I1Right],tailLogCoordinate:logTail,tailLogRight:pulse.length,
    rootBumpStepArguments:[...stepAfter],derivation:'I1Right/IposLeft=exp(-6), decayEnd<IposLeft and loopIRight/IposLeft=exp(15-60000T)<1. X>=Xplus gives log(X/Xp)>=13/lambda+1. For I1 derivative bumps, X/X0I1>=exp(5)>32, beyond every support ending at 13.5.'};
  certificates.set(result,{G,X:XX,smallEnds:smaller,coordinateEnds,stepAfter,Xplus:r.Xplus,Xb:r.Xb,eta});
  return result;
}

/** Abstract zero evaluation on X>=the certified exterior endpoint.
 * A prefix integral is NEVER set to zero merely because its integrand has
 * compact support. It must already have its moment-closed zero branch.
 * Derivatives of an explicitly zero smooth branch also vanish there.
 */
export function checkActualExteriorZeros(G,expressions,proof,{endpoint=proof?.endpoints?.Xplus}={}){
  const cert=certificates.get(proof);if(!cert||cert.G!==G||![cert.Xplus,cert.Xb].includes(endpoint))fail('INVALID_SOURCE_CONSTRUCTION','Use the live source-order proof for this exact graph. A copied assertion does not certify support.');
  const allowed=new Set(cert.smallEnds);if(endpoint===cert.Xb)allowed.add(cert.Xb);
  const cache=new Map(),trace=[];let visited=0;
  function zero(id){
    if(id===G.zero)return true;if(cache.has(id))return cache.get(id);if(++visited>350000)fail('RESOURCE_LIMIT','Source exterior proof exceeded its finite graph budget.');
    const {op,args}=G.nodes[id];let result=false;
    if(op==='multiply')result=zero(args[0])||zero(args[1]);
    else if(op==='add')result=zero(args[0])&&zero(args[1]);
    else if(op==='integer_power'&&args[1]>0)result=zero(args[0]);
    else if(op==='sqrt_positive')result=zero(args[0]);
    else if(op==='smooth_piecewise'&&(args[0]===cert.X&&allowed.has(args[2])||cert.coordinateEnds.has(args[0]+':'+args[2]))){
      result=zero(args[5]);if(result)trace.push({node:id,rightEndpoint:args[2],selected:'after',after:args[5]});
    }else if(op==='source_step_derivative'&&args[1]>=1&&cert.stepAfter.has(args[0])){
      result=true;trace.push({node:id,stepArgument:args[0],derivativeOrder:args[1],rule:'flat step derivative outside the actual I1 bump support'});
    }else if(op==='actual_expression_partial'){
      const s=G.expressionSystems[args[0]],xIndex=s.parameters.indexOf(cert.X);
      // This is a partial derivative of the retained actual body. Its X
      // argument must be the same X and all other arguments must be the
      // declared source coordinates. No substituted moving boundary is used.
      if(xIndex>=0&&args[1].every((v,j)=>v===s.parameters[j])){
        result=zero(s.body);if(result)trace.push({node:id,expressionSystem:args[0],body:s.body,orders:args[2],rule:'partials of the same smooth identically-zero exterior branch'});
      }
    }else if(op==='definite_integral')result=args[0]===G.zero||args[2]===args[3];
    cache.set(id,result);return result;
  }
  const checks=expressions.map((expression,index)=>({index,expression,zero:zero(expression)}));
  return {schema:'MathScope.ActualExteriorZeroEvaluation/1',endpoint,checks,visitedNodes:visited,zeroBranchTrace:trace,compactIntegrandMistakenForZeroPrimitive:false,pass:checks.every(c=>c.zero)};
}
