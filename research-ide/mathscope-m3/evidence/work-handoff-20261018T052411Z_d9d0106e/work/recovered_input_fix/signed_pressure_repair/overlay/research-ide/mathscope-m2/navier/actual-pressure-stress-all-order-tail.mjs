/** Actual pressure and signed stress seminorms for every finite requested
 * derivative order. The source coefficient identities, including smooth
 * stress gluing, are prerequisites authenticated by private producer seals.
 * All constants are complete original source FTC integrals. No cap16,
 * sampled coefficient, numerical zero-h limit, or invented bound is used.
 */
import {assertActualPositiveGlobalStress} from './actual-positive-global-stress.mjs';
import {attachActualOrderOneWeightedStress,assertActualOrderOneWeightedStress} from './actual-order-one-weighted-stress.mjs';
import {physicalPositiveJetCalculus} from './actual-velocity-all-order-tail.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {sourceNormalizedCutoffWeights} from './actual-residual-order-induction-kernels.mjs';
import {allFiniteTerminalGaussianRules} from './actual-pressure-stress-all-order-tail-kernel.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),sum=xs=>xs.reduce((a,b)=>a+b,0),binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const data=r=>({request:r.request,source:r.source,domain:r.domain,rows:r.rows,normalizedPressure:r.normalizedPressure,
  weightedStress:r.weightedStress,n1Weighted:r.n1Weighted,ftcRows:r.ftcRows,roots:r.roots,scope:r.scope,work:r.work});

function weightsAtOrder(G,n,m,context){
  const q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),source=sourceNormalizedCutoffWeights({order:n,derivativeOrder:m},context),
    values=source.weights.map(w=>G.add(...w.polynomialInSourceH.map((c,k)=>G.mul(q(BigInt(c)),G.pow(h,k)))));
  if(!source.pass||values.length!==m+1)fail('INVALID_SOURCE_CONSTRUCTION','Every original all-order Euler cutoff weight is required.');
  return {source,values};
}

/** The original m=0 packet authenticates its complete heat/factor bodies.
 * The new recurrence generates all finite derivatives of those SAME bodies;
 * its materializer budget is independent of the historical packet cap.
 */
function allFiniteOrderOneWeighted(positive,seed,m,maxJetRequests,receipt,context){
  assertActualPositiveGlobalStress(positive);assertActualOrderOneWeightedStress(seed);
  const {G}=positive,prepared=positive.moments.pressure.primitives.prepared,{X,eta}=prepared.bootstrap.constants,
    q=(n,d=1)=>G.q(n,d),rules=allFiniteTerminalGaussianRules({derivativeOrder:m,maxWork:maxJetRequests}),
    {delta,deltaMax,Xedge,B,innerReciprocal}=seed.terminal,{Xb}=prepared.bootstrap.orderOne,zeta=seed.roots.sourceZeta,
    actualStress={theta:prepared.records[1].stress.Ttheta,z:prepared.records[1].stress.Tz},sourceChecks={
      samePreparedGraph:seed.G===G&&seed.prepared===prepared,
      sameActualAngularStress:seed.roots.actualT1theta===actualStress.theta,
      sameActualAxialStress:seed.roots.actualT1z===actualStress.z,
      actualGlobalBothEndpointGluing:positive.stressRows.filter(r=>r.order===1).length===2&&positive.stressRows.filter(r=>r.order===1).every(r=>r.pass&&r.allFixedDerivativeJetsMatch),
      actualCompleteAngularTotal:positive.leading.angular.pass&&!positive.leading.angular.heatOnlyMomentUsed,
      actualCompleteHeatFactor:seed.scope.completeTerminalHeatFactorRetained&&seed.terminal.noTerminalTruncation,
      literalTerminalProductRule:seed.terminal.factorization.check.pass,
      sameActiveAnnulus:seed.domain.activeAnnulus[1]===Xb,
      sameOriginalResidual:seed.sourceBinding.originalRoots.angularResidual===prepared.records[1].stress.angular};
  if(!Object.values(sourceChecks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The all-finite n=1 extension must retain the same source heat, stress, total and both endpoint joins.');
  const cache=new Map(),terminalNorms=[],primitiveBounds=[],stressDeltaBounds=[],interior=[],weightedRows=[];
  const bNorm=(r,k)=>{
    const key=r+':'+k;if(cache.has(key))return cache.get(key);
    let derivative=B;for(let j=0;j<r;j++)derivative=G.derivative(derivative,delta);for(let j=0;j<k;j++)derivative=G.derivative(derivative,eta);
    const row={deltaOrder:r,etaOrder:k,sourceBody:B,...receipt({body:derivative,coordinates:[delta,eta],lower:[G.zero,q(-1)],upper:[deltaMax,G.one]},'order-one-terminal')};
    terminalNorms.push(row);cache.set(key,row.bound);return row.bound;
  };
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){context.checkCancelled?.();bNorm(r,k);}
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){
    const constant=r===0?G.mul(q(16,125),bNorm(0,k)):G.add(...Array.from({length:r},(_,a)=>
      G.mul(q(binomial(r-1,a)*BigInt(rules.laurent[a].absoluteCoefficientSum)),bNorm(r-1-a,k))));
    primitiveBounds.push({deltaOrder:r,etaOrder:k,pole:3+3*r,constant});
  }
  const primitive=(r,k)=>primitiveBounds.find(row=>row.deltaOrder===r&&row.etaOrder===k).constant;
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++)stressDeltaBounds.push({deltaOrder:r,etaOrder:k,pole:3+3*r,
    constant:G.mul(Xb,G.exp(deltaMax),G.add(...Array.from({length:r+1},(_,a)=>G.mul(q(binomial(r,a)),primitive(a,k)))))});
  const deltaBound=(r,k)=>stressDeltaBounds.find(row=>row.deltaOrder===r&&row.etaOrder===k).constant,
    shared=Object.fromEntries(Object.entries(actualStress).map(([name,body])=>[name,G.share(body,[X,eta],'ActualAllFiniteOrderOneStress_'+name)]));
  for(let r=0;r<=m;r++)for(let k=0;r+k<=m;k++){
    context.checkCancelled?.();const components=[];
    for(const name of ['theta','z']){
      let derivative=shared[name];for(let j=0;j<r;j++)derivative=G.derivative(derivative,X);for(let j=0;j<k;j++)derivative=G.derivative(derivative,eta);
      const row={component:name,radialOrder:r,etaOrder:k,sourceRoot:actualStress[name],sourceDerivative:derivative,
        ...receipt({body:G.div(derivative,zeta),coordinates:[X,eta],lower:[prepared.bootstrap.orderOne.Xminus,q(-1)],upper:[Xedge,G.one]},'order-one-interior')};
      interior.push(row);components.push(row);
    }
    const terminalConstant=G.mul(innerReciprocal,G.pow(Xedge,-r),G.add(...rules.ordinaryXConversion.unsignedStirlingFirst[r].map((c,j)=>G.mul(q(BigInt(c)),deltaBound(j,k))))),
      bound=G.maximum(G.one,...components.map(c=>c.bound),terminalConstant);
    weightedRows.push({radialOrder:r,etaOrder:k,pole:3+3*r,components,terminalThetaConstant:terminalConstant,terminalZIdenticallyZero:true,bound});
  }
  const weights=weightsAtOrder(G,1,m,context),normalizedRows=[];
  for(let e=0;e<=m;e++)for(const row of weightedRows)if(e+row.radialOrder+row.etaOrder<=m)normalizedRows.push({
    eulerOrder:e,radialOrder:row.radialOrder,etaOrder:row.etaOrder,pole:row.pole,profileBound:row.bound,cutoffWeight:weights.values[e],bound:G.mul(weights.values[e],row.bound)});
  const bounds=Array.from({length:m+1},(_,k)=>G.maximum(G.one,...normalizedRows.filter(r=>r.eulerOrder+r.radialOrder+r.etaOrder<=k).map(r=>r.bound))),
    poles=Array.from({length:m+1},(_,k)=>3+3*k);
  return {order:1,sourceChecks,seedSchema:seed.program.schema,sourceBinding:seed.sourceBinding,originalStress:actualStress,zeta,
    terminal:{delta,deltaMax,Xedge,B,completeHeat:seed.terminal.heatAtDelta,originalFactor:seed.terminal.factor,
      factorization:seed.terminal.factorization,terminalNorms,primitiveBounds,stressDeltaBounds,innerReciprocal,
      backwardRepresentation:seed.terminal.backwardRepresentation,fullImproperHeatTailRetained:true},
    rules,domain:seed.domain,interior,weightedRows,weights:weights.source,normalizedRows,bounds,poles,
    statement:'For each finite k and every word I in (q*d_q,d_X,d_eta), |I|<=k, the actual n=1 normalized cutoff stress is <=bounds[k]*q^(2h)*zeta*delta_global^(-poles[k]), for any positive cutoff scale.',
    induction:'Every finite derivative follows from the explicit Gaussian Laurent recurrence, full Leibniz rule, actual differentiated B FTC constants and Stirling coordinate recurrence. The seed packet supplies source identities only; no derivative above its requested zero order is asserted by that packet.',
    allFiniteRequestedDerivativesGenerated:true,mathematicalDerivativeOrderCap:null,originalFirstCutoffReplaced:false,pass:true};
}

export function attachActualPressureStressPhysicalSeminorms(positiveStress,input={},context={}){
  assertActualPositiveGlobalStress(positiveStress);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['throughOrder','derivativeOrder','maxProfileJets','maxJetRequests'].includes(k)))
    fail('INVALID_INPUT','Only a finite authenticated prefix and derivative/work budgets may be selected.');
  const {G}=positiveStress,prepared=positiveStress.moments.pressure.primitives.prepared,{bootstrap,records}=prepared,
    throughOrder=input.throughOrder??positiveStress.request.throughOrder,m=input.derivativeOrder??2,
    maxProfileJets=input.maxProfileJets??20000,maxJetRequests=input.maxJetRequests??200000;
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>positiveStress.request.throughOrder||!Number.isSafeInteger(m)||m<0||
    !Number.isSafeInteger(maxProfileJets)||maxProfileJets<1||!Number.isSafeInteger(maxJetRequests)||maxJetRequests<1)
    fail('INVALID_INPUT','Use an authenticated positive prefix, nonnegative finite derivative order, and positive finite work budgets.');
  const triangular=(m+1)*(m+2)/2,cartesian=(m+1)*(m+2)*(m+3)/6,
    requiredProfileJets=3*throughOrder*cartesian+(5*throughOrder-1)*triangular;
  if(!Number.isSafeInteger(requiredProfileJets)||requiredProfileJets>maxProfileJets)
    fail('RESOURCE_LIMIT','The declared finite profile-jet budget cannot cover every pressure, stress, quotient and order-one endpoint derivative.');
  G.derivativeBudget(2*(m+4),m+4);
  allFiniteTerminalGaussianRules({derivativeOrder:m,maxWork:maxJetRequests});
  const {X,eta}=bootstrap.constants,{Xminus,Xplus,Xb}=bootstrap.orderOne,{A,D,L}=G.core,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),
    y1=G.fresh('all_order_pressure_stress_y1'),y2=G.fresh('all_order_pressure_stress_y2'),ec=G.fresh('all_order_pressure_stress_eta'),
    radius=G.sqrt(G.mul(q(2),Xb)),cartX=G.div(G.add(G.pow(y1,2),G.pow(y2,2)),q(2)),
    atCart=f=>G.simultaneousSubstitute(f,[X,eta],[cartX,ec]),box={coordinates:[y1,y2,ec],lower:[G.neg(radius),G.neg(radius),q(-1)],upper:[radius,radius,G.one]},
    ftcRows=[],receipt=(request,kind)=>{
      if(ftcRows.length>=maxProfileJets)fail('RESOURCE_LIMIT','The complete finite pressure/stress FTC budget was exhausted.');
      const value=rectangularSourceFTC(G,request);ftcRows.push({kind,...value});return value;
    },C=physicalPositiveJetCalculus(G,{maxJetRequests,checkCancelled:context.checkCancelled}),{fn,constant,add,mul,shift}=C,
    coord=(j,bound)=>fn((...o)=>sum(o)===0?bound:sum(o)===1&&o[j]===1?G.one:G.zero),xx=coord(1,radius),yy=coord(2,radius),ee=coord(3,G.one),
    dd=fn((e,x,y,s)=>e||x||y?G.zero:s===0?G.one:s===1||s===2?q(2):G.zero),
    invL=fn((e,x,y,s)=>e||x||y?G.zero:q(2n*factorial(s)*8n**BigInt(s))),profileCache=new Map(),rows=[],normalizedPressure=[],weightedStress=[];
  const profileNorm=(body,x,y,s)=>{
    const key=[body,x,y,s].join(':');if(profileCache.has(key))return profileCache.get(key);
    let derivative=body;for(const[variable,count]of[[y1,x],[y2,y],[ec,s]])for(let j=0;j<count;j++)derivative=G.derivative(derivative,variable);
    const ftc=receipt({body:derivative,...box},'physical-cartesian');profileCache.set(key,ftc.bound);return ftc.bound;
  };
  const zeta=G.exp(G.neg(G.add(G.div(G.pow(G.parameter('t1'),2),G.pow(G.log(G.div(X,G.parameter('Xa'))),2)),
    G.div(q(4),G.pow(G.log(G.div(Xb,X)),2))))),
    throughBounds=(allRows,k)=>G.maximum(G.one,...allRows.filter(r=>r.eulerOrder+r.radialOrder+r.etaOrder<=k).map(r=>r.bound));
  for(let n=1;n<=throughOrder;n++){
    context.checkCancelled?.();const r=records[n],proofRows=positiveStress.stressRows.filter(row=>row.order===n),radial=positiveStress.radialRows[n-1];
    if(proofRows.length!==2||!proofRows.every(row=>row.pass&&row.allFixedDerivativeJetsMatch)||!radial.pass||radial.actualPi!==r.global.Pi)
      fail('INVALID_SOURCE_CONSTRUCTION','The same actual global pressure and signed stress identities must precede every seminorm.');
    const weights=weightsAtOrder(G,n,m,context),components=[
      {name:'pressure',sourceRoot:r.global.Pi,body:atCart(r.global.Pi),baseLoss:G.mul(q(2),A)},
      {name:'stress_theta',sourceRoot:r.stress.Ttheta,body:atCart(r.stress.Ttheta),baseLoss:G.add(A,q(1,2))},
      {name:'stress_z',sourceRoot:r.stress.Tz,body:atCart(r.stress.Tz),baseLoss:G.add(A,q(1,2))}],componentRows=[];
    for(const component of components){
      let current=fn((e,x,y,s)=>{
        if(e+x+y+s>m||weights.values[e]===undefined)fail('RESOURCE_LIMIT','The physical pressure/stress word requested an unconstructed derivative.');
        return G.mul(weights.values[e],profileNorm(component.body,x,y,s));
      });
      const byOrder=[current.get(0,0,0,0)];
      for(let j=0;j<m;j++){
        const E=shift(current,0),dx=shift(current,1),dy=shift(current,2),de=shift(current,3),
          euler=add(E,mul(constant(G.add(component.baseLoss,q(j))),current)),radial=add(mul(xx,dx),mul(yy,dy)),
          axial=mul(invL,add(mul(constant(q(2)),ee,euler),mul(ee,radial),mul(dd,de))),
          time=mul(invL,add(euler,mul(constant(q(1,2)),radial),mul(constant(D),ee,de)));
        current=add(dx,dy,axial,time);byOrder.push(current.get(0,0,0,0));
      }
      componentRows.push({...component,byOrder});
    }
    const bounds=Array.from({length:m+1},(_,k)=>G.maximum(G.one,...Array.from({length:k+1},(_,j)=>G.add(...componentRows.map(c=>c.byOrder[j])))));
    rows.push({order:n,components:componentRows,bounds,weights:weights.source,gain:G.mul(q(2*n),h),losses:Array.from({length:m+1},(_,k)=>G.add(G.mul(q(2),A),q(k))),
      sameActualStressRoots:proofRows.map(row=>row.actualStress),sameActualPressureRoot:radial.actualPi,
      statement:'Every physical Cartesian/time derivative through k of the actual cutoff pressure and signed stress pair is <=bounds[k]*q^(2*n*h-(2*A+k)). The loss is independent of n.'});
    const pressureJets=[],pressureNormalized=[];
    for(let radialOrder=0;radialOrder<=m;radialOrder++)for(let etaOrder=0;radialOrder+etaOrder<=m;etaOrder++){
      let derivative=r.global.Pi;for(let j=0;j<radialOrder;j++)derivative=G.derivative(derivative,X);for(let j=0;j<etaOrder;j++)derivative=G.derivative(derivative,eta);
      const row={radialOrder,etaOrder,sourceRoot:r.global.Pi,sourceDerivative:derivative,
        ...receipt({body:derivative,coordinates:[X,eta],lower:[G.zero,q(-1)],upper:[Xplus,G.one]},'normalized-pressure')};
      pressureJets.push(row);
      for(let e=0;e+radialOrder+etaOrder<=m;e++)pressureNormalized.push({eulerOrder:e,radialOrder,etaOrder,profileBound:row.bound,cutoffWeight:weights.values[e],bound:G.mul(weights.values[e],row.bound)});
    }
    normalizedPressure.push({order:n,sourceRoot:r.global.Pi,jets:pressureJets,normalizedRows:pressureNormalized,
      bounds:Array.from({length:m+1},(_,k)=>throughBounds(pressureNormalized,k)),compactSupport:[G.zero,Xplus],
      zeroExtensionSuppliesEveryLargerFixedRadialRectangle:true});
    if(n>=2){
      if(canonicalStringify(r.stress.compactSupport)!==canonicalStringify([Xminus,Xplus]))
        fail('INVALID_SOURCE_CONSTRUCTION','The actual higher stress must keep the same compact interior support.');
      const quotientJets=[],directWeightedJets=[],normalizedRows=[],directNormalizedRows=[];
      for(const component of ['Ttheta','Tz']){
        const sourceRoot=r.stress[component],quotient=G.div(sourceRoot,zeta);
        for(let radialOrder=0;radialOrder<=m;radialOrder++)for(let etaOrder=0;radialOrder+etaOrder<=m;etaOrder++){
          let quotientDerivative=quotient,stressDerivative=sourceRoot;
          for(const[variable,count]of[[X,radialOrder],[eta,etaOrder]])for(let j=0;j<count;j++){
            quotientDerivative=G.derivative(quotientDerivative,variable);stressDerivative=G.derivative(stressDerivative,variable);
          }
          const rectangle={coordinates:[X,eta],lower:[Xminus,q(-1)],upper:[Xplus,G.one]},
            quotientRow={component,radialOrder,etaOrder,sourceRoot,quotient,...receipt({body:quotientDerivative,...rectangle},'higher-stress-quotient')},
            directRow={component,radialOrder,etaOrder,sourceRoot,sourceDerivative:stressDerivative,...receipt({body:G.div(stressDerivative,zeta),...rectangle},'higher-stress-direct-weight')};
          quotientJets.push(quotientRow);directWeightedJets.push(directRow);
          for(let e=0;e+radialOrder+etaOrder<=m;e++){
            normalizedRows.push({component,eulerOrder:e,radialOrder,etaOrder,profileBound:quotientRow.bound,cutoffWeight:weights.values[e],bound:G.mul(weights.values[e],quotientRow.bound)});
            directNormalizedRows.push({component,eulerOrder:e,radialOrder,etaOrder,profileBound:directRow.bound,cutoffWeight:weights.values[e],bound:G.mul(weights.values[e],directRow.bound)});
          }
        }
      }
      weightedStress.push({order:n,zeta,compactSupport:[Xminus,Xplus],quotientJets,directWeightedJets,normalizedRows,directNormalizedRows,
        bounds:Array.from({length:m+1},(_,k)=>throughBounds(normalizedRows,k)),directWeightedBounds:Array.from({length:m+1},(_,k)=>throughBounds(directNormalizedRows,k)),
        positiveZetaOnWholeRectangle:true,actualZeroExtensionAtBothSupportEnds:true,
        statement:'The complete derivatives of T_n/zeta and the separate derivatives of T_n divided by zeta are bounded. Original all-order Euler cutoff weights are included; either family may enter the same selected scale.'});
    }
    context.onProgress?.({phase:'actual-all-order-pressure-stress-seminorm',order:n,derivativeOrder:m,ftcRows:ftcRows.length,nodes:G.nodes.length});
  }
  const orderOneSeed=attachActualOrderOneWeightedStress(prepared,{derivativeOrder:0},context),
    n1Weighted=allFiniteOrderOneWeighted(positiveStress,orderOneSeed,m,maxJetRequests,receipt,context),roots={sourceZeta:zeta};
  for(const r of rows)r.bounds.forEach((b,k)=>{roots['actual_pressure_stress_B_'+r.order+'_'+k]=b;});
  for(const r of normalizedPressure)r.bounds.forEach((b,k)=>{roots['actual_normalized_pressure_B_'+r.order+'_'+k]=b;});
  for(const r of weightedStress){r.bounds.forEach((b,k)=>{roots['actual_weighted_stress_B_'+r.order+'_'+k]=b;});
    r.directWeightedBounds.forEach((b,k)=>{roots['actual_direct_weighted_stress_B_'+r.order+'_'+k]=b;});}
  n1Weighted.bounds.forEach((b,k)=>{roots['actual_order_one_weighted_B_'+k]=b;});
  if(zeta!==n1Weighted.zeta)fail('INVALID_SOURCE_CONSTRUCTION','Every positive order must use exactly the same original zeta.');
  const result={G,positiveStress,orderOneSeed,source:positiveStress.source,request:{throughOrder,derivativeOrder:m,maxProfileJets,maxJetRequests},
    domain:{q:'0<q<=1',eta:['-1','1'],cartesianProfileBox:box,cartesianXRange:[G.zero,G.mul(q(2),Xb)],stressInterior:[Xminus,Xplus],
      originalZeta:zeta,sourceSupportsProved:true,sourceEndpointSmoothness:'The SAME actual pressure primitive and signed forward/backward stress proof give all fixed smooth endpoint jets. The stresses vanish on an axis neighbourhood; no radial denominator is evaluated at the axis.',
      sourceGeometryBound:'The original 0<h<2^-4096 implies |1-2h*z^2|>1/2 on every radius-1/2 complex disk centered at eta in [-1,1]; Cauchy gives |partial_eta^j(1/L)|<=2*j!*2^j<=2*j!*8^j.'},
    rows,normalizedPressure,weightedStress,n1Weighted,ftcRows,roots,
    work:{requiredProfileJets,actualFTCRows:ftcRows.length,sourceSeedDerivativeOrder:0,sourceSeedFTCRows:orderOneSeed.terminal.terminalNorms.length+orderOneSeed.interior.length,...C.usage()},
    scope:{actualPressureStressPhysicalSeminorms:true,actualNormalizedPressureSeminorms:true,actualHigherWeightedStressSeminorms:throughOrder>=2,
      actualOrderOneWeightedEndpointSeminorms:true,allRequestedOrdersExecuted:m,mathematicalDerivativeOrderCap:null,
      arbitraryFiniteDerivativeAlgorithm:true,allSourceSmoothStressJoinsAuthenticated:true,completeOrderOneHeatRetained:true,
      sameOriginalZetaAtEveryOrder:true,finiteSourceGraphAndMaterializerBudgetsRetained:true,
      sourceConstantNumericalEvaluation:false,commonInfiniteCutoffsChosen:false,fullPhysicalResidualFlatness:false,
      wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false}};
  const packed=G.pack(roots,{schema:'MathScope.ActualPressureStressPhysicalSeminormsProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(result,{G,positiveStress,orderOneSeed,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});return result;
}

export function assertActualPressureStressPhysicalSeminorms(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.positiveStress!==result.positiveStress||s.orderOneSeed!==result.orderOneSeed||
    canonicalStringify(data(result))!==s.data||canonicalStringify(result.program)!==s.program||
    canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately produced actual pressure/stress finite seminorm family.');
  assertActualPositiveGlobalStress(result.positiveStress);assertActualOrderOneWeightedStress(result.orderOneSeed);return true;
}

export async function actualPressureStressPhysicalSeminormCertificate(result){
  assertActualPressureStressPhysicalSeminorms(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualPressureStressPhysicalSeminormCertificate/1',...data(result),
    graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
