/** Actual finite residual coefficients and literal stress FTC identities.
 * This additive bridge never supplies a forcing to make the equation true.
 * Its retained low-order defects are explicitly distinct from its bounded
 * high-order tail; the all-order flatness gate remains closed.
 */
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {sourceScaledOperators,buildActualOmegaCoefficientOverX} from './actual-continuation-exact-order-two-source.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {actualLeadingTargetOnSensitivityGraph} from './actual-covariance-sensitivity.mjs';
import {finiteActualResidualIndexLedger,physicalMonomialDerivativeWords,originalLeadingMomentStressIdentity,momentumDifferenceIdentity,reduceLiteralZeroDerivatives} from './actual-strengthened-background-kernels.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

const seals=new WeakMap();
const data=r=>({request:r.request,source:r.source,ledger:r.ledger,coefficients:r.coefficients,stressFTC:r.stressFTC,
  tailBounds:r.tailBounds,retainedObligations:r.retainedObligations,checks:r.checks,scope:r.scope,roots:r.roots});

function sharedBody(G,id){
  const n=G.nodes[id];if(n.op!=='actual_expression_partial')return id;
  const s=G.expressionSystems[n.args[0]];
  if(n.args[2].some(Boolean)||n.args[1].some((x,j)=>x!==s.parameters[j]))return id;
  return s.body;
}

/** Locate only genuine literal integrals in an algebraic primitive.
 * Shared integrand bodies stay closed until after the FTC differentiation.
 */
function primitiveIntegrals(G,id){
  const found=new Set(),seen=new Set();
  function visit(x){
    if(seen.has(x))return;seen.add(x);const {op,args}=G.nodes[x];
    if(op==='definite_integral'){found.add(x);return;}
    if(op==='add'||op==='multiply')args.forEach(visit);
    else if(op==='inverse'||op==='integer_power'||op==='sqrt_positive')visit(args[0]);
  }
  visit(id);return [...found];
}

/** Differentiate the ORIGINAL forward stress primitive, before simplifying
 * its density on the exact interior branch. No derivative is caller input.
 */
export function actualPositiveStressFTC(prepared){
  assertActualOrderInduction(prepared);const {G,records,bootstrap}=prepared,{X,eta}=bootstrap.constants,
    {Xminus,Xplus,Xb}=bootstrap.orderOne,c=(n,d=1)=>G.q(n,d),rows=[];
  for(const record of records.slice(1))for(const component of ['theta','z']){
    const n=record.order,root=component==='theta'?record.stress.Ttheta:record.stress.Tz,right=component==='theta'&&n===1?Xb:Xplus,
      branch=G.nodes[root],raw=component==='theta'?(n===1?record.stress.angular:record.stress.rawTheta):(n===1?record.stress.axial:record.stress.rawZ);
    if(branch.op!=='smooth_piecewise'||branch.args[0]!==X||branch.args[1]!==Xminus||branch.args[2]!==right||branch.args[3]!==G.zero||branch.args[5]!==G.zero)
      fail('INVALID_SOURCE_CONSTRUCTION','The actual positive stress must retain its original support branches.');
    const forward=branch.args[4],integrals=primitiveIntegrals(G,forward);
    if(integrals.length!==1)fail('INVALID_SOURCE_CONSTRUCTION','The original signed stress has exactly one literal forward primitive.');
    const integral=integrals[0],[integrand,variable,left,upper]=G.nodes[integral].args;
    if(left!==Xminus||upper!==X||G.nodes[variable].op!=='coordinate'||G.derivative(left,X)!==G.zero||G.derivative(right,eta)!==G.zero)
      fail('INVALID_SOURCE_CONSTRUCTION','The original stress FTC must retain its fixed-label endpoints.');
    const densityAtUpper=G.substitute(integrand,variable,X),materialized=sharedBody(G,densityAtUpper),
      support=G.choose(X,Xminus,right,G.zero,raw,G.zero),density=component==='theta'?G.mul(c(2),X,support):support;
    const densityCheck=sourceGraphRationalIdentity(G,G.sub(materialized,density),{atomicNodes:[raw,support]});
    const denominator=component==='theta'?G.mul(c(2),X):G.sqrt(G.mul(c(2),X));
    // First prove the denominator clears the literal source expression.
    // Then take its actual derivative, so the product terms cannot vanish
    // merely because a supplied derivative was chosen to cancel them.
    const primitiveCheck=sourceGraphRationalIdentity(G,G.add(G.mul(denominator,forward),integral),{atomicNodes:[integral]});
    const derivative=G.derivative(G.mul(denominator,forward),X),zeroReduction=reduceLiteralZeroDerivatives(G,derivative,{atomicNodes:[raw,integral,densityAtUpper]}),
      afterFTC=G.substitute(zeroReduction.value,densityAtUpper,materialized),interior=G.substitute(afterFTC,support,raw),
      expected=component==='theta'?G.mul(c(2),X,raw):raw,
      check=sourceGraphRationalIdentity(G,G.add(interior,expected),{atomicNodes:[raw,integral]}),
      negativeWrongSign=sourceGraphRationalIdentity(G,G.sub(interior,expected),{atomicNodes:[raw,integral]});
    if(!densityCheck.pass||!primitiveCheck.pass||!check.pass||negativeWrongSign.pass)
      fail('INTERNAL_VALIDATION','Actual signed stress FTC failed at n='+n+', '+component+': '+JSON.stringify({density:densityCheck.pass,primitive:primitiveCheck.pass,derivative:check.pass,negativeRejected:!negativeWrongSign.pass})+'.');
    rows.push({order:n,component,root,raw,forward,integral,densityAtUpper,materializedDensity:materialized,denominator,
      derivative,zeroReduction,interiorDerivative:interior,expectedNegativeDensity:expected,densityCheck,primitiveCheck,check,negativeWrongSign,
      openDomain:[Xminus,right],fixedLabelEndpoints:true,
      identity:component==='theta'?'d_X(2*X*T_n,theta)=-2*X*r_n,theta/R':'d_X(sqrt(2X)*T_n,z)=-r_n,z',
      outsideBranchesPreserved:true,globalGluingProvedByThisFTC:false});
  }
  return {schema:'MathScope.ActualPositiveStressFTC/1',rows,pass:rows.every(r=>r.check.pass&&r.densityCheck.pass&&r.primitiveCheck.pass),
    genuineSourceDerivatives:true,rawResidualConstructedIndependentlyBeforeIntegration:true,
    completeBoundaryMatchingCertified:false,remaining:'The inner restriction identity and conservative total moments must also give smooth gluing to both zero branches; interior FTC alone does not prove them.'};
}

/** Compile every residual coefficient of the actual finite uncut tuple.
 * The n>N values are its exact high-order tail. The n<=N values retain
 * their pressure/stress defects instead of setting them to zero by fiat.
 */
function actualFiniteCoefficients(prepared,N){
  const {G,records,bootstrap}=prepared,{X,eta}=bootstrap.constants,c=(n,d=1)=>G.q(n,d),{A,D}=G.core,h=G.parameter('h'),
    {T,Z}=sourceScaledOperators(G,X,eta),b=G.neg(G.add(A,c(1,2))),cc=G.neg(A),gain=n=>G.mul(c(2*n),h),
    F=records.slice(0,N+1).map(r=>r.global.F),U=records.slice(0,N+1).map(r=>r.global.U),v=records.slice(0,N+1).map(r=>r.global.v),
    leading=actualLeadingTargetOnSensitivityGraph(G,{background:{prepared},chart:{s:G.one,X,eta},constants:{h,A,D}}),
    Pi=[leading.Pi,...records.slice(1,N+1).map(r=>r.global.Pi)],thetaStress=[leading.raw[0],...records.slice(1,N+1).map(r=>r.stress.Ttheta)],
    axialStress=[leading.raw[1],...records.slice(1,N+1).map(r=>r.stress.Tz)],radius=G.sqrt(G.mul(c(2),X)),rows=[];
  const pairs=n=>Array.from({length:N+1},(_,i)=>[i,n-i]).filter(([,j])=>j>=0&&j<=N);
  for(let n=0;n<=2*N+1;n++){
    const angular=[],axial=[],radial=[],orderedPairs=pairs(n);
    if(n<=N){
      angular.push(T(G.add(b,gain(n)),F[n]),G.mul(c(-2),G.add(G.mul(X,G.derivative(G.derivative(F[n],X),X)),G.mul(c(2),G.derivative(F[n],X)))));
      axial.push(T(G.add(cc,gain(n)),U[n]),Z(G.add(G.mul(c(-2),A),gain(n)),Pi[n]),G.mul(c(-2),G.add(G.mul(X,G.derivative(G.derivative(U[n],X),X)),G.derivative(U[n],X))));
      radial.push(G.derivative(Pi[n],X));
    }
    for(const [i,j]of orderedPairs){
      angular.push(G.mul(v[i],G.add(G.mul(X,G.derivative(F[j],X)),F[j])),G.mul(U[i],Z(G.add(b,gain(j)),F[j])));
      axial.push(G.mul(X,v[i],G.derivative(U[j],X)),G.mul(U[i],Z(G.add(cc,gain(j)),U[j])));
      radial.push(G.neg(G.mul(F[i],F[j])));
    }
    if(n>0&&n-1<=N){
      angular.push(G.neg(Z(G.sub(G.add(b,gain(n-1)),D),Z(G.add(b,gain(n-1)),F[n-1]))));
      axial.push(G.neg(Z(G.sub(G.add(cc,gain(n-1)),D),Z(G.add(cc,gain(n-1)),U[n-1]))));
    }
    let omega=null;
    if(n>0){
      const k=n-1,pad=a=>Array.from({length:k+1},(_,j)=>j<=N?a[j]:G.zero);
      omega=buildActualOmegaCoefficientOverX(G,{order:k,X,eta,U:pad(U),v:pad(v)});
      radial.push(G.mul(c(1,2),omega.value));
    }
    const stressAngular=n<=N?G.div(G.derivative(G.mul(X,thetaStress[n]),X),X):G.zero,
      stressAxial=n<=N?G.derivative(G.mul(radius,axialStress[n]),X):G.zero,
      rawAngular=G.add(...angular),rawAxial=G.add(...axial),rawRadial=G.add(...radial);
    rows.push({order:n,orderedPairs,rawAngular,rawAxial,rawRadial,stressAngular,stressAxial,
      angular:G.share(G.add(rawAngular,stressAngular),[X,eta],'ActualFiniteResidualTheta_'+N+'_'+n),
      axial:G.share(G.add(rawAxial,stressAxial),[X,eta],'ActualFiniteResidualZ_'+N+'_'+n),
      radial:G.share(rawRadial,[X,eta],'ActualFiniteResidualRadial_'+N+'_'+n),omega,
      retained:n<=N,finiteTruncationZerosUsedOnlyAbove:N});
  }
  return {rows,leading,F,U,v,Pi,thetaStress,axialStress,
    exactScaling:{angular:'q^(-A-1+2*n*h)*(-y2,y1,0)*angular_n',axial:'q^(-A-1+2*n*h)*(0,0,axial_n)',radial:'q^(-2*A-1/2+2*n*h)*(y1,y2,0)*radial_n'},
    origin:'Independent expansion of the original Cartesian momentum into (5.6)/(5.9), retaining every ordered product, pressure derivative, signed stress divergence and shifted axial viscosity.'};
}

/** Source-generated FTC constants for the complete high-order residual
 * tail, including all physical mixed derivative words requested. The low
 * defects are explicitly kept outside this estimate.
 */
export function attachActualFiniteResidualBridge(prepared,input={},context={}){
  assertActualOrderInduction(prepared);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['truncationOrder','derivativeOrder','maxWords'].includes(k)))
    fail('INVALID_INPUT','Only the actual finite truncation and derivative budgets are accepted.');
  const N=input.truncationOrder??prepared.order,m=input.derivativeOrder??1,maxWords=input.maxWords??1024;
  if(!Number.isSafeInteger(N)||N<1||N>prepared.order||!Number.isSafeInteger(m)||m<0||m>8)
    fail('RESOURCE_LIMIT','Generate the complete finite source prefix and use a requested derivative representation through eight.');
  const {G,bootstrap}=prepared,{X,eta}=bootstrap.constants,c=(n,d=1)=>G.q(n,d),{A}=G.core,h=G.parameter('h'),
    progress=stage=>context.onProgress?.({stage,nodeCount:G.nodes.length}),support=actualSupportOrderProof(bootstrap.completedOrderOne),
    stressFTC=actualPositiveStressFTC(prepared),coefficients=actualFiniteCoefficients(prepared,N),ledger=finiteActualResidualIndexLedger({truncationOrder:N});
  progress('actual-finite-residual-coefficients');
  const x1=G.fresh('actual_residual_norm_y1'),x2=G.fresh('actual_residual_norm_y2'),e=G.fresh('actual_residual_norm_eta'),
    cartX=G.div(G.add(G.pow(x1,2),G.pow(x2,2)),c(2)),radius=G.sqrt(G.mul(c(2),support.endpoints.Xb)),
    at=body=>G.simultaneousSubstitute(body,[X,eta],[cartX,e]),box={coordinates:[x1,x2,e],lower:[G.neg(radius),G.neg(radius),c(-1)],upper:[radius,radius,G.one]},
    ftcRows=[],tailRows=[];
  for(const r of coefficients.rows.filter(r=>!r.retained)){
    const gain=G.mul(c(2*r.order),h),components=[
      {component:'angular_x1',body:G.neg(G.mul(x2,at(r.angular))),baseLoss:G.add(A,G.one)},
      {component:'angular_x2',body:G.mul(x1,at(r.angular)),baseLoss:G.add(A,G.one)},
      {component:'axial',body:at(r.axial),baseLoss:G.add(A,G.one)},
      {component:'radial_x1',body:G.mul(x1,at(r.radial)),baseLoss:G.add(G.mul(c(2),A),c(1,2))},
      {component:'radial_x2',body:G.mul(x2,at(r.radial)),baseLoss:G.add(G.mul(c(2),A),c(1,2))}
    ],componentRows=[];
    for(const component of components){
      context.checkCancelled?.();
      const words=physicalMonomialDerivativeWords(G,{body:component.body,exponent:G.sub(gain,component.baseLoss),x1,x2,eta:e,derivativeOrder:m,maxWords}),bounds=[];
      for(const word of words.rows){
        const receipt=rectangularSourceFTC(G,{body:word.body,...box});
        ftcRows.push({order:r.order,component:component.component,word:word.word,exponent:word.exponent,loss:word.loss,...receipt});bounds.push(receipt.bound);
      }
      componentRows.push({...component,words,bound:G.add(...bounds)});
    }
    tailRows.push({order:r.order,gain,components:componentRows,bound:G.add(...componentRows.map(c=>c.bound))});
    progress('actual-finite-residual-tail-n'+r.order);
  }
  const bound=G.add(...tailRows.map(r=>r.bound)),loss=G.add(G.mul(c(2),A),c(m+1)),gain=G.mul(c(2*(N+1)),h),
    leadingKernel=originalLeadingMomentStressIdentity(),differenceKernel=momentumDifferenceIdentity(),
    retainedObligations=coefficients.rows.filter(r=>r.retained).map(r=>({order:r.order,
      actualDefectRoots:{angular:r.angular,axial:r.axial,radial:r.radial},declaredZero:false,
      needed:r.order===0?'Bind the actual global leading M_X=U and Pi0_X=F0^2, then apply the independently verified original leading moment-stress identity.':'Bind each actual global primitive and all inner/exterior branches; interior stress FTC alone is insufficient.'}));
  const tailBounds={rows:tailRows,ftcRows,box,bound,gain,loss,
    statement:'For 0<q<=1, every requested physical derivative of the actual HIGH-ORDER residual tail is <=C_Nm*q^(2*(N+1)*h-(2*A+1+m)).',
    minimumOrder:N+1,physicalDerivativeOrder:m,allOrderedProductsRetained:true,axisRegularOmegaOverXUsed:true,
    analyticPremises:'The unchanged source coefficient functions have their original smooth Cartesian axis representatives and smooth compact extensions. The exact finite integrals retain these analytic source premises; no numerical quadrature or new Lean theorem is inferred.',
    exponentLossIndependentOfTruncationOrder:true,retainedDefectsIncludedInThisBound:false,fullFiniteResidualBoundEstablished:false};
  const checks=[
    {id:'all-original-stress-forward-integrals-differentiated',pass:stressFTC.pass},
    {id:'finite-convolution-ledger-is-complete',pass:ledger.pass&&coefficients.rows.length===2*N+2},
    {id:'tail-starts-strictly-above-constructed-order',pass:tailRows.length===N+1&&tailRows.every(r=>r.order>N)},
    {id:'every-tail-FTC-bound-is-coordinate-independent',pass:ftcRows.every(r=>G.freeCoordinates(r.bound).size===0)&&G.freeCoordinates(bound).size===0},
    {id:'original-leading-moment-operator-identity',pass:leadingKernel.pass},
    {id:'nonlinear-physical-residual-difference-includes-quadratic-tail',pass:differenceKernel.pass}
  ];
  if(!checks.every(c=>c.pass))fail('INTERNAL_VALIDATION','An actual residual-bridge source check failed.');
  const scope={actualFiniteResidualCoefficientBodiesConstructed:true,actualPositiveStressInteriorFTCEstablished:true,
    actualHighOrderResidualTailConstantsConstructed:true,actualTailPhysicalMixedDerivativesBounded:true,
    fullGlobalPressurePrimitiveIdentityCertified:false,actualFiniteResidualRetainedCoefficientsCancelled:false,
    allOrderLocallyFiniteResidualFlatnessCertified:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,
    sourceWeightsAssumedPositive:false,unchangedHistoricalSelector:true,newLeanKernelProof:false,wholeGN4Complete:false,m3MayStart:false};
  const roots={actualFiniteResidualTailBound:bound,actualFiniteResidualTailGain:gain,actualFiniteResidualTailLoss:loss};
  for(const r of coefficients.rows)for(const k of ['angular','axial','radial'])roots['finiteResidual_'+N+'_'+r.order+'_'+k]=r[k];
  const result={G,prepared,request:{truncationOrder:N,derivativeOrder:m,maxWords},source:{profileId:G.source.id,parameterExpressionSHA256:bootstrap.program.parameterExpressionSHA256,support},
    ledger,coefficients,stressFTC,tailBounds,retainedObligations,checks,scope,roots};
  const packed=G.pack(roots,{schema:'MathScope.ActualFiniteResidualBridgeProgram/1',compiler:'actual-background-residual-bridge.mjs:attachActualFiniteResidualBridge',...data(result),genericIdentities:{leadingKernel,differenceKernel}}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:nodes.slice()};
  seals.set(result,{G,prepared,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(data(result)),metadata:canonicalStringify(metadata),serialized:canonicalStringify(result.program)});
  progress('sealed-actual-finite-residual-bridge');return result;
}

export function assertActualFiniteResidualBridge(result){
  const s=seals.get(result);if(!s||s.G!==result.G||s.prepared!==result.prepared||canonicalStringify(data(result))!==s.data||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.nodes||!result.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged privately generated actual finite residual bridge.');
  const {nodes,...metadata}=result.program??{};if(!Array.isArray(nodes)||canonicalStringify(nodes)!==s.nodes||canonicalStringify(metadata)!==s.metadata)
    fail('INVALID_SOURCE_CONSTRUCTION','The exact residual program or its claimed scope was changed.');
  assertActualOrderInduction(s.prepared);return true;
}

export async function actualFiniteResidualBridgeCertificateFromProgram(result){
  assertActualFiniteResidualBridge(result);const s=seals.get(result);
  return {schema:'MathScope.ActualFiniteResidualBridgeCertificate/1',status:'COMPLETED_WITH_EXPLICIT_RETAINED_DEFECTS',pass:true,
    request:result.request,checks:result.checks,scope:result.scope,
    roots:result.roots,stressFTCRows:result.stressFTC.rows.map(r=>({order:r.order,component:r.component,root:r.root,integral:r.integral,raw:r.raw,openDomain:r.openDomain,pass:r.check.pass})),
    tail:{bound:result.tailBounds.bound,gain:result.tailBounds.gain,loss:result.tailBounds.loss,ftcCount:result.tailBounds.ftcRows.length,statement:result.tailBounds.statement,fullFiniteResidualBoundEstablished:false},
    retainedObligations:result.retainedObligations,
    graph:{sha256:await sha256(s.serialized),nodeCount:s.count,canonicalBytes:new TextEncoder().encode(s.serialized).byteLength,fixedCompilerPrefix:true}};
}
