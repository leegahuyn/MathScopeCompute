/** Direct substitution of the actual coefficient generator in (5.2)--(5.6).
 * The returned graph distinguishes retained orders from the actual nonzero
 * remainder. A finite radial jet is used to verify coefficient identities;
 * function-value enclosures use the infinite source Picard norm separately.
 */
import {buildActualBackgroundJets} from './actual-background-jets.mjs';
import {SOURCE_PROFILE_ID} from './source-profile.mjs';

const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;};
class ExtendedExpressions{
  constructor(nodes){this.nodes=structuredClone(nodes);this.ids=new Map(this.nodes.map((n,i)=>[JSON.stringify([n.op,...n.args]),i]));this.zero=this.rat(0);this.one=this.rat(1);}
  node(op,...args){const key=JSON.stringify([op,...args]);if(this.ids.has(key))return this.ids.get(key);const id=this.nodes.length;this.nodes.push({op,args});this.ids.set(key,id);return id;}
  rat(a,b=1){a=BigInt(a);b=BigInt(b);if(!b)throw Error('Zero denominator.');if(b<0n){a=-a;b=-b;}const g=gcd(a,b);return this.node('rational',String(a/g),String(b/g));}
  add(a,b){if(a===this.zero)return b;if(b===this.zero)return a;const x=this.nodes[a],y=this.nodes[b];if(x.op==='rational'&&y.op==='rational')return this.rat(BigInt(x.args[0])*BigInt(y.args[1])+BigInt(y.args[0])*BigInt(x.args[1]),BigInt(x.args[1])*BigInt(y.args[1]));return this.node('add',...([a,b].sort((x,y)=>x-y)));}
  mul(a,b){if(a===this.zero||b===this.zero)return this.zero;if(a===this.one)return b;if(b===this.one)return a;const x=this.nodes[a],y=this.nodes[b];if(x.op==='rational'&&y.op==='rational')return this.rat(BigInt(x.args[0])*BigInt(y.args[0]),BigInt(x.args[1])*BigInt(y.args[1]));return this.node('multiply',...([a,b].sort((x,y)=>x-y)));}
  scale(a,n,d=1){return this.mul(this.rat(n,d),a);}
  sub(a,b){return this.add(a,this.scale(b,-1));}
  sum(a){return a.reduce((s,x)=>this.add(s,x),this.zero);}
  de(a){const n=this.nodes[a];if(n.op==='rational'||n.op==='source_parameter')return this.zero;if(n.op==='eta')return this.one;if(n.op==='eta_derivative')return this.node('eta_derivative',n.args[0],n.args[1]+1);return this.node('eta_derivative',a,1);}
}

export function buildActualResidualOrderProgram({profileId=SOURCE_PROFILE_ID,radialDegree=3}={}){
  if(!Number.isSafeInteger(radialDegree)||radialDegree<2||radialDegree>4)throw Error('radialDegree must be an integer from 2 to 4.');
  const source=buildActualBackgroundJets({profileId,order:1,radialDegree}),G=new ExtendedExpressions(source.nodes),f=source.fixed,z=G.zero,N=radialDegree;
  const at=(a,k)=>a[k]??z,add=(...as)=>Array.from({length:Math.max(...as.map(a=>a.length))},(_,k)=>G.sum(as.map(a=>at(a,k))));
  const sc=(a,n,d=1)=>a.map(x=>G.scale(x,n,d));
  const cv=(a,b,k)=>G.sum(Array.from({length:k+1},(_,i)=>G.mul(at(a,i),at(b,k-i))));
  const mul=(a,b,n=N+2)=>Array.from({length:n+1},(_,k)=>cv(a,b,k));
  const DX=a=>a.map((x,k)=>G.scale(x,k));
  const dx=a=>a.slice(1).map((x,k)=>G.scale(x,k+1));
  const X=a=>[z,...a];
  const T=(a,p)=>p.map((x,k)=>G.mul(f.iL,G.sum([G.scale(G.mul(a,x),-1),G.scale(x,k),G.mul(G.mul(f.D,f.eta),G.de(x))])));
  const Z=(a,p)=>p.map((x,k)=>G.mul(f.iL,G.add(G.scale(G.mul(f.eta,G.mul(G.sub(a,G.rat(k)),x)),2),G.mul(f.d,G.de(x)))));
  const Z2=(a,p)=>Z(G.sub(a,f.D),Z(a,p));
  const b=G.scale(G.add(f.A,G.rat(1,2)),-1),c=G.scale(f.A,-1),nu=G.scale(f.h,2),b1=G.add(b,nu),c1=G.add(c,nu);
  const ff=[source.leading.F,source.positive.F],uu=[source.leading.U,source.positive.U],pp=[source.leading.Pi,source.positive.Pi],VV=[source.leading.V,source.positive.V],vv=VV.map(a=>a.slice(1));
  const lapF=a=>a.slice(1).map((x,k)=>G.scale(x,2*(k+1)*(k+2)));
  const lapU=a=>a.slice(1).map((x,k)=>G.scale(x,2*(k+1)**2));
  function omega(k){
    const v=k<=1?VV[k]:[z],a=G.scale(nu,k),terms=[T(a,v),sc(X(dx(dx(v))),-2)];
    for(let i=0;i<=k;i++){const j=k-i;if(i>1||j>1)continue;terms.push(mul(VV[i],add(dx(VV[j]),sc(vv[j],-1,2))),mul(uu[i],Z(G.scale(nu,j),VV[j])));}
    if(k>=1&&k<=2)terms.push(sc(Z2(G.scale(nu,k-1),VV[k-1]),-1));
    return add(...terms);
  }
  const omegaRows=[omega(0),omega(1),omega(2)];
  const hTheta=add(mul(vv[1],add(DX(ff[1]),ff[1])),mul(uu[1],Z(b1,ff[1])),sc(Z2(b1,ff[1]),-1));
  const hZ=add(mul(vv[1],DX(uu[1])),mul(uu[1],Z(c1,uu[1])),sc(Z2(c1,uu[1]),-1));
  const Q1=add(omegaRows[1].slice(1),sc(mul(ff[1],ff[1]),-2));
  const Q2=omegaRows[2].slice(1);
  function retainedTangential(n,kind){
    const field=kind==='theta'?ff:uu,a=kind==='theta'?(n?b1:b):(n?c1:c),terms=[T(a,field[n]),sc(kind==='theta'?lapF(field[n]):lapU(field[n]),-1)];
    for(let i=0;i<=n;i++){const j=n-i;terms.push(mul(vv[i],kind==='theta'?add(DX(field[j]),field[j]):DX(field[j])),mul(uu[i],Z(kind==='theta'?(j?b1:b):(j?c1:c),field[j])));}
    if(kind==='z')terms.push(Z(G.add(G.scale(f.A,-2),G.scale(nu,n)),pp[n]));
    if(n)terms.push(sc(Z2(kind==='theta'?b:c,field[0]),-1));
    return add(...terms).slice(0,N);
  }
  const pressure0=add(dx(pp[0]),sc(mul(ff[0],ff[0]),-1)).slice(0,N);
  const pressure1=add(dx(pp[1]),sc(mul(ff[0],ff[1]),-2),sc(omegaRows[0].slice(1),1,2)).slice(0,N);
  const retained={theta0:retainedTangential(0,'theta'),z0:retainedTangential(0,'z'),pressure0,theta1:retainedTangential(1,'theta'),z1:retainedTangential(1,'z'),pressure1};
  const n0={theta:sc(Z2(b,ff[0]),-1),z:sc(Z2(c,uu[0]),-1),radial:omegaRows[0].slice(1),radialNext:sc(Z2(z,VV[0]).slice(1),-1)};
  const n1={theta:hTheta,z:hZ,radial:Q1,radialNext:Q2};
  return {schema:'MathScope.ActualResidualOrderProgram/1',profileId,sourcePaperSHA256:source.sourcePaperSHA256,sourceInputs:source.sourceInputs,radialDegree:N,nodes:G.nodes,fixed:f,leading:source.leading,positive:source.positive,retainedResidualCoefficients:retained,remainderCoefficients:{N0:n0,N1:n1},omega:omegaRows,
    axisRoots:{alpha:uu[1][1],alphaEta:G.de(uu[1][1]),alphaEtaEta:G.de(G.de(uu[1][1])),z1Axis:hZ[0],z1FirstX:hZ[1],radial0Axis:omegaRows[0][1],radial1Axis:Q1[0],radial2Axis:Q2[0]},
    functions:{N0:{theta:'-sqrt(2X)*q^(-A-1)*w*Z_b^[2]f0',z:'-q^(-A-1)*w*Z_c^[2]U0',radial:'q^(-3/2)*sqrt(X/2)*(Omega0/X-w*Z_0^[2]V0/X)'},N1:{theta:'sqrt(2X)*q^(-A-1)*w^2*Htheta1',z:'q^(-A-1)*w^2*Hz1',radial:'q^(-3/2)*sqrt(X/2)*(w*Q1+w^2*Q2)'},w:'q^(2h)',f:'f_n=phi_n/CSelected, not the stream function F_n'},
    sourceEquations:['5.2','5.3','5.4','5.5','5.6','5.14','5.15','5.24','5.25','5.26'],
    scope:{actualSameSourceCoefficientGraph:true,directResidualSubstitution:true,finiteRadialJetIsFullSolution:false,allOrdersGenerated:false,globalMomentRepairComplete:false}};
}
