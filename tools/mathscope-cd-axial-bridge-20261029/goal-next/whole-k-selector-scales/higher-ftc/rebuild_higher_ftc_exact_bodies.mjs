import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

const [repo,tree,normPath,output]=process.argv.slice(2).map(s=>resolve(s));
const norm=JSON.parse(readFileSync(normPath));
const revision='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
assert.equal(norm.sourceCommit,revision);
for(const [path,expected] of Object.entries(norm.sourcePins)){
  const raw=readFileSync(join(tree,path));
  assert.equal(createHash('sha256').update(raw).digest('hex'),expected,path);
  const git=execFileSync('git',['-c','core.longpaths=true','-C',repo,'show',`${revision}:${path}`],{maxBuffer:20*1024*1024});
  assert.deepEqual(git,raw,path);
}
const m2='research-ide/mathscope-m2/navier/';
const imports=['actual-residual-order-induction-source.mjs','actual-background-physical-seminorms.mjs',
  'actual-residual-order-induction-kernels.mjs','actual-velocity-all-order-tail.mjs'];
const [{prepareActualOrderInduction},{rectangularSourceFTC},{sourceNormalizedCutoffWeights},{physicalPositiveJetCalculus}]=
  await Promise.all(imports.map(name=>{assert(norm.sourcePins[m2+name]);return import(pathToFileURL(join(tree,m2,name)).href);}));
const prepared=prepareActualOrderInduction({order:3,maxNodes:2500000});
const {G,records,bootstrap}=prepared;
const baseCount=G.nodes.length;
G.derivativeBudget(14,7);
const {X,eta}=bootstrap.constants,{Xb,Xminus,Xplus}=bootstrap.orderOne,{A,D,L}=G.core;
const q=(n,d=1)=>G.q(n,d),h=G.parameter('h'),t1=G.parameter('t1'),Xa=G.parameter('Xa');
const radius=G.sqrt(G.mul(q(2),Xb));
const y1=G.fresh('audit_ftc_x1'),y2=G.fresh('audit_ftc_x2'),ec=G.fresh('audit_ftc_eta');
const cartX=G.div(G.add(G.pow(y1,2),G.pow(y2,2)),q(2));
const atCart=f=>G.simultaneousSubstitute(f,[X,eta],[cartX,ec]);
const cartBox={coordinates:[y1,y2,ec],lower:[G.neg(radius),G.neg(radius),q(-1)],upper:[radius,radius,G.one]};
const weightBox={coordinates:[X,eta],lower:[Xminus,q(-1)],upper:[Xplus,G.one]};
const piBox={coordinates:[X,eta],lower:[G.zero,q(-1)],upper:[Xplus,G.one]};
const zeta=G.exp(G.neg(G.add(G.div(G.pow(t1,2),G.pow(G.log(G.div(X,Xa)),2)),G.div(q(4),G.pow(G.log(G.div(Xb,X)),2)))));
const fact=n=>Array.from({length:n},(_,i)=>BigInt(i+1)).reduce((a,b)=>a*b,1n);
const differentiate=(id,vars,orders)=>{
  for(const [j,coordinate] of vars.entries())for(let k=0;k<orders[j];k++)id=G.derivative(id,coordinate);
  return id;
};
const rows=[];
for(const rec of records.slice(2)){
  const n=rec.order,g=rec.global;
  const weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:n});
  assert(weights.pass);
  const poly=c=>G.add(...c.map((v,k)=>G.mul(q(BigInt(v)),G.pow(h,k))));
  const W=weights.weights.map(w=>poly(w.polynomialInSourceH)),Wextra=weights.weights.map(w=>poly(w.extraPotentialCutoffPolynomialInSourceH));
  const F=atCart(g.F),U=atCart(g.U),v=atCart(g.v),avg=atCart(g.average),el=atCart(G.div(eta,L));
  const velocity=[G.neg(G.div(G.mul(y2,avg),q(2))),G.div(G.mul(y1,avg),q(2)),G.neg(G.mul(y2,F)),G.mul(y1,F),
    G.div(G.mul(y1,v),q(2)),G.div(G.mul(y2,v),q(2)),G.neg(G.mul(y1,el,avg)),G.neg(G.mul(y2,el,avg)),U];
  const stress=[rec.stress.Ttheta,rec.stress.Tz];
  const {fn,constant,add,mul,shift}=physicalPositiveJetCalculus(G);
  const coord=(j,bound)=>fn((...o)=>o.every(x=>x===0)?bound:o[j]===1&&o.reduce((a,b)=>a+b,0)===1?G.one:G.zero);
  const xx=coord(1,radius),yy=coord(2,radius),ee=coord(3,G.one);
  const dd=fn((e,x,y,s)=>e||x||y?G.zero:s===0?G.one:s===1||s===2?q(2):G.zero);
  const invL=fn((e,x,y,s)=>e||x||y?G.zero:q(2n*fact(s)*8n**BigInt(s)));
  const profileCache=new Map();
  function profile(body,x,y,s){
    const key=[body,x,y,s].join(',');
    if(!profileCache.has(key)){
      const derivative=differentiate(body,cartBox.coordinates,[x,y,s]);
      profileCache.set(key,rectangularSourceFTC(G,{body:derivative,...cartBox}).bound);
    }
    return profileCache.get(key);
  }
  function physical(body,loss,cutoff){
    let current=fn((e,x,y,s)=>G.mul(cutoff[e],profile(body,x,y,s)));
    const byOrder=[current.get(0,0,0,0)];
    for(let j=0;j<n;j++){
      const E=shift(current,0),X=shift(current,1),Y=shift(current,2),S=shift(current,3);
      const euler=add(E,mul(constant(G.add(loss,q(j))),current)),radial=add(mul(xx,X),mul(yy,Y));
      const axial=mul(invL,add(mul(constant(q(2)),ee,euler),mul(ee,radial),mul(dd,S)));
      const time=mul(invL,add(euler,mul(constant(q(1,2)),radial),mul(constant(D),ee,S)));
      current=add(X,Y,axial,time);byOrder.push(current.get(0,0,0,0));
    }
    return byOrder;
  }
  const aggregate=rows=>G.maximum(G.one,...Array.from({length:n+1},(_,j)=>G.add(...rows.map(r=>r[j]))));
  const vloss=[h,h,A,A,q(1,2),q(1,2),q(1,2),q(1,2),A];
  const ploss=[G.mul(q(2),A),G.add(A,q(1,2)),G.add(A,q(1,2))];
  const velocityPhysical=aggregate(velocity.map((body,j)=>physical(body,vloss[j],[6,7].includes(j)?Wextra:W)));
  const pressureStressPhysical=aggregate([g.Pi,...stress].map((body,j)=>physical(atCart(body),ploss[j],W)));
  const quotient=[],direct=[],pressure=[];
  function collect(body,box,r,k,out){
    const b=rectangularSourceFTC(G,{body,...box}).bound;
    for(let e=0;e+r+k<=n;e++)out.push(G.mul(W[e],b));
  }
  for(let r=0;r<=n;r++)for(let k=0;r+k<=n;k++){
    collect(differentiate(g.Pi,[X,eta],[r,k]),piBox,r,k,pressure);
    for(const f of stress){
      collect(differentiate(G.div(f,zeta),[X,eta],[r,k]),weightBox,r,k,quotient);
      collect(G.div(differentiate(f,[X,eta],[r,k]),zeta),weightBox,r,k,direct);
    }
  }
  const bounds={'velocity-potential-physical':velocityPhysical,'pressure-stress-physical':pressureStressPhysical,
    'normalized-pressure':G.maximum(G.one,...pressure),'higher-stress-quotient-by-zeta':G.maximum(G.one,...quotient),
    'higher-stress-direct-zeta':G.maximum(G.one,...direct)};
  const required=Object.fromEntries(Object.entries(bounds).map(([key,b])=>[key,G.div(G.add(G.mul(q(n),G.log(q(2))),G.log(b)),G.mul(q(n),h))]));
  rows.push({n,bounds,required});
  console.log('exact reconstructed original FTC roots',n,G.nodes.length);
}
const result={schema:'MathScope.N7.ExactHigherFTCReconstruction/1',sourceCommit:revision,baseCount,rows,
  registry:G.captureFunctionDefinitions(),nodes:G.nodes};
const zipped=gzipSync(Buffer.from(JSON.stringify(result)),{level:5});
writeFileSync(output,zipped);
console.log('gzip AST',G.nodes.length,createHash('sha256').update(zipped).digest('hex'));
