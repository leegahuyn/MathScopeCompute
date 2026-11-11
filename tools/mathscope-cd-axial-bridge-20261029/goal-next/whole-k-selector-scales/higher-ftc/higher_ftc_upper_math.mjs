/** Positive analytic majorants for the remaining four higher FTC families.
 * Inputs are obtained from the original sealed induction norm producer.
 */
export function higherFTCUpperMath(G,{profiles,leading,Xminus,Xplus,Xb,h,t1,normCalculus,physicalCalculus,cartesianRadial,weightsAt}){
  const q=(n,d=1)=>G.q(n,d),fact=n=>Array.from({length:n},(_,i)=>BigInt(i+1)).reduce((a,b)=>a*b,1n);
  const choose=(n,k)=>fact(n)/(fact(k)*fact(n-k));
  const {fn,constant:C,add,mul,scale,dx,de}=normCalculus(G);
  const radius=G.sqrt(G.mul(q(2),Xb)),x=fn((r,k)=>k?G.zero:r===0?Xplus:r===1?G.one:G.zero);
  const eta=fn((r,k)=>r||k>1?G.zero:G.one),d=fn((r,k)=>r?G.zero:k===0?G.one:k<=2?q(2):G.zero);
  const invL=fn((r,k)=>r?G.zero:q(2n*fact(k)*8n**BigInt(k)));
  const Z=f=>mul(invL,add(scale(q(8),mul(eta,f)),scale(q(2),mul(eta,x,dx(f))),mul(d,de(f))));
  const T=f=>mul(invL,add(scale(q(4),f),mul(eta,de(f)),mul(x,dx(f))));
  const U=[fn(()=>leading.U),...profiles.map(r=>r.U)],F=[fn(()=>leading.FActive),...profiles.map(r=>r.F)];
  const avg=U.map(u=>fn((r,k)=>G.div(u.get(r,k),q(r+1))));
  const V=U.map((u,i)=>mul(invL,add(scale(q(2),mul(eta,u)),scale(q(4),mul(eta,avg[i])),mul(d,de(avg[i])))));
  const forward=f=>fn((r,k)=>r?f.get(r-1,k):G.mul(Xplus,f.get(0,k)));
  const inv2X=fn((r,k)=>k?G.zero:G.div(q(fact(r),2),G.pow(Xminus,r+1)));
  const invR=fn((r,k)=>k?G.zero:G.div(q(fact(r)),G.mul(G.sqrt(G.mul(q(2),Xminus)),G.pow(Xminus,r))));
  function stresses(n,Pi){
    const theta=[T(F[n])],axial=[T(U[n])];
    for(let i=0;i<=n;i++){
      const j=n-i;
      theta.push(mul(V[i],add(mul(x,dx(F[j])),F[j])),mul(U[i],Z(F[j])));
      axial.push(mul(x,V[i],dx(U[j])),mul(U[i],Z(U[j])));
    }
    theta.push(scale(q(2),add(mul(x,dx(F[n],2)),scale(q(2),dx(F[n])))),Z(Z(F[n-1])));
    axial.push(Z(Pi),scale(q(2),add(mul(x,dx(U[n],2)),dx(U[n]))),Z(Z(U[n-1])));
    return [mul(inv2X,forward(scale(q(2),mul(x,add(...theta))))),mul(invR,forward(add(...axial)))];
  }
  const stirling=[[1n]];
  for(let j=1;j<=4;j++)stirling[j]=Array.from({length:j+1},(_,k)=>(stirling[j-1][k-1]??0n)+BigInt(j-1)*(stirling[j-1][k]??0n));
  const logJets=stirling.map((_,j)=>G.mul(q(fact(j+1)),G.add(G.mul(G.pow(q(128),j+2),G.pow(t1,-j)),G.div(q(4),G.pow(q(127),j+2)))));
  const physicalLogJets=stirling.map((s,j)=>G.mul(G.pow(Xminus,-j),G.add(...s.map((c,k)=>G.mul(q(c),logJets[k])))));
  const exponential=[G.exp(logJets[0])];
  for(let j=1;j<=4;j++)exponential[j]=G.add(...Array.from({length:j},(_,k)=>G.mul(q(choose(j-1,k)),physicalLogJets[j-k],exponential[k])));
  const reciprocal=fn((r,k)=>k?G.zero:exponential[r]);
  const requiredLog=(n,upper)=>G.div(G.add(G.mul(q(n),G.log(q(2))),G.log(upper)),G.mul(q(n),h));
  const rows=[];
  for(const {n,Pi} of profiles.slice(1)){
    const weights=weightsAt({order:n,derivativeOrder:n});
    const polynomial=c=>G.add(...c.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k))));
    const W=weights.weights.map(w=>polynomial(w.polynomialInSourceH));
    const Wextra=weights.weights.map(w=>polynomial(w.extraPotentialCutoffPolynomialInSourceH));
    const stress=stresses(n,Pi);
    const {fn:jet,constant:K,add:add4,mul:mul4,shift}=physicalCalculus(G);
    const coordinate=(j,upper)=>jet((...orders)=>orders.every(k=>k===0)?upper:orders[j]===1&&orders.reduce((a,b)=>a+b,0)===1?G.one:G.zero);
    const xx=coordinate(1,radius),yy=coordinate(2,radius),ee=coordinate(3,G.one);
    const lift=f=>jet((e,x,y,k)=>e||x||y?G.zero:f.get(0,k));
    const dd=lift(d),invLL=lift(invL);
    const radial=f=>jet((e,x,y,k)=>e?G.zero:cartesianRadial(G,(r,m)=>f.get(r,m),{xOrder:x,yOrder:y,etaOrder:k,radius}));
    const Av=radial(avg[n]),An=radial(F[n]),Vr=radial(V[n]),Uz=radial(U[n]);
    const etaOverL=lift(mul(eta,invL));
    const velocity=[mul4(K(q(1,2)),yy,Av),mul4(K(q(1,2)),xx,Av),mul4(yy,An),mul4(xx,An),
      mul4(K(q(1,2)),xx,Vr),mul4(K(q(1,2)),yy,Vr),mul4(xx,etaOverL,Av),mul4(yy,etaOverL,Av),Uz];
    const pressureStress=[radial(Pi),...stress.map(radial)];
    const volumeCartesian=[G.one,G.mul(q(2),radius),G.mul(q(2),radius),q(2)];
    function physical(component,loss,weights){
      const ftc=jet((e,x,y,k)=>{
        if(e)return G.zero;
        return G.add(...Array.from({length:8},(_,mask)=>G.mul(
          ...[1,2,3].filter(j=>mask&(1<<(j-1))).map(j=>volumeCartesian[j]),
          G.add(G.one,component.get(0,x+(mask&1),y+((mask>>1)&1),k+((mask>>2)&1))))));
      });
      let current=jet((e,x,y,k)=>G.mul(weights[e],ftc.get(0,x,y,k)));
      const rows=[current.get(0,0,0,0)];
      for(let j=0;j<n;j++){
        const E=shift(current,0),X=shift(current,1),Y=shift(current,2),S=shift(current,3);
        const euler=add4(E,mul4(K(G.add(loss,q(j))),current)),r=add4(mul4(xx,X),mul4(yy,Y));
        const axial=mul4(invLL,add4(mul4(K(q(2)),ee,euler),mul4(ee,r),mul4(dd,S)));
        const time=mul4(invLL,add4(euler,mul4(K(q(1,2)),r),mul4(K(G.core.D),ee,S)));
        current=add4(X,Y,axial,time);
        rows.push(current.get(0,0,0,0));
      }
      return rows;
    }
    function aggregate(rows){return G.maximum(G.one,...Array.from({length:n+1},(_,j)=>G.add(...rows.map(r=>r[j]))));}
    const vloss=[h,h,G.core.A,G.core.A,q(1,2),q(1,2),q(1,2),q(1,2),G.core.A];
    const ploss=[G.mul(q(2),G.core.A),G.add(G.core.A,q(1,2)),G.add(G.core.A,q(1,2))];
    const velocityUpper=aggregate(velocity.map((f,j)=>physical(f,vloss[j],[6,7].includes(j)?Wextra:W)));
    const physicalStressUpper=aggregate(pressureStress.map((f,j)=>physical(f,ploss[j],W)));
    const widths=[G.one,G.sub(Xplus,Xminus),q(2),G.mul(q(2),G.sub(Xplus,Xminus))];
    function weighted(direct){
      const terms=[];
      for(const f of stress)for(let r=0;r<=n;r++)for(let k=0;r+k<=n;k++){
        const product=direct?mul(dx(f,r),reciprocal):mul(f,reciprocal);
        const face=widths.map((w,m)=>G.mul(w,G.add(G.one,product.get((direct?0:r)+(m&1),k+(m>>1)))));
        const b=G.add(...face);
        for(let e=0;e+r+k<=n;e++)terms.push(G.mul(W[e],b));
      }
      return G.maximum(G.one,...terms);
    }
    for(const [kind,upper] of Object.entries({velocityPhysical:velocityUpper,pressureStressPhysical:physicalStressUpper,
      weightedStressQuotient:weighted(false),weightedStressDirect:weighted(true)})){
      rows.push({n,kind,upper,requiredLog:requiredLog(n,upper)});
    }
  }
  return {rows,reciprocalGaussianDerivatives:exponential,reciprocalGaussianLogDerivatives:physicalLogJets,
    scope:'Absolute ordinary derivative bounds for original compact higher raw stresses, Cartesian profiles and FTC side lengths. Explicit source-body cross-check is separate.'};
}
