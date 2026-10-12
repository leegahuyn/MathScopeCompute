/** Exact index operations for the original (6.8) family.
 *
 * The finite algorithms below are arithmetic kernels. They do not authenticate
 * a Navier--Stokes field. In particular a successful pointwise inventory is not
 * a radial inventory, and a caller predicate is not a source-domain proof.
 */
import {readRational,rational,qadd,qsub,qmul,qcompare,qtext} from '../../mathscope-m2/navier/actual-continuation-arithmetic.mjs';

const error=(code,message)=>{throw Object.assign(new Error(message),{code});};
const Q=x=>Array.isArray(x)?rational(...x):readRational(x);
const floorQ=([n,d])=>n>=0n?n/d:-((-n+d-1n)/d);
const ceilQ=x=>-floorQ([-x[0],x[1]]);
const absQ=([n,d])=>[n<0n?-n:n,d];
const ONE=rational(1),HALF=rational(1,2),SUPPORT=rational(3,4);

function exactInteger(value,name){
  const x=Q(value);
  if(x[1]!==1n)error('INVALID_INPUT',name+' must be an exact integer.');
  return x[0];
}

/** All original translates with nonzero bump at an exact coordinate.
 * The endpoints +/-3/4 are flat zero, so strict inequality is intentional.
 */
export function exactActiveTranslates(coordinate){
  const x=Q(coordinate),nearest=floorQ(qadd(x,HALF)),rows=[];
  for(const displacement of [-1n,0n,1n]){
    const label=nearest+displacement,offset=qsub(x,rational(label));
    if(qcompare(absQ(offset),SUPPORT)<0)rows.push({label:String(label),offset:qtext(offset)});
  }
  return {coordinate:qtext(x),nearest:String(nearest),rows,
    support:'abs(x-j)<3/4',candidateCount:3,positiveCount:rows.length,
    omittedComplement:'For abs(j-nearest)>=2, abs(x-j)>=3/2>3/4.',
    sourceAuthenticated:false};
}

/** The three bands have their OWN three mesh coordinates. A single mesh
 * coordinate reused for all bands is rejected by the source wrapper.
 */
export function exactPointLabelInventory({log2InverseQ,meshCoordinatesByBand}){
  const b=exactActiveTranslates(log2InverseQ);
  if(!meshCoordinatesByBand||typeof meshCoordinatesByBand!=='object'||Array.isArray(meshCoordinatesByBand))
    error('INVALID_INPUT','Supply three exact mesh coordinates separately for each active band.');
  const rows=[];
  for(const band of b.rows){
    const coordinates=meshCoordinatesByBand[band.label];
    if(!Array.isArray(coordinates)||coordinates.length!==3)error('INVALID_INPUT','Missing original mesh coordinates for band '+band.label+'.');
    const axes=coordinates.map(exactActiveTranslates);
    for(const r of axes[0].rows)for(const z of axes[1].rows)for(const t of axes[2].rows)
      rows.push({ell:band.label,mesh:[r.label,z.label,t.label],bandOffset:band.offset,
        meshOffsets:[r.offset,z.offset,t.offset],signs:[1,-1],countInSquaredPartition:1});
  }
  if(rows.length>16)error('INTERNAL_VALIDATION','The original 2*2*2*2 pointwise overlap bound was violated.');
  return {schema:'MathScope.N6.ExactPointLabelInventory/1',rows,positiveBoxCount:rows.length,
    signedWaveCount:2*rows.length,maxCandidateBoxes:81,maxPositiveBoxes:16,
    omittedComplementExactlyZero:true,radialIntegralInventory:false,sourceAuthenticated:false};
}

/** All radial grid labels whose support can meet a FIXED radial interval.
 * The count is O(ell^6)=O(S^3), and can be enormous. It is kept as a BigInt
 * range and streamed; no conversion to Number or silent first-N truncation.
 */
export function exactRadialLabelInventory({ell,radiusInterval,z,t,maxEnumerated=100000}){
  const level=exactInteger(ell,'ell');
  if(level<1n)error('INVALID_INPUT','The original dyadic band is positive.');
  if(!Array.isArray(radiusInterval)||radiusInterval.length!==2)error('INVALID_INPUT','Use both endpoints of the fixed radial interval.');
  const left=Q(radiusInterval[0]),right=Q(radiusInterval[1]);
  if(qcompare(left,right)>=0)error('INVALID_INPUT','The radial interval must have positive length.');
  if(!Number.isSafeInteger(maxEnumerated)||maxEnumerated<0||maxEnumerated>1000000)
    error('RESOURCE_LIMIT','Use an explicit radial enumeration budget from0 through1000000.');
  const factor=rational(level**6n),scaledLeft=qmul(factor,left),scaledRight=qmul(factor,right),
    first=ceilQ(qsub(scaledLeft,SUPPORT)),last=floorQ(qadd(scaledRight,SUPPORT)),
    radialCount=last>=first?last-first+1n:0n,
    zRows=exactActiveTranslates(qmul(factor,Q(z))).rows,tRows=exactActiveTranslates(qmul(factor,Q(t))).rows,
    boxCount=radialCount*BigInt(zRows.length*tRows.length),signedCount=2n*boxCount,
    span=qsub(scaledRight,scaledLeft),radialCountUpper=qadd(span,rational(3));
  if(qcompare(rational(radialCount),radialCountUpper)>0)error('INTERNAL_VALIDATION','The exact radial count exceeded length*ell^6+3.');
  function* enumerate(){
    if(boxCount>BigInt(maxEnumerated))error('RESOURCE_LIMIT','Complete radial inventory has '+boxCount+' boxes; budget is '+maxEnumerated+'. No prefix was returned as complete.');
    for(let r=first;r<=last;r++)for(const zz of zRows)for(const tt of tRows)
      yield {ell:String(level),mesh:[String(r),zz.label,tt.label],signs:[1,-1]};
  }
  return {schema:'MathScope.N6.ExactRadialLabelInventory/1',ell:String(level),
    radiusInterval:[qtext(left),qtext(right)],meshScale:String(level**6n),radialFirst:String(first),radialLast:String(last),
    radialCount:String(radialCount),boxCount:String(boxCount),signedWaveCount:String(signedCount),
    radialCountUpper:qtext(radialCountUpper),boundClass:'S^3 with S=ell^2',
    fixedZT:{z:qtext(Q(z)),t:qtext(Q(t))},enumerate,
    includesBoundaryZeroCandidates:true,pointwiseCountUsedForRadialIntegral:false,
    everyCandidateStillNeedsOriginalShellMembership:true,sourceAuthenticated:false};
}

/** Dense, canonical candidates in the INTERIOR of the original closed
 * support box. A representative is chosen once per immutable (ell,a).
 * A source certifier must establish membership in B_(ell,a) intersect A_ell.
 */
export function* dyadicRepresentativeOffsets({maxDepth=12,maxCandidates=100000}={}){
  if(!Number.isSafeInteger(maxDepth)||maxDepth<2||maxDepth>30||!Number.isSafeInteger(maxCandidates)||maxCandidates<1||maxCandidates>1000000)
    error('RESOURCE_LIMIT','Use finite representative depth2..30 and1..1000000 candidates.');
  let count=0;
  yield {depth:0,offsets:['0','0','0'],ordinal:count++};
  for(let depth=2;depth<=maxDepth;depth++){
    const denominator=1n<<BigInt(depth),limit=3n*(denominator/4n)-1n;
    for(let a=-limit;a<=limit;a++)for(let b=-limit;b<=limit;b++)for(let c=-limit;c<=limit;c++){
      // Except at depth2, an all-even tuple appeared at a smaller depth.
      if((depth>2&&a%2n===0n&&b%2n===0n&&c%2n===0n)||(a===0n&&b===0n&&c===0n))continue;
      if(count>=maxCandidates)error('RESOURCE_LIMIT','Representative search exhausted its exact candidate budget.');
      yield {depth,offsets:[a,b,c].map(n=>qtext(rational(n,denominator))),ordinal:count++};
    }
  }
}

/** An arithmetic/search kernel, deliberately not an actual source seal.
 * A fixed dovetail schedule revisits earlier inconclusive candidates at
 * higher precision. Choosing the first certified search step is deterministic
 * for a label and does not require deciding equality of computable reals.
 * The predicate returns retained evidence, never pointwise source authority.
 */
export async function searchFixedRepresentative({ell,mesh,certifyCandidate,maxDepth=12,maxCandidates=100000,maxRounds=256}){
  const level=exactInteger(ell,'ell');
  if(level<1n||!Array.isArray(mesh)||mesh.length!==3||typeof certifyCandidate!=='function')
    error('INVALID_INPUT','Use an immutable original integer label and a candidate certifier.');
  if(!Number.isSafeInteger(maxRounds)||maxRounds<1||maxRounds>10000)error('RESOURCE_LIMIT','Use a finite representative round budget1..10000.');
  const labels=mesh.map((x,i)=>exactInteger(x,'mesh['+i+']')),scale=rational(level**6n),log=[],candidates=[],
    iterator=dyadicRepresentativeOffsets({maxDepth,maxCandidates});
  let calls=0;
  for(let round=0;round<maxRounds;round++){
    const next=iterator.next();
    if(!next.done)candidates.push(next.value);
    const bits=96+32*round;
    for(const candidate of candidates){
      if(calls++>=maxCandidates)error('RESOURCE_LIMIT','Representative search exhausted its exact predicate-call budget.');
      const coordinates=candidate.offsets.map((offset,j)=>{
        const numerator=qadd(rational(labels[j]),Q(offset));
        return qtext(rational(numerator[0]*scale[1],numerator[1]*scale[0]));
      });
      const verdict=await certifyCandidate({ell:String(level),mesh:labels.map(String),coordinates,...candidate,bits,round});
      if(!verdict||!['PROVED_INSIDE','PROVED_OUTSIDE','UNRESOLVED'].includes(verdict.status))
        error('INVALID_SOURCE_CONSTRUCTION','A representative predicate must retain its exact decision status.');
      log.push({ordinal:candidate.ordinal,round,bits,status:verdict.status});
      if(verdict.status==='PROVED_INSIDE')return {schema:'MathScope.N6.FixedRepresentativeSearch/1',
        ell:String(level),mesh:labels.map(String),coordinates,offsets:candidate.offsets,ordinal:candidate.ordinal,round,bits,
        predicateEvidence:verdict,decisions:log,frozenBeforeDifferentiation:true,
        selectionRule:'first PROVED_INSIDE step of the fixed triangular candidate/precision dovetail',sourceAuthenticated:false};
    }
  }
  error('RESOURCE_LIMIT','No certified representative within the stated finite search budget.');
}

/** Exact source expression recipe for all admissible integer bands.
 * For window N use the true coefficients0..N and b_(N+1) to prove every
 * later cutoff identically zero. The windows need not be numerically small.
 */
export function originalBandWindowExpressions(G,{commonRows,ell0,coefficientOrder}){
  const N=coefficientOrder;
  if(!Number.isSafeInteger(N)||N<0||!Array.isArray(commonRows)||commonRows.length<N+1||!G.nodes[ell0])
    error('RESOURCE_LIMIT','Window N needs the genuine common selector through N+1.');
  if(typeof G.ceiling!=='function'||typeof G.maximum!=='function')error('INVALID_INPUT','Use the exact positive source expression compiler.');
  const q=(n,d=1)=>G.q(n,d),log2=G.log(q(2)),floor=x=>G.neg(G.ceiling(G.neg(x))),
    next=commonRows[N],previous=N?commonRows[N-1]:null;
  if(next.order!==N+1||!G.nodes[next.logScale]||(previous&&previous.order!==N))
    error('INVALID_SOURCE_CONSTRUCTION','Selector order or source log-scale is missing.');
  const lower=previous?G.maximum(ell0,floor(G.div(previous.logScale,log2))):ell0,
    upper=G.sub(floor(G.div(next.logScale,log2)),G.one),
    ell=G.fresh('N6_global_frozen_integer_band_N'+N),Q=G.exp(G.neg(G.mul(ell,log2)));
  return {schema:'MathScope.N6.OriginalBandWindow/1',coefficientOrder:N,lower,upper,ell,Q,
    nextSourceScale:next.scale,nextSourceLogScale:next.logScale,coefficientRows:commonRows.slice(0,N),
    domain:{ell:'integer',bounds:[lower,upper],qOverQ:['1/2','2'],mayBeEmpty:true},
    exactTail:{firstOmitted:N+1,
      proof:'ell<=floor(log2(b_(N+1)))-1 implies b_(N+1)*2^(-ell-1)>=1. For q>=2^(-ell-1), every n>=N+1 has b_n*q>=1 and all original cutoff derivatives vanish.'},
    coverage:{successiveWindowsHaveNoIntegerGap:true,
      proof:'The next lower endpoint is floor(log2(b_(N+1))), exactly one more than this upper endpoint, apart from the common ell0 maximum. Since b_n>=2^n, the upper endpoints tend to infinity.'},
    membershipProofStillRequiredForAnInstance:true,sourceAuthenticated:false};
}
