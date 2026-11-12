import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,hosted,functionalFile,out]=process.argv.slice(2);
assert.ok(next&&hosted&&functionalFile&&out,'Supply GOAL_NEXT, HOSTED_GRAPH, ORIGINAL_FUNCTIONALS, OUTPUT.');
const sha=x=>createHash('sha256').update(x).digest('hex');
const pins={
  angular:['whole-k-angular-pressure/initialized-angular-pressure.json','b4f45002e74e8fc397d9a43079ba2e5fa958bfe68a355f37d4a006f6f8b08e0d'],
  angularCheck:['whole-k-angular-pressure/initialized-angular-pressure-readback.json','9e6c6a0789f885e05990723b78f1fa0255e8558d46d04a65c4163d66246dce0d'],
  mean:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  transport:['whole-k-annular-initial/stage-zero-annular-transport.json','c9478f9ed4a517061ab1da9e04814e3583af47f1573b1a5c9a9e7d86917df0b6'],
  slow:['whole-k-annular-slow/annular-slow-jet-bounds.json','3e3bd5d76fcdac202d2d4da51ca490ddc8dd5d020c1a57aed6a2ecd7985a3a69'],
  bg:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e']
};
async function pinned(path,digest){
  const raw=await readFile(path);
  assert.equal(sha(raw),digest,path);
  return JSON.parse(raw);
}
const prior=Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([k,[f,h]])=>[k,await pinned(resolve(next,f),h)])));
const functionalSHA='b8c2ce18ebdefd2875e83e5f824eb71f77f1c9b7510170d225efce739360bb78';
const functional=await pinned(functionalFile,functionalSHA);
const initial=functional.nodes.find(r=>r.operation==='ActualInitializedState');
assert.equal(initial.id,'f_1db258e7c5bbb3108d5dde59');
assert.equal(initial.data.potentials.primary,'source-global-current.mjs attachGlobalCurrentState rows[].rawPotential and rows[].potential BEFORE exactCylindricalHarmonicCurl, with original physical scaling/cover');
assert.equal(prior.angularCheck.receiptSHA256,pins.angular[1]);
const sourceSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const registrySHA='657bc01a51027c0fd5381bbeb5f5d89895ed76d7cf357d297884f045d55a8333';
const decode=x=>typeof x==='string'?JSON.parse(x):x;
const top=await pinned(resolve(hosted,'original-source-functions.json'),registrySHA);
const reg=decode(top.base),base=decode(reg.base),fields=decode(reg.fieldDefinitions),pulses=decode(base.m3GlobalPulses);
const definitions=decode(base.expression);
assert.equal(fields[9].name,'OriginalAll81InitialAngular_pressure');
assert.equal(fields[9].rows.length,162);
assert.deepEqual([...new Set(fields[9].rows.map(r=>r.localBody))],[3625754,3652129]);
const nativePotentialSystems=[[694,695,696],[703,704,705]],nativePotentialBodies=[[625322,625323,625324],[628773,628774,628775]];
const velocityNames=[0,1,2].map(i=>'OriginalAll81InitialAngular_velocity_'+i);
assert.deepEqual(fields.slice(6,9).map(r=>r.name),velocityNames);
for(const f of fields.slice(6,9)){
  assert.equal(f.rows.length,162);
  for(const [j,row] of f.rows.entries()){
    const reference=fields[9].rows[j];
    assert.deepEqual(row.label,reference.label);
    assert.deepEqual(row.values,reference.values);
    assert.deepEqual(row.guards,reference.guards);
    assert.deepEqual(row.derivativeMaps,reference.derivativeMaps);
  }
}
for(const [row,systems] of nativePotentialSystems.entries()){
  for(const [j,id] of systems.entries()){
    const def=definitions[id];
    assert.equal(def.body,nativePotentialBodies[row][j]);
    assert.deepEqual(def,prior.transport.graph.initialWavePotentialNativeFunctions[id]);
    assert.deepEqual(def.parameters,[622802,622803,622804,623035,622805,622807,622808,622809,622791,623855,623856,623857]);
  }
}
assert.deepEqual(pulses.map(r=>r.matrix),[[[623351,623328],[623332,623352]],[[623685,623663],[623667,623686]]]);
assert.ok(pulses.every(r=>r.variable===622805&&r.length===623027&&r.initial[0]===1&&r.initial[1]===0));
const targetIDs=new Set([19,20,184,591,3286,622798,622799,622800,622801,622805,623027,623043,
  ...Array.from({length:9},(_,j)=>623047+j),623137,623388,623389,623390,623391,623721,623722,623723,623724,
  623148,623353,623354,623492,623687,623688,635059,635060,635063,3616133,3622968,3622969,3622973,3622977,3622981,3625740,3625741,3625747,
  3649464,3649465,3649469,3649473,3649477,3652115,3652116,3652122,3674937]);
const original=new Map(),digest=createHash('sha256');
const stream=createReadStream(resolve(hosted,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
stream.on('data',bytes=>digest.update(bytes));
let n=-1;
for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
  if(targetIDs.has(n)||(n>=625300&&n<=625324)||(n>=628753&&n<=628775))original.set(n,JSON.parse(line));
  n++;
}
assert.equal(n,4456994);
assert.equal(digest.digest('hex'),sourceSHA);
const assertSource=(i,op,args)=>assert.deepEqual(original.get(i),{op,args},'source #'+i);
assertSource(622799,'sqrt_positive',[622798]);
assertSource(622800,'inverse',[622799]);
assertSource(622801,'ceiling',[622800]);
assertSource(184,'rational',['-4','1']);
assertSource(591,'rational',['16','1']);
assertSource(3286,'rational',['20','1']);
assertSource(623047,'multiply',[3286,622805]);
assertSource(623048,'inverse',[623027]);
assertSource(623049,'multiply',[623047,623048]);
assertSource(623050,'add',[184,623049]);
assertSource(623051,'source_step_derivative',[623050,0]);
assertSource(623052,'multiply',[20,623049]);
assertSource(623053,'add',[591,623052]);
assertSource(623054,'source_step_derivative',[623053,0]);
assertSource(623055,'multiply',[623051,623054]);
const nativeCalls=[623390,623391,623723,623724];
const formals=[622802,622803,622804,622807,622808,622809,622791];
for(const [i,id] of nativeCalls.entries())assertSource(id,'actual_covariance_volterra',[i>>1,i%2,622805,formals]);
assertSource(623388,'definite_integral',[623371,623358,623372,622805]);
assertSource(623721,'definite_integral',[623705,623692,623372,622805]);
assertSource(623389,'exp',[623388]);
assertSource(623722,'exp',[623721]);
assertSource(3674937,'m3_aux_indexed_partial',[9,[622802,622803,622804,622791,635044,635045,622806],[0,0,0,0,0,0]]);
for(const row of prior.angular.source.sourceBinding){
  assertSource(row.half,'multiply',[19,row.coefficient]);
  assertSource(row.sines[0],'sine',[row.sines[0]-4]);
  assertSource(row.sines[1],'sine',[row.sines[1]-4]);
  assertSource(row.sines[0]-4,'multiply',[622801,row.phase]);
  assertSource(row.sines[1]-4,'multiply',[3616133,row.phase]);
}
// Exact signed native cross products, with all six frozen-bound amplitudes
// retained as atoms. The coefficient nodes precede the original curl.
for(const [signIndex,row] of prior.angular.source.sourceBinding.entries()){
  const [nr,nt,nz]=row.preNormal,[ar,at,az]=row.preAmp;
  const denom=[623354,623688][signIndex],productRoot=[623353,623687][signIndex],nSquared=[623148,623492][signIndex];
  assertSource(denom,'inverse',[productRoot]);
  assertSource(productRoot,'multiply',[622801,nSquared]);
  const stop=new Set([denom,nr,nt,nz,ar,at,az]);
  function terms(id){
    if(stop.has(id))return [{coefficient:1,operands:[id]}];
    if(id===20)return [{coefficient:-1,operands:[]}];
    const {op,args}=original.get(id);
    if(op==='add')return args.flatMap(terms);
    assert.equal(op,'multiply');
    return args.map(terms).reduce((a,b)=>a.flatMap(x=>b.map(y=>({coefficient:x.coefficient*y.coefficient,operands:[...x.operands,...y.operands]}))),[{coefficient:1,operands:[]}]);
  }
  const canonical=xs=>xs.map(({coefficient,operands})=>coefficient+':'+[...operands].sort((a,b)=>a-b).join(',')).sort();
  const expected=[[[nt,az],[nz,at]],[[nz,ar],[nr,az]],[[nr,at],[nt,ar]]];
  for(const [j,id] of nativePotentialBodies[signIndex].entries()){
    assert.deepEqual(canonical(terms(id)),canonical(expected[j].map((operands,k)=>({coefficient:k===0?1:-1,operands:[denom,...operands]}))));
  }
}

// Bounds are source-only positive expressions. Jet coefficients are
// normalized by slow-order! * pulse-order! and use the max over all
// ordered choices of the slow R,Z,T directions.
const nodes=[],cache=new Map();
const addNode=(op,args)=>{
  const key=JSON.stringify([op,args]);
  if(!cache.has(key)){cache.set(key,nodes.length);nodes.push({op,args});}
  return cache.get(key);
};
const q=(n,d=1)=>addNode('rational',[String(n),String(d)]),zero=q(0),one=q(1);
const add=(...xs)=>{
  const ys=xs.filter(y=>y!==zero).sort((a,b)=>a-b);
  return ys.length===0?zero:ys.length===1?ys[0]:addNode('add',ys);
};
const mul=(...xs)=>{
  if(xs.includes(zero))return zero;
  const ys=xs.filter(y=>y!==one).sort((a,b)=>a-b);
  return ys.length===0?one:ys.length===1?ys[0]:addNode('multiply',ys);
};
const inv=x=>x===one?one:addNode('inverse',[x]);
const sqrt=x=>x===one?one:addNode('sqrt_positive',[x]);
const exp=x=>x===zero?one:addNode('exp',[x]);
const pow=(x,j)=>j===0?one:j===1||x===one?x:addNode('integer_power',[x,j]);
const max=(...xs)=>addNode('maximum',[...new Set(xs)].sort((a,b)=>a-b));
const leaf=(ns,id)=>addNode('authenticated_source_norm_root',[ns,id]);
const source=id=>leaf('hosted-original',id);
const imported=id=>leaf('initialized-mean-positive',id);
const m=prior.mean.intermediate;
const R=source(216823),h=source(9),log2=source(127),ell=source(617432),r0=source(300171),B0=source(300170),
  S=imported(m.wholeKBandSUpper),aFast=imported(m.aFast),u=mul(q(2),inv(source(617289))),Tg=add(q(4),sqrt(q(2)));
const length=mul(q(2),r0,Tg,S),inverseLength=inv(mul(q(2),r0));
const ntLower=inv(pow(B0,2)),lambda0Upper=pow(R,83);
const carrier=add(one,mul(add(R,one),pow(R,42),add(one,mul(u,pow(R,31),inv(mul(q(4),r0))),mul(q(1,2),u))));
const factorial=[1,1,2,6,24];
const orders=Array.from({length:4},(_,k)=>Array.from({length:k+1},(_,j)=>[k-j,j])).flat();
const index=new Map(orders.map((a,i)=>[a.join(','),i]));
const jet=callback=>orders.map(([s,v])=>callback(s,v));
const get=(a,s,v)=>a[index.get(s+','+v)];
const unit=x=>jet((s,v)=>s===0&&v===0?x:zero);
const splits=orders.map(([s,v])=>{
  const result=[];
  for(let a=0;a<=s;a++)for(let b=0;b<=v;b++)result.push([index.get(a+','+b),index.get((s-a)+','+(v-b))]);
  return result;
});
const sum=(...as)=>jet((s,v)=>add(...as.map(x=>get(x,s,v))));
const product=(a,b)=>splits.map(parts=>add(...parts.map(([i,j])=>mul(a[i],b[j]))));
const times=(...as)=>as.reduce(product,unit(one));
const scale=(x,a)=>a.map(y=>mul(x,y));
const recip=(a,lo)=>{
  const r=[inv(lo)];
  for(let k=1;k<orders.length;k++)r.push(mul(r[0],add(...splits[k].slice(1).map(([i,j])=>mul(a[i],r[j])))));
  return r;
};
const squareRoot=(a,lo)=>{
  const r=[sqrt(a[0])],twoInv=inv(mul(q(2),lo));
  for(let k=1;k<orders.length;k++)r.push(mul(twoInv,add(a[k],...splits[k].slice(1,-1).map(([i,j])=>mul(r[i],r[j])))));
  return r;
};
const diffV=a=>jet((s,v)=>s+v<3?mul(q(v+1),get(a,s,v+1)):zero);
const matrix=(A,B)=>A.map(r=>B[0].map((_,j)=>sum(...r.map((x,i)=>product(x,B[i][j])))));
const fgb=(field,extra)=>jet((s,v)=>v===0?mul(q(2**(s+extra),factorial[s]),leaf('background-c8',prior.bg.bounds[s+extra][field])):zero);
const F=fgb('F',0),G=fgb('G',0),FR=fgb('F',1),GR=fgb('G',1);
const H=scale(carrier,sum(F,G)),HR=scale(carrier,sum(FR,GR)); // Same envelope for H_R and H_Z.
const r=jet((s,v)=>v===0?(s===0?R:s===1?one:zero):zero);
const invR=recip(r,inv(R));
const v=jet((s,v)=>s===0?(v===0?length:v===1?one:zero):zero);
const nR=sum(unit(carrier),product(v,HR)),nTheta=scale(carrier,invR),nZ=sum(unit(carrier),product(v,HR));
const normal=[nR,nTheta,nZ],n2=sum(...normal.map(x=>product(x,x))),invN2=recip(n2,pow(ntLower,2));
const nt=squareRoot(sum(product(nTheta,nTheta),product(nZ,nZ)),ntLower),ntInv=recip(nt,ntLower);
const ka=[product(nTheta,ntInv),product(nZ,ntInv)],na=[ka[1],ka[0]],sa=product(nR,ntInv);
const K=[[unit(zero),scale(q(2),F),unit(zero)],[sum(scale(q(2),F),product(r,FR)),unit(zero),unit(zero)],[GR,unit(zero),unit(zero)]];
const numerator=K[0].map((_,j)=>sum(diffV(normal[j]),...normal.map((x,i)=>product(x,K[i][j]))));
const Aphi=K.map((row,i)=>row.map((x,j)=>sum(x,times(normal[i],numerator[j],invN2))));
const sRef=jet((s,v)=>s===0?(v===0?mul(q(2),u):v===1?mul(u,inverseLength):zero):zero);
const sSquared=sum(unit(one),product(sRef,sRef)),sRoot=squareRoot(sSquared,one);
const c=scale(pow(R,10),sRoot);
const U=[[unit(one),unit(zero)],[product(sa,ka[0]),na[0]],[product(sa,ka[1]),na[1]]];
const J=[[unit(one),unit(one)],[c,c]],B=matrix(U,J),Bv=B.map(row=>row.map(diffV));
const Uleft=[[unit(one),unit(zero),unit(zero)],[unit(zero),na[0],na[1]]];
const ci=scale(q(1,2),recip(c,inv(B0)));
const Jinv=[[unit(q(1,2)),ci],[unit(q(1,2)),ci]],left=matrix(Jinv,Uleft);
const AphiB=matrix(Aphi,B),projected=matrix(left,AphiB.map((row,i)=>row.map((x,j)=>sum(x,Bv[i][j]))));
const lambda=scale(lambda0Upper,recip(sRoot,one)),dref=scale(lambda0Upper,sSquared),damping=scale(q(4),n2);
const M=projected.map((row,i)=>row.map((x,j)=>i===j?sum(x,lambda,dref,damping):x));
const Mnorm=orders.map((_,k)=>max(...M.map(row=>add(...row.map(x=>x[k])))));
const slowW=m.pulseW.slice(0,4).map(imported);
const w=jet((s,v)=>v===0?slowW[s]:zero);
for(let v=1;v<=3;v++)for(let s=0;s+v<=3;s++){
  const terms=[];
  for(let i=0;i<=s;i++)for(let j=0;j<v;j++)terms.push(mul(get(Mnorm,i,j),get(w,s-i,v-1-j)));
  w[index.get(s+','+v)]=mul(q(1,v),add(...terms));
}
const logPDerivative=sum(lambda,dref),envelope=[one];
for(let v=1;v<=3;v++)envelope.push(mul(q(1,v),add(...Array.from({length:v},(_,j)=>mul(get(logPDerivative,0,j),envelope[v-1-j])))));
const envelopeP=jet((s,v)=>s===0?envelope[v]:zero);
const pulse=B.map(row=>sum(...row.map(x=>times(x,envelopeP,w))));
const sigma=m.partitionSeedSigma.map(BigInt),pulseSlope=mul(q(20),inverseLength);
const onePulseCutoff=jet((s,v)=>s===0?mul(q(sigma[v],factorial[v]),pow(pulseSlope,v)):zero);
const psi=product(onePulseCutoff,onePulseCutoff);
const gauss=imported(m.gaussianAbsorption);
const weight=jet((s,v)=>v===0?mul(gauss,imported(m.sqrtWeight[s])):zero);
const oneFactor=m.partitionFactor.slice(0,4).map(imported),meshSlope=pow(S,3),chartInv=mul(q(128),R);
const mesh=jet((s,v)=>v===0?mul(oneFactor[s],pow(meshSlope,s)):zero);
const bandDelta=jet((s,v)=>v===0&&s>0?mul(q(8),pow(chartInv,s)):zero);
let band=unit(one),bandPower=unit(one);
for(let s=1;s<=3;s++){
  bandPower=product(bandPower,bandDelta);
  band=sum(band,scale(oneFactor[s],bandPower));
}
const partition=times(mesh,mesh,mesh,band);
const amp=pulse.map(x=>times(x,psi,weight,partition));
const coefficient=[[1,2],[2,0],[0,1]].map(([i,j])=>product(invN2,sum(product(normal[i],amp[j]),product(normal[j],amp[i]))));

// Original normalized independent coordinates first. The χ factor is
// separated from the cross product and its derivatives are exact integers.
const chi=[0,1,2,3].map(j=>q(sigma[j]*2n**BigInt(35*j)));
const cEnvelope=[0,1,2,3].map(m=>max(...orders.filter(([s,v])=>s+v<=m).flatMap(([s,v])=>
  coefficient.map(x=>mul(q(factorial[s]*factorial[v]),get(x,s,v),chi[m-s-v])))));
const dyadic=x=>exp(mul(x,add(ell,q(17)),log2));
const epsInv=dyadic(h),kUpper=mul(q(2),dyadic(mul(q(1,2),h)));
const [H0,H1,H2,H3]=[0,1,2,3].map(s=>mul(q(factorial[s]),get(H,s,0)));
const phase=[
  mul(kUpper,add(carrier,mul(epsInv,carrier),mul(length,H1),H0)),
  mul(kUpper,add(mul(length,H2),H1)),
  mul(kUpper,add(mul(length,H3),H2))
];
const [P1,P2,P3]=phase;
const sine=[one,P1,add(P2,pow(P1,2)),add(P3,mul(q(3),P1,P2),pow(P1,3))];
const choose=(n,k)=>factorial[n]/(factorial[k]*factorial[n-k]);
const local=[0,1,2,3].map(n=>add(...Array.from({length:n+1},(_,j)=>mul(q(choose(n,j)),cEnvelope[j],sine[n-j]))));

// Pull back xi(R) and v(T) at fixed original label/copy. At each degree
// this majorizes all four normalized cylindrical derivatives, including theta.
const aPrime=mul(q(4),R,aFast),aSecond=mul(q(12),pow(R,2),aFast);
const J1=max(add(one,aFast),add(one,epsInv)),J2=aPrime,J3=aSecond;
const pulled=[local[0],mul(J1,local[1]),add(mul(pow(J1,2),local[2]),mul(J2,local[1])),
  add(mul(pow(J1,3),local[3]),mul(q(3),J1,J2,local[2]),mul(J3,local[1]))];
const atomEntries=Object.entries(prior.transport.atoms).filter(([key])=>/^A[012]@/.test(key));
assert.equal(atomEntries.length,57);
const physicalPrimary={},completeInitializedAxialPotential={},powerRows={};
for(const [key,record] of atomEntries){
  const [x,y,z,t]=key.split('@')[1].split(',').map(Number);
  assert.ok(x+y+z+t<=3);
  const sumTerms=record.wave.map(({mappedOrder,radiusEnvelopePower,coefficient})=>{
    const [a,b='1']=coefficient.split('/');
    return mul(q(a,b),pow(R,radiusEnvelopePower),pulled[mappedOrder]);
  });
  // Exactly Q^-h*sqrt(epsilon)/k <= 1 for the actual k>=epsilon^-1/2.
  // The remaining physical exponent is (x+y)/2+(1/2-h)z+t.
  const twiceConstant=x+y+z+2*t,scaleQ=mul(dyadic(q(twiceConstant,2)),inv(dyadic(mul(q(z),h))));
  physicalPrimary[key]=mul(q(162),scaleQ,add(...sumTerms));
  powerRows[key]=[twiceConstant,z];
  if(key.startsWith('A2@')){
    assert.deepEqual(record.mean,[]);
    assert.deepEqual(prior.slow.slowFieldAtomIntervals[key].exactInterval,['0','0']);
    completeInitializedAxialPotential[key]=physicalPrimary[key];
  }
}
assert.equal(Object.keys(completeInitializedAxialPotential).length,19);
const output={schema:'MathScope.N7.ActualInitializedPrimaryPotentialPhysicalC3/1',pins,functionalSHA256:functionalSHA,sourceSHA256:sourceSHA,registrySHA256:registrySHA,
  native:{sourceFunctional:initial.id,rows:162,velocityCover:velocityNames,nativePotentialSystems,nativePotentialBodies,
    nativeCalls,pulseMatrices:pulses.map(x=>x.matrix),sourceRecords:Object.fromEntries([...original].sort((a,b)=>a[0]-b[0]))},
  intermediate:{orders,w,Mnorm,amplitude:amp,coefficient,chi,cEnvelope,kUpper,epsInv,phase,sine,local,pulled,
    pullback:{J1,J2,J3,aPrime,aSecond},powerRows},
  roots:{physicalPrimary,completeInitializedAxialPotential},nodes,graphSHA256:sha(JSON.stringify(nodes)),
  scope:{actualInitialPrimaryPotentialAll57BoundConditionally:true,completeInitializedAxialPotential19BoundConditionally:true,
    completeInitializedHorizontalPotential:false,numericalNormEvaluation:false,laterStagesIncluded:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('PASS actual original primary potential physical C3 on all 57 atoms and full initialized axial potential on 19 atoms.');
console.log(JSON.stringify({nodes:nodes.length,graphSHA256:output.graphSHA256,primaryAtoms:Object.keys(physicalPrimary).length,
  completeAxialAtoms:Object.keys(completeInitializedAxialPotential).length,fileSHA256:sha(await readFile(out))}));
