import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {createGunzip} from 'node:zlib';

const [next,forced,kernel,out]=process.argv.slice(2);
assert.ok(next&&forced&&kernel&&out,'Supply GOAL_NEXT, ARCHIVED_FORCED_GRAPH, ORIGINAL_FORCED_PULSE_MJS, OUTPUT.');
const sha=x=>createHash('sha256').update(x).digest('hex');
async function pinned(path,h){
  const b=await readFile(path);
  assert.equal(sha(b),h,path);
  return JSON.parse(b);
}
const pins={
  input:['first-forced-mode-two-c1/mode-two-weighted-c1.json','e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'],
  output:['first-forced-mode-two-c1/mode-two-output-readback.json','1c948cead33b39bf54343e9f95a6563e2336ebe20fd951df70ea3220ef5c540c'],
  primary:['whole-k-primary-potential-c3/initialized-primary-potential-c3.json','6c3a65a40767e74e2093ddc6869e33fe024f154eb60a1b77a22ac365b4c6140d'],
  mean:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  bg:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e']
};
const p=Object.fromEntries(await Promise.all(Object.entries(pins).map(async ([k,[name,h]])=>[k,await pinned(resolve(next,name),h)])));
assert.equal(p.output.inputReceiptSHA256,pins.input[1]);
const originalKernelSHA='129423c917b3b8b1aae72b242f802e9f9934f17569fa895c669708785dbff924';
const kernelBytes=await readFile(kernel);
assert.equal(sha(kernelBytes),originalKernelSHA);
const kernelText=kernelBytes.toString();
for(const fragment of ['terms.push(this.mul(dt,this.forcedPulseRhs(system,part,component,time,values,orders)))',
  'const next=[...orders];next[direction]++','G.mul(G.q(m*m),damping)','cdot(G,n,forcing)','pressure=cscale(G,psi,result.pressure)']){
  assert.ok(kernelText.includes(fragment),fragment);
}
const regSHA='bec2f66a8ed9fa4c7c9c8dc137e1b69fca234192d92fa841a724b5db23e2b50a';
const reg=await pinned(resolve(forced,'original-source-functions.json'),regSHA);
const run=await pinned(resolve(forced,'corrected-first-force.json'),'c7d429adb927a3020b870df3fb755806061727ed2efc7d8df8736c785e65f835');
const native=JSON.parse(reg.definitions),systems=native[3];
const modes=run.rows.filter(x=>x.m===2);
assert.equal(modes.length,10);
const hashes=p.input.source;
assert.equal(run.snapshot.node_stream_sha256,hashes.forcedSHA256);
const source=new Map(),digest=createHash('sha256');
const zip=createReadStream(resolve(forced,'original-source-nodes.jsonl.gz')).pipe(createGunzip());
zip.on('data',b=>digest.update(b));
let count=-1;
for await(const line of createInterface({input:zip,crlfDelay:Infinity})){
  if(count>=0&&count<=1000||count>=622750&&count<=623100||count>=3860185)source.set(count,JSON.parse(line));
  count++;
}
assert.equal(count,4197115);
assert.equal(digest.digest('hex'),hashes.forcedSHA256);
const rec=(id,op)=>{
  const x=source.get(id);
  assert.equal(x?.op,op,'original source #'+id);
  return x.args;
};
const allZero=x=>x.every(y=>y.real===0&&y.imaginary===0);
const dampingProduct=(id,n2,phaseScale)=>{
  const stop=new Set([622798,623028,n2]),factors=[];
  let numerator=1n,denominator=1n;
  function go(i){
    if(stop.has(i)){factors.push(i);return;}
    const n=source.get(i);
    assert.ok(n,'damping factor #'+i);
    if(n.op==='multiply'){n.args.forEach(go);return;}
    assert.equal(n.op,'rational');
    numerator*=BigInt(n.args[0]);denominator*=BigInt(n.args[1]);
  }
  go(id);
  assert.equal(numerator,BigInt(phaseScale)*denominator);
  assert.deepEqual(factors.sort((x,y)=>x-y),[622798,623028,n2].sort((x,y)=>x-y));
};
const systemBindings=[];
for(const r of modes){
  const a=systems[r.system],f=run.rows.find(x=>x.m===1&&x.key===r.key),b=systems[f.system];
  const older=p.output.systems.find(x=>x.key===r.key);
  assert.equal(a.id,older.system);
  assert.equal(a.name,'ActualOriginalForced_'+r.key+'_m2');
  assert.ok(allZero(a.initial)&&allZero(b.initial));
  // The fundamental also reads the mean-reference band; its homogeneous
  // matrix and differentiated directions do not use that extra formal.
  assert.deepEqual(b.parameters.filter(id=>!a.parameters.includes(id)),[3675253]);
  assert.deepEqual(b.parameters.filter(id=>id!==3675253),a.parameters);
  assert.deepEqual(a.directions,[622802,622803,622804,635044,635045]);
  assert.deepEqual(a.directionParameterIndices,[0,1,2,3,4]);
  assert.equal(a.variable,r.path.w);
  assert.equal(a.variable,b.variable);
  assert.equal(a.length,r.length);
  assert.equal(a.length,b.length);
  assert.equal(a.left,0);
  assert.equal(a.finitePartialSumIsExactSolution,false);
  assert.deepEqual(a.forcing,r.projectedSource);
  assert.deepEqual(r.normal,f.normal);
  assert.deepEqual(r.K,f.K);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    if(i!==j){assert.equal(a.matrix[i][j],b.matrix[i][j]);continue;}
    const [common,sub2]=rec(a.matrix[i][i],'add'),[common1,sub1]=rec(b.matrix[i][i],'add');
    assert.equal(common,common1);
    dampingProduct(sub2,r.normal.squared,-4);
    dampingProduct(sub1,r.normal.squared,-1);
  }
  for(const [j,z] of r.output.entries())for(const part of ['real','imaginary']){
    assert.deepEqual(rec(z[part],'m3_forced_pulse_partial'),[a.id,part,j,a.variable,a.parameters,[0,0,0,0,0]]);
  }
  for(const part of ['real','imaginary'])assert.ok(rec(r.mappedCutoff.pressure[part],'multiply').includes(r.mappedCutoff.psi));
  systemBindings.push({key:r.key,zeroDataSystem:a.id,referenceSystem:b.id,variable:a.variable,parameters:a.parameters,
    extraModeOneMeanReferenceFormal:3675253,directions:a.directions,
    t:r.output,mappedGauge:older.potential,mappedPressure:r.mappedCutoff.pressure,cutoffComplement:r.mappedCutoff.remainingSource,
    cutoffDerivative:r.mappedCutoff.derivativeSource});
}

// Finite positive graph. Coefficients indexed by (slow degree, pulse
// degree) use s!v! normalization. The one slow axis stands for any
// fixed original R,Z,T derivative with labels and representative frozen.
const nodes=[],intern=new Map();
const make=(op,args)=>{
  const key=JSON.stringify([op,args]);
  if(!intern.has(key)){intern.set(key,nodes.length);nodes.push({op,args});}
  return intern.get(key);
};
const q=(n,d=1)=>make('rational',[String(n),String(d)]),zero=q(0),one=q(1);
const add=(...xs)=>{
  const a=xs.filter(x=>x!==zero).sort((x,y)=>x-y);
  return a.length===0?zero:a.length===1?a[0]:make('add',a);
};
const mul=(...xs)=>{
  if(xs.includes(zero))return zero;
  const a=xs.filter(x=>x!==one).sort((x,y)=>x-y);
  return a.length===0?one:a.length===1?a[0]:make('multiply',a);
};
const pow=(x,j)=>j===0?one:j===1?x:make('integer_power',[x,j]);
const inv=x=>x===one?one:make('inverse',[x]);
const sqrt=x=>x===one?one:make('sqrt_positive',[x]);
const max=(...xs)=>make('maximum',[...new Set(xs)].sort((a,b)=>a-b));
const leaf=(ns,id)=>make('authenticated_source_norm_root',[ns,id]);
const original=id=>leaf('hosted-original',id);
const P=id=>leaf('initialized-primary-positive',id);
const Mean=id=>leaf('initialized-mean-positive',id);
const m=p.mean.intermediate;
const R=original(216823),B0=original(300170),r0=original(300171),u=mul(q(2),inv(original(617289)));
const length=mul(q(12),r0,Mean(m.wholeKBandSUpper)),stable=Mean(m.stableW),lengthInv=inv(mul(q(2),r0));
const ntLower=inv(pow(B0,2)),lambda0=pow(R,83);
const carrier=add(one,mul(add(R,one),pow(R,42),add(one,mul(u,pow(R,31),inv(mul(q(4),r0))),mul(q(1,2),u))));
const order=[[0,0],[1,0],[0,1],[1,1],[0,2]],ix=new Map(order.map((a,i)=>[a.join(','),i]));
const at=(s,v)=>ix.get(s+','+v),jet=f=>order.map(([s,v])=>f(s,v));
const unit=x=>[x,...order.slice(1).map(()=>zero)];
const splits=order.map(([s,v])=>{
  const a=[];
  for(let i=0;i<=s;i++)for(let j=0;j<=v;j++)a.push([at(i,j),at(s-i,v-j)]);
  return a;
});
const plus=(...xs)=>order.map((_,i)=>add(...xs.map(x=>x[i])));
const scale=(a,x)=>x.map(y=>mul(a,y));
const product=(a,b)=>splits.map(xs=>add(...xs.map(([i,j])=>mul(a[i],b[j]))));
const products=(...xs)=>xs.reduce(product,unit(one));
const reciprocal=(x,lo)=>{
  const a=[inv(lo)];
  for(const parts of splits.slice(1))a.push(mul(a[0],add(...parts.slice(1).map(([i,j])=>mul(x[i],a[j])))));
  return a;
};
const root=(x,lo)=>{
  const a=[sqrt(x[0])],den=inv(mul(q(2),lo));
  for(const [j,parts] of splits.slice(1).entries())a.push(mul(den,add(x[j+1],...parts.slice(1,-1).map(([i,j])=>mul(a[i],a[j])))));
  return a;
};
const mm=(a,b)=>a.map(r=>b[0].map((_,j)=>plus(...r.map((x,i)=>product(x,b[i][j])))));
const matrixNorm=a=>order.map((_,j)=>max(...a.map(r=>add(...r.map(x=>x[j])))));
const fgb=(field,extra)=>jet((s,v)=>v===0?mul(q(2**(s+extra)),leaf('background-c8',p.bg.bounds[s+extra][field])):zero);
const F=fgb('F',0),FR=fgb('F',1),GR=fgb('G',1);
const hr=scale(carrier,plus(FR,GR));
const radius=[R,one,zero,zero,zero],rInv=reciprocal(radius,inv(R)),pulse=[length,zero,one,zero,zero];
const nr=plus(unit(carrier),product(pulse,hr)),nTheta=scale(carrier,rInv),nz=nr;
const n=[nr,nTheta,nz],n2=plus(...n.map(x=>product(x,x))),n2Inv=reciprocal(n2,pow(ntLower,2));
const nt=root(plus(product(nTheta,nTheta),product(nz,nz)),ntLower),ntInv=reciprocal(nt,ntLower);
const Kt=[product(nTheta,ntInv),product(nz,ntInv)],Na=[Kt[1],Kt[0]],sa=product(nr,ntInv);
const sRef=[mul(q(2),u),zero,mul(u,lengthInv),zero,zero];
const s2=plus(unit(one),product(sRef,sRef)),sRoot=root(s2,one),c=scale(pow(R,10),sRoot);
const U=[[unit(one),unit(zero)],[product(sa,Kt[0]),Na[0]],[product(sa,Kt[1]),Na[1]]];
const B=mm(U,[[unit(one),unit(one)],[c,c]]);
const CInv=scale(q(1,2),reciprocal(c,inv(B0)));
const left=mm([[unit(q(1,2)),CInv],[unit(q(1,2)),CInv]],
  [[unit(one),unit(zero),unit(zero)],[unit(zero),Na[0],Na[1]]]);
const Bnorm=matrixNorm(B),leftNorm=matrixNorm(left);
const piNorm=matrixNorm(n.map(x=>n.map(y=>products(x,y,n2Inv))));
const left0=mul(q(2),B0),project0=mul(q(2),left0);
const projectS=add(mul(q(2),leftNorm[at(1,0)]),mul(left0,piNorm[at(1,0)]));
const projectV=add(mul(q(2),leftNorm[at(0,1)]),mul(left0,piNorm[at(0,1)]));
const Benv=mul(q(2),add(one,mul(q(2),u)),add(one,pow(R,10)));
const lambda=scale(lambda0,reciprocal(sRoot,one)),dref=scale(lambda0,s2),G=plus(lambda,dref);
const G0=G[0],Gv=G[at(0,1)];
const priorM=(s,v)=>{
  const j=p.primary.intermediate.orders.findIndex(([x,y])=>x===s&&y===v);
  return P(p.primary.intermediate.Mnorm[j]);
};
const M0=add(priorM(0,0),mul(q(12),n2[0]));
const Ms=add(priorM(1,0),mul(q(12),n2[at(1,0)]));
const Mv=add(priorM(0,1),mul(q(12),n2[at(0,1)]));
const N0=leaf('mode-two-input-positive',p.input.positive.rawModeTwoValue),
  N1=leaf('mode-two-input-positive',p.input.positive.rawModeTwoOrdinaryC1);
const f0=mul(project0,N0),fs=add(mul(projectS,N0),mul(project0,N1)),
  fx=mul(project0,N1),fv=add(mul(projectV,N0),mul(project0,add(N1,mul(G0,N0))));
const LW=mul(length,stable),z0=mul(LW,f0),zs=mul(LW,add(fs,mul(Ms,z0))),zx=mul(LW,fx);
const zv=add(mul(M0,z0),f0),zvv=add(mul(Mv,z0),mul(M0,zv),fv),
  zsv=add(mul(Ms,z0),mul(M0,zs),fs),zxv=add(mul(M0,zx),fx);
const Bs=Bnorm[at(1,0)],Bv=Bnorm[at(0,1)],Bsv=Bnorm[at(1,1)],Bvv=mul(q(2),Bnorm[at(0,2)]);
const BPv=add(Bv,mul(Benv,G0)),BPsv=add(Bsv,mul(Bs,G0));
const BPvv=add(Bvv,mul(q(2),Bv,G0),mul(Benv,add(Gv,pow(G0,2))));
const t={
  value:mul(Benv,z0),slow:add(mul(Bs,z0),mul(Benv,zs)),xi:mul(Benv,zx),
  v:add(mul(BPv,z0),mul(Benv,zv)),
  vv:add(mul(BPvv,z0),mul(q(2),BPv,zv),mul(Benv,zvv)),
  slowV:add(mul(BPsv,z0),mul(Bs,zv),mul(BPv,zs),mul(Benv,zsv)),
  xiV:add(mul(BPv,zx),mul(Benv,zxv))
};

// Gauge is i*n cross (psi*t)/(2*k*|n|²). The curl reconstruction and
// pressure stay separate. Keep every exact product branch needed by
// the selected second mixed and pulse derivatives.
const sigma=m.partitionSeedSigma.map(BigInt),slope=mul(q(20),lengthInv);
const psiV=mul(q(2n*sigma[1]),slope),psiVV=mul(q(2n*(sigma[2]+sigma[1]*sigma[1])),pow(slope,2));
const psi=[one,zero,psiV,zero,mul(q(1,2),psiVV)];
const ARow=max(...n.map(x=>products(psi,x,n2Inv)[0]));
const AR=(s,v)=>max(...n.map(x=>products(psi,x,n2Inv)[at(s,v)]));
const AS=AR(1,0),AV=AR(0,1),ASV=AR(1,1),AVV=mul(q(2),AR(0,2));
// Two cross-product terms cancel the coefficient 1/2 of harmonic two.
const A={
  value:mul(ARow,t.value),slow:add(mul(AS,t.value),mul(ARow,t.slow)),
  xi:mul(ARow,t.xi),v:add(mul(AV,t.value),mul(ARow,t.v)),
  vv:add(mul(AVV,t.value),mul(q(2),AV,t.v),mul(ARow,t.vv)),
  slowV:add(mul(ASV,t.value),mul(AS,t.v),mul(AV,t.slow),mul(ARow,t.slowV)),
  xiV:add(mul(AV,t.xi),mul(ARow,t.xiV))
};
const K=[[unit(zero),scale(q(2),F),unit(zero)],[plus(scale(q(2),F),product(radius,FR)),unit(zero),unit(zero)],[GR,unit(zero),unit(zero)]];
const normalRow=K[0].map((_,j)=>plus(j===1?unit(zero):hr,...n.map((x,i)=>product(x,K[i][j]))));
const cPressure=product(psi,n2Inv);
const tr=normalRow.map(x=>product(cPressure,x)),gr=n.map(x=>product(cPressure,x));
const first={value:0,slow:at(1,0),v:at(0,1)};
const pressure={};
for(const [tag,j] of Object.entries(first)){
  const tTerm=tr.map(x=>j===0?mul(x[0],t.value):add(mul(x[0],t[tag]),mul(x[j],t.value)));
  const gTerm=gr.map(x=>j===0?mul(x[0],N0):add(mul(x[0],N1),mul(x[j],N0)));
  pressure[tag]=mul(q(1,2),add(...tTerm,...gTerm));
}
pressure.xi=mul(q(1,2),add(...tr.map(x=>mul(x[0],t.xi)),...gr.map(x=>mul(x[0],N1))));
const flatComplement={value:N0,slow:N1,xi:N1,v:add(N1,mul(psiV,N0))};
const flatCutoffDerivative={value:mul(psiV,t.value),slow:mul(psiV,t.slow),xi:mul(psiV,t.xi),v:add(mul(psiVV,t.value),mul(psiV,t.v))};
const result={schema:'MathScope.N7.ArchivedFirstForcedModeTwoSelectedOutputJets/1',pins,archivedGraphSHA256:hashes.forcedSHA256,archivedRegistrySHA256:regSHA,
  originalKernelSHA256:originalKernelSHA,sourceSystems:systemBindings,
  intermediate:{M0,Ms,Mv,project0,projectS,projectV,G0,Gv,z0,zs,zx,zv,zvv,zsv,zxv,
    Benv,Bs,Bv,Bsv,Bvv,BPv,BPsv,BPvv,psiV,psiVV,N0,N1,f0,fs,fx,fv},
  roots:{t,A,pressure,flatComplement,flatCutoffDerivative},nodes,graphSHA256:sha(JSON.stringify(nodes)),
  weights:{t:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)',
    AAndPressure:'epsilon^(3/2-kappa_s)*zeta*delta^(-144)*P(v)',
    complement:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)^2',
    derivative:'epsilon^(1-kappa_s)*zeta*delta^(-144)*P(v)'},
  scope:{archivedN1Only:true,allFirstOrdinaryDirections:true,purePulseSecond:true,mixedSlowPulseSecond:true,mixedXiPulseSecond:true,
    slowSlowOrPulseThird:false,physicalWholeKAttachment:false,finalJets:'0/67',release:'HOLD'}};
await writeFile(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS archived first Forced mode-two actual all first, selected second output jets, pressure C1, and principal cutoff C1.');
console.log(JSON.stringify({systems:systemBindings.length,nodes:nodes.length,graphSHA256:result.graphSHA256,roots:result.roots,fileSHA256:sha(await readFile(out))}));
