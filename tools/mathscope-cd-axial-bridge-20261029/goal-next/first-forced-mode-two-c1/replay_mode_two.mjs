import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,forced,cycle,out]=process.argv.slice(2);
assert.ok(next&&forced&&cycle&&out,'Supply GOAL_NEXT, FORCED_GRAPH, CYCLE_GRAPH, OUTPUT.');
const sha=x=>createHash('sha256').update(x).digest('hex');
const parse=async p=>JSON.parse(await readFile(p));
const pins={
  primary:['whole-k-primary-potential-c3/initialized-primary-potential-c3.json','6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  primaryCheck:['whole-k-primary-potential-c3/initialized-primary-potential-c3-readback.json','ef5e4d6b975915acc25bb7c3de8e56bba2f4b51fe3282efdbd80c687519045b3'],
  mean:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328']
};
const prior={};
for(const [name,[path,h]] of Object.entries(pins)){
  const bytes=await readFile(resolve(next,path));
  assert.equal(sha(bytes),h);
  prior[name]=JSON.parse(bytes);
}
assert.equal(prior.primaryCheck.receiptSHA256,pins.primary[1]);
const first=await parse(resolve(forced,'corrected-first-force.json'));
const forcedSHA='1ab376e369484c63e17b0d891eebcc18ddedf53f8e6acb907bc9ec8c05d51fc3';
const cycleSHA='ab52a3337591d2c23c82f8ebbd1ef7305b4ecaebc9fa17ae6d700f32c650e4cf';
const prefixSHA='2524f35161dfad02368893371e2dd121af3d72c1d5884cf0068b6ef1bdfe6598';
const regSHA='bec2f66a8ed9fa4c7c9c8dc137e1b69fca234192d92fa841a724b5db23e2b50a';
const registry=await readFile(resolve(forced,'original-source-functions.json'));
const cycleRegistry=await readFile(resolve(cycle,'original-source-functions.json'));
assert.equal(sha(registry),regSHA);
assert.equal(sha(cycleRegistry),prior.primary.registrySHA256);
assert.equal(first.snapshot.node_stream_sha256,forcedSHA);
assert.equal(prior.primary.sourceSHA256,cycleSHA);
const unpack=x=>typeof x==='string'?JSON.parse(x):x;
const top=unpack(registry.toString()),cycleTop=unpack(cycleRegistry.toString());
const defs=unpack(top.definitions)[0],cycleDefs=unpack(cycleTop.definitions)[0];
const byID=new Map(defs.map(x=>[x.id,x])),cycleByID=new Map(cycleDefs.map(x=>[x.id,x]));
const modes=first.rows.filter(x=>x.m===2);
assert.equal(modes.length,10);
const components=modes.flatMap(x=>x.components);
assert.equal(components.length,60);
assert.ok(modes.every(r=>r.changed===0));
assert.ok(components.every(r=>r.raw===r.supported&&r.primary===0));
const wanted=new Set(components.flatMap(r=>[r.raw,r.formalPathSource,r.mapped]));
const source=new Map();
async function collect(dir,archiveHash,archiveCount,keep){
  const total=createHash('sha256'),prefix=createHash('sha256');
  const stream=createReadStream(resolve(dir,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
  stream.on('data',b=>total.update(b));
  let n=-1;
  for await(const line of createInterface({input:stream,crlfDelay:Infinity})){
    if(n>=0&&n<3860185)prefix.update(line+'\n');
    if(keep&&(n>=0&&n<=690000||n>=3615900&&n<=3860184||wanted.has(n)))source.set(n,JSON.parse(line));
    n++;
  }
  assert.equal(n,archiveCount);
  assert.equal(total.digest('hex'),archiveHash);
  assert.equal(prefix.digest('hex'),prefixSHA);
}
await Promise.all([collect(forced,forcedSHA,4197115,true),collect(cycle,cycleSHA,4456994,false)]);

// Exact sparse rational polynomials. Both the complex wave values and
// their actual first native derivatives retain the same formal/actual slots.
const gcd=(a,b)=>b===0n?(a<0n?-a:a):gcd(b,a%b);
function rational(n,d=1n){
  const g=gcd(n,d);
  return [n/g,d/g];
}
const plusQ=([a,b],[c,d])=>rational(a*d+b*c,b*d);
const timesQ=([a,b],[c,d])=>rational(a*c,b*d);
const zero=[0n,1n],one=[1n,1n];
const key=xs=>xs.filter(Boolean).sort().join(',');
function sum(...xs){
  const out=new Map();
  for(const p of xs)for(const [k,q] of p)out.set(k,plusQ(out.get(k)??zero,q));
  return new Map([...out].filter(([,q])=>q[0]!==0n));
}
const scale=(p,n,d=1n)=>new Map([...p].map(([k,v])=>[k,timesQ(v,rational(n,d))]).filter(([,v])=>v[0]!==0n));
const product=(a,b)=>sum(...[...a].flatMap(([x,p])=>[...b].map(([y,q])=>new Map([[key([...x.split(','),...y.split(',')]),timesQ(p,q)]]))));
const atom=x=>new Map([[x,one]]);
const constant=q=>q[0]===0n?new Map():new Map([['',q]]);
const canon=p=>[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,[n,d]])=>[k,String(n),String(d)]);
const same=(a,b,msg)=>assert.deepEqual(canon(a),canon(b),msg);
const wave=(j,c,d)=>'w:'+j+':'+c+':'+d;
const scalar=id=>atom('s:'+id);
const special=new Set([622798,622801,623135,623066,635060]);
const actDer={0:'value',1:'R',2:'Z',7:'Y0',8:'Y1'};
const complexAdd=(...p)=>[sum(...p.map(x=>x[0])),sum(...p.map(x=>x[1]))];
const complexMultiply=(a,b)=>[sum(product(a[0],b[0]),scale(product(a[1],b[1]),-1n)),sum(product(a[0],b[1]),product(a[1],b[0]))];
const complexScale=(p,q)=>q.map(x=>product(p,x));
const scaleI=(p,q)=>[scale(product(p,q[1]),-1n),product(p,q[0])];
const WV=(j,d='value')=>[atom(wave(j,'real',d)),atom(wave(j,'imaginary',d))];
const coeffOf=(p,velocity)=>{
  const terms=[...p].flatMap(([k,v])=>{
    const t=k.split(','),ws=t.filter(x=>x.startsWith('w:')).sort();
    return ws.join(',')===key(velocity)?[new Map([[key(t.filter(x=>!x.startsWith('w:'))),v]])]:[];
  });
  return sum(...terms);
};
const records=[];
for(const row of modes){
  const [delta,sign]=row.key.split(':').map(Number),read=new Map(),memo=new Map();
  const pattern=new RegExp('^InitializedOriginalWave_'+delta+'_'+sign+'_(0|1|2)_(real|imaginary)$');
  function expand(id){
    if(memo.has(id))return memo.get(id);
    const n=source.get(id);
    assert.ok(n,'raw operand #'+id);
    let r;
    if(special.has(id))r=scalar(id);
    else if(n.op==='rational')r=constant(rational(...n.args.map(BigInt)));
    else if(n.op==='add')r=sum(...n.args.map(expand));
    else if(n.op==='multiply')r=n.args.map(expand).reduce(product);
    else if(n.op==='m3_coupled_expression_partial'){
      const [system,values,orders]=n.args,def=byID.get(system),m=def.name.match(pattern);
      assert.ok(m,'unrelated source native '+def.name);
      assert.deepEqual(def,cycleByID.get(system),'same archived actual initialized wave definition');
      assert.deepEqual(values,def.parameters,'actual own fixed-row formal/native identity');
      const nonzero=orders.map((v,j)=>v?[j,v]:null).filter(Boolean);
      assert.ok(nonzero.length===0||nonzero.length===1&&nonzero[0][1]===1&&actDer[nonzero[0][0]]!=='value');
      const d=nonzero.length?actDer[nonzero[0][0]]:'value';
      assert.ok(d,'unexpected actual native derivative slot');
      const atomName=wave(Number(m[1]),m[2],d);
      if(read.has(atomName))assert.equal(read.get(atomName),id);
      read.set(atomName,id);
      r=atom(atomName);
    }else r=scalar(id);
    memo.set(id,r);return r;
  }
  const actual=row.components.map(c=>expand(c.raw));
  for(const p of actual)assert.ok([...p.keys()].every(k=>k.split(',').filter(x=>x.startsWith('w:')).length===2));
  const rr=wave(0,'real','value');
  const ay=['Y0','Y1'].map(d=>scale(coeffOf(actual[0],[rr,wave(0,'real',d)]),1n,2n));
  same(ay[1],product(ay[0],scalar(623066)),'same actual original transverse direction');
  const kn=[0,1,2].map(j=>scale(coeffOf(actual[1],[rr,wave(j,'real','value')]),1n,2n));
  assert.ok(kn.every(p=>p.size>0&&[...p.keys()].every(k=>k.split(',').includes('s:622801'))),'all raw phase factors retain the actual k');
  const U=[0,1,2].map(j=>WV(j));
  const Dr=j=>complexAdd(WV(j,'R'),...ay.map((a,k)=>complexScale(a,WV(j,'Y'+k))));
  const Dz=j=>complexScale(scalar(622798),WV(j,'Z'));
  const Rinv=scalar(623135);
  const negative=p=>p.map(x=>scale(x,-1n));
  for(let j=0;j<3;j++){
    const conn=j===0?negative(complexMultiply(U[1],U[1])):j===1?complexMultiply(U[0],U[1]):[new Map(),new Map()];
    const expected=complexAdd(complexMultiply(Dr(j),U[0]),complexMultiply(U[j],Dr(0)),
      complexMultiply(Dz(j),U[2]),complexMultiply(U[j],Dz(2)),complexScale(Rinv,complexAdd(complexMultiply(U[j],U[0]),conn)),
      scaleI(constant(rational(2n)),complexAdd(...kn.map((p,k)=>complexScale(p,complexMultiply(U[j],U[k]))))));
    same(actual[2*j],expected[0],row.key+' radial/axial/phase real component '+j);
    same(actual[2*j+1],expected[1],row.key+' radial/axial/phase imaginary component '+j);
  }
  records.push({key:row.key,raw:row.components.map(x=>x.raw),mapped:row.components.map(x=>x.mapped),path:row.path,
    nativeWaveAtoms:Object.fromEntries(read),radialTransverseMultiplier:canon(ay[0]),phaseMultipliers:kn.map(canon)});
}

// Weighted positive arithmetic. Remove exactly one prior Gaussian
// absorption factor structurally. Each source P derivative was itself
// obtained from P_v=(lambda-d_ref)P, so P(v) can be kept in every summand.
const nodes=[],known=new Map();
const node=(op,args)=>{
  const key=JSON.stringify([op,args]);
  if(!known.has(key)){known.set(key,nodes.length);nodes.push({op,args});}
  return known.get(key);
};
const q=(n,d=1)=>node('rational',[String(n),String(d)]),z=q(0),unit=q(1);
const add=(...xs)=>{
  const a=xs.filter(x=>x!==z).sort((x,y)=>x-y);
  return !a.length?z:a.length===1?a[0]:node('add',a);
};
const mul=(...xs)=>{
  if(xs.includes(z))return z;
  const a=xs.filter(x=>x!==unit).sort((x,y)=>x-y);
  return !a.length?unit:a.length===1?a[0]:node('multiply',a);
};
const pow=(x,k)=>k===0?unit:k===1?x:node('integer_power',[x,k]);
const max=(...x)=>node('maximum',[...new Set(x)].sort((a,b)=>a-b));
const leaf=(ns,id)=>node('authenticated_source_norm_root',[ns,id]);
const p=prior.primary,m=prior.mean.intermediate,absorption=m.gaussianAbsorption,removed=new Map();
function strip(id){
  if(removed.has(id))return removed.get(id);
  const n=p.nodes[id];
  let r;
  if(n.op==='authenticated_source_norm_root'&&n.args[0]==='initialized-mean-positive'&&n.args[1]===absorption)r=[1,unit];
  else if(['authenticated_source_norm_root','rational'].includes(n.op))r=[0,leaf('initialized-primary-positive',id)];
  else if(n.op==='integer_power'){
    const [d,v]=strip(n.args[0]);
    assert.equal(d,0);
    r=[0,leaf('initialized-primary-positive',id)];
  }else{
    const xs=n.args.map(strip),grades=xs.map(x=>x[0]),vs=xs.map(x=>x[1]);
    if(n.op==='multiply'){
      const d=grades.reduce((a,b)=>a+b,0);
      r=d?[d,mul(...vs)]:[0,leaf('initialized-primary-positive',id)];
    }else if(n.op==='add'||n.op==='maximum'){
      const d=grades[0];
      assert.ok(grades.every(g=>g===d),'Gaussian absorption homogeneity');
      r=d?[d,n.op==='add'?add(...vs):max(...vs)]:[0,leaf('initialized-primary-positive',id)];
    }else{
      assert.ok(grades.every(g=>g===0),'Gaussian absorption only appears linearly in actual amplitude');
      r=[0,leaf('initialized-primary-positive',id)];
    }
  }
  removed.set(id,r);return r;
}
const factor=[1,1,2,6],sigma=m.partitionSeedSigma.map(BigInt);
const chi=[0,1,2,3].map(j=>q(sigma[j]*2n**BigInt(35*j)));
function norm(rows,d){
  return max(...p.intermediate.orders.flatMap(([s,v],i)=>{
    if(s+v>d)return [];
    return rows.map(a=>{
      const [grade,without]=strip(a[i]);
      assert.equal(grade,1);
      return mul(q(factor[s]*factor[v]),without,chi[d-s-v]);
    });
  }));
}
assert.deepEqual(m.sqrtWeightPoles.slice(0,4),[12,24,48,72]);
const amp=[0,1,2].map(j=>norm(p.intermediate.amplitude,j));
const gauge=[0,1,2,3].map(j=>norm(p.intermediate.coefficient,j));
const R=leaf('hosted-original',216823),a0=mul(q(4),pow(R,3));
const a=[a0,mul(q(4),R,a0),mul(q(12),pow(R,2),a0)],choose=(j,k)=>factor[j]/(factor[k]*factor[j-k]);
const invRadius=[0,1,2].map(j=>mul(q(factor[j]),pow(R,j+1)));
const velocity=[0,1,2].map(j=>{
  const radius=add(...Array.from({length:j+1},(_,k)=>mul(q(choose(j,k)),invRadius[k],gauge[j-k])));
  const transverse=add(...Array.from({length:j+1},(_,k)=>mul(q(choose(j,k)),a[k],gauge[j-k+1])));
  return mul(q(1,2),add(amp[j],mul(q(2),gauge[j+1]),radius,transverse));
});
const [U0,U1,U2]=velocity;
// No k remains: exact full curl divergence identifies ik n.u with
// -(D_r u_r+D_z u_z+u_r/R). The two nonlinear connection terms remain.
const N0=add(mul(q(4),add(unit,a0),U0,U1),mul(q(2),R,pow(U0,2)));
const N1=add(mul(q(4),add(unit,a0),add(pow(U1,2),mul(U0,U2))),mul(q(4),a[1],U0,U1),
  mul(q(4),R,U0,U1),mul(q(2),pow(R,2),pow(U0,2)));
const result={schema:'MathScope.N7.ArchivedFirstForcedModeTwoWeightedC1/1',pins,source:{forcedSHA256:forcedSHA,cycleSHA256:cycleSHA,
  sharedOriginalNodePrefix:{count:3860185,sha256:prefixSHA},registrySHA256:regSHA,checkedRawComponents:60,records},
  positive:{amplitude:amp,potential:gauge,velocity,rawModeTwoValue:N0,rawModeTwoOrdinaryC1:N1,nodes,graphSHA256:sha(JSON.stringify(nodes))},
  weight:{epsilonExponent:[99999,100000],zetaPower:1,deltaPole:144,Ppower:2,
    directions:['R','Z','T','xi','v'],cutoffFlatJoinsPremise:true},
  scope:{archivedModeTwoOnly:true,newCompactFamilySameGraphClaim:false,laterCorrectionsBounded:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS 60 actual first Forced mode-two coefficients and weighted own-coordinate C1 symbolic norms.');
console.log(JSON.stringify({positiveNodes:nodes.length,N0,N1,graphSHA256:result.positive.graphSHA256,fileSHA256:sha(await readFile(out))}));
