/** Pointwise enclosures of the accepted nonlinear core, with BOTH comparison errors retained. */
import {assertSourceProfile,SOURCE_PROFILE_ID} from './source-profile.mjs';
import {PINNED_N3} from './source-profile-data.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from './actual-background-data.mjs';
import {nextDown,nextUp} from '../../mathscope-m1/navier/numerics.mjs';

const bad=message=>{throw Object.assign(Error(message),{code:'INVALID_INPUT'});};
const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
const q=(n,d=1n)=>{n=BigInt(n);d=BigInt(d);if(d===0n)bad('Zero rational denominator.');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return [n/g,d/g];};
const qa=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),qn=a=>[-a[0],a[1]],qm=(a,b)=>q(a[0]*b[0],a[1]*b[1]),qd=(a,b)=>q(a[0]*b[1],a[1]*b[0]),qp=(a,n)=>q(a[0]**BigInt(n),a[1]**BigInt(n));
const qs=a=>a[1]===1n?String(a[0]):a[0]+'/'+a[1],qc=(a,b)=>a[0]*b[1]<b[0]*a[1]?-1:a[0]*b[1]>b[0]*a[1]?1:0;
const fac=n=>{let a=1n;for(let k=2;k<=n;k++)a*=BigInt(k);return a;};
function read(x){if(typeof x==='number'&&Number.isSafeInteger(x))x=String(x);if(typeof x!=='string'||!/^[-+]?\d+(\/\d+)?$/.test(x)||x.length>2500)bad('Use an exact rational string or safe integer.');const [n,d='1']=x.split('/'),r=q(n,d);if(r.some(v=>(v<0n?-v:v).toString(2).length>4096))bad('Requested rational exceeds the 4096-bit point-coordinate budget.');return r;}
const floor=(n,d)=>{let a=n/d;if(n<0n&&n%d)a--;return a;},ceil=(n,d)=>-floor(-n,d);

function arithmetic(bits){
  const S=1n<<BigInt(bits);let operations=0;
  const point=x=>{const a=Array.isArray(x)?x:q(x);return [floor(a[0]*S,a[1]),ceil(a[0]*S,a[1])];};
  const add=(a,b)=>{operations++;return [a[0]+b[0],a[1]+b[1]];},neg=a=>[-a[1],-a[0]],sub=(a,b)=>add(a,neg(b));
  const mul=(a,b)=>{operations++;const v=a.flatMap(x=>b.map(y=>x*y)).sort((a,b)=>a<b?-1:a>b?1:0);return [floor(v[0],S),ceil(v[3],S)];};
  const div=(a,b)=>{operations++;if(b[0]<=0n&&b[1]>=0n)bad('The requested point divisor cannot be separated from zero.');const v=a.flatMap(x=>b.map(y=>q(x*S,y))).sort(qc);return [floor(v[0][0],v[0][1]),ceil(v[3][0],v[3][1])];};
  const widen=(a,e)=>{const w=ceil(e[0]*S,e[1]);return [a[0]-w,a[1]+w];};
  const small=p=>[0n,ceil(S,1n<<BigInt(p))];
  const pack=a=>({lower:qs(q(a[0],S)),upper:qs(q(a[1],S)),denominatorPowerOfTwo:bits,displayEnclosure:[nextDown(Number(a[0])/2**bits),nextUp(Number(a[1])/2**bits)]});
  return {S,point,add,neg,sub,mul,div,widen,small,pack,operations:()=>operations};
}

function jets(A,order){
  const c=a=>[Array.isArray(a)?a:A.point(a),...Array.from({length:order},()=>A.point(0))],v=a=>{const z=c(a);if(order)z[1]=A.point(1);return z;};
  const add=(a,b)=>a.map((x,i)=>A.add(x,b[i])),neg=a=>a.map(A.neg),sub=(a,b)=>add(a,neg(b)),scale=(a,b)=>a.map(x=>A.mul(x,Array.isArray(b)?b:A.point(b)));
  const mul=(a,b)=>Array.from({length:order+1},(_,n)=>{let x=A.point(0);for(let k=0;k<=n;k++)x=A.add(x,A.mul(a[k],b[n-k]));return x;});
  const inv=a=>{const z=[A.div(A.point(1),a[0])];for(let n=1;n<=order;n++){let x=A.point(0);for(let k=1;k<=n;k++)x=A.add(x,A.mul(a[k],z[n-k]));z[n]=A.neg(A.div(x,a[0]));}return z;};
  return {c,v,add,neg,sub,scale,mul,inv,div:(a,b)=>mul(a,inv(b)),derivative:a=>a.slice(1).map((x,i)=>A.mul(x,A.point(i+1)))};
}

function coordinates(A,input){
  if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))bad('Eta must specify its source coordinate chart.');
  for(const key of Object.keys(input??{}))if(!['kind','value'].includes(key))bad('Unknown eta coordinate field: '+key);
  const kind=input?.kind??'RHO_SCALED',r=read(input?.value??'1/8');
  if(!['RHO_SCALED','J_SCALED','DIRECT_RATIONAL'].includes(kind))bad('Unknown source eta chart.');
  const end=kind==='RHO_SCALED'?q(1,4):q(1);if(qc(r,qn(end))<0||qc(r,end)>0)bad('Requested eta point is outside its certified chart.');
  const j=A.small(16384),rho=A.div(A.mul(j,j),A.point(262144000000n));
  let eta,xi,e;
  if(kind==='RHO_SCALED'){xi=A.div(A.mul(A.point(r),j),A.point(262144000000n));eta=A.mul(A.point(r),rho);}
  else if(kind==='J_SCALED'){xi=A.point(r);eta=A.mul(j,xi);}
  else if(r[0]===0n){xi=A.point(0);eta=A.point(0);}
  else {eta=A.point(r);const upper=qd(q(1,1n<<16384n),q(r[0]<0n?-r[0]:r[0],r[1]));const bound=A.point(upper)[1];e=r[0]<0n?[-bound,0n]:[0n,bound];}
  return {kind,value:qs(r),eta,xi,e,etaExact:kind==='RHO_SCALED'?`(${qs(r)})*rho`:kind==='J_SCALED'?`(${qs(r)})*j0`:qs(r),normalizedEtaDerivativeScale:'j0^m',ordinaryDirectRationalBitsBounded:kind==='DIRECT_RATIONAL',complexComparisonRadius:'1/10^12',actualPositiveScaleDefinitionsRetained:true};
}

function chiJet(A,coord,order){
  const J=jets(A,order),h=J.c(A.small(4096)),j2=J.c(A.small(32768));let H,den;
  if(coord.xi){const x=J.v(coord.xi),x2=J.mul(x,x);H=J.sub(J.sub(J.add(J.c(1),J.mul(J.sub(J.c(A.point(q(9,2))),h),x)),J.mul(j2,x2)),J.scale(J.mul(j2,J.mul(x2,x)),4));den=J.add(J.mul(H,H),J.c(A.point(q(1,4000000))));}
  else {
    // Divide H(eta+j*w) by the nonzero requested eta, not by an underflowed j.
    const t=J.add(J.c(1),J.scale(J.v(A.point(0)),coord.e)),e=J.c(coord.e),eta2=J.c(A.mul(coord.eta,coord.eta)),d=J.sub(J.c(1),J.mul(eta2,J.mul(t,t)));
    H=J.add(J.mul(J.sub(J.c(A.point(q(1,2))),h),t),J.mul(d,J.add(J.scale(t,4),e)));
    den=J.add(J.mul(H,H),J.scale(J.mul(e,e),A.point(q(1,4000000))));
  }
  const result=J.div(J.mul(H,H),den);
  // The exact real chi lies in [0,1]. Intersect only its value, not its derivatives.
  result[0]=[result[0][0]<0n?0n:result[0][0],result[0][1]>A.S?A.S:result[0][1]];
  return result;
}

function radialTail(Y,N,k){
  if(Y[0]===0n)return q(0);
  const n=N+1,first=qd(qp(Y,n-k),q(fac(n-k)*fac(n+1))),ratio=qd(Y,q((N+2-k)*(N+3)));
  if(qc(ratio,q(1))>=0)bad('The entire radial comparison tail is not contracting.');
  return qd(first,qa(q(1),qn(ratio))); // comparison-circle |chi|<=2 cancels 2^n.
}
function nonlinearError(Y,k,m){
  // j^m<=1, K^-1<=1 and rho^-m<=Q^m. This is a retained positive norm displacement.
  const base=qa(q(1),qn(qd(Y,q(20))));
  return qd(q(29n*fac(m+k),(1n<<BigInt(260*(53-m)))*BigInt((m+1)**2)*20n**BigInt(k)),qp(base,m+k+1));
}

function pressureAndAxial(A,coord,Y,etaOrder){
  const M=etaOrder+1,J=jets(A,M),eta=J.v(coord.eta),eta2=J.mul(eta,eta),one=J.c(1),d=J.sub(one,eta2),h=J.c(A.small(4096)),j=J.c(A.small(16384)),aa=J.add(J.c(A.point(q(1,2))),h),dd=J.sub(J.c(A.point(q(1,2))),h),L=J.sub(one,J.scale(J.mul(h,eta2),2)),Ustar=J.add(J.scale(eta,4),j),H=J.add(J.mul(dd,eta),J.mul(d,Ustar));
  const p0=ACTUAL_BACKGROUND_INPUTS.pressure.normalizedDerivativeIntervals[0].interval,p0box=[A.point(read(p0.lower))[0],A.point(read(p0.upper))[1]],analytic=q(1,1n<<1400n),cP=A.widen(A.neg(p0box),analytic);
  const inverse=J.inv(J.add(one,eta2)),p=J.scale(J.mul(inverse,inverse),A.neg(cP));
  for(let m=0;m<=M;m++)p[m]=A.widen(p[m],qm(analytic,q(16n**BigInt(m))));
  const cut=a=>a.slice(0,etaOrder+1),B=jets(A,etaOrder),e=cut(eta),a=cut(aa),l=cut(L),u=cut(Ustar),kInv=B.c(A.small(2048));
  const transport=B.mul(B.mul(B.neg(a),B.sub(B.c(1),B.scale(B.mul(e,u),2))),u);
  const pressurePart=B.add(B.neg(B.mul(cut(d),J.derivative(p))),B.scale(B.mul(B.mul(a,e),cut(p)),4));
  const ZoverK=B.add(B.mul(kInv,B.sub(transport,B.scale(cut(H),4))),pressurePart);
  const reference=B.scale(B.div(ZoverK,l),A.point(qm(q(-1,2),Y))),rows=[];
  for(let m=0;m<=etaOrder;m++){
    const raw=A.mul(reference[m],A.point(fac(m))),error=Y[0]===0n?q(0):nonlinearError(Y,0,m),uActual=Y[0]===0n?A.point(0):A.widen(raw,error),avgRef=A.mul(raw,A.point(q(1,2))),avg=Y[0]===0n?A.point(0):A.widen(avgRef,error);
    rows.push({etaDerivativeOrder:m,uOverKReference:A.pack(raw),uOverK:A.pack(uActual),averageUCorrectionOverK:A.pack(avg),positiveNonlinearErrorUpper:qs(error),quantities:{u:`partial_eta^${m} u / K`,average:`partial_eta^${m} A_Y(u) / K`}});
  }
  const normalizedCore=coord.kind!=='DIRECT_RATIONAL',unpack=z=>[A.point(read(z.lower))[0],A.point(read(z.upper))[1]],actualValues=rows.map(row=>{const m=row.etaDerivativeOrder,normalization=m===0&&normalizedCore?'DIVIDE_BY_POSITIVE_J0':'ORDINARY_ETA_DERIVATIVE',base=m===0?(normalizedCore?A.add(A.point(1),A.mul(A.point(4),coord.xi)):A.add(A.mul(A.point(4),coord.eta),j[0])):A.point(m===1?4:0),scale=A.small(m===0&&normalizedCore?16640:16380);return {etaDerivativeOrder:m,normalization,U:A.pack(A.add(base,A.mul(scale,unpack(row.uOverK)))),averageU:A.pack(A.add(base,A.mul(scale,unpack(row.averageUCorrectionOverK)))),positiveCorrectionScale:m===0&&normalizedCore?'K/(Lambda*j0)':'K/Lambda',sourceCorrectionRow:m};});
  return {pressure:{normalization:'P/K',model:'-cP/(1+eta^2)^2 plus the retained analytic error of the actual entire A.21 integral',cPInterval:A.pack(cP),sourceP0Interval:p0,derivatives:p.map((x,m)=>({order:m,interval:A.pack(A.mul(x,A.point(fac(m)))),analyticErrorUpper:qs(qm(analytic,q(fac(m)*16n**BigInt(m))))})),sourceApproximationIsActualPressure:false,actualPressureErrorRetained:true},rows,actualValues,reconstruction:{U:'4*eta+j0+(K/Lambda)*(u/K)',averageU:'4*eta+j0+(K/Lambda)*(A_Y(u)/K)',U_eta:'4+(K/Lambda)*(u_eta/K)',averageU_eta:'4+(K/Lambda)*(A_Y(u)_eta/K)',averageU_etaeta:'(K/Lambda)*(A_Y(u)_etaeta/K)',positiveCorrectionScale:'K/Lambda',positiveCorrectionScaleUpper:'Q^-63',M:'X*averageU',VoverX:'(2*eta*U-2D*eta*averageU-(1-eta^2)*averageU_eta)/(1-2h*eta^2)',physicalScalesNotReplacedByZero:true},scope:{pointwiseActualUAndAverageDerivativesEnclosed:true,ordinaryEtaOrder:etaOrder,globalMomentIntegralsEvaluated:false,exactNonlinearRecurrenceNumericallyExecuted:false}};
}

export function evaluateActualCorePoint(input={},context={}){
  const allowed=['sourceProfile','Y','eta','radialOrder','etaOrder','bits','degree'];for(const key of Object.keys(input))if(!allowed.includes(key))bad('Unknown actual core request field: '+key);
  assertSourceProfile(input.sourceProfile??SOURCE_PROFILE_ID);const Y=read(input.Y??'4'),radialOrder=input.radialOrder??2,etaOrder=input.etaOrder??2,bits=input.bits??192,N=input.degree??48;
  if(qc(Y,q(0))<0||qc(Y,q(41,10))>0)bad('The actual natural-core evaluator requires 0<=Y<=41/10.');
  if(!Number.isSafeInteger(radialOrder)||radialOrder<0||radialOrder>2||!Number.isSafeInteger(etaOrder)||etaOrder<0||etaOrder>2)bad('Certified derivative orders are 0 through 2.');
  if(!Number.isSafeInteger(bits)||bits<96||bits>512||!Number.isSafeInteger(N)||N<32||N>64)bad('Use 96..512 arithmetic bits and degree 32..64.');
  context.checkCancelled?.();const A=arithmetic(bits),coord=coordinates(A,input.eta),J=jets(A,etaOrder),chi=chiJet(A,coord,etaOrder),coefficients=[J.c(1)];
  for(let n=0;n<N;n++)coefficients.push(J.scale(J.mul(coefficients[n],chi),A.point(q(-1,2*(n+1)*(n+2)))));
  const rows=[];
  for(let k=0;k<=radialOrder;k++)for(let m=0;m<=etaOrder;m++){
    context.checkCancelled?.();let value=A.point(0);
    for(let n=k;n<=N;n++)value=A.add(value,A.mul(coefficients[n][m],A.point(qm(q(fac(n)*fac(m),fac(n-k)),qp(Y,n-k)))));
    const tail=qm(q(fac(m)*10n**BigInt(12*m)),radialTail(Y,N,k)),banach=nonlinearError(Y,k,m),constantAxis=Y[0]===0n&&k===0,total=qa(tail,banach),actual=constantAxis?A.point(m===0?1:0):A.widen(value,total);
    rows.push({YDerivativeOrder:k,normalizedEtaDerivativeOrder:m,quantity:`j0^${m} * partial_eta^${m} partial_Y^${k} Phi(Y,eta)`,comparisonPolynomial:A.pack(value),comparisonRadialCauchyTailUpper:qs(tail),positiveNonlinearErrorUpper:qs(constantAxis?q(0):banach),actualNonlinearInterval:A.pack(actual),actualConstantAxisIdentity:constantAxis,restorePhysicalXDerivativeScale:`Lambda^${k}*j0^(-${m})`,sourcePath:`result.results.phi.rows[${rows.length}]`});
  }
  const axial=pressureAndAxial(A,coord,Y,etaOrder),sourceHash=PINNED_N3.inputs.assembly.sha256;
  return {schema:'MathScope.ActualNonlinearCorePoint/1',profileId:SOURCE_PROFILE_ID,sourceHash,sourceBindings:{assembly:PINNED_N3.inputs.assembly,parameterExpressionSHA256:PINNED_N3.parameterExpressionSHA256,axisProof:ACTUAL_BACKGROUND_INPUTS.inputs.axisProof,pressure:ACTUAL_BACKGROUND_INPUTS.inputs.pressure,pressureProof:{path:'mathscope-m1/navier/followup-20261010-symbolic-gluing/PRESSURE_DATUM_INTERVAL.md',sha256:'8dfd40a7206871b425e69894ead0321fe6f476c338f0532739c1d055a920386d'}},request:{Y:qs(Y),eta:{kind:coord.kind,value:coord.value},radialOrder,etaOrder,bits,degree:N},coordinates:{etaExact:coord.etaExact,YExact:qs(Y),XExact:`(${qs(Y)})/Lambda`,etaChart:coord.kind,derivativeScale:coord.normalizedEtaDerivativeScale,positiveSmallParametersNotZero:true},phi:{chiNormalizedEtaTaylorCoefficients:chi.map(A.pack),rows,comparisonCircle:{radiusInEtaOverJ:'1/10^12',chiAbsUpper:'2',meaning:'Complex circle for the explicit comparison only; no such complex radius is asserted for the nonlinear fixed point.'}},axial,arithmetic:{kind:'DIRECTED_BIGINT_DYADIC_INTERVAL',bits,operations:A.operations(),binary64UsedForDecisions:false},domain:{naturalAnalyticY:['0','41/10'],originalUnmodifiedCoreY:['0','4'],sourcePosition:qc(Y,q(4))<=0?'ACTUAL_UNMODIFIED_CORE':'NATURAL_ANALYTIC_EXTENSION_FOR_B26_INPUT_ONLY',etaCharts:{RHO_SCALED:'eta/rho in [-1/4,1/4]',J_SCALED:'eta/j0 in [-1,1]',DIRECT_RATIONAL:'eta in [-1,1], finite exact rational with at most 4096 input bits'},B26CutoffApplied:false,actualPhysicalCollarEvaluated:false},scope:{sameN3ActualNonlinearPointEnclosed:true,comparisonReplacedActualPhi:false,positiveBanachErrorRetained:true,actualPressureAnalyticErrorRetained:true,actualUAndAverageEtaDerivativesEnclosed:true,wholeOriginalProfileEvaluatorComplete:false,globalMomentDebtEvaluated:false,allOriginalN4N5CriteriaComplete:false,newLeanKernelProof:false},status:'PARTIAL'};
}
