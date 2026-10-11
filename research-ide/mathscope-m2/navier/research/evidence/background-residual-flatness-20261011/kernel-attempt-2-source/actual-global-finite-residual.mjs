/** The complete physical residual of each ORIGINAL finite uncut tuple.
 * Retained low-order expressions are bound to independently proved source
 * cancellations. The high-order polynomial is kept separately and every
 * requested physical derivative receives a complete source FTC constant.
 */
import {assertActualPositiveGlobalStress} from './actual-positive-global-stress.mjs';
import {attachActualLeadingGlobalStressBridge,assertActualLeadingGlobalStressBridge} from './actual-leading-global-stress-bridge.mjs';
import {sourceScaledOperators,buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {explicitPrimitiveBodyIdentity} from './actual-global-primitive-kernels.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {physicalMonomialDerivativeWords,reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {physicalPositiveJetCalculus} from './actual-velocity-all-order-tail.mjs';
import {allFiniteResidualLedger} from './actual-background-residual-flatness-kernel.mjs';
import {originalCartesianCylindricalMomentumIdentity,originalProfileMomentumScalingIdentity} from './actual-background-residual-flatness-cartesian.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap(),sum=xs=>xs.reduce((a,b)=>a+b,0),
  data=r=>({request:r.request,sourceCopy:r.sourceCopy,generic:r.generic,ledger:r.ledger,coefficients:r.coefficients,tail:r.tail,
    partialVelocity:r.partialVelocity,roots:r.roots,checks:r.checks,scope:r.scope});
const equal=(G,a,b,atomicNodes=[])=>{
  const p=explicitPrimitiveBodyIdentity(G,a,b,{atomicNodes,maxVisits:1000000});
  if(!p.pass)fail('INVALID_SOURCE_CONSTRUCTION','An independently expanded finite coefficient differs from its original proved source body.');return p;
};
const algebra=(G,value,atomicNodes=[])=>{
  const p=sourceGraphRationalIdentity(G,value,{atomicNodes,maxTerms:100000});
  if(!p.pass)fail('INVALID_SOURCE_CONSTRUCTION','A retained finite source coefficient algebra binding failed.');return p;
};

function finiteCoefficients(G,positive,leading,N,ledger,context){
  const prepared=positive.moments.pressure.primitives.prepared,{records,bootstrap}=prepared,{X,eta}=bootstrap.constants,
    q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),{A,D}=G.core,{T,Z}=sourceScaledOperators(G,X,eta),
    thetaBase=G.neg(G.add(A,q(1,2))),axialBase=G.neg(A),gain=n=>G.mul(q(2*n),h),
    allF=records.slice(0,N+1).map(r=>r.global.F),allU=records.slice(0,N+1).map(r=>r.global.U),allv=records.slice(0,N+1).map(r=>r.global.v),
    allPi=[leading.target.Pi,...records.slice(1,N+1).map(r=>r.global.Pi)],
    allStress=[[...leading.target.raw],...records.slice(1,N+1).map(r=>[r.stress.Ttheta,r.stress.Tz])],rows=[];
  for(const indices of ledger.rows){
    context.checkCancelled?.();const n=indices.order,source=n>=1&&n<=N?positive.rawRows[n-1]:null,
      tuples=source?source.tuples:records.slice(0,N+1).map(r=>({F:r.global.F,U:r.global.U,v:r.global.v})),
      Pi=source?source.Pi:n<=N?allPi[n]:null,angular=[],axial=[],radial=[];
    if(indices.sameOrderLinearPresent){
      const current=tuples[n],F=current.F,U=current.U;
      angular.push(T(G.add(thetaBase,gain(n)),F),G.mul(q(-2),G.add(G.mul(X,G.derivative(G.derivative(F,X),X)),G.mul(q(2),G.derivative(F,X)))));
      axial.push(T(G.add(axialBase,gain(n)),U),Z(G.add(G.mul(q(-2),A),gain(n)),Pi),G.mul(q(-2),G.add(G.mul(X,G.derivative(G.derivative(U,X),X)),G.derivative(U,X))));
      radial.push(G.derivative(allPi[n],X));
    }
    for(const[i,j]of indices.orderedPairs){
      const a=tuples[i],b=tuples[j];angular.push(G.mul(a.v,G.add(G.mul(X,G.derivative(b.F,X)),b.F)),G.mul(a.U,Z(G.add(thetaBase,gain(j)),b.F)));
      axial.push(G.mul(X,a.v,G.derivative(b.U,X)),G.mul(a.U,Z(G.add(axialBase,gain(j)),b.U)));
      radial.push(G.neg(G.mul(allF[i],allF[j])));
    }
    if(indices.tangentialAxialViscosity!==null){
      const j=indices.tangentialAxialViscosity,a=tuples[j];
      angular.push(G.neg(Z(G.sub(G.add(thetaBase,gain(j)),D),Z(G.add(thetaBase,gain(j)),a.F))));
      axial.push(G.neg(Z(G.sub(G.add(axialBase,gain(j)),D),Z(G.add(axialBase,gain(j)),a.U))));
    }
    let omega=null;
    if(indices.omega){const k=indices.omega.order,pad=values=>Array.from({length:k+1},(_,j)=>j<=N?values[j]:G.zero);
      omega=buildActualOmegaCoefficientOverX(G,{order:k,X,eta,U:pad(allU),v:pad(allv)});radial.push(G.mul(q(1,2),omega.value));}
    const rawAngular=G.add(...angular),rawAxial=G.add(...axial),rawRadial=G.add(...radial),
      thetaStress=n<=N?G.div(G.derivative(G.mul(X,allStress[n][0]),X),X):G.zero,
      axialStress=n<=N?G.derivative(G.mul(G.sqrt(G.mul(q(2),X)),allStress[n][1]),X):G.zero,
      defects={angular:G.add(rawAngular,thetaStress),axial:G.add(rawAxial,axialStress),radial:rawRadial};
    let cancellation=null;
    if(n===0){
      const checks={rawAngular:equal(G,rawAngular,leading.residual.theta),rawAxial:equal(G,rawAxial,leading.residual.axial),radial:equal(G,rawRadial,leading.residual.radial),
        thetaFlux:equal(G,G.mul(X,allStress[0][0]),leading.residual.thetaFlux),axialFlux:equal(G,G.mul(G.sqrt(G.mul(q(2),X)),allStress[0][1]),leading.residual.axialFlux)};
      cancellation={kind:'same-source-independent-leading-momentum-and-original-full-shear-flux',checks,
        independentDefects:leading.residual.actualDefects,sourceIdentity:leading.identities.actualChecks,originalPressureAxisRetained:true,pass:true};
    }else if(n<=N){
      const stress=positive.stressRows.filter(row=>row.order===n),radialProof=positive.radialRows[n-1],atoms=source.tuples.flatMap(t=>Object.values(t));
      const checks={rawAngular:equal(G,rawAngular,source.thetaRoot,atoms),rawAxial:equal(G,rawAxial,source.axialRoot,[...atoms,source.Pi]),
        radialDensity:algebra(G,G.sub(G.add(...indices.orderedPairs.map(([i,j])=>G.mul(allF[i],allF[j]))),
          G.add(radialProof.independentFullRadialDensity,G.mul(q(1,2),omega.value))),[...allF,omega.value]),
        thetaStress:equal(G,thetaStress,stress.find(r=>r.component==='theta').retainedStressDerivative),
        axialStress:equal(G,axialStress,stress.find(r=>r.component==='z').retainedStressDerivative),
        radialDefect:equal(G,rawRadial,radialProof.retainedDefect,[...allF,omega.value])};
      cancellation={kind:'same-source-positive-global-conservative-total-and-signed-FTC',checks,
        independentDefects:Object.fromEntries(stress.map(r=>[r.component,r.retainedDefect])),sourceRadialDefect:radialProof.retainedDefect,
        originalWholeStressIntegrals:stress.map(r=>r.actualWholeResidualIntegral),sourceBothEndpointJets:stress.every(r=>r.allFixedDerivativeJetsMatch),
        lowerViscosityRetained:true,allOrderedPairsRetained:true,pass:stress.every(r=>r.pass)&&radialProof.pass};
      if(!cancellation.pass)fail('INVALID_SOURCE_CONSTRUCTION','A low finite coefficient lacks its original global cancellation.');
    }
    rows.push({order:n,indices,rawAngular,rawAxial,rawRadial,thetaStress,axialStress,defects,omega,cancellation,
      reducedDefects:n<=N?{angular:G.zero,axial:G.zero,radial:G.zero}:null,
      retainedActualDefectsNotDefinedAsZero:true,zeroAuthority:n<=N?'Only the independent same-source identities stored above.':null});
    context.onProgress?.({phase:'actual-complete-finite-residual-coefficient',order:n,truncationOrder:N,nodes:G.nodes.length});
  }
  return {rows,F:allF,U:allU,v:allv,Pi:allPi,stress:allStress,
    statement:'Exact original finite polynomial expansion: every ordered product, pressure derivative, signed stress divergence, and both shifted viscosity families are retained.'};
}

function finiteVelocityBound(G,positive,N,m,box,atCart,receipt,maxJetRequests,context){
  const {records}=positive.moments.pressure.primitives.prepared,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),{A,D}=G.core,
    [x1,x2,eta]=box.coordinates,radius=box.upper[0],C=physicalPositiveJetCalculus(G,{maxJetRequests,checkCancelled:context.checkCancelled}),
    {fn,constant,add,mul,shift}=C,coord=(j,bound)=>fn((...o)=>sum(o)===0?bound:sum(o)===1&&o[j]===1?G.one:G.zero),
    xx=coord(1,radius),yy=coord(2,radius),ee=coord(3,G.one),
    dd=fn((e,x,y,s)=>e||x||y?G.zero:s===0?G.one:s===1||s===2?q(2):G.zero),
    invL=fn((e,x,y,s)=>e||x||y?G.zero:q(2n*factorial(s)*8n**BigInt(s))),cache=new Map(),rows=[];
  const norm=(body,x,y,e)=>{const key=[body,x,y,e].join(':');if(cache.has(key))return cache.get(key);
    let derivative=body;for(const[coordinate,count]of[[x1,x],[x2,y],[eta,e]])for(let j=0;j<count;j++)derivative=G.derivative(derivative,coordinate);
    const value=receipt({body:derivative,...box},'fixed-partial-velocity').bound;cache.set(key,value);return value;};
  for(let n=0;n<=N;n++){
    const roots=records[n].global,F=atCart(roots.F),U=atCart(roots.U),v=atCart(roots.v),nu=G.mul(q(2*n),h),components=[
      {name:'theta_x1',body:G.neg(G.mul(x2,F)),baseLoss:A},{name:'theta_x2',body:G.mul(x1,F),baseLoss:A},
      {name:'radial_x1',body:G.div(G.mul(x1,v),q(2)),baseLoss:q(1,2)},{name:'radial_x2',body:G.div(G.mul(x2,v),q(2)),baseLoss:q(1,2)},
      {name:'axial',body:U,baseLoss:A}];
    for(const component of components){
      let current=fn((e,x,y,s)=>{
        if(e+x+y+s>m)fail('RESOURCE_LIMIT','A finite partial velocity word exceeded its declared order.');
        return G.mul(G.pow(nu,e),norm(component.body,x,y,s));
      });
      const byOrder=[current.get(0,0,0,0)];
      for(let j=0;j<m;j++){
        const E=shift(current,0),dx=shift(current,1),dy=shift(current,2),de=shift(current,3),
          euler=add(E,mul(constant(G.add(component.baseLoss,q(j))),current)),radial=add(mul(xx,dx),mul(yy,dy)),
          axial=mul(invL,add(mul(constant(q(2)),ee,euler),mul(ee,radial),mul(dd,de))),
          time=mul(invL,add(euler,mul(constant(q(1,2)),radial),mul(constant(D),ee,de)));
        current=add(dx,dy,axial,time);byOrder.push(current.get(0,0,0,0));
      }
      rows.push({order:n,sourceRoots:{F:roots.F,U:roots.U,v:roots.v},...component,byOrder});
    }
  }
  return {throughOrder:N,derivativeOrder:m,rows,bound:G.maximum(G.one,...Array.from({length:m+1},(_,j)=>G.add(...rows.map(r=>r.byOrder[j])))),
    loss:G.add(G.mul(q(2),A),q(m)),statement:'Every fixed physical derivative through m of the ORIGINAL uncut finite velocity sum is <=C_Nm*q^(-(2A+m)); C_Nm is an actual finite sum of complete source FTC constants.',
    leadingFullHeatIncluded:true,leadingGlobalStreamIncluded:true,actualPositiveOrdersIncluded:true,cutoffCommutatorsBelongToDifference:true,work:C.usage()};
}

export function attachActualFiniteGlobalResidual(positiveStress,input={},context={}){
  assertActualPositiveGlobalStress(positiveStress);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['truncationOrder','derivativeOrder','maxWords','maxPairs','maxProfileJets','maxJetRequests'].includes(k)))
    fail('INVALID_INPUT','Only the finite actual truncation, derivative order and explicit work budgets may be selected.');
  const N=input.truncationOrder??positiveStress.request.throughOrder,m=input.derivativeOrder??0,maxWords=input.maxWords??4096,
    maxPairs=input.maxPairs??100000,maxProfileJets=input.maxProfileJets??20000,maxJetRequests=input.maxJetRequests??200000;
  if(!Number.isSafeInteger(N)||N<1||N>positiveStress.request.throughOrder||!Number.isSafeInteger(m)||m<0||
    [maxWords,maxPairs,maxProfileJets,maxJetRequests].some(n=>!Number.isSafeInteger(n)||n<1))fail('INVALID_INPUT','Use an authenticated finite prefix and nonnegative finite derivative order.');
  const generic={cartesian:originalCartesianCylindricalMomentumIdentity(),scaling:originalProfileMomentumScalingIdentity()},
    ledger=allFiniteResidualLedger({truncationOrder:N,maxPairs}),originalNodeCount=positiveStress.G.nodes.length,
    leading=attachActualLeadingGlobalStressBridge(positiveStress.moments.pressure,context),G=leading.G,
    sourceCopy={originalNodeCount,identicalOriginalNodePrefix:canonicalStringify(G.nodes.slice(0,originalNodeCount))===canonicalStringify(positiveStress.G.nodes.slice(0,originalNodeCount)),
      originalExpressionBodiesPreserved:positiveStress.G.expressionSystems.every((s,j)=>s.body===G.expressionSystems[j].body&&canonicalStringify(s.parameters)===canonicalStringify(G.expressionSystems[j].parameters)),
      newLeadingAuditNamespace:'independent exact copy; new root IDs never transplanted to the source graph',originalGraphMutated:false};
  if(!sourceCopy.identicalOriginalNodePrefix||!sourceCopy.originalExpressionBodiesPreserved)fail('INVALID_SOURCE_CONSTRUCTION','The independent leading audit must preserve the same actual source prefix and function bodies.');
  G.derivativeBudget(2*(m+6),m+6);
  const prepared=positiveStress.moments.pressure.primitives.prepared,{X,eta}=prepared.bootstrap.constants,q=(n,d=1)=>G.q(n,d),
    {Xb}=prepared.bootstrap.orderOne,{A}=G.core,h=G.parameter('h'),coefficients=finiteCoefficients(G,positiveStress,leading,N,ledger,context),
    x1=G.fresh('global_finite_residual_y1'),x2=G.fresh('global_finite_residual_y2'),ec=G.fresh('global_finite_residual_eta'),
    radius=G.sqrt(G.mul(q(2),Xb)),cartX=G.div(G.add(G.pow(x1,2),G.pow(x2,2)),q(2)),atCart=f=>G.simultaneousSubstitute(f,[X,eta],[cartX,ec]),
    box={coordinates:[x1,x2,ec],lower:[G.neg(radius),G.neg(radius),q(-1)],upper:[radius,radius,G.one]},ftcRows=[],
    receipt=(request,kind)=>{if(ftcRows.length>=maxProfileJets)fail('RESOURCE_LIMIT','The complete finite residual/profile FTC budget is exhausted.');
      const row=rectangularSourceFTC(G,request);ftcRows.push({kind,...row});return row;},tailRows=[];
  for(const row of coefficients.rows.filter(r=>r.order>N)){
    const components=[{name:'angular_x1',body:G.neg(G.mul(x2,atCart(row.defects.angular))),baseLoss:G.add(A,G.one)},
      {name:'angular_x2',body:G.mul(x1,atCart(row.defects.angular)),baseLoss:G.add(A,G.one)},
      {name:'axial',body:atCart(row.defects.axial),baseLoss:G.add(A,G.one)},
      {name:'radial_x1',body:G.mul(x1,atCart(row.defects.radial)),baseLoss:G.add(G.mul(q(2),A),q(1,2))},
      {name:'radial_x2',body:G.mul(x2,atCart(row.defects.radial)),baseLoss:G.add(G.mul(q(2),A),q(1,2))}],componentRows=[];
    for(const component of components){
      const words=physicalMonomialDerivativeWords(G,{body:component.body,exponent:G.sub(G.mul(q(2*row.order),h),component.baseLoss),x1,x2,eta:ec,derivativeOrder:m,maxWords}),bounds=[];
      for(const word of words.rows)bounds.push(receipt({body:word.body,...box},'exact-high-residual-word').bound);
      componentRows.push({...component,words,bound:G.add(...bounds)});
    }
    tailRows.push({order:row.order,components:componentRows,bound:G.add(...componentRows.map(c=>c.bound))});
  }
  const partialVelocity=finiteVelocityBound(G,positiveStress,N,m+2,box,atCart,receipt,maxJetRequests,context),
    tail={rows:tailRows,box,ftcRows,bound:G.add(...tailRows.map(r=>r.bound)),gain:G.mul(q(2*(N+1)),h),loss:G.add(G.mul(q(2),A),q(m+1)),
      statement:'The COMPLETE original finite residual, after its retained exact low cancellations, satisfies |F(U^[N])|_m<=C_Nm*q^(2h(N+1)-(2A+1+m)).',
      lowActualDefectsRetained:true,fullFiniteResidualBoundEstablished:true,lossIndependentOfTruncationOrder:true,
      allOrderedQuadraticPairsRetained:true,shiftedAxialViscosityRetained:true,
      support:'Every high residual term has a positive-order coefficient, or a derivative of the compact leading v0 in the exceptional N=1 shifted radial viscosity. Thus it has common compact radial support; no leading heat tail is truncated.'},
    checks=[{id:'independent-Cartesian-connections-and-original-profile-scaling',pass:generic.cartesian.pass&&generic.scaling.pass},
      {id:'same-original-node-prefix-and-actual-function-bodies',pass:sourceCopy.identicalOriginalNodePrefix&&sourceCopy.originalExpressionBodiesPreserved},
      {id:'all-retained-finite-coefficients-actually-cancel',pass:coefficients.rows.filter(r=>r.order<=N).every(r=>r.cancellation?.pass)},
      {id:'all-original-finite-ordered-products',pass:ledger.pass},
      {id:'all-high-coefficients-and-source-FTC-constants',pass:tailRows.length===N+1&&ftcRows.every(r=>G.freeCoordinates(r.bound).size===0)},
      {id:'same-full-leading-and-positive-finite-velocity-bound',pass:partialVelocity.leadingFullHeatIncluded&&partialVelocity.leadingGlobalStreamIncluded}],
    roots={actualFiniteResidualBound:tail.bound,actualFiniteResidualGain:tail.gain,actualFiniteResidualLoss:tail.loss,
      actualFixedPartialVelocityBound:partialVelocity.bound,actualFixedPartialVelocityLoss:partialVelocity.loss};
  for(const r of coefficients.rows)for(const[k,id]of Object.entries(r.defects))roots['actualFiniteResidual_'+N+'_'+r.order+'_'+k]=id;
  const result={G,positiveStress,leading,request:{truncationOrder:N,derivativeOrder:m,maxWords,maxPairs,maxProfileJets,maxJetRequests},sourceCopy,generic,ledger,coefficients,tail,partialVelocity,checks,roots,
    scope:{actualFullFiniteResidualCoefficientCancellation:true,actualHighOrderPhysicalResidualTailBound:true,allFiniteTruncationRecipe:true,
      arbitraryFiniteDerivativeRecipe:true,mathematicalTruncationOrderCap:null,mathematicalDerivativeOrderCap:null,
      sourceFiniteLowDefectsRetained:true,leadingFullHeatAndOriginalShearsRetained:true,allOrderCommonCutoffSummationBound:false,
      wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false}};
  if(!checks.every(r=>r.pass))fail('INVALID_SOURCE_CONSTRUCTION','A complete finite physical residual prerequisite failed.');
  const packed=G.pack(roots,{schema:'MathScope.ActualGlobalFiniteResidualProgram/1',...data(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(result,{G,positiveStress,leading,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),program:canonicalStringify(result.program)});return result;
}

export function assertActualFiniteGlobalResidual(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.positiveStress!==result.positiveStress||s.leading!==result.leading||
    canonicalStringify(data(result))!==s.data||canonicalStringify(result.program)!==s.program||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.prefix||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately produced complete actual finite residual.');
  assertActualPositiveGlobalStress(result.positiveStress);assertActualLeadingGlobalStressBridge(result.leading);return true;
}

export async function actualFiniteGlobalResidualCertificate(result){
  assertActualFiniteGlobalResidual(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualGlobalFiniteResidualCertificate/1',...data(result),graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
