import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {higherFTCUpperMath} from './higher_ftc_upper_math.mjs';

const [repo,tree,output,prefixOutput,allOutput]=process.argv.slice(2).map(s=>resolve(s));
const revision='f8cb4034e86d7b669d52a6f2248aebba156b51b5';
const m2='research-ide/mathscope-m2/navier/';
const pins={};
function pin(file){
  const name=relative(tree,file).replaceAll('\\','/');
  assert(!name.startsWith('..'));
  if(pins[name])return;
  const bytes=readFileSync(file);
  const original=execFileSync('git',['-c','core.longpaths=true','-C',repo,'show',`${revision}:${name}`],{maxBuffer:20*1024*1024});
  assert.deepEqual(bytes,original,name);
  pins[name]=createHash('sha256').update(bytes).digest('hex');
  for(const [,dep] of bytes.toString('utf8').matchAll(/\b(?:from\s+|import\s*)['"](\.[^'"]+)['"]/g))pin(resolve(dirname(file),dep));
}
const requested=['actual-residual-order-induction-source.mjs','actual-residual-order-induction-norms.mjs',
  'actual-common-selection-arithmetic-trace.mjs','actual-residual-order-induction-kernels.mjs'];
const files=requested.map(name=>join(tree,m2,name));
files.forEach(pin);
const [{prepareActualOrderInduction},{attachActualInductionNorms,assertActualInductionNorms,actualNormCalculus},
  {traceExactArithmeticDependencies},{sourceNormalizedCutoffWeights}]=await Promise.all(files.map(file=>import(pathToFileURL(file).href)));

const prepared=prepareActualOrderInduction({order:3,maxNodes:1500000});
const {G,records,bootstrap}=prepared;
console.log('original order-3 tuples',G.nodes.length);
if(prefixOutput){
  const hash=createHash('sha256');
  for(const node of G.nodes)hash.update(JSON.stringify(node)+'\n');
  const receipt={sourceCommit:revision,nodeCount:G.nodes.length,nodePrefixSHA256:hash.digest('hex'),
    registry:G.captureFunctionDefinitions(),sourceCoefficientRoots:records.slice(1).map(r=>r.global.Pi),
    originalEndpoints:{Xplus:bootstrap.orderOne.Xplus,Xminus:bootstrap.orderOne.Xminus,Xb:bootstrap.orderOne.Xb}};
  writeFileSync(prefixOutput,JSON.stringify(receipt)+'\n');
}
const norms=attachActualInductionNorms(prepared,{throughOrder:3,derivativeOrder:8});
assert(assertActualInductionNorms(norms));
assert(Object.values(norms.checks).every(Boolean));
console.log('original n<=3,m<=8 source-bound upper jet operands',G.nodes.length);
const q=(n,d=1)=>G.q(n,d),Xa=G.parameter('Xa'),Lambda=G.parameter('Lambda'),h=G.parameter('h');
const fact=n=>Array.from({length:n},(_,i)=>BigInt(i+1)).reduce((a,b)=>a*b,1n);
const calculus=actualNormCalculus(G),{fn,mul}=calculus;
const profiles=records.slice(1).map((rec,index)=>{
  const n=rec.order,row=norms.normalized[index],aux=rec.norm.auxiliary;
  assert.deepEqual(rec.coreAgreement.domain,[G.zero,Xa]);
  for(const name of ['F','U','Pi'])assert.equal(row.actualSourceRoots[name],rec.global[name]);
  const get=(field,r,k)=>{
    const j=row.jets[field].find(t=>t.radialOrder===r&&t.etaOrder===k);
    assert(j,`missing n=${n} ${field} (${r},${k})`);
    return j.upper;
  };
  const Xlo=row.domain.X[0];
  const invR=fn((r,k)=>k?G.zero:G.div(q(fact(r)),G.mul(G.sqrt(G.mul(q(2),Xlo)),G.pow(Xlo,r))));
  const annularF=mul(invR,fn((r,k)=>get('E',r,k)));
  const core=(r,k)=>G.mul(q(fact(r)*fact(k)),G.pow(Lambda,r),G.pow(G.div(q(2),aux.strip),k),aux.solutionNorm);
  const whole=field=>fn((r,k)=>G.maximum(core(r,k),field==='F'?annularF.get(r,k):get(field,r,k)));
  return {n,F:whole('F'),U:whole('U'),Pi:whole('Pi'),sourceRoots:row.actualSourceRoots};
});
const {Xplus,Xminus,Xb}=bootstrap.orderOne;
const roots={};
const pressure=[];
for(const row of profiles.slice(1)){
  const n=row.n,weights=sourceNormalizedCutoffWeights({order:n,derivativeOrder:n});
  assert(weights.pass);
  const W=weights.weights.map(w=>G.add(...w.polynomialInSourceH.map((c,k)=>G.mul(q(BigInt(c)),G.pow(h,k)))));
  const original=records[n].global.Pi;
  const table=[];
  for(let r=0;r<=n;r++)for(let e=0;r+e<=n;e++){
    const volumes=[G.one,Xplus,q(2),G.mul(q(2),Xplus)];
    const faces=volumes.map((volume,mask)=>G.mul(volume,G.add(G.one,row.Pi.get(r+(mask&1),e+(mask>>1)))));
    const upperFTC=G.add(...faces);
    const upperTerms=W.slice(0,n-r-e+1).map(w=>G.mul(w,upperFTC));
    table.push({r,e,faces,upperFTC,upperTerms});
  }
  const upper=G.maximum(G.one,...table.flatMap(x=>x.upperTerms));
  const requiredLog=G.div(G.add(G.mul(q(n),G.log(q(2))),G.log(upper)),G.mul(q(n),h));
  roots[`normalizedPressureN${n}`]=requiredLog;
  pressure.push({n,original,weights:W,table,upper,requiredLog});
}
for(const {n,F,U,Pi} of profiles)for(let r=0;r<=8;r++)for(let e=0;r+e<=8;e++)for(const [field,source] of Object.entries({F,U,Pi}))
  roots[`n${n}_${field}_${r}_${e}`]=source.get(r,e);
for(const name of ['U','FActive'])roots[`leading_${name}`]=norms.leadingNormalized[name][0].upper;
const trace=traceExactArithmeticDependencies(G,roots);
assert(trace.nonArithmeticBoundaries.every(b=>b.node.op==='definite_integral'&&[239,257,275].includes(b.id)));
const result={schema:'MathScope.N7.HigherFTCOriginalNormOperands/1',sourceCommit:revision,sourcePins:pins,
  sourceProfile:prepared.program.parameterExpressionSHA256,pressure,sourceCoefficientRoots:profiles.map(row=>row.sourceRoots),
  originalEndpoints:{Xplus,Xminus,Xb},leadingRequest:[norms.leading.radialOrder,norms.leading.etaOrder],
  originalDefinitions:G.source.parametersExactExpressions,trace,
  scope:'Proved analytic source upper operands and normalized pressure face recipe. Independently bind the hosted original FTC roots and compare arithmetic thresholds.'};
const bytes=JSON.stringify(result)+'\n';
writeFileSync(output,bytes);
console.log('source arithmetic packet',trace.nodeCount,createHash('sha256').update(bytes).digest('hex'));
if(allOutput){
  const moreFiles=['actual-velocity-all-order-tail.mjs','actual-common-first-selector-ftc-upper-bounds-kernel.mjs'].map(name=>join(tree,m2,name));
  moreFiles.forEach(pin);
  const [{physicalPositiveJetCalculus},{firstSelectorCartesianRadialBound}]=await Promise.all(moreFiles.map(file=>import(pathToFileURL(file).href)));
  const additional=higherFTCUpperMath(G,{profiles,leading:{U:roots.leading_U,FActive:roots.leading_FActive},Xminus,Xplus,Xb,h,t1:G.parameter('t1'),
    normCalculus:actualNormCalculus,physicalCalculus:physicalPositiveJetCalculus,cartesianRadial:firstSelectorCartesianRadialBound,
    weightsAt:sourceNormalizedCutoffWeights});
  const allRoots={...Object.fromEntries(pressure.map(x=>[`normalizedPressureN${x.n}`,x.requiredLog])),
    ...Object.fromEntries(additional.rows.map(x=>[`${x.kind}N${x.n}`,x.requiredLog]))};
  const allTrace=traceExactArithmeticDependencies(G,allRoots);
  assert(allTrace.nonArithmeticBoundaries.every(b=>b.node.op==='definite_integral'&&[239,257,275].includes(b.id)));
  const all={...result,schema:'MathScope.N7.AllHigherFTCOriginalUpperOperands/1',additional,trace:allTrace};
  const allBytes=JSON.stringify(all)+'\n';
  writeFileSync(allOutput,allBytes);
  console.log('all ten arithmetic upper operands',allTrace.nodeCount,createHash('sha256').update(allBytes).digest('hex'));
}
