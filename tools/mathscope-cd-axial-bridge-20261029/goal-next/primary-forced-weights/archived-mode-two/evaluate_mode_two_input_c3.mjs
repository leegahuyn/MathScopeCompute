import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

assert.equal(process.argv.length,6,'Use GOAL_NEXT ARITHMETIC_RUNTIME WAVE_NUMERICAL OUT_JSON');
const [, ,goal,runtime,wavePath,out]=process.argv;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const files={
  wave:[wavePath,'dc58aa3deb6f3b9fba10eae0f9081f1d6af56d67e2dfc98ce698240da3f86b3e'],
  modeTwo:['first-forced-mode-two-c1/mode-two-weighted-c1.json','e2bf09b924c42fa444029ac6ef41cb1fc86094bb65130c522c30e19e457f6be4'],
  readback:['first-forced-mode-two-c1/mode-two-output-readback.json','1c948cead33b39bf54343e9f95a6563e2336ebe20fd951df70ea3220ef5c540c'],
  fixed:['whole-k-annular-initial/numerical/stage-zero-fixed-numerical.json','9740009e01d587310aae82dc2f2ace4cafa12a9f3f5654c2fbd48ae132e4533c'],
  threshold:['whole-k-selector-scales/historical-scale-arithmetic-result.json','af666a28520316043b00cacbf0cda14e624f419b857e6b3063ab6fdd6ae8afaf'],
};
const helper=resolve(goal,'whole-k-annular-initial/numerical/source_arithmetic.mjs');
assert.notEqual(helper,resolve(out));
assert.equal(sha(await readFile(helper)),'4dbfcdbd2958da7b892ede8a2a8f62b692bbf43a6b1d4926085c390d0125fb47');
const {load,sourceArithmetic}=await import(pathToFileURL(helper).href);
const {wave,modeTwo,readback,fixed,threshold}=Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name,[path,hash]])=>{
  const p=name==='wave'?resolve(path):resolve(goal,path);
  assert.notEqual(p,resolve(out));
  return [name,await load(p,hash)];
})));
assert.equal(modeTwo.source.cycleSHA256,wave.originalGraphSHA256);
assert.equal(fixed.sourceSHA256,wave.originalGraphSHA256);
assert.equal(modeTwo.source.checkedRawComponents,60);
assert.equal(readback.checkedArchivedPathComponents,60);
assert.equal(readback.inputPositiveGraphSHA256,modeTwo.positive.graphSHA256);
assert.equal(modeTwo.source.records.length,10);
assert.equal(modeTwo.source.sharedOriginalNodePrefix.count,3860185);
const axes=['R','Z','T','xi','v'],base='00000';
const split=key=>key?key.split('*'):[];
function put(table,atoms,r,i){
  const key=[...atoms].sort().join('*'),[real,imag]=table.get(key)??[0n,0n];
  if(real+r===0n&&imag+i===0n)table.delete(key);
  else table.set(key,[real+r,imag+i]);
}
const constant=(r,i=0n)=>new Map([['',[BigInt(r),BigInt(i)]]]);
const atom=key=>new Map([[key,[1n,0n]]]);
function add(...polynomials){
  const out=new Map();
  for(const polynomial of polynomials)
    for(const [key,[r,i]] of polynomial)put(out,split(key),r,i);
  return out;
}
function multiply(a,b){
  const out=new Map();
  for(const [x,[r,i]] of a)
    for(const [y,[s,j]] of b)put(out,[...split(x),...split(y)],r*s-i*j,r*j+i*s);
  return out;
}
const mul=(...polynomials)=>polynomials.reduce(multiply,constant(1));
const neg=polynomial=>mul(constant(-1),polynomial);
const sub=(a,b)=>add(a,neg(b));
const rename=(key,j)=>{
  const [name,order]=key.split('@');
  const counts=[...order].map(Number);
  counts[j]++;
  return atom(name+'@'+counts.join(''));
};
function derivativeAtom(key,j){
  if(/^[LJ][012]@/.test(key))return rename(key,j);
  if(/^a@/.test(key)&&j===0)return rename(key,j);
  if(/^iR[1-4]$/.test(key)&&j===0){
    const degree=Number(key.slice(2));
    return mul(constant(-degree),atom('iR'+(degree+1)));
  }
  return new Map();
}
function derivative(polynomial,j){
  const out=new Map();
  for(const [key,[r,i]] of polynomial){
    const factors=split(key);
    for(const [at,factor] of factors.entries()){
      const term=derivativeAtom(factor,j);
      const other=factors.filter((_,k)=>at!==k);
      for(const [key,[s,t]] of term)put(out,[...other,...split(key)],r*s-i*t,r*t+i*s);
    }
  }
  return out;
}
const [eps,a,ir,k]=['eps','a@'+base,'iR1','k'].map(atom),I=constant(0,1);
const U=[0,1,2].map(j=>add(atom('L'+j+'@'+base),mul(I,atom('J'+j+'@'+base))));
const rotation=[neg(U[1]),U[0],new Map()];
const Dr=x=>add(derivative(x,0),mul(a,derivative(x,3))),Dz=x=>mul(eps,derivative(x,1));
const noPhaseDiv=add(Dr(U[0]),Dz(U[2]),mul(ir,U[0]));
const phaseDiv=mul(I,k,add(...U.map((x,j)=>mul(atom('n'+j),x))));
const reduced=U.map((x,j)=>add(mul(U[0],Dr(x)),mul(U[2],Dz(x)),neg(mul(x,noPhaseDiv)),mul(U[1],ir,rotation[j])));
const raw=U.map((x,j)=>add(Dr(mul(x,U[0])),Dz(mul(x,U[2])),mul(x,U[0],ir),mul(U[1],ir,rotation[j]),mul(constant(2),x,phaseDiv)));
assert(raw.every((x,j)=>sub(sub(x,reduced[j]),mul(constant(2),U[j],add(noPhaseDiv,phaseDiv))).size===0));
assert(raw.every((x,j)=>sub(sub(x,reduced[j]),mul(constant(2),U[j],sub(noPhaseDiv,phaseDiv))).size>0));

const {N}=await sourceArithmetic(runtime,threshold.sourcePins,'coarse-upper');
const zero={rational:'0'},positive=upper=>N.fromClosed({lower:zero,upper});
const q=x=>N.point(String(x)),addN=(a,b)=>N.add(a,b),mulN=(...xs)=>xs.reduce((a,b)=>N.mul(a,b),q(1));
const hosted=id=>N.fromClosed(fixed.hostedOriginal[id]),R=hosted(216823);
const ellCap=addN(hosted(617432),q(17)),Rinv=mulN(q(2),R);
const aFast=mulN(q(4),N.pow(R,3),N.exp(mulN(q('1/100000'),hosted(9),ellCap,hosted(127))));
const aFactors=[1,1,2,6].map((factorial,j)=>mulN(aFast,q(4**j*factorial),N.pow(Rinv,j)));
const byIndex=new Map(wave.appliedBounds.rows.map(row=>[row.orders.join(''),row]));
assert.equal(byIndex.size,126);
assert.deepEqual(wave.appliedBounds.exponents,{real:50000,imaginary:99999,pressure:100000});
const atomCache=new Map([['eps',{bound:q(1),power:100000,pole:0,wave:false}]]);
function boundAtom(key){
  if(atomCache.has(key))return atomCache.get(key);
  let value;
  if(/^iR[1-4]$/.test(key))value={bound:N.pow(Rinv,Number(key.slice(2))),power:0,pole:0,wave:false};
  else if(/^a@[0-3]0000$/.test(key))value={bound:aFactors[Number(key[2])],power:-1,pole:0,wave:false};
  else{
    const match=/^([LJ])([012])@([0-4]{5})$/.exec(key);
    assert(match,key);
    const [,kind,component,index]=match;
    const part=kind==='L'?'real':'imaginary',row=byIndex.get(index);
    assert(row,key);
    const bound=wave.appliedBounds.upperEndpoints[row[part][Number(component)]];
    assert(bound,key);
    value={bound:positive(bound),power:wave.appliedBounds.exponents[part],pole:row.poles[part],wave:true};
  }
  atomCache.set(key,value);
  return value;
}
const monomialCache=new Map();
function termBound(key){
  if(monomialCache.has(key))return monomialCache.get(key);
  const factors=split(key).map(boundAtom);
  assert.equal(factors.filter(x=>x.wave).length,2,key);
  assert(factors.filter(x=>x.power===-1).length<=1,key);
  const value={bound:mulN(...factors.map(x=>x.bound)),power:factors.reduce((s,x)=>s+x.power,0),
    pole:factors.reduce((s,x)=>s+x.pole,0)};
  monomialCache.set(key,value);
  return value;
}
function output(polynomial,part){
  const terms=[...polynomial].filter(([,values])=>values[part]!==0n);
  const count=terms.reduce((sum,[,[r,i]])=>{
    const coefficient=part===0?r:i;
    return sum+(coefficient<0n?-coefficient:coefficient);
  },0n);
  const bounds=terms.map(([key])=>termBound(key));
  const upper=N.toClosed(mulN(q(count),N.max(bounds.map(x=>x.bound)))).upper;
  assert.equal(N.compareEndpoints(upper,zero),1);
  return {part:part===0?'real':'imaginary',terms:terms.length,epsilonPower:Math.min(...bounds.map(x=>x.power)),
    pole:Math.max(...bounds.map(x=>x.pole)),upper};
}
const rows=[];
function collect(orders,degree,axis,polynomials){
  rows.push({orders,degree,components:polynomials.map(row=>[output(row,0),output(row,1)])});
  if(degree===3)return;
  for(let j=axis;j<axes.length;j++){
    const next=[...orders];
    next[j]++;
    collect(next,degree+1,j,polynomials.map(row=>derivative(row,j)));
  }
}
collect([0,0,0,0,0],0,0,reduced);
assert.equal(rows.length,56);
assert.equal(new Set(rows.map(row=>row.orders.join(''))).size,56);
const summary=Array.from({length:4},(_,through)=>{
  const parts=rows.filter(row=>row.degree<=through).flatMap(row=>row.components);
  return {through,indices:parts.length/3,realPower:Math.min(...parts.map(pair=>pair[0].epsilonPower)),
    imaginaryPower:Math.min(...parts.map(pair=>pair[1].epsilonPower)),
    pole:Math.max(...parts.flat().map(x=>x.pole))};
});
assert.deepEqual(summary.map(row=>[row.indices,row.realPower,row.imaginaryPower]),[
  [1,99999,149998],[6,99999,149998],[21,99999,149998],[56,99999,149998]
]);
assert.deepEqual(summary.map(row=>row.pole),[72,96,120,144]);
const receipt={
  schema:'MathScope.ArchivedFirstForcedModeTwoInputC3/1',
  status:'CONDITIONAL_DIRECTED_UPPER_ENDPOINTS_FOR_ORIGINAL_ARCHIVED_FIRST_FORCED_MODE_TWO_INPUT_C3',
  inputPins:Object.fromEntries(Object.entries(files).map(([name,[,hash]])=>[name,hash])),
  source:modeTwo.source,ordinaryAxes:axes,rows,summary,epsilonPowerDenominator:100000,
  retainedEnvelope:'zeta delta_*^(-pole) P(v)^2',
  scope:'Original archived supported mode-two forcing input and its conjugate. Uses the prior exact native source proof, the same admitted fixed-label chart, complete curl divergence and original smooth joins. The common numerical operand slab is not a live N1 attachment to the strict whole-K interior. No zero-data inverse or mapped output asserted.',
  commonOperandDomain:wave.domain,arithmetic:N.report()
};
await writeFile(out,JSON.stringify(receipt)+'\n');
console.log(JSON.stringify({status:receipt.status,rows:rows.length,summary,monomials:monomialCache.size,SHA256:sha(await readFile(out))}));
