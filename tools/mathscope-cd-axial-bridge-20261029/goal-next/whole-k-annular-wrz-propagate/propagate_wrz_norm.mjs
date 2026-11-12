import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const sha=raw=>createHash('sha256').update(raw).digest('hex');
const hashJSON=obj=>sha(JSON.stringify(obj));
const [next,hosted,chartFile,out]=process.argv.slice(2);
assert.ok(next&&hosted&&chartFile&&out,'Supply GOAL_NEXT, HOSTED_GRAPH, WHOLE_K_CHART and OUTPUT.');
const sourceGraphSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const pins={
  target:['whole-k-annular-wrz-norm/target-c7.json','3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770'],
  background:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  readback:['whole-k-annular-wrz-norm/directional-norms-readback.json','3cdc1354233ed25dc1fd39fad72e19856964db036d856e35873eb42b348ddd78'],
  transverse:['whole-k-annular-wrz/transverse-wrz-bound.json','12cc99ba7c3b47c88555e5eaca310fab7471d307e720c40340de78e104d9634d'],
  scale:['whole-k-annular-wrz/transverse-axial-scale.json','47dd62310d8d5c3396d17b4b21704e00655f5a0c5243832638c23adf2c14e414'],
  radial:['whole-k-annular-mean-sharp/fixed-operators.json','e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633'],
  lowOrder:['primary-c2-target/result.json','408f2d46bb0532313b5c332623a2e56981ae1d05fc4b180bc35a8d8f234f9cb9'],
  localization:['first-scale-closure/first-scale-closure.json','1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a']
};
async function pinned(path,hash){
  const raw=await readFile(path);
  assert.equal(sha(raw),hash,path);
  return JSON.parse(raw);
}
const inputs=Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([k,[file,h]])=>[k,await pinned(resolve(next,file),h)])));
const chartSHA='af17e240150ca11452ccd5dcde5e1d2a21f5872d3a1e29a9247d75e6902e86b9';
const chart=await pinned(chartFile,chartSHA);
assert.deepEqual(chart.variables.bounds,['1/2 <= Q < 2','|eta| < 3/4','q < qBig/16']);
assert.deepEqual(chart.background.possibly_active_orders,[0,1,2,3]);
assert.deepEqual(inputs.target.graph,inputs.readback.inputs['target-c7']);
assert.deepEqual(inputs.background.graph,inputs.readback.inputs['background-c8']);
assert.equal(inputs.scale.checkedNativeRows,162);
assert.equal(inputs.transverse.source.commonCover.rowsChecked,162);
assert.deepEqual(inputs.transverse.source.positiveSquareRootWeights,[623824,623825]);
assert.equal(inputs.lowOrder.Bnorm,300170);
assert.equal(inputs.lowOrder.graph_sha256,sourceGraphSHA);
assert.equal(inputs.localization.qBigComparison.actual,'qBig=2^(-(ellMinimum+10))');
assert.equal(inputs.localization.actualRoots.ellMinimum,617432);
const nativeRegistrySHA='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
const topRegistry=await pinned(resolve(hosted,'original-source-functions.json'),nativeRegistrySHA);
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const commonRegistry=decode(topRegistry.base),baseRegistry=decode(commonRegistry.base);
const nativePulse=decode(baseRegistry.m3GlobalPulses);
assert.equal(nativePulse.length,2);
assert.deepEqual(nativePulse.flatMap(p=>p.matrix.flat()),inputs.transverse.source.pulseMatrices);
for(const [i,pulse] of nativePulse.entries()){
  const nativeDefinition=decode(pulse.originalDefinition);
  assert.equal(nativeDefinition.name,i===0?'M3OwnGlobalBandPulse_1':'M3OwnGlobalBandPulse_-1');
  assert.deepEqual(nativeDefinition.matrix,pulse.matrix);
  assert.deepEqual(nativeDefinition.parameters,pulse.parameters);
  assert.deepEqual(pulse.parameters,[622802,622803,622804,622807,622808,622809,622791]);
  assert.deepEqual(pulse.directions,[622802,622803,622804]);
  assert.deepEqual(pulse.initial,[1,0]);
  assert.equal(pulse.variable,622805);
  assert.equal(pulse.length,623027);
}
const wanted=new Set([9,127,3612,216823,300170,300171,617289,617292,617431,617432,622750,622751,
  ...inputs.transverse.source.pulseMatrices,...inputs.transverse.source.H.flat(),
  ...inputs.transverse.source.targetComponents,inputs.transverse.source.determinant,
  ...inputs.transverse.source.positiveSquareRootWeights,643048,3613979]);
const source=new Map(),checkHash=createHash('sha256');
const gz=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
gz.on('data',bytes=>checkHash.update(bytes));
let number=-1;
for await(const line of createInterface({input:gz,crlfDelay:Infinity})){
  if(wanted.has(number))source.set(number,JSON.parse(line));
  number++;
}
assert.equal(number,4456994);
assert.equal(checkHash.digest('hex'),sourceGraphSHA);
const check=(n,op,args)=>assert.deepEqual(source.get(n),{op,args},'exact native source #'+n);
check(9,'source_parameter',['h']);
check(127,'log_positive',[24]);
check(3612,'source_parameter',['t1']);
check(216823,'source_parameter',['C12EnvelopeR']);
check(300170,'add',[215531,300169]);
check(300171,'rational',['1','17179869184']);
check(617289,'source_parameter',['directionalMarginKappa']);
check(617292,'integer_power',[300170,256]);
check(617432,'ceiling',[617431]);
check(622751,'add',[474,622750]);
check(623781,'multiply',[622884,623780]);
check(623788,'multiply',[622884,623787]);
check(623792,'add',[623789,623791]);
check(623824,'sqrt_positive',[623799]);
check(623825,'sqrt_positive',[623803]);
check(643048,'m3_aux_indexed_partial',[2,[622802,622803,622804,622791,635044,635045],[0,2,0,0,0]]);
check(3613979,'m3_aux_expression_partial',[-13,[622791,622802,622803,622804,635044,635045],[0,0,3,0,0,0]]);

class Positive {
  constructor(){
    this.nodes=[];
    this.memo=new Map();
    this.zero=this.q(0);
    this.one=this.q(1);
  }
  node(op,args){
    const key=JSON.stringify([op,args]);
    if(!this.memo.has(key)){
      this.memo.set(key,this.nodes.length);
      this.nodes.push({op,args});
    }
    return this.memo.get(key);
  }
  q(n,d=1){
    let a=BigInt(n),b=BigInt(d);
    assert.ok(a>=0n&&b>0n);
    let x=a,y=b;
    while(y){const r=x%y;x=y;y=r;}
    return this.node('rational',[String(a/x),String(b/x)]);
  }
  add(...xs){
    const a=xs.filter(x=>x!==this.zero).sort((x,y)=>x-y);
    return !a.length?this.zero:a.length===1?a[0]:this.node('add',a);
  }
  mul(...xs){
    if(xs.includes(this.zero))return this.zero;
    const a=xs.filter(x=>x!==this.one).sort((x,y)=>x-y);
    return !a.length?this.one:a.length===1?a[0]:this.node('multiply',a);
  }
  inv(x){assert.notEqual(x,this.zero);return x===this.one?x:this.node('inverse',[x]);}
  sq(x){return x===this.zero||x===this.one?x:this.node('sqrt_positive',[x]);}
  pow(x,n){
    assert.ok(Number.isSafeInteger(n)&&n>=0);
    return n===0?this.one:n===1||x===this.zero||x===this.one?x:this.node('integer_power',[x,n]);
  }
  exp(x){return x===this.zero?this.one:this.node('exp',[x]);}
  max(...xs){
    const a=[...new Set(xs)].sort((x,y)=>x-y);
    return a.length===1?a[0]:this.node('maximum',a);
  }
  leaf(ns,id){return this.node('authenticated_source_norm_root',[ns,id]);}
}

const P=new Positive();
const q=(n,d=1)=>P.q(n,d),add=(...a)=>P.add(...a),mul=(...a)=>P.mul(...a),pow=(a,b)=>P.pow(a,b),inv=a=>P.inv(a),
  sq=a=>P.sq(a),ex=a=>P.exp(a),max=(...a)=>P.max(...a);
const native=id=>P.leaf('hosted-original',id);
const R=native(216823),h=native(9),t1=native(3612),kappa=native(617289),B0=native(300170),
  r0=native(300171),Dg=native(622751),log2=native(127),ell=native(617432);
const S=pow(add(ell,q(17)),2),Tg=add(q(4),sq(q(2))),Lmax=mul(q(2),r0,Tg),length=mul(Lmax,S),
  u=mul(q(2),inv(kappa)),LminInv=inv(mul(q(2),r0)),stable=ex(mul(q(3),pow(B0,256),Lmax));
const car=add(q(1),mul(add(R,q(1)),pow(R,42),add(q(1),mul(u,pow(R,31),inv(mul(q(4),r0))),mul(q(1,2),u))));
const nLower=inv(pow(B0,2)),cLower=inv(B0),n2Lower=pow(nLower,2);
const lambdaUpper=pow(R,83),aUpper=mul(q(2),stable),aLower=mul(q(1,2),inv(stable));
const gaussianUpper=mul(q(15,2),lambdaUpper,inv(u)),
  massLower=mul(pow(aLower,2),inv(mul(q(15),max(q(1),mul(q(2),gaussianUpper))))),
  massUpper=mul(q(2),Dg,pow(r0,2),pow(aUpper,2));
const detLowerCoefficient=mul(q(15,16),inv(pow(R,6)),u,pow(Dg,2),r0,
  pow(mul(q(1,2),r0),2),pow(massLower,2),inv(Tg));
const HentryCoefficient=mul(q(8),u,pow(R,10),massUpper);
const Hinv0=mul(q(4),HentryCoefficient,inv(detLowerCoefficient),S);
const cy=mul(kappa,inv(pow(R,128)),inv(mul(q(64),massUpper)));

const factorial=n=>{let a=1n;for(let k=2;k<=n;k++)a*=BigInt(k);return a;};
const choose=(n,j)=>factorial(n)/(factorial(j)*factorial(n-j));
const orders=inputs.transverse.directionalBoundProgram.downwardClosedJets.map(r=>r.slowJet);
assert.equal(orders.length,15);
const index=new Map(orders.map((a,j)=>[a.join(':'),j]));
const split=orders.map(([r,z])=>{
  const result=[];
  for(let a=0;a<=r;a++)for(let b=0;b<=z;b++)
    result.push([index.get(a+':'+b),index.get((r-a)+':'+(z-b))]);
  return result;
});
const degree=orders.map(([r,z])=>r+z);
const alphaFactor=orders.map(([r,z])=>factorial(r)*factorial(z));
const m=7;
const zeroJet=orders.map(()=>P.zero);
const C=x=>[x,...zeroJet.slice(1)];
const plus=(...js)=>orders.map((_,i)=>add(...js.map(j=>j[i])));
const scale=(x,j)=>j.map(y=>mul(x,y));
const product=(a,b)=>split.map(parts=>add(...parts.map(([i,j])=>mul(a[i],b[j]))));
const times=(...js)=>js.reduce(product,C(P.one));
const inverse=(a,lower)=>{
  const c=[inv(lower)];
  for(let n=1;n<orders.length;n++)c.push(mul(c[0],add(...split[n].slice(1).map(([i,j])=>mul(a[i],c[j])))));
  return c;
};
const squareRoot=(a,lower)=>{
  const c=[sq(a[0])],den=inv(mul(q(2),lower));
  for(let n=1;n<orders.length;n++)c.push(mul(den,add(a[n],...split[n].slice(1,-1).map(([i,j])=>mul(c[i],c[j])))));
  return c;
};
const dual=(j,v=zeroJet)=>({j,v});
const dplus=(...as)=>dual(plus(...as.map(x=>x.j)),plus(...as.map(x=>x.v)));
const dmul=(a,b)=>dual(product(a.j,b.j),plus(product(a.j,b.v),product(a.v,b.j)));
const dinv=(a,lower)=>{
  const v=inverse(a.j,lower);
  return dual(v,times(v,v,a.v));
};
const dsqrt=(a,lower)=>{
  const v=squareRoot(a.j,lower);
  return dual(v,scale(q(1,2),product(inverse(v,lower),a.v)));
};
const matrix=(a,b,plusFn=plus,productFn=product)=>a.map(r=>b[0].map((_,j)=>
  plusFn(...r.map((x,k)=>productFn(x,b[k][j])))));
const matrixNorm=M=>orders.map((_,j)=>max(...M.map(r=>add(...r.map(x=>x[j])))));

function actualFGBound(field,extra){
  return degree.map((k,j)=>mul(q(1,alphaFactor[j]),P.leaf('background-c8',inputs.background.bounds[k+extra][field])));
}
const F=actualFGBound('F',0),FR=actualFGBound('F',1),FZ=FR,
  GR=actualFGBound('G',1),GZ=GR;
const HR=scale(car,plus(FR,GR)),HZ=scale(car,plus(FZ,GZ));
const Rjet=C(R);
Rjet[index.get('1:0')]=P.one;
const invR=inverse(Rjet,inv(R));
const v=dual(C(length),C(P.one)),p=dual(C(car));
const n=[dplus(p,dmul(v,dual(HR))),dmul(p,dual(invR)),dplus(p,dmul(v,dual(HZ)))];
const n2=plus(...n.map(x=>product(x.j,x.j)));
const invN2=inverse(n2,n2Lower);
const nt=dsqrt(dplus(dmul(n[1],n[1]),dmul(n[2],n[2])),nLower);
const ntInv=dinv(nt,nLower);
const Ka=[dmul(n[1],ntInv),dmul(n[2],ntInv)],Na=[Ka[1],Ka[0]],sa=dmul(n[0],ntInv);
const K=[[zeroJet,scale(q(2),F),zeroJet],
  [plus(scale(q(2),F),product(Rjet,FR)),zeroJet,zeroJet],[GR,zeroJet,zeroJet]];
const numerator=K[0].map((_,j)=>plus(n[j].v,...n.map((x,i)=>product(x.j,K[i][j]))));
const Aphi=K.map((r,i)=>r.map((x,j)=>plus(x,times(n[i].j,numerator[j],invN2))));
const sRef=dual(C(mul(q(2),u)),C(mul(u,LminInv)));
const cref=dmul(dual(C(pow(R,10))),dsqrt(dplus(dual(C(P.one)),dmul(sRef,sRef)),P.one));
const U=[[dual(C(P.one)),dual(zeroJet)],[dmul(sa,Ka[0]),Na[0]],[dmul(sa,Ka[1]),Na[1]]];
const J=[[dual(C(P.one)),dual(C(P.one))],[cref,cref]];
const moving=matrix(U,J,dplus,dmul),B=moving.map(r=>r.map(x=>x.j)),Bv=moving.map(r=>r.map(x=>x.v));
const Uleft=[[C(P.one),zeroJet,zeroJet],[zeroJet,Na[0].j,Na[1].j]];
const Ji=[[C(q(1,2)),scale(q(1,2),inverse(cref.j,cLower))],
  [C(q(1,2)),scale(q(1,2),inverse(cref.j,cLower))]];
const left=matrix(Ji,Uleft),prod=matrix(Aphi,B);
const projected=matrix(left,prod.map((row,i)=>row.map((x,j)=>plus(x,Bv[i][j]))));
const damping=scale(q(4),n2),lambda=C(lambdaUpper),dref=C(mul(lambdaUpper,add(q(1),mul(q(4),pow(u,2)))));
const M=projected.map((r,i)=>r.map((x,j)=>i===j?plus(x,lambda,damping,dref):x));
const Mnorm=matrixNorm(M);
const w=[stable],forcingLength=mul(length,stable);
for(let j=1;j<orders.length;j++)w.push(mul(forcingLength,add(...split[j].slice(1).map(([a,b])=>mul(Mnorm[a],w[b])))));
const t=B.map(row=>plus(...row.map(x=>product(x,w)))); // Same bound for the two w components, P(v)<=1.
const haarLength=mul(q(4),pow(r0,2)); // (Dg/2)*c_i*(2*r0)*L_s = 2*Dg*r0^2 <= 4*r0^2.
const Htheta=scale(haarLength,product(t[0],t[1])),Hz=scale(haarLength,product(t[0],t[2]));
const Hnorm=orders.map((_,j)=>mul(q(2),max(Htheta[j],Hz[j])));
const Hinv=[Hinv0];
for(let j=1;j<orders.length;j++)Hinv.push(mul(Hinv0,add(...split[j].slice(1).map(([a,b])=>mul(Hnorm[a],Hinv[b])))));
const target=degree.map((k,j)=>mul(q(1,alphaFactor[j]),max(...inputs.target.bounds[k].component.map(id=>P.leaf('target-c7',id)))));
const weight=product(Hinv,target);
const sqrtWeight=[sq(weight[0])],poles=[12],weightedDen=inv(mul(q(2),sq(cy)));
for(let j=1;j<orders.length;j++){
  const middle=split[j].slice(1,-1);
  sqrtWeight.push(mul(weightedDen,add(weight[j],...middle.map(([a,b])=>mul(sqrtWeight[a],sqrtWeight[b])))));
  poles.push(Math.max(24,...middle.map(([a,b])=>poles[a]+poles[b])));
}
assert.deepEqual(poles,degree.map(k=>k===0?12:24*k));

function stepSigma(){
  let seed=new Map([[0,1n]]);
  const bounds=[];
  for(let n=0;n<=m;n++){
    bounds.push([...seed].reduce((s,[p,c])=>s+(c<0n?-c:c)*factorial((p+1)>>1),0n));
    const next=new Map();
    for(const [p,c]of seed){
      next.set(p+1,(next.get(p+1)??0n)-BigInt(p)*c);
      next.set(p+3,(next.get(p+3)??0n)+2n*c);
    }
    seed=next;
  }
  assert.deepEqual(bounds.slice(0,4),[1n,4n,36n,1968n]);
  const sigma=[1n];
  for(let n=1;n<=m;n++){
    let b=bounds[n];
    for(let k=1;k<=n;k++)b+=choose(n,k)*2n*bounds[k]*sigma[n-k];
    sigma.push(64n*b);
  }
  return sigma;
}

function partitionFactor(sigma){
  // Exact univariate normalized Taylor bounds for b/sqrt(sum of 3 b-shifts squared).
  const b=sigma.map((x,j)=>q((2n**BigInt(j))*x,factorial(j)));
  const pairs=(n,first,last)=>Array.from({length:last-first+1},(_,j)=>[first+j,n-first-j]);
  const conv=(x,y,n,first=0,last=n)=>add(...pairs(n,first,last).map(([a,b])=>mul(x[a],y[b])));
  const den=b.map((_,j)=>mul(q(3),conv(b,b,j))),root=[sq(den[0])],recip=[q(2)];
  for(let j=1;j<=m;j++)root.push(add(den[j],...(j>1?pairs(j,1,j-1).map(([a,b])=>mul(root[a],root[b])):[])));
  for(let j=1;j<=m;j++)recip.push(mul(q(2),conv(root,recip,j,1,j)));
  return b.map((_,j)=>j===0?q(1):conv(b,recip,j));
}

const sigma=stepSigma(),fixedPart=partitionFactor(sigma);
function compose1(f,delta){
  assert.equal(delta[0],P.zero);
  let term=C(P.one),result=C(f[0]);
  for(let i=1;i<f.length;i++){
    term=product(term,delta);
    result=plus(result,scale(f[i],term));
  }
  return result;
}
const meshSlope=pow(S,3),chartInv=mul(q(128),R);
const rDelta=C(P.zero),zDelta=C(P.zero);
rDelta[index.get('1:0')]=meshSlope;
zDelta[index.get('0:1')]=meshSlope;
const bandDelta=degree.map(j=>j?mul(q(8),pow(chartInv,j)):P.zero);
const slow=times(compose1(fixedPart,rDelta),compose1(fixedPart,zDelta),compose1(fixedPart,bandDelta));
const amplitude=t.map(x=>times(x,slow,sqrtWeight));
const Utheta=product(invN2,plus(product(n[2].j,amplitude[0]),product(n[0].j,amplitude[2])));
// Replacing each weighted coefficient by the common pole 24*m is
// conservative. A single analytic absorption then gives the unweighted jets.
const maxPole=Math.max(...poles),halfPole=maxPole/2;
const gaussianAbsorption=add(q(1),mul(q(factorial(halfPole)),add(pow(mul(q(2),inv(pow(t1,2))),halfPole),pow(q(1,2),halfPole))));
const Uabs=mul(gaussianAbsorption,max(...[amplitude[0],amplitude[2],Utheta].flatMap(j=>j.map((x,i)=>mul(q(alphaFactor[i]),x)))));
const chi=sigma.slice(0,4).map((x,j)=>x*2n**BigInt(35*j));
const cutoff={
  localChiChiPrimeSup:chi[1],
  localChiSquareSecondSup:2n*(chi[1]**2n+chi[2]),
  localChiChiPrimeSecondSup:3n*chi[1]*chi[2]+chi[3]
};
const transverseText=await readFile(resolve(next,pins.transverse[0]),'utf8');
for(const [key,value] of Object.entries(cutoff)){
  const match=transverseText.match(new RegExp('"'+key+'"\\s*:\\s*(\\d+)'));
  assert.ok(match,key+' prior exact integer literal');
  assert.equal(BigInt(match[1]),value,key+' prior JSON readback');
}
// The original transverse eigenvalue is 4-sqrt(2), which is below 4.
const lambdaBound=q(4);
const aFast=mul(q(4),pow(R,3),ex(mul(q(1,100000),h,add(ell,q(17)),log2)));
const local=(bc,bd)=>mul(q(32),pow(Uabs,2),add(mul(add(q(2),R),q(bc)),mul(aFast,q(bd))));
const local0=local(1,cutoff.localChiChiPrimeSup),local2=local(cutoff.localChiSquareSecondSup,cutoff.localChiChiPrimeSecondSup);
const rowsFactor=q(41472);
const global0=mul(rowsFactor,local0),global2=mul(rowsFactor,pow(lambdaBound,8),local2);
const transverseInverse=add(mul(q(85,6),global0),mul(q(85,216),global2));
const T0=P.leaf('fixed-radial',inputs.radial.unweighted[0].rows[0].T);
const T1=P.leaf('fixed-radial',inputs.radial.unweighted[1].rows[0].T);
const ci0Inverse=mul(q(8),Tg,S);
const epsilon6=inv(ex(mul(q(6),h,add(ell,q(13)),log2)));
const normalizedPressure=mul(epsilon6,ci0Inverse,pow(T0,2),T1,transverseInverse);
const physicalAxialPressure=mul(ex(mul(add(q(3,2),h),add(ell,q(17)),log2)),normalizedPressure);
assert.ok(physicalAxialPressure>normalizedPressure&&normalizedPressure>transverseInverse);
assert.equal(P.nodes[Hinv0].op,'multiply');
assert.ok(P.nodes.some(n=>n.op==='authenticated_source_norm_root'&&n.args[0]==='target-c7'&&n.args[1]===153454));
assert.ok(P.nodes.some(n=>n.op==='authenticated_source_norm_root'&&n.args[0]==='background-c8'&&n.args[1]===152307));
const fRoots=new Set(inputs.background.bounds.flatMap(r=>[r.F,r.G]));
const tRoots=new Set(inputs.target.bounds.flatMap(r=>r.component));
for(const [i,n]of P.nodes.entries()){
  if(n.op==='authenticated_source_norm_root'){
    const [ns,id]=n.args;
    assert.ok(ns==='background-c8'?fRoots.has(id):ns==='target-c7'?tRoots.has(id):
      ns==='hosted-original'?source.has(id):ns==='fixed-radial'&&id===7414);
  }else if(n.op!=='rational'){
    const args=n.op==='integer_power'?n.args.slice(0,1):n.args;
    assert.ok(args.every(x=>Number.isSafeInteger(x)&&x>=0&&x<i),'topologically earlier positive operands');
  }
}
const output={
  schema:'MathScope.N7.ActualDirectionalWrzPositivePropagation/1',
  sourceSHA256:sourceGraphSHA,nativeRegistrySHA256:nativeRegistrySHA,wholeKChartSHA256:chartSHA,priorReceipts:pins,
  nativePulseMatrices:nativePulse.map(({matrix,parameters,variable,length,initial})=>({matrix,parameters,variable,length,initial})),
  nativeSourceRecords:Object.fromEntries([...source].sort((a,b)=>a[0]-b[0])),
  ordinarySlowAxes:['R','Z'],factorialNormalizedOrders:orders,
  intermediate:{frameM:Mnorm,stableW:stable,pulseW:w,covarianceH:Hnorm,Hinv,weight,sqrtWeight,
    sqrtWeightPoles:poles,partitionSeedSigma:sigma.map(String),partitionFactor:fixedPart,
    exactLocalCutoffBounds:Object.fromEntries(Object.entries(cutoff).map(([k,v])=>[k,String(v)])),
    gaussianAbsorption,poleAbsorbed:maxPole,wholeKBandSUpper:S,normalLower:nLower,frozenCLower:cLower,
    determinantCoefficientLower:detLowerCoefficient,weightLowerOverZeta:cy,
    physicalEnvelopeU:Uabs,aFast,originalCi0InverseUpper:ci0Inverse},
  roots:{localWrzZ6:local0,localXi2WrzZ6:local2,globalWrzZ6:global0,globalL2WrzZ6:global2,
    transverseInverse,normalizedPressureHighTerm:normalizedPressure,physicalPressureHighTerm:physicalAxialPressure},
  nodes:P.nodes,graphSHA256:hashJSON(P.nodes),
  sourceProofPremises:{oldUniformConeAndStability:'same original source uniform Q threshold and native C2 family proof',
    completeCoverAndSmoothZeroExtension:'same previous 162-row source and shell-flat proof',
    sourceNormLeaves:'actual source-only exact FTC expressions, referenced by separate immutable graph namespaces'},
  scope:{actualDirectionalFinitePositivePropagationExecuted:true,allSourceNormsNumericallyEvaluated:false,
    onlyLastDirectionalPressureTerm:true,allStageZeroPressureJetCovered:false,
    finalJets:'0/67',N7_06:'OPEN',N8_05:'OPEN',release:'HOLD'}};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS exact positive source-norm propagation through moving frame, stable Volterra, H and weights into last Wrz term.');
console.log(JSON.stringify({count:P.nodes.length,graph:output.graphSHA256,roots:output.roots,fileSHA256:sha(await readFile(out))}));
