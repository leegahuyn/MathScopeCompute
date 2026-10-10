import {iadd,isub,imul,idiv,iscale,ilog,iexp,point,nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';
import {sourceExponentContract,assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';

const invalid=(code,message)=>{throw Object.assign(Error(message),{code});};
const midpoint=a=>a[0]+(a[1]-a[0])/2;
const bounded=(v,name,lo,hi)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)invalid('INVALID_INPUT',name+' is outside its supported finite observation domain.');return v;};
const integer=(v,name,lo,hi)=>{bounded(v,name,lo,hi);if(!Number.isSafeInteger(v))invalid('INVALID_INPUT',name+' must be an integer.');return v;};
const sqrt2=[nextDown(1.414213562373095),nextUp(1.4142135623730951)];
const qa=(a,b)=>[a[0]+b[0],a[1]+b[1]],qm=(a,b)=>[a[0]*b[0]+2n*a[1]*b[1],a[0]*b[1]+a[1]*b[0]],qn=a=>[-a[0],-a[1]],qzero=a=>a[0]===0n&&a[1]===0n;
/** Exact quadratic-field check, independent of the floating interval geometry. */
export function torusExactIdentityAudit({omitFastChainRule=false,wrongGlobalHaarFactor=false}={}){
  const J=[[3n,1n],[1n,5n]],vr=[[1n,0n],[1n,-1n]],vt=[[-1n,1n],[1n,0n]],lambda=[4n,-1n],Tg=[4n,1n],apply=v=>J.map(r=>r.reduce((a,c,i)=>qa(a,qm([c,0n],v[i])),[0n,0n])),inner=(a,b)=>a.reduce((s,x,i)=>qa(s,qm(x,b[i])),[0n,0n]);
  const rdiff=apply(vr).map((x,i)=>qa(x,qn(qm(lambda,vr[i])))),tdiff=apply(vt).map((x,i)=>qa(x,qn(qm(Tg,vt[i])))),orth=inner(vr,vt),jac=qa(qm(vr[0],vt[1]),qn(qm(vr[1],vt[0]))),normR=inner(vr,vr),normT=inner(vt,vt),expected=[4n,-2n];
  const checks=[{id:'radial-eigenvector',pass:rdiff.every(qzero)},{id:'time-eigenvector',pass:tdiff.every(qzero)},{id:'dual-orthogonality',pass:qzero(orth)},{id:'local-rectangle-jacobian',pass:qzero(qa(jac,qn(expected)))&&qzero(qa(normR,qn(jac)))&&qzero(qa(normT,qn(jac)))},{id:'haar-normalized-covering',pass:!wrongGlobalHaarFactor&&J[0][0]*J[1][1]-J[0][1]*J[1][0]===14n},{id:'pulse-unit-time-chain-rule',pass:!omitFastChainRule&&qzero(qa(normT,qn(jac)))&&qzero(orth)}];
  return {schema:'MathScope.SourceTorusExactIdentities/1',arithmetic:'BIGINT_Q_SQRT2',sourceEquations:['6.2','6.3','6.4','6.6','6.11','6.12','6.19','7.27'],checks,pass:checks.every(x=>x.pass),dualBasis:{xi:'(v_r dot (Yi-c))/Jrect',eta:'(v_t dot (Yi-c))/Jrect',Jrect:'4-2*sqrt(2)',v:'(eta+r0)/c_i'},chainRule:{Dr_v:0,Dz_v:0,time_v:omitFastChainRule?0:1,Ni_xi:0,derivation:'Jg*v_r=Lambda_g*v_r; Jg*v_t=T_g*v_t. d_eta(v)=1/c_i. The fast time coefficient c_i cancels; slow derivatives hold Yi fixed.',spatialNormalization:'sqrt(Q)*partial_z = Q^(1/2-D)*partial_Z = epsilon*partial_Z',timeNormalization:'Q^(1+h)*partial_t = -epsilon*partial_T + c_i*N_i'},haar:{fullCoveringFactor:wrongGlobalHaarFactor?'1/14':'1',preimages:'14^Delta',eachLiftJacobian:'14^-Delta',fourierProof:'(Jg^Delta)^T*n=0 iff n=0, since det(Jg)=14 != 0.'},sourceProfileValuesSubstituted:false,newLeanKernelExecution:false};
}
export function sourceTorusGeometry(){
  const Lambda=isub(point(4),sqrt2),Tg=iadd(point(4),sqrt2),bg=isub(sqrt2,point(1)),rho=idiv(ilog(Lambda),ilog(Tg)),jacobian=isub(point(4),iscale(sqrt2,2));
  const coveringDifferenceUpper=iadd(point(1),idiv(iadd(iscale(ilog(point(2)),4*65/64),point(1)),ilog(Tg)));
  return {Jg:[[3,1],[1,5]],determinant:14,sqrt2:{interval:sqrt2,exactRationalWitness:{lower:'14142135623730950/10000000000000000',upper:'14142135623730951/10000000000000000',criterion:'lower^2 < 2 < upper^2'}},Lambda:{exact:'4-sqrt(2)',interval:Lambda},Tg:{exact:'4+sqrt(2)',interval:Tg},bg:{exact:'sqrt(2)-1',interval:bg},vr:{exact:['1','1-sqrt(2)'],intervals:[point(1),iscale(bg,-1)]},vt:{exact:['sqrt(2)-1','1'],intervals:[bg,point(1)]},rho:{exact:'log(4-sqrt(2))/log(4+sqrt(2))',interval:rho},coveringDifferenceCertificate:{ell0AtLeast:8,hUpper:'1/64',bandDifferenceAtMost:4,interval:coveringDifferenceUpper,integerBound:4,pass:coveringDifferenceUpper[1]<4},haar:{normalizedCoveringFactor:'1',preimageCount:'14^Delta',perInverseLiftJacobian:'14^(-Delta)',cancellation:'14^Delta * 14^(-Delta)=1',rectangleJacobianExact:'4-2*sqrt(2)',rectangleJacobianInterval:jacobian,covarianceFactor:'(4-2*sqrt(2))*c_i/2',sourceEquations:['6.19','7.27'],notGlobalOneFourteenth:true}};
}

export function sourceBandParameters(ell){
  integer(ell,'ell',8,900);const g=sourceTorusGeometry(),h=sourceExponentContract(),hi=h.binary64Enclosure,ln2=ilog(point(2)),logQ=iscale(ln2,-ell),logS=iscale(ilog(point(ell)),2);
  const D=isub(point(.5),hi),dr=isub(iscale(imul(iadd(point(1),hi),g.rho.interval),2),iscale(hi,1e-5));
  const indexBox=idiv(isub(iscale(imul(iadd(point(1),hi),ln2),ell),logS),ilog(g.Tg.interval)),i0=Math.floor(indexBox[0]),i1=Math.floor(indexBox[1]);
  if(i0!==i1||i0<0)invalid('PRECISION_REQUIRED','The interval covering index is not one nonnegative integer; the label is not guessed.');
  const logCi=iadd(iscale(ilog(g.Tg.interval),i0),imul(iadd(point(1),hi),logQ)),logMi=iadd(iscale(ilog(g.Lambda.interval),i0),imul(iscale(dr,.5),logQ)),ci=iexp(logCi),Mi=iexp(logMi),eps=iexp(imul(hi,logQ));
  // Strict h>0 makes epsilon<1, even when both round to one at display precision.
  eps[0]=Math.max(eps[0],.5);eps[1]=Math.min(eps[1],1);
  return {ell,Q:2**(-ell),QExact:`2^(-${ell})`,epsilon:{exact:`exp(-${ell}*h*log(2))`,interval:eps,strictlyLessThanOne:true,strictlyPositive:true,notRoundedToAnExactOne:true},Sstar:ell*ell,h,D,dr:{exact:'2*(1+h)*rho_g-h*10^-5',interval:dr},covering:{index:i0,indexInterval:indexBox,frozen:true,formula:'floor(((1+h)*ell*log(2)-2*log(ell))/log(T_g))'},ci:{exact:`(4+sqrt(2))^${i0}*2^(-${ell}*(1+h))`,interval:ci,logInterval:logCi},Mi:{exact:`(4-sqrt(2))^${i0}*2^(-${ell}*d_r/2)`,interval:Mi,logInterval:logMi},carrier:{k:2,reason:'The pinned strictly positive h gives 1/2<epsilon<1 on ell=8..900, hence 1<epsilon^(-1/2)<sqrt(2)<2 and ceil=2.',epsilonK2:[nextDown(4*eps[0]),4]},sourceGeometry:g};
}

export function sourceDyadicObservation(input={},context={}){
  const profile=assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);if(input.h!==undefined)invalid('INVALID_INPUT','A source-profile observation uses its pinned exact h; do not supply a replacement h.');
  const start=integer(input.ellStart??8,'ellStart',8,900),count=integer(input.count??14,'count',1,50),R=bounded(input.R??1,'R',.01,8),Z=bounded(input.Z??.2,'Z',-8,8),T=bounded(input.T??1,'T',0,8);
  if(start+count-1>900)invalid('PRECISION_REQUIRED','The certified finite coordinate window ends at ell=900.');
  if(T===0&&Z===0)invalid('UNSUPPORTED','T=Z=0 gives q=0. The source chart does not create a value at the singular point.');
  const rows=[];
  for(let ell=start;ell<start+count;ell++){
    context.checkCancelled?.();const band=sourceBandParameters(ell),logQ=iscale(ilog(point(2)),-ell),r=iscale(iexp(iscale(logQ,.5)),R),z=iscale(iexp(imul(band.D,logQ)),Z),tau=T===0?point(0):iscale(point(band.Q),T);
    if(T>0&&tau[0]<=0)invalid('PRECISION_REQUIRED','A strictly positive time coordinate underflowed the finite observation enclosure.');
    const nextR=iscale(sqrt2,R),nextZ=iscale(iexp(imul(band.D,ilog(point(2)))),Z),nextT=2*T,nextLogQ=isub(logQ,ilog(point(2))),reconstructed={r:imul(nextR,iexp(iscale(nextLogQ,.5))),z:imul(nextZ,iexp(imul(band.D,nextLogQ))),tau:T===0?point(0):iscale(point(band.Q/2),nextT)},overlap={};
    for(const[k,a]of Object.entries({r,z,tau}))overlap[k]=Math.max(a[0],reconstructed[k][0])<=Math.min(a[1],reconstructed[k][1]);
    rows.push({...band,R,Z,T,r:midpoint(r),z:midpoint(z),tau:midpoint(tau),coordinateIntervals:{r,z,tau},coordinateExpressions:{r:`${R}*2^(-${ell}/2)`,z:`${Z}*2^(-${ell}*(1/2-h))`,tau:`${T}*2^(-${ell})`},overlapAtNextBand:{R:nextR,Z:nextZ,T:nextT,reconstructed,intervalsOverlap:overlap,exactIdentity:'Qnext=Q/2; Rnext=sqrt(2)*R; Znext=2^D*Z; Tnext=2*T'},k:band.carrier.k,epsilonK2:band.carrier.epsilonK2,oneSidedTimeBoundary:T===0});
  }
  return {profile,rows,definitions:{Q:'2^-ell',epsilon:'Q^h with the actual strictly positive source h',Sstar:'ell^2',R:'r/sqrt(Q)',Z:'z/Q^D',T:'tau/Q',physicalTime:'t=1-tau',auxiliaryTorus:'T^2 is an averaging variable, not a physical spatial dimension'},labelsFrozenDuringDifferentiation:true,geometryOnly:true,leadingFieldNumericallyEvaluated:false,sourceBound:true,checks:[{id:'same-profile-exact-h',pass:true,detail:'The full accepted N3 expression is retained; its lower binary64 enclosure endpoint zero is not substituted as h.'},{id:'same-physical-point-in-overlap',pass:rows.every(row=>Object.values(row.overlapAtNextBand.intervalsOverlap).every(Boolean)),detail:'Exact scaling identity plus independent directed interval evaluations.'},{id:'frozen-covering-and-carrier',pass:rows.every(row=>row.covering.frozen&&row.k===2&&row.epsilonK2[0]>=1&&row.epsilonK2[1]<=4),detail:'Ceil uses strict positivity of the source exponent; rounding epsilon to one would incorrectly choose k=1.'}]};
}

export function evaluatedDerivativeContract(ell=16,R=1){
  bounded(R,'R',.01,8);const band=sourceBandParameters(ell),g=band.sourceGeometry,radialFast=imul(imul(band.Mi.interval,band.dr.interval),iexp(imul(isub(band.dr.interval,point(1)),ilog(point(R)))));
  return {sourceEquations:['6.3','6.4','6.6','6.12'],physicalPhaseMap:'Y=v_r*r^d_r+v_t*t mod Z^2; Y_i=J_g^i*Y',band,R,independentCoordinates:['R','Z','T','theta','Y_i1','Y_i2'],Dr:{slow:[1,0,0,0],fast:g.vr.intervals.map(v=>imul(radialFast,v)),coefficient:radialFast,formula:'partial_R + M_i*d_r*R^(d_r-1)*(v_r dot grad_Yi)'},Dz:{slow:[0,band.epsilon.interval,0,0],fast:[point(0),point(0)],formula:'epsilon*partial_Z'},time:{slow:[0,0,iscale(band.epsilon.interval,-1),0],fast:g.vt.intervals.map(v=>imul(band.ci.interval,v)),formula:'-epsilon*partial_T+c_i*(v_t dot grad_Yi)'},theta:{slow:[0,0,0,1/R],fast:[point(0),point(0)],formula:'R^-1*partial_theta'},dualCoordinates:{xi:'dual to v_r',eta:'dual to v_t',v:'(eta+r0)/c_i',identities:{Dr_v:0,Dz_v:0,time_v:1,Ni_xi:0}},order:'Differentiate on the extended domain, evaluate at the physical map, and keep averaging at fixed slow variables distinct.',physicalPointwiseEqualsTorusAverage:false,normalization:{time:'Q^(1+h)',radial:'sqrt(Q)',axial:'sqrt(Q)'},discreteChoicesDifferentiated:false};
}

/** Applies the complete evaluated first derivative to a source-bound scalar jet. */
export function applyEvaluatedDerivatives(contract,jet){
  const names=['R','Z','T','theta','Y1','Y2'];for(const k of names)if(!Number.isFinite(jet?.[k]))invalid('INVALID_INPUT','The complete independent-variable gradient is required. Missing '+k+'.');
  const combine=(slow,fast)=>iadd(iadd(iadd(imul(Array.isArray(slow[0])?slow[0]:point(slow[0]),point(jet.R)),imul(Array.isArray(slow[1])?slow[1]:point(slow[1]),point(jet.Z))),iadd(imul(Array.isArray(slow[2])?slow[2]:point(slow[2]),point(jet.T)),imul(Array.isArray(slow[3])?slow[3]:point(slow[3]),point(jet.theta)))),iadd(iscale(fast[0],jet.Y1),iscale(fast[1],jet.Y2)));
  return {Dr:combine(contract.Dr.slow,contract.Dr.fast),Dz:combine(contract.Dz.slow,contract.Dz.fast),time:combine(contract.time.slow,contract.time.fast),theta:combine(contract.theta.slow,contract.theta.fast)};
}
