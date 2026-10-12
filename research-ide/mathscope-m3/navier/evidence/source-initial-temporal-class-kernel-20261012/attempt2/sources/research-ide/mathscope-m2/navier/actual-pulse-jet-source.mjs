/** All R/Z/T first and second jets of the genuine fixed-band source pulse.
 *
 * The FTC norm is parameter-dependent and uniform in pulse time. It is a
 * fully retained integral expression, not a sampled maximum or a numerical
 * enclosure. Local joint smoothness supplies local uniform convergence of
 * differentiated Volterra sums. No common all-band C3 or flatness constant
 * is asserted by this additive adapter.
 */
import {prepareActualCovarianceOperator,assertActualCovarianceOperator} from './actual-covariance-source-operator.mjs';
import {ActualPulseJetExpressions} from './actual-pulse-jet-kernel.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {SOURCE_PROFILE_ID,assertSourceProfile} from './source-profile.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),sourceGraphs=new WeakMap(),ftcCache=new WeakMap();
const coordinateNames=['R','Z','T'];
const frozen=x=>{
  if(x&&typeof x==='object'&&!Object.isFrozen(x)){for(const value of Object.values(x))frozen(value);Object.freeze(x);}return x;
};
const root=(G,id)=>Number.isSafeInteger(id)&&id>=0&&!!G.nodes[id];
const same=(G,a,b,atomicNodes=[])=>sourceGraphRationalIdentity(G,G.sub(a,b),{atomicNodes,maxTerms:40000});
const matvec=(G,A,w)=>A.map(r=>G.add(...r.map((x,j)=>G.mul(x,w[j]))));
const requestOf=input=>{
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['sourceProfile','ellExact','terms'].includes(k)))
    fail('INVALID_INPUT','Use only the source identity, exact fixed band and finite display term count. Coefficients, derivative bodies, norms and completion flags are not caller inputs.');
  const sourceProfile=input.sourceProfile??SOURCE_PROFILE_ID;assertSourceProfile(sourceProfile);
  const ellExact=input.ellExact??'1',terms=input.terms??1;
  if(typeof ellExact!=='string'||!/^[0-9]+$/.test(ellExact)||ellExact.length>2048||BigInt(ellExact)<1n)
    fail('INVALID_INPUT','ellExact is a positive exact integer string.');
  if(BigInt(ellExact)!==1n)fail('RESOURCE_LIMIT','This verified source worker supports ellExact:1; another band is not silently replaced by it.');
  if(!Number.isSafeInteger(terms)||terms<0)fail('INVALID_INPUT','The finite display term count is a nonnegative integer.');
  if(terms>1)fail('RESOURCE_LIMIT','This source release displays zero or one exact ordered-integral correction; the infinite limit and its factorial tail stay separate.');
  return {sourceProfile,ellExact:'1',terms};
};

/** Generic FTC envelope, with explicit C1/real/domain premises. It cannot
 * authenticate a source or replace the integral by a numeric oracle.
 * All derivatives and endpoint values are generated from expression.
 */
export function actualPulseTimeFTCNorm(G,expression,options){
  if(!options||Object.keys(options).some(k=>!['variable','length','parameters'].includes(k)))
    fail('INVALID_INPUT','A time FTC envelope needs a coefficient body, its pulse variable, interval length and explicit parameters.');
  const {variable,length,parameters}=options;
  if(!root(G,expression)||G.nodes[variable]?.op!=='coordinate'||!root(G,length)||!Array.isArray(parameters)||
     new Set(parameters).size!==parameters.length||parameters.includes(variable)||parameters.some(x=>G.nodes[x]?.op!=='coordinate'))
    fail('INVALID_INPUT','The FTC envelope requires declared independent coordinates and retained expression roots.');
  const all=new Set([variable,...parameters]),constants=new Set(parameters);
  if([...G.freeCoordinates(expression)].some(x=>!all.has(x))||[...G.freeCoordinates(length)].some(x=>!constants.has(x)))
    fail('INVALID_INPUT','A FTC coefficient or interval has an undeclared dependency or a moving pulse-time bound.');
  if(G.isq(length)&&G.fraction(length)[0]<0n)fail('INVALID_INPUT','The FTC interval length must be nonnegative.');
  let cache=ftcCache.get(G);if(!cache){cache=new Map();ftcCache.set(G,cache);}
  const key=JSON.stringify([expression,variable,length,parameters]);if(cache.has(key))return cache.get(key);
  G.checkCancelled?.();
  const valueAtZero=G.substitute(expression,variable,G.zero),timeDerivative=G.derivative(expression,variable);
  const integrationVariable=G.fresh('actual_pulse_FTC_time'),atTime=G.substitute(timeDerivative,variable,integrationVariable);
  const initialEnvelope=G.sqrt(G.add(G.one,G.pow(valueAtZero,2))),integrand=G.sqrt(G.add(G.one,G.pow(atTime,2)));
  const integral=G.integral(integrand,integrationVariable,G.zero,length),upper=G.add(initialEnvelope,integral);
  if(G.freeCoordinates(upper).has(variable)||[...G.freeCoordinates(upper)].some(x=>!constants.has(x)))
    fail('INTERNAL_VALIDATION','The FTC envelope must be uniform in pulse time and depend only on declared parameters.');
  const record=frozen({expression,variable,length,parameters:[...parameters],valueAtZero,timeDerivative,integrationVariable,initialEnvelope,integrand,integral,upper,
    formula:'U(f)(a)=sqrt(1+f(0,a)^2)+Integral_0^Ls sqrt(1+(partial_v f(v,a))^2) dv',
    proof:'|f(v,a)| <= |f(0,a)|+Integral_0^v |partial_v f| <= U(f)(a), for real C1 f and 0<=v<=Ls.',
    smoothMajorantIntegrand:true,envelopeContinuousOnDeclaredJointContinuousDomain:true,uniformInPulseTime:true,parameterDependent:true,nonnegative:true,
    analyticalPremises:['f is real and C1 in v on [0,Ls]; Ls>=0.',
      'For local uniform slow convergence, f and partial_v f are jointly continuous on a slow neighborhood times the compact pulse interval.'],
    sourceAuthenticated:false,numericalIntegralEvaluated:false});
  cache.set(key,record);return record;
}

/** Rectangular matrices use induced infinity norms: sum genuine entry
 * envelopes in each row and take the maximum of the row sums. */
export function actualPulseMatrixFTCNorm(G,matrix,options){
  if(!Array.isArray(matrix)||!matrix.length||!Array.isArray(matrix[0])||!matrix[0].length||
     matrix.some(r=>!Array.isArray(r)||r.length!==matrix[0].length||r.some(x=>!root(G,x))))
    fail('INVALID_INPUT','A FTC matrix envelope needs a nonempty rectangular matrix of expression roots.');
  const entries=matrix.map(r=>r.map(x=>actualPulseTimeFTCNorm(G,x,options)));
  const rowSums=entries.map(r=>G.add(...r.map(x=>x.upper))),upper=G.maximum(...rowSums);
  return frozen({matrix:matrix.map(r=>[...r]),entries,rowSums,upper,norm:'induced infinity norm',sourceAuthenticated:false});
}

/** Only a graph constructed by the authenticated adapter may use this
 * source helper. The generic FTC functions above make no such claim. */
export function actualPulseJetFTCNorms(G,operator,family){
  const binding=sourceGraphs.get(G);
  if(!binding||binding.operator!==operator||!operator.families.includes(family))
    fail('INVALID_SOURCE_CONSTRUCTION','Actual FTC norms must be generated on this adapter\'s retained source graph and original family.');
  const variable=operator.coordinates.v,length=operator.geometry.Ls,parameters=G.covarianceSystems[family.system].parameters;
  const directions=coordinateNames.map(k=>operator.coordinates[k]),options={variable,length,parameters};
  const matrix=family.frame.wMatrix.map(r=>[...r]),basis=family.frame.B.map(r=>[...r]);
  const first=A=>directions.map(a=>A.map(r=>r.map(x=>G.derivative(x,a))));
  const second=firstRows=>{
    const out=Array.from({length:3},()=>Array(3));
    for(let i=0;i<3;i++)for(let j=i;j<3;j++)out[j][i]=out[i][j]=firstRows[i].map(r=>r.map(x=>G.derivative(x,directions[j])));
    return out;
  };
  const matrixFirst=first(matrix),matrixSecond=second(matrixFirst),matrixTime=matrix.map(r=>r.map(x=>G.derivative(x,variable)));
  const basisFirst=first(basis),basisSecond=second(basisFirst),rows=[];
  const bound=(label,A)=>{
    G.checkCancelled?.();const norm=actualPulseMatrixFTCNorm(G,A,options);
    rows.push({label,...norm});return norm.upper;
  };
  const matrixNorm=bound('M',matrix),matrixFirstNorms=matrixFirst.map((A,i)=>bound('M_'+coordinateNames[i],A));
  const matrixSecondNorms=Array.from({length:3},()=>Array(3));
  for(let i=0;i<3;i++)for(let j=i;j<3;j++)matrixSecondNorms[j][i]=matrixSecondNorms[i][j]=bound('M_'+coordinateNames[i]+coordinateNames[j],matrixSecond[i][j]);
  const matrixTimeNorm=bound('M_v',matrixTime),basisNorm=bound('B',basis),basisFirstNorms=basisFirst.map((A,i)=>bound('B_'+coordinateNames[i],A));
  const basisSecondNorms=Array.from({length:3},()=>Array(3));
  for(let i=0;i<3;i++)for(let j=i;j<3;j++)basisSecondNorms[j][i]=basisSecondNorms[i][j]=bound('B_'+coordinateNames[i]+coordinateNames[j],basisSecond[i][j]);
  const allNorms=[matrixNorm,...matrixFirstNorms,...matrixSecondNorms.flat(),matrixTimeNorm,basisNorm,...basisFirstNorms,...basisSecondNorms.flat()];
  if(allNorms.some(x=>G.freeCoordinates(x).has(variable)))fail('INTERNAL_VALIDATION','An actual jet norm retained pulse time as a free coordinate.');
  return frozen({directions,variable,length,parameters:[...parameters],matrix,matrixFirst,matrixSecond,matrixTime,basis,basisFirst,basisSecond,
    matrixNorm,matrixFirstNorms,matrixSecondNorms,matrixTimeNorm,basisNorm,basisFirstNorms,basisSecondNorms,rows,
    sourceDerived:true,suppliedConstants:false,uniformInPulseTime:true,parameterDependent:true,
    domain:'The fixed finite original band, frozen representatives/carriers, and the original nonsingular slow chart.',
    sourceOfBound:'FTC applied to each retained original coefficient and its actually generated time derivative; row sums/maxima give induced infinity bounds.',
    locallyUniformInSlowParameters:true,localUniformityReason:'Joint continuity makes these finitely many parameter-dependent envelopes bounded on compact slow neighborhoods. The differentiated factorial tails then converge locally uniformly.',
    commonGlobalC3Constant:false,commonAllBandBound:false,numericalNormEnclosure:false,
    coefficientTimeDerivativeOrder:{M:1,Mi:1,Mij:1,Mv:1,B:1,Bi:1,Bij:1},
    regularity:{finiteOriginalSmoothRecipe:true,retainedExpressionDerivativeBodies:true,
      denominators:'R>0 on the original enlarged annulus; the nonzero frozen integer carrier gives |n_tan|>=|p|/R>0. Original moving-frame and leading-direction denominators are retained.',
      slowDomain:'Interior local neighborhoods; continuous one-sided extensions at chart boundaries. No continuity across a change of frozen representative or rounded carrier is asserted.'}});
}

const liveData=r=>canonicalStringify({request:r.request,rows:r.rows,roots:r.roots,scope:r.scope,domain:r.domain,checks:r.checks});

export function prepareActualPulseJetProgram(input={},context={}){
  const request=requestOf(input);context.checkCancelled?.();
  const operator=prepareActualCovarianceOperator({sourceProfile:request.sourceProfile,ellExact:request.ellExact},context);
  assertActualCovarianceOperator(operator);context.checkCancelled?.();
  const G=new ActualPulseJetExpressions(operator.G,{maxNodes:3000000,checkCancelled:context.checkCancelled});
  sourceGraphs.set(G,{operator});
  const variable=operator.coordinates.v,directions=coordinateNames.map(k=>operator.coordinates[k]),rows=[];
  const zeros=()=>Array(3).fill(G.zero),zeroMatrix=()=>Array.from({length:3},zeros);
  for(const family of operator.families){
    context.checkCancelled?.();const bounds=actualPulseJetFTCNorms(G,operator,family),original=G.covarianceSystems[family.system];
    const system=G.definePulseSecondVariation({name:'ActualSourcePulseRZTSecondJet_'+family.sign,variable,parameters:original.parameters,directions,
      matrix:original.matrix,initial:original.initial,left:G.zero,length:original.length,
      matrixNorm:bounds.matrixNorm,matrixFirstNorms:bounds.matrixFirstNorms,matrixSecondNorms:bounds.matrixSecondNorms,matrixTimeNorm:bounds.matrixTimeNorm,
      initialNorm:G.one,initialFirstNorms:zeros(),initialSecondNorms:zeroMatrix(),leftFirstNorms:zeros(),leftSecondNorms:zeroMatrix()});
    G.bindOriginalCovarianceJet(family.system,system);const jet=G.pulseJetSystems[system];
    const PFirst=directions.map(a=>G.derivative(family.P,a));
    if(PFirst.some(x=>x!==G.zero))fail('INVALID_SOURCE_CONSTRUCTION','A frozen source reference envelope acquired a slow derivative.');
    const wFirst=directions.map(a=>family.w.map(x=>G.derivative(x,a))),amplitudeFirst=directions.map(a=>family.t.map(x=>G.derivative(x,a)));
    const wSecond=Array.from({length:3},()=>Array(3)),amplitudeSecond=Array.from({length:3},()=>Array(3));
    for(let i=0;i<3;i++)for(let j=i;j<3;j++){
      wSecond[j][i]=wSecond[i][j]=wFirst[i].map(x=>G.derivative(x,directions[j]));
      amplitudeSecond[j][i]=amplitudeSecond[i][j]=amplitudeFirst[i].map(x=>G.derivative(x,directions[j]));
    }
    const finite=G.pulseJetPartialSum(system,{terms:request.terms}),finiteW=finite.values.slice(0,2);
    const finiteWFirst=jet.firstBlocks.map(k=>finite.values.slice(k,k+2)),finiteWSecond=jet.secondBlocks.map(r=>r.map(k=>finite.values.slice(k,k+2)));
    const amplitude=family.t,finiteAmplitude=matvec(G,bounds.basis,finiteW).map(x=>G.mul(family.P,x)),derivatives=[];
    const allAtoms=[family.P,...family.w,...wFirst.flat(),...wSecond.flat(2),...bounds.basis.flat(),...bounds.basisFirst.flat(2),...bounds.basisSecond.flat(3)];
    for(let i=0;i<3;i++){
      const orders=[0,0,0];orders[i]=1;
      const expression=bounds.basis.map((row,k)=>G.mul(family.P,G.add(...row.map((x,q)=>G.add(G.mul(bounds.basisFirst[i][k][q],family.w[q]),G.mul(x,wFirst[i][q]))))));
      const finiteDerivative=bounds.basis.map((row,k)=>G.mul(family.P,G.add(...row.map((x,q)=>G.add(G.mul(bounds.basisFirst[i][k][q],finiteW[q]),G.mul(x,finiteWFirst[i][q]))))));
      const checks=expression.map((x,k)=>same(G,x,amplitudeFirst[i][k],allAtoms));
      const absoluteTail=G.mul(family.P,G.add(bounds.basisNorm,bounds.basisFirstNorms[i]),finite.tail);
      derivatives.push({coordinate:coordinateNames[i],orders,derivativeOrder:1,amplitudeDerivative:amplitudeFirst[i],expandedAmplitudeDerivative:expression,
        finiteAmplitudeDerivative:finiteDerivative,absoluteTail,checks,
        formula:'P*(B_i*w+B*w_i)',tailFormula:'P(v)*(||B_i||+||B||)*E_N'});
    }
    for(let i=0;i<3;i++)for(let j=i;j<3;j++){
      const orders=[0,0,0];orders[i]++;orders[j]++;
      const combine=(w,wi,wj,wij)=>bounds.basis.map((row,k)=>G.mul(family.P,G.add(...row.map((x,q)=>G.add(
        G.mul(bounds.basisSecond[i][j][k][q],w[q]),G.mul(bounds.basisFirst[i][k][q],wj[q]),
        G.mul(bounds.basisFirst[j][k][q],wi[q]),G.mul(x,wij[q]))))));
      const expression=combine(family.w,wFirst[i],wFirst[j],wSecond[i][j]),finiteDerivative=combine(finiteW,finiteWFirst[i],finiteWFirst[j],finiteWSecond[i][j]);
      const checks=expression.map((x,k)=>same(G,x,amplitudeSecond[i][j][k],allAtoms));
      const absoluteTail=G.mul(family.P,G.add(bounds.basisSecondNorms[i][j],bounds.basisFirstNorms[i],bounds.basisFirstNorms[j],bounds.basisNorm),finite.tail);
      derivatives.push({coordinate:coordinateNames[i]+coordinateNames[j],orders,derivativeOrder:2,amplitudeDerivative:amplitudeSecond[i][j],expandedAmplitudeDerivative:expression,
        finiteAmplitudeDerivative:finiteDerivative,absoluteTail,checks,
        formula:'P*(B_ij*w+B_i*w_j+B_j*w_i+B*w_ij)',tailFormula:'P(v)*(||B_ij||+||B_i||+||B_j||+||B||)*E_N'});
    }
    const endpoints=[['left',G.zero],['midpoint',G.div(operator.geometry.Ls,G.q(2))],['right',operator.geometry.Ls]].map(([name,time])=>{
      const initial=amplitude.map(x=>G.substitute(x,variable,time));
      return {name,time,timeFirst:directions.map(a=>G.derivative(time,a)),jets:derivatives.map(d=>{
        const amplitudeDerivative=initial.map(x=>{
          for(let i=0;i<3;i++)for(let n=0;n<d.orders[i];n++)x=G.derivative(x,directions[i]);return x;
        });
        return {coordinate:d.coordinate,orders:d.orders,derivativeOrder:d.derivativeOrder,amplitudeDerivative,
          absoluteTail:G.substitute(d.absoluteTail,variable,time),composedEndpointDifferentiated:true};
      })};
    });
    if(!derivatives.every(d=>d.checks.every(x=>x.pass)))fail('INTERNAL_VALIDATION','The actual amplitude lost a basis, mixed, or repeated-direction derivative term.');
    const frozenRoots=[['p',family.carrier.p],['pz',family.carrier.pz],['x0',family.carrier.x0],['epsilon',operator.geometry.epsilon],['k',operator.geometry.k],['Ls',operator.geometry.Ls],
      ['u',operator.constants.u],['c0',operator.frozen.c0],['lambda0',operator.frozen.lambda0]];
    for(const [label,x]of frozenRoots)for(let i=0;i<directions.length;i++){
      const dx=G.derivative(x,directions[i]);
      if(dx!==G.zero)fail('INVALID_SOURCE_CONSTRUCTION','A frozen coefficient acquired a local slow derivative: '+label+' / '+coordinateNames[i]+', root '+x+', derivative '+dx+' ('+G.nodes[dx].op+'), dependsOn='+G.dependsOn(x,directions[i])+'.');
    }
    rows.push({sign:family.sign,originalCovarianceSystem:family.system,system,directions:coordinateNames,parameters:original.parameters,
      matrix:original.matrix,matrixFirst:jet.matrixFirst,matrixSecond:jet.matrixSecond,matrixTime:jet.matrixTime,
      originalInitial:jet.initial,initialFirst:jet.initialFirst,initialSecond:jet.initialSecond,
      variationFirstInitial:jet.variationFirstInitial,variationSecondInitial:jet.variationSecondInitial,
      left:jet.left,leftFirst:jet.leftFirst,leftSecond:jet.leftSecond,length:jet.length,lengthFirst:jet.lengthFirst,lengthSecond:jet.lengthSecond,
      w:family.w,wFirst,wSecond,amplitude,amplitudeFirst,amplitudeSecond,referenceEnvelope:family.P,referenceEnvelopeFirst:PFirst,
      basis:bounds.basis,basisFirst:bounds.basisFirst,basisSecond:bounds.basisSecond,finite,finiteAmplitude,derivatives,endpoints,bounds,
      sourceCoefficientsReplaced:false,actualInitialAmplitudeNotForcedConstant:true});
  }
  const scope={actualSourceFirstSlowDerivativeConstructed:true,actualSourceSecondSlowDerivativeConstructed:true,
    firstSlowDerivativeSupported:true,secondSlowDerivativeSupported:true,mixedSlowDerivativeSupported:true,
    allRZT:true,derivativeOrders:[1,2],sourceDerivedParameterDependentFTCNorm:true,sourceDerivedTimeUniformJetNorms:true,
    actualMatrixFirstSecondAndTimeDerivativesRetained:true,actualAmplitudeFirstAndMixedSecondDerivativesConstructed:true,
    fixedLabelDerivative:true,representativeDerivativeSupported:false,initialAndEndpointDependenceIncluded:true,
    localUniformDifferentiatedVolterraConvergence:true,sourceGlobalC3Bound:false,commonGlobalC3Constant:false,
    numericalSensitivityQuadrature:false,numericalNormQuadrature:false,displayedPartialSumIsExactLimit:false,
    actualCovarianceWeightDerivativeConstructed:false,positiveWeightsOfExercisedMemberCertified:false,
    actualSourceFullCurlComplete:false,allSlowGaussianDerivativesComplete:false,
    fullSameProfileN5:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,
    originalM2AcceptanceCountChanged:false};
  const domain={sourceProfile:request.sourceProfile,band:structuredClone(operator.program.band),slowPoint:structuredClone(operator.chart),pulseTime:'0<=v<=Ls',
    derivative:'Ordinary first and symmetric second R/Z/T partial derivatives with fixed band, representative, integer carrier and auxiliary label.',
    normScope:'Parameter-dependent exact FTC envelopes, uniform along the finite pulse interval. No common bound over all slow points, representatives or bands is inferred.',
    localUniformity:'Joint continuity on interior slow neighborhoods gives bounded FTC envelopes on compact neighborhoods and locally uniform differentiated Volterra convergence.',
    chartBoundary:'Continuous one-sided derivative extensions on the original chart boundary; no differentiability across representative/carrier selection changes.',
    regularity:'The finite active smooth source recipe and original nonzero phase/frame denominators are retained. The envelopes actually contain each M_ij and its v derivative.',
    exercisedMember:{ellExact:request.ellExact,certifiedBandMembership:false,determinantNonzeroCertified:false,positiveWeightsCertified:false},
    numericalMeaning:'Root IDs represent exact convergent expressions and exact finite integrals. Neither the norms nor derivatives are reported as evaluated decimal enclosures.'};
  const checks=[
    {id:'genuine-original-source-both-signs',pass:rows.every(r=>canonicalStringify(r.matrix)===canonicalStringify(operator.families.find(f=>f.sign===r.sign).frame.wMatrix))},
    {id:'all-RZT-first-and-symmetric-second',pass:rows.every(r=>G.pulseJetSystems[r.system].dimension===20&&r.derivatives.length===9&&r.derivatives.filter(d=>d.derivativeOrder===2).length===6)},
    {id:'FTC-from-actual-coefficient-and-time-derivative',pass:rows.every(r=>r.bounds.sourceDerived&&r.bounds.rows.every(A=>A.entries.every(row=>row.every(e=>e.timeDerivative===G.derivative(e.expression,variable)&&!G.freeCoordinates(e.upper).has(variable)))))},
    {id:'same-internally-differentiated-matrices',pass:rows.every(r=>canonicalStringify(r.matrixFirst)===canonicalStringify(r.bounds.matrixFirst)&&canonicalStringify(r.matrixSecond)===canonicalStringify(r.bounds.matrixSecond)&&canonicalStringify(r.matrixTime)===canonicalStringify(r.bounds.matrixTime))},
    {id:'full-amplitude-Leibniz-and-repeated-factor',pass:rows.every(r=>r.derivatives.every(d=>d.checks.every(x=>x.pass)))},
    {id:'source-datum-and-endpoint-dependence-computed',pass:rows.every(r=>r.initialFirst.flat().every(x=>x===G.zero)&&r.initialSecond.flat(2).every(x=>x===G.zero)&&r.leftFirst.every(x=>x===G.zero)&&r.lengthFirst.every(x=>x===G.zero)&&r.endpoints.length===3)},
    {id:'nonzero-functional-factorial-tails',pass:rows.every(r=>r.finite.tail!==G.zero&&r.finite.tailTendsToZero&&!r.finite.finiteSumIsExactSolution&&r.derivatives.every(d=>d.absoluteTail!==G.zero))},
    {id:'exact-first-integral-display',pass:rows.every(r=>r.finite.terms===request.terms&&r.finite.rows.length===request.terms&&r.finite.finiteTermsAreExactExpressions)},
    {id:'local-scope-not-global-promotion',pass:!scope.commonGlobalC3Constant&&!scope.fullPhysicalResidualAndFlatErrorPackageComplete&&!domain.exercisedMember.positiveWeightsCertified&&!scope.newLeanKernelProof}
  ];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','The actual fixed-band pulse-jet source contract failed.');
  const roots=Object.fromEntries(rows.flatMap(r=>[
    ...r.derivatives.flatMap(d=>d.amplitudeDerivative.flatMap((x,k)=>[
      ['t_'+r.sign+'_d'+d.coordinate+'_'+k,x],['finite_t_'+r.sign+'_d'+d.coordinate+'_'+k,d.finiteAmplitudeDerivative[k]]
    ])),...r.derivatives.map(d=>['tail_t_'+r.sign+'_d'+d.coordinate,d.absoluteTail]),
    ['jetTail_'+r.sign,r.finite.tail],['jetMatrixNorm_'+r.sign,G.pulseJetSystems[r.system].bounds.augmentedMatrixNorm]
  ]));
  const result={G,operator,request,rows,roots,checks,scope,domain};
  result.program=G.pack(roots,{schema:'MathScope.ActualPulseJetProgram/1',compiler:'actual-pulse-jet-source.mjs:prepareActualPulseJetProgram',compilerInput:request,
    sourceProfile:request.sourceProfile,parameterExpressionSHA256:operator.parameterExpressionSHA256,domain,scope,checks,rows});
  // Keep the compiler receipt stable if a later covariance/curl adapter
  // appends nodes or function definitions on G. Only this original prefix
  // and these original metadata belong to the pulse-jet compiler hash.
  const {nodes:programNodes,...metadata}=result.program,programMetadata=frozen(structuredClone(metadata));
  seals.set(result,{G,operator,nodeCount:G.nodes.length,nodes:JSON.stringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    covarianceCount:G.covarianceSystems.length,covariance:JSON.stringify(G.covarianceSystems),jetCount:G.pulseJetSystems.length,jets:JSON.stringify(G.pulseJetSystems),aliases:JSON.stringify([...G.pulseJetAliases]),data:liveData(result),programMetadata});
  return result;
}

export function assertActualPulseJetProgram(result){
  const s=seals.get(result);
  if(!s||result.G!==s.G||result.operator!==s.operator||JSON.stringify(s.G.nodes.slice(0,s.nodeCount))!==s.nodes||
     !s.G.functionDefinitionsUnchanged(s.definitions)||JSON.stringify(s.G.covarianceSystems.slice(0,s.covarianceCount))!==s.covariance||
     JSON.stringify(s.G.pulseJetSystems.slice(0,s.jetCount))!==s.jets||JSON.stringify([...s.G.pulseJetAliases])!==s.aliases||liveData(result)!==s.data)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged internally generated source pulse-jet program. Copied receipts, edited nodes or caller bounds are not source certificates.');
  assertActualCovarianceOperator(s.operator);for(const row of result.rows)s.G.assertPulseSecondVariation(row.system);return true;
}

/** Issue a receipt from an existing authenticated graph, so callers that
 * already built it do not need a second heavy source construction. */
export async function actualPulseJetCertificateFromProgram(prepared,context={}){
  assertActualPulseJetProgram(prepared);context.checkCancelled?.();
  const {G,request,rows,checks,scope,domain}=prepared,sealed=seals.get(prepared),program={...sealed.programMetadata,nodes:G.nodes.slice(0,sealed.nodeCount)};
  const serialized=canonicalStringify(program),digest=await sha256(serialized);context.checkCancelled?.();
  const expression=id=>({rootId:id,operation:G.nodes[id].op,arguments:structuredClone(G.nodes[id].args),valueKind:'exact convergent source expression or exact finite integral; not a decimal enclosure'});
  return {schema:'MathScope.ActualPulseJetCertificate/1',status:'COMPLETED',pass:true,request,sourceProfile:request.sourceProfile,parameterExpressionSHA256:prepared.operator.parameterExpressionSHA256,
    completedScope:'Actual fixed-band R/Z/T first and symmetric second pulse/amplitude derivatives, exact first ordered-integral display, and parameter-dependent time-uniform FTC factorial tails.',
    domain,scope,checks,graph:{sha256:digest,nodeCount:sealed.nodeCount,serializedProgramBytes:new TextEncoder().encode(serialized).length,roots:program.roots,
      compiler:program.compiler,compilerInput:request,graphIncluded:false},
    equationRows:rows.map(r=>({sign:r.sign,originalSystem:r.originalCovarianceSystem,variationSystem:r.system,directions:coordinateNames,augmentedDimension:20,
      matrixRoots:r.matrix,matrixFirstRoots:r.matrixFirst,matrixSecondRoots:r.matrixSecond,matrixTimeRoots:r.matrixTime,
      matrixNorm:expression(r.bounds.matrixNorm),matrixFirstNorms:r.bounds.matrixFirstNorms.map(expression),matrixSecondNorms:r.bounds.matrixSecondNorms.map(row=>row.map(expression)),
      sourceJetAuditRowCount:r.bounds.rows.reduce((n,A)=>n+A.entries.flat().length,0),originalInitial:r.originalInitial.map(expression),
      originalODE:'w_v=M w',variationODE:'s_i,v=M s_i+M_i w',secondVariationODE:'s_ij,v=M s_ij+M_i s_j+M_j s_i+M_ij w',
      endpointFormula:'d_ij t(b(a),a)=t_ij+t_iv*b_j+t_jv*b_i+t_vv*b_i*b_j+t_v*b_ij',
      sourceOfNorm:'sqrt(1+f(0)^2)+Integral sqrt(1+(partial_v f)^2), applied to every actual coefficient; matrix row sums/maxima.'})),
    derivativeRows:rows.flatMap(r=>r.derivatives.flatMap(d=>d.amplitudeDerivative.map((id,k)=>({sign:r.sign,component:['r','theta','z'][k],coordinate:d.coordinate,orders:d.orders,derivativeOrder:d.derivativeOrder,
      derivative:expression(id),finiteApproximation:expression(d.finiteAmplitudeDerivative[k]),absoluteTail:expression(d.absoluteTail),tailFormula:d.tailFormula,finiteApproximationIsExact:false})))),
    endpointRows:rows.flatMap(r=>r.endpoints.flatMap(e=>e.jets.map(d=>({sign:r.sign,name:e.name,time:expression(e.time),coordinate:d.coordinate,orders:d.orders,derivativeOrder:d.derivativeOrder,
      amplitudeDerivative:d.amplitudeDerivative.map(expression),absoluteTail:expression(d.absoluteTail),composedEndpointDifferentiated:true})))),
    convergence:{method:'One 20-component ordered noncommutative Volterra system per original sign',directions:coordinateNames,slowDerivativeOrders:[1,2],terms:request.terms,
      tailFormula:'I_aug*exp(K_aug*Ls)*(K_aug*Ls)^(N+1)/(N+1)!',augmentedNorm:'max(K,K+Ki,K+Ki+Kj+Kij)',
      sourceOfDerivative:'Ordinary differentiation of every retained M, datum, basis and endpoint body; mixed orders are generated canonically.',
      sourceOfNorm:'Exact parameter-dependent FTC integrals of M,Mi,Mij,Mv,B,Bi,Bij and their actual pulse-time derivatives.',
      localUniformity:'Joint continuity gives compact slow-neighborhood bounds, hence locally uniform first/second differentiated ordered-series convergence.',
      commonGlobalC3Constant:false,partialSumIsExactSolution:false,numericalWholeSourceEvaluation:false,numericalNormEnclosure:false},
    nextDependency:'Use these fixed-band local jets in the actual covariance/full-curl assembly on its explicitly stated invertibility/positivity domain. A common global all-band norm, physical residual/flat-error estimates and a new Lean kernel proof remain separate.'};
}

export async function actualPulseJetCertificate(input={},context={}){
  return actualPulseJetCertificateFromProgram(prepareActualPulseJetProgram(input,context),context);
}
