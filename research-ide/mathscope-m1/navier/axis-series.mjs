import {ComputeError,integrate,makeBudget,finiteNumber,positive,boundedInteger,point,iadd,isub,idiv,imul,iscale,nextUp,nextDown,ball} from './numerics.mjs';
// Real Taylor coefficients in eta. These are formal finite jets, not a tail proof.
export const jetC=(x,n)=>[x,...Array(n).fill(0)];
export const jetVar=(x,n)=>[x,1,...Array(Math.max(0,n-1)).fill(0)];
export const jetAdd=(a,b)=>a.map((x,i)=>x+(b[i]??0));
export const jetScale=(a,s)=>a.map(x=>x*s);
export const jetSub=(a,b)=>jetAdd(a,jetScale(b,-1));
export function jetMul(a,b){return a.map((_,n)=>{let s=0;for(let k=0;k<=n;k++)s+=a[k]*b[n-k];return s;});}
export function jetInv(a){if(!a[0])throw new ComputeError('SINGULAR_SYSTEM','Taylor jet denominator has zero constant term');const r=[1/a[0]];for(let n=1;n<a.length;n++){let s=0;for(let k=1;k<=n;k++)s+=a[k]*r[n-k];r.push(-s/a[0]);}return r;}
export const jetDiv=(a,b)=>jetMul(a,jetInv(b));
export const jetDeriv=a=>[...a.slice(1).map((x,i)=>(i+1)*x),0];
export function jetExp(a){const r=[Math.exp(a[0])];for(let n=1;n<a.length;n++){let s=0;for(let k=1;k<=n;k++)s+=k*a[k]*r[n-k];r.push(s/n);}return r;}
export function jetLog(a){if(!(a[0]>0))throw new ComputeError('INVALID_INPUT','Positive constant term required for log jet');const b=jetMul(jetDeriv(a),jetInv(a));return [Math.log(a[0]),...b.slice(0,-1).map((x,i)=>x/(i+1))];}
export const jetPow=(a,p)=>jetExp(jetScale(jetLog(a),p));
export const jetEval=(a,x)=>a.reduceRight((s,v)=>s*x+v,0);
export function comparisonSeries(z,N=24){
  z=finiteNumber(z,'z');if(z<0||z>20)throw new ComputeError('UNSUPPORTED','Comparison certificate supports 0 <= z <= 20');N=boundedInteger(N,'N',2,100);
  let term=point(1),sum=point(1);for(let n=1;n<=N;n++){term=idiv(iscale(term,-z/2),point(n*(n+1)));sum=iadd(sum,term);}
  const next=idiv(iscale(term,-z/2),point((N+1)*(N+2))),ratio=idiv(point(z),point(2*(N+2)*(N+3)));
  const tail=idiv(point(Math.max(Math.abs(next[0]),Math.abs(next[1]))),isub(point(1),ratio))[1];
  return {value:(sum[0]+sum[1])/2,enclosure:ball([nextDown(sum[0]-tail),nextUp(sum[1]+tail)]),N,z,tailBound:tail,radiusOfConvergence:'infinity',proof:'ratio of successive absolute terms is z/[2(n+1)(n+2)]; geometric tail after N',scope:'Scalar comparison f0, not the nonlinear axis profile',source:{source:'N00',pages:[146],equation:'B.11'}};
}
export function axisData(eta,o,pressureJet,etaOrder=20,budget=makeBudget()){
  const h=o.h??.005,D=.5-h,A=.5+h,j0=o.j0??.03,sigma=o.sigmaStar??.2,Lambda=o.Lambda??48,n=etaOrder;
  const e=jetVar(eta,n),one=jetC(1,n),d=jetSub(one,jetMul(e,e)),L=jetSub(one,jetScale(jetMul(e,e),2*h)),Us=jetAdd(jetScale(e,4),jetC(j0,n)),Hs=jetAdd(jetScale(e,D),jetMul(d,Us)),Ws=jetSub(jetSub(one,jetScale(d,4)),jetScale(jetMul(e,Us),2*D)),Hs2=jetMul(Hs,Hs),den=jetAdd(Hs2,jetC(sigma*sigma,n)),chi=jetDiv(Hs2,den),zeta=jetScale(jetDiv(jetMul(L,Hs),den),-1),Pi=pressureJet(eta,n),PiEta=jetDeriv(Pi);
  const Zs=jetAdd(jetSub(jetSub(jetScale(jetMul(jetSub(one,jetScale(jetMul(e,Us),2)),Us),-A),jetScale(Hs,4)),jetMul(d,PiEta)),jetScale(jetMul(e,Pi),4*A));
  const zetaValue=t=>{const dt=1-t*t,Lt=1-2*h*t*t,H=D*t+dt*(4*t+j0);return -Lt*H/(H*H+sigma*sigma);};
  const logPhi=Lambda*integrate(zetaValue,0,eta,2e-11,budget).value;
  const logC=o.logC??20,lg=[logPhi-logC,...zeta.slice(0,n).map((x,k)=>Lambda*x/(k+1))],g=jetExp(lg);
  return {e,one,d,L,Us,Hs,Ws,Zs,chi,zeta,Pi,g,logPhi,logC,Lambda,A,D,eta,etaOrder:n,realNormalizationPass:logPhi<=logC};
}
export function solveAxisCoefficients(eta,options,pressureJet,budget=makeBudget()){
  const N=boundedInteger(options.axisOrder??10,'axisOrder',2,24),M=2*N+6,a=axisData(eta,options,pressureJet,M,budget),zero=()=>jetC(0,M),phi=[jetC(1,M)],u=[zero()],g2=jetMul(a.g,a.g),invL=jetInv(a.L);
  const rmul=(x,y,n)=>{let out=zero();for(let k=0;k<=n;k++)out=jetAdd(out,jetMul(x[k]??zero(),y[n-k]??zero()));return out;};
  let maximumSource=0;
  for(let n=0;n<N;n++){
    budget.tick((n+1)*M*M);const AX=u.map((v,k)=>jetScale(v,1/(k+1))),B=AX.map(v=>jetSub(jetScale(jetMul(a.e,v),-2*a.D),jetMul(a.d,jetDeriv(v)))),W=B.map((v,k)=>jetAdd(jetScale(v,1/a.Lambda),k===0?a.Ws:zero())),U=u.map((v,k)=>jetAdd(jetScale(v,1/a.Lambda),k===0?a.Us:zero())),Hc=u.map((v,k)=>jetAdd(jetScale(jetMul(a.d,v),1/a.Lambda),k===0?a.Hs:zero()));
    const angularPref=W.map((v,k)=>jetAdd(jetAdd(v,jetScale(jetSub(k===0?a.one:zero(),jetScale(jetMul(a.e,U[k]),2)),options.h??.005)),jetMul(jetMul(a.d,u[k]),a.zeta)));
    const DXphi=phi.map((v,k)=>jetScale(v,k)),DXu=u.map((v,k)=>jetScale(v,k)),phiEta=phi.map(jetDeriv),uEta=u.map(jetDeriv);
    let R1=jetMul(invL,jetAdd(jetAdd(rmul(angularPref,phi,n),rmul(W,DXphi,n)),rmul(Hc,phiEta,n)));
    const p=[zero()];for(let k=1;k<=n;k++)p.push(jetScale(jetMul(g2,rmul(phi,phi,k-1)),1/k));
    const alpha=jetAdd(jetScale(jetSub(a.one,jetScale(jetMul(a.e,a.Us),4)),a.A),jetScale(a.d,4));
    let R2=jetMul(alpha,u[n]);
    R2=jetAdd(R2,jetScale(jetMul(a.e,rmul(u,u,n)),-2*a.A/a.Lambda));
    R2=jetAdd(R2,rmul(W,DXu,n));R2=jetAdd(R2,jetMul(a.Hs,uEta[n]));
    R2=jetAdd(R2,jetScale(jetMul(a.d,rmul(u,uEta,n)),1/a.Lambda));
    R2=jetAdd(R2,jetScale(jetMul(a.e,p[n]??zero()),-4*a.A));R2=jetAdd(R2,jetMul(a.d,jetDeriv(p[n]??zero())));R2=jetAdd(R2,jetScale(jetMul(a.e,p[n]??zero()),-2*n));R2=jetMul(invL,R2);
    const np=jetScale(jetAdd(jetScale(jetMul(a.chi,phi[n]),-1),jetScale(R1,1/a.Lambda)),1/(2*(n+1)*(n+2))),nu=jetScale(jetAdd(n===0?jetScale(jetMul(a.Zs,invL),-1):zero(),jetScale(R2,1/a.Lambda)),1/(2*(n+1)*(n+1)));
    phi.push(np);u.push(nu);maximumSource=Math.max(maximumSource,Math.abs(R1[0]),Math.abs(R2[0]));
  }
  if(phi.some(v=>v.some(x=>!Number.isFinite(x)))||u.some(v=>v.some(x=>!Number.isFinite(x))))throw new ComputeError('PRECISION_REQUIRED','Axis formal coefficient arithmetic overflow',{eta,axisOrder:N,Lambda:a.Lambda});
  const p=[zero()];for(let k=1;k<=2*N+1;k++)p.push(jetScale(jetMul(g2,rmul(phi,phi,k-1)),1/k));
  return {eta,axisOrder:N,etaJetOrder:M,phi,u,pressureIncrement:p,data:a,maximumSource,status:'FORMAL_NONLINEAR_AXIS_COEFFICIENTS',certifiedAnalyticRadius:null,certifiedTailBound:null,
    blockers:[{id:'B2_COMPLEX_DOMAIN','criterion':'N3-03',reason:'The selected numerical data have no certified complex neighborhood, B_rho invariant ball, or contraction Lipschitz constant.'},{id:'B2_NONLINEAR_TAIL','criterion':'N3-03',reason:'Computed coefficients solve the finite degree recursion; scalar f0 tail is not a tail bound for these nonlinear coefficients.'}],
    equations:['B.12','B.14','B.15','B.16'],sourcePages:[145,146,147,148]};
}
export function evaluateAxis(solution,X){
  const {data:a,phi,u,pressureIncrement:p,axisOrder:N}=solution,Y=a.Lambda*X;
  const poly=(rows,etaDeriv=0,radialDeriv=0)=>{let v=0;for(let k=N;k>=radialDeriv;k--){let f=1;for(let j=0;j<radialDeriv;j++)f*=k-j;v=v*Y+(rows[k]?.[etaDeriv]??0)*f;}return v;};
  const Phi=poly(phi),PhiEta=poly(phi,1),PhiY=poly(phi,0,1),PhiYY=poly(phi,0,2),Us=poly(u)/a.Lambda+a.Us[0],Ueta=poly(u,1)/a.Lambda+a.Us[1],UX=poly(u,0,1),UXX=poly(u,0,2)*a.Lambda,g=a.g[0],F=g*Phi,Feta=a.g[1]*Phi+g*PhiEta,FX=g*a.Lambda*PhiY;
  let avgU=a.Us[0],avgUeta=a.Us[1];for(let k=1;k<=N;k++){avgU+=u[k][0]*Y**k/((k+1)*a.Lambda);avgUeta+=u[k][1]*Y**k/((k+1)*a.Lambda);}
  let Pi=a.Pi[0],PiEta=a.Pi[1];for(let k=1;k<p.length;k++){Pi+=p[k][0]*Y**k/a.Lambda;PiEta+=p[k][1]*Y**k/a.Lambda;}
  const eta=a.eta,d=1-eta*eta,L=1-2*(.5-a.D)*eta*eta,VoverX=(2*eta*Us-2*a.D*eta*avgU-d*avgUeta)/L,E=Math.sqrt(2*X)*F;
  const W=1-2*a.D*eta*avgU-d*avgUeta,Hc=a.D*eta+d*Us,l=1+(F===0?0:X*FX/F),Sq=-W*l-(.5-a.D)*(1-2*eta*Us)-Hc*(F===0?0:Feta/F),Sn=-W*X*UX-a.A*(1-2*eta*Us)*Us-Hc*Ueta-d*PiEta+4*a.A*eta*Pi+2*eta*X*F*F;
  const residualAngular=Phi===0?null:-2*L*(X*a.Lambda*a.Lambda*PhiYY+2*a.Lambda*PhiY)/Phi-Sq,residualAxial=-2*L*(X*UXX+UX)-Sn;
  return {X,Y,eta,E,U:Us,F,FX,Feta,Ueta,UX,UXX,Pi,PiEta,PiX:F*F,V0:X*VoverX,VoverX,avgU,avgUeta,Phi,comparison:comparisonSeries(Math.max(0,Math.min(20,Y*a.chi[0]))).value,leadingResidual:{angular:residualAngular,axial:residualAxial},positive:E>0||X===0,finite:Object.values({E,Us,F,Pi,VoverX}).every(Number.isFinite),grade:'FINITE_NONLINEAR_AXIS_APPROXIMATION_UNCERTIFIED_TAIL'};
}
