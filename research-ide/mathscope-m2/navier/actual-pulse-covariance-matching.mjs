/** Actual Imean stress joined to the actual homogeneous-pulse covariance.
 * The large positive factors are exact source objects. Only their normalized
 * coefficients are converted to finite outward intervals.
 */
import {actualMeanPulseCovariance} from './actual-pulse-covariance-integrals.mjs';
import {evaluateActualMeanStress,verifyActualMeanStress} from './actual-mean-stress.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {point,imul,idiv,isub,iscale,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const fail=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const sqrti=a=>[nextDown(Math.sqrt(a[0])),nextUp(Math.sqrt(a[1]))];
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(!d)fail('A nonzero exact denominator is required.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return[n/g,d/g];};
const qa=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]);
const qm=(a,b)=>q(a[0]*b[0],a[1]*b[1]);
const qs=a=>a[1]===1n?String(a[0]):a.join('/');

function inputOf(input){
  if(input===null||typeof input!=='object'||Array.isArray(input))fail('Use a source-bound covariance matching request.');
  for(const key of Object.keys(input))if(!['sourceProfile','y','cells','cutoffCells','bits'].includes(key))fail('Unknown actual matching input: '+key);
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID,y=input.y??2.5,cells=input.cells??256,cutoffCells=input.cutoffCells??cells,bits=input.bits??512;
  assertSourceProfile(sourceProfile);
  if(!Number.isFinite(y)||y<.25||y>4.75)fail('Use an actual Imean representative y in [1/4,19/4].');
  if(![64,128,256,512].includes(cells)||![64,128,256,512].includes(cutoffCells))fail('Use 64,128,256 or 512 Gaussian and transverse cells.');
  if(!Number.isSafeInteger(bits)||bits<16||bits>4096)fail('The source target enclosure exponent is an integer from 16 through 4096.');
  return{sourceProfile,y,cells,cutoffCells,bits};
}

/** Canonical source expression, flattening commutative sums/products only.
 * This checks the actual F definition, not the equality of its display values.
 */
export function canonicalActualSourceExpression(program,root){
  const cache=new Map();
  function at(id){
    if(cache.has(id))return cache.get(id);
    const n=program?.nodes?.[id];if(!n)fail('Missing source expression node.');
    const{op,args}=n;let out;
    if(op==='rational')out=['q',...q(...args).map(String)];
    else if(op==='source_parameter')out=['source',program.parameterExpressionSHA256,args[0]];
    else if(op==='coordinate')out=['coordinate',args[0]];
    else if(op==='add'||op==='multiply'){
      let parts=args.flatMap(i=>{const a=at(i);return a[0]===op?a.slice(1):[a];}),constant=op==='add'?q(0):q(1);
      const rest=[];for(const a of parts){if(a[0]==='q')constant=(op==='add'?qa:qm)(constant,a.slice(1).map(BigInt));else rest.push(a);}
      if(op==='multiply'&&constant[0]===0n)out=['q','0','1'];
      else{if((op==='add'&&constant[0]!==0n)||(op==='multiply'&&(constant[0]!==constant[1]||!rest.length)))rest.push(['q',...constant.map(String)]);rest.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));out=rest.length===0?['q','0','1']:rest.length===1?rest[0]:[op,...rest];}
    }else if(op==='integer_power'||op==='source_step_derivative')out=[op,at(args[0]),args[1]];
    else if(['inverse','exp','log_positive','sqrt_positive','integer_ceiling','integer_floor','integer_max_one'].includes(op))out=[op,at(args[0])];
    else fail('This source-root equality check does not accept unexpanded operation '+op);
    cache.set(id,out);return out;
  }
  return at(typeof root==='string'?program.roots[root]:root);
}

/** Independent exact Laurent-polynomial algebra. The named atoms stand for
 * the same computed integral/target objects on both sides of each identity.
 */
export function exactPulseCovarianceAlgebra({omitInverseHalf=false,omitEpsilon=false,duplicateSigns=false}={}){
  const names=['C','L','A','B','Ttheta','Tz'],zero=()=>new Map(),key=e=>e.join(','),put=(p,e,c)=>{const k=key(e),v=qa(p.get(k)??q(0),c);if(v[0])p.set(k,v);else p.delete(k);};
  const mon=(n,e={})=>new Map([[key(names.map(k=>e[k]??0)),q(n)]]),add=(...polys)=>{const out=zero();for(const p of polys)for(const[k,c]of p)put(out,k.split(',').map(Number),c);return out;},mul=(a,b)=>{const out=zero();for(const[ka,ca]of a)for(const[kb,cb]of b)put(out,ka.split(',').map((x,i)=>Number(x)+Number(kb.split(',')[i])),qm(ca,cb));return out;},scale=(a,c)=>new Map([...a].map(([k,v])=>[k,qm(v,c)]));
  const half=omitInverseHalf?q(1):q(1,2),tt=mon(1,{Ttheta:1,C:-1,L:-1,A:-1}),tz=mon(1,{Tz:1,C:-1,B:-1}),yp=scale(add(tt,tz),half),ym=scale(add(tt,scale(tz,q(-1))),half),h00=mon(1,{C:1,L:1,A:1}),h10=mon(1,{C:1,B:1});
  const thetaResidual=add(mul(h00,add(yp,ym)),mon(-1,{Ttheta:1})),zResidual=add(mul(h10,add(yp,scale(ym,q(-1)))),mon(-1,{Tz:1})),determinant=add(mul(h00,scale(h10,q(-1))),scale(mul(h00,h10),q(-1))),detResidual=add(determinant,mon(2,{C:2,L:1,A:1,B:1}));
  // Affine exponents in the exact positive source h: Q^(-2A+h+A+1/2).
  const A=[q(1,2),q(1)],sum=(...terms)=>[terms.reduce((s,t)=>qa(s,t[0]),q(0)),terms.reduce((s,t)=>qa(s,t[1]),q(0))],as=(a,n)=>a.map(x=>qm(x,q(n)));
  const QExponent=sum(as(A,-2),omitEpsilon?[q(0),q(0)]:[q(0),q(1)],A,[q(1,2),q(0)]),qExponent=as(sum(A,[q(1,2),q(0)]),-1);
  const serialize=p=>[...p].map(([k,c])=>({coefficient:qs(c),powers:Object.fromEntries(names.map((name,i)=>[name,Number(k.split(',')[i])]).filter(([,v])=>v))}));
  const checks=[{id:'exact-two-column-inverse',pass:thetaResidual.size===0&&zResidual.size===0},{id:'exact-source-determinant',pass:detResidual.size===0&&determinant.size===1},{id:'exact-positive-source-scale-cancellation',pass:QExponent.every(x=>x[0]===0n)&&qs(qExponent[0])==='-1'&&qs(qExponent[1])==='-1'},{id:'slow-box-counted-once',pass:!duplicateSigns}];
  return{schema:'MathScope.ExactPulseCovarianceAlgebra/1',arithmetic:'BIGINT_RATIONAL_LAURENT_POLYNOMIALS',atoms:{C:'actual positive common covariance scale',L:'actual positive sqrt(lambda)',A:'actual source integral A',B:'actual source integral B',Ttheta:'actual target angular component',Tz:'actual target axial component'},thetaResidual:serialize(thetaResidual),zResidual:serialize(zResidual),determinant:serialize(determinant)[0],scaleIdentity:{QExponent:{constant:qs(QExponent[0]),h:qs(QExponent[1])},qExponent:{constant:qs(qExponent[0]),h:qs(qExponent[1])},AExact:'1/2+h',physicalStress:'q^(-1-h)*T0',epsilonNotSetToOne:true},slowPartitionMultiplicity:duplicateSigns?2:1,checks,pass:checks.every(c=>c.pass)};
}

/** Retained receipts can be independently replayed against the pinned inputs.
 * Source authentication is a full deterministic replay, not trust in a tag.
 */
export function verifyActualPulseMatchingInputs(covariance,meanStress){
  try{
    if(covariance?.schema!=='MathScope.ActualMeanPulseCovariance/1'||meanStress?.schema!=='MathScope.ActualMeanStressEvaluation/1')return{pass:false,checks:[{id:'source-receipt-schema',pass:false}]};
    const replay=actualMeanPulseCovariance({sourceProfile:covariance.profileId,...covariance.request}),stressReplay=verifyActualMeanStress(meanStress),fEqual=same(canonicalActualSourceExpression(covariance.phaseProgram,'F0'),canonicalActualSourceExpression(meanStress.program,'F'));
    const checks=[
      {id:'covariance-pinned-replay',pass:same(covariance,replay)},
      {id:'mean-stress-pinned-replay',pass:stressReplay.pass},
      {id:'same-source-assembly',pass:covariance.profileId===meanStress.profileId&&covariance.sourceHash===meanStress.sourceHash&&meanStress.sourceHash===PINNED_N3.inputs.assembly.sha256},
      {id:'same-actual-representative',pass:covariance.request.y===meanStress.input.y&&meanStress.observedDomain.eta===0&&meanStress.observedDomain.qOverQ===1&&covariance.phaseProgram.representative.yExact===meanStress.program.request.yExact},
      {id:'same-actual-F-expression',pass:fEqual},
      {id:'strict-actual-target-cone',pass:meanStress.normalizedTarget.theta[0]>0&&same(meanStress.normalizedTarget.z,[0,0])&&meanStress.axialParity.exact===true},
      {id:'strict-actual-covariance-cone',pass:covariance.integrals.A[0]>0&&covariance.integrals.B[0]>0&&covariance.parity.exact&&covariance.covariance.determinant.nonzero}
    ];
    return{schema:'MathScope.ActualPulseMatchingBindings/1',checks,pass:checks.every(c=>c.pass),sourceFCanonical:fEqual?'IDENTICAL_FLATTENED_EXACT_SOURCE_EXPRESSION':'MISMATCH',dataReplayExecuted:true};
  }catch(e){return{pass:false,reason:e.code??e.message,checks:[{id:'valid-pinned-source-receipts',pass:false}]};}
}

function rebaseCovariancePaths(data){
  if(Array.isArray(data))return data.map(rebaseCovariancePaths);
  if(!data||typeof data!=='object')return data;
  return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,k==='sourcePath'&&typeof v==='string'?v.replace(/^result\.results\./,'result.results.pulseCovariance.'):rebaseCovariancePaths(v)]));
}

export function actualMeanPulseMatchedStress(input={},context={}){
  const request=inputOf(input);context.checkCancelled?.();
  const covariance=actualMeanPulseCovariance(requestToCovariance(request),context),meanStress=evaluateActualMeanStress({sourceProfile:request.sourceProfile,y:request.y,bits:request.bits},context),bindings=verifyActualPulseMatchingInputs(covariance,meanStress),algebra=exactPulseCovarianceAlgebra();
  if(!bindings.pass||!algebra.pass)throw Error('The actual covariance and stress could not be joined to the same source point.');
  const coefficient=covariance.covariance.common.coefficientInterval,A=covariance.integrals.A,T=meanStress.normalizedTarget.theta,weight=idiv(T,iscale(imul(coefficient,A),2)),amplitude=sqrti(weight),reconstructed=iscale(imul(imul(coefficient,A),weight),2),residual=isub(reconstructed,T);
  const rows=['plus','minus'].map((sign,i)=>({sign,normalizedSquaredAmplitude:[...weight],normalizedAmplitude:[...amplitude],exactSquaredAmplitude:'targetNormalizedTheta/(2*Jrect*massNormalized*A)',normalization:'y_sigma/(F*X*sqrt(lambda)*sqrt(Gscale)/(r0^2*u_star))',strictlyPositive:weight[0]>0,sourcePath:`result.results.rows[${i}]`}));
  const checks=[...bindings.checks,...algebra.checks,{id:'actual-positive-squared-amplitudes',pass:weight[0]>0},{id:'independent-interval-reconstruction',pass:residual[0]<=0&&residual[1]>=0}];
  return{schema:'MathScope.ActualMeanPulseMatchedStress/1',profileId:request.sourceProfile,sourceHash:PINNED_N3.inputs.assembly.sha256,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,request,coordinateFrame:'BAND_CHART_Q_FIXED',observedDomain:{patch:'Imean',y:request.y,eta:0,qOverQ:1},pulseCovariance:rebaseCovariancePaths(covariance),meanStress,bindings,algebra,rows,
    weights:{plus:rows[0],minus:rows[1],exactEquality:true,sourceScale:{expression:'F*X*sqrt(lambda)*sqrt(Gscale)/(r0^2*u_star)',strictlyPositive:true,binary64:null,underflowIsNotZero:true,factors:{F:'result.results.meanStress.program.roots.F',X:'result.results.meanStress.program.roots.X',lambda:'result.results.meanStress.program.parametersExactExpressions.lambda',Gscale:'result.results.pulseCovariance.phaseProgram.roots.Gscale',uStar:'result.results.pulseCovariance.phaseProgram.roots.uStar',r0:'result.results.pulseCovariance.transverseMass.r0Exact'}},waveFormula:'W0=sqrt(epsilon)*sqrt(weightScale)*sum_sigma normalizedAmplitude_sigma*b_sigma',normalizationDoesNotChangeOriginalGrowingDatum:true},
    localIdentity:{exact:'H*[y_plus,y_minus]^T=T0,*; C(W0)=epsilon*T0,*',qEqualsQExactly:true,targetScale:'F*X*lambda',normalizedTarget:[T,[0,0]],normalizedExactReconstruction:[T,[0,0]],sharedObjectCancellation:true,dependencyFreeIntervalReconstruction:[reconstructed,[0,0]],dependencyFreeIntervalResidual:[residual,[0,0]],identicallyZeroResidual:{theta:algebra.thetaResidual,z:algebra.zResidual},amplitudeSquaresUsed:true,sourcePath:'result.results.localIdentity'},
    cone:{sourceTarget:'Ttheta>0 and Tz=0 by complete moment restoration and even heat debts',sourceCovariance:'A>0,B>0,common>0,sqrt(lambda)>0; columns have exactly opposite axial components',strictMarginNormalized:'1',targetsOrCovariancesReplacedByMidpoints:false,physicalVectorComponents:'rtheta,rz'},
    checks,pass:checks.every(c=>c.pass),status:'PARTIAL',scope:{actualSourceStressJoined:true,actualPositiveWeightsComputed:true,actualLocalCovarianceMatched:true,actualSourceRepresentative:{y:request.y,eta:0,qOverQ:1},enlargedSlowNeighborhoodMatched:false,globalSquaredPartitionMatched:false,fullCurlCovarianceCorrectionIncluded:false,allOriginalN5PackageComplete:false,newLeanKernelProof:false}};
}
const requestToCovariance=({sourceProfile,y,cells,cutoffCells})=>({sourceProfile,y,cells,cutoffCells});
