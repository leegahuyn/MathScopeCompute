import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const sha=raw=>createHash('sha256').update(raw).digest('hex');
const hashJSON=obj=>sha(JSON.stringify(obj));
const [next,hosted,chartFile,out,option]=process.argv.slice(2);
assert.ok(next&&hosted&&chartFile&&out,'Supply GOAL_NEXT, HOSTED_GRAPH, WHOLE_K_CHART and OUTPUT.');
assert.ok([undefined, '--mean-spatial-c2', '--mean-path-longitudinal', '--stage-zero-b'].includes(option));
const stageZeroB = option === '--stage-zero-b';
const meanPathLongitudinal = option === '--mean-path-longitudinal' || stageZeroB;
const meanSpatialC2 = option === '--mean-spatial-c2' || meanPathLongitudinal;
const sourceGraphSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const pins={
  target:['whole-k-annular-wrz-norm/target-c7.json','3917c6f194dbf70b397f9bb8ad56deb42dae204966dad78dea15618231f58770'],
  background:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  readback:['whole-k-annular-wrz-norm/directional-norms-readback.json','3cdc1354233ed25dc1fd39fad72e19856964db036d856e35873eb42b348ddd78'],
  transverse:['whole-k-annular-wrz/transverse-wrz-bound.json','12cc99ba7c3b47c88555e5eaca310fab7471d307e720c40340de78e104d9634d'],
  scale:['whole-k-annular-wrz/transverse-axial-scale.json','47dd62310d8d5c3396d17b4b21704e00655f5a0c5243832638c23adf2c14e414'],
  radial:['whole-k-annular-mean-sharp/fixed-operators.json','e0ca526ca37d3697a655a419af9386d1e6e291a228e05f26e30a73225b3e9633'],
  lowOrder:['primary-c2-target/result.json','408f2d46bb0532313b5c332623a2e56981ae1d05fc4b180bc35a8d8f234f9cb9'],
  localization:['first-scale-closure/first-scale-closure.json','1efc5a0d90ed98b14d79ee4c20d4ff2a3b86cf9c4cedd0cc1590868dbcbaf81a'],
  direction:['whole-k-annular-wrz-propagate/wrz-positive-propagation.json','c3d30cd20c815895b51511f9b25abc78f61921b9200180710350c013259b03f3'],
  initialized:['whole-k-annular-mean-sharp/directional-mean-operands.json','6dde0a0ad593a6963acb8dc0f3d43ee94c954322461ce6189676066b4e080ef6']
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
const components=['rr','rtheta','rz','thetatheta','thetaz','zz'];
const fields=decode(commonRegistry.fieldDefinitions).slice(0,6);
const localFunctions=decode(commonRegistry.expressionDefinitions);
assert.deepEqual(fields.map(f=>f.name),components.map(x=>'GlobalCompleteCommonTorus_'+x));
const referenceRows=fields[2].rows;
const comparable=({coefficient,derivativeMaps,guards,label,localParameters,values})=>({coefficient,derivativeMaps,guards,label,localParameters,values});
for(const f of fields){
  assert.equal(f.rows.length,162);
  for(const [j,row] of f.rows.entries()){
    assert.deepEqual(comparable(row),comparable(referenceRows[j]));
    const def=localFunctions[-1-row.localSystem];
    assert.equal(def.body,row.localBody);
    assert.deepEqual(def.parameters,row.localParameters);
  }
}
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
const wanted=new Set([6,8,9,127,3612,216823,300170,300171,617289,617292,617431,617432,622750,622751,
  ...inputs.transverse.source.pulseMatrices,...inputs.transverse.source.H.flat(),
  ...inputs.transverse.source.targetComponents,inputs.transverse.source.determinant,
  ...inputs.transverse.source.positiveSquareRootWeights,643048,3613979,1706626,1706796]);
const source=new Map(),checkHash=createHash('sha256');
const gz=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
gz.on('data',bytes=>checkHash.update(bytes));
let number=-1;
for await(const line of createInterface({input:gz,crlfDelay:Infinity})){
  if(wanted.has(number)||(number>=622750&&number<=644000)||(number>=3613950&&number<=3615361))source.set(number,JSON.parse(line));
  number++;
}
assert.equal(number,4456994);
assert.equal(checkHash.digest('hex'),sourceGraphSHA);
const check=(n,op,args)=>assert.deepEqual(source.get(n),{op,args},'exact native source #'+n);
check(9,'source_parameter',['h']);
check(6,'source_parameter',['T']);
check(8,'source_parameter',['lambda']);
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
const xi=623035,chiRoot=623043,potentialBodies=inputs.transverse.source.nativePotentialBodies;
const xiMemo=new Map();
function xiFree(id){
  if(id<=xi)return id===xi;
  if(xiMemo.has(id))return xiMemo.get(id);
  const {op,args:a}=source.get(id);
  let result;
  switch(op){
    case 'rational': case 'source_parameter': case 'coordinate': result=false; break;
    case 'definite_integral': result=(a[1]!==xi&&xiFree(a[0]))||xiFree(a[2])||xiFree(a[3]); break;
    case 'integer_power': case 'source_step_derivative': result=xiFree(a[0]); break;
    case 'actual_expression_partial': case 'm3_global_indexed_partial': result=a[1].some(xiFree); break;
    case 'actual_covariance_volterra': case 'm3_global_pulse_jet': result=[a[2],...a[3]].some(xiFree); break;
    case 'actual_quadratic_root': case 'actual_monotone_root': result=(Array.isArray(a[1])?a[1]:a.slice(1)).some(xiFree); break;
    case 'actual_background_picard': case 'actual_background_even_profile': result=a.slice(2,4).some(xiFree); break;
    case 'actual_natural_series': result=a.slice(1,3).some(xiFree); break;
    case 'add': case 'multiply': case 'inverse': case 'sqrt_positive': case 'log_positive':
    case 'exp': case 'ceiling': case 'maximum': case 'smooth_piecewise': result=a.some(xiFree); break;
    default: assert.fail('Unbound source operation '+op+' at '+id);
  }
  xiMemo.set(id,result);
  return result;
}
const unions=sets=>new Set(sets.flatMap(s=>[...s]));
function chiSupport(id,native=true){
  if(!xiFree(id))return new Set([0]);
  if(id===chiRoot)return new Set([10]);
  const {op,args}=source.get(id);
  if(op==='actual_expression_partial'&&native){
    const [system,values,orders]=args;
    assert.ok(Object.hasOwn(potentialBodies,system));
    assert.equal(values.length,12);
    assert.equal(values[3],xi);
    assert.ok(values.every((v,j)=>j===3||!xiFree(v)));
    assert.ok(orders[3]===0||orders[3]===1);
    return new Set([orders[3]===0?10:1]);
  }
  if(op==='add')return unions(args.map(x=>chiSupport(x,native)));
  if(op==='multiply')return args.reduce((values,x)=>new Set([...values].flatMap(a=>[...chiSupport(x,native)].map(b=>a+b))),new Set([0]));
  assert.fail('Unbound transverse operation '+op+' at '+id);
}
for(const id of Object.values(potentialBodies))assert.deepEqual([...chiSupport(id,false)],[10]);
const localAngular=Object.fromEntries(fields.map((f,k)=>[components[k],[...new Set(f.rows.map(x=>x.localBody))].map(id=>{
  let raw=id,guards=0;
  while(source.get(raw)?.op==='smooth_piecewise'){
    const a=source.get(raw).args;
    assert.equal(a[3],0);
    assert.equal(a[5],0);
    raw=a[4];
    guards++;
  }
  assert.equal(guards,7);
  const support=[...chiSupport(raw)].sort((a,b)=>a-b);
  assert.ok(support.every(x=>[2,11,20].includes(x)));
  return {guarded:id,raw,chiPowers:support.map(x=>[Math.floor(x/10),x%10])};
})]));
assert.ok(Object.values(localAngular).every(x=>x.length===2));
const indexed=[622802,622803,622804,622791,635044,635045];
const covarianceTerms={
  643013:[0,[0,0,0,0,0],[20,623135]],
  643019:[0,[1,0,0,0,0],[20]],
  643020:[0,[0,0,0,1,0],[20,635060]],
  643021:[0,[0,0,0,0,1],[20,623066,635060]],
  643016:[3,[0,0,0,0,0],[623135]],
  643029:[2,[0,1,0,0,0],[20,622798]]
};
for(const [id,[j,derivatives]] of Object.entries(covarianceTerms))check(Number(id),'m3_aux_indexed_partial',[j,indexed,derivatives]);
function explicitCovariance(id){
  const n=source.get(id);
  if(!n)return [];
  if(n.op==='m3_aux_indexed_partial')return [[id,[]]];
  if(n.op==='add')return n.args.flatMap(explicitCovariance);
  if(n.op!=='multiply')return [];
  const groups=n.args.map(explicitCovariance),active=groups.map((g,j)=>g.length?j:-1).filter(j=>j!==-1);
  assert.ok(active.length<=1,'the direct pressure covariance has degree one');
  if(!active.length)return [];
  const j=active[0],rest=n.args.filter((_,k)=>k!==j);
  return groups[j].map(([id,factors])=>[id,[...factors,...rest]]);
}
const byNode=rows=>rows.map(([id,f])=>[Number(id),f.sort((a,b)=>a-b)]).sort((a,b)=>a[0]-b[0]);
assert.deepEqual(byNode(explicitCovariance(3614891)),byNode(Object.entries(covarianceTerms).map(([k,v])=>[k,v[2]])));
check(3615048,'m3_aux_expression_partial',[-22,[622791,622802,622803,622804,635044,635045],[0,0,0,0,0,0]]);
assert.equal(localFunctions[21].body,3614891);
check(3615054,'definite_integral',[3615053,3615052,633710,633712]);
assert.equal(localFunctions[23].body,3615054);
check(633696,'multiply',[633686,633687]);
check(633697,'inverse',[633696]);
check(633708,'multiply',[633697,633707]);
check(633724,'definite_integral',[633723,633709,633710,633712]);
check(633725,'inverse',[633724]);
check(633726,'multiply',[633708,633725]);
check(3615195,'multiply',[633725,3615194]);
check(3615196,'multiply',[3615055,3615195]);
check(3615197,'multiply',[20,3615196]);
check(3615202,'m3_aux_expression_partial',[-22,[622791,3615151,622803,622804,3615158,3615160],[0,0,0,0,0,0]]);
check(3615203,'add',[3615197,3615202]);
check(3615204,'definite_integral',[3615203,3615151,633710,622802]);
check(3615205,'definite_integral',[3615203,3615151,633710,633712]);
check(3615359,'multiply',[633733,3615205]);
check(3615360,'multiply',[20,3615359]);
check(3615361,'add',[3615204,3615360]);
const slowParameters=[622802,622803,622804,622791];
for(const [root,system] of [[622932,688],[622933,689],[622934,690]]){
  check(root,'actual_expression_partial',[system,slowParameters,[0,0,0,0]]);
}
check(1706626,'multiply',[20,1706625]);
check(1706796,'multiply',[623135,1706785]);
for(const root of [3614334,3614376,3614420,3614714,3614715,3614716,3614724,3614727,3614730,3614747,3614749,3614771,3614778,3614789,3614791]){
  assert.deepEqual(source.get(root),inputs.initialized.sourceRecords[root]);
}
check(3614790,'add',[1706773,3614789]);
check(3614791,'add',[1706624,3614767]);
check(3614792,'add',[1706782,3614771]);
check(3614891,'add',[3614887,3614890]);

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
const m=7;
// Degree m represents the largest ordered mixed derivative divided by m!.
// Taking a common bound over directions turns the multivariate product
// rule into a one-dimensional Taylor majorant with positive coefficients.
const degree=Array.from({length:m+1},(_,j)=>j),orders=degree;
const split=degree.map(j=>Array.from({length:j+1},(_,k)=>[k,j-k]));
const alphaFactor=degree.map(factorial);
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

const trivariateRatio=k=>2n**BigInt(k);
function actualFGBound(field,extra){
  return degree.map((k,j)=>mul(q(trivariateRatio(k+extra),alphaFactor[j]),P.leaf('background-c8',inputs.background.bounds[k+extra][field])));
}
const F=actualFGBound('F',0),FR=actualFGBound('F',1),FZ=FR,
  GR=actualFGBound('G',1),GZ=GR;
const HR=scale(car,plus(FR,GR)),HZ=scale(car,plus(FZ,GZ));
const Rjet=C(R);
Rjet[1]=P.one;
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
const target=degree.map((k,j)=>mul(q(trivariateRatio(k),alphaFactor[j]),max(...inputs.target.bounds[k].component.map(id=>P.leaf('target-c7',id)))));
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
const meshDelta=C(P.zero);
meshDelta[1]=meshSlope;
const bandDelta=degree.map(j=>j?mul(q(8),pow(chartInv,j)):P.zero);
const meshPartition=compose1(fixedPart,meshDelta);
const slow=times(meshPartition,meshPartition,meshPartition,compose1(fixedPart,bandDelta));
const amplitude=t.map(x=>times(x,slow,sqrtWeight));
const pairs=[[2,1],[0,2],[1,0]];
const potential=pairs.map(([i,j])=>product(invN2,plus(product(n[i].j,amplitude[j]),product(n[j].j,amplitude[i]))));
// Replacing each weighted coefficient by the common pole 24*m is
// conservative. A single analytic absorption then gives the unweighted jets.
const maxPole=Math.max(...poles),halfPole=maxPole/2;
const gaussianAbsorption=add(q(1),mul(q(factorial(halfPole)),add(pow(mul(q(2),inv(pow(t1,2))),halfPole),pow(q(1,2),halfPole))));
const common=rows=>degree.map((_,j)=>mul(gaussianAbsorption,max(...rows.map(x=>x[j]))));
const ampAbs=common(amplitude),potentialAbs=common(potential);
const chi=sigma.slice(0,7).map((x,j)=>x*2n**BigInt(35*j));
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
const aFast=mul(q(4),pow(R,3),ex(mul(q(1,100000),h,add(ell,q(17)),log2)));
const fastJets=degree.map(j=>mul(q(1,alphaFactor[j]),aFast,pow(mul(q(12),R),j)));
const shift=j=>degree.map(k=>k<m?mul(q(k+1),j[k+1]):P.zero);
const remaChi=plus(scale(q(2),shift(potentialAbs)),product(invR,potentialAbs));
const remaChiPrime=product(fastJets,potentialAbs);
const torusOrders=[0,1,2,3,4,5];
const curlLeading=torusOrders.map(j=>scale(q(chi[j]),ampAbs));
const curlRemainder=torusOrders.map(j=>plus(scale(q(chi[j]),remaChi),scale(q(chi[j+1]),remaChiPrime)));
const covarianceLocal=torusOrders.map(j=>scale(q(1,2),plus(...Array.from({length:j+1},(_,i)=>
  scale(q(choose(j,i)),plus(product(curlLeading[i],curlLeading[j-i]),product(curlRemainder[i],curlRemainder[j-i])))))));
const covariance=torusOrders.map(j=>covarianceLocal[j].slice(0,m).map((v,k)=>
  mul(q(162),pow(q(4),k+2+4*j),q(alphaFactor[k]),v)));
assert.ok(covariance.every(v=>v.length===7));
const radial=e=>inputs.radial.unweighted[e].rows.map(({T})=>P.leaf('fixed-radial',T));
const T0=radial(0),T1=radial(1);
const cutoffRemainder=e=>inputs.radial.unweighted[e].rows.map(({A})=>P.leaf('fixed-radial',A));
const A0=cutoffRemainder(0),A1=cutoffRemainder(1);
const fixedRecords=inputs.radial.unweightedArithmeticClosure;
// In the pinned radial replay T=chiBound*(2*common), where common
// also bounds the raw whole shifted integral and its slow derivatives.
const rawWholeIds=inputs.radial.unweighted[0].rows.map(({T})=>{
  const a=fixedRecords[T];
  assert.equal(a.op,'multiply');
  const twiceCommon=a.args.find(id=>fixedRecords[id].op==='multiply'&&fixedRecords[id].args.includes(24));
  const factors=fixedRecords[twiceCommon].args;
  assert.equal(factors.length,2);
  return factors.find(id=>id!==24);
});
assert.deepEqual(rawWholeIds,[7412,7419,7426,7433,7441]);
const rawWhole=rawWholeIds.map(id=>P.leaf('fixed-radial',id));
const boundR=mul(q(2),R),width=boundR;
const rhoInvMass=mul(q(20),ex(q(6))),rho0=mul(rhoInvMass,boundR),rho1=mul(rhoInvMass,
  add(mul(q(8),R,chartInv),mul(boundR,q(2),q(160),pow(R,2),chartInv)));
const [W0,WL]=covariance;
const cov0=add(mul(q(2),boundR,W0[0]),W0[1]);
const cov1=add(mul(q(2),boundR,W0[1]),mul(q(2),pow(boundR,2),W0[0]),W0[2]);
const moment0=mul(width,cov0),moment1=mul(width,cov1);
const centered0=add(cov0,mul(rho0,moment0));
const centered1=add(cov1,mul(rho1,moment0),mul(rho0,moment1));
const directPressure0=add(W0[0],mul(T0[0],centered0));
const directPressure1=add(W0[1],mul(T0[1],max(centered0,centered1)));
const directPressureL=add(WL[0],mul(T0[0],add(mul(q(2),boundR,WL[0]),WL[1])));
const pressureScale=(constant,hMultiple)=>ex(mul(add(constant,mul(hMultiple,h)),add(ell,q(17)),log2));
const physicalDirectPressure0=mul(pressureScale(q(1),q(2)),directPressure0);
const physicalDirectPressureR=mul(pressureScale(q(3,2),q(2)),add(directPressure1,mul(aFast,directPressureL)));
const physicalDirectPressureZ=mul(pressureScale(q(3,2),q(1)),directPressure1);

// Original Etheta and Ez after the auxiliary-independent part is projected out.
// All arrays below remain coefficient-normalized in the slow degree only.
const covJet=j=>[...covariance[j].map((v,k)=>mul(q(1,alphaFactor[k]),v)),P.zero];
const invEnvelopeR=degree.map(j=>pow(boundR,j+1));
const chiArgument=degree.map(j=>j?mul(q(160),pow(R,2),pow(chartInv,j)):P.zero);
const pressureChiZ=shift(compose1(sigma.map((v,j)=>q(v,alphaFactor[j])),chiArgument));
function fixedOperator(T,jet){
  return degree.map(j=>j<T.length?mul(q(1,alphaFactor[j]),T[j],
    max(...jet.slice(0,j+1).map((x,i)=>mul(q(alphaFactor[i]),x)))):P.zero);
}
const projectedInputs=torusOrders.slice(0,5).map(j=>{
  const a=covJet(j),l=covJet(j+1),d=shift(a);
  const dr=plus(d,product(fastJets,l));
  const etheta=plus(dr,scale(q(2),product(invEnvelopeR,a)),d);
  const earlyPressureSource=plus(scale(q(2),product(invEnvelopeR,a)),d);
  const earlyPressureSourceZ=plus(scale(q(2),product(invEnvelopeR,d)),shift(d));
  const ez=plus(dr,product(invEnvelopeR,a),scale(q(2),d),fixedOperator(T0,earlyPressureSourceZ),
    product(pressureChiZ,fixedOperator(rawWhole,earlyPressureSource)));
  return {etheta,ez};
});
const ci0Inverse=mul(q(8),Tg,S);
const inverseAux=(field,j)=>scale(ci0Inverse,plus(scale(q(85,6),projectedInputs[j][field]),scale(q(85,216),projectedInputs[j+2][field])));
const temporalV=inverseAux('etheta',0),temporalVL=inverseAux('etheta',1);
const temporalVLL = meanSpatialC2 ? inverseAux('etheta',2) : undefined;
const gammaDesired=inverseAux('ez',0),gammaDesiredL=inverseAux('ez',1);
const gammaDesiredLL = meanSpatialC2 ? inverseAux('ez',2) : undefined;
const temporalPsi=fixedOperator(T1,gammaDesired),temporalPsiL=fixedOperator(T1,gammaDesiredL),
  temporalPsiLL=fixedOperator(T1,inverseAux('ez',2));
const temporalBeta=shift(temporalPsi),temporalBetaL=shift(temporalPsiL),temporalBetaLL=shift(temporalPsiLL);
const temporalGamma=plus(gammaDesired,fixedOperator(A1,gammaDesired));
const temporalGammaL = meanSpatialC2 ? plus(gammaDesiredL, fixedOperator(A1,gammaDesiredL)) : undefined;
const temporalGammaLL = meanSpatialC2 ? plus(gammaDesiredLL, fixedOperator(A1,gammaDesiredLL)) : undefined;
const through=(j,d)=>j.slice(0,d+1).map((v,k)=>mul(q(alphaFactor[k]),v));
const temporalBounds={v:through(temporalV,4),vL:through(temporalVL,4),psi:through(temporalPsi,4),
  psiL:through(temporalPsiL,4),psiLL:through(temporalPsiLL,4),beta:through(temporalBeta,3),gamma:through(temporalGamma,4)};

// Exact fresh targets from the post-Temporal Haar identities. Radial
// integration by parts acts on the original fixed envelope and gives the
// factor |j-1|=1 for each j=0,2. All linear Temporal terms average to zero.
const W=covJet(0);
const freshRr=plus(product(temporalBeta,temporalBeta),W);
const freshRz=plus(product(temporalBeta,temporalGamma),W);
const freshThTh=plus(product(temporalV,temporalV),W);
const freshThZ=plus(product(temporalV,temporalGamma),W);
const freshZz=plus(product(temporalGamma,temporalGamma),W);
const freshWeightedR=(RpowerLow,RpowerHigh)=>scale(width,plus(scale(RpowerLow,plus(freshRr,freshThTh)),scale(RpowerHigh,shift(freshRz))));
const freshP=freshWeightedR(boundR,P.one);
const freshJtheta=scale(mul(width,pow(boundR,2)),freshThZ);
const freshJz=plus(scale(mul(width,boundR),freshZz),scale(q(1,2),freshWeightedR(boundR,pow(boundR,2))));

// Actual separated FiveMap unit kernels. All angular node gaps are >1/16,
// all entries are <=2, and the axial gap is >=lambda/4.
const lam=native(8),sourceT=native(6),unitMuInv=mul(rhoInvMass,pow(boundR,4));
const unitAInv=mul(q(9),pow(R,4),ex(add(q(8),mul(q(89999),sourceT))));
const unitAxial=mul(unitMuInv,unitAInv,q(4),inv(lam));
const unitAngular=mul(q(3072),unitMuInv,unitAInv);
const seedFactors=[1,60,88800,460080000];
const etaDerivative=seedFactors.map((s,j)=>mul(q(s),pow(R,j+1)));
const Hprofile=etaDerivative.map(v=>mul(q(2),v));
const Gprofile=[mul(q(4),R),...Array.from({length:4},(_,i)=>add(mul(q(4),R,Hprofile[i]),
  i?mul(q(i),Hprofile[i-1]):P.zero))];
const normalize1=a=>a.map((x,j)=>mul(q(1,alphaFactor[j]),x));
const xDelta=degree.map(j=>j?mul(q(16),R,pow(chartInv,j)):P.zero);
const unitPrefactor=(n,Rextra=0)=>degree.map(j=>mul(q(n),pow(R,Rextra),pow(chartInv,j)));
const fivePsi=scale(unitAxial,times(freshJtheta,unitPrefactor(272,1),compose1(normalize1(Gprofile),xDelta)));
const fiveGamma=scale(unitAxial,times(freshJtheta,unitPrefactor(136),compose1(normalize1(Hprofile),xDelta)));
const fiveV=scale(unitAngular,times(plus(freshP,freshJz),unitPrefactor(136),compose1(normalize1(etaDerivative),xDelta)));
const fiveBeta=shift(fivePsi);
const velocity={beta:plus(temporalBeta,fiveBeta),gamma:plus(temporalGamma,fiveGamma),v:plus(temporalV,fiveV)};

let meanSpatialInputs, meanSpatialBounds, radialPhaseA0, radialPhaseA1;
if (meanSpatialC2) {
  meanSpatialInputs = {
    beta: {M: through(velocity.beta,2), L: through(temporalBetaL,2), LL: through(temporalBetaLL,2)},
    v: {M: through(velocity.v,2), L: through(temporalVL,2), LL: through(temporalVLL,2)},
    gamma: {M: through(velocity.gamma,2), L: through(temporalGammaL,2), LL: through(temporalGammaLL,2)},
  };
  radialPhaseA0 = fastJets[0];
  radialPhaseA1 = mul(q(1), fastJets[1]);
  // D_R = partial_R + a L. D_Z = epsilon partial_Z, with epsilon <= 1.
  const a = radialPhaseA0;
  const da = radialPhaseA1;
  meanSpatialBounds = Object.fromEntries(Object.entries(meanSpatialInputs).map(([name,{M,L,LL}]) => [
    name, {
      value: M[0],
      R: add(M[1], mul(a,L[0])),
      Z: M[1],
      RR: add(M[2], mul(q(2),a,L[1]), mul(da,L[0]), mul(a,a,LL[0])),
      RZ: add(M[2], mul(a,L[1]), mul(da,L[0])),
      ZZ: M[2],
    },
  ]));
}
let longitudinalSources, longitudinalInputs, longitudinalBounds;
if (meanPathLongitudinal) {
  // Cancel the original auxiliary inverse before differentiating in the path variable.
  const factor = mul(q(2), ci0Inverse);
  const pEz = scale(factor, projectedInputs[0].ez);
  const pEzL = scale(factor, projectedInputs[1].ez);
  const pEtheta = scale(factor, projectedInputs[0].etheta);
  const pEthetaL = scale(factor, projectedInputs[1].etheta);
  const nPsi = fixedOperator(T1, pEz);
  const nPsiL = fixedOperator(T1, pEzL);
  const nGamma = plus(pEz, fixedOperator(A1, pEz));
  const nGammaL = plus(pEzL, fixedOperator(A1, pEzL));
  const nBeta = shift(nPsi);
  const nBetaL = shift(nPsiL);
  longitudinalSources = {factor, projectedInputs: projectedInputs.slice(0,2), T1, A1};
  longitudinalInputs = {
    beta: {N: through(nBeta,1), NL: through(nBetaL,1)},
    v: {N: through(pEtheta,1), NL: through(pEthetaL,1)},
    gamma: {N: through(nGamma,1), NL: through(nGammaL,1)},
  };
  longitudinalBounds = Object.fromEntries(Object.entries(longitudinalInputs).map(([name,{N,NL}]) => [
    name, {value: N[0], R: add(N[1], mul(radialPhaseA0,NL[0])), Z: N[1]},
  ]));
}
let combinedStageZeroB, correctionB, correctionInputs;
if (stageZeroB) {
  const vSpatial = meanSpatialBounds.v;
  const vSlow = meanSpatialInputs.v.M;
  const Etheta0 = projectedInputs[0].etheta[0];
  const epsilonInv = ex(mul(h,add(ell,q(17)),log2));
  const invR0 = boundR;
  correctionB = {
    'b@0,0,0': mul(invR0,vSlow[0]),
    'b@0,0,1': mul(invR0,add(vSlow[1],mul(epsilonInv,q(2),Etheta0))),
    'b@0,1,0': mul(invR0,vSlow[1]),
    'b@0,2,0': mul(invR0,vSlow[2]),
    'b@1,0,0': mul(q(1,2),add(mul(pow(invR0,2),vSpatial.R),mul(pow(invR0,3),vSlow[0]))),
    'b@2,0,0': mul(q(1,4),add(mul(pow(invR0,3),vSpatial.RR),
      mul(q(3),pow(invR0,4),vSpatial.R),mul(q(3),pow(invR0,5),vSlow[0]))),
  };
  correctionInputs = {vSlow,vSpatial,Etheta0,epsilonInv,invR0};
  const transport = await pinned(resolve(next,'whole-k-annular-initial/stage-zero-annular-transport.json'),
    'c9478f9ed4a517061ab1da9e04814e3583af47f1573b1a5c9a9e7d86917df0b6');
  const slow = await pinned(resolve(next,'whole-k-annular-slow/annular-slow-jet-bounds.json'),
    '3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69');
  assert.equal(transport.chartSHA256,chartSHA);
  assert.equal(slow.pins.wholeK,chartSHA);
  assert.equal(transport.atomContractSHA256,slow.pins.atoms);
  const keys = Object.keys(correctionB);
  for (const atoms of [transport.atoms, slow.slowFieldAtomIntervals]) {
    assert.deepEqual(Object.keys(atoms).filter(key => key.startsWith('b@')).sort(), [...keys].sort());
  }
  combinedStageZeroB = Object.fromEntries(keys.map(key => [key, {
    background: slow.slowFieldAtomIntervals[key],
    actualInitializedPerturbationNormRoot: correctionB[key],
    physicalQExponent: transport.atoms[key].tau0ReciprocalExponent,
    QtoTauDyadic: transport.atoms[key].QtoTauDyadic,
    combination: 'background interval radius + QtoTauDyadic * tau0^(-physicalQExponent) * actualInitializedPerturbationNormRoot',
  }]));
}
// Stage-zero velocity pressure: g_vel=Dr(H)+K, compact H. The whole Haar
// radial moment of Dr(H) is zero. Preserve the time transport of beta by
// applying N to the actual Temporal inverse. FiveMap is Haar zero mode.
const b=degree.map(j=>j<=2?mul(q(1,alphaFactor[j]),B0):P.zero);
const V=product(Rjet,F),Gbg=actualFGBound('G',0);
const beta=velocity.beta,gamma=velocity.gamma,azimuthal=velocity.v;
const rrVel=plus(scale(q(2),product(b,beta)),product(beta,beta));
const rzVel=plus(product(b,gamma),product(Gbg,beta),product(beta,gamma));
const thVel=plus(scale(q(2),product(V,azimuthal)),product(azimuthal,azimuthal));
const DrBeta=plus(shift(beta),product(fastJets,temporalBetaL));
const hVel=plus(rrVel,DrBeta,product(invEnvelopeR,beta));
const hVelL=plus(scale(q(2),product(plus(b,beta),temporalBetaL)),shift(temporalBetaL),
  product(fastJets,temporalBetaLL),product(invEnvelopeR,temporalBetaL));
const hVelDr=plus(shift(hVel),product(fastJets,hVelL));
const canceledFastTime=scale(q(2),shift(fixedOperator(T1,projectedInputs[0].ez)));
const kVel=plus(shift(beta),canceledFastTime,product(invEnvelopeR,plus(rrVel,thVel)),shift(rzVel),shift(shift(beta)));
const kP=scale(width,kVel);
const rhoJet=[rho0,rho1,...zeroJet.slice(2)];
const centeredVelocity=plus(kVel,product(rhoJet,kP));
const pVel=plus(hVel,fixedOperator(T0,centeredVelocity));
const pVelDr=add(hVelDr[0],centeredVelocity[0],mul(A0[0],centeredVelocity[0]));
const pMean=add(directPressure0,pVel[0]);
const pMeanR=add(directPressure1,mul(aFast,directPressureL),pVelDr);
const pMeanZ=add(directPressure1,pVel[1]);
const allMeanPressure={normalizedValue:pMean,normalizedDr:pMeanR,normalizedZ:pMeanZ,
  physicalValue:mul(pressureScale(q(1),q(2)),pMean),physicalR:mul(pressureScale(q(3,2),q(2)),pMeanR),
  physicalZ:mul(pressureScale(q(3,2),q(1)),pMeanZ)};
assert.equal(P.nodes[Hinv0].op,'multiply');
assert.ok(P.nodes.some(n=>n.op==='authenticated_source_norm_root'&&n.args[0]==='target-c7'&&n.args[1]===153454));
assert.ok(P.nodes.some(n=>n.op==='authenticated_source_norm_root'&&n.args[0]==='background-c8'&&n.args[1]===152307));
const fRoots=new Set(inputs.background.bounds.flatMap(r=>[r.F,r.G]));
const tRoots=new Set(inputs.target.bounds.flatMap(r=>r.component));
for(const [i,n]of P.nodes.entries()){
  if(n.op==='authenticated_source_norm_root'){
    const [ns,id]=n.args;
    assert.ok(ns==='background-c8'?fRoots.has(id):ns==='target-c7'?tRoots.has(id):
      ns==='hosted-original'?source.has(id):ns==='fixed-radial'&&(rawWholeIds.includes(id)||inputs.radial.unweighted.some(x=>x.rows.some(r=>r.T===id||r.A===id))));
  }else if(n.op!=='rational'){
    const args=n.op==='integer_power'?n.args.slice(0,1):n.args;
    assert.ok(args.every(x=>Number.isSafeInteger(x)&&x>=0&&x<i),'topologically earlier positive operands');
  }
}
const output={
  schema:'MathScope.N7.ActualAllCovarianceAndDirectInitializedPressure/1',
  sourceSHA256:sourceGraphSHA,nativeRegistrySHA256:nativeRegistrySHA,wholeKChartSHA256:chartSHA,priorReceipts:pins,
  nativePulseMatrices:nativePulse.map(({matrix,parameters,variable,length,initial})=>({matrix,parameters,variable,length,initial})),
  nativeSourceRecords:Object.fromEntries([...wanted].sort((a,b)=>a-b).map(id=>[id,source.get(id)])),
  nativeCovariance:{components,sourceRows:fields.length*162,localAngular,pressureExplicitCovarianceTerms:covarianceTerms,
    finalMeanPressure:3615361,lateGr:3614891,lateP:3615055,lateShiftedIntegrals:[3615204,3615205],rho:633726,rhoMass:633724},
  nativeMean:{freshTargets:[3614334,3614376,3614420],scaledFiveTargets:[3614714,3614715,3614716],
    fiveMapCoefficients:[3614724,3614727,3614730,3614747,3614749],actualFiveMap:[3614778,3614789,3614767,3614771],
    temporal:[1706770,1706773,1706624,1706782],gammaDesiredAndA1:[1706626,1706796],actualVelocity:[3614790,3614791,3614792],
    background:[622934,622932,622933],originalRuntimeSHA256:inputs.initialized.sourceRuntime},
  ordinarySlowAxes:['R','Z','T'],factorialNormalizedOrders:orders,
  intermediate:{frameM:Mnorm,stableW:stable,pulseW:w,covarianceH:Hnorm,Hinv,weight,sqrtWeight,
    sqrtWeightPoles:poles,partitionSeedSigma:sigma.map(String),partitionFactor:fixedPart,
    exactLocalCutoffBounds:Object.fromEntries(Object.entries(cutoff).map(([k,v])=>[k,String(v)])),
    gaussianAbsorption,poleAbsorbed:maxPole,wholeKBandSUpper:S,normalLower:nLower,frozenCLower:cLower,
    determinantCoefficientLower:detLowerCoefficient,weightLowerOverZeta:cy,
    normalizedRhoSup:rho0,normalizedRhoSlowC1:rho1,aFast,originalCi0InverseUpper:ci0Inverse,
    earlyPressureChiZJets:pressureChiZ,rawWholeShiftedFixedRoots:rawWholeIds},
  ...(meanPathLongitudinal && {longitudinalScope: {
    status: 'CONDITIONAL',
    sourceCancellation: 'N N^(-1) Pperp = Pperp on the original mean-zero Fourier limit; N FiveMap increment = 0',
    pullback: 'partial_w u(H_w) = (ci_label / Tg^delta) (N u)(H_w), fixed labels and fixed slow variables',
    referenceScaling: 'actual mean is rho^(-A) times reference mean at (R/sqrt(rho), Z/rho^D, T/rho, ell_ref, Y); transport of all norms to same live source family remains OPEN',
    notProved: 'No actual same-family path domain, full weighted W-alpha forcing, all jets, time or N8 completion.',
  }}),
  ...(meanSpatialC2 && {transverseScope: {
    status: 'CONDITIONAL',
    actualInitializedMean: [3614790,3614791,3614792],
    components: ['beta','v','gamma'],
    reference: 'fixed original dyadic Q and frozen row labels',
    directions: 'R,Z,T slow; L=vr dot partialY; physical slow-space D_R=partialR+aL, D_Z=epsilon partialZ',
    operatorCommutation: 'L commutes with T1 and A1 because the actual shifted Y argument is a translation with Y-independent shift and vr; cutoff chi and R factors are Y-independent. All original left and whole integrals and A1 retained.',
    finiteAnalyticPrerequisites: 'original positive covariance norm expressions through five L and six slow derivatives; original fixed radial T1/A1 C4 norm, same-box stability, cone, cutoff flatness, actual original inverse anisotropic estimate, radial source zero extensions and fixed-label derivatives; FiveMap auxiliary independence',
    normalization: 'For physical perturbation velocity Q^(-A) times normalized components, physical spatial first and second derivatives gain Q^(-1/2) and Q^(-1), using epsilon=Q^h.',
    notProved: 'No numerical source bounds, actual live-joined private-family identity, background contribution, own/reference/fixed-pulse-path pullback, W-alpha class, physical time derivatives, final 67 jets, energy or N8 gate.',
  }}),
  ...(stageZeroB && {stageZeroBScope: {
    status: 'CONDITIONAL_EXACT_POSITIVE_SOURCE_EXPRESSIONS',
    nativeCorrectionV: 3614791,
    earlyTemporalEtheta: 643868,
    sourceComponents: 'actual slow background plus actual initialized Temporal and FiveMap direct b; no later stage',
    physicalScalar: 'b=Q^(-A-1/2) v/R',
    physicalTime: 'partial_t=-partial_tau; Q^(-1)[-partial_T+epsilon^(-1) ci N]; original ci*N(vTemporal)=-Pperp Etheta, N(vFive)=0',
    radiusBound: '1/R <= 2 C12EnvelopeR',
    epsilonInverseBound: 'epsilon^(-1)<=exp(h*(ellMinimum+17)*log(2)) on the fixed reference bands',
    physicalReference: 'fixed dyadic Q, same original whole-K annulus and original phase/flat source premises',
    notProved: 'No numerical interval values, actual final field, later increments, 67 global jet coverage, N7/N8 gate completion, or live private-family identification.',
  }}),
  roots:{...(stageZeroB && {combinedStageZeroB,correctionB,correctionInputs}),
  ...(meanPathLongitudinal && {longitudinalSources,longitudinalInputs,longitudinalBounds}), ...(meanSpatialC2 && {
    meanSpatialInputs, meanSpatialBounds, radialPhaseA0, radialPhaseA1,
    transverseC2: {
      vL: through(temporalVL,2), vLL: through(temporalVLL,2),
      betaL: through(temporalBetaL,2), betaLL: through(temporalBetaLL,2),
      gammaL: through(temporalGammaL,2), gammaLL: through(temporalGammaLL,2),
    },
  }), covarianceByTransverseAndSlowOrder:covariance,temporalBounds,directPressure0,directPressure1,directPressureL,
    physicalDirectPressure0,physicalDirectPressureR,physicalDirectPressureZ,
    freshTargetBounds:{P:through(freshP,2),Jtheta:through(freshJtheta,4),Jz:through(freshJz,2)},
    fiveMapBounds:{psi:through(fivePsi,4),beta:through(fiveBeta,3),gamma:through(fiveGamma,2),v:through(fiveV,2)},
    initializedMeanPressure:allMeanPressure},
  nodes:P.nodes,graphSHA256:hashJSON(P.nodes),
  sourceProofPremises:{oldUniformConeAndStability:'same original source uniform Q threshold and native C2 family proof',
    completeCoverAndSmoothZeroExtension:'same previous 162-row source and shell-flat proof',
    radialBackgroundC2:'original bTotal chart constant in B0, applied at ordinary slow order through 2',
    originalFiveMap:'original reserved patch, fixed normalization and homogeneous weighted axial moment, and exact original lambda>0',
    sourceNormLeaves:'actual source-only exact FTC expressions, referenced by separate immutable graph namespaces'},
  scope:{actualAllCovarianceFinitePositivePropagationExecuted:true,allSourceNormsNumericallyEvaluated:false,
    actualDirectCovariancePressurePartCovered:true,actualTemporalBoundsThroughOrdinarySlowOrdersSupplied:true,
    stageZeroMeanPressureValueAndBothSpatialDerivativesBoundedConditionally:true,allStageZeroPressureJetCovered:false,
    finalJets:'0/67',N7_06:'OPEN',N8_05:'OPEN',release:'HOLD'}};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS exact positive source-norm propagation for all six native covariance components and complete initialized mean pressure.');
console.log(JSON.stringify({count:P.nodes.length,graph:output.graphSHA256,roots:output.roots,fileSHA256:sha(await readFile(out))}));
