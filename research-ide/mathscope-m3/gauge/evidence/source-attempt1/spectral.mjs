import {finiteSpectralModel} from '../../mathscope-m1/gauge/family.mjs';
import {symmetricEigen} from '../../mathscope-m2/gauge/transfer.mjs';
import {check,positive,number,text,integer,known,sha256} from './contracts.mjs';

export function effectiveMass(c,at,{periodic=false}={}){
 positive(at,'at');check(Array.isArray(c)&&c.length>=3&&c.every(Number.isFinite),'CORRELATOR_DATA','At least three finite, unmodified correlator values are required.');
 return c.map((value,t)=>{
  const next=t+1<c.length?c[t+1]:null,logValue=value>0&&next!==null&&next>0?Math.log(value/next)/at:null;
  const left=t>0?c[t-1]:(periodic?c[c.length-1]:null),right=next??(periodic?c[0]:null),arg=value>0&&left!==null&&right!==null?(left+right)/(2*value):null;
  const coshValue=arg!==null&&arg>=1?Math.acosh(arg)/at:null;
  return {t,time:t*at,correlation:value,logEffectiveMass:periodic?null:logValue,logDiagnostic:logValue,coshArgument:arg,coshEffectiveMass:coshValue,logStatus:periodic?'WRAPAROUND_USE_FINITE_T_MODEL':logValue===null?'NONPOSITIVE_OR_MISSING_CORRELATION':'NUMERICAL_ESTIMATE',coshStatus:value<=0?'NONPOSITIVE_CORRELATION':arg===null?'MISSING_NEIGHBOR':arg<1?'INVALID_ACOSH_ARGUMENT':'NUMERICAL_ESTIMATE'};
 });
}
export function gevp(Ct,C0,dt){
 positive(dt,'GEVP time separation');const n=C0?.length;check(Number.isInteger(n)&&n>=1&&n<=8&&[C0,Ct].every(A=>A.length===n&&A.every(r=>r.length===n&&r.every(Number.isFinite))),'GEVP_MATRIX','GEVP matrices must be finite square matrices of the same bounded dimension.');
 const asym=A=>Math.max(...A.flatMap((r,i)=>r.map((v,j)=>Math.abs(v-A[j][i]))));check(asym(C0)<1e-10&&asym(Ct)<1e-10,'GEVP_SELF_ADJOINT','Correlation matrices must be symmetric; no automatic symmetrization hides invalid inputs.');
 const e=symmetricEigen(C0),largest=Math.max(...e.values),smallest=Math.min(...e.values);
 if(smallest<=1e-12*Math.max(largest,1e-300))return {status:'SINGULAR_OR_NONPOSITIVE_REFERENCE',C0Eigenvalues:e.values,regularization:'NONE',energies:[],eigenvalues:[]};
 const W=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>e.values.reduce((s,v,k)=>s+e.vectors[i][k]*e.vectors[j][k]/Math.sqrt(v),0)));
 const B=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>W[i].reduce((s,v,k)=>s+v*Ct[k].reduce((q,z,l)=>q+z*W[l][j],0),0)));
 const v=symmetricEigen(B),energies=v.values.map(x=>x>0?-Math.log(x)/dt:null);
 return {status:v.values.every(x=>x>0)?'NUMERICAL_ESTIMATE':'NONPOSITIVE_PRINCIPAL_CORRELATOR',eigenvalues:v.values,energies,C0Eigenvalues:e.values,conditionNumber:largest/smallest,residual:v.residual,orthogonality:v.orthogonality,referenceTimeSeparation:dt,regularization:'NONE',scope:'The selected observable span only. Finite T and excited-state overlap are separate errors. No complete-spectrum gap bound is inferred.'};
}
export async function runFiniteSpectrum(input={}){
 known(input,['delta','offsets','weights','at','timeCount','hbar','energyUnit','assumptionId','periodicTime','operatorVectors'],'finite spectral input');
 const delta=positive(input.delta??1,'delta'),at=positive(input.at??.25,'at'),timeCount=integer(input.timeCount??25,'timeCount',3,128),hbar=positive(input.hbar??1,'hbar'),energyUnit=text(input.energyUnit??'ell0^-1','energyUnit'),assumptionId=text(input.assumptionId??'m3-finite-spectrum-definition','assumptionId');
 const offsets=input.offsets??[0,1,2],weights=input.weights??[1,.35,.15],model={delta,offsets,weights,times:Array.from({length:timeCount},(_,i)=>i*at),hbar,assumptionId};
 const base=finiteSpectralModel(model),periodicTime=input.periodicTime??null;if(periodicTime!==null)positive(periodicTime,'periodicTime');
 const energies=offsets.map(e=>delta+e),vectors=input.operatorVectors??[weights.map(Math.sqrt),weights.map((w,j)=>Math.sqrt(w)*(j+1))];
 check(Array.isArray(vectors)&&vectors.length>=1&&vectors.length<=4&&vectors.every(v=>v.length===weights.length&&v.every(Number.isFinite)),'OPERATOR_BASIS','Supply 1–4 real vacuum-to-excitation operator vectors of the full specified spectral dimension.');
 const rows=base.samples.map(({time,...rest})=>{const factors=energies.map(E=>Math.exp(-E*time/hbar)+(periodicTime===null?0:Math.exp(-E*(periodicTime-time)/hbar)));check(periodicTime===null||time<=periodicTime,'PERIODIC_WINDOW','Spectral times must remain inside the declared periodic interval.');const C=vectors.map(a=>vectors.map(b=>a.reduce((s,v,j)=>s+v*b[j]*factors[j],0)));return {time,...rest,correlationMatrix:C,displayCorrelation:periodicTime===null?rest.correlation:C[0][0],periodicImageTerm:periodicTime===null?0:C[0][0]-rest.correlation};});
 const C=rows.map(r=>r.displayCorrelation),mass=effectiveMass(C,at,{periodic:periodicTime!==null}),gv=gevp(rows[1].correlationMatrix,rows[0].correlationMatrix,at/hbar);
 return {status:'COMPLETED',evidenceGrade:'EXPLICIT_EFFECTIVE_MODEL',model:{...base.model,energyUnit,completeFiniteDimension:energies.length+1,operatorVectors:vectors,periodicTime,periodicConvention:periodicTime===null?'ZERO_TEMPERATURE_FINITE_DIAGONAL_MODEL':'TWO_IMAGE_SPECTRAL_REFERENCE; not a full thermal trace'},sourceHash:await sha256({model,vectors,periodicTime}),samples:rows,effectiveMass:mass,gevp:gv,energySupport:energies,exactGapInDefinedModel:base.gap,observedChannelMinimum:base.channelMass,declaredDeltaIsExactGap:offsets.some((e,j)=>e===0&&weights[j]>0),spectralBound:{formula:'sum_j w_j exp(-(Delta+epsilon_j)t/hbar) <= exp(-Delta*t/hbar) sum_j w_j',assumptions:{deltaPositive:true,nonnegativeOffsets:true,nonnegativeWeights:true,timeNonnegative:true,hbarPositive:true},maximumObservedViolation:Math.max(...base.samples.map(r=>r.boundResidual)),proof:'For each j, -(Delta+epsilon_j)t/hbar <= -Delta*t/hbar. Monotonicity of exp and w_j>=0 preserve the inequality, and finite summation preserves it.',periodicScope:'The inequality bounds the forward term only; the backward periodic image is displayed separately.'},inequalityDirection:'gap_global <= E_channel <= m_eff for a positive zero-temperature spectral measure orthogonal to the entire vacuum space; periodic cosh output is a channel estimator.',fieldSpectrumConnection:{assumptionId,kind:'EXPLICIT_MODEL_DEFINITION',quantumYMReconstruction:false},continuumGap:'OPEN_CONTINUUM'};
}

function gcd(a,b){a=a<0n?-a:a;while(b){const t=a%b;a=b;b=t;}return a;}
export function rational(s){check(typeof s==='string'&&/^-?\d{1,12}(\/\d{1,12})?$/.test(s),'EXACT_RATIONAL','Finite certificates require exact integer or p/q strings.');const [n,d='1']=s.split('/');let a=BigInt(n),b=BigInt(d);check(b>0n,'EXACT_RATIONAL','Rational denominator must be positive.');const g=gcd(a,b);return {n:a/g,d:b/g};}
const less=(a,b)=>a.n*b.d<b.n*a.d,le=(a,b)=>a.n*b.d<=b.n*a.d,eq=(a,b)=>a.n*b.d===b.n*a.d;
const mul=(a,b)=>({n:a.n*b.n,d:a.d*b.d}),div=(a,b)=>({n:a.n*b.d,d:a.d*b.n}),str=a=>`${a.n}/${a.d}`,approx=a=>Number(a.n)/Number(a.d);
export async function finiteTransferCertificate(input={}){
 known(input,['diagonal','vacuumIndices','ratioUpper','at','modelId','cutoff','modelSourceHash'],'finite transfer certificate');
 const d=input.diagonal??['1','1/2','1/4','1/8'],at=rational(input.at??'1'),r=rational(input.ratioUpper??'1/2'),z=rational('0'),one=rational('1'),v=input.vacuumIndices??[0];
 check(Array.isArray(d)&&d.length>=2&&d.length<=32,'FINITE_TRANSFER_DIMENSION','Declare the complete 2–32 dimensional diagonal transfer model.');const values=d.map(rational);
 check(less(z,at)&&less(z,r)&&less(r,one),'TRANSFER_POSITIVITY','at>0 and 0<r<1 are required.');check(values.every(x=>less(z,x)),'TRANSFER_POSITIVITY','Every diagonal eigenvalue of this positive self-adjoint transfer model must be strictly positive.');
 check(Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<d.length),'VACUUM_PROJECTOR','List distinct indices spanning the entire top eigenspace.');
 const top=values.reduce((a,b)=>less(a,b)?b:a),actual=values.map((x,i)=>eq(x,top)?i:null).filter(i=>i!==null);check(actual.length===v.length&&actual.every(i=>v.includes(i)),'INCOMPLETE_VACUUM_SPACE','The declared projector must remove every top-eigenvalue vector.');
 const excited=values.map((x,i)=>v.includes(i)?null:{index:i,ratio:div(x,top)}).filter(Boolean);check(excited.length>0&&excited.every(x=>le(x.ratio,r)),'RATIO_BOUND_REJECTED','The maximum ratio on the complete nonvacuum subspace exceeds r.');
 const rationalLower=div({n:r.d-r.n,d:r.d},at),modelId=text(input.modelId??'m3-four-state-diagonal-transfer','modelId'),cutoff=text(input.cutoff??'Complete finite C^4 model; no relation to uncut lattice Hilbert space','cutoff');
 const source={diagonal:d,vacuumIndices:v,ratioUpper:str(r),at:str(at),modelId,cutoff,modelSourceHash:input.modelSourceHash??null};
 return {status:'EXACT_RATIONAL_FINITE_CERTIFICATE',source,sourceHash:await sha256(source),dimension:values.length,fullNonvacuumSpaceControlled:true,vacuumDimension:v.length,checks:{positive:true,selfAdjoint:'EXACT_DIAGONAL',fullBasisEnumerated:true,fullVacuumRemoved:true,allExcitedRatiosBounded:true},excited:excited.map(x=>({index:x.index,exactRatio:str(x.ratio),energyEstimate:-Math.log(approx(x.ratio))/approx(at)})),gap:{symbolicLowerBound:`-log(${str(r)})/(${str(at)})`,floatDisplay:-Math.log(approx(r))/approx(at),floatDisplayIsCertified:false,conservativeExactRationalLower:str(rationalLower),conservativeExactRationalValue:approx(rationalLower),elementaryBridge:'-log r >= 1-r for 0<r<1. The rational certificate verifies (1-r)/at exactly; the logarithmic bridge is a mathematical theorem, not a Float64 enclosure.'},proofStatus:'EXACT_ARITHMETIC_CHECK; NEW_LEAN_KERNEL_RECEIPT_REQUIRED',scope:cutoff,continuumGap:'OPEN_CONTINUUM'};
}
