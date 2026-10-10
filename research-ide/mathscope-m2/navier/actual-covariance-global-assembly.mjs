/** The exact all-index squared partition and physical normalization in (7.30).
 * This is an algebraic assembly lemma. It does not authenticate the actual
 * homogeneous-pulse covariance, uniform q*, or the leading stress. Those
 * premises must be joined by the private actual-source producer.
 */
import {rational as Q,qadd,qmul,qtext,fail} from './actual-continuation-arithmetic.mjs';

const saved=new WeakMap(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const node=(G,x)=>Number.isSafeInteger(x)&&x>=0&&!!G.nodes[x];
const checkNodes=(G,ids)=>{if(!Array.isArray(ids)||ids.some(x=>!node(G,x)))fail('INVALID_INPUT','Use existing exact expression nodes.');};

/** The same translated smooth bump as the earlier actual pointwise test.
 * The apparent absolute-value corner is inside the identically-one branch.
 * Piecewise derivatives use the active branch; no singular derivative is
 * evaluated at the center or at either flat support join.
 */
export function sourcePartitionBump(G,t){
  checkNodes(G,[t]);const abs=G.sqrt(G.pow(t,2));
  return G.choose(abs,G.q(1,4),G.q(3,4),G.one,G.step(G.sub(G.q(3,2),G.mul(G.q(2),abs))),G.zero);
}

function oneDimensional(G,offset,name){
  checkNodes(G,[offset]);
  if(G.nodes[offset].op==='rational'){
    const [n,d]=G.nodes[offset].args.map(BigInt);if(2n*(n<0n?-n:n)>d)fail('INVALID_INPUT','A declared nearest-integer offset must lie in [-1/2,1/2].');
  }
  const indices=[-1,0,1];
  const bumps=indices.map(j=>sourcePartitionBump(G,G.sub(offset,G.q(j))));
  const squares=bumps.map(b=>G.pow(b,2)),denominator=G.add(...squares);
  const weights=squares.map(s=>G.div(s,denominator));
  return {name,offset,indices,bumps,squares,denominator,weights,
    exactSum:G.one,expandedSum:G.add(...weights),denominatorLower:G.q(1,4),
    domain:'-1/2 <= offset <= 1/2, relative to an arbitrary nearest integer',
    completeness:'For every omitted integer |j|>=2, |offset-j|>=3/2>3/4, so the omitted bump is exactly zero.',
    denominatorProof:'The j=0 bump is at least b(1/2)=sigma(1/2)=1/2. Thus the sum of the three squares is at least 1/4.',
    identity:{numeratorSum:denominator,commonDenominator:denominator,reducedValue:G.one},
    smoothness:'The finite denominator is positive. Every translated bump and every normalized square root is C-infinity. Changing the nearest-integer chart only relabels the same complete locally finite family.'};
}

/** An arbitrary point in the complete family is covered by three band
 * candidates and three candidates in each of its three mesh coordinates.
 * Mesh offsets are separate in every band because the band chart and mesh
 * change with ell. The 81 candidates include structural zero weights;
 * at most 16 weights can be strictly positive at one point.
 */
export function sourceSquaredProductPartition(G,input={}){
  if(!input||Object.keys(input).some(k=>!['bandOffset','meshOffsets'].includes(k)))fail('INVALID_INPUT','Use bandOffset and the three band-specific meshOffsets only.');
  const {bandOffset,meshOffsets}=input;
  if(!Array.isArray(meshOffsets)||meshOffsets.length!==3||meshOffsets.some(a=>!Array.isArray(a)||a.length!==3))fail('INVALID_INPUT','Supply three mesh-coordinate offsets separately for each of the three relative bands.');
  checkNodes(G,[bandOffset,...meshOffsets.flat()]);
  const band=oneDimensional(G,bandOffset,'band'),meshes=meshOffsets.map((a,i)=>a.map((x,j)=>oneDimensional(G,x,`mesh_${i-1}_${j}`))),rows=[];
  for(let b=0;b<3;b++)for(let r=0;r<3;r++)for(let z=0;z<3;z++)for(let t=0;t<3;t++){
    const multi=[r-1,z-1,t-1],meshFactors=[meshes[b][0].weights[r],meshes[b][1].weights[z],meshes[b][2].weights[t]];
    rows.push({key:[b-1,...multi].join(':'),relativeBand:b-1,relativeMesh:multi,
      squaredCutoff:G.mul(band.weights[b],...meshFactors),bandSquaredCutoff:band.weights[b],meshFactors,
      signColumns:[1,-1],countInGlobalSum:1});
  }
  const expandedSquaredSum=G.add(...rows.map(r=>r.squaredCutoff));
  const result={schema:'MathScope.ExactGlobalSquaredPartition/1',band,meshes,rows,
    expandedSquaredSum,exactSquaredSum:G.one,candidateBoxes:81,maxPositiveBoxes:16,
    identity:'sum_ell chi_ell^2 product_(j=1..3) sum_(a_j in Z) chi_(ell,a_j)^2 = sum_ell chi_ell^2 = 1',
    factoredBandSums:meshes.map((a,b)=>G.mul(band.weights[b],...a.map(d=>G.div(d.identity.numeratorSum,d.denominator)))),
    originalFamily:{bump:'1 on |t|<=1/4; sigma(3/2-2|t|) for 1/4<|t|<3/4; 0 for |t|>=3/4',
      oneDimensional:'chi_j(t)=b(t-j)/sqrt(sum_(k in Z) b(t-k)^2)',
      bandCoordinate:'t=-log(q)/log(2)',bandScale:'Q_ell=2^(-ell)',
      meshCoordinate:'ell^6*(C_ell(r,z,t)-fixed_origin)',meshSize:'ell^(-6)=Sstar^(-3)',
      bandSupport:'|t-ell|<3/4 implies 1/2<q/Q_ell<2',
      shellSelection:'At an active shell point, a nonzero mesh cutoff puts the point inside its box. That point witnesses B_(ell,a) intersect A_ell, hence a belongs to I_ell. Every excluded box has zero cutoff at the point.',
      representatives:'The representative of each selected box is fixed before differentiation; this identity uses no choice of a preferred representative.',
      lowerBandCutoff:'The actual source caller must choose ell0 below every active band on 0<q<q*. The all-integer normalization alone does not prove this condition.',
      pointwiseInfiniteComplementIsExactlyZero:true,uncutInfiniteNumericalSumUsed:false},
    scope:{actualPulseFamilyAuthenticated:false,actualUniformQStarCertified:false,originalN506Complete:false,
      allRealSquaredPartitionAlgebra:true,allIndexComplementProved:true,axisOffsetsRequireDeclaredDomain:true,
      numericalHIntegralExecuted:false,rawExpressionAutomaticallySimplified:false}};
  saved.set(result,{G,nodeCount:G.nodes.length,nodes:JSON.stringify(G.nodes),data:JSON.stringify(result)});
  return result;
}

export function assertSourceSquaredProductPartition(G,partition){
  const s=saved.get(partition);
  if(!s||s.G!==G||JSON.stringify(G.nodes.slice(0,s.nodeCount))!==s.nodes||JSON.stringify(partition)!==s.data)fail('INVALID_SOURCE_CONSTRUCTION','Use the unchanged generated complete squared partition, with each box counted once.');
  return true;
}

/** Audit the physical powers as affine polynomials in the exact positive h.
 * Coefficients are rational, so no tiny h is rounded to zero.
 */
export function covariancePhysicalExponentAudit(){
  const add=(...a)=>[0,1].map(j=>a.reduce((s,v)=>qadd(s,v[j]),Q(0))),scale=(a,n)=>a.map(v=>qmul(v,Q(n)));
  const A=[Q(1,2),Q(1)],h=[Q(0),Q(1)],half=[Q(1,2),Q(0)];
  const exponentQ=add(scale(A,-2),h,A,half),exponentq=scale(add(A,half),-1);
  return {schema:'MathScope.ExactCovariancePhysicalExponents/1',arithmetic:'BIGINT_RATIONAL_AFFINE_POLYNOMIALS_IN_H',
    A:A.map(qtext),epsilon:h.map(qtext),targetRatio:add(A,half).map(qtext),
    QExponent:exponentQ.map(qtext),qExponent:exponentq.map(qtext),
    identity:'-2A+h+(A+1/2)=0, -(A+1/2)=-1-h',
    pass:exponentQ.every(x=>x[0]===0n)&&exponentq.every(x=>x[0]===-1n&&x[1]===1n),
    hReplacedByZero:false};
}

/** One arbitrary band's exact scale, followed by the all-box partition.
 * The actual-source caller must authenticate C(W_beta)=epsilon*Tstar_beta
 * for every member and cross-label auxiliary disjointness. The universal
 * scale identity allows different Q_beta in every summand.
 */
export function covarianceGlobalAssemblyRecipe(G,input={}){
  if(!input||Object.keys(input).some(k=>!['h','q','Q','target','partition'].includes(k)))fail('INVALID_INPUT','Use exact h,q,Q,target and a generated squared partition.');
  const {h,q,Q:bandQ,target,partition}=input;
  if(!Array.isArray(target)||target.length!==2)fail('INVALID_INPUT','The leading covariance target has exactly two components.');
  checkNodes(G,[h,q,bandQ,...target]);assertSourceSquaredProductPartition(G,partition);
  for(const x of [h,q,bandQ])if(G.nodes[x].op==='rational'&&BigInt(G.nodes[x].args[0])<=0n)fail('INVALID_INPUT','The source h and both physical scales must be strictly positive.');
  const A=G.add(G.q(1,2),h),power=(x,a)=>G.exp(G.mul(a,G.log(x))),epsilon=power(bandQ,h),targetRatio=power(G.div(bandQ,q),G.add(A,G.q(1,2)));
  const targetStar=target.map(x=>G.mul(targetRatio,x)),localCovariance=targetStar.map(x=>G.mul(epsilon,x)),physicalScale=power(bandQ,G.mul(G.q(-2),A));
  const physicalOneBand=localCovariance.map(x=>G.mul(physicalScale,x)),globalPhysicalScale=power(q,G.neg(G.add(A,G.q(1,2)))),physicalTarget=target.map(x=>G.mul(globalPhysicalScale,x));
  const rows=partition.rows.map(r=>({key:r.key,relativeBand:r.relativeBand,relativeMesh:r.relativeMesh,
    squaredCutoff:r.squaredCutoff,signColumns:[1,-1],countInGlobalSum:1,
    reducedPhysicalContribution:physicalTarget.map(x=>G.mul(r.squaredCutoff,x))}));
  const expandedPhysicalSum=[0,1].map(j=>G.add(...rows.map(r=>r.reducedPhysicalContribution[j]))),exponents=covariancePhysicalExponentAudit();
  return {schema:'MathScope.ExactCovarianceGlobalAssemblyRecipe/1',roots:{h,q,Q:bandQ,A,epsilon,targetRatio,targetStar,localCovariance,physicalScale,physicalOneBand,globalPhysicalScale,physicalTarget,expandedPhysicalSum},rows,exponents,
    identity:'sum_(beta=(ell,a)) Q_beta^(-2A)*eta_beta^2*C(W_beta)=q^(-A-1/2)*T0',
    exactReducedPhysicalSum:physicalTarget,exactResidual:[G.zero,G.zero],
    premises:'h>0, q>0, Q_beta>0; all band/mesh offsets are in [-1/2,1/2]; every active index is above ell0 and every local H/positive inverse and cross-label separation is source-authenticated.',
    proof:{local:'C(W_beta)=epsilon_beta*H_beta*y_beta=epsilon_beta*T0,star_beta must be authenticated for every box.',
      band:'For every positive Q_beta and q, the exact affine exponent audit removes Q_beta from its physical contribution.',
      partition:'Use the generated complete locally finite band-specific product partition. Sum one squared cutoff per box, with both sign columns inside its covariance.',
      crossTerms:'Disjoint auxiliary supports of distinct labels on overlapping slow supports must be authenticated; angular mean-zero alone does not remove arbitrary cross-label products.',
      edges:'If the actual leading target is zero, invertibility gives y=0 and hence zero covariance. Strict positivity applies only on the open stress shell. Smoothness of the zero extension requires the source flat-jet theorem.',
      derivativeScope:'This algebraic identity does not establish the all-order derivative estimates of the actual amplitudes.',
      average:'Haar-and-angular averaged momentum covariance; not the pointwise instantaneous velocity product.'},
    checks:[{id:'exact-source-scale-cancellation',pass:exponents.pass},{id:'complete-generated-squared-partition',pass:assertSourceSquaredProductPartition(G,partition)},
      {id:'unique-slow-boxes',pass:rows.length===81&&new Set(rows.map(r=>r.key)).size===81},
      {id:'both-signs-inside-each-single-box',pass:rows.every(r=>r.countInGlobalSum===1&&same(r.signColumns,[1,-1]))}],
    scope:{conditionalAssemblyLemma:true,allIndexPartitionConstructed:true,sourceUniformQStarCertified:false,actualEveryBoxHCertified:false,
      actualGlobalEquation730Certified:false,originalN506Complete:false,actualSourceBindingRequired:true,numericalQuadratureExecuted:false,formalKernelProof:false}};
}
