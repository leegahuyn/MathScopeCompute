/** Source-bound physical summation for the original velocity/potential
 * family. This is separate from the pressure/stress residual theorem.
 *
 * There is no mathematical derivative cap16 here. Every finite query uses
 * actual Cartesian jets, complete FTC faces, and explicit graph/work
 * budgets. Failure to materialize a requested jet returns RESOURCE_LIMIT;
 * a derivative is never replaced by zero or an invented numerical bound.
 */
import {assertActualGlobalPositivePrimitives} from './actual-global-positive-primitives.mjs';
import {rectangularSourceFTC} from './actual-background-physical-seminorms.mjs';
import {sourceNormalizedCutoffWeights} from './actual-residual-order-induction-kernels.mjs';
import {attachActualCanonicalCutoffs} from './actual-residual-order-induction-cutoffs.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';
import {factorial,fail} from './actual-continuation-arithmetic.mjs';

const normSeals=new WeakMap(),selectorSeals=new WeakMap();
const sum=xs=>xs.reduce((a,b)=>a+b,0),choose=(n,k)=>factorial(n)/(factorial(k)*factorial(n-k));

/** Positive ordinary derivative majorants in (Euler,y1,y2,eta). Each
 * product keeps every binomial term, and the budget counts unique queries.
 * This generic calculus by itself authenticates no source coefficient.
 */
export function physicalPositiveJetCalculus(G,{maxJetRequests=200000,checkCancelled}={}){
  if(!Number.isSafeInteger(maxJetRequests)||maxJetRequests<1)fail('INVALID_INPUT','Use a positive finite jet-query budget.');
  let queries=0;const q=(n,d=1)=>G.q(n,d),fn=producer=>{const cache=new Map();return {get(...orders){
    if(orders.length!==4||orders.some(n=>!Number.isSafeInteger(n)||n<0))fail('INVALID_INPUT','Use four nonnegative finite derivative orders.');
    const key=orders.join(':');if(cache.has(key))return cache.get(key);
    if(++queries>maxJetRequests)fail('RESOURCE_LIMIT','The finite physical jet-query budget was exhausted. No derivative was omitted.');
    if(queries%256===0)checkCancelled?.();const value=producer(...orders);cache.set(key,value);return value;
  }};};
  const constant=value=>fn((...o)=>sum(o)?G.zero:value),add=(...fs)=>fn((...o)=>G.add(...fs.map(f=>f.get(...o))));
  const product=(f,g)=>fn((e,x,y,s)=>{
    const terms=[];for(let a=0;a<=e;a++)for(let b=0;b<=x;b++)for(let c=0;c<=y;c++)for(let d=0;d<=s;d++)
      terms.push(G.mul(q(choose(e,a)*choose(x,b)*choose(y,c)*choose(s,d)),f.get(a,b,c,d),g.get(e-a,x-b,y-c,s-d)));
    return G.add(...terms);
  }),mul=(...fs)=>fs.reduce(product,constant(G.one)),shift=(f,j)=>fn((...o)=>{o[j]++;return f.get(...o);});
  return {fn,constant,add,mul,shift,usage:()=>({uniqueJetQueries:queries,maxJetRequests})};
}

/** Exact summability implication for the actual positive source h.
 * The finite coefficients/norms are authenticated by the adapter below;
 * this arithmetic kernel deliberately has no source-completion authority.
 */
export function positiveSourceDiagonalTailArithmetic({derivativeOrder=2,truncationOrder=3}={}){
  if(!Number.isSafeInteger(derivativeOrder)||derivativeOrder<0||!Number.isSafeInteger(truncationOrder)||truncationOrder<Math.max(1,derivativeOrder))
    fail('INVALID_INPUT','Choose a finite truncation order at least max(1,m).');
  const m=derivativeOrder,J=truncationOrder,denominator=1n<<BigInt(J);
  return {schema:'MathScope.PositiveSourceDiagonalTailArithmetic/1',derivativeOrder:m,truncationOrder:J,
    selectedInequality:'B_(n,m)*a_n^(-n*h)<=2^-n for every m<=n, with the original h>0.',
    support:'chi(a_n*q) and all its derivatives vanish for a_n*q>=1; for a_n*q<=1/2, chi=1 and its positive derivatives vanish.',
    term:'|D^alpha Z_n^cut|<=2^-n*q^(n*h-(2*A+m)) for n>=m, |alpha|<=m, 0<q<=1.',
    tail:{dyadicFactor:{numerator:'1',denominator:String(denominator)},sourceHMultiplier:J+1,loss:'2*A+m',
      inequality:'sum_(n>J)|D^alpha Z_n^cut| <= 2^-J*q^((J+1)*h-(2*A+m))'},
    proof:['The support restricts q<=1/a_n, hence B_(n,m)*q^(n*h)<=2^-n.',
      'For n>J>=m and 0<q<=1, q^(n*h)<=q^((J+1)*h), since the ORIGINAL h is strictly positive.',
      'The exact geometric series sum_(n>J)2^-n is 2^-J.',
      'For q<1/(2*a_J), all terms n<=J lie on their actual unit plateaus, so the tail is the difference from the ORIGINAL uncut finite truncation.',
      'Given fixed m and desired exponent N, a finite J with (J+1)*h>2*A+m+N exists; its possible enormous size is not rounded down.'],
    localFiniteness:'a_n>=2*a_(n-1) implies only finitely many nonzero cutoff terms on each compact q interval bounded away from0.',
    appliesTo:'The velocity/potential tuple only after its actual source seminorm/selector premises have been supplied.',
    actualSourceAuthenticated:false,fullNavierStokesResidualFlatness:false,newLeanKernelProof:false};
}

const normData=r=>({request:r.request,source:r.source,domain:r.domain,rows:r.rows,ftcRows:r.ftcRows,roots:r.roots,scope:r.scope,work:r.work});
const selectorData=r=>{const {G,primitives,norms,program,...data}=r;return data;};

function originalLinearTimeCutoff(G){
  const t=G.fresh('all_order_velocity_original_time_cutoff'),u=G.sub(G.mul(G.q(2),t),G.one),
    a=G.exp(G.neg(G.inv(u))),b=G.exp(G.neg(G.inv(G.sub(G.one,u)))),
    body=G.choose(t,G.q(1,2),G.one,G.one,G.div(b,G.add(a,b)),G.zero),
    system=G.defineExpressionFunction({name:'ActualVelocityOriginalLinearTimeCutoff',parameters:[t],body});
  return {coordinate:t,body,system,
    definition:'chi(s)=1-sigma_1(2s-1), with the original exp(-1/t) linear seed and exact flat branches.',
    squareSpatialSeedSubstituted:false,callerSuppliedCutoff:false};
}

function actualMassAverageBinding(G,g,primitive,X){
  const body=id=>{const n=G.nodes[id];return n.op==='actual_expression_partial'&&n.args[2].every(x=>x===0)
    ?body(G.materializeExpressionFunction(n.args[0],n.args[1],n.args[2])):id;},
    mass=body(g.M),average=body(g.average),M=G.nodes[mass],B=G.nodes[average],
    checks={sameActualMass:primitive.mass.source===g.M&&primitive.mass.sourceU===g.U&&primitive.mass.pass,
      samePiecewiseCoordinate:M.op==='smooth_piecewise'&&B.op==='smooth_piecewise'&&M.args[0]===X&&B.args[0]===X,
      sameJoins:M.args[1]===B.args[1]&&M.args[2]===B.args[2],
      axisAverage:M.args[3]===G.mul(X,B.args[3]),
      positiveXQuotient:B.args[4]===G.div(g.M,X)||B.args[4]===G.div(mass,X),
      sameClosedExterior:M.args[5]===G.zero&&B.args[5]===G.zero};
  if(!Object.values(checks).every(Boolean))fail('INVALID_SOURCE_CONSTRUCTION','The actual global average must use its regular core and the proved mass divided by positive X only.');
  return {mass:g.M,average:g.average,massBody:mass,averageBody:average,checks,
    theorem:'The original average equals M_n/X for X>0, has its retained even core at X=0, and its final zero branch joins smoothly by the actual mass moment.',
    divisionAtAxisUsed:false,pass:true};
}

export function attachActualVelocityPhysicalSeminorms(primitives,input={},context={}){
  assertActualGlobalPositivePrimitives(primitives);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['throughOrder','derivativeOrder','maxProfileJets','maxJetRequests'].includes(k)))
    fail('INVALID_INPUT','Only an already-authenticated prefix and finite derivative/work budgets may be selected.');
  const {prepared,G}=primitives,{bootstrap,records}=prepared,
    throughOrder=input.throughOrder??primitives.request.throughOrder,m=input.derivativeOrder??2,
    maxProfileJets=input.maxProfileJets??20000,maxJetRequests=input.maxJetRequests??200000;
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>primitives.request.throughOrder||!Number.isSafeInteger(m)||m<0||
    !Number.isSafeInteger(maxProfileJets)||maxProfileJets<1)fail('INVALID_INPUT','Use an authenticated positive prefix and nonnegative finite derivative order.');
  const requiredProfileJets=9*throughOrder*(m+1)*(m+2)*(m+3)/6;
  if(!Number.isSafeInteger(requiredProfileJets)||requiredProfileJets>maxProfileJets)fail('RESOURCE_LIMIT','The declared finite Cartesian profile-jet budget cannot cover this request.');
  G.derivativeBudget(2*(m+3),m+3);
  const {X,eta}=bootstrap.constants,q=(n,d=1)=>G.q(n,d),{A,D,L}=G.core,h=G.parameter('h'),
    y1=G.fresh('all_order_velocity_y1'),y2=G.fresh('all_order_velocity_y2'),ec=G.fresh('all_order_velocity_eta'),
    radius=G.sqrt(G.mul(q(2),bootstrap.orderOne.Xb)),cartX=G.div(G.add(G.pow(y1,2),G.pow(y2,2)),q(2)),
    atCart=f=>G.simultaneousSubstitute(f,[X,eta],[cartX,ec]),box={coordinates:[y1,y2,ec],lower:[G.neg(radius),G.neg(radius),q(-1)],upper:[radius,radius,G.one]},
    C=physicalPositiveJetCalculus(G,{maxJetRequests,checkCancelled:context.checkCancelled}),{fn,constant,add,mul,shift}=C,
    coord=(j,upper)=>fn((...o)=>sum(o)===0?upper:sum(o)===1&&o[j]===1?G.one:G.zero),xx=coord(1,radius),yy=coord(2,radius),ee=coord(3,G.one),
    dd=fn((e,x,y,s)=>e||x||y?G.zero:s===0?G.one:s===1||s===2?q(2):G.zero),
    invL=fn((e,x,y,s)=>e||x||y?G.zero:q(2n*factorial(s)*8n**BigInt(s))),
    ftcRows=[],cache=new Map();
  const profileNorm=(body,x,y,s)=>{
    const key=[body,x,y,s].join(':');if(cache.has(key))return cache.get(key);
    if(ftcRows.length>=maxProfileJets)fail('RESOURCE_LIMIT','The actual finite profile-jet budget was exhausted.');
    let jet=body;for(const [coordinate,count]of [[y1,x],[y2,y],[ec,s]])for(let k=0;k<count;k++)jet=G.derivative(jet,coordinate);
    const ftc=rectangularSourceFTC(G,{body:jet,...box});ftcRows.push({sourceBody:body,orders:[x,y,s],...ftc});cache.set(key,ftc.bound);return ftc.bound;
  };
  const rows=[];
  for(let n=1;n<=throughOrder;n++){
    context.checkCancelled?.();const r=records[n],g=r.global,primitive=primitives.rows[n-1];
    if(!primitive.mass.pass||primitive.mass.source!==g.M||primitive.mass.sourceU!==g.U)fail('INVALID_SOURCE_CONSTRUCTION','The genuine global mass identity is required for the potential/velocity source family.');
    const averageBinding=actualMassAverageBinding(G,g,primitive,X),F=atCart(g.F),U=atCart(g.U),v=atCart(g.v),average=atCart(g.average),etaOverL=atCart(G.div(eta,L)),
      components=[
        {name:'potential_x1',body:G.neg(G.div(G.mul(y2,average),q(2))),baseLoss:h,cutoff:'ordinary',sourceRoots:[g.M,g.average]},
        {name:'potential_x2',body:G.div(G.mul(y1,average),q(2)),baseLoss:h,cutoff:'ordinary',sourceRoots:[g.M,g.average]},
        {name:'angular_x1',body:G.neg(G.mul(y2,F)),baseLoss:A,cutoff:'ordinary',sourceRoots:[g.F]},
        {name:'angular_x2',body:G.mul(y1,F),baseLoss:A,cutoff:'ordinary',sourceRoots:[g.F]},
        {name:'radial_x1',body:G.div(G.mul(y1,v),q(2)),baseLoss:q(1,2),cutoff:'ordinary',sourceRoots:[g.v]},
        {name:'radial_x2',body:G.div(G.mul(y2,v),q(2)),baseLoss:q(1,2),cutoff:'ordinary',sourceRoots:[g.v]},
        {name:'extra_stream_x1',body:G.neg(G.mul(y1,etaOverL,average)),baseLoss:q(1,2),cutoff:'extra',sourceRoots:[g.M,g.average]},
        {name:'extra_stream_x2',body:G.neg(G.mul(y2,etaOverL,average)),baseLoss:q(1,2),cutoff:'extra',sourceRoots:[g.M,g.average]},
        {name:'axial',body:U,baseLoss:A,cutoff:'ordinary',sourceRoots:[g.U]}],
      weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:m},context),poly=c=>G.add(...c.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k)))),
      ordinary=weights.weights.map(w=>poly(w.polynomialInSourceH)),extra=weights.weights.map(w=>poly(w.extraPotentialCutoffPolynomialInSourceH)),componentRows=[];
    for(const component of components){
      const W=component.cutoff==='extra'?extra:ordinary;
      let current=fn((e,x,y,s)=>{
        if(e+x+y+s>m||W[e]===undefined)fail('RESOURCE_LIMIT','A physical word requested a derivative outside this finite query.');
        return G.mul(W[e],profileNorm(component.body,x,y,s));
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
    const bounds=Array.from({length:m+1},(_,k)=>G.maximum(G.one,...Array.from({length:k+1},(_,j)=>G.add(...componentRows.map(r=>r.byOrder[j])))));
    rows.push({order:n,sourcePrimitiveOrder:primitive.order,averageBinding,components:componentRows,bounds,weights,gain:G.mul(q(2*n),h),losses:Array.from({length:m+1},(_,k)=>G.add(G.mul(q(2),A),q(k))),
      statement:'Every Cartesian/time derivative through k of this actual cutoff velocity/potential tuple is <=B_nk*q^(2*n*h-(2*A+k)); the extra stream term is included.',
      exactDerivativeLossBeforeBounding:'Each physical word retains loss ell=a/2+D*b+c<=its length; only its coefficient magnitude is then majorized by baseLoss+length.'});
    context.onProgress?.({phase:'actual-all-order-velocity-seminorm',order:n,derivativeOrder:m,ftcRows:ftcRows.length,nodes:G.nodes.length});
  }
  const roots={};for(const r of rows)r.bounds.forEach((b,k)=>roots['actual_velocity_B_'+r.order+'_'+k]=b);
  const result={G,primitives,request:{throughOrder,derivativeOrder:m,maxProfileJets,maxJetRequests},source:primitives.source,
    domain:{q:'0<q<=1',eta:['-1','1'],cartesianProfileBox:box,cartesianXRange:[G.zero,G.mul(q(2),bootstrap.orderOne.Xb)],
      sourceGeometryBound:'The pinned positive h<2^-4096 is in particular <1/16. On every radius-1/2 complex disk centered at |eta|<=1, |1-2*h*z^2|>1/2. Cauchy gives |d_eta^j(1/L)|<=2*j!*2^j<=2*j!*8^j.',
      sourceRegularity:'The actual positive F/U are the original smooth inner solutions with the unchanged flat kappa and compact Ipos bumps. The independently source-bound M_X=U proof gives their smooth global average, including the axis and mass-closed zero branch.'},
    rows,ftcRows,roots,work:{requiredProfileJets,actualFTCRows:ftcRows.length,...C.usage()},
    scope:{actualVelocityPotentialPhysicalSeminorms:true,allRequestedOrdersExecuted:m,mathematicalDerivativeOrderCap:null,
      finiteSourceGraphAndMaterializerBudgetsRetained:true,arbitraryFiniteDerivativeAlgorithm:true,actualSourceMassIdentitiesUsed:true,
      pressureOrStressSeminormsClaimed:false,numericalNormEvaluation:false,sourceGlobalFlatResidualProved:false,wholeGN4Complete:false,newLeanKernelProof:false,m3MayStart:false}};
  const packed=G.pack(roots,{schema:'MathScope.ActualVelocityPhysicalSeminormsProgram/1',...normData(result)}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  normSeals.set(result,{G,primitives,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),data:canonicalStringify(normData(result)),program:canonicalStringify(result.program)});return result;
}

export function assertActualVelocityPhysicalSeminorms(result){
  const s=normSeals.get(result);
  if(!s||s.G!==result.G||s.primitives!==result.primitives||canonicalStringify(normData(result))!==s.data||canonicalStringify(result.program)!==s.program||
    canonicalStringify(s.G.nodes.slice(0,s.count))!==s.prefix||!s.G.functionDefinitionsUnchanged(s.definitions))fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged actual velocity/potential source seminorms.');
  assertActualGlobalPositivePrimitives(s.primitives);return true;
}

/** Apply every m<=n condition to real source constants and KEEP the old
 * selector as an additional lower bound. This new sequence is not silently
 * substituted into either historical or already-frozen runtime source.
 */
export function attachActualVelocityDiagonalSelector(primitives,input={},context={}){
  assertActualGlobalPositivePrimitives(primitives);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['throughOrder','maxProfileJets','maxJetRequests'].includes(k)))fail('INVALID_INPUT','Only a finite actual diagonal prefix and work budgets are accepted.');
  const throughOrder=input.throughOrder??primitives.request.throughOrder;
  if(!Number.isSafeInteger(throughOrder)||throughOrder<1||throughOrder>primitives.request.throughOrder)fail('INVALID_INPUT','Use an authenticated original prefix.');
  const {G,prepared}=primitives,q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),log2=G.log(q(2)),historical=attachActualCanonicalCutoffs(prepared,context),rows=[],norms=[];
  let previous=G.zero;
  for(let n=1;n<=throughOrder;n++){
    const norm=attachActualVelocityPhysicalSeminorms(primitives,{throughOrder:n,derivativeOrder:n,maxProfileJets:input.maxProfileJets,maxJetRequests:input.maxJetRequests},context);
    norms.push(norm);const bounds=norm.rows[n-1].bounds,clauses=bounds.map((bound,m)=>({derivativeOrder:m,bound,requiredLog:G.div(G.add(G.mul(q(n),log2),G.log(bound)),G.mul(q(n),h))})),
      historicalRow=historical.rows[n-1],doubling=G.add(previous,log2),logScale=G.maximum(historicalRow.logScale,doubling,...clauses.map(c=>c.requiredLog)),scale=G.exp(logScale);
    const global=prepared.records[n].global,unchangedActualCoefficientRoots=Object.fromEntries(['F','U','M','average','Pi','v'].map(k=>[k,global[k]]));
    rows.push({order:n,historicalScale:historicalRow.scale,historicalLogScale:historicalRow.logScale,doubling,clauses,logScale,scale,unchangedActualCoefficientRoots});previous=logScale;
  }
  // The selected constants now enter the unchanged source field bodies.
  // Every profile used here is the exact one whose FTC norm was generated;
  // rebinding its three chart coordinates does not replace its formula.
  const cutoff=originalLinearTimeCutoff(G),coordinates={q:G.fresh('all_order_selected_q'),
    y1:G.fresh('all_order_selected_y1'),y2:G.fresh('all_order_selected_y2'),eta:G.fresh('all_order_selected_eta')},
    at=[coordinates.y1,coordinates.y2,coordinates.eta],power=exponent=>G.exp(G.mul(exponent,G.log(coordinates.q))),
    componentSums=new Map(),roots={};
  for(const row of rows){
    const norm=norms[row.order-1],sourceComponents=norm.rows[row.order-1].components,
      sigma=G.mul(row.scale,coordinates.q),chi=G.expressionValue(cutoff.system,[sigma]),
      extra=G.mul(sigma,G.expressionValue(cutoff.system,[sigma],[1]));
    const selectedComponents=sourceComponents.map(component=>{
      const profile=G.simultaneousSubstitute(component.body,norm.domain.cartesianProfileBox.coordinates,at),
        exponent=G.sub(G.mul(q(2*row.order),h),component.baseLoss),prefactor=power(exponent),
        cutoffFactor=component.cutoff==='extra'?extra:chi,value=G.mul(prefactor,cutoffFactor,profile);
      const entry={name:component.name,sourceRoots:component.sourceRoots,sourceNormBody:component.body,profile,
        sourceCoordinates:norm.domain.cartesianProfileBox.coordinates,selectedCoordinates:at,
        baseLoss:component.baseLoss,cutoffKind:component.cutoff,exponent,prefactor,cutoffFactor,value};
      if(!componentSums.has(component.name))componentSums.set(component.name,[]);componentSums.get(component.name).push(value);
      roots['selected_'+row.order+'_'+component.name]=value;return entry;
    });
    row.application={sigma,chi,extra,selectedComponents,
      actualNormSourceBodiesReused:true,extraRadialCommutatorIncluded:true};
  }
  const total=name=>G.add(...componentSums.get(name)),
    potential=[total('potential_x1'),total('potential_x2'),G.zero],
    velocity=[G.add(total('angular_x1'),total('radial_x1'),total('extra_stream_x1')),
      G.add(total('angular_x2'),total('radial_x2'),total('extra_stream_x2')),total('axial')];
  potential.forEach((v,j)=>{roots['actual_selected_positive_potential_'+j]=v;});
  velocity.forEach((v,j)=>{roots['actual_selected_positive_velocity_'+j]=v;});
  const result={schema:'MathScope.ActualVelocityDiagonalSelector/1',G,primitives,norms,request:{throughOrder},source:primitives.source,rows,
    coordinates,cutoff,roots,finiteTuple:{potential,velocity,positiveOrders:[1,throughOrder],
      leadingOrderIncluded:false,allUnconstructedHigherTermsSetToZero:false,
      meaning:'This is the constructed positive finite prefix. It represents the infinite sequence only on a band whose later cutoff support has separately been excluded.'},
    sourceAllOrderRecipe:{coefficient:'For each positive integer n generate the two original six-component systems from the preceding completed coefficients, then the same five-moment correction. The prefix construction never reads a future coefficient.',
      seminorm:'For every fixed finite (n,m), generate the actual Cartesian source jet/FTC constants above and the original all-order chi Euler bounds.',
      selector:'log a_n=max(log c_n,log a_(n-1)+log2,max_(m<=n)[n log2+log B_nm]/(n h)). Each step contains finitely many genuine source norms.',
      allOrderInference:'This finite recipe and the strictly positive original h define the infinite diagonal sequence mathematically. A finite query materializes only its requested prefix and can fail its explicit representation budget.',
      independence:'The physical derivative loss 2*A+m is independent of n; the constants and selected scales depend on n and m.'},
    tailArithmetic:positiveSourceDiagonalTailArithmetic({derivativeOrder:throughOrder,truncationOrder:throughOrder}),
    actualHistoricalBackgroundChanged:false,newSequenceExplicitlyDefined:true,allOrdersNumericallyMaterialized:false,
    tuple:'Actual velocity and vector potential, including the radial cutoff commutator.',
    scope:{sourceBoundArbitraryFixedMVelocityPotentialSummation:true,finiteActualDiagonalPrefixApplied:throughOrder,
      actualFiniteSelectedTupleConstructed:true,originalLeadingFieldChanged:false,finitePrefixClaimedAsWholeBackground:false,
      mathematicalOrderCap:null,actualRuntimeCutoffsReplaced:false,pressureStressOrResidualTheoremComplete:false,
      wholeGN4Complete:false,fullPhysicalResidualAndFlatErrorPackageComplete:false,newLeanKernelProof:false,m3MayStart:false}};
  const packed=G.pack(roots,{...selectorData(result),schema:'MathScope.ActualVelocityDiagonalSelectorProgram/1'}),{nodes,...metadata}=packed;
  result.program={...structuredClone(metadata),nodes:G.nodes.slice()};
  selectorSeals.set(result,{G,primitives,norms,count:G.nodes.length,prefix:canonicalStringify(G.nodes),
    definitions:G.captureFunctionDefinitions(),data:canonicalStringify(selectorData(result)),program:canonicalStringify(result.program)});return result;
}

export function assertActualVelocityDiagonalSelector(result){
  const s=selectorSeals.get(result);if(!s||s.G!==result.G||s.primitives!==result.primitives||s.norms!==result.norms)fail('INVALID_SOURCE_CONSTRUCTION','Use the live actual velocity diagonal selector.');
  const {G,primitives,norms}=result;if(canonicalStringify(selectorData(result))!==s.data||canonicalStringify(result.program)!==s.program||
    canonicalStringify(G.nodes.slice(0,s.count))!==s.prefix||!G.functionDefinitionsUnchanged(s.definitions))fail('INVALID_SOURCE_CONSTRUCTION','The actual diagonal scale, applied field or source constraints changed.');
  for(const norm of norms)assertActualVelocityPhysicalSeminorms(norm);assertActualGlobalPositivePrimitives(primitives);return true;
}

export async function actualVelocityPhysicalSeminormCertificate(result){
  assertActualVelocityPhysicalSeminorms(result);const encoded=canonicalStringify(result.program);
  return {schema:'MathScope.ActualVelocityPhysicalSeminormCertificate/1',...normData(result),graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length}};
}

export async function actualVelocityDiagonalSelectorCertificate(result){
  assertActualVelocityDiagonalSelector(result);const encoded=canonicalStringify(result.program);
  return {...selectorData(result),schema:'MathScope.ActualVelocityDiagonalSelectorCertificate/1',
    graph:{sha256:await sha256(encoded),nodeCount:result.program.nodes.length,canonicalBytes:new TextEncoder().encode(encoded).length,fixedCompilerPrefix:true}};
}
