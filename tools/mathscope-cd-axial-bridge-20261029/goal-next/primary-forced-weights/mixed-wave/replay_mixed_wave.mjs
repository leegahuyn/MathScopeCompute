import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const cli=process.argv.slice(2);
assert.equal(cli.length,4,'Use GOAL_NEXT ARCHIVED_GRAPH ORIGINAL_RESEARCH_IDE OUT_JSON');
const [goal,archive,runtime,out]=cli;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function pinned(path,expected,parse=true){
  const bytes=await readFile(path);
  assert.equal(sha(bytes),expected,path);
  return parse?JSON.parse(bytes):bytes.toString('utf8');
}
const sourceSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
const pins={
  lower:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  angular:['whole-k-angular-pressure/initialized-angular-pressure.json','b4f45002e74e8fc397d9a43079ba2e5fa958bfe68a355f37d4a006f6f8b08e0d'],
  background:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  slow:['primary-forced-weights/full-slow-norms/full-slow-norms.json','517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4']
};
const sources={
  frame:['mathscope-m2/navier/actual-covariance-matrix.mjs','7419cc0aa5e08fb57c11264013f661f85a82fb481fb69e4610029d806c1efd26'],
  curl:['mathscope-m2/navier/actual-full-curl.mjs','4276a850dbff4b5c357c47e1827eb7785b19c7e7c395c94ee4f22ef0c96d58d2'],
  current:['mathscope-m3/navier/source-global-current.mjs','93f86661d67e6bc7b916218cd7af3db72f348ba7fdc876e3618ba3a49edff760'],
  band:['mathscope-m3/navier/source-global-band.mjs','babe4aceb97d0bdee4084e5f06009e6724128935fffde1647c11e3aab022df60']
};
const load=async (root,table,parse)=>Object.fromEntries(await Promise.all(Object.entries(table).map(async ([name,[path,digest]])=>[name,await pinned(resolve(root,path),digest,parse)])));
const [prior,code,registry]=await Promise.all([
  load(goal,pins,true),load(runtime,sources,false),pinned(resolve(archive,'original-source-functions.json'),registrySHA)
]);
assert.equal(prior.lower.sourceSHA256,sourceSHA);
assert.equal(prior.lower.nativeRegistrySHA256,registrySHA);
const requires={
  frame:[
    'n=[G.sub(x0,G.mul(v,HR)),G.div(p,R),G.sub(pz,G.mul(epsilon,v,HZ))]',
    'pressureNumerator=nTK.map((x,j)=>G.sub(x,nPrime[j]))',
    'pressureImaginaryRow:pressureNumerator.map(x=>G.div(x,G.mul(k,n2)))',
    'projected=mul(Bleft,sub(mul(Aphi,B),BPrime))',
    'G.sub(x,G.add(lambda,G.sub(d,dref)))',
    'G.mul(q(sign),u,G.add(q(1,2),G.div(v,Ls)))'
  ],
  band:[
    'atRep=body=>G.simultaneousSubstitute(body,slow,[Rrep,Zrep,Trep])',
    'lambda0=G.sqrt(growthRadicand),c0=G.div(lambda0,G.mul(q(2),F0,N[0]))',
    'G.substitute(G.sub(frame.reference.lambda,frame.reference.dref),v,t0)',
    'z=w.map(x=>G.mul(P,x)),t=mul(frame.B,z.map(x=>[x]))',
    'squareRootWeights:weights.map(x=>G.sqrt(x))'
  ],
  current:[
    'G.mul(G.sqrt(band.geometry.epsilon),a,band.cutoffs.chi,band.cutoffs.psi,x)',
    'rawPotential=cross(G,f.frame.n,weighted).map(x=>G.div(x,G.mul(band.geometry.k,f.frame.nSquared)))',
    'frameChecks.every(x=>x.pass)&&tripleChecks.every(x=>x.pass)&&sharedBodies.every(x=>x.body===x.expected)'
  ],
  curl:[
    'G.add(G.derivative(x,R),G.mul(radialFast,G.derivative(x,xi)))',
    'Dz=x=>G.mul(epsilon,G.derivative(x,Z))',
    'G.neg(axialDerivatives[1]),G.sub(axialDerivatives[0],radialDerivatives[2]),G.add(radialDerivatives[1],G.mul(ir,C[1]))'
  ]
};
for(const [name,lines] of Object.entries(requires))
  for(const line of lines)assert.ok(code[name].includes(line),line);

const decode=x=>typeof x==='string'?JSON.parse(x):x;
const base=decode(decode(registry.base).base),pulses=decode(base.m3GlobalPulses);
const expression=decode(base.expression),formal=[622802,622803,622804,622807,622808,622809,622791];
const rows=[
  {sign:1,normal:[623134,623136,623140],carrier:[623113,623111,623101],phaseSlow:[623121,623126],
    B:[[1,1],[623229,623231],[623233,623235]],M:[[623351,623328],[623332,623352]],
    P:623389,int:623388,logIntegrand:623371,t0:623358,logCore:623364,logSlope:623360,
    w:[623390,623391],z:[623392,623393],t:[623394,623397,623400],weight:623824,weightSquare:623799,
    amp:[625307,625308,625309],ampCore:[625304,625305,625306],weightPsiChi:625303,
    pot:[625322,625323,625324],systems:[694,695,696],denom:623354,n2:623148},
  {sign:-1,normal:[623480,623481,623484],carrier:[623465,623463,623454],phaseSlow:[623471,623474],
    B:[[1,1],[623564,623566],[623568,623570]],M:[[623685,623663],[623667,623686]],
    P:623722,int:623721,logIntegrand:623705,t0:623692,logCore:623698,logSlope:623694,
    w:[623723,623724],z:[623725,623726],t:[623727,623730,623733],weight:623825,weightSquare:623803,
    amp:[628758,628759,628760],ampCore:[628755,628756,628757],weightPsiChi:628754,
    pot:[628773,628774,628775],systems:[703,704,705],denom:623688,n2:623492}
];
const keep=new Set([9,19,20,216823,300170,300171,617289,617432,622791,622798,622799,622800,622801,622802,622803,622804,622805,622806,622807,622808,622809]);
for(const [a,b] of [[623000,623825],[625295,625324],[628750,628775]])
  for(let i=a;i<=b;i++)keep.add(i);
const original=new Map(),hash=createHash('sha256');
const stream=createReadStream(resolve(archive,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',chunk=>hash.update(chunk));
let count=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(keep.has(count))original.set(count,JSON.parse(line));
  count++;
}
assert.equal(count,4456994);
assert.equal(hash.digest('hex'),sourceSHA);
const exact=(id,op,args)=>assert.deepEqual(original.get(id),{op,args},'original #'+id);
const args=(id,op)=>{
  const node=original.get(id);
  assert.equal(node?.op,op,'original #'+id);
  return node.args;
};
const commutative=(id,op,expected)=>assert.deepEqual([...args(id,op)].sort((a,b)=>a-b),[...expected].sort((a,b)=>a-b),'original #'+id);
function polynomial(id,atoms){
  if(atoms.has(id))return [[1,[id]]];
  if(id===20)return [[-1,[]]];
  const {op,args}=original.get(id);
  if(op==='add')return args.flatMap(x=>polynomial(x,atoms));
  if(op==='integer_power'){
    assert.equal(args[1],2);
    return productPolynomial(polynomial(args[0],atoms),polynomial(args[0],atoms));
  }
  assert.equal(op,'multiply');
  return args.map(x=>polynomial(x,atoms)).reduce(productPolynomial,[[1,[]]]);
}
function productPolynomial(a,b){
  return a.flatMap(([v,x])=>b.map(([w,y])=>[v*w,[...x,...y]]));
}
const terms=xs=>xs.map(([c,as])=>c+':'+[...as].sort((a,b)=>a-b).join(',')).sort();
exact(622799,'sqrt_positive',[622798]);
exact(622800,'inverse',[622799]);
exact(622801,'ceiling',[622800]);
exact(623135,'inverse',[622802]);
exact(623137,'multiply',[622798,622805]);
exact(623372,'multiply',[19,623027]);
exact(623055,'multiply',[623051,623054]);
for(const [index,row] of rows.entries()){
  const archived=prior.angular.source.sourceBinding[index];
  assert.deepEqual([archived.preNormal,archived.preAmp,archived.pulseAmplitude],[row.normal,row.amp,row.t]);
  assert.deepEqual(pulses[index].matrix,row.M);
  assert.deepEqual(pulses[index].directions,formal.slice(0,3));
  assert.deepEqual(pulses[index].parameters,formal);
  assert.deepEqual(pulses[index].initial,[1,0]);
  assert.equal(pulses[index].variable,622805);
  assert.equal(pulses[index].length,623027);
  const native=decode(pulses[index].originalDefinition);
  assert.deepEqual(native.matrix,row.M);
  assert.deepEqual(native.parameters,formal);
  exact(row.P,'exp',[row.int]);
  exact(row.int,'definite_integral',[row.logIntegrand,row.t0,623372,622805]);
  exact(row.logSlope,'multiply',[623048,row.t0]);
  const [positive,negative]=args(row.logIntegrand,'add');
  const [lambda0,invRoot]=args(positive,'multiply'),[root]=args(invRoot,'inverse');
  exact(root,'sqrt_positive',[row.logCore]);
  const [minus,refDamp]=args(negative,'multiply');
  assert.equal(minus,20);
  const [fixedDen,refNum]=args(refDamp,'multiply');
  assert.equal(fixedDen,623340);
  exact(refNum,'multiply',[lambda0,row.logCore]);
  const [one,square]=args(row.logCore,'add'),[shift,degree]=args(square,'integer_power');
  assert.deepEqual([one,degree],[1,2]);
  const [,slopePlusHalf]=args(shift,'multiply');
  exact(slopePlusHalf,'add',[19,row.logSlope]);
  const [r,t,z]=row.normal,[x0,p,pz]=row.carrier,[HR,HZ]=row.phaseSlow;
  const checkNormal=(root,intercept,rate,multiplier)=>{
    const [a,b]=args(root,'add');
    assert.equal(a,intercept);
    const [sgn,term]=args(b,'multiply');
    assert.equal(sgn,20);
    commutative(term,'multiply',[rate,multiplier]);
  };
  checkNormal(r,x0,HR,622805);
  commutative(t,'multiply',[p,623135]);
  checkNormal(z,pz,HZ,623137);
  assert.deepEqual(terms(polynomial(row.n2,new Set(row.normal))),terms(row.normal.map(x=>[1,[x,x]])));
  commutative(args(row.denom,'inverse')[0],'multiply',[622801,row.n2]);
  for(const [j,id] of row.w.entries()){
    exact(id,'actual_covariance_volterra',[index,j,622805,formal]);
    exact(row.z[j],'multiply',[row.P,id]);
  }
  exact(row.t[0],'add',row.z);
  for(const j of [1,2]){
    const products=args(row.t[j],'add');
    products.forEach((id,k)=>commutative(id,'multiply',[row.B[j][k],row.z[k]]));
  }
  exact(row.weight,'sqrt_positive',[row.weightSquare]);
  const factors=args(row.weightPsiChi,'multiply');
  assert.ok(factors.includes(623055));
  const chiProd=factors.find(id=>id!==623055);
  const chiFactors=args(chiProd,'multiply');
  assert.ok(chiFactors.includes(623043));
  commutative(chiFactors.find(id=>id!==623043),'multiply',[622799,row.weight]);
  const crossPairs=[[1,2],[2,0],[0,1]];
  const atoms=new Set([row.denom,...row.normal,...row.amp]);
  for(const [j,id] of row.pot.entries()){
    assert.equal(expression[row.systems[j]].body,id);
    const parameters=expression[row.systems[j]].parameters;
    assert.deepEqual(parameters,[622802,622803,622804,623035,622805,622807,622808,622809,622791,623855,623856,623857]);
    commutative(row.ampCore[j],'multiply',[row.t[j],row.weightPsiChi]);
    commutative(row.amp[j],'multiply',[625300,row.ampCore[j]]);
    const [a,b]=crossPairs[j];
    assert.deepEqual(terms(polynomial(id,atoms)),terms([
      [1,[row.denom,row.normal[a],row.amp[b]]],[-1,[row.denom,row.normal[b],row.amp[a]]]
    ]));
  }
}

const nodes=[],cache=new Map();
function node(op,args){
  const key=JSON.stringify([op,args]);
  if(!cache.has(key)){cache.set(key,nodes.length);nodes.push({op,args});}
  return cache.get(key);
}
const q=(n,d=1)=>node('rational',[String(n),String(d)]),zero=q(0),one=q(1);
function add(...xs){
  const ys=xs.filter(x=>x!==zero).sort((a,b)=>a-b);
  return ys.length===0?zero:ys.length===1?ys[0]:node('add',ys);
}
function mul(...xs){
  if(xs.includes(zero))return zero;
  const ys=xs.filter(x=>x!==one).sort((a,b)=>a-b);
  return ys.length===0?one:ys.length===1?ys[0]:node('multiply',ys);
}
const inv=x=>x===one?one:node('inverse',[x]),sqrt=x=>x===one?one:node('sqrt_positive',[x]);
const pow=(x,n)=>n===0?one:n===1||x===one?x:node('integer_power',[x,n]);
const max=(...xs)=>node('maximum',[...new Set(xs)].sort((a,b)=>a-b));
const leaf=(ns,id)=>node('authenticated_source_norm_root',[ns,id]);
const source=id=>leaf('archived-original',id),lower=id=>leaf('archived-lower-positive',id);
const factorial=[1,1,2,6,24,120,720],N=5;
const order=Array.from({length:N+1},(_,k)=>Array.from({length:k+1},(_,v)=>[k-v,v])).flat();
const index=new Map(order.map((o,k)=>[o.join(','),k]));
const get=(a,s,v)=>a[index.get([s,v].join(','))];
const jet=f=>order.map(([s,v])=>f(s,v));
const unit=x=>jet((s,v)=>s===0&&v===0?x:zero);
const sum=(...jets)=>jet((s,v)=>add(...jets.map(a=>get(a,s,v))));
const splits=order.map(([s,v])=>Array.from({length:s+1},(_,a)=>
  Array.from({length:v+1},(_,b)=>[[a,b],[s-a,v-b]])).flat());
const at=(a,[s,v])=>get(a,s,v);
const prod=(a,b)=>splits.map(terms=>add(...terms.map(([i,j])=>mul(at(a,i),at(b,j)))));
const times=(...as)=>as.reduce(prod,unit(one));
const scale=(c,a)=>a.map(x=>mul(c,x));
function recip(a,floor){
  const b=[inv(floor)];
  for(let k=1;k<order.length;k++)
    b.push(mul(b[0],add(...splits[k].slice(1).map(([i,j])=>mul(at(a,i),at(b,j))))));
  return b;
}
function root(a,floor){
  const b=[sqrt(a[0])],den=inv(mul(q(2),floor));
  for(let k=1;k<order.length;k++)
    b.push(mul(den,add(a[k],...splits[k].slice(1,-1).map(([i,j])=>mul(at(b,i),at(b,j))))));
  return b;
}
const diffV=a=>jet((s,v)=>s+v<N?mul(q(v+1),get(a,s,v+1)):zero);
const mat=(A,B)=>A.map(row=>B[0].map((_,j)=>sum(...row.map((a,i)=>prod(a,B[i][j])))));
const M0=prior.lower.intermediate,Rstar=source(216823),r0=source(300171),
  Rbound=mul(q(2),Rstar),S=lower(M0.wholeKBandSUpper),Tg=add(q(4),sqrt(q(2))),
  u=mul(q(2),inv(source(617289))),length=mul(q(2),r0,Tg,S),invLength=inv(mul(q(2),r0)),
  ntLower=lower(M0.normalLower),cLower=lower(M0.frozenCLower),
  lambda0=pow(Rstar,83),
  carrier=add(one,mul(add(Rstar,one),pow(Rstar,42),add(one,mul(u,pow(Rstar,31),inv(mul(q(4),r0))),mul(q(1,2),u))));
const coefficientBound=(field,extra)=>jet((s,v)=>v===0?
  mul(q(2**(s+extra),factorial[s]),leaf('archived-background-c8',prior.background.bounds[s+extra][field])):zero);
const [F,FR,GR]=[coefficientBound('F',0),coefficientBound('F',1),coefficientBound('G',1)];
const Hslow=scale(carrier,sum(FR,GR));
const radius=jet((s,v)=>v===0?(s===0?Rbound:s===1?one:zero):zero),ir=recip(radius,inv(Rbound));
const pulseTime=jet((s,v)=>s===0?(v===0?length:v===1?one:zero):zero);
const n=[sum(unit(carrier),prod(pulseTime,Hslow)),scale(carrier,ir),sum(unit(carrier),prod(pulseTime,Hslow))];
const n2=sum(...n.map(x=>prod(x,x))),invN2=recip(n2,pow(ntLower,2));
const nt=root(sum(prod(n[1],n[1]),prod(n[2],n[2])),ntLower);
const Ka=[prod(n[1],recip(nt,ntLower)),prod(n[2],recip(nt,ntLower))],Na=[Ka[1],Ka[0]];
const sa=prod(n[0],recip(nt,ntLower)),z=unit(zero),o=unit(one);
const K=[[z,scale(q(2),F),z],[sum(scale(q(2),F),prod(radius,FR)),z,z],[GR,z,z]];
const nPrime=[Hslow,z,Hslow];
const pressureNumerator=K[0].map((_,j)=>sum(nPrime[j],...n.map((x,i)=>prod(x,K[i][j]))));
const Aphi=K.map((row,i)=>row.map((x,j)=>sum(x,times(n[i],pressureNumerator[j],invN2))));
const sRef=jet((s,v)=>s===0?(v===0?mul(q(2),u):v===1?mul(u,invLength):zero):zero);
const s2=sum(o,prod(sRef,sRef)),sRoot=root(s2,one);
const c=scale(pow(Rstar,10),sRoot);
const U=[[o,z],[prod(sa,Ka[0]),Na[0]],[prod(sa,Ka[1]),Na[1]]],J=[[o,o],[c,c]],B=mat(U,J);
const Uleft=[[o,z,z],[z,Na[0],Na[1]]],halfC=scale(q(1,2),recip(c,cLower));
const Jinv=[[unit(q(1,2)),halfC],[unit(q(1,2)),halfC]];
const AphiB=mat(Aphi,B),left=mat(Jinv,Uleft);
const projected=mat(left,AphiB.map((row,i)=>row.map((x,j)=>sum(x,diffV(B[i][j])))));
const lambda=scale(lambda0,recip(sRoot,one)),dref=scale(lambda0,s2),d=scale(q(4),n2);
const envelopeSlope=sum(lambda,dref);
const M=projected.map((row,i)=>row.map((x,j)=>(i===j?sum(x,envelopeSlope,d):x).slice(0,15)));
const Mnorm=order.slice(0,15).map((_,k)=>max(...M.map(row=>add(...row.map(a=>a[k])))));
const w=jet((s,v)=>v===0?lower(M0.pulseW[s]):zero);
for(let v=1;v<=N;v++)for(let s=0;s+v<=N;s++){
  const terms=[];
  for(let a=0;a<=s;a++)for(let b=0;b<v;b++)terms.push(mul(get(Mnorm,a,b),get(w,s-a,v-1-b)));
  w[index.get([s,v].join(','))]=mul(q(1,v),add(...terms));
}
const env=[one];
for(let v=1;v<=N;v++)
  env.push(mul(q(1,v),add(...Array.from({length:v},(_,b)=>mul(get(envelopeSlope,0,b),env[v-1-b])))));
const normalizedP=jet((s,v)=>s===0?env[v]:zero);
const normalizedT=B.map(row=>sum(...row.map(x=>times(x,normalizedP,w))));
const sigma=M0.partitionSeedSigma.map(BigInt);
const oneCutoff=jet((s,v)=>s===0?mul(q(sigma[v],factorial[v]),pow(mul(q(20),invLength),v)):zero);
const psi=prod(oneCutoff,oneCutoff);
const weight=jet((s,v)=>v===0?lower(M0.sqrtWeight[s]):zero);
const poles=M0.sqrtWeightPoles.slice(0,N+1);
assert.deepEqual(poles,[12,24,48,72,96,120]);
const part=M0.partitionFactor.slice(0,N+1).map(lower);
const mesh=jet((s,v)=>v===0?mul(part[s],pow(S,3*s)):zero);
const bandDelta=jet((s,v)=>v===0&&s>0?mul(q(8),pow(mul(q(128),Rstar),s)):zero);
let band=o,power=o;
for(let s=1;s<=N;s++){
  power=prod(power,bandDelta);
  band=sum(band,scale(part[s],power));
}
const partition=times(mesh,mesh,mesh,band);
const amplitude=normalizedT.map(x=>times(x,psi,weight,partition));
const pairs=[[1,2],[2,0],[0,1]];
const potential=pairs.map(([i,j])=>prod(invN2,sum(prod(n[i],amplitude[j]),prod(n[j],amplitude[i]))));
const pressure=prod(invN2,sum(...pressureNumerator.map((x,j)=>prod(x,amplitude[j]))));
const chi=Array.from({length:N+1},(_,j)=>q(sigma[j]*2n**BigInt(35*j)));
const choose=(n,k)=>factorial[n]/(factorial[k]*factorial[n-k]);
const radialPhase=Array.from({length:N},(_,j)=>mul(lower(M0.aFast),q(4**j*factorial[j]),pow(Rbound,j)));
const offset=(a,j)=>a.map((x,i)=>x+Number(i===j));
const slowOrder=a=>a[0]+a[1]+a[2];
const raw=(jet,a)=>{
  const s=slowOrder(a),i=a[3],v=a[4];
  return mul(q(factorial[s]*factorial[v]),chi[i],get(jet,s,v));
};
function radial(jet,a){
  const product=[];
  for(let b=0;b<=a[0];b++){
    const rest=offset(a,3);
    rest[0]-=b;
    product.push(mul(q(choose(a[0],b)),radialPhase[b],raw(jet,rest)));
  }
  return [raw(jet,offset(a,0)),add(...product)];
}
function connection(jet,a){
  const terms=[];
  for(let b=0;b<=a[0];b++){
    const rest=[...a];
    rest[0]-=b;
    terms.push(mul(q(choose(a[0],b)*factorial[b]),pow(Rbound,b+1),raw(jet,rest)));
  }
  return add(...terms);
}
function indices(total,axes){
  if(axes===0)return total===0?[[]]:[];
  return Array.from({length:total+1},(_,n)=>indices(total-n,axes-1).map(a=>[n,...a])).flat();
}
const multi=Array.from({length:5},(_,n)=>indices(n,5)).flat();
assert.equal(multi.length,126);
const results=multi.map(a=>{
  const [D_R_theta,fastTheta]=radial(potential[1],a),[D_R_z,fastZ]=radial(potential[2],a);
  const D_Z_r=raw(potential[0],offset(a,1)),D_Z_theta=raw(potential[1],offset(a,1));
  const radiusTerm=connection(potential[1],a);
  return {orders:a,real:amplitude.map(jet=>raw(jet,a)),imaginary:[D_Z_theta,add(D_Z_r,D_R_z,fastZ),add(D_R_theta,fastTheta,radiusTerm)],
    imaginaryComponents:{D_Z_theta,D_Z_r,D_R_z,fastZ,D_R_theta,fastTheta,radiusTerm},
    pressure:raw(pressure,a),poles:{real:poles[slowOrder(a)],imaginary:poles[slowOrder(a)+1],pressure:poles[slowOrder(a)]}};
});
const receipt={schema:'MathScope.ArchivedPrimaryWeightedMixedWave/1',
  status:'CONDITIONAL_EXACT_POSITIVE_SOURCE_PROGRAM',
  source:{graphSHA256:sourceSHA,nodeCount:count,registrySHA256:registrySHA,rows,modules:sources,prior:pins},
  ordinaryAxes:['R','Z','T','xi','v'],factorialNormalization:'slowOrder! v!',normalizedOrder:order,
  envelope:'sqrt(zeta) P(v) times delta_*^(-pole), no Gaussian absorption and no division by either cutoff',
  epsilonDenominator:100000,epsilonExponents:{real:50000,imaginary:99999,pressure:100000},
  exactImaginaryTermPowers:{D_Z_theta:200000,D_Z_r:200000,D_R_z:100000,fastZ:99999,D_R_theta:100000,fastTheta:99999,radiusTerm:100000},
  roots:{n,nPrime,B,M,Mnorm,w,envelopeSlope,normalizedP,normalizedT,psi,weight,partition,amplitude,potential,pressure,
    chi,radialPhase,radiusUpper:Rbound,results},
  assumptions:['Archived fixed band and representative, original whole-K annulus and admissible fixed chart along the pulse.',
    'Prior stable, full RZT, determinant, normal, frame and Gaussian-weighted source bounds on the same archive.',
    'Original positive-weight interior, with actual smooth zero extension and overlap at the source seams.',
    'Source inequalities for the frozen carrier, growth coefficient, radius and original radial phase derivative.'],
  scope:{C3Indices:56,C4Indices:126,sourcePotentialOrder:5,ordinarySlowBackgroundOrder:6,
    directedNumericalEndpoints:false,liveFamily:false,fullForced:false,finalJets:false},
  nodes,graphSHA256:sha(JSON.stringify(nodes))};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,nodes:nodes.length,C3:56,C4:126,graphSHA256:receipt.graphSHA256,fileSHA256:sha(await readFile(out))}));
