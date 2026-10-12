/** Finite-index, cutoff and asymptotic algebra for the ORIGINAL physical
 * background residual. No source field, zero coefficient or diagonal
 * inequality may be supplied to turn this generic kernel into evidence.
 */
import {ActualConvergentExpressions} from './actual-continuation-exact-functions.mjs';
import {sourceGraphRationalIdentity} from './actual-continuation-exact-identities.mjs';
import {momentumDifferenceIdentity} from './actual-strengthened-background-kernels.mjs';
import {fail} from './actual-continuation-arithmetic.mjs';

export function allFiniteResidualLedger({truncationOrder=2,maxPairs=100000}={}){
  const N=truncationOrder;
  if(!Number.isSafeInteger(N)||N<1||!Number.isSafeInteger(maxPairs)||maxPairs<1)fail('INVALID_INPUT','Use a positive finite truncation and pair-work budget.');
  const requiredPairs=4*(N+1)*(N+1);
  if(!Number.isSafeInteger(requiredPairs)||requiredPairs>maxPairs)fail('RESOURCE_LIMIT','The full finite ordered convolution exceeds its pair-work budget.');
  const pairs=n=>Array.from({length:N+1},(_,i)=>[i,n-i]).filter(([,j])=>j>=0&&j<=N),rows=[];
  for(let n=0;n<=2*N+1;n++){
    const previous=n-1,omegaPrevious=n-2;
    rows.push({order:n,retained:n<=N,sameOrderLinearPresent:n<=N,orderedPairs:pairs(n),
      tangentialAxialViscosity:n>=1&&previous<=N?previous:null,
      omega:n===0?null:{order:previous,orderedPairs:pairs(previous),timeAndRadialViscosity:previous<=N?previous:null,
        axialViscosity:omegaPrevious>=0&&omegaPrevious<=N?omegaPrevious:null}});
  }
  const checks={allRows:rows.length===2*N+2,allOrderedPairsExactlyOnce:rows.reduce((n,r)=>n+r.orderedPairs.length,0)===(N+1)**2,
    shiftedOmegaAllOrderedPairsExactlyOnce:rows.reduce((n,r)=>n+(r.omega?.orderedPairs.length??0),0)===(N+1)**2,
    noSameOrderLinearInTail:rows.filter(r=>!r.retained).every(r=>!r.sameOrderLinearPresent),
    everyTailPairHasPositiveIndex:rows.filter(r=>!r.retained).every(r=>r.orderedPairs.every(([i,j])=>i>0&&j>0)),
    exactTangentialLastViscosity:rows.filter(r=>!r.retained&&r.tangentialAxialViscosity!==null).length===1&&rows[N+1].tangentialAxialViscosity===N,
    lastRadialPairRetained:rows[2*N+1].omega.orderedPairs.length===1&&rows[2*N+1].omega.orderedPairs[0][0]===N&&rows[2*N+1].omega.orderedPairs[0][1]===N};
  if(!Object.values(checks).every(Boolean))fail('INTERNAL_VALIDATION','An ordered physical residual coefficient was lost.');
  return {schema:'MathScope.AllFiniteResidualLedger/1',truncationOrder:N,rows,checks,pass:true,work:{requiredPairs,maxPairs},
    mathematicalTruncationOrderCap:null,sourceAuthenticated:false,
    induction:'Multiplication of two finite sums retains every ordered pair 0<=i,j<=N once at i+j. The original axial viscosity shifts by1; radial Omega products shift by1, and their axial viscosity by2. This argument applies to every finite N.',
    firstTailOrder:N+1,lastTailOrder:2*N+1,minimumGain:'2*h*(N+1)',loss:'2*A+1+m, independent of N',
    zerosOnlyOutsideFinitePolynomial:true,unconstructedInfiniteCoefficientsSetToZero:false};
}

/** Keep BOTH the continuity and primitive defects. The original radial
 * cutoff commutator cannot be omitted before taking further derivatives.
 */
export function originalCutoffStreamContinuityIdentity(){
  const G=new ActualConvergentExpressions(),q=(n,d=1)=>G.q(n,d),
    X=G.fresh('cutoff_X'),nu=G.fresh('cutoff_nu'),chi=G.fresh('cutoff_chi'),eulerChi=G.fresh('cutoff_euler_chi'),
    U=G.fresh('cutoff_U'),Ux=G.fresh('cutoff_Ux'),Ueta=G.fresh('cutoff_Ueta'),
    M=G.fresh('cutoff_M'),Mx=G.fresh('cutoff_Mx'),v=G.fresh('cutoff_v'),vx=G.fresh('cutoff_vx'),
    eta=G.core.eta,L=G.core.L,A=G.core.A,d=G.core.d,rules=new Map([[X,G.one],[M,Mx],[v,vx],[U,Ux]]),cache=new Map();
  const dx=id=>{
    if(rules.has(id))return rules.get(id);if(cache.has(id))return cache.get(id);const {op,args}=G.nodes[id];let value;
    if(['coordinate','rational','source_parameter'].includes(op))value=G.zero;
    else if(op==='add')value=G.add(...args.map(dx));
    else if(op==='multiply')value=G.add(...args.map((a,j)=>G.mul(dx(a),...args.filter((_,k)=>k!==j))));
    else if(op==='inverse')value=G.neg(G.mul(G.pow(args[0],-2),dx(args[0])));
    else if(op==='integer_power')value=G.mul(q(args[1]),G.pow(args[0],args[1]-1),dx(args[0]));
    else fail('UNSUPPORTED','The original stream kernel uses rational differential polynomials only.');
    cache.set(id,value);return value;
  };
  const zU=G.div(G.add(G.mul(q(2),eta,G.sub(G.mul(G.sub(nu,A),U),G.mul(X,Ux))),G.mul(d,Ueta)),L),
    divergence=G.add(dx(G.mul(X,v)),zU),
    radialCut=G.sub(G.mul(chi,v),G.div(G.mul(q(2),eta,eulerChi,M),G.mul(X,L))),
    axialCutDerivative=G.add(G.mul(chi,zU),G.div(G.mul(q(2),eta,eulerChi,U),L)),
    chiOnly=G.add(dx(G.mul(X,chi,v)),axialCutDerivative),
    observed=G.add(dx(G.mul(X,radialCut)),axialCutDerivative),
    expected=G.add(G.mul(chi,divergence),G.div(G.mul(q(2),eta,eulerChi,G.sub(U,Mx)),L)),
    check=sourceGraphRationalIdentity(G,G.sub(observed,expected)),
    negative={omittedRadialCommutator:sourceGraphRationalIdentity(G,G.sub(chiOnly,expected)),
      unprovedMassPrimitive:sourceGraphRationalIdentity(G,G.sub(observed,G.mul(chi,divergence))),
      unprovedSourceContinuity:sourceGraphRationalIdentity(G,observed)};
  if(!check.pass||Object.values(negative).some(r=>r.pass))fail('INTERNAL_VALIDATION','The cutoff stream mass defect or commutator disappeared.');
  return {schema:'MathScope.OriginalCutoffStreamContinuityIdentity/1',check,negativeControls:negative,pass:true,
    identity:'normalized div u_n^cut=chi*originalDiv+2*eta/L*(q*d_q chi)*(U_n-M_nX)',
    originalRadialCoefficient:'q^(-1/2+2nh)*y*[chi*v_n/2-eta/L*(q*d_q chi)*(M_n/X)]',
    potential:'q^(-h+2nh)*chi*(M_n/X)*(-y2,y1,0)/2',
    sourceContinuityOrMassAuthenticated:false,allFurtherDerivatives:'Once both SAME source defects vanish, every physical derivative of this exact smooth identity is zero.'};
}

/** A concrete exact choice of the comparison order. J is a symbolic
 * ceiling of a finite expression in the original positive h. Its enormous
 * possible numerical value is neither materialized nor rounded to zero.
 */
export function originalBackgroundFlatnessArithmetic(G,{derivativeOrder=0,decayOrder=1}={}){
  const m=derivativeOrder,P=decayOrder;
  if(!G||!Number.isSafeInteger(m)||m<0||!Number.isSafeInteger(P)||P<0)fail('INVALID_INPUT','Use a graph and finite nonnegative derivative/decay orders.');
  const q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),A=G.core.A,r=m+2,K=G.add(G.mul(q(2),A),q(r)),H=q(m+1),
    threshold=G.add(q(P+2),G.mul(q(2),K),H),J=G.maximum(q(r),G.ceiling(G.div(threshold,h))),
    tailExponent=G.sub(G.mul(G.add(J,G.one),h),K),differenceExponent=G.sub(tailExponent,G.add(H,K)),
    finiteExponent=G.sub(G.mul(q(2),h,G.add(J,G.one)),G.add(G.mul(q(2),A),q(m+1))),
    finiteMargin=G.sub(G.sub(G.mul(q(2),threshold),G.add(G.mul(q(2),A),q(m+1))),q(P+2)),
    positiveMargin=G.add(q(P+11+5*m),G.mul(q(6),A)),
    marginCheck=sourceGraphRationalIdentity(G,G.sub(finiteMargin,positiveMargin));
  if(!marginCheck.pass)fail('INTERNAL_VALIDATION','The finite-tail comparison exponent changed.');
  return {schema:'MathScope.OriginalBackgroundFlatnessArithmetic/1',derivativeOrder:m,decayOrder:P,requiredTupleDerivativeOrder:r,
    partialVelocityLoss:K,stressCoefficientLoss:H,threshold,comparisonOrder:J,tailExponent,differenceExponent,finiteExponent,marginCheck,
    bounds:{tupleTail:'|U_B-U^[J]|_(m+2)<=2^-J*q^((J+1)h-(2A+m+2)) once the first J cutoffs are1.',
      fixedPartialVelocity:'|u^[J]|_(m+2)<=C_Jm*q^(-(2A+m+2))',
      physicalDifference:'|F(U_B)-F(U^[J])|_m<=D_m*q^(-(m+1))*|U_B-U^[J]|_(m+2)*(1+|u^[J]|_(m+2)+|U_B-U^[J]|_(m+2))',
      finiteResidual:'|F(U^[J])|_m<=C_Jm*q^(2h(J+1)-(2A+1+m))'},
    consequence:'Both residual terms are O(q^(P+2)), hence O(q^P), after J is fixed and q is in the actual common first-J plateau. This proves every fixed physical derivative and every decay order.',
    orderOfChoices:'Choose m,P; define finite exact J; take the same source b_1,...,b_J; restrict q<min(1,1/(2*b_J)). All constants may depend on J,m and the fixed profile rectangle.',
    stressGeometry:'On Xminus<=X<=Xb, r=sqrt(2qX). Derivatives of the cylindrical stress-divergence coefficients through m cost at most q^(-(m+1)); outside this annulus the stress difference is identically zero.',
    positiveHRequired:true,hReplacedByZero:false,actualSameSequenceAuthenticated:false,sourceResidualsProved:false,
    genericMomentumDifference:momentumDifferenceIdentity(),newLeanKernelProof:false};
}

/** Majorize every Cartesian derivative of the ACTUAL cylindrical stress
 * coefficients. A monomial x1^a*x2^b*r^-k differentiates into its power
 * derivative and -k*x_j times r^(-k-2). Absolute coefficients and both
 * transverse directions are kept, so this covers every ordered word.
 */
export function physicalStressGeometryMajorants(G,{derivativeOrder=0,sourceXminus,maxWork=200000}={}){
  const m=derivativeOrder;
  if(!G?.nodes[sourceXminus]||G.freeCoordinates(sourceXminus).size||!Number.isSafeInteger(m)||m<0||!Number.isSafeInteger(maxWork)||maxWork<1)
    fail('INVALID_INPUT','Use a retained positive annulus endpoint, finite derivative order and finite work budget.');
  const q=(n,d=1)=>G.q(n,d),radius=G.sqrt(G.mul(q(2),sourceXminus)),rows=[];let work=0;
  let terms=new Map();
  const insert=(map,a,b,k,c)=>{const key=[a,b,k].join(':');map.set(key,(map.get(key)??0n)+c);};
  // Four angular gradient coefficients, two angular zero-order
  // coefficients, two axial gradient coefficients and one axial 1/r.
  for(const[a,b,k,c]of[[1,1,2,2n],[0,2,2,1n],[2,0,2,1n],[0,1,2,2n],[1,0,2,2n],[1,0,1,1n],[0,1,1,1n],[0,0,1,1n]])insert(terms,a,b,k,c);
  for(let j=0;j<=m;j++){
    const sums=[0n,0n];
    for(const[key,c]of terms){const[a,b,k]=key.split(':').map(Number),degree=k-a-b-j;
      if(degree!==0&&degree!==1)fail('INTERNAL_VALIDATION','A stress geometry homogeneity changed.');sums[degree]+=c;}
    rows.push({derivativeOrder:j,degreeZeroCoefficient:String(sums[0]),degreeOneCoefficient:String(sums[1]),
      bound:G.add(G.mul(q(sums[0]),G.pow(radius,-j)),G.mul(q(sums[1]),G.pow(radius,-j-1)))});
    if(j===m)break;const next=new Map();
    for(const[key,c]of terms){
      if(++work>maxWork)fail('RESOURCE_LIMIT','The complete finite stress geometry recurrence exhausted its work budget.');
      const[a,b,k]=key.split(':').map(Number);
      if(a)insert(next,a-1,b,k,BigInt(a)*c);if(b)insert(next,a,b-1,k,BigInt(b)*c);
      if(k){insert(next,a+1,b,k+2,BigInt(k)*c);insert(next,a,b+1,k+2,BigInt(k)*c);}
    }
    terms=next;
  }
  const leibniz=q(1n<<BigInt(m)),stressConstant=G.mul(leibniz,G.add(...rows.map(r=>r.bound))),
    momentumDifferenceConstant=G.add(G.mul(q(16),leibniz),stressConstant);
  return {schema:'MathScope.PhysicalStressGeometryMajorants/1',derivativeOrder:m,sourceXminus,radius,rows,stressConstant,momentumDifferenceConstant,
    initialCoefficientSums:{degreeZero:'6',degreeOne:'5'},work:{operations:work,maxWork},
    stressFormula:'Dtheta(S)=((-x2/r),(x1/r),0)*[(x1/r)*S_x1+(x2/r)*S_x2+2*S/r]; Dz(S)=(0,0,(x1/r)*S_x1+(x2/r)*S_x2+S/r).',
    identity:'partial_xj(x1^a*x2^b*r^-k)=power derivative-k*x_j*x1^a*x2^b*r^(-k-2).',
    inequality:'|D^I divStress(S)|<=stressConstant*q^(-(m+1))*|S|_(m+1), |I|<=m, on r>=sqrt(2qXminus).',
    sourcePositiveEndpointRequired:true,sourceAuthenticated:false,mathematicalDerivativeOrderCap:null};
}
