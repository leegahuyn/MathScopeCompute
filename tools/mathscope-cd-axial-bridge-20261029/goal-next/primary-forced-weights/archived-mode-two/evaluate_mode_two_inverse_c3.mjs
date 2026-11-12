import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length,7,'Use GOAL_NEXT ARITHMETIC_RUNTIME WAVE_PROGRAM MODE_TWO_C3_INPUT OUT_JSON');
const [, ,goal,runtime,wavePath,inputPath,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pins={
  wave:[wavePath,'e6cfd19055479fbcb43dddcd17ae05ddc3fb075eb911620f485dfb7d29c6fe70'],
  input:[inputPath,'8c54f654d6bf2751c6b17d00047ba53a9222beb9901d538d22c1f72e8c21c42a'],
  previous:['first-forced-mode-two-jets/mode-two-selected-jets.json','2c8678846733278b25357d6d15057d78db8072ca768f2f104bdae018cc2a0193'],
  readback:['first-forced-mode-two-jets/mode-two-selected-jets-readback.json','18d391572026be6bfe4c17adc69db1678003a8b5e6376e129b16aee75954dd15'],
  lower:['whole-k-annular-pressure-lower/lower-covariance-pressure.json','5582056d41cd5ddd57bf6f293c8ec09bb47d9a6bae77929f3ff4283afbb71328'],
  background:['whole-k-annular-wrz-norm/background-c8.json','5d972553e3d31ee8ef9de55019b672bfd344b4bd11bdb9a84dc7d1e9c506652e'],
  fullSlow:['primary-forced-weights/full-slow-norms/full-slow-norms.json','517662b18f4014644cd7539de42b82b74999374aaf34273163f39693f160bdb4'],
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  threshold:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
const helperHash='4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47';
assert.notEqual(helper,resolve(out));
assert.equal(sha(await readFile(helper)),helperHash);
const {load,sourceArithmetic}=await import(pathToFileURL(helper).href);
const {wave,input,previous,readback,lower,background,fullSlow,fixed,threshold}=Object.fromEntries(
  await Promise.all(Object.entries(pins).map(async ([name,[path,hash]])=>{
    const file=name==='wave'||name==='input'?resolve(path):resolve(goal,path);
    assert.notEqual(file,resolve(out));
    return [name,await load(file,hash)];
  })));
assert.equal(input.source.forcedSHA256,previous.archivedGraphSHA256);
assert.equal(input.source.registrySHA256,previous.archivedRegistrySHA256);
assert.equal(input.source.cycleSHA256,wave.source.graphSHA256);
assert.equal(lower.sourceSHA256,wave.source.graphSHA256);
assert.equal(fixed.sourceSHA256,wave.source.graphSHA256);
assert.equal(lower.nativeRegistrySHA256,wave.source.registrySHA256);
assert.equal(readback.receiptSHA256,pins.previous[1]);
assert.equal(readback.graphSHA256,previous.graphSHA256);
assert.equal(readback.systems,10);
assert.deepEqual(readback.actualRoots,previous.roots);
assert.deepEqual(previous.sourceSystems.map(x=>x.key).sort(),input.source.records.map(x=>x.key).sort());
assert.deepEqual(input.commonOperandDomain,fullSlow.domain);
assert.deepEqual(input.summary.map(row=>row.pole),[72,96,120,144]);

const graph=[...lower.nodes],waveIds=[];
const namespaces={'archived-original':'hosted-original','archived-background-c8':'background-c8'};
for(const [i,n] of wave.nodes.entries()){
  let current=n;
  if(n.op==='authenticated_source_norm_root'){
    const [ns,id]=n.args;
    if(ns==='archived-lower-positive'){
      assert.ok(Number.isSafeInteger(id)&&id>=0&&id<lower.nodes.length);
      waveIds.push(id);
      continue;
    }
    assert.ok(namespaces[ns]);
    current={op:n.op,args:[namespaces[ns],id]};
  }else if(n.op!=='rational'){
    const move=id=>{
      assert.ok(Number.isSafeInteger(id)&&id>=0&&id<i);
      return waveIds[id];
    };
    current={op:n.op,args:n.op==='integer_power'?[move(n.args[0]),n.args[1]]:n.args.map(move)};
  }
  waveIds.push(graph.length);
  graph.push(current);
}
const extensionStart=graph.length,intern=new Map();
function node(op,args){
  const key=JSON.stringify([op,args]);
  if(!intern.has(key)){intern.set(key,graph.length);graph.push({op,args});}
  return intern.get(key);
}
const q=(n,d=1)=>node('rational',[String(n),String(d)]),zero=q(0),one=q(1);
function add(...xs){
  const a=xs.filter(x=>x!==zero).sort((x,y)=>x-y);
  return a.length===0?zero:a.length===1?a[0]:node('add',a);
}
function mul(...xs){
  if(xs.includes(zero))return zero;
  const a=xs.filter(x=>x!==one).sort((x,y)=>x-y);
  return a.length===0?one:a.length===1?a[0]:node('multiply',a);
}
const inv=x=>x===one?one:node('inverse',[x]),sqrt=x=>x===one?one:node('sqrt_positive',[x]);
const power=(x,j)=>j===0?one:j===1?x:node('integer_power',[x,j]);
const max=(...xs)=>node('maximum',[...new Set(xs)].sort((a,b)=>a-b));
const leaf=(ns,id)=>node('authenticated_source_norm_root',[ns,id]);
const total=a=>a.reduce((x,y)=>x+y,0);
function indices(degree,axes){
  if(axes===0)return degree===0?[[]]:[];
  return Array.from({length:degree+1},(_,j)=>indices(degree-j,axes-1).map(row=>[j,...row])).flat();
}
const degree=3,orders=Array.from({length:degree+1},(_,j)=>indices(j,3)).flat();
assert.equal(orders.length,20);
const key=a=>a.join(','),byOrder=new Map(orders.map((a,i)=>[key(a),i]));
const at=(xs,s,l,v)=>xs[byOrder.get(key([s,l,v]))];
const jet=f=>orders.map(([s,l,v])=>f(s,l,v)),unit=x=>jet((s,l,v)=>s+l+v===0?x:zero);
const plus=(...xs)=>orders.map((_,i)=>add(...xs.map(x=>x[i])));
const allSplits=orders.map(([s,l,v])=>Array.from({length:s+1},(_,a)=>
  Array.from({length:l+1},(_,b)=>Array.from({length:v+1},(_,c)=>[
    byOrder.get(key([a,b,c])),byOrder.get(key([s-a,l-b,v-c]))
  ])).flat()).flat());
const prod=(a,b)=>allSplits.map(xs=>add(...xs.map(([i,j])=>mul(a[i],b[j]))));
const times=(...xs)=>xs.reduce(prod,unit(one)),scale=(x,a)=>a.map(y=>mul(x,y));
function recip(x,lo){
  const a=[inv(lo)];
  for(const pairs of allSplits.slice(1))a.push(mul(a[0],add(...pairs.slice(1).map(([i,j])=>mul(x[i],a[j])))));
  return a;
}
function root(x,lo){
  const a=[sqrt(x[0])],den=inv(mul(q(2),lo));
  for(const [j,pairs] of allSplits.slice(1).entries())
    a.push(mul(den,add(x[j+1],...pairs.slice(1,-1).map(([i,j])=>mul(a[i],a[j])))));
  return a;
}
const matrix=(A,B)=>A.map(row=>B[0].map((_,j)=>plus(...row.map((a,i)=>prod(a,B[i][j])))));
const matrixNorm=A=>orders.map((_,j)=>max(...A.map(row=>add(...row.map(x=>x[j])))));
const vectorNorm=A=>orders.map((_,j)=>max(...A.map(x=>x[j])));
const factor=[1,1,2,6,24],oldOrder=new Map(wave.normalizedOrder.map((a,i)=>[key(a),i]));
const wGet=(old,s,v)=>{
  const id=old[oldOrder.get(key([s,v]))];
  assert.ok(Number.isSafeInteger(id)&&Number.isSafeInteger(waveIds[id]));
  return waveIds[id];
};
const wJet=old=>jet((s,l,v)=>l===0?wGet(old,s,v):zero);
const W=lower.intermediate;
const R=leaf('hosted-original',216823),r0=leaf('hosted-original',300171),u=mul(q(2),inv(leaf('hosted-original',617289)));
const length=mul(q(12),r0,W.wholeKBandSUpper),LW=mul(length,W.stableW),lengthInv=inv(mul(q(2),r0));
const n=wave.roots.n.map(wJet),np=wave.roots.nPrime.map(wJet);
const n2=plus(...n.map(x=>prod(x,x))),n2Inv=recip(n2,power(W.normalLower,2));
const nt=root(plus(prod(n[1],n[1]),prod(n[2],n[2])),W.normalLower),ntInv=recip(nt,W.normalLower);
const tangent=[prod(n[1],ntInv),prod(n[2],ntInv)],perpendicular=[tangent[1],tangent[0]];
const sRef=jet((s,l,v)=>s+l===0?(v===0?mul(q(2),u):v===1?mul(u,lengthInv):zero):zero);
const c=scale(power(R,10),root(plus(unit(one),prod(sRef,sRef)),one));
const cinv=scale(q(1,2),recip(c,W.frozenCLower)),Z=unit(zero);
const Bleft=matrix([[unit(q(1,2)),cinv],[unit(q(1,2)),cinv]],[[unit(one),Z,Z],[Z,...perpendicular]]);
const projection=n.map((x,i)=>n.map((y,j)=>plus(unit(i===j?one:zero),times(x,y,n2Inv))));
const projectedNorm=matrixNorm(matrix(Bleft,projection));
const M=wave.roots.M.map(row=>row.map(wJet));
const M2=M.map((row,i)=>row.map((a,j)=>i===j?plus(a,scale(q(12),n2)):a));
const M2norm=matrixNorm(M2);
const Bnorm=matrixNorm(wave.roots.B.map(row=>row.map(wJet)));
const env=wJet(wave.roots.normalizedP);
const psi=wJet(wave.roots.psi);
const psiV=jet((s,l,v)=>s+l===0?mul(q(v+1),wGet(wave.roots.psi,0,v+1)):zero);
const complement=psi.map((x,i)=>i===0?one:x);
const nMax=vectorNorm(n);
const bg=(name,extra)=>jet((s,l,v)=>l+v===0?mul(q(2**(s+extra),factor[s]),leaf('background-c8',background.bounds[s+extra][name])):zero);
const [F,FR,GR]=[bg('F',0),bg('F',1),bg('G',1)];
const radius=jet((s,l,v)=>l+v===0?(s===0?mul(q(2),R):s===1?one:zero):zero);
const K=[[Z,scale(q(2),F),Z],[plus(scale(q(2),F),prod(radius,FR)),Z,Z],[GR,Z,Z]];
const pressureRow=K[0].map((_,j)=>plus(np[j],...n.map((a,i)=>prod(a,K[i][j]))));
const pressureMax=vectorNorm(pressureRow);

const modeLeaves={},byTriple=new Map();
for(const row of input.rows){
  const [r,z,t,l,v]=row.orders,s=r+z+t,k=key([s,l,v]);
  if(!byTriple.has(k))byTriple.set(k,[]);
  byTriple.get(k).push(row);
}
assert.equal(byTriple.size,20);
const modeInputs=[0,1].map(part=>jet((s,l,v)=>{
  const rows=byTriple.get(key([s,l,v]));
  assert.equal(rows.length,(s+1)*(s+2)/2);
  const items=rows.flatMap(row=>row.components.map((component,j)=>{
    const label=row.orders.join('')+'/'+j+'/'+part;
    assert(component[part].epsilonPower>=input.summary[0][part===0?'realPower':'imaginaryPower']);
    assert(component[part].pole<=input.summary[s+l+v].pole);
    modeLeaves[label]={lower:{rational:'0'},upper:component[part].upper};
    return leaf('archived-mode-two-c3',label);
  }));
  return mul(q(1,factor[s]*factor[l]*factor[v]),max(...items));
}));

const normalizedSource=modeInputs.map(g=>times(projectedNorm,env,g));
function duhamel(f){
  const z=[];
  for(const [i,[s,l,v]] of orders.entries()){
    const products=[];
    if(v===0){
      for(let a=1;a<=s;a++)products.push(mul(at(M2norm,a,0,0),at(z,s-a,l,0)));
      z.push(mul(LW,add(f[i],...products)));
      continue;
    }
    for(let a=0;a<=s;a++)for(let b=0;b<v;b++)
      products.push(mul(at(M2norm,a,0,b),at(z,s-a,l,v-1-b)));
    z.push(mul(q(1,v),add(at(f,s,l,v-1),...products)));
  }
  return z;
}
const z=normalizedSource.map(duhamel),t=z.map(x=>times(Bnorm,env,x));
const mappedGauge=t.map(x=>times(psi,nMax,n2Inv,x));
const pressure=t.map((x,j)=>scale(q(3,2),times(psi,n2Inv,
  plus(prod(pressureMax,x),prod(nMax,modeInputs[j])))));
const cutoffComplement=modeInputs.map(g=>prod(complement,g));
const cutoffDerivative=t.map(x=>prod(psiV,x));
const ordinary=(arr,s,l,v)=>mul(q(factor[s]*factor[l]*factor[v]),at(arr,s,l,v));
const compactRows=orders.map(([s,l,v])=>{
  const make=parts=>parts.map(a=>ordinary(a,s,l,v));
  return {orders:[s,l,v],pole:input.summary[s+l+v].pole,t:make(t),
    gauge:make([...mappedGauge].reverse()),pressure:make([...pressure].reverse()),
    cutoffComplement:make(cutoffComplement),cutoffDerivative:make(cutoffDerivative)};
});
const results=input.rows.map(({orders:a})=>{
  const [r,z,t,l,v]=a;
  const {orders:unused,...row}=compactRows[byOrder.get(key([r+z+t,l,v]))];
  return {orders:a,...row};
});
const resultRoots=[...new Set(results.flatMap(({t,gauge,pressure,cutoffComplement,cutoffDerivative})=>
  [...t,...gauge,...pressure,...cutoffComplement,...cutoffDerivative]))].sort((a,b)=>a-b);

const external={
  'hosted-original':fixed.hostedOriginal,
  'fixed-radial':fixed.fixedRadial,
  'background-c8':Object.fromEntries(fullSlow.backgroundC8.flatMap(row=>
    ['F','G'].map(name=>[row.originalDirectionalRoots[name],row[name]]))),
  'target-c7':Object.fromEntries(fullSlow.weightedTargetC7.flatMap(row=>
    row.originalDirectionalRoots.map((id,j)=>[id,row.component[j]]))),
  'archived-mode-two-c3':modeLeaves
};
const {N,tracedArithmeticEvaluator}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const parameters=new Map(),visited=new Set();
function visit(id){
  if(visited.has(id))return;
  visited.add(id);
  const {op,args}=graph[id];
  if(op==='authenticated_source_norm_root'){
    const [ns,root]=args,k=args.join('/');
    if(parameters.has(k))return;
    let interval=external[ns]?.[root];
    assert.ok(interval,k);
    if(k==='hosted-original/300170'){
      assert.equal(interval.lower.rational,String(1n<<128n));
      interval={lower:{exp:{rational:'64'}},upper:interval.upper};
    }
    parameters.set(k,N.fromClosed(interval));
  }else if(op==='integer_power')visit(args[0]);
  else if(op!=='rational')args.forEach(visit);
}
resultRoots.forEach(visit);
const nodes=[...visited].sort((a,b)=>a-b).map(id=>{
  const n=graph[id];
  return {id,node:n.op==='authenticated_source_norm_root'?{op:'source_parameter',args:[n.args.join('/')]}:n};
});
const interpreter=tracedArithmeticEvaluator({nodes,nonArithmeticBoundaries:[]},N,{parameters});
const numerical=Object.fromEntries(resultRoots.map(id=>{
  let endpoint;
  try{endpoint=N.toClosed(interpreter.value(id)).upper;}
  catch(error){throw new Error(`Mode-two output #${id} failed: ${error.code??error.name}: ${error.message}`,{cause:error});}
  assert.equal(N.compareEndpoints(endpoint,{rational:'0'}),1,String(id));
  return [id,endpoint];
}));
const trace=interpreter.report();
assert.equal(trace.visitedNodes,visited.size);
assert.equal(trace.sourceParametersNumericallyConsumed.length,parameters.size);
const receipt={
  schema:'MathScope.ArchivedFirstForcedModeTwoInverseC3/1',
  status:'CONDITIONAL_DIRECTED_UPPER_ENDPOINTS_FOR_ORIGINAL_ARCHIVED_MODE_TWO_INVERSE_C3',
  inputPins:Object.fromEntries(Object.entries(pins).map(([name,[,hash]])=>[name,hash])),
  source:{forcedSHA256:input.source.forcedSHA256,cycleSHA256:input.source.cycleSHA256,
    registrySHA256:input.source.registrySHA256,systems:previous.sourceSystems},
  arithmetic:N.report(),trace,
  positive:{extensionStart,extension:graph.slice(extensionStart),graphSHA256:sha(JSON.stringify(graph)),
    normalizedOrders:orders,roots:{n2Inv,Bleft,projection,projectedNorm,M2norm,Bnorm,env,psi,psiV,pressureMax,modeInputs,normalizedSource,z,t,
      mappedGauge,pressure,cutoffComplement,cutoffDerivative,LW}},
  ordinaryAxes:['R','Z','T','xi','v'],ordinaryRows:results,upperEndpoints:numerical,
  weights:{
    denominator:100000,poles:input.summary.map(row=>row.pole),
    tAndCutoffDerivative:{epsilon:[99999,149998],retainedP:1},
    cutoffComplement:{epsilon:[99999,149998],retainedP:2},
    gaugeAndPressure:{epsilon:[199998,149999],retainedP:1},
    common:'Each output keeps zeta delta_*^(-pole); real/imaginary powers are listed in that order.'
  },
  scope:'Same archived N1 fixed-label admissible paths and source stability, positive norm, cutoff and smooth zero-join assumptions. Phase-free mapped coefficient jets only. The numerical operand slab supplies no newer live-family or active whole-K attachment.'
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,rows:results.length,roots:resultRoots.length,
  extension:graph.length-extensionStart,visited:visited.size,leaves:parameters.size,SHA256:sha(await readFile(out))}));
