import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,hosted,out]=process.argv.slice(2);
assert.ok(next&&hosted&&out,'Supply GOAL_NEXT, HOSTED_GRAPH, OUTPUT.');
const sha=x=>createHash('sha256').update(x).digest('hex');
const pins={
  mean:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  meanCheck:['whole-k-annular-pressure-lower/lower-pressure-readback.json','978147e13651ac33afe12b98872ae3f5300b52eca977d56b9d06e083f97134d7'],
  slow:['whole-k-annular-slow/annular-slow-jet-bounds.json','3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69'],
  bg:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e']
};
async function pinned(path,checksum){
  const raw=await readFile(path);
  assert.equal(sha(raw),checksum,path);
  return JSON.parse(raw);
}
const prior=Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([k,[f,h]])=>[k,await pinned(resolve(next,f),h)])));
assert.equal(prior.meanCheck.receiptSHA256,pins.mean[1]);
const sourceSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
const top=await pinned(resolve(hosted,'original-source-functions.json'),registrySHA);
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const registry=decode(top.base),fields=decode(registry.fieldDefinitions),functions=decode(registry.expressionDefinitions);
const pressure=fields[9],reference=fields[2];
assert.equal(pressure.name,'OriginalAll81InitialAngular_pressure');
assert.equal(pressure.rows.length,162);
for(const [j,row] of pressure.rows.entries()){
  const ref=reference.rows[j],def=functions[-1-row.localSystem];
  assert.deepEqual(row.label,ref.label);
  assert.equal(row.coefficient,ref.coefficient);
  assert.deepEqual(row.guards,ref.guards);
  assert.deepEqual(row.values,[...ref.values,622806]);
  assert.deepEqual(row.derivativeMaps,[...ref.derivativeMaps,[{coefficient:1,parameter:9}]]);
  assert.equal(def.body,row.localBody);
  assert.deepEqual(def.parameters,row.localParameters);
  assert.equal(def.name,'OriginalInitialAngular_'+row.label.sign+'_pressure');
}
const source=new Map(),digest=createHash('sha256');
const s=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
s.on('data',b=>digest.update(b));
const extra=new Set([3616133,3674937,3675276,3859821]);
let k=-1;
for await(const line of createInterface({input:s,crlfDelay:Infinity})){
  if(k>=0&&k<1000||k>=622750&&k<=690000||k>=3622900&&k<=3625900||k>=3649400&&k<=3652200||extra.has(k))source.set(k,JSON.parse(line));
  k++;
}
assert.equal(k,4456994);
assert.equal(digest.digest('hex'),sourceSHA);
const rec=id=>{
  const n=source.get(id);
  assert.ok(n,'missing original operand #'+id);
  return n;
};
function args(id,op){
  const n=rec(id);
  assert.equal(n.op,op,'original operand #'+id);
  return n.args;
}
const check=(id,op,a)=>assert.deepEqual(args(id,op),a,'original operand #'+id);
check(3674937,'m3_aux_indexed_partial',[9,[622802,622803,622804,622791,635044,635045,622806],[0,0,0,0,0,0]]);
check(3859821,'add',[3674937,3675276]);
check(3675276,'add',[622935,3615361]);

// Prove the actual simultaneous replacement of the three representative
// formals. Each native call compares its system, arguments and derivative orders.
const rep=[622807,622808,622809];
const nativeOps=new Set(['actual_expression_partial','m3_global_indexed_partial','m3_aux_expression_partial']);
const unaryIndex=new Set(['integer_power','source_step_derivative']);
const pureChildren=new Set(['add','multiply','inverse','sqrt_positive','exp','log_positive','ceiling','maximum','smooth_piecewise','sine','cosine']);
function nativeChildren(op,a){
  if(nativeOps.has(op))return {static:[a[0],a[2]],children:a[1]};
  if(unaryIndex.has(op))return {static:[a[1]],children:[a[0]]};
  if(op==='actual_covariance_volterra'||op==='m3_global_pulse_jet')return {static:[a[0],a[1],...a.slice(4)],children:[a[2],...a[3]]};
  if(op==='definite_integral')return {static:[a[1]],children:[a[0],a[2],a[3]]};
  if(op==='actual_monotone_root'||op==='actual_quadratic_root')return {static:[a[0]],children:Array.isArray(a[1])?a[1]:a.slice(1)};
  if(pureChildren.has(op))return {static:[],children:a};
  return null;
}
function replacePair(pre,post,bindings,memo){
  if(pre===post)return {bindings,memo};
  if(rep.includes(pre)){
    if(bindings.has(pre))return bindings.get(pre)===post?{bindings,memo}:null;
    return {bindings:new Map([...bindings,[pre,post]]),memo};
  }
  if(memo.has(pre))return memo.get(pre)===post?{bindings,memo}:null;
  const a=source.get(pre),b=source.get(post);
  if(!a||!b||a.op!==b.op)return null;
  const x=nativeChildren(a.op,a.args),y=nativeChildren(b.op,b.args);
  if(!x||!y||JSON.stringify(x.static)!==JSON.stringify(y.static)||x.children.length!==y.children.length)return null;
  const candidates=[y.children];
  if((a.op==='add'||a.op==='multiply')&&y.children.length===2)candidates.push([...y.children].reverse());
  for(const order of candidates){
    let result={bindings,memo};
    for(let j=0;result&&j<x.children.length;j++)result=replacePair(x.children[j],order[j],result.bindings,result.memo);
    if(result)return {bindings:result.bindings,memo:new Map([...result.memo,[pre,post]])};
  }
  return null;
}
const match=(x,y,state,label)=>{
  const result=replacePair(x,y,state.bindings,state.memo);
  assert.ok(result,label+' #'+x+' -> #'+y);
  return result;
};
const rows=[
  {sign:1,guarded:3625754,raw:3625747,coefficient:3625740,half:3625741,phase:3622968,sines:[3622973,3622981],
    normal:[626582,625984,625997],preNormal:[623134,623136,623140],amp:[3625732,3625737,3625723],preAmp:[625307,625308,625309],pulseAmplitude:[623394,623397,623400],
    carrier:[625983,625991,626576],hr:626579,hz:625994,denominator:3625590,normalSquare:3625588,weight:[623824,3625718]},
  {sign:-1,guarded:3652129,raw:3652122,coefficient:3652115,half:3652116,phase:3649464,sines:[3649469,3649477],
    normal:[630000,629402,629415],preNormal:[623480,623481,623484],amp:[3652107,3652112,3652098],preAmp:[628758,628759,628760],pulseAmplitude:[623727,623730,623733],
    carrier:[629401,629409,629994],hr:629997,hz:629412,denominator:3652086,normalSquare:3652084,weight:[623825,3652093]}
];
const plus=(...terms)=>{
  const p=new Map();
  for(const t of terms)for(const [key,c] of t)p.set(key,(p.get(key)??0n)+c);
  return new Map([...p].filter(([,c])=>c!==0n));
};
const mul=(...ps)=>ps.reduce((a,b)=>plus(...[...a].flatMap(([ka,ca])=>[...b].map(([kb,cb])=>
  new Map([[[...ka.split(','),...kb.split(',')].filter(Boolean).map(Number).sort((x,y)=>x-y).join(','),ca*cb]])))),new Map([['',1n]]));
const atom=id=>new Map([[String(id),1n]]);
const integer=x=>new Map([['',BigInt(x)]]);
function polynomial(id,stop){
  if(stop.has(id))return atom(id);
  const n=rec(id);
  if(n.op==='rational'){
    assert.equal(n.args[1],'1','integer coefficient in exact signed replay');
    return integer(n.args[0]);
  }
  if(n.op==='add')return plus(...n.args.map(x=>polynomial(x,stop)));
  if(n.op==='multiply')return mul(...n.args.map(x=>polynomial(x,stop)));
  assert.fail('Unexpected signed operand #'+id+' '+n.op);
}
const sortPoly=p=>[...p].map(([m,c])=>[m,String(c)]).sort(([a],[b])=>a.localeCompare(b));
function equalPoly(id,expected,stop){assert.deepEqual(sortPoly(polynomial(id,new Set(stop))),sortPoly(expected),'signed original contraction #'+id);}
const sourceBinding=[];
for(const row of rows){
  let branch=row.guarded,guards=0;
  while(rec(branch).op==='smooth_piecewise'){
    const a=args(branch,'smooth_piecewise');
    assert.equal(a[3],0);assert.equal(a[5],0);
    branch=a[4];guards++;
  }
  assert.equal(branch,row.raw);assert.equal(guards,7);
  const [sinPlus,sinMinus]=row.sines,[nr,nth,nz]=row.normal,[ar,ath,az]=row.amp;
  const [p,pz,x0]=row.carrier;
  check(row.half,'multiply',[19,row.coefficient]);
  equalPoly(row.raw,plus(mul(integer(-1),atom(sinPlus),atom(row.half)),mul(atom(sinMinus),atom(row.half))),
    [sinPlus,sinMinus,row.half]);
  equalPoly(args(sinPlus,'sine')[0],mul(atom(622801),atom(row.phase)),[622801,row.phase]);
  equalPoly(args(sinMinus,'sine')[0],mul(integer(-1),atom(622801),atom(row.phase)),[622801,row.phase]);
  equalPoly(row.phase,plus(mul(atom(622806),atom(p)),mul(atom(622802),atom(x0)),mul(atom(623415),atom(622803),atom(pz)),
    mul(integer(-1),atom(622805),plus(mul(atom(p),atom(622932)),mul(atom(pz),atom(622933))))),
    [622806,p,622802,x0,623415,622803,pz,622805,622932,622933]);
  equalPoly(row.hr,plus(mul(atom(p),atom(623117)),mul(atom(pz),atom(623119))),[p,pz,623117,623119]);
  equalPoly(row.hz,plus(mul(atom(p),atom(623122)),mul(atom(pz),atom(623124))),[p,pz,623122,623124]);
  equalPoly(nr,plus(atom(x0),mul(integer(-1),atom(622805),atom(row.hr))),[x0,622805,row.hr]);
  equalPoly(nth,mul(atom(p),atom(623135)),[p,623135]);
  equalPoly(nz,plus(atom(pz),mul(integer(-1),atom(622798),atom(622805),atom(row.hz))),[pz,622798,622805,row.hz]);
  equalPoly(row.normalSquare,plus(...row.normal.map(id=>mul(atom(id),atom(id)))),row.normal);
  equalPoly(args(row.denominator,'inverse')[0],mul(atom(622801),atom(row.normalSquare)),[622801,row.normalSquare]);
  const rr=plus(mul(atom(nth),atom(623152)),mul(atom(nz),atom(623119)),atom(row.hr));
  const rt=mul(atom(nr),atom(623150)),rz=mul(atom(622798),atom(row.hz));
  equalPoly(row.coefficient,mul(atom(row.denominator),plus(mul(rr,atom(ar)),mul(rt,atom(ath)),mul(rz,atom(az)))),
    [row.denominator,nr,nth,nz,623152,623119,623150,row.hr,row.hz,622798,ar,ath,az]);
  for(const [j,id] of row.preAmp.entries()){
    const factors=[625300,623043,623055,622799,row.weight[0],row.pulseAmplitude[j]];
    equalPoly(id,mul(...factors.map(atom)),factors);
  }
  let state={bindings:new Map(),memo:new Map()};
  for(const [a,b] of [...row.preNormal.map((id,j)=>[id,row.normal[j]]),...row.preAmp.map((id,j)=>[id,row.amp[j]]),row.weight]){
    state=match(a,b,state,'frozen native source transfer');
  }
  assert.deepEqual([...state.bindings.keys()].sort((a,b)=>a-b),rep);
  sourceBinding.push({...row,guards,formalToFrozen:Object.fromEntries(state.bindings),nontrivialSubtreesCompared:state.memo.size});
}
assert.deepEqual(sourceBinding[0].formalToFrozen,sourceBinding[1].formalToFrozen);
const frozenMap=sourceBinding[0].formalToFrozen;
assert.deepEqual(frozenMap,{622807:623950,622808:623955,622809:623935});
const liveCoordinate=new Set([622802,622803,622804,622805,622806,623035,...rep]);
const frozenSeen=new Set();
function checkFrozen(id){
  if(id<622802||frozenSeen.has(id))return;
  frozenSeen.add(id);
  assert.ok(!liveCoordinate.has(id),'live coordinate in frozen original representative #'+id);
  const n=rec(id),shape=nativeChildren(n.op,n.args);
  if(shape)shape.children.forEach(checkFrozen);
  else assert.ok(['rational','coordinate','source_parameter'].includes(n.op));
}
Object.values(frozenMap).forEach(checkFrozen);

// The positive graph uses authenticated scalar leaves from the existing
// complete original covariance propagation. Each new node keeps a small
// exact nonnegative arithmetic instruction.
const nodes=[],known=new Map();
const make=(op,args)=>{
  const key=JSON.stringify([op,args]);
  if(!known.has(key)){known.set(key,nodes.length);nodes.push({op,args});}
  return known.get(key);
};
const q=(a,b=1)=>make('rational',[String(a),String(b)]),z=q(0),one=q(1);
const add=(...a)=>{const b=a.filter(x=>x!==z);return b.length===0?z:b.length===1?b[0]:make('add',b);};
const product=(...a)=>{if(a.includes(z))return z;const b=a.filter(x=>x!==one);return b.length===0?one:b.length===1?b[0]:make('multiply',b);};
const inverse=x=>make('inverse',[x]),sqrt=x=>make('sqrt_positive',[x]),exp=x=>make('exp',[x]);
const pow=(x,n)=>n===0?one:n===1?x:make('integer_power',[x,n]);
const max=(...x)=>make('maximum',x);
const imported=(namespace,id)=>make('authenticated_source_norm_root',[namespace,id]);
const native=id=>imported('hosted-original',id);
const fromMean=id=>imported('initialized-mean-positive',id);
const {intermediate:m}=prior.mean,R=native(216823),h=native(9),B0=native(300170),log2=native(127),ell=native(617432),r0=native(300171);
const S=fromMean(m.wholeKBandSUpper),aFast=fromMean(m.aFast),Tg=add(q(4),sqrt(q(2))),u=product(q(2),inverse(native(617289)));
const L=product(q(2),r0,Tg,S);
const carrier=add(one,product(add(R,one),pow(R,42),add(one,product(u,pow(R,31),inverse(product(q(4),r0))),product(q(1,2),u))));
// Pair = magnitude, maximum ordinary slow R/Z derivative. The
// first-order product rule is applied after each original operation.
const c=a=>[a,z],sum=(...a)=>[add(...a.map(x=>x[0])),add(...a.map(x=>x[1]))];
const times=(a,b)=>[product(a[0],b[0]),add(product(a[0],b[1]),product(a[1],b[0]))];
const chain=(...p)=>p.reduce(times,c(one));
const recip=(a,lower)=>[inverse(lower),product(a[1],pow(inverse(lower),2))];
const root=(a,lower)=>[sqrt(a[0]),product(q(1,2),a[1],inverse(lower))];
const normField=(name,offset)=>[0,1].map(j=>product(q(2**(offset+j)),imported('background-c8',prior.bg.bounds[offset+j][name])));
const F=normField('F',0),FR=normField('F',1),GR=normField('G',1),HR=times(c(carrier),sum(FR,GR));
const radius=[R,one],radialInverse=recip(radius,inverse(R)),ntLower=inverse(pow(B0,2));
const normal=[sum(c(carrier),times(c(L),HR)),times(c(carrier),radialInverse),sum(c(carrier),times(c(L),HR))];
const [nr,nth,nz]=normal,n2=sum(...normal.map(x=>times(x,x))),n2Inv=recip(n2,pow(ntLower,2));
const nt=root(sum(times(nth,nth),times(nz,nz)),ntLower),ntInv=recip(nt,ntLower);
const Ka=[times(nth,ntInv),times(nz,ntInv)],Na=[Ka[1],Ka[0]],sa=times(nr,ntInv);
const cref=c(product(pow(R,10),sqrt(add(one,pow(product(q(2),u),2)))));
const moving=[
  c(q(2)),
  sum(times(sa,Ka[0]),times(sa,Ka[0]),times(cref,Na[0]),times(cref,Na[0])),
  sum(times(sa,Ka[1]),times(sa,Ka[1]),times(cref,Na[1]),times(cref,Na[1]))
];
const pulse=[fromMean(m.pulseW[0]),fromMean(m.pulseW[1])],t=moving.map(x=>times(x,pulse));
const gauss=fromMean(m.gaussianAbsorption),weight=m.sqrtWeight.slice(0,2).map(id=>product(gauss,fromMean(id)));
const slow=[one,product(q(4),fromMean(m.partitionFactor[1]),max(pow(S,3),product(q(1024),R)))];
const amplitude=t.map(x=>chain(x,weight,slow));
const KthetaR=sum(times(c(q(2)),F),times(radius,FR)),KrTheta=times(c(q(2)),F);
const numerator=[sum(times(nth,KthetaR),times(nz,GR),HR),times(nr,KrTheta),HR];
const coeff=times(n2Inv,sum(...amplitude.map((a,j)=>times(a,numerator[j]))));
const chiPrime=q(m.exactLocalCutoffBounds.localChiChiPrimeSup);
const epsilonInverse=exp(product(h,add(ell,q(17)),log2));
const localR=add(coeff[1],product(aFast,chiPrime,coeff[0]),product(nr[0],coeff[0]));
const localZ=add(coeff[1],product(epsilonInverse,nz[0],coeff[0]));
const localThetaOverR=product(nth[0],coeff[0]);
const physical=(exponent,scale)=>product(q(162),exp(product(exponent,add(ell,q(17)),log2)),scale);
const angular={value:physical(add(one,product(q(2),h)),coeff[0]),
  radial:physical(add(q(3,2),product(q(2),h)),localR),
  axial:physical(add(q(3,2),h),localZ),
  cartesianXY:physical(add(q(3,2),product(q(2),h)),add(localR,localThetaOverR))};
const pressureAtoms=['p@0,0,0,0','p@1,0,0,0','p@0,1,0,0','p@0,0,1,0'];
const a=[angular.value,angular.cartesianXY,angular.cartesianXY,angular.axial],mRoots=prior.mean.roots.initializedMeanPressure,
  b=[mRoots.physicalValue,mRoots.physicalR,mRoots.physicalR,mRoots.physicalZ];
const total=Object.fromEntries(pressureAtoms.map((name,j)=>{
  assert.ok(prior.slow.slowFieldAtomIntervals[name]);
  return [name,add(a[j],fromMean(b[j]),imported('slow-background-pressure-atom',name))];
}));
const output={schema:'MathScope.N7.ActualInitializedAngularPressureBound/1',sourceSHA256:sourceSHA,registrySHA256:registrySHA,pins,
  source:{total:3859821,background:622935,mean:3615361,angular:3674937,signedRows:162,sourceBinding,frozenRepresentativeNodesRead:frozenSeen.size},
  roots:{angular,stageZeroPressureAtoms:total},graphSHA256:sha(JSON.stringify(nodes)),nodes,
  scope:{exactSignedAstAndPositiveArithmetic:true,allFourStageZeroPressureAtomsBoundConditionally:true,
    numericalNormEvaluation:false,laterStagesIncluded:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS original signed angular pressure, representative transfer and all four symbolic initialized pressure atoms.');
console.log(JSON.stringify({count:nodes.length,roots:output.roots,graphSHA256:output.graphSHA256,fileSHA256:sha(await readFile(out))}));
