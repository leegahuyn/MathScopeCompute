/** A fixed representative for every nonempty original active mesh box.
 *
 * The construction uses interval projections and the original monotone
 * slow chart. It does not round the current point, differentiate a moving
 * representative, or ask a caller for an unverified real-number oracle.
 * Every choice depends only on the frozen label and original constants.
 * Boundary-only intersections are handled by the outer flat source guard.
 */
import {assertGlobalSourceBand} from './source-global-band.mjs';
import {canonicalStringify,sha256} from '../../mathscope-m0/contracts.mjs';

const seals=new WeakMap(),fail=(code,message)=>{throw Object.assign(new Error(message),{code});};
const meta=p=>({schema:p.schema,roots:p.roots,box:p.box,reduction:p.reduction,checks:p.checks,proof:p.proof,scope:p.scope});

/** Pure interval geometry kernel. O supplies ordinary real arithmetic,
 * sqrt of nonnegative values and max. The source wrapper below supplies
 * the original exact graph, h, Xa and Xb. This generic reduction alone
 * has no source authority. The live-point nonempty premise is explicit.
 */
export function originalRepresentativeBoxReduction(O,{radiusBox,axialBox,timeBox,Xa,Xb,h}){
  const [Rl,Ru]=radiusBox,[Zl,Zu]=axialBox,[Tl,Tu]=timeBox,q=(n,d=1)=>O.q(n,d),
    min=(...xs)=>O.neg(O.maximum(...xs.map(x=>O.neg(x)))),mid=(x,y)=>O.div(O.add(x,y),q(2)),
    power=(x,y)=>O.exp(O.mul(y,O.log(x))),
    radialLowerPositive=O.maximum(O.zero,Rl),
    sLower=O.maximum(q(1,2),O.div(O.pow(radialLowerPositive,2),O.mul(q(2),Xb))),
    sUpperRaw=min(q(2),O.div(O.pow(Ru,2),O.mul(q(2),Xa))),
    // The harmless positive extension avoids log(0) on empty boxes.
    // It is equal to sUpperRaw on every source-active box.
    sUpper=O.maximum(sLower,sUpperRaw),TLower=O.maximum(O.zero,Tl),TUpper=Tu,
    zSquaredLower=O.div(O.sub(sLower,TUpper),power(sLower,O.mul(q(2),h))),
    zSquaredUpper=O.div(O.sub(sUpper,TLower),power(sUpper,O.mul(q(2),h))),
    zAbsoluteLower=O.sqrt(O.maximum(O.zero,zSquaredLower)),
    zAbsoluteUpper=O.sqrt(O.maximum(O.zero,zSquaredUpper)),
    negativeInterval=[O.maximum(Zl,O.neg(zAbsoluteUpper)),min(Zu,O.neg(zAbsoluteLower))],
    positiveInterval=[O.maximum(Zl,zAbsoluteLower),min(Zu,zAbsoluteUpper)],
    negativeWidth=O.sub(negativeInterval[1],negativeInterval[0]),
    positiveWidth=O.sub(positiveInterval[1],positiveInterval[0]),
    negativeMidpoint=mid(...negativeInterval),positiveMidpoint=mid(...positiveInterval),
    Z=O.choose(negativeWidth,O.zero,O.zero,positiveMidpoint,positiveMidpoint,negativeMidpoint),
    F=s=>O.sub(s,O.mul(O.pow(Z,2),power(s,O.mul(q(2),h)))),
    selectedTimeInterval=[O.maximum(TLower,F(sLower)),min(TUpper,F(sUpper))],
    T=mid(...selectedTimeInterval);
  return {schema:'MathScope.N6.OriginalRepresentativeBoxReduction/1',radiusBox,axialBox,timeBox,
    sourceConstants:{Xa,Xb,h},radialLowerPositive,sLower,sUpperRaw,sUpper,TLower,TUpper,
    zSquaredLower,zSquaredUpper,zAbsoluteLower,zAbsoluteUpper,negativeInterval,positiveInterval,
    negativeWidth,positiveWidth,Z,T,selectedTimeInterval,
    sourceAuthenticated:false,nonemptyActiveIntersectionRequired:true};
}

/** Finish from the exact original root s-Z^2*s^(2h)-T=0. */
export function finishOriginalBoxRepresentative(O,reduction,s){
  const {radiusBox:[Rl,Ru],sourceConstants:{Xa,Xb,h},Z,T}=reduction,q=(n,d=1)=>O.q(n,d),
    min=(...xs)=>O.neg(O.maximum(...xs.map(x=>O.neg(x)))),
    lower=O.maximum(Rl,O.sqrt(O.mul(q(2),Xa,s))),upper=min(Ru,O.sqrt(O.mul(q(2),Xb,s))),
    R=O.div(O.add(lower,upper),q(2)),X=O.div(O.pow(R,2),O.mul(q(2),s)),D=O.sub(q(1,2),h),
    eta=O.div(Z,O.exp(O.mul(D,O.log(s))));
  return {R,Z,T,s,X,eta,selectedRadiusInterval:[lower,upper]};
}

/** The exact selection is attached to a genuine source-band template.
 * Its validity is a universal consequence of an ACTIVE point in the
 * same box. An exterior/flat-zero term must guard before evaluating it.
 */
export function attachGlobalFixedRepresentative(band,context={}){
  assertGlobalSourceBand(band);const {G}=band,n=G.nodes.length,prefix=canonicalStringify(G.nodes),definitions=G.captureFunctionDefinitions(),
    q=(a,b=1)=>G.q(a,b),ell=band.geometry.ell,scale=G.pow(ell,6),width=G.div(q(3,4),scale),
    centers=band.meshLabels.map(a=>G.div(a,scale)),boxes=centers.map(a=>[G.sub(a,width),G.add(a,width)]),
    Xa=G.parameter('Xa'),Xb=band.chart.Xb,h=band.constants.h,
    reduction=originalRepresentativeBoxReduction(G,{radiusBox:boxes[0],axialBox:boxes[1],timeBox:boxes[2],Xa,Xb,h}),
    s=G.monotoneRoot(band.chart.system,[reduction.Z,reduction.T]),
    roots=finishOriginalBoxRepresentative(G,reduction,s),permit=new Set([ell,...band.meshLabels]),
    proof={
      domain:'An original active point has Xa<X<Xb, 1/2<s<2, T>=0 and every fixed mesh offset strictly between -3/4 and3/4. On positive time T>0; the original T=0 limit has a positive-time interior in the same integer mesh box.',
      radialProjection:'There is an interior admissible radius iff max(1/2,max(0,Rl)^2/(2Xb))<s<min(2,Ru^2/(2Xa)). This uses Ru>0, automatically supplied by an active point.',
      axialProjection:'For T in(max(0,Tl),Tu), F(s,Z)=s-Z^2*s^(2h) meets this interval with s in(sLower,sUpper) iff (sLower-Tu)/sLower^(2h)<Z^2<(sUpper-max(0,Tl))/sUpper^(2h).',
      monotonicity:'The upper Z^2 bound is<=sUpper^(1-2h)<=2^(1-2h). Thus on1/2<=s<=2, partial_s F>=1-2h*4^(1-2h)>1-8h>1/2 because the original h<1/16.',
      signChoice:'Intersect the open Z box with the two open sign intervals. If the lower squared bound is negative, omitting the single point0 cannot remove a nonempty open intersection. Choose the negative interval iff its width is positive; otherwise choose the positive one. Its midpoint is strictly interior.',
      timeChoice:'The two endpoint values of strictly increasing F leave a nonempty open intersection with(max(0,Tl),Tu). Its midpoint gives a unique original root strictly between sLower and sUpper.',
      radialChoice:'At that root, (Rl,Ru) intersects(sqrt(2Xa*s),sqrt(2Xb*s)) in a nonempty open interval. Its midpoint is strictly inside the original shell and same mesh box.',
      sameBoxDistance:'Each of the three coordinate differences to any other active point in the box is<3/(2ell^6), so Euclidean distance<3sqrt(3)/(2ell^6)<4/ell^6=4/S^3.',
      boundaryOnly:'If the closed box and closed shell only touch without an active interior, the original slow factor or shell flat extension is identically zero at every possible point. The complete source term returns zero at its OUTER guard, before any representative, inverse, root or Volterra evaluation.',
      frozenChoices:'All max/min and the sign choice depend only on ell and the integer mesh label. They are fixed before every R/Z/T derivative; no derivative of a nearest-cell map or a residual-dependent choice is taken.',
      originalFreedom:'This specifies one allowed common choice of representatives for the new global M3 family. It does not assert equality to a different previously selected local witness wave.'},
    checks=[{id:'same-genuine-source-band',pass:assertGlobalSourceBand(band)},
      {id:'original-shell-and-positive-h-root-operands',pass:Xa===G.parameter('Xa')&&Xb===band.constants.Xb&&h===G.parameter('h')},
      {id:'fixed-original-ell-six-mesh',pass:scale===G.pow(band.geometry.ell,6)&&width===G.div(q(3,4),scale)&&band.meshLabels.length===3},
      {id:'same-original-monotone-equation',pass:G.nodes[s].op==='actual_monotone_root'&&G.nodes[s].args[0]===band.chart.system},
      {id:'all-representative-roots-have-only-fixed-label-coordinates',pass:Object.values(roots).flat().every(id=>[...G.freeCoordinates(id)].every(c=>permit.has(c)))},
      {id:'all-representative-slow-derivatives-are-structurally-zero',pass:['R','Z','T'].every(name=>[roots.R,roots.Z,roots.T,roots.s,roots.X,roots.eta].every(id=>G.derivative(id,band.coordinates[name])===G.zero))},
      {id:'source-prefix-and-definitions-preserved',pass:canonicalStringify(G.nodes.slice(0,n))===prefix&&G.functionDefinitionsUnchanged(definitions)}];
  if(checks.some(x=>!x.pass))fail('INVALID_SOURCE_CONSTRUCTION','The fixed original representative failed: '+checks.filter(x=>!x.pass).map(x=>x.id).join(', '));
  const result={schema:'MathScope.N6.GlobalFixedRepresentative/1',G,band,roots,box:{scale,width,centers,intervals:boxes},reduction,checks,proof,
    scope:{actualSourceRepresentativeFormulaConstructed:true,originalSourceParametersRetained:true,representativeDependsOnCurrentPoint:false,
      representativeDependsOnResidual:false,validOnEveryNonemptyActiveBoxByStatedProof:true,exteriorGuardRequired:true,
      numericalRepresentativeValuesComputed:false,completeGlobalWaveAssembled:false,originalN604Complete:false}};
  seals.set(result,{G,band,count:G.nodes.length,prefix:canonicalStringify(G.nodes),definitions:G.captureFunctionDefinitions(),metadata:canonicalStringify(meta(result))});
  context.onProgress?.({stage:'m3-global-fixed-original-representative',nodeCount:G.nodes.length,newNodes:G.nodes.length-n});
  return result;
}

export function assertGlobalFixedRepresentative(p){
  const s=seals.get(p);
  if(!s||p.G!==s.G||p.band!==s.band||s.metadata!==canonicalStringify(meta(p))||
    s.prefix!==canonicalStringify(p.G.nodes.slice(0,s.count))||!p.G.functionDefinitionsUnchanged(s.definitions))
    fail('INVALID_SOURCE_CONSTRUCTION','Use the original sealed, label-only representative formula.');
  assertGlobalSourceBand(s.band);return true;
}

export async function globalFixedRepresentativeCertificate(p){
  assertGlobalFixedRepresentative(p);const s=seals.get(p),bytes=canonicalStringify(meta(p));
  return {...meta(p),graph:{metadataSHA256:await sha256(bytes),sourceNodeCount:s.count},
    proofKind:'EXPLICIT_SOURCE_GEOMETRY_WITH_ALL_ACTIVE_BOX_QUANTIFIERS',newLeanKernelExecuted:false};
}
