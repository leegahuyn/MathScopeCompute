/** Actual coefficient seminorms for the physical summation clauses (5.37).
 *
 * The constants below are finite integrals of derivatives of the retained
 * source functions. They are not decimal evaluations or caller-supplied
 * bounds. A Cartesian representative is used before taking derivatives,
 * including at the axis. The original positive h is never replaced by zero.
 */
import {assertActualOrderInduction} from './actual-residual-order-induction-source.mjs';
import {sourceNormalizedCutoffWeights} from './actual-residual-order-induction-kernels.mjs';
import {attachActualInductionNorms} from './actual-residual-order-induction-norms.mjs';
import {attachActualNormalizedCutoffs} from './actual-residual-order-induction-cutoffs.mjs';
import {actualSupportOrderProof} from './actual-continuation-exact-support.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap();
const selectorSeals=new WeakMap();
const binomial=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));
const key=orders=>orders.join(':');
const sum=orders=>orders.reduce((a,b)=>a+b,0);

/** Rectangular FTC inequality, retaining every nonempty face integral.
 * For d coordinates: f(x)=sum_S Integral_[a_S,x_S] partial_S f(t_S,a_-S).
 * Replace each absolute value by sqrt(1+value^2) and each upper endpoint
 * by the full box endpoint. The result bounds sup |f| on the entire box.
 * Continuity of the mixed derivatives and ordered endpoints are premises;
 * this GENERIC operation does not authenticate an arbitrary supplied box.
 */
export function rectangularSourceFTC(G,{body,coordinates,lower,upper}={}){
  if(!Number.isSafeInteger(body)||!G.nodes[body]||!Array.isArray(coordinates)||coordinates.length<1||coordinates.length>3||
     new Set(coordinates).size!==coordinates.length||coordinates.some(x=>G.nodes[x]?.op!=='coordinate')||
     !Array.isArray(lower)||!Array.isArray(upper)||lower.length!==coordinates.length||upper.length!==coordinates.length||
     [...lower,...upper].some(x=>!Number.isSafeInteger(x)||!G.nodes[x]))
    fail('INVALID_INPUT','FTC needs a retained body and a complete one-, two-, or three-dimensional rectangle.');
  const set=new Set(coordinates);
  if([...G.freeCoordinates(body)].some(x=>!set.has(x))||[...lower,...upper].some(x=>G.freeCoordinates(x).size))
    fail('INVALID_INPUT','The source FTC body has only the declared coordinates and its box has no free coordinates.');
  const faces=[];
  for(let mask=0;mask<(1<<coordinates.length);mask++){
    let derivative=body;
    const selected=[];
    for(let j=0;j<coordinates.length;j++)if(mask&(1<<j)){derivative=G.derivative(derivative,coordinates[j]);selected.push(j);}
    const integration=selected.map(j=>G.fresh('physical_norm_face_'+mask+'_'+j));
    const argumentsAtFace=coordinates.map((_,j)=>selected.includes(j)?integration[selected.indexOf(j)]:lower[j]);
    const atFace=G.simultaneousSubstitute(derivative,coordinates,argumentsAtFace);
    let upperBound=G.sqrt(G.add(G.one,G.pow(atFace,2)));
    for(let k=selected.length-1;k>=0;k--){const j=selected[k];upperBound=G.integral(upperBound,integration[k],lower[j],upper[j]);}
    faces.push({mask,derivative,selectedCoordinates:selected.map(j=>coordinates[j]),upperBound});
  }
  const bound=G.add(...faces.map(x=>x.upperBound));
  if(G.freeCoordinates(bound).size)fail('INTERNAL_VALIDATION','The FTC constant must be independent of every physical/profile coordinate.');
  return {body,coordinates:[...coordinates],lower:[...lower],upper:[...upper],faces,bound,
    inequality:'sup_box |body| <= sum of all anchored FTC face integrals of sqrt(1+mixedDerivative^2)',
    finiteExactIntegral:true,decimalEvaluation:false,sourceAuthenticated:false};
}

function positiveFourJetCalculus(G){
  const q=(n,d=1)=>G.q(n,d);
  const fn=producer=>{const cache=new Map();return {get(...orders){
    if(orders.length!==4||orders.some(x=>!Number.isSafeInteger(x)||x<0))fail('INVALID_INPUT','Use Euler, x1, x2, eta derivative orders.');
    const k=key(orders);if(!cache.has(k))cache.set(k,producer(...orders));return cache.get(k);
  }};};
  const constant=v=>fn((...o)=>sum(o)?G.zero:v);
  const add=(...fs)=>fn((...o)=>G.add(...fs.map(f=>f.get(...o))));
  const multiply=(f,g)=>fn((e,x,y,s)=>{
    const terms=[];
    for(let a=0;a<=e;a++)for(let b=0;b<=x;b++)for(let c=0;c<=y;c++)for(let d=0;d<=s;d++)
      terms.push(G.mul(q(binomial(e,a)*binomial(x,b)*binomial(y,c)*binomial(s,d)),f.get(a,b,c,d),g.get(e-a,x-b,y-c,s-d)));
    return G.add(...terms);
  });
  const mul=(...fs)=>fs.reduce(multiply,constant(G.one));
  const shift=(f,j)=>fn((...o)=>{o[j]++;return f.get(...o);});
  return {fn,constant,add,mul,shift};
}

const binding=r=>canonicalStringify({request:r.request,sourceProfile:r.sourceProfile,parameterExpressionSHA256:r.parameterExpressionSHA256,
  domain:r.domain,supportOrder:r.supportOrder,rows:r.rows,weightedStress:r.weightedStress,ftcRows:r.ftcRows,roots:r.roots,scope:r.scope});

/** Constants for an authenticated, already generated actual coefficient
 * prefix. Only representation budgets are supplied; no source, stress,
 * derivative, norm, or positivity certificate is accepted from the caller.
 */
export function attachActualBackgroundPhysicalSeminorms(prepared,input={},context={}){
  assertActualOrderInduction(prepared);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['throughOrder','derivativeOrder'].includes(k)))
    fail('INVALID_INPUT','Only throughOrder and derivativeOrder select an actual physical seminorm prefix.');
  const throughOrder=input.throughOrder??prepared.order,derivativeOrder=input.derivativeOrder??2;
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>prepared.order||!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||derivativeOrder>16)
    fail('RESOURCE_LIMIT','Generate the complete requested source prefix and use a finite physical derivative budget through sixteen.');
  const {G,bootstrap,records}=prepared,q=(n,d=1)=>G.q(n,d),{X,eta}=bootstrap.constants,{A,D,L}=G.core,h=G.parameter('h');
  const supportOrder=actualSupportOrderProof(bootstrap.completedOrderOne);
  const x1=G.fresh('physical_norm_cartesian_x1'),x2=G.fresh('physical_norm_cartesian_x2'),etaC=G.fresh('physical_norm_eta');
  const Xb=bootstrap.orderOne.Xb,Xminus=bootstrap.orderOne.Xminus,Xplus=bootstrap.orderOne.Xplus;
  if([Xb,Xminus,Xplus].some(x=>!G.nodes[x]))fail('INVALID_SOURCE_CONSTRUCTION','The original compact supports and stress annulus are required.');
  if(!supportOrder.pass||supportOrder.endpoints.Xb!==Xb||supportOrder.endpoints.Xminus!==Xminus||supportOrder.endpoints.Xplus!==Xplus)
    fail('INVALID_SOURCE_CONSTRUCTION','The actual source endpoint inequalities must bind this same coefficient prefix.');
  const radius=G.sqrt(G.mul(q(2),Xb)),cartX=G.div(G.add(G.pow(x1,2),G.pow(x2,2)),q(2));
  const atCart=body=>G.simultaneousSubstitute(body,[X,eta],[cartX,etaC]);
  const box={coordinates:[x1,x2,etaC],lower:[G.neg(radius),G.neg(radius),q(-1)],upper:[radius,radius,G.one]};
  const C=positiveFourJetCalculus(G),{fn,constant,add,mul,shift}=C;
  const coord=(j,upper)=>fn((...o)=>sum(o)===0?upper:sum(o)===1&&o[j]===1?G.one:G.zero);
  const xx=coord(1,radius),yy=coord(2,radius),ee=coord(3,G.one);
  const dd=fn((e,x,y,s)=>e||x||y?G.zero:s===0?G.one:s===1||s===2?q(2):G.zero);
  // On |eta|<=1, h<1/16. The disk of radius 1/2 at each real eta
  // has |1-2h*z^2|>1/2. Cauchy's estimate is <=2*s!*2^s;
  // the retained (larger) 2*s!*8^s bound is therefore valid.
  const invL=fn((e,x,y,s)=>e||x||y?G.zero:q(2n*factorial(s)*8n**BigInt(s)));
  const derivativeCache=new Map(),ftcCache=new Map(),ftcRows=[];
  function profileNorm(body,x,y,s){
    const k=body+':'+[x,y,s].join(':');
    if(!ftcCache.has(k)){
      let jet=body;
      for(const [variable,count]of [[x1,x],[x2,y],[etaC,s]])for(let j=0;j<count;j++)jet=G.derivative(jet,variable);
      derivativeCache.set(k,jet);
      const receipt=rectangularSourceFTC(G,{body:jet,...box});ftcRows.push({sourceBody:body,orders:[x,y,s],...receipt});ftcCache.set(k,receipt.bound);
    }
    return ftcCache.get(k);
  }
  const rows=[];
  for(let n=1;n<=throughOrder;n++){
    context.checkCancelled?.();const record=records[n],g=record.global;
    if(!g.completed||!g.actualMomentChecks?.every(c=>c.pass))fail('INVALID_SOURCE_CONSTRUCTION','Every actual moment repair must precede its physical seminorm.');
    const average=g.average;
    if(!G.nodes[average])fail('INVALID_SOURCE_CONSTRUCTION','The original smooth stream average at the axis is missing.');
    const F=atCart(g.F),U=atCart(g.U),v=atCart(g.v),av=atCart(average),pi=atCart(g.Pi),etaOverL=atCart(G.div(eta,L));
    const components=[
      {name:'potential_x1',body:G.neg(G.div(G.mul(x2,av),q(2))),baseLoss:h,cutoff:'ordinary',sourceRoots:[g.M,average]},
      {name:'potential_x2',body:G.div(G.mul(x1,av),q(2)),baseLoss:h,cutoff:'ordinary',sourceRoots:[g.M,average]},
      {name:'angular_x1',body:G.neg(G.mul(x2,F)),baseLoss:A,cutoff:'ordinary',sourceRoots:[g.F]},
      {name:'angular_x2',body:G.mul(x1,F),baseLoss:A,cutoff:'ordinary',sourceRoots:[g.F]},
      {name:'radial_x1',body:G.div(G.mul(x1,v),q(2)),baseLoss:q(1,2),cutoff:'ordinary',sourceRoots:[g.v]},
      {name:'radial_x2',body:G.div(G.mul(x2,v),q(2)),baseLoss:q(1,2),cutoff:'ordinary',sourceRoots:[g.v]},
      {name:'extra_stream_x1',body:G.neg(G.mul(x1,etaOverL,av)),baseLoss:q(1,2),cutoff:'extra',sourceRoots:[g.M,average]},
      {name:'extra_stream_x2',body:G.neg(G.mul(x2,etaOverL,av)),baseLoss:q(1,2),cutoff:'extra',sourceRoots:[g.M,average]},
      {name:'axial',body:U,baseLoss:A,cutoff:'ordinary',sourceRoots:[g.U]},
      {name:'pressure',body:pi,baseLoss:G.mul(q(2),A),cutoff:'ordinary',sourceRoots:[g.Pi]},
      {name:'stress_theta',body:atCart(record.stress.Ttheta),baseLoss:G.add(A,q(1,2)),cutoff:'ordinary',sourceRoots:[record.stress.Ttheta]},
      {name:'stress_z',body:atCart(record.stress.Tz),baseLoss:G.add(A,q(1,2)),cutoff:'ordinary',sourceRoots:[record.stress.Tz]}
    ];
    const weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder},context);
    const polynomial=c=>G.add(...c.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k))));
    const ordinary=weights.weights.map(w=>polynomial(w.polynomialInSourceH)),extra=weights.weights.map(w=>polynomial(w.extraPotentialCutoffPolynomialInSourceH));
    const componentRows=[];
    for(const component of components){
      context.checkCancelled?.();const W=component.cutoff==='extra'?extra:ordinary;
      let current=fn((e,x,y,s)=>{
        if(e+x+y+s>derivativeOrder||W[e]===undefined)fail('RESOURCE_LIMIT','A physical derivative requested an unconstructed source jet.');
        return G.mul(W[e],profileNorm(component.body,x,y,s));
      });
      const byOrder=[current.get(0,0,0,0)];
      for(let j=0;j<derivativeOrder;j++){
        const E=shift(current,0),dx=shift(current,1),dy=shift(current,2),de=shift(current,3),loss=constant(G.add(component.baseLoss,q(j)));
        const euler=add(E,mul(loss,current)),radial=add(mul(xx,dx),mul(yy,dy));
        const axial=mul(invL,add(mul(constant(q(2)),ee,euler),mul(ee,radial),mul(dd,de)));
        const time=mul(invL,add(euler,mul(constant(q(1,2)),radial),mul(constant(D),ee,de)));
        current=add(dx,dy,axial,time);byOrder.push(current.get(0,0,0,0));
      }
      componentRows.push({...component,byOrder});
    }
    // A Cartesian velocity component is the sum of angular, radial and
    // extra-stream pieces. Taking a maximum of the separate pieces would
    // lose that sum; the sum below also safely bounds every other tuple entry.
    const bounds=Array.from({length:derivativeOrder+1},(_,m)=>G.maximum(G.one,...Array.from({length:m+1},(_,j)=>G.add(...componentRows.map(r=>r.byOrder[j])))));
    rows.push({order:n,components:componentRows,bounds,cutoffWeights:weights,
      exponentGain:G.mul(q(2*n),h),physicalLosses:Array.from({length:derivativeOrder+1},(_,m)=>G.add(G.mul(q(2),A),q(m))),
      statement:'Every Cartesian/time derivative through m of the cutoff physical tuple is <=B_nm*q^(2*n*h-(2*A+m)), 0<q<=1.',
      radialCutoffCommutatorIncluded:true,cartesianAxisRepresentativeUsed:true,sourceProfilesReplacedByBounds:false});
  }

  // Higher-order stress has one common compact INTERIOR support. We retain
  // the exact original zeta and bind the full quotient, not sampled values.
  const a=G.log(G.div(X,G.parameter('Xa'))),b=G.log(G.div(Xb,X));
  const zeta=G.exp(G.neg(G.add(G.div(G.pow(G.parameter('t1'),2),G.pow(a,2)),G.div(q(4),G.pow(b,2)))));
  const weightedStress=[];
  for(let n=2;n<=throughOrder;n++){
    const r=records[n];
    if(canonicalStringify(r.stress.compactSupport)!==canonicalStringify([Xminus,Xplus]))fail('INVALID_SOURCE_CONSTRUCTION','The higher-order stress must retain its original interior support.');
    const components=[];
    for(const name of ['Ttheta','Tz']){
      const body=G.div(r.stress[name],zeta),jets=[];
      for(let radial=0;radial<=derivativeOrder;radial++)for(let axial=0;axial+radial<=derivativeOrder;axial++){
        let derivative=body;for(let k=0;k<radial;k++)derivative=G.derivative(derivative,X);for(let k=0;k<axial;k++)derivative=G.derivative(derivative,eta);
        const receipt=rectangularSourceFTC(G,{body:derivative,coordinates:[X,eta],lower:[Xminus,q(-1)],upper:[Xplus,G.one]});
        jets.push({radialOrder:radial,etaOrder:axial,...receipt});
      }
      components.push({name,sourceRoot:r.stress[name],body,jets});
    }
    weightedStress.push({order:n,zeta,components,compactSupport:[Xminus,Xplus],
      positiveZetaOnWholeIntegrationRectangle:true,orderOneIncluded:false,zeroExtensionOutsideInteriorSupport:true,
      bounds:Array.from({length:derivativeOrder+1},(_,m)=>G.maximum(G.one,...components.flatMap(c=>c.jets.filter(j=>j.radialOrder+j.etaOrder<=m).map(j=>j.bound))))});
  }
  const roots={};for(const r of rows)r.bounds.forEach((v,m)=>{roots['physical_B_'+r.order+'_'+m]=v;});
  for(const r of weightedStress)r.bounds.forEach((v,m)=>{roots['weighted_stress_B_'+r.order+'_'+m]=v;});
  const domain={q:'0<q<=1',profileEta:['-1','1'],cartesianProfileBox:box,stressInterior:[Xminus,Xplus],
    sourceRadialSupport:Xb,cartesianBoxProfileRange:[G.zero,G.mul(q(2),Xb)],
    sourceRegularity:'Actual repaired coefficient profiles have smooth Cartesian axis representatives and the original smooth zero extensions. These analytic source premises are retained; no new Lean analytic instantiation is asserted.',
    stressSupportOrdering:'Xminus=Xa*exp(t1/128)>Xa and Xplus=Xv*exp(1)<Xb, with log(Xb/Xplus)>127.',
    currentFieldUnchanged:true};
  const scope={actualSourcePhysicalSeminormConstantsConstructed:true,allRequestedCartesianTimeDerivativesBounded:true,
    sourceAxisRepresentationIncluded:true,physicalRadialExtraCutoffIncluded:true,higherOrderWeightedStressConstantsConstructed:throughOrder>=2,
    numericalSeminormEvaluation:false,orderOneWeightedBoundaryEstimateCompleted:false,newCanonicalCutoffsAppliedToBackground:false,
    fullPhysicalResidualAndFlatErrorPackageComplete:false,actualSourceAnalyticLeanTheorem:false};
  const result={G,prepared,request:{throughOrder,derivativeOrder},sourceProfile:prepared.program.profileId??prepared.program.sourceProfile??prepared.G.source.id,
    parameterExpressionSHA256:prepared.program.parameterExpressionSHA256,domain,supportOrder,rows,weightedStress,ftcRows,roots,scope};
  result.program=G.pack(roots,{schema:'MathScope.ActualBackgroundPhysicalSeminorms/1',request:result.request,sourceProfile:result.sourceProfile,
    parameterExpressionSHA256:result.parameterExpressionSHA256,domain,supportOrder,rows,weightedStress,ftcRows,scope,
    proofRules:{FTC:'Every anchored face term is retained. sqrt(1+d^2)>=|d| and all integration intervals are finite.',
      physicalChain:'partial_xi=q^-1/2*d_xi; partial_z=q^-D/L*(2*eta*E-eta*x.d_x+d*d_eta); partial_t=q^-1/L*(-E+x.d_x/2+D*eta*d_eta).',
      EulerShift:'For each actual derivative word, retain its exact loss ell=a/2+D*k+l<=j until after differentiation. The Euler factor has absolute value baseLoss+ell<=baseLoss+j. Positive jets majorize the actual coefficients and their derivatives; an inequality already weakened to q^(-baseLoss-j) is never differentiated.',
      independence:'The exponent loss 2*A+m does not depend on the coefficient index n. The constants do depend on n and m.',
      missingClaims:'No numerical quadrature, residual cancellation, all-order source Lean proof, or changed background is inferred from the seminorm constants.'}});
  const {nodes:programNodes,...metadata}=result.program;
  // G.pack normally exposes append-only graph arrays. This certificate has
  // a fixed prefix: later source work may append nodes/definitions without
  // rewriting the already published receipt or its hash.
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  seals.set(result,{G,prepared,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    data:binding(result),programMetadata:structuredClone(metadata),programMetadataBinding:canonicalStringify(metadata)});
  return result;
}

export function assertActualBackgroundPhysicalSeminorms(result){
  const s=seals.get(result);
  if(!s||s.G!==result.G||s.prepared!==result.prepared||canonicalStringify(result.G.nodes.slice(0,s.count))!==s.nodes||
     !result.G.functionDefinitionsUnchanged(s.definitions)||binding(result)!==s.data)
    fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged physical seminorms derived from their originating actual source graph.');
  const {nodes,...metadata}=result.program??{};
  if(!Array.isArray(nodes)||canonicalStringify(nodes)!==s.nodes||canonicalStringify(metadata)!==s.programMetadataBinding)
    fail('INVALID_SOURCE_CONSTRUCTION','The published physical seminorm program must retain its sealed graph and metadata.');
  assertActualOrderInduction(result.prepared);return true;
}

/** A separate strengthened selector. It does not mutate the historical
 * canonical cutoffs or silently change a previously executed background.
 * The new source must be assembled and reverified before it can replace it.
 */
export function attachActualPhysicalCutoffSelector(prepared,context={}){
  assertActualOrderInduction(prepared);const {G,order}=prepared,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),log2=G.log(q(2));
  const rows=[],sourceNorms=[];let previous=G.zero;
  for(let n=1;n<=order;n++){
    context.checkCancelled?.();
    const normalized=attachActualNormalizedCutoffs(attachActualInductionNorms(prepared,{throughOrder:n,derivativeOrder:n},context),context);
    const physical=attachActualBackgroundPhysicalSeminorms(prepared,{throughOrder:n,derivativeOrder:n},context),physicalRow=physical.rows[n-1];
    sourceNorms.push(physical);
    const weighted=physical.weightedStress.find(r=>r.order===n),weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:n},context);
    const W=weights.weights.map(w=>G.add(...w.polynomialInSourceH.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k)))));
    const constraints=[];
    for(let m=0;m<=n;m++){
      constraints.push({kind:'physical-Cartesian-time',derivativeOrder:m,bound:physicalRow.bounds[m]});
      if(weighted)constraints.push({kind:'normalized-higher-stress-over-zeta',derivativeOrder:m,
        bound:G.maximum(...Array.from({length:m+1},(_,e)=>G.mul(W[e],weighted.bounds[m-e])))});
    }
    for(const c of constraints)c.requiredLog=G.div(G.add(G.mul(q(n),log2),G.log(c.bound)),G.mul(q(n),h));
    const doubling=G.add(previous,log2),logScale=G.maximum(doubling,...normalized.rows[n-1].coefficientBounds.map(c=>c.requiredLog),...constraints.map(c=>c.requiredLog));
    const scale=G.exp(logScale);rows.push({order:n,logScale,scale,doubling,normalized:normalized.rows[n-1].coefficientBounds,constraints,
      diagonalRequest:{throughOrder:n,derivativeOrder:n},laterPrefixChangesEarlierScale:false});previous=logScale;
  }
  const result={schema:'MathScope.ActualPhysicalCutoffSelector/1',G,rows,
    definition:'log a_n=max(log a_(n-1)+log2, all original normalized required logs, all physical (5.37) logs, all n>=2 weighted-stress logs).',
    summationDomain:{q0:'1',q:'0<q<1',firstScaleAtLeast:'2',firstCutoffSupportStrictlyInsideDomain:true,
      interpretation:'Lemma 5.4 is applied on q0=1. No support claim at a separate, smaller q_star boundary is inferred.'},
    coefficientGain:'g_n=2*n*h',physicalLoss:'ell_m=2*A+m',logarithmicPower:0,
    proof:'For each selected B>=1, log a_n>=(n log2+log B)/(n h) implies B*q^(n h)<=2^-n for 0<q<=1/a_n. Doubling and every previous normalized clause are retained.',
    actualCurrentBackgroundChanged:false,sourceMustBeReassembledBeforePromotion:true,
    orderOneWeightedBoundaryEstimateCompleted:false,fullOriginalProposition55Certified:false};
  const {G:ignoredGraph,...data}=result;
  selectorSeals.set(result,{G,prepared,count:G.nodes.length,nodes:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),
    sourceNorms,data:canonicalStringify(data)});
  return result;
}

export function assertActualPhysicalCutoffSelector(result){
  const s=selectorSeals.get(result);
  if(!s||s.G!==result.G)fail('INVALID_SOURCE_CONSTRUCTION','Use the actual physical cutoff selector returned by its source constructor.');
  const {G,...data}=result;
  if(canonicalStringify(data)!==s.data||canonicalStringify(G.nodes.slice(0,s.count))!==s.nodes||!G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','The actual physical selector, constraints and originating graph must be unchanged.');
  assertActualOrderInduction(s.prepared);
  for(const physical of s.sourceNorms)assertActualBackgroundPhysicalSeminorms(physical);
  return true;
}

export async function actualBackgroundPhysicalSeminormCertificate(result){
  assertActualBackgroundPhysicalSeminorms(result);const s=seals.get(result),serialized=canonicalStringify({...s.programMetadata,nodes:result.G.nodes.slice(0,s.count)});
  return {schema:'MathScope.ActualBackgroundPhysicalSeminormCertificate/1',status:'COMPLETED',pass:true,
    completedScope:'Finite exact integral constants for actual physical coefficient seminorms and higher-order compactly supported T_n/zeta.',
    request:result.request,sourceProfile:result.sourceProfile,parameterExpressionSHA256:result.parameterExpressionSHA256,
    graph:{sha256:await sha256(serialized),nodeCount:s.count,serializedProgramBytes:new TextEncoder().encode(serialized).length,roots:result.roots},
    physicalRows:result.rows.map(r=>({order:r.order,components:r.components.map(c=>({name:c.name,sourceRoots:c.sourceRoots,baseLoss:c.baseLoss,cutoff:c.cutoff})),bounds:r.bounds,physicalLosses:r.physicalLosses})),
    weightedStressRows:result.weightedStress.map(r=>({order:r.order,bounds:r.bounds,compactSupport:r.compactSupport,orderOneIncluded:false})),
    ftcEnvelopeCount:result.ftcRows.length,domain:result.domain,supportOrder:result.supportOrder,scope:result.scope};
}
