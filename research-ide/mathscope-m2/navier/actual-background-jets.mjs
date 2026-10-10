/** Exact, source-bound positive-order radial jets.
 *
 * The leading coefficients are produced from the SAME_DATUM_ANALYTIC_AXIS
 * recurrence, with its actual A.21 pressure and selected C.  The positive
 * order is then solved from (5.2)--(5.6), rather than supplied as an arbitrary
 * jet.  An expression graph is exact arithmetic, not a numerical enclosure
 * of the complete infinite function or its continuation.
 */
import {assertSourceProfile, SOURCE_PROFILE_ID} from './source-profile.mjs';
import {ACTUAL_BACKGROUND_INPUTS} from './actual-background-data.mjs';

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
function rat(a,b=1n){a=BigInt(a);b=BigInt(b);if(!b)throw Error('Zero denominator');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return [a/g,b/g];}
class Expressions {
  constructor(){this.nodes=[];this.ids=new Map();this.zero=this.rat(0);this.one=this.rat(1);}
  node(op,...args){const key=JSON.stringify([op,...args]);if(this.ids.has(key))return this.ids.get(key);if(this.nodes.length>250000)throw Error('Expression graph resource bound exceeded.');const id=this.nodes.length;this.nodes.push({op,args});this.ids.set(key,id);return id;}
  rat(a,b=1){const q=rat(a,b);return this.node('rational',...q.map(String));}
  israt(a){return this.nodes[a].op==='rational';}
  value(a){return this.nodes[a].args.map(BigInt);}
  ref(name){return this.node('source_parameter',name);}
  add(a,b){if(a===this.zero)return b;if(b===this.zero)return a;if(this.israt(a)&&this.israt(b)){const [x,y]=this.value(a),[z,w]=this.value(b);return this.rat(x*w+z*y,y*w);}return this.node('add',...([a,b].sort((x,y)=>x-y)));}
  mul(a,b){if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;if(this.israt(a)&&this.israt(b)){const[x,y]=this.value(a),[z,w]=this.value(b);return this.rat(x*z,y*w);}return this.node('multiply',...([a,b].sort((x,y)=>x-y)));}
  scale(a,n,d=1){return this.mul(this.rat(n,d),a);}
  sub(a,b){return this.add(a,this.scale(b,-1));}
  inv(a){if(this.israt(a)){const[x,y]=this.value(a);return this.rat(y,x);}return this.node('inverse_nonzero',a);}
  pow(a,n){if(!Number.isInteger(n))throw Error('Integer exponent required');if(n<0)return this.pow(this.inv(a),-n);let p=this.one;for(let k=0;k<n;k++)p=this.mul(p,a);return p;}
  sum(as){return as.reduce((s,a)=>this.add(s,a),this.zero);}
  derivative(a){const n=this.nodes[a];if(['rational','source_parameter'].includes(n.op))return this.zero;if(n.op==='eta')return this.one;if(n.op==='eta_derivative')return this.node('eta_derivative',n.args[0],n.args[1]+1);return this.node('eta_derivative',a,1);}
}

function leading(d,N){
  const e=d.node('eta'),h=d.ref('h'),j=d.ref('j0'),lam=d.ref('Lambda'),sig=d.ref('sigmaStar'),il=d.inv(lam),one=d.one,z=d.zero;
  const A=d.add(d.rat(1,2),h),D=d.sub(d.rat(1,2),h),dd=d.sub(one,d.pow(e,2)),L=d.sub(one,d.scale(d.mul(h,d.pow(e,2)),2)),iL=d.inv(L),Us=d.add(d.scale(e,4),j);
  const H=d.add(d.mul(D,e),d.mul(dd,Us)),Wstar=d.sub(d.sub(one,d.scale(dd,4)),d.scale(d.mul(d.mul(D,e),Us),2));
  const den=d.add(d.pow(H,2),d.pow(sig,2)),chi=d.mul(d.pow(H,2),d.inv(den)),zeta=d.scale(d.mul(d.mul(L,H),d.inv(den)),-1);
  const P=d.node('source_A21_pressure'),g=d.node('source_normalized_amplitude'),g2=d.pow(g,2);
  const Zstar=d.sum([d.scale(d.mul(d.mul(A,d.sub(one,d.scale(d.mul(e,Us),2))),Us),-1),d.scale(H,-4),d.scale(d.mul(dd,d.derivative(P)),-1),d.scale(d.mul(d.mul(A,e),P),4)]);
  const Phi=[one],u=[z];
  const cv=(a,b,n)=>d.sum(Array.from({length:n+1},(_,k)=>d.mul(a[k]??z,b[n-k]??z)));
  const de=a=>a.map(x=>d.derivative(x)),dot=a=>a.map((x,k)=>d.scale(x,k));
  for(let n=0;n<N;n++){
    const av=u.map((x,k)=>d.scale(x,1,k+1));
    const wc=av.map(x=>d.sub(d.scale(d.mul(d.mul(D,e),x),-2),d.mul(dd,d.derivative(x))));
    const W=wc.map((x,k)=>d.add(d.mul(il,x),k===0?Wstar:z));
    const U=u.map((x,k)=>d.add(d.mul(il,x),k===0?Us:z));
    const Hc=u.map((x,k)=>d.add(d.mul(il,d.mul(dd,x)),k===0?H:z));
    const pref=u.map((x,k)=>d.sum([W[k],d.mul(h,d.sub(k===0?one:z,d.scale(d.mul(e,U[k]),2))),d.mul(d.mul(dd,x),zeta)]));
    const R1=d.mul(iL,d.sum([cv(pref,Phi,n),cv(W,dot(Phi),n),cv(Hc,de(Phi),n)]));
    const p=[z,...Array.from({length:n},(_,k)=>d.scale(d.mul(g2,cv(Phi,Phi,k)),1,k+1))];
    const alpha=d.add(d.mul(A,d.sub(one,d.scale(d.mul(e,Us),4))),d.scale(dd,4));
    const R2=d.mul(iL,d.sum([d.mul(alpha,u[n]),d.scale(d.mul(d.mul(d.mul(A,e),il),cv(u,u,n)),-2),cv(W,dot(u),n),d.mul(H,d.derivative(u[n])),d.mul(d.mul(dd,il),cv(u,de(u),n)),d.scale(d.mul(d.mul(A,e),p[n]),-4),d.mul(dd,d.derivative(p[n])),d.scale(d.mul(e,p[n]),-2*n)]));
    Phi.push(d.scale(d.add(d.scale(d.mul(chi,Phi[n]),-1),d.mul(il,R1)),1,2*(n+1)*(n+2)));
    u.push(d.scale(d.add(n===0?d.scale(d.mul(iL,Zstar),-1):z,d.mul(il,R2)),1,2*(n+1)**2));
  }
  const p=[z,...Array.from({length:N},(_,k)=>d.scale(d.mul(g2,cv(Phi,Phi,k)),1,k+1))];
  return {fixed:{eta:e,h,j,lam,sig,A,D,d:dd,L,iL,Ustar:Us,Hstar:H,Wstar,Zstar,chi,zeta,P,g,g2},normalized:{Phi,u,p},F:Phi.map((x,k)=>d.mul(g,d.mul(d.pow(lam,k),x))),U:u.map((x,k)=>d.add(k===0?Us:z,d.mul(d.pow(lam,k-1),x))),Pi:p.map((x,k)=>d.add(k===0?P:z,d.mul(d.pow(lam,k-1),x)))};
}

/** Positive order one is executable without any uncompleted order-one moments.
 * Higher source orders are deliberately blocked until the preceding *global*
 * coefficient, with all five repairs, has an actual source-bound receipt.
 */
export function buildActualBackgroundJets({profileId=SOURCE_PROFILE_ID,order=1,radialDegree=3}={}){
  assertSourceProfile(profileId);
  if(order!==1)throw Error('Order n+1 requires the completed actual global order-n five-moment repair; it cannot be generated from these local jets.');
  if(!Number.isSafeInteger(radialDegree)||radialDegree<1||radialDegree>6)throw Error('radialDegree must be an integer from 1 to 6.');
  const d=new Expressions(),N=radialDegree,base=leading(d,N+2),f=base.fixed,z=d.zero;
  const cv=(a,b,n)=>d.sum(Array.from({length:n+1},(_,k)=>d.mul(a[k]??z,b[n-k]??z)));
  const mapAdd=(...rows)=>Array.from({length:Math.max(...rows.map(x=>x.length))},(_,k)=>d.sum(rows.map(x=>x[k]??z)));
  const scaled=(a,n,den=1)=>a.map(x=>d.scale(x,n,den));
  const mul=(a,b,n=N+1)=>Array.from({length:n+1},(_,k)=>cv(a,b,k));
  const DX=a=>a.map((x,k)=>d.scale(x,k));
  const T=(a,p)=>p.map((x,k)=>d.mul(f.iL,d.sum([d.scale(d.mul(a,x),-1),d.mul(d.mul(f.D,f.eta),d.derivative(x)),d.scale(x,k)])));
  const Z=(a,p)=>p.map((x,k)=>d.mul(f.iL,d.add(d.scale(d.mul(f.eta,d.mul(d.sub(a,d.rat(k)),x)),2),d.mul(f.d,d.derivative(x)))));
  const b0=d.scale(d.add(f.A,d.rat(1,2)),-1),c0=d.scale(f.A,-1),lam1=d.scale(f.h,2),b1=d.add(b0,lam1),c1=d.add(c0,lam1),p1a=d.add(d.scale(f.A,-2),lam1);
  const getV=(U,a)=>[z,...Z(a,U).map((x,k)=>d.scale(x,-1,k+1))];
  const V0=getV(base.U,c0),v0=V0.slice(1),VX=V0.slice(1).map((x,k)=>d.scale(x,k+1));
  const radialAdvection=mul(V0,mapAdd(VX,scaled(v0,-1,2)));
  const radialDiffusion=[z,...V0.slice(2).map((x,k)=>d.scale(x,-2*(k+1)*(k+2)))];
  const omega=mapAdd(T(z,V0),radialAdvection,mul(base.U,Z(z,V0)),radialDiffusion);
  const pKnown=omega.slice(1).map(x=>d.scale(x,-1,2));
  const viscF=Z(d.sub(b0,f.D),Z(b0,base.F)),viscU=Z(d.sub(c0,f.D),Z(c0,base.U));
  const F=[z],U=[z],Pi=[z];
  for(let k=0;k<N;k++){
    const V=getV(U,c1),v=V.slice(1),ang=mapAdd(T(b1,F),mul(v0,mapAdd(DX(F),F)),mul(v,mapAdd(DX(base.F),base.F)),mul(base.U,Z(b1,F)),mul(U,Z(b0,base.F)),scaled(viscF,-1));
    const axial=mapAdd(T(c1,U),mul(v0,DX(U)),mul(v,DX(base.U)),mul(base.U,Z(c1,U)),mul(U,Z(c0,base.U)),Z(p1a,Pi),scaled(viscU,-1));
    Pi.push(d.scale(d.add(d.scale(cv(base.F,F,k),2),pKnown[k]??z),1,k+1));
    F.push(d.scale(ang[k]??z,1,2*(k+1)*(k+2)));
    U.push(d.scale(axial[k]??z,1,2*(k+1)**2));
  }
  const V=getV(U,c1),K=U.map((x,k)=>d.scale(x,-k,k+1));
  const fPi=pKnown.map(x=>d.scale(x,2));
  const fU=mapAdd(scaled(viscU,-2),[z,...pKnown.map(x=>d.scale(d.mul(d.mul(f.eta,f.iL),x),-4))]);
  return {schema:'MathScope.ActualBackgroundRadialJets/1',profileId,sourcePaperSHA256:assertSourceProfile(profileId).sourcePaperSHA256,sourceInputs:ACTUAL_BACKGROUND_INPUTS.inputs,order,radialDegree:N,radialCoordinate:'X',coefficientConvention:'ordinary Taylor coefficient [X^k], not the kth derivative',unknownScaling:'F_n=phi_n/CSelected; E_n=sqrt(2X)*F_n',nodes:d.nodes,fixed:f,leading:{radialDegree:N+2,normalizedY:base.normalized,F:base.F,U:base.U,Pi:base.Pi,V:V0},positive:{F,U,K,Pi,V},forcing:{coordinate:'xi=sqrt(X)',nonzero:[{component:3,xiPower:1,xCoefficients:fPi},{component:4,xiPower:0,xCoefficients:scaled(viscF,-2)},{component:5,xiPower:0,xCoefficients:fU}],pKnown,omega0:omega},semantics:{source_parameter:'Pinned actual expression graph; no illustrative exponent or amplitude is substituted.',source_A21_pressure:'The full same-datum A.21 pressure -integral(1+eta^2)^(-2*theta(y)) dmu(y).',source_normalized_amplitude:'g(eta)=exp(Lambda*integral_0^eta zeta(w)dw-log(CSelected)); g_eta=Lambda*zeta*g.',eta_derivative:'The exact analytic derivative of the referenced expression, with no terminal derivative set to zero.',inverse_nonzero:'L, Lambda, and Hstar^2+sigmaStar^2 are nonzero on the source domains.'},axisDatum:{F:0,U:0,Pi:0,V:0},scope:{sameSourceLeadingCoefficientsGenerated:true,actualPositiveOrderRadialJetGenerated:true,finiteExpressionArithmeticExact:true,completeInfiniteFunctionNumericallyEvaluated:false,activationCollarReplacedByNaturalProfile:false,globalMomentCorrectionComplete:false,nextOrderSourceAllowed:false,N4_04_Complete:false,N4_05_Complete:false},sourceEquations:['B.14','B.15','5.2','5.3','5.4','5.5','5.6','5.7']};
}

/** Independent numerical adapter for algorithm tests only.
 * It cannot issue a same-profile or analytic-tail certificate.  It evaluates
 * graph operations and every requested eta derivative, including g'=Lambda*zeta*g.
 */
export function evaluateBackgroundJetOracle(graph,{eta=0,parameters,pressureDerivatives,amplitudeAtEta=1}={}){
  if(graph?.schema!=='MathScope.ActualBackgroundRadialJets/1')throw Error('Expected a source expression graph.');
  if(!Number.isFinite(eta)||!parameters||!Array.isArray(pressureDerivatives))throw Error('Finite audit parameters and a pressure derivative oracle are required.');
  const names=['h','j0','Lambda','sigmaStar'];for(const name of names)if(!(Number.isFinite(parameters[name])&&parameters[name]>0))throw Error('Invalid audit parameter '+name);
  if(!(Number.isFinite(amplitudeAtEta)&&amplitudeAtEta>0))throw Error('A positive finite audit amplitude is required.');
  const cache=new Map();
  const prod=(a,b,M)=>Array.from({length:M+1},(_,n)=>{let s=0;for(let k=0;k<=n;k++)s+=a[k]*b[n-k];return s;});
  const factorial=n=>{let x=1;for(let k=2;k<=n;k++)x*=k;return x;};
  function ev(id,M=0){const key=id+':'+M;if(cache.has(key))return cache.get(key);const {op,args}=graph.nodes[id];let r=Array(M+1).fill(0);
    if(op==='rational')r[0]=Number(args[0])/Number(args[1]);
    else if(op==='source_parameter')r[0]=parameters[args[0]];
    else if(op==='eta'){r[0]=eta;if(M)r[1]=1;}
    else if(op==='source_A21_pressure'){if(pressureDerivatives.length<=M)throw Error('Missing pressure derivative oracle order '+M);r=pressureDerivatives.slice(0,M+1).map((x,k)=>x/factorial(k));}
    else if(op==='source_normalized_amplitude'){r[0]=amplitudeAtEta;const zeta=ev(graph.fixed.zeta,Math.max(0,M-1));for(let n=0;n<M;n++){let s=0;for(let k=0;k<=n;k++)s+=zeta[k]*r[n-k];r[n+1]=parameters.Lambda*s/(n+1);}}
    else if(op==='add'){const a=ev(args[0],M),b=ev(args[1],M);r=a.map((x,k)=>x+b[k]);}
    else if(op==='multiply')r=prod(ev(args[0],M),ev(args[1],M),M);
    else if(op==='inverse_nonzero'){const a=ev(args[0],M);if(!a[0])throw Error('Oracle reached a zero denominator');r[0]=1/a[0];for(let n=1;n<=M;n++){let s=0;for(let k=1;k<=n;k++)s+=a[k]*r[n-k];r[n]=-s/a[0];}}
    else if(op==='eta_derivative'){const a=ev(args[0],M+args[1]);r=r.map((_,k)=>a[k+args[1]]*factorial(k+args[1])/factorial(k));}
    else throw Error('Unknown expression operation '+op);
    if(r.some(x=>!Number.isFinite(x)))throw Error('The finite audit oracle overflowed; no certificate is emitted.');cache.set(key,r);return r;
  }
  return {scope:'EXTERNAL_NUMERICAL_ORACLE_FOR_ALGORITHM_TESTS_ONLY',sameProfileCertificate:false,leading:Object.fromEntries(['F','U','Pi','V'].map(k=>[k,graph.leading[k].map(id=>ev(id)[0])])),positive:Object.fromEntries(['F','U','K','Pi','V'].map(k=>[k,graph.positive[k].map(id=>ev(id)[0])])),value:(id,derivativeOrder=0)=>ev(id,derivativeOrder)[derivativeOrder]*factorial(derivativeOrder)};
}
