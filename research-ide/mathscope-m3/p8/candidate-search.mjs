/* Exact bounded finite-compression comparisons; no infinite operator authority. */
import {rat,radd,rsub,rmul,rdiv,rneg,req,pmul,padd,pscale,pdiv,ptrim,peq} from '../../mathscope-m2/arithmetic/rational.mjs';
import {canonical,hash} from '../../mathscope-m1/arithmetic/exact.mjs';

const MAX_DIMENSION=8,MAX_INPUT_BITS=256,MAX_INTERMEDIATE_BITS=32768;
const zero=()=>rat(),one=()=>rat(1n),clone=x=>JSON.parse(canonical(x));
const fail=(code,message)=>{const error=new Error(message);error.code=code;throw error;};
const bitLength=n=>(n<0n?-n:n).toString(2).length;
const encode=x=>x.d===1n?String(x.n):String(x.n)+'/'+String(x.d);
function q(value){
  if(typeof value!=='string'||value.length>170||! /^-?(?:0|[1-9]\d*)(?:\/[1-9]\d*)?$/.test(value))fail('EXACT_RATIONAL_REQUIRED','Matrix entries and probes must be exact rational strings.');
  const [n,d='1']=value.split('/'),result=rat(n,d);
  if(bitLength(result.n)>MAX_INPUT_BITS||bitLength(result.d)>MAX_INPUT_BITS)fail('INPUT_BUDGET','Rational exceeds 256-bit numerator/denominator budget.');
  return result;
}
function checked(value){if(bitLength(value.n)>MAX_INTERMEDIATE_BITS||bitLength(value.d)>MAX_INTERMEDIATE_BITS)fail('INTERMEDIATE_BUDGET','Exact intermediate arithmetic budget exceeded.');return value;}
function matrix(value){
  if(!Array.isArray(value)||value.length<1||value.length>MAX_DIMENSION||value.some(row=>!Array.isArray(row)||row.length!==value.length))fail('MATRIX_SHAPE','Supply a square matrix of dimension 1 through 8.');
  return value.map(row=>row.map(q));
}
const identity=n=>Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?one():zero()));
const trace=a=>a.reduce((sum,row,i)=>checked(radd(sum,row[i])),zero());
function multiply(a,b){return a.map(row=>b[0].map((_,j)=>row.reduce((sum,x,k)=>checked(radd(sum,rmul(x,b[k][j]))),zero())));}
function rank(a){
  const b=a.map(row=>row.slice()),n=a.length;let pivotRow=0;
  for(let j=0;j<n&&pivotRow<n;j++){
    const k=b.findIndex((row,i)=>i>=pivotRow&&row[j].n!==0n);if(k<0)continue;
    [b[k],b[pivotRow]]=[b[pivotRow],b[k]];const pivot=b[pivotRow][j];
    for(let i=pivotRow+1;i<n;i++){const factor=rdiv(b[i][j],pivot);for(let c=j;c<n;c++)b[i][c]=checked(rsub(b[i][c],rmul(factor,b[pivotRow][c])));}
    pivotRow++;
  }
  return pivotRow;
}
function invariants(a,momentOrder=8){
  const n=a.length;let b=identity(n),power=identity(n);const descending=[one()],moments=[];
  // Faddeev-LeVerrier over Q: B_k=A B_(k-1)+c_k I, c_k=-tr(A B_(k-1))/k.
  for(let k=1;k<=n;k++){b=multiply(a,b);const c=checked(rdiv(rneg(trace(b)),rat(BigInt(k))));descending.push(c);b=b.map((row,i)=>row.map((x,j)=>i===j?checked(radd(x,c)):x));}
  for(let k=1;k<=momentOrder;k++){power=multiply(power,a);moments.push(trace(power));}
  const characteristic=descending.slice().reverse();
  return {dimension:n,rank:rank(a),trace:trace(a),determinant:rmul(characteristic[0],rat(n%2?-1n:1n)),characteristic,fredholm:descending,selfAdjoint:a.every((row,i)=>row.every((x,j)=>req(x,a[j][i]))),moments};
}
const evaluate=(poly,z)=>poly.reduceRight((acc,c)=>checked(radd(rmul(acc,z),c)),zero());
function translatedReflected(poly,center){
  let output=[zero()],power=[one()];
  for(const coefficient of poly){output=padd(output,pscale(power,coefficient));power=pmul(power,[center,rat(-1n)]);}
  return output;
}
function encodeInvariants(v){return {dimension:v.dimension,rank:v.rank,trace:encode(v.trace),determinant:encode(v.determinant),characteristicPolynomial:v.characteristic.map(encode),characteristicConvention:'det(t I - A), ascending powers of t',fredholmPolynomial:v.fredholm.map(encode),fredholmConvention:'det(I - z A), ascending powers of z',selfAdjoint:v.selfAdjoint,traceMoments:v.moments.map((value,i)=>({order:i+1,value:encode(value)}))};}
function candidate(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['id','matrix','normalization','reflection','eigenvalueTargets'].includes(k)))fail('CANDIDATE_SCHEMA','Unknown candidate field or invalid candidate.');
  if(typeof value.id!=='string'||!value.id||value.id.length>100)fail('CANDIDATE_ID','A bounded candidate identifier is required.');
  const a=matrix(value.matrix),n=value.normalization??{scalar:'1',exponentialLinear:'0'};
  if(!n||typeof n!=='object'||Object.keys(n).some(k=>!['scalar','exponentialLinear'].includes(k)))fail('NORMALIZATION_SCHEMA','Use scalar and exponentialLinear only.');
  const scalar=q(n.scalar??'1'),linear=q(n.exponentialLinear??'0');if(scalar.n===0n)fail('ZERO_NORMALIZATION','Normalization scalar must be nonzero.');
  const inv=invariants(a);
  let reflection={status:'NOT_REQUESTED'};
  if(value.reflection!==undefined){const r=value.reflection;if(!r||Object.keys(r).some(k=>!['center','sign'].includes(k))||!['1','-1'].includes(r.sign))fail('REFLECTION_SCHEMA','Reflection requires exact center and sign 1 or -1.');const center=q(r.center);const transformed=translatedReflected(inv.characteristic,center);reflection={status:peq(inv.characteristic,pscale(transformed,q(r.sign)))?'PASS':'FAIL',center:r.center,sign:r.sign,claim:'P(t) = sign * P(center - t)',scope:'Finite characteristic polynomial only',transformed:transformed.map(encode)};}
  let coverage={status:'NOT_REQUESTED',scope:'Exact rational eigenvalues of this finite matrix only'};
  if(value.eigenvalueTargets!==undefined){
    if(!Array.isArray(value.eigenvalueTargets)||value.eigenvalueTargets.length>MAX_DIMENSION)fail('TARGET_BUDGET','At most eight distinct rational targets are supported.');
    const seen=new Set();let remaining=inv.characteristic.slice(),total=0;const entries=[];
    for(const t of value.eigenvalueTargets){if(!t||Object.keys(t).some(k=>!['value','multiplicity'].includes(k))||!Number.isInteger(t.multiplicity)||t.multiplicity<1||t.multiplicity>MAX_DIMENSION)fail('TARGET_SCHEMA','Targets require value and positive bounded multiplicity.');const valueQ=q(t.value),key=encode(valueQ);if(seen.has(key))fail('DUPLICATE_TARGET','Combine equal exact targets into one multiplicity.');seen.add(key);let actual=0;for(let j=0;j<inv.dimension;j++){const divided=pdiv(remaining,[rneg(valueQ),one()]);if(divided.r.some(x=>x.n!==0n))break;actual++;remaining=divided.q;}total+=actual;entries.push({value:key,requestedMultiplicity:t.multiplicity,actualMultiplicity:actual,matches:actual===t.multiplicity});}
    coverage={status:entries.every(t=>t.matches)&&total===inv.dimension?'PASS':'FAIL',scope:'Exact rational eigenvalues of this finite matrix only; no zeta-zero correspondence',entries,coveredMultiplicity:total,dimension:inv.dimension,remainingPolynomial:remaining.map(encode)};
  }
  return {id:value.id,a,inv,scalar,linear,output:{id:value.id,...encodeInvariants(inv),normalization:{scalar:encode(scalar),exponentialLinear:encode(linear),formula:'scalar * exp(exponentialLinear * z) * det(I - z A)'},reflection,coverage}};
}
function difference(a,b){const reasons=[];if(a.dimension!==b.dimension)reasons.push('dimension');if(!peq(a.characteristic,b.characteristic))reasons.push('characteristicPolynomial');if(!req(a.trace,b.trace))reasons.push('trace');if(a.rank!==b.rank)reasons.push('rank');if(a.selfAdjoint!==b.selfAdjoint)reasons.push('selfAdjoint');if(a.moments.length!==b.moments.length||a.moments.some((x,i)=>!b.moments[i]||!req(x,b.moments[i])))reasons.push('traceMoments');return reasons;}
function minimalPrincipalWitness(a,b){
  if(a.length!==b.length)return {status:'DIMENSION_MISMATCH',dimensions:[a.length,b.length]};
  const n=a.length;let tried=0;
  for(let size=1;size<=n;size++)for(let mask=1;mask<2**n;mask++){
    const indices=Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i));if(indices.length!==size)continue;tried++;
    const aa=indices.map(i=>indices.map(j=>a[i][j])),bb=indices.map(i=>indices.map(j=>b[i][j])),ia=invariants(aa,n),ib=invariants(bb,n),reasons=difference(ia,ib);
    if(reasons.length)return {status:'FOUND',indices,dimension:size,reasons,matrices:{A:aa.map(row=>row.map(encode)),B:bb.map(row=>row.map(encode))},invariants:{A:encodeInvariants(ia),B:encodeInvariants(ib)},searched:tried,minimality:'Minimum cardinality among same-index principal compressions; exhaustive smaller cardinalities only. No global smallest counterexample claim.'};
  }
  return {status:'NONE_IN_SEARCH_DOMAIN',searched:tried};
}
export function compareFiniteCandidates(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['A','B','probes','minimize'].includes(k)))fail('COMPARISON_SCHEMA','Supply A, B, optional rational probes and minimize.');
  if(input.minimize!==undefined&&typeof input.minimize!=='boolean')fail('COMPARISON_SCHEMA','minimize must be a boolean.');
  const a=candidate(input.A),b=candidate(input.B),reasons=difference(a.inv,b.inv);
  if(!req(a.scalar,b.scalar)||!req(a.linear,b.linear))reasons.push('determinantNormalization');
  const probes=input.probes??['0','1/2','1'];if(!Array.isArray(probes)||probes.length>16)fail('PROBE_BUDGET','At most sixteen rational determinant probes.');
  const quotient=probes.map(value=>{const z=q(value),numerator=rmul(a.scalar,evaluate(a.inv.fredholm,z)),denominator=rmul(b.scalar,evaluate(b.inv.fredholm,z));return {z:encode(z),numerator:encode(numerator),denominator:encode(denominator),rationalQuotient:denominator.n===0n?null:encode(rdiv(numerator,denominator)),exponentialExponent:encode(rmul(rsub(a.linear,b.linear),z)),status:denominator.n===0n?'DENOMINATOR_ZERO':'EXACT_FORMAL_QUOTIENT',formula:'rationalQuotient * exp(exponentialExponent); exponential is symbolic, not a certified transcendental evaluation'};});
  const result={schema:'MathScope.M3.P8.FiniteCandidateComparison/1',arithmetic:'EXACT_RATIONAL',status:reasons.length?'DISTINGUISHED':'FINITE_INVARIANTS_EQUAL',candidates:[a.output,b.output],differences:reasons,determinantNormalizationQuotient:quotient,counterexample:reasons.length&&input.minimize!==false?minimalPrincipalWitness(a.a,b.a):{status:'NOT_REQUESTED_OR_NO_FINITE_DIFFERENCE'},limits:{dimension:MAX_DIMENSION,inputRationalBits:MAX_INPUT_BITS,intermediateRationalBits:MAX_INTERMEDIATE_BITS},unresolvedBridges:['DENSE_SELFADJOINT_DOMAIN','COMPACT_RESOLVENT','ZERO_SPECTRUM_WITH_MULTIPLICITY','GLOBAL_DETERMINANT_NORMALIZATION','GLOBAL_TRACE_FORMULA','GLOBAL_FUNCTIONAL_EQUATION_DUALITY','POSITIVITY_TO_RH'].map(id=>({id,status:'RESEARCH_OPEN',proofExecuted:false})),scope:{finiteCompressionOnly:true,operatorEqualityProved:false,globalRHProved:false,formalLeanProofIssued:false,wholeP7Complete:false,wholeM3Complete:false}};
  return result;
}
export async function compareCandidateRecord(input){const snapshot=clone(input),result=compareFiniteCandidates(snapshot);return {input:snapshot,inputSHA256:await hash(snapshot),result,resultSHA256:await hash(result)};}
